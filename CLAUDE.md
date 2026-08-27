# Project instructions — systems-mastery

This file governs how content is generated and evolved in this project across sessions. Follow it exactly.

## What this project is

A self-study reference the user is building to grow from junior to a solid staff-level engineer (and, via `people-management/`, toward leading teams). It covers eighteen tracks: `web/`, `systems/`, `git-teamwork/`, `business-communication/`, `logic/`, `security/`, `infra-delivery/`, `career-craft/`, `product-domain/`, `corporate-politics/`, `learning-craft/`, `applied-math/`, `testing-quality/`, `software-design/`, `architecture/`, `design/`, `sustainable-performance/`, `people-management/`. See `docs/ARCHITECTURE.md` for the full rationale and `ROADMAP.md` for the topic list.

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
     4b. **Problem-first, test-before-teach — throughout, not just at the open.** Never open L1, or any major section of L2, with a definition or bullet framework — open with a concrete problem, scenario, or tension that makes the reader feel the gap in their own knowledge, and only then resolve it with the framework/definition/table. Use a visual element (a callout box, a compact table, a small diagram) to _show_ the tension where possible, rather than narrating it purely in prose — a wall of setup text defeats the purpose just as much as skipping the setup entirely. This isn't a one-shot device confined to the opening paragraph: L2 and L3 should keep using guiding questions at each major step, not just once at the top — each explanation needs a question it's answering, or it reads as assertion instead of resolution. In L3 specifically, include at least one question that invites the reader to extend the worked example beyond what's given (what changes if the audience were different, what changes if the news were worse) rather than only testing recall of the specific scenario shown — the worked example is a case, not the whole territory, and L3 should say so explicitly somewhere. L3 in most existing units already opens well (see `business-communication/audience-awareness/L3-deep-dive.mdx`'s "the scenario" opening via the reusable `<Scenario>` component, `src/components/Scenario.astro`) — match that voice in L1/L2 too, and use the same component for any problem/scenario callout rather than inventing new markup per unit.

4c. **Match example scope to the concept's actual scope — don't default to engineering framing because the project is engineering-adjacent.** Before picking a scenario, ask whether the concept being taught is genuinely domain-general (most of `business-communication/`, `logic/`, `learning-craft/`, `sustainable-performance/`, and general-mechanic units in `corporate-politics/`/`product-domain/`/`people-management/`) or inherently domain-specific (anything in `web/`, `systems/`, `git-teamwork/`, `security/`, `infra-delivery/`, `applied-math/`, `testing-quality/`, `software-design/`, `architecture/`, `design/`, and workplace-mechanic units like "how to run a 1:1" or "how to ask for feedback in a review" even in otherwise-general tracks). For a domain-general concept, use a simple, universal scenario a child could follow — not a workplace/engineering scenario forced onto it just because the site's overall audience is engineers. Mixing in unrelated domain jargon (vendor rate limits, roadmap commitments, Slack vs. email) when the actual lesson (e.g. audience awareness itself) has nothing to do with engineering is noise, not grounding, and makes the concept harder to isolate. For a domain-specific concept, the domain grounding IS the content and should stay. When in doubt, prefer the more universal framing — it's easier to see a professional example is "just this, but at work" after learning the general version than to extract the general principle from a scenario buried in engineering-specific detail.

