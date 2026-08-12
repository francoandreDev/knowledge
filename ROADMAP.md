# Roadmap

Source of truth for scope. Each row is a unit: a problem to understand, ordered by increasing complexity within its track (not a fixed session order — see `docs/ARCHITECTURE.md`). No unit is labeled by seniority; the ordering itself is the progression.

Status legend: `planned` · `in-progress` · `done`. Update this file whenever a unit's status, wording, or order changes — it must reflect reality.

## web/

| # | Problem | Status |
|---|---|---|
| 01 | How does a browser turn a URL into a rendered page? (HTTP request/response basics) | planned |
| 02 | Why do we need HTML semantics instead of just divs? | planned |
| 03 | How do we style once and reuse everywhere? (CSS cascade & specificity) | planned |
| 04 | How does a page react to user input without reloading? (the DOM event model) | planned |
| 05 | Why do we need a build step at all? (bundling, transpilation, module systems) | planned |
| 06 | How do we manage state across a page without global chaos? (component state, unidirectional data flow) | planned |
| 07 | Why does calling an API from the browser fail unpredictably? (CORS, async/await, error handling) | planned |
| 08 | How do we keep the UI in sync with the server? (client-side caching, optimistic updates) | planned |
| 09 | Why does the app get slow as it grows? (render performance, virtual DOM diffing, reflow/repaint) | planned |
| 10 | How do we protect users from malicious input? (XSS, CSRF, sanitization, CSP) | planned |
| 11 | How do we serve the same app to millions without falling over? (CDN, cache layers, edge) | planned |
| 12 | Why do sessions break across multiple servers? (stateless auth, JWT, cookies, sessions) | planned |
| 13 | How do we design an API contract that won't break clients as it evolves? (REST/GraphQL, versioning) | planned |
| 14 | How do we keep frontend and backend teams moving independently? (BFF, API gateways, contract testing) | planned |
| 15 | How do we serve web, mobile, and partners from one backend without it collapsing? (service boundaries, micro-frontends) | planned |
| 16 | How do we make render-heavy apps fast on slow networks/devices? (SSR, streaming, hydration, edge rendering) | planned |
| 17 | How do we evolve a legacy web architecture without a rewrite? (strangler fig, incremental migration) | planned |

## systems/

| # | Problem | Status |
|---|---|---|
| 01 | What actually happens when you run a program? (process, memory layout, the OS as mediator) | planned |
| 02 | Why does my program still "remember" data after a crash? (persistence, disk vs. memory) | planned |
| 03 | Why is my code fast on my machine but slow in production? (algorithmic complexity, Big-O in practice) | planned |
| 04 | How do two programs talk to each other? (sockets, ports, protocols) | planned |
| 05 | Why does my server fall over under load? (concurrency: threads, processes, async I/O) | planned |
| 06 | How do we avoid two processes corrupting shared data? (race conditions, locks, atomicity) | planned |
| 07 | Why did my request "succeed" but the data never saved? (transactions, ACID) | planned |
| 08 | How do we store data so it's fast to find later? (indexing, B-trees, hashing) | planned |
| 09 | Why does the database get slow as data grows? (query planning, normalization vs. denormalization) | planned |
| 10 | How do we keep a service running when a dependency dies? (timeouts, retries, circuit breakers, backpressure) | planned |
| 11 | How do we know something broke before the user tells us? (logging, metrics, tracing, observability) | planned |
| 12 | How do we scale beyond one machine? (horizontal scaling, load balancing, statelessness) | planned |
| 13 | How do two datacenters agree on the truth? (CAP theorem, consistency models) | planned |
| 14 | How do we move data between systems without losing or duplicating it? (queues, delivery guarantees) | planned |
| 15 | How do we design a system that survives a whole region going down? (redundancy, failover, disaster recovery) | planned |
| 16 | How do we evolve a monolith into services without a big-bang rewrite? (domain boundaries, strangler pattern) | planned |
| 17 | How do we reason about a system nobody has fully seen end-to-end? (trade-off documentation, ADRs, staff-level system design) | planned |

## git-teamwork/

