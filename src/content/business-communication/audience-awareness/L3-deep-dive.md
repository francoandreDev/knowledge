---
title: "L3 — Rewriting the same update three times, and what actually changes"
---

## The scenario

You own the payments retry service. A dependency's rate limit change means your nightly reconciliation job now takes 40 minutes instead of 12, and on two nights this week it ran past the window before the next job depends on it, delaying a downstream report by about an hour. You've already identified the fix (batch the calls instead of firing them one at a time) and estimate two days of work. You need to tell three different people about this today.

The facts are fixed. Watch what changes — and, just as importantly, what _doesn't_ — across the three versions below.

## Version 1: the peer engineer who owns the downstream report

> Heads up — reconciliation's been running 40min instead of 12 since Tuesday, ran past the window twice this week and pushed your report back ~1hr both times. Root cause: the vendor cut their rate limit from 500rps to 80rps last week without a heads-up, and we're still calling one-at-a-time. Fix is batching the calls (up to 100 per request per their docs) — I've got a branch started, should land Thursday. If it happens again before then, the job auto-retries and finishes eventually, just later than usual. Let me know if a 1hr delay is going to actually break something on your side before Thursday, and I'll bump priority.

**What's assumed:** they already know what "reconciliation" and "the window" refer to — no need to explain the system. They know what "rps" means and don't need rate limiting explained.
**What's foregrounded:** the exact mechanism (vendor change → serial calls → timeout) because a peer can use that detail to judge risk themselves, and might have their own mitigation ideas.
**The ask:** implicit unless the delay is actually breaking something — peers don't need to be asked to "note" something, they need to be told what to _do_ only if action is required.

## Version 2: the manager who owns the roadmap commitment for this quarter

> Reconciliation's been slower than normal since Tuesday (a vendor changed their rate limits under us) — it's delayed [downstream report] by about an hour on two nights so far. I've identified the fix and estimate two days of work; I'm planning to prioritize it this week over [lower-priority ticket], which should absorb the two days without slipping anything on the roadmap. Flagging in case you'd prioritize differently — otherwise I'll proceed and update you when it's shipped.

**What's assumed:** they know the roadmap and what's currently committed, but not the internals of the reconciliation job or what "rps" means — those details are cut entirely, not simplified, because they're not load-bearing for a roadmap decision.
**What's foregrounded:** the trade-off (this vs. that other ticket) and the fact that it fits inside the existing plan — a manager's real question is "does this threaten my commitments," and the message answers that in the first two sentences.
**The ask:** an explicit, easy default ("I'll proceed unless you say otherwise") rather than an open-ended "what do you think" — this respects that a manager reading a dozen of these a day needs a fast yes/no, not a discussion prompt.

## Version 3: the non-technical exec who cares about the report going out reliably

> [Downstream report] was about an hour late twice this week due to a backend performance issue on our side. We've identified the cause and a fix is in progress, expected to ship this week — no customer-facing impact, and we don't expect further delays once it's shipped.

**What's assumed:** nothing about the system. "Vendor rate limit" and "batching API calls" are both cut — not because the exec couldn't understand them, but because understanding them wouldn't change their decision. Their only real questions are "is this ongoing," "does it affect customers," and "when is it fixed" — all three are answered directly, in that order, in one sentence each.
**What's foregrounded:** the business consequence (a report was late) and the resolution timeline. Root cause is reduced to "a backend performance issue" — true, and sufficient.
**The ask:** none needed. This message is informational, closing a loop before they hear about it secondhand — not requesting a decision.

## What stayed constant across all three

- **No version contains a false or misleading claim.** The engineer's version isn't "more honest" than the exec's — the exec's version is just scoped to what's decision-relevant for that reader. Omission of irrelevant detail is not the same as omission of relevant detail.
- **The actual timeline (two days, shipping this week) is identical in all three.** Audience awareness never means giving different people different facts about what's actually happening — that's not calibration, it's deception, and it always gets caught the first time two audiences compare notes.
- **Every version answers "so what" for that specific reader** — a peer's "so what" is "should I worry / can I help," a manager's is "does this threaten my commitments," an exec's is "is this handled."

## Failure modes

- **Writing the peer version and sending it to the exec.** The most common failure — not lying, just defaulting to the writer's own frame (technical detail, no clear ask) regardless of audience. Reads as either condescending (over-explaining to a peer) or confusing (under-translating to an exec).
- **Writing the exec version and sending it to the peer who needs to act.** Stripping detail for everyone by default loses the information a peer actually needs to make their own judgment call — audience-awareness is about _matching_ detail to the reader, not minimizing it universally.
- **Confusing "no jargon" with "no substance."** The exec version above still states a real fact (an hour late, twice, fix shipping this week) — it's not vague reassurance. Cutting jargon doesn't mean cutting content; a message that reduces to "everything's fine, don't worry about it" with no verifiable claim reads as evasive to anyone senior enough to have been lied to before.
- **Over-indexing on hierarchy instead of actual stake.** The lens isn't "how senior is this person" — it's "what are they measured on and what do they already know." A staff engineer on another team is a peer for context purposes even if they outrank you organizationally; a founder asking a narrow technical question wants the peer-level answer, not the exec summary, if that's genuinely what they asked.
- **Skipping the ask, or burying it.** Every message that requires a reaction should make that reaction explicit and easy to act on (a default plus an easy override, as in Version 2) — an ambiguous "just flagging this" forces the reader to guess whether you need anything from them, which is its own failure of audience awareness: not knowing what your own reader needs _from you_.
