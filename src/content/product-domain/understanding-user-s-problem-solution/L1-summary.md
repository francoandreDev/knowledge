---
title: "L1 — Why does a perfectly built feature go unused?"
---

- A feature can be bug-free, fast, and well-designed, and still fail — because those properties only measure **how well it was built**, not whether it **solves a real problem someone actually has**.
- The most common root cause: the team understood the _requested solution_ in detail, but never validated the _underlying problem_ it was meant to solve — so the feature answers a question nobody was actually asking.
- **The five whys** is a simple way to keep pushing past a stated request to the actual underlying need: "I want a CSV export" → why? → "So I can build a report" → why? → "So I can see weekly trends" → why? → "So I know if the metric is getting worse" → the real need is _trend visibility_, and CSV export is just the first solution the requester happened to imagine.
- **Jobs to be done**: users don't want a product, they "hire" it to make progress on a specific job in a specific context. Understanding the job (not the feature request) is what lets you evaluate whether a _different, better_ solution would serve the same underlying need.
- A request phrased as a solution ("add a CSV export button") smuggles in an implicit, unvalidated problem statement — taking the request literally means inheriting whatever assumptions the requester made about the problem, without ever checking them yourself.
- This isn't about ignoring what users ask for — it's about treating a feature request as a _clue_ about the underlying problem, not the final specification, and validating the problem before committing to build any particular solution.
- The practical discipline this unit builds: before building, be able to state the user's problem in one sentence that contains **no mention of the proposed solution** — if you can't, you don't yet understand the problem well enough to know if the proposed solution is even a good one.
