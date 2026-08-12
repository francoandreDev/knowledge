---
title: "L3 — The same design doc, three different feedback requests"
---

## The scenario

An engineer just finished a design doc for a new caching layer and wants real feedback before it goes to a wider review. They ask three different senior colleagues, phrasing the ask differently each time — same doc, same day, same recipients' actual opinions available to be extracted, if asked for correctly.

## Request 1: the default

**Message:** "Hey, could you take a look at this doc when you get a chance? Any feedback welcome."

**Response, two days later:** "Looks solid, nice work!"

This is a plausible, low-cost, safe answer to a question with no specific target — it neither confirms the doc was read carefully nor reveals whether there were real concerns worth raising. It's not dishonest; it's just uninformative, because the question gave no signal about what kind of engagement was actually being requested.

## Request 2: scoped, but still open-ended

**Message:** "Could you review the design doc, specifically the tradeoffs section? I want to make sure I'm not missing a real alternative."

**Response, next day:** "The tradeoffs section covers the main options I'd have considered. One thing I didn't see addressed: what happens if the cache and the source of truth disagree during a partial outage — is that a case you've thought through?"

Scoping to a specific section, with a specific worry named ("am I missing a real alternative"), produced a specific, substantive answer — including a real gap the general request never surfaced. The reviewer didn't have to invent a comment from nothing; the question gave them a concrete lens to actually apply their attention through.

## Request 3: scoped, and calibration-checked

**Message, after the tradeoffs feedback above:** "That's a good catch — I hadn't covered the disagreement case. Quick question: did you read the whole doc, or mainly the tradeoffs section? I want to know if I should also expect other gaps elsewhere."

**Response:** "Mainly the tradeoffs section, since that's what you asked about — I skimmed the rest but didn't read the implementation plan closely."

This follow-up is the calibration step from L2, made concrete: it tells the engineer exactly how much confidence to place in "the rest of the doc looks fine" (none — it wasn't actually reviewed closely) versus the tradeoffs feedback (high — that section was genuinely read). Without this question, "looks solid" from Request 1 and "the rest looks fine, since I only closely read the tradeoffs" from Request 3 would be indistinguishable in the doc author's mind, even though they carry very different amounts of real signal.

## What changed across the three requests

The recipients' actual opinions, engagement, and time available didn't change — what changed was how much of that real signal the question successfully extracted. Request 1 extracted almost none of it; Request 2 extracted a genuinely useful, specific finding; Request 3 additionally extracted the calibration information needed to know what _wasn't_ covered, which is just as important as what was.

## Failure modes

- **Treating a specific question as an interrogation.** "How was the tradeoffs section" is a normal, low-friction question; "why didn't you catch the outage-disagreement case, don't you usually review carefully" is not — the goal is a better-shaped invitation to give real feedback, not pressure that makes candor feel risky and pushes the person back toward a safe, vague answer.
- **Only asking for feedback on finished work, never on direction.** Scoping to something specific and finished is good practice for the doc-review case in this scenario, but the same principle over-applied ("only ask when it's done") wastes the chance to catch a bad direction early — the scope should be "specific and answerable," not always "complete."
- **Not acting visibly on candid feedback once received.** Request 2's engineer thanking the reviewer and updating the doc (as shown) is what makes the _next_ ask to that same person more likely to get real engagement again — a reviewer whose specific, effortful feedback visibly goes nowhere learns that a quick "looks good" costs them the same outcome for a fraction of the effort.
- **Asking the calibration question defensively, as if checking up on the reviewer.** Request 3's framing ("I want to know if I should also expect other gaps elsewhere") is about the asker's own next steps, not about auditing the reviewer's diligence — the same literal question asked in a tone that implies "you should have read the whole thing" undermines the safety that made Request 2's honest answer possible in the first place.
