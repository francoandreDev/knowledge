// PHASE 1-3 — core loop + full enemy roster + weapon roster/leveling (see
// docs/GAME-PROGRESS.md).
//
// Phase 1 scope: player movement, one weapon (auto-fires at the nearest
// enemy), XP-gem pickup with magnetic pull, contact damage, a fixed-length
// countdown, game over.
// Phase 2 scope, layered on top: the full 5-enemy roster (Zombie/Bat/
// Skeleton/Ghost/Ogre) unlocked on a fixed absolute-time schedule, a boss
// (Reaper) triggered near the end of the run, and an exponential-ish spawn
// density ramp. Enemy tiers (Normal/Veteran/Elite) were stubbed at "always
// Normal" until Phase 5 wired them up to the shop's `powerIndex`.
// Phase 3 scope, layered on top: gems now feed a real XP/level counter;
// leveling up pauses the loop and offers 3-4 cards drawn from a pool of
// owned-weapon upgrades, new-weapon offers (max 4 equipped), and temporary
// run-only stat cards. All 5 weapons (Blade Arc, Bolt, Orbit Shield, Nova
// Pulse, Homing Dart) are implemented with real Lv1-5 progression, plus a
// Lv6 evolution per weapon (Whirlwind, Piercing Lance, Barrier Storm,
// Shockwave, Swarm) per GAME-DESIGN.md.
// Phase 4 scope, layered on top: the fixed 90s placeholder duration is gone
// — startGame() now takes the run's length in seconds from its caller (see
// GameOptions), computed live by src/lib/game/tokens.ts's
// computeRunDurationS() from the site's own progress state.
// Phase 5 scope, layered on top: coin drops/pickup (shared magnetic system
// with XP gems), enemy tiers (Normal/Veteran/Elite) weighted by the shop's
// `powerIndex`, boss HP/damage scaling with `powerIndex`, and permanent
// shop upgrade effects (src/lib/game/shop.ts) applied as run-start
// multipliers via GameOptions.
// Phase 6 scope, layered on top: synthesized SFX (src/lib/game/audio.ts) for
// pickup, enemy hit, level-up, weapon evolution, and player death.
// Phase 7 scope, layered on top: a dynamic virtual joystick (pointer events
// on the canvas — base spawns at the exact pointer-down point, not a fixed
// zone, per GAME-DESIGN.md "Mobile controls") that drives player movement
// alongside (not instead of) WASD/arrow keys.
// Phase 8 scope, layered on top: sprites switched from Kontra's default
// flat-color rectangle render to hand-drawn geometric shapes (circle/
// triangle/square/diamond) with an outline and, on select entities only
// (player, boss, elite-tier enemies), a canvas glow — see drawShape() and
// GAME-DESIGN.md "Visual style." Glow is deliberately NOT applied to every
// entity (up to 60 enemies + projectiles can be alive at once) to keep
// shadowBlur's per-draw cost bounded — a `reduceMotion` GameOption (see
// src/lib/game/settings.ts) disables all glow entirely. Also added a dt
// clamp (MAX_DT) so a real tab-backgrounding gap can't produce one huge
// catch-up frame — a gap flagged but deferred back in Phase 2.
// Phase 9 scope, layered on top: Phase 8's single-primitive drawShape()
// calls were extracted into src/lib/game/sprites.ts and given per-kind
// composite detail (eyes, wings, a hood, a coin ring, a projectile trail,
// etc.) — still pure Canvas drawing, no external image assets, per
// GAME-DESIGN.md's "Visual style" note that this swap was always expected.
// engine.ts's simulation code is untouched; only render() changed.
// Phase 10 scope, layered on top: `LevelUpCard` now carries `kind`/
// `weaponId`/`statId`/`isEvolution` (all already computed internally on
// `InternalCard`, just not previously exposed) so index.astro can pick a
// matching icon/accent color for each card without parsing `id`/`title`
// strings. `WeaponId` is now exported for the same reason. No simulation
// change — purely additive rendering metadata.
// Phase 11 scope, layered on top: "visible attacks" + a subtle character
// pass, per the user's explicit "subtle animation" scope choice (idle bob +
// hit-flash, no articulated/limb-rigged sprite). damageEnemy()/damagePlayer()
// now stamp a brief hitFlashUntil / playerHitFlashUntil (HIT_FLASH_MS), drawn
// as a white silhouette overlay in render() (see sprites.ts's flashAlpha
// param on drawShape()); damageEnemy() also drops a short-lived HitSpark at
// the hit point (drawImpactBurst() in sprites.ts) — a small radiating-line
// burst layered on top of each weapon's existing swing/burst/ring effect, so
// individual hits read as impacts even outside those. The player also gets a
// gentle idle-only sinusoidal bob (playerBobPhase, gated off while moving or
// reduceMotion is on) and a translucent trailing "cloak" silhouette
// (sprites.ts's drawCloak()) for a bit of character identity beyond a plain
// circle. index.astro's HUD weapon list was swapped from plain text to icon
// badges (reusing icons.ts's WEAPON_ICON, already built for Phase 10's
// level-up cards) so weapons are recognizable at a glance during a run, not
// just after leveling up. No collision/damage-number changes — flashes and
// sparks are purely visual, timed off the same elapsedMs the rest of the
// engine already uses.
// Phase 13 scope, layered on top: a balance fix. Until now, nothing in a
// single run made individual enemies tougher over elapsed time — the only
// time-based ramp was spawn *density* (currentSpawnIntervalMs()), while the
// player's own weapons/stat-cards compound in power every level-up. Net
// effect: the longer a run went, the easier it got, exactly backwards. Fixed
// by enemyTimeScale() — an asymptotic (never-unbounded, so an extra-long run
// from a high-progress profile can't produce absurd HP sponges) per-enemy
// HP/contact-damage multiplier keyed off elapsedS at spawn time, applied in
// spawnEnemy() and folded into spawnBoss()'s existing powerIndex scale. A
// second, purely-cosmetic readout — computeThreatTier(), exposed on
// GameHudState as threatTier and via a new onThreatTierUp callback fired
// once per tier crossed — answers the other half of the ask ("nothing tells
// the player they're facing more difficulty"): index.astro renders it as a
// HUD chip plus a brief toast on every tier-up.
// Phase 14 scope, layered on top: four gaps identified after a "what's still
// missing" review against docs/GAME-DESIGN.md and general genre conventions.
// (1) Floating damage numbers — damageEnemy() now stamps a DamageNumber at
// the hit point, rendered as rising/fading canvas text, so a hit's actual
// magnitude is visible, not just its existence (the Phase 11 flash/spark).
// (2) A low-HP warning — GameHudState.lowHp flips true at <=25% effective
// max HP; index.astro pulses a red screen vignette off it, since previously
// the only signal was reading the numeric HP bar. (3) A boss telegraph —
// GameCallbacks.onBossIncoming fires BOSS_WARNING_LEAD_S before spawnBoss()
// actually runs (the boss itself still drops in unannounced-looking without
// this), mirroring Phase 13's threat-tier toast pattern. (4) A death cause —
// damagePlayer() now records the source of the last hit that reduced the
// player to 0 HP, and endGame()/onGameOver's summary carries a human-
// readable `cause` string (describeDeathCause()) so the results screen says
// what killed the player, not just how long they lasted. Along the way,
// fixed a latent bug: the enemy-projectile collision handler always called
// damagePlayer(..., "ranged") regardless of which enemy fired it, discarding
// the projectile's own `source` (which was already being set correctly at
// fireEnemyProjectile() call sites) — this made ghost-bolt and reaper-ring
// deaths indistinguishable from each other before Phase 14 needed to tell
// them apart for the cause string.
// Phase 16 scope, layered on top: enemy intelligence tiers, enemy pack
// synergies, and weapon/upgrade synergies — see docs/GAME-PROGRESS.md's
// Phase 16 section for the full design spec this implements. (A) Reuses the
// existing 1-5 Threat Tier readout (computeThreatTier(), Phase 13) to drive
// two new real effects: spawn density drops as tier rises
// (SPAWN_INTERVAL_TIER_MULT, folded into currentSpawnIntervalMs()), and each
// base enemy kind unlocks one new behavior at a specific tier — Zombie lunge
// (T2), Skeleton bone-throw (T3), Ghost faster fire rate (T3), Bat dive
// (T4), Ogre shorter slam telegraph (T5) — all gated inline in
// updateEnemyBehavior(), additive to each kind's existing approach pattern.
// (B) A small named list of specific cross-type enemy pack synergies —
// "Hype the Ogre" (Bats halve an Ogre's slam cooldown), "Shield Wall"
// (grouped Skeletons take less damage), "Haunting Chorus" (Ghosts speed up a
// nearby Zombie) — computed on a throttled proximity scan (runSynergyScan(),
// every SYNERGY_SCAN_INTERVAL_MS, not per-frame) and given a visible tell (a
// colored outline ring, drawn in render()). (C) A small curated list of
// named weapon/upgrade synergies — "Storm Web" (Orbit Shield + Chain
// Lightning), "Overcharge" (Nova Pulse + Bolt), "Vampiric Might" (shop Might
// + any Lv6 evolution), "Twin Fangs" (Bolt + Homing Dart both Lv4+). Both B
// and C fire a shared onSynergyTriggered(name) callback once per run the
// first time each named synergy activates, mirroring the Phase 13/14
// toast pattern, so a synergy is a moment the player notices.
//
// Spawn/collision math is kept intentionally cheap (linear scans over small
// arrays, no quadtree) and the density ramp is floored at a minimum interval
// so a very long run can't degrade frame time — a deliberate simplification
// of the design doc's literally-uncapped curve, per the user's explicit
// instruction not to overload their machine.
import {
  init,
  initKeys,
  keyPressed,
  GameLoop,
  Sprite,
  type GameObject,
} from "kontra";
import { createLogger } from "./logger";
import { BIOMES, createBackdrop, type Biome } from "./scenery";
import type { UpgradeEffects } from "./shop";
import { noEffects } from "./relics";
import { lighten } from "./characters";
import {
  playPickup,
  playHit,
  playLevelUp,
  playEvolution,
  playDeath,
} from "./audio";
import {
  drawPlayer,
  drawEnemy,
  drawSwingArm,
  drawWeaponGlyph,
  WEAPON_COLOR,
  type EnemyPose,
  drawGem,
  drawCoin,
  drawProjectile,
  drawImpactBurst,
  drawOrbiter,
} from "./sprites";
import {
  BLADE_ARC_RADIUS,
  CHAIN_LIGHTNING_JUMP_DECAY,
  ORBIT_HIT_COOLDOWN_MS,
  PLAYER_HIT_COOLDOWN_MS,
  QUICK_RECOVERY_HPS,
  QUICK_RECOVERY_MAX_STACKS,
  WEAPON_MAX_LEVEL,
  bladeArcShape,
  boltShape,
  chainLightningShape,
  gravityWellShape,
  meteorRainShape,
  homingDartShape,
  novaPulseShape,
  orbitCover,
  orbitShieldShape,
  weaponDamage,
} from "./balance";
import {
  burst,
  drawBolt,
  drawBossAura,
  drawBossIntro,
  drawDamageNumber,
  drawHeartRing,
  drawHitIndicator,
  drawSlamText,
  drawWeaponSlot,
  drawDangerHalo,
  drawBigTime,
  drawBossBar,
  drawClock,
  drawCoverArc,
  drawHpBar,
  drawDashLine,
  drawEliteMarker,
  drawMeteorWarning,
  drawNovaRing,
  drawOffscreenArrow,
  drawParticles,
  drawSlamWarning,
  drawSlash,
  drawSwingWarning,
  drawWindup,
  ringPop,
  stepParticles,
  type Particle,
} from "./fx";

const log = createLogger("engine");

const PLAYER_SPEED = 160; // px/s
const PLAYER_RADIUS = 14;
const PLAYER_MAX_HP = 100;
const CONTACT_DAMAGE = 8; // fallback if an enemy def is somehow missing one

// --- Phase 7: dynamic virtual joystick ---
const JOYSTICK_MAX_RADIUS = 42; // px, in canvas-internal coordinates
const JOYSTICK_DEADZONE = 4;
const JOYSTICK_BASE_VISUAL_RADIUS = 42;
const JOYSTICK_KNOB_VISUAL_RADIUS = 18;

// --- Phase 8: perf — clamp a single frame's dt so a real tab-backgrounding
// gap (rAF suspended, then resumed) can't produce one huge catch-up step.
const MAX_DT = 1 / 15;

const PROJECTILE_SPEED = 320; // bolt's base projectile speed
const PROJECTILE_RADIUS = 4;

const GEM_RADIUS = 5;
const GEM_PICKUP_RADIUS = 90; // magnetic pull begins within this distance
const GEM_PULL_SPEED = 260;
const GEM_COLLECT_DISTANCE = 14;
const GEM_XP_VALUE = 4; // placeholder — see "Deliberate simplifications"

const DEFAULT_RUN_DURATION_S = 90; // fallback only if a caller omits durationS

// --- Phase 2: spawn density ramp ---
const BASE_SPAWN_INTERVAL_MS = 1400;
const RAMP_HALF_LIFE_S = 45; // spawn interval halves roughly every 45s
const MIN_SPAWN_INTERVAL_MS = 150; // perf floor — see file header
const MAX_ALIVE_ENEMIES = 60; // perf cap — see file header

// --- Phase 2: enemy roster --- (Phase 15 added "lich", the alternate boss)
export type EnemyKind =
  | "zombie"
  | "bat"
  | "skeleton"
  | "ghost"
  | "ogre"
  | "slime"
  | "imp"
  | "bomber"
  | "knight"
  | "boar"
  | "shaman"
  | "wasp"
  | "phantom"
  | "spitter"
  | "reaper"
  | "lich";

// --- Phase 5: enemy tiers, weighted by shop powerIndex ---
type EnemyTier = "normal" | "veteran" | "elite";
const TIER_HP_MULT: Record<EnemyTier, number> = {
  normal: 1,
  veteran: 1.5,
  elite: 2.2,
};
const TIER_DAMAGE_MULT: Record<EnemyTier, number> = {
  normal: 1,
  veteran: 1.3,
  elite: 1.6,
};
const TIER_SIZE_MULT: Record<EnemyTier, number> = {
  normal: 1,
  veteran: 1,
  elite: 1.15,
};

// --- Phase 5: coin drops ---
const COIN_RADIUS = 5;
const COIN_COLOR = "#fde047";
// Base drop chance isn't specified in GAME-DESIGN.md — resolved here at a
// value that makes coins feel steady without out-earning gems as the run's
// primary pickup. Ogre/reaper get an extra multiplier per their "better
// coin drop" flavor text.
const COIN_DROP_CHANCE_BASE = 0.3;
const COIN_VALUE_BY_TIER: Record<EnemyTier, number> = {
  normal: 1,
  veteran: 2,
  elite: 3,
};
const BETTER_DROP_KINDS = new Set<EnemyKind>(["ogre", "reaper", "lich"]);
const BETTER_DROP_VALUE_MULT = 2;

// --- Phase 5: boss scaling with powerIndex ---
const BOSS_POWER_SCALING_PER_POINT = 0.02; // +2% HP/damage per powerIndex point

// --- Phase 13: time-based enemy toughness ramp (balance fix — see file
// header). Enemy hp/contactDamage scale up asymptotically with elapsedS so a
// long run doesn't just get denser (more spawns) but also individually
// harder, countering the player's own compounding weapon/stat growth. The
// curve approaches its cap but never exceeds it, so it stays bounded however
// long a run runs (durations scale with site progress, see tokens.ts).
const ENEMY_STAT_RAMP_HALF_LIFE_S = 90;
const ENEMY_HP_SCALE_CAP = 3; // up to +200% HP by the late game
const ENEMY_DAMAGE_SCALE_CAP = 2; // up to +100% contact damage by the late game
const THREAT_TIER_COUNT = 5; // cosmetic readout, see computeThreatTier()

// --- Phase 14: floating damage numbers ---
const DAMAGE_NUMBER_DURATION_MS = 700;
const DAMAGE_NUMBER_RISE_PX = 34;
const BIG_HIT_DAMAGE = 20; // numbers at or above this render large and gold
const WINDUP_WARNING_MS = 550; // boss tell before a ring, dash or curse bolt

// --- Phase 14: low-HP screen warning ---
const LOW_HP_THRESHOLD = 0.25; // fraction of effective max HP

// --- Phase 14: boss telegraph, mirrors the Phase 13 threat-toast pattern ---
const BOSS_WARNING_LEAD_S = 4;

// --- Endless mode ---
const ENDLESS_FIRST_BOSS_S = 120;
const ENDLESS_BOSS_GAP_S = 150;
const ENDLESS_RAMP_START_S = 240; // past this the usual caps stop holding
const ENDLESS_RAMP_S = 240; // +100% HP (and +50% damage) per this much more
const ENDLESS_BOSS_HP_PER_CYCLE = 0.6;
const ENDLESS_WON_AFTER_S = 300; // surviving this long earns a chest

// 0..1, asymptotically approaching 1 — the shared curve shape driving both
// enemy stat scaling and the threat-tier readout below.
function threatRampProgress(elapsedS: number): number {
  return 1 - Math.pow(0.5, elapsedS / ENEMY_STAT_RAMP_HALF_LIFE_S);
}

function enemyTimeScale(elapsedS: number, cap: number): number {
  return 1 + (cap - 1) * threatRampProgress(elapsedS);
}

// 1-based, capped at THREAT_TIER_COUNT — purely a UI readout, doesn't itself
// drive any stat; index.astro shows it as a HUD chip + a toast on tier-up.
function computeThreatTier(elapsedS: number): number {
  const progress = threatRampProgress(elapsedS);
  return Math.min(
    THREAT_TIER_COUNT,
    1 + Math.floor(progress * THREAT_TIER_COUNT),
  );
}

interface EnemyDef {
  kind: Exclude<EnemyKind, "reaper" | "lich">;
  unlockAtS: number;
  radius: number;
  speed: number;
  hp: number;
  contactDamage: number;
  color: string;
  weight: number; // relative spawn weight once unlocked
}

const ENEMY_DEFS: EnemyDef[] = [
  {
    kind: "zombie",
    unlockAtS: 0,
    radius: 12,
    speed: 55,
    hp: 12,
    contactDamage: 8,
    color: "#4ade80",
    weight: 10,
  },
  {
    kind: "bat",
    unlockAtS: 60,
    radius: 8,
    speed: 115,
    hp: 6,
    contactDamage: 5,
    color: "#f472b6",
    weight: 6,
  },
  {
    kind: "skeleton",
    unlockAtS: 120,
    radius: 13,
    speed: 48,
    hp: 26,
    contactDamage: 10,
    color: "#e2e8f0",
    weight: 5,
  },
  {
    kind: "ghost",
    unlockAtS: 180,
    radius: 12,
    speed: 35,
    hp: 16,
    contactDamage: 6,
    color: "#a5f3fc",
    weight: 4,
  },
  {
    kind: "ogre",
    unlockAtS: 240,
    radius: 20,
    speed: 28,
    hp: 90,
    contactDamage: 14,
    color: "#f97316",
    weight: 1,
  },
  {
    kind: "slime",
    unlockAtS: 75,
    radius: 12,
    speed: 42,
    hp: 20,
    contactDamage: 6,
    color: "#84cc16",
    weight: 5,
  },
  {
    kind: "imp",
    unlockAtS: 130,
    radius: 9,
    speed: 80,
    hp: 10,
    contactDamage: 5,
    color: "#f43f5e",
    weight: 4,
  },
  {
    kind: "bomber",
    unlockAtS: 190,
    radius: 10,
    speed: 78,
    hp: 9,
    contactDamage: 3,
    color: "#fbbf24",
    weight: 3,
  },
  {
    kind: "wasp",
    unlockAtS: 90,
    radius: 6,
    speed: 125,
    hp: 4,
    contactDamage: 4,
    color: "#facc15",
    weight: 3,
  },
  {
    kind: "spitter",
    unlockAtS: 130,
    radius: 11,
    speed: 30,
    hp: 22,
    contactDamage: 4,
    color: "#65a30d",
    weight: 2,
  },
  {
    kind: "phantom",
    unlockAtS: 170,
    radius: 11,
    speed: 58,
    hp: 24,
    contactDamage: 9,
    color: "#8b5cf6",
    weight: 2,
  },
  {
    kind: "boar",
    unlockAtS: 100,
    radius: 14,
    speed: 40,
    hp: 34,
    contactDamage: 11,
    color: "#b45309",
    weight: 3,
  },
  {
    kind: "shaman",
    unlockAtS: 150,
    radius: 11,
    speed: 34,
    hp: 22,
    contactDamage: 4,
    color: "#16a34a",
    weight: 2,
  },
  {
    kind: "knight",
    unlockAtS: 260,
    radius: 16,
    speed: 30,
    hp: 70,
    contactDamage: 12,
    color: "#94a3b8",
    weight: 2,
  },
];

// The expansion's four: a slime that splits, an imp that circles and throws
// fire, a bomber that runs in and detonates, a knight that shrugs off blows.
const SLIME_SPLIT_COUNT = 2;
const SLIMELET_RADIUS = 7;
const WASP_PACK_SIZE = 4; // one spawn brings the whole swarm
const BOAR_RUSH_TRIGGER_PX = 230;
const BOAR_RUSH_COOLDOWN_MS = 3600;
const BOAR_TELEGRAPH_MS = 650;
const BOAR_RUSH_MS = 480;
const BOAR_RUSH_SPEED = 330;
const PHANTOM_BLINK_MS = 3600;
const PHANTOM_BLINK_DIST = 105;
const SPITTER_KEEP_PX = 210;
const SPITTER_INTERVAL_MS = 3400;
const SPITTER_LAND_MS = 900;
const ACID_POOL_RADIUS = 34;
const ACID_POOL_MS = 5200;
const ACID_TICK_MS = 500;
const ACID_TICK_DAMAGE = 4;
const SHAMAN_KEEP_PX = 170;
const SHAMAN_HEAL_INTERVAL_MS = 4200;
const SHAMAN_HEAL_RADIUS = 125;
const SHAMAN_HEAL_FRAC = 0.35; // of the healed enemy's full health
const IMP_ORBIT_DISTANCE = 125;
const IMP_FIRE_INTERVAL_MS = 2100;
const IMP_FIREBALL_SPEED = 150;
const IMP_FIREBALL_DAMAGE = 6;
const BOMBER_TRIGGER_PX = 46;
const BOMBER_FUSE_MS = 700;
const BOMBER_BLAST_RADIUS = 60;
const BOMBER_BLAST_DAMAGE = 18;
const KNIGHT_DAMAGE_TAKEN = 0.6; // takes 40% less from every hit

const GHOST_FIRE_INTERVAL_MS = 2200;
const GHOST_PROJECTILE_SPEED = 90;
const GHOST_PROJECTILE_DAMAGE = 7;
const GHOST_KEEP_DISTANCE = 150; // stops approaching once this close

const OGRE_SLAM_RANGE = 70;
const OGRE_SLAM_TELEGRAPH_MS = 700;
const OGRE_SLAM_DAMAGE = 22;
const OGRE_SLAM_COOLDOWN_MS = 2500;

