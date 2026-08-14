---
title: "L2 — The four sources of power, and how a proposal actually gets adopted"
---

## Why "being right" is necessary but not sufficient

Two proposals, identical in technical quality, can have completely different fates — one adopted within a month, one shelved indefinitely. If correctness alone decided outcomes, that gap shouldn't exist. What's the variable that actually explains it?

```mermaid
flowchart LR
    Correct["Technically correct proposal"] --> Gate{"Does anyone with the\npower to act on it care?"}
    Gate -- "No" --> Shelved["Shelved — correct, unadopted"]
    Gate -- "Yes" --> Adopted["Adopted, funded, staffed"]
```

Correctness gets a proposal to the gate — it doesn't get it through. What's on the other side is a separate question entirely: does someone with actual capacity to act (budget, headcount, priority-setting authority, or enough trust that others will follow their lead) find this proposal worth spending that capacity on? A proposal can be perfectly correct and simply never reach anyone positioned to move it — that's not a contradiction, it's the whole reason power is a distinct variable from correctness.

## Four sources of power, and how each one actually moves a decision

Before the table: name one person whose opinion reliably moves decisions in a group you're part of, and ask yourself _why_ — is it their title, their track record, the fact that people trust them personally, or that they seem to know things others don't? Most people can answer instantly, which is itself evidence these four sources are already something you reason about intuitively, just not always on purpose.

| Source           | What it lets you do                                                                                    | How it's built                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Formal authority | Directly allocate budget, headcount, or roadmap priority                                               | Granted by title/role — the fastest lever, but the one you have least direct control over gaining                          |
| Expertise        | Have your technical judgment taken as sufficient justification on its own                              | Built by being right, repeatedly, on record, over time — compounds slowly but doesn't require a title                      |
| Relationships    | Get people to back a proposal because they trust the proposer, not just the pitch                      | Built through consistent, reciprocal follow-through long before you need the favor                                         |
| Information      | Frame a proposal in terms of what decision-makers already care about, avoid fights already lost before | Built by paying attention to context outside your own team — what's been tried, what leadership is actually optimizing for |

None of these require being disliked, dishonest, or manipulative to acquire — that association is a common reason people avoid thinking about power deliberately, but the sources themselves (track record, trust, context, formal role) are the same things that make someone a good colleague, applied with intent instead of accumulated by accident.

A rough sense of how much these sources typically compound over time versus how fast they can be spent — formal authority can be granted overnight by a promotion, but the other three only accumulate through repeated, real interactions:

```mermaid
xychart-beta
    title "Typical time to build a meaningful amount, by source"
    x-axis ["Formal authority", "Information", "Relationships", "Expertise"]
    y-axis "Rough time to build (months)" 0 --> 24
    bar [1, 3, 9, 18]
```

Formal authority can arrive in a single conversation (a promotion, a reorg); expertise is the slowest because it requires being right, publicly, enough times that people stop double-checking you. This is directional, not a formula — the point is that three of the four sources are patient investments, which is exactly why they're easy to under-invest in when a proposal feels urgent right now.

## The adoption pipeline

Given a correct proposal and someone who does have power over the problem, is that automatically enough? What's the one more thing that has to be true before that person actually spends their capacity on it?

Technical merit is evaluated first — necessary, but per the diagram above, not sufficient on its own. The next step is finding someone in the org who actually has power over the problem the proposal addresses; with no such sponsor, the proposal is shelved regardless of how correct it is. If a sponsor exists, the proposal still has to be translated into terms of what _that sponsor_ is accountable for — a sponsor with formal authority needs the framing connected to what they can directly allocate; a sponsor whose power comes from relationships needs the framing strong enough that vouching for it is worth spending their own trust on.

```mermaid
flowchart TD
    P["Proposal, technically correct"] --> S{"Reaches someone\nwith relevant power?"}
    S -- "No" --> Shelf["Shelved — correct, invisible"]
    S -- "Yes" --> F{"Framed around what\nTHAT sponsor is\naccountable for?"}
    F -- "No" --> Stall["Reaches them, still not prioritized"]
    F -- "Yes" --> Go["Prioritized, funded, staffed"]
```

This makes explicit what "politics" often gets blamed for when it's really just this pipeline running as designed: a correct proposal with no sponsor, or a sponsor whose incentives were never addressed in the framing, produces the exact same outcome ("shelved") as a genuinely bad proposal — from the outside they can look identical, which is part of why "I was right and it didn't matter" is such a common and disorienting experience.

## Politics as a neutral mechanism, not a moral failing

If the underlying mechanism here isn't optional — every group of people with different incentives has to align somehow — what actually happens when someone refuses to engage with it on principle?

The word "politics" carries a negative connotation mostly because its most visible instances are its abuses (credit-stealing, undermining, hoarding information as leverage). But the underlying mechanism — aligning people with different incentives toward a shared decision — is present in every functioning group and isn't optional to opt out of; declining to engage with it deliberately doesn't remove power from the equation, it just means decisions get made by whoever _did_ engage with it, correct or not.