5. **L3 may span multiple sessions.** If a topic is large, split `L3-deep-dive/` into a folder with `part-1-<slug>.md`, `part-2-<slug>.md`, etc., plus a short `00-index.md` listing the parts and their status (done / in progress / planned). Never leave a part half-written across a session boundary — finish the part you're on, then stop.
   5b. **Add exercises when the unit supports it** (see "Exercises" below) — not strictly mandatory like L1–L3, but the default expectation for any unit where a real quiz question or code exercise is possible, which is most of them. Skipping exercises should be the exception, made consciously, not the default because it's less work.
   5c. **Default to visual elements, micro-interactions, and a real interactive demo — push for them, don't wait for an excuse to add them.** This was piloted end-to-end on `business-communication/audience-awareness` (visual `Scenario` callouts, per-pool `reference`/`learnMore`, the whiteboard, reveal/feedback animations, and a slider-driven `interactives.json` demo tied to the unit's own problem) and confirmed by direct user review — treat that unit as the reference bar for every unit going forward, not a one-off showcase. Concretely, for every unit ask, and actually try, before deciding something doesn't apply: - Does a relationship in the content (a formula, a trade-off, a threshold, "what happens as X grows") support a slider-driven `interactives.json` demo? If yes, build one — see "Interactive demos" below. Don't settle for a static chart when a draggable one would teach the same idea better. - Does the problem/scenario callout have a fact worth visualizing (a quantity vs. a goal, a short list of categories/roles, a proportion)? Put it in the `Scenario` `facts` slot as a bar/icon-row/mini-table, not prose-with-bold-numbers. - Do failed exercises point somewhere concrete? Author `reference` and `learnMore` per pool (see "Exercises" below) rather than leaving a wrong answer to stand alone with just its built-in explanation. - Reach for the shared animation classes (`animate-fade-slide-in`, `animate-pop`, `animate-shake`, `animate-fill-bar` — see "Micro-interactions and animation" below) on any new interactive element a unit's content introduces, the same way `ExercisePanel`/`LevelTabs`/`ProgressToggle` already do, instead of shipping it static.
   - Does each level open with a `LevelIntro` right after the hook resolves, and does L2/L3 have 1–2 `Checkpoint` recall prompts at points where a concept lands before the next section builds on it? See "Checkpoints and level intros" below — these exist specifically so a level doesn't read as one continuous wall of prose.
     Skipping any of these should be a deliberate, stated call ("this unit's relationship isn't really draggable" / "there's no natural quantity to chart here") — not silence because it wasn't considered.
6. **Update `PROGRESS.md` at the end of every session** that produces or completes content: date, unit touched, what level(s) were written, and what's next.
7. **Update `ROADMAP.md`** whenever a unit is added, reordered, split, or reworded — the roadmap must always reflect reality, not the original plan.
8. **Don't pad.** If a unit's concept is simple, L2 can be short. Depth should track the actual complexity of the problem, not a page-count target.
9. **Every unit stands on real code**, not toy hand-waving — L3 examples should be the kind of code you'd actually defend in a review, with realistic naming and structure (language choice is free per-topic; pick whatever best illustrates the concept, and say why if it's not obvious). This applies to genuinely technical tracks (`web`, `systems`, `git-teamwork`, `security`, `infra-delivery`, `testing-quality`, `software-design`, `architecture`, `applied-math`, `logic`) where the logic is naturally computational — `architecture/` units that are naturally illustrated with real config/code (e.g. `hexagonal-clean-architecture`, `event-driven-architecture`) should be, but architecture is also the one technical track where a unit's actual substance is sometimes a diagram plus a real worked trade-off narrative rather than runnable code (e.g. `build-vs-buy`, `tech-radar`) — don't force code where the real content is the reasoning. **Non-technical/soft-skill tracks** (`business-communication`, `career-craft`, `product-domain`, `corporate-politics`, `learning-craft`, `people-management`, `sustainable-performance`, `design`) should ground L3 in fully worked real-world scenarios instead — and must never dress plain reasoning as a fenced code block with `function`/`if`/`return` syntax and invented, undefined helper calls just to look rigorous. That's noise, not teaching; express procedures as prose, numbered steps, or tables in these tracks, never as fake pseudocode wearing a programming language's syntax.
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

**Target ~40 exercise items per unit** (roughly even across the 3 levels — ~13/13/14), grouped into pools of 2–3 variants each via `poolId` (a level should end up with roughly 5–6 pools). This is a number currently being _piloted_, not yet a hard `validate:content` minimum — if it turns out to be too many or too few in practice, adjust it and update this line, don't treat 40 as sacred. The old target (2 exercises per level, ~6 per unit) was too thin to sustain the 7/30/90-day spaced-repetition re-exam cycle without just re-quizzing the same handful of questions.