| # | Problem | Status |
|---|---|---|
| 01 | Why do we need version control at all? (snapshots vs. manual copies) | planned |
| 02 | How do I undo a mistake without losing everything? (checkout, revert, reset semantics) | planned |
| 03 | Why did my change disappear when I switched branches? (working tree, staging, commit model) | planned |
| 04 | How do two people edit the same file without destroying each other's work? (merge, conflicts) | planned |
| 05 | Why does `git pull` sometimes create a mess? (merge vs. rebase, fast-forward) | planned |
| 06 | How do we keep history readable as a team? (commit conventions, atomic commits) | planned |
| 07 | How do we let many people ship to the same codebase safely? (branching strategies: trunk-based vs. gitflow) | planned |
| 08 | How do we catch mistakes before they reach main? (PRs, review culture, CI gating) | planned |
| 09 | Why did a "safe" force-push break someone else's day? (shared history, rewriting risk) | planned |
| 10 | How do we ship fast without breaking main constantly? (feature flags, small PRs, trunk hygiene) | planned |
| 11 | How do we recover history after someone really messes it up? (reflog, bisect, forensic git) | planned |
| 12 | How do we review code without making it personal? (feedback framing, async review etiquette) | planned |
| 13 | How do we disagree with a teammate's technical decision productively? (RFCs, design docs, disagree-and-commit) | planned |
| 14 | How do we onboard someone into years of undocumented decisions? (documentation culture, ADRs) | planned |
| 15 | How do we run a team where nobody knows everything? (ownership, on-call, knowledge sharing) | planned |
| 16 | How does a staff engineer influence a codebase without writing most of the code? (technical leadership, cross-team alignment) | planned |

## business-communication/

| # | Problem | Status |
|---|---|---|
| 01 | Why does the same message land differently depending on who says it? (audience awareness) | planned |
| 02 | How do I explain a technical delay without sounding like an excuse? (status updates that build trust) | planned |
| 03 | Why did my "obviously right" proposal get rejected? (reading stakeholder incentives) | planned |
| 04 | How do I say no to a request without burning the relationship? (pushback frameworks) | planned |
| 05 | How do I get buy-in before I need it? (building credibility ahead of the ask) | planned |
| 06 | Why do meetings feel like they decide nothing? (decision-making frameworks: DACI/RACI) | planned |
| 07 | How do I write a doc that busy executives actually read? (executive summaries, BLUF) | planned |
| 08 | How do I navigate two teams that both think they own the same thing? (conflict resolution, escalation paths) | planned |
| 09 | How do I get credit for my work without appearing to seek it? (visibility without self-promotion) | planned |
| 10 | How do I influence a decision I don't own? (informal authority, coalition-building) | planned |
| 11 | How do I tell someone senior "this plan will fail"? (upward disagreement, psychological safety) | planned |
| 12 | How do I lead a team through a reorg or layoffs? (change management, uncertainty) | planned |
| 13 | How do I represent engineering trade-offs to non-technical leadership? (translating technical risk to business risk) | planned |
| 14 | How does a staff engineer shape company-wide technical direction? (org-level influence, technical strategy) | planned |

## logic/

| # | Problem | Status |
|---|---|---|
| 01 | What actually makes an argument valid vs. just convincing? (formal vs. informal logic) | planned |
| 02 | Why does "if it's not A, it must be B" often fail? (fallacies, false dichotomy) | planned |
| 03 | How do I break a vague problem into solvable pieces? (problem decomposition) | planned |
| 04 | Why do two "correct" pieces of code produce different results? (boolean logic, precedence, De Morgan's laws) | planned |
| 05 | How do I reason about a system with many possible states? (state machines, truth tables) | planned |
| 06 | How do I prove my code handles every case, not just the ones I tested? (edge case reasoning, invariants) | planned |
| 07 | How do I reason about something recursive without getting lost? (induction, recursion tracing) | planned |
| 08 | How do I estimate an answer when I can't compute the exact one? (Fermi estimation, back-of-envelope reasoning) | planned |
| 09 | How do I make a decision under uncertainty? (expected value, probabilistic reasoning) | planned |
| 10 | How do I avoid fooling myself with data? (correlation vs. causation, cognitive biases, base rate fallacy) | planned |
| 11 | How do I formally model a messy real-world problem well enough to solve it? (abstraction, formal modeling) | planned |
| 12 | How does a staff engineer reason about trade-offs with no clearly right answer? (multi-criteria decisions under ambiguity) | planned |

## Notes on ordering

- Numbers reflect complexity ordering *within* a track, not a global session order.
- Track choice per session is decided live (see `CLAUDE.md`), so it's normal and expected to jump between tracks rather than clearing one top-to-bottom.
- Late-track units (e.g. `web/17`, `systems/17`, `git-teamwork/16`, `business-communication/14`, `logic/12`) are intentionally where the tracks start blending into each other — that's the point at which staff-level judgment lives, and cross-references between tracks are expected there.
