---
title: "L3 — Reproducing the bug, proving an invariant misses it, and building the test that catches it"
---

## Reproducing the buggy function, exactly

**Before testing anything — what did the developer's original three
tests actually look like, and why did all three pass despite the
bug?** Interior values, one per tier, nowhere near the boundary:

```js
// Tested with weight = 2 (tier 1), 6 (tier 2), 15 (tier 3) — all pass.
function shippingCostBuggy(weightKg) {
  if (weightKg < 0) throw new Error("weight cannot be negative");
  if (weightKg < 5) return 4.99;
  if (weightKg < 10) return 8.99;
  return 14.99;
}
```

```js
shippingCostBuggy(2); // 4.99 — correct
shippingCostBuggy(6); // 8.99 — correct
shippingCostBuggy(15); // 14.99 — correct
shippingCostBuggy(5); // 8.99 — WRONG, business rule says 5kg is tier 1 (4.99)
```

Every interior test passes because the bug isn't in the interior —
it's exactly at `weightKg === 5`, where `weightKg < 5` evaluates to
`false` and control falls through to the next tier.

## Testing the invariant first — and watching it miss the bug

**Before writing boundary tests — will the "shipping cost never
decreases as weight increases" invariant catch this bug on its own?**
Test it directly rather than assuming either way:

```js
function checkMonotonic(fn, maxWeight, step) {
  let prev = fn(0);
  for (let w = step; w <= maxWeight; w += step) {
    const cur = fn(w);
    if (cur < prev) return { violated: true, at: w, prev, cur };
    prev = cur;
  }
  return { violated: false };
}

checkMonotonic(shippingCostBuggy, 20, 0.5);
// { violated: false } — the invariant holds across the entire range,
// bug and all
```

This is the exact point L2 made: the boundary bug moves `weightKg === 5`
from `4.99` _up_ to `8.99` — the price still never _decreases_ as
weight increases, so monotonicity holds throughout, even at the
exact input where the function is wrong. **A real, shipped bug, and
a real, meaningful invariant, and the invariant genuinely does not
catch it** — not because the invariant was poorly written, but
because this particular bug isn't the kind of bug that specific
invariant is sensitive to.

## Building the test that does catch it

**Given that monotonicity doesn't catch this, what test would?**
Exactly the boundary-value set L2's flowchart describes — the
threshold itself, plus one step below and above:

```js
function shippingCost(weightKg) {
  if (weightKg < 0) throw new Error("weight cannot be negative");
  if (weightKg <= 5) return 4.99;
  if (weightKg <= 10) return 8.99;
  return 14.99;
}

// Boundary-value tests, not interior tests:
shippingCost(4.99); // 4.99 — just under tier 1's boundary
shippingCost(5.0); // 4.99 — exactly on the boundary (this is the bug's location)
shippingCost(5.01); // 8.99 — just over tier 1's boundary
shippingCost(9.99); // 8.99
shippingCost(10.0); // 8.99 — exactly on tier 2's boundary
shippingCost(10.01); // 14.99
```

Run against `shippingCostBuggy`, `shippingCostBuggy(5.0)` returns
`8.99` — the boundary test catches exactly what the monotonicity
invariant and the three interior tests both missed. Run against the
fixed `shippingCost`, all six values return the business-rule-correct
tier.

## What else the boundary-value process catches

**The same process (identify equivalence classes, test boundaries,
test one step past) applies beyond pricing tiers — what does it find
here?**

```js
// Zero and negative — a different edge-case category from L2's table
try {
  shippingCost(-0.01);
} catch (e) {
  // throws "weight cannot be negative" — correct, verified
}
shippingCost(0); // 4.99 — zero is valid, falls in tier 1, verified correct
```

Both of these pass on the fixed function, but they're testing a
_different_ concern than the tier boundaries — they check whether
the function's assumed domain (non-negative weight) is actually
enforced, not whether the tier thresholds are correct. A complete
test suite needs both categories, because they catch different bugs:
tier-boundary tests wouldn't have caught a missing negative-weight
check, and a negative-weight check wouldn't have caught the `5.0`
tier bug.

## What generalizes and what doesn't

The process — partition the input space, find the boundaries between
partitions, test each boundary plus one step on each side, separately
check zero/negative/extreme values against the function's assumed
domain — generalizes to any function with distinct behavior regions:
date-range logic, discount tiers, pagination bounds, retry-count
limits. What's specific to this worked example: a three-tier pricing
function has exactly two internal boundaries, small and easy to
enumerate by hand; a function with many more regions (a tax bracket
calculator with 7 brackets, say) has more boundaries to find, and
finding them systematically (reading the actual conditionals, not
guessing) matters more as the count grows. **Try extending it
yourself:** if this shipping function later grew a fourth tier for
weights over 50kg with a per-kg surcharge instead of a flat rate,
would the existing boundary tests (at 5 and 10) still be sufficient,
or does a new kind of boundary — a _rate change_, not just a _price
change_ — need a different kind of invariant test to verify (say,
checking that the price at 50.01kg is only marginally more than at
50kg, not a large jump)?

## Failure modes

| Failure mode                                                                               | What it gets wrong                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assuming an invariant passing proves the boundary logic is correct                         | Monotonicity holding says nothing about whether values are assigned to the _correct_ tier, only that prices trend the right direction overall                                            |
| Testing only the exact boundary value, not one step to either side                         | A `<` vs. `<=` bug is only visible by comparing behavior across the boundary — testing `5.0` alone can pass by coincidence if the surrounding logic happens to be symmetric              |
| Treating boundary-value analysis as a replacement for invariant checks                     | Boundary tests catch off-by-one errors; they don't catch a logic error that's wrong across an entire equivalence class rather than just at its edge — both categories of test are needed |
| Choosing "realistic" test data instead of deliberately picking boundary and extreme values | Realistic values cluster in the interior of ranges by definition — the inputs most likely to reveal a bug are the ones realistic data naturally avoids                                   |
