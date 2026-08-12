---
title: "L3 — Tracing a claim back to its primary source, and catching where it went wrong"
---

## An illustrative trace (a representative, not a specific real case)

A claim circulating in three blog posts: "Database X's default configuration guarantees strict consistency across all replicas." All three posts get cited in a team's internal architecture doc as justification for skipping an explicit consistency check.

**Checking source independence first:** Post C links to Post B as its source for this claim; Post B links to Post A; Post A cites "the official docs" but doesn't link a specific page. This is the corroboration trap from L2 in action — three posts, one actual origin, and that origin isn't even directly checkable from what's given.

**Going to the actual primary source** (the database's official configuration reference): the default configuration provides **eventual** consistency; strict consistency requires an explicit, non-default configuration flag. Post A's original summary appears to have conflated "consistency is configurable and can be made strict" with "consistency is strict by default" — a real, easy-to-make simplification error, not a deliberate falsehood, but one that then propagated unchanged through B and C because neither checked the primary source independently.

**What this means for the team's architecture doc:** it was built on a claim that traces to a single interpretation error, several links removed from the primary source, dressed up by three independent-looking citations that weren't actually independent. Catching this before shipping (rather than discovering it via an actual consistency bug in production) is the entire practical payoff of tracing the claim before relying on it for a real, consequential decision.

## When shallow trust is actually the right call

Not every claim needs this level of scrutiny — checking three levels of citations back to a primary source is real effort, and spending it on every claim encountered would make reading anything technical impossibly slow. The calibration question from L1 is what determines when it's worth it:

- **Low-stakes, easily-reversible claim** ("this library has a nice API for X"): shallow trust is fine — being wrong costs little and is easy to notice and correct.
- **High-stakes, hard-to-reverse claim, feeding a real decision** ("this configuration guarantees consistency," feeding an architecture decision that would be expensive to unwind): worth tracing back, exactly as done above — the cost of verification is small relative to the cost of a wrong foundational assumption.

## Failure modes

- **Treating "cites its sources" as sufficient, without checking whether the citation actually resolves back to something checkable.** Post A citing "the official docs" with no link _looks_ like a citation but isn't actually verifiable — a real citation should let a reader trace it, not just gesture at where it could theoretically be found.
- **Assuming author expertise settles a specific factual claim.** Even a credentialed, generally reliable author can make a real interpretation error on one specific claim — expertise is a reasonable prior that shifts probability, not a substitute for checking the specific claim against its primary source when the stakes justify it (the same distinction covered from a different angle in `security/security-mindset`'s misused-authority discussion).
- **Confusing "I couldn't quickly find a primary source" with "there isn't one."** Sometimes the practical move is proceeding with appropriately hedged confidence ("multiple sources say X, though I haven't independently verified it against primary documentation") rather than either fully trusting an unverified claim or refusing to use it at all — calibrated uncertainty, stated honestly, is often the realistic answer under real time constraints.
- **Applying this level of rigor selectively, based on whether a claim is convenient rather than how consequential it is.** It's easy to trace sources carefully when a claim contradicts what you already believe, and skip the check when a claim conveniently confirms it — the calibration should track the claim's actual stakes and reversibility, not whether verifying it would be comfortable.
