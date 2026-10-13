# Handoff — remaining track order

Last updated: 2026-09-03

11 of 18 tracks are fully `done` (207/246 units): `web`, `systems`,
`git-teamwork`, `business-communication`, `career-craft`, `applied-math`,
`software-design`, `architecture`, `design`, `sustainable-performance`,
`people-management`.

39 units remain, across 6 tracks. Work through them in this order (confirmed
with the user 2026-09-03):

1. **security** — 6 planned
2. **product-domain** — 6 planned
3. **learning-craft** — 6 planned
4. **testing-quality** — 6 planned
5. **logic** — 5 planned
6. **infra-delivery** — 5 planned
7. **corporate-politics** — 5 planned

Within each track, take units in `ROADMAP.md` row order unless a specific
unit is requested out of order. One unit per session unless explicitly told
to batch (see root `CLAUDE.md`, rule 2).

## Per-unit pipeline (established this session, works reliably)

1. `bun run new:unit <track> <slug>` to scaffold + flip `ROADMAP.md` to
   `in-progress`.
2. Dispatch an authoring agent (`Agent` tool, `general-purpose`) with a
   long, self-contained prompt: full CLAUDE.md context, the roadmap row,
   explicit differentiation notes vs. every sibling unit already written in
   that track (read their `L1-summary` first), all deliverable requirements
   (L1/L2/L3 + exercises.json ~40 items 13/13/14 + interactives.json +
   ROADMAP.md flip + `generate:roadmap` + PROGRESS.md entry), and explicit
   instructions NOT to run git commands or the slow `bun run check`/`astro
preview` steps itself (that's the coordinator's job, to keep agent turns
   focused on content).
3. Wait for the agent's completion notification, then verify **directly**
   yourself — never by dispatching a second agent to check on the first
   (this was explicitly flagged as too slow by the user earlier in the
   2026-09-03 session):
   - `/bin/ls -la` the unit folder — confirm no leftover empty `.md`
     scaffold stubs sitting next to the `.mdx` files, and no stray
     `verify_*.js`/scratch scripts anywhere in the repo.
   - A node one-liner over `exercises.json`: total count, per-level split
     (13/13/14), per-type split, 0 missing `explanation`, 0 code items
     missing `solution`, every pool's `reference`/`learnMore` identical
     across variants, every pool's `level`/`type` consistent across
     variants.
   - `grep` `ROADMAP.md` for the row — confirm `done`.
   - `grep -c` the unit slug in `PROGRESS.md` — confirm a real entry
     exists; if the agent skipped it (has happened repeatedly), write it
     yourself matching the established narrative format exactly.
   - `Read` the L1 file — spot-check content quality and differentiation.
4. Run the guardrail chain **yourself**, as separate commands (the combined
   `bun run check` reliably exceeds the Bash tool's default timeout):
   `generate:roadmap` → `lint` → `format` (then `format:check`) →
   `typecheck` (`astro check`, needs a 170s+ timeout, runs long enough to
   usually background itself — wait for the notification) → `validate:content`
   → `test` → `build` (needs 300s+ timeout, also usually backgrounds).
   **Do not skip `build`** — it's the one step that catches things
   `typecheck` doesn't (e.g. an MDX-JSX parse error from a genuinely missing
   closing tag, which happened once this session on `long-term-design-judgment`'s
   `<Scenario>` and passed typecheck cleanly but failed `astro build`).
5. Spot-verify the rendered page: `curl` a running `astro preview` instance
   (port 4321 was already up throughout this session — reuse it if still
   running, checking with `ps aux | grep astro` and `lsof -i :<port>`
   before starting a new one) and grep the HTML for the scenario
   protagonist's name, `Show answer` count, `mermaid` count, exercise panel
   count, and interactive-demo markers, to confirm real rendering, not just
   a successful build.
6. `git add` only the scoped files: `PROGRESS.md ROADMAP.md
src/data/roadmap.json src/content/<track>/<slug>/` — never `-A`. Confirm
   scope with `git status --short` before and after.
7. Commit with a heredoc message (1-2 sentences on what the unit covers,
   plus the standard `Co-Authored-By`/`Claude-Session` footer), `git push`,
   confirm a clean final `git status --short` (only the pre-existing
   unrelated game files — `docs/GAME-PROGRESS.md`,
   `src/lib/game/engine.ts`, `src/lib/game/icons.ts`,
   `src/pages/game/index.astro` — should remain dirty; do not touch them).

## Known failure modes to watch for

- **Account-level session limits** can kill an authoring agent mid-task
  with no work lost if it already wrote files to disk — check the actual
  files before concluding anything failed. Re-dispatch a fresh agent (not
  a resume) once the limit window resets if content is genuinely missing.
- Agents sometimes **forget the PROGRESS.md entry** despite explicit
  instructions — always grep for it, write it yourself if absent.
- Agents sometimes **leave the empty `.md` scaffold stubs** next to the new
  `.mdx` files instead of deleting them — always check.
- A **missing closing JSX tag** (e.g. `</Scenario>`) can pass `astro
check`/typecheck cleanly but fail `astro build` — always run the actual
  `build` step, don't rely on typecheck alone.
