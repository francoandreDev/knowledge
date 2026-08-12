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
6. **Update `PROGRESS.md` at the end of every session** that produces or completes content: date, unit touched, what level(s) were written, and what's next.
7. **Update `ROADMAP.md`** whenever a unit is added, reordered, split, or reworded — the roadmap must always reflect reality, not the original plan.
8. **Don't pad.** If a unit's concept is simple, L2 can be short. Depth should track the actual complexity of the problem, not a page-count target.
9. **Every unit stands on real code**, not toy hand-waving — L3 examples should be the kind of code you'd actually defend in a review, with realistic naming and structure (language choice is free per-topic; pick whatever best illustrates the concept, and say why if it's not obvious).
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

## Session workflow

1. User picks (or confirms) a track + unit.
2. Confirm scope for that unit in one or two sentences before writing (especially if it's ambiguous or large) — no need for a full approval cycle each time, just a sanity check.
3. Write the level(s) in scope for the session, under `src/content/<track>/<unit-slug>/`.
4. Update `ROADMAP.md` status markers (`planned` → `in-progress` → `done`) and run `bun run generate:roadmap`.
5. **`bun run check`** (see "Guardrails" above) — not just `build`. Fix anything it flags before moving on.
6. Spin up `astro preview --background` and actually look at the rendered unit at least once per session (not just trust that `check` passing means it looks right) — don't just trust that markdown parsed.
7. Update `PROGRESS.md`.
8. Suggest — don't decide — what a sensible next unit could be, across any track.
