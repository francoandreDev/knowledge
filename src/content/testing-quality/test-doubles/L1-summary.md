---
title: "L1 — How do I test something that depends on time, randomness, or external services? (test doubles: mocks/stubs/fakes, seams)"
---

import Scenario from "../../../components/Scenario.astro";

<Scenario label="A test that passes today and fails tomorrow, for no code reason">
  <Fragment slot="facts">
    <div class="not-prose flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
      <div class="flex items-center gap-1.5"><span>🕐</span> <strong>The function</strong> — calls <code>Date.now()</code> directly to check if a trial has expired</div>
      <div class="flex items-center gap-1.5"><span>✅</span> <strong>Passes today</strong> — the hardcoded test date is still in the past</div>
      <div class="flex items-center gap-1.5"><span>❌</span> <strong>Fails next year</strong> — the same hardcoded date is now in the future</div>
    </div>
  </Fragment>

**A test for `isTrialExpired(user)` passes every day for months. Then
one morning it starts failing — nobody touched the function, nobody
touched the test. The test hardcoded a date; the function calls
`Date.now()` directly. Eventually "today" caught up to and passed
that hardcoded date, silently flipping the test's expected result.
How do you test a function that depends on the literal current
moment, without the test's correctness depending on what day it
happens to run?**

The function was never given a way to be told what time it is —
it reached out and asked the real system clock directly. Nothing
about the test _touched_ time; time touched the test, from outside,
whenever it happened to run.

</Scenario>

## The shape of the problem

- Some code depends on things that are hard to control in a test:
  the current time, a random number, a real network call to another
  service, a real database. Testing this code directly means the
  test's outcome depends on things the test itself doesn't control.
- A **seam** is a point in the code where a dependency can be swapped
  out — usually by accepting it as a parameter or injecting it,
  instead of reaching out and grabbing it directly (like calling
  `Date.now()` inline). Without a seam, there's nowhere to substitute
  anything.
- A **test double** is a stand-in object used in place of a real
  dependency during a test, injected through a seam. Different kinds
  of test doubles answer different questions: does the code under
  test _behave correctly given controlled inputs_ (stubs, fakes), or
  did the code under test _call the dependency correctly_ (mocks)?

## Key terms

- **Seam** — a point in the code where a dependency is injected
  (a parameter, a constructor argument) rather than reached for
  directly, making it possible to substitute something else in a test.
- **Stub** — a test double that returns canned, predetermined values
  when called, with no real logic and no tracking of how it was
  called.
- **Fake** — a test double with a real, working implementation that's
  simpler than production (like an in-memory list standing in for a
  real database) — it behaves correctly, just not at production scale
  or with production infrastructure.
- **Mock** — a test double that records how it was called (arguments,
  call count, order) so a test can assert the code under test
  interacted with it correctly.

## What this unit covers

L2 works through why "hard to test" often really means "no seam
exists," and how to tell a stub, a fake, and a mock apart by what
question each one is built to answer. L3 rewrites the trial-expiry
scenario with a real seam for time and a real seam for an external
payment service, using a stub clock, a fake payment gateway, and a
mock payment gateway to test three different things about the same
function.
