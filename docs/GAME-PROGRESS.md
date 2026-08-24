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
  directly, and `options.durationS` sets the run's length (Phase 4). Phase 13
  added `enemyTimeScale()`/`computeThreatTier()` — enemy HP/contact-damage
  now scale up (bounded, asymptotic) with elapsed run time, and
  `GameHudState.threatTier` / `GameCallbacks.onThreatTierUp` expose a
  cosmetic 1-5 readout of that same ramp.
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
- `src/lib/game/sprites.ts` — Phase 9's Canvas drawing layer: `drawShape()`
  (the Phase 8 primitive, moved here unchanged) plus per-kind composite
  functions (`drawPlayer`/`drawEnemy`/`drawGem`/`drawCoin`/`drawProjectile`)
  that layer extra detail (eyes, wings, a hood, a coin ring, a motion
  trail) on top. Pure rendering — no simulation/collision code lives here,
  and `engine.ts`'s game logic is untouched by this file. Phase 11 added a
  `flashAlpha` option on `drawShape()` (a white hit-flash overlay, traced via
  a shared `traceShapePath()` helper), a `drawCloak()` used by `drawPlayer()`
  for a subtle trailing character silhouette, and `drawImpactBurst()` for a
  short radiating-line spark at a weapon-hit point.
- `src/lib/game/icons.ts` — Phase 10's hand-authored inline SVG icon set
  (weapons, an evolution sparkle, and 6 shared concept icons reused across
  run-only temp stats and permanent shop upgrades), plus `sizedIcon()` for
  rendering one icon constant at different sizes. Reused by Phase 11 for the
  HUD's live weapon-icon row. Phase 12 added a `UI_ICON` export (clock,
  skull, gem, star, ticket, trophy, sound/motion/shop/fullscreen/back/play)
  for the lobby/HUD/results chrome. Phase 13 added a trending-up-line icon
  (`UI_ICON.threat`) for the new threat-tier HUD chip/toast.
- `src/lib/game/settings.ts` — Phase 8's reduce-motion setting
  (`isReducedMotion()`/`setReducedMotion()`/`toggleReducedMotion()`),
  persisted via `pStorage` (`game:reduce-motion`) — mirrors `audio.ts`'s
  mute pattern exactly. Passed into `engine.ts` as `GameOptions.reduceMotion`,
  which disables all canvas glow when set.
- `src/pages/game/index.astro` — the route: a lobby screen (now with a
  Shop panel, a Sound on/off toggle, and a Motion on/off toggle), the play
  area (HUD + canvas + start button, canvas also hosts Phase 7's pointer-
  driven virtual joystick), and a results screen, shown/hidden as three
  sibling containers. Wires `startGame()` to button clicks the same
  wire-once way `ProgressToggle`/`ExercisePanel` do (`dataset.wired` guard).
  The Start button click also calls `unlockAudio()` — it's the first real
  user gesture in a run, needed to resume the `AudioContext`.

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

### Phase 7 — Mobile controls ✅ done, partially validated in-browser

From GAME-DESIGN.md "Mobile controls":

