---
title: "L3 — Reproducing both directions: a bug review catches, and a bug only CI catches"
---

## The discount function, and the tests that all pass

**Before anything changes — what does `applyDiscount` do, and what
does its existing test suite actually verify?**

```js
function round2(n) {
  return Math.round(n * 100) / 100;
}

function applyDiscount(price, discountPercent) {
  return round2(price * (1 - discountPercent / 100));
}
```

```js
// The existing test suite — every single one passes on this version
applyDiscount(100, 10); // 90
applyDiscount(100, 0); // 100
```

Both tests pass. Both are correct, real tests of real behavior. The
function has never been asked to handle a discount over 100% because,
until this PR, nothing in the codebase ever combined two discounts —
there was no scenario to test, so nobody wrote one.

## The PR that makes a new scenario possible — and CI's blind spot

**What does the new PR actually add, and why does CI have nothing to
say about it?**

```js
function computeCombinedDiscount(memberPercent, couponPercent) {
  return memberPercent + couponPercent;
}
```

```js
const combined = computeCombinedDiscount(60, 50); // 110
applyDiscount(100, combined); // -10 — a negative price
```

CI runs the full existing suite against this PR. `applyDiscount(100, 10)`
still returns `90`. `applyDiscount(100, 0)` still returns `100`. Both
pass — nothing regressed. **CI is not wrong, and it's not
malfunctioning.** It's checking exactly what it was told to check,
and the 110%-combined-discount scenario simply isn't in that set —
this PR is what makes that scenario reachable for the first time.

## The question a diff-only reviewer asks

**What did the reviewer actually do that CI structurally couldn't?**
Not re-run the tests — read the _new_ function and asked what its
output range implies when combined with the existing one:

> Reviewer: "`computeCombinedDiscount` doesn't cap anywhere — what
> happens if `applyDiscount` gets called with something over 100
> from this?"

Verifying the concern directly:

```js
applyDiscount(100, computeCombinedDiscount(60, 50)); // -10
```

**The fix**, and its own verification:

```js
function applyDiscountFixed(price, discountPercent) {
  const clamped = Math.min(100, Math.max(0, discountPercent));
  return round2(price * (1 - clamped / 100));
}
```

```js
applyDiscountFixed(100, computeCombinedDiscount(60, 50)); // 0, not -10
applyDiscountFixed(100, 10); // 90 — normal case still correct
applyDiscountFixed(50, -20); // 50 — a negative discount doesn't inflate the price either
```

The reviewer's question turned an untested scenario into a bounded,
verified one — and the fix (`Math.min`/`Math.max` clamping) is exactly
the kind of thing a test suite can now also verify, once someone
thought to ask the question that revealed it needed testing.

## The reverse case: what CI catches that a diff-only review misses

**Is review strictly better than CI, then?** No — here's the opposite
failure, from the same codebase. A later PR renames a shared helper:

```js
// Before this PR, in utils.js:
function formatCurrency(amount) {
  return "$" + amount.toFixed(2);
}

// This PR renames it, in the same file:
function formatPrice(amount) {
  return "$" + amount.toFixed(2);
}
```

**The diff the reviewer sees** is small and clean — one function
renamed, its one obvious call site in the same file updated to match.
**What the diff doesn't show:** a completely different file,
`invoicing.js`, still calls the old name:

```js
// invoicing.js — not touched by this PR, not shown in the diff
function invoiceTotal(amount) {
  return formatCurrency(amount); // still the old name
}
```

A reviewer reading only the changed lines in the PR's diff has no
reason to know `invoicing.js` exists, let alone that it calls the
function being renamed — **but CI's full test suite runs the entire
codebase, including `invoicing.js`'s tests, and `formatCurrency is
not defined` fails immediately.** This is precisely the territory
where CI's advantage over review is real: exhaustively re-checking
everything, every time, including files the diff never shows.

## What generalizes and what doesn't

The core division — automated checks are exhaustive but blind to
anything untested, human review can catch new scenarios but only as
carefully as someone actually looks — generalizes to any codebase
with both CI and review. What's specific to this worked example: a
discount-stacking bug and a cross-file rename are two particular
instances of "review catches what CI can't" and "CI catches what
review can't" — the same two failure directions show up as different
concrete bugs in every codebase (an off-by-one only visible by
reasoning through the logic; a broken import only visible by actually
building the whole project). **Try extending it yourself:** what
category of bug would neither CI _nor_ a normal diff-focused review
catch — something that only shows up once the change is actually
running in production, under real traffic or real data? What would a
team need beyond PRs and CI to catch that category too?

## Failure modes

| Failure mode                                                                      | What it gets wrong                                                                                                                                                                                    |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assuming a green CI run means the reviewer can skim and approve                   | CI's coverage and review's coverage are different territory — a passing suite says nothing about the untested scenario a new PR just made reachable                                                   |
| A reviewer re-checking things CI already verified instead of asking new questions | Spends the reviewer's limited attention on already-covered territory instead of the genuinely new scenarios only a human can notice                                                                   |
| Assuming a small, clean-looking diff can't have broken something elsewhere        | A rename, a removed field, or a changed return type can break call sites the diff never shows — this is exactly what CI's full-suite run is for                                                       |
| Treating this unit's two examples as the only two categories of catchable bug     | Some bugs (real production load, real user data, timing-dependent races) aren't reliably caught by either CI or review — the extend-it question above is a real, open gap in this two-mechanism model |
