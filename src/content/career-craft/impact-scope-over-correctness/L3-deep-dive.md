---
title: "L3 — Writing the review: what turns a correct fix into a senior-level accomplishment on paper"
---

## The raw facts, before anyone writes anything

Technical words in the example: a **batch job** is a scheduled task a
system runs automatically; a **billing cycle** is the period when
customers are charged; **QA** means quality assurance, the people or
process used to check that a change behaves correctly; and **production**
is the real system customers use.

Before either manager wrote a word, here's what actually happened —
identical in structure, wildly different in scope:

|                                  | Priya                                             | Sam                                                                                              |
| -------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| What was found                   | Off-by-one bug in a debug-only logging path       | A batch job that would double-charge customers on their next billing cycle                       |
| Who would be affected if unfixed | 2 internal engineers reading confusing log output | 3,100 customers, at $60 in erroneous charges each                                                |
| Total exposure if unfixed        | Negligible — no revenue or customer impact        | $186,000 in erroneous charges (3,100 × $60)                                                      |
| Difficulty of the actual fix     | Small — one boundary condition corrected          | Small — one conditional check added before the batch job ran                                     |
| When it was caught               | During routine debugging                          | Three weeks before the batch job's scheduled run, while reading through it for an unrelated task |

**Before reading the write-ups below — given this table, what's the
one fact that predicts which write-up will anchor a promotion case?**
It isn't difficulty (both fixes were small). It's the exposure row:
$0 in practical terms versus $186,000 — a difference of scope, not of
skill or effort.

## Draft A: how NOT to write Sam's accomplishment

A manager unfamiliar with translating impact into review language
might write:

> "Sam fixed a bug in the billing batch job this quarter. The fix
> was a one-line change to a conditional check. Sam also helped
> onboard two new team members and kept up with code review load."

Every sentence here is true. But notice what's missing: no mention of
what the bug _would have done_, no dollar figure, no customer count,
no mention that Sam found it proactively rather than reactively. Read
cold, this description sounds identical to Priya's debug-log fix —
"fixed a small bug." **The write-up itself erased the scope that
made this catch matter**, even though the underlying fact pattern was
already there to draw from.

## Draft B: the same facts, scope made explicit

> "While reviewing the billing batch job for an unrelated task, Sam
> identified a bug that would have caused the job to double-charge
> approximately 3,100 customers on their next billing cycle — a
> combined $186,000 in erroneous charges — three weeks before the job
> was scheduled to run. Sam wrote and merged a fix (a single
> conditional check), flagged the finding to the billing team lead
> immediately rather than waiting for the next status update, and
> confirmed with QA that the corrected job produced accurate charges
> for a sample of the affected accounts before it ran in production.
> No customers were charged incorrectly."

Same underlying fix. Same difficulty. What changed is that **scope
and judgment are now visible on the page**: the dollar figure, the
customer count, the fact that Sam found this proactively (not in
response to a complaint), and the fact that Sam verified the fix
before trusting it rather than merging and moving on. This is the
version that reads as senior — not because the code changed, but
because the write-up now shows the reader what would have happened
without Sam's intervention.

Notice the senior signal does not say, "Sam is excellent." It shows
the facts — customer count, dollar amount, timing, and verification —
so the reader can reach that conclusion without being asked to trust a
self-assessment.

## Priya's write-up, for contrast — and why it's _correctly_ modest

> "Priya identified and fixed an off-by-one error in the debug
> logging path used during local development. The fix improves log
> readability for the team during future debugging sessions."

This is not a "bad" write-up — it's an accurate one. Inflating it
with false urgency ("this could have caused serious issues...") would
misrepresent the actual scope, which was genuinely small. **The goal
isn't to make every write-up sound huge — it's to represent scope
accurately, whatever that scope turns out to be.** A manager who
learns to write Draft B for Sam should not start writing Draft-B-style
language for every minor fix; that would just make every review
sound inflated and erase the signal entirely.

## What this comparison does and doesn't prove

**Would Sam's catch have read as senior regardless of who wrote it
up?** Not automatically — Draft A shows the same fact pattern can be
written in a way that hides the scope entirely. The lesson generalizes
in two directions at once: as the person doing the work, the habit
worth building is tracing out consequences _before_ something breaks
and making that reasoning visible (to a manager, in a PR description,
in a status update) rather than assuming the scope will be obvious
later; as the person writing about someone else's work, the habit is
translating "what did they do" into "what would have happened without
them," which is what actually carries the scope information.

This connects directly to `career-craft/documentation-career-tool`: a
prevented problem often needs to be documented on purpose, because no
outage or customer complaint exists to remind everyone later.

**Try extending it yourself:** suppose Priya's debug-log fix had
actually been reused six months later by a different team debugging a
production incident, cutting their diagnosis time from two days to
two hours. Does that change how her original write-up should have
been framed at the time it happened, or only how a _later_ write-up
should credit her, once that consequence became visible?

Hint: do not rewrite the past as if Priya knew the future. Record the
new impact when it becomes visible, and connect it back to the original
work with the evidence that now exists.

## Failure modes

| Failure mode                                                                 | What it gets wrong                                                                                                                                                      |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inflating every fix's write-up to sound high-scope                           | Erases the actual signal — if everything is written as critical, nothing distinguishes the genuinely high-scope work                                                    |
| Assuming scope is only visible after something breaks                        | Sam's scope was visible three weeks _before_ any failure — waiting for an incident to prove impact wastes the chance to get credit for prevention                       |
| Conflating difficulty with scope when writing a review                       | A trivial fix to a high-scope problem deserves more credit in a review than a hard fix to a problem nobody depended on — write-ups should track consequence, not effort |
| Doing high-scope work but never surfacing the "what if"                      | If Sam had fixed the bug silently with no flag to the billing team lead, the prevented-consequence framing wouldn't exist for anyone to write about later               |
| Judging engineers only by what shipped, not what they caught before shipping | A caught bug that never happened produces no visible artifact by default — it has to be actively described, or it disappears from the record entirely                   |
