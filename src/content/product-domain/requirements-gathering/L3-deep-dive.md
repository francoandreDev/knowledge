---
title: "L3 — A real requirements-gathering conversation, and what shipping without one costs"
---

## The scenario

A stakeholder submits a ticket: "We need bulk actions on the admin panel." That's the entire ask as written. Watch the two different paths this can take.

## Path A: building the literal ticket

An engineer reads "bulk actions on the admin panel," decides that reasonably means multi-select plus a delete button (the most common "bulk action" pattern they've seen elsewhere), and builds it: checkboxes on each row, a "Delete selected" button, a confirmation dialog.

Two weeks after shipping, the stakeholder reports it's "not really what we needed" — what they actually wanted was **bulk status updates** (marking many accounts as "verified" at once), not bulk deletion; deletion wasn't part of their actual workflow at all, and the confirmation dialog they didn't ask for adds friction to an action they don't even use. The engineer built a real, working feature — just not the one that was needed, because "bulk actions" was never actually specified beyond the two words in the ticket.

## Path B: a real requirements-gathering conversation

**Engineer:** "When you say bulk actions — what's the specific workflow this would replace? What are you doing today, one item at a time, that's slow?"

**Stakeholder:** "Every week we get a batch of maybe 30-50 new accounts to verify. Right now I click into each one, change its status to 'verified,' and save — one at a time."

**Engineer:** "So the core need is: select multiple accounts, change their status to verified, in one action. Is deletion or any other bulk operation part of this, or just the status change?"

**Stakeholder:** "Just status changes for now. Verified is the main one, but occasionally we also need to bulk-mark accounts as 'suspended.'"

**Engineer:** "Got it. One more thing — is there a limit on how many you'd select at once, and does anything need to happen after the update (a notification, a log entry) for compliance reasons?"

**Stakeholder:** "Usually under 50 at a time. And yes — we need an audit log entry showing who did the bulk change and when, same as we require for single-item status changes today."

**Resulting story:**

```
As an account reviewer, I want to select multiple accounts and change
their status in one action, so that I can process a weekly batch of
verifications without updating each account individually.

Acceptance criteria:
- [ ] Multi-select checkboxes on the account list
- [ ] A status-change control appears when 1+ accounts are selected,
      offering "Verified" and "Suspended" (matching existing single-item options)
- [ ] Applying a status change updates all selected accounts and creates
      one audit log entry per account, consistent with single-item changes
- [ ] No upper limit is enforced in v1, but the UI is tested up to 50
      selections (the stated typical batch size)
- [ ] Bulk delete is explicitly OUT of scope for this story
```

Three targeted questions turned "bulk actions" into a requirement specific enough that a different engineer, building from just this story, would very likely build the actual needed feature — including the audit-log requirement, which would have been a real compliance gap if Path A had shipped without ever surfacing it.

## What the conversation actually did

Every question in Path B was aimed at a specific kind of ambiguity: what workflow is this replacing (scope), what operations specifically (not deletion, which the vague ticket's "bulk actions" phrasing would have plausibly included), what scale (informs whether performance/pagination matters), and what's implicitly required for consistency with existing behavior (the audit log, which the stakeholder wouldn't have thought to restate, because it's an existing norm they'd assume carries over silently). None of these were things Path A's engineer could have reasonably guessed from "bulk actions on the admin panel" alone — they had to be asked.

## Failure modes

- **Treating the first-mentioned solution as the requirement.** "Bulk actions" already smuggled in an assumption (that deletion-style bulk actions were the model) — the same trap `understanding-user-s-problem-solution` covers from the "why" side; this unit's version is catching it during the _specification_ step, before any code is written, not just during initial problem validation.
- **Gathering requirements once, then treating them as frozen regardless of what's learned during implementation.** If, mid-build, the engineer discovers a real constraint the conversation didn't surface (say, the account list can have 10,000+ rows, making unpaginated multi-select impractical), the right move is going back to the stakeholder with the new information, not silently picking an interpretation and hoping it's close enough.
- **Writing acceptance criteria that describe implementation instead of observable behavior.** "Use a `Set` to track selected IDs" is an implementation detail, not an acceptance criterion — a criterion should be checkable by someone who never sees the code, the same falsifiability test from L2.
- **Skipping this step for anything that feels small.** "Bulk actions" was two words in a ticket — the size of the request text has no relationship to how much ambiguity it contains; a two-word ask can hide as much unresolved scope as a two-paragraph one, and the size of the eventual conversation should track the actual ambiguity, not the length of the original ask.
