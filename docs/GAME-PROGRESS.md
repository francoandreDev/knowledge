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

### Phase 3 — Full weapon roster + leveling/card system ✅ done (Lv1-6, evolutions included), validated in-browser

From GAME-DESIGN.md "Weapons" and "Level-up card pool":

- Real XP/leveling: `xpForNextLevel(level) = 20 + (level-1)*12`, gems grant
  `GEM_XP_VALUE` XP, `addXp()` loops so multiple level-ups from one pickup
  all queue correctly (`pendingLevelUps`).
- Pause/level-up state machine: a third `status` value, `"levelup"`,
  alongside `"running"`/`"gameover"` — reuses the loop's existing
  `if (status !== "running") return;` guard, so no separate pause logic was
  needed elsewhere in `update()`.
- Card pool (`buildCardPool()`/`drawCards()`): shuffles and takes up to 4
  cards from three sources — owned-weapon upgrades (while
  `level < WEAPON_MAX_LEVEL`), new-weapon offers (while
  `ownedWeapons.length < MAX_EQUIPPED_WEAPONS`), and temporary run-only stat
  cards (while under `maxStacks`). Picking a card resumes the run if it was
  the last pending level-up, otherwise immediately re-presents another card
  draw for the next pending level.
- All 5 weapons implemented with real Lv1-5 progression via a per-weapon
  `updateWeapon()` dispatch (mirrors Phase 2's per-enemy-kind behavior
  dispatch): Blade Arc (melee sweep, arc widens + damage/attack speed scale
  with level), Bolt (pierce unlocks at Lv4, 2nd/3rd projectile at Lv3/5),
  Orbit Shield (continuous, 2nd orbiter at Lv3, per-enemy hit cooldown),
  Nova Pulse (periodic AoE burst, radius/damage/frequency scale), Homing
  Dart (turn-rate-limited steering toward a captured target, 2nd dart at
  Lv3). Weapon visual feedback (orbiter dots, arc-sweep flash, pulse-ring
  flash) is drawn as raw `context.arc()`/`stroke()` calls with time-based
  fading alpha, not Kontra sprites — kept cheap on purpose.
- Max 4 of 5 weapons equipped — enforced in `buildCardPool()` by only
  offering unowned-weapon cards while under the cap.
- **Lv6 evolutions** (`WEAPON_MAX_LEVEL = 6`): each weapon gains a distinct
  evolved behavior at its final level, dispatched via an `isEvolved = w.level
  > = WEAPON_MAX_LEVEL`flag inside each`updateWeapon()` case rather than a
separate code path — Blade Arc → **Whirlwind** (continuous 360° tick,
facing-independent, faster interval, no arc-angle check), Bolt → **Piercing
Lance** (`pierce = Infinity`, projectile drawn 1.8x size via a new
`sizeMult`param on`spawnPlayerProjectile()`), Orbit Shield → **Barrier
Storm** (orbiters drop trail points every 80ms into a capped-lifetime
`orbitTrails`array that also damages enemies at half the orbiter's
contact damage, rendered as fading yellow dots), Nova Pulse → **Shockwave**
(2x damage, plus a fixed-distance knockback push on every enemy hit),
Homing Dart → **Swarm** (fires 5 darts in a spread instead of the normal
1-2 count formula).`buildCardPool()`'s upgrade-card title/description
switches to "Evolve `<name>`→`<evolved name>`" + a evolution-specific
blurb exactly when `w.level + 1 === WEAPON_MAX_LEVEL`.

**Validated 2026-08-22** via `claude --chrome` against a local
`astro preview`, using the same temp-shrink-then-revert methodology as
Phase 2 (`GEM_XP_VALUE` temporarily set to `50` to force rapid level-ups,
reverted to `4` before commit, confirmed via `git diff` afterward). Watched
a run play out live to a natural 90s timer expiry: reached **Lv 30, 135
kills**, HUD level/XP/weapons text tracked correctly throughout, multiple
weapons (Bolt, Orbit Shield, Nova Pulse) fired and leveled up correctly in
combination, the level-up overlay paused the run and presented a real card
pool each time (upgrade / new-weapon / stat cards all observed), and the
game-over screen fired at `Time: 0.0s` with the correct summary text
("survived 90.0s, 135 kills, reached Lv 30").

