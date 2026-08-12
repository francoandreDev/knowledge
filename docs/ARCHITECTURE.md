# Architecture, essence, and structure

## Why this project exists

A personal reference built session by session to go from junior engineer to a genuinely solid staff-level engineer — not just breadth, but depth: the kind of understanding that survives being asked "why" three times in a row.

## The essence: problems, not levels

Growth from junior to staff doesn't happen because someone hands you a "senior" badge. It happens because the _problems you're trusted to solve_ get harder, more ambiguous, and higher-stakes. So instead of organizing content by seniority label, every track is a sequence of real problems ordered by increasing complexity:

- Early units: "how does X work at all" — mechanics, definitions, first principles.
- Mid units: "how do I make X reliable / correct / not fall over" — trade-offs start to matter.
- Late units: "how do I decide between two defensible answers with incomplete information, at scale, with other people involved" — this is what staff work actually looks like.

Nowhere does a document say "you are now senior." The reader infers their own growth from the fact that the problems they can now reason about used to be out of reach.

## The sixteen tracks

- **`web/`** — how the web actually works, from a single HTTP request to systems serving millions of users.
- **`systems/`** — operating systems, distributed systems, databases, reliability — the substrate everything else runs on.
- **`git-teamwork/`** — version control as a tool for collaborating with other humans over time, and the collaboration mechanics (review, conflict, ownership) built on top of it.
- **`business-communication/`** — how technical work gets communicated, sold, negotiated, and defended inside an organization. Corporate language, stakeholder management, upward disagreement.
- **`logic/`** — the reasoning substrate underneath all the others: formal and informal logic, decomposition, estimation under uncertainty.
- **`security/`** — security as its own discipline: threat modeling, authn/authz, cryptography basics, supply chain, secure-by-design, incident response.
- **`infra-delivery/`** — the operational side of shipping software: containers, CI/CD, orchestration, Infrastructure as Code, progressive delivery, release engineering.
- **`career-craft/`** — the mechanics of growing as an individual contributor: mentoring, interviewing, feedback, calibration, and what staff scope actually means day to day.
- **`product-domain/`** — understanding what to build and why: domain modeling, requirements, and the commercial side of technical work — speaking the buyer's language well enough that value is not just understood but appreciated, funded, and closed.
- **`corporate-politics/`** — power and influence as they actually operate inside an organization: legitimate ("white") influence-building, the gray zone of narrative and timing, what "black" politics (sabotage, credit-stealing, scapegoating) looks like in practice, and how to defend against it without becoming it.
- **`learning-craft/`** — the transversal skill underneath all other content tracks: how to find trustworthy information fast, tell real understanding from recognition, retain it, and build good technical judgment rather than just accumulating facts.
- **`applied-math/`** — what to measure, calculate, forecast, and estimate, and how to do it rigorously: probability and statistics, queueing theory, capacity math, graph theory, linear algebra, and quantitative risk modeling — always tied back to where it actually shows up in `web/` and `systems/` (load prediction, capacity planning, latency budgets, ML/graphics transforms, cost modeling).
- **`testing-quality/`** — the craft of testing itself: the test pyramid, TDD/BDD, test doubles, flaky tests, mutation and property-based testing, contract testing, and building a culture where quality isn't someone else's job.
- **`software-design/`** — the craft of designing maintainable code: cohesion/coupling, SOLID, OOP vs. functional trade-offs, design patterns (and their misuse), refactoring, technical debt, API design, evolutionary design.
- **`sustainable-performance/`** — the personal sustainability layer: energy and attention management, recognizing and recovering from burnout, boundary-setting, and pacing a career over a decade rather than a good quarter.
- **`people-management/`** — the mechanics of formally managing people: 1:1s, delegation, feedback, hiring, performance management, terminations, org design, and eventually managing managers. Added specifically because the user plans to lead teams — it's the one track scoped to a management path rather than a pure individual-contributor one, and is not a prerequisite for the "staff engineer" framing the rest of the roadmap uses.

