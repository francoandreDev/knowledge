---
title: "L3 — What actually happens when you run a program?"
---

L1 and L2 covered the shape of a process and the fork+exec launch sequence conceptually. This level proves each concept by actually observing it — every example here was run and its real output captured, not hand-waved.

## Proving process isolation: separate PIDs

Every process gets a distinct PID and its own address space, even when it's running code spawned by another process:

```js
// pids.mjs
import { spawn } from "node:child_process";

console.log("parent pid:", process.pid);

const child = spawn("node", ["-e", "console.log('child pid:', process.pid)"]);
child.stdout.on("data", (d) => process.stdout.write(d));
child.on("exit", (code) => console.log("child exited with", code));
```

Running it with `bun run pids.mjs`:

```
parent pid: 61241
child pid: 61278
child exited with 0
```

Two different PIDs, two separate address spaces, even though the child's code came from a string literally embedded in the parent's source. `spawn()` here is Node/Bun's wrapper around the same fork+exec mechanism from L2 — the child doesn't share the parent's heap or stack; it gets its own, freshly laid out by the kernel.

## Proving the stack exists: overflowing it on purpose

L2's memory diagram claimed the stack grows with every function call and has a real, finite size. Unbounded recursion proves it:

```js
// stack.mjs
function recurse(depth) {
  return 1 + recurse(depth + 1);
}

try {
  recurse(0);
} catch (err) {
  console.log("Crashed:", err.constructor.name, "-", err.message);
}
```

```
Crashed: RangeError - Maximum call stack size exceeded.
```

Every call to `recurse` pushes a new stack frame (the return address, `depth`, and any other locals) without ever popping one, since each call happens before the previous one returns. The runtime doesn't let this grow forever — it tracks the stack's size and throws once it hits a limit, rather than actually letting the process's stack region collide with the heap or run off the end of its allocated space. This is a controlled failure specifically so a runaway recursion produces a catchable error instead of a raw segfault.

## Proving the heap grows: watching it happen

```js
// heap.mjs
function mb(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + "MB";
}

console.log("before:", mb(process.memoryUsage().heapUsed));

const bigArray = new Array(5_000_000).fill(0).map((_, i) => ({ i, sq: i * i }));

console.log("after: ", mb(process.memoryUsage().heapUsed));
console.log("kept alive so it isn't GC'd:", bigArray.length);
```

```
before: 0.2MB
after:  120.9MB
kept alive so it isn't GC'd: 5000000
```

`bigArray` isn't a fixed-size stack local — it's 5 million heap-allocated objects, referenced through a variable that itself lives on the stack (or in V8's equivalent). The `.map()` callback's closure, the array's backing storage, and every `{ i, sq }` object it creates all come from the heap, which is exactly why `heapUsed` jumps by over 100MB: this is dynamic allocation happening in real time, not a simulation of it.

## Proving the memory regions are real: reading them from the kernel

On Linux (including under WSL), `/proc/self/maps` is the kernel's own record of a process's virtual memory regions — not a diagram, the actual page table's contents as text:

```js
// maps.mjs
import { readFileSync } from "node:fs";

const maps = readFileSync("/proc/self/maps", "utf8");
const lines = maps
  .split("\n")
  .filter((l) => l.includes("[heap]") || l.includes("[stack]"));
for (const line of lines) console.log(line);
```

```
324d8000-324f9000 rw-p 00000000 00:00 0                                  [heap]
7fffec4aa000-7fffec4fd000 rw-p 00000000 00:00 0                          [stack]
```

Two address ranges, each labeled by the kernel with exactly the region name from L2's diagram, each with permissions `rw-` (readable, writable, not executable — code shouldn't live in either of these regions) and `p` (private — copy-on-write, not shared with another process). The heap's address (`0x324d8000`) is nowhere near the stack's (`0x7fffec4aa000`) — they really are two separate regions with a large gap between them, exactly as sketched.

## Failure modes and what they actually mean

**Stack overflow from recursion, not from a "bug" in the traditional sense.** The `stack.mjs` example above isn't a mistake in the code's logic — `recurse` is correctly implemented for what it does. The failure is architectural: any recursive function without a base case (or with a base case that's unreachable for some input) will eventually exhaust the stack, and the depth at which that happens depends on how much each frame costs, not on the code being "wrong."

**A real segfault vs. a caught `RangeError`.** The JS runtime catches its own stack limit before the OS has to. A lower-level language without that guard (calling into a C library, for instance) can genuinely walk off the end of the stack's mapped region — at which point the _kernel_, not the runtime, is what stops it, via a segmentation fault, because the next page past the stack has no valid mapping (see L2's note on why `NULL` derefs fault).

**Memory that "leaks" is memory the heap never releases.** `bigArray` in the heap example stays at 120MB for as long as something still references it. If nothing ever drops that reference (a global, a still-running closure, an event listener that's never removed), the garbage collector has no basis to reclaim it — from the OS's point of view, that's a process legitimately using its allocated pages; "leak" is a claim about the _program's_ logic (it doesn't need this memory anymore) that the OS and the GC have no way to verify on their own.

**Not every process actually needs a large heap or stack.** A process that never recurses deeply and never allocates dynamically can run fine with a tiny fraction of the address space actually backed by real memory — virtual address space is nearly free to reserve; only the pages a process actually touches get backed by physical RAM (this is why `/proc/self/maps` shows address _ranges_, not memory that's necessarily all resident).
