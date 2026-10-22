// Weapon and recovery balance — the single source of truth for numbers that
// engine.ts used to hard-code per weapon.
//
// The rule: weapons are different *styles*, not different damage. Every
// weapon is given the same damage budget per level; a weapon only earns more
// than that budget by taking on risk — a short reach that keeps the player
// among the enemies, no cover while it works, a long wait between hits.
// Damage per hit is not authored: it is derived from the budget and the
// weapon's own mechanics (rate, count, pierce, targets), so changing a
// mechanic can't silently change how strong the weapon is.
//
// balance.test.ts holds the invariants; the in-game training lab
// (GameOptions.training) is how to check them against real enemies.
import type { WeaponId } from "./engine";

export const WEAPON_MAX_LEVEL = 6; // level 6 is each weapon's evolved form

// --- Damage budget -----------------------------------------------------

// Effective DPS (damage per second, summed over the targets a weapon
// nominally hits) of a weapon with zero exposure, per level. ~1.5x per level.
export const SAFE_DPS_BUDGET = [10, 16, 25, 38, 56, 80];

// Extra budget per point of exposure: exposure 1 earns 3.2x. Measured, not
// guessed: with enemies on top of the player, a blade or nova at 1.85x killed
// about half what a bolt did for the same HP lost.
export const EXPOSURE_BONUS = 2.2;

// Exposure is 0 (hits from anywhere, nothing forces you near enemies) to 1
// (only works with enemies on top of you and nothing between). Authored, then
// checked against each weapon's reach by the tests.
export function exposure(id: WeaponId, level: number): number {
  const evolved = level >= WEAPON_MAX_LEVEL;
  switch (id) {
    case "bolt":
      return 0; // unlimited range, kiting works
    case "homingDart":
      return 0; // unlimited range, but you can't choose the target
    case "chainLightning":
      return 0.1; // first hit is free, full value needs a cluster
    case "novaPulse":
      return 0.7 - (level - 1) * 0.04; // centered on you; radius grows with level
    case "orbitShield":
      return 0.55; // short reach, but the orbiters double as cover
    case "bladeArc":
      return evolved ? 0.75 : 0.85; // short reach, one direction, no cover
  }
}

// Furthest an enemy can be from the player's center and still be hit.
export const BLADE_ARC_RADIUS = 74;
// Center-to-center distance at which a typical enemy stands against the
// player (player radius 14 + enemy radius 12). A weapon that claims to cover
// enemies on top of you has to reach this — the orbit once did not, and
// enemies simply parked in its blind spot.
export const CONTACT_DISTANCE_PX = 26;
export const ORBIT_HIT_COOLDOWN_MS = 400;
export const CHAIN_LIGHTNING_JUMP_DECAY = 0.75;

export function reachPx(id: WeaponId, level: number): number {
  switch (id) {
    case "bladeArc":
      return BLADE_ARC_RADIUS;
    case "orbitShield": {
      const o = orbitShieldShape(level);
      return o.radius + o.hitRadius;
    }
    case "novaPulse":
      return novaPulseShape(level).radius;
    default:
      return Infinity;
  }
}

// --- Per-weapon mechanics (how each weapon behaves at each level) ------

export function boltShape(level: number) {
  const evolved = level >= WEAPON_MAX_LEVEL; // Piercing Lance
  return {
    intervalMs: evolved ? 350 : 550 - (level - 1) * 30,
    count: evolved ? 1 : level >= 5 ? 3 : level >= 3 ? 2 : 1,
    pierce: evolved ? Infinity : level >= 4 ? 1 : 0,
  };
}

export function bladeArcShape(level: number) {
  const evolved = level >= WEAPON_MAX_LEVEL; // Whirlwind
  return {
    intervalMs: evolved ? 330 : 660 - (level - 1) * 60,
    arcDeg: evolved ? 360 : 120 + (level - 1) * 15,
  };
}

