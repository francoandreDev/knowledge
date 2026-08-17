---
title: "L2 — A spectrum of delegation levels, and how to choose one deliberately"
---

## The spectrum, made explicit

**If "take care of it" and "do exactly this" are two ends of a spectrum, what are the
useful stops in between?** A practical way to break it down:

```mermaid
flowchart LR
    A["1. Do exactly\nwhat I say"] --> B["2. Research options,\nI decide"]
    B --> C["3. Recommend a decision,\nI approve"]
    C --> D["4. Decide, but tell\nme before acting"]
    D --> E["5. Decide and act,\ntell me after"]
    E --> F["6. Full autonomy,\nno need to report"]
```

The CI-vendor incident's mismatch was a gap of two full levels: the manager was operating
at **Level 3** ("recommend a decision, I approve"), the report was operating at **Level 5**
("decide and act, tell me after"). Neither level is wrong in the abstract — a two-level
gap on a reversible, low-stakes task might never cause a problem. On a one-year vendor
contract, it did.

## Choosing a level isn't a personality trait — it's two questions

**Given six levels to choose from, what should actually decide which one fits a specific
task?** Two questions, asked together, not a fixed policy applied to every delegation:

1. **How reversible is a wrong decision, and how expensive is undoing it?** A vendor
   contract with a cancellation fee and a year-long commitment sits very differently on
   the spectrum than a first draft of a Slack message, which costs nothing to revise.
2. **How much relevant context does the delegate already have for THIS specific
   decision?** A report who's evaluated CI vendors twice before at a previous job brings
   real context; a report doing it for the first time doesn't — and the same person can
   reasonably sit at different levels for different tasks, or even for the same task at
   different points in their tenure.

```mermaid
flowchart TD
    Q1{"How reversible/cheap\nis a wrong call?"}
    Q1 -- "Low stakes,\neasy to undo" --> HighAutonomy["Lean toward levels 4-6"]
    Q1 -- "High stakes,\nhard to undo" --> Q2{"How much relevant\ncontext does the\ndelegate already have?"}
    Q2 -- "Strong context" --> Mid["Levels 3-4:\nrecommend, or decide-then-tell"]
    Q2 -- "Limited context" --> Low["Levels 1-2:\ntell, or research-only"]
```

Notice the CI-vendor incident again: a one-year contract is genuinely high-stakes and hard
to reverse, and the report was doing this specific evaluation for the first time — both
factors point toward Level 2 or 3, not the Level 5 the report assumed by default.

## "Trust but verify" as a specific, named check-in point

**If naming a level out loud is the fix, what does that sentence actually sound like in
practice?** Not a vague promise to "check in sometimes" — a specific, concrete point:

> "Go ahead and research CI vendor options — loop me in once you've got it narrowed to two
> or three finalists, before you sign anything. I want to weigh in on the final call,
> but I don't need to be involved in the research itself."

This single sentence does three things at once: it states the level (Level 3, roughly —
research plus a recommendation, not full autonomy), it names the specific trigger for the
check-in (narrowed to finalists, before signing), and it explicitly frees the delegate from
needing approval on the parts that don't matter (which vendors to even consider). This is
what "trust but verify" looks like as an actual sentence, rather than an abstract
management principle — verification is scoped to one specific, high-leverage moment, not
spread across every step.

## Why the level can (and should) change over time

The same task, delegated to the same person, doesn't have to stay at the same level
forever. A report who nails a Level 3 delegation (bringing a strong, well-reasoned
recommendation) earns a Level 4 or 5 next time on a similar task — the level is a living
assessment of demonstrated context for _this kind of decision_, not a fixed rating of the
person overall. Conversely, a mismatch like the incident above is information too: it
suggests the level needs to be set more explicitly next time, not that the report can
never be trusted with vendor decisions again.
