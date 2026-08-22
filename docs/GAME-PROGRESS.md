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

### Phase 2 — Full enemy roster + difficulty curve — not started

From GAME-DESIGN.md "Enemies":

- Add Bat, Skeleton, Ghost, Ogre, and the Reaper boss.
- Fixed absolute-time spawn-pool unlocks (0:00/1:00/2:00/3:00/4:00).
- Boss trigger at `total_duration - 20s`, floored to `0:20`.
- Uncapped exponential-ish spawn-density curve for the full run — this is
  where the "don't overload the machine" instruction matters most: profile
  before shipping, keep collision checks cheap (still fine as O(enemies ×
  projectiles) linear scans at expected counts; revisit with a spatial grid
  only if a real perf problem shows up, not preemptively).
- Enemy tiers (Normal/Veteran/Elite) — gate tier-weighting on `powerIndex`
  from the shop, which doesn't exist until Phase 5, so tiers can be stubbed
  at "always Normal" until then, or built together with Phase 5.

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

**Phase 1 complete and validated.** Phases 2-8 not started. Next session
should confirm scope with the user before starting Phase 2 (per this
project's usual "confirm scope in 1-2 sentences before writing" workflow),
since Phase 2 and Phase 3 are both large and either could reasonably go
first.

## Deliberate simplifications (Phase 1, intentional — not bugs)

- Zombie spawns on a **fixed interval**, not the real exponential curve —
  the point of Phase 1 was validating the loop and logging cheaply before
  paying for real wave-scaling math.
- Fixed 90s run duration instead of the real token-derived formula.
- Single weapon, single enemy type.
- `ZOMBIE_MAX_ALIVE = 25` hard cap — keeps Phase 1 perf predictable
  regardless of curve tuning later.

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
