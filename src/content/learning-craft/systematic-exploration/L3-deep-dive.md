---
title: "L3 — Tracing the discount bug: entry point, execution, tests, fix"
---

## Step 1: finding the entry point

The bug report says "applying a discount code twice." The first
concrete question: where does an "apply a discount" request enter
this codebase? Searching for the route (not the business logic)
finds it fast:

```js
// routes/orders.js
const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/ordersController");

router.post("/orders/:id/apply-discount", ordersController.applyDiscount);

module.exports = router;
```

This is the entry point — one line tells us the HTTP path, the
method, and which controller function actually handles it. No need
yet to read `models/`, `middleware/`, or any other unrelated route in
this file.

## Step 2: tracing execution through the layers

Following the one function this route calls, layer by layer:

```js
// controllers/ordersController.js
const orderService = require("../services/orderService");
const orders = require("../data/ordersStore");

function applyDiscount(req, res) {
  const order = orders.findById(req.params.id);
  try {
    const updated = orderService.applyDiscount(order, req.body.code);
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { applyDiscount };
```

```js
// services/orderService.js
const discountCodes = { SAVE10: 0.1, SAVE20: 0.2 };

function applyDiscount(order, code) {
  const rate = discountCodes[code];
  if (rate === undefined) throw new Error("Unknown discount code");
  order.appliedDiscounts.push(code);
  order.total = order.total * (1 - rate);
  return order;
}

module.exports = { applyDiscount };
```

Three layers, three responsibilities: the route maps a URL to a
function, the controller translates HTTP request/response into plain
function calls, the service holds the actual business logic. **The
most relevant place to inspect is `orderService.applyDiscount` — it's
the only layer that touches `order.total` or `appliedDiscounts` at all**,
which tracing just confirmed rather than assumed.

## Step 3: reading the existing tests before touching anything

Before writing a fix, the existing test file for this service:

```js
// services/orderService.test.js
const { applyDiscount } = require("./orderService");

test("applies a valid discount code", () => {
  const order = { total: 100, appliedDiscounts: [] };
  const result = applyDiscount(order, "SAVE10");
  expect(result.total).toBe(90);
  expect(result.appliedDiscounts).toEqual(["SAVE10"]);
});

test("rejects an unknown discount code", () => {
  const order = { total: 100, appliedDiscounts: [] };
  expect(() => applyDiscount(order, "FAKE")).toThrow("Unknown discount code");
});
```

Neither test covers applying the same code twice — that's the gap
that let the bug ship. But these tests still teach something
essential: **this codebase's established pattern for rejecting bad
input is to throw an `Error` with a specific message, checked before
any mutation happens.** A fix that follows this same pattern will fit
the codebase; a fix that, say, silently ignores the second call or
returns `null` would work but clash with everything else in the file.

## Step 4: confirming the bug, then writing a fix that matches the pattern

Running the current code against the exact scenario from the bug
report confirms it:

```js
const order = { total: 100, appliedDiscounts: [] };
applyDiscount(order, "SAVE10");
applyDiscount(order, "SAVE10");
console.log(order.total);
// 81 — discounted twice: 100 * 0.9 * 0.9
```

The fix, following the exact validate-before-mutate, throw-with-message
pattern the tests already established:

```js
function applyDiscount(order, code) {
  const rate = discountCodes[code];
  if (rate === undefined) throw new Error("Unknown discount code");
  if (order.appliedDiscounts.includes(code)) {
    throw new Error("Discount already applied");
  }
  order.appliedDiscounts.push(code);
  order.total = order.total * (1 - rate);
  return order;
}
```

Verified against the same scenario:

```js
const order = { total: 100, appliedDiscounts: [] };
applyDiscount(order, "SAVE10");
try {
  applyDiscount(order, "SAVE10");
} catch (err) {
  console.log(err.message, order.total);
}
// "Discount already applied" 90 — total stayed at the single-discount value
```

## Step 5: adding the missing regression test

The old test file had two tests. The fix should add the third case that
was missing, so this same bug cannot silently come back:

```js
test("rejects applying the same discount code twice", () => {
  const order = { total: 100, appliedDiscounts: [] };
  applyDiscount(order, "SAVE10");

  expect(() => applyDiscount(order, "SAVE10")).toThrow(
    "Discount already applied",
  );
  expect(order.total).toBe(90);
  expect(order.appliedDiscounts).toEqual(["SAVE10"]);
});
```

The last two expectations matter because they prove rejection happened
before mutation: the total stayed at the single-discount value, and the
code was not pushed into `appliedDiscounts` a second time. In JavaScript,
`.includes(code)` means "is this value already in the array?", `.push()`
adds a value to the array, and `throw new Error(...)` stops the operation
with a visible failure instead of silently continuing.

Total time spent: reading one route registration, two small files, and a
small focused test file — not the whole repository.

## What this trace does and doesn't prove

**Would this same three-step approach (entry point, trace, tests)
work for a bug that isn't triggered by an HTTP request — say, a
scheduled job that runs every night?** The specific entry point looks
different (a cron registration or a queue consumer instead of a route
file), but the _procedure_ generalizes: find wherever that trigger
first reaches application code, trace what it calls in order, and
read whatever tests exist for the layer where the bug is suspected to
live. What doesn't generalize is the assumption that tests will
always cover the gap — here, they didn't, and part of the fix is
adding a new test for the case that was missing, not just trusting
the old suite was already complete.

**Try extending it yourself:** suppose the bug report had instead
been "applying an unknown discount code crashes the server with a 500
error instead of returning a clean 400." Which of the three files
above would you expect the actual fault to be in, and would tracing
alone be enough to find it, or would you also need to read the tests?

## Failure modes

| Failure mode                                                                                                                        | What it gets wrong                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reading `models/` or unrelated routes before finding the actual entry point                                                         | Wastes time on code that may never appear in the trace for this specific bug                                                                      |
| Fixing the bug without reading the existing tests first                                                                             | Risks writing a fix that works but doesn't match the codebase's established error-handling pattern, creating inconsistency for the next person    |
| Assuming the tests already cover every case, including the one that's broken                                                        | If the bug were already tested, it likely wouldn't have shipped — an untested gap is often exactly where a real bug hides                         |
| Trusting a stale comment over what the test or the code actually does                                                               | Comments don't run and don't fail when wrong; a test or the traced execution path is closer to ground truth                                       |
| Stopping the trace at the first layer that "looks related" without confirming it's the one that actually mutates the relevant state | The controller layer here handles HTTP concerns, not the discount logic itself — fixing at the wrong layer wouldn't have addressed the actual bug |
