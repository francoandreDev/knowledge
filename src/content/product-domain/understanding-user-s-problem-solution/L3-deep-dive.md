---
title: "L3 — Two worked cases: same requested feature, different validated problem"
---

## Case 1: "Add a bulk delete button"

**The request, taken literally:** support agents want to select multiple tickets and delete them at once, because doing it one at a time is slow.

**Taking the request at face value would produce:** a multi-select UI plus a delete-many endpoint. Reasonable-sounding, and it's exactly what was asked for.

**Applying the five whys:**

```
"We need bulk delete"
  why? -> "Because closed spam/test tickets pile up and clutter the queue view"
  why? -> "Because the queue view shows everything, with no way to filter it out"
  why? -> "Because there's no status filter on the queue — 'closed' and 'open' look the same"
ROOT NEED: the queue view doesn't distinguish tickets that need attention
           from ones that don't
```

**What this reframes the problem into:** not "how do we destroy records faster" but "how do we keep the queue showing only what's actionable." That reframe changes the candidate solution space entirely — a status filter (hide closed tickets from the default view) solves the actual pain with zero data loss and no new destructive bulk-action surface to build safety rails around, and ships in a fraction of the time a safe bulk-delete flow (confirmation, undo window, audit log for a destructive multi-record action) would take.

**What shipped:** a default queue filter that hides closed/spam tickets, plus a one-click "show all" toggle for the rare case someone needs the full view. Bulk delete was never built. Support agent complaints about queue clutter dropped to near zero; nobody asked for bulk delete again, because the underlying pain (clutter, not "insufficient deletion throughput") was gone.

## Case 2: "Add a dark mode toggle"

**The request, taken literally:** several users in a feedback thread ask for dark mode.

**Applying the five whys, on a sample of the actual requesters (not assuming a single universal reason):**

```
User A: "I use it at night and the bright screen hurts my eyes"
  -> ROOT NEED: reduced eye strain in low-light conditions

User B: "Every other tool I use has it, this one looks dated without it"
  -> ROOT NEED: visual parity with expectations set by other tools

User C: "I just prefer how it looks"
  -> ROOT NEED: aesthetic preference, no functional pain behind it
```

This case illustrates something Case 1 doesn't: the five whys can reveal that a single feature request is actually **several different underlying needs wearing the same clothing** — a literal reading treats all three as identical ("they all want dark mode"), but the actual weight behind the request differs (User A has a real usability complaint; User C has a preference with no cost to not having it). This matters for prioritization, not just solution design: a request driven by genuine usability pain (User A) deserves more urgency than one driven by aesthetic preference alone, even though both are nominally "the same feature request."

**What shipped:** dark mode, but sequenced ahead of other roadmap items specifically because the eye-strain complaints (User A's category) correlated with a real support-ticket pattern ("hard to use at night") that the team hadn't otherwise connected to this request — the five-whys process is what surfaced that the request wasn't just aesthetic noise.

## Failure modes

- **Doing the five whys once, in a meeting, without talking to actual users.** The "why" answers in both cases above came from real requesters, not a team's guess at what users probably meant — inventing plausible-sounding whys internally just launders the team's own assumptions through a technique that's supposed to challenge them.
- **Treating the five whys as a way to talk users out of what they asked for.** The goal is a better-fitting solution, not a smaller one — Case 2 didn't conclude "actually nobody needs dark mode," it concluded which requesters had the most urgent underlying need, and still built the feature.
- **Stopping at the first "why" and calling it done.** "I want a CSV export so I can build a report" is itself still a solution-shaped answer (a report is also a chosen solution, not a root need) — the five-whys value comes from pushing past the first plausible-sounding answer, not accepting it as the final one.
- **Applying this so rigorously that trivial, cheap requests get needlessly interrogated.** Not every feature request needs a five-whys investigation — the cost of the analysis should be proportional to the cost and risk of building the requested solution. A one-hour UI tweak doesn't need the same scrutiny as bulk delete (a destructive, hard-to-reverse feature) or a request that would set a long-term architectural direction.
