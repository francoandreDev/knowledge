---
title: "L3 — The same Saturday bug fix, written two ways"
---

## The anxious first draft

**Before rewriting anything — what does a brag doc entry look like
when someone is uncomfortable writing it at all?** Two different, and
both unhelpful, failure directions from the same real event:

> **Version A — under-described, buried in modesty:**
>
> "Fixed a data issue over the weekend. Wasn't a big deal, just
> needed to look into it."
>
> **What's wrong with it:** A reader six months from now (including
> the writer) has no idea what actually happened, how bad it was, or
> what skill it demonstrated. "Wasn't a big deal" actively undersells
> work that, per the opening scenario, involved tracking down silent
> data corruption — exactly the kind of judgment-call debugging a
> promotion case needs evidence of.

> **Version B — overcorrected into advocacy:**
>
> "I went above and beyond to save the company from a major data
> disaster. This shows I'm ready for more responsibility and clearly
> demonstrates senior-level ownership."
>
> **What's wrong with it:** This is subjective self-assessment
> wearing the shape of a report — "shows I'm ready," "clearly
> demonstrates" are judgments the writer is making about themselves,
> not facts a reader can independently evaluate. It reads as asking
> for a verdict, which is exactly the discomfort self-promotion
> anxiety is reacting to — and for good reason, since it's actually
> doing that.

**Neither version is more or less honest than the other — they're
both just badly calibrated: one strips out the facts that matter,
the other adds a verdict that isn't the writer's to give.**

## The objective-framing rewrite

**What does the same event look like written to state facts and let
the reader draw the conclusion?**

> "Diagnosed and fixed a data corruption bug affecting an estimated
> 2% of customer records over 3 weeks, caused by a race condition in
> the record-merge path. Traced it via log correlation (no existing
> alert had caught it), wrote and ran a backfill to repair affected
> records, and added a new invariant check to prevent recurrence.
> Done independently over a weekend once the pattern was confirmed;
> no customer-facing incident was ever declared because it was caught
> and fixed before support tickets started coming in."

**What makes this version work, checked against L2's three
elements?**

- **What changed** — "2% of customer records," "3 weeks," "no
  existing alert had caught it," "added a new invariant check" — all
  concrete, none padded.
- **Why it mattered** — "no customer-facing incident was ever
  declared" states the stakes (this was heading toward one) without
  claiming credit in words, just in facts.
- **What was hard about it** — diagnosing an uncaught, silent bug via
  log correlation, then writing a safe backfill, are both real
  judgment calls a reader can recognize as non-trivial without being
  told to recognize them.

**Notice what's absent**: no "I did a great job," no "this shows I'm
ready for promotion." The entry doesn't need either — a promotion
committee reading "diagnosed a silent data corruption bug via log
correlation, no existing alert had caught it" draws its own
conclusion about the skill involved, which is a stronger endorsement
than the writer's own claim would have been.

## Why this version is the one a manager can actually use

**What happens when this entry reaches the manager writing the
promotion packet, six months later?** They can use it close to
verbatim — the facts are already stated in a form a promotion
committee (who never saw the work happen) can evaluate on their own,
rather than the manager having to either reconstruct detail from a
hazy memory or take the engineer's self-assessment on faith and
restate it as their own claim.

## What generalizes and what doesn't

The core move — state what changed and why it mattered in concrete,
checkable terms, and let the reader draw the evaluative conclusion —
generalizes to any situation where someone needs to represent their
own work to someone who wasn't there: a performance review, a resume
bullet, a project retro. What's specific to this worked example: the
particular facts (2% of records, 3 weeks, log correlation) are
this event's own evidence — a different kind of work (mentoring,
cross-team coordination, a design decision) needs its own concrete,
checkable specifics, which won't look like latency numbers or
incident counts. **Try extending it yourself:** how would you apply
objective framing to a mentoring conversation that doesn't have an
obvious "before/after" metric the way a performance bug does — what
would the concrete, checkable version of "I helped a junior engineer
grow" actually look like?

## Failure modes

| Failure mode                                                                                  | What it gets wrong                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Writing the entry the same week as a performance review, months after the work happened       | The specific numbers and context (which alert was missing, exactly how long the bug ran) are usually already lost by then, making the entry vague by necessity, not choice                                    |
| Believing objective framing requires fabricating a metric that doesn't exist                  | Not every piece of work has a clean number — "no existing alert had caught it" and "no customer-facing incident was declared" are objective facts even without a single headline statistic                    |
| Treating Version B's confident language as more persuasive than Version A's under-description | Confidence isn't the same as evidence — a reader (especially a promotion committee) is more persuaded by specific facts they can independently judge than by being told directly how impressive something was |
| Assuming a brag doc is only for dramatic, incident-level work                                 | The quiet, competent work is exactly what unaided memory forgets first — routine improvements and mentoring moments belong in the log too, in the same objective-framing style                                |
