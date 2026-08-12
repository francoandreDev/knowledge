# Progress log

Append-only session log. One entry per session that produces or completes content. Never rewritten retroactively except to fix factual errors — see `docs/ARCHITECTURE.md`.

## 2026-08-12 — Project setup

- Created project structure, git repo, `CLAUDE.md` generation rules, `docs/ARCHITECTURE.md`, and full `ROADMAP.md` across all five tracks (`web`, `systems`, `git-teamwork`, `business-communication`, `logic`).
- No content units written yet — all units `planned`.
- Next: pick the first unit and track together with the user.

## 2026-08-12 — Roadmap expansion: 3 new tracks

- User asked whether the 5-track profile had gaps. Identified 3 missing families and added them: `security/` (13 units), `infra-delivery/` (12 units), `career-craft/` (11 units).
- Updated `ROADMAP.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`, `README.md` to reflect 8 tracks total.
- Total roadmap now 112 units across 8 tracks, all `planned`.

## 2026-08-12 — Roadmap expansion: product-domain track

- User asked to add a `product-domain/` track, explicitly including the commercial side: speaking the client's language well enough that value is appreciated (not just understood), and closing/exploiting the opportunity.
- Added `product-domain/` (13 units), spanning domain modeling/requirements through consultative selling, objection handling, and staff-level presales/executive pitching.
- Updated `ROADMAP.md`, `docs/ARCHITECTURE.md` (including a note distinguishing it from `business-communication/`), `CLAUDE.md`, `README.md` to reflect 9 tracks.
- Total roadmap now 125 units across 9 tracks, all `planned`.

## 2026-08-12 — Roadmap expansion: corporate-politics track

- User asked to add corporate politics explicitly framed as white/gray/black politics, plus defense against black politics.
- Added `corporate-politics/` (14 units), progressing from legitimate influence-building, through the gray zone of narrative/timing, to what black politics looks like in practice, defensive tactics (paper trails, reading warning signs, alliances), and staff-level ethical use of influence.
- Updated `ROADMAP.md`, `docs/ARCHITECTURE.md` (distinguishing it from `business-communication/` and `product-domain/`), `CLAUDE.md`, `README.md` to reflect 10 tracks.
- Total roadmap now 139 units across 10 tracks, all `planned`.

## 2026-08-12 — Roadmap expansion: learning-craft track

- User asked for a transversal track on finding and learning information correctly and faster, with good judgment.
- Added `learning-craft/` (13 units): source evaluation, search literacy, real understanding vs. recognition (Feynman technique), retention (spaced repetition/active recall), fast codebase onboarding, evaluating conflicting expert opinions, using AI tools without atrophying judgment, personal knowledge systems, prioritizing depth vs. skimming, staying current without noise, building calibrated technical judgment, and staff-level fast-learning-across-domains.
- Updated `ROADMAP.md`, `docs/ARCHITECTURE.md` (framed as transversal alongside `logic/`), `CLAUDE.md`, `README.md` to reflect 11 tracks.
- Total roadmap now 152 units across 11 tracks, all `planned`.

## 2026-08-12 — Roadmap expansion: applied-math track

