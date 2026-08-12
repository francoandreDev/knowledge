---
title: "L3 — The same bug, handled at four different scopes"
---

## The scenario

A production service has been slowly leaking memory for months, restarted automatically by the orchestrator every few days before it OOMs. Nobody's investigated because the auto-restart makes it a non-emergency. You're asked to look into it. Watch how the _same underlying fact_ — a memory leak exists — produces genuinely different bodies of work depending on the scope someone brings to it.

## Response 1: well-defined task scope

Find the leak, patch it, verify memory is stable, ship the fix. Done in two days: a profiler run shows an event listener being added on every request without being removed; the fix removes it in the corresponding cleanup path. Verified with a load test showing flat memory over an hour where it previously climbed steadily.

**What's in scope:** exactly the reported symptom. **What's out of scope, by design:** why nobody noticed for months, whether the same pattern exists elsewhere, whether this class of bug is preventable going forward. This is complete, correct work for the ambiguity level of "fix this leak" — nothing here is wrong, it's scoped to a well-defined task.

## Response 2: project scope

Same fix, plus: while investigating, notices the leaked listener pattern (subscribing without a matching cleanup) appears in three other files in the same service, not yet leaking only because those code paths are triggered less often. Fixes all three, and adds a lint rule that flags an event-listener subscription with no corresponding removal in the same function scope, so this specific pattern can't silently reappear in this service.

**What's in scope now:** not just the reported instance, but the _pattern_ behind it, bounded to this project. The person filled in an edge the ticket didn't specify ("just fix the one leak") because the evidence in front of them implied a wider, still-bounded problem.

## Response 3: unowned-problem scope

Same fix and lint rule, plus: notices this service has no memory-usage alerting at all — the only reason this leak was caught is a human happened to look, and the auto-restart was silently masking the underlying growth curve for months. Proposes and implements a memory-trend alert (not just a hard OOM crash-loop alert) for this service, then checks two adjacent services owned by the same team and finds neither has one either — adds it there too, and writes up why crash-loop auto-restart is a dangerous signal to treat as "handled."

**What's in scope now:** a problem nobody had assigned to anyone — "we have no visibility into slow resource leaks until they crash-loop" — identified, scoped, and closed without waiting to be asked, because the evidence made the gap visible to someone looking for it.

## Response 4: cross-team direction scope

Same investigation, plus: recognizes that "auto-restart on crash masks the underlying problem" isn't unique to this team — it's a property of how the whole organization's orchestration platform is configured by default. Writes a short document proposing a platform-level default (alert on the trend, not just the crash) that would apply to every team, works with the platform team to get it adopted as the new default rather than a fix each team has to remember to add, and mentors two engineers on other teams through applying the same pattern to their own services during the rollout.

**What's in scope now:** an org-wide default nobody was individually responsible for, requiring influence across teams that never asked for input, with a time horizon (platform defaults, mentoring others through adoption) well beyond "this leak" or even "this team."

## What's the same across all four

Every response starts from the identical technical fact (a leaked event listener) and the identical technical skill (reading a memory profile, understanding the JS event-listener lifecycle). None of the later responses are "better engineering" in a narrow technical sense than Response 1 — the leak-fixing code itself doesn't get more sophisticated. What expands is the **boundary of what the person treated as their problem to solve**, unprompted, at each stage.

## Failure modes

- **Mistaking scope creep for scope expansion.** Response 4 works because each additional piece (the lint rule, the alerting, the platform proposal) is directly evidenced by what was actually found — not speculative extra work bolted onto an unrelated ticket. Expanding scope without evidence that the wider problem is real reads as unfocused, not senior.
- **Staying at Response 1 forever by choice, and calling it humility.** Deliberately declining to flag a pattern you've clearly seen repeat, to "stay in your lane," isn't modesty — it's withholding information that would help the team, and it's a common way skilled people plateau below the scope they're actually capable of.
- **Attempting Response 4 without the trust or context to pull it off.** Cross-team influence (Response 4) depends on relationships and credibility built through consistent Response-2/3-level delivery first — proposing an org-wide platform default with no track record of shipping smaller-scoped work reliably tends to be ignored, not because the idea is wrong, but because scope has to be earned through demonstrated judgment, not claimed by ambition alone.
- **Judging someone's level from a single incident.** One person handling one bug at Response-3 scope doesn't prove they operate there consistently, and one person handling one bug at Response-1 scope (correctly, for that ticket) doesn't cap their level either — leveling conversations look at a pattern across many situations, not a single data point in either direction.
