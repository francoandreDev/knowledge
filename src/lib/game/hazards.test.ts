import { describe, expect, test } from "bun:test";
import {
  HAZARD_RADIUS,
  INITIAL_HAZARDS,
  SPIKE_PERIOD_MS,
  SPIKE_UP_MS,
  SPIKE_WARN_MS,
  blastFalloff,
  insideGoo,
  onSpikes,
  placeHazards,
  placeOne,
  pushOutOfPillars,
  spikePhase,
  touches,
  type Hazard,
  type HazardKind,
} from "./hazards";

function rngFrom(seed: number) {
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

const WORLD = { w: 720, h: 500 };
const START = [{ x: 360, y: 250, r: 80 }];

function hazard(kind: HazardKind, x: number, y: number): Hazard {
  return {
    id: 1,
    kind,
    x,
    y,
    r: HAZARD_RADIUS[kind],
    armedAt: 0,
    phaseOffset: 0,
    lastTickAt: -Infinity,
    fuseAt: null,
    alive: true,
  };
}

describe("hazard placement", () => {
  test("a starting field has what was asked for", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const field = placeHazards(rngFrom(seed), WORLD, START);
      for (const kind of Object.keys(INITIAL_HAZARDS) as HazardKind[]) {
        const n = field.filter((h) => h.kind === kind).length;
        expect(n).toBeGreaterThanOrEqual(INITIAL_HAZARDS[kind] - 1);
        expect(n).toBeLessThanOrEqual(INITIAL_HAZARDS[kind]);
      }
    }
  });

  test("nothing overlaps, leaves the field or sits on the player's start", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const field = placeHazards(rngFrom(seed), WORLD, START);
      for (const h of field) {
        expect(h.x - h.r).toBeGreaterThanOrEqual(0);
        expect(h.y - h.r).toBeGreaterThanOrEqual(0);
        expect(h.x + h.r).toBeLessThanOrEqual(WORLD.w);
        expect(h.y + h.r).toBeLessThanOrEqual(WORLD.h);
        expect(Math.hypot(h.x - 360, h.y - 250)).toBeGreaterThanOrEqual(
          80 + h.r,
        );
      }
      for (let i = 0; i < field.length; i++)
        for (let j = i + 1; j < field.length; j++) {
          const a = field[i];
          const b = field[j];
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(
            a.r + b.r,
          );
        }
    }
  });

  test("the same seed gives the same field", () => {
    const a = placeHazards(rngFrom(7), WORLD, START).map((h) => [
      h.kind,
      h.x,
      h.y,
    ]);
    const b = placeHazards(rngFrom(7), WORLD, START).map((h) => [
      h.kind,
      h.x,
      h.y,
    ]);
    expect(a).toEqual(b);
  });

  test("placeOne gives up on a field with no room instead of looping", () => {
    const full = [{ x: 360, y: 250, r: 5000 }];
    expect(placeOne(rngFrom(1), WORLD, "mine", [], full)).toBeNull();
  });
});

describe("spikes", () => {
  test("the cycle runs down, warn, up, then starts over", () => {
    const h = hazard("spikes", 100, 100);
    expect(spikePhase(h, 0)).toBe("down");
    expect(spikePhase(h, SPIKE_PERIOD_MS - SPIKE_UP_MS - SPIKE_WARN_MS)).toBe(
      "warn",
    );
    expect(spikePhase(h, SPIKE_PERIOD_MS - SPIKE_UP_MS)).toBe("up");
    expect(spikePhase(h, SPIKE_PERIOD_MS)).toBe("down");
  });

  test("a phase offset shifts the cycle", () => {
    const a = hazard("spikes", 0, 0);
    const b = { ...hazard("spikes", 0, 0), phaseOffset: 1000 };
    expect(spikePhase(a, 0)).not.toBe(
      spikePhase(b, SPIKE_PERIOD_MS - SPIKE_UP_MS - 1000),
    );
    expect(spikePhase(b, SPIKE_PERIOD_MS - SPIKE_UP_MS - 1000)).toBe("up");
  });

  test("spikes only hurt while up, and only what stands on them", () => {
    const h = hazard("spikes", 100, 100);
    const up = SPIKE_PERIOD_MS - SPIKE_UP_MS;
    expect(onSpikes(h, { x: 100, y: 100 }, 14, 0)).toBe(false);
    expect(onSpikes(h, { x: 100, y: 100 }, 14, up)).toBe(true);
    expect(onSpikes(h, { x: 300, y: 300 }, 14, up)).toBe(false);
  });
});

describe("pillars, goo and blasts", () => {
  test("a body inside a pillar is pushed out to its edge", () => {
    const p = hazard("pillar", 200, 200);
    const pos = { x: 205, y: 200 };
    pushOutOfPillars(pos, 14, [p]);
    expect(Math.hypot(pos.x - 200, pos.y - 200)).toBeCloseTo(p.r + 14, 5);
  });

  test("a body already clear of the pillar is left alone", () => {
    const p = hazard("pillar", 200, 200);
    const pos = { x: 300, y: 200 };
    pushOutOfPillars(pos, 14, [p]);
    expect(pos).toEqual({ x: 300, y: 200 });
  });

  test("a body dead centre on a pillar still comes out", () => {
    const p = hazard("pillar", 200, 200);
    const pos = { x: 200, y: 200 };
    pushOutOfPillars(pos, 14, [p]);
    expect(Math.hypot(pos.x - 200, pos.y - 200)).toBeGreaterThan(p.r);
  });

  test("goo catches what stands in it and nothing else", () => {
    const g = hazard("goo", 100, 100);
    expect(insideGoo({ x: 110, y: 100 }, 14, [g])).toBe(true);
    expect(insideGoo({ x: 400, y: 100 }, 14, [g])).toBe(false);
  });

  test("a mine is touched on contact, not from across the field", () => {
    const m = hazard("mine", 100, 100);
    expect(touches(m, { x: 105, y: 100 }, 14)).toBe(true);
    expect(touches(m, { x: 200, y: 100 }, 14)).toBe(false);
  });

  test("blast falloff is full at the centre, 40% at the rim, then nothing", () => {
    expect(blastFalloff(0, 80)).toBe(1);
    expect(blastFalloff(79.999, 80)).toBeCloseTo(0.4, 2);
    expect(blastFalloff(80, 80)).toBe(0);
    expect(blastFalloff(20, 80)).toBeGreaterThan(blastFalloff(60, 80));
  });
});