// --- Phase 16A: enemy intelligence tiers, reusing computeThreatTier()'s
// existing 1-5 readout (see docs/GAME-PROGRESS.md's Phase 16 spec). Spawn
// density drops as tier rises (a lookup, not a formula, so each tier reads
// as a distinct step) and each base enemy kind unlocks one new behavior at
// a specific tier — gated inline in updateEnemyBehavior() below.
const SPAWN_INTERVAL_TIER_MULT: Record<number, number> = {
  1: 1.0,
  2: 1.12,
  3: 1.25,
  4: 1.45,
  5: 1.65, // ~40% fewer enemies alive at once vs tier 1, at the same elapsed time
};

const ZOMBIE_LUNGE_MIN_TIER = 2;
const ZOMBIE_LUNGE_TRIGGER_RANGE = 90; // just outside contact range
const ZOMBIE_LUNGE_COOLDOWN_MS = 3000;
const ZOMBIE_LUNGE_DURATION_MS = 350;
const ZOMBIE_LUNGE_SPEED_MULT = 2.6;
const ZOMBIE_LUNGE_AWAY_DOT_THRESHOLD = 0.4; // how "away" the player must be moving to trigger

// Enemy melee swings: Zombies claw, Skeletons club, the Reaper sweeps its
// scythe. Each stops, winds up (a readable tell on the ground and in the
// body), then hits whatever is still inside the cone. Sidestepping dodges it.
interface SwingCfg {
  minTier: number;
  range: number; // reach beyond the two bodies touching
  half: number; // half-width of the cone, radians
  windupMs: number;
  recoverMs: number;
  cooldownMs: number;
  damageMult: number; // of the enemy's contact damage
  source: string;
}
const MELEE_SWING: Partial<Record<EnemyKind, SwingCfg>> = {
  zombie: {
    minTier: 1,
    range: 30,
    half: 0.85,
    windupMs: 380,
    recoverMs: 260,
    cooldownMs: 2200,
    damageMult: 1.7,
    source: "zombie-claw",
  },
  skeleton: {
    minTier: 2,
    range: 38,
    half: 0.6,
    windupMs: 520,
    recoverMs: 320,
    cooldownMs: 2800,
    damageMult: 2.1,
    source: "skeleton-club",
  },
  knight: {
    minTier: 2,
    range: 36,
    half: 0.7,
    windupMs: 650,
    recoverMs: 380,
    cooldownMs: 3200,
    damageMult: 1.9,
    source: "knight-bash",
  },
  reaper: {
    minTier: 1,
    range: 84,
    half: 1.5,
    windupMs: 560,
    recoverMs: 300,
    cooldownMs: 3400,
    damageMult: 1.8,
    source: "reaper-sweep",
  },
};
const SHOOT_WINDUP_MS = 300; // ghosts and skeletons gather a shot before firing
const STRIKE_FOLLOW_MS = 260; // how long the body keeps reacting to a blow

const SKELETON_BONE_MIN_TIER = 3;
const SKELETON_BONE_INTERVAL_MS = 2600;
const SKELETON_BONE_SPEED = 100;
const SKELETON_BONE_DAMAGE = 6;

const GHOST_FIRE_MIN_TIER = 3;
const GHOST_FIRE_INTERVAL_TIER3_MS = 1400; // shortened from GHOST_FIRE_INTERVAL_MS

const BAT_DIVE_MIN_TIER = 4;
const BAT_DIVE_COOLDOWN_MS = 3500;
const BAT_DIVE_DURATION_MS = 450;
const BAT_DIVE_SPEED = 260;

const OGRE_TELEGRAPH_MIN_TIER = 5;
const OGRE_SLAM_TELEGRAPH_TIER5_MS = 380; // shortened from OGRE_SLAM_TELEGRAPH_MS

// --- Phase 16B: enemy pack synergies — a small named, curated list of
// specific cross-type proximity buffs, checked on a throttled scan pass
// (not every frame) rather than per-pair every tick, per this project's
// perf posture (see file header). Each has a visible tell drawn in
// render() (a colored outline ring on the buffed enemy) and fires
// onSynergyTriggered() once per run the first time it activates.
const SYNERGY_SCAN_INTERVAL_MS = 300;
const HYPE_OGRE_RADIUS = 90;
const HYPE_OGRE_MIN_BATS = 2;
const HYPE_OGRE_COOLDOWN_MULT = 0.5;
const SHIELD_WALL_RADIUS = 40;
const SHIELD_WALL_MIN_SKELETONS = 2; // including the skeleton being checked
const SHIELD_WALL_DAMAGE_REDUCTION = 0.2;
const HAUNTING_CHORUS_RADIUS = 100;
const HAUNTING_CHORUS_MIN_GHOSTS = 2;
const HAUNTING_CHORUS_SPEED_MULT = 1.4;

const REAPER_RADIUS = 26;
const REAPER_SPEED = 42;
const REAPER_HP = 420;
const REAPER_CONTACT_DAMAGE = 16;
const REAPER_RING_COUNT = 10;
const REAPER_RING_DAMAGE = 9;
const REAPER_RING_PROJECTILE_SPEED = 130;
const REAPER_RING_INTERVAL_MS = 4000;
const REAPER_DASH_INTERVAL_MS = 6000;
const REAPER_DASH_SPEED = 230;
const REAPER_DASH_DURATION_MS = 500;
const REAPER_COLOR = "#c026d3";

// --- Phase 15: the Lich, an alternate boss unlocked by picking the
// run-time "Embrace Necromancy" ability card (itself gated by the shop's
// Necromancy unlock). Deliberately different stats and attack shape from
// the Reaper, not just a palette swap: lower HP and no dash (a slower,
// more stationary threat), a single slow-but-homing curse bolt instead of
// a non-homing ring burst, and periodic weak-minion summons instead of a
// second attack pattern of its own — see spawnBoss()/updateEnemyBehavior().
const LICH_RADIUS = 24;
const LICH_SPEED = 46;
const LICH_HP = 300;
const LICH_CONTACT_DAMAGE = 10;
const LICH_CURSE_INTERVAL_MS = 3200;
const LICH_CURSE_DAMAGE = 16;
const LICH_CURSE_SPEED = 110;
const LICH_CURSE_TURN_RATE = 2.2; // rad/s — slower turn than a homing dart, dodgeable
const LICH_SUMMON_INTERVAL_MS = 7000;
const LICH_SUMMON_COUNT = 2;
const LICH_MINION_HP_MULT = 0.5; // weak — pressure, not a real threat on their own
const LICH_MINION_DAMAGE_MULT = 0.6;
const LICH_COLOR = "#22c55e";

const EP_RADIUS = 5; // enemy projectile radius (ghost bolts, reaper ring, lich curse)

// --- Phase 3: weapon roster --- (Phase 15 added "chainLightning", locked
// behind the shop's Chain Lightning unlock — see BASE_WEAPON_IDS below)
export type WeaponId =
  | "bladeArc"
  | "bolt"
  | "orbitShield"
  | "novaPulse"
  | "homingDart"
  | "chainLightning"
  | "meteorRain"
  | "gravityWell";

// The 5 weapons every run starts eligible for, per the original roster.
// Chain Lightning is deliberately excluded — it only joins a run's
// available new-weapon pool (startGame()'s `availableWeaponIds`) via
// GameOptions.unlockedWeaponIds, once bought in the shop (shop.ts's
// UnlockId "chainLightning"). The Record lookup tables below (name/flavor/
// icon) still need a "chainLightning" entry regardless — WeaponId includes
// it, and those are typed as Record<WeaponId, ...>.
const BASE_WEAPON_IDS: WeaponId[] = [
  "bladeArc",
  "bolt",
  "orbitShield",
  "novaPulse",
  "homingDart",
];

const WEAPON_NAMES: Record<WeaponId, string> = {
  bladeArc: "Blade Arc",
  bolt: "Bolt",
  orbitShield: "Orbit Shield",
  novaPulse: "Nova Pulse",
  homingDart: "Homing Dart",
  chainLightning: "Chain Lightning",
  meteorRain: "Meteor Rain",
  gravityWell: "Gravity Well",
};

const WEAPON_FLAVOR: Record<WeaponId, string> = {
  bladeArc: "Melee sweep toward the nearest enemy.",
  bolt: "Straight projectile at the nearest enemy, pierces at higher levels.",
  orbitShield:
    "Shields orbit you, damaging what they touch and soaking hits from their side.",
  novaPulse: "Periodic AoE burst centered on you.",
  homingDart: "Seeking projectile that homes in on a random enemy.",
  chainLightning: "Strikes the nearest enemy, then arcs to nearby enemies.",
  meteorRain: "Marks ground under enemies; a rock lands there a beat later.",
  gravityWell: "Opens a well on the thickest crowd that drags enemies in.",
};

const UPGRADE_BLURB: Record<WeaponId, string> = {
  bladeArc: "+attack speed, +arc width, +damage",
  bolt: "+fire rate, +1 projectile (at higher levels), +pierce",
  orbitShield: "+orbiter, +cover, +rotation speed, +radius",
  novaPulse: "+radius, +damage, +frequency",
  homingDart: "+dart, +damage, -cooldown",
  chainLightning: "+damage, +fire rate, +chain jumps",
  meteorRain: "+damage, +faster fall, +rocks, +blast size",
  gravityWell: "+damage, +reach, +duration, -cooldown",
};

const EVOLVED_NAMES: Record<WeaponId, string> = {
  bladeArc: "Whirlwind",
  bolt: "Piercing Lance",
  orbitShield: "Barrier Storm",
  novaPulse: "Shockwave",
  homingDart: "Swarm",
  chainLightning: "Storm Chain",
  meteorRain: "Starfall",
  gravityWell: "Singularity",
};

const EVOLUTION_BLURB: Record<WeaponId, string> = {
  bladeArc: "Continuous 360° spin — hits everything in range, no facing needed",
  bolt: "Infinite pierce, larger bolt",
  orbitShield: "Orbiters leave a damaging trail behind them",
  novaPulse: "2x damage + knockback on burst",
  homingDart: "Fires 5 homing darts in a spread",
  chainLightning: "Unlimited chain jumps within range",
  meteorRain: "Five huge rocks per volley, with a tremor on landing",
  gravityWell: "A huge, long-lived well that crushes everything inward",
};

const MAX_EQUIPPED_WEAPONS = 4;

const ARC_EFFECT_DURATION_MS = 180;

const ORBIT_VISUAL_RADIUS = 6;
const ORBIT_TRAIL_DROP_INTERVAL_MS = 80; // Barrier Storm evolution (Lv6)
const ORBIT_TRAIL_LIFETIME_MS = 900;
const ORBIT_TRAIL_VISUAL_RADIUS = 5;

const SHOCKWAVE_KNOCKBACK = 40; // Nova Pulse evolution (Lv6)

const PULSE_EFFECT_DURATION_MS = 300;
const WELL_RANGE = 380; // wells open on crowds within this of the player
const METEOR_RANGE = 420; // enemies further than this are not marked

// Phase 11: shared "just got hit" feedback — a brief white flash on the hit
// entity itself, plus a small radiating spark burst at the hit point. Same
// duration for both so they read as one moment, not two staggered effects.
const HIT_FLASH_MS = 120;
const HIT_SPARK_DURATION_MS = 220;

const HOMING_DART_SPEED = 200;
const HOMING_DART_TURN_RATE = 4; // rad/s

// --- Phase 15: Chain Lightning, the locked 6th weapon (see
// BASE_WEAPON_IDS above) ---
const CHAIN_LIGHTNING_JUMP_RANGE = 140; // max distance to the next unhit enemy
const CHAIN_EFFECT_DURATION_MS = 200;

// --- Phase 16C: weapon/upgrade synergies — a small curated named list
// (not generic emergent stacking), per docs/GAME-PROGRESS.md's Phase 16
// spec. Each fires onSynergyTriggered() once per run the first time it
// activates, reusing the same toast mechanism as the enemy pack synergies.
const STORM_WEB_EXTRA_JUMP_DECAY = CHAIN_LIGHTNING_JUMP_DECAY; // Chain Lightning + Orbit Shield
const OVERCHARGE_BOLT_COUNT = 3; // Bolt + Nova Pulse
const OVERCHARGE_BOLT_DAMAGE_MULT = 0.6;
const VAMPIRIC_MIGHT_MIN_LEVEL = 3; // shop "Might" level, out of maxLevel 5
const VAMPIRIC_MIGHT_HEAL = 3; // flat HP per evolved-weapon kill
const TWIN_FANGS_MIN_LEVEL = 4; // Bolt + Homing Dart, both at Lv4+
const TWIN_FANGS_INTERVAL_MS = 2000;

// --- Phase 3: temporary (run-only) stat cards ---
interface TempStatDef {
  id: string;
  label: string;
  effect: string;
  maxStacks: number;
}

const TEMP_STATS: TempStatDef[] = [
  {
    id: "powerSurge",
    label: "Power Surge",
    effect: "+8% damage, all weapons",
    maxStacks: 5,
  },
  {
    id: "adrenaline",
    label: "Adrenaline",
    effect: "+6% movement speed",
    maxStacks: 5,
  },
  {
    id: "thickSkin",
    label: "Thick Skin",
    effect: "+15% max HP (heals that % on pick)",
    maxStacks: 5,
  },
  {
    id: "wideReach",
    label: "Wide Reach",
    effect: "+10% pickup radius",
    maxStacks: 4,
  },
  {
    id: "quickRecovery",
    label: "Quick Recovery",
    effect: `+${QUICK_RECOVERY_HPS} HP/s regen`,
    maxStacks: QUICK_RECOVERY_MAX_STACKS,
  },
  {
    id: "luckyStar",
    label: "Lucky Star",
    effect: "+10% chance of an extra coin drop",
    maxStacks: 4,
  },
  {
    id: "ironSkin",
    label: "Iron Skin",
    effect: "Ignore 4% of damage taken",
    maxStacks: 5,
  },
  {
    id: "quickDraw",
    label: "Quick Draw",
    effect: "+6% weapon speed",
    maxStacks: 5,
  },
  {
    id: "keenEye",
    label: "Keen Eye",
    effect: "+5% chance of a double-damage hit",
    maxStacks: 5,
  },
  {
    id: "bloodthirst",
    label: "Bloodthirst",
    effect: "Heal 0.2 HP per kill",
    maxStacks: 4,
  },
  {
    id: "chill",
    label: "Chill",
    effect: "Enemies move 4% slower",
    maxStacks: 4,
  },
  {
    id: "scholar",
    label: "Scholar",
    effect: "+6% XP from gems",
    maxStacks: 5,
  },
  {
    id: "spikes",
    label: "Spikes",
    effect: "Reflect 10% of contact damage",
    maxStacks: 4,
  },
];

export interface LevelUpCard {
  id: string;
  // Phase 10: exposed so the page can pick a matching icon/accent without
  // parsing `id`/`title` strings — see src/lib/game/icons.ts. Phase 15
  // added "ability" — a one-time, non-stacking, non-leveled pick (currently
  // just "Embrace Necromancy") that changes run-scoped state rather than a
  // weapon or a stat, see applyCard()'s "ability" branch.
  kind: "weaponUpgrade" | "newWeapon" | "stat" | "ability";
  weaponId?: WeaponId;
  statId?: string;
  isEvolution?: boolean;
  title: string;
  description: string;
  /** Weapon cards: the level now (0 when the weapon is not owned yet). */
  fromLevel?: number;
  /** Stat cards: stacks owned now and the most it can reach. */
  stacks?: number;
  maxStacks?: number;
}

/** What the run has so far, shown beside the level-up cards. */
export interface LevelUpBuild {
  level: number;
  weapons: {
    id: WeaponId;
    name: string;
    level: number;
    maxLevel: number;
    evolvedName: string;
  }[];
  stats: {
    id: string;
    label: string;
    effect: string;
    stacks: number;
    maxStacks: number;
  }[];
}

export interface GameHudState {
  hp: number;
  maxHp: number;
  timeRemaining: number;
  kills: number;
  gems: number;
  coins: number;
  status: "running" | "gameover" | "levelup";
  level: number;
  xp: number;
  xpToNext: number;
  weapons: {
    id: WeaponId;
    level: number;
    /** Enemies this weapon has killed this run. */
    kills: number;
    /** Damage this weapon has actually dealt (overkill excluded). */
    damage: number;
  }[];
  /** Seconds survived so far — lets the lab turn totals into rates. */
  elapsedS: number;
  /** HP regenerated per second right now (cards + shop). */
  regenPerS: number;
  /** Phase 13: 1-based, capped at 5 — cosmetic readout of enemyTimeScale()'s
   * underlying ramp, so the player sees difficulty rising, not just feels it. */
  threatTier: number;
  /** Phase 14: true once HP drops to LOW_HP_THRESHOLD of effective max HP —
   * drives index.astro's pulsing screen vignette. */
  lowHp: boolean;
}

export interface GameCallbacks {
  onHudUpdate: (state: GameHudState) => void;
  onGameOver: (summary: {
    survivedS: number;
    kills: number;
    level: number;
    coinsEarned: number;
    /** Phase 14: human-readable — "Survived the full run" for a timer
     * ending, or "Caught by a Zombie"/etc. for a death. See
     * describeDeathCause(). */
    cause: string;
    /** Survived the whole run: this is what earns a chest. */
    won: boolean;
    /** The boss fell during the run: a golden chest instead of a wooden one. */
    bossDefeated: boolean;
  }) => void;
  onLevelUp: (
    cards: LevelUpCard[],
    choose: (cardId: string) => void,
    build: LevelUpBuild,
  ) => void;
  /** Phase 13: fired once per threat tier crossed (1→2, 2→3, ...) — lets the
   * page show a brief "getting harder" toast at the moment it happens. */
  onThreatTierUp?: (tier: number) => void;
  /** Phase 14: fired once, BOSS_WARNING_LEAD_S before the boss actually
   * spawns — lets the page show a telegraph banner ahead of the drop-in. */
  onBossIncoming?: () => void;
  /** Phase 16: fired once per named synergy (enemy pack or weapon/upgrade),
   * the first time it activates in a run — lets the page show a discovery
   * toast, mirroring the threat-tier/boss-incoming pattern above. */
  onSynergyTriggered?: (name: string) => void;
}

export interface GameOptions {
  /** Total run length in seconds — see tokens.ts's computeRunDurationS(). */
  /** Endless mode: no timer, bosses return every few minutes and enemies keep
   * getting tougher; the run ends only when you fall. */
  endless?: boolean;
  durationS?: number;
  /** Permanent shop upgrade multipliers — see shop.ts's getUpgradeEffects(). */
  upgradeEffects?: UpgradeEffects;
  /** Sum of owned shop upgrade levels — drives enemy-tier weighting and
   * boss scaling. See shop.ts's computePowerIndex(). */
  powerIndex?: number;
  /** Disables all canvas glow (shadowBlur) effects — see settings.ts's
   * isReducedMotion(). Phase 8. */
  reduceMotion?: boolean;
  /** Phase 15: weapons beyond the base 5 (BASE_WEAPON_IDS) available in
   * this run's new-weapon level-up offers — currently just
   * ["chainLightning"] once shop.ts's Chain Lightning unlock is owned. */
  unlockedWeaponIds?: WeaponId[];
  /** Phase 15: whether the "Embrace Necromancy" ability card can appear in
   * this run's level-up pool — gated by shop.ts's Necromancy unlock. */
  abilityUnlocked?: boolean;
  /** Phase 16C: the shop's owned "Might" level (0-5) — drives the "Vampiric
   * Might" weapon synergy's threshold check. See shop.ts's
   * getUpgradeLevel("might"). */
  mightLevel?: number;
  /** Balance lab: one weapon at a chosen level, nothing can hurt the player,
   * enemies can't come closer than `standoffPx` (surface to surface), and an
   * optional constant HP drain stands in for incoming damage so recovery can
   * be felt against a known rate. No level-ups, no rewards. */
  training?: TrainingOptions;
  /** Start with this weapon at this level instead of a level-1 Bolt. The lab
   * implies it from `training`; balance measurements set it on real runs. */
  startingWeapon?: { id: WeaponId; level: number };
  /** Benchmarks only: spawn this many times faster, so a fixed-length run is
   * a dense wave a weapon can't fully clear (kills stop saturating). */
  spawnRateMult?: number;
  /** Backing-store pixels per world pixel (default 1). */
  renderScale?: number;
  /** The ground this run is fought on; random when omitted. */
  biome?: Biome;
}

export interface TrainingOptions {
  weaponId: WeaponId;
  weaponLevel: number;
  standoffPx: number;
  drainPerS: number;
}

interface Enemy extends GameObject {
  kind: EnemyKind;
  tier: EnemyTier;
  hp: number;
  alive: boolean;
  radius: number;
  contactDamage: number;
  color: string;
  // bat
  wigglePhase?: number;
  // ghost
  lastRangedAt?: number;
  // ogre
  chargeUntil?: number;
  chargeStartedAt?: number; // for the slam warning's fill
  maxHp?: number; // bosses only: for the health bar
  slamReadyAt?: number;
  baseWidth?: number;
  baseHeight?: number;
  // reaper
  lastRingAt?: number;
  lastDashAt?: number;
  dashUntil?: number;
  dashDx?: number;
  dashDy?: number;
  // lich (Phase 15) — lastRangedAt (above) doubles as its curse-bolt timer
  lastSummonAt?: number;
  // orbit shield hit cooldown (Phase 3)
  lastOrbitHitAt?: number;
  // Phase 11: brief white hit-flash, see HIT_FLASH_MS
  hitFlashUntil?: number;
  // Phase 16A: zombie lunge (tier 2+)
  lungeUntil?: number;
  lastLungeAt?: number;
  lungeDx?: number;
  lungeDy?: number;
  // Phase 16A: bat dive (tier 4+) — reuses wigglePhase for the wiggle-approach
  diveUntil?: number;
  lastDiveAt?: number;
  diveDx?: number;
  diveDy?: number;
  // Phase 16B: enemy pack synergy buff flags, recomputed every
  // SYNERGY_SCAN_INTERVAL_MS by runSynergyScan() — see the Enemy Pack
  // Synergies section of updateEnemyBehavior()/damageEnemy().
  hypedByBats?: boolean; // ogre: halved slam cooldown
  shieldWalled?: boolean; // skeleton: reduced damage taken
  chorusBuffed?: boolean; // zombie: speed boost
  // Melee swings and gathered shots (see MELEE_SWING / SHOOT_WINDUP_MS)
  swing?: {
    kind: "melee" | "shoot";
    startedAt: number;
    angle: number;
    struck: boolean;
  };
  swingReadyAt?: number;
  strikeAt?: number; // when the last blow or shot landed, for the body's follow-through
  seed?: number; // desyncs the idle animation of neighbours
  spawnedAt?: number; // for the pop-in
  phase?: number; // bosses: 1-3, rises as HP falls
  mini?: boolean; // slimelets from a split slime don't split again
  fuseAt?: number; // bomber: when the lit fuse goes off
  fuseStartedAt?: number;
  // boar: telegraphed straight-line rush
  rushAt?: number; // end of the telegraph
  rushUntil?: number;
  lastRushAt?: number;
  rushDx?: number;
  rushDy?: number;
  // shaman: heal pulse timer
  lastHealAt?: number;
  // phantom: next blink
  lastBlinkAt?: number;
}

