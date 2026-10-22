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
  homingDartShape,
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
    reactMs: number; // how stale its read of the fight is
    aimErr: number; // radians of aim jitter
    lead: number; // how well it leads a moving target
    dodge: number; // chance to react to a threat when it notices one
    idleMs: number; // average breather between attacks
  }
> = {
  easy: {
    speedMult: 0.85,
    label: "Easy",
    reactMs: 620,
    aimErr: 0.42,
    lead: 0,
    dodge: 0.3,
    idleMs: 900,
  },
  normal: {
    speedMult: 1,
    label: "Normal",
    reactMs: 400,
    aimErr: 0.24,
    lead: 0.3,
    dodge: 0.55,
    idleMs: 550,
  },
  hard: {
    speedMult: 1,
    label: "Hard",
    reactMs: 250,
    aimErr: 0.13,
    lead: 0.6,
    dodge: 0.8,
    idleMs: 300,
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
// It plays by the same rules as you: it has to hold a charge, it cannot see
// the future, it reads the fight a beat late, aims with some error, and can
// simply fail to notice an attack coming.

export interface AiMemory {
  nextDecideMs: number;
  strafe: 1 | -1;
  strafeUntilMs: number;
  aimErr: number;
  targetCharge: number;
  charging: boolean;
  idleUntilMs: number;
  overholdMs: number;
  dodgeVx: number;
  dodgeVy: number;
  dodgeUntilMs: number;
  foeX: number;
  foeY: number;
  foeVx: number;
  foeVy: number;
  foeSeenMs: number;
}

export const newAiMemory = (): AiMemory => ({
  nextDecideMs: 0,
  strafe: 1,
  strafeUntilMs: 0,
  aimErr: 0,
  targetCharge: 0.6,
  charging: false,
  idleUntilMs: 900,
  overholdMs: 0,
  dodgeVx: 0,
  dodgeVy: 0,
  dodgeUntilMs: 0,
  foeX: 0,
  foeY: 0,
  foeVx: 0,
  foeVy: 0,
  foeSeenMs: -1,
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
  id === "bolt" || id === "homingDart" || id === "chainLightning";

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
  const dx = foe.x - me.x;
  const dy = foe.y - me.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const px = -uy;
  const py = ux;

  // It looks at the fight only every `reactMs`: that is its reaction time.
  if (t >= mem.nextDecideMs) {
    mem.nextDecideMs = t + skill.reactMs * (0.7 + rng() * 0.6);
    if (mem.foeSeenMs >= 0) {
      const el = Math.max(0.05, (t - mem.foeSeenMs) / 1000);
      mem.foeVx = (foe.x - mem.foeX) / el;
      mem.foeVy = (foe.y - mem.foeY) / el;
    }
    mem.foeX = foe.x;
    mem.foeY = foe.y;
    mem.foeSeenMs = t;
    mem.aimErr = (rng() + rng() - 1) * skill.aimErr;
    if (t >= mem.strafeUntilMs) {
      mem.strafe = rng() < 0.5 ? 1 : -1;
      mem.strafeUntilMs = t + 700 + rng() * 900;
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
          angleDiff(foe.aim, Math.atan2(-dy, -dx)) < 0.5 ||
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
        if (sd > 170) continue;
        const sp = Math.hypot(s.vx, s.vy) || 1;
        const along = (sx * s.vx + sy * s.vy) / (sd * sp || 1);
        if (along < 0.85) continue;
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

    // Start a charge when the foe is within reach of a full one.
    if (
      !mem.charging &&
      t >= mem.idleUntilMs &&
      me.recoverMs <= 0 &&
      me.dashMs <= 0
    ) {
      const need = chargeToReach(me.weaponId, me.level, dist);
      if (need !== null) {
        mem.charging = true;
        mem.overholdMs = 0;
        // Usually more than the bare minimum: hits that matter need charge.
        mem.targetCharge = Math.min(1, Math.max(need, 0.45 + rng() * 0.55));
      }
    }
  }

  // Charging: let go once the charge is enough, or give up on a lost cause.
  let charge = false;
  if (mem.charging && me.recoverMs <= 0) {
    const cNow = chargeFrac(me);
    const need = chargeToReach(me.weaponId, me.level, dist);
    if (me.chargeMs > 0 && cNow >= 1) mem.overholdMs += 16.7;
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

  // Movement.
  const pref = preferredRange(me);
  const margin = 22;
  const radial = dist > pref + margin ? 1 : dist < pref - margin ? -1 : 0;
  const ranged = isRanged(me.weaponId);
  let vx = ux * radial + px * mem.strafe * (ranged ? 0.9 : 0.5);
  let vy = uy * radial + py * mem.strafe * (ranged ? 0.9 : 0.5);
  if (t < mem.dodgeUntilMs) {
    vx += mem.dodgeVx;
    vy += mem.dodgeVy;
  }
  const m = 60;
  if (me.x < m) vx += 1.5;
  if (me.x > ARENA_W - m) vx -= 1.5;
  if (me.y < m) vy += 1.5;
  if (me.y > ARENA_H - m) vy -= 1.5;

  // Aim at where it last saw the target, partly led, with human error.
  const flight = ranged && me.weaponId !== "chainLightning" ? dist / 300 : 0;
  const tx = foe.x + mem.foeVx * flight * skill.lead;
  const ty = foe.y + mem.foeVy * flight * skill.lead;
  const aim = Math.atan2(ty - me.y, tx - me.x) + mem.aimErr;
  return { x: vx, y: vy, aim, charge };
}

/** Headless match for tests and tuning: AI vs AI. Returns the winning side
 * (or the one with more HP at the time limit; null on an exact tie). */
export function simulateMatch(
  a: Loadout,
  b: Loadout,
  difficulty: Difficulty,
  rng: () => number,
  limitMs = 90_000,
) {
  const state = createDuel(a, b);
  const mems = [newAiMemory(), newAiMemory()];
  const STEP = 1000 / 60;
  while (state.timeMs < limitMs) {
    stepDuel(state, STEP, [
      aiInput(state, state.fighters[0], difficulty, mems[0], rng),
      aiInput(state, state.fighters[1], difficulty, mems[1], rng),
    ]);
    if (state.fighters[0].hp <= 0 || state.fighters[1].hp <= 0) break;
  }
  const [x, y] = state.fighters;
  const winner = x.hp === y.hp ? null : x.hp > y.hp ? 0 : 1;
  return { winner, timeMs: state.timeMs, hp: [x.hp, y.hp] as [number, number] };
}
