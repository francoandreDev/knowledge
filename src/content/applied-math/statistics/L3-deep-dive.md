---
title: "L3 — Testing the Scenario's actual numbers, and how much data would have been needed"
---

## Computing mean, variance, and standard deviation from real data

**Before testing the A/B result, here are the building blocks. What
do variance and standard deviation actually measure?**

```js
function mean(xs) {
  return xs.reduce((sum, x) => sum + x, 0) / xs.length;
}

function variance(xs) {
  const m = mean(xs);
  return xs.reduce((sum, x) => sum + (x - m) ** 2, 0) / (xs.length - 1);
}

function stdDev(xs) {
  return Math.sqrt(variance(xs));
}
```

```js
const dailySignups = [2, 4, 4, 4, 5, 5, 7, 9];
mean(dailySignups); // 5
variance(dailySignups); // 4.57
stdDev(dailySignups); // 2.14
```

Variance averages the squared distance of every value from the mean
— squaring makes it always positive and weights larger deviations
more heavily, but leaves the units squared (people², not people).
Standard deviation undoes that by taking the square root, putting the
spread back into the original units: "daily signups typically vary
by about 2.14 from the mean of 5," which is directly interpretable in
a way raw variance isn't.

## Testing whether the Scenario's 12% vs. 18% is significant

**Is 18% vs. 12% from 100 visitors each significant at the standard
95% threshold?** A two-proportion z-test answers exactly this: it
measures how many standard errors apart the two observed rates are,
under the assumption that they actually come from the same true
rate.

```js
function twoProportionZTest(conversions1, visitors1, conversions2, visitors2) {
  const p1 = conversions1 / visitors1;
  const p2 = conversions2 / visitors2;
  const pooled = (conversions1 + conversions2) / (visitors1 + visitors2);
  const standardError = Math.sqrt(
    pooled * (1 - pooled) * (1 / visitors1 + 1 / visitors2),
  );
  const z = (p2 - p1) / standardError;
  return { p1, p2, z, isSignificant: Math.abs(z) >= 1.96 };
}
```

```js
twoProportionZTest(12, 100, 18, 100);
// { p1: 0.12, p2: 0.18, z: 1.188, isSignificant: false }
```

`z ≈ 1.19` means the two observed rates are only about 1.19 standard
errors apart. The standard threshold for 95% confidence requires at
least 1.96 standard errors apart (the same 1.96 behind the "± 1.96 ×
standard error" confidence intervals in L2). **1.19 doesn't clear
that bar** — despite looking like a dramatic 50% relative lift, this
result is well within the range random noise alone could produce from
samples this small. Shipping today on this evidence would mean
treating noise as a real effect.

## How much data would actually be needed

**If the true rates really were 12% and 18%, how many visitors per
group would it take for the same test to detect that reliably?**

```js
function neededSampleSizeForSignificance(p1, p2, targetZ = 1.96) {
  for (let n = 50; n <= 20000; n += 10) {
    const x1 = Math.round(p1 * n);
    const x2 = Math.round(p2 * n);
    const result = twoProportionZTest(x1, n, x2, n);
    if (Math.abs(result.z) >= targetZ) return n;
  }
  return null;
}
```

```js
neededSampleSizeForSignificance(0.12, 0.18); // 300
```

At the same 12%/18% rates, roughly 300 visitors per group (not 100)
would be needed before the z-test reliably clears the significance
threshold. This is the concrete, staff-level version of "wait for
more data before shipping" — not a vague instinct, but a specific
number derived from the actual effect size being measured.

## What generalizes and what doesn't

The core lesson — a measured difference needs enough data behind it
before it can be trusted as real, and "significant" is a specific,
computable claim rather than a subjective impression of size —
generalizes to any comparison built from a sample: server latency
before/after a change, error rates across two deployments, survey
results across two groups. What's specific to this worked example:
the two-proportion z-test applies to comparing two conversion-style
rates specifically — a different kind of comparison (comparing two
means, like average latency) needs a different test (a t-test) built
on the same underlying idea. **Try extending it yourself:** if the
observed rates had instead been 12% vs. 13% (a much smaller, less
exciting-looking difference) but from 50,000 visitors per group
instead of 100, would you expect that to be significant or not — and
why does that feel like it cuts against the "bigger difference = more
trustworthy" instinct from L1?

## Failure modes

| Failure mode                                                                        | What it gets wrong                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shipping based on relative lift alone ("50% better!") without checking significance | Relative lift says nothing about how much of that gap could be noise — a huge relative lift from a tiny sample can still be pure chance                                                             |
| Treating "not significant yet" as "the change doesn't work"                         | Not significant means the data collected so far can't distinguish the effect from noise — it doesn't prove there's no real effect, just that more data is needed                                    |
| Running a test until it happens to look significant, then stopping immediately      | Checking significance repeatedly and stopping as soon as it crosses the threshold inflates the false-positive rate — the test should be sized in advance, not peeked at until it says what's wanted |
| Assuming a two-proportion z-test applies to any kind of comparison                  | Comparing rates/proportions needs this specific test; comparing two means (like average latency) needs a different one (a t-test) built on the same underlying logic                                |