export function orbitShieldShape(level: number) {
  return {
    count: level >= 3 ? 2 : 1,
    radius: 42 + (level - 1) * 3,
    hitRadius: 10 + (level - 1) * 2,
    rotationRadPerS: 2.4 + (level - 1) * 0.3,
  };
}

// Each orbiter also soaks damage that comes from its side: a hit whose source
// lies within `halfArcRad` of an orbiter's bearing is cut by `reduction`. More
// orbiters and wider wedges cover more of the circle as the shield levels, so
// protection grows without the shield dealing a point more damage.
export function orbitCover(level: number) {
  return {
    reduction: 0.25 + (level - 1) * 0.06,
    halfArcRad: 0.6 + (level - 1) * 0.12,
  };
}

export function novaPulseShape(level: number) {
  return {
    intervalMs: 2000 - (level - 1) * 200,
    radius: 62 + (level - 1) * 15,
  };
}

export function homingDartShape(level: number) {
  const evolved = level >= WEAPON_MAX_LEVEL; // Swarm
  return {
    intervalMs: evolved ? 1200 : 900 - (level - 1) * 50,
    count: evolved ? 5 : level >= 2 ? 2 : 1,
  };
}

export function chainLightningShape(level: number) {
  const evolved = level >= WEAPON_MAX_LEVEL; // Storm Chain
  return {
    intervalMs: evolved ? 700 : 1000 - (level - 1) * 100,
    maxJumps: evolved ? Infinity : 2 + Math.floor((level - 1) / 2),
  };
}

// --- Damage per hit, derived from the budget ---------------------------

// How many "full hits" worth of damage one point of per-hit damage turns into
// each second, against the targets the weapon can nominally reach. This is
// what makes weapons comparable: a nova that hits ~3 enemies a burst is
// credited for all three, a bolt for one (more with pierce).
const SPREAD_DILUTION = 0.65; // a fanned volley mostly lands on one cluster
const NOVA_NOMINAL_TARGETS = 3;
// An orbiter sweeps past an enemy standing against the player for ~0.4s per
// lap, which with the 400ms hit cooldown is about two hits per lap, i.e. the
// orbiter lands ~0.75 hits/s on it: 0.3 of the cooldown-limited ceiling.
const ORBIT_CONTACT_UPTIME = 0.3;
const CHAIN_NOMINAL_HIT_CAP = 5; // "unlimited" jumps rarely find more

function pierceTargets(pierce: number): number {
  if (pierce === Infinity) return 2;
  return pierce >= 1 ? 1.25 : 1;
}

export function damageMultiplierPerS(id: WeaponId, level: number): number {
  switch (id) {
    case "bolt": {
      const s = boltShape(level);
      const volley = s.count * (s.count > 1 ? SPREAD_DILUTION : 1);
      return (1000 / s.intervalMs) * volley * pierceTargets(s.pierce);
    }
    case "bladeArc": {
      const s = bladeArcShape(level);
      return (1000 / s.intervalMs) * Math.min(3, 1 + s.arcDeg / 140);
    }
    case "orbitShield": {
      const s = orbitShieldShape(level);
      const trail = level >= WEAPON_MAX_LEVEL ? 1.4 : 1; // Barrier Storm's trail
      return (
        (1000 / ORBIT_HIT_COOLDOWN_MS) * s.count * ORBIT_CONTACT_UPTIME * trail
      );
    }
    case "novaPulse": {
      const s = novaPulseShape(level);
      return (1000 / s.intervalMs) * NOVA_NOMINAL_TARGETS;
    }
    case "homingDart": {
      const s = homingDartShape(level);
      return (1000 / s.intervalMs) * s.count;
    }
    case "chainLightning": {
      const s = chainLightningShape(level);
      const hits = Math.min(s.maxJumps, CHAIN_NOMINAL_HIT_CAP);
      let sum = 0;
      for (let i = 0; i < hits; i++) sum += CHAIN_LIGHTNING_JUMP_DECAY ** i;
      return (1000 / s.intervalMs) * sum;
    }
  }
}

