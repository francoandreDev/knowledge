---
title: "L3 — Annotating a real incident retro thread for fallacies"
---

## The thread

A real-shaped incident retro discussion, annotated line by line — every fallacy here is the kind that reads as reasonable in the moment and only looks obviously flawed once named:

> **Engineer A:** "The outage was caused by the new caching layer. Either we roll it back entirely, or we accept this happens again." _(False dichotomy — "roll back entirely" and "accept recurrence" aren't the only two options; fixing the specific bug in the caching layer, or rolling back with a guarded re-introduction plan, are both real alternatives the framing excludes.)_
>
> **Engineer B:** "So you're saying we should never cache anything, ever?" _(Straw man — Engineer A proposed rolling back or fixing this specific caching layer, not banning caching as a concept. Responding to the extreme version is easier to argue against than the actual claim.)_
>
> **Engineer A:** "That's not what I said. I'm saying THIS implementation has a bug." _(Correctly restates the real position — this is the actual fix for a straw man: name the real claim precisely, don't just object to the distortion in the abstract.)_
>
> **Engineer C:** "Well, our principal engineer designed this caching layer, and she's been doing distributed systems for fifteen years, so I trust her approach here." _(Appeal to authority, misused — fifteen years of distributed-systems experience is real and relevant to the *design* being sound in general, but it doesn't settle whether *this specific bug* exists; the claim under discussion is about a bug, which authority alone doesn't resolve.)_
>
> **Engineer D:** "You only think it's fine because you're on the team that built it." _(Ad hominem — even if true, this doesn't engage with whether the caching layer is actually fine; it attacks the position's source instead of its content, and would be equally true, and equally irrelevant, if the caching layer genuinely were fine.)_
>
> **Engineer A:** "If we let this bug slide because of who built it, we'll never fix any bug anyone senior writes." _(Slippery slope — this specific bug being examined on its merits doesn't establish a mechanism by which every future senior-authored bug becomes unfixable; the claim needs an actual reason the first case can't be bounded, not just the assertion that it can't.)_

## What the annotated version reveals

Six messages, five distinct fallacies, and not one of them is a deliberate manipulation — every participant plausibly believes what they're saying is a reasonable contribution to the discussion. That's the actual point of learning to name these patterns: they don't require bad faith to occur, and they derail a discussion just as effectively either way. The retro's real question — is there a specific bug in the caching layer, and what's the right fix — never actually gets addressed in this exchange, because every message engages with a fallacious tangent instead.

## A version that stays on the real question

> **Engineer A:** "The outage was caused by a bug in the new caching layer — cache invalidation didn't handle the concurrent-write case correctly. I want to either patch that specific case or roll back until it's fixed; not making a claim about caching in general."
>
> **Engineer C:** "The overall design is solid — I'd want to understand whether this is a narrow fix to the invalidation logic or something structural before deciding between patch and rollback."
>
> **Engineer A:** "Narrow — it's isolated to the concurrent-write path. I can have a patch and a test covering that case by tomorrow."

Same underlying facts, same people, same disagreement-adjacent territory — but every message engages with the actual claim (is this a narrow, fixable bug or a structural problem) instead of a distorted, authority-based, or person-directed substitute for it.

## Failure modes

- **Using fallacy names as a way to win, not to clarify.** Shouting "straw man!" without restating the actual position (the way Engineer A did correctly above) is itself a rhetorical move, not a substantive correction — the name only earns its keep when paired with what the real claim actually was.
- **Seeing fallacies everywhere, including in valid arguments.** Not every either/or statement is a false dichotomy (some things really are binary), not every appeal to a person's expertise is misused (a security expert's opinion on a security question is legitimately weighted more), and not every reference to someone's role is an ad hominem (context about who's speaking is sometimes genuinely relevant, just not sufficient on its own). Over-applying the labels erodes their usefulness the same way crying wolf does.
- **Missing that multiple fallacies can compound in a single thread.** The example thread has five in six messages — in real discussions, one fallacious move often provokes a fallacious response (the straw man response to the false dichotomy), and untangling a compounded thread requires addressing each move separately, not with one blanket objection.
- **Assuming naming the fallacy settles the underlying disagreement.** Correctly identifying that Engineer B straw-manned Engineer A doesn't yet answer whether the caching layer should be patched or rolled back — the fallacy-free version above still requires the real technical judgment call; removing the fallacies clears the path to that judgment, it doesn't replace it.
