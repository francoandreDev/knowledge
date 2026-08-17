---
title: "L2 — Gated stages, artifact promotion, and why rollback needs to be planned in advance"
---

## A pipeline as a chain of gates

**What actually determines whether a commit ends up running in
production — is it just "the pipeline finished"?**

```mermaid
flowchart LR
    Commit["Commit pushed"] --> Build["Build stage"]
    Build -- "fails" --> Stop1["Pipeline halts —\nnothing later runs"]
    Build -- "passes" --> Test["Test stage"]
    Test -- "fails" --> Stop2["Pipeline halts"]
    Test -- "passes" --> Staging["Deploy to staging"]
    Staging -- "fails" --> Stop3["Pipeline halts"]
    Staging -- "passes" --> Prod["Deploy to production"]
```

"The pipeline finished" and "the pipeline finished because every gate
passed" are different claims. A pipeline that always reaches the final
stage regardless of intermediate results isn't a safety mechanism — it's
a sequence of steps that happen to run one after another. The gates
between stages, not the stages themselves, are what make a pipeline
protective.

## Continue-on-error: a scalpel, not a permanent setting

**Is there ever a legitimate reason to let a pipeline continue after a
step reports failure?** Yes — a genuinely flaky, non-blocking check (like
a slow integration test known to occasionally time out for infrastructure
reasons unrelated to code correctness) is a real, if imperfect, case for
tolerating failure temporarily. The problem in the incident wasn't that
the flag exists — it's that it was applied to the actual test suite
itself, the one gate specifically responsible for catching real bugs, and
then left there long after its original justification (the specific flaky
test) was gone:

```text
Legitimate temporary use:
  A known-flaky, LOW-STAKES check, with a ticket to fix it,
  and a plan for when the override gets removed

What happened instead:
  Applied to the actual correctness gate (the test suite)
  No ticket, no removal plan
  Stayed in place indefinitely after its original reason vanished
```

## Artifact promotion: build once, deploy the same thing everywhere

**If staging and production are separate environments, does the pipeline
rebuild the application separately for each one?** A well-structured
pipeline builds the deployable artifact exactly once, then promotes that
identical artifact through staging and production in sequence — it never
rebuilds from source for each environment. This matters because rebuilding
per-environment reopens the exact risk environment-parity practices exist
to close: a dependency resolving to a slightly different version between
builds, a compiler flag differing by environment, anything that could make
"tested in staging" and "running in production" refer to two subtly
different artifacts instead of the same one.

## Rollback has to be a decision made in advance, not during an incident

**Once a bad deploy reaches production, is "roll back" always
straightforward?** Only if the pipeline was built with rollback in mind
before the incident — keeping the previous artifact readily deployable,
and having a fast, well-rehearsed path back to it. Deciding how rollback
will work _during_ an active incident, under pressure, with a team that's
never actually exercised the rollback path before, is far slower and
riskier than a path that was designed and tested in advance.

## The generalizable lesson

**Is the fix "never allow any pipeline step to continue past a
failure"?** Not quite — some checks genuinely are advisory rather than
blocking, and forcing every failure to halt the pipeline would make
legitimately non-critical flakiness as disruptive as a real bug. The
actual skill is being deliberate about _which_ gates are allowed to be
bypassed and under what conditions, keeping that list short and reviewed,
and treating "we bypassed a gate" as something that needs a visible,
time-bound reason — not a setting that quietly becomes permanent.
