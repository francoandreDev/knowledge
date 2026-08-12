---
title: "L2 — The write path, and where the durability gap actually is"
---

## From your program to a physically durable byte

```mermaid
flowchart LR
    App["Your program\ncalls write()"] --> PageCache["OS page cache\n(RAM — fast, volatile)"]
    PageCache -- "eventually, or on fsync()" --> DiskBuffer["Disk's own write buffer\n(volatile, on the drive)"]
    DiskBuffer -- "flushed" --> Platter["Physically durable\n(non-volatile)"]
```

A normal `write()` call only guarantees the data reached the **OS page cache** — a fast, in-RAM buffer the kernel maintains specifically so writes don't block on slow physical disk I/O. That's a real, useful optimization, and it's also exactly the gap: page cache is RAM, so it's just as volatile as any other RAM. A crash after `write()` returns but before the OS actually flushes that page to the disk loses the data, even though the program's `write()` call succeeded and returned no error.

## Where `fsync` fits

```python
function save_important_data(file, data):
    file.write(data)     # data is now in the OS page cache — fast, but NOT yet durable
    file.fsync()         # blocks until the data is physically confirmed durable on disk
    return "safe to tell the caller this is saved"
```

`fsync` is the boundary: everything before it is only "probably fine" (survives normal operation, doesn't survive a crash); everything the call successfully returns from is durable, specifically because the OS won't return from `fsync` until the disk itself confirms the write. This is also why `fsync` is measurably slower than a plain `write` — it's not free, it's the actual cost of a genuine durability guarantee, and skipping it is a common way systems appear to work correctly until the first real crash exposes the gap.

## The crash-timing table

| When the crash happens                              | Is the data recoverable after reboot?                                |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| Before `write()` is called                          | No — the data was never written anywhere durable                     |
| After `write()`, before `fsync()`                   | No — still only in the volatile OS page cache                        |
| After `fsync()` returns successfully                | Yes — physically confirmed durable before the crash                  |
| Mid-way through a multi-byte write, no fsync at all | Undefined — possibly a torn/partial write, worse than "just missing" |

The last row is why real systems don't just add `fsync` and call it solved — a crash mid-write can leave a file in a **partially written**, internally inconsistent state, which is a distinct and often worse failure than simply losing the whole update. This is exactly the problem write-ahead logging exists to solve.

## Write-ahead logging: how databases make "committed" actually mean something

```python
function commit_transaction(db, transaction):
    log_entry = serialize(transaction)
    append_to_log(log_entry)   # sequential, append-only — cheap to fsync
    fsync(log_file)            # durability boundary: this IS the commit point
    acknowledge_commit_to_client()
    # The actual data-file update can happen later, asynchronously —
    # if a crash happens before that, the log is replayed on restart
    # to reconstruct the change, because the log itself already survived.
    apply_to_data_files(transaction)  # can be deferred safely
```

The trick: instead of making every committed transaction fsync a potentially large, scattered data-file write (slow), the database fsyncs a small, sequential log entry (fast) and treats _that_ as the actual durability boundary — the promise made to the client ("your transaction is committed") is backed by the log surviving a crash, not by the full data file being fully updated yet. This is the concrete mechanism behind "the database says it saved it" being a trustworthy claim rather than an optimistic one.