// What is left behind where an enemy died: it plays out a death animation.
interface Corpse {
  kind: EnemyKind;
  x: number;
  y: number;
  radius: number;
  color: string;
  at: number;
  life: number;
  dir: number;
  boss: boolean;
  nextBlastAt: number;
}
interface Projectile extends GameObject {
  ttl: number;
  alive: boolean;
  damage: number;
  source: string;
  color: string;
  pierceRemaining?: number;
  hitSet?: Set<Enemy>;
  homingTarget?: Enemy;
  turnRate?: number;
  // Phase 15: enemy-side homing (the lich's curse bolt) — steers toward the
  // player's live position every frame, unlike homingTarget/turnRate above
  // which lock onto a captured Enemy at fire time (player-side weapons only).
  homingPlayer?: boolean;
}
interface Gem extends GameObject {
  alive: boolean;
  color: string;
}
interface CoinPickup extends GameObject {
  alive: boolean;
  value: number;
  color: string;
}

interface WeaponRuntime {
  id: WeaponId;
  level: number;
  lastActionAt: number;
  orbitAngle?: number;
}

interface ArcEffect {
  x: number;
  y: number;
  angle: number;
  halfArc: number;
  radius: number;
  createdAt: number;
}

interface PulseEffect {
  x: number;
  y: number;
  radius: number;
  createdAt: number;
  color?: string;
}

interface OrbitTrailPoint {
  x: number;
  y: number;
  createdAt: number;
}

// Phase 11: a small impact-spark burst at a weapon-hit point, see
// HIT_SPARK_DURATION_MS and sprites.ts's drawImpactBurst().
interface HitSpark {
  x: number;
  y: number;
  createdAt: number;
  color?: string;
}

// Phase 14: a rising/fading damage amount at the hit point, layered on top
// of Phase 11's hit-flash + spark so a hit's magnitude is visible, not just
// its occurrence.
interface DamageNumber {
  x: number;
  y: number;
  amount: number;
  createdAt: number;
}

// Phase 15: a fading line segment between two chain-lightning jump points —
// same lifecycle pattern as ArcEffect/PulseEffect above.
interface ChainEffect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  createdAt: number;
}