- **Dynamic virtual joystick** (`engine.ts`): `pointerdown`/`pointermove`/
  `pointerup`/`pointercancel`/`pointerleave` listeners on the canvas
  (Pointer Events, not raw touch events — works for touch and mouse alike).
  The base spawns at the exact `pointerdown` point (`joystick.originX/Y`,
  in canvas-internal coordinates via `clientToCanvasPoint()`, which accounts
  for the canvas's CSS scaling), **not a fixed screen zone**, per the design
  doc. Dragging beyond `JOYSTICK_MAX_RADIUS` (42px) clamps the knob to the
  edge of the base rather than following the finger past it. Only one
  active pointer is tracked at a time (a second `pointerdown` while one is
  already active is ignored).
- **Movement integration**: the joystick, when active, fully drives
  movement for that frame (analog — magnitude scales with drag distance via
  `moveMagnitude`, not just direction); when inactive, WASD/arrow keys work
  exactly as before. The two never fight each other since only one branch
  runs per frame.
- **Visual feedback**: a translucent ring at the base position + a filled
  knob circle at the current drag position, drawn in `render()` only while
  a joystick is active — see the "Phase 7: joystick visual" block.
- `canvas.style.touchAction = "none"` prevents the browser's default
  scroll/zoom touch gestures from fighting the joystick drag.
- Listeners are added once in `startGame()` and explicitly removed in the
  returned `stop()` — same cleanup discipline the rest of the engine
  already follows for the game loop itself.
- `src/pages/game/index.astro`'s lobby copy updated to mention touch
  ("drag anywhere on the play area").

**Validated 2026-08-24**: guardrails (`bun run check`) pass. In-browser
(`claude --chrome` against a fresh `astro preview` build): granted a token
via `localStorage`, clicked "Start run" for real, confirmed the play area
and canvas render. Dispatched synthetic `PointerEvent`s
(`pointerdown` → `pointermove` → `pointerup`) directly at the canvas via
`javascript_tool` — no exceptions, `canvas.style.touchAction` correctly
reads `"none"`, zero new console errors. **Not confirmed**: the joystick
actually moving the player during a live, rAF-driven frame — same
automation-environment backgrounding limitation as every prior phase (the
loop is suspended, so `update()` never runs to consume the joystick state).
A real human dragging on a touch device (or a mouse-down-drag on desktop)
remains the fastest way to confirm the analog feel and clamped-radius
behavior in practice.

### Phase 8 — Visual/UX + performance polish pass ✅ done, partially validated in-browser

From GAME-DESIGN.md "Visual style" and the deferred "settings toggle" item:

- **Geometric-shape rendering** (`engine.ts`'s `drawShape()`): every sprite
  (player, all 5 enemy kinds + boss, gems, coins, player/enemy projectiles)
  switched from Kontra's default flat-color rectangle render to a hand-drawn
  shape — circle, triangle, square, or diamond, picked per entity kind
  (`ENEMY_SHAPE`), each filled with an outline (`rgba(255,255,255,0.4)`
  stroke). This replaces the old `sprite.render()` calls entirely; the
  Kontra `Sprite` objects are still used for position/physics bookkeeping,
  just not for drawing.
- **Glow is deliberately selective, not universal**: only the player, the
  boss (Reaper), and Elite-tier enemies get a `shadowBlur` glow. Up to 60
  enemies plus projectiles can be alive at once (Phase 2's perf cap), and
  `shadowBlur` is one of the more expensive canvas operations per draw call
  — applying it to every Zombie/Bat/etc. would be the first thing to show up
  in a profile at max enemy counts. This is a documented scope decision, not
  an oversight: GAME-DESIGN.md's "Visual style" describes glow as part of
  the overall look, not a mandate that literally everything glows, and
  Elite already had its own glow/aura requirement independently.
  Veteran-tier's existing darker/saturated tint (`darkenHexColor()`, from
  Phase 5) is unchanged.
- **`reduceMotion` GameOption** (new): when set, disables glow entirely
  (player, boss, and Elite all render without `shadowBlur`), regardless of
  tier. Backed by **`src/lib/game/settings.ts`** (new file) —
  `isReducedMotion()`/`setReducedMotion()`/`toggleReducedMotion()`, mirroring
  `audio.ts`'s mute pattern exactly (persisted via `pStorage`,
  `game:reduce-motion`). A new lobby "Motion: On/Off" button in
  `index.astro` toggles it; the current value is read and passed into
  `startGame()`'s options at run start, same as `upgradeEffects`/
  `powerIndex`. This resolves GAME-DESIGN.md's "Open items deferred to
  implementation time" question about a reduce-motion toggle — mute audio
  already shipped in Phase 6, this is the other half.
- **`game:debug` default revisited, not changed**: re-read `logger.ts` —
  still defaults to `false` (set in Phase 4, since tokens gate real play
  now). No reason found to change it; documenting the revisit here rather
  than silently skipping it, per the phase's own checklist item.
- **`dt` clamp** (`MAX_DT = 1/15`, applied as the very first line of
  `GameLoop`'s `update()`): closes a gap flagged but deliberately deferred
  back in **Phase 2**'s "Known issues" — a real player who backgrounds the
  tab mid-run and returns would otherwise see one huge catch-up frame
  (`elapsedMs` jumping by however long the tab was hidden). Now any single
  frame's simulated time is capped at ~67ms regardless of how long the real
  gap was, so spawning/movement/regen all stay bounded. This is a cheap,
  correctness-only change — it does not affect normal 60fps play at all
  (real frame dt is almost always well under the cap).
- **Performance pass at max realistic entity counts — reasoned, not
  profiled**: this environment cannot drive a live rAF loop long enough to
  actually profile a busy frame (same limitation blocking every other
  phase's live validation). Did the math instead: `MAX_ALIVE_ENEMIES = 60`
  (Phase 2's cap) × a realistic simultaneous projectile count (bolt
  multi-shot + homing darts + enemy ranged attacks, rarely more than ~20
  alive) is at most ~1,200 pairwise distance checks per frame for
  collision — trivial for JS at 60fps, and no different in shape from what
  Phase 2-5 already shipped (this phase didn't change any collision logic,
  only rendering). Per GAME-DESIGN.md's own instruction, **no spatial
  partition was added** — the doc explicitly says to add one "only if
  profiling actually shows it's needed," and there's neither a profile nor
  a reasoned case that it's needed yet. A future session with a real
  playtest (or a session outside this automation environment that can hold
  focus for a full run) should actually profile a late-run frame before
  reconsidering this.

**Validated 2026-08-24**: guardrails (`bun run check`) pass — `typecheck`
in particular confirms the new `color` fields added to the `Enemy`/
`Projectile`/`Gem`/`CoinPickup` interfaces line up with what Kontra's
`Sprite()` actually carries at runtime. In-browser: took a screenshot of a
started run's canvas and confirmed the player renders as a glowing cyan
circle (not the old flat square) — visual proof `drawShape()` runs
correctly in this environment, not just that it type-checks. Toggling
"Motion: On/Off" correctly flips `pStorage`'s `game:reduce-motion` key
(`0→1` on a real click) and the new value survives a full page reload.
**Not confirmed live**: enemy-shape variety (triangle Bats, square
Skeletons/Ogres, etc.), the dt clamp actually engaging after a real
backgrounding gap, and glow correctly disabling on Elite/boss when
`reduceMotion` is on — all of these only execute inside the suspended rAF
loop, same class of gap as every prior phase's close-out note. A real human
playing one run (ideally one long enough to see an Elite or two, and
ideally with a deliberate tab-switch mid-run to exercise the dt clamp)
would fully close this out.

### Phase 9 — Composite Canvas sprites ✅ done, partially validated in-browser

Not part of the original 8-phase plan — added after the user asked for
"better assets" post-Phase 8. Scoped down from "external art" (this
environment has no image-generation tool, and GAME-DESIGN.md deliberately
avoids external assets for licensing reasons) to "richer detail within the
existing Canvas-drawing approach," per the user's explicit choice when
asked to pick a direction.

- **New `src/lib/game/sprites.ts`**: `drawShape()` (Phase 8's single-
  primitive draw call) moved here unchanged, plus five new composite
  functions that layer extra detail on top of it:
  - `drawPlayer()` — the base glowing circle plus a small bright "facing
    nub" toward the last movement direction, so the otherwise-symmetric
    player circle reads as oriented. Backed by a new `playerFacingAngle`
    variable in `engine.ts`, updated whenever the player actually moves
    (keyboard or joystick) and held steady when idle.
  - `drawEnemy()` — the existing base shape (`ENEMY_SHAPE`, moved here from
    `engine.ts` unchanged) plus per-kind accents: Zombie gets two eyes and
    a crooked mouth line, Bat gets two extra small wing triangles + eyes,
    Skeleton gets eyes plus a simple rib cross, Ghost gets eyes only (kept
    minimal — its "keeps distance" behavior is the more legible tell),
    Ogre gets a heavy brow line + larger eyes, and the Reaper boss gets a
    dark hood overlay (a translucent triangle over the top half) plus two
    glowing amber eyes. None of this is facing-dependent (only the player
    tracks a facing angle) — kept cheap and simple by design.
  - `drawGem()` — the existing diamond plus a single facet highlight line.
  - `drawCoin()` — the existing circle plus an inner ring stroke, reading
    more like a coin edge than a flat disc.
  - `drawProjectile()` — the existing circle plus a short, fading trail
    drawn opposite the projectile's velocity vector (`p.dx`/`p.dy`, already
    on every `Projectile`) — fast bolts/darts now visibly streak instead of
    just teleporting frame to frame.
- **`engine.ts`** changes are rendering-only: `drawShape`/`ENEMY_SHAPE`
  removed (now imported from `sprites.ts`), `render()`'s per-entity draw
  calls swapped for the new composite functions, and `EnemyKind` is now
  exported (needed by `sprites.ts`'s type import). No simulation, collision,
  or balance code changed — same class of separation Phase 8 already
  established (rendering only reads position/color/kind off entities that
  the update loop owns).
- **Perf-cost posture unchanged from Phase 8**: the new accents are cheap
  primitives (dots, lines, one extra small triangle for Bats) with no
  `shadowBlur` of their own — glow stays reserved for player/boss/elite,
  same reasoning as Phase 8's header note.

**Validated 2026-08-24**: guardrails (`bun run check`) pass. In-browser: a
started run's canvas was screenshotted and the player rendered correctly
as a glowing circle with a visible facing nub (confirming `drawPlayer()`
runs without error against a real canvas context). **Not confirmed live**:
the per-enemy-kind accents (eyes, wings, hood, etc.) and the projectile
trail, since — same limitation as every phase since Phase 2 — no enemies
or projectiles spawn while the automation environment's rAF loop is
suspended. A real human playing one run remains the way to see the full
composite roster (all 5 enemy kinds + boss + gems + coins + projectiles)
at once.

### Phase 10 — Level-up card and shop UI redesign ✅ done, partially validated in-browser

Not part of the original 8-phase plan or Phase 9 — the user clarified after
Phase 9 that "better assets" meant real designs for weapons, the level-up
cards, the shop, and the character, plus more visible attack feedback, not
just richer enemy sprites. Scoped down (user's explicit choice when asked)
to **UI first: level-up cards + shop rows**, deferring weapon icons wired
into combat, the player's own visual redesign, and attack animation/impact
feedback to a later session.

- **New `src/lib/game/icons.ts`**: hand-authored inline SVG icons (24x24
  viewBox, stroke-based, `currentColor`, matching the outline style
  `lucide-astro` uses for site chrome — see CLAUDE.md's "Visual design
  balance") for the 5 weapons, an evolution "sparkle" marker, and 6 shared
  _concept_ icons reused across the run-only temp stats (`engine.ts`'s
  `TEMP_STATS`) and the permanent shop upgrades (`shop.ts`'s `UPGRADES`)
  wherever they represent the same idea — Vigor/Thick Skin (heart),
  Fleetness/Adrenaline (double-chevron), Magnetism/Wide Reach (inward
  arrows), Greed/Lucky Star (coin stack), Might/Power Surge (flame),
  Recovery/Quick Recovery (plus-in-circle) — plus a standalone book icon
  for Amanuensis (XP, no temp-stat counterpart). `lucide-astro` itself
  isn't used here because these are built in vanilla client-side JS in
  `index.astro`'s `<script>`, not `.astro` files where that component
  works. A `sizedIcon()` helper injects a size class onto an icon string's
  `<svg>` tag so one icon constant works at different sizes (h-5 in cards,
  h-4 in the denser shop rows).
- **`engine.ts`**: `LevelUpCard` (the public shape `index.astro` receives)
  now carries `kind`/`weaponId`/`statId`/`isEvolution` — all of this was
  already computed internally on `InternalCard`, just not previously
  exposed, so the page had to parse `id`/`title` strings to guess which
  icon to show. Now it doesn't have to. `WeaponId` is exported for the
  same reason. Purely additive metadata — no simulation change.
- **Level-up cards** (`index.astro`'s `onLevelUp`): each card now has an
  icon badge (weapon icon for weapon cards, concept icon for stat cards)
  and an accent color by kind — sky for weapon upgrades, emerald + a "NEW"
  pill for new-weapon offers, violet for stat cards, and gold/amber
  (overriding the other three) plus the sparkle icon for evolution (Lv6)
  cards specifically, since reaching one is the rarer moment of the three
  kinds. Cards animate in with the shared `animate-fade-slide-in` class
  (per CLAUDE.md's micro-interaction convention), matching how
  `ExercisePanel`/`LevelTabs` reveal content elsewhere on the site.
- **Shop rows** (`index.astro`'s `renderShop`): each row gained an icon
  badge and a real visual level-progress bar (`animate-fill-bar` +
  `--target-width`, the same pattern `business-communication/
audience-awareness` established) replacing the old plain "(3/5)" text,
  plus the same fade-in-on-render treatment as the level-up cards.

**Validated 2026-08-24**: guardrails (`bun run check`) pass. In-browser:
the shop panel doesn't depend on the rAF loop, so it was fully verified
live — granted coins and partial levels on Vigor (2/5) and Magnetism (1/5)
via `localStorage`, opened the shop, and confirmed all 7 rows render their
icon (heart/double-chevron/flame/inward-arrows/coin-stack/book/plus-circle)
and that the progress bars fill to the exact level fraction (Vigor's bar
at 40%, Magnetism's at 20%, the other five at 0%) — screenshotted and
visually confirmed. Zero console errors. The level-up cards **do** depend
on the rAF loop for a real trigger (same limitation as every phase since
Phase 2), so instead of a live level-up, the exact `onLevelUp` render
logic (accent color, icon selection, NEW pill, evolution sparkle) was
replicated via `javascript_tool` against the real DOM with one sample card
of each kind (weapon upgrade, weapon evolution, new weapon, stat) —
screenshotted after force-finishing the `animate-fade-slide-in` animations
(`el.getAnimations().forEach(a => a.finish())`, the project's established
technique for this exact automation limitation). All four rendered
correctly and distinctly: sky accent + bolt icon for the plain upgrade,
gold accent + sword icon + sparkle for the evolution, emerald accent +
shield icon + "NEW" pill for the new-weapon offer, violet accent + coin
icon for the stat card. **Not confirmed**: the real `onLevelUp` call site
firing from inside a live run (only its rendering logic was replicated,
not the actual invocation path) — closing that gap needs the same real
human playthrough already recommended for Phases 4-9.

### Phase 11 — Visible attacks + subtle character pass ✅ done, validated in-browser (rare live-run confirmation)

The deferred item from Phase 10: weapon icons wired into actual combat/HUD,
the player character's own visual redesign, and more visible attack
animation/impact feedback. Scoped to **subtle animation** per the user's
explicit choice when asked about depth (idle bob + hit-flash, no
articulated/limb-rigged sprite).

- **HUD weapon icons** (`index.astro`'s `onHudUpdate`): the plain-text
  `Weapons: bolt L1, bladeArc L3` line is now a row of icon badges (reusing
  `icons.ts`'s `WEAPON_ICON`, already built for Phase 10's cards) each
  showing the weapon icon + level, so equipped weapons are recognizable at a
  glance mid-run, not just at the moment they're picked.
- **Hit-flash** (`engine.ts` + `sprites.ts`): `damageEnemy()` now stamps
  `e.hitFlashUntil = elapsedMs + HIT_FLASH_MS` (120ms) on every hit;
  `damagePlayer()` does the same for a module-level `playerHitFlashUntil`.
  `render()` converts the remaining time into a 0-1 alpha and passes it as a
  new `flashAlpha` option through to `sprites.ts`'s `drawShape()`, which
  draws a second white-filled pass of the exact same silhouette (via a new
  shared `traceShapePath()` helper, factored out of `drawShape()` so the
  flash overlay traces the identical outline) at that alpha on top of the
  normal fill. `drawEnemy()` skips per-kind accent details (eyes, wings,
  etc.) while more than half-flashed, so a hit reads as a clean white pop
  rather than eyes floating over white.
- **Impact sparks** (`engine.ts`'s new `HitSpark[]` + `sprites.ts`'s
  `drawImpactBurst()`): every `damageEnemy()` call also drops a `HitSpark` at
  the hit point — a small 4-line radiating burst that fades over
  `HIT_SPARK_DURATION_MS` (220ms), pruned the same way `arcEffects`/
  `pulseEffects` already are. This is deliberately layered on top of (not a
  replacement for) each weapon's existing swing/burst/ring effect
  (`arcEffects`/`pulseEffects`/`orbitTrails`) — those show the weapon's
  shape, this shows the moment of contact, so individual hits (e.g. a single
  Bolt connecting) read as an impact even when no larger effect is active.
- **Player subtle redesign** (`sprites.ts`'s `drawPlayer()`): a new
  `drawCloak()` draws a translucent triangular cloak silhouette trailing
  opposite the facing angle, underneath the existing circle+facing-nub — a
  bit of "character" shape beyond a plain circle without any limb rigging.
  A new idle-only bob (`playerBobPhase`, incremented in `update()` only while
  `moveMagnitude === 0`, applied in `render()` as a small sinusoidal
  `player.y` offset, gated off entirely when `reduceMotion` is on) gives the
  character a breathing/idle feel when not moving, per the confirmed
  "subtle animation" scope — no walk cycle, since there's no limb rig to
  animate one with.
- All of this is rendering-only, timed off the existing `elapsedMs` clock —
  no collision, damage-number, or balance changes. `GameHudState.weapons[].id`
  was already typed `WeaponId` (Phase 10), so the HUD icon lookup needed no
  new type plumbing.

**Validation:** guardrails (`bun run check`) pass. In-browser (`claude
--chrome` against a fresh `astro preview` build): granted 3 tokens via
`localStorage`, clicked "Start run" for real — and this time the tab
genuinely kept OS focus and a **full live run played out**, unlike every
prior phase since Phase 2 (all of which hit the documented
`visibilityState: "hidden"` rAF-suspension wall). Confirmed live, by
screenshot, across several points in the run: the player rendering as a
glowing circle with a visible bright facing-nub dot **and** a darker
trailing cloak silhouette behind it (zoomed screenshot at both an early
low-kill moment and again mid-run next to an active Orbit Shield ring and a
Nova Pulse burst); the HUD weapon-icon row updating live as weapons were
picked (bolt → bolt+shield → bolt+shield+pulse, each with its correct icon);
HP dropping across screenshots (100/120 → 52/120 → 50/135) confirming
`damagePlayer()` — and therefore `playerHitFlashUntil` — fired for real
multiple times; and the run ending naturally at 54.6s (death, not the 60s
timer) with a correct results screen (47 kills, level 5, 17 coins earned).
Zero console errors/exceptions across the whole run
(`read_console_messages` with `onlyErrors: true` came back clean). **Not
caught on camera, specifically**: the white hit-flash overlay and the
impact-spark burst are both only ~120-220ms — one zoomed screenshot mid-run
did catch a small white radiating mark consistent with `drawImpactBurst()`
next to an enemy, but a screenshot's ~1-2s round-trip isn't fast enough to
reliably land inside either window, so this is not claimed as a confirmed
sighting of either effect specifically (only inferred from the HP-drop
evidence that the code path executed). The `flashAlpha`/`drawImpactBurst`
rendering logic itself was separately confirmed correct by replicating it
verbatim against the real canvas 2D context (a manual draw call with
`flashAlpha` at 0, 0.25, 0.6, and 0.9, and `drawImpactBurst` at progress 0,
0.4, 0.8) — screenshotted and visually confirmed: partial alpha blends the
white overlay with the base color as expected, full alpha whites the shape
out completely, and the impact burst's four lines correctly shrink toward
the center and fade as progress advances. Idle bob was not isolated on
camera either (the player was in near-continuous combat motion throughout
the observed run) — its code path is genuinely simple enough (a gated
`Math.sin()` y-offset) that this is a low-risk gap, but a future session
watching a player stand still for a couple of seconds would close it fully.

### Phase 12 — Game screen visual/UI redesign ✅ done, validated in-browser

The user asked to improve the game screen itself (not the game canvas):
less text, more visual elements, and a fullscreen toggle. Scoped to the
lobby/HUD/results chrome around the canvas — no engine/gameplay changes.

- **New `UI_ICON` set** (`icons.ts`): 17 additional hand-authored icons
  (clock, skull, gem, star, ticket, trophy, sound on/off, eye/eye-off for
  motion, shop bag, maximize/minimize, back arrow, play triangle), reusing
  the existing heart/coin icons from Phase 10 where the concept already had
  one. Same style/sizing convention as the existing set.
- **Lobby**: the multi-sentence intro paragraph shrank to one line. The four
  stat blocks (tokens/run length/best time/coins) became icon+number pill
  chips instead of "number over a text label" columns. The Shop/Sound/Motion
  buttons became icon-only circular buttons (`title`/`aria-label` for
  tooltip + accessibility) instead of text buttons reading "Sound: On" —
  Start Run kept its text (the primary CTA) but gained a play icon.
- **HUD** (in-run): HP is now an icon + a real horizontal bar (`--target`
  style width set directly per `onHudUpdate` tick, with a CSS `transition`
  for smooth movement) with the numeric `42/120` alongside it, replacing the
  plain "HP: 42/120" text. Kills/gems/coins/level are icon+number pairs with
  no text labels. A new thin XP bar sits under the stat row. The "Weapons:"
  text label was dropped — the icon chips already carry the meaning.
- **Results screen**: each stat (time/kills/level/coins) got an icon above
  the number instead of a text caption below it; the headline shortened from
  "Run ended — survived Xs / Ys" to just "Survived Xs" (the lobby's own "run
  length" stat already covers the duration side); "Back to lobby" shortened
  to "Lobby" with a back-arrow icon.
- **Fullscreen toggle** (new): a single icon button top-right of the page
  header (visible in all three screens — lobby/play/results), wired to the
  Fullscreen API on a new `data-game-root` wrapper div around the whole
  widget (not just the canvas), so HUD and lobby/results also benefit from
  the larger viewport. A `fullscreenchange` listener (`renderFullscreen()`)
  swaps the icon between maximize/minimize and toggles a small set of
  layout classes (`max-w-none h-screen justify-center bg-white
dark:bg-slate-950 p-4`) so the widget actually fills the screen instead of
  sitting at its normal `max-w-lg` width inside a black fullscreen frame.
  The canvas's existing `h-[min(58vh,500px)]` sizing already scales up
  correctly once the viewport (now the whole screen) is taller.

**Validation:** guardrails (`bun run check`) pass. In-browser (`claude
--chrome` against a fresh `astro preview` build): the redesigned lobby
rendered correctly (all 4 icon chips, icon-only toolbar, play-icon start
button); the shop panel opened correctly showing all 7 rows with icons and
bars (unchanged from Phase 10, confirmed still working with the new toggle
button); Sound/Motion toggles correctly flipped their icon and `title`
between on/off states on real clicks. **Fullscreen was confirmed working
both directions**: `requestFullscreen()` on `data-game-root` genuinely
entered fullscreen (screenshot showed the site's nav header gone, full-bleed
game content, confirmed via `document.fullscreenElement`), and exiting
(triggered by the automation environment itself, the same kind of
focus-related interruption documented elsewhere in this file) correctly
fired `fullscreenchange` and reverted the icon and layout classes back to
normal — the toggle logic is sound in both directions, independent of what
caused the exit. The in-run HUD's static layout was confirmed live (heart,
clock, star, skull, gem, coin icons all render correctly; HP bar starts
full; XP bar starts empty), but — same rAF-suspension limitation as every
phase since Phase 2 — `onHudUpdate` didn't fire live in this session, so the
HP/XP bar width math and text formatting were separately confirmed correct
by replicating the exact `onHudUpdate` body against the real DOM with a
synthetic state (`hp: 42/120` → bar width `35%`, `xp: 18/44` → bar width
`40.9091%`), screenshotted and visually confirmed. The results screen and
"Lobby" back button were both confirmed correctly with a synthetic
`onGameOver`-equivalent state, including the "New best time!" trophy
callout and the real token-count decrement on return to the lobby. Zero
console errors across the whole session.

### Phase 13 — Balance pass: time-scaled enemy toughness + threat-tier readout ✅ done, validated in-browser

The user flagged a real balance bug: as a run went longer it got _easier_,
not harder — backwards from the intent. Root cause, confirmed by reading
`engine.ts`: the only time-based ramp was spawn _density_
(`currentSpawnIntervalMs()`); individual enemy HP/contact-damage were fixed
per `EnemyKind` regardless of elapsed time (only the shop's permanent
`powerIndex` affected per-enemy tier weighting, which doesn't change within
a run), while the player's weapons/stat-cards compound in power every
level-up. Net effect: DPS-per-enemy only ever went up over a run. The user
also flagged the second half of the same problem — nothing signals to the
player that the game is getting harder as time/difficulty increases.

- **`enemyTimeScale(elapsedS, cap)`** (`engine.ts`): an asymptotic curve
  (`1 - 0.5^(elapsedS / 90)`, the same shape already used for the spawn-rate
  ramp) that scales enemy HP up to +200% (`ENEMY_HP_SCALE_CAP = 3`) and
  contact damage up to +100% (`ENEMY_DAMAGE_SCALE_CAP = 2`) by roughly the
  4-5 minute mark, then plateaus — deliberately bounded rather than
  open-ended, since run length scales with site progress
  (`tokens.ts`'s `computeRunDurationS()`) and can run well past that for an
  engaged learner. Applied at spawn time in `spawnEnemy()` (multiplied into
  the existing tier multiplier) and folded into `spawnBoss()`'s existing
  `powerIndex` scale (both HP and the ring-attack damage, via
  `bossPowerScale`).
- **`computeThreatTier(elapsedS)`**: a 1-5 cosmetic readout driven by the
  same curve, exposed on `GameHudState.threatTier` and via a new
  `GameCallbacks.onThreatTierUp?(tier)` fired once per tier crossed (checked
  every frame, not HUD-throttled, so the moment is precise).
- **`icons.ts`**: a new trending-up-line icon (`UI_ICON.threat`), distinct
  from the existing flame/damage icon since this is about the enemies'
  rising toughness, not the player's own damage stat.
- **`index.astro`**: a "Threat" chip added to the HUD's icon+number stat row
  (orange, next to level/kills/gems/coins), plus a small auto-hiding toast
  banner ("Threat rising — tier N") over the canvas on every `onThreatTierUp`
  call, using the project's standard remove/reflow/re-add pattern to make
  the one-shot `animate-fade-slide-in` re-triggerable on repeat tier-ups.

**Validation:** guardrails (`bun run check`) pass. Sanity-checked the curve
itself outside the browser (`node -e`): hp/damage scale = 1.00/1.00 at 0s,
2.00/1.50 at 90s (tier 3), 2.69/1.84 at 240s (tier 5, cap effectively
reached), 2.98/1.99 at 600s — confirms it's bounded, not runaway, for very
long runs. In-browser (`claude --chrome` against a fresh `astro preview`
build): the lobby/HUD/toast markup all render without console errors, and
the new "Threat 1" chip is visible immediately on run start. Live rAF
playback was suspended by the same tab-backgrounding limitation documented
throughout this file (`document.visibilityState: "hidden"`), so
`onHudUpdate`/`onThreatTierUp` firing during actual gameplay wasn't observed
directly this session — instead confirmed by replicating the exact DOM
updates those callbacks perform (HP bar → 42%, threat chip → "4", toast
text/visibility) against the real page with synthetic state, screenshotted
and visually confirmed correct; the toast's `animate-fade-slide-in` was
further checked via `el.getAnimations()[0].finish()` per this file's
established animation-verification technique, resolving to `opacity: 1` /
no residual transform as intended.

## Current state

**All 8 originally-planned phases, plus Phase 9 (composite sprite detail),
Phase 10 (level-up card / shop UI redesign), Phase 11 (visible attacks +
subtle character pass), Phase 12 (game screen visual/UI redesign +
fullscreen toggle), and Phase 13 (time-scaled enemy toughness + threat-tier
readout), all added after the fact per user request, are now implemented.**
Phases 1-3 are complete and validated end-to-end, including
Lv6 weapon evolutions. Phases 4 through 8 (real gating/lobby/results,
coins/shop/enemy tiers, audio, mobile joystick, and visual/perf polish) are
all believed correct from code review + guardrails (`bun run check` passing
at every phase) + the non-rAF-dependent UI checks described in each phase's
own validation notes — **a real rAF-driven full run was finally observed
directly in this environment during Phase 11's validation pass** (54.6s
survived, Lv5, 47 kills, zero console errors), the first time any phase
since Phase 2 has gotten past the automation tab-focus/backgrounding wall
for more than a single frame; it confirmed Phase 11's player cloak/facing-nub
rendering, live HUD weapon icons, and repeated real damage events, but
didn't happen to land a screenshot inside the ~120-220ms hit-flash/
impact-spark windows specifically (see Phase 11's own validation note), and
doesn't retroactively re-verify Phases 4-8's own callback paths (Elite
tiers, weapon evolution visuals, boss hood, the `dt` clamp) — those still
rest on code review + non-rAF checks. A future session's real human
playthrough, or another lucky focus-retaining automation run, would be the
way to close out that remaining set. GAME-DESIGN.md is fully implemented as
specced (with the small, explicitly-documented deviations noted throughout
this file, e.g. the Phase 4 per-unit-not-per-level token grant, Phase 2's
spawn-density floor/cap, Phase 8's selective-glow decision, and Phase 9's
composite-Canvas-detail scope instead of external art assets, and Phase 13's
bounded (not open-ended) time-scaling cap since run length varies with site
progress). No further phases are currently planned — Phase 11 closed out
the deferred item from Phase 10 (weapon icons in combat/HUD, the player's
visual redesign, and visible attack/impact feedback), and Phase 13 closed
out the user's balance-and-feedback report (enemies getting relatively
easier over time, and no visible signal of rising difficulty).

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
