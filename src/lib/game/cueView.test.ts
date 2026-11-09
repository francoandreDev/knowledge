import { describe, expect, test } from "bun:test";
import {
  CUE_BLURB,
  CUE_MS,
  RELIC_CUE,
  drawBastionShield,
  drawBerserkAura,
  drawCue,
  drawHasteRing,
  drawMomentumChevrons,
  type CueKind,
} from "./cueView";
import { RELICS } from "./relics";

/** A canvas context that accepts every call and records nothing: enough to
 * prove the drawing code runs without throwing at any moment of any cue. */
function fakeCtx(): CanvasRenderingContext2D {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (prop === "createLinearGradient" || prop === "createRadialGradient")
          return () => gradient;
        return () => {};
      },
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D;
}

const KINDS = Object.keys(CUE_MS) as CueKind[];

describe("effect cues", () => {
  test("every relic has its own animation", () => {
    for (const r of RELICS) {
      expect(RELIC_CUE[r.id]).toBeDefined();
    }
  });

  test("no two relics share an animation", () => {
    const kinds = RELICS.map((r) => RELIC_CUE[r.id]);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  test("every cue says what it means and has a positive length", () => {
    for (const k of KINDS) {
      expect(CUE_MS[k]).toBeGreaterThan(0);
      expect(CUE_BLURB[k].length).toBeGreaterThan(10);
    }
  });

  test("every cue draws at every moment of its life without throwing", () => {
    const c = fakeCtx();
    const hero = { x: 100, y: 100 };
    for (const kind of KINDS) {
      for (let i = 0; i <= 20; i++) {
        const at = 1000;
        const now = at + (CUE_MS[kind] * i) / 20 - 1;
        expect(() =>
          drawCue(
            c,
            {
              kind,
              x: 160,
              y: 120,
              at,
              text: "+1",
              label: "Relic",
              r: 60,
              angle: 1,
              onHero: i % 2 === 0,
              dx: 8,
            },
            now,
            hero,
          ),
        ).not.toThrow();
      }
    }
  });

  test("a cue that has not started or has ended draws nothing", () => {
    let calls = 0;
    const c = new Proxy(
      {},
      {
        get: () => () => {
          calls += 1;
        },
        set: () => true,
      },
    ) as unknown as CanvasRenderingContext2D;
    drawCue(c, { kind: "block", x: 0, y: 0, at: 1000 }, 500, { x: 0, y: 0 });
    drawCue(c, { kind: "block", x: 0, y: 0, at: 1000 }, 1000 + CUE_MS.block, {
      x: 0,
      y: 0,
    });
    expect(calls).toBe(0);
  });

  test("the effects that stay on draw without throwing", () => {
    const c = fakeCtx();
    expect(() => {
      drawHasteRing(c, 10, 10, 20, 1234);
      drawBerserkAura(c, 10, 10, 14, 1234, 0.6);
      drawBastionShield(c, 10, 10, 14, 1234);
      drawMomentumChevrons(c, 10, 10, 14, 7);
    }).not.toThrow();
  });
});
