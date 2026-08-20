---
title: "L2 — The four main causes of flakiness, and why CI surfaces them"
---

## The four things a test's outcome can secretly depend on

**If a test's logic is correct, what else could make it fail
unpredictably?** Anything the test doesn't fully control but its
outcome quietly depends on:

| Cause                 | What it looks like                                                                        | Why it's non-deterministic                                                              |
| --------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Shared state leakage  | Two tests read/write the same in-memory store, file, or database row without resetting it | Whichever test happens to run first changes what the next one starts with               |
| Real time             | A test uses the actual system clock (`Date.now()`, `setTimeout`) instead of a fixed one   | Execution speed varies between machines and runs, so a hardcoded delay isn't reliable   |
| Real randomness       | A test relies on `Math.random()` or a real UUID generator without a fixed seed            | The exact value differs every run, so an assertion tied to a specific value is a gamble |
| Unresolved async work | A test asserts on the result of a promise/callback before it has actually resolved        | The assertion's timing depends on how fast the event loop happens to get to it          |

**Is this table saying flaky tests are always caused by bad luck?**
No — every one of these has a deterministic fix (reset state, inject
a fake clock, seed the randomness, actually await the async work).
Flakiness isn't inherent to testing async or stateful code — it's a
sign that one of these four dependencies was left uncontrolled.

## Why CI surfaces flakiness that local runs hide

**If the same shared-state bug exists locally too, why does it almost
only show up in CI?**

```mermaid
flowchart TD
    A["Same 40 tests, same code"] --> B["Local: same dev machine,\nsame order, every time"]
    A --> C["CI: parallel workers,\nrandomized order, variable load"]
    B --> D["Shared-state bug never\ntriggers — order never changes"]
    C --> E["Shared-state bug triggers\nwhenever order differs"]
```

A local run on one machine tends to execute tests in the same fixed
order every single time — if that order happens to never expose the
shared-state dependency, the bug is invisible locally no matter how
many times it's run. CI frequently shuffles test order, runs tests
across multiple parallel workers, and experiences more variable
timing (shared build machines under load) — all of which increase the
chance that whatever order-dependency or timing-dependency exists
actually gets triggered.

**Does this mean CI is "flakier" than local, as if CI itself is the
problem?** No — CI isn't introducing new bugs, it's exposing bugs that
were always there but never had the right conditions to surface
locally. Treating "it passes locally" as proof of correctness ignores
that local runs are a much narrower sample of possible execution
conditions than CI actually exercises.

## Failure modes at this level

- **Re-running a failing test until it passes, then moving on.**
  This treats the symptom, not the cause — the underlying
  non-determinism is still there and will trigger again.
- **Assuming a flaky test is "probably fine" because it usually
  passes.** A test that fails 1 in 20 times is still exposing a real
  dependency the code or the test doesn't control — "usually passes"
  isn't the same as "correct."
- **Fixing flakiness by adding a longer `setTimeout` delay.** This
  narrows the window for the race condition without eliminating it —
  it's still non-deterministic, just less likely to trigger, which
  makes the eventual failure harder to reproduce and debug.
