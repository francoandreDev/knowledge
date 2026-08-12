# Project instructions — systems-mastery

This file governs how content is generated and evolved in this project across sessions. Follow it exactly.

## What this project is

A self-study reference the user is building to grow from junior to a solid staff-level engineer (and, via `people-management/`, toward leading teams). It covers sixteen tracks: `web/`, `systems/`, `git-teamwork/`, `business-communication/`, `logic/`, `security/`, `infra-delivery/`, `career-craft/`, `product-domain/`, `corporate-politics/`, `learning-craft/`, `applied-math/`, `testing-quality/`, `software-design/`, `sustainable-performance/`, `people-management/`. See `docs/ARCHITECTURE.md` for the full rationale and `ROADMAP.md` for the topic list.

It is an **Astro + MDX + Tailwind site**, not a folder of loose markdown files — content is written in Markdown but rendered as a real, navigable, non-boring site (tabs between levels, syntax-highlighted code, rendered Mermaid diagrams, per-unit progress tracking in `localStorage`). Use **bun**, not npm/pnpm/yarn, for every command in this project.

## Tech stack and how it fits together

- **Astro** (static output) + **`@astrojs/mdx`** for content, **Tailwind v4** (`@tailwindcss/vite`) + **`@tailwindcss/typography`** for styling, **mermaid** (client-side) for diagrams.
- Content lives under **`src/content/<track>/<unit-slug>/`** (not at the project root — Astro's content collections require this). The collection is defined in `src/content.config.ts` as a single `curriculum` collection using a glob loader over `src/content/**/*.{md,mdx}`.
- `ROADMAP.md` (project root) stays the single **human-edited** source of truth for what units exist, their order, and status. It is never read directly by the app. Instead:
  - `scripts/generate-roadmap-data.mjs` parses `ROADMAP.md`'s tables, assigns a stable kebab-case slug to any row missing one (rewriting `ROADMAP.md` in place with an explicit `Slug` column so slugs never silently change), and writes `src/data/roadmap.json`.
  - `src/data/roadmap.ts` is a typed wrapper around that JSON — this is what the site actually imports.
  - **Run `bun run generate:roadmap` after any edit to `ROADMAP.md`** (new unit, reorder, reword, status change) and commit the resulting `ROADMAP.md` + `src/data/roadmap.json` diff together.
- `src/lib/curriculum.ts` groups raw content-collection entries (ids like `web/http-request-response-basics/l1-summary`) into per-unit `{l1, l2, l3, l3Parts}` bundles for rendering. Note: the glob loader **lowercases generated ids** — level-file names must still be written `L1-summary.md` / `L2-concept.md` / `L3-deep-dive.md` on disk (rule 4 below), the lowercasing is purely an internal id detail already handled by the parser.
- Pages: `/` (track grid with progress bars), `/roadmap` (full roadmap, written units linked), `/[track]/` (unit list for a track), `/[track]/[unit]/` (the actual unit page — `LevelTabs` component switches between L1/L2/L3, `ProgressToggle` persists a done/not-done flag in `localStorage`, keyed `progress:<track>/<unit-slug>`).
- `getStaticPaths` for `/[track]/[unit]/` is generated from **written content**, not from `ROADMAP.md` — a unit with no files on disk simply doesn't get a page yet; it just shows as `planned`/greyed-out on the track and roadmap pages.
- A second content collection, `exercises` (also defined in `src/content.config.ts`), loads one optional `exercises.json` per unit. See "Exercises" below for the authoring format and how it gates `ProgressToggle`.
- A third content collection, `interactives`, loads one optional `interactives.json` per unit — ungraded "move a slider, see the result and the trend" widgets. See "Interactive demos" below.

## Local workflow

- `bun install` — install deps.
- `bun run build` — the reliable way to verify a change; fast, static, no watcher.
- `bun run astro build --force` if a stale content-layer cache causes ghost pages (e.g. after deleting a content file) — plain `build` alone does not always invalidate the cache.
- `bun run astro preview --port <port> --background` then `curl`/browser-check it, `bun run astro preview stop` when done. **Avoid `bun run dev`** for verification in this environment — the file watcher on `/mnt/c/...` (WSL-over-Windows filesystem) is slow enough that it has reliably failed to start within Astro's 30s timeout; `build` + `preview` is the dependable loop here.

## Guardrails — run these, don't just trust the markdown

The project has lint, format, typecheck, content-validation, and test tooling specifically so a session can never leave the site in a broken or inconsistent state without it being caught immediately, and so the user can start a new unit from their own side with one command instead of hand-crafting folders.

- **`bun run new:unit <track> <unit-number-or-slug>`** — the one-command way to start a unit. Looks the unit up in `src/data/roadmap.json` (run `generate:roadmap` first if `ROADMAP.md` was just edited and this is stale), scaffolds `L1-summary.md` / `L2-concept.md` / `L3-deep-dive.md` with correct frontmatter under `src/content/<track>/<slug>/`, and flips that unit's `ROADMAP.md` status to `in-progress`. Refuses to run if the unit folder already exists (won't overwrite). The user can run this themselves at the start of a session, or ask Claude to run it — either way it's the same known-good starting shape every time.
- **`bun run validate:content`** — checks that `ROADMAP.md`, `src/data/roadmap.json`, and the actual files under `src/content/` all agree: every written unit has a matching roadmap row, every `.md` file has `title` frontmatter, a unit marked `done` actually has all three levels written, a unit with written files isn't still marked `planned`, and `roadmap.json` isn't stale relative to `ROADMAP.md`. This is what catches "I wrote the files but forgot to update the roadmap" or "the slug in the folder doesn't match the slug in the roadmap" before they become confusing bugs later.
- **`bun run lint`** / **`bun run lint:fix`** — ESLint (flat config, TS + Astro + Node-scripts-aware) over the whole project.
- **`bun run format`** / **`bun run format:check`** — Prettier (with `prettier-plugin-astro`) over everything, including `ROADMAP.md`'s tables (`generate-roadmap-data.mjs` already reformats `ROADMAP.md` with Prettier itself after rewriting it, so this should never actually flag it).
- **`bun run typecheck`** — `astro check`, catching type errors in `.astro`/`.ts` files, including content-collection schema mismatches.
- **`bun run test`** — `bun test`, currently covering the roadmap-slug generator and the content-entry-id parser (the two places where a silent parsing bug would be hardest to notice by eye).
- **`bun run check`** — runs all of the above in order (`generate:roadmap` → `lint` → `format:check` → `typecheck` → `validate:content` → `test` → `build`) and stops at the first failure. **Run this before ending any session that touched content or code**, not just `build` alone — `build` succeeding does not mean the roadmap is in sync, the code is linted, or frontmatter is present.

