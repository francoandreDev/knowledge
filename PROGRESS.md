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
- Found and fixed a real rendering bug while reviewing the built page in Chrome: Mermaid sequence diagrams mirror actor boxes at the bottom by default, and in our narrow content column that mirrored repeat overlapped the diagram's last note/message instead of getting its own space. Fixed globally via `sequence: { mirrorActors: false }` in `Layout.astro`'s Mermaid init — affects every future Mermaid sequence diagram in the project, not just this unit. (Caught via a user-provided screenshot after a `<br/>`-in-message-text overlap was already fixed — worth remembering: always scroll/screenshot the _entire_ rendered diagram, not just what's initially in viewport, since Mermaid layout bugs can be low enough to be off-screen on first look.)
- Ran `bun run check` clean (0 lint/format/type errors, content validation passed, 9/9 tests, build succeeded) both before and after the Mermaid fix, and visually reviewed all three levels (L1/L2/L3) live in Chrome via `astro preview --background`.
- Marked `web/http-request-response-basics` `done` in `ROADMAP.md` (all three levels complete, not just started) and ran `generate:roadmap`.
- Confirms the structure works for both sides as designed: `new:unit` → write content → `check` → visual review → mark `done` is a clean, repeatable loop with no friction found other than the Mermaid bug above (now fixed for all future units).
- 1/218 units done.
- Next: pick the next unit and track together with the user.

## 2026-08-12 — Second Mermaid fix: note text vertical alignment (user-caught via screenshots)

- After the mirrorActors fix above, the user flagged (with a `/paste` screenshot, then the actual rendered SVG markup) that a note's rect and its text were still visibly misaligned — a problem the visual "does it look okay" pass had missed, and one my browser automation couldn't re-check for a while (Chrome DevTools Protocol screenshot calls started timing out mid-session, on every tab including freshly-created ones — resolved on its own after a few minutes; treated as a transient bridge issue, not a page bug, since Vivaldi itself was responsive the whole time per the user).
- Root cause, from the actual SVG the user pasted: Mermaid's note `<text>` had **both** `dominant-baseline="middle"` and `dy="1em"` set — two different vertical-centering techniques (one for browsers that honor `dominant-baseline`, one for those that don't) stacked instead of chosen between. Browsers that support `dominant-baseline` (Chrome/Vivaldi/Firefox) apply both, so the extra `dy` shifts note text well below the rect's real center.
- First attempt (`transform: translateY(-1em)` on `.noteText`, canceling the dy entirely) was an overcorrection — user confirmed via a second screenshot it was "slightly better but not perfect," text now sitting a bit high. Recomputed from the exact coordinates in the pasted SVG (rect y=179 h=20 → true center 189; text y=184 → dominant-baseline-only center is 184, 5px short of true center) and corrected to `translateY(calc(-1em + 5px))`. User confirmed via a third screenshot this is now correctly centered, both axes.
- Lesson for future units: a `bun run check` pass and even a visual glance are not sufficient to catch sub-pixel-scale Mermaid rendering bugs — they need either a zoomed screenshot of the specific element or, as happened here, the user inspecting actual SVG output. Worth doing a zoomed check on any new diagram type (not just sequence diagrams) before marking a unit `done`.
- Fix lives in `src/styles/global.css` (`.mermaid .noteText { transform: translateY(calc(-1em + 5px)); }`), documented inline with the exact reasoning — applies to every note in every Mermaid sequence diagram project-wide, not just this unit's.

## 2026-08-12 — Built the exercise system: quizzes, sandboxed code exercises, gated "Mark as done", spaced repetition

