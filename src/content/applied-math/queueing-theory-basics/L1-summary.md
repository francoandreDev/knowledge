---
title: "L1 — How do I predict how a system behaves under load before it's built? (queueing theory basics: Little's Law, latency vs. throughput)"
---

import Scenario from "../../../components/Scenario.astro";

<Scenario label="Load test looks fine, then the same service falls over in production">
  <Fragment slot="facts">
    <div class="not-prose flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
      <div class="flex items-center gap-1.5"><span>📊</span> <strong>Load test at 60% capacity</strong> — average response time: 250ms, looks great</div>
      <div class="flex items-center gap-1.5"><span>📈</span> <strong>Traffic climbs to 90% capacity</strong> — average response time: over 1,000ms</div>
      <div class="flex items-center gap-1.5"><span>😱</span> <strong>Only 50% more traffic</strong> — but response time is 4x worse, not 1.5x worse</div>
    </div>
  </Fragment>

**A checkout service is load-tested at 60% of its maximum capacity and
performs great — 250ms average response time. Traffic grows, and at
90% of capacity the same service now averages over 1,000ms — a full
second. Traffic only grew 50%. Why did response time grow 4x instead
of roughly 1.5x, and why wasn't this visible in the 60%-capacity load
test at all?**

The relationship between how busy a system is and how long requests
wait isn't linear — it's a curve that stays nearly flat for most of
its range and then rises sharply as the system approaches its actual
capacity. A load test that never goes near that region will never see
the cliff coming.

</Scenario>

## The shape of the problem

- **Queueing theory** studies what happens when requests (or
  customers, or packets, or anything else) arrive at a system faster
  than, or comparably close to, the rate the system can process them.
- **Utilization** (often written ρ, "rho") is the fraction of a
  system's maximum processing capacity currently being used —
  arrival rate divided by service rate. A system at 60% utilization
  is using 60% of its maximum throughput.
- **Little's Law** is a simple, general relationship: the average
  number of requests in a system equals the arrival rate multiplied
  by the average time each request spends in the system (`L = λW`).
  It holds for almost any queueing system, regardless of the specific
  arrival or service pattern — which makes it a powerful sanity check
  on capacity planning.
- The core surprise: as utilization approaches 100%, average wait
  time doesn't grow proportionally — it grows toward infinity. A
  system doesn't fail gracefully as it nears capacity; it fails
  sharply, often well before "100% busy" is actually reached.

## Key terms

- **Arrival rate (λ)** — how often new requests arrive, on average
  (e.g. requests per second).
- **Service rate (μ)** — how many requests a system can complete per
  unit time when continuously busy.
- **Utilization (ρ)** — the fraction of capacity in use, `ρ = λ / μ`.
  Must stay below 1 for a queue to remain stable in the long run.
- **Little's Law (`L = λW`)** — average number in system equals
  arrival rate times average time in system; a general, distribution-
  independent relationship.
- **Latency vs. throughput** — throughput is how much work a system
  completes per unit time; latency is how long any individual request
  takes. They're related but not interchangeable — a system can have
  high throughput and terrible latency at the same time.

## What this unit covers

L2 works through why the wait-time-vs-utilization curve bends sharply
near full capacity rather than growing in a straight line, and what
Little's Law actually says (and doesn't say) about a system's
behavior. L3 builds a real, verified queueing simulation, confirms it
matches the closed-form math at several utilization levels, and uses
it to show exactly where the checkout service's cliff in the opening
scenario comes from.