If `bun run check` fails, fix the root cause — don't work around it by skipping a step, and don't leave a session with a red `check`.

## Non-negotiable generation rules

1. **All content is written in English.** No exceptions, regardless of the language the session is conducted in.
2. **One unit per session.** A "unit" is a single problem→solution item from `ROADMAP.md`. Do not generate multiple units in one session unless the user explicitly asks to batch.
3. **No explicit level labels.** Never write "junior", "mid", "senior", or "staff" as a tag, folder name, or heading inside a unit. The progression toward staff-level is expressed through the growing complexity and stakes of the problems themselves — not through a label. It's fine to reference these words narratively if genuinely relevant (e.g. quoting a real title in an example), but never as a classification device.
4. **Every unit has exactly three levels, no more, no less:**
   - `L1-summary.md` — a tight outline of the topic. Bullet points, key terms, the shape of the problem. Someone should be able to skim this in 2 minutes and know what the unit covers.
   - `L2-concept.md` — the idea itself: pseudocode, a diagram (ASCII or Mermaid), architecture sketch, semantics, the "why" and the "how it fits together". No production code yet — this is about the model in your head, not the implementation.
   - `L3-deep-dive.md` (or `L3-deep-dive/` folder, see rule 5) — extensive theory with real, runnable code examples. This is the substantial one. Trade-offs, edge cases, failure modes, at least one worked example end-to-end.
5. **L3 may span multiple sessions.** If a topic is large, split `L3-deep-dive/` into a folder with `part-1-<slug>.md`, `part-2-<slug>.md`, etc., plus a short `00-index.md` listing the parts and their status (done / in progress / planned). Never leave a part half-written across a session boundary — finish the part you're on, then stop.
   5b. **Add exercises when the unit supports it** (see "Exercises" below) — not strictly mandatory like L1–L3, but the default expectation for any unit where a real quiz question or code exercise is possible, which is most of them. Skipping exercises should be the exception, made consciously, not the default because it's less work.