interface InternalCard {
  id: string;
  kind: "weaponUpgrade" | "newWeapon" | "stat" | "ability";
  weaponId?: WeaponId;
  statId?: string;
  isEvolution?: boolean;
  title: string;
  description: string;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizeAngle(a: number): number {
  let angle = a;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function xpForNextLevel(level: number): number {
  return 20 + (level - 1) * 12;
}

function spawnEdgePosition(canvas: { width: number; height: number }) {
  const side = Math.floor(Math.random() * 4);
  let x: number;
  let y: number;
  if (side === 0) {
    x = -20;
    y = Math.random() * canvas.height;
  } else if (side === 1) {
    x = canvas.width + 20;
    y = Math.random() * canvas.height;
  } else if (side === 2) {
    x = Math.random() * canvas.width;
    y = -20;
  } else {
    x = Math.random() * canvas.width;
    y = canvas.height + 20;
  }
  return { x, y };
}

function currentSpawnIntervalMs(elapsedS: number): number {
  const interval =
    BASE_SPAWN_INTERVAL_MS * Math.pow(0.5, elapsedS / RAMP_HALF_LIFE_S);
  // Phase 16A: spawn density drops as threat tier rises — a smarter/more
  // dangerous roster means fewer enemies on screen, not more of them.
  const tierMult = SPAWN_INTERVAL_TIER_MULT[computeThreatTier(elapsedS)] ?? 1;
  return Math.max(MIN_SPAWN_INTERVAL_MS, interval * tierMult);
}

function pickEnemyDef(elapsedS: number): EnemyDef {
  const unlocked = ENEMY_DEFS.filter((d) => d.unlockAtS <= elapsedS);
  const totalWeight = unlocked.reduce((sum, d) => sum + d.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const def of unlocked) {
    roll -= def.weight;
    if (roll <= 0) return def;
  }
  return unlocked[unlocked.length - 1];
}

// Every 15 points of powerIndex unlocks the next tier; weights ramp up
// gradually and plateau near GAME-DESIGN.md's "~70/22/8 at the high end"
// example (reached close to the max obtainable powerIndex, 33).
function pickEnemyTier(powerIndex: number): EnemyTier {
  const veteranWeight =
    powerIndex >= 15 ? Math.min(0.22, 0.02 * (powerIndex - 15)) : 0;
  const eliteWeight =
    powerIndex >= 30 ? Math.min(0.08, 0.01 * (powerIndex - 30)) : 0;
  const normalWeight = 1 - veteranWeight - eliteWeight;
  const roll = Math.random();
  if (roll < eliteWeight) return "elite";
  if (roll < eliteWeight + veteranWeight) return "veteran";
  void normalWeight;
  return "normal";
}

// Phase 14: turns the raw damageEnemy/damagePlayer `source` string used
// throughout for logging into a human-readable death cause for the results
// screen. `source` values come from contact hits ("contact:<kind>"), ranged
// enemy attacks (fireEnemyProjectile's own `source` param — "ghost",
// "reaper-ring"), and the ogre's telegraphed slam ("ogre-slam").
const DEATH_CAUSE_BY_SOURCE: Record<string, string> = {
  "contact:zombie": "Caught by a Zombie",
  "contact:bat": "Caught by a Bat",
  "contact:skeleton": "Caught by a Skeleton",
  "contact:ghost": "Caught by a Ghost",
  "contact:ogre": "Crushed by an Ogre",
  "contact:slime": "Smothered by a Slime",
  "contact:imp": "Scorched by an Imp",
  "contact:bomber": "Caught by a Bomber",
  "contact:knight": "Crushed by a Knight",
  "contact:boar": "Gored by a Boar",
  "contact:shaman": "Caught by a Shaman",
  "contact:wasp": "Stung by a Wasp",
  "contact:phantom": "Haunted by a Phantom",
  "contact:spitter": "Caught by a Spitter",
  "acid-pool": "Dissolved in acid",
  "bomber-blast": "Blown up by a Bomber",
  "imp-fire": "Burned by imp fire",
  "knight-bash": "Bashed by a Knight",
  "contact:reaper": "Caught by the Reaper",
  "contact:lich": "Caught by the Lich",
  "ogre-slam": "Flattened by an Ogre's slam",
  ghost: "Struck by ghost fire",
  "reaper-ring": "Caught in the Reaper's ring",
  "lich-curse": "Cursed by the Lich",
  "skeleton-bone": "Struck by a thrown bone", // Phase 16A
  "zombie-claw": "Clawed by a Zombie",
  "skeleton-club": "Clubbed by a Skeleton",
  "reaper-sweep": "Cut down by the Reaper's scythe",
};

function describeDeathCause(
  reason: "death" | "timer",
  source: string | null,
): string {
  if (reason === "timer") return "Survived the full run";
  return (source && DEATH_CAUSE_BY_SOURCE[source]) || "Defeated";
}

// Darkens/saturates a "#rrggbb" color for the Veteran tint (per
// GAME-DESIGN.md's "darker/more saturated tint").
function darkenHexColor(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((n >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (n & 0xff) * (1 - amount));
  return `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
}

export function startGame(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
  options: GameOptions = {},
) {
  // The world is always canvas size / renderScale: the page can raise the
  // backing resolution for a sharper picture without changing the playfield.
  const renderScale = options.renderScale ?? 1;
  const WORLD_W = canvas.width / renderScale;
  const WORLD_H = canvas.height / renderScale;
  const endless = options.endless ?? false;
  // Past the usual ramp, endless keeps climbing: nothing is ever "late game".
  const endlessExtra = (elapsedS: number) =>
    endless ? Math.max(0, elapsedS - ENDLESS_RAMP_START_S) / ENDLESS_RAMP_S : 0;
  const hpScaleAt = (elapsedS: number) =>
    enemyTimeScale(elapsedS, ENEMY_HP_SCALE_CAP) + endlessExtra(elapsedS);
  const damageScaleAt = (elapsedS: number) =>
    enemyTimeScale(elapsedS, ENEMY_DAMAGE_SCALE_CAP) +
    endlessExtra(elapsedS) * 0.5;
  const runDurationS = endless
    ? Infinity
    : (options.durationS ?? DEFAULT_RUN_DURATION_S);
  const biome: Biome =
    options.biome ?? BIOMES[Math.floor(Math.random() * BIOMES.length)];
  const backdrop = createBackdrop(
    WORLD_W,
    WORLD_H,
    renderScale,
    biome,
    Math.floor(Math.random() * 1e9),
  );
  const upgradeEffects: UpgradeEffects = options.upgradeEffects ?? noEffects();
  const powerIndex = options.powerIndex ?? 0;
  const reduceMotion = options.reduceMotion ?? false;
  // Phase 15: which weapons this run's new-weapon offers can draw from, and
  // whether the ability card can appear — both gated by shop.ts unlocks.
  const availableWeaponIds: WeaponId[] = [
    ...BASE_WEAPON_IDS,
    ...(options.unlockedWeaponIds ?? []),
  ];
  const abilityUnlocked = options.abilityUnlocked ?? false;
  const mightLevel = options.mightLevel ?? 0;
  log.log("startGame() called", {
    width: WORLD_W,
    height: WORLD_H,
    runDurationS,
    powerIndex,
    upgradeEffects,
    reduceMotion,
  });

  const { context } = init(canvas);
  initKeys();

  const player = Sprite({
    x: WORLD_W / 2,
    y: WORLD_H / 2,
    width: PLAYER_RADIUS * 2,
    height: PLAYER_RADIUS * 2,
    anchor: { x: 0.5, y: 0.5 },
    color: "#38bdf8",
  }) as unknown as GameObject & { hp: number; lastHitAt: number };
  player.hp = PLAYER_MAX_HP;
  player.lastHitAt = -Infinity;
  let playerFacingAngle = -Math.PI / 2; // Phase 9: sprite orientation, faces up by default
  let playerHitFlashUntil = -Infinity; // Phase 11
  let playerBobPhase = 0; // Phase 11: idle-only bob, see the render()-side gating on playerIsIdle
  let playerIsIdle = true;

  // --- Phase 7: dynamic virtual joystick (pointer events on the canvas) ---
  interface JoystickState {
    pointerId: number;
    originX: number;
    originY: number;
    curX: number;
    curY: number;
  }
  let joystick: JoystickState | null = null;

  function clientToCanvasPoint(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = WORLD_W / rect.width;
    const scaleY = WORLD_H / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function handlePointerDown(ev: PointerEvent) {
    if (joystick) return; // one active touch at a time
    const { x, y } = clientToCanvasPoint(ev.clientX, ev.clientY);
    joystick = {
      pointerId: ev.pointerId,
      originX: x,
      originY: y,
      curX: x,
      curY: y,
    };
    canvas.setPointerCapture(ev.pointerId);
    log.log("joystick:start", { x: Math.round(x), y: Math.round(y) });
  }

  function handlePointerMove(ev: PointerEvent) {
    if (!joystick || ev.pointerId !== joystick.pointerId) return;
    const { x, y } = clientToCanvasPoint(ev.clientX, ev.clientY);
    const dx = x - joystick.originX;
    const dy = y - joystick.originY;
    const dist = Math.hypot(dx, dy);
    if (dist > JOYSTICK_MAX_RADIUS) {
      const scale = JOYSTICK_MAX_RADIUS / dist;
      joystick.curX = joystick.originX + dx * scale;
      joystick.curY = joystick.originY + dy * scale;
    } else {
      joystick.curX = x;
      joystick.curY = y;
    }
  }

  function endJoystick(ev: PointerEvent) {
    if (joystick && ev.pointerId === joystick.pointerId) {
      joystick = null;
      log.log("joystick:end");
    }
  }

  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", endJoystick);
  canvas.addEventListener("pointercancel", endJoystick);
  canvas.addEventListener("pointerleave", endJoystick);

  const enemies: Enemy[] = [];
  const projectiles: Projectile[] = [];
  const enemyProjectiles: Projectile[] = [];
  const gems: Gem[] = [];
  const coinPickups: CoinPickup[] = [];
  const arcEffects: ArcEffect[] = [];
  const corpses: Corpse[] = [];
  const hitIndicators: { angle: number; at: number }[] = [];
  const banners: { text: string; sub: string; at: number; color: string }[] =
    [];
  let lastAttack: { id: WeaponId; at: number; angle: number } | null = null;
  let bossIntro: { name: string; sub: string; at: number } | null = null;
  const enemyStrikes: {
    x: number;
    y: number;
    range: number;
    angle: number;
    half: number;
    at: number;
  }[] = [];
  const pulseEffects: PulseEffect[] = [];
  // Spitter acid: a marked landing spot, then a puddle that burns whoever
  // stands in it.
  // Gravity Well: a vortex that drags the crowd in while it ticks damage.
  const gravityWells: {
    x: number;
    y: number;
    radius: number;
    damage: number;
    startedAt: number;
    endsAt: number;
    tickMs: number;
    pullPxPerS: number;
    lastTickAt: number;
  }[] = [];
  const acidShots: { x: number; y: number; startedAt: number }[] = [];
  const acidPools: {
    x: number;
    y: number;
    until: number;
    lastTickAt: number;
  }[] = [];
  // Meteor Rain: marked ground waiting for its rock to land.
  const meteorStrikes: {
    x: number;
    y: number;
    radius: number;
    damage: number;
    startedAt: number;
    delayMs: number;
  }[] = [];
  const orbitTrails: OrbitTrailPoint[] = [];
  const hitSparks: HitSpark[] = [];
  const damageNumbers: DamageNumber[] = []; // Phase 14
  const chainEffects: ChainEffect[] = []; // Phase 15, chain lightning jumps
  // Combat feedback (fx.ts). The lab turns shake and hit-stop off so they
  // can't skew what it measures.
  const particles: Particle[] = [];
  const feedbackOn = !reduceMotion && !options.training;
  let shakeMag = 0;
  let shakeUntil = 0;
  let hitStopMs = 0;
  // A "beat": a short freeze that shows the time left, fired when the clock
  // triggers something (threat tier, boss, whole minutes, the last seconds).
  let beatMs = 0;
  let beatTotalMs = 1;
  let lastBeatMark = Infinity;
  function startBeat(ms = 850) {
    if (!feedbackOn || beatMs > 0) return;
    beatMs = ms;
    beatTotalMs = ms;
  }
  let lastOrbitTrailDropAt = -Infinity;
  let orbiterPositions: { x: number; y: number }[] = [];
  // Where the orbiters are, as bearings from the player, and what they cover.
  let orbiterBearings: number[] = [];
  let orbitCoverNow: { reduction: number; halfArcRad: number } | null = null;

  // --- Phase 3: weapons, leveling, run-only stat modifiers ---
  const training = options.training;
  const startingWeapon =
    options.startingWeapon ??
    (training
      ? { id: training.weaponId, level: training.weaponLevel }
      : { id: "bolt" as WeaponId, level: 1 });
  const ownedWeapons: WeaponRuntime[] = [
    {
      id: startingWeapon.id,
      level: Math.min(WEAPON_MAX_LEVEL, Math.max(1, startingWeapon.level)),
      lastActionAt: 0,
    },
  ];
  // Per-weapon kill and damage counters. Synergy hits with no single owner
  // (Storm Web, Overcharge) are credited to the weapon that triggered them.
  const weaponStats: Partial<
    Record<WeaponId, { kills: number; damage: number }>
  > = {};
  const SYNERGY_SOURCE_OWNER: Record<string, WeaponId> = {
    stormWeb: "orbitShield",
    overcharge: "novaPulse",
  };
  let playerLevel = 1;
  let xp = 0;
  let pendingLevelUps = 0;
  let lastDrawnCards: Map<string, InternalCard> = new Map();
  const statStacks: Record<string, number> = {};
  let damageMult = 1;
  let speedMult = 1;
  let maxHpBonus = 0;
  let pickupRadiusMult = 1;
  let hpRegenPerS = 0;
  let extraCoinChance = 0; // stacked by the Lucky Star temp-stat card
  // Run-only stacks from the expansion's cards, added to the shop/relic totals.
  let armorTemp = 0;
  let hasteTemp = 0;
  let critTemp = 0;
  let killHealTemp = 0;
  let slowTemp = 0;
  let xpTemp = 0;
  let thornsTemp = 0;
  let revivesLeft = upgradeEffects.reviveHpFrac > 0 ? 1 : 0;
  let bossDefeated = false;

  function effectiveMaxHp(): number {
    return PLAYER_MAX_HP * upgradeEffects.maxHpMult + maxHpBonus;
  }

  function totalDamageMult(): number {
    return damageMult * upgradeEffects.damageMult;
  }

  let elapsedMs = 0;
  let lastSpawnAt = 0;
  let kills = 0;
  let gemsCollected = 0;
  let coinsCollected = 0; // raw total, before shop's Greed multiplier
  let status: GameHudState["status"] = "running";
  let hudAccumulatorMs = 0;
  const HUD_UPDATE_INTERVAL_MS = 100; // throttle DOM writes, not every frame

  // Endless: the first boss at 2 minutes, then one after each fall (or 3
  // minutes after the last arrival), each tougher than the one before.
  let bossSpawnAtS = endless
    ? ENDLESS_FIRST_BOSS_S
    : Math.max(20, runDurationS - 20);
  let bossCycle = 0;
  let bossSpawned = false;
  let bossWarned = false; // Phase 14
  let bossPowerScale = 1; // set by spawnBoss(), used to scale ring damage too
  const unlockedPools = new Set<string>();
  let lastThreatTier = 1; // Phase 13
  let lastDamageSource: string | null = null; // Phase 14, see describeDeathCause()
  // Phase 15: which boss spawnBoss() spawns — flipped to "lich" once the
  // player picks the "Embrace Necromancy" ability card mid-run.
  let bossVariant: "reaper" | "lich" = "reaper";
  // Phase 16: player's current-frame velocity (0 while idle) — read by the
  // zombie lunge's "is the player moving away" check, set alongside the
  // existing movement block below.
  let playerVelX = 0;
  let playerVelY = 0;
  // Phase 16B/C: which named synergies (pack or weapon) have fired at least
  // once this run — gates the one-time discovery toast per name.
  const triggeredSynergies = new Set<string>();
  let lastSynergyScanAt = -Infinity;
  let lastTwinFangsAt = -Infinity; // Phase 16C

  function maybeTriggerSynergy(name: string) {
    if (triggeredSynergies.has(name)) return;
    triggeredSynergies.add(name);
    callbacks.onSynergyTriggered?.(name);
    log.log("synergy:triggered", { name });
  }

  function pushHud() {
    callbacks.onHudUpdate({
      hp: player.hp,
      maxHp: effectiveMaxHp(),
      timeRemaining: Math.max(0, runDurationS - elapsedMs / 1000),
      kills,
      gems: gemsCollected,
      coins: coinsCollected,
      status,
      level: playerLevel,
      xp,
      xpToNext: xpForNextLevel(playerLevel),
      weapons: ownedWeapons.map((w) => ({
        id: w.id,
        level: w.level,
        kills: weaponStats[w.id]?.kills ?? 0,
        damage: Math.round(weaponStats[w.id]?.damage ?? 0),
      })),
      elapsedS: elapsedMs / 1000,
      regenPerS: hpRegenPerS + upgradeEffects.regenPerS,
      threatTier: computeThreatTier(elapsedMs / 1000),
      lowHp: player.hp > 0 && player.hp / effectiveMaxHp() <= LOW_HP_THRESHOLD,
    });
  }

  function spawnEnemy(
    elapsedS: number,
    packMate?: { def: EnemyDef; x: number; y: number },
  ) {
    if (enemies.length >= MAX_ALIVE_ENEMIES) {
      log.log("spawn skipped, at MAX_ALIVE_ENEMIES cap", enemies.length);
      return;
    }
    const def = packMate?.def ?? pickEnemyDef(elapsedS);
    if (!unlockedPools.has(def.kind)) {
      unlockedPools.add(def.kind);
      log.log("pool:unlocked", { kind: def.kind, atS: elapsedS.toFixed(1) });
    }
    const tier = pickEnemyTier(powerIndex + (endless ? elapsedS / 12 : 0));
    const { x, y } =
      packMate ?? spawnEdgePosition({ width: WORLD_W, height: WORLD_H });
    const sizeMult = TIER_SIZE_MULT[tier];
    const timeHpScale = hpScaleAt(elapsedS);
    const timeDamageScale = damageScaleAt(elapsedS);
    const sprite = Sprite({
      x,
      y,
      width: def.radius * 2 * sizeMult,
      height: def.radius * 2 * sizeMult,
      anchor: { x: 0.5, y: 0.5 },
      color: tier === "veteran" ? darkenHexColor(def.color, 0.35) : def.color,
    }) as unknown as Enemy;
    sprite.kind = def.kind;
    sprite.tier = tier;
    sprite.hp = def.hp * TIER_HP_MULT[tier] * timeHpScale;
    sprite.alive = true;
    sprite.radius = def.radius * sizeMult;
    sprite.contactDamage =
      def.contactDamage * TIER_DAMAGE_MULT[tier] * timeDamageScale;
    sprite.wigglePhase = Math.random() * Math.PI * 2;
    sprite.lastRangedAt = elapsedMs;
    sprite.slamReadyAt = elapsedMs;
    sprite.baseWidth = sprite.width;
    sprite.baseHeight = sprite.height;
    sprite.spawnedAt = elapsedMs;
    enemies.push(sprite);
    if (!reduceMotion) {
      ringPop(particles, x, y, def.color, def.radius * 2.4);
      burst(particles, x, y, def.color, 3, 70);
    }
    if (def.kind === "wasp" && !packMate) {
      for (let i = 1; i < WASP_PACK_SIZE; i++) {
        spawnEnemy(elapsedS, {
          def,
          x: x + (Math.random() - 0.5) * 60,
          y: y + (Math.random() - 0.5) * 60,
        });
      }
    }
    log.log("spawn:enemy", {
      kind: def.kind,
      tier,
      x: Math.round(x),
      y: Math.round(y),
      aliveCount: enemies.length,
    });
  }

  function spawnBoss() {
    const powerScale = 1 + BOSS_POWER_SCALING_PER_POINT * powerIndex;
    const elapsedS = elapsedMs / 1000;
    const timeHpScale = hpScaleAt(elapsedS);
    const timeDamageScale = damageScaleAt(elapsedS);
    const isLich = bossVariant === "lich";
    const radius = isLich ? LICH_RADIUS : REAPER_RADIUS;
    const baseHp = isLich ? LICH_HP : REAPER_HP;
    const baseContactDamage = isLich
      ? LICH_CONTACT_DAMAGE
      : REAPER_CONTACT_DAMAGE;
    const sprite = Sprite({
      x: WORLD_W / 2,
      y: -40,
      width: radius * 2,
      height: radius * 2,
      anchor: { x: 0.5, y: 0.5 },
      color: isLich ? LICH_COLOR : REAPER_COLOR,
    }) as unknown as Enemy;
    sprite.kind = isLich ? "lich" : "reaper";
    sprite.tier = "normal"; // the boss is unique per run, not tiered
    sprite.hp =
      baseHp *
      powerScale *
      timeHpScale *
      (1 + ENDLESS_BOSS_HP_PER_CYCLE * bossCycle);
    sprite.maxHp = sprite.hp;
    sprite.alive = true;
    sprite.radius = radius;
    sprite.contactDamage = baseContactDamage * powerScale * timeDamageScale;
    sprite.lastRingAt = elapsedMs; // reaper ring timer
    sprite.lastDashAt = elapsedMs; // reaper dash timer
    sprite.lastRangedAt = elapsedMs; // lich curse-bolt timer (shared field, see Enemy interface)
    sprite.lastSummonAt = elapsedMs; // lich summon timer
    sprite.phase = 1;
    sprite.spawnedAt = elapsedMs;
    enemies.push(sprite);
    bossSpawned = true;
    bossIntro = {
      name: isLich ? "THE LICH" : "THE REAPER",
      sub: isLich ? "master of the dead" : "your time is up",
      at: elapsedMs,
    };
    if (feedbackOn) {
      shakeMag = 6;
      shakeUntil = elapsedMs + 520;
    }
    // Phase 13: ring/curse damage now also reflects the time-based ramp, not
    // just powerIndex — folded into this one scale so
    // updateEnemyBehavior()'s existing `... * bossPowerScale` reads need no
    // per-variant change.
    bossPowerScale = powerScale * timeDamageScale * (1 + 0.3 * bossCycle);
    log.log("boss:spawned", {
      variant: bossVariant,
      hp: sprite.hp,
      contactDamage: sprite.contactDamage,
      powerIndex,
      atS: (elapsedMs / 1000).toFixed(1),
    });
  }

  // Phase 15: the Lich's periodic weak-minion summon — reuses the Zombie
  // EnemyDef's shape/speed but at reduced HP/damage (LICH_MINION_*_MULT) so
  // they're pressure, not a real threat on their own; spawned near the
  // Lich's own position rather than the map edge, since they're meant to
  // immediately close on the player.
  function spawnMinion(x: number, y: number, elapsedS: number) {
    if (enemies.length >= MAX_ALIVE_ENEMIES) return;
    const def = ENEMY_DEFS.find((d) => d.kind === "zombie")!;
    const timeHpScale = hpScaleAt(elapsedS);
    const timeDamageScale = damageScaleAt(elapsedS);
    const sprite = Sprite({
      x,
      y,
      width: def.radius * 2,
      height: def.radius * 2,
      anchor: { x: 0.5, y: 0.5 },
      color: LICH_COLOR,
    }) as unknown as Enemy;
    sprite.kind = "zombie";
    sprite.tier = "normal";
    sprite.hp = def.hp * LICH_MINION_HP_MULT * timeHpScale;
    sprite.alive = true;
    sprite.radius = def.radius;
    sprite.contactDamage =
      def.contactDamage * LICH_MINION_DAMAGE_MULT * timeDamageScale;
    sprite.wigglePhase = Math.random() * Math.PI * 2;
    sprite.lastRangedAt = elapsedMs;
    sprite.slamReadyAt = elapsedMs;
    sprite.spawnedAt = elapsedMs;
    enemies.push(sprite);
    log.log("lich:summon", { x: Math.round(x), y: Math.round(y) });
  }

  // The shaman's pulse: every hurt enemy near it regains a share of its health.
  function healAround(shaman: Enemy) {
    const elapsedS = elapsedMs / 1000;
    const timeHpScale = hpScaleAt(elapsedS);
    for (const o of enemies) {
      if (!o.alive || o === shaman || o.kind === "reaper" || o.kind === "lich")
        continue;
      if (distance(shaman, o) > SHAMAN_HEAL_RADIUS) continue;
      const def = ENEMY_DEFS.find((d) => d.kind === o.kind);
      if (!def) continue;
      const full =
        def.hp * TIER_HP_MULT[o.tier] * timeHpScale * (o.mini ? 0.3 : 1);
      if (o.hp >= full) continue;
      o.hp = Math.min(full, o.hp + full * SHAMAN_HEAL_FRAC);
      if (!reduceMotion)
        burst(particles, o.x, o.y - o.radius, "#86efac", 4, 90);
    }
    pulseEffects.push({
      x: shaman.x,
      y: shaman.y,
      radius: SHAMAN_HEAL_RADIUS,
      createdAt: elapsedMs,
      color: "#4ade80",
    });
  }

  // A slime that dies splits into smaller, weaker ones that fan outward.
  function spawnSlimelets(from: Enemy) {
    const def = ENEMY_DEFS.find((d) => d.kind === "slime")!;
    const elapsedS = elapsedMs / 1000;
    const timeHpScale = hpScaleAt(elapsedS);
    const timeDamageScale = damageScaleAt(elapsedS);
    const start = Math.random() * Math.PI * 2;
    for (let i = 0; i < SLIME_SPLIT_COUNT; i++) {
      if (enemies.length >= MAX_ALIVE_ENEMIES) return;
      const a = start + (i / SLIME_SPLIT_COUNT) * Math.PI * 2;
      const sprite = Sprite({
        x: from.x + Math.cos(a) * from.radius * 0.8,
        y: from.y + Math.sin(a) * from.radius * 0.8,
        width: SLIMELET_RADIUS * 2,
        height: SLIMELET_RADIUS * 2,
        anchor: { x: 0.5, y: 0.5 },
        color: lighten(def.color, 0.25),
      }) as unknown as Enemy;
      sprite.kind = "slime";
      sprite.mini = true;
      sprite.tier = "normal";
      sprite.hp = def.hp * 0.3 * timeHpScale;
      sprite.alive = true;
      sprite.radius = SLIMELET_RADIUS;
      sprite.contactDamage = def.contactDamage * 0.7 * timeDamageScale;
      sprite.wigglePhase = Math.random() * Math.PI * 2;
      sprite.lastRangedAt = elapsedMs;
      sprite.slamReadyAt = elapsedMs;
      sprite.spawnedAt = elapsedMs;
      enemies.push(sprite);
    }
    if (!reduceMotion) burst(particles, from.x, from.y, def.color, 8, 150);
  }

  // The bomber's blast: hurts the hero if close, and flings the rest of the
  // crowd a little — the bomber itself is spent.
  function detonateBomber(e: Enemy) {
    e.alive = false;
    leaveCorpse(e, false);
    const reach = BOMBER_BLAST_RADIUS + PLAYER_RADIUS;
    if (distance(player, e) <= reach) {
      damagePlayer(
        BOMBER_BLAST_DAMAGE * damageScaleAt(elapsedMs / 1000),
        "bomber-blast",
        e.x,
        e.y,
      );
    }
    if (!reduceMotion) {
      ringPop(particles, e.x, e.y, "#fbbf24", BOMBER_BLAST_RADIUS * 1.2);
      burst(particles, e.x, e.y, "#fb923c", 18, 240);
      burst(particles, e.x, e.y, "#fef08a", 10, 140);
    }
    if (feedbackOn) {
      shakeMag = 5;
      shakeUntil = elapsedMs + 260;
    }
    log.log("bomber:detonate");
  }

  function findNearestEnemy(): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = distance(player, e);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  // Phase 16C: normalizes a damage `source` string back to the WeaponId
  // that dealt it (where one exists) — used by Vampiric Might to check the
  // owning weapon's level. "orbitShield-trail" is Barrier Storm's own trail
  // hits; synergy-only sources (stormWeb/overcharge) intentionally have no
  // single owning weapon and return null.
  const WEAPON_ID_SOURCES = new Set<string>([
    "bladeArc",
    "bolt",
    "orbitShield",
    "novaPulse",
    "homingDart",
    "chainLightning",
    "meteorRain",
    "gravityWell",
  ]);
  function weaponIdForSource(source: string): WeaponId | null {
    const normalized = source === "orbitShield-trail" ? "orbitShield" : source;
    return WEAPON_ID_SOURCES.has(normalized) ? (normalized as WeaponId) : null;
  }

  // Each weapon lands its own kind of hit.
  function impactFx(e: Enemy, source: string) {
    switch (weaponIdForSource(source)) {
      case "bolt":
        burst(particles, e.x, e.y, "#facc15", 5, 190);
        break;
      case "homingDart":
        burst(particles, e.x, e.y, "#f472b6", 4, 140);
        ringPop(particles, e.x, e.y, "#f9a8d4", e.radius * 1.4);
        break;
      case "chainLightning":
        burst(particles, e.x, e.y, "#67e8f9", 6, 230);
        break;
      case "meteorRain":
        burst(particles, e.x, e.y, "#fdba74", 7, 210);
        break;
      case "gravityWell":
        burst(particles, e.x, e.y, "#c4b5fd", 2, 70);
        break;
      case "novaPulse":
        ringPop(particles, e.x, e.y, "#fb923c", e.radius * 2);
        burst(particles, e.x, e.y, "#fed7aa", 3, 120);
        break;
      case "bladeArc":
        burst(particles, e.x, e.y, "#f5d0fe", 5, 250);
        ringPop(particles, e.x, e.y, "#e879f9", e.radius * 1.6);
        break;
      case "orbitShield":
        burst(particles, e.x, e.y, "#fde047", 3, 120);
        break;
      default:
        burst(particles, e.x, e.y, "#ffffff", 2, 90);
    }
  }

  function leaveCorpse(e: Enemy, isBoss: boolean) {
    corpses.push({
      kind: e.kind,
      x: e.x,
      y: e.y,
      radius: e.radius,
      color: e.color,
      at: elapsedMs,
      life: isBoss ? 1500 : e.kind === "ogre" ? 600 : 420,
      dir: Math.random() < 0.5 ? -1 : 1,
      boss: isBoss,
      nextBlastAt: elapsedMs,
    });
    if (reduceMotion) return;
    if (e.kind === "skeleton") burst(particles, e.x, e.y, "#f8fafc", 8, 210);
    else if (e.kind === "ogre")
      ringPop(particles, e.x, e.y, "#d6d3d1", e.radius * 3.2);
    else if (e.kind === "ghost") burst(particles, e.x, e.y, "#cffafe", 6, 80);
  }

  function damageEnemy(e: Enemy, amount: number, source: string) {
    const crit = upgradeEffects.critChance + critTemp;
    if (
      crit > 0 &&
      (weaponIdForSource(source) ?? SYNERGY_SOURCE_OWNER[source]) &&
      Math.random() < crit
    ) {
      amount *= 2;
    }
    if (e.kind === "knight") amount *= KNIGHT_DAMAGE_TAKEN;
    // Phase 16B: "Shield Wall" — 2+ adjacent skeletons take reduced damage
    // while grouped, see runSynergyScan().
    const finalAmount = e.shieldWalled
      ? amount * (1 - SHIELD_WALL_DAMAGE_REDUCTION)
      : amount;
    const dealt = Math.min(finalAmount, Math.max(0, e.hp));
    e.hp -= finalAmount;
    const owner =
      weaponIdForSource(source) ?? SYNERGY_SOURCE_OWNER[source] ?? null;
    if (owner) {
      const stats = (weaponStats[owner] ??= { kills: 0, damage: 0 });
      stats.damage += dealt;
      if (e.hp <= 0 && e.alive) stats.kills += 1;
    }
    e.hitFlashUntil = elapsedMs + HIT_FLASH_MS;
    hitSparks.push({
      x: e.x,
      y: e.y,
      createdAt: elapsedMs,
      color: WEAPON_COLOR[source.replace("-trail", "") as WeaponId],
    });
    if (!reduceMotion) impactFx(e, source);
    damageNumbers.push({
      x: e.x,
      y: e.y - e.radius,
      amount: finalAmount,
      createdAt: elapsedMs,
    });
    playHit();
    log.log("hit:enemy", { kind: e.kind, source, remainingHp: e.hp });
    if (e.maxHp && e.hp > 0) {
      const frac = e.hp / e.maxHp;
      const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
      if (phase > (e.phase ?? 1)) {
        e.phase = phase;
        banners.push({
          text: phase === 2 ? "PHASE 2" : "ENRAGED!",
          sub: phase === 2 ? "it is getting serious" : "it will not stop",
          at: elapsedMs,
          color: phase === 2 ? "#f0abfc" : "#fb7185",
        });
        if (!reduceMotion) {
          burst(
            particles,
            e.x,
            e.y,
            phase === 2 ? "#f0abfc" : "#fb7185",
            24,
            280,
          );
          ringPop(particles, e.x, e.y, "#fde047", e.radius * 5);
        }
        if (feedbackOn) {
          shakeMag = 6;
          shakeUntil = elapsedMs + 400;
          hitStopMs = 110;
        }
      }
    }
    if (e.hp <= 0 && e.alive) {
      e.alive = false;
      kills += 1;
      const isBoss = e.kind === "reaper" || e.kind === "lich";
      if (!reduceMotion) {
        burst(
          particles,
          e.x,
          e.y,
          e.color,
          isBoss ? 34 : e.tier === "elite" ? 16 : 9,
          isBoss ? 260 : 170,
        );
        ringPop(particles, e.x, e.y, e.color, e.radius * (isBoss ? 5 : 2.6));
      }
      if (feedbackOn) {
        if (isBoss) {
          shakeMag = 7;
          shakeUntil = elapsedMs + 450;
          hitStopMs = 120;
        } else if (e.tier === "elite") {
          shakeMag = 3;
          shakeUntil = elapsedMs + 160;
          hitStopMs = 45;
        }
      }
      log.log("kill:enemy", { kind: e.kind, source, totalKills: kills });
      leaveCorpse(e, isBoss);
      spawnGem(e.x, e.y);
      maybeSpawnCoin(e);
      if (e.kind === "reaper" || e.kind === "lich") {
        bossDefeated = true;
        log.log("boss:defeated", { variant: e.kind });
        if (endless) {
          // The next one is already on its way, and it is not the same boss.
          bossCycle += 1;
          bossSpawned = false;
          bossWarned = false;
          bossSpawnAtS = elapsedMs / 1000 + ENDLESS_BOSS_GAP_S;
          bossVariant = bossVariant === "reaper" ? "lich" : "reaper";
        }
      }
      const healPerKill = upgradeEffects.killHeal + killHealTemp;
      if (healPerKill > 0) {
        player.hp = Math.min(effectiveMaxHp(), player.hp + healPerKill);
      }
      if (e.kind === "slime" && !e.mini) spawnSlimelets(e);
      // Phase 16C: "Vampiric Might" — Might at VAMPIRIC_MIGHT_MIN_LEVEL+ and
      // the killing weapon at its Lv6 evolution heals a small flat amount.
      const wid = weaponIdForSource(source);
      if (wid && mightLevel >= VAMPIRIC_MIGHT_MIN_LEVEL) {
        const killingWeapon = ownedWeapons.find((ow) => ow.id === wid);
        if (killingWeapon && killingWeapon.level >= WEAPON_MAX_LEVEL) {
          player.hp = Math.min(
            effectiveMaxHp(),
            player.hp + VAMPIRIC_MIGHT_HEAL,
          );
          maybeTriggerSynergy("Vampiric Might");
        }
      }
    }
  }

  // Phase 16C: "Storm Web" — owning both Chain Lightning and Orbit Shield
  // makes orbiter hits also trigger one extra chain jump to the nearest
  // other alive enemy near the hit point, reusing chainEffects' visual.
  function stormWebJump(from: Enemy, baseDamage: number) {
    let next: Enemy | null = null;
    let nextDist = CHAIN_LIGHTNING_JUMP_RANGE;
    for (const o of enemies) {
      if (!o.alive || o === from) continue;
      const d = distance(from, o);
      if (d <= nextDist) {
        nextDist = d;
        next = o;
      }
    }
    if (!next) return;
    maybeTriggerSynergy("Storm Web");
    damageEnemy(next, baseDamage * STORM_WEB_EXTRA_JUMP_DECAY, "stormWeb");
    chainEffects.push({
      x1: from.x,
      y1: from.y,
      x2: next.x,
      y2: next.y,
      createdAt: elapsedMs,
    });
  }

  // Phase 16B: enemy pack synergies — a throttled proximity scan (see
  // SYNERGY_SCAN_INTERVAL_MS) rather than a per-pair check every frame, per
  // this project's "cheap primitives, no spatial partition" perf posture.
  // Recomputes each buff flag from scratch every scan, so a synergy turns
  // off automatically once its trigger condition no longer holds.
  function runSynergyScan() {
    for (const e of enemies) {
      if (!e.alive) continue;
      e.hypedByBats = false;
      e.shieldWalled = false;
      e.chorusBuffed = false;
    }
    for (const e of enemies) {
      if (!e.alive) continue;
      if (e.kind === "ogre") {
        let bats = 0;
        for (const o of enemies) {
          if (o.alive && o.kind === "bat" && distance(e, o) <= HYPE_OGRE_RADIUS)
            bats += 1;
        }
        if (bats >= HYPE_OGRE_MIN_BATS) {
          e.hypedByBats = true;
          maybeTriggerSynergy("Hype the Ogre");
        }
      } else if (e.kind === "skeleton") {
        let nearby = 0;
        for (const o of enemies) {
          if (
            o !== e &&
            o.alive &&
            o.kind === "skeleton" &&
            distance(e, o) <= SHIELD_WALL_RADIUS
          )
            nearby += 1;
        }
        if (nearby >= SHIELD_WALL_MIN_SKELETONS - 1) {
          e.shieldWalled = true;
          maybeTriggerSynergy("Shield Wall");
        }
      } else if (e.kind === "zombie") {
        let ghosts = 0;
        for (const o of enemies) {
          if (
            o.alive &&
            o.kind === "ghost" &&
            distance(e, o) <= HAUNTING_CHORUS_RADIUS
          )
            ghosts += 1;
        }
        if (ghosts >= HAUNTING_CHORUS_MIN_GHOSTS) {
          e.chorusBuffed = true;
          maybeTriggerSynergy("Haunting Chorus");
        }
      }
    }
  }

  function maybeSpawnCoin(e: Enemy) {
    const dropChance = COIN_DROP_CHANCE_BASE + extraCoinChance;
    if (Math.random() >= dropChance) return;
    let value = COIN_VALUE_BY_TIER[e.tier];
    if (BETTER_DROP_KINDS.has(e.kind)) value *= BETTER_DROP_VALUE_MULT;
    spawnCoin(e.x, e.y, value);
  }

  // Phase 15: Chain Lightning's jump logic — strikes `first`, then keeps
  // jumping to the nearest not-yet-hit enemy within CHAIN_LIGHTNING_JUMP_RANGE
  // of the last-hit enemy, up to `maxJumps` total hits, each successive jump
  // dealing CHAIN_LIGHTNING_JUMP_DECAY less damage than the one before it
  // (balance: hitting N enemies at full damage each would out-damage every
  // single-target weapon at the same level). Draws a fading ChainEffect line
  // per jump so the arc is visible, not just its damage numbers.
  function chainLightningStrike(
    first: Enemy,
    baseDamage: number,
    maxJumps: number,
  ) {
    const hit = new Set<Enemy>();
    let from: { x: number; y: number } = player;
    let current: Enemy | null = first;
    let jumpDamage = baseDamage;
    let jumps = 0;
    while (current && jumps < maxJumps) {
      damageEnemy(current, jumpDamage, "chainLightning");
      chainEffects.push({
        x1: from.x,
        y1: from.y,
        x2: current.x,
        y2: current.y,
        createdAt: elapsedMs,
      });
      hit.add(current);
      from = current;
      jumpDamage *= CHAIN_LIGHTNING_JUMP_DECAY;
      jumps += 1;
      let next: Enemy | null = null;
      let nextDist = CHAIN_LIGHTNING_JUMP_RANGE;
      for (const e of enemies) {
        if (!e.alive || hit.has(e)) continue;
        const d = distance(current, e);
        if (d <= nextDist) {
          nextDist = d;
          next = e;
        }
      }
      current = next;
    }
  }

  function spawnPlayerProjectile(
    angle: number,
    speed: number,
    damage: number,
    pierce: number,
    source: string,
    sizeMult = 1,
  ): Projectile {
    const projectile = Sprite({
      x: player.x,
      y: player.y,
      width: PROJECTILE_RADIUS * 2 * sizeMult,
      height: PROJECTILE_RADIUS * 2 * sizeMult,
      anchor: { x: 0.5, y: 0.5 },
      color: source === "homingDart" ? "#38bdf8" : "#fbbf24",
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
    }) as unknown as Projectile;
    projectile.ttl = 2;
    projectile.alive = true;
    projectile.damage = damage;
    projectile.pierceRemaining = pierce;
    projectile.hitSet = new Set();
    projectile.source = source;
    projectiles.push(projectile);
    log.log("weapon:fire", { source, damage, pierce });
    return projectile;
  }

  function fireEnemyProjectile(
    from: { x: number; y: number },
    angle: number,
    speed: number,
    damage: number,
    source: string,
    homingPlayer = false,
  ): Projectile {
    const projectile = Sprite({
      x: from.x,
      y: from.y,
      width: EP_RADIUS * 2,
      height: EP_RADIUS * 2,
      anchor: { x: 0.5, y: 0.5 },
      color: homingPlayer ? LICH_COLOR : "#f87171",
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
    }) as unknown as Projectile;
    projectile.ttl = homingPlayer ? 6 : 3; // curse bolt is slow, needs longer to reach
    projectile.alive = true;
    projectile.damage = damage;
    projectile.source = source;
    projectile.homingPlayer = homingPlayer;
    enemyProjectiles.push(projectile);
    log.log("fire:enemyProjectile", { source, damage, homingPlayer });
    return projectile;
  }

  function spawnGem(x: number, y: number) {
    const gem = Sprite({
      x,
      y,
      width: GEM_RADIUS * 2,
      height: GEM_RADIUS * 2,
      anchor: { x: 0.5, y: 0.5 },
      color: "#a78bfa",
    }) as unknown as Gem;
    gem.alive = true;
    gems.push(gem);
  }

  function spawnCoin(x: number, y: number, value: number) {
    const coin = Sprite({
      x,
      y,
      width: COIN_RADIUS * 2,
      height: COIN_RADIUS * 2,
      anchor: { x: 0.5, y: 0.5 },
      color: COIN_COLOR,
    }) as unknown as CoinPickup;
    coin.alive = true;
    coin.value = value;
    coinPickups.push(coin);
  }

  function damagePlayer(
    amount: number,
    source: string,
    fromX?: number,
    fromY?: number,
  ) {
    if (training) return; // the lab never hurts the player
    // The Orbit Shield soaks hits that arrive from an orbiter's side.
    if (orbitCoverNow && fromX !== undefined && fromY !== undefined) {
      const bearing = Math.atan2(fromY - player.y, fromX - player.x);
      for (let i = 0; i < orbiterBearings.length; i++) {
        let diff = Math.abs(bearing - orbiterBearings[i]);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff <= orbitCoverNow.halfArcRad) {
          amount *= 1 - orbitCoverNow.reduction;
          if (!reduceMotion) {
            burst(
              particles,
              orbiterPositions[i].x,
              orbiterPositions[i].y,
              "#facc15",
              5,
              110,
            );
          }
          break;
        }
      }
    }
    amount *= 1 - Math.min(0.6, upgradeEffects.armor + armorTemp);
    player.hp = Math.max(0, player.hp - amount);
    playerHitFlashUntil = elapsedMs + HIT_FLASH_MS;
    if (fromX !== undefined && fromY !== undefined) {
      hitIndicators.push({
        angle: Math.atan2(fromY - player.y, fromX - player.x),
        at: elapsedMs,
      });
    }
    if (!reduceMotion) burst(particles, player.x, player.y, "#fb7185", 7, 140);
    if (feedbackOn) {
      shakeMag = Math.min(8, 3 + amount / 6);
      shakeUntil = elapsedMs + 220;
    }
    lastDamageSource = source;
    log.log("player:damaged", { amount, source, hpRemaining: player.hp });
    if (player.hp <= 0 && revivesLeft > 0) {
      // Phoenix Feather: rise again once, and shove the crowd back.
      revivesLeft -= 1;
      player.hp = effectiveMaxHp() * upgradeEffects.reviveHpFrac;
      player.lastHitAt = elapsedMs + 1500; // brief grace
      for (const e of enemies) {
        if (!e.alive) continue;
        const d = distance(player, e);
        if (d < 160 && e.kind !== "reaper" && e.kind !== "lich") {
          const a = Math.atan2(e.y - player.y, e.x - player.x);
          e.x += Math.cos(a) * 90;
          e.y += Math.sin(a) * 90;
        }
      }
      banners.push({
        text: "SECOND WIND",
        sub: "the phoenix feather burns away",
        at: elapsedMs,
        color: "#fdba74",
      });
      if (!reduceMotion) {
        ringPop(particles, player.x, player.y, "#fb923c", 150);
        burst(particles, player.x, player.y, "#fde047", 26, 260);
      }
      log.log("player:revived", { hp: player.hp });
      return;
    }
    if (player.hp <= 0) {
      playDeath();
      endGame("death");
    }
  }

  function addXp(amount: number) {
    if (training) return; // the lab tests one weapon at one level
    xp += amount;
    let leveledUp = false;
    while (xp >= xpForNextLevel(playerLevel)) {
      xp -= xpForNextLevel(playerLevel);
      playerLevel += 1;
      pendingLevelUps += 1;
      leveledUp = true;
    }
    if (leveledUp) {
      playLevelUp();
      if (!reduceMotion) {
        ringPop(particles, player.x, player.y, "#fde047", 90);
        burst(particles, player.x, player.y, "#fde047", 14, 200);
      }
      log.log("player:levelup", { newLevel: playerLevel, pendingLevelUps });
    }
  }

  function applyStatEffect(statId: string) {
    switch (statId) {
      case "powerSurge":
        damageMult += 0.08;
        break;
      case "adrenaline":
        speedMult += 0.06;
        break;
      case "thickSkin": {
        const inc = PLAYER_MAX_HP * 0.15;
        maxHpBonus += inc;
        player.hp = Math.min(effectiveMaxHp(), player.hp + inc);
        break;
      }
      case "wideReach":
        pickupRadiusMult += 0.1;
        break;
      case "quickRecovery":
        hpRegenPerS += QUICK_RECOVERY_HPS;
        break;
      case "luckyStar":
        extraCoinChance += 0.1;
        break;
      case "ironSkin":
        armorTemp += 0.04;
        break;
      case "quickDraw":
        hasteTemp += 0.06;
        break;
      case "keenEye":
        critTemp += 0.05;
        break;
      case "bloodthirst":
        killHealTemp += 0.2;
        break;
      case "chill":
        slowTemp += 0.04;
        break;
      case "scholar":
        xpTemp += 0.06;
        break;
      case "spikes":
        thornsTemp += 0.1;
        break;
    }
  }

  function applyCard(card: InternalCard) {
    if (card.kind === "weaponUpgrade" && card.weaponId) {
      const w = ownedWeapons.find((w) => w.id === card.weaponId);
      if (w) {
        w.level += 1;
        if (w.level === WEAPON_MAX_LEVEL) {
          playEvolution();
        }
        log.log("card:weaponUpgrade", { id: w.id, newLevel: w.level });
      }
    } else if (card.kind === "newWeapon" && card.weaponId) {
      if (ownedWeapons.some((w) => w.id === card.weaponId)) {
        log.warn("card:newWeapon ignored — already owned", card.weaponId);
        return;
      }
      ownedWeapons.push({
        id: card.weaponId,
        level: 1,
        lastActionAt: elapsedMs,
      });
      log.log("card:newWeapon", { id: card.weaponId });
    } else if (card.kind === "stat" && card.statId) {
      statStacks[card.statId] = (statStacks[card.statId] ?? 0) + 1;
      applyStatEffect(card.statId);
      log.log("card:stat", {
        id: card.statId,
        stacks: statStacks[card.statId],
        damageMult,
        speedMult,
        maxHpBonus,
        pickupRadiusMult,
        hpRegenPerS,
        extraCoinChance,
      });
    } else if (card.kind === "ability" && card.id === "ability:necromancy") {
      // Phase 15: one-time, non-stacking pick — swaps which boss
      // spawnBoss() spawns for the rest of this run. buildCardPool() stops
      // offering this card once bossVariant is no longer "reaper", so no
      // separate "already picked" flag is needed.
      bossVariant = "lich";
      log.log("card:ability", { id: card.id, bossVariant });
    }
  }

  function buildCardPool(): InternalCard[] {
    const pool: InternalCard[] = [];
    for (const w of ownedWeapons) {
      if (w.level < WEAPON_MAX_LEVEL) {
        const isEvolution = w.level + 1 === WEAPON_MAX_LEVEL;
        pool.push({
          id: `weaponUpgrade:${w.id}`,
          kind: "weaponUpgrade",
          weaponId: w.id,
          isEvolution,
          title: isEvolution
            ? `Evolve ${WEAPON_NAMES[w.id]} → ${EVOLVED_NAMES[w.id]}`
            : `Upgrade ${WEAPON_NAMES[w.id]} — Lv ${w.level + 1}`,
          description: isEvolution
            ? EVOLUTION_BLURB[w.id]
            : UPGRADE_BLURB[w.id],
        });
      }
    }
    if (ownedWeapons.length < MAX_EQUIPPED_WEAPONS) {
      // Phase 15: only weapons available *this run* — the base 5 plus
      // whichever locked ones the shop has unlocked (options.unlockedWeaponIds),
      // not the full ALL_WEAPON_IDS lookup table.
      for (const id of availableWeaponIds) {
        if (!ownedWeapons.some((w) => w.id === id)) {
          pool.push({
            id: `newWeapon:${id}`,
            kind: "newWeapon",
            weaponId: id,
            title: `New: ${WEAPON_NAMES[id]}`,
            description: WEAPON_FLAVOR[id],
          });
        }
      }
    }
    for (const stat of TEMP_STATS) {
      const stacks = statStacks[stat.id] ?? 0;
      if (stacks < stat.maxStacks) {
        pool.push({
          id: `stat:${stat.id}`,
          kind: "stat",
          statId: stat.id,
          title: `${stat.label} (${stacks + 1}/${stat.maxStacks})`,
          description: stat.effect,
        });
      }
    }
    // Phase 15: the one-time "Embrace Necromancy" ability offer — only
    // while unlocked, only before the boss has actually spawned (picking it
    // after the Reaper already dropped in would do nothing visible this
    // run), and only once (bossVariant flips away from "reaper" the moment
    // it's chosen, which also removes it from the pool).
    if (abilityUnlocked && !bossSpawned && bossVariant === "reaper") {
      pool.push({
        id: "ability:necromancy",
        kind: "ability",
        title: "Embrace Necromancy",
        description:
          "This run's boss becomes the Lich instead of the Reaper — lower HP, no dash, but a homing curse bolt and summoned minions.",
      });
    }
    return pool;
  }

  function drawCards(): InternalCard[] {
    return shuffle(buildCardPool()).slice(0, 4);
  }

  function presentLevelUp() {
    status = "levelup";
    const cards = drawCards();
    lastDrawnCards = new Map(cards.map((c) => [c.id, c]));
    const external: LevelUpCard[] = cards.map((c) => ({
      id: c.id,
      kind: c.kind,
      weaponId: c.weaponId,
      statId: c.statId,
      isEvolution: c.isEvolution,
      title: c.title,
      description: c.description,
      fromLevel:
        c.kind === "weaponUpgrade" || c.kind === "newWeapon"
          ? (ownedWeapons.find((w) => w.id === c.weaponId)?.level ?? 0)
          : undefined,
      stacks: c.statId ? (statStacks[c.statId] ?? 0) : undefined,
      maxStacks: c.statId
        ? TEMP_STATS.find((s) => s.id === c.statId)?.maxStacks
        : undefined,
    }));
    const build: LevelUpBuild = {
      level: playerLevel,
      weapons: ownedWeapons.map((w) => ({
        id: w.id,
        name: WEAPON_NAMES[w.id],
        level: w.level,
        maxLevel: WEAPON_MAX_LEVEL,
        evolvedName: EVOLVED_NAMES[w.id],
      })),
      stats: TEMP_STATS.filter((s) => (statStacks[s.id] ?? 0) > 0).map((s) => ({
        id: s.id,
        label: s.label,
        effect: s.effect,
        stacks: statStacks[s.id] ?? 0,
        maxStacks: s.maxStacks,
      })),
    };
    log.log("levelup:cards", {
      level: playerLevel,
      cardIds: external.map((c) => c.id),
    });
    pushHud();
    callbacks.onLevelUp(
      external,
      (chosenId: string) => {
        const card = lastDrawnCards.get(chosenId);
        if (!card) {
          log.error("chooseCard: unknown id", chosenId);
          return;
        }
        applyCard(card);
        pendingLevelUps -= 1;
        log.log("levelup:chosen", { id: chosenId, remaining: pendingLevelUps });
        if (pendingLevelUps > 0) {
          presentLevelUp();
        } else {
          status = "running";
          pushHud();
          log.log("levelup:resume");
        }
      },
      build,
    );
  }

  function updateWeapon(w: WeaponRuntime, dt: number) {
    switch (w.id) {
      case "bolt": {
        const isEvolved = w.level >= WEAPON_MAX_LEVEL; // Piercing Lance
        const { intervalMs: interval, count, pierce } = boltShape(w.level);
        if (elapsedMs - w.lastActionAt >= interval) {
          const target = findNearestEnemy();
          if (target) {
            w.lastActionAt = elapsedMs;
            const damage = weaponDamage("bolt", w.level) * totalDamageMult();
            const baseAngle = Math.atan2(
              target.y - player.y,
              target.x - player.x,
            );
            const spread = count > 1 ? 0.18 : 0;
            for (let i = 0; i < count; i++) {
              const offset = count > 1 ? (i - (count - 1) / 2) * spread : 0;
              spawnPlayerProjectile(
                baseAngle + offset,
                PROJECTILE_SPEED,
                damage,
                pierce,
                "bolt",
                isEvolved ? 1.8 : 1,
              );
            }
          }
        }
        break;
      }
      case "bladeArc": {
        const isEvolved = w.level >= WEAPON_MAX_LEVEL; // Whirlwind
        const { intervalMs: interval, arcDeg } = bladeArcShape(w.level);
        if (elapsedMs - w.lastActionAt >= interval) {
          const target = findNearestEnemy();
          const facing = target
            ? Math.atan2(target.y - player.y, target.x - player.x)
            : 0;
          w.lastActionAt = elapsedMs;
          const halfArc = isEvolved ? Math.PI : (arcDeg * Math.PI) / 180 / 2;
          const damage = weaponDamage("bladeArc", w.level) * totalDamageMult();
          for (const e of enemies) {
            if (!e.alive) continue;
            const d = distance(player, e);
            if (d > BLADE_ARC_RADIUS) continue;
            if (!isEvolved) {
              const angleToE = Math.atan2(e.y - player.y, e.x - player.x);
              const diff = Math.abs(normalizeAngle(angleToE - facing));
              if (diff > halfArc) continue;
            }
            damageEnemy(e, damage, "bladeArc");
          }
          arcEffects.push({
            x: player.x,
            y: player.y,
            angle: facing,
            halfArc,
            radius: BLADE_ARC_RADIUS,
            createdAt: elapsedMs,
          });
          log.log("weapon:bladeArc:sweep", { arcDeg });
        }
        break;
      }
      case "orbitShield": {
        const isEvolved = w.level >= WEAPON_MAX_LEVEL; // Barrier Storm
        // Phase 16C: "Storm Web" — owning Chain Lightning too makes every
        // orbiter hit also trigger one extra chain jump, see stormWebJump().
        const hasStormWeb = ownedWeapons.some(
          (ow) => ow.id === "chainLightning",
        );
        const { count, radius, hitRadius, rotationRadPerS } = orbitShieldShape(
          w.level,
        );
        w.orbitAngle = (w.orbitAngle ?? 0) + rotationRadPerS * dt;
        const damage = weaponDamage("orbitShield", w.level) * totalDamageMult();
        const positions: { x: number; y: number }[] = [];
        const shouldDropTrail =
          isEvolved &&
          elapsedMs - lastOrbitTrailDropAt >= ORBIT_TRAIL_DROP_INTERVAL_MS;
        if (shouldDropTrail) lastOrbitTrailDropAt = elapsedMs;
        for (let i = 0; i < count; i++) {
          const angle = w.orbitAngle + i * ((Math.PI * 2) / count);
          const ox = player.x + Math.cos(angle) * radius;
          const oy = player.y + Math.sin(angle) * radius;
          positions.push({ x: ox, y: oy });
          for (const e of enemies) {
            if (!e.alive) continue;
            if (distance({ x: ox, y: oy }, e) < hitRadius + e.radius) {
              if (
                elapsedMs - (e.lastOrbitHitAt ?? -Infinity) >=
                ORBIT_HIT_COOLDOWN_MS
              ) {
                e.lastOrbitHitAt = elapsedMs;
                damageEnemy(e, damage, "orbitShield");
                if (hasStormWeb) stormWebJump(e, damage);
              }
            }
          }
          if (shouldDropTrail)
            orbitTrails.push({ x: ox, y: oy, createdAt: elapsedMs });
        }
        orbiterPositions = positions;
        orbiterBearings = positions.map((_, i) =>
          Math.atan2(positions[i].y - player.y, positions[i].x - player.x),
        );
        orbitCoverNow = orbitCover(w.level);
        if (isEvolved) {
          for (let i = orbitTrails.length - 1; i >= 0; i--) {
            const t = orbitTrails[i];
            if (elapsedMs - t.createdAt >= ORBIT_TRAIL_LIFETIME_MS) {
              orbitTrails.splice(i, 1);
              continue;
            }
            for (const e of enemies) {
              if (!e.alive) continue;
              if (distance(t, e) < hitRadius + e.radius) {
                if (
                  elapsedMs - (e.lastOrbitHitAt ?? -Infinity) >=
                  ORBIT_HIT_COOLDOWN_MS
                ) {
                  e.lastOrbitHitAt = elapsedMs;
                  damageEnemy(e, damage * 0.5, "orbitShield-trail");
                  if (hasStormWeb) stormWebJump(e, damage * 0.5);
                }
              }
            }
          }
        }
        break;
      }
      case "novaPulse": {
        const isEvolved = w.level >= WEAPON_MAX_LEVEL; // Shockwave
        const { intervalMs: interval, radius } = novaPulseShape(w.level);
        if (elapsedMs - w.lastActionAt >= interval) {
          w.lastActionAt = elapsedMs;
          const damage = weaponDamage("novaPulse", w.level) * totalDamageMult();
          for (const e of enemies) {
            if (!e.alive) continue;
            if (distance(player, e) <= radius) {
              damageEnemy(e, damage, "novaPulse");
              if (isEvolved && e.alive) {
                const angle = Math.atan2(e.y - player.y, e.x - player.x);
                e.x += Math.cos(angle) * SHOCKWAVE_KNOCKBACK;
                e.y += Math.sin(angle) * SHOCKWAVE_KNOCKBACK;
              }
            }
          }
          pulseEffects.push({
            x: player.x,
            y: player.y,
            radius,
            createdAt: elapsedMs,
          });
          log.log("weapon:novaPulse:burst", { radius, isEvolved });
          // Phase 16C: "Overcharge" — owning Bolt too makes the burst also
          // fire a few Bolt projectiles outward in a spread.
          if (ownedWeapons.some((ow) => ow.id === "bolt")) {
            maybeTriggerSynergy("Overcharge");
            const boltDamage =
              weaponDamage("novaPulse", w.level) *
              OVERCHARGE_BOLT_DAMAGE_MULT *
              totalDamageMult();
            for (let i = 0; i < OVERCHARGE_BOLT_COUNT; i++) {
              const angle = (i / OVERCHARGE_BOLT_COUNT) * Math.PI * 2;
              spawnPlayerProjectile(
                angle,
                PROJECTILE_SPEED,
                boltDamage,
                0,
                "overcharge",
              );
            }
          }
        }
        break;
      }
      case "homingDart": {
        const isEvolved = w.level >= WEAPON_MAX_LEVEL; // Swarm
        const { intervalMs: interval, count } = homingDartShape(w.level);
        if (elapsedMs - w.lastActionAt >= interval) {
          const candidates = enemies.filter((e) => e.alive);
          if (candidates.length > 0) {
            w.lastActionAt = elapsedMs;
            const byDistance = [...candidates].sort(
              (a, b) => distance(player, a) - distance(player, b),
            );
            const damage =
              weaponDamage("homingDart", w.level) * totalDamageMult();
            for (let i = 0; i < count; i++) {
              // The nearest threats first, one dart each — a random pick sent
              // darts after enemies that weren't the problem yet.
              const target = byDistance[i % byDistance.length];
              const baseAngle = Math.atan2(
                target.y - player.y,
                target.x - player.x,
              );
              const spread =
                isEvolved && count > 1 ? (i - (count - 1) / 2) * 0.15 : 0;
              const p = spawnPlayerProjectile(
                baseAngle + spread,
                HOMING_DART_SPEED,
                damage,
                0,
                "homingDart",
              );
              p.homingTarget = target;
              p.turnRate = HOMING_DART_TURN_RATE;
            }
          }
        }
        break;
      }
      case "gravityWell": {
        const shape = gravityWellShape(w.level);
        if (elapsedMs - w.lastActionAt >= shape.intervalMs) {
          // The thickest clump in reach: the enemy with the most company.
          let best: Enemy | null = null;
          let bestCount = 0;
          for (const a of enemies) {
            if (!a.alive || distance(player, a) > WELL_RANGE) continue;
            let near = 0;
            for (const o of enemies) {
              if (o.alive && distance(a, o) <= shape.radius) near++;
            }
            if (near > bestCount) {
              bestCount = near;
              best = a;
            }
          }
          if (best) {
            w.lastActionAt = elapsedMs;
            gravityWells.push({
              x: best.x,
              y: best.y,
              radius: shape.radius,
              damage: weaponDamage("gravityWell", w.level) * totalDamageMult(),
              startedAt: elapsedMs,
              endsAt: elapsedMs + shape.durationMs,
              tickMs: shape.tickMs,
              pullPxPerS: shape.pullPxPerS,
              lastTickAt: elapsedMs,
            });
            if (!reduceMotion)
              ringPop(particles, best.x, best.y, "#a78bfa", shape.radius);
          }
        }
        break;
      }
      case "meteorRain": {
        const {
          intervalMs: interval,
          count,
          radius,
          delayMs,
        } = meteorRainShape(w.level);
        if (elapsedMs - w.lastActionAt >= interval) {
          const pool = enemies.filter(
            (e) => e.alive && distance(player, e) <= METEOR_RANGE,
          );
          if (pool.length > 0) {
            w.lastActionAt = elapsedMs;
            const damage =
              weaponDamage("meteorRain", w.level) * totalDamageMult();
            for (let i = 0; i < count; i++) {
              const target = pool.splice(
                Math.floor(Math.random() * pool.length),
                1,
              )[0];
              meteorStrikes.push({
                x: target.x,
                y: target.y,
                radius,
                damage,
                startedAt: elapsedMs + i * 120,
                delayMs,
              });
              if (pool.length === 0) break;
            }
          }
        }
        break;
      }
      case "chainLightning": {
        const { intervalMs: interval, maxJumps: shapeJumps } =
          chainLightningShape(w.level);
        if (elapsedMs - w.lastActionAt >= interval) {
          const start = findNearestEnemy();
          if (start) {
            w.lastActionAt = elapsedMs;
            const damage =
              weaponDamage("chainLightning", w.level) * totalDamageMult();
            // Unbounded (evolved) still can't exceed the enemies on screen.
            const maxJumps = Math.min(shapeJumps, enemies.length);
            chainLightningStrike(start, damage, maxJumps);
          }
        }
        break;
      }
    }
  }

  // A swing or gathered shot freezes the enemy in place; the blow lands when
  // the wind-up ends and the enemy stays committed for a short recovery.
  function advanceSwing(e: Enemy) {
    const sw = e.swing!;
    const t = elapsedMs - sw.startedAt;
    if (sw.kind === "shoot") {
      if (!sw.struck && t >= SHOOT_WINDUP_MS) {
        sw.struck = true;
        e.strikeAt = elapsedMs;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        if (e.kind === "skeleton") {
          fireEnemyProjectile(
            e,
            angle,
            SKELETON_BONE_SPEED,
            SKELETON_BONE_DAMAGE,
            "skeleton-bone",
          );
        } else if (e.kind === "imp") {
          fireEnemyProjectile(
            e,
            angle,
            IMP_FIREBALL_SPEED,
            IMP_FIREBALL_DAMAGE,
            "imp-fire",
          );
        } else {
          fireEnemyProjectile(
            e,
            angle,
            GHOST_PROJECTILE_SPEED,
            GHOST_PROJECTILE_DAMAGE,
            "ghost",
          );
        }
      }
      if (t >= SHOOT_WINDUP_MS + 160) e.swing = undefined;
      return;
    }
    const cfg = MELEE_SWING[e.kind]!;
    if (!sw.struck && t >= cfg.windupMs) {
      sw.struck = true;
      e.strikeAt = elapsedMs;
      const reach = e.radius + PLAYER_RADIUS + cfg.range;
      enemyStrikes.push({
        x: e.x,
        y: e.y,
        range: reach,
        angle: sw.angle,
        half: cfg.half,
        at: elapsedMs,
      });
      if (!reduceMotion) {
        burst(
          particles,
          e.x + Math.cos(sw.angle) * reach * 0.8,
          e.y + Math.sin(sw.angle) * reach * 0.8,
          "#f8fafc",
          4,
          110,
        );
      }
      const bearing = Math.atan2(player.y - e.y, player.x - e.x);
      let off = Math.abs(bearing - sw.angle) % (Math.PI * 2);
      if (off > Math.PI) off = Math.PI * 2 - off;
      if (
        distance(player, e) <= reach &&
        off <= cfg.half &&
        elapsedMs - player.lastHitAt >= PLAYER_HIT_COOLDOWN_MS
      ) {
        player.lastHitAt = elapsedMs;
        damagePlayer(e.contactDamage * cfg.damageMult, cfg.source, e.x, e.y);
        log.log("enemy:swing-hit", { kind: e.kind });
      } else {
        log.log("enemy:swing-miss", { kind: e.kind });
      }
    }
    if (t >= cfg.windupMs + cfg.recoverMs) {
      e.swing = undefined;
      e.swingReadyAt = elapsedMs + cfg.cooldownMs;
    }
  }

  // Remembers the latest attack so the player's body, held weapon and muzzle
  // can react to it.
  function noteAttack(w: WeaponRuntime) {
    const target = findNearestEnemy();
    const angle = target
      ? Math.atan2(target.y - player.y, target.x - player.x)
      : playerFacingAngle;
    lastAttack = { id: w.id, at: elapsedMs, angle };
    if (!reduceMotion && w.id !== "orbitShield" && w.id !== "novaPulse") {
      burst(
        particles,
        player.x + Math.cos(angle) * PLAYER_RADIUS * 2.4,
        player.y + Math.sin(angle) * PLAYER_RADIUS * 2.4,
        WEAPON_COLOR[w.id],
        3,
        120,
      );
    }
  }

  function weaponIntervalMs(w: WeaponRuntime): number | null {
    switch (w.id) {
      case "bolt":
        return boltShape(w.level).intervalMs;
      case "homingDart":
        return homingDartShape(w.level).intervalMs;
      case "chainLightning":
        return chainLightningShape(w.level).intervalMs;
      case "meteorRain":
        return meteorRainShape(w.level).intervalMs;
      case "gravityWell":
        return gravityWellShape(w.level).intervalMs;
      case "novaPulse":
        return novaPulseShape(w.level).intervalMs;
      case "bladeArc":
        return bladeArcShape(w.level).intervalMs;
      default:
        return null;
    }
  }

  function playerPose(flash: number): EnemyPose {
    let sx = 1;
    let sy = 1;
    let tilt = 0;
    const speed = Math.hypot(playerVelX, playerVelY);
    if (!reduceMotion && speed > 1) {
      const f = Math.sin(elapsedMs * 0.02);
      sy = 1 + 0.06 * f;
      sx = 1 - 0.05 * f;
      tilt = Math.sign(playerVelX) * 0.1 + f * 0.04;
    }
    if (lastAttack) {
      const since = elapsedMs - lastAttack.at;
      if (since < 180) {
        const k = 1 - since / 180;
        const dir = Math.cos(lastAttack.angle) >= 0 ? 1 : -1;
        sx *= 1 + 0.18 * k;
        sy *= 1 - 0.14 * k;
        tilt += dir * 0.18 * k;
      }
    }
    if (flash > 0) {
      sx *= 1 - 0.18 * flash;
      sy *= 1 + 0.22 * flash;
      tilt += Math.sin(elapsedMs * 0.08) * 0.12 * flash;
    }
    return { sx, sy, lift: 0, tilt };
  }

  // The death animation of each kind.
  function corpsePose(
    c: Corpse,
    p: number,
  ): { pose: EnemyPose; alpha: number } {
    switch (c.kind) {
      case "zombie":
        return {
          pose: { sx: 1 + 0.5 * p, sy: 1 - 0.85 * p, lift: 0, tilt: 0 },
          alpha: 1 - p * p,
        };
      case "bat":
        return {
          pose: { sx: 1, sy: 1, lift: p * p * 22, tilt: p * 6 * c.dir },
          alpha: 1 - p,
        };
      case "skeleton":
        return {
          pose: {
            sx: 1 + 0.2 * Math.sin(p * 30),
            sy: 1 - 0.6 * p,
            lift: 0,
            tilt: 0,
          },
          alpha: 1 - p,
        };
      case "ghost":
        return {
          pose: { sx: 1 - 0.3 * p, sy: 1 + 0.5 * p, lift: -p * 26, tilt: 0 },
          alpha: 1 - p,
        };
      case "ogre":
        return {
          pose: {
            sx: 1 + 0.3 * p * p,
            sy: 1 - 0.5 * p * p,
            lift: 0,
            tilt: Math.sin(p * 40) * 0.08 * (1 - p),
          },
          alpha: 1 - p * p * p,
        };
      default:
        return {
          pose: {
            sx: 1 + 0.15 * Math.sin(p * 50),
            sy: 1 + 0.15 * Math.sin(p * 47),
            lift: 0,
            tilt: Math.sin(p * 60) * 0.05,
          },
          alpha: 1 - p * p,
        };
    }
  }

  // How an enemy's body moves: an idle bob, an anticipation crouch before a
  // blow, a stretch on the blow, and the settle afterwards.
  function enemyPose(e: Enemy): EnemyPose {
    e.seed ??= Math.random() * Math.PI * 2;
    const t = elapsedMs;
    let sx = 1;
    let sy = 1;
    let lift = 0;
    let tilt = 0;
    if (!reduceMotion) {
      if (e.kind === "bat") {
        const f = Math.sin(t * 0.03 + e.seed);
        sx = 1 + 0.16 * f;
        sy = 1 - 0.1 * f;
      } else if (e.kind === "ghost") {
        lift = Math.sin(t * 0.004 + e.seed) * 3;
        sy = 1 + 0.04 * Math.sin(t * 0.008 + e.seed);
      } else {
        const f = Math.sin(t * (e.kind === "ogre" ? 0.005 : 0.009) + e.seed);
        sy = 1 + 0.07 * f;
        sx = 1 - 0.05 * f;
        tilt = f * 0.05;
      }
    }
    // Mid-move attacks.
    if (e.diveUntil && t < e.diveUntil) {
      sx = 0.7;
      sy = 1.35;
      tilt = Math.atan2(e.diveDy ?? 0, e.diveDx ?? 0) + Math.PI / 2;
    } else if (e.lungeUntil && t < e.lungeUntil) {
      sx = 1.2;
      sy = 0.85;
      tilt = 0.3 * Math.sign(e.lungeDx ?? 1);
    } else if (e.dashUntil && t < e.dashUntil) {
      sx = 1.35;
      sy = 0.8;
      tilt = 0.25 * Math.sign(e.dashDx ?? 1);
    }
    if (e.fuseAt && e.fuseStartedAt != null) {
      const p = Math.min(1, (t - e.fuseStartedAt) / BOMBER_FUSE_MS);
      const pulse = 1 + 0.14 * Math.sin(p * 38);
      sx = sy = (1 + 0.35 * p) * pulse;
    }
    // Anticipation: coil up before a swing, a shot or a slam.
    const sw = e.swing;
    if (sw && !sw.struck) {
      const wind =
        sw.kind === "shoot"
          ? SHOOT_WINDUP_MS
          : (MELEE_SWING[e.kind]?.windupMs ?? 400);
      const p = Math.min(1, (t - sw.startedAt) / wind);
      if (sw.kind === "shoot") {
        sx = sy = 1 + 0.2 * p;
      } else {
        const dir = Math.cos(sw.angle) >= 0 ? 1 : -1;
        sy = 1 - 0.22 * p;
        sx = 1 + 0.16 * p;
        tilt = -dir * 0.28 * p;
      }
    } else if (e.chargeUntil && e.chargeStartedAt != null) {
      const p = Math.min(
        1,
        (t - e.chargeStartedAt) /
          Math.max(1, e.chargeUntil - e.chargeStartedAt),
      );
      sy = 1 + 0.3 * p;
      sx = 1 - 0.12 * p;
      lift = -8 * p; // rears up before it comes down
    }
    // Follow-through: the body snaps the other way, then settles.
    const since = t - (e.strikeAt ?? -1e9);
    if (since >= 0 && since < STRIKE_FOLLOW_MS) {
      const k = 1 - since / STRIKE_FOLLOW_MS;
      if (e.kind === "ogre") {
        sy = 1 - 0.3 * k;
        sx = 1 + 0.25 * k;
      } else if (e.swing?.kind === "shoot" || e.kind === "ghost") {
        sx = 1 - 0.15 * k;
        sy = 1 - 0.15 * k;
      } else {
        const dir = Math.cos(e.swing?.angle ?? 0) >= 0 ? 1 : -1;
        sy = 1 + 0.2 * k;
        sx = 1 - 0.14 * k;
        tilt = dir * 0.32 * k;
      }
    }
    // Pop-in: it scales up from the ground when it appears.
    const age = t - (e.spawnedAt ?? -1e9);
    if (age >= 0 && age < 380) {
      const p = age / 380;
      const k = 1 + 2.7 * Math.pow(p - 1, 3) + 1.7 * Math.pow(p - 1, 2);
      sx *= Math.max(0.05, k);
      sy *= Math.max(0.05, k);
    }
    return { sx, sy, lift, tilt };
  }

  function updateEnemyBehavior(e: Enemy, dt: number) {
    const currentTier = computeThreatTier(elapsedMs / 1000); // Phase 16A
    if (e.swing) {
      advanceSwing(e);
      return;
    }
    const swingCfg = MELEE_SWING[e.kind];
    if (
      swingCfg &&
      currentTier >= swingCfg.minTier &&
      elapsedMs >= (e.swingReadyAt ?? 0) &&
      !(e.dashUntil && elapsedMs < e.dashUntil) &&
      !(e.lungeUntil && elapsedMs < e.lungeUntil) &&
      distance(player, e) <= e.radius + PLAYER_RADIUS + swingCfg.range * 0.9
    ) {
      e.swing = {
        kind: "melee",
        startedAt: elapsedMs,
        angle: Math.atan2(player.y - e.y, player.x - e.x),
        struck: false,
      };
      log.log("enemy:swing-start", { kind: e.kind });
      return;
    }
    if (e.kind === "bat") {
      const def = ENEMY_DEFS.find((d) => d.kind === "bat")!;
      // Phase 16A, tier 4+: one fast straight dive through the player's
      // last-seen position, instead of only wiggling — a telegraphed but
      // faster threat once mid-dive (locked direction, can't re-steer).
      if (e.diveUntil && elapsedMs < e.diveUntil) {
        e.x += (e.diveDx ?? 0) * dt;
        e.y += (e.diveDy ?? 0) * dt;
        return;
      }
      if (e.diveUntil && elapsedMs >= e.diveUntil) {
        e.diveUntil = undefined;
      }
      if (
        currentTier >= BAT_DIVE_MIN_TIER &&
        elapsedMs - (e.lastDiveAt ?? -Infinity) >= BAT_DIVE_COOLDOWN_MS
      ) {
        e.lastDiveAt = elapsedMs;
        e.diveUntil = elapsedMs + BAT_DIVE_DURATION_MS;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.diveDx = Math.cos(angle) * BAT_DIVE_SPEED;
        e.diveDy = Math.sin(angle) * BAT_DIVE_SPEED;
        log.log("bat:dive", { tier: currentTier });
        e.x += e.diveDx * dt;
        e.y += e.diveDy * dt;
        return;
      }
      const toPlayerAngle = Math.atan2(player.y - e.y, player.x - e.x);
      e.wigglePhase = (e.wigglePhase ?? 0) + dt * 8;
      const wiggle = Math.sin(e.wigglePhase) * 0.6;
      const angle = toPlayerAngle + wiggle;
      e.x += Math.cos(angle) * def.speed * dt;
      e.y += Math.sin(angle) * def.speed * dt;
      return;
    }
    if (e.kind === "ghost") {
      const def = ENEMY_DEFS.find((d) => d.kind === "ghost")!;
      const d = distance(player, e);
      if (d > GHOST_KEEP_DISTANCE) {
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angle) * def.speed * dt;
        e.y += Math.sin(angle) * def.speed * dt;
      }
      // Phase 16A, tier 3+: fire rate shortens.
      const fireInterval =
        currentTier >= GHOST_FIRE_MIN_TIER
          ? GHOST_FIRE_INTERVAL_TIER3_MS
          : GHOST_FIRE_INTERVAL_MS;
      if (elapsedMs - (e.lastRangedAt ?? 0) >= fireInterval) {
        e.lastRangedAt = elapsedMs;
        e.swing = {
          kind: "shoot",
          startedAt: elapsedMs,
          angle: Math.atan2(player.y - e.y, player.x - e.x),
          struck: false,
        };
      }
      return;
    }
    if (e.kind === "zombie") {
      const def = ENEMY_DEFS.find((d) => d.kind === "zombie")!;
      // Phase 16A, tier 2+: a short speed burst toward the player when just
      // outside contact range and the player is moving away — punishes
      // kiting instead of just "walks straight at you."
      if (e.lungeUntil && elapsedMs < e.lungeUntil) {
        e.x += (e.lungeDx ?? 0) * dt;
        e.y += (e.lungeDy ?? 0) * dt;
        return;
      }
      if (e.lungeUntil && elapsedMs >= e.lungeUntil) {
        e.lungeUntil = undefined;
      }
      if (
        currentTier >= ZOMBIE_LUNGE_MIN_TIER &&
        elapsedMs - (e.lastLungeAt ?? -Infinity) >= ZOMBIE_LUNGE_COOLDOWN_MS
      ) {
        const d = distance(player, e);
        const playerSpeed = Math.hypot(playerVelX, playerVelY);
        if (
          d <= ZOMBIE_LUNGE_TRIGGER_RANGE &&
          d > e.radius + PLAYER_RADIUS &&
          playerSpeed > 0
        ) {
          const toPlayerAngle = Math.atan2(player.y - e.y, player.x - e.x);
          const awayDot =
            (playerVelX / playerSpeed) * Math.cos(toPlayerAngle) +
            (playerVelY / playerSpeed) * Math.sin(toPlayerAngle);
          if (awayDot > ZOMBIE_LUNGE_AWAY_DOT_THRESHOLD) {
            e.lastLungeAt = elapsedMs;
            e.lungeUntil = elapsedMs + ZOMBIE_LUNGE_DURATION_MS;
            e.lungeDx =
              Math.cos(toPlayerAngle) * def.speed * ZOMBIE_LUNGE_SPEED_MULT;
            e.lungeDy =
              Math.sin(toPlayerAngle) * def.speed * ZOMBIE_LUNGE_SPEED_MULT;
            log.log("zombie:lunge", { tier: currentTier });
            e.x += e.lungeDx * dt;
            e.y += e.lungeDy * dt;
            return;
          }
        }
      }
      // Phase 16B: "Haunting Chorus" — 2+ nearby Ghosts speed the Zombie up.
      const speedMult = e.chorusBuffed ? HAUNTING_CHORUS_SPEED_MULT : 1;
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * def.speed * speedMult * dt;
      e.y += Math.sin(angle) * def.speed * speedMult * dt;
      return;
    }
    if (e.kind === "skeleton") {
      const def = ENEMY_DEFS.find((d) => d.kind === "skeleton")!;
      // Phase 16A, tier 3+: gains a slow periodic ranged bone-throw
      // alongside its existing walk-approach — a melee-only enemy becomes a
      // light ranged threat too. Reuses lastRangedAt as its own timer field
      // (unused by skeleton before this).
      if (
        currentTier >= SKELETON_BONE_MIN_TIER &&
        elapsedMs - (e.lastRangedAt ?? 0) >= SKELETON_BONE_INTERVAL_MS
      ) {
        e.lastRangedAt = elapsedMs;
        e.swing = {
          kind: "shoot",
          startedAt: elapsedMs,
          angle: Math.atan2(player.y - e.y, player.x - e.x),
          struck: false,
        };
        return;
      }
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * def.speed * dt;
      e.y += Math.sin(angle) * def.speed * dt;
      return;
    }
    if (e.kind === "slime" || e.kind === "knight") {
      const def = ENEMY_DEFS.find((d) => d.kind === e.kind)!;
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      // Slimelets scurry; a full slime wobbles forward.
      const speed = e.mini ? def.speed * 1.5 : def.speed;
      e.x += Math.cos(angle) * speed * dt;
      e.y += Math.sin(angle) * speed * dt;
      return;
    }
    if (e.kind === "imp") {
      const def = ENEMY_DEFS.find((d) => d.kind === "imp")!;
      const d = distance(player, e);
      const toward = Math.atan2(player.y - e.y, player.x - e.x);
      // Close in to its range, then circle the hero and back off if crowded.
      const spin = (e.wigglePhase ?? 0) > Math.PI ? 1 : -1;
      const angle =
        d > IMP_ORBIT_DISTANCE * 1.15
          ? toward
          : d < IMP_ORBIT_DISTANCE * 0.8
            ? toward + Math.PI
            : toward + spin * (Math.PI / 2);
      e.x += Math.cos(angle) * def.speed * dt;
      e.y += Math.sin(angle) * def.speed * dt;
      if (elapsedMs - (e.lastRangedAt ?? 0) >= IMP_FIRE_INTERVAL_MS) {
        e.lastRangedAt = elapsedMs;
        e.swing = {
          kind: "shoot",
          startedAt: elapsedMs,
          angle: toward,
          struck: false,
        };
      }
      return;
    }
    if (e.kind === "wasp") {
      const def = ENEMY_DEFS.find((d) => d.kind === "wasp")!;
      // A jittery weave: the swarm never flies a straight line at you.
      const angle =
        Math.atan2(player.y - e.y, player.x - e.x) +
        Math.sin(elapsedMs * 0.009 + (e.wigglePhase ?? 0)) * 0.9;
      e.x += Math.cos(angle) * def.speed * dt;
      e.y += Math.sin(angle) * def.speed * dt;
      return;
    }
    if (e.kind === "boar") {
      const def = ENEMY_DEFS.find((d) => d.kind === "boar")!;
      if (e.rushUntil && elapsedMs < e.rushUntil) {
        e.x += (e.rushDx ?? 0) * dt;
        e.y += (e.rushDy ?? 0) * dt;
        if (!reduceMotion)
          burst(particles, e.x, e.y + e.radius, "#d6d3d1", 1, 60);
        return;
      }
      e.rushUntil = undefined;
      if (e.rushAt) {
        // Paws the ground, locked on where you were; sidestep it.
        if (elapsedMs >= e.rushAt) {
          e.rushAt = undefined;
          e.rushUntil = elapsedMs + BOAR_RUSH_MS;
          e.strikeAt = elapsedMs;
        }
        return;
      }
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      if (
        distance(player, e) <= BOAR_RUSH_TRIGGER_PX &&
        elapsedMs - (e.lastRushAt ?? -1e9) >= BOAR_RUSH_COOLDOWN_MS
      ) {
        e.lastRushAt = elapsedMs;
        e.rushAt = elapsedMs + BOAR_TELEGRAPH_MS;
        e.rushDx = Math.cos(angle) * BOAR_RUSH_SPEED;
        e.rushDy = Math.sin(angle) * BOAR_RUSH_SPEED;
        return;
      }
      e.x += Math.cos(angle) * def.speed * dt;
      e.y += Math.sin(angle) * def.speed * dt;
      return;
    }
    if (e.kind === "shaman") {
      const def = ENEMY_DEFS.find((d) => d.kind === "shaman")!;
      const d = distance(player, e);
      const toward = Math.atan2(player.y - e.y, player.x - e.x);
      // Stays behind the line and mends whatever is hurt around it.
      const angle =
        d > SHAMAN_KEEP_PX * 1.2
          ? toward
          : d < SHAMAN_KEEP_PX * 0.7
            ? toward + Math.PI
            : toward + Math.PI / 2;
      e.x += Math.cos(angle) * def.speed * dt;
      e.y += Math.sin(angle) * def.speed * dt;
      if (
        elapsedMs - (e.lastHealAt ?? e.spawnedAt ?? 0) >=
        SHAMAN_HEAL_INTERVAL_MS
      ) {
        e.lastHealAt = elapsedMs;
        healAround(e);
      }
      return;
    }
    if (e.kind === "phantom") {
      const def = ENEMY_DEFS.find((d) => d.kind === "phantom")!;
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * def.speed * dt;
      e.y += Math.sin(angle) * def.speed * dt;
      // It does not walk the whole way: it slips out and reappears close.
      if (elapsedMs - (e.lastBlinkAt ?? e.spawnedAt ?? 0) >= PHANTOM_BLINK_MS) {
        e.lastBlinkAt = elapsedMs;
        if (!reduceMotion)
          ringPop(particles, e.x, e.y, def.color, e.radius * 2.4);
        const a = Math.random() * Math.PI * 2;
        e.x = Math.max(
          10,
          Math.min(WORLD_W - 10, player.x + Math.cos(a) * PHANTOM_BLINK_DIST),
        );
        e.y = Math.max(
          10,
          Math.min(WORLD_H - 10, player.y + Math.sin(a) * PHANTOM_BLINK_DIST),
        );
        if (!reduceMotion) {
          ringPop(particles, e.x, e.y, def.color, e.radius * 2.6);
          burst(particles, e.x, e.y, def.color, 6, 120);
        }
      }
      return;
    }
    if (e.kind === "spitter") {
      const def = ENEMY_DEFS.find((d) => d.kind === "spitter")!;
      const d = distance(player, e);
      const toward = Math.atan2(player.y - e.y, player.x - e.x);
      const angle =
        d > SPITTER_KEEP_PX * 1.15
          ? toward
          : d < SPITTER_KEEP_PX * 0.75
            ? toward + Math.PI
            : toward + Math.PI / 2;
      e.x += Math.cos(angle) * def.speed * dt;
      e.y += Math.sin(angle) * def.speed * dt;
      if (elapsedMs - (e.lastRangedAt ?? 0) >= SPITTER_INTERVAL_MS) {
        e.lastRangedAt = elapsedMs;
        // Aimed where you stand now: keep moving and it lands behind you.
        acidShots.push({ x: player.x, y: player.y, startedAt: elapsedMs });
      }
      return;
    }
    if (e.kind === "bomber") {
      const def = ENEMY_DEFS.find((d) => d.kind === "bomber")!;
      if (e.fuseAt) {
        if (elapsedMs >= e.fuseAt) detonateBomber(e);
        return; // stands still while the fuse burns
      }
      if (distance(player, e) <= BOMBER_TRIGGER_PX) {
        e.fuseStartedAt = elapsedMs;
        e.fuseAt = elapsedMs + BOMBER_FUSE_MS;
        return;
      }
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * def.speed * dt;
      e.y += Math.sin(angle) * def.speed * dt;
      return;
    }
    if (e.kind === "ogre") {
      const def = ENEMY_DEFS.find((d) => d.kind === "ogre")!;
      const d = distance(player, e);
      if (e.chargeUntil) {
        if (elapsedMs >= e.chargeUntil) {
          e.chargeUntil = undefined;
          e.width = e.baseWidth ?? e.width;
          e.height = e.baseHeight ?? e.height;
          e.strikeAt = elapsedMs;
          if (distance(player, e) <= OGRE_SLAM_RANGE) {
            damagePlayer(OGRE_SLAM_DAMAGE, "ogre-slam", e.x, e.y);
            log.log("ogre:slam-hit");
          } else {
            log.log("ogre:slam-miss");
          }
          // Phase 16B: "Hype the Ogre" — 2+ nearby Bats halve the cooldown
          // while they stay close.
          e.slamReadyAt =
            elapsedMs +
            OGRE_SLAM_COOLDOWN_MS *
              (e.hypedByBats ? HYPE_OGRE_COOLDOWN_MULT : 1);
        }
        return; // frozen mid-telegraph
      }
      if (d <= OGRE_SLAM_RANGE && elapsedMs >= (e.slamReadyAt ?? 0)) {
        // Phase 16A, tier 5+: shorter telegraph — harder to react to, same
        // slam otherwise.
        const telegraphMs =
          currentTier >= OGRE_TELEGRAPH_MIN_TIER
            ? OGRE_SLAM_TELEGRAPH_TIER5_MS
            : OGRE_SLAM_TELEGRAPH_MS;
        e.chargeUntil = elapsedMs + telegraphMs;
        e.chargeStartedAt = elapsedMs;
        e.baseWidth = e.width;
        e.baseHeight = e.height;
        e.width *= 1.4;
        e.height *= 1.4;
        log.log("ogre:telegraph-start");
        return;
      }
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * def.speed * dt;
      e.y += Math.sin(angle) * def.speed * dt;
      return;
    }
    if (e.kind === "reaper") {
      if (e.dashUntil && elapsedMs < e.dashUntil) {
        e.x += (e.dashDx ?? 0) * dt;
        e.y += (e.dashDy ?? 0) * dt;
        return;
      }
      if (e.dashUntil && elapsedMs >= e.dashUntil) {
        e.dashUntil = undefined;
      }
      if (elapsedMs - (e.lastDashAt ?? 0) >= REAPER_DASH_INTERVAL_MS) {
        e.lastDashAt = elapsedMs;
        e.dashUntil = elapsedMs + REAPER_DASH_DURATION_MS;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.dashDx = Math.cos(angle) * REAPER_DASH_SPEED;
        e.dashDy = Math.sin(angle) * REAPER_DASH_SPEED;
        log.log("boss:attack", { pattern: "dash" });
      }
      if (elapsedMs - (e.lastRingAt ?? 0) >= REAPER_RING_INTERVAL_MS) {
        e.lastRingAt = elapsedMs;
        for (let i = 0; i < REAPER_RING_COUNT; i++) {
          const angle = (i / REAPER_RING_COUNT) * Math.PI * 2;
          fireEnemyProjectile(
            e,
            angle,
            REAPER_RING_PROJECTILE_SPEED,
            REAPER_RING_DAMAGE * bossPowerScale,
            "reaper-ring",
          );
        }
        log.log("boss:attack", { pattern: "ring", count: REAPER_RING_COUNT });
      }
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * REAPER_SPEED * dt;
      e.y += Math.sin(angle) * REAPER_SPEED * dt;
      return;
    }
    if (e.kind === "lich") {
      // Curse bolt: a single slow, homing projectile — dodgeable given
      // LICH_CURSE_TURN_RATE's gentle turn, unlike the Reaper's non-homing
      // ring burst. `lastRangedAt` doubles as this timer (see Enemy interface).
      if (elapsedMs - (e.lastRangedAt ?? 0) >= LICH_CURSE_INTERVAL_MS) {
        e.lastRangedAt = elapsedMs;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        const p = fireEnemyProjectile(
          e,
          angle,
          LICH_CURSE_SPEED,
          LICH_CURSE_DAMAGE * bossPowerScale,
          "lich-curse",
          true,
        );
        p.turnRate = LICH_CURSE_TURN_RATE;
        log.log("boss:attack", { pattern: "curse", variant: "lich" });
      }
      // Summon: periodic weak minions, pressure instead of a second attack
      // of the Lich's own — the Reaper has no equivalent, this is the
      // "different way of attacking" half of the boss swap.
      if (elapsedMs - (e.lastSummonAt ?? 0) >= LICH_SUMMON_INTERVAL_MS) {
        e.lastSummonAt = elapsedMs;
        for (let i = 0; i < LICH_SUMMON_COUNT; i++) {
          const offsetAngle = (i / LICH_SUMMON_COUNT) * Math.PI * 2;
          spawnMinion(
            e.x + Math.cos(offsetAngle) * (e.radius + 20),
            e.y + Math.sin(offsetAngle) * (e.radius + 20),
            elapsedMs / 1000,
          );
        }
        log.log("boss:attack", {
          pattern: "summon",
          variant: "lich",
          count: LICH_SUMMON_COUNT,
        });
      }
      // No dash — the Lich drifts steadily toward the player instead.
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * LICH_SPEED * dt;
      e.y += Math.sin(angle) * LICH_SPEED * dt;
      return;
    }
  }

  function endGame(reason: "death" | "timer") {
    if (status === "gameover") return;
    status = "gameover";
    const survivedS = Math.min(elapsedMs / 1000, runDurationS);
    const earnedChest = endless
      ? survivedS >= ENDLESS_WON_AFTER_S
      : reason === "timer";
    const coinsEarned = Math.round(coinsCollected * upgradeEffects.coinMult);
    const cause = describeDeathCause(reason, lastDamageSource);
    log.log("game:over", {
      reason,
      cause,
      survivedS: survivedS.toFixed(1),
      kills,
      gemsCollected,
      coinsCollected,
      coinsEarned,
      level: playerLevel,
    });
    callbacks.onGameOver({
      survivedS,
      kills,
      level: playerLevel,
      coinsEarned,
      cause,
      won: earnedChest,
      bossDefeated,
    });
  }

  const loop = GameLoop({
    update(dt = 1 / 60) {
      dt = Math.min(dt, MAX_DT); // Phase 8: cap a single frame's catch-up
      if (status !== "running") return;
      if (beatMs > 0) {
        beatMs -= dt * 1000;
        return;
      }
      if (hitStopMs > 0) {
        // A few frozen frames on a heavy kill; the world holds still.
        hitStopMs -= dt * 1000;
        return;
      }
      elapsedMs += dt * 1000;
      const elapsedS = elapsedMs / 1000;

      // --- Phase 13: threat-tier readout, checked every frame (not
      // HUD-throttled) so the toast fires right when the tier crosses ---
      const currentThreatTier = computeThreatTier(elapsedS);
      if (currentThreatTier > lastThreatTier) {
        lastThreatTier = currentThreatTier;
        callbacks.onThreatTierUp?.(currentThreatTier);
        startBeat();
        log.log("threat:tierUp", { tier: currentThreatTier });
      }

      // --- passive regen (Quick Recovery stacks + shop's Recovery) ---
      const totalRegenPerS = hpRegenPerS + upgradeEffects.regenPerS;
      if (totalRegenPerS > 0 && player.hp > 0) {
        player.hp = Math.min(effectiveMaxHp(), player.hp + totalRegenPerS * dt);
      }

      // Lab only: a constant drain stands in for incoming damage so recovery
      // can be judged against a known rate. Never kills.
      if (training && training.drainPerS > 0) {
        player.hp = Math.max(1, player.hp - training.drainPerS * dt);
      }

      // --- player movement (keyboard, or Phase 7's virtual joystick) ---
      let moveX = 0;
      let moveY = 0;
      let moveMagnitude = 0;
      if (joystick) {
        const dx = joystick.curX - joystick.originX;
        const dy = joystick.curY - joystick.originY;
        const dist = Math.hypot(dx, dy);
        if (dist > JOYSTICK_DEADZONE) {
          moveX = dx / dist;
          moveY = dy / dist;
          moveMagnitude = Math.min(1, dist / JOYSTICK_MAX_RADIUS);
        }
      } else {
        let mvx = 0;
        let mvy = 0;
        if (keyPressed(["arrowleft", "a"])) mvx -= 1;
        if (keyPressed(["arrowright", "d"])) mvx += 1;
        if (keyPressed(["arrowup", "w"])) mvy -= 1;
        if (keyPressed(["arrowdown", "s"])) mvy += 1;
        if (mvx !== 0 || mvy !== 0) {
          const len = Math.hypot(mvx, mvy);
          moveX = mvx / len;
          moveY = mvy / len;
          moveMagnitude = 1;
        }
      }
      playerIsIdle = moveMagnitude === 0;
      if (playerIsIdle) {
        playerBobPhase += dt * 3.2; // Phase 11: gentle idle-only bob, see render()
      }
      if (moveMagnitude > 0) {
        playerFacingAngle = Math.atan2(moveY, moveX); // Phase 9: sprite orientation
        const speed =
          PLAYER_SPEED * speedMult * upgradeEffects.speedMult * moveMagnitude;
        player.x = Math.min(
          Math.max(player.x + moveX * speed * dt, PLAYER_RADIUS),
          WORLD_W - PLAYER_RADIUS,
        );
        player.y = Math.min(
          Math.max(player.y + moveY * speed * dt, PLAYER_RADIUS),
          WORLD_H - PLAYER_RADIUS,
        );
        playerVelX = moveX * speed; // Phase 16A: zombie lunge's "moving away" check
        playerVelY = moveY * speed;
      } else {
        playerVelX = 0;
        playerVelY = 0;
      }

      // --- Phase 16B: enemy pack synergies, throttled scan (not per-frame) ---
      if (elapsedMs - lastSynergyScanAt >= SYNERGY_SCAN_INTERVAL_MS) {
        lastSynergyScanAt = elapsedMs;
        runSynergyScan();
      }

      // --- boss telegraph, then trigger (relative, near run end) ---
      if (!bossWarned && elapsedS >= bossSpawnAtS - BOSS_WARNING_LEAD_S) {
        bossWarned = true;
        callbacks.onBossIncoming?.();
        startBeat();
        log.log("boss:incoming");
      }
      if (!bossSpawned && elapsedS >= bossSpawnAtS) {
        spawnBoss();
      }

      // --- spawning (exponential-ish ramp, floored — see file header) ---
      const spawnIntervalMs =
        currentSpawnIntervalMs(elapsedS) / (options.spawnRateMult ?? 1);
      if (elapsedMs - lastSpawnAt >= spawnIntervalMs) {
        lastSpawnAt = elapsedMs;
        spawnEnemy(elapsedS);
      }

      // --- enemy movement/attacks + contact damage ---
      for (const e of enemies) {
        if (!e.alive) continue;
        updateEnemyBehavior(
          e,
          dt * (1 - Math.min(0.5, upgradeEffects.enemySlow + slowTemp)),
        );
        if (training) {
          const minDist = PLAYER_RADIUS + e.radius + training.standoffPx;
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          const d = Math.hypot(dx, dy);
          if (d < minDist) {
            const angle =
              d > 0 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
            e.x = player.x + Math.cos(angle) * minDist;
            e.y = player.y + Math.sin(angle) * minDist;
          }
        }
        if (status !== "running") return; // damagePlayer may have ended the run
        if (distance(player, e) < PLAYER_RADIUS + e.radius) {
          if (elapsedMs - player.lastHitAt >= PLAYER_HIT_COOLDOWN_MS) {
            player.lastHitAt = elapsedMs;
            const contact = e.contactDamage || CONTACT_DAMAGE;
            damagePlayer(contact, `contact:${e.kind}`, e.x, e.y);
            if (status !== "running") return;
            const thorns = upgradeEffects.thorns + thornsTemp;
            if (thorns > 0 && e.alive) {
              damageEnemy(e, contact * thorns, "thorns");
            }
          }
        }
      }

      // --- weapons (Phase 3: all owned weapons act every frame) ---
      const haste = upgradeEffects.haste + hasteTemp;
      for (const w of ownedWeapons) {
        // Haste: age the cooldown faster than the clock does.
        if (haste > 0) w.lastActionAt -= dt * 1000 * haste;
        const before = w.lastActionAt;
        updateWeapon(w, dt);
        if (w.lastActionAt !== before) noteAttack(w);
      }

      // --- Phase 16C: "Twin Fangs" — Bolt and Homing Dart both at Lv4+
      // periodically fire together as a shared volley, alongside their own
      // independent per-weapon fire timers above. ---
      const twinFangsBolt = ownedWeapons.find((w) => w.id === "bolt");
      const twinFangsDart = ownedWeapons.find((w) => w.id === "homingDart");
      if (
        twinFangsBolt &&
        twinFangsDart &&
        twinFangsBolt.level >= TWIN_FANGS_MIN_LEVEL &&
        twinFangsDart.level >= TWIN_FANGS_MIN_LEVEL &&
        elapsedMs - lastTwinFangsAt >= TWIN_FANGS_INTERVAL_MS
      ) {
        const target = findNearestEnemy();
        if (target) {
          lastTwinFangsAt = elapsedMs;
          maybeTriggerSynergy("Twin Fangs");
          const angle = Math.atan2(target.y - player.y, target.x - player.x);
          spawnPlayerProjectile(
            angle,
            PROJECTILE_SPEED,
            weaponDamage("bolt", twinFangsBolt.level) * totalDamageMult(),
            twinFangsBolt.level >= 4 ? 1 : 0,
            "bolt",
          );
          const dart = spawnPlayerProjectile(
            angle,
            HOMING_DART_SPEED,
            weaponDamage("homingDart", twinFangsDart.level) * totalDamageMult(),
            0,
            "homingDart",
          );
          dart.homingTarget = target;
          dart.turnRate = HOMING_DART_TURN_RATE;
        }
      }

      // --- player projectiles ---
      for (const p of projectiles) {
        if (!p.alive) continue;
        if (p.homingTarget) {
          if (p.homingTarget.alive) {
            const desiredAngle = Math.atan2(
              p.homingTarget.y - p.y,
              p.homingTarget.x - p.x,
            );
            const currentAngle = Math.atan2(p.dy, p.dx);
            const diff = normalizeAngle(desiredAngle - currentAngle);
            const maxTurn = (p.turnRate ?? 4) * dt;
            const turn = Math.max(-maxTurn, Math.min(maxTurn, diff));
            const newAngle = currentAngle + turn;
            const speed = Math.hypot(p.dx, p.dy);
            p.dx = Math.cos(newAngle) * speed;
            p.dy = Math.sin(newAngle) * speed;
          }
        }
        p.x += p.dx * dt;
        p.y += p.dy * dt;
        p.ttl -= dt;
        if (
          p.ttl <= 0 ||
          p.x < -20 ||
          p.x > WORLD_W + 20 ||
          p.y < -20 ||
          p.y > WORLD_H + 20
        ) {
          p.alive = false;
          continue;
        }
        for (const e of enemies) {
          if (!e.alive) continue;
          if (p.hitSet?.has(e)) continue;
          if (distance(p, e) < PROJECTILE_RADIUS + e.radius) {
            p.hitSet?.add(e);
            damageEnemy(e, p.damage, p.source);
            if ((p.pierceRemaining ?? 0) > 0) {
              p.pierceRemaining! -= 1;
            } else {
              p.alive = false;
            }
            break;
          }
        }
      }
      for (let i = projectiles.length - 1; i >= 0; i--) {
        if (!projectiles[i].alive) projectiles.splice(i, 1);
      }
      for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i].alive) enemies.splice(i, 1);
      }

      // --- enemy projectiles (ghost bolts, reaper ring, lich curse) ---
      for (const p of enemyProjectiles) {
        if (!p.alive) continue;
        if (p.homingPlayer) {
          // Phase 15: steers toward the player's live position every frame
          // (unlike player-side homingTarget/turnRate, which lock onto a
          // captured Enemy at fire time) — same turn-rate-limited steering
          // math as the Homing Dart weapon, just aimed the other way.
          const desiredAngle = Math.atan2(player.y - p.y, player.x - p.x);
          const currentAngle = Math.atan2(p.dy, p.dx);
          const diff = normalizeAngle(desiredAngle - currentAngle);
          const maxTurn = (p.turnRate ?? LICH_CURSE_TURN_RATE) * dt;
          const turn = Math.max(-maxTurn, Math.min(maxTurn, diff));
          const newAngle = currentAngle + turn;
          const speed = Math.hypot(p.dx, p.dy);
          p.dx = Math.cos(newAngle) * speed;
          p.dy = Math.sin(newAngle) * speed;
        }
        p.x += p.dx * dt;
        p.y += p.dy * dt;
        p.ttl -= dt;
        if (
          p.ttl <= 0 ||
          p.x < -20 ||
          p.x > WORLD_W + 20 ||
          p.y < -20 ||
          p.y > WORLD_H + 20
        ) {
          p.alive = false;
          continue;
        }
        if (distance(p, player) < EP_RADIUS + PLAYER_RADIUS) {
          p.alive = false;
          // Phase 14: use the projectile's own source (set correctly at
          // fireEnemyProjectile() call sites) instead of a hardcoded
          // "ranged" — needed so describeDeathCause() can tell a ghost
          // bolt apart from a reaper-ring hit.
          damagePlayer(p.damage, p.source, p.x, p.y);
          if (status !== "running") break;
        }
      }
      for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        if (!enemyProjectiles[i].alive) enemyProjectiles.splice(i, 1);
      }
      if (status !== "running") return;

      // --- gems: magnetic pull + collect (feeds XP) ---
      const pickupRadius =
        GEM_PICKUP_RADIUS * pickupRadiusMult * upgradeEffects.pickupRadiusMult;
      for (const g of gems) {
        if (!g.alive) continue;
        const d = distance(player, g);
        if (d < GEM_COLLECT_DISTANCE) {
          g.alive = false;
          gemsCollected += 1;
          if (!reduceMotion) {
            burst(particles, g.x, g.y, "#c4b5fd", 4, 110);
            ringPop(particles, player.x, player.y, "#a78bfa", 22);
          }
          addXp(GEM_XP_VALUE * (upgradeEffects.xpMult + xpTemp));
          playPickup();
          log.log("pickup:gem", { totalGems: gemsCollected });
          continue;
        }
        if (d < pickupRadius) {
          const angle = Math.atan2(player.y - g.y, player.x - g.x);
          g.x += Math.cos(angle) * GEM_PULL_SPEED * dt;
          g.y += Math.sin(angle) * GEM_PULL_SPEED * dt;
        }
      }
      for (let i = gems.length - 1; i >= 0; i--) {
        if (!gems[i].alive) gems.splice(i, 1);
      }

      // --- coins: same magnetic pull + collect system as gems ---
      for (const c of coinPickups) {
        if (!c.alive) continue;
        const d = distance(player, c);
        if (d < GEM_COLLECT_DISTANCE) {
          c.alive = false;
          coinsCollected += c.value;
          if (!reduceMotion) {
            burst(particles, c.x, c.y, "#fde047", 6, 150);
            ringPop(particles, c.x, c.y, "#fef08a", 18);
          }
          playPickup();
          log.log("pickup:coin", {
            value: c.value,
            totalCoins: coinsCollected,
          });
          continue;
        }
        if (d < pickupRadius) {
          const angle = Math.atan2(player.y - c.y, player.x - c.x);
          c.x += Math.cos(angle) * GEM_PULL_SPEED * dt;
          c.y += Math.sin(angle) * GEM_PULL_SPEED * dt;
        }
      }
      for (let i = coinPickups.length - 1; i >= 0; i--) {
        if (!coinPickups[i].alive) coinPickups.splice(i, 1);
      }

      // --- level-up pause: XP thresholds crossed this frame ---
      if (pendingLevelUps > 0) {
        presentLevelUp();
        return;
      }

      // --- transient visual effects ---
      stepParticles(particles, dt * 1000);
      for (let i = arcEffects.length - 1; i >= 0; i--) {
        if (elapsedMs - arcEffects[i].createdAt >= ARC_EFFECT_DURATION_MS) {
          arcEffects.splice(i, 1);
        }
      }
      for (let i = corpses.length - 1; i >= 0; i--) {
        const c = corpses[i];
        if (c.boss && elapsedMs >= c.nextBlastAt && elapsedMs - c.at < c.life) {
          // A boss does not go quietly: a chain of blasts across its body.
          c.nextBlastAt = elapsedMs + 130;
          if (!reduceMotion) {
            const bx = c.x + (Math.random() - 0.5) * c.radius * 2.2;
            const by = c.y + (Math.random() - 0.5) * c.radius * 2.2;
            burst(particles, bx, by, "#fde047", 10, 240);
            ringPop(particles, bx, by, "#fb7185", c.radius * 1.6);
          }
          if (feedbackOn) {
            shakeMag = 4;
            shakeUntil = elapsedMs + 160;
          }
        }
        if (elapsedMs - c.at >= c.life) corpses.splice(i, 1);
      }
      for (let i = hitIndicators.length - 1; i >= 0; i--) {
        if (elapsedMs - hitIndicators[i].at >= 700) hitIndicators.splice(i, 1);
      }
      for (let i = banners.length - 1; i >= 0; i--) {
        if (elapsedMs - banners[i].at >= 1500) banners.splice(i, 1);
      }
      if (bossIntro && elapsedMs - bossIntro.at >= 2400) bossIntro = null;
      for (let i = enemyStrikes.length - 1; i >= 0; i--) {
        if (elapsedMs - enemyStrikes[i].at >= 220) enemyStrikes.splice(i, 1);
      }
      for (let i = gravityWells.length - 1; i >= 0; i--) {
        const g = gravityWells[i];
        if (elapsedMs >= g.endsAt) {
          gravityWells.splice(i, 1);
          continue;
        }
        const tick = elapsedMs - g.lastTickAt >= g.tickMs;
        if (tick) g.lastTickAt = elapsedMs;
        for (const e of enemies) {
          if (!e.alive) continue;
          const d = distance(g, e);
          if (d > g.radius * 1.25) continue;
          // Bosses are only hurt, never dragged.
          if (e.kind !== "reaper" && e.kind !== "lich" && d > 4) {
            const step = Math.min(d, g.pullPxPerS * dt);
            e.x += ((g.x - e.x) / d) * step;
            e.y += ((g.y - e.y) / d) * step;
          }
          if (tick && d <= g.radius) damageEnemy(e, g.damage, "gravityWell");
        }
      }
      for (let i = acidShots.length - 1; i >= 0; i--) {
        const a = acidShots[i];
        if (elapsedMs - a.startedAt < SPITTER_LAND_MS) continue;
        acidShots.splice(i, 1);
        acidPools.push({
          x: a.x,
          y: a.y,
          until: elapsedMs + ACID_POOL_MS,
          lastTickAt: elapsedMs,
        });
        if (!reduceMotion) burst(particles, a.x, a.y, "#84cc16", 8, 130);
      }
      for (let i = acidPools.length - 1; i >= 0; i--) {
        const pool = acidPools[i];
        if (elapsedMs >= pool.until) {
          acidPools.splice(i, 1);
          continue;
        }
        if (
          distance(player, pool) < ACID_POOL_RADIUS &&
          elapsedMs - pool.lastTickAt >= ACID_TICK_MS
        ) {
          pool.lastTickAt = elapsedMs;
          damagePlayer(ACID_TICK_DAMAGE, "acid-pool", pool.x, pool.y);
          if (status !== "running") return;
        }
      }
      for (let i = meteorStrikes.length - 1; i >= 0; i--) {
        const m = meteorStrikes[i];
        if (elapsedMs - m.startedAt < m.delayMs) continue;
        meteorStrikes.splice(i, 1);
        for (const e of enemies) {
          if (e.alive && distance(m, e) <= m.radius + e.radius) {
            damageEnemy(e, m.damage, "meteorRain");
          }
        }
        pulseEffects.push({
          x: m.x,
          y: m.y,
          radius: m.radius,
          createdAt: elapsedMs,
        });
        burst(particles, m.x, m.y, "#fb923c", 12, 260);
        burst(particles, m.x, m.y, "#fde68a", 6, 140);
        if (m.radius >= 60) {
          shakeMag = 3;
          shakeUntil = elapsedMs + 140;
        }
      }
      for (let i = pulseEffects.length - 1; i >= 0; i--) {
        if (elapsedMs - pulseEffects[i].createdAt >= PULSE_EFFECT_DURATION_MS) {
          pulseEffects.splice(i, 1);
        }
      }
      for (let i = hitSparks.length - 1; i >= 0; i--) {
        if (elapsedMs - hitSparks[i].createdAt >= HIT_SPARK_DURATION_MS) {
          hitSparks.splice(i, 1);
        }
      }
      for (let i = damageNumbers.length - 1; i >= 0; i--) {
        if (
          elapsedMs - damageNumbers[i].createdAt >=
          DAMAGE_NUMBER_DURATION_MS
        ) {
          damageNumbers.splice(i, 1);
        }
      }
      for (let i = chainEffects.length - 1; i >= 0; i--) {
        if (elapsedMs - chainEffects[i].createdAt >= CHAIN_EFFECT_DURATION_MS) {
          chainEffects.splice(i, 1);
        }
      }

      // --- clock beats: each whole minute left, then 30 s and 10 s ---
      const remainingS = runDurationS - elapsedS;
      const mark =
        remainingS <= 10
          ? 10
          : remainingS <= 30
            ? 30
            : Math.ceil(remainingS / 60) * 60;
      if (mark < lastBeatMark) {
        // The first frame only initialises the mark.
        if (lastBeatMark !== Infinity) startBeat();
        lastBeatMark = mark;
      }

      // --- timer ---
      if (elapsedS >= runDurationS) {
        endGame("timer");
        return;
      }

      // --- throttled HUD push ---
      hudAccumulatorMs += dt * 1000;
      if (hudAccumulatorMs >= HUD_UPDATE_INTERVAL_MS) {
        hudAccumulatorMs = 0;
        pushHud();
      }
    },
    render() {
      context.setTransform(renderScale, 0, 0, renderScale, 0, 0);
      context.clearRect(0, 0, WORLD_W, WORLD_H);
      if (backdrop) context.drawImage(backdrop, 0, 0, WORLD_W, WORLD_H);
      context.save();
      if (feedbackOn && elapsedMs < shakeUntil) {
        const fade = Math.min(1, (shakeUntil - elapsedMs) / 200);
        context.translate(
          (Math.random() - 0.5) * 2 * shakeMag * fade,
          (Math.random() - 0.5) * 2 * shakeMag * fade,
        );
      }
      // Clock backdrop: faint, behind everything. During a beat the time left
      // swells in and out; in the last 30 s a stopwatch pulses, faster and
      // redder as the end nears.
      {
        const left = endless
          ? elapsedMs / 1000
          : Math.max(0, runDurationS - elapsedMs / 1000);
        if (beatMs > 0) {
          const t = 1 - beatMs / beatTotalMs;
          const env = Math.sin(Math.PI * Math.min(1, t));
          drawBigTime(context, WORLD_W, WORLD_H, left, 0.2 * env, "#e2e8f0");
        }
        if (feedbackOn && !endless && left <= 30 && left > 0) {
          const urgent = left <= 10;
          const beatsPerS = urgent ? 2 : 1;
          const pulse = Math.pow(
            0.5 + 0.5 * Math.sin(elapsedMs * 0.001 * beatsPerS * Math.PI * 2),
            2,
          );
          drawClock(
            context,
            WORLD_W / 2,
            WORLD_H * 0.52,
            WORLD_W * (0.17 + pulse * 0.02),
            left,
            (urgent ? 0.1 : 0.06) + pulse * (urgent ? 0.14 : 0.07),
            urgent ? "#fb7185" : "#e2e8f0",
          );
        }
      }
      // Ground warnings first, so enemies and the player stand on top.
      for (const e of enemies) {
        if (e.kind === "ogre" && e.chargeUntil && e.chargeStartedAt != null) {
          drawSlamWarning(
            context,
            e.x,
            e.y,
            OGRE_SLAM_RANGE,
            (elapsedMs - e.chargeStartedAt) /
              Math.max(1, e.chargeUntil - e.chargeStartedAt),
          );
        }
        if (e.kind === "bomber" && e.fuseAt && e.fuseStartedAt != null) {
          drawSlamWarning(
            context,
            e.x,
            e.y,
            BOMBER_BLAST_RADIUS,
            (elapsedMs - e.fuseStartedAt) / BOMBER_FUSE_MS,
          );
        }
        const sw = e.swing;
        if (sw && !sw.struck) {
          if (sw.kind === "melee") {
            const cfg = MELEE_SWING[e.kind]!;
            drawSwingWarning(
              context,
              e.x,
              e.y,
              e.radius + PLAYER_RADIUS + cfg.range,
              sw.angle,
              cfg.half,
              (elapsedMs - sw.startedAt) / cfg.windupMs,
            );
          } else {
            drawDashLine(
              context,
              e.x,
              e.y,
              e.x + Math.cos(sw.angle) * 120,
              e.y + Math.sin(sw.angle) * 120,
            );
          }
        }
        if (e.kind === "boar" && e.rushAt) {
          const a = Math.atan2(e.rushDy ?? 0, e.rushDx ?? 0);
          drawDashLine(
            context,
            e.x,
            e.y,
            e.x + Math.cos(a) * 190,
            e.y + Math.sin(a) * 190,
          );
        }
        if (
          e.kind === "reaper" &&
          !(e.dashUntil && elapsedMs < e.dashUntil) &&
          REAPER_DASH_INTERVAL_MS - (elapsedMs - (e.lastDashAt ?? 0)) <
            WINDUP_WARNING_MS
        ) {
          const a = Math.atan2(player.y - e.y, player.x - e.x);
          drawDashLine(
            context,
            e.x,
            e.y,
            e.x + Math.cos(a) * 190,
            e.y + Math.sin(a) * 190,
          );
        }
      }
      const pullRadius =
        GEM_PICKUP_RADIUS * pickupRadiusMult * upgradeEffects.pickupRadiusMult;
      const pickupAnim = (o: { x: number; y: number }) => {
        const dx = player.x - o.x;
        const dy = player.y - o.y;
        const d = Math.hypot(dx, dy) || 1;
        return {
          t: elapsedMs,
          pulling: d < pullRadius,
          dirX: dx / d,
          dirY: dy / d,
        };
      };
      for (const g of gems) {
        drawGem(context, g.x, g.y, GEM_RADIUS, g.color, pickupAnim(g));
      }
      for (const c of coinPickups) {
        drawCoin(context, c.x, c.y, COIN_RADIUS, c.color, pickupAnim(c));
      }
      // Death animations play under the living.
      for (const c of corpses) {
        const p = Math.min(1, (elapsedMs - c.at) / c.life);
        const { pose, alpha } = corpsePose(c, p);
        context.save();
        context.globalAlpha = Math.max(0, alpha);
        drawEnemy(context, c.kind, c.x, c.y, c.radius, c.color, {
          pose,
          t: elapsedMs,
          armed: false,
        });
        context.restore();
      }
      // Elite/boss get a glow (GAME-DESIGN.md "Distinct glow/aura"); Veteran
      // instead gets a plain color tint, applied at spawn time via
      // darkenHexColor(). Glow is skipped for ordinary enemies to keep
      // shadowBlur's per-draw cost bounded at up to 60 alive (Phase 8).
      // Per-kind composite detail (eyes, wings, a hood, etc.) is Phase 9,
      // see src/lib/game/sprites.ts's drawEnemy().
      for (const e of enemies) {
        const isElite = e.tier === "elite";
        const flashAlpha = e.hitFlashUntil
          ? Math.max(0, (e.hitFlashUntil - elapsedMs) / HIT_FLASH_MS)
          : 0;
        if ((e.kind === "reaper" || e.kind === "lich") && !reduceMotion) {
          drawBossAura(
            context,
            e.x,
            e.y,
            e.radius,
            e.phase ?? 1,
            elapsedMs,
            e.color,
          );
        }
        // A lit bomber blinks white, faster as the fuse runs down.
        const fuseBlink =
          e.kind === "bomber" && e.fuseStartedAt != null
            ? Math.sin(((elapsedMs - e.fuseStartedAt) / BOMBER_FUSE_MS) * 40) >
              0
              ? 0.55
              : 0
            : 0;
        drawEnemy(context, e.kind, e.x, e.y, e.radius, e.color, {
          flashAlpha: Math.max(flashAlpha, fuseBlink),
          pose: enemyPose(e),
          t: elapsedMs + (e.seed ?? 0) * 997,
          armed: e.swing?.kind !== "melee",
        });
        // The arm and weapon of a melee swing: drawn back while winding up,
        // whipped across on the strike.
        const meleeCfg = MELEE_SWING[e.kind];
        if (meleeCfg && e.swing?.kind === "melee") {
          const sw = e.swing;
          const since = elapsedMs - (e.strikeAt ?? Infinity);
          let offset: number;
          if (!sw.struck) {
            const p = Math.min(
              1,
              (elapsedMs - sw.startedAt) / meleeCfg.windupMs,
            );
            offset = -meleeCfg.half * (1 - (1 - p) * (1 - p));
          } else {
            const q = Math.min(1, Math.max(0, since) / 110);
            offset = -meleeCfg.half + 2 * meleeCfg.half * q;
          }
          drawSwingArm(
            context,
            e.kind,
            e.x,
            e.y,
            e.radius,
            sw.angle,
            offset,
            e.color,
          );
        }
        if (isElite) drawEliteMarker(context, e.x, e.y, e.radius, elapsedMs);
        if ((e.kind === "reaper" || e.kind === "lich") && e.maxHp) {
          drawHpBar(
            context,
            e.x,
            e.y + e.radius + 8,
            e.radius * 2.6,
            e.hp / e.maxHp,
            "#fb7185",
          );
        }
        // Phase 16B: enemy pack synergy tell — a plain colored outline ring
        // (cheap, no shadowBlur) so the buff is visible while it holds, not
        // just felt as a stat change. Not gated by reduceMotion — it's
        // gameplay-relevant information, not decoration.
        if (e.hypedByBats || e.shieldWalled || e.chorusBuffed) {
          context.save();
          context.lineWidth = 2;
          context.strokeStyle = e.hypedByBats
            ? "rgba(249, 115, 22, 0.85)" // Hype the Ogre — orange
            : e.shieldWalled
              ? "rgba(226, 232, 240, 0.85)" // Shield Wall — pale
              : "rgba(165, 243, 252, 0.85)"; // Haunting Chorus — cyan
          context.beginPath();
          context.arc(e.x, e.y, e.radius + 5, 0, Math.PI * 2);
          context.stroke();
          context.restore();
        }
      }
      for (const p of projectiles) {
        drawProjectile(
          context,
          p.x,
          p.y,
          p.width / 2,
          p.color,
          p.dx,
          p.dy,
          p.source,
        );
      }
      for (const p of enemyProjectiles) {
        drawDangerHalo(context, p.x, p.y, p.width / 2, elapsedMs);
        drawProjectile(
          context,
          p.x,
          p.y,
          p.width / 2,
          p.color,
          p.dx,
          p.dy,
          p.source,
        );
      }
      // Boss wind-up tells, above the sprites so they can't be missed.
      for (const e of enemies) {
        const untilNext =
          e.kind === "reaper"
            ? Math.min(
                REAPER_RING_INTERVAL_MS - (elapsedMs - (e.lastRingAt ?? 0)),
                REAPER_DASH_INTERVAL_MS - (elapsedMs - (e.lastDashAt ?? 0)),
              )
            : e.kind === "lich"
              ? LICH_CURSE_INTERVAL_MS - (elapsedMs - (e.lastRangedAt ?? 0))
              : Infinity;
        if (untilNext < WINDUP_WARNING_MS) {
          drawWindup(
            context,
            e.x,
            e.y,
            e.radius,
            1 - untilNext / WINDUP_WARNING_MS,
            elapsedMs,
          );
        }
      }
      const idleBobOffset =
        playerIsIdle && !reduceMotion ? Math.sin(playerBobPhase) * 1.6 : 0;
      const playerFlashAlpha = Math.max(
        0,
        (playerHitFlashUntil - elapsedMs) / HIT_FLASH_MS,
      );
      if (
        !reduceMotion &&
        player.hp > 0 &&
        player.hp / effectiveMaxHp() <= LOW_HP_THRESHOLD
      ) {
        drawHeartRing(
          context,
          player.x,
          player.y,
          PLAYER_RADIUS * 1.4,
          elapsedMs,
        );
      }
      drawPlayer(
        context,
        player.x,
        player.y + idleBobOffset,
        PLAYER_RADIUS,
        "#38bdf8",
        playerFacingAngle,
        playerFlashAlpha,
        playerPose(playerFlashAlpha),
        elapsedMs,
      );
      // The weapon in hand: it points where the player last struck, and the
      // blade swings through its arc.
      const heldId =
        lastAttack?.id ??
        ownedWeapons.find((w) => w.id !== "orbitShield")?.id ??
        null;
      if (heldId && heldId !== "orbitShield") {
        const since = lastAttack ? elapsedMs - lastAttack.at : Infinity;
        let a =
          lastAttack && since < 700 ? lastAttack.angle : playerFacingAngle;
        if (heldId === "bladeArc" && since < 260) {
          const q = since / 260;
          a = lastAttack!.angle - 1.2 + 2.4 * (1 - (1 - q) * (1 - q));
        }
        const recoil = since < 120 ? (1 - since / 120) * -3 : 0;
        drawWeaponGlyph(
          context,
          heldId,
          player.x + Math.cos(a) * (PLAYER_RADIUS * 1.9 + recoil),
          player.y +
            idleBobOffset +
            Math.sin(a) * (PLAYER_RADIUS * 1.9 + recoil),
          PLAYER_RADIUS * 0.95,
          a,
        );
      }
      for (const h of hitIndicators) {
        drawHitIndicator(
          context,
          player.x,
          player.y,
          h.angle,
          (elapsedMs - h.at) / 700,
        );
      }

      // --- Phase 7: joystick visual (base at touch-down point, knob follows) ---
      if (joystick) {
        context.save();
        context.strokeStyle = "rgba(226,232,240,0.5)";
        context.lineWidth = 2;
        context.beginPath();
        context.arc(
          joystick.originX,
          joystick.originY,
          JOYSTICK_BASE_VISUAL_RADIUS,
          0,
          Math.PI * 2,
        );
        context.stroke();
        context.fillStyle = "rgba(226,232,240,0.35)";
        context.beginPath();
        context.arc(
          joystick.curX,
          joystick.curY,
          JOYSTICK_KNOB_VISUAL_RADIUS,
          0,
          Math.PI * 2,
        );
        context.fill();
        context.restore();
      }

      for (const t of orbitTrails) {
        const age = elapsedMs - t.createdAt;
        const alpha = Math.max(0, 1 - age / ORBIT_TRAIL_LIFETIME_MS);
        context.fillStyle = `rgba(250,204,21,${alpha * 0.5})`;
        context.beginPath();
        context.arc(t.x, t.y, ORBIT_TRAIL_VISUAL_RADIUS, 0, Math.PI * 2);
        context.fill();
      }

      if (orbitCoverNow) {
        for (let i = 0; i < orbiterPositions.length; i++) {
          drawCoverArc(
            context,
            player.x,
            player.y,
            Math.hypot(
              orbiterPositions[i].x - player.x,
              orbiterPositions[i].y - player.y,
            ),
            orbiterBearings[i],
            orbitCoverNow.halfArcRad,
          );
        }
      }
      for (let i = 0; i < orbiterPositions.length; i++) {
        drawOrbiter(
          context,
          orbiterPositions[i].x,
          orbiterPositions[i].y,
          ORBIT_VISUAL_RADIUS * 1.5,
          orbiterBearings[i] ?? 0,
        );
      }

      for (const a of arcEffects) {
        drawSlash(
          context,
          a.x,
          a.y,
          a.radius,
          a.angle,
          a.halfArc,
          (elapsedMs - a.createdAt) / ARC_EFFECT_DURATION_MS,
        );
      }

      for (const st of enemyStrikes) {
        drawSlash(
          context,
          st.x,
          st.y,
          st.range,
          st.angle,
          st.half,
          (elapsedMs - st.at) / 220,
          "#fecaca",
        );
      }

      for (const g of gravityWells) {
        const life = (elapsedMs - g.startedAt) / (g.endsAt - g.startedAt);
        const fade = Math.min(1, life * 6, (1 - life) * 6);
        context.save();
        context.globalAlpha = 0.28 * fade;
        context.fillStyle = "#4c1d95";
        context.beginPath();
        context.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 0.9 * fade;
        context.lineCap = "round";
        for (let k = 0; k < 3; k++) {
          const a0 = elapsedMs / 450 + (k * Math.PI * 2) / 3;
          for (const [rr, w, col] of [
            [g.radius * 0.92, 4, "#c4b5fd"],
            [g.radius * 0.6, 3, "#a78bfa"],
            [g.radius * 0.3, 2.5, "#ddd6fe"],
          ] as const) {
            context.lineWidth = w;
            context.strokeStyle = col;
            context.beginPath();
            context.arc(g.x, g.y, rr, a0 + rr / 50, a0 + rr / 50 + 0.9);
            context.stroke();
          }
        }
        context.fillStyle = "#1e1b4b";
        context.beginPath();
        context.arc(g.x, g.y, g.radius * 0.12, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
      for (const pool of acidPools) {
        const left = Math.min(1, (pool.until - elapsedMs) / 900);
        context.save();
        context.globalAlpha = 0.55 * left;
        context.fillStyle = "#84cc16";
        context.beginPath();
        context.ellipse(
          pool.x,
          pool.y,
          ACID_POOL_RADIUS,
          ACID_POOL_RADIUS * 0.7,
          0,
          0,
          Math.PI * 2,
        );
        context.fill();
        context.globalAlpha = 0.9 * left;
        context.lineWidth = 2;
        context.strokeStyle = "#365314";
        context.stroke();
        context.fillStyle = "#d9f99d";
        for (let k = 0; k < 3; k++) {
          const ph = (elapsedMs / 700 + k / 3) % 1;
          context.globalAlpha = (1 - ph) * left;
          context.beginPath();
          context.arc(
            pool.x + (k - 1) * 12,
            pool.y + 4 - ph * 10,
            2.5,
            0,
            Math.PI * 2,
          );
          context.fill();
        }
        context.restore();
      }
      for (const a of acidShots) {
        const t = Math.min(1, (elapsedMs - a.startedAt) / SPITTER_LAND_MS);
        context.save();
        context.setLineDash([5, 5]);
        context.lineWidth = 2;
        context.strokeStyle = "rgba(190,242,100,0.95)";
        context.beginPath();
        context.ellipse(
          a.x,
          a.y,
          ACID_POOL_RADIUS * (1.25 - 0.25 * t),
          ACID_POOL_RADIUS * (1.25 - 0.25 * t) * 0.7,
          0,
          0,
          Math.PI * 2,
        );
        context.stroke();
        context.setLineDash([]);
        context.fillStyle = "#65a30d";
        context.beginPath();
        context.arc(a.x, a.y - (1 - t) * (1 - t) * 110, 5, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
      for (const m of meteorStrikes) {
        const t = (elapsedMs - m.startedAt) / m.delayMs;
        if (t < 0) continue;
        drawMeteorWarning(context, m.x, m.y, m.radius, Math.min(1, t));
      }

      for (const p of pulseEffects) {
        drawNovaRing(
          context,
          p.x,
          p.y,
          p.radius,
          Math.min(1, (elapsedMs - p.createdAt) / PULSE_EFFECT_DURATION_MS),
          p.color,
        );
      }

      // Phase 15: Chain Lightning jump lines — a bright cyan-white streak
      // fading over CHAIN_EFFECT_DURATION_MS, cheap (no shadowBlur) like the
      // other weapon-effect draws above.
      for (const c of chainEffects) {
        drawBolt(
          context,
          c.x1,
          c.y1,
          c.x2,
          c.y2,
          Math.min(1, (elapsedMs - c.createdAt) / CHAIN_EFFECT_DURATION_MS),
          c.createdAt,
        );
      }

      for (const s of hitSparks) {
        const progress = Math.min(
          1,
          (elapsedMs - s.createdAt) / HIT_SPARK_DURATION_MS,
        );
        drawImpactBurst(context, s.x, s.y, progress, s.color);
      }

      drawParticles(context, particles);

      // Phase 14: floating damage numbers — rise and fade over
      // DAMAGE_NUMBER_DURATION_MS, drawn last so they sit above everything
      // else at the hit point.
      for (const n of damageNumbers) {
        const progress = Math.min(
          1,
          (elapsedMs - n.createdAt) / DAMAGE_NUMBER_DURATION_MS,
        );
        drawDamageNumber(
          context,
          n.x,
          n.y - progress * DAMAGE_NUMBER_RISE_PX,
          n.amount,
          progress,
          n.amount >= BIG_HIT_DAMAGE,
        );
      }
      context.restore();

      // Equipped weapons: icon, cooldown sweep and level, bottom-left.
      {
        const slot = 30;
        const gap = 6;
        let sx0 = 10;
        const sy0 = WORLD_H - slot - 10;
        for (const w of ownedWeapons) {
          const interval = weaponIntervalMs(w);
          const ready =
            interval === null
              ? 1
              : Math.min(
                  1,
                  Math.max(0, (elapsedMs - w.lastActionAt) / interval),
                );
          drawWeaponSlot(
            context,
            sx0,
            sy0,
            slot,
            w.id,
            w.level,
            ready,
            w.level >= WEAPON_MAX_LEVEL,
          );
          sx0 += slot + gap;
        }
      }

      if (bossIntro) {
        drawBossIntro(
          context,
          WORLD_W,
          WORLD_H,
          bossIntro.name,
          bossIntro.sub,
          Math.min(1, (elapsedMs - bossIntro.at) / 2400),
        );
      }
      for (const b of banners) {
        const p = Math.min(1, (elapsedMs - b.at) / 1500);
        drawSlamText(
          context,
          b.text,
          WORLD_W / 2,
          WORLD_H * 0.3,
          40,
          p,
          b.color,
          6,
        );
        drawSlamText(
          context,
          b.sub,
          WORLD_W / 2,
          WORLD_H * 0.3 + 30,
          15,
          p,
          "#e2e8f0",
        );
      }

      for (const e of enemies) {
        if ((e.kind === "reaper" || e.kind === "lich") && e.alive && e.maxHp) {
          drawBossBar(
            context,
            WORLD_W,
            e.kind === "reaper" ? "THE REAPER" : "THE LICH",
            e.hp / e.maxHp,
          );
        }
      }

      // Dangerous enemies that are off-screen get an edge arrow (the field
      // doesn't scroll, so they walk in from outside the canvas).
      for (const e of enemies) {
        const danger =
          e.kind === "reaper" ||
          e.kind === "lich" ||
          e.kind === "ogre" ||
          e.tier === "elite";
        if (!danger || !e.alive) continue;
        if (e.x >= 0 && e.x <= WORLD_W && e.y >= 0 && e.y <= WORLD_H) continue;
        drawOffscreenArrow(
          context,
          e.x,
          e.y,
          WORLD_W,
          WORLD_H,
          e.kind === "reaper" || e.kind === "lich" ? "#fb7185" : "#fde047",
          elapsedMs,
        );
      }
    },
  });

  log.log("loop starting", {
    BASE_SPAWN_INTERVAL_MS,
    MAX_ALIVE_ENEMIES,
    runDurationS,
    bossSpawnAtS,
    startingWeapons: ownedWeapons.map((w) => w.id),
  });
  loop.start();

  return {
    stop() {
      log.log("loop stopped manually");
      loop.stop();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", endJoystick);
      canvas.removeEventListener("pointercancel", endJoystick);
      canvas.removeEventListener("pointerleave", endJoystick);
    },
  };
}
