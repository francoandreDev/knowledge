---
title: "L1 — What actually happens when you run a program?"
---

- A program on disk is just bytes in a file — nothing happens until the OS turns it into a **process**: a running instance with its own memory, its own view of the machine, and OS-tracked state.
- A process never touches hardware directly. Every interaction with the outside world — reading a file, allocating memory, sending a packet — goes through the OS via a **system call**, crossing from **user mode** to **kernel mode** and back.
- Each process gets its own **virtual address space**, laid out in regions:
  - **text** — the program's compiled code (read-only)
  - **data/bss** — global and static variables
  - **heap** — dynamic allocations (`malloc`, `new`, objects), grows upward
  - **stack** — function call frames and local variables, grows downward
- **Virtual memory** means every process believes it owns the _entire_ address space. The CPU's MMU and the OS's page tables translate virtual addresses to real physical RAM — this translation layer is exactly what makes process isolation possible: one process's pointers simply have no valid mapping into another's memory.
- What looks like many processes running "at once" on a machine with fewer CPU cores than processes is the OS **scheduler** rapidly **context-switching** between them, giving each a slice of CPU time.
- A **segmentation fault** is the OS refusing an access to a virtual address that has no valid mapping — not a hardware failure, a permissions decision.
- Key terms: process, PID, virtual address space, page table, MMU, text/data/heap/stack segments, system call, context switch, kernel mode/user mode, segfault.
