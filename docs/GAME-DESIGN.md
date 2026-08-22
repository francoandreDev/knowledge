# In-site game: design doc

## Why this exists

A Vampire-Survivors-style game embedded in the site, used as a motivational hook for studying rather than as a standalone feature. Playing is not free — it is earned by making real progress on the curriculum, and it is designed to make the reader _want_ another study session so they can play again. This doc is the frozen design reference; nothing here is implemented yet. Implementation should follow this plan session by session, the same way curriculum units do, and any deviation discovered during implementation should be reflected back into this file so it stays authoritative.

## Core loop reference (source brief)

The five hooks the design is built around, from the original request:

1. **Ultra-simple control** — movement only, auto-attack toward the nearest enemy or a fixed direction. Zero barrier to entry.
2. **Absorption dopamine** — kills drop XP gems that don't self-collect; walking near them triggers a magnetic pull + a satisfying pickup cue (sound/visual).
3. **Exponential progress via "fate" choices** — level-up pauses the game and offers 3-4 random upgrade cards (new weapon or stat); picking an owned weapon again levels it up and changes its behavior (faster fire, extra projectile, piercing, etc.).
4. **Absolute power vs. imminent danger** — waves scale in _count_ of weak enemies, not in their HP, so the game arcs from "I'm fleeing three zombies" to "I'm a god clearing an army."
5. **Die-and-strengthen meta loop** — death is expected and rewarded: enemies also drop coins, spent on permanent run-independent upgrades after death, so no run feels wasted.

## Gating: how playing connects to studying

- Every time `ProgressToggle` marks an individual level (L1, L2, or L3) of any unit as `done`, the player earns **1 token**.
- A token is one play attempt; it is consumed when a run starts, not on death.
- Tokens accumulate **without limit and never expire** — deliberately, to reward binge study sessions with a stockpile of runs.
- Re-marking a level `done` again (e.g. after a spaced-repetition reset forces a re-take) also grants a token — this rewards review, not just first-time completion.
- Completing all three levels of a unit is what counts toward run _duration_ (see below) — a distinct, separate mechanic from token-earning.

## Run duration

`duration = base (60-90s) + 30s × (number of units with L1+L2+L3 all currently done)`, **uncapped**.

- Recalculated live at the moment a run starts, by reading the current state of `localStorage` (`progress:<track>/<unit-slug>`).
- If spaced-repetition later resets a unit (the 7/30/90-day cycle un-marks `done` and clears exercise state), the next run is shorter again until that unit is re-passed — this pushes toward keeping up with review, not only chasing new units.
- No maximum: heavy accumulated study can produce very long runs. This is intentional and is exactly what the in-run difficulty curve (below) is designed to keep meaningful rather than trivial.

## Weapons

5 weapons, each with a simple linear level progression (levels 1-5) and one automatic evolution at level 6 (no paired-passive requirement, unlike original Vampire Survivors — kept simple for this scope).

| Weapon       | Attack pattern                                     | Progression (Lv 1-5)                        | Evolution (Lv 6)                                    |
| ------------ | -------------------------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| Blade Arc    | Melee sweep toward nearest enemy                   | +attack speed, +arc width, +damage          | **Whirlwind** — continuous 360° spin                |
| Bolt         | Straight projectile at nearest enemy, pierces 1    | +fire rate, +1 projectile (spread), +pierce | **Piercing Lance** — infinite pierce, larger        |
| Orbit Shield | 1-2 shields orbiting the player, damage on contact | +1 orbiter, +rotation speed, +radius        | **Barrier Storm** — orbiters leave a damaging trail |
| Nova Pulse   | Periodic AoE burst centered on the player          | +radius, +damage, +frequency                | **Shockwave** — 2x damage + knockback               |
| Homing Dart  | Seeking projectile at a random enemy, low cooldown | +1 dart, +damage, -cooldown                 | **Swarm** — fires 5 homing darts in a spread        |

- **Max 4 of the 5 weapons equipped at once** — forces a real build decision instead of collecting everything. If the player already has 4 weapons and hasn't picked the 5th, that weapon's "new" card simply doesn't appear in the level-up pool (only upgrades/evolutions of owned weapons, plus temporary stat cards, are offered).