6. **Update `PROGRESS.md` at the end of every session** that produces or completes content: date, unit touched, what level(s) were written, and what's next.
7. **Update `ROADMAP.md`** whenever a unit is added, reordered, split, or reworded — the roadmap must always reflect reality, not the original plan.
8. **Don't pad.** If a unit's concept is simple, L2 can be short. Depth should track the actual complexity of the problem, not a page-count target.
9. **Every unit stands on real code**, not toy hand-waving — L3 examples should be the kind of code you'd actually defend in a review, with realistic naming and structure (language choice is free per-topic; pick whatever best illustrates the concept, and say why if it's not obvious). This applies to genuinely technical tracks (`web`, `systems`, `git-teamwork`, `security`, `infra-delivery`, `testing-quality`, `software-design`, `applied-math`, `logic`) where the logic is naturally computational. **Non-technical/soft-skill tracks** (`business-communication`, `career-craft`, `product-domain`, `corporate-politics`, `learning-craft`, `people-management`, `sustainable-performance`) should ground L3 in fully worked real-world scenarios instead — and must never dress plain reasoning as a fenced code block with `function`/`if`/`return` syntax and invented, undefined helper calls just to look rigorous. That's noise, not teaching; express procedures as prose, numbered steps, or tables in these tracks, never as fake pseudocode wearing a programming language's syntax.
10. **Before starting a new unit, ask the user which track/unit to tackle** unless they've already named it — do not assume the next item in `ROADMAP.md` is automatically next; track order is decided per session (see `docs/ARCHITECTURE.md`).

## File/folder naming

```
src/content/<track>/<unit-slug>/
  L1-summary.md
  L2-concept.md
  L3-deep-dive.md              # or:
  L3-deep-dive/
    00-index.md
    part-1-<slug>.md
    part-2-<slug>.md
```

`<unit-slug>` must exactly match the `Slug` column for that unit in `ROADMAP.md` (case-sensitive) — that's how the site links a written unit back to its roadmap row. If a unit doesn't have a slug in `ROADMAP.md` yet, run `bun run generate:roadmap` first to have one assigned, rather than inventing one ad hoc in the content folder.

Each `.md` file needs frontmatter with at least `title`:

```md
---
title: "L1 — <short title>"
---
```

## Exercises, "Mark as done" gating, and spaced repetition

Exercises are **optional per unit** but strongly encouraged — a unit with exercises is meaningfully more valuable than one without, and `ProgressToggle` treats units with exercises differently from units without. Live at `src/content/<track>/<unit-slug>/exercises.json`, schema in `src/content.config.ts`.

**Two exercise types**, both self-grading and both client-side only (no backend):