**Display: only 2 pools per level are shown at a time**, chosen randomly by `ExercisePanel.astro` on every page load (`initExercises()` shuffles that panel's pools client-side and hides all but 2 — see the component for the exact mechanism), and reshuffled again on a spaced-repetition reset. This is deliberate: the reader is meant to hit a different pair on a return visit, not memorize a fixed set of ~6 questions. **"Mark as done" gates only on the currently-shown subset**, not the full ~40-item bank — `ProgressToggle.astro` reads which pool ids are currently shown directly off the DOM (`data-exercise-panel`'s `dataset.shownIds`/`dataset.ready`, written by `ExercisePanel`), rather than receiving a static list of every pool id as a prop the way it used to. When authoring exercises, don't reason about "the reader will see all 40" — reason about "any 2 pools per level could be the ones shown," so no pool should assume context established by a different one.

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

**For content itself** (not chrome), default to including visual elements — treat "no room for one here" as the exception you have to justify, not the default posture. The old floor of "at least one diagram total" was too thin per direct user feedback, and even "add one when it's naturally comparative/quantitative" undersold it once the `audience-awareness` pilot showed how much a genuinely interactive unit (charts, a whiteboard, a slider-driven demo, animated feedback) outperforms a static one on the same content — **every unit should carry 2–3+ visual elements** (a mix of mermaid diagrams, tables, and/or `xychart-beta`/`pie` charts) spread across L1–L3, not clustered in just L2, and should default to also having the interactive/animated layer described in rule 5c above (a `Scenario` `facts` visual, an `interactives.json` demo where a real relationship exists, exercise `reference`/`learnMore`). Actively look for the comparison, quantity, or relationship a unit's content already contains rather than waiting for one to be obviously unavoidable — most units have more of these than a first pass finds. The test is still "does this make the idea easier to hold in your head, or easier to play with," not "does this page look busy enough" — but when in doubt, build the visual/interactive version and cut it if it turns out not to earn its place, rather than defaulting to prose because it's less work.

**Component wiring gotcha:** any client `<script>` that re-runs on repeated events (ours run on `exercise:graded` / `exercises:reset` / `astro:page-load`, not just once) **must guard against re-attaching event listeners** — check-and-set a `data-wired="true"` flag before calling `addEventListener`, the way `ProgressToggle.astro` and `ExercisePanel.astro` both do. Without this, listeners silently stack up and a single click ends up firing the handler multiple times (we hit this for real: one click toggled `done` on then back off). Any new interactive component must follow the same wire-once/render-many split.

## Micro-interactions and animation