## Level-up card pool

Each level-up offers 3-4 random cards drawn from a combined pool:

- Owned-weapon upgrades/evolutions.
- New-weapon cards (only if fewer than 4 weapons are currently equipped).
- **Temporary, run-only stat upgrades** (stack within the run, reset on death):

| Temporary upgrade | Effect per stack                   | Max stacks |
| ----------------- | ---------------------------------- | ---------- |
| Power Surge       | +8% damage, all weapons            | 5          |
| Adrenaline        | +6% movement speed                 | 5          |
| Thick Skin        | +15% max HP (heals that % on pick) | 5          |
| Wide Reach        | +10% pickup radius                 | 4          |
| Quick Recovery    | +0.5 HP/s regen                    | 3          |
| Lucky Star        | +10% chance of an extra coin drop  | 4          |

## Enemies

5 base types + 1 boss. Difficulty scales in **enemy count**, not raw enemy toughness, so the run arcs from "fleeing a few enemies" to "clearing an army" per hook #4.

| Enemy             | Role                | Behavior                                                     |
| ----------------- | ------------------- | ------------------------------------------------------------ |
| Zombie            | Swarm filler        | Walks straight at the player, minimal HP, low contact damage |
| Bat               | Movement pressure   | Fast, erratic flight path, forces dodging                    |
| Skeleton          | Mid-threat scaling  | More HP than Zombie, same direct approach                    |
| Ghost             | First ranged threat | Fires a slow projectile, punishes standing still             |
| Ogre              | Sporadic elite      | Tanky, telegraphed slam attack, rare, better coin drop       |
| The Reaper (boss) | Run climax          | Appears once per run, high HP, 2-3 attack patterns           |

### Spawn timeline

Common-enemy unlocks use **fixed absolute time thresholds**, independent of total run duration:

- `0:00` — Zombie only
- `1:00` — Bat added to the spawn pool
- `2:00` — Skeleton added
- `3:00` — Ghost added
- `4:00` — Ogre added (elite, low spawn frequency)

A short run (60-90s) may only ever see Zombie (and maybe the start of Bat) — that's intended; it's the quick reward run, not meant to showcase the full roster. Long runs (from heavy accumulated study) see the whole roster, and time beyond 4:00 keeps increasing spawn _density_ rather than introducing new types.

**Boss uses a relative trigger, not the absolute timeline**: `boss_spawn_time = total_duration - 20s`, floored so a very short run still gets at least a real 20s boss encounter (floor at `0:20`). This guarantees every run — short or long — has a climax, independent of the fixed common-enemy schedule.

### In-run difficulty curve

Spawn density grows on an **uncapped exponential-ish curve for the full duration of the run**. Surviving to the end of the timer is never guaranteed, even with a strong build — the intended finish is a "bullet hell" moment where the enemy swarm's own growth, not just elapsed time, is the threat. No run should ever feel pre-won.

### Enemy tiers (cross-run difficulty scaling)

Rather than a single global stat multiplier tied to shop spending (which would make buying upgrades feel punished), each of the 5 base enemy types has **3 tier variants**, same sprite shape with a different tint/size:

| Tier    | Stats                                  | Visual                     |
| ------- | -------------------------------------- | -------------------------- |
| Normal  | Base stats                             | Original color             |
| Veteran | +50% HP, +30% damage                   | Darker/more saturated tint |
| Elite   | +120% HP, +60% damage, slightly larger | Distinct glow/aura         |

- **Normal tier never disappears or shrinks as a share of spawns** — the weak-fodder power fantasy stays intact regardless of shop investment.
- A `powerIndex` (sum of all permanent shop upgrade levels currently owned) gradually unlocks and weights higher tiers in the spawn roll: roughly every 15 points of `powerIndex` unlocks access to the next tier, and even at high `powerIndex` the roll stays weighted toward Normal (e.g. ~70% Normal / 22% Veteran / 8% Elite at the high end) — tougher variants are seasoning, not a replacement.
- The boss doesn't use tiers (it's unique per run) but does scale its own stats directly and unboundedly with `powerIndex` (e.g. +2% HP/damage per point) — it's the one place difficulty scales cleanly with meta-progress, since it's already meant to be the run's real test.

