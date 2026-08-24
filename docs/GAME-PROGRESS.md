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
4. Debug logging defaults to **off** as of Phase 4
   (`localStorage["game:debug"]` unset → treated as `false`, see
   `src/lib/game/logger.ts`) — flip it on with
   `localStorage.setItem("game:debug", "true")` when actively debugging.

## Files

- `src/lib/game/logger.ts` — namespaced `console.log` wrapper, gated by
  `localStorage["game:debug"]`.
- `src/lib/game/engine.ts` — the actual game: Kontra bootstrap, entities,
  the `update`/`render` loop. `startGame(canvas, callbacks, options)` is the
  only export the page needs; `callbacks.onHudUpdate`/`onGameOver` are how
  the DOM-side HUD stays in sync without the engine touching the DOM
  directly, and `options.durationS` sets the run's length (Phase 4).
- `src/lib/game/tokens.ts` — token/run-duration/best-time bookkeeping
  (Phase 4), backed by `pStorage` (see that file's header for why, not raw
  `localStorage`).
- `src/lib/game/shop.ts` — coin balance + 7 permanent shop upgrades (Phase
  5), also backed by `pStorage` — see GAME-DESIGN.md's "Implementation note
  (Phase 5)" for why the `idb` migration was skipped rather than deferred.
  Exposes `getUpgradeEffects()`/`computePowerIndex()`, consumed by
  `engine.ts`'s `GameOptions`.
- `src/lib/game/audio.ts` — Phase 6 synthesized SFX (Web Audio API
  oscillators/envelopes, no audio files). Exposes `unlockAudio()` (call from
  a user-gesture handler — browsers block autoplay otherwise),
  `isMuted()`/`setMuted()`/`toggleMuted()` (persisted via `pStorage`,
  `game:audio-muted`), and `playPickup()`/`playHit()`/`playLevelUp()`/
  `playEvolution()`/`playDeath()`, called directly from `engine.ts` at the
  relevant event sites (not routed through `GameCallbacks`).
- `src/pages/game/index.astro` — the route: a lobby screen (now with a
  Shop panel and a Sound on/off toggle), the play area (HUD + canvas + start
  button), and a results screen, shown/hidden as three sibling containers.
  Wires `startGame()` to button clicks the same wire-once way
  `ProgressToggle`/`ExercisePanel` do (`dataset.wired` guard). The Start
  button click also calls `unlockAudio()` — it's the first real user
  gesture in a run, needed to resume the `AudioContext`.

## Phases

### Phase 0 — Scaffolding ✅ done