A small shared set of one-shot CSS keyframe animations lives in `src/styles/global.css`: `fade-slide-in` (a reveal — opacity 0→1 + translateY 0.5rem→0), `shake` (a wrong answer), `pop` (a correct answer, or a completed "Mark as done"), and `fill-bar` (a bar's `width` animating from 0 to a `--target-width` custom property set inline by the author, e.g. `style="--target-width: 68%"` + `class="animate-fill-bar"`). Used for: exercise pool reveals and their pass/fail feedback (`ExercisePanel.astro`), level-tab switching (`LevelTabs.astro`), and "Mark as done" (`ProgressToggle.astro`).

**Use a declarative `animation` (keyframes), triggered by a plain `classList.add`, not a JS `requestAnimationFrame` double-class-swap** (set a "from" state, then flip to the "to" state next frame to force the transition to actually register). We shipped the rAF version first and it got permanently stuck at the "from" state during verification — `document.visibilityState === "hidden"` (a backgrounded/non-focused tab) suspends `requestAnimationFrame` callbacks entirely, so the flip to the "to" state simply never ran. An `animation` applied directly has no such dependency; the browser will always eventually resolve it regardless of tab focus. `@starting-style` (the standards-based CSS-only alternative for animating an element as it un-hides) was also tried and hit the same stuck-at-initial-value symptom in this environment — stick with plain keyframe `animation` classes for anything that needs to reliably resolve to its end state, including under test automation.

**To re-trigger a one-shot animation on a repeated event** (e.g. clicking "Mark as done" again, or re-selecting the same tab), a browser won't replay a CSS animation if the class is already present — remove the class, force a reflow (`void el.offsetWidth`), then re-add it; see `ProgressToggle.astro` and `LevelTabs.astro` for the pattern.

**Verifying animations in this browser-automation setup:** screenshots and real-time `getComputedStyle` polling are unreliable when the automation tab isn't the foreground tab (see the rAF note above — the same backgrounding suspends animation playback, not just rAF). Don't trust a `computed opacity: 0` reading at face value if the tab might be backgrounded — check `document.visibilityState` first. To verify an animation is _correctly configured_ regardless of playback throttling, grab the element's animation via `el.getAnimations()[0]` and call `.finish()`, then assert the resulting `getComputedStyle` matches the intended end state (e.g. a fill-bar's forced-finished width should equal the exact target percentage of its parent's width) — this checks correctness without depending on real-time playback.

## Interactive demos

A third content type alongside levels and exercises: `interactives.json` per unit (`src/content/<track>/<unit-slug>/interactives.json`), rendered by `InteractiveDemo.astro`. **Purely exploratory — ungraded, no pass/fail, no effect on `ProgressToggle` gating.** The point is building intuition for _how a result varies_ as inputs change, not testing recall. **Default to building one** — per rule 5c, most units have some real underlying relationship worth playing with (a trade-off, a formula, a threshold effect, a quantity from the unit's own problem/example), even ones that don't look quantitative at first glance; look for it before concluding a unit doesn't need one. Ground the demo in the unit's own scenario/numbers where possible (back-derive the formula from facts already in the content, the way `business-communication/audience-awareness`'s rain-impact slider reproduces the unit's actual $340/$500 at its default) rather than an abstract example disconnected from what the reader just read.

**Keep the demo to as few outputs/lines as actually carry new information.** Two outputs that are simple arithmetic complements of each other (e.g. `gap = goal - raised`) plotted as two crossing lines add visual noise and an unexplained crossing point without adding insight — show the one line that matters and state the fixed reference (a goal, a threshold) in the description text instead. This was a real, user-caught clarity bug in the pilot: keep new demos to one clear line unless a second one is genuinely independent information.

**Format currency units as a prefix, not a suffix** — `formatValue()` in `InteractiveDemo.astro` already special-cases `$`/`€`/`£`/`¥` to render as `$340` rather than `340$`; don't hardcode a unit string that fights this (e.g. don't write `"unit": "USD"` expecting suffix placement for a dollar amount).

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

## Checkpoints and level intros

Two small components that exist to stop a level from reading as one continuous wall of prose — piloted on `web/http-request-response-basics` and confirmed by direct user review. Both are ungraded and have no effect on `ProgressToggle` gating (same status as Interactive demos above) — they're pacing/orientation devices, not assessment.

**`LevelIntro.astro`** — a compact "in this level" callout naming 3 short items the level covers, placed **once per level, after the opening problem/scenario hook resolves and before the first `##` structured section begins** — never at the very top of the file. Rule 4b's problem-first mandate still governs the open: the hook comes first, `LevelIntro` is the bridge from "here's why you should care" into "here's what's coming," not a table-of-contents substitute for the hook itself.

```mdx
import LevelIntro from "../../../components/LevelIntro.astro";

<LevelIntro
  items={[
    "How a URL becomes a request",
    "The 3 parts of a request/response",
    "What status code ranges mean",
  ]}
/>
```

- Exactly 3 items, each a short noun phrase (not a full sentence) naming a concept the level actually covers — not a rehash of the hook's scenario.
- One per level (L1, L2, and L3 each get their own, worded for what that specific level covers — not copy-pasted across levels).
- Not every level opens with a `<Scenario>` — some (typically L2) open straight into a `##` guiding question with no hook at all. `LevelIntro` still can't sit at the very top in that case: write one short bridging sentence connecting back to what the previous level established (see `web/http-request-response-basics/L2-concept.mdx` or `git-teamwork/merge-rebase/L2-concept.mdx` for the pattern), then `LevelIntro`, then the first `##`. Never place `LevelIntro` before any prose at all.

**`Checkpoint.astro`** — a mid-content active-recall question: a one-line prompt with a "Show answer" toggle, the answer written in the default slot (any markdown/JSX, matching `Checkpoint.astro`'s reveal styling). The point is forcing the reader to commit to an answer before the content resolves it, the same problem-first/test-before-teach instinct as rule 4b's guiding questions — this makes that instinct interactive instead of purely rhetorical.

```mdx
import Checkpoint from "../../../components/Checkpoint.astro";

<Checkpoint question="A load balancer sends your login POST to server A, and your very next request to server B. If there's no cookie or token involved, will server B know you just logged in?">

No — and that's statelessness working exactly as designed, not a bug. ...

</Checkpoint>
```

- Place one at each point in L2/L3 where a concept just landed and the next section would otherwise build on it unchecked — typically 1–2 per level, not one per section (over-placing turns a pacing device into an obstacle course). Concretely: right after a `##` section's explanation has fully resolved — its closing paragraph, table, code block, or (for prose-only soft-skill units with neither) a worked scenario/example running its course — not mid-explanation, and only where a later section depends on the reader actually having that concept solid.
  - **"Resolved" isn't the same as "no longer relevant."** A section can wrap up cleanly and still be load-bearing several sections later (e.g. import direction from an earlier section deciding whether a later one counts as "hexagonal"). Those are exactly the spots worth a `Checkpoint` — a section whose idea is fully self-contained and never revisited doesn't need one just because it ended.
  - A section that's independent of what came before doesn't need one before it.
- The question must be answerable from what's already been said above it — it's recall/application of the preceding paragraph, not a preview of content not yet introduced.
- Don't duplicate an existing guiding-question subheading (rule 4b) as a `Checkpoint` — a `##` guiding question that the following prose immediately answers doesn't need a second reveal-gated copy of the same question right next to it. Use `Checkpoint` where the guiding question would otherwise just be asserted-and-resolved in the same breath; skip it where the surrounding structure already makes the reader pause.
- **In non-technical/soft-skill tracks (rule 9), a `Checkpoint` answer is exactly the kind of "explain a judgment" content that rule 9's ban on fake pseudocode targets** — write it as connected reasoning prose (cause → why → implication), never as staccato "step 1 / step 2" phrasing that reads like disguised code, even though nothing here forces a code block.
- Both require converting the file to `.mdx` if it's currently plain `.md` (rule 4's per-level files are `.md` by default; only files that import a component need the extension change — same as `Scenario`).

## Whiteboard (freehand scratch space)

A slide-in drawer attached to a problem callout or an exercise, letting the reader freehand-draw their own reasoning (pen/eraser/clear) next to a read-only recap of that block's key facts — not graded, not a note-taking textarea, purely a persistent scratchpad. Built once as a shared client module, `mountWhiteboardTrigger()` in `src/lib/whiteboard.ts`, and reused from two call sites:

- `Scenario.astro` — every problem/scenario callout gets a trigger automatically. The reference panel is **not** a copy of the visible narrative — it renders a dedicated named slot, `<Fragment slot="facts">`, that a unit author writes as a short, structured, hierarchical recap distinct from the flowing prose/table shown in the callout itself. If a unit hasn't written a `facts` slot yet, it falls back to the default slot content so nothing breaks, but **always write the `facts` slot for new units** — a literal duplicate defeats the point (we shipped the duplicate version once and had to redo it). **Prefer a genuine visual element over plain bulleted text where the facts support one** — a small progress bar for a quantity vs. a goal, an emoji or icon per line for quick visual scanning of a short list of roles/categories — the goal is "understood at a glance," not just "shorter than the callout." Plain text bullets are fine when there's no natural visual (a single cause-and-effect fact, for instance), but don't default to prose-with-bold-numbers when a bar or icon row would actually be faster to read. See `business-communication/audience-awareness/L1-summary.mdx` for the pattern (a raw HTML `not-prose` div with a Tailwind-styled progress bar, inside the `facts` Fragment — MDX allows this directly, no new component needed).
- `ExercisePanel.astro` — each **shown** exercise (see the 2-of-N mechanic above) gets a trigger, built client-side in `renderQuiz`/`renderCode` since the variant is only known there. The reference panel is the question itself (`variant.prompt`) — deliberately **not** the choices or starter code, since those are already visible on the page right next to the drawer — plus, when authored, the pool's own `reference` field (optional `string` on both `quizExercise` and `codeExercise` in `src/content.config.ts`): a compact visual (icon list / 2-column compare box / mini table, same visual language as `Scenario`'s `facts` panels) followed by a one-line `<strong>Why:</strong> ...` theory statement. **A failed exercise should always have a direct, visible link back to whatever teaches the concept it's testing** — question → visual → theory, in that order, inside the same whiteboard reference. Where no visual naturally exists for a pool's concept, author one rather than leaving `reference` unset; see `business-communication/audience-awareness/exercises.json` for all ~19 worked examples across the three levels. `reference` is per-_pool_, not per-variant — `validate-content.mjs` enforces every variant sharing a `poolId` carries the identical string (only one variant renders per view, so they must agree), and `renderPool()` resolves it from whichever sibling variant set it so the random pick doesn't matter.

