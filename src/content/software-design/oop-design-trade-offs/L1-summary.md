---
title: "L1 — When should I use inheritance vs. composition? (OOP design trade-offs)"
---

import Scenario from "../../../components/Scenario.astro";

<Scenario label="One new character type breaks a clean-looking class hierarchy">
  <Fragment slot="facts">
    <div class="not-prose flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
      <div class="flex items-center gap-1.5"><span>🏗️</span> <strong>Hierarchy</strong> — Warrior and Mage each extend a Character base class, one attack style each</div>
      <div class="flex items-center gap-1.5"><span>🧙‍♂️</span> <strong>New request</strong> — a "Battle Mage" who fights in melee AND casts spells</div>
      <div class="flex items-center gap-1.5"><span>🚧</span> <strong>Problem</strong> — single inheritance means picking exactly one parent to extend</div>
    </div>
  </Fragment>

**A game has a clean-looking class hierarchy: `Character` is the
base class, `Warrior` and `Mage` each extend it with their own
`attack()` method. It works fine — until design asks for a "Battle
Mage" who fights in melee AND casts spells. Should `BattleMage`
extend `Warrior` or `Mage`? Either choice means duplicating the other
class's logic, since a class can only extend one parent. What went
wrong, and could it have been avoided from the start?**

The hierarchy assumed every character would need exactly one attack
style, forever. The moment a real requirement needed two styles at
once, the "is-a" relationship inheritance is built around — a Battle
Mage _is a_ Warrior, or _is a_ Mage, but which one? — stopped having a
clean answer, because the real relationship was never "is-a" at all.

</Scenario>

## The shape of the problem

- **Inheritance** models an "is-a" relationship: a subclass extends a
  parent class, inheriting (and optionally overriding) its behavior.
  It works cleanly when a category genuinely has a single, stable
  axis of variation.
- **Composition** models a "has-a" relationship: an object is built
  by combining smaller, independent pieces — each piece handling one
  concern, assembled together rather than inherited.
- The failure isn't that inheritance is bad — it's that inheritance
  commits early to a _single_ dimension of variation (one parent
  class), while composition lets multiple independent dimensions
  (movement style, attack style, and so on) combine freely without
  needing a new class for every combination.

## Key terms

- **Inheritance** — a subclass extends a parent class, reusing and
  optionally overriding its behavior; models "is-a."
- **Composition** — an object is assembled from smaller, independent
  parts, each injected or attached rather than inherited; models
  "has-a."
- **Combinatorial explosion** — when two or more independent axes of
  variation (like movement style and attack style) are each modeled
  as separate class hierarchies, the number of classes needed to
  cover every combination grows multiplicatively, not additively.
- **Strategy pattern** — a common way to apply composition: instead
  of hardcoding a behavior inside a class, the behavior itself is
  passed in as an interchangeable object or function.

## What this unit covers

L2 works through why inheritance and composition aren't
interchangeable defaults — each fits a different shape of variation —
and introduces the combinatorial-explosion problem that composition
solves. L3 implements the Battle Mage scenario both ways in real
code: a rigid inheritance hierarchy that breaks on the new
requirement, and a composition-based rewrite using the strategy
pattern that absorbs it without a single new class.
