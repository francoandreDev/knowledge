---
title: "L3 — Jordan's doc, rewritten: a paragraph-by-paragraph before and after"
---

## The original draft, and what a time-constrained reader actually does with it

**Before rewriting anything — what happens, paragraph by paragraph,
if the VP genuinely only has ninety seconds?** Reading each
paragraph of Jordan's original draft as the VP would, stopping the
moment attention runs out, makes the failure mode concrete rather
than abstract:

> **Paragraph 1 — History.** "The billing service was built five
> years ago by a team that has since moved on to other projects. It
> was designed for our transaction volume at the time, which was
> roughly a tenth of what we process today. Over the years, several
> workarounds have been layered on top of the original design to
> handle edge cases the service was never built for."
>
> **What the VP does with this:** Reads it. Nothing here signals
> urgency or asks for anything — it reads as background for a doc
> that hasn't gotten to its point yet. Attention starts to drift.

> **Paragraph 2 — More history.** "The original architecture
> decisions made sense given the constraints at the time, but three
> separate incidents in the past year have traced back to the
> service's inability to handle current load reliably..."
>
> **What the VP does with this:** Skims. "Three incidents" registers
> as a fact, but without a clear ask attached yet, it reads as
> justification-in-progress rather than something requiring a
> decision right now.

> **Paragraph 3 — Team capacity context.** "The team currently has
> capacity allocated across the analytics dashboard, the reporting
> API redesign, and ongoing maintenance. Any additional work would
> require reprioritization discussions..."
>
> **What the VP does with this:** This is roughly where the ninety
> seconds run out. A meeting starts. The VP has read three paragraphs
> of buildup and has not yet learned what Jordan actually wants.

> **Paragraph 4 (never reached) — The actual ask.** "Given the above,
> I'm requesting approval to reprioritize approximately 25% of Q3
> capacity toward migrating the billing service to the payments
> team's existing platform over the next six weeks."

**The ask was well-reasoned and specific. It was also the one
sentence in the entire document the VP never reached.**

## The rewrite: BLUF applied to the same content

**What does the exact same information look like reordered, not
shortened?** Every fact from the original draft is still here —
reordered so the parts most necessary for a decision come first:

> **Opening (executive summary) — everything a stopped-here reader
> needs:**
>
> "**Requesting approval to reprioritize 25% of Q3 engineering
> capacity to migrate the legacy billing service — recommend
> deciding by [date] so the 6-week migration finishes before Q4
> load.** The current billing service has caused three production
> incidents this year and has no dedicated maintainer; the risk of a
> customer-facing billing failure grows every quarter this is
> delayed. Recommended approach: migrate to the payments team's
> existing platform (est. 6 weeks). Trade-off: this delays the
> analytics dashboard project by one sprint."
>
> **Then, for anyone still reading — the same three paragraphs of
> history and context from the original draft, now clearly labeled
> "Background" rather than serving as the doc's opening.**

**If the VP again only has ninety seconds, what happens now?** The
ask, the timeline, the stakes, the recommendation, and the trade-off
are all present in the paragraph the VP actually has time to read —
a decision is possible even if nothing after the opening ever gets
read. Nothing about the underlying facts changed. The only change
was which sentence came first.

## Why this isn't just "make it shorter"

**Could Jordan have fixed this by cutting the doc down to one page
instead of three, keeping the same paragraph order?** No — a
shortened version of paragraphs 1-2-3-4 in the same order still
buries the ask behind three paragraphs of setup, just smaller ones.
The fix that actually worked wasn't cutting content, it was moving
one sentence (the ask) from the end to the beginning — the
background paragraphs are still fully present in the rewrite, just
demoted to "read if you have time" rather than "read first."

## What generalizes and what doesn't

The BLUF pattern — ask, then stakes, then recommendation, then
trade-off, then background — generalizes to almost any document
aimed at a reader who might stop reading at any point: a status
update, a postmortem's summary, an incident report's opening. What's
specific to Jordan's case: the exact four questions that belong in
the opening (decision, why now, recommendation, cost) fit a
resource-allocation ask specifically — a different kind of document
(a postmortem, say) would front-load different information (what
broke, current status, what's being done) rather than these same
four questions verbatim. **Try extending it yourself:** if Jordan
were instead writing a status update reporting that the migration is
now two weeks behind schedule — not asking for a new decision, just
informing the VP — would the same four-question structure still
apply, or does an FYI status update need a different opening than a
decision-requesting proposal?

## Failure modes

| Failure mode                                                                           | What it gets wrong                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assuming a well-reasoned document will get read in full because the reasoning is sound | Soundness doesn't guarantee attention — a reader who stops at paragraph 3 never benefits from paragraph 4's reasoning, no matter how good it is                                                                                           |
| Cutting a narrative-first document down without reordering it                          | Shortening reduces the cost of reaching the ask, but doesn't remove the structural problem of the ask coming last                                                                                                                         |
| Omitting the trade-off/cost to make the ask more appealing                             | A reader who discovers the omitted cost later (or asks about it directly) now has less trust in everything else in the document                                                                                                           |
| Writing one generic "executive summary" template for every kind of document            | A resource-allocation ask, a status update, and an incident report front-load different information — the BLUF principle (lead with what matters most to a stopped-here reader) is general; the specific four questions to answer are not |