- **`"quiz"`** — best for L1/L2 (concepts, definitions, "why" questions). Multiple choice, self-graded against `correctIndex`.
- **`"code"`** — best for L3 (anything with real code already). The learner edits `starterCode` in a `<textarea>`, clicks "Run tests", and it executes in a sandboxed Web Worker against `tests[].expr` strings using an injected `expect(actual).toBe/toEqual/toBeTruthy/toThrow(...)` mini-API (see `ExercisePanel.astro`'s `WORKER_SOURCE`). A 3-second timeout guards against infinite loops. **No Node globals available** (no `Buffer`, no `require`) — it's a browser Worker, so use `TextEncoder`/`TextDecoder`/etc. for anything byte-related.

**Every exercise must explain itself, unconditionally, after any attempt** — right or wrong. This is the whole point: a pass/fail signal with no reasoning attached teaches nothing. Concretely:

- Quiz items: `explanation` is **required** (not optional) and is shown after every "Check answer" click, whether the pick was right or wrong.
- Code items: `solution` (a real working implementation) and `explanation` (why it works, not just what it does) are **both required**, and are revealed after every "Run tests" click, whether tests passed or not.

`bun run validate:content` enforces both of these — an exercise missing `explanation`, or a code exercise missing `solution`, fails the check.

**Randomized variants (pools).** Give two or more items the same `poolId` to make them interchangeable variants of the same underlying question — the page picks one at random on every render (and again on every spaced-repetition reset), so a re-exam isn't just re-answering the exact same question from memory. An item with no `poolId` is its own singleton pool (fine for most exercises; add real variants where a question is easy to memorize the answer to rather than reason through). All variants sharing a `poolId` must have the same `level` and `type` — `validate:content` checks this.

```json
{
  "items": [
    {
      "type": "quiz",
      "id": "status-code-range",
      "poolId": "status-code-range-pool",
      "level": 1,
      "prompt": "...",
      "choices": ["...", "...", "...", "..."],
      "correctIndex": 2,
      "explanation": "..."
    },
    {
      "type": "code",
      "id": "byte-length",
      "level": 3,
      "prompt": "...",
      "starterCode": "function f(x) {\n  // TODO\n}\n",
      "tests": [{ "description": "...", "expr": "expect(f(1)).toBe(2)" }],
      "solution": "function f(x) {\n  return x + 1;\n}",
      "explanation": "..."
    }
  ]
}
```

**"Mark as done" gating.** If a unit has any exercises, `ProgressToggle` disables "Mark as done" until every pool has been passed at least once in the current session (state tracked per-pool in `localStorage`, key `exercise:<track>/<unit-slug>/<poolId>`). Units with zero exercises keep the old, ungated manual toggle.

**Spaced repetition / re-exam.** Marking a unit done schedules a re-exam via `src/lib/spaced-repetition.ts`: 7 days after first completion, 30 days after the next, 90 days after that (capped there). When the scheduled date passes, the _next visit_ to that unit's page automatically un-marks it done **and clears every exercise pool's pass/fail state**, forcing a genuine re-take (with freshly randomized variants) rather than just re-clicking a button — this is the regression check the user asked for. This logic lives in `checkAndApplyReviewDue()` and runs from `ProgressToggle`'s init; it dispatches an `exercises:reset` DOM event that `ExercisePanel` listens for to re-render with a fresh random pick, even if it already initialized earlier on the same page load.

**Tables and charts** need no special component — GFM tables (`| a | b |`) render via Astro's built-in remark-gfm, and Mermaid supports more than sequence diagrams: use ` ```mermaid ` fences with `xychart-beta` (bar/line charts) or `pie` for illustrating things like algorithmic growth curves, latency budgets, or comparative data. These are for **illustrating concepts in the content itself**, not interactive — if a chart needs to be part of an exercise, that's a code exercise, not a chart type. Both were visually verified in a real browser (not just a build check) — see `PROGRESS.md`'s "Validated tables/charts" entry for what was checked and the two theme bugs found and fixed (`Layout.astro`'s `chartThemeVariables` / `xyChart` config in `mermaid.initialize()`).

**Known limits of `xychart-beta`** (relevant mainly to `applied-math/`): bar and line only, no scatter plots, no true smooth-curve rendering (a bell curve needs to be approximated with enough manual `x, y` points — 20–30 points reads as smooth enough in practice), no dual y-axis, no log-scale axis. This covers most illustration needs (growth curves, comparative bars, distributions approximated with enough points) but not all of them. Default to `xychart-beta`/`pie`; only reach for a custom charting component if a specific `applied-math/` unit genuinely needs scatter points or a log axis and an approximation won't do — don't build general charting infrastructure speculatively ahead of that need.

## Visual design balance

The site's chrome (nav, track cards, status badges, level tabs, the progress button, exercise type badges) uses **`lucide-astro`** icons throughout — one icon per track (`TrackIcon.astro`, mapped by track name), status icons (`StatusBadge.astro`: check/loader/circle for done/in-progress/planned), level icons (file/lightbulb/code for L1/L2/L3), state icons on `ProgressToggle` (check/lock/circle), and type icons on exercises (question mark for quiz, code brackets for code). This chrome is **already built** — a new page or component should reuse these existing components rather than inventing new icon choices ad hoc; if a new piece of UI chrome needs an icon that doesn't exist yet in this set, pick one `lucide-astro` icon that matches the existing style (outline, 24x24 source, used at `h-4 w-4`/`h-5 w-5`) and use it consistently everywhere that concept appears, not just once.