- Added deps: `kontra` (game loop/sprites/vectors, ~7kb, matches
  GAME-DESIGN.md's "Technical foundations"), `idb` (installed for a possible
  later IndexedDB migration — Phase 5 ended up deliberately keeping
  `pStorage` instead, see that phase's notes, so `idb` is currently unused).
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

### Phase 4 — Real gating + lobby + results screen ✅ done, validated in-browser

From GAME-DESIGN.md "Gating," "Run duration," "HUD":

- **New `src/lib/game/tokens.ts`** — all token/duration/best-time logic,
  using `pStorage` (the same profile-namespaced `localStorage` wrapper
  `progress:`/`exercise:` keys already use) rather than raw `localStorage`
  or IndexedDB, since tokens/best-time are equally per-learner data. Real
  IndexedDB migration (per GAME-DESIGN.md's "Technical foundations") is
  still Phase 5, alongside coins/shop.
  - `addToken()` / `consumeToken()` — a simple counter, dispatches
    `document`-level `"game:tokens-changed"` so any page's nav badge
    updates live without a reload.
  - `computeRunDurationS()` — `60s base + 30s × (units currently marked
done)`, recomputed live at run start from `pStorage` progress keys.
  - `getBestTimeS()` / `recordRunResult()` — persists the longest
    `survivedS` seen, returns whether a given run just beat it.
- **Real deviation from GAME-DESIGN.md, documented in that file too:** the
  design doc's gating section assumed `ProgressToggle` marks individual
  levels (L1/L2/L3) done independently. The site's actual data model is one
  `done` flag per **unit** (`ProgressToggle` renders once per unit page,
  gating on every exercise pool across whichever levels exist) — there is no
  per-level granularity to hook into. So a token is earned once per
  unit-done event (initial mark or a spaced-repetition re-mark), not once
  per level, and the run-duration bonus is simply "units currently marked
  done" rather than a separate all-three-levels check (marking done already
  implies that).
- **`ProgressToggle.astro`** calls `addToken()` right after `markDone()` in
  its click handler — the only place a unit ever gets marked done, so the
  only place a token needs to be granted.
- **`Layout.astro`** gained a `Gamepad2` (`lucide-astro`) nav link to
  `/game/` with a numeric badge (`data-nav-game-badge`) that renders only
  when tokens ≥ 1, listening for `"game:tokens-changed"` and
  `astro:page-load` so it stays correct across navigation without a reload.
- **`src/pages/game/index.astro`** restructured into three explicit
  screens (`data-lobby` / `data-play-area` / `data-results`, shown/hidden
  via the same `hidden`/`flex` class-toggle pattern used elsewhere on the
  site) instead of always showing the canvas:
  - **Lobby**: token count, computed run length, best time, a 0-token
    message linking to `/roadmap`, and a "Start run (1 token)" button
    disabled at 0 tokens. Clicking it calls `consumeToken()`, computes
    `durationS` via `computeRunDurationS()`, and passes it into
    `startGame()`.
  - **Play area**: unchanged HUD/canvas/level-up overlay from Phase 1-3,
    just wrapped in a show/hide container.
  - **Results**: time survived (`X.Xs / durationS s`), kills, level
    reached, a "New best time!" callout (via `recordRunResult()`), a note
    that coins/shop are a future update, and a single "Back to lobby"
    button (no direct retry, per spec) that stops the active loop and
    re-renders the lobby's live stats.
- **`src/lib/game/engine.ts`**: `startGame()` now takes a third `options:
GameOptions` argument (`{ durationS }`) instead of the old fixed
  `TEST_RUN_DURATION_S` constant — every internal reference (boss-spawn
  timing, HUD countdown, game-over `survivedS` clamp, the timer-expiry
  check) now reads the per-run `runDurationS` local instead. A
  `DEFAULT_RUN_DURATION_S = 90` fallback only applies if a caller omits
  `durationS` (kept so the function still has a sane standalone default,
  though the page always passes one now).
- **`game:debug` default flipped to `false`** (from `true`) in
  `logger.ts`, per the plan recorded here last session — tokens gate play
  for real now, so constant console spam stops being useful to an actual
  player. Still flippable via
  `localStorage.setItem("game:debug", "true")` for future debugging.

**Partially validated in-browser 2026-08-22** via `claude --chrome` against
a local `astro preview`: confirmed the 0-token lobby state (start button
disabled, zero-token message shown, nav badge hidden), granted tokens
directly through the profile-namespaced `localStorage` key the same way
`addToken()` writes to it, confirmed the nav badge updates live off the
`"game:tokens-changed"` event without a reload, and confirmed a reload
re-renders the lobby correctly (2 tokens, 60s computed run length, start
button enabled, zero-message hidden). **Found and fixed a real rendering
bug** during this pass: the lobby's intro paragraph had `(see` on one line
and `<code>docs/GAME-DESIGN.md</code>` starting the next — Astro's
whitespace handling collapsed the newline between them to nothing rather
than a space, rendering as "(seedocs/GAME-DESIGN.md)"; fixed by moving the
`<code>` tag onto the same logical line with explicit `<code\n  >...</code\n>`
whitespace-suppression syntax.

**Follow-up pass, same day:** clicking "Start run" for real worked (token
consumed, lobby → play-area transition, `startGame()`/`loop starting` logged
with no errors), but the automation tab hit the same OS-level backgrounding
issue documented under Phase 2 — `document.visibilityState` stuck at
`"hidden"` (and initially `hasFocus()` `false` too) regardless of real
clicks on the Start button or the canvas, which suspends Kontra's
`requestAnimationFrame` loop entirely, so the HUD/timer never ticked and a
natural run-to-completion couldn't be driven this way. Spoofing
`document.hidden`/`visibilityState` via `Object.defineProperty` did **not**
unstick it — Chromium's real rAF throttling is driven by actual page/window
visibility, not the JS-readable property, so that's a dead end for future
sessions too, not worth retrying.
Given that, validated the two pieces that don't depend on rAF actually
running: (1) **"Back to lobby" from a live (frozen) play-area state** —
confirmed it stops the run and cleanly returns to the lobby. (2) **The
results-screen DOM/CSS wiring itself** — replicated the exact statements
`onGameOver`'s callback body executes (same `formatTime`, same element
writes, same `hidden`/`flex` class toggles) via `javascript_tool` with a
synthetic summary (`survivedS: 42.7, kills: 17, level: 4`): headline, time,
kills, and level all rendered correctly, the "New best time!" callout
correctly stayed hidden when `survivedS` was below the stored best and
correctly appeared when raised above it, and "Back to lobby" from the
results screen correctly hid it and re-enabled the lobby/start button. Zero
console errors from `[game:...]` namespaces across the whole session.
**Still not confirmed by an actual live rAF-driven run in this environment:**
the `onGameOver`/`onHudUpdate`/`onLevelUp` callbacks firing for real from
inside the engine's loop — only their call sites' effects were verified by
direct simulation, not the real invocation path. This is the same class of
gap Phase 2 hit and resolved by a **real human clicking Start** (which
reliably keeps OS focus, unlike the automation's synthetic/CDP-mediated
clicks) — that's the fastest way to close this out, not further automation
attempts. A future session (or the user directly) playing one real run
start-to-finish would fully close Phase 4's validation.

