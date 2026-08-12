---
title: "L3 — A real fsync call, and a minimal write-ahead log that actually works"
---

## Proving the page-cache gap with real code

This is real, runnable Node.js — `fs.writeSync` without `fsync` versus with it, showing exactly where the extra call sits in the code:

```js
// durable-write.mjs
import fs from "node:fs";

function writeWithoutFsync(path, data) {
  const fd = fs.openSync(path, "w");
  fs.writeSync(fd, data);
  fs.closeSync(fd);
  // Returns here having only guaranteed the OS page cache has the data.
  // A crash in the next instant can still lose it, even though this
  // function returned successfully with no error.
}

function writeDurably(path, data) {
  const fd = fs.openSync(path, "w");
  fs.writeSync(fd, data);
  fs.fsyncSync(fd); // blocks until the OS confirms the disk has it
  fs.closeSync(fd);
  // Only NOW is it safe to tell a caller "this is saved" in the sense
  // of surviving a crash — everything before this line was optimistic.
}

writeDurably("important.txt", "balance: 500");
console.log("Durably saved — this claim is now actually true.");
```

There's no way to _demonstrate_ the crash-loses-it case in a script (that requires an actual power loss or `kill -9` mid-write, not something safe to script) — but the code difference is the entire point: `writeWithoutFsync` and `writeDurably` differ by exactly one line, and that line is the entire durability guarantee. Everything else about the two functions is identical.

## A minimal, real write-ahead log

This implements the actual mechanism from L2 — append a log entry, fsync it, then apply it — small enough to read end to end, but doing the real thing, not a toy simplification of it:

```js
// wal.mjs — a minimal write-ahead log: durable commit via a small,
// sequential, fsynced append, with the real data file updated after.
import fs from "node:fs";

class WriteAheadLog {
  constructor(logPath, dataPath) {
    this.logPath = logPath;
    this.dataPath = dataPath;
    this.state = this.#replayLog(); // recover from any prior crash first
  }

  commit(key, value) {
    const entry = JSON.stringify({ key, value }) + "\n";
    const fd = fs.openSync(this.logPath, "a");
    fs.writeSync(fd, entry);
    fs.fsyncSync(fd); // THIS is the actual commit point
    fs.closeSync(fd);

    // Only after the log is durable do we touch the (larger, slower)
    // data file — if we crash here, replay on next startup fixes it.
    this.state[key] = value;
    fs.writeFileSync(this.dataPath, JSON.stringify(this.state));
    return { committed: true, key, value };
  }

  #replayLog() {
    if (!fs.existsSync(this.logPath)) return {};
    const lines = fs
      .readFileSync(this.logPath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean);
    const state = {};
    for (const line of lines) {
      const { key, value } = JSON.parse(line);
      state[key] = value; // replaying every committed entry reconstructs state
    }
    return state;
  }
}

const wal = new WriteAheadLog("wal.log", "data.json");
wal.commit("balance", 500);
console.log(
  "Committed — durable the instant fsync returned, not when the data file finished writing.",
);
```

If the process crashes between the `fsync` and the `writeFileSync` on the data file, the log already has the entry — `#replayLog()` reconstructs `{ balance: 500 }` on the next startup even though `data.json` never got updated before the crash. The log, not the data file, is what actually backs the durability promise.

## Failure modes

- **Trusting a successful `write()` as if it were durable.** The single most common version of this bug — code that writes, returns "success," and never calls `fsync` (or an equivalent) looks completely correct under normal operation and loses data specifically under the one condition (a crash) that durability exists to protect against.
- **Calling `fsync` on the wrong file descriptor, or too late.** `fsync` only guarantees durability for writes issued _before_ it, on the _same_ file descriptor — fsyncing after acknowledging a commit to a caller, or fsyncing a different file than the one actually holding the critical data, produces a false sense of safety.
- **Assuming a database "handles this" without checking its actual durability setting.** Many databases offer a _faster, less durable_ mode (batching fsyncs, or skipping them) as an explicit performance trade-off — assuming a database is always fully durable by default, without checking its configuration, is a common way "the database lost data after a power outage" surprises a team that never opted into the faster/riskier mode on purpose.
- **Forgetting that a directory entry itself may need syncing.** Creating a _new_ file durably can require fsyncing the containing directory too, not just the file — on some filesystems, a crash right after creating a new file can lose the directory entry pointing to it, even if the file's own contents were fsynced correctly. This is a real, frequently-missed edge case in low-level persistence code.