- User asked for a final track on math and engineering: what to measure, calculate, forecast, and estimate, with explicit ties to where each concept applies in `systems/` and `web/`.
- Added `applied-math/` (15 units): measurement theory, orders of magnitude, asymptotic analysis, combinatorics/probability foundations, probability distributions, queueing theory (Little's Law), statistics/significance, time series/regression, graph theory, linear algebra, capacity planning math, unit economics/cost modeling, quantitative risk modeling, and staff-level quantitative modeling for architecture decisions.
- Updated `ROADMAP.md`, `docs/ARCHITECTURE.md` (framed as transversal alongside `logic/` and `learning-craft/`, with explicit cross-reference note to `systems/`/`web/`), `CLAUDE.md`, `README.md` to reflect 12 tracks.
- Total roadmap now 167 units across 12 tracks, all `planned`. This is likely the completion point of the track-level roadmap — future sessions should focus on content generation rather than further track expansion unless a genuine new gap surfaces.

## 2026-08-12 — Roadmap expansion: testing-quality, software-design, sustainable-performance; career-craft extended

- User asked once more whether the profile had gaps. Identified two genuine ones (no dedicated home for testing craft or software design principles) and two weaker candidates (compensation negotiation, personal sustainability), then asked the user to pick.
- User chose all four: added `testing-quality/` (13 units), `software-design/` (13 units), and `sustainable-performance/` (8 units) as new tracks; added 2 compensation-negotiation units to the existing `career-craft/` (now 13 units) rather than a new track, since negotiation is a career mechanic, not a separate family.
- Updated `ROADMAP.md`, `docs/ARCHITECTURE.md` (added relationship notes: `testing-quality/`+`software-design/` relate to `web/`/`systems/` the way `applied-math/` does; `sustainable-performance/` distinguished from `career-craft/`), `CLAUDE.md`, `README.md` to reflect 15 tracks.
- Total roadmap now 203 units across 15 tracks, all `planned`. User has been asked twice now whether the roadmap is complete — treat a third "any gaps?" pass as the point to push back gently on further expansion in favor of starting content, unless a clearly distinct new gap appears.

## 2026-08-12 — Roadmap expansion: people-management track

- User confirmed they specifically plan to lead teams, so added `people-management/` (15 units): the IC-to-manager transition, 1:1s, delegation, feedback (SBI), goal-setting/OKRs, spotting struggling reports early, conflict mediation, hiring, onboarding, performance calibration, PIPs, terminations, team resilience/succession, org design, and managing managers.
- This track is explicitly scoped to a management path, not assumed universal — noted as such in `docs/ARCHITECTURE.md` and `ROADMAP.md`, distinguishing it from `career-craft/` (growing yourself as an IC), `corporate-politics/` (informal power/influence), and `business-communication/` (peer/stakeholder communication).
- Updated `ROADMAP.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`, `README.md` to reflect 16 tracks.
- Total roadmap now 218 units across 16 tracks, all `planned`. (Note: earlier entries in this log undercounted due to arithmetic slips at the testing-quality/software-design/sustainable-performance step — 218 is the verified count, confirmed by direct table-row count in `ROADMAP.md`.)
- Next: pick the first unit and track together with the user.

## 2026-08-12 — Rebuilt as an Astro site (not loose markdown)

- User decided the plain-markdown-folder approach wasn't the right medium — the point is to teach in an engaging way, not to produce something as flat as a `.txt`. Chose Astro + MDX + Tailwind (recommended over plain HTML) and bun as the package manager/runtime.
- Scaffolded Astro 7 in place, added `@astrojs/mdx`, Tailwind v4 (`@tailwindcss/vite`) + `@tailwindcss/typography`, and `mermaid`. Moved all 16 track folders under `src/content/` (required by Astro content collections).
- Built `scripts/generate-roadmap-data.mjs`: parses `ROADMAP.md`'s per-track tables, assigns a stable kebab-case slug to any row missing one (rewriting `ROADMAP.md` with an explicit `Slug` column so slugs never drift on re-run), and emits `src/data/roadmap.json` (+ `src/data/roadmap.ts` typed wrapper). `ROADMAP.md` stays the human-edited source of truth; the JSON is generated and gets regenerated via `bun run generate:roadmap`.
- Built the rendering pipeline: `src/content.config.ts` (glob-loaded `curriculum` collection), `src/lib/curriculum.ts` (groups raw entries into per-unit `{l1, l2, l3, l3Parts}`), `Layout.astro` (nav + client-side Mermaid rendering of fenced ```mermaid blocks), `LevelTabs.astro` (L1/L2/L3 tab switcher), `ProgressToggle.astro` (localStorage-backed "mark as done"), and pages for home (`/`), `/roadmap`, `/[track]/`, `/[track]/[unit]/`.
- Verified end-to-end with a throwaway `_smoketest` content fixture (since deleted) via `bun run build` + `astro preview --background`, checked live in Chrome. Found and fixed two real bugs in the process: (1) the glob loader lowercases generated entry ids, so the id-parser in `curriculum.ts` needed case-insensitive matching against `L1-`/`L2-`/`L3-` prefixes; (2) `LevelTabs` and `ProgressToggle` only initialized on the `astro:page-load` event, which never fires without a `ClientRouter`/View Transitions — fixed by also calling init directly on script execution.
- Also learned: `bun run dev` (file-watching) reliably fails to start within Astro's 30s timeout on this `/mnt/c/...` WSL-over-Windows path — `bun run build` + `astro preview --background` is the dependable local loop, now documented in `CLAUDE.md` and `README.md`.
- No study content has been written yet — this session was entirely infrastructure. All units remain `planned`.
- Updated `CLAUDE.md` (full "Tech stack" section, new file/folder naming under `src/content/`, session workflow now includes running `generate:roadmap` and a real build check), `docs/ARCHITECTURE.md` (new "Structure on disk" reflecting the Astro layout), `README.md` (run instructions).
- Next: pick the first unit and track together with the user — this time it will actually render as a page, not just a markdown file.

## 2026-08-12 — Added lint/format/typecheck/content-validation/test guardrails + scaffold script

- User asked for security/lint/test measures and rules that are always read, so that starting a new topic from their side is always easy and never leads to an inconsistent state.
- Added ESLint (flat config, `eslint.config.mjs`, TS + Astro + Node-aware for `scripts/`), Prettier (`prettier-plugin-astro`), `astro check` for types, and `scripts/validate-content.mjs` — which cross-checks `ROADMAP.md`, `src/data/roadmap.json`, and the real files under `src/content/` for drift (missing roadmap rows, stale generated data, status/content mismatches, missing frontmatter).
- Added `scripts/new-unit.mjs` (`bun run new:unit <track> <unit-number-or-slug>`) — scaffolds a unit's three level files with correct frontmatter and flips its `ROADMAP.md` status to `in-progress` in one command, so the user (or Claude) always starts from the same known-good shape.
- Added `bun test` coverage (`bun:test`) for the two places a silent parsing bug would be hardest to spot by eye: the roadmap slug generator (`scripts/generate-roadmap-data.test.mjs`) and the content-entry-id parser (`src/lib/curriculum.test.ts`). Had to refactor `curriculum.ts` to type-only import `astro:content` and dynamic-import `getCollection` at call time, since the virtual module doesn't resolve under plain `bun test`.
- Added `bun run check` aggregating generate:roadmap → lint → format:check → typecheck → validate:content → test → build; documented in `CLAUDE.md` as mandatory before ending any content/code session, replacing the earlier "just run build" guidance.
- Found and fixed two real bugs while dogfooding all of this: (1) `generate-roadmap-data.mjs` wrote `src/data/roadmap.json` before reformatting `ROADMAP.md` with Prettier, so `ROADMAP.md`'s mtime ended up newer than the JSON it just generated from, causing `validate:content` to always report the data as stale — reordered so Prettier runs before the JSON write; (2) `new-unit.mjs`'s status-flip regex assumed single-space table cells, but Prettier pads columns for alignment — fixed to match on `\s*` like the rest of the parsing already does.
- Verified the whole loop end-to-end with a throwaway scaffolded unit (`web/http-request-response-basics`, since removed, status reverted to `planned`): `new:unit` → `validate:content` correctly flagging staleness → `generate:roadmap` clearing it → cleanup.
- No study content has been written yet. All 218 units remain `planned`.
- Next: pick the first unit and track together with the user.

## 2026-08-12 — First real unit: web/http-request-response-basics (done)

- Wrote the first actual study content, to validate the whole pipeline (structure, tooling, and the site itself) end-to-end with real material rather than a throwaway fixture. `web/01 — HTTP request/response basics`, chosen as the most foundational, broadly-illustrative unit: it exercises a Mermaid diagram, pseudocode, and real runnable code, which most other units will need some subset of.
- L3 code examples (`raw-request.mjs` client, `raw-server.mjs` server, both raw `node:net` sockets with no HTTP library) were actually run under `bun run` and verified against each other locally (not just written and assumed correct) — confirmed `GET /time` and a 404 path both round-trip correctly before considering the unit done.
- Found and fixed a real rendering bug while reviewing the built page in Chrome: Mermaid sequence diagrams mirror actor boxes at the bottom by default, and in our narrow content column that mirrored repeat overlapped the diagram's last note/message instead of getting its own space. Fixed globally via `sequence: { mirrorActors: false }` in `Layout.astro`'s Mermaid init — affects every future Mermaid sequence diagram in the project, not just this unit. (Caught via a user-provided screenshot after a `<br/>`-in-message-text overlap was already fixed — worth remembering: always scroll/screenshot the *entire* rendered diagram, not just what's initially in viewport, since Mermaid layout bugs can be low enough to be off-screen on first look.)
- Ran `bun run check` clean (0 lint/format/type errors, content validation passed, 9/9 tests, build succeeded) both before and after the Mermaid fix, and visually reviewed all three levels (L1/L2/L3) live in Chrome via `astro preview --background`.
- Marked `web/http-request-response-basics` `done` in `ROADMAP.md` (all three levels complete, not just started) and ran `generate:roadmap`.
- Confirms the structure works for both sides as designed: `new:unit` → write content → `check` → visual review → mark `done` is a clean, repeatable loop with no friction found other than the Mermaid bug above (now fixed for all future units).
- 1/218 units done.
- Next: pick the next unit and track together with the user.
