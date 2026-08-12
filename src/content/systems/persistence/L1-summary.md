---
title: 'L1 — Why does my program still "remember" data after a crash?'
---

- **RAM is volatile** — its contents depend on continuous power; the instant power is lost (a crash, a reboot, an unplugged machine), everything in it is gone. **Disk (SSD/HDD) is non-volatile** — it retains its contents with no power at all, which is the entire reason it's used for anything meant to survive a crash.
- A program's in-memory data structures (a variable, an in-memory cache, an unflushed buffer) live in RAM and vanish on crash. A program's _persisted_ data — anything explicitly written to disk (a file, a database's data files) — survives, because disk doesn't depend on the process or the power staying on.
- "Writing to disk" is not instantaneous or atomic by default: the OS and disk hardware both buffer writes for performance, meaning a `write()` call returning successfully doesn't guarantee the data is physically on disk yet — it might still be sitting in a buffer that a crash would lose.
- **`fsync`** (and equivalents) is the explicit instruction "don't return until this data is actually durable on disk, not just handed to a buffer" — it's slower than a normal write specifically because it waits for that guarantee, and skipping it is a common, subtle source of "the database says it saved my data, but it's gone after a crash."
- **A crash between write and fsync is exactly the gap where "the program remembered" and "the program forgot" get decided** — this unit is about understanding that gap precisely, not treating persistence as an all-or-nothing property.
- Databases build strong durability guarantees (the "D" in ACID) on top of this exact mechanism — a write-ahead log fsynced before acknowledging a transaction as committed is the concrete technique that makes "the database said it saved it" actually trustworthy.
- The practical question this unit answers: when your program says "saved," what specifically has to be true on disk, right now, for that claim to survive the machine losing power in the next instant?
