# In-site game: implementation progress

Tracks implementation of the game specced in `docs/GAME-DESIGN.md`, phase by
phase. Unlike `PROGRESS.md` (curriculum content, append-only), this file is
**maintained/rewritten in place** — keep the phase list and "Current state"
section accurate rather than appending a growing log. Update it at the end
of every session that touches game code, before stopping.

## How to resume a session on this feature

1. Read `docs/GAME-DESIGN.md` first (the frozen design) — this file is
   "how far we've gotten toward it," not a replacement for it.
2. Read "Current state" below, then the next unchecked phase.
3. `bun run astro preview --port <port> --background`, open `/game/`,
   actually play a run before writing new code — don't assume the last
   session's state from reading code alone.
4. Debug logging is on by default right now (`localStorage["game:debug"]`
   unset → treated as `true`, see `src/lib/game/logger.ts`). Leave it on
   through Phase 3-ish while the mechanics are still being validated; flip
   the default to `false` once a phase's mechanics are confirmed solid and
   the console volume starts being more noise than signal (Phase 4+ is the
   likely point — see "Known issues / follow-ups").

## Files

- `src/lib/game/logger.ts` — namespaced `console.log` wrapper, gated by
  `localStorage["game:debug"]`.
- `src/lib/game/engine.ts` — the actual game: Kontra bootstrap, entities,
  the `update`/`render` loop. `startGame(canvas, callbacks)` is the only
  export the page needs; `callbacks.onHudUpdate`/`onGameOver` are how the
  DOM-side HUD stays in sync without the engine touching the DOM directly.
- `src/pages/game/index.astro` — the route. DOM HUD + canvas + start
  button; wires `startGame()` to button clicks the same wire-once way
  `ProgressToggle`/`ExercisePanel` do (`dataset.wired` guard).

## Phases

### Phase 0 — Scaffolding ✅ done

