---
title: "L3 — Rewriting the Battle Mage problem: inheritance first, then composition"
---

## The inheritance version, and exactly where it breaks

```js
class Character {
  constructor(name) {
    this.name = name;
  }
}

class Warrior extends Character {
  attack() {
    return `${this.name} swings a sword for 10 damage`;
  }
}

class Mage extends Character {
  attack() {
    return `${this.name} casts a fireball for 15 damage`;
  }
}

const kade = new Warrior("Kade");
const zara = new Mage("Zara");
console.log(kade.attack());
console.log(zara.attack());
```

This works cleanly for exactly two character types with exactly one
attack style each. The moment "Battle Mage" (melee AND magic) is
requested, there's no clean way to write `class BattleMage extends
???` — JavaScript classes support only one `extends` clause. The
usual patches — copy-pasting `Mage`'s attack logic into a
`Warrior`-derived class, or vice versa — duplicate code and create two
sources of truth for what should be one spell-casting behavior.

## The composition version: behaviors as data, not inheritance

```js
function walk() {
  return "walks across the ground";
}
function fly() {
  return "flies through the air";
}
function swim() {
  return "swims through the water";
}

function meleeAttack() {
  return "swings a sword for 10 damage";
}
function rangedAttack() {
  return "fires an arrow for 7 damage";
}
function magicAttack() {
  return "casts a fireball for 15 damage";
}

class GameCharacter {
  constructor(name, moveBehaviors, attackBehaviors) {
    this.name = name;
    this.moveBehaviors = moveBehaviors;
    this.attackBehaviors = attackBehaviors;
  }
  move() {
    return this.moveBehaviors.map((b) => `${this.name} ${b()}`);
  }
  attack() {
    return this.attackBehaviors.map((b) => `${this.name} ${b()}`);
  }
}
```

`GameCharacter` no longer hardcodes what movement or attack looks
like — it holds a _list_ of behaviors for each, injected at
construction time. Nothing about this class needed to change to
support a character with more than one attack style.

## Building the Battle Mage — no new class required

```js
const battleMage = new GameCharacter("Rin", [walk], [meleeAttack, magicAttack]);
console.log(battleMage.attack());
// [ "Rin swings a sword for 10 damage", "Rin casts a fireball for 15 damage" ]
```

Verified: `battleMage.attack()` returns _both_ attacks — the exact
requirement that broke the inheritance version, solved by passing an
array with two behaviors instead of one, with zero new classes
written. The original two character types still work unchanged:

```js
const kade = new GameCharacter("Kade", [walk], [meleeAttack]);
const zara = new GameCharacter("Zara", [fly], [magicAttack]);
console.log(kade.attack());
// [ "Kade swings a sword for 10 damage" ]
console.log(zara.attack());
// [ "Zara casts a fireball for 15 damage" ]
```

## Confirming the combinatorial-cost gap from L2 with real counts

```js
const moveBehaviors = [walk, fly, swim];
const attackBehaviors = [meleeAttack, rangedAttack, magicAttack];

console.log(
  "composition — components needed:",
  moveBehaviors.length + attackBehaviors.length,
);
// 6
console.log(
  "inheritance-per-combo — subclasses needed:",
  moveBehaviors.length * attackBehaviors.length,
);
// 9
```

Verified: at 3 movement styles and 3 attack styles, composition needs
6 components total; a design that modeled every combination as its
own subclass (`FlyingMage`, `SwimmingWarrior`, `WalkingMage`, and so
on) would need 9 — and as L2's chart showed, that gap widens
multiplicatively as more styles get added, while composition's cost
stays additive.

## What this rewrite does and doesn't prove

**Does this mean the `Character` base class from the inheritance
version was a mistake to write in the first place?** Not necessarily
— if the game genuinely only ever needed exactly one attack style per
character, the inheritance version would have been simpler and
perfectly fine. What the rewrite proves is narrower: **once a second
independent axis of variation (attack style combining with itself, or
movement combining with attack) shows up, composition absorbs it
without new classes, while single inheritance structurally cannot.**
The lesson isn't "composition is always better" — it's "match the
tool to whether there's one axis or more than one."

**Try extending it yourself:** suppose a third axis shows up —
characters can also have a defense style (`block`, `dodge`, `parry`)
that combines independently with both movement and attack. Using the
composition version's constructor shape, what would the `GameCharacter`
class need to add to support this, and would the inheritance version
have been able to add it at all without a fourth explosion of subclasses?

## Failure modes

| Failure mode                                                                            | What it gets wrong                                                                                                                                                                            |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Choosing composition for every class, even single-axis ones                             | The account example from L2 doesn't need this indirection — composition solves a specific problem (multiple independent axes), not a general one                                              |
| Patching a broken inheritance hierarchy with a deeper hierarchy                         | Adding `BattleMageWarrior`, `FlyingBattleMage`, and so on treats a structural problem as if more branches would fix it — the tree shape itself is the constraint                              |
| Assuming composition means giving up all shared behavior                                | `GameCharacter` still has one shared class — composition changes how variation is modeled, not whether any code is shared at all                                                              |
| Not noticing a second axis of variation until it's already caused a hierarchy explosion | The Battle Mage request was the signal that "attack style" wasn't the only axis — catching this earlier (during initial design) avoids the costly rewrite entirely                            |
| Treating the strategy pattern as the only form composition can take                     | Injected behavior functions are one common shape; composition also covers things like a class holding a reference to another object it delegates work to, without any shared interface at all |
