# Roadmap

Source of truth for scope. Each row is a unit: a problem to understand, ordered by increasing complexity within its track (not a fixed session order — see `docs/ARCHITECTURE.md`). No unit is labeled by seniority; the ordering itself is the progression.

Status legend: `planned` · `in-progress` · `done`. Update this file whenever a unit's status, wording, or order changes — it must reflect reality.

## web/

| #   | Slug                          | Problem                                                                                                                 | Status  |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------- |
| 01  | http-request-response-basics  | How does a browser turn a URL into a rendered page? (HTTP request/response basics)                                      | done    |
| 02  | need-html-semantics-just-divs | Why do we need HTML semantics instead of just divs?                                                                     | done    |
| 03  | css-cascade-specificity       | How do we style once and reuse everywhere? (CSS cascade & specificity)                                                  | done    |
| 04  | dom-event-model               | How does a page react to user input without reloading? (the DOM event model)                                            | planned |
| 05  | bundling                      | Why do we need a build step at all? (bundling, transpilation, module systems)                                           | planned |
| 06  | component-state               | How do we manage state across a page without global chaos? (component state, unidirectional data flow)                  | planned |
| 07  | cors                          | Why does calling an API from the browser fail unpredictably? (CORS, async/await, error handling)                        | planned |
| 08  | client-side-caching           | How do we keep the UI in sync with the server? (client-side caching, optimistic updates)                                | planned |
| 09  | render-performance            | Why does the app get slow as it grows? (render performance, virtual DOM diffing, reflow/repaint)                        | planned |
| 10  | xss                           | How do we protect users from malicious input? (XSS, CSRF, sanitization, CSP)                                            | planned |
| 11  | cdn                           | How do we serve the same app to millions without falling over? (CDN, cache layers, edge)                                | planned |
| 12  | stateless-auth                | Why do sessions break across multiple servers? (stateless auth, JWT, cookies, sessions)                                 | planned |
| 13  | rest-graphql                  | How do we design an API contract that won't break clients as it evolves? (REST/GraphQL, versioning)                     | planned |
| 14  | bff                           | How do we keep frontend and backend teams moving independently? (BFF, API gateways, contract testing)                   | planned |
| 15  | service-boundaries            | How do we serve web, mobile, and partners from one backend without it collapsing? (service boundaries, micro-frontends) | planned |
| 16  | ssr                           | How do we make render-heavy apps fast on slow networks/devices? (SSR, streaming, hydration, edge rendering)             | planned |
| 17  | strangler-fig                 | How do we evolve a legacy web architecture without a rewrite? (strangler fig, incremental migration)                    | planned |

## systems/

| #   | Slug                    | Problem                                                                                                                      | Status  |
| --- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------- |
| 01  | process                 | What actually happens when you run a program? (process, memory layout, the OS as mediator)                                   | done    |
| 02  | persistence             | Why does my program still "remember" data after a crash? (persistence, disk vs. memory)                                      | done    |
| 03  | algorithmic-complexity  | Why is my code fast on my machine but slow in production? (algorithmic complexity, Big-O in practice)                        | done    |
| 04  | sockets                 | How do two programs talk to each other? (sockets, ports, protocols)                                                          | planned |
| 05  | concurrency             | Why does my server fall over under load? (concurrency: threads, processes, async I/O)                                        | planned |
| 06  | race-conditions         | How do we avoid two processes corrupting shared data? (race conditions, locks, atomicity)                                    | planned |
| 07  | transactions            | Why did my request "succeed" but the data never saved? (transactions, ACID)                                                  | planned |
| 08  | indexing                | How do we store data so it's fast to find later? (indexing, B-trees, hashing)                                                | planned |
| 09  | query-planning          | Why does the database get slow as data grows? (query planning, normalization vs. denormalization)                            | planned |
| 10  | timeouts                | How do we keep a service running when a dependency dies? (timeouts, retries, circuit breakers, backpressure)                 | planned |
| 11  | logging                 | How do we know something broke before the user tells us? (logging, metrics, tracing, observability)                          | planned |
| 12  | horizontal-scaling      | How do we scale beyond one machine? (horizontal scaling, load balancing, statelessness)                                      | planned |
| 13  | cap-theorem             | How do two datacenters agree on the truth? (CAP theorem, consistency models)                                                 | planned |
| 14  | queues                  | How do we move data between systems without losing or duplicating it? (queues, delivery guarantees)                          | planned |
| 15  | redundancy              | How do we design a system that survives a whole region going down? (redundancy, failover, disaster recovery)                 | planned |
| 16  | domain-boundaries       | How do we evolve a monolith into services without a big-bang rewrite? (domain boundaries, strangler pattern)                 | planned |
| 17  | trade-off-documentation | How do we reason about a system nobody has fully seen end-to-end? (trade-off documentation, ADRs, staff-level system design) | planned |

