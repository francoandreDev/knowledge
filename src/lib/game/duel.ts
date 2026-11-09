// 1v1 duel rules, kept pure (no canvas, no DOM) so the same step runs in the
// browser and in headless fairness tests. Both fighters follow identical
// rules: same speed, same HP. Nothing fires by itself: you hold to charge and
// release to strike, and how long you held sets how far the attack reaches
// and how hard it hits. A long charge is slow and visible to the other fighter
// (the tell), and getting hit while charging knocks the charge away.
import {
  BLADE_ARC_RADIUS,
  ORBIT_HIT_COOLDOWN_MS,
  SAFE_DPS_BUDGET,
  WEAPON_MAX_LEVEL,
  bladeArcShape,
  boltShape,
  gravityWellShape,
  flameTrailShape,
  homingDartShape,
  meteorRainShape,
  novaPulseShape,
  orbitCover,
  orbitShieldShape,
} from "./balance";
import type { WeaponId } from "./engine";

export const ARENA_W = 600;
export const ARENA_H = 500;
export const FIGHTER_RADIUS = 14;
export const FIGHTER_SPEED = 150; // px/s
// Weapons hit harder at higher levels, so HP follows the same curve (a bit
// flatter) and a fight lasts about as long at every level.
export function duelHp(level: number): number {
  const L = Math.min(WEAPON_MAX_LEVEL, Math.max(1, level));
  return Math.round(
    260 * (SAFE_DPS_BUDGET[L - 1] / SAFE_DPS_BUDGET[0]) ** 0.75,
  );
}

export const CHARGE_FULL_MS = 1000;
const MIN_CHARGE = 0.2; // a tap still throws something, just a feeble something
const CHARGE_MOVE_MULT = 0.5; // winding up commits you
const STAGGER_MS = 220; // a clean hit knocks the charge away and stuns briefly
const BOLT_SPEED = 360;
const DART_SPEED = 230;
const DART_TURN_RATE = 3.2; // rad/s
const SHOT_RADIUS = 5;
const CHAIN_HALF_CONE = 0.32;
const DASH_SPEED = 520;

// A clean full-charge hit takes this share of max HP, times the weapon factor.
// Weapons that are harder to land (short reach, narrow) hit harder.
const FULL_HIT_SHARE = 0.14;
const WEAPON_FACTOR: Record<WeaponId, number> = {
  bolt: 2.1,
  homingDart: 0.6,
  chainLightning: 0.75,
  meteorRain: 0.9,
  gravityWell: 0.8,
  flameTrail: 0.85,
  sentryTotem: 0.8,
  novaPulse: 1.6,
  orbitShield: 0.85,
  bladeArc: 3.2,
};
const RING_TICK_SHARE = 0.04;
export const DUEL_WEAPONS = Object.keys(WEAPON_FACTOR) as WeaponId[];

/** Damage rises faster than charge, so holding longer pays off. */
const power = (c: number) => 0.1 + 0.9 * c * c;

export type Difficulty = "easy" | "normal" | "hard";

export const DIFFICULTY: Record<
  Difficulty,
  {
    speedMult: number;
    label: string;
    /** Time: how stale its read of the fight is (ms, rolled 0.7-1.3x). */
    reactMs: number;
    /** Time: the wait between seeing a chance and starting to charge, as a
     * range in ms. A person does not strike the instant something is in
     * reach. */
    engageMs: [number, number];
    /** Time: how long it takes to settle into a new direction (ms); it
     * cannot change its velocity in a single frame. */
    moveLagMs: number;
    /** Time: chance that a look at the fight is missed, so it acts on the
     * last one it had. */
    lapse: number;
    /** Aim: the fastest it can swing its aim, in radians per second. */
    turnRate: number;
    /** Aim: radians of error in where it points, and how well it leads a
     * moving target. */
    aimErr: number;
    lead: number;
    /** Precision: how wrong its sense of the distance can be, as a share of
     * it. This is what makes it fall short or overshoot a charge. */
    rangeErr: number;
    /** Chance to react to a threat when it notices one. */
    dodge: number;
    /** Average breather between attacks (ms). */
    idleMs: number;
  }
