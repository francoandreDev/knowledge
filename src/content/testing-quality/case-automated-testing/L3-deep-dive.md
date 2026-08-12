---
title: "L3 — A shared function, a silent regression, and the test that would have caught it"
---

## The setup: one function, two unrelated call sites

```js
// pricing.mjs — used by both the checkout page and the admin refund tool
function applyDiscount(price, discountPercent) {
  return price - price * (discountPercent / 100);
}

// checkout.mjs
const total = applyDiscount(100, 20); // $100 item, 20% off -> $80

// refunds.mjs
const refundAmount = applyDiscount(originalPrice, restockingFeePercent);
```

Both call sites were manually verified when they were first built — checkout was clicked through in a browser, refunds were tested with a sample order. Both checks passed. Both checks are now permanently in the past.

## The change, and what a manual re-check would (and wouldn't) catch

Months later, a developer working exclusively on the checkout page notices `applyDiscount` doesn't handle discounts over 100% gracefully (a data-entry bug elsewhere was producing `discountPercent: 150`, resulting in a negative price) and "fixes" it:

```js
// pricing.mjs — the "fix," from the checkout developer's point of view
function applyDiscount(price, discountPercent) {
  const clamped = Math.min(discountPercent, 100);
  return price - price * (clamped / 100);
}
```

The developer manually re-clicks through checkout with a normal 20% discount and a deliberately broken 150% discount — both now look correct. They ship it. Nobody manually re-checks the refund tool, because nothing about this change _looked_ related to refunds — it's in a completely different part of the product, and the developer making the change had no reason to think about it.

But the refund tool used `restockingFeePercent` values that could legitimately exceed 100 in a specific case (a partial refund with an added penalty modeled as a percentage over 100, by design, in that codebase's existing logic) — the clamp silently breaks a currently-correct, intentional behavior in a file the developer never opened.

## The test that catches it, before shipping

```js
// pricing.test.mjs
import { describe, it, expect } from "some-test-runner";
import { applyDiscount } from "./pricing.mjs";

describe("applyDiscount", () => {
  it("applies a normal discount", () => {
    expect(applyDiscount(100, 20)).toBe(80);
  });

  it("supports discountPercent above 100 for the refund tool's penalty modeling", () => {
    // This test exists specifically BECAUSE the refund tool depends on
    // this behavior — a manual checkout re-check would never think to
    // exercise this case, since it has nothing to do with checkout.
    expect(applyDiscount(100, 150)).toBe(-50);
  });
});
```

Running this suite after the "fix" fails the second test immediately, with the exact function and expected-vs-actual value named — not "something's wrong with refunds," discovered days later by a confused support ticket, but "this specific assertion, in this specific file, broke, right now, before it shipped." The test doesn't require the checkout developer to have known refunds depended on this behavior — it only requires that someone, at some point, wrote down the dependency once, and the suite remembers it forever afterward.

## Failure modes

- **Writing tests that assert nothing meaningful.** `expect(applyDiscount(100, 20)).toBe(applyDiscount(100, 20))` passes trivially and provides zero protection — it's testing the function against itself, not against a known-correct expected value. A test's value comes entirely from the expected value being independently correct, not from the test merely existing.
- **Testing implementation details instead of behavior.** A test that asserts `applyDiscount` internally calls a specific helper function, rather than asserting its actual input/output behavior, breaks every time the implementation is refactored even when the behavior is unchanged — this trains people to distrust or delete failing tests rather than trust them, which defeats the entire purpose.
- **Flaky tests that fail intermittently for reasons unrelated to correctness** (timing assumptions, shared mutable state between tests, relying on real network calls) erode exactly the trust the "automated tests are repeatable" argument depends on — a test suite people have learned to re-run until it passes is no longer providing a real signal, it's theater.
- **Only testing the case you already know about.** The refund tool's `discountPercent: 150` case only got a test because someone already knew it mattered — automated testing doesn't discover which behaviors matter on its own; it makes a known-important behavior permanently checked once someone identifies it. This is why testing pairs with the audience-awareness-style discipline of actually understanding a function's full set of callers before "fixing" it, not a replacement for that understanding.