**Two board styles**, toggled per-drawer and persisted globally (`localStorage["whiteboard:board-style"]`, shared across every whiteboard on the site): a white board with marker colors (black/red/blue/green), and a green chalkboard with chalk colors (white/yellow/pink/light-blue), paired by palette position (white palette `[i]` ↔ green palette `[i]`) so each color has a contrast-appropriate counterpart on the other board. Ink is drawn on a **transparent** canvas with the board color applied as a separate CSS background behind it — this is what makes the eraser a real `destination-out` erase rather than a same-color-as-background hack, and it's also why switching style can't just leave strokes in their original color: a dark marker color would go near-invisible on the dark chalkboard. Instead, `recolorCanvas()` in `src/lib/whiteboard.ts` remaps every already-drawn pixel (by nearest-match against the _previous_ palette) to its positional counterpart in the _new_ palette on every style switch — verified round-trip lossless (white → green → white reproduces the exact original RGB). Drawing persists via `canvas.toDataURL()` in `localStorage`, keyed by `whiteboard:<pathname>:<block-id>` — `slugify(label)` for a Scenario, the pool's `poolId` for an exercise (stable across variant reshuffles within that pool). No undo — kept to what's actually needed; extend only if a real gap shows up in use, not preemptively.

**Text tool**, alongside Pen/Eraser: clicking the canvas in Text mode spawns a small absolutely-positioned `<input>` at that point (needs `canvasWrap` to be `position: relative`, which it is); Enter or blur commits it via `ctx.fillText()` in the current color and removes the input, Escape cancels. Committed text becomes ordinary raster pixels — no separate text-object model — so it persists, erases, and recolors on board-style switch exactly like a pen stroke, with no special-casing needed anywhere else.

