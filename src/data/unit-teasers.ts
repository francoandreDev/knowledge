// Short "what you'd assume vs. what it actually is" hooks, one per unit —
// used by TopicMythModal.astro to invite deeper reading from track listing
// pages. Keyed by `${track}/${slug}` so it can share the same modal
// component as TRACK_TEASERS without colliding (track keys never contain
// a "/"). Deliberately brief marketing copy, not curriculum content —
// CLAUDE.md's content-generation rules govern L1/L2/L3 units, not this.
export interface UnitTeaser {
  myth: string;
  reality: string;
}

export const UNIT_TEASERS: Record<string, UnitTeaser> = {
  // web/
  "web/http-request-response-basics": {
    myth: "A URL just tells the browser which file to fetch.",
    reality:
      'It kicks off a negotiated exchange — DNS, TCP, headers, status codes — and most "it works on my machine" bugs live in that exchange, not the file.',
  },
  "web/need-html-semantics-just-divs": {
    myth: "A div is a div — screen readers and search engines don't care what tag you use.",
    reality:
      "Semantic tags are the API your markup exposes to every non-visual consumer of the page — get them wrong and accessibility and SEO both silently break.",
  },
  "web/css-cascade-specificity": {
    myth: 'CSS conflicts are just "whoever\'s last in the file wins."',
    reality:
      "The cascade resolves by a specificity score first, source order second — the bug that looks random is usually a specificity fight you can't see.",
  },
  "web/dom-event-model": {
    myth: "A click handler just fires when you click the element.",
    reality:
      "Every event travels down and back up the DOM tree first — capture then bubble — and not knowing that phase model is why delegated handlers misbehave.",
  },
  "web/bundling": {
    myth: "A build step is just extra tooling slowing down a simple page.",
    reality:
      "It's what turns hundreds of module files and non-browser syntax into something a browser can actually load fast — skip it and you ship megabytes of dead weight.",
  },
  "web/component-state": {
    myth: "State is just a variable that a component remembers.",
    reality:
      "It's a data-flow discipline — who owns a value and who's just displaying it — and getting that backwards is how UIs turn into untraceable spaghetti.",
  },
  "web/cors": {
    myth: "A CORS error means the API is broken.",
    reality:
      "It's the browser enforcing a security boundary the server has to explicitly opt out of — the API is fine, the response just didn't say the browser could trust it.",
  },
  "web/client-side-caching": {
    myth: "The UI just shows whatever the server last sent.",
    reality:
      "Real apps show an optimistic guess before the server even responds, then reconcile — mishandle that reconciliation and users see stale or flickering data.",
  },
  "web/render-performance": {
    myth: "A slow app just needs a faster framework.",
    reality:
      "Most slowness is unnecessary re-renders and layout thrashing the framework can't fix for you — the fix is understanding the diff, not the label on the box.",
  },
  "web/xss": {
    myth: "Sanitizing input once at the front door keeps a site safe.",
    reality:
      "Escaping, sanitization, and CSP are independent, stacked defenses — treating any one of them as sufficient is exactly how a stored script tag ends up executing.",
  },
  "web/cdn": {
    myth: "A CDN is just a bigger, faster version of your one server.",
    reality:
      "It's a distributed cache layer with its own invalidation and staleness problems — the app you build now has to reason about copies of itself, not just one source of truth.",
  },
  "web/stateless-auth": {
    myth: "Login just means the server remembers you're logged in.",
    reality:
      "At scale nothing remembers you — a signed token you carry with every request has to prove it, which is why sessions quietly break the moment there's more than one server.",
  },
  "web/rest-graphql": {
    myth: "An API contract is just the endpoints you happen to expose today.",
    reality:
      "It's a promise to every client that already integrated — change it carelessly and you break apps you don't control and can't redeploy.",
  },
  "web/bff": {
    myth: "Frontend and backend teams just need to talk more to stay in sync.",
    reality:
      "A backend-for-frontend is an architectural boundary that removes the need to coordinate — it lets each team ship on its own schedule instead of relying on discipline.",
  },
  "web/service-boundaries": {
    myth: "One backend can serve web, mobile, and partners with a few if-statements.",
    reality:
      "Each consumer has different shapes, versions, and failure tolerances — without real boundaries, the backend becomes the place every client's assumptions collide.",
  },
  "web/ssr": {
    myth: "Server-side rendering just means the HTML shows up a bit sooner.",
    reality:
      "It changes who does the work and when — done wrong, hydration mismatches and streaming order create bugs a client-only app never had to face.",
  },
  "web/strangler-fig": {
    myth: "Modernizing legacy web architecture means a clean rewrite from scratch.",
    reality:
      "A rewrite usually loses to the old system before it ships — the strangler pattern replaces it piece by piece behind a stable front door instead.",
  },

  // systems/
  "systems/process": {
    myth: "Running a program just means the code starts executing.",
    reality:
      'The OS hands it an isolated memory space and mediates everything it touches — most "impossible" bugs are that mediation surfacing, not your logic.',
  },
  "systems/persistence": {
    myth: "Saving data to disk means it's safe the instant you write it.",
    reality:
      "Writes pass through layers of buffering before they're actually durable — a crash at the wrong moment can lose data you thought was already saved.",
  },
  "systems/algorithmic-complexity": {
    myth: "If the code runs fast on your laptop, it'll run fast in production.",
    reality:
      "Big-O describes how work scales with input size — a fine algorithm on a thousand rows can be unusable on a million, with no code change at all.",
  },
  "systems/sockets": {
    myth: 'Two programs "talking" is just calling a function on the other one.',
    reality:
      "It's a negotiated byte stream over a network that can drop, reorder, or delay — sockets are the contract that makes that unreliable channel usable at all.",
  },
  "systems/concurrency": {
    myth: "Handling more users just means the server does more work per second.",
    reality:
      "It means juggling many things at once without any of them blocking the rest — get the concurrency model wrong and load doesn't slow you down, it stalls you.",
  },
  "systems/race-conditions": {
    myth: "Two processes touching the same data at once is fine as long as each one's logic is correct.",
    reality:
      "Correctness in isolation says nothing about interleaving — the exact same code can corrupt data purely because of unlucky timing.",
  },
  "systems/transactions": {
    myth: "If the server returned success, the data is definitely saved.",
    reality:
      'Between "the write started" and "the write is durable" there\'s a gap a crash can land in — transactions are what closes that gap, not the success response.',
  },
  "systems/indexing": {
    myth: "A database just scans until it finds what you asked for.",
    reality:
      "A well-chosen index turns that scan into a lookup — the difference between a query that's instant and one that gets slower every day your table grows.",
  },
  "systems/query-planning": {
    myth: "A slow query just needs more server hardware.",
    reality:
      "Most slowdowns come from how the data is shaped and joined, not the machine underneath — normalization and indexing choices decide the ceiling hardware can't buy back.",
  },
  "systems/timeouts": {
    myth: "If a dependency is slow, your service just waits a bit longer.",
    reality:
      "Waiting without a limit lets one dead dependency exhaust your own resources — timeouts, retries, and circuit breakers are what stop that failure from spreading.",
  },
  "systems/logging": {
    myth: "You'll know something's wrong when a user complains.",
    reality:
      "By then it's already cost you — logging, metrics, and tracing are what surface a break in the minutes after it happens instead of the hours after someone notices.",
  },
  "systems/horizontal-scaling": {
    myth: "Scaling just means adding more servers behind a load balancer.",
    reality:
      'It only works if the app was built stateless — any server that "remembers" a specific user quietly breaks the moment traffic is spread across more than one.',
  },
  "systems/cap-theorem": {
    myth: "Two datacenters can always be perfectly in sync and always available.",
    reality:
      "During a network partition you have to pick one or the other — CAP theorem is the hard trade-off every distributed system makes, whether its designers admit it or not.",
  },
  "systems/queues": {
    myth: "Sending data between systems is just calling one from the other.",
    reality:
      "A direct call fails the instant the receiver is down — a queue decouples the two and gives you an explicit, tunable guarantee about what happens to a message that fails.",
  },
  "systems/redundancy": {
    myth: "A backup server means you're covered if something goes down.",
    reality:
      "Surviving a whole region failing requires redundancy and failover designed and tested in advance — the backup you never tested is the one that doesn't work when you need it.",
  },
  "systems/domain-boundaries": {
    myth: "Breaking a monolith into services just means splitting the folders.",
    reality:
      "Without real domain boundaries the split just moves the tangled dependencies over a network — now they're slower and harder to debug, not decoupled.",
  },
  "systems/trade-off-documentation": {
    myth: "A system design is either right or wrong, and a good engineer just knows which.",
    reality:
      "At scale nobody has seen the whole system — an ADR is what lets someone months later understand *why* a trade-off was made, not just what was chosen.",
  },

  // git-teamwork/
  "git-teamwork/snapshots-manual-copies": {
    myth: "Version control is just a fancier way to keep backup copies of a folder.",
    reality:
      'It\'s a structured history of every change with authorship and intent attached — the difference between "file-final-v3-actually-final.zip" and something a team can actually reason about.',
  },
  "git-teamwork/checkout": {
    myth: 'Undoing a mistake in git is basically one universal "undo" command.',
    reality:
      'Checkout, reset, and revert hit three different targets — get the wrong one and "undo" can just as easily erase work you meant to keep.',
  },
  "git-teamwork/working-tree": {
    myth: "An uncommitted change just stays wherever you left it.",
    reality:
      "It lives in the working tree, tied to whatever branch is checked out — switch branches without committing or stashing and that change looks like it vanished.",
  },
  "git-teamwork/merge": {
    myth: "Two people editing the same file always means a conflict.",
    reality:
      "Git merges non-overlapping changes automatically line by line — a real conflict only happens when two people touch the *same* lines, and merge is what surfaces just that.",
  },
  "git-teamwork/merge-rebase": {
    myth: "`git pull` always does the same safe thing.",
    reality:
      "It's a merge by default, silently creating a merge commit — which is exactly the mess a team expecting a clean, linear history didn't ask for.",
  },
  "git-teamwork/commit-conventions": {
    myth: "Commit messages are just a formality nobody actually reads.",
    reality:
      "A readable, atomic commit history is what makes `git bisect` and code archaeology possible six months later — the messages are for future-you, not the reviewer today.",
  },
  "git-teamwork/branching-strategies": {
    myth: "Branching strategy is just a style preference between teams.",
    reality:
      'It decides how long code diverges before it\'s tested together — trunk-based and gitflow trade integration pain now against integration pain later, not "none."',
  },
  "git-teamwork/prs": {
    myth: "A PR is just a formality before the code merges.",
    reality:
      "It's the last real checkpoint before a mistake reaches everyone else — CI catches what's mechanical, a reviewer catches what CI structurally can't.",
  },
  "git-teamwork/shared-history": {
    myth: "Force-pushing is just a normal way to clean up your own branch.",
    reality:
      'On shared history it can silently overwrite commits a teammate already built on — "safe" only if you\'re certain nobody else has that history yet.',
  },
  "git-teamwork/feature-flags": {
    myth: "Shipping fast means merging straight to main and hoping nothing breaks.",
    reality:
      "Feature flags let incomplete work merge to main safely, hidden until it's ready — speed comes from small, flag-gated changes, not from skipping caution.",
  },
  "git-teamwork/reflog": {
    myth: "Once a commit is gone from the branch, it's gone for good.",
    reality:
      'Git keeps a local record of everywhere HEAD has pointed — the reflog is a recovery net for exactly the "I think I just destroyed history" moment.',
  },
  "git-teamwork/feedback-framing": {
    myth: 'Blunt code review comments are just "being direct."',
    reality:
      "How feedback is framed decides whether the author hears a fixable issue or a personal attack — the same catch lands completely differently depending on the wording.",
  },
  "git-teamwork/rfcs": {
    myth: "Disagreeing with a teammate's technical call means you have to win the argument in the moment.",
    reality:
      'An RFC moves the disagreement into a written, reviewable proposal — and "disagree and commit" is a real, respectable outcome, not a loss.',
  },
  "git-teamwork/documentation-culture": {
    myth: "Good code is self-documenting — you shouldn't need to write anything down.",
    reality:
      "Code shows *what* happens, not *why* a decision was made over the alternatives — that reasoning only survives in ADRs and docs, or it's relearned the hard way.",
  },
  "git-teamwork/ownership": {
    myth: "As long as someone on the team knows how a system works, you're covered.",
    reality:
      '"Someone" is a single point of failure — real ownership means the knowledge is distributed enough that on-call doesn\'t depend on one specific person being reachable.',
  },
  "git-teamwork/technical-leadership": {
    myth: "Technical leadership means being the person who writes the most code.",
    reality:
      "At staff level, influence comes from setting direction and aligning people across teams — the leverage is in decisions other people then build on.",
  },

  // business-communication/
  "business-communication/audience-awareness": {
    myth: "A good message is just a clearly written message.",
    reality:
      "The same clear message lands differently depending on who's reading it and what they already care about — clarity alone doesn't guarantee it's heard.",
  },
  "business-communication/status-updates-build-trust": {
    myth: "Explaining a delay is basically making an excuse.",
    reality:
      "A status update that names the cause, the impact, and the plan builds more trust than silence or optimism ever does — it's information, not an apology.",
  },
  "business-communication/reading-stakeholder-incentives": {
    myth: "A technically correct proposal should win on its merits.",
    reality:
      "Every stakeholder is also weighing it against their own incentives and risks — ignore those and an objectively good idea gets rejected for reasons that were never about the technical merit.",
  },
  "business-communication/pushback-frameworks": {
    myth: "Saying no to a request risks the relationship, so it's safer to just say yes.",
    reality:
      "A structured pushback — trade-offs named, alternative offered — usually builds more trust than a yes you can't actually deliver on.",
  },
  "business-communication/building-credibility-ahead-ask": {
    myth: "You build credibility by asking for something and delivering on it.",
    reality:
      "The strongest asks are pre-sold — credibility built through small, visible wins *before* you need the ask, so the answer is already leaning yes.",
  },
  "business-communication/decision-making-frameworks": {
    myth: "A meeting with a clear agenda will produce a clear decision.",
    reality:
      "Without an explicit owner and framework (DACI/RACI), a meeting can be perfectly organized and still end with nobody sure who actually decided anything.",
  },
  "business-communication/executive-summaries": {
    myth: "A thorough document just needs enough detail to be convincing.",
    reality:
      "An executive reads the first few lines, not the whole document — BLUF puts the conclusion first, because that's the only part guaranteed to be read.",
  },
  "business-communication/conflict-resolution": {
    myth: "Two teams disagreeing over ownership just needs someone to pick a winner.",
    reality:
      "Naming the conflict and using a real escalation path resolves it faster and with less residue than either side quietly building resentment.",
  },
  "business-communication/visibility-self-promotion": {
    myth: "Getting credit for your work means talking about yourself more.",
    reality:
      "Real visibility comes from making impact legible — sharing outcomes and context — not from self-promotion, which usually reads as exactly what it is.",
  },
  "business-communication/informal-authority": {
    myth: "You can only influence decisions you formally own.",
    reality:
      "Most real influence runs through informal authority — relationships and credibility that let you shape a decision you have no title over.",
  },
  "business-communication/upward-disagreement": {
    myth: "Telling a senior leader their plan will fail is career-risky, so it's safer to stay quiet.",
    reality:
      "Framed with evidence and psychological safety in mind, upward disagreement is usually welcomed — silence is what actually damages trust once the plan fails anyway.",
  },
  "business-communication/change-management": {
    myth: "Leading a team through a reorg just means announcing the change and moving on.",
    reality:
      "People need repeated, honest communication through uncertainty — the announcement is the start of change management, not the end of it.",
  },
  "business-communication/translating-technical-risk-business-risk": {
    myth: "Non-technical leadership just needs the technical details explained more simply.",
    reality:
      "They need the risk translated into business terms — cost, time, exposure — simplifying jargon isn't the same as translating what actually matters to them.",
  },
  "business-communication/org-level-influence": {
    myth: "Shaping company-wide technical direction requires a VP title.",
    reality:
      "A staff engineer does it through credibility, writing, and relationships across teams — org-level influence is earned, not granted by a title.",
  },

  // logic/
  "logic/formal-informal-logic": {
    myth: "An argument that sounds convincing is a valid argument.",
    reality:
      "Validity is about structure — the conclusion actually following from the premises — persuasive delivery and valid reasoning are two different things entirely.",
  },
  "logic/fallacies": {
    myth: "If it's not A, it must be B.",
    reality:
      "That's a false dichotomy — most real problems have more than two options, and this fallacy is one of the fastest ways to reason yourself into a bad decision.",
  },
  "logic/problem-decomposition": {
    myth: "A vague, hard problem just needs you to think harder about it as a whole.",
    reality:
      "Breaking it into smaller, independently solvable pieces is usually what actually makes it tractable — the difficulty was often the size, not the substance.",
  },
  "logic/boolean-logic": {
    myth: "Boolean expressions mean exactly what they look like they mean.",
    reality:
      'Operator precedence and short-circuit evaluation change what an expression actually does — two "equivalent-looking" conditionals can silently produce different results.',
  },
  "logic/state-machines": {
    myth: "A system with lots of possible states is just inherently hard to reason about.",
    reality:
      "A state machine makes every valid state and transition explicit — the complexity was always there, a truth table just makes it visible instead of implicit.",
  },
  "logic/edge-case-reasoning": {
    myth: "If your tests pass, your code handles every case.",
    reality:
      "Tests only prove the cases you thought to write — reasoning about invariants is what proves the cases you didn't think of are still handled correctly.",
  },
  "logic/induction": {
    myth: "Recursive logic just means tracing every call by hand until it makes sense.",
    reality:
      "Induction lets you trust the base case and the inductive step without tracing every level — that's the whole reason recursive reasoning is tractable at all.",
  },
  "logic/fermi-estimation": {
    myth: "If you can't compute the exact answer, you can't estimate it at all.",
    reality:
      "Fermi estimation breaks a hard number into easier, roundable sub-estimates — you don't need precision to get within the right order of magnitude.",
  },
  "logic/expected-value": {
    myth: "Under uncertainty, the safest decision is whichever outcome is least likely to be bad.",
    reality:
      'Expected value weighs each outcome by its probability, not just its worst case — it\'s what turns "gut feel about risk" into a comparable number.',
  },
  "logic/correlation-causation": {
    myth: "If two things move together, one is probably causing the other.",
    reality:
      "Correlation is consistent with causation, coincidence, or a shared hidden cause — mistaking one for the other is one of the most common ways data fools people.",
  },
  "logic/abstraction": {
    myth: "Modeling a messy real-world problem means capturing every detail accurately.",
    reality:
      "A good abstraction deliberately drops the details that don't affect the decision — the skill is choosing what to omit, not how much to include.",
  },
  "logic/multi-criteria-decisions-under-ambiguity": {
    myth: "A hard trade-off with no clearly right answer just means someone hasn't found the right answer yet.",
    reality:
      "Some decisions genuinely have no dominant option across every criterion — staff-level judgment is choosing well anyway, and defending why.",
  },

  // security/
  "security/security-mindset": {
    myth: "If the feature works as intended, it's safe.",
    reality:
      '"Works" only covers the paths you designed for — the security mindset is asking how it behaves when someone deliberately uses it the way you didn\'t intend.',
  },
  "security/authentication-fundamentals": {
    myth: "Checking a password against what's stored is basically all authentication is.",
    reality:
      "It's proving identity without ever storing or transmitting the secret in a way that leaks it if breached — hashing exists because the naive version is catastrophic.",
  },
  "security/authorization-models": {
    myth: "Once someone's logged in, what they're allowed to do is a simple if-check.",
    reality:
      "At any real scale that check becomes a model — RBAC or ABAC — because scattered ad hoc permission checks are exactly how privilege-escalation bugs get introduced.",
  },
  "security/hashing": {
    myth: 'Storing a password "encrypted" is safe enough.',
    reality:
      "Encryption is reversible by design — hashing (with salting) deliberately isn't, which is the actual property you need for something you should never be able to recover.",
  },
  "security/symmetric-asymmetric-encryption-basics": {
    myth: "Encryption is one general-purpose tool for keeping data secret.",
    reality:
      "Symmetric and asymmetric encryption solve different problems — one needs a shared secret in advance, the other doesn't, and picking the wrong one breaks the system.",
  },
  "security/tls-https": {
    myth: "A padlock icon means the site is trustworthy.",
    reality:
      "It only certifies the connection is encrypted and the certificate is valid for that domain — a phishing site can have a padlock too.",
  },
  "security/owasp-top-10": {
    myth: "Attackers mostly need sophisticated zero-days to break into a web app.",
    reality:
      "Most real breaches exploit the same well-known handful of mistakes — the OWASP top 10 — that a checklist would have caught.",
  },
  "security/secrets-management": {
    myth: "Keeping secrets out of git is the whole job.",
    reality:
      "Secrets leak just as often through logs, error messages, and build artifacts — secrets management is a discipline across the whole environment, not one gitignore rule.",
  },
  "security/supply-chain-security": {
    myth: "If a dependency is popular, it's safe to trust by default.",
    reality:
      "Popularity says nothing about a maintainer's account being compromised or a package being poisoned upstream — trust has to be verified, not assumed from download counts.",
  },
  "security/defense-depth": {
    myth: "One strong perimeter defense is enough to keep a system secure.",
    reality:
      "Defense in depth assumes any single layer *will* eventually be breached — the goal is designing so one breach doesn't cascade into a full compromise.",
  },
  "security/security-testing": {
    myth: "Security testing means waiting for a pentest before launch.",
    reality:
      "SAST/DAST tooling finds a huge share of vulnerabilities continuously, before a human pentester ever looks — the pentest is a check, not the whole strategy.",
  },
  "security/incident-response": {
    myth: "Once a breach is contained, the incident is over.",
    reality:
      "Disclosure, root-cause analysis, and a blameless post-mortem are what actually prevent the same breach from happening again — containment just stops the bleeding.",
  },
  "security/secure-by-design": {
    myth: "Security gets added at the end, right before launch.",
    reality:
      "A staff engineer bakes threat modeling into the architecture from day one — bolting security on afterward is far more expensive and far less effective.",
  },

  // infra-delivery/
  "infra-delivery/environment-parity": {
    myth: '"It works on my machine" means the bug is in the deployment, not the code.',
    reality:
      'It usually means the environments genuinely differ — environment parity (often via containers) is what makes "works here" mean "works everywhere."',
  },
  "infra-delivery/docker": {
    myth: "A Docker image is basically a lightweight virtual machine.",
    reality:
      "It packages the app with its exact dependencies as a portable unit — the point isn't virtualization, it's guaranteeing the same runtime everywhere it runs.",
  },
  "infra-delivery/ci-cd-pipeline-anatomy": {
    myth: "Deploying to production is basically copying files to a server.",
    reality:
      "It's a pipeline of build, test, and release stages, each a gate that catches a specific class of mistake before it reaches a real user.",
  },
  "infra-delivery/deployment-automation": {
    myth: "A manual deploy done carefully is as safe as an automated one.",
    reality:
      "Manual steps are inherently non-repeatable — the exact sequence that worked nine times is one skipped step away from the outage on the tenth.",
  },
  "infra-delivery/orchestration-basics": {
    myth: "Running many containers is just running one container, many times.",
    reality:
      "At scale you need something scheduling, restarting, and networking them across machines automatically — that coordination is what orchestration actually provides.",
  },
  "infra-delivery/infrastructure-code": {
    myth: "Clicking through a cloud console to configure infrastructure is fine as long as you're careful.",
    reality:
      "Console changes aren't versioned, reviewed, or reproducible — Infrastructure as Code turns infra into something you can diff, review, and roll back like any other code.",
  },
  "infra-delivery/progressive-delivery": {
    myth: "A risky change either ships to everyone or doesn't ship at all.",
    reality:
      "Canary and blue-green deploys let you expose a change to a small slice of traffic first — risk becomes something you can dial, not a coin flip.",
  },
  "infra-delivery/rollback-strategy": {
    myth: "If a deploy goes bad, you just deploy the fix forward.",
    reality:
      "A fix takes time to write and ship — a rehearsed rollback strategy is what gets you back to a known-good state in minutes, before the fix even exists.",
  },
  "infra-delivery/config-management": {
    myth: "The same code should behave identically in staging and production.",
    reality:
      "It only does if every environment-specific config value is deliberately managed — an unmanaged difference is exactly what makes staging lie to you.",
  },
  "infra-delivery/infra-observability": {
    myth: "If the app's logs look fine, the infrastructure underneath is fine too.",
    reality:
      "Infra has its own health signals — SLOs, SLIs, resource saturation — that can degrade long before an app-level log ever shows an error.",
  },
  "infra-delivery/cost-awareness": {
    myth: "Cloud costs scale predictably with usage, so they don't need active attention.",
    reality:
      "Unused resources, wrong instance sizes, and forgotten services accumulate quietly — cost awareness is what catches the bill before finance does.",
  },
  "infra-delivery/staff-level-release-engineering-strategy": {
    myth: "A deployment architecture is just whatever pipeline the team happens to be using.",
    reality:
      "At staff level it's a deliberate design that assumes a bad Friday deploy will happen — the question is whether the architecture survives it gracefully.",
  },

  // career-craft/
  "career-craft/leveling-expectations": {
    myth: '"Good" at each career stage just means writing better code than the last stage.',
    reality:
      "It's mostly about scope and ownership growing, not code quality alone — the same clean code means something different at junior vs. staff scope.",
  },
  "career-craft/asking-feedback": {
    myth: 'Asking "how am I doing?" will get you useful feedback.',
    reality:
      "Vague questions get vague, kind answers — specific, calibrated questions are what actually surface something you can act on.",
  },
  "career-craft/mentoring-fundamentals": {
    myth: "Mentoring a junior teammate means doing the hard parts for them so it ships correctly.",
    reality:
      "Doing it for them removes the exact struggle that builds their skill — real mentoring is guiding without taking over.",
  },
  "career-craft/structured-interviewing": {
    myth: "A good interviewer can just tell if someone's good after a conversation.",
    reality:
      "Unstructured impressions are dominated by bias and small talk — structured interviewing exists because gut feel alone is a poor, inconsistent predictor.",
  },
  "career-craft/goal-setting": {
    myth: 'A growth plan just means committing to "work harder" this quarter.',
    reality:
      'A real plan identifies specific skill gaps and closes them deliberately — effort without a target is why "work harder" so rarely produces visible growth.',
  },
  "career-craft/impact-scope-over-correctness": {
    myth: "Being technically right is what gets you seen as senior.",
    reality:
      "Being right at small scope reads as junior — seniority is demonstrated through the scope and impact of the problems you're trusted with, not correctness alone.",
  },
  "career-craft/documentation-career-tool": {
    myth: "Documenting your own work looks like bragging.",
    reality:
      "A brag doc is just making impact visible and legible over time — the alternative isn't humility, it's your manager forgetting what you actually did.",
  },
  "career-craft/calibration-processes": {
    myth: "If your manager supports your promotion, it will happen.",
    reality:
      "Manager support is necessary but not sufficient — a promotion packet still has to survive cross-calibration, rubric comparison, and often a slot constraint.",
  },
  "career-craft/ic-em-tracks": {
    myth: "Management is just the natural next step after being a senior IC.",
    reality:
      "IC and EM are genuinely different skill sets and daily work — the right track is a deliberate self-assessment, not an automatic promotion path.",
  },
  "career-craft/peer-mentoring": {
    myth: "Mentoring only flows from more senior to more junior.",
    reality:
      "A peer, even one more senior in a different way, can mentor you in exactly the areas they're stronger in — mentoring is about the gap, not the title.",
  },
  "career-craft/staff-scope": {
    myth: "A staff engineer is just a senior engineer who's been there longer.",
    reality:
      "Staff scope is about technical direction and org-level leverage — influence that reaches beyond any one codebase a senior engineer typically owns.",
  },
  "career-craft/market-research": {
    myth: "You can tell if an offer is fair just from the base salary number.",
    reality:
      "Total comp — equity, bonus, benefits — and real market data are what actually determine fairness; the base salary alone is often the least informative number.",
  },
  "career-craft/negotiation-tactics": {
    myth: "Negotiating compensation risks souring the relationship with a new employer.",
    reality:
      "A well-anchored, respectful negotiation is expected and usually strengthens the relationship — silence is what leaves real money on the table.",
  },

  // product-domain/
  "product-domain/understanding-user-s-problem-solution": {
    myth: "A well-built feature will get used if it's built well.",
    reality:
      "Quality of build says nothing about whether it solves a real problem — most unused features were built before anyone validated the problem existed.",
  },
  "product-domain/requirements-gathering": {
    myth: "A vague ask just needs you to guess the details and start building.",
    reality:
      "Requirements gathering turns ambiguity into a specific, checkable requirement before code is written — guessing is how you build the wrong thing efficiently.",
  },
  "product-domain/domain-driven-design-basics": {
    myth: "The code and the business just naturally describe things the same way.",
    reality:
      "Without a deliberate shared vocabulary, code drifts into its own model that fights how the business actually talks about the domain.",
  },
  "product-domain/bounded-contexts": {
    myth: 'A term like "customer" means the same thing to every team using it.',
    reality:
      "Different teams often mean genuinely different things by the same word — a bounded context makes that scope explicit instead of a silent source of bugs.",
  },
  "product-domain/validation": {
    myth: "You find out if you're building the right thing by shipping it and watching adoption.",
    reality:
      "By then the cost is already spent — validation and MVP thinking exist to test the idea cheaply before committing to the full build.",
  },
  "product-domain/value-framing-over-feature-framing": {
    myth: "Explaining a product to a non-technical person means listing what it does.",
    reality:
      "A feature list means nothing without the value it creates for them — framing around value, not features, is what actually lands.",
  },
  "product-domain/buyer-psychology": {
    myth: "A client saying no means the offer wasn't good enough.",
    reality:
      "The stated objection is often not the real one — buyer psychology is uncovering the actual hesitation hiding behind the polite reason given.",
  },
  "product-domain/translating-capability-into-their-vocabulary-cfo": {
    myth: "The same technical pitch works for anyone you're selling to.",
    reality:
      "A CFO hears cost, ops hears reliability, a founder hears speed — the same capability has to be translated into whatever vocabulary the listener actually weighs decisions in.",
  },
  "product-domain/value-based-selling": {
    myth: "If something is technically impressive, people will want to pay for it.",
    reality:
      "Appreciation isn't the same as willingness to pay — value-based selling ties the impressive thing to an ROI the buyer can defend internally.",
  },
  "product-domain/discovery": {
    myth: "You already know what a prospective client needs before the call.",
    reality:
      "Discovery is a structured conversation designed to uncover what they actually need — assuming you already know it is how deals get pitched at the wrong problem.",
  },
  "product-domain/objection-handling": {
    myth: '"We already have something that works" or "it\'s too expensive" are deal-enders.',
    reality:
      "Both are usually openings, not closed doors — objection handling reframes them into the specific gap or trade-off actually being weighed.",
  },
  "product-domain/case-studies": {
    myth: "One happy client is just one happy client.",
    reality:
      "A documented case study turns a single win into a repeatable asset — proof that compounds into the next deal instead of staying anecdotal.",
  },
  "product-domain/presales-engineering": {
    myth: "A staff engineer's job in a sale is just answering technical questions when asked.",
    reality:
      "Presales engineering uses technical credibility proactively to shape and close a strategic deal — participating, not just responding.",
  },

  // corporate-politics/
  "corporate-politics/power-real-resource": {
    myth: "Technical merit alone decides who wins in an organization.",
    reality:
      "Power is a real, separate resource that interacts with merit — ignoring it doesn't make it go away, it just means you're playing without understanding the board.",
  },
  "corporate-politics/white": {
    myth: "Office influence is inherently manipulative.",
    reality:
      '"White" influence — reciprocity, being visibly useful, honest alliance-building — is legitimate and often just good collaboration by another name.',
  },
  "corporate-politics/who-holds-influence": {
    myth: "The org chart shows you who actually has influence over a decision.",
    reality:
      "Real decision-making often flows through an informal network the org chart doesn't capture — reading that network is a distinct, learnable skill.",
  },
  "corporate-politics/favor-economy": {
    myth: "Asking for help when you need it is enough — you don't need to plan ahead.",
    reality:
      "Goodwill built in advance, through small favors given freely, is what makes the big ask land when you actually need it.",
  },
  "corporate-politics/strategic-ambiguity": {
    myth: "Any strategic vagueness about information is basically dishonesty.",
    reality:
      'There\'s a real, definable line — selective disclosure and timing information ("gray" politics) is different from actively misleading someone, and the line matters.',
  },
  "corporate-politics/framing": {
    myth: "Controlling the narrative around your work means spinning it favorably.",
    reality:
      "Honest framing — emphasis and story, not fabrication — is what actually makes accurate work get seen accurately, instead of unseen by default.",
  },
  "corporate-politics/subtext": {
    myth: "What's said in a meeting is what's actually being decided.",
    reality:
      "A lot of the real signal is in what's *not* said — subtext, silence, and unstated agendas often carry more information than the stated agenda.",
  },
  "corporate-politics/credit-stealing": {
    myth: '"Black" politics — credit-stealing, sabotage — is rare and easy to spot.',
    reality:
      "It's more common and subtler than assumed — scapegoating and manufactured urgency often look like normal org dysfunction until you know the pattern.",
  },
  "corporate-politics/warning-signs": {
    myth: "Being set up to fail is something you only realize after it's already happened.",
    reality:
      "There are earlier, recognizable warning signs — shifting goalposts, sudden exclusion from key threads — that give you time to act before it's a crisis.",
  },
  "corporate-politics/documentation-discipline": {
    myth: "Keeping a written paper trail makes you look paranoid or distrustful.",
    reality:
      "Done well, documentation discipline just looks like normal professional confirmation — and it's what protects you when someone's memory of a decision conveniently changes.",
  },
  "corporate-politics/calibrated-confrontation": {
    myth: "If someone takes credit for your work, confronting them will just make you look petty.",
    reality:
      "A calibrated, evidence-based confrontation — escalated correctly — protects your credibility; staying silent is what actually costs it over time.",
  },
  "corporate-politics/coalition-building-defense": {
    myth: "You only need allies once something has already gone wrong.",
    reality:
      "Coalitions built as defense, before you need protecting, are what actually hold when something does go wrong — building them after is usually too late.",
  },
  "corporate-politics/staying-principled": {
    myth: "Surviving a highly political org means eventually playing as dirty as everyone else.",
    reality:
      "Staying principled while choosing your battles deliberately — including knowing when to exit — is a real, sustainable strategy, not naivety.",
  },
  "corporate-politics/influence-tool-org-s-good": {
    myth: "Wielding influence at scale inevitably means accumulating personal power.",
    reality:
      "A staff engineer can use influence ethically, in service of the org's actual goals — the scale is the same, the intent is what differs.",
  },

  // learning-craft/
  "learning-craft/exposure-understanding": {
    myth: "Reading more material means you're learning more.",
    reality:
      "Exposure without active engagement often just produces recognition, not understanding — the volume read and the depth retained are two different curves.",
  },
  "learning-craft/source-evaluation": {
    myth: "If it's written confidently, it's probably trustworthy.",
    reality:
      "Confidence and correctness are unrelated — source evaluation means checking primary sources and credibility signals, not tone.",
  },
  "learning-craft/search-literacy": {
    myth: "Asking a question badly still gets you a useful answer if the search engine is good enough.",
    reality:
      "How a question is framed shapes what comes back — going straight to docs, specs, or source is often faster and more reliable than a vague search.",
  },
  "learning-craft/feynman-technique": {
    myth: "If a concept feels familiar when you read it, you understand it.",
    reality:
      "Recognition and understanding feel identical until you try to explain it — the Feynman technique exposes the gap the reading alone hides.",
  },
  "learning-craft/spaced-repetition": {
    myth: "Once you've learned something, you'll remember it.",
    reality:
      "Memory decays predictably without reinforcement — spaced repetition and active recall are what convert a one-time understanding into something that actually sticks.",
  },
  "learning-craft/systematic-exploration": {
    myth: "Learning a new codebase means reading it file by file from the top.",
    reality:
      "Entry points, execution tracing, and reading the tests first get you oriented far faster than a linear read-through ever does.",
  },
  "learning-craft/weighing-credibility": {
    myth: "When experts disagree, the loudest or most senior one is probably right.",
    reality:
      "Weighing credibility means checking incentives, recency, and consensus — seniority and confidence are weak signals on their own.",
  },
  "learning-craft/verification-habits": {
    myth: "If an AI tool gives you a confident answer, you can trust it and move on.",
    reality:
      "Confident and correct are unrelated for these tools too — verification habits keep your own judgment in the loop instead of quietly atrophying.",
  },
  "learning-craft/notes": {
    myth: "Taking notes is enough — you'll remember to go back and use them.",
    reality:
      "Notes that are never resurfaced are functionally the same as not taking them — a real system needs spaced review built in, not just capture.",
  },
  "learning-craft/prioritization": {
    myth: "Everything worth learning is worth learning deeply.",
    reality:
      "Depth has a real cost — deciding what to skim vs. study deeply is itself a skill, not a failure to be thorough.",
  },
  "learning-craft/curation": {
    myth: "Keeping up with a fast-moving field means consuming as much of it as possible.",
    reality:
      "Curation — deliberately filtering signal from hype — is what keeps up without drowning; more input isn't the same as staying current.",
  },
  "learning-craft/calibration": {
    myth: "Good technical judgment comes automatically from enough years of experience.",
    reality:
      "It comes from deliberately calibrating against being wrong — years of experience without that feedback loop just produces confident, uncalibrated intuition.",
  },
  "learning-craft/breadth-depth-trade-off-scale": {
    myth: "A staff engineer has to personally understand every domain they touch in depth.",
    reality:
      "At scale, credibility comes from knowing enough to ask the right expert the right question — not from personally mastering every domain.",
  },

  // applied-math/
  "applied-math/math-tool-prediction": {
    myth: "A compiler and tests already check everything that matters about your code.",
    reality:
      "They check correctness, not prediction — math is the tool for reasoning about load, growth, and risk before they happen, which tests can't do.",
  },
  "applied-math/measurement-theory": {
    myth: "If you can't directly observe something, you can't measure it.",
    reality:
      "Measurement theory is exactly the discipline of instrumenting a proxy for something unobservable — most real metrics are indirect by necessity.",
  },
  "applied-math/orders-magnitude": {
    myth: 'Whether a number is "big" or "small" is a gut-feel judgment call.',
    reality:
      "Orders of magnitude give you a rigorous, quick way to check a number against what's plausible — replacing gut feel with a fast sanity check.",
  },
  "applied-math/asymptotic-analysis": {
    myth: "Big-O is a rough, informal way to describe how fast code runs.",
    reality:
      "It's a precise mathematical statement about growth as input size increases — informal use of the term often gets the actual claim wrong.",
  },
  "applied-math/combinatorics": {
    myth: "Counting possibilities means listing them all out.",
    reality:
      "Combinatorics lets you count without enumerating — essential the moment the space of possibilities is too large to list, which is most real cases.",
  },
  "applied-math/probability-distributions-uniform": {
    myth: "Modeling chance just means picking a random number.",
    reality:
      "Different distributions — uniform, binomial, normal — model fundamentally different kinds of randomness, and choosing the wrong one gives you a confidently wrong model.",
  },
  "applied-math/queueing-theory-basics": {
    myth: "You find out how a system behaves under load by running it under load.",
    reality:
      "Queueing theory — Little's Law, latency vs. throughput — lets you predict that behavior before the system is even built, not just after it breaks.",
  },
  "applied-math/statistics": {
    myth: "If you measured a difference, it's real.",
    reality:
      "A measured difference can easily be noise — statistics is what tells you whether it's actually significant or just random variation.",
  },
  "applied-math/time-series-basics": {
    myth: "Forecasting a trend just means drawing a line through the last few data points.",
    reality:
      "The last few points are often the least representative — real forecasting weighs the full series and accounts for how much extrapolation risk that introduces.",
  },
  "applied-math/graph-theory-basics": {
    myth: "Graphs are a specialized tool for niche problems like maps and networks.",
    reality:
      "Anything with entities and relationships is a graph — dependency chains, org charts, permission systems — which is why it shows up almost everywhere once you look.",
  },
  "applied-math/linear-algebra-basics-vectors-matrices-where": {
    myth: "Linear algebra is only relevant if you're doing graphics or machine learning directly.",
    reality:
      "Vectors and matrices are the underlying language for state and transformation broadly — graphics and ML are just two visible applications of it.",
  },
  "applied-math/capacity-planning-math": {
    myth: "You find out if a system has enough capacity by watching it hit its limit.",
    reality:
      "Capacity planning math lets you calculate throughput and latency budgets in advance — finding the limit by hitting it in production is the expensive way to learn it.",
  },
  "applied-math/unit-economics": {
    myth: "Costing something quantitatively is mostly guesswork dressed up as a number.",
    reality:
      "Unit economics and amortization give you a defensible, repeatable way to cost something — a number you can actually justify, not just estimate.",
  },
  "applied-math/expected-value": {
    myth: "Reasoning about risk is inherently subjective — it's just gut feel.",
    reality:
      "Expected value and decision trees turn risk into a quantitative model you can actually compare across options, not just a feeling you defend by confidence.",
  },
  "applied-math/quantitative-modeling-design-decisions": {
    myth: "An architecture debate gets settled by whoever argues most persuasively.",
    reality:
      "A staff engineer settles it with numbers — a quantitative model in the design doc that outlasts any one person's opinion in the room.",
  },

  // testing-quality/
  "testing-quality/case-automated-testing": {
    myth: "If you manually checked it and it worked, it works.",
    reality:
      "A manual check only proves it worked once, for you, in that state — automated testing is what proves it keeps working as the code changes underneath it.",
  },
  "testing-quality/test-pyramid": {
    myth: "More tests are always better, regardless of level.",
    reality:
      "Unit, integration, and e2e tests catch different things at very different costs — the test pyramid is about testing each thing at the cheapest level that actually catches it.",
  },
  "testing-quality/assertions-matter": {
    myth: "A test that runs the code without crashing is a good test.",
    reality:
      "A test that exercises code without asserting the right thing is tautological — it can pass forever while the actual behavior silently breaks.",
  },
  "testing-quality/tdd-basics": {
    myth: "Writing tests first vs. after just changes the order of the same two steps.",
    reality:
      "Writing the test first forces you to design the interface before the implementation — red-green-refactor changes *what* gets built, not just when it's tested.",
  },
  "testing-quality/bdd": {
    myth: "Testing behavior and testing implementation are basically the same thing.",
    reality:
      "BDD tests through the public interface deliberately — implementation-coupled tests break on every refactor even when behavior never changed.",
  },
  "testing-quality/test-doubles": {
    myth: "You can't reliably test code that depends on time, randomness, or an external service.",
    reality:
      "Test doubles — mocks, stubs, fakes — give you a controlled seam to substitute for that dependency, making the untestable testable.",
  },
  "testing-quality/flaky-tests": {
    myth: "A test that passes locally but fails in CI is just a CI infrastructure problem.",
    reality:
      "It's usually non-determinism or environment leakage in the test itself — CI just has less tolerance for the timing assumptions that let it pass locally.",
  },
  "testing-quality/mutation-testing": {
    myth: "High test coverage means your tests are actually testing something.",
    reality:
      "Coverage only proves the code ran, not that a test would catch a bug — mutation testing checks that by deliberately breaking the code and seeing if tests notice.",
  },
  "testing-quality/property-based-testing": {
    myth: "Thorough testing means writing a lot of individual example cases.",
    reality:
      "Property-based testing generates many inputs to check a *property* holds — it finds edge cases no one thought to write an example for.",
  },
  "testing-quality/contract-testing": {
    myth: "Two services staying in sync just requires good documentation between teams.",
    reality:
      "Documentation drifts silently — contract testing verifies the actual agreement between services automatically, catching drift before it breaks in production.",
  },
  "testing-quality/fault-injection": {
    myth: "Testing the happy path is what proves a system is reliable.",
    reality:
      "Reliability is mostly about failure modes — fault injection deliberately breaks dependencies to test behavior under failure, which the happy path never exercises.",
  },
  "testing-quality/test-suite-architecture": {
    myth: "A test suite naturally stays fast and trustworthy as a codebase grows.",
    reality:
      "Without deliberate architecture — parallelization, quarantine strategy — a growing suite slows down and accumulates flaky tests people learn to ignore.",
  },
  "testing-quality/quality-culture": {
    myth: "Quality is QA's job, not engineering's.",
    reality:
      "A staff engineer treats testing strategy as an architectural decision — quality culture means the whole team owns it, not a separate team downstream.",
  },

  // software-design/
  "software-design/cost-design": {
    myth: "If code works correctly today, its design doesn't matter.",
    reality:
      'Design determines the cost of the *next* change, not the current one — "just works" code often becomes expensive to touch exactly because design was ignored.',
  },
  "software-design/single-responsibility": {
    myth: "A function's responsibility is whatever it currently does.",
    reality:
      "Single responsibility is about *deciding* where that boundary should be — cohesion and coupling are the actual criteria, not just current behavior.",
  },
  "software-design/naming": {
    myth: "Naming is a cosmetic detail you can clean up later.",
    reality:
      "A good name is a design decision — it's the interface a reader trusts without reading the implementation, and a bad one actively misleads them.",
  },
  "software-design/dry": {
    myth: "Any duplicated code should be immediately abstracted away.",
    reality:
      "Premature abstraction over accidental duplication is its own trap — DRY is about eliminating duplicated *knowledge*, not every superficially similar block.",
  },
  "software-design/solid-principles": {
    myth: "SOLID principles are academic rules that don't apply to real, fast-moving code.",
    reality:
      "They're specifically about containing change — dependency inversion and the rest exist so one change doesn't ripple through everything it touches.",
  },
  "software-design/oop-design-trade-offs": {
    myth: "Inheritance is the default, natural way to share behavior between classes.",
    reality:
      "Inheritance couples subclasses tightly to a parent's implementation — composition is often the safer default, with inheritance reserved for genuine is-a relationships.",
  },
  "software-design/immutability": {
    myth: "Functional programming is mostly a stylistic preference about syntax.",
    reality:
      "Immutability and pure functions eliminate a whole category of bugs from shared mutable state — it's a correctness property, not a style choice.",
  },
  "software-design/classic-design-patterns": {
    myth: "Using a named design pattern automatically makes code better.",
    reality:
      "A pattern applied without the problem it solves is cargo-culting — recognizing when one actually fits is the real skill, not memorizing the catalog.",
  },
  "software-design/refactoring-technique": {
    myth: "Refactoring tangled code means rewriting it carefully in one pass.",
    reality:
      "Safe refactoring is a series of small, behavior-preserving transformation steps — a big rewrite in one pass is exactly how tangled code gets more tangled.",
  },
  "software-design/technical-debt-deliberate-trade-off": {
    myth: "Technical debt is always a sin that should be paid down immediately.",
    reality:
      "Some debt is a deliberate, reasonable trade-off for speed now — the skill is knowing how much is acceptable and tracking it, not eliminating it on principle.",
  },
  "software-design/api-design": {
    myth: "An API is well-designed if it exposes all the functionality a caller might need.",
    reality:
      "A well-designed API makes illegal states unrepresentable — it's defined as much by what it prevents a caller from doing wrong as by what it allows.",
  },
  "software-design/evolutionary-design": {
    myth: "A design that has to change with new requirements needs a rewrite.",
    reality:
      "The open-closed principle lets a design evolve by extension rather than modification — evolutionary design plans for change instead of resisting it.",
  },
  "software-design/long-term-design-judgment": {
    myth: "A good design decision is one that solves today's requirements well.",
    reality:
      "A staff-level design decision also accounts for outliving the person who made it — designing for whoever inherits it, not just for the current sprint.",
  },

  // sustainable-performance/
  "sustainable-performance/myth-linear-output": {
    myth: "Working more hours produces proportionally more output.",
    reality:
      "Output has diminishing, then negative, returns past a point — more hours eventually produce *less*, not more, as quality and judgment degrade.",
  },
  "sustainable-performance/early-warning-signs": {
    myth: "Burnout is something you only recognize once you're fully burned out.",
    reality:
      "There are earlier, distinguishable signs — tired vs. burned out are different states — that give you time to intervene before it takes you out completely.",
  },
  "sustainable-performance/attention-management": {
    myth: "Protecting focus time just means blocking your calendar and hoping it holds.",
    reality:
      "Attention management is a deliberate discipline distinguishing deep work from shallow work — a blocked calendar without that discipline still gets eroded.",
  },
  "sustainable-performance/energy-management-across-day-week": {
    myth: "As long as you have enough hours scheduled, the work will get done well.",
    reality:
      "Energy varies predictably across a day and week — matching task type to energy state produces better output than just having the time available.",
  },
  "sustainable-performance/sustainable-boundary-setting": {
    myth: "Saying no to more work makes you look like you can't handle your job.",
    reality:
      "Sustainable boundary-setting, framed well, reads as prioritization and judgment — an unsustainable yes is what actually damages your track record later.",
  },
  "sustainable-performance/recovery-practices-crunch": {
    myth: "Once a brutal crunch period ends, you're automatically back to normal.",
    reality:
      "Recovery is a deliberate practice, not an automatic reset — without it, the cost of that period gets carried forward into the next one.",
  },
  "sustainable-performance/sustainable-long-term-learning-pace": {
    myth: "Staying technically sharp means constantly learning at maximum intensity.",
    reality:
      "A sustainable pace protects growth over years, not just this quarter — max intensity long-term is how learning starts consuming your whole identity.",
  },
  "sustainable-performance/long-horizon-sustainability": {
    myth: "Sustaining high output over a career just means repeating what worked for one good quarter.",
    reality:
      "A staff engineer paces output like a marathon, not a sprint — a decade of sustainability requires a fundamentally different strategy than any single quarter.",
  },

  // people-management/
  "people-management/ic-excellence-management": {
    myth: "If you're good at the work, you'll naturally be good at managing people who do it.",
    reality:
      "Managing requires a genuinely different skill set — coaching, delegation, calibration — that individual technical excellence doesn't automatically transfer into.",
  },
  "people-management/1": {
    myth: "A 1:1 is just a status check on what someone's working on.",
    reality:
      "A useful 1:1 is structured around listening and coaching questions — status belongs in async updates, not the one recurring time you have for the person.",
  },
  "people-management/delegation-levels": {
    myth: "Delegating means either handing off the task fully or not delegating it at all.",
    reality:
      'Delegation has levels — from "do exactly this" to "decide and inform me" — matching the level to the person is what avoids micromanaging or abandoning them.',
  },
  "people-management/sbi-framework": {
    myth: "Giving feedback just means telling someone what they did wrong.",
    reality:
      "Feedback that changes behavior needs situation, behavior, and impact made concrete — vague feedback gets heard and immediately forgotten.",
  },
  "people-management/goal-setting": {
    myth: "Team goals just need to be whatever the team is already motivated to work on.",
    reality:
      "Real goal-setting translates org-level strategy downward into what the team should actually prioritize — motivation without that link can point the wrong direction.",
  },
  "people-management/early-signals": {
    myth: "You'll know someone on your team is struggling once their output visibly drops.",
    reality:
      "By then it's already a crisis — early signals show up in psychological safety and small check-ins long before performance visibly slips.",
  },
  "people-management/mediation": {
    myth: "Resolving conflict between two people on your team means picking whoever's more right.",
    reality:
      "Mediation means staying neutral and addressing the root cause — picking a side usually just relocates the conflict instead of resolving it.",
  },
  "people-management/defining-role": {
    myth: "Hiring well mostly comes down to finding someone who's clearly smart.",
    reality:
      'It starts with defining the role precisely and running a structured loop — without that, "clearly smart" just measures who\'s most like the interviewer (the halo effect).',
  },
  "people-management/onboarding-design": {
    myth: "A thorough wiki and a two-week check-in is a solid onboarding plan.",
    reality:
      "Information dumps overwhelm without producing early wins — a real ramp plan sequences small, concrete tasks with a buddy and frequent early check-ins.",
  },
  "people-management/calibration": {
    myth: "Rating performance fairly across a team just means comparing recent output.",
    reality:
      "Recency and role differences bias a raw comparison — real calibration deliberately corrects for both to write honest, comparable reviews.",
  },
  "people-management/performance-improvement-plans": {
    myth: "A PIP is basically a formal way to start the paperwork toward firing someone.",
    reality:
      "Done well it's a genuine, documented chance to close a specific gap — the conversation and documentation matter as much as the outcome.",
  },
  "people-management/termination-process": {
    myth: "Letting someone go is mostly a legal and HR process to get through.",
    reality:
      "The legal/practical basics matter, but doing it with fairness and dignity is a distinct skill that shapes how the rest of the team experiences it too.",
  },
  "people-management/bus-factor": {
    myth: "A resilient team just means everyone works hard and communicates.",
    reality:
      "Resilience to any one person leaving requires deliberately distributing knowledge — bus factor is a measurable risk, not a vague hope about team spirit.",
  },
  "people-management/org-design": {
    myth: "A growing team just adds people to the existing structure.",
    reality:
      "Past a certain span of control, the structure itself has to change — org design is deciding deliberately when and how to split, not just adding headcount.",
  },
  "people-management/management-managers": {
    myth: "Managing managers is the same job as managing ICs, just one level removed.",
    reality:
      "It's second-order leadership — setting culture and judgment at scale through other managers, a genuinely different job than managing individual output directly.",
  },
};