## Coins and the shop

- Enemies drop coins on death, collected the same way as XP gems: they don't auto-collect, the player must walk close enough to trigger the same magnetic-pull + pickup-cue mechanic (one shared pickup system for both gem types, per hook #2).
- Coins collected during a run are added to the permanent balance when the run ends (death or timer).
- The shop is reachable any time from the lobby, purchases are unlimited per session — the only natural brake is the rising per-level cost.

### Permanent upgrades (shop)

Cost per level: `cost = base × (current_level + 1)^1.5`.

| Upgrade    | Effect per level          | Max level |
| ---------- | ------------------------- | --------- |
| Vigor      | +10% max HP               | 5         |
| Fleetness  | +5% movement speed        | 5         |
| Might      | +5% damage, all weapons   | 5         |
| Magnetism  | +15% pickup radius        | 5         |
| Greed      | +10% coins earned per run | 5         |
| Amanuensis | +5% XP earned             | 5         |
| Recovery   | Passive HP regen          | 3         |

## HUD

**In-run overlay:**

- HP bar (top-left)
- XP bar + current level
- Countdown timer (remaining time in the run)
- Coins collected this run
- Equipped-weapon icons with current level, in a row

**Lobby (before a run):**

- Tokens available (the primary gate, shown large)
- Permanent coin balance
- Entry point to the shop
- If 0 tokens: a message directing the player to complete a unit level, linking to `/roadmap`

**Game over / results screen** (on death or timer expiry):

- Time survived (e.g. `2:47 / 3:30`)
- Enemies killed
- Character level reached
- Coins earned this run (already applied to the permanent balance by the time this screen shows)
- Best time survived, persisted in IndexedDB, with a "new record" callout when beaten
- Single "Back to lobby" button — no direct retry, since retrying costs another token and the lobby is where the token balance is visible

**Site nav entry:** a gamepad/joystick icon (`lucide-astro`, matching `TrackIcon`/`StatusBadge`'s visual language) with a numeric badge for available tokens — the badge only renders when tokens ≥ 1; at 0 tokens the icon shows plain, with no "0" badge, so it doesn't read as a penalty.

## Audio

Web Audio API, synthesized procedurally (oscillators/envelopes) — no external audio files, consistent with the sprite decision below. Distinct short cues for: gem/coin pickup, enemy hit, level-up, player death, weapon evolution (longer/more elaborate than a normal level-up). No background music in this scope.

## Visual style

Sprites are **plain geometric shapes drawn on Canvas** (circles/rectangles/triangles with color, a soft glow, and an outline) — no external art assets, no licensing concerns, immediate to implement. Enemy tiers (Normal/Veteran/Elite) are distinguished by tint and size rather than distinct artwork. This can be swapped for real sprite assets later without touching game logic, since rendering is a separate concern from simulation.

## Mobile controls

A dynamic virtual joystick: the base circle spawns at the exact point the player's thumb touches inside the play area, rather than living in a fixed screen zone — comfortable regardless of how the phone is held, and the genre-standard approach.

## Technical foundations

- **Game engine**: Kontra.js (lightweight, ~7kb) for the game loop, sprite pooling, vector math, and collision — avoids re-implementing that layer by hand while staying dependency-light.
- **Persistence**: IndexedDB (via a small promise wrapper, e.g. `idb`) for all game-owned state — tokens, coin balance, permanent upgrade levels, best time. The game _reads_ (never writes) the existing `localStorage` progress keys (`progress:<track>/<unit-slug>`) to compute tokens and run duration; it does not interfere with the site's existing `progress:`/`exercise:` localStorage keys.
- **Route**: a dedicated page, `src/pages/game/index.astro`.

## Open items deferred to implementation time

These are small enough to resolve inline during implementation rather than needing a dedicated design pass:

- Exact base player stats (starting HP, speed, pickup radius) and starting weapon.
- Exact tuning constants (spawn curve exponent, `powerIndex` thresholds, per-weapon numeric values) — the table above gives shape and direction, not final balance; expect to tune by playtesting once it's running.
- Whether a settings toggle (mute audio, reduce motion) is worth adding alongside the existing site's animation conventions.
