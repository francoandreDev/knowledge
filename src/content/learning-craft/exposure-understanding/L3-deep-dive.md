---
title: "L3 — Running the Feynman technique on a real concept, and the research behind why it works"
---

## A worked example: applying it to "why TCP retransmits"

**Step 1 — the fluency-illusion version (after reading about it once):** "TCP retransmits packets when they're lost, using acknowledgments and timeouts to figure out what needs resending." This _sounds_ correct, uses the right vocabulary, and would probably pass a skim by someone who already knows the topic — which is exactly the danger, because it says nothing about the actual mechanism.

**Step 2 — attempting the Feynman explanation, no peeking:** "The sender numbers each byte it sends. The receiver sends back an acknowledgment saying the highest contiguous byte number it's received so far. If the sender doesn't see an ack for a segment within some time window, it assumes that segment was lost and resends it. The timeout window is..." — and here the explanation stalls. _How is the timeout window actually chosen?_ Saying "it's calculated somehow" is a hand-wave, not an explanation.

**Step 3 — the stall identifies the exact gap:** the retransmission-timeout (RTO) calculation, specifically. Not "reread the whole TCP chapter" — study specifically how RTO is estimated from measured round-trip times (a smoothed average plus a variance term, so the timeout adapts to how variable the network's latency actually is).

**Step 4 — re-attempt after targeted study:** "...the timeout isn't fixed — it's calculated from recently measured round-trip times, using a running average so a temporarily slow network doesn't cause pointless immediate retransmits, but a consistently slow network does raise the timeout to match." This version can be defended against a follow-up question ("what if the network is consistently slow?") — the first version couldn't, because there was nothing behind "somehow" to defend.

The difference between step 1 and step 4 isn't more reading time spent — it's that step 2's forced, unaided attempt located precisely where the understanding was missing, instead of leaving it undiscovered until a real-world situation (debugging an actual retransmission storm) exposed the gap under worse conditions.

## Why this isn't just a study tip — the underlying research

This unit's claim (active retrieval produces more durable, more transferable learning than passive re-exposure, even when re-exposure _feels_ more productive in the moment) is one of the most replicated findings in cognitive psychology, generally referred to as **the testing effect** or **retrieval practice**. The consistent pattern across decades of study-technique research: learners who are asked to predict how well they'll remember material after re-reading it consistently _overestimate_ their retention compared to learners who used active recall — the fluency illusion isn't just a plausible-sounding theory, it's a measured, reproducible mismatch between subjective confidence and actual later performance. This is also why cramming (repeated passive review right before a test) can produce a good short-term score while producing worse long-term retention than the same total time spent on spaced, active retrieval — the short-term test result rewards exactly the illusion this unit warns about.

## Failure modes

- **Doing the Feynman technique out loud, alone, and never actually noticing the hand-waves.** The technique only works if the hand-waves are caught — practicing to an actual person (even one with no background, especially one willing to ask "wait, why?") makes the gaps much harder to silently skip past than narrating to yourself, where it's easy to unconsciously smooth over the exact spot that would have stalled.
- **Treating a single successful explanation as permanent.** Explaining something correctly once proves it was retrievable _that day_ — memory decays, which is precisely why spaced re-exam (not just one retrieval success) is necessary for anything meant to stay usable months later, not just pass a one-time check.
- **Using jargon as a substitute for the mechanism, and not catching it as a gap.** "It retransmits because of TCP's reliability guarantee" restates the _what_ using a term (reliability guarantee) without explaining the _how_ — jargon fluency is itself a form of the fluency illusion, since using a term correctly in a sentence is a much weaker skill than being able to unpack what it actually means mechanically.
- **Applying this only to formal study material, not on-the-job learning.** The same illusion applies to reading a colleague's design doc, watching a demo of an unfamiliar system, or skimming a runbook during an incident — nodding along while reading produces the identical false sense of "I've got this" as re-reading a textbook passage, and the same forced-retrieval check (can I explain this system's behavior without the doc open?) catches it just as reliably.