## git-teamwork/

| #   | Slug                    | Problem                                                                                                                       | Status  |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- |
| 01  | snapshots-manual-copies | Why do we need version control at all? (snapshots vs. manual copies)                                                          | done    |
| 02  | checkout                | How do I undo a mistake without losing everything? (checkout, revert, reset semantics)                                        | done    |
| 03  | working-tree            | Why did my change disappear when I switched branches? (working tree, staging, commit model)                                   | done    |
| 04  | merge                   | How do two people edit the same file without destroying each other's work? (merge, conflicts)                                 | planned |
| 05  | merge-rebase            | Why does `git pull` sometimes create a mess? (merge vs. rebase, fast-forward)                                                 | planned |
| 06  | commit-conventions      | How do we keep history readable as a team? (commit conventions, atomic commits)                                               | planned |
| 07  | branching-strategies    | How do we let many people ship to the same codebase safely? (branching strategies: trunk-based vs. gitflow)                   | planned |
| 08  | prs                     | How do we catch mistakes before they reach main? (PRs, review culture, CI gating)                                             | planned |
| 09  | shared-history          | Why did a "safe" force-push break someone else's day? (shared history, rewriting risk)                                        | planned |
| 10  | feature-flags           | How do we ship fast without breaking main constantly? (feature flags, small PRs, trunk hygiene)                               | planned |
| 11  | reflog                  | How do we recover history after someone really messes it up? (reflog, bisect, forensic git)                                   | planned |
| 12  | feedback-framing        | How do we review code without making it personal? (feedback framing, async review etiquette)                                  | planned |
| 13  | rfcs                    | How do we disagree with a teammate's technical decision productively? (RFCs, design docs, disagree-and-commit)                | planned |
| 14  | documentation-culture   | How do we onboard someone into years of undocumented decisions? (documentation culture, ADRs)                                 | planned |
| 15  | ownership               | How do we run a team where nobody knows everything? (ownership, on-call, knowledge sharing)                                   | planned |
| 16  | technical-leadership    | How does a staff engineer influence a codebase without writing most of the code? (technical leadership, cross-team alignment) | planned |

## business-communication/

| #   | Slug                                     | Problem                                                                                                              | Status  |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------- |
| 01  | audience-awareness                       | Why does the same message land differently depending on who says it? (audience awareness)                            | done    |
| 02  | status-updates-build-trust               | How do I explain a technical delay without sounding like an excuse? (status updates that build trust)                | done    |
| 03  | reading-stakeholder-incentives           | Why did my "obviously right" proposal get rejected? (reading stakeholder incentives)                                 | done    |
| 04  | pushback-frameworks                      | How do I say no to a request without burning the relationship? (pushback frameworks)                                 | planned |
| 05  | building-credibility-ahead-ask           | How do I get buy-in before I need it? (building credibility ahead of the ask)                                        | planned |
| 06  | decision-making-frameworks               | Why do meetings feel like they decide nothing? (decision-making frameworks: DACI/RACI)                               | planned |
| 07  | executive-summaries                      | How do I write a doc that busy executives actually read? (executive summaries, BLUF)                                 | planned |
| 08  | conflict-resolution                      | How do I navigate two teams that both think they own the same thing? (conflict resolution, escalation paths)         | planned |
| 09  | visibility-self-promotion                | How do I get credit for my work without appearing to seek it? (visibility without self-promotion)                    | planned |
| 10  | informal-authority                       | How do I influence a decision I don't own? (informal authority, coalition-building)                                  | planned |
| 11  | upward-disagreement                      | How do I tell someone senior "this plan will fail"? (upward disagreement, psychological safety)                      | planned |
| 12  | change-management                        | How do I lead a team through a reorg or layoffs? (change management, uncertainty)                                    | planned |
| 13  | translating-technical-risk-business-risk | How do I represent engineering trade-offs to non-technical leadership? (translating technical risk to business risk) | planned |
| 14  | org-level-influence                      | How does a staff engineer shape company-wide technical direction? (org-level influence, technical strategy)          | planned |