- Added deps: `kontra` (game loop/sprites/vectors, ~7kb, matches
  GAME-DESIGN.md's "Technical foundations"), `idb` (for later IndexedDB
  persistence — not wired up yet, that's Phase 5).
- Route `src/pages/game/index.astro` exists and is reachable at `/game/`.
  Not yet linked from site nav (`Layout.astro`'s header) — that's part of
  Phase 4 (HUD spec calls for a gamepad icon + token badge there).

### Phase 1 — Core loop prototype ✅ done, validated in-browser

Deliberately narrow scope to validate the loop + logging + perf posture
before adding real content:

- Player: move with WASD/arrows, clamped to canvas bounds.
- One weapon: auto-fires at the nearest enemy on a fixed interval (stand-in
  for "Bolt" — not the real 5-weapon roster yet).
- One enemy type: Zombie, walks straight at the player, fixed spawn
  interval (**no exponential ramp yet — intentional**, see "Deliberate
  simplifications" below), hard-capped alive count.
- XP gems on kill: no auto-collect, magnetic pull within a radius, collect
  on contact. (Visual/mechanical only — doesn't feed a level system yet,
  see Phase 3.)
- Contact damage to player with a hit-cooldown (i-frames), death ends the
  run.
- Fixed 90s countdown (placeholder — real duration formula from
  GAME-DESIGN.md's "Run duration" section is Phase 4).
- HUD (HP/timer/kills/gems), throttled DOM writes (every ~100ms, not every
  frame) so the DOM isn't hammered at 60fps.
- Verbose per-event logging: `spawn:zombie`, `fire:projectile`,
  `hit:enemy`, `kill:zombie`, `pickup:gem`, `player:damaged`, `game:over`.

**Validated 2026-08-22** via `claude --chrome` against a local
`astro preview`: full 90s run played out, HUD updated live and matched
console log counts exactly (kills/gems), game-over screen showed the
correct summary, zero console errors across the run. See "Known issues"
for two things found and fixed during this pass, and one browser-automation
false alarm that is _not_ a real bug.

### Phase 2 — Full enemy roster + difficulty curve ✅ done, validated in-browser

From GAME-DESIGN.md "Enemies":

- Added Bat (fast erratic flight), Skeleton (higher HP, straight approach),
  Ghost (keeps distance, fires a slow homing-less bolt), Ogre (telegraphed
  slam attack, rare via low spawn weight), and the Reaper boss (ring burst +
  dash attack patterns, contact damage).
- Fixed absolute-time spawn-pool unlocks: Zombie 0:00, Bat 1:00, Skeleton
  2:00, Ghost 3:00, Ogre 4:00 (`ENEMY_DEFS[].unlockAtS` in `engine.ts`) — a
  short 90s test run only ever sees Zombie + the start of Bat, matching the
  design doc's "quick reward run" intent.
- Boss trigger at `max(20, TEST_RUN_DURATION_S - 20)`, so with the current
  90s placeholder duration it spawns at 70s.
- Spawn density ramp (`currentSpawnIntervalMs()`): interval halves every 45s
  of elapsed run time, **floored at 150ms** and enemy count **capped at 60
  alive** — a deliberate simplification of the design doc's literally-
  uncapped curve, per the explicit "don't overload the machine" instruction.
  Revisit the floor/cap only if real playtesting shows it's too tame, not
  preemptively.
- Enemy tiers (Normal/Veteran/Elite) are **stubbed at "always Normal"** —
  they depend on `powerIndex` from the Phase 5 shop, which doesn't exist
  yet. `EnemyDef` has no tier field at all right now; tiers will be added as
  part of Phase 5.

**Validated 2026-08-22** via `claude --chrome` against a local
`astro preview`, using a temporary in-file edit (unlock thresholds shrunk to
5/10/15/20s, `TEST_RUN_DURATION_S` shrunk to 50s) to observe the full
roster + boss inside a short, watchable window without changing the shipped
balance numbers — reverted immediately after, confirmed via `git diff`
before committing. Observed: `spawn:enemy`/`hit:enemy`/`kill:enemy` firing
for the roster, `boss:spawned` firing at the expected relative time, contact
damage from multiple enemy kinds, gem pickups, and a correct death→game-over
transition (25 kills, run ended by HP loss, results text rendered). Zero
errors from our own code (`[game:...]` namespaces) across the run; the only
console noise was an unrelated Chrome extension exception, not app code.

**Browser-automation gotcha found and documented, not a game bug:** midway
through this test, `document.visibilityState` flipped to `"hidden"` (the tab
lost real OS focus even though the automation's `screenshot`/`click` calls
still showed it as the active tab), which suspends Kontra's
`requestAnimationFrame` loop — HUD stopped updating and no new logs
appeared for several seconds. Confirmed via `document.hasFocus()` returning
`false` while `visibilityState` still read `"visible"`. Resolved by having
the user click "Start run" directly instead of a synthetic click, which
gives the tab real focus. **Future sessions testing this game: prefer a
real user-driven click over a synthetic one for anything timing-sensitive,
and check `document.hasFocus()` (not just `visibilityState`) if the loop
seems stalled.** Separately: the engine has no `dt` clamp on the frame after
a real (non-automation) tab-backgrounding gap, so a real player who
backgrounds the tab mid-run and returns will see one large catch-up frame
(elapsed time jumps, but spawning/collision logic held up fine under this
during validation — at most one enemy spawns per frame regardless of how
large the time jump is). Worth a small `dt` clamp in a later polish phase if
it ever proves disorienting in practice; not blocking for Phase 2.

### Phase 3 — Full weapon roster + leveling/card system — not started

From GAME-DESIGN.md "Weapons" and "Level-up card pool":

- Blade Arc, Bolt (already prototyped, needs real Lv1-5 progression),
  Orbit Shield, Nova Pulse, Homing Dart — Lv1-5 progression + Lv6 evolution
  each.
- XP gems actually feed a level counter; level-up pauses the loop and
  offers 3-4 cards (owned-weapon upgrade/evolution, new-weapon if <4
  equipped, temporary run-only stat cards).
- Max 4 of 5 weapons equipped.
- This is the biggest chunk of remaining gameplay code — likely worth 2+
  sessions on its own (pause/resume state machine, card UI, weapon behavior
  differentiation).

### Phase 4 — Real gating + lobby + results screen — not started

From GAME-DESIGN.md "Gating," "Run duration," "HUD":

- Tokens: read `progress:<track>/<unit-slug>` keys from `localStorage` on
  `ProgressToggle`'s mark-done, +1 token per level marked done (including
  re-marks after spaced-repetition reset).
- Real run-duration formula: `60-90s base + 30s × (units with all 3 levels
done)`, computed live at run start from `localStorage`.
- Lobby screen (token count, coin balance, shop entry, 0-token message
  linking to `/roadmap`).
- Results screen per spec (time survived, kills, level reached, coins
  earned, best-time record via IndexedDB).
- Site nav icon with token-count badge (`Layout.astro`).
- **This is the point to reconsider the debug-logging default** — once
  tokens gate play for real, constant console spam stops being useful to a
  real user and `game:debug` should probably default to `false`, kept
  flippable for future debugging sessions.

### Phase 5 — Coins, shop, IndexedDB persistence — not started

From GAME-DESIGN.md "Coins and the shop," "Technical foundations":

- Coin drops/pickup (same shared magnetic system as XP gems).
- Permanent shop: 7 upgrades, `cost = base × (level+1)^1.5`.
- `idb` wrapper for tokens/coins/upgrade levels/best time — the _only_
  game-owned persistence; the game only ever **reads** `progress:`/
  `exercise:` keys, never writes them (guardrail from GAME-DESIGN.md, worth
  re-checking against actual code at the end of this phase).
- `powerIndex` (sum of shop levels) driving enemy-tier weighting from
  Phase 2.

### Phase 6 — Audio + weapon evolutions polish — not started

- Web Audio API synthesized cues (pickup, hit, level-up, death, evolution).
- Confirm all 5 weapons' Lv6 evolutions are implemented and feel distinct.

### Phase 7 — Mobile controls — not started

- Dynamic virtual joystick (spawns at touch point, not a fixed zone).

### Phase 8 — Visual/UX + performance polish pass — not started

- Replace prototype flat-color squares with the real geometric-shape +
  glow + outline sprite style from GAME-DESIGN.md "Visual style."
- Revisit `game:debug` default (see Phase 4 note).
- A real performance pass at max realistic enemy/projectile/gem counts
  (long accumulated-study runs are uncapped-duration by design) — check
  frame time doesn't degrade, add a spatial partition for collision only if
  profiling actually shows it's needed.
- Settings toggle (mute audio / reduce motion) — deferred item from
  GAME-DESIGN.md, decide here.

## Current state

**Phase 1 and Phase 2 complete and validated.** Phases 3-8 not started. Next
session should confirm scope with the user before starting Phase 3 (full
weapon roster + leveling/card system) — it's explicitly called out as the
biggest remaining chunk, likely 2+ sessions on its own.

## Deliberate simplifications (intentional — not bugs)

Phase 1:

- Fixed 90s run duration instead of the real token-derived formula (still
  true — real formula is Phase 4).
- Single weapon (stand-in "Bolt"), no leveling — that's Phase 3.

Phase 2:

- Spawn density ramp is exponential-ish but **floored at 150ms** between
  spawns and **capped at 60 alive enemies**, not literally uncapped as the
  design doc specifies — a deliberate perf tradeoff, see the Phase 2 section
  above.
- Enemy tiers (Normal/Veteran/Elite) stubbed at "always Normal" — no
  `powerIndex` exists until Phase 5.
- No coin drops yet (Phase 5) — enemies still only drop XP gems on kill.
- No `dt` clamp on a real tab-backgrounding gap — see the Phase 2 "gotcha"
  note above.

## Known issues / follow-ups

- **Fixed during Phase 1 validation:** the HUD stat row and the canvas
  together were taller than a typical viewport, and the HUD row scrolled
  out from under the sticky site header (not visible while playing). Fixed
  by (a) making the HUD row itself `sticky` (`top-14`, with a solid
  backdrop) so it stays visible regardless of scroll, and (b) shrinking the
  canvas from 480×640 to 420×500 (CSS-scaled further on short viewports via
  `h-[min(58vh,500px)]` + an explicit `aspect-ratio`) so the whole page
  fits without scrolling on most screens. User-confirmed by eye afterward.
- **Not a bug, a testing-tool artifact:** driving movement via the browser
  automation's `key` action (near-instantaneous synthetic keydown+keyup)
  did not visibly move the player, because Kontra's `keyPressed()` polls
  state once per `requestAnimationFrame`, and the synthetic press/release
  pair can complete faster than the next frame samples it. Confirmed real
  by manually dispatching a held `keydown` → wait 1s → `keyup` via
  `javascript_tool`, which moved the player correctly into the boundary
  wall. **When testing this game via `claude --chrome` in future sessions,
  don't trust a single `key` action to prove/disprove movement — hold via
  dispatched events (or a real physical keyboard) instead.**
- Balance is not tuned at all yet (fire rate, zombie HP/speed, damage
  numbers are first-guess placeholders) — expect a real pass once more of
  the enemy/weapon roster exists to balance against (GAME-DESIGN.md already
  defers this to implementation time).
- Gems currently never despawn if never collected — fine at Phase 1 scale,
  worth watching once Phase 2's higher spawn/kill rates are in.
