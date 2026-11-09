// The field is not empty ground. Pillars block movement, goo slows whoever
// wades through it, spikes cycle up and down, mines wait to be stepped on and
// barrels go off when anything touches them or a blast reaches them. Enemies
// walk straight at the player and ignore all of it, so the player can lure
// them across a mine or a spike trap; the player can set them off by accident
// just as easily. Pure placement and rules here; engine.ts runs the effects
// and hazardView.ts draws them.

export type HazardKind = "pillar" | "mine" | "spikes" | "barrel" | "goo";

export interface Hazard {
  id: number;
  kind: HazardKind;
  x: number;
  y: number;
  r: number;
  /** Mines: the moment they finish arming. */
  armedAt: number;
  /** Spikes: shifts the cycle so traps do not all strike together. */
  phaseOffset: number;
  /** Spikes: when they last hurt something. */
  lastTickAt: number;
  /** Mines and barrels: when they explode once set off; null while idle. */
  fuseAt: number | null;
  alive: boolean;
}

export const HAZARD_RADIUS: Record<HazardKind, number> = {
  pillar: 20,
  mine: 11,
  spikes: 26,
  barrel: 15,
  goo: 42,
};

/** What the field starts with. */
export const INITIAL_HAZARDS: Record<HazardKind, number> = {
  pillar: 3,
  goo: 2,
  spikes: 2,
  barrel: 3,
  mine: 4,
};

/** Mines and barrels are used up, so the field slowly restocks them. */
export const HAZARD_CAP: Partial<Record<HazardKind, number>> = {
  mine: 7,
  barrel: 5,
};
export const REFILL_EVERY_MS = 9000;

export const MINE_ARM_MS = 900;
export const FUSE_MS = 140;

export interface Blast {
  radius: number;
  enemyDamage: number;
  playerDamage: number;
}
export const MINE_BLAST: Blast = {
  radius: 74,
  enemyDamage: 55,
  playerDamage: 16,
};
export const BARREL_BLAST: Blast = {
  radius: 92,
  enemyDamage: 70,
  playerDamage: 20,
};

export const SPIKE_PERIOD_MS = 3200;
export const SPIKE_WARN_MS = 600;
export const SPIKE_UP_MS = 800;
export const SPIKE_TICK_MS = 500;
export const SPIKE_ENEMY_DAMAGE = 16;
export const SPIKE_PLAYER_DAMAGE = 7;

/** Goo: how much of their normal speed whoever stands in it keeps. */
export const GOO_PLAYER_SPEED = 0.6;
export const GOO_ENEMY_SPEED = 0.55;

/** Fliers pass over everything on the ground. */
export const AIRBORNE_KINDS: ReadonlySet<string> = new Set([
  "bat",
  "wasp",
  "ghost",
  "phantom",
]);

export type SpikePhase = "down" | "warn" | "up";

export function spikePhase(h: Hazard, now: number): SpikePhase {
  const t =
    (((now + h.phaseOffset) % SPIKE_PERIOD_MS) + SPIKE_PERIOD_MS) %
    SPIKE_PERIOD_MS;
  if (t >= SPIKE_PERIOD_MS - SPIKE_UP_MS) return "up";
  if (t >= SPIKE_PERIOD_MS - SPIKE_UP_MS - SPIKE_WARN_MS) return "warn";
  return "down";
}

/** Blast damage falls from full at the centre to 40% at the rim. */
export function blastFalloff(dist: number, radius: number): number {
  if (dist >= radius) return 0;
  return 1 - 0.6 * (dist / radius);
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

function overlaps(a: Circle, b: Circle, gap: number): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + gap;
}

const EDGE_MARGIN = 44;
const MIN_GAP = 26;
let nextId = 1;

/** Tries to place one hazard clear of the edges, of `keepClear` circles (the
 * player's start, say) and of everything already placed. Null when the field
 * is too crowded to find room. */
export function placeOne(
  rng: () => number,
  world: { w: number; h: number },
  kind: HazardKind,
  existing: readonly Hazard[],
  keepClear: readonly Circle[],
  now = 0,
): Hazard | null {
  const r = HAZARD_RADIUS[kind];
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = EDGE_MARGIN + rng() * (world.w - 2 * EDGE_MARGIN);
    const y = EDGE_MARGIN + rng() * (world.h - 2 * EDGE_MARGIN);
    const c = { x, y, r };
    if (keepClear.some((k) => overlaps(c, k, 0))) continue;
    if (existing.some((h) => h.alive && overlaps(c, h, MIN_GAP))) continue;
    return {
      id: nextId++,
      kind,
      x,
      y,
      r,
      armedAt: now + MINE_ARM_MS,
      phaseOffset: Math.floor(rng() * SPIKE_PERIOD_MS),
      lastTickAt: -Infinity,
      fuseAt: null,
      alive: true,
    };
  }
  return null;
}

/** The starting field. */
export function placeHazards(
  rng: () => number,
  world: { w: number; h: number },
  keepClear: readonly Circle[],
  counts: Record<HazardKind, number> = INITIAL_HAZARDS,
): Hazard[] {
  const out: Hazard[] = [];
  // Big things first, so the small ones fill the gaps.
  const order: HazardKind[] = ["pillar", "goo", "spikes", "barrel", "mine"];
  for (const kind of order) {
    for (let i = 0; i < counts[kind]; i++) {
      const h = placeOne(rng, world, kind, out, keepClear);
      if (h) out.push(h);
    }
  }
  return out;
}

/** Slides a body that overlaps a pillar back out along the line from the
 * pillar's centre. Mutates `pos`. */
export function pushOutOfPillars(
  pos: { x: number; y: number },
  radius: number,
  hazards: readonly Hazard[],
): void {
  for (const h of hazards) {
    if (h.kind !== "pillar" || !h.alive) continue;
    const dx = pos.x - h.x;
    const dy = pos.y - h.y;
    const d = Math.hypot(dx, dy);
    const min = h.r + radius;
    if (d >= min) continue;
    if (d < 0.001) {
      pos.x = h.x + min;
      continue;
    }
    pos.x = h.x + (dx / d) * min;
    pos.y = h.y + (dy / d) * min;
  }
}

/** True when a body of `radius` at `pos` is standing in goo. */
export function insideGoo(
  pos: { x: number; y: number },
  radius: number,
  hazards: readonly Hazard[],
): boolean {
  for (const h of hazards) {
    if (h.kind !== "goo") continue;
    if (Math.hypot(pos.x - h.x, pos.y - h.y) < h.r + radius * 0.3) return true;
  }
  return false;
}

/** Whether a mine or barrel is touched by a body at `pos`. */
export function touches(
  h: Hazard,
  pos: { x: number; y: number },
  radius: number,
): boolean {
  return Math.hypot(pos.x - h.x, pos.y - h.y) < h.r + radius * 0.8;
}

/** Whether spikes currently hurt a body at `pos`. */
export function onSpikes(
  h: Hazard,
  pos: { x: number; y: number },
  radius: number,
  now: number,
): boolean {
  return (
    h.kind === "spikes" &&
    spikePhase(h, now) === "up" &&
    Math.hypot(pos.x - h.x, pos.y - h.y) < h.r + radius * 0.5
  );
}
