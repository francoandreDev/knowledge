---
title: "L2 — The observable signals of real influence, and how to trace them"
---

## Influence leaves traces, even when it's informal

**If the informal decision network isn't written down anywhere, how do you actually find
it?** It's genuinely invisible on any org chart — but it isn't invisible in practice. It
leaves consistent, observable traces in how decisions actually happen:

```mermaid
flowchart TD
    A["Who gets looped in on\nimportant threads, even\nwithout a formal role?"] --> E["Real influence signal"]
    B["Whose name comes up when\npeople explain WHY a\ndecision was made?"] --> E
    C["Who's in every important\nmeeting but chairs none\nof them?"] --> E
    D["Whose disagreement alone\ncan stall or reverse\na decision?"] --> E
```

Applied to the CI-proposal incident: the senior IC was consistently cc'd on infrastructure
threads despite no formal role requiring it; when the director explained the approval,
they cited the IC by name; and the IC would have shown up, if anyone had been watching, at
every infrastructure-adjacent conversation without chairing a single one of them. All four
signals point at the same person — that convergence is what makes the informal network
legible, once you know to look for it.

Plain terms: being looped in or cc'd means someone is included in the
conversation even when they do not own it. A thread is a written
conversation. Chairing a meeting means officially leading it. If a
person keeps appearing, being cited, or slowing a decision by
disagreeing, that is a signal of real influence.

## A concrete exercise: trace the last three decisions

**Rather than guessing at who holds influence, what's an actual, doable way to find out?**
Pick the last three significant decisions in your area and, for each one, write down not
who signed off, but **who was actually consulted before the decision was made**:

| Decision                 | Who formally approved | Who was actually consulted first                 |
| ------------------------ | --------------------- | ------------------------------------------------ |
| CI vendor change         | Director              | Senior IC (infra), one platform lead             |
| Team reorg               | VP                    | Two team leads, one senior IC (different domain) |
| New service architecture | Director              | Senior IC (infra) again, a principal engineer    |

**A name appearing in the "actually consulted" column more than once, across otherwise
unrelated decisions, is the single strongest signal of real influence this exercise can
produce** — it's not a one-off relationship, it's a consistent pattern of being the person
whose judgment gets checked before a call is made.

You can run the same exercise outside a company: list the last three
decisions in a class project, family business, club, or community
group. Do not only write who had the official right to decide; write
whose opinion people checked before the decision felt safe.

## Why this differs from just "networking"

**Is this just a more elaborate way of saying "build relationships with important
people"?** Not quite — the exercise above is diagnostic, not aspirational. It's not about
deciding who to befriend; it's about accurately mapping _how decisions in your specific
org actually happen_, so that when you need something approved, you know whether the
correct move is the formal channel, an informal conversation, or — most often — both,
because the formal approval still has to happen even after the real evaluation occurs
informally first.

```mermaid
flowchart LR
    Real["Real evaluation happens\n(often informal)"] --> Formal["Formal approval\nstill has to be recorded"]
    Formal --> Done["Decision is official"]
```

The CI proposal's mistake wasn't skipping the formal chain — the formal approval still had
to happen, and did. The mistake was treating the formal chain as the _only_ step, when in
this org, for this category of decision, a real evaluation step existed upstream of it
entirely.

## This is a map, not a strategy — using it well matters

**Once you can see the informal network, what's the actual, legitimate use of that
information?** Two very different responses to the same map:

- **Legitimate**: when you have a real, well-reasoned proposal, get feedback from the
  people who actually shape decisions in that area early, the same way you'd seek out a
  domain expert's review before finalizing a design — this improves the proposal and
  surfaces objections before they become a stalled decision.
- **Not what this unit is teaching**: currying favor with influential people regardless of
  whether your actual case has merit, or using the map purely to route around people whose
  formal approval you're supposed to earn on the substance.

The map is the same either way — what separates the two is whether the underlying case is
actually sound, and whether the formal process still gets respected once the informal
evaluation is done.

"Currying favor" means trying to win someone over through flattery or
useful favors instead of through the strength of the case. Mapping
influence is legitimate when it helps you get better feedback and
respect the formal decision; it turns unhealthy when it becomes a way
to dodge the people or standards that should still evaluate the work.
