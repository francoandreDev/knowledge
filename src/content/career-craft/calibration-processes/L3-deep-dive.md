---
title: "L3 — Stress-testing a promotion packet, and what a strong case that still fails actually tells you"
---

## A packet that collapses under the first question

**Here's a first draft of the Scenario's engineer's promotion
packet. What happens when an unfamiliar manager in calibration reads
it?**

> "Has grown a lot this year. Consistently delivers high-quality
> work and is well-liked by the team. Shows strong senior-level
> potential and is ready for the next level."

The first question from a manager who's never met this person is
predictable: "Grown compared to what, specifically? What did they
actually deliver, and what made it senior-level rather than solid
mid-level work?" The packet has no answer, because none of its claims
are checkable — "grown a lot," "high-quality," "well-liked," and
"strong potential" are all impressions, not evidence. A manager with
no personal context has nothing to independently evaluate, so the
packet effectively asks the room to trust the writer's judgment alone
— exactly what calibration exists to not do.

## The same packet, rewritten with checkable evidence

**What would make the same underlying case survive that question?**

> "Led the migration off the legacy billing service (Q2–Q3):
> designed the phased rollout plan, coordinated with three dependent
> teams, and cut checkout-path error rates from 2.1% to 0.3% post-
> migration. Took ownership of the on-call rotation redesign after
> the prior owner left, cutting median page-to-resolution time from
> 40 to 12 minutes over two quarters. Mentored two mid-level
> engineers, both of whom shipped their first cross-team projects
> independently this cycle."

Every claim here is a specific, checkable fact: a named project, a
concrete before/after number, a named responsibility taken on
unprompted, and an outcome (two engineers shipping independently)
that another manager could ask about directly if they wanted to
verify it. **Why does the specific 2.1% → 0.3% error-rate number
matter more than just saying "greatly improved reliability"?**
Because a specific number is falsifiable — a skeptical manager could
in principle check it — while "greatly improved" asks to be taken on
faith. Calibration rewards exactly the kind of evidence that doesn't
require faith in the writer.

## What "senior-level" scope actually looks like on paper

**The rewritten packet has real numbers — does that alone make the
case for the next level?** Not by itself; the rubric usually asks
about scope and ownership too, not just impact. Notice what the
rewritten version also shows beyond the numbers: taking ownership of
the on-call redesign _after the prior owner left_, without being
assigned to (unprompted scope expansion), and mentoring that produced
other engineers' independent output (multiplying impact beyond the
engineer's own work) — both are the kind of evidence a leveling
rubric for a more senior role typically asks for specifically,
separate from "did good individual work."

## A strong packet that still doesn't result in a promotion

**Suppose the rewritten packet goes into calibration, clears every
question, and the rubric is clearly met — but the promotion still
doesn't happen that cycle, because of a slot constraint. From outside
the room, does that look any different from a packet that wasn't
strong enough?** Not necessarily — both can produce the identical
message back to the engineer ("didn't happen this time"), which is
exactly what made the Scenario's outcome so hard to parse from
outside. **What could the engineer actually ask their manager to tell
the two apart?** A direct, specific question: "Did the packet clear
the bar, or was there a constraint on how many promotions could be
approved this cycle regardless of the case?" — a manager who
genuinely advocated and lost to a slot constraint can usually answer
that plainly, and the distinction changes what the engineer should
actually do next (a slot-constrained strong case mostly needs
patience and re-submission; a case that didn't clear the bar needs
different, better evidence next cycle).

## What generalizes and what doesn't

The core lesson — a case has to be built from specific, checkable
evidence to survive scrutiny from people with no personal context, and
"didn't happen" can mean either "the case wasn't strong enough" or "a
constraint outside the case's control" — generalizes to any decision
made by a group evaluating a case they didn't personally build:
funding proposals, performance reviews, project greenlighting. What's
specific to this worked example: the exact rubric categories (impact,
scope, ownership) reflect a typical engineering leveling framework —
a different function's rubric might weight different categories
entirely. **Try extending it yourself:** if this engineer's actual
strongest quarter of work happened eight months before the
calibration cycle and their most recent quarter was comparatively
quiet, would the rewritten packet above still make as strong a case,
or does _when_ the evidence happened matter as much as _what_ it was?

## Failure modes

| Failure mode                                                                     | What it gets wrong                                                                                                                                |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Writing a packet full of impressions ("doing well," "ready") instead of evidence | Claims a stranger to the work can't independently verify tend to collapse under the first direct question in calibration                          |
| Treating a manager's verbal enthusiasm as equivalent to the written case         | Only the packet enters the room — spoken confidence in a 1:1 doesn't travel with it                                                               |
| Showing impact without scope or ownership                                        | Many leveling rubrics ask for evidence of taking on responsibility and multiplying impact beyond individual output, not just doing good work well |
| Assuming any failed promotion means the case was weak                            | A slot constraint can produce an identical outcome to a weak case — the two require asking a direct question to tell apart, not guessing          |