## logic/

| #   | Slug                                     | Problem                                                                                                                    | Status  |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------- |
| 01  | formal-informal-logic                    | What actually makes an argument valid vs. just convincing? (formal vs. informal logic)                                     | done    |
| 02  | fallacies                                | Why does "if it's not A, it must be B" often fail? (fallacies, false dichotomy)                                            | done    |
| 03  | problem-decomposition                    | How do I break a vague problem into solvable pieces? (problem decomposition)                                               | planned |
| 04  | boolean-logic                            | Why do two "correct" pieces of code produce different results? (boolean logic, precedence, De Morgan's laws)               | planned |
| 05  | state-machines                           | How do I reason about a system with many possible states? (state machines, truth tables)                                   | planned |
| 06  | edge-case-reasoning                      | How do I prove my code handles every case, not just the ones I tested? (edge case reasoning, invariants)                   | planned |
| 07  | induction                                | How do I reason about something recursive without getting lost? (induction, recursion tracing)                             | planned |
| 08  | fermi-estimation                         | How do I estimate an answer when I can't compute the exact one? (Fermi estimation, back-of-envelope reasoning)             | planned |
| 09  | expected-value                           | How do I make a decision under uncertainty? (expected value, probabilistic reasoning)                                      | planned |
| 10  | correlation-causation                    | How do I avoid fooling myself with data? (correlation vs. causation, cognitive biases, base rate fallacy)                  | planned |
| 11  | abstraction                              | How do I formally model a messy real-world problem well enough to solve it? (abstraction, formal modeling)                 | planned |
| 12  | multi-criteria-decisions-under-ambiguity | How does a staff engineer reason about trade-offs with no clearly right answer? (multi-criteria decisions under ambiguity) | planned |

## security/

| #   | Slug                                   | Problem                                                                                                                                     | Status  |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 01  | security-mindset                       | Why doesn't "it works" mean "it's safe"? (the security mindset, threat modeling basics)                                                     | done    |
| 02  | authentication-fundamentals            | How do we prove someone is who they claim to be? (authentication fundamentals, passwords, hashing)                                          | done    |
| 03  | authorization-models                   | How do we decide what an authenticated user is allowed to do? (authorization models: RBAC/ABAC)                                             | done    |
| 04  | hashing                                | Why does storing a password in plain text guarantee disaster? (hashing, salting, key derivation)                                            | planned |
| 05  | symmetric-asymmetric-encryption-basics | How do we keep data unreadable to anyone but the intended recipient? (symmetric vs. asymmetric encryption basics)                           | planned |
| 06  | tls-https                              | Why doesn't a green padlock mean a site is safe? (TLS/HTTPS, certificate trust chains)                                                      | planned |
| 07  | owasp-top-10                           | How does an attacker actually break into a web app? (OWASP top 10, in depth)                                                                | planned |
| 08  | secrets-management                     | How do we stop leaking secrets into code and logs? (secrets management, environment hygiene)                                                | planned |
| 09  | supply-chain-security                  | Why did a "trusted" open-source dependency compromise production? (supply chain security, SBOM, dependency scanning)                        | planned |
| 10  | defense-depth                          | How do we design a system assuming a component will be breached? (defense in depth, least privilege, zero trust)                            | planned |
| 11  | security-testing                       | How do we find our own vulnerabilities before attackers do? (security testing: SAST/DAST, pentesting basics)                                | planned |
| 12  | incident-response                      | How do we respond when a breach actually happens? (incident response, disclosure, post-mortems)                                             | planned |
| 13  | secure-by-design                       | How does a staff engineer bake security into architecture decisions from day one? (secure-by-design, threat modeling at system-design time) | planned |

## infra-delivery/

| #   | Slug                                     | Problem                                                                                                                  | Status  |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------- |
| 01  | environment-parity                       | Why does "it works on my machine" keep happening? (environment parity, containers basics)                                | done    |
| 02  | docker                                   | How do we package an app so it runs the same everywhere? (Docker, images vs. containers)                                 | done    |
| 03  | ci-cd-pipeline-anatomy                   | How does code get from a commit to running in production? (CI/CD pipeline anatomy)                                       | planned |
| 04  | deployment-automation                    | Why do manual deploys eventually cause an outage? (deployment automation, repeatability)                                 | planned |
| 05  | orchestration-basics                     | How do we run many containers reliably across many machines? (orchestration basics: Kubernetes concepts)                 | planned |
| 06  | infrastructure-code                      | How do we change infrastructure without clicking through a console? (Infrastructure as Code)                             | planned |
| 07  | progressive-delivery                     | How do we ship a risky change without risking everyone? (progressive delivery: canary, blue-green, feature flags)        | planned |
| 08  | rollback-strategy                        | How do we undo a bad deploy fast? (rollback strategy, deployment safety nets)                                            | planned |
| 09  | config-management                        | Why does the same code behave differently in staging vs. prod? (config management, environment-specific behavior)        | planned |
| 10  | infra-observability                      | How do we know if our infrastructure itself is healthy? (infra observability, SLOs/SLIs, alerting)                       | planned |
| 11  | cost-awareness                           | How do we avoid a surprise cloud bill? (cost awareness, resource right-sizing)                                           | planned |
| 12  | staff-level-release-engineering-strategy | How do we design a deployment architecture that survives a bad Friday deploy? (staff-level release engineering strategy) | planned |

## career-craft/

| #   | Slug                          | Problem                                                                                                                   | Status  |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------- |
| 01  | leveling-expectations         | What does "good" actually look like at each stage of an engineering career? (leveling expectations, scope vs. title)      | done    |
| 02  | asking-feedback               | How do I get useful feedback instead of vague praise? (asking for feedback, calibration)                                  | done    |
| 03  | mentoring-fundamentals        | How do I help a junior teammate grow without doing their job for them? (mentoring fundamentals)                           | done    |
| 04  | structured-interviewing       | How do I know if someone should get the job? (structured interviewing, avoiding bias)                                     | planned |
| 05  | goal-setting                  | How do I build a growth plan that isn't just "work harder"? (goal-setting, skill gap analysis)                            | planned |
| 06  | impact-scope-over-correctness | Why doesn't being technically right guarantee being seen as senior? (impact and scope over correctness)                   | planned |
| 07  | documentation-career-tool     | How do I make my work visible without it feeling like bragging? (documentation as a career tool, brag docs)               | planned |
| 08  | calibration-processes         | How do performance calibrations actually work? (calibration processes, promotion packets)                                 | planned |
| 09  | ic-em-tracks                  | How do I decide between staying an IC or moving into management? (IC vs. EM tracks, self-assessment)                      | planned |
| 10  | peer-mentoring                | How do I mentor someone who is more senior than me in a different way? (peer mentoring, skip-level relationships)         | planned |
| 11  | staff-scope                   | What does a staff engineer actually own that a senior doesn't? (staff scope: technical direction, org-level leverage)     | planned |
| 12  | market-research               | How do I evaluate whether an offer or raise is actually fair? (market research, total comp literacy)                      | planned |
| 13  | negotiation-tactics           | How do I negotiate compensation without damaging the relationship? (negotiation tactics, anchoring, knowing when to walk) | planned |

## product-domain/

| #   | Slug                                             | Problem                                                                                                                                                                                            | Status  |
| --- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 01  | understanding-user-s-problem-solution            | Why does a perfectly built feature go unused? (understanding the user's problem before the solution)                                                                                               | done    |
| 02  | requirements-gathering                           | How do I turn a vague ask into a clear requirement? (requirements gathering, user stories)                                                                                                         | done    |
| 03  | domain-driven-design-basics                      | How do I model a business domain so the code doesn't fight the business? (domain-driven design basics, ubiquitous language)                                                                        | done    |
| 04  | bounded-contexts                                 | Why do two teams describe the "same" business concept differently? (bounded contexts, shared vocabulary)                                                                                           | planned |
| 05  | validation                                       | How do I know if I'm building the right thing before I build it? (validation, prototyping, MVP thinking)                                                                                           | planned |
| 06  | value-framing-over-feature-framing               | How do I explain what my product does to someone who isn't technical? (value framing over feature framing)                                                                                         | planned |
| 07  | buyer-psychology                                 | Why does a client say no to something that would clearly help them? (buyer psychology, the real objection behind the stated one)                                                                   | planned |
| 08  | translating-capability-into-their-vocabulary-cfo | How do I speak the language of the person I'm selling to? (translating capability into their vocabulary — a CFO hears cost, ops hears reliability, a founder hears speed)                          | planned |
| 09  | value-based-selling                              | How do I turn "that's technically impressive" into "I want to pay for this"? (value-based selling, ROI framing, appreciation vs. comprehension)                                                    | planned |
| 10  | discovery                                        | How do I run a conversation that uncovers what a prospective client actually needs? (discovery, consultative selling, asking questions that open the deal)                                         | planned |
| 11  | objection-handling                               | How do I handle "we already have something that works" or "it's too expensive"? (objection handling, negotiation)                                                                                  | planned |
| 12  | case-studies                                     | How do I turn one client win into a repeatable opportunity? (case studies, referrals, compounding momentum)                                                                                        | planned |
| 13  | presales-engineering                             | How does a staff engineer use technical credibility to close a strategic deal or partnership? (presales engineering, executive-level pitching, exploiting the opportunity, not just describing it) | planned |

## corporate-politics/

| #   | Slug                       | Problem                                                                                                                                                       | Status  |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 01  | power-real-resource        | Why doesn't technical merit alone decide who wins in an organization? (power as a real resource, not a dirty word)                                            | done    |
| 02  | white                      | How does legitimate ("white") influence actually work? (reciprocity, alliance-building, being visibly useful)                                                 | done    |
| 03  | who-holds-influence        | How do I read the informal org chart, not just the official one? (who actually holds influence, real decision networks)                                       | done    |
| 04  | favor-economy              | How do I bank goodwill before I need to spend it? (the favor economy, relationship capital)                                                                   | planned |
| 05  | strategic-ambiguity        | What is "gray" politics, and where's the line before it turns dishonest? (strategic ambiguity, selective disclosure, timing information)                      | planned |
| 06  | framing                    | How do I control the narrative around my own work without lying? (framing, emphasis, owning the story honestly)                                               | planned |
| 07  | subtext                    | How do I read a room or meeting for what's not being said? (subtext, unstated agendas, silence as signal)                                                     | planned |
| 08  | credit-stealing            | What does "black" politics actually look like in practice? (credit-stealing, scapegoating, sabotage, weaponized rumors, manufactured urgency)                 | planned |
| 09  | warning-signs              | How do I recognize I'm being set up to fail? (warning signs: shifting goalposts, exclusion from key threads, sudden isolation)                                | planned |
| 10  | documentation-discipline   | How do I protect myself with a paper trail without looking paranoid? (documentation discipline, written confirmations, CYA done well)                         | planned |
| 11  | calibrated-confrontation   | How do I respond when someone takes credit for my work? (calibrated confrontation, escalating correctly)                                                      | planned |
| 12  | coalition-building-defense | How do I build alliances that protect me before I need protecting? (coalition-building as defense, sponsors vs. mentors)                                      | planned |
| 13  | staying-principled         | How do I stay effective in a highly political org without becoming what I dislike? (staying principled, choosing battles, knowing when to exit)               | planned |
| 14  | influence-tool-org-s-good  | How does a staff engineer wield influence ethically at scale without playing dirty? (influence as a tool for the org's good, not personal power accumulation) | planned |

## learning-craft/

| #   | Slug                          | Problem                                                                                                                                                                  | Status  |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| 01  | exposure-understanding        | Why doesn't reading more mean learning more? (exposure vs. understanding)                                                                                                | done    |
| 02  | source-evaluation             | How do I find information I can actually trust? (source evaluation, primary vs. secondary sources, credibility signals)                                                  | done    |
| 03  | search-literacy               | How do I ask a question well enough to get a useful answer? (search literacy: framing queries, going to docs/specs/source directly)                                      | done    |
| 04  | feynman-technique             | How do I know when I've actually understood something vs. just recognized it? (the Feynman technique, teach-back, the illusion of competence)                            | planned |
| 05  | spaced-repetition             | How do I retain what I learn instead of relearning it every few months? (spaced repetition, retrieval practice, active recall)                                           | planned |
| 06  | systematic-exploration        | How do I learn a new codebase or system fast? (systematic exploration: entry points, tracing execution, reading tests first)                                             | planned |
| 07  | weighing-credibility          | How do I evaluate conflicting expert opinions? (weighing credibility, incentives, recency, consensus vs. individual claims)                                              | planned |
| 08  | verification-habits           | How do I use AI/LLM tools to learn faster without atrophying my own judgment? (verification habits, not outsourcing understanding)                                       | planned |
| 09  | notes                         | How do I build a personal system for capturing and resurfacing what I learn? (notes, spaced review, second-brain practices)                                              | planned |
| 10  | prioritization                | How do I decide what's worth learning deeply vs. skimming? (prioritization, the cost of depth, just-in-time vs. just-in-case learning)                                   | planned |
| 11  | curation                      | How do I keep up with a fast-moving field without drowning in noise? (curation, filtering, signal vs. hype)                                                              | planned |
| 12  | calibration                   | How do I develop good technical judgment, not just knowledge? (calibration, learning from being wrong, building intuition through deliberate practice)                   | planned |
| 13  | breadth-depth-trade-off-scale | How does a staff engineer learn fast enough to be credible across domains they don't own? (breadth-depth trade-off at scale, asking the right expert the right question) | planned |

## applied-math/

| #   | Slug                                         | Problem                                                                                                                                                                 | Status  |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 01  | math-tool-prediction                         | Why do engineers need math beyond what a compiler already checks? (math as a tool for prediction, not just correctness)                                                 | done    |
| 02  | measurement-theory                           | How do I measure something I can't directly observe? (measurement theory, units, instrumentation basics)                                                                | done    |
| 03  | orders-magnitude                             | How do I know if a number is big or small without relying on gut feeling? (orders of magnitude, dimensional analysis)                                                   | done    |
| 04  | asymptotic-analysis                          | How do I reason precisely about growth as input size increases? (asymptotic analysis, Big-O put on rigorous footing)                                                    | planned |
| 05  | combinatorics                                | How do I count possibilities without enumerating them? (combinatorics: permutations, combinations, foundations of probability)                                          | planned |
| 06  | probability-distributions-uniform            | How do I model something that involves chance? (probability distributions — uniform, binomial, normal — and where each shows up in systems)                             | planned |
| 07  | queueing-theory-basics                       | How do I predict how a system behaves under load before it's built? (queueing theory basics: Little's Law, latency vs. throughput)                                      | planned |
| 08  | statistics                                   | How do I know if a difference I measured is real or noise? (statistics: mean/variance/std. dev., confidence intervals, significance)                                    | planned |
| 09  | time-series-basics                           | How do I forecast a trend from historical data? (time series basics, extrapolation, regression fundamentals)                                                            | planned |
| 10  | graph-theory-basics                          | How do I reason precisely about relationships between entities? (graph theory basics: nodes/edges, shortest path, why it's everywhere)                                  | planned |
| 11  | linear-algebra-basics-vectors-matrices-where | How do I reason precisely about state and transformation? (linear algebra basics — vectors/matrices — and where they show up: graphics, ML, transforms)                 | planned |
| 12  | capacity-planning-math                       | How do I calculate capacity before I need it? (capacity planning math: throughput budgets, latency budgets, back-of-envelope sizing)                                    | planned |
| 13  | unit-economics                               | How do I cost something quantitatively instead of guessing? (unit economics, cost modeling, amortization)                                                               | planned |
| 14  | expected-value                               | How do I reason about risk with numbers instead of gut feel? (expected value, decision trees, quantitative risk modeling)                                               | planned |
| 15  | quantitative-modeling-design-decisions       | How does a staff engineer use math to settle an architecture debate instead of opinion? (quantitative modeling for design decisions, defending numbers in a design doc) | planned |

## testing-quality/

| #   | Slug                    | Problem                                                                                                                                               | Status  |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 01  | case-automated-testing  | Why doesn't "it passed my manual check" mean it works? (the case for automated testing)                                                               | done    |
| 02  | test-pyramid            | How do I know what level to test something at? (the test pyramid: unit vs. integration vs. e2e)                                                       | done    |
| 03  | assertions-matter       | How do I write a test that actually catches bugs, not just exercises code? (assertions that matter, avoiding tautological tests)                      | planned |
| 04  | tdd-basics              | Why does writing the test first change the design? (TDD basics, red-green-refactor)                                                                   | planned |
| 05  | bdd                     | How do I test behavior instead of implementation? (BDD, testing through the public interface)                                                         | planned |
| 06  | test-doubles            | How do I test something that depends on time, randomness, or external services? (test doubles: mocks/stubs/fakes, seams)                              | planned |
| 07  | flaky-tests             | Why does my test suite pass locally but fail in CI? (flaky tests, non-determinism, environment leakage)                                               | planned |
| 08  | mutation-testing        | How do I know if my tests are actually testing anything? (mutation testing, coverage as a signal, not a target)                                       | planned |
| 09  | property-based-testing  | How do I test properties instead of examples? (property-based testing, generative testing)                                                            | planned |
| 10  | contract-testing        | How do I test that two services still agree on their contract? (contract testing, consumer-driven contracts)                                          | planned |
| 11  | fault-injection         | How do I test a system's behavior under failure, not just the happy path? (fault injection, failure-mode testing)                                     | planned |
| 12  | test-suite-architecture | How do I keep a test suite fast and trustworthy as the codebase grows? (test suite architecture, parallelization, quarantine strategy)                | planned |
| 13  | quality-culture         | How does a staff engineer build a culture where quality is everyone's job, not QA's? (quality culture, testing strategy as an architectural decision) | planned |

## software-design/

| #   | Slug                                | Problem                                                                                                                                                            | Status  |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| 01  | cost-design                         | Why does code that "just works" become impossible to change six months later? (the cost of design, not just correctness)                                           | done    |
| 02  | single-responsibility               | How do I decide where one function's responsibility ends? (single responsibility, cohesion vs. coupling)                                                           | done    |
| 03  | naming                              | How do I name and structure things so the code explains itself? (naming, readability as a design tool)                                                             | done    |
| 04  | dry                                 | Why does copy-pasting code eventually blow up? (DRY, abstraction, and the trap of premature abstraction)                                                           | planned |
| 05  | solid-principles                    | How do I design so a change in one place doesn't ripple everywhere? (SOLID principles, dependency inversion)                                                       | planned |
| 06  | oop-design-trade-offs               | When should I use inheritance vs. composition? (OOP design trade-offs)                                                                                             | planned |
| 07  | immutability                        | What does functional programming actually buy me? (immutability, pure functions, managing side effects)                                                            | planned |
| 08  | classic-design-patterns             | How do I recognize a design pattern I actually need vs. cargo-culting one? (classic design patterns, when they help vs. hurt)                                      | planned |
| 09  | refactoring-technique               | How do I change a design safely once it's already tangled? (refactoring technique, safe transformation steps)                                                      | planned |
| 10  | technical-debt-deliberate-trade-off | How do I know how much technical debt is acceptable? (technical debt as a deliberate trade-off, not just a sin)                                                    | planned |
| 11  | api-design                          | How do I design an interface or API that's hard to misuse? (API design, defensive design, making illegal states unrepresentable)                                   | planned |
| 12  | evolutionary-design                 | How do I evolve a design as requirements change without a rewrite? (evolutionary design, the open-closed principle in practice)                                    | planned |
| 13  | long-term-design-judgment           | How does a staff engineer make a design decision that will outlive their own tenure on the project? (long-term design judgment, designing for whoever inherits it) | planned |

## sustainable-performance/

| #   | Slug                                | Problem                                                                                                                                              | Status  |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 01  | myth-linear-output                  | Why does working more hours eventually produce less, not more? (the myth of linear output, diminishing returns)                                      | done    |
| 02  | early-warning-signs                 | How do I recognize burnout before it takes me out completely? (early warning signs, tired vs. burned out)                                            | done    |
| 03  | attention-management                | How do I protect focus time in a job full of interruptions? (attention management, deep work vs. shallow work)                                       | planned |
| 04  | energy-management-across-day-week   | How do I manage energy, not just time? (energy management across a day/week, matching task type to energy state)                                     | planned |
| 05  | sustainable-boundary-setting        | How do I say no to more work without it looking like I can't handle my job? (sustainable boundary-setting)                                           | planned |
| 06  | recovery-practices-crunch           | How do I recover from a genuinely brutal period without carrying it forward? (recovery practices after crunch, incidents, layoffs)                   | planned |
| 07  | sustainable-long-term-learning-pace | How do I keep growing technically without it consuming my whole identity? (sustainable long-term learning pace)                                      | planned |
| 08  | long-horizon-sustainability         | How does a staff engineer sustain high output over a decade, not just a good quarter? (long-horizon sustainability, pacing a career like a marathon) | planned |

## people-management/

| #   | Slug                          | Problem                                                                                                                                          | Status  |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| 01  | ic-excellence-management      | Why does managing people require different skills than being good at the work itself? (IC excellence vs. management, the transition problem)     | done    |
| 02  | 1                             | How do I run a 1:1 that's actually useful, not just a status check? (1:1 structure, listening, coaching questions)                               | done    |
| 03  | delegation-levels             | How do I delegate work without either micromanaging or abandoning it? (delegation levels, trust but verify)                                      | done    |
| 04  | sbi-framework                 | How do I give feedback that changes behavior instead of just being heard? (SBI framework, feedback timing, difficult conversations)              | planned |
| 05  | goal-setting                  | How do I set goals for a team that actually align with what the org needs? (goal-setting, OKRs, translating strategy downward)                   | planned |
| 06  | early-signals                 | How do I know if someone on my team is struggling before it's a crisis? (early signals, psychological safety, checking in)                       | planned |
| 07  | mediation                     | How do I handle conflict between two people on my team? (mediation, staying neutral, addressing root cause)                                      | planned |
| 08  | defining-role                 | How do I hire well instead of just filling a seat? (defining the role, structured hiring loop, avoiding the halo effect)                         | planned |
| 09  | onboarding-design             | How do I onboard someone so they're productive fast without overwhelming them? (onboarding design, ramp plans)                                   | planned |
| 10  | calibration                   | How do I evaluate performance fairly across a team with different roles and levels? (calibration, avoiding recency/bias, writing honest reviews) | planned |
| 11  | performance-improvement-plans | How do I have the conversation when someone isn't meeting the bar? (performance improvement plans, documentation, the conversation itself)       | planned |
| 12  | termination-process           | How do I let someone go with both fairness and care? (termination process, dignity, legal/practical basics)                                      | planned |
| 13  | bus-factor                    | How do I build a team that's resilient to any one person leaving? (bus factor, succession, knowledge distribution)                               | planned |
| 14  | org-design                    | How do I decide how to structure a growing team? (org design, span of control, when to split a team)                                             | planned |
| 15  | management-managers           | How do I lead managers, not just individual contributors? (management of managers, setting culture at scale, second-order leadership)            | planned |

## Notes on ordering

- Numbers reflect complexity ordering _within_ a track, not a global session order.
- Track choice per session is decided live (see `CLAUDE.md`), so it's normal and expected to jump between tracks rather than clearing one top-to-bottom.
- Late-track units (e.g. `web/17`, `systems/17`, `git-teamwork/16`, `business-communication/14`, `logic/12`, `security/13`, `infra-delivery/12`, `career-craft/13`, `product-domain/13`, `corporate-politics/14`, `learning-craft/13`, `applied-math/15`, `testing-quality/13`, `software-design/13`, `sustainable-performance/08`) are intentionally where the tracks start blending into each other — that's the point at which staff-level judgment lives, and cross-references between tracks are expected there.
- `logic/`, `learning-craft/`, and `applied-math/` are all transversal (see `docs/ARCHITECTURE.md`) — in practice they tend to get reinforced by every other track rather than studied in total isolation, but each still has its own complete sequence here. In particular, `applied-math/06`, `07`, and `12` are expected to be cross-referenced directly from `systems/` and `web/` units on load, capacity, and reliability.
- `testing-quality/` and `software-design/` are expected to be cross-referenced constantly from `web/` and `systems/` units — they document the craft underneath most implementation work in those tracks, at a level of generality neither track covers on its own.
- `career-craft/12` and `13` (compensation negotiation) were added as an extension of the existing track rather than a new one — negotiation is a career mechanic, not a separate family.
- `people-management/` was added because the user specifically plans to lead teams — it is not assumed as universal staff-track content. It is the one track in this roadmap explicitly scoped to a management path rather than a pure-IC path, and leans on `career-craft/`, `corporate-politics/`, and `business-communication/` throughout (e.g. `people-management/04` on feedback pairs directly with `git-teamwork/12` on code review feedback, and `people-management/15` on leading managers is close in spirit to `corporate-politics/14` on ethical influence at scale).