**For content itself** (not chrome), the rule is restraint, not decoration quota: a unit should have at least one visual element beyond prose _where one genuinely clarifies something_ — L2's required diagram already guarantees this for every unit, and a table or chart is worth adding on top of that when the content is naturally comparative (a table: REST vs. GraphQL, three caching strategies) or quantitative (a chart: a growth curve, a latency budget, a distribution). Don't add a table or chart just to hit a visual quota — a unit that's cleanly served by prose and one diagram doesn't need a table bolted on. The test is "does this make the idea easier to hold in your head," not "does this page look busy enough."

**Component wiring gotcha:** any client `<script>` that re-runs on repeated events (ours run on `exercise:graded` / `exercises:reset` / `astro:page-load`, not just once) **must guard against re-attaching event listeners** — check-and-set a `data-wired="true"` flag before calling `addEventListener`, the way `ProgressToggle.astro` and `ExercisePanel.astro` both do. Without this, listeners silently stack up and a single click ends up firing the handler multiple times (we hit this for real: one click toggled `done` on then back off). Any new interactive component must follow the same wire-once/render-many split.

## Interactive demos

A third, optional content type alongside levels and exercises: `interactives.json` per unit (`src/content/<track>/<unit-slug>/interactives.json`), rendered by `InteractiveDemo.astro`. **Purely exploratory — ungraded, no pass/fail, no effect on `ProgressToggle` gating.** The point is building intuition for _how a result varies_ as inputs change, not testing recall. Use this where a unit's theory has a real underlying relationship worth playing with (a trade-off, a formula, a threshold effect) — not every unit needs one, same restraint as tables/charts above.

Format:

```json
{
  "items": [{
    "id": "...",
    "level": 1 | 2 | 3,
    "title": "...",
    "description": "...",
    "params": [{ "name": "...", "label": "...", "min": 0, "max": 0, "step": 0, "default": 0, "unit": "ms" }],
    "compute": "return { outputKey: params.someParam * 2 };",
    "outputs": [{ "key": "outputKey", "label": "...", "unit": "ms", "color": "#34d399" }],
    "chartParam": "someParam"
  }]
}
```

- `compute` is a JS function-body string, called as `new Function("params", compute)`, receiving the current slider values as a `params` object and returning an object keyed by each `outputs[].key`. This runs on the **main thread synchronously** (not the sandboxed Worker exercises use) since it fires on every slider-drag tick and is author-written, not learner input — see CLAUDE.md's earlier note on the exercise sandbox for why that one _does_ need a Worker.
- The component renders one range `<input>` per param (live-updating value label), the current computed output(s), and an SVG line chart showing every output across the _full range_ of `chartParam` (other params held at their current values) with a marker at the current point — this is what answers "what effect would that variation have," not just the single current number.
- `validate:content` checks structure (params/outputs non-empty, `chartParam` names a real param, defaults within `[min, max]`) but can't verify `compute` actually runs correctly — **test it yourself in the browser** (drag every slider to its min and max, not just the default) before marking a unit done.

## Session workflow

1. User picks (or confirms) a track + unit.
2. Confirm scope for that unit in one or two sentences before writing (especially if it's ambiguous or large) — no need for a full approval cycle each time, just a sanity check.
3. Write the level(s) in scope for the session, under `src/content/<track>/<unit-slug>/`.
4. Write `exercises.json` for that unit unless there's a real reason not to (see "Exercises" above) — quiz items for L1/L2 concepts, code items for L3 code. Add an `interactives.json` demo too if the topic has a real variable relationship worth exploring (see "Interactive demos" above) — not mandatory, but don't skip it just because it's more work than a quiz.
5. Update `ROADMAP.md` status markers (`planned` → `in-progress` → `done`) and run `bun run generate:roadmap`.
6. **`bun run check`** (see "Guardrails" above) — not just `build`. Fix anything it flags before moving on.
7. Spin up `astro preview --background` and actually look at the rendered unit at least once per session — click through the exercises yourself (answer right, answer wrong, run code with a broken and a correct implementation) to confirm grading and the solution/explanation reveal actually work, not just that `check` passed. Don't just trust that markdown parsed.
8. Update `PROGRESS.md`.
9. Suggest — don't decide — what a sensible next unit could be, across any track.