// Room for a weapon that is safe but wastes damage getting it there. Empty
// now: CALIBRATION absorbs what measurement shows.
export const DELIVERY_BONUS: Partial<Record<WeaponId, number>> = {};

// Measured correction per weapon and level, fitted against the Bolt (the
// baseline) by `bun run balance:lab -- --fit`: 1 means the model was right.
export const CALIBRATION: Record<WeaponId, number[]> = {
  bolt: [1, 1, 1, 1, 1, 1],
  homingDart: [1, 1, 1, 1, 1, 1],
  chainLightning: [1, 1, 1, 1, 1, 1],
  novaPulse: [1, 1, 1, 1, 1, 1],
  orbitShield: [1, 1, 1, 1, 1, 1],
  // The blade pays the most exposure for the shortest reach, so it has to
  // clearly out-kill the ranged weapons to be worth standing in the crowd.
  bladeArc: [2.4, 2.4, 2.4, 2.4, 2.4, 2.4],
};

export function targetDps(id: WeaponId, level: number): number {
  return (
    SAFE_DPS_BUDGET[level - 1] *
    CALIBRATION[id][level - 1] *
    (1 + EXPOSURE_BONUS * exposure(id, level)) *
    (DELIVERY_BONUS[id] ?? 1)
  );
}

// A weapon that works in discrete swings and keeps you among the enemies has
// to delete what is already touching you: one swing must kill the basic enemy
// (12 HP at the start of a run, tougher as the run goes on). Continuous
// weapons (orbit, evolved spin) and ranged ones don't need this.
export const BASIC_ENEMY_HP = 12;
const ONE_SWING_HP_GROWTH_PER_LEVEL = 0.2;

export function oneSwingFloor(id: WeaponId, level: number): number {
  const discrete =
    id === "novaPulse" || (id === "bladeArc" && level < WEAPON_MAX_LEVEL);
  if (!discrete) return 0;
  return BASIC_ENEMY_HP * (1 + ONE_SWING_HP_GROWTH_PER_LEVEL * (level - 1));
}

// Per-hit damage before the run's damage multipliers.
export function weaponDamage(id: WeaponId, level: number): number {
  const raw = targetDps(id, level) / damageMultiplierPerS(id, level);
  return Math.round(Math.max(raw, oneSwingFloor(id, level)) * 10) / 10;
}

// What a weapon actually delivers at its authored damage, per second.
export function effectiveDps(id: WeaponId, level: number): number {
  return weaponDamage(id, level) * damageMultiplierPerS(id, level);
}

// --- Recovery ----------------------------------------------------------

// Contact damage a typical mid-roster enemy lands, per second, while it
// stays on the player (damage per touch over the player's hit cooldown).
export const PLAYER_HIT_COOLDOWN_MS = 600;
export const REFERENCE_CONTACT_DAMAGE = 10;
export const REFERENCE_INCOMING_HPS =
  REFERENCE_CONTACT_DAMAGE / (PLAYER_HIT_COOLDOWN_MS / 1000);

// Losing 20 HP/s while regenerating 5 is felt; regenerating 2 is not. So a
// fully invested recovery build has to cover at least this share of the
// reference incoming rate, and a single pick alone is allowed to be modest.
export const FELT_REGEN_RATIO = 0.25;

export const QUICK_RECOVERY_HPS = 1.5; // per Quick Recovery card stack
export const QUICK_RECOVERY_MAX_STACKS = 3;
export const SHOP_RECOVERY_HPS_PER_LEVEL = 0.5;
export const SHOP_RECOVERY_MAX_LEVEL = 3;

export function maxRecoveryHps(): number {
  return (
    QUICK_RECOVERY_HPS * QUICK_RECOVERY_MAX_STACKS +
    SHOP_RECOVERY_HPS_PER_LEVEL * SHOP_RECOVERY_MAX_LEVEL
  );
}
