---
title: "L2 — Three shapes of chance, and which systems question each one answers"
---

## Uniform: every outcome equally likely

**If a load balancer picks 1 of 4 servers uniformly at random, what's
the actual chance any single server gets picked?** Exactly `1/4 =
25%` — every outcome in the set is equally likely, by definition. The
mean number of hits after `n` requests is `n × p` (here, `n × 0.25`),
and the spread around that mean follows directly from the same
`n`/`p`.

This is a **discrete uniform** distribution: the outcomes are separate labels
you can count. A fair die has 6 labels, so each face has `1/6`; the load
balancer has 4 server labels, so each server has `1/4`. A bar chart is the
right picture because each outcome gets its own bar.

```mermaid
xychart-beta
    title "Uniform: 4 servers, each equally likely"
    x-axis ["Server 1", "Server 2", "Server 3", "Server 4"]
    y-axis "Probability" 0 --> 0.4
    bar [0.25, 0.25, 0.25, 0.25]
```

There is also a **continuous uniform** distribution, where the outcome can be
any point inside an interval, like a simulated delay anywhere from 1ms to 5ms.
There the graph is a flat rectangle, and probability is area: the interval
from 2ms to 4ms is length 2 inside a total length 4, so its probability is
`2 / 4 = 50%`. The probability of "exactly 3.000000...ms" is not the useful
question; the probability of an interval is.

| Uniform type | Outcome example         | How probability is read               |
| ------------ | ----------------------- | ------------------------------------- |
| Discrete     | server 1, 2, 3, or 4    | each listed outcome gets equal bar    |
| Continuous   | any delay from 1 to 5ms | equal-length intervals get equal area |

## Binomial: counting successes across independent trials

**If a downstream dependency fails independently 2% of the time, how
many failures should show up in the next 500 requests — and how many
would be alarming?** This is what the binomial distribution answers:
given `n` independent trials each with success probability `p`, it
describes how many successes to expect and how much that count
naturally varies.

The connection from uniform to binomial is: once you choose one server to
watch, each request becomes a yes/no trial for that server. "Did this request
go to server 3?" has probability `p = 1/4`; after 200 requests, the binomial
distribution describes how many yes answers are normal.

| Quantity              | Formula           | For n=500, p=0.02 |
| --------------------- | ----------------- | ----------------- |
| Mean (expected count) | `n × p`           | 10 failures       |
| Variance              | `n × p × (1 − p)` | 9.8               |
| Standard deviation    | `√variance`       | ≈ 3.13 failures   |

```mermaid
xychart-beta
    title "Binomial: failures in 500 requests (p=0.02)"
    x-axis ["0-4", "5-9", "10-14", "15-19", "20-24"]
    y-axis "Probability" 0 --> 0.5
    bar [0.028, 0.429, 0.462, 0.078, 0.003]
```

A count that lands within one or two standard deviations of the mean
(here, roughly 4 to 16 failures) is unremarkable — it's what
independent chance produces on its own. An alert threshold set well
past that spread (say, 20+ failures, which this data shows happens
under 0.4% of the time by chance alone) is what actually distinguishes
"the dependency is having a bad batch of luck" from "something is
genuinely wrong."

## Normal: what sums of small independent effects look like

**If end-to-end request latency is the sum of six independent
delays — DNS, TCP handshake, three network hops, and server
processing — and none of those six delays is individually
bell-shaped, why does the total latency usually still come out looking
like a bell curve?** This is the **Central Limit Theorem**: the sum of
many independent random effects tends toward a normal distribution,
regardless of the shape of each individual effect. This is why normal
distributions show up constantly in systems work even when no single
underlying cause is "naturally" bell-shaped.

```mermaid
flowchart LR
    A["6 independent delays,\neach uniformly spread"] --> B["Sum them\nfor total latency"]
    B --> C["Result: a\nbell-shaped distribution"]
    C --> D["Mean and stddev of\nthe sum are known\nfrom the parts"]
```

For a sum of independent quantities, the means add directly and the
variances add directly (not the standard deviations) — this is what
lets `p50`/`p99` latency targets be reasoned about from the pieces
that make up a request, rather than only measured after the fact.

If variance is still new, treat it as "spread before taking the square root."
Standard deviation is in the original unit (failures, milliseconds), so it is
easier to read; variance is the bookkeeping quantity that adds cleanly when
independent random pieces are summed. `applied-math/statistics` expands that
language, and `applied-math/measurement-theory` explains why intervals and
units matter when the values being measured are continuous.

## Picking the right tool for the question

| Question shape                                                              | Distribution     | Systems example                                                  |
| --------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------- |
| "Which of these equally-likely outcomes will happen?"                       | Uniform          | Random server selection, hash bucket assignment, A/B bucketing   |
| "How many times will this independent yes/no event happen across N trials?" | Binomial         | Request failures, retry outcomes, flaky test flakiness rates     |
| "What does the total of many small independent effects look like?"          | Normal (via CLT) | End-to-end latency, aggregated queueing delay, noise in a metric |

The three aren't competing models of the same thing — they answer
different shapes of question, and picking the wrong one produces a
confident-looking answer to a question nobody actually asked.