`learning-craft/` is transversal in the same sense `logic/` is (see below) — it doesn't sit "above" the other tracks so much as run through all of them: every unit in this project is, itself, an exercise in the skills `learning-craft/` documents. `applied-math/` is transversal in a narrower, more concrete sense: `logic/` is about reasoning correctly in general; `applied-math/` is about reasoning _quantitatively_ — putting a real number on a claim instead of a hunch — and its later units point back explicitly at `systems/` and `web/` units where the same math is load-bearing (capacity planning, latency/throughput trade-offs, statistical significance in an A/B test, cost modeling for infrastructure).

`testing-quality/` and `software-design/` sit in a similar relationship to `web/` and `systems/` as `applied-math/` does: they document crafts that get _used_ throughout implementation-heavy units in those tracks but are general enough (language- and domain-agnostic) to deserve their own sequence rather than being repeated piecemeal inside every unit that needs them.

`sustainable-performance/` is distinct from `career-craft/`: `career-craft/` is about the mechanics of growing and being recognized (mentoring, interviewing, calibration, negotiation); `sustainable-performance/` is about the personal capacity that makes any of that possible to sustain — energy, attention, recovery, boundaries. A staff engineer who burns out is not solving the problems `career-craft/` describes.

`people-management/` is also distinct from three tracks it might look adjacent to: `career-craft/` is about growing yourself as an IC (and does include light mentoring/interviewing), while `people-management/` is about the ongoing formal responsibility for other people's work, growth, and employment. `corporate-politics/` is about power and influence as they actually move through an org, largely informally; `people-management/` is about the formal authority and processes of managing a team. `business-communication/` is about communicating and negotiating with peers and stakeholders; `people-management/` is specifically about the manager-report relationship.

