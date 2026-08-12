# Architecture, essence, and structure

## Why this project exists

A personal reference built session by session to go from junior engineer to a genuinely solid staff-level engineer — not just breadth, but depth: the kind of understanding that survives being asked "why" three times in a row.

## The essence: problems, not levels

Growth from junior to staff doesn't happen because someone hands you a "senior" badge. It happens because the *problems you're trusted to solve* get harder, more ambiguous, and higher-stakes. So instead of organizing content by seniority label, every track is a sequence of real problems ordered by increasing complexity:

- Early units: "how does X work at all" — mechanics, definitions, first principles.
- Mid units: "how do I make X reliable / correct / not fall over" — trade-offs start to matter.
- Late units: "how do I decide between two defensible answers with incomplete information, at scale, with other people involved" — this is what staff work actually looks like.

Nowhere does a document say "you are now senior." The reader infers their own growth from the fact that the problems they can now reason about used to be out of reach.

## The eleven tracks

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
- **`learning-craft/`** — the transversal skill underneath all nine content tracks: how to find trustworthy information fast, tell real understanding from recognition, retain it, and build good technical judgment rather than just accumulating facts.

`learning-craft/` is transversal in the same sense `logic/` is (see below) — it doesn't sit "above" the other tracks so much as run through all of them: every unit in this project is, itself, an exercise in the skills `learning-craft/` documents.

These are not silos. A staff-level problem in `web/` (e.g. architecting a system migration) leans on `systems/` (distributed consistency), `git-teamwork/` (incremental rollout via branching strategy), `infra-delivery/` (how the migration actually ships), `security/` (whether the new architecture is secure by design), `product-domain/` (whether the migration is worth funding to the business), `corporate-politics/` (whether it survives the org's power dynamics), and `business-communication/` (selling the migration to stakeholders) all at once. The tracks are a storage convenience, not a claim that the skills are separable.

Three tracks sit close together but stay distinct: `business-communication/` is about communicating and negotiating *inside* the organization through legitimate, above-board channels (stakeholders, peers, leadership). `product-domain/` is about understanding the domain well enough to build the right thing, and — at its later units — communicating and negotiating value *outward*, toward a paying client or partner. `corporate-politics/` is about the layer underneath both: how power, credit, and influence actually move through an organization — including the parts that aren't said out loud — and how to operate there effectively and defensively without losing integrity.

## The three levels, and why they exist

Each unit (a single problem→solution pair) is documented at three levels, because "understanding" a topic is really three different skills that get conflated:

1. **L1 — Summary.** Can you name the shape of the problem and its key vocabulary? This is recall and orientation. It's what you skim before a meeting or interview to reload context fast.
2. **L2 — Concept.** Can you explain the idea to another engineer at a whiteboard — the architecture, the pseudocode, the semantics — without writing production code? This is the mental model. Most technical discussions happen at this level.
3. **L3 — Deep dive.** Can you actually build it, defend the trade-offs, and handle the edge cases in real code? This is where theory earns its keep.

Skipping straight to L3 without L1/L2 tends to produce people who can write code but can't explain why, or explain trade-offs on a whiteboard. Stopping at L1/L2 produces people who sound right but haven't been tested by implementation. All three are required for a unit to be "done."

## Structure on disk

```
systems-mastery/
  CLAUDE.md              # generation/evolution rules (binding)
  README.md              # human-facing overview
  ROADMAP.md             # full topic list per track, source of truth for scope
  PROGRESS.md            # session-by-session log of what's been written
  docs/
    ARCHITECTURE.md       # this file
  web/
    01-<slug>/
      L1-summary.md
      L2-concept.md
      L3-deep-dive.md (or L3-deep-dive/ folder)
    02-<slug>/
      ...
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
```

## How the roadmap and reality stay in sync

`ROADMAP.md` is the plan; it is written and approved once up front but is expected to drift as understanding deepens (a unit turns out to need splitting, a problem was misordered, a new problem becomes obviously necessary). Whenever a session changes the plan, `ROADMAP.md` is updated in the same session — it should always be readable as "what's actually true," not "what we guessed at the start."

`PROGRESS.md` is the log — append-only, one entry per session, never rewritten retroactively except to fix factual errors.

## Session cadence

One unit per session, by design (see `CLAUDE.md` rule 2). This is deliberate: the goal is depth and retention, not coverage speed. A rushed L3 with copy-pasted code isn't worth more than a well-reasoned L1.

Track order is not fixed in advance. The roadmap groups problems by track for clarity, but which track gets attention in a given session is a live decision — see `CLAUDE.md` session workflow.
