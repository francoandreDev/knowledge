# systems-mastery

A self-study reference for growing from junior engineer to a solid staff-level engineer, built session by session.

Covers eighteen tracks:

- `web/` — how the web works, from a single HTTP request to systems serving millions of users.
- `systems/` — operating systems, distributed systems, databases, reliability.
- `git-teamwork/` — version control and the human collaboration mechanics built on it.
- `business-communication/` — how technical work gets communicated and defended inside an organization.
- `logic/` — the reasoning substrate underneath all of the above.
- `security/` — security as its own discipline, from authentication basics to secure-by-design architecture.
- `infra-delivery/` — how software actually ships and runs: containers, CI/CD, orchestration, release engineering.
- `career-craft/` — the mechanics of growing as an individual contributor: mentoring, interviewing, feedback, staff scope.
- `product-domain/` — understanding what to build, modeling the business domain, and selling value to a client — speaking their language well enough to be appreciated, not just understood.
- `corporate-politics/` — how power and influence really move in an organization: legitimate ("white") influence, the gray zone, what "black" politics looks like in practice, and how to defend against it without becoming it.
- `learning-craft/` — transversal: how to find trustworthy information fast, learn it correctly, retain it, and build good judgment instead of just accumulating facts.
- `applied-math/` — what to measure, calculate, forecast, and estimate: probability/statistics, queueing theory, capacity math, graph theory, linear algebra, risk modeling — always tied back to real use in `web/` and `systems/`.
- `testing-quality/` — the craft of testing: test pyramid, TDD/BDD, test doubles, flaky tests, mutation/property-based testing, contract testing, quality culture.
- `software-design/` — the craft of maintainable code: SOLID, OOP vs. functional, design patterns, refactoring, technical debt, API design.
- `architecture/` — system architecture above any single codebase: architectural styles, domain-driven design, build-vs-buy, ADR governance, platform engineering, technical strategy.
- `design/` — product, UX, and UI design as its own discipline: design thinking, usability, information architecture, visual design, accessibility, design systems.
- `sustainable-performance/` — the personal sustainability layer: energy/attention management, burnout recovery, boundaries, pacing a career over a decade.
- `people-management/` — the mechanics of formally leading a team: 1:1s, delegation, feedback, hiring, performance management, terminations, org design, managing managers.

Each track is a sequence of real problems ordered by increasing complexity — no explicit junior/mid/senior/staff labels. Each problem ("unit") is documented at three levels: a quick summary, the underlying concept/architecture, and an extensive deep dive with real code.

Start here:

- `docs/ARCHITECTURE.md` — why this project is structured the way it is.
- `ROADMAP.md` — the full list of planned units per track, and their status.
- `PROGRESS.md` — the session-by-session log.
- `CLAUDE.md` — binding rules for how content gets generated and evolved.

Pace: one unit per session, by design.

## Running it

Built with **Astro + MDX + Tailwind**, using **bun**.

```
bun install
bun run build              # builds the static site to dist/
bun run astro preview --port 4321 --background   # serve dist/ in the background
bun run astro preview stop                        # stop it when done
```

`bun run dev` (the file-watching dev server) can be slow to start on a Windows-mounted WSL path — `build` + `preview` is the more reliable local loop here.

After editing `ROADMAP.md` (new unit, reorder, status change), regenerate the data the site reads:

```
bun run generate:roadmap
```

This also assigns a stable slug to any new roadmap row and writes it back into `ROADMAP.md`.