**Real bug found and fixed during this pass:** choosing a "New: `<weapon>`"
card once resulted in that weapon being pushed into `ownedWeapons` **twice**
(observed as `novaPulse L5, novaPulse L1` sitting side-by-side in the HUD).
Root cause: `applyCard`'s `weaponUpgrade` branch does `ownedWeapons.find()`,
which always resolves to the _first_ matching entry — so once a duplicate
existed, all further "Upgrade Nova Pulse" cards silently leveled the first
entry while the second sat frozen at Lv1, and `buildCardPool()` (which loops
over every `ownedWeapons` entry independently) kept generating a second,
stale "Upgrade Nova Pulse — Lv 2" card even after the real one had already
reached Lv 5 — i.e. an upgrade card advertising a level _lower than the
weapon's current level_, exactly the symptom that surfaced it. Fixed at the
source: `applyCard`'s `newWeapon` branch now checks
`ownedWeapons.some((w) => w.id === card.weaponId)` and refuses to push (with
a `log.warn`) if that weapon is already owned — this is the only code path
that ever pushes into `ownedWeapons`, so a duplicate can no longer be
created. Also hardened `onLevelUp` in `index.astro` with a `chosen` flag so
a second click on any level-up card (e.g. a double-fired click event) is a
no-op regardless — belt-and-suspenders on the same class of bug. The most
likely real trigger was two click events (one queued from an earlier
browser-automation focus stall, one synthetic) landing on the same button
in quick succession; both fixes make that scenario safe even if it recurs.

**Lv6 evolutions validated 2026-08-22** in a second in-browser pass, same
temp-shrink-then-revert methodology (`GEM_XP_VALUE` temporarily `60` and
`GEM_PICKUP_RADIUS` temporarily `900` to force fast, reliable gem collection
under scripted auto-play; both reverted before commit, confirmed via
`git diff`). Drove the run with a scripted auto-picker (always chooses a
"Bolt" card when offered) plus synthetic movement, and let it play to a
natural conclusion: **Bolt reached Lv6 (Piercing Lance)** and **Blade Arc
reached Lv6 (Whirlwind)** mid-run with no console errors and stable HP, then
the run survived the full 90s including the boss encounter, ending at
**Lv 36, 131 kills**, correct game-over summary text. Confirms the
`isEvolved` dispatch branches run without crashing, the evolution-labeled
level-up cards render correctly, and normal (non-evolved) weapons/stat cards
continue to interleave correctly in the same run (Orbit Shield/Nova Pulse
leveled normally, a `thickSkin` stat pick visibly raised max HP). Did not
individually confirm Orbit Shield/Nova Pulse/Homing Dart evolutions in this
pass (run ended before they reached Lv6) — the four cases share the same
`isEvolved` pattern and passed `typecheck`/`build`, but a future session
should watch for those three specifically if anything looks off in play.

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

**Phases 1-3 complete and validated**, including Lv6 weapon evolutions.
Phases 4-8 not started. Next session should confirm scope with the user —
Phase 4 (real gating + lobby + results screen) is the natural next step.

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

Phase 3:

- Level-up card draws always attempt to fill 4 slots
  (`shuffle(pool).slice(0, 4)`) rather than strictly randomizing between 3-4
  as GAME-DESIGN.md's "3-4 random cards" phrasing allows — a harmless
  simplification since the pool is large enough in practice that this
  rarely under-fills anyway.
- `luckyStar`'s "+10% extra coin drop" stat card accumulates into
  `extraCoinChance` but is a no-op — coins don't exist until Phase 5.
- Orbiter/arc/pulse weapon visuals are simple raw-canvas draws, not
  sprite-based — consistent with the project's "keep the math cheap"
  instruction, revisit only if Phase 8's visual polish pass wants richer
  effects.

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