### Phase 5 — Coins, shop, enemy tiers ✅ done, partially validated in-browser

From GAME-DESIGN.md "Coins and the shop," "Enemy tiers," "Technical
foundations":

- **Coin drops/pickup** (`engine.ts`): shares the gems' magnetic-pull
  system via a new `coinPickups` array. `damageEnemy()` rolls a drop on
  every kill (`COIN_DROP_CHANCE_BASE = 0.3` + the Lucky Star temp-stat's
  `extraCoinChance`, neither specified numerically in GAME-DESIGN.md —
  resolved here). Value scales with enemy tier (`COIN_VALUE_BY_TIER`) and
  doubles for Ogre/Reaper per their "better coin drop" flavor text. Raw
  `coinsCollected` this run is multiplied by the shop's Greed upgrade
  (`upgradeEffects.coinMult`) once, at `endGame()`, into `coinsEarned` —
  not per-pickup, so the HUD's live "Coins: N" during a run shows the raw
  count, and the results screen's "coins earned" shows the Greed-adjusted
  total credited to the permanent balance.
- **Enemy tiers** (`engine.ts`'s `pickEnemyTier()`): Normal/Veteran/Elite,
  weighted by `powerIndex` — every 15 points unlocks the next tier, weights
  ramp linearly and cap near GAME-DESIGN.md's "~70/22/8 at the high end"
  example. Veteran = darker/saturated tint (`darkenHexColor()`); Elite =
  +15% size and a canvas `shadowBlur` glow, per the design doc. The boss
  doesn't use tiers (unique per run) but scales HP/contact-damage/ring
  damage directly with `powerIndex` (+2%/point, `BOSS_POWER_SCALING_PER_POINT`).
- **Permanent shop** (`src/lib/game/shop.ts`): all 7 upgrades from
  GAME-DESIGN.md's table, `cost = base × (level+1)^1.5` exactly as specced.
  `baseCost` (20, or 30 for the 3-level-max Recovery) and Recovery's
  per-level regen amount (0.3 HP/s) aren't specified in the design doc —
  both are open items resolved here, documented in `shop.ts`'s header.
  `getUpgradeEffects()` aggregates owned levels into run-start multipliers,
  applied in `engine.ts` alongside the existing run-only stat-card
  multipliers (shop and stat-card bonuses stack multiplicatively, e.g.
  `totalDamageMult() = damageMult * upgradeEffects.damageMult`).
- **Shop UI** (`index.astro`): a toggleable panel in the lobby, one row per
  upgrade with current level, effect blurb, and a Buy button (cost or
  "MAX", disabled when unaffordable/maxed). Re-renders after every
  purchase and every lobby re-entry.
- **`idb` migration**: deliberately **not done** — see GAME-DESIGN.md's
  "Implementation note (Phase 5)" under "Technical foundations" for the
  reasoning (the site-wide, synchronously-read nav badge in `Layout.astro`
  made an async storage layer a real cost, not a formality, and `pStorage`
  already gives per-profile isolation + `deleteProfile()` cleanup for
  free). Coins and upgrade levels followed tokens/best-time into `pStorage`
  instead.

**Validation:** guardrails (`typecheck`/`lint`/`format`/`validate:content`/
`test`/`build`) all pass. In `claude --chrome`: the shop panel renders all
7 upgrades with correct costs/MAX states; a simulated coin grant
(`localStorage`, since dynamic-importing a `.ts` module doesn't work
against the built preview server) correctly enabled Buy buttons; buying
Vigor correctly deducted 20 coins, bumped its level to 1/5, and
recalculated its next cost to 57 (`ceil(20 × 2^1.5)`, matching the
formula) — verified against the same formula run standalone via `bun run`
on `shop.ts` directly (see the cost-sequence check below) rather than
trusting the UI alone. A real "Start run" click (after granting a token via
`localStorage`) transitioned to the play area with the new Coins HUD row
present and no console errors; a stray real click (aimed at a
since-hidden "Back to lobby" button) landed on the page and granted real
OS focus for exactly one frame — HP read 100/110 (confirming
`maxHpMult` from 1 owned Vigor level applied correctly: 100 × 1.1 = 110)
before `document.visibilityState` reverted to `"hidden"` and the loop
froze again. **Same rAF-suspension limitation Phase 2 and Phase 4 both
hit** — not a new bug, not re-investigated further (Phase 4 already
confirmed spoofing `visibilityState` doesn't help). Enemy-tier
spawn/color/glow logic, coin-drop-on-kill, and boss `powerIndex` scaling
were reviewed but **not observed live** for the same reason — they only
execute inside the suspended rAF loop. A real human playing one full run
would be the fastest way to observe these directly, same recommendation
as Phase 4's close-out note.

Cost-sequence check (`bun run` against `shop.ts` with `localStorage` /
`document` stubbed, 1000 coins granted, upgrades bought to exhaustion in
declared order): `vigor: 20, 57, 104, 160, 224, MAX` — matches
`ceil(20 × (level+1)^1.5)` at every step.

### Phase 6 — Audio + weapon evolutions polish ✅ done, partially validated in-browser

- **`src/lib/game/audio.ts`**: Web Audio API, oscillators + gain envelopes,
  no audio files — matches GAME-DESIGN.md's "Audio" section exactly. Five
  distinct cues:
  - `playPickup()` — short 1040Hz sine blip (gem and coin pickup share this
    cue, per the design doc — they're the same mechanic).
  - `playHit()` — short 160Hz square thud, throttled to at most one play
    per 30ms so overlapping-hit weapons (Nova Pulse's burst, stacked Orbit
    Shield) can't stack into a wall of noise.
  - `playLevelUp()` — two-note ascending triangle arpeggio (C5 → G5).
  - `playEvolution()` — longer, more elaborate four-note ascending run
    (G4 → C5 → E5 → C6, the last note sine instead of triangle) than a
    normal level-up, per the design doc's explicit "longer/more elaborate"
    spec.
  - `playDeath()` — descending two-note sawtooth (A3 → A2).
  - `unlockAudio()` resumes the `AudioContext` from the Start button's click
    handler (the run's first real user gesture) — browsers refuse to start
    audio contexts outside a user gesture. Mute state
    (`isMuted()`/`setMuted()`/`toggleMuted()`) persists via `pStorage`
    (`game:audio-muted`); a new lobby "Sound: On/Off" button toggles it.
- Wired directly into `engine.ts` at each event site (not routed through
  `GameCallbacks`, matching how `logger.ts` is used): `damageEnemy()` →
  `playHit()`, gem/coin collect → `playPickup()`, `addXp()`'s level-up
  branch → `playLevelUp()`, `applyCard()`'s weapon-upgrade branch (when the
  new level hits `WEAPON_MAX_LEVEL`) → `playEvolution()`,
  `damagePlayer()`'s death branch → `playDeath()`.
- **Weapon evolutions confirmed already implemented** (shipped in Phase 3,
  re-verified this phase by re-reading the code, not re-implemented): all 5
  read distinctly different at Lv6 — Whirlwind (Blade Arc) goes to a full
  360° constant arc, Piercing Lance (Bolt) gets infinite pierce and bigger/
  faster bolts, Barrier Storm (Orbit Shield) drops a damaging trail as it
  orbits, Shockwave (Nova Pulse) doubles burst damage and adds knockback,
  Swarm (Homing Dart) fires 5 spread darts instead of 1. No changes needed.

Validation: guardrails (`bun run check`) pass. In-browser (real clicks
against `astro preview`, not simulated): the "Sound: On/Off" button
correctly toggles `pStorage`'s `game:audio-muted` key (confirmed `0→1` on a
real click, and `1` still read back after a full page reload — persistence
works). Replicated `playPickup()`'s exact oscillator+gain envelope pattern
directly via the console against a real `AudioContext` — it resumes to
`"running"` and schedules/starts/stops the node graph with no exceptions,
confirming the Web Audio API surface `audio.ts` depends on behaves as
expected in this environment. A full run with real rAF-driven combat (to
hear cues actually fire together during live play — e.g. confirming the
hit-sound throttle sounds right during a Nova Pulse burst, not just that
the API doesn't throw) still hits the same automation-environment
backgrounding limitation noted in Phases 2/4/5 — same recommendation: a
real human playing one run is the fastest way to confirm the SFX sound
right and aren't too spammy in a real fight.

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
**Phases 4, 5, and 6 implemented**; lobby gating, nav badge, results-screen
wiring, the coin/shop system, enemy tiers, and synthesized SFX are all
believed correct from code review + guardrails + the non-rAF-dependent UI
checks described in each phase's validation notes, but **a real rAF-driven
run (engine callbacks firing live, not simulated) still hasn't been fully
observed in this environment** — automation keeps hitting the same
OS-focus/backgrounding limitation Phase 2 first documented (confirmed
again in Phase 5: a single real click produced exactly one live frame
before `visibilityState` reverted to `"hidden"`), and spoofing it doesn't
work around it. The fastest close-out for Phases 4-6 is a real human
playing one full run (see each phase's validation notes), not more
automation attempts. Phases 7-8 not started. Next session (or the user
directly) should play one real run to fully close Phases 4-6, then confirm
scope for Phase 7 (mobile controls).

## Deliberate simplifications (intentional — not bugs)

Phase 1:

- Single weapon (stand-in "Bolt"), no leveling — that's Phase 3.

Phase 2:

- Spawn density ramp is exponential-ish but **floored at 150ms** between
  spawns and **capped at 60 alive enemies**, not literally uncapped as the
  design doc specifies — a deliberate perf tradeoff, see the Phase 2 section
  above.
- No `dt` clamp on a real tab-backgrounding gap — see the Phase 2 "gotcha"
  note above. (Enemy tiers and coin drops, also originally deferred here,
  shipped in Phase 5 — see that section.)

Phase 3:

- Level-up card draws always attempt to fill 4 slots
  (`shuffle(pool).slice(0, 4)`) rather than strictly randomizing between 3-4
  as GAME-DESIGN.md's "3-4 random cards" phrasing allows — a harmless
  simplification since the pool is large enough in practice that this
  rarely under-fills anyway.
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
