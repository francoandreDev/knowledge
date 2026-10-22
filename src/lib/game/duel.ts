// 1v1 duel rules, kept pure (no canvas, no DOM) so the same step runs in the
// browser and in headless fairness tests. Both fighters follow identical
// rules: same speed, same HP, weapons that behave the same whoever holds
// them. Auto-fire, like the main game, so the match is decided by movement:
// range, dodging, and reading the other fighter's tells.
import {
  BLADE_ARC_RADIUS,
  ORBIT_HIT_COOLDOWN_MS,
  SAFE_DPS_BUDGET,
  WEAPON_MAX_LEVEL,
  bladeArcShape,
  boltShape,
  chainLightningShape,
  homingDartShape,
  novaPulseShape,
  orbitCover,
  orbitShieldShape,
  weaponDamage,
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

const BOLT_SPEED = 300;
const BOLT_TTL_MS = 1800;
const DART_SPEED = 200;
const DART_TURN_RATE = 4; // rad/s, same as the main game
const DART_TTL_MS = 3200;
const SHOT_RADIUS = 5;
const CHAIN_RANGE = 210;
const NOVA_WINDUP_MS = 260;
const BLADE_WINDUP_MS = 170;
const NOVA_TRIGGER_SLACK = 26; // starts the pulse a little before it can land

// A single target takes a nova's whole pulse and a chain's first jump; these
// scale each weapon's per-hit damage from the crowd it was balanced for to one
// opponent. Fitted by `scripts/duel-fit.ts` so every weapon wins about half
// its matches across all pairings and levels (AI vs AI, sides alternating).
export const DUEL_DAMAGE_SCALE: Record<WeaponId, number> = {
  bolt: 2.52,
  homingDart: 0.79,
  chainLightning: 2.05,
  novaPulse: 1.98,
  orbitShield: 0.7,
  bladeArc: 0.43,
};

export function duelDamage(id: WeaponId, level: number): number {
  return weaponDamage(id, level) * DUEL_DAMAGE_SCALE[id];
}

export type Difficulty = "easy" | "normal" | "hard";

export const DIFFICULTY: Record<
  Difficulty,
  { speedMult: number; dodge: number; label: string }
> = {
  easy: { speedMult: 0.85, dodge: 0.3, label: "Easy" },
  normal: { speedMult: 1, dodge: 0.7, label: "Normal" },
  hard: { speedMult: 1, dodge: 0.95, label: "Hard" },
};

export interface Windup {
  kind: "blade" | "nova";
  msLeft: number;
  totalMs: number;
  angle: number;
  radius: number;
  arc: number; // radians, full width
}

export interface Fighter {
  side: 0 | 1;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  weaponId: WeaponId;
  level: number;
  speedMult: number;
  cdMs: number;
  orbitAngle: number;
  lastOrbitHitMs: number;
  aim: number;
  windup: Windup | null;
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
  | { type: "shoot"; side: 0 | 1 };

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
    cdMs: 600, // nobody fires on frame zero
    orbitAngle: side === 0 ? 0 : Math.PI,
    lastOrbitHitMs: -Infinity,
    aim: side === 0 ? 0 : Math.PI,
    windup: null,
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

// Damage lands here: the Orbit Shield soaks hits from its side.
function hit(
  state: DuelState,
  target: Fighter,
  attacker: Fighter,
  amount: number,
  srcX: number,
  srcY: number,
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
  ttlMs: number,
  damage: number,
  homing: boolean,
) {
  state.shots.push({
    x: f.x + Math.cos(angle) * (FIGHTER_RADIUS + 2),
    y: f.y + Math.sin(angle) * (FIGHTER_RADIUS + 2),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    ttlMs,
    owner: f.side,
    damage,
    homing,
    alive: true,
  });
}

function updateWeapon(
  state: DuelState,
  f: Fighter,
  foe: Fighter,
  dtMs: number,
) {
  const dist = Math.hypot(foe.x - f.x, foe.y - f.y);
  const dmg = duelDamage(f.weaponId, f.level);
  f.cdMs -= dtMs;

  if (f.windup) {
    f.windup.msLeft -= dtMs;
    if (f.windup.msLeft <= 0) {
      const w = f.windup;
      f.windup = null;
      const d = Math.hypot(foe.x - f.x, foe.y - f.y);
      if (w.kind === "nova") {
        state.events.push({
          type: "nova",
          side: f.side,
          x: f.x,
          y: f.y,
          radius: w.radius,
        });
        if (d <= w.radius + FIGHTER_RADIUS) hit(state, foe, f, dmg, f.x, f.y);
      } else {
        state.events.push({
          type: "slash",
          side: f.side,
          x: f.x,
          y: f.y,
          angle: w.angle,
          arc: w.arc,
          radius: w.radius,
        });
        const bearing = Math.atan2(foe.y - f.y, foe.x - f.x);
        if (
          d <= w.radius + FIGHTER_RADIUS &&
          angleDiff(bearing, w.angle) <= w.arc / 2
        ) {
          hit(state, foe, f, dmg, f.x, f.y);
        }
      }
    }
    return;
  }

  switch (f.weaponId) {
    case "bolt": {
      if (f.cdMs > 0) return;
      const s = boltShape(f.level);
      f.cdMs += s.intervalMs;
      for (let k = 0; k < s.count; k++) {
        const spread = (k - (s.count - 1) / 2) * 0.16;
        fireShot(state, f, f.aim + spread, BOLT_SPEED, BOLT_TTL_MS, dmg, false);
      }
      state.events.push({ type: "shoot", side: f.side });
      return;
    }
    case "homingDart": {
      if (f.cdMs > 0) return;
      const s = homingDartShape(f.level);
      f.cdMs += s.intervalMs;
      for (let k = 0; k < s.count; k++) {
        const spread = (k - (s.count - 1) / 2) * 0.5;
        fireShot(state, f, f.aim + spread, DART_SPEED, DART_TTL_MS, dmg, true);
      }
      state.events.push({ type: "shoot", side: f.side });
      return;
    }
    case "chainLightning": {
      if (f.cdMs > 0 || dist > CHAIN_RANGE) return;
      f.cdMs += chainLightningShape(f.level).intervalMs;
      state.events.push({
        type: "chain",
        side: f.side,
        x1: f.x,
        y1: f.y,
        x2: foe.x,
        y2: foe.y,
      });
      hit(state, foe, f, dmg, f.x, f.y);
      return;
    }
    case "novaPulse": {
      const radius = novaPulseShape(f.level).radius;
      if (f.cdMs > 0 || dist > radius + FIGHTER_RADIUS + NOVA_TRIGGER_SLACK)
        return;
      f.cdMs += novaPulseShape(f.level).intervalMs;
      f.windup = {
        kind: "nova",
        msLeft: NOVA_WINDUP_MS,
        totalMs: NOVA_WINDUP_MS,
        angle: 0,
        radius,
        arc: Math.PI * 2,
      };
      return;
    }
    case "bladeArc": {
      const s = bladeArcShape(f.level);
      if (f.cdMs > 0 || dist > BLADE_ARC_RADIUS + FIGHTER_RADIUS + 12) return;
      f.cdMs += s.intervalMs;
      f.windup = {
        kind: "blade",
        msLeft: BLADE_WINDUP_MS,
        totalMs: BLADE_WINDUP_MS,
        angle: f.aim,
        radius: BLADE_ARC_RADIUS,
        arc: (s.arcDeg * Math.PI) / 180,
      };
      return;
    }
    case "orbitShield": {
      const s = orbitShieldShape(f.level);
      if (state.timeMs - f.lastOrbitHitMs < ORBIT_HIT_COOLDOWN_MS) return;
      for (const o of orbiterPositions(f)) {
        if (
          Math.hypot(foe.x - o.x, foe.y - o.y) <
          s.hitRadius + FIGHTER_RADIUS
        ) {
          f.lastOrbitHitMs = state.timeMs;
          hit(state, foe, f, dmg, o.x, o.y);
          break;
        }
      }
      return;
    }
  }
}

export interface Input {
  x: number;
  y: number;
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
    const len = Math.hypot(inp.x, inp.y);
    if (len > 0.001) {
      const k = Math.min(1, len) / len;
      f.x += inp.x * k * FIGHTER_SPEED * f.speedMult * dt;
      f.y += inp.y * k * FIGHTER_SPEED * f.speedMult * dt;
    }
    f.x = clamp(f.x, FIGHTER_RADIUS, ARENA_W - FIGHTER_RADIUS);
    f.y = clamp(f.y, FIGHTER_RADIUS, ARENA_H - FIGHTER_RADIUS);
    f.hitFlashMs = Math.max(0, f.hitFlashMs - dtMs);
  }
  for (const f of state.fighters) {
    const foe = state.fighters[f.side === 0 ? 1 : 0];
    f.aim = Math.atan2(foe.y - f.y, foe.x - f.x);
  }
  // Orbiters advance for both fighters before anything hits, so neither side
  // is judged against a stale ring just because it is processed second.
  for (const f of state.fighters) {
    if (f.weaponId === "orbitShield") {
      f.orbitAngle += orbitShieldShape(f.level).rotationRadPerS * dt;
    }
  }
  for (const f of state.fighters) {
    updateWeapon(state, f, state.fighters[f.side === 0 ? 1 : 0], dtMs);
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

export interface AiMemory {
  strafe: 1 | -1;
  strafeUntilMs: number;
  dodgeOk: boolean;
  dodgeUntilMs: number;
}

export const newAiMemory = (): AiMemory => ({
  strafe: 1,
  strafeUntilMs: 0,
  dodgeOk: true,
  dodgeUntilMs: 0,
});

function preferredRange(f: Fighter) {
  switch (f.weaponId) {
    case "bolt":
      return 230;
    case "homingDart":
      return 210;
    case "chainLightning":
      return CHAIN_RANGE - 45;
    case "novaPulse":
      return novaPulseShape(f.level).radius * 0.8;
    case "bladeArc":
      return BLADE_ARC_RADIUS * 0.75;
    case "orbitShield":
      return 34;
  }
}

/** A fighter that keeps its weapon's range, strafes, and sidesteps threats. */
export function aiInput(
  state: DuelState,
  me: Fighter,
  difficulty: Difficulty,
  mem: AiMemory,
  rng: () => number,
): Input {
  const foe = state.fighters[me.side === 0 ? 1 : 0];
  const skill = DIFFICULTY[difficulty];
  const dx = foe.x - me.x;
  const dy = foe.y - me.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const px = -uy;
  const py = ux;

  if (state.timeMs >= mem.strafeUntilMs) {
    mem.strafe = rng() < 0.5 ? 1 : -1;
    mem.strafeUntilMs = state.timeMs + 700 + rng() * 900;
  }
  if (state.timeMs >= mem.dodgeUntilMs) {
    // A fresh roll every beat: a weaker rival simply misses more threats.
    mem.dodgeOk = rng() < skill.dodge;
    mem.dodgeUntilMs = state.timeMs + 200;
  }

  const pref = preferredRange(me);
  const margin = 22;
  const radial = dist > pref + margin ? 1 : dist < pref - margin ? -1 : 0;
  const ranged =
    me.weaponId === "bolt" ||
    me.weaponId === "homingDart" ||
    me.weaponId === "chainLightning";
  let vx = ux * radial + px * mem.strafe * (ranged ? 0.9 : 0.5);
  let vy = uy * radial + py * mem.strafe * (ranged ? 0.9 : 0.5);

  if (mem.dodgeOk) {
    for (const s of state.shots) {
      if (s.owner === me.side) continue;
      const sx = me.x - s.x;
      const sy = me.y - s.y;
      const sd = Math.hypot(sx, sy);
      if (sd > 150) continue;
      const sp = Math.hypot(s.vx, s.vy) || 1;
      const along = (sx * s.vx + sy * s.vy) / (sd * sp || 1);
      if (along < 0.85) continue;
      // Step across the shot's line, away from the side it is aimed at.
      const cross = sx * (-s.vy / sp) + sy * (s.vx / sp);
      const side = cross >= 0 ? 1 : -1;
      vx += (-s.vy / sp) * side * 2.2;
      vy += (s.vx / sp) * side * 2.2;
    }
    const w = foe.windup;
    if (w && dist < w.radius + FIGHTER_RADIUS + 18) {
      const inArc =
        w.kind === "nova" ||
        angleDiff(Math.atan2(me.y - foe.y, me.x - foe.x), w.angle) <=
          w.arc / 2 + 0.3;
      if (inArc) {
        vx += -ux * 2.4 + px * mem.strafe * 0.8;
        vy += -uy * 2.4 + py * mem.strafe * 0.8;
      }
    }
  }

  const m = 60;
  if (me.x < m) vx += 1.5;
  if (me.x > ARENA_W - m) vx -= 1.5;
  if (me.y < m) vy += 1.5;
  if (me.y > ARENA_H - m) vy -= 1.5;
  return { x: vx, y: vy };
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
