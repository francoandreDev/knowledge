---
title: "L3 — Simulating a queue, confirming the math, and finding the checkout service's cliff"
---

## Simulating arrivals and service with real randomness

A seeded PRNG (so results are reproducible) plus exponentially
distributed random draws — the standard way to model "requests arrive
at random, but at a known average rate":

```js
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function exponential(rand, rate) {
  return -Math.log(1 - rand()) / rate;
}
```

`exponential(rand, rate)` draws a random gap — between arrivals, or a
random service duration — averaging `1 / rate` but varying randomly
around it, which is what makes bursts and lulls happen naturally in
the simulation rather than requests arriving on a perfectly even beat.

## Simulating a single-server queue (checkout, one register open)

```js
function simulateQueue(arrivalRate, serviceRate, numCustomers, seed) {
  const rand = mulberry32(seed);
  let time = 0;
  let serverFreeAt = 0;
  let totalWaitInSystem = 0;
  const events = [];

  for (let i = 0; i < numCustomers; i++) {
    time += exponential(rand, arrivalRate);
    const serviceTime = exponential(rand, serviceRate);
    const start = Math.max(time, serverFreeAt);
    const departure = start + serviceTime;
    serverFreeAt = departure;
    events.push({ arrival: time, departure });
    totalWaitInSystem += departure - time;
  }

  const avgTimeInSystem = totalWaitInSystem / numCustomers;
  const totalSimTime = events[events.length - 1].departure - events[0].arrival;
  const throughput = numCustomers / totalSimTime;
  const avgNumberInSystem = throughput * avgTimeInSystem; // Little's Law, L = λW

  return { avgTimeInSystem, throughput, avgNumberInSystem };
}
```

Each customer arrives, waits if the single register is still busy
with the previous customer (`Math.max(time, serverFreeAt)`), then gets
served. `avgNumberInSystem` is computed by directly applying Little's
Law to the simulation's own measured throughput and average wait —
not assumed, but computed the same way you'd measure it from a real
system's logs.

## Confirming the simulation matches the closed-form math

```js
function theoreticalMM1(arrivalRate, serviceRate) {
  const rho = arrivalRate / serviceRate;
  const W = 1 / (serviceRate - arrivalRate);
  const L = rho / (1 - rho);
  return { rho, W, L };
}

for (const lambda of [2, 4, 6, 8, 9]) {
  const mu = 10;
  const sim = simulateQueue(lambda, mu, 50000, 42);
  const theory = theoreticalMM1(lambda, mu);
  console.log(
    lambda,
    theory.rho,
    sim.avgTimeInSystem,
    theory.W,
    sim.avgNumberInSystem,
    theory.L,
  );
}
```

Verified output (service rate fixed at 10/sec, 50,000 simulated
customers per run):

| Arrival rate (λ) | Utilization (ρ) | Simulated W | Theoretical W | Simulated L | Theoretical L |
| ---------------- | --------------- | ----------- | ------------- | ----------- | ------------- |
| 2                | 0.20            | 0.125       | 0.125         | 0.25        | 0.25          |
| 4                | 0.40            | 0.167       | 0.167         | 0.67        | 0.67          |
| 6                | 0.60            | 0.250       | 0.250         | 1.50        | 1.50          |
| 8                | 0.80            | 0.491       | 0.500         | 3.93        | 4.00          |
| 9                | 0.90            | 1.046       | 1.000         | 9.41        | 9.00          |

The simulation (built from raw random arrivals and service times, with
no formula baked in) tracks the closed-form theory closely at every
utilization level, with the small remaining gap explained by finite
sample size (50,000 customers, not infinite). **This is the same
sharp curve from L2 — at ρ=0.90, average wait time is 8x what it was
at ρ=0.20, despite arrival rate only being 4.5x higher.**

## Finding the checkout service's actual cliff

The opening scenario described 250ms at 60% utilization and 1,000ms+
at 90%. The verified table above already contains both data points —
at service rate μ=10/sec, λ=6 is exactly 60% utilization and λ=9 is
exactly 90%:

```js
console.log(simulateQueue(6, 10, 50000, 42).avgTimeInSystem); // λ/μ = 60%
console.log(simulateQueue(9, 10, 50000, 42).avgTimeInSystem); // λ/μ = 90%
// 0.250s at 60%, 1.046s at 90% — matching the scenario's reported numbers exactly
```

Verified: this single-server queueing model, with no special tuning
beyond picking a service rate, reproduces the scenario's own
250ms-at-60%-utilization and over-a-second-at-90%-utilization numbers
almost exactly. The scenario's "4x latency from 50% more traffic"
wasn't a bug or a fluke — it's exactly what the underlying math
predicts once utilization gets that close to 1.

## What this simulation does and doesn't prove

**Does this mean every system follows this exact curve?** No — this
is the specific curve for a single server with random (exponentially
distributed) arrivals and service times, the simplest queueing model.
Real systems with multiple servers, non-random service times, or
request prioritization follow related but different curves. **What
generalizes is the qualitative shape, not the exact numbers**: nearly
every queueing system exhibits a knee where wait time transitions from
roughly flat to steeply rising as utilization approaches its limit —
the specific utilization where that knee occurs, and how sharp it is,
depends on the system's specific characteristics (number of servers,
variability in service time, and so on).

**Try extending it yourself:** suppose the checkout system added a
second register (two servers instead of one) without changing the
total arrival rate. Would you expect the wait-time curve's knee to
shift toward a higher or lower utilization percentage, and roughly
why — in terms of how much "slack" a burst of arrivals now has to be
absorbed by?

## Failure modes

| Failure mode                                                                                          | What it gets wrong                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Capacity-planning off average utilization alone, without checking how close to 1 it gets during peaks | Average utilization over a day can look moderate while peak-hour utilization sits in the steep part of the curve, where the real damage happens                                                                                                          |
| Assuming a system with "only" 20% more traffic will have "only" 20% worse latency                     | Per Little's Law's underlying dynamics, the relationship between utilization and wait time is sharply nonlinear near capacity — proportional traffic growth doesn't mean proportional latency growth                                                     |
| Treating throughput and latency as always moving together                                             | A system near its capacity limit can sustain throughput while latency quietly degrades — the two metrics answer different questions and can diverge                                                                                                      |
| Load-testing only at a "safe" utilization level, never near the knee                                  | The steep part of the curve is exactly the part a conservative load test is designed to avoid — which means it's also the part that never gets tested                                                                                                    |
| Applying Little's Law's formula (`L = λW`) as if it only works for simple single-server queues        | Little's Law itself is far more general than the M/M/1 formulas used to compute `theoreticalMM1` here — it holds for almost any stable queueing system, which is why it's useful as a cross-check even on systems this simulation doesn't directly model |
