---
title: "L2 — The formal definitions, and why small n hides the true growth rate"
---

## What "grows no faster than" actually means, precisely

**"O(n²) means it's roughly n² operations" is the intuitive version — but
what does it mean _exactly_, in a way you could actually check?** Formally,
`T(n)` is `O(f(n))` if there exist positive constants `c` and `n₀` such
that:

```text
T(n) ≤ c · f(n)   for all n ≥ n₀
```

In words: past some starting point `n₀`, `T(n)` never exceeds a constant
multiple of `f(n)`. The constant `c` absorbs things like hardware speed or
a fixed per-operation cost; `n₀` is exactly what lets Big-O ignore
small-`n` behavior — which is also exactly why a benchmark run only at
small `n` can't validate or refute a Big-O claim on its own.

With simple numbers, if `f(n)` is `n²` and `c = 4`, the bound says:
"after some point, the work is never more than four times `n²`." It does
not say the work equals `n²` exactly, and it does not care if the first
few small values behave strangely. The phrase "for all n ≥ n₀" means
"from that starting size onward, with no later exceptions."

## Ω and Θ: bounding from below, and from both sides

**If O(f(n)) is an upper bound, is there a way to state a lower bound —
and a way to say "exactly this rate," not just "no worse than"?**

| Notation  | Meaning                             | Formal condition                          |
| --------- | ----------------------------------- | ----------------------------------------- |
| `O(f(n))` | grows no faster than `f(n)`         | `T(n) ≤ c·f(n)` for `n ≥ n₀`              |
| `Ω(f(n))` | grows at least as fast as `f(n)`    | `T(n) ≥ c·f(n)` for `n ≥ n₀`              |
| `Θ(f(n))` | grows at exactly the rate of `f(n)` | both an O(f(n)) and an Ω(f(n)) bound hold |

`T(n) = 3n² + 100n` is `Θ(n²)` — it is both `O(n²)` (never exceeds `4n²`
for `n ≥ 100`, say) and `Ω(n²)` (never drops below `3n²`). It is _also_
technically `O(n³)` (a looser, still-true upper bound) — but calling it
`Θ(n²)` is the precise, tightest true statement.

## Why the dominant term wins, and exactly when it starts winning

**`3n² + 100n` — at what point does the `n²` term actually take over from
the `100n` term?** They're equal when `3n² = 100n`. Since input size is
positive, divide both sides by `n`:

```text
3n² = 100n
3n² / n = 100n / n
3n = 100
n = 100/3 ≈ 33
```

Below that, `100n` is larger; above it, `3n²` grows away from `100n`
increasingly fast:

```mermaid
xychart-beta
    title "3n² + 100n: where the quadratic term takes over"
    x-axis "n" [5, 10, 20, 33, 50, 100, 200]
    y-axis "value"
    line "100n (linear term)" [500, 1000, 2000, 3300, 5000, 10000, 20000]
    line "3n² (quadratic term)" [75, 300, 1200, 3267, 7500, 30000, 120000]
```

At `n = 5` or `n = 10`, the linear term is still 6-16× larger than the
quadratic term — a benchmark there genuinely _looks_ linear, because for
those specific input sizes, it very nearly is. The formal `n₀` in the
Big-O definition is exactly this crossover region: below it, lower-order
terms can dominate the observed behavior; the asymptotic classification
only describes what happens once you're safely past it.

## Reading a doubling ratio correctly

**Doubling `n` and watching the runtime roughly double is real evidence
— evidence of what, exactly?** It's evidence about the growth rate _in
the neighborhood of the `n` you tested_, not a global proof. The ratio
`T(2n)/T(n)` itself is a function of `n` for anything that isn't a pure
power of `n` — for `3n² + 100n`, that ratio is close to 2 (linear-looking)
at small `n` and climbs toward 4 (quadratic) as `n` grows, exactly
tracking the crossover in the chart above.

| Where you measure     | `T(2n)/T(n)` for `3n² + 100n` | What it looks like         |
| --------------------- | ----------------------------- | -------------------------- |
| n = 5 → 10            | ≈ 2.26                        | Looks close to linear      |
| n = 50 → 100          | ≈ 3.2                         | Ambiguous, trending upward |
| n = 100,000 → 200,000 | ≈ 4.0                         | Unambiguously quadratic    |

For the first row, the actual arithmetic is:

```text
T(5) = 3·25 + 100·5 = 575
T(10) = 3·100 + 100·10 = 1300
T(10) / T(5) = 1300 / 575 ≈ 2.26
```

That ratio is genuinely near 2 at this small size. The mistake is
treating that local ratio as proof that the ratio will stay near 2 when
`n` becomes much larger.

## The generalizable lesson

**Does this mean small benchmarks are useless?** No — they're genuinely
informative about performance _at the sizes you actually run in
production_, if those sizes stay small. The mistake isn't benchmarking
small; it's treating a small-`n` doubling ratio as a proof of the
asymptotic class, when the whole point of "asymptotic" is behavior as
`n → ∞`. The fix is either testing at the actual production scale, or
doing the algebraic analysis (finding the dominant term directly, as
above) instead of relying on measurement alone.
