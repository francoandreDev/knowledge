---
title: "L3 — Reproducing the Goodhart curve with real code, and measuring sampling error directly"
---

## Reproducing the proxy/target divergence numerically

This is the exact formula behind L2's chart and the interactive demo — implementing it directly makes the "why does the real target eventually decline" claim checkable, not just asserted:

```js
// goodhart.mjs — proxy score always climbs with pressure; whether the
// real target climbs WITH it depends entirely on correlation strength.
function proxyScore(pressure) {
  return Math.min(100, 40 + 0.6 * pressure);
}

function realTarget(pressure, correlation) {
  const penalty = Math.pow(pressure, 2) * (1 - correlation) * 0.01;
  return Math.max(0, 40 + 0.6 * pressure - penalty);
}

for (const pressure of [0, 25, 50, 75, 100]) {
  console.log(
    `pressure=${pressure}: proxy=${proxyScore(pressure).toFixed(0)}, ` +
      `real (weak proxy, corr=0.3)=${realTarget(pressure, 0.3).toFixed(0)}, ` +
      `real (strong proxy, corr=0.9)=${realTarget(pressure, 0.9).toFixed(0)}`,
  );
}
// pressure=0:   proxy=40, real(weak)=40, real(strong)=40
// pressure=25:  proxy=55, real(weak)=51, real(strong)=54
// pressure=50:  proxy=70, real(weak)=53, real(strong)=68
// pressure=75:  proxy=85, real(weak)=46, real(strong)=79
// pressure=100: proxy=100 (capped), real(weak)=30, real(strong)=90
```

At `corr=0.9` (a genuinely strong proxy — like "the code compiles and passes a real, meaningful test suite" as a quality proxy), the real target tracks the proxy closely even under heavy optimization pressure. At `corr=0.3` (a weak proxy — like raw test-count as a quality proxy, gameable by writing many low-value tests), the real target visibly peaks around pressure 50 and _declines_ afterward even as the proxy keeps climbing to its cap — the exact Goodhart's Law shape, now backed by a specific, re-runnable calculation instead of just an assertion.

## Measuring sampling error directly

A second, distinct kind of measurement error — not "is the proxy valid," but "how much does measuring a sample instead of the whole population cost in accuracy":

```js
// sampling-error.mjs — demonstrates that sampling error shrinks with
// sample size, and specifically HOW (proportional to 1/sqrt(n), not
// linearly) — a real, checkable statistical fact, not a rule of thumb.
function simulateSamplingError(
  populationMean,
  populationStdDev,
  sampleSize,
  trials,
) {
  let totalSquaredError = 0;
  for (let t = 0; t < trials; t++) {
    let sampleSum = 0;
    for (let i = 0; i < sampleSize; i++) {
      // Simulate one random draw from a population with the given mean/stddev
      // using a simple Box-Muller-style approximation for a normal draw.
      const u1 = Math.random(),
        u2 = Math.random();
      const normalDraw =
        Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      sampleSum += populationMean + normalDraw * populationStdDev;
    }
    const sampleMean = sampleSum / sampleSize;
    totalSquaredError += (sampleMean - populationMean) ** 2;
  }
  return Math.sqrt(totalSquaredError / trials); // root-mean-squared error
}

for (const n of [10, 40, 160, 640]) {
  const rmse = simulateSamplingError(100, 20, n, 2000);
  console.log(`n=${n}: sampling error ≈ ${rmse.toFixed(2)}`);
}
// n=10:  error ≈ 6.3
// n=40:  error ≈ 3.1   (roughly half of n=10's error, for 4x the sample)
// n=160: error ≈ 1.6   (roughly half again, for another 4x)
// n=640: error ≈ 0.8   (halved again, for another 4x)
```

Quadrupling the sample size roughly halves the error, every time — this is the real, checkable content of "sampling error shrinks proportional to 1 / √n," not a hand-wavy "more data is better." It also has a direct practical implication: going from a 1% sample to a 4% sample of production traffic cuts sampling error roughly in half; going from 1% to 100% (i.e. dropping sampling entirely) only cuts it by another factor of 5, at 100x the instrumentation cost — a real, quantifiable trade-off, not just an intuition.

## Failure modes

- **Treating a proxy's initial validity as permanent.** L2/L3's whole point is that a proxy correlated with the target under _normal_ conditions can decouple from it specifically once people start optimizing for the proxy directly — revalidating a metric periodically, especially after it becomes a target people are evaluated on, is necessary, not paranoid.
- **Increasing sample size without checking whether the sample is actually representative.** The 1/√n error-reduction result assumes random, unbiased sampling — a larger but systematically biased sample (e.g. only sampling requests during business hours) doesn't converge to the true population value no matter how large it gets; it converges to the biased subpopulation's value instead, precisely and confidently.
- **Ignoring instrumentation overhead until it's already a production incident.** Measurement cost is easy to treat as negligible in development (where load is low) and then discover it's a real, load-dependent cost once traffic is high enough that the overhead itself becomes a bottleneck — the trade-off from L2 needs to be evaluated at production scale, not dev-environment scale.
- **Reporting a number with no unit or comparison baseline as if it were meaningful on its own.** "Latency improved by 40%" is meaningless without knowing 40% of what (median? p99? which endpoint?) — the dimensional-consistency point from L1 applies just as much to informal engineering claims as to physics-style unit analysis.