The reference panel's own background/styling is intentionally **independent of board style** — only the canvas changes when toggling White/Green; a unit's facts recap shouldn't visually shift based on a scratch-space preference (we shipped a version that coupled the two by accident and had to unlink it).

## Session workflow

1. User picks (or confirms) a track + unit.
2. Confirm scope for that unit in one or two sentences before writing (especially if it's ambiguous or large) — no need for a full approval cycle each time, just a sanity check.
3. Write the level(s) in scope for the session, under `src/content/<track>/<unit-slug>/` — including a `LevelIntro` after each level's opening hook and 1–2 `Checkpoint` recall prompts in L2/L3 (see "Checkpoints and level intros" above).
4. Write `exercises.json` for that unit unless there's a real reason not to (see "Exercises" above) — quiz items for L1/L2 concepts, code items for L3 code. Add an `interactives.json` demo too if the topic has a real variable relationship worth exploring (see "Interactive demos" above) — not mandatory, but don't skip it just because it's more work than a quiz.
5. Update `ROADMAP.md` status markers (`planned` → `in-progress` → `done`) and run `bun run generate:roadmap`.
6. **`bun run check`** (see "Guardrails" above) — not just `build`. Fix anything it flags before moving on.
7. Spin up `astro preview --background` and actually look at the rendered unit at least once per session — click through the exercises yourself (answer right, answer wrong, run code with a broken and a correct implementation) to confirm grading and the solution/explanation reveal actually work, not just that `check` passed. Click every `Checkpoint`'s "Show answer" toggle too. Don't just trust that markdown parsed.
8. Update `PROGRESS.md`.
9. Suggest — don't decide — what a sensible next unit could be, across any track.
