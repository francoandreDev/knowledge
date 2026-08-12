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

## security/

| # | Problem | Status |
|---|---|---|
| 01 | Why doesn't "it works" mean "it's safe"? (the security mindset, threat modeling basics) | planned |
| 02 | How do we prove someone is who they claim to be? (authentication fundamentals, passwords, hashing) | planned |
| 03 | How do we decide what an authenticated user is allowed to do? (authorization models: RBAC/ABAC) | planned |
| 04 | Why does storing a password in plain text guarantee disaster? (hashing, salting, key derivation) | planned |
| 05 | How do we keep data unreadable to anyone but the intended recipient? (symmetric vs. asymmetric encryption basics) | planned |
| 06 | Why doesn't a green padlock mean a site is safe? (TLS/HTTPS, certificate trust chains) | planned |
| 07 | How does an attacker actually break into a web app? (OWASP top 10, in depth) | planned |
| 08 | How do we stop leaking secrets into code and logs? (secrets management, environment hygiene) | planned |
| 09 | Why did a "trusted" open-source dependency compromise production? (supply chain security, SBOM, dependency scanning) | planned |
| 10 | How do we design a system assuming a component will be breached? (defense in depth, least privilege, zero trust) | planned |
| 11 | How do we find our own vulnerabilities before attackers do? (security testing: SAST/DAST, pentesting basics) | planned |
| 12 | How do we respond when a breach actually happens? (incident response, disclosure, post-mortems) | planned |
| 13 | How does a staff engineer bake security into architecture decisions from day one? (secure-by-design, threat modeling at system-design time) | planned |

## infra-delivery/

| # | Problem | Status |
|---|---|---|
| 01 | Why does "it works on my machine" keep happening? (environment parity, containers basics) | planned |
| 02 | How do we package an app so it runs the same everywhere? (Docker, images vs. containers) | planned |
| 03 | How does code get from a commit to running in production? (CI/CD pipeline anatomy) | planned |
| 04 | Why do manual deploys eventually cause an outage? (deployment automation, repeatability) | planned |
| 05 | How do we run many containers reliably across many machines? (orchestration basics: Kubernetes concepts) | planned |
| 06 | How do we change infrastructure without clicking through a console? (Infrastructure as Code) | planned |
| 07 | How do we ship a risky change without risking everyone? (progressive delivery: canary, blue-green, feature flags) | planned |
| 08 | How do we undo a bad deploy fast? (rollback strategy, deployment safety nets) | planned |
| 09 | Why does the same code behave differently in staging vs. prod? (config management, environment-specific behavior) | planned |
| 10 | How do we know if our infrastructure itself is healthy? (infra observability, SLOs/SLIs, alerting) | planned |
| 11 | How do we avoid a surprise cloud bill? (cost awareness, resource right-sizing) | planned |
| 12 | How do we design a deployment architecture that survives a bad Friday deploy? (staff-level release engineering strategy) | planned |

## career-craft/

| # | Problem | Status |
|---|---|---|
| 01 | What does "good" actually look like at each stage of an engineering career? (leveling expectations, scope vs. title) | planned |
| 02 | How do I get useful feedback instead of vague praise? (asking for feedback, calibration) | planned |
| 03 | How do I help a junior teammate grow without doing their job for them? (mentoring fundamentals) | planned |
| 04 | How do I know if someone should get the job? (structured interviewing, avoiding bias) | planned |
| 05 | How do I build a growth plan that isn't just "work harder"? (goal-setting, skill gap analysis) | planned |
| 06 | Why doesn't being technically right guarantee being seen as senior? (impact and scope over correctness) | planned |
| 07 | How do I make my work visible without it feeling like bragging? (documentation as a career tool, brag docs) | planned |
| 08 | How do performance calibrations actually work? (calibration processes, promotion packets) | planned |
| 09 | How do I decide between staying an IC or moving into management? (IC vs. EM tracks, self-assessment) | planned |
| 10 | How do I mentor someone who is more senior than me in a different way? (peer mentoring, skip-level relationships) | planned |
| 11 | What does a staff engineer actually own that a senior doesn't? (staff scope: technical direction, org-level leverage) | planned |

## product-domain/