- User asked for a real testing layer on top of the reading material: self-graded exercises with an "expect" (i.e. real code assertions, not just multiple choice), "Mark as done" only achievable once everything passes with no errors, and periodic automatic un-marking to force a genuine re-exam and catch regressions in retained knowledge. Mid-implementation, the user added two more requirements: every exercise must reveal the solution and the reasoning after any attempt (not just pass/fail), and exercises should be randomized from a pool per topic rather than the same fixed question every time.
- New `exercises` content collection (`src/content.config.ts`): one optional `exercises.json` per unit, `quiz` (multiple choice) and `code` (sandboxed, `expect()`-based) item types. Both types now require an `explanation`; code items also require a `solution` — enforced by `bun run validate:content`, not just convention.
- Items sharing a `poolId` are randomized variants of the same question; `src/lib/curriculum.ts`'s `groupExercisesIntoPools()` groups them, and `ExercisePanel.astro`'s client script picks one at random per render (including after a spaced-repetition reset) and builds its DOM directly (not server-rendered per-variant, since which variant shows has to vary per view).
- Code exercises run in a sandboxed Web Worker (`ExercisePanel.astro`'s `WORKER_SOURCE`) — no DOM/window access, a 3-second timeout guards against infinite loops, and a minimal `expect(actual).toBe/toEqual/toBeTruthy/toThrow()` API is injected. Verified with both a deliberately wrong implementation (correctly fails 2/4 tests with real error messages) and a correct one (4/4 pass) via real browser interaction, not just reading the code.
- `ProgressToggle.astro` rewritten: units with any exercises disable "Mark as done" until every pool has been passed (tracked per-pool in `localStorage`, not per-variant, so gating survives which random variant was shown); units with none keep the old ungated manual toggle. `src/lib/spaced-repetition.ts` schedules re-exams at 7/30/90-day intervals (capped at 90) and, on the next visit past the due date, auto-unmarks the unit **and clears every pool's pass/fail state**, forcing a real re-take with a fresh random variant — verified by manually backdating `nextReviewAt` in localStorage and confirming the reset fired correctly (gating re-locked, all 4 exercise states cleared to null, stage preserved at 1 rather than reset to 0).
- Found and fixed a real bug while testing the toggle: `initProgressToggles()`/`initExercises()` re-run on events like `exercise:graded`, and were re-attaching a fresh click listener to the same button every time without removing the old one — one real click ended up firing the handler multiple times, toggling `done` on then back off. Fixed by splitting each component into a one-time "wire" step (guarded by a `data-wired` flag) and a repeatable "render" step; documented as a required pattern in `CLAUDE.md` for any future interactive component.
- Confirmed GFM tables and Mermaid chart types (`xychart-beta`, etc. — anything beyond sequence diagrams) both render with zero new code, just documentation of usage in `CLAUDE.md`; charts/tables are for illustrating concepts in content, not interactive, per the user's explicit scope answer earlier in this conversation.
- Added real (not placeholder) exercises to `web/http-request-response-basics`: 2 quiz pools (one with 2 randomized variants, one with 1) for L1, 1 quiz for L2, 1 code exercise (`byteLength`, using `TextEncoder` since Workers have no Node `Buffer`) for L3 — all verified working end-to-end in the browser, including the randomized-variant pool (dispatched `exercises:reset` 8 times, saw both variants appear) and the solution/explanation reveal after a failing attempt.
- Updated `CLAUDE.md` with a full "Exercises, 'Mark as done' gating, and spaced repetition" section (format, required fields, pools, gating behavior, the wire/render pattern requirement) and `docs/ARCHITECTURE.md` with the "why" (exercises exist because reading isn't the same as knowing, tied back to `learning-craft/04`'s Feynman-technique framing). Session workflow (`CLAUDE.md`) now includes writing exercises and clicking through them before marking a unit done.
- `bun run check` clean throughout. `web/http-request-response-basics` remains the only `done` unit (1/218) — this session was entirely infrastructure for the exercise system, no new topic content.
- Next: pick the next unit and track together with the user — from here on, units should come with exercises unless there's a real reason not to.

## 2026-08-12 — Validated tables/charts in a real browser; fixed two contrast bugs

- The earlier "tables and charts work" claim had only been checked via `bun run build` succeeding and a raw HTML grep (`<table>`, `xychart-beta` present in output) — never actually looked at in a rendered page. User pushed back specifically because `applied-math/` will lean on this heavily. Built a throwaway fixture (GFM table, `xychart-beta` bar chart, `xychart-beta` line chart with 3 series approximating O(n)/O(n log n)/O(n²) growth curves, `pie` chart) and reviewed all four live in Chrome.
- GFM table: correct out of the box, no issues.
- `xychart-beta` bar and line charts: both rendered correctly (the 3-series line chart clearly showed the three growth curves as distinct, readable lines) but the plot area had its own mid-gray background rectangle that visibly mismatched the page's near-black `bg-slate-950` — `xyChart`'s background falls back to the Mermaid theme's `background` variable, which the built-in `dark`/`default` themes set to a shade lighter than our actual page background.
- `pie` chart: the default `dark` theme's slice palette (`pie1`..`pie6`) includes a near-black entry, which was effectively invisible against `bg-slate-950` — only distinguishable by its border.
- Fixed both in `Layout.astro`'s `mermaid.initialize()`: added `themeVariables` (background: transparent, brighter `pie1`-`pie6` palette with dark slice-label text for contrast, for both light/dark mode) and an explicit `xyChart: { backgroundColor: "transparent", plotColorPalette: ... }`. Deliberately layered these as _overrides on top of_ the existing `theme: "dark"/"default"` rather than switching to Mermaid's fully custom `"base"` theme, specifically to avoid risking a regression in the sequence-diagram appearance already fixed and validated earlier — re-checked the existing `web/http-request-response-basics` L2 sequence diagram after the change and confirmed no visual regression.
- Assessed `xychart-beta`'s real limits for `applied-math/`'s sake: bar/line only, no scatter, no true smooth curves (approximate with enough points), no dual-axis, no log scale. Judged sufficient for the large majority of illustration needs there; recommended against building custom charting infrastructure speculatively — revisit only if a specific `applied-math/` unit hits a real wall (needs scatter or log-scale) that an approximation can't cover. Documented in `CLAUDE.md`.
- Fixture removed after review. `bun run check` clean.
- Next: pick the next unit and track together with the user.

## 2026-08-12 — Visual pass: icons throughout the UI chrome

- User asked (explicitly framed as a taste call, not a functional gap) for the site to feel more visual — icons, and periodic images/graphics/tables — while keeping what already works, then wanted the resulting visual/functional balance written down as a standing rule.
- Installed `lucide-astro` (tree-shakeable per-icon Astro components, no runtime icon-font dependency). Added `TrackIcon.astro` (one icon per track, e.g. Globe for `web/`, Server for `systems/`, GitBranch for `git-teamwork/`, Shield for `security/`, Swords for `corporate-politics/`, etc. — all 16 mapped) and `StatusBadge.astro` (check/loader/circle icon + color per done/in-progress/planned status).
- Wired icons into: home page track cards (icon chip per track, next to the progress bar), `/roadmap` (track icon per section, `StatusBadge` per unit replacing plain text), track detail pages (large track icon by the `<h1>`, `StatusBadge` per unit), unit pages (track icon in the breadcrumb, file/lightbulb/code icons on the L1/L2/L3 tabs), `ProgressToggle` (check/lock/circle icon reflecting done/gated/available state), `ExercisePanel` (question-mark/code-brackets badge per exercise pool — type is constant across a pool's randomized variants even though which variant shows is random, so this badge is safely server-rendered rather than needing the client-side variant picker), and the site nav (graduation-cap logo, checklist icon on the roadmap link).
- Verified visually in the browser (not just build-passing) across home, roadmap, track, and unit pages — icons render crisply, status badges are clearly scannable (green "written" vs. gray "planned" reads at a glance in a way plain text didn't), no regressions to existing layout/spacing.
- Wrote the requested standing rule into `CLAUDE.md` ("Visual design balance"): UI chrome icons are already built and should be reused, not reinvented, by any new page/component; content visuals (tables/charts) should appear only where they genuinely clarify a comparative or quantitative idea, not to hit a decoration quota — L2's required diagram already guarantees a baseline visual per unit.
- `bun run check` clean throughout this session.
- Next: pick the next unit and track together with the user.
