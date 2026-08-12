---
title: "L3 — The same checkout feature, tested correctly at three different levels"
---

## The feature: applying a discount code at checkout

Three real pieces of behavior are involved: a pure calculation (does the discount math work), a real integration (does the discount-code API actually validate codes the way the frontend expects), and a whole user flow (can a real user apply a code and complete checkout). Each belongs at a different level, and testing it at the wrong level either wastes effort or misses the actual risk.

## Unit level: the pure calculation

```js
// discount.mjs — pure logic, no I/O, no dependencies
function applyDiscount(subtotal, discountPercent) {
  return subtotal - subtotal * (discountPercent / 100);
}
```

```js
// discount.test.mjs
import { describe, it, expect } from "some-test-runner";
import { applyDiscount } from "./discount.mjs";

describe("applyDiscount", () => {
  it("applies a percentage discount correctly", () => {
    expect(applyDiscount(100, 20)).toBe(80);
  });
  it("handles 0% discount", () => {
    expect(applyDiscount(50, 0)).toBe(50);
  });
});
```

This runs in milliseconds, requires no server, no database, no network — exactly right for verifying pure math, and exactly the wrong tool for verifying whether the _real_ discount-code API actually returns a valid percentage for a given code, which is a completely different question this test can't and shouldn't try to answer.

## Integration level: the real API contract

```js
// checkout-api.integration.test.mjs — hits a REAL test database and a
// REAL running instance of the discount service, not a mock of either.
import { describe, it, expect } from "some-test-runner";
import { validateDiscountCode } from "./discount-api-client.mjs";
import { startTestDiscountService, seedTestCode } from "./test-helpers.mjs";

describe("discount code API integration", () => {
  let service;
  beforeAll(async () => {
    service = await startTestDiscountService();
  });
  afterAll(async () => {
    await service.stop();
  });

  it("returns the actual discount percent for a valid, seeded code", async () => {
    await seedTestCode(service, "SAVE20", 20);
    const result = await validateDiscountCode("SAVE20");
    expect(result).toEqual({ valid: true, percent: 20 });
  });

  it("returns invalid for an unrecognized code", async () => {
    const result = await validateDiscountCode("NOT-A-REAL-CODE");
    expect(result).toEqual({ valid: false, percent: null });
  });
});
```

This is slower (a real service has to actually start) and tests something a unit test structurally can't: whether the frontend's expectation of the API's response shape (`{ valid, percent }`) actually matches what the real service returns — exactly the class of bug that a mocked-out unit test would never catch, because the mock would just return whatever shape was assumed when the mock was written.

## E2E level: the whole flow, sparingly

```js
// checkout.e2e.test.mjs — drives a real browser against a real
// (staging) deployment, illustrative of the shape (not runnable in
// this sandbox, which has no real browser to drive).
test("a user can apply a discount code and complete checkout", async ({
  page,
}) => {
  await page.goto("/cart");
  await page.fill("[data-testid=discount-code]", "SAVE20");
  await page.click("[data-testid=apply-code]");
  await expect(page.locator("[data-testid=total]")).toHaveText("$80.00");
  await page.click("[data-testid=complete-checkout]");
  await expect(page).toHaveURL(/\/order-confirmation/);
});
```

This is the slowest and most fragile of the three (a real browser, a real page render, real network calls) — deliberately reserved for confirming the _whole_ flow works, the way a real user experiences it, rather than trying to enumerate every discount-math edge case here (that's what the unit tests are for) or every API response shape (that's the integration tests' job).

## What this division actually buys

If the discount math has a bug, the unit test fails immediately, in milliseconds, pointing at the exact broken function. If the API's response shape changes without the frontend being updated, the integration test fails, pointing at the actual contract mismatch. If either passes but the browser can't render the applied discount because of an unrelated CSS or state-management bug, the e2e test is what catches that — and only that layer needs to catch it, because the other two would happily pass while that specific class of bug ships.

## Failure modes

- **Writing an e2e test for something a unit test could verify.** A discount-math edge case (negative subtotal, discount over 100%) tested only via a full e2e checkout flow inherits all of e2e's cost (slow, fragile) for a question that has nothing to do with browsers, networks, or real services.
- **Mocking so heavily in an "integration" test that it stops testing any real integration.** A test that mocks out the discount service entirely and just checks that the frontend calls a function with the right arguments is a unit test wearing an integration test's name — it can't catch a real contract mismatch, because nothing real is actually being contacted.
- **Treating a flaky e2e test as evidence of a real bug without investigating.** Per L2, e2e tests have the highest fragility — a failure needs actual triage (was this a real regression, or a timing/environment flake) before treating it as equivalent in confidence to a failing unit test, which almost never fails for reasons unrelated to the code it's testing.
- **Skipping integration tests because "we have unit tests and e2e tests, that should cover it."** The middle layer specifically catches contract mismatches between real components that neither extreme catches well — unit tests can't see across a real boundary (they mock it away), and e2e tests catch a broken contract but bury the specific cause under everything else the full flow also exercises.