| # | Problem | Status |
|---|---|---|
| 01 | Why does a perfectly built feature go unused? (understanding the user's problem before the solution) | planned |
| 02 | How do I turn a vague ask into a clear requirement? (requirements gathering, user stories) | planned |
| 03 | How do I model a business domain so the code doesn't fight the business? (domain-driven design basics, ubiquitous language) | planned |
| 04 | Why do two teams describe the "same" business concept differently? (bounded contexts, shared vocabulary) | planned |
| 05 | How do I know if I'm building the right thing before I build it? (validation, prototyping, MVP thinking) | planned |
| 06 | How do I explain what my product does to someone who isn't technical? (value framing over feature framing) | planned |
| 07 | Why does a client say no to something that would clearly help them? (buyer psychology, the real objection behind the stated one) | planned |
| 08 | How do I speak the language of the person I'm selling to? (translating capability into their vocabulary — a CFO hears cost, ops hears reliability, a founder hears speed) | planned |
| 09 | How do I turn "that's technically impressive" into "I want to pay for this"? (value-based selling, ROI framing, appreciation vs. comprehension) | planned |
| 10 | How do I run a conversation that uncovers what a prospective client actually needs? (discovery, consultative selling, asking questions that open the deal) | planned |
| 11 | How do I handle "we already have something that works" or "it's too expensive"? (objection handling, negotiation) | planned |
| 12 | How do I turn one client win into a repeatable opportunity? (case studies, referrals, compounding momentum) | planned |
| 13 | How does a staff engineer use technical credibility to close a strategic deal or partnership? (presales engineering, executive-level pitching, exploiting the opportunity, not just describing it) | planned |

## corporate-politics/

| # | Problem | Status |
|---|---|---|
| 01 | Why doesn't technical merit alone decide who wins in an organization? (power as a real resource, not a dirty word) | planned |
| 02 | How does legitimate ("white") influence actually work? (reciprocity, alliance-building, being visibly useful) | planned |
| 03 | How do I read the informal org chart, not just the official one? (who actually holds influence, real decision networks) | planned |
| 04 | How do I bank goodwill before I need to spend it? (the favor economy, relationship capital) | planned |
| 05 | What is "gray" politics, and where's the line before it turns dishonest? (strategic ambiguity, selective disclosure, timing information) | planned |
| 06 | How do I control the narrative around my own work without lying? (framing, emphasis, owning the story honestly) | planned |
| 07 | How do I read a room or meeting for what's not being said? (subtext, unstated agendas, silence as signal) | planned |
| 08 | What does "black" politics actually look like in practice? (credit-stealing, scapegoating, sabotage, weaponized rumors, manufactured urgency) | planned |
| 09 | How do I recognize I'm being set up to fail? (warning signs: shifting goalposts, exclusion from key threads, sudden isolation) | planned |
| 10 | How do I protect myself with a paper trail without looking paranoid? (documentation discipline, written confirmations, CYA done well) | planned |
| 11 | How do I respond when someone takes credit for my work? (calibrated confrontation, escalating correctly) | planned |
| 12 | How do I build alliances that protect me before I need protecting? (coalition-building as defense, sponsors vs. mentors) | planned |
| 13 | How do I stay effective in a highly political org without becoming what I dislike? (staying principled, choosing battles, knowing when to exit) | planned |
| 14 | How does a staff engineer wield influence ethically at scale without playing dirty? (influence as a tool for the org's good, not personal power accumulation) | planned |

## learning-craft/

| # | Problem | Status |
|---|---|---|
| 01 | Why doesn't reading more mean learning more? (exposure vs. understanding) | planned |
| 02 | How do I find information I can actually trust? (source evaluation, primary vs. secondary sources, credibility signals) | planned |
| 03 | How do I ask a question well enough to get a useful answer? (search literacy: framing queries, going to docs/specs/source directly) | planned |
| 04 | How do I know when I've actually understood something vs. just recognized it? (the Feynman technique, teach-back, the illusion of competence) | planned |
| 05 | How do I retain what I learn instead of relearning it every few months? (spaced repetition, retrieval practice, active recall) | planned |
| 06 | How do I learn a new codebase or system fast? (systematic exploration: entry points, tracing execution, reading tests first) | planned |
| 07 | How do I evaluate conflicting expert opinions? (weighing credibility, incentives, recency, consensus vs. individual claims) | planned |
| 08 | How do I use AI/LLM tools to learn faster without atrophying my own judgment? (verification habits, not outsourcing understanding) | planned |
| 09 | How do I build a personal system for capturing and resurfacing what I learn? (notes, spaced review, second-brain practices) | planned |
| 10 | How do I decide what's worth learning deeply vs. skimming? (prioritization, the cost of depth, just-in-time vs. just-in-case learning) | planned |
| 11 | How do I keep up with a fast-moving field without drowning in noise? (curation, filtering, signal vs. hype) | planned |
| 12 | How do I develop good technical judgment, not just knowledge? (calibration, learning from being wrong, building intuition through deliberate practice) | planned |
| 13 | How does a staff engineer learn fast enough to be credible across domains they don't own? (breadth-depth trade-off at scale, asking the right expert the right question) | planned |

## Notes on ordering

- Numbers reflect complexity ordering *within* a track, not a global session order.
- Track choice per session is decided live (see `CLAUDE.md`), so it's normal and expected to jump between tracks rather than clearing one top-to-bottom.
- Late-track units (e.g. `web/17`, `systems/17`, `git-teamwork/16`, `business-communication/14`, `logic/12`, `security/13`, `infra-delivery/12`, `career-craft/11`, `product-domain/13`, `corporate-politics/14`, `learning-craft/13`) are intentionally where the tracks start blending into each other — that's the point at which staff-level judgment lives, and cross-references between tracks are expected there.
- `logic/` and `learning-craft/` are both transversal (see `docs/ARCHITECTURE.md`) — in practice they tend to get reinforced by every other track rather than studied in total isolation, but each still has its own complete sequence here.
