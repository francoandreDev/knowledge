---
title: "L2 — Telling productive struggle from wasted struggle, and the gradual-release gradient"
---

## Is this struggle worth letting continue?

**Before any technique for how to intervene, there's a prior question: how
does a mentor actually tell "still productively working the problem" apart
from "spinning with no new information"?**

```mermaid
flowchart TD
    A["Mentee is stuck"] --> B{"Are they forming and\ntesting NEW hypotheses,\neven slowly?"}
    B -- "Yes" --> C["Productive struggle —\nhold back, let it continue"]
    B -- "No, repeating the\nsame thing" --> D{"Are they missing a\nprerequisite FACT\n(not a reasoning step)?"}
    D -- "Yes" --> E["Give the missing fact only,\nnot the fix — then step back"]
    D -- "No, they have the\npieces, just haven't\nconnected them" --> F["Ask a diagnostic question\nthat points at the gap"]
```

The signal isn't time elapsed — Sam's 40 minutes doesn't by itself mean
"intervene now." The signal is whether each new attempt is testing a
different idea than the last one. A mentee who has cycled through the same
single hypothesis five times in a row has stopped learning from the
attempts; a mentee slowly narrowing down through three different
hypotheses in the same 40 minutes is still extracting value from the
struggle.

## The gradual-release gradient

**If the answer to "should I intervene" is yes, how much should be handed
over — the full fix, a hint, or a question?** A useful way to think about
this is a gradient of how much responsibility the mentor is holding versus
handing to the mentee, not a single fixed choice:

```text
1. I do, you watch    — mentor solves it while narrating the reasoning out loud
2. We do it together  — mentor and mentee work the same problem side by side
3. You do, I watch    — mentee drives, mentor only intervenes if truly stuck
4. You do it alone    — mentee handles the next one with no mentor present
```

Priya's "ask a diagnostic question and wait" sits at stage 3: Sam is
driving, Priya is only present to catch a genuine dead end. If Sam had
never encountered test mocking at all, starting at stage 3 would waste
time neither of them has — stage 1 or 2 first (show the concept, then do
one together) would get to a productive stage 3 much faster on the _next_
bug.

## Matching the stage to the mentee, not to the mentor's default

**Does the same mentee always sit at the same stage?** No — the stage
should track the specific skill being exercised, not the person overall. A
mentee who's confidently at stage 4 for writing tests might still need
stage 2 for a new deployment tool they've never touched. Picking one fixed
stage for a mentee across every kind of problem either babies someone who's
ready for more autonomy, or strands someone in unfamiliar territory with
too little support.

| Signal                                                              | Suggests                         |
| ------------------------------------------------------------------- | -------------------------------- |
| Mentee has done this exact kind of task before, successfully        | Stage 3 or 4                     |
| Mentee has the general skill but this specific tool/pattern is new  | Stage 2                          |
| Mentee is missing a foundational concept entirely                   | Stage 1, briefly, then move up   |
| Mentee is repeating the same failed approach with no new hypothesis | Drop back one stage, temporarily |

## The generalizable lesson

**Is "ask questions instead of giving answers" the actual rule to take
away from this unit?** Not quite — asking a diagnostic question when a
mentee is missing a basic prerequisite fact just wastes both people's time
circling something a direct, short explanation would resolve in ten
seconds. The generalizable skill is diagnosing _which_ situation is
actually in front of you — productive struggle, a missing fact, or an
unconnected piece — and picking the response that situation calls for, not
committing in advance to always-teach or always-tell.