> = {
  easy: {
    speedMult: 0.85,
    label: "Easy",
    reactMs: 640,
    engageMs: [450, 950],
    moveLagMs: 260,
    lapse: 0.22,
    turnRate: 2.8,
    aimErr: 0.46,
    lead: 0,
    rangeErr: 0.24,
    dodge: 0.25,
    idleMs: 950,
  },
  normal: {
    speedMult: 1,
    label: "Normal",
    reactMs: 480,
    engageMs: [300, 700],
    moveLagMs: 190,
    lapse: 0.14,
    turnRate: 4.2,
    aimErr: 0.32,
    lead: 0.22,
    rangeErr: 0.17,
    dodge: 0.42,
    idleMs: 680,
  },
  hard: {
    speedMult: 1,
    label: "Hard",
    reactMs: 340,
    engageMs: [180, 450],
    moveLagMs: 130,
    lapse: 0.08,
    turnRate: 6,
    aimErr: 0.2,
    lead: 0.42,
    rangeErr: 0.1,
    dodge: 0.62,
    idleMs: 440,
  },
};

export interface Fighter {
  side: 0 | 1;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  weaponId: WeaponId;
  level: number;
  speedMult: number;
  chargeMs: number;
  recoverMs: number;
  dashMs: number;
  dashVx: number;
  dashVy: number;
  dashDamage: number;
  orbitAngle: number;
  lastOrbitHitMs: number;
  aim: number;
  damageDealt: number;
  hitsTaken: number;
  hitFlashMs: number;
}

export interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttlMs: number;
  owner: 0 | 1;
  damage: number;
  homing: boolean;
  alive: boolean;
}

export type DuelEvent =
  | { type: "hit"; side: 0 | 1; amount: number; x: number; y: number }
  | { type: "block"; side: 0 | 1; x: number; y: number }
  | {
      type: "slash";
      side: 0 | 1;
      x: number;
      y: number;
      angle: number;
      arc: number;
      radius: number;
    }
  | { type: "nova"; side: 0 | 1; x: number; y: number; radius: number }
  | {
      type: "chain";
      side: 0 | 1;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }
  | { type: "shoot"; side: 0 | 1 }
  | { type: "dash"; side: 0 | 1; x: number; y: number }
  | { type: "stagger"; side: 0 | 1; x: number; y: number };

export interface DuelState {
  timeMs: number;
  fighters: [Fighter, Fighter];
  shots: Shot[];
  events: DuelEvent[];
}

export interface Loadout {
  weaponId: WeaponId;
  level: number;
  speedMult?: number;
}

