---
title: "L3 — Fixing the promo-code bug, and what immutability actually costs"
---

## The bug, in real code

**Here's the function behind the Scenario. What exactly makes it
unsafe to call for "just a preview"?**

```js
function applyPromoCodeMutating(cart, code) {
  if (code === "SAVE10") {
    cart.discountPercent = 10;
    cart.total = cart.total * 0.9;
  }
  return cart;
}
```

```js
const realCart = { items: ["book"], total: 50, discountPercent: 0 };

const previewMutating = applyPromoCodeMutating(realCart, "SAVE10");
// realCart.total is now 45 — permanently, whether or not
// the user goes on to actually apply the code
```

The function takes `cart` as a parameter, but never makes a copy of
it — every property assignment (`cart.discountPercent = ...`,
`cart.total = ...`) writes directly onto the object the caller
passed in. There is no "preview" here at all; there's only one cart,
and this function permanently changed it the moment it ran.

## The fix: return a new cart instead of mutating the one you were given

**What has to change to make a genuine, non-committal preview
possible?**

```js
function round2(n) {
  return Math.round(n * 100) / 100;
}

function applyPromoCodePure(cart, code) {
  if (code === "SAVE10") {
    return { ...cart, discountPercent: 10, total: round2(cart.total * 0.9) };
  }
  return { ...cart };
}
```

```js
const realCart2 = { items: ["book"], total: 50, discountPercent: 0 };

const previewPure = applyPromoCodePure(realCart2, "SAVE10");
// previewPure.total === 45
// realCart2.total is still 50 — completely untouched
```

`{ ...cart, discountPercent: 10, total: ... }` builds a brand-new
object: every property of `cart` is copied over, then the two changed
properties overwrite their copies. `cart` itself is never assigned
to. The preview button can now call this as many times as it wants —
with any code, real or mistyped — and the actual cart used at
checkout is unaffected until something explicitly decides to replace
it with the new version.

## Isolating the one real side effect: saving the order

**Once the discount math is pure, where does actually saving the
order to a database fit in?** In a thin function that does nothing
_but_ the side effect — it takes an already-computed value and stores
it, without also being responsible for calculating that value:

```js
function computeOrderSummary(cart) {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
  const tax = round2(subtotal * 0.08);
  return { subtotal: round2(subtotal), tax, total: round2(subtotal + tax) };
}

function saveOrderSummary(db, orderId, summary) {
  db.set(orderId, summary); // the one deliberate side effect
  return summary;
}
```

`computeOrderSummary` is pure — calling it twice with the same cart
gives the identical result both times, and it can be unit-tested with
zero setup. `saveOrderSummary` is impure on purpose, and it's the
_only_ place in this flow that touches the database — if the save
logic needs to change (a different database, added retry logic),
nothing about the discount or total math has to be touched, because
they were never entangled in the first place.

## What generalizes and what doesn't

The core lesson — a function that mutates a shared reference can
silently affect every other holder of that reference, and separating
pure calculation from isolated side effects avoids both that bug and
a whole class of "why did this change when I didn't touch it" bugs —
generalizes to any shared mutable state: a global config object, a
cached API response reused across requests, a UI component's props.
What's specific to this worked example: the exact fix (spread syntax
building a new object) is idiomatic for plain JS objects, but a
different language or a deeply nested structure needs a different
mechanical approach (persistent data structures, structural sharing
libraries) to stay efficient. **Try extending it yourself:** if
`cart.items` were a large array (thousands of line items) instead of
one book, would spreading the whole array on every discount preview
still be cheap enough to call on every keystroke, or does the fix
need something smarter than a full copy?

## What immutability actually costs

Immutability isn't free — copying an object or array on every change
does real, measurable work, and for large or deeply nested data
structures, naive copying (`{ ...bigObject }` on something with
thousands of entries, or deep-cloning a nested tree) can become a
genuine performance problem, not just a style preference. Production
systems that lean heavily on immutability typically reach for
**structural sharing** — data structures designed so that "changing"
one part only copies the small piece that actually changed, while
reusing (not copying) every unchanged part — rather than paying for a
full deep copy on every update.

## Failure modes

| Failure mode                                                           | What it gets wrong                                                                                                                                                |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mutating a parameter because "it's just a local variable"              | A parameter is a reference to the caller's object — mutating it mutates something the caller (and anyone else holding it) still owns                              |
| Assuming `{ ...obj }` deep-copies nested objects                       | Spread syntax only copies one level — a nested object or array inside `obj` is still shared by reference after the spread                                         |
| Mixing calculation and side effects in one function for convenience    | Makes the function harder to test, harder to reuse, and reintroduces the exact "did this also do something I didn't expect" risk immutability is meant to prevent |
| Treating immutability as a free correctness upgrade with no trade-offs | Naive full copies of large structures have a real performance cost — the right answer is often structural sharing, not "copy everything, always"                  |
