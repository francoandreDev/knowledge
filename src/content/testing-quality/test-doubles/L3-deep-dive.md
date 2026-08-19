---
title: "L3 — Adding seams, then testing the same function three different ways"
---

## Adding a seam for time

The original, untestable version calls `Date.now()` directly:

```js
function isTrialExpiredBroken(user) {
  return Date.now() > user.trialEndsAt;
}
```

Adding a seam means accepting the clock as a parameter instead,
defaulting to the real clock in production so callers don't have to
change:

```js
function isTrialExpired(user, clock = () => Date.now()) {
  return clock() > user.trialEndsAt;
}
```

Nothing about production behavior changed — calling
`isTrialExpired(user)` with no second argument still uses the real
system clock. What changed is that a test can now pass a **stub
clock** instead:

```js
const fixedClock = () => new Date("2026-06-15T00:00:00Z").getTime();

const expiredUser = { trialEndsAt: new Date("2026-06-01T00:00:00Z").getTime() };
const activeUser = { trialEndsAt: new Date("2026-07-01T00:00:00Z").getTime() };

console.log(isTrialExpired(expiredUser, fixedClock)); // true
console.log(isTrialExpired(activeUser, fixedClock)); // false
```

Verified: with the stub clock fixed at June 15th, a trial ending June
1st reads as expired and one ending July 1st doesn't — and this result
is now permanent. It will never flip based on what day the test suite
actually runs, because the seam removed the dependency on the real
clock entirely during the test.

## Adding a seam for an external service, then using a fake

A function that refunds expired trials also depends on a real payment
gateway — another dependency with no seam yet:

```js
function refundExpiredTrials(users, clock, paymentGateway) {
  const refunded = [];
  for (const user of users) {
    if (isTrialExpired(user, clock) && user.pendingChargeId) {
      paymentGateway.refund(user.pendingChargeId);
      refunded.push(user.id);
    }
  }
  return refunded;
}
```

The `paymentGateway` parameter is the seam. In production, this would
be an object wrapping real API calls; in a test, a **fake** — a real,
working, simplified implementation — stands in for it:

```js
function createFakePaymentGateway() {
  const refunds = [];
  return {
    refund(chargeId) {
      refunds.push(chargeId);
      return { success: true, chargeId };
    },
    getRefunds() {
      return refunds;
    },
  };
}
```

## Running the scenario against the fake

```js
const users = [
  {
    id: "u1",
    trialEndsAt: new Date("2026-06-01T00:00:00Z").getTime(),
    pendingChargeId: "ch_1",
  },
  {
    id: "u2",
    trialEndsAt: new Date("2026-07-01T00:00:00Z").getTime(),
    pendingChargeId: "ch_2",
  },
  {
    id: "u3",
    trialEndsAt: new Date("2026-05-01T00:00:00Z").getTime(),
    pendingChargeId: null,
  },
];

const fakeGateway = createFakePaymentGateway();
const refundedIds = refundExpiredTrials(users, fixedClock, fakeGateway);

console.log(refundedIds); // [ "u1" ]
console.log(fakeGateway.getRefunds()); // [ "ch_1" ]
```

Verified: only `u1` gets refunded — `u2`'s trial hasn't expired yet
(per the same stub clock), and `u3` has no pending charge to refund
even though the trial expired. The fake genuinely stored the refund
call and can be queried afterward — real behavior, just without a
real network call or a real payment provider involved.

## Using a mock instead, to test the interaction itself

The fake answers "does the function produce the right result." A
**mock** answers a different question: "did the function call the
gateway correctly?"

```js
function createMockPaymentGateway() {
  const calls = [];
  return {
    refund(chargeId) {
      calls.push({ method: "refund", args: [chargeId] });
      return { success: true };
    },
    calls,
  };
}

const mockGateway = createMockPaymentGateway();
refundExpiredTrials(users, fixedClock, mockGateway);

console.log(mockGateway.calls);
// [ { method: "refund", args: [ "ch_1" ] } ]
```

Verified: the mock's `calls` array shows exactly one `refund` call,
with exactly the argument `"ch_1"` — this is what lets a test assert
"`refund` was called exactly once, with the correct charge ID," a
claim about the _interaction_, not just the final list of refunded
user IDs. A stub or a fake could show the same final result, but
neither is built to make an assertion about the call itself this
direct.

## What this rewrite does and doesn't prove

**Does adding a seam mean production code has to change how it's
called?** No — `isTrialExpired(user)` still works with zero changes
at every existing call site, because the clock parameter defaults to
the real clock. The seam is invisible to production callers and only
matters to tests that choose to use it. **The lesson isn't "always
inject every dependency" — it's "when a dependency makes a function
hard to test deterministically, that's a signal to add a seam
specifically for that dependency,"** not a blanket rule to parameterize
everything regardless of whether it causes a real testing problem.

**Try extending it yourself:** suppose `refundExpiredTrials` also
needs to log an audit entry every time it refunds someone, via a
third dependency (an audit logger). Would you reach for a stub, a
fake, or a mock to test that the audit log receives exactly the right
entries — and would your answer change if you also needed the audit
log's _stored history_ to be readable back out during the same test?

## Failure modes

| Failure mode                                                                    | What it gets wrong                                                                                                                                                                           |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Adding a seam for every dependency "just in case"                               | Most internal calls between a function's own collaborators don't need a seam — reach for one when a dependency is genuinely hard to control (time, randomness, network, real infrastructure) |
| Using a mock everywhere out of habit                                            | Mocking encodes an assumption about _how_ the code calls its dependency — over-mocking makes tests brittle to harmless refactors that don't change behavior, only call order or count        |
| Forgetting the default parameter, breaking every existing call site             | `clock = () => Date.now()` is what keeps the seam invisible to production; a required parameter with no default would force every caller to change for no functional reason                  |
| Testing against a fake but never against anything closer to the real dependency | A fake proves the code works against fake-like behavior — a small number of integration tests against the real dependency still catch cases the fake's simplifications miss                  |
| Asserting on a mock's call details that aren't actually the point of the test   | If the test only cares that `u1` got refunded, asserting on the exact call shape adds brittleness without adding a real guarantee — match the double to the actual question being asked      |