export function createDuel(a: Loadout, b: Loadout): DuelState {
  const hp = duelHp(Math.max(a.level, b.level));
  const make = (side: 0 | 1, l: Loadout): Fighter => ({
    side,
    x: side === 0 ? ARENA_W * 0.2 : ARENA_W * 0.8,
    y: ARENA_H / 2,
    hp,
    maxHp: hp,
    weaponId: l.weaponId,
    level: Math.min(WEAPON_MAX_LEVEL, Math.max(1, l.level)),
    speedMult: l.speedMult ?? 1,
    chargeMs: 0,
    recoverMs: 0,
    dashMs: 0,
    dashVx: 0,
    dashVy: 0,
    dashDamage: 0,
    orbitAngle: side === 0 ? 0 : Math.PI,
    lastOrbitHitMs: -Infinity,
    aim: side === 0 ? 0 : Math.PI,
    damageDealt: 0,
    hitsTaken: 0,
    hitFlashMs: 0,
  });
  return {
    timeMs: 0,
    fighters: [make(0, a), make(1, b)],
    shots: [],
    events: [],
  };
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const angleDiff = (a: number, b: number) => {
  let d = Math.abs(a - b) % (Math.PI * 2);
  if (d > Math.PI) d = Math.PI * 2 - d;
  return d;
};

export const chargeFrac = (f: Fighter) =>
  clamp(f.chargeMs / CHARGE_FULL_MS, 0, 1);

/** How far (edge to edge) a strike charged to `c` can land. */
export function attackRange(weaponId: WeaponId, level: number, c: number) {
  switch (weaponId) {
    case "bolt":
      return 140 + 380 * c;
    case "homingDart":
      return 160 + 320 * c;
    case "chainLightning":
      return 100 + 220 * c;
    case "meteorRain":
      return 120 + 300 * c;
    case "gravityWell":
      return 110 + 280 * c;
    case "flameTrail":
      return 90 + 200 * c;
    case "sentryTotem":
      return 130 + 260 * c;
    case "novaPulse":
      return novaPulseShape(level).radius * (0.6 + 0.9 * c);
    case "bladeArc":
      return BLADE_ARC_RADIUS * (0.75 + 0.55 * c);
    case "orbitShield":
      return 60 + 220 * c;
  }
}

/** The smallest charge that reaches a target `dist` away (centre to centre),
 * or null if even a full charge falls short. */
export function chargeToReach(
  weaponId: WeaponId,
  level: number,
  dist: number,
): number | null {
  const slack =
    weaponId === "orbitShield" ? FIGHTER_RADIUS * 2 : FIGHTER_RADIUS;
  for (let c = MIN_CHARGE; c <= 1.0001; c += 0.02) {
    if (attackRange(weaponId, level, c) + slack >= dist) return c;
  }
  return null;
}

export function strikeDamage(f: Fighter, c: number) {
  return f.maxHp * FULL_HIT_SHARE * WEAPON_FACTOR[f.weaponId] * power(c);
}

export function orbiterPositions(f: Fighter) {
  const s = orbitShieldShape(f.level);
  return Array.from({ length: s.count }, (_, i) => {
    const a = f.orbitAngle + (i * Math.PI * 2) / s.count;
    return {
      x: f.x + Math.cos(a) * s.radius,
      y: f.y + Math.sin(a) * s.radius,
      bearing: a,
    };
  });
}

// Damage lands here: the Orbit Shield soaks hits from its side. A real strike
// (not the shield's passive ring) also knocks the victim's charge away.
function hit(
  state: DuelState,
  target: Fighter,
  attacker: Fighter,
  amount: number,
  srcX: number,
  srcY: number,
  interrupt = true,
) {
  let dmg = amount;
  if (target.weaponId === "orbitShield") {
    const bearing = Math.atan2(srcY - target.y, srcX - target.x);
    const cover = orbitCover(target.level);
    for (const o of orbiterPositions(target)) {
      if (angleDiff(bearing, o.bearing) <= cover.halfArcRad) {
        dmg *= 1 - cover.reduction;
        state.events.push({ type: "block", side: target.side, x: o.x, y: o.y });
        break;
      }
    }
  }
  target.hp = Math.max(0, target.hp - dmg);
  target.hitsTaken += 1;
  target.hitFlashMs = 140;
  attacker.damageDealt += dmg;
  if (interrupt) {
    if (target.chargeMs > 0 || target.dashMs > 0) {
      state.events.push({
        type: "stagger",
        side: target.side,
        x: target.x,
        y: target.y,
      });
    }
    target.chargeMs = 0;
    target.dashMs = 0;
    target.recoverMs = Math.max(target.recoverMs, STAGGER_MS);
  }
  state.events.push({
    type: "hit",
    side: target.side,
    amount: dmg,
    x: target.x,
    y: target.y,
  });
}

function fireShot(
  state: DuelState,
  f: Fighter,
  angle: number,
  speed: number,
  travelPx: number,
  damage: number,
  homing: boolean,
) {
  state.shots.push({
    x: f.x + Math.cos(angle) * (FIGHTER_RADIUS + 2),
    y: f.y + Math.sin(angle) * (FIGHTER_RADIUS + 2),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    ttlMs: (travelPx / speed) * 1000,
    owner: f.side,
    damage,
    homing,
    alive: true,
  });
}

/** Lets go of the charge: the strike's reach and force come from `c`. */
function release(state: DuelState, f: Fighter, foe: Fighter, c: number) {
  const dmg = strikeDamage(f, c);
  const reach = attackRange(f.weaponId, f.level, c);
  const dist = Math.hypot(foe.x - f.x, foe.y - f.y);
  const bearing = Math.atan2(foe.y - f.y, foe.x - f.x);
  f.recoverMs = 240 + 260 * c; // a big swing leaves you open
  switch (f.weaponId) {
    case "bolt": {
      const s = boltShape(f.level);
      for (let k = 0; k < s.count; k++) {
        const spread = (k - (s.count - 1) / 2) * 0.16;
        fireShot(
          state,
          f,
          f.aim + spread,
          BOLT_SPEED,
          reach,
          dmg / s.count,
          false,
        );
      }
      state.events.push({ type: "shoot", side: f.side });
      return;
    }
    case "homingDart": {
      const s = homingDartShape(f.level);
      for (let k = 0; k < s.count; k++) {
        const spread = (k - (s.count - 1) / 2) * 0.5;
        fireShot(
          state,
          f,
          f.aim + spread,
          DART_SPEED,
          reach,
          dmg / s.count,
          true,
        );
      }
      state.events.push({ type: "shoot", side: f.side });
      return;
    }
    case "chainLightning": {
      const landed =
        dist <= reach + FIGHTER_RADIUS &&
        angleDiff(bearing, f.aim) <= CHAIN_HALF_CONE;
      state.events.push({
        type: "chain",
        side: f.side,
        x1: f.x,
        y1: f.y,
        x2: landed ? foe.x : f.x + Math.cos(f.aim) * reach,
        y2: landed ? foe.y : f.y + Math.sin(f.aim) * reach,
      });
      if (landed) hit(state, foe, f, dmg, f.x, f.y);
      return;
    }
    case "flameTrail":
    case "sentryTotem": {
      const r =
        (f.weaponId === "flameTrail" ? flameTrailShape(f.level).radius : 40) *
        0.9;
      const landed = dist <= reach + FIGHTER_RADIUS;
      const tx = landed ? foe.x : f.x + Math.cos(f.aim) * reach;
      const ty = landed ? foe.y : f.y + Math.sin(f.aim) * reach;
      state.events.push({
        type: "nova",
        side: f.side,
        x: tx,
        y: ty,
        radius: r,
      });
      if (landed) hit(state, foe, f, dmg, tx, ty);
      return;
    }
    case "gravityWell": {
      const r = gravityWellShape(f.level).radius * 0.7;
      const landed = dist <= reach + FIGHTER_RADIUS;
      const tx = landed ? foe.x : f.x + Math.cos(f.aim) * reach;
      const ty = landed ? foe.y : f.y + Math.sin(f.aim) * reach;
      state.events.push({
        type: "nova",
        side: f.side,
        x: tx,
        y: ty,
        radius: r,
      });
      if (landed) hit(state, foe, f, dmg, tx, ty);
      return;
    }
    case "meteorRain": {
      // The rock falls where the rival stands now; a short blast, not a beam.
      const r = meteorRainShape(f.level).radius;
      const landed = dist <= reach + FIGHTER_RADIUS;
      const tx = landed ? foe.x : f.x + Math.cos(f.aim) * reach;
      const ty = landed ? foe.y : f.y + Math.sin(f.aim) * reach;
      state.events.push({
        type: "nova",
        side: f.side,
        x: tx,
        y: ty,
        radius: r,
      });
      if (landed) hit(state, foe, f, dmg, tx, ty);
      return;
    }
    case "novaPulse": {
      state.events.push({
        type: "nova",
        side: f.side,
        x: f.x,
        y: f.y,
        radius: reach,
      });
      if (dist <= reach + FIGHTER_RADIUS) hit(state, foe, f, dmg, f.x, f.y);
      return;
    }
    case "bladeArc": {
      const arc = (bladeArcShape(f.level).arcDeg * Math.PI) / 180;
      state.events.push({
        type: "slash",
        side: f.side,
        x: f.x,
        y: f.y,
        angle: f.aim,
        arc,
        radius: reach,
      });
      if (
        dist <= reach + FIGHTER_RADIUS &&
        angleDiff(bearing, f.aim) <= arc / 2
      ) {
        hit(state, foe, f, dmg, f.x, f.y);
      }
      return;
    }
    case "orbitShield": {
      f.dashMs = (reach / DASH_SPEED) * 1000;
      f.dashVx = Math.cos(f.aim) * DASH_SPEED;
      f.dashVy = Math.sin(f.aim) * DASH_SPEED;
      f.dashDamage = dmg;
      state.events.push({ type: "dash", side: f.side, x: f.x, y: f.y });
      return;
    }
  }
}

/** Charges while held; returns the charge to strike with on the frame it is
 * let go. Strikes are collected first and resolved together, so two fighters
 * who let go on the same frame trade blows instead of the first one winning. */
function updateStrike(
  f: Fighter,
  wantCharge: boolean,
  dtMs: number,
): number | null {
  if (f.recoverMs > 0) {
    f.recoverMs -= dtMs;
    f.chargeMs = 0;
    return null;
  }
  if (f.dashMs > 0) {
    f.chargeMs = 0;
    return null;
  }
  if (wantCharge) {
    f.chargeMs = Math.min(CHARGE_FULL_MS, f.chargeMs + dtMs);
    return null;
  }
  if (f.chargeMs > 0) {
    const c = clamp(f.chargeMs / CHARGE_FULL_MS, MIN_CHARGE, 1);
    f.chargeMs = 0;
    return c;
  }
  return null;
}

// The orbiters and a lunging shield both hurt on touch. Lunges are judged
// before either lands, so two shields that collide trade hits.
function dashTouches(f: Fighter, foe: Fighter) {
  return (
    f.weaponId === "orbitShield" &&
    f.dashMs > 0 &&
    Math.hypot(foe.x - f.x, foe.y - f.y) < FIGHTER_RADIUS * 2 + 6
  );
}

function updateContact(
  state: DuelState,
  f: Fighter,
  foe: Fighter,
  lunged: boolean,
) {
  if (f.weaponId !== "orbitShield") return;
  if (lunged) {
    const dmg = f.dashDamage;
    f.dashMs = 0;
    hit(state, foe, f, dmg, f.x, f.y);
    return;
  }
  const s = orbitShieldShape(f.level);
  if (state.timeMs - f.lastOrbitHitMs < ORBIT_HIT_COOLDOWN_MS) return;
  for (const o of orbiterPositions(f)) {
    if (Math.hypot(foe.x - o.x, foe.y - o.y) < s.hitRadius + FIGHTER_RADIUS) {
      f.lastOrbitHitMs = state.timeMs;
      hit(state, foe, f, f.maxHp * RING_TICK_SHARE, o.x, o.y, false);
      break;
    }
  }
}

export interface Input {
  x: number;
  y: number;
  /** Where the fighter is aiming (radians); null aims at the opponent. */
  aim?: number | null;
  /** True while the attack button is held. */
  charge?: boolean;
}

/** Advances the match by `dtMs`; `inputs` are unit-ish movement vectors. */
export function stepDuel(
  state: DuelState,
  dtMs: number,
  inputs: [Input, Input],
) {
  state.events.length = 0;
  state.timeMs += dtMs;
  const dt = dtMs / 1000;
  for (const f of state.fighters) {
    const inp = inputs[f.side];
    if (f.dashMs > 0) {
      f.dashMs -= dtMs;
      f.x += f.dashVx * dt;
      f.y += f.dashVy * dt;
    } else {
      const len = Math.hypot(inp.x, inp.y);
      if (len > 0.001) {
        const k = Math.min(1, len) / len;
        const mult = f.speedMult * (f.chargeMs > 0 ? CHARGE_MOVE_MULT : 1);
        f.x += inp.x * k * FIGHTER_SPEED * mult * dt;
        f.y += inp.y * k * FIGHTER_SPEED * mult * dt;
      }
    }
    f.x = clamp(f.x, FIGHTER_RADIUS, ARENA_W - FIGHTER_RADIUS);
    f.y = clamp(f.y, FIGHTER_RADIUS, ARENA_H - FIGHTER_RADIUS);
    f.hitFlashMs = Math.max(0, f.hitFlashMs - dtMs);
  }
  for (const f of state.fighters) {
    const foe = state.fighters[f.side === 0 ? 1 : 0];
    const want = inputs[f.side].aim;
    f.aim = want ?? Math.atan2(foe.y - f.y, foe.x - f.x);
  }
  // Orbiters advance for both fighters before anything hits, so neither side
  // is judged against a stale ring just because it is processed second.
  for (const f of state.fighters) {
    if (f.weaponId === "orbitShield") {
      f.orbitAngle += orbitShieldShape(f.level).rotationRadPerS * dt;
    }
  }
  const strikes = state.fighters.map((f) =>
    updateStrike(f, inputs[f.side].charge ?? false, dtMs),
  );
  for (const f of state.fighters) {
    const c = strikes[f.side];
    if (c !== null) release(state, f, state.fighters[f.side === 0 ? 1 : 0], c);
  }
  const lunges = state.fighters.map((f) =>
    dashTouches(f, state.fighters[f.side === 0 ? 1 : 0]),
  );
  for (const f of state.fighters) {
    updateContact(
      state,
      f,
      state.fighters[f.side === 0 ? 1 : 0],
      lunges[f.side],
    );
  }
  for (const s of state.shots) {
    if (!s.alive) continue;
    const foe = state.fighters[s.owner === 0 ? 1 : 0];
    if (s.homing) {
      const want = Math.atan2(foe.y - s.y, foe.x - s.x);
      const cur = Math.atan2(s.vy, s.vx);
      let diff = want - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const turn = clamp(diff, -DART_TURN_RATE * dt, DART_TURN_RATE * dt);
      const sp = Math.hypot(s.vx, s.vy);
      s.vx = Math.cos(cur + turn) * sp;
      s.vy = Math.sin(cur + turn) * sp;
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.ttlMs -= dtMs;
    if (
      s.ttlMs <= 0 ||
      s.x < -20 ||
      s.x > ARENA_W + 20 ||
      s.y < -20 ||
      s.y > ARENA_H + 20
    ) {
      s.alive = false;
      continue;
    }
    if (Math.hypot(foe.x - s.x, foe.y - s.y) < SHOT_RADIUS + FIGHTER_RADIUS) {
      s.alive = false;
      hit(state, foe, state.fighters[s.owner], s.damage, s.x, s.y);
    }
  }
  state.shots = state.shots.filter((s) => s.alive);
}

// --- The rival ------------------------------------------------------------
// It plays by the same rules as you, and it plays like a person: it looks at
// the fight only every so often and sometimes misses a look, so it works from
// where you were rather than where you are; it swings its aim at a human
// speed and points with some error that drifts; it misjudges distance, so it
// falls short or overshoots a charge; it waits a beat between spotting a
// chance and starting to charge; and it cannot change direction in a single
// frame. Each fight it also rolls a "form" for the day, so it is sharper some
// matches and sloppier others. Three things set how good it is: aim (where it
// points and how fast), precision (how wrong it is about range and angle) and
// time (how long it takes to notice and to act).

export interface AiMemory {
  nextDecideMs: number;
  strafe: 1 | -1;
  strafeUntilMs: number;
  /** Aim error this look, plus a slow drift on top of it. */
  aimErr: number;
  aimDrift: number;
  /** How wrong its sense of the distance is, as a share of it. */
  rangeErr: number;
  /** A per-fight multiplier on its errors: >1 is a sloppy day. 0 until set. */
  form: number;
  targetCharge: number;
  charging: boolean;
  idleUntilMs: number;
  /** When it will start a charge it has decided on; 0 when it has not. */
  engageAtMs: number;
  /** It stands still to line up a shot until then. */
  pauseUntilMs: number;
  overholdMs: number;
  dodgeVx: number;
  dodgeVy: number;
  dodgeUntilMs: number;
  /** Where it last saw the foe, how it was moving, and when. */
  foeX: number;
  foeY: number;
  foeVx: number;
  foeVy: number;
  foeSeenMs: number;
  /** Its own smoothed movement, and the time of the last call. */
  vx: number;
  vy: number;
  lastT: number;
}

export const newAiMemory = (): AiMemory => ({
  nextDecideMs: 0,
  strafe: 1,
  strafeUntilMs: 0,
  aimErr: 0,
  aimDrift: 0,
  rangeErr: 0,
  form: 0,
  targetCharge: 0.6,
  charging: false,
  idleUntilMs: 1200,
  engageAtMs: 0,
  pauseUntilMs: 0,
  overholdMs: 0,
  dodgeVx: 0,
  dodgeVy: 0,
  dodgeUntilMs: 0,
  foeX: 0,
  foeY: 0,
  foeVx: 0,
  foeVy: 0,
  foeSeenMs: -1,
  vx: 0,
  vy: 0,
  lastT: -1,
});

function preferredRange(f: Fighter) {
  switch (f.weaponId) {
    case "orbitShield":
      return 40;
    case "bladeArc":
    case "novaPulse":
      return attackRange(f.weaponId, f.level, 0.8) * 0.9;
    default:
      return attackRange(f.weaponId, f.level, 0.85) * 0.8;
  }
}

const isRanged = (id: WeaponId) =>
  id === "bolt" ||
  id === "homingDart" ||
  id === "chainLightning" ||
  id === "meteorRain" ||
  id === "gravityWell" ||
  id === "flameTrail" ||
  id === "sentryTotem";

/** The shortest signed turn from `from` to `to`, in -PI..PI. */
function signedTurn(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** A fighter that keeps its weapon's range, strafes, charges and lets go. */
export function aiInput(
  state: DuelState,
  me: Fighter,
  difficulty: Difficulty,
  mem: AiMemory,
  rng: () => number,
): Input {
  const foe = state.fighters[me.side === 0 ? 1 : 0];
  const skill = DIFFICULTY[difficulty];
  const t = state.timeMs;
  const dtS = Math.min(
    0.1,
    Math.max(0.001, (t - (mem.lastT < 0 ? t - 16.7 : mem.lastT)) / 1000),
  );
  mem.lastT = t;
  if (mem.form === 0) mem.form = 0.85 + rng() * 0.3;

  // What it believes about the foe is what it saw at its last look, not where
  // the foe is now.
  const bx = mem.foeSeenMs >= 0 ? mem.foeX : foe.x;
  const by = mem.foeSeenMs >= 0 ? mem.foeY : foe.y;
  const dx = bx - me.x;
  const dy = by - me.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const px = -uy;
  const py = ux;
  // ...and its sense of how far away that is has an error of its own.
  const feltDist = dist * (1 + mem.rangeErr);

  // It looks at the fight only every `reactMs`: that is its reaction time.
  // Now and then it misses a look entirely and carries on with the last one.
  if (t >= mem.nextDecideMs) {
    mem.nextDecideMs = t + skill.reactMs * (0.7 + rng() * 0.6);
    const missed = mem.foeSeenMs >= 0 && rng() < skill.lapse;
    if (!missed) {
      if (mem.foeSeenMs >= 0) {
        const el = Math.max(0.05, (t - mem.foeSeenMs) / 1000);
        mem.foeVx = (foe.x - mem.foeX) / el;
        mem.foeVy = (foe.y - mem.foeY) / el;
      }
      mem.foeX = foe.x;
      mem.foeY = foe.y;
      mem.foeSeenMs = t;
      mem.rangeErr = (rng() + rng() - 1) * skill.rangeErr * mem.form;
    }
    const foeSpeed = Math.hypot(mem.foeVx, mem.foeVy);
    // A fast foe is harder to point at, so the error grows with its speed.
    mem.aimErr =
      (rng() + rng() - 1) *
      skill.aimErr *
      mem.form *
      (1 + Math.min(1, foeSpeed / FIGHTER_SPEED) * 0.5);
    if (t >= mem.strafeUntilMs) {
      mem.strafe = rng() < 0.5 ? 1 : -1;
      mem.strafeUntilMs = t + 700 + rng() * 900;
    }
    // Sometimes it plants its feet to line up a shot.
    if (rng() < 0.18 && t >= mem.pauseUntilMs) {
      mem.pauseUntilMs = t + 250 + rng() * 350;
    }

    // Threat: is the foe winding something up at me, or is a shot coming?
    mem.dodgeUntilMs = 0;
    if (rng() < skill.dodge) {
      let tx = 0;
      let ty = 0;
      if (foe.chargeMs > 120 || foe.dashMs > 0) {
        const reach =
          attackRange(
            foe.weaponId,
            foe.level,
            Math.min(1, chargeFrac(foe) + 0.3),
          ) + 28;
        const aimedAtMe =
          angleDiff(foe.aim, Math.atan2(me.y - foe.y, me.x - foe.x)) < 0.5 ||
          foe.weaponId === "novaPulse";
        if (dist < reach + FIGHTER_RADIUS && aimedAtMe) {
          if (foe.weaponId === "novaPulse") {
            tx += ux * -2.4;
            ty += uy * -2.4;
          } else {
            // Step across the line of fire, a little back as well.
            const sx = Math.cos(foe.aim);
            const sy = Math.sin(foe.aim);
            const cross = (me.x - foe.x) * -sy + (me.y - foe.y) * sx;
            const side = cross >= 0 ? 1 : -1;
            tx += -sy * side * 2.2 + ux * -0.8;
            ty += sx * side * 2.2 + uy * -0.8;
          }
        }
      }
      for (const s of state.shots) {
        if (s.owner === me.side) continue;
        const sx = me.x - s.x;
        const sy = me.y - s.y;
        const sd = Math.hypot(sx, sy);
        if (sd > 150) continue;
        const sp = Math.hypot(s.vx, s.vy) || 1;
        const along = (sx * s.vx + sy * s.vy) / (sd * sp || 1);
        if (along < 0.88) continue;
        const cross = sx * (-s.vy / sp) + sy * (s.vx / sp);
        const side = cross >= 0 ? 1 : -1;
        tx += (-s.vy / sp) * side * 2.2;
        ty += (s.vx / sp) * side * 2.2;
      }
      if (tx !== 0 || ty !== 0) {
        mem.dodgeVx = tx;
        mem.dodgeVy = ty;
        mem.dodgeUntilMs = t + skill.reactMs * 0.9;
      }
    }

    // A chance to strike: the foe seems to be within reach of a full charge.
    // It does not act on it at once; it takes a beat, as a person would.
    const need = chargeToReach(me.weaponId, me.level, feltDist);
    if (
      !mem.charging &&
      t >= mem.idleUntilMs &&
      me.recoverMs <= 0 &&
      me.dashMs <= 0 &&
      need !== null
    ) {
      if (mem.engageAtMs === 0) {
        const [lo, hi] = skill.engageMs;
        mem.engageAtMs = t + lo + rng() * (hi - lo);
      }
    } else if (need === null) {
      mem.engageAtMs = 0;
    }
  }
  if (
    !mem.charging &&
    mem.engageAtMs > 0 &&
    t >= mem.engageAtMs &&
    me.recoverMs <= 0 &&
    me.dashMs <= 0
  ) {
    mem.engageAtMs = 0;
    const need = chargeToReach(me.weaponId, me.level, feltDist);
    if (need !== null) {
      mem.charging = true;
      mem.overholdMs = 0;
      // Usually more than the bare minimum: hits that matter need charge.
      mem.targetCharge = Math.min(1, Math.max(need, 0.45 + rng() * 0.55));
    }
  }

  // Charging: let go once the charge is enough by its own estimate of the
  // range, or give up on a lost cause. Its estimate is off, so the shot can
  // fall short or carry past the target.
  let charge = false;
  if (mem.charging && me.recoverMs <= 0) {
    const cNow = chargeFrac(me);
    const need = chargeToReach(me.weaponId, me.level, feltDist);
    if (me.chargeMs > 0 && cNow >= 1) mem.overholdMs += dtS * 1000;
    if (
      (need !== null && cNow >= Math.max(need, mem.targetCharge) - 0.01) ||
      mem.overholdMs > 450
    ) {
      mem.charging = false;
      mem.idleUntilMs = t + skill.idleMs * (0.5 + rng());
    } else {
      charge = true;
    }
  } else if (me.recoverMs > 0 && mem.charging) {
    mem.charging = false; // knocked out of it
    mem.idleUntilMs = t + skill.idleMs * (0.5 + rng());
  }

  // Movement: it moves by its picture of the fight, strafes less than a
  // machine would, stops now and then, and eases into each change.
  const pref = preferredRange(me);
  const margin = 26;
  const radial =
    feltDist > pref + margin ? 1 : feltDist < pref - margin ? -1 : 0;
  const ranged = isRanged(me.weaponId);
  const settled = t < mem.pauseUntilMs ? 0 : 1;
  let vx = ux * radial + px * mem.strafe * (ranged ? 0.6 : 0.4) * settled;
  let vy = uy * radial + py * mem.strafe * (ranged ? 0.6 : 0.4) * settled;
  if (t < mem.dodgeUntilMs) {
    vx += mem.dodgeVx;
    vy += mem.dodgeVy;
  }
  const m = 60;
  if (me.x < m) vx += 1.5;
  if (me.x > ARENA_W - m) vx -= 1.5;
  if (me.y < m) vy += 1.5;
  if (me.y > ARENA_H - m) vy -= 1.5;
  const ease = 1 - Math.exp(-dtS / (skill.moveLagMs / 1000));
  mem.vx += (vx - mem.vx) * ease;
  mem.vy += (vy - mem.vy) * ease;

  // Aim at where it last saw the target, led a little by how it was moving
  // then, plus its error and a slow drift. The aim swings at a human speed:
  // it cannot snap onto a target that has moved.
  const flight =
    ranged && me.weaponId !== "chainLightning" ? feltDist / 300 : 0;
  const ageS = mem.foeSeenMs >= 0 ? (t - mem.foeSeenMs) / 1000 : 0;
  const tx = bx + mem.foeVx * (flight + ageS * 0.5) * skill.lead;
  const ty = by + mem.foeVy * (flight + ageS * 0.5) * skill.lead;
  mem.aimDrift = Math.max(
    -skill.aimErr * 0.5,
    Math.min(
      skill.aimErr * 0.5,
      mem.aimDrift + (rng() - 0.5) * skill.aimErr * 2.2 * dtS,
    ),
  );
  const wanted = Math.atan2(ty - me.y, tx - me.x) + mem.aimErr + mem.aimDrift;
  const turn = signedTurn(me.aim, wanted);
  const maxTurn = skill.turnRate * dtS;
  const aim = me.aim + Math.max(-maxTurn, Math.min(maxTurn, turn));
  return { x: mem.vx, y: mem.vy, aim, charge };
}

/** Headless match for tests and tuning: AI vs AI. Returns the winning side
 * (or the one with more HP at the time limit; null on an exact tie). */
export function simulateMatch(
  a: Loadout,
  b: Loadout,
  difficulty: Difficulty | [Difficulty, Difficulty],
  rng: () => number,
  limitMs = 90_000,
) {
  const [da, db] = Array.isArray(difficulty)
    ? difficulty
    : [difficulty, difficulty];
  const state = createDuel(a, b);
  const mems = [newAiMemory(), newAiMemory()];
  const STEP = 1000 / 60;
  while (state.timeMs < limitMs) {
    stepDuel(state, STEP, [
      aiInput(state, state.fighters[0], da, mems[0], rng),
      aiInput(state, state.fighters[1], db, mems[1], rng),
    ]);
    if (state.fighters[0].hp <= 0 || state.fighters[1].hp <= 0) break;
  }
  const [x, y] = state.fighters;
  const winner = x.hp === y.hp ? null : x.hp > y.hp ? 0 : 1;
  return { winner, timeMs: state.timeMs, hp: [x.hp, y.hp] as [number, number] };
}