These are not silos. A staff-level problem in `web/` (e.g. architecting a system migration) leans on `systems/` (distributed consistency), `git-teamwork/` (incremental rollout via branching strategy), `infra-delivery/` (how the migration actually ships), `security/` (whether the new architecture is secure by design), `product-domain/` (whether the migration is worth funding to the business), `corporate-politics/` (whether it survives the org's power dynamics), and `business-communication/` (selling the migration to stakeholders) all at once. The tracks are a storage convenience, not a claim that the skills are separable.

Three tracks sit close together but stay distinct: `business-communication/` is about communicating and negotiating _inside_ the organization through legitimate, above-board channels (stakeholders, peers, leadership). `product-domain/` is about understanding the domain well enough to build the right thing, and — at its later units — communicating and negotiating value _outward_, toward a paying client or partner. `corporate-politics/` is about the layer underneath both: how power, credit, and influence actually move through an organization — including the parts that aren't said out loud — and how to operate there effectively and defensively without losing integrity.

## The three levels, and why they exist

Each unit (a single problem→solution pair) is documented at three levels, because "understanding" a topic is really three different skills that get conflated:

1. **L1 — Summary.** Can you name the shape of the problem and its key vocabulary? This is recall and orientation. It's what you skim before a meeting or interview to reload context fast.
2. **L2 — Concept.** Can you explain the idea to another engineer at a whiteboard — the architecture, the pseudocode, the semantics — without writing production code? This is the mental model. Most technical discussions happen at this level.
3. **L3 — Deep dive.** Can you actually build it, defend the trade-offs, and handle the edge cases in real code? This is where theory earns its keep.

Skipping straight to L3 without L1/L2 tends to produce people who can write code but can't explain why, or explain trade-offs on a whiteboard. Stopping at L1/L2 produces people who sound right but haven't been tested by implementation. All three are required for a unit to be "done."

## Exercises exist because reading isn't the same as knowing

A unit can be read start to finish and still not stick — recognizing an idea in prose is a much weaker signal than being able to produce the answer yourself, which is exactly the gap `learning-craft/04` (the Feynman technique, "the illusion of competence") is about. Exercises close that gap for this project itself, not just as a topic it teaches:

- Self-graded quizzes for concept-level (L1/L2) checks, and sandboxed runnable code exercises (real `expect()` assertions, not multiple choice) for L3, where the whole point is usually "can you actually write this."
- Every exercise explains itself after any attempt, pass or fail — a bare pass/fail signal is a test, not a lesson. The `solution` and `explanation` fields are mandatory content, not an afterthought, enforced by `bun run validate:content`.
- "Mark as done" is gated on actually passing the exercises, not just reading to the bottom of the page — otherwise the checkbox measures exposure, not competence.
- A unit doesn't stay "done" forever passively. It comes back on a spaced-repetition schedule (7/30/90 days) and, when due, forces an honest re-take — with a randomly picked variant where the content author provided one — rather than trusting that a checkbox ticked months ago still means something today. This is the "regression test for what you know" the user asked for directly.

See `CLAUDE.md`'s "Exercises, 'Mark as done' gating, and spaced repetition" section for the authoring format and implementation details (`src/components/ExercisePanel.astro`, `src/components/ProgressToggle.astro`, `src/lib/spaced-repetition.ts`).

## Structure on disk

The project is an Astro site, not a bare folder of markdown. Content is authored in Markdown, but it's rendered through real layouts and components (level tabs, syntax highlighting, rendered Mermaid diagrams, `localStorage`-backed progress) rather than read as flat files — see `CLAUDE.md`'s "Tech stack" section for how the pieces connect, and why (the user's own framing): a study reference that isn't dull to sit with is worth more than one that is.

```
systems-mastery/
  CLAUDE.md                    # generation/evolution rules (binding)
  README.md                    # human-facing overview + how to run the site
  ROADMAP.md                   # full topic list per track — human-edited source of truth
  PROGRESS.md                  # session-by-session log of what's been written
  package.json                 # bun scripts: dev, build, preview, generate:roadmap
  astro.config.mjs
  scripts/
    generate-roadmap-data.mjs  # ROADMAP.md -> src/data/roadmap.json (+ assigns slugs)
  docs/
    ARCHITECTURE.md            # this file
  src/
    content.config.ts          # defines the "curriculum" glob-loaded collection
    data/
      roadmap.json              # generated — do not hand-edit
      roadmap.ts                 # typed wrapper the app imports
    lib/
      curriculum.ts             # groups raw entries into per-unit {l1, l2, l3, l3Parts}
    layouts/
      Layout.astro              # shell: nav, Tailwind import, client-side Mermaid render
    components/
      LevelTabs.astro           # L1/L2/L3 tab switcher
      ProgressToggle.astro      # localStorage "mark as done" button
    pages/
      index.astro                # track grid, home
      roadmap.astro               # full roadmap, written units linked
      [track]/index.astro         # unit list for one track
      [track]/[unit]/index.astro  # a written unit's actual page
    content/
      web/<unit-slug>/
        L1-summary.md
        L2-concept.md
        L3-deep-dive.md (or L3-deep-dive/ folder)
      systems/ ...
      git-teamwork/ ...
      business-communication/ ...
      logic/ ...
      security/ ...
      infra-delivery/ ...
      career-craft/ ...
      product-domain/ ...
      corporate-politics/ ...
      learning-craft/ ...
      applied-math/ ...
      testing-quality/ ...
      software-design/ ...
      sustainable-performance/ ...
      people-management/ ...
```

## How the roadmap and reality stay in sync

`ROADMAP.md` is the plan; it is written and approved once up front but is expected to drift as understanding deepens (a unit turns out to need splitting, a problem was misordered, a new problem becomes obviously necessary). Whenever a session changes the plan, `ROADMAP.md` is updated in the same session — it should always be readable as "what's actually true," not "what we guessed at the start."

`PROGRESS.md` is the log — append-only, one entry per session, never rewritten retroactively except to fix factual errors.

## Session cadence

One unit per session, by design (see `CLAUDE.md` rule 2). This is deliberate: the goal is depth and retention, not coverage speed. A rushed L3 with copy-pasted code isn't worth more than a well-reasoned L1.

Track order is not fixed in advance. The roadmap groups problems by track for clarity, but which track gets attention in a given session is a live decision — see `CLAUDE.md` session workflow.
