import { describe, expect, test } from "bun:test";
import {
  BRANCHES,
  BRANCH_LEVEL,
  CAPSTONE_LEVEL,
  applyBranch,
  branchesFor,
  soft,
  type BranchedUpgradeId,
} from "./branches";
import { noEffects } from "./relics";

const IDS = Object.keys(BRANCHES) as BranchedUpgradeId[];

describe("branches", () => {
  test("every branched upgrade offers two distinct paths", () => {
    for (const id of IDS) {
      const [a, b] = BRANCHES[id];
      expect(a.id).not.toBe(b.id);
      expect(a.label).not.toBe(b.label);
      expect(a.blurb.length).toBeGreaterThan(10);
      expect(a.capstone.length).toBeGreaterThan(5);
    }
  });

  test("nothing applies below the branch level or with no path chosen", () => {
    for (const id of IDS) {
      const fx = noEffects();
      applyBranch(fx, id, BRANCHES[id][0].id, BRANCH_LEVEL - 1);
      applyBranch(fx, id, null, 10);
      applyBranch(fx, id, "no-such-path", 10);
      expect(fx).toEqual(noEffects());
    }
  });

  test("each path changes something at the branch level", () => {
    for (const id of IDS) {
      for (const b of BRANCHES[id]) {
        const fx = noEffects();
        applyBranch(fx, id, b.id, BRANCH_LEVEL);
        expect(fx).not.toEqual(noEffects());
      }
    }
  });

  test("the two paths of an upgrade do not do the same thing", () => {
    for (const id of IDS) {
      const [a, b] = BRANCHES[id];
      const fa = noEffects();
      const fb = noEffects();
      applyBranch(fa, id, a.id, CAPSTONE_LEVEL);
      applyBranch(fb, id, b.id, CAPSTONE_LEVEL);
      expect(fa).not.toEqual(fb);
    }
  });

  test("the capstone makes level 6 strictly stronger than level 5", () => {
    for (const id of IDS) {
      for (const b of BRANCHES[id]) {
        const five = noEffects();
        const six = noEffects();
        applyBranch(five, id, b.id, CAPSTONE_LEVEL - 1);
        applyBranch(six, id, b.id, CAPSTONE_LEVEL);
        expect(JSON.stringify(six)).not.toBe(JSON.stringify(five));
      }
    }
  });

  test("effects stay bounded however high the level goes", () => {
    for (const id of IDS) {
      for (const b of BRANCHES[id]) {
        const fx = noEffects();
        applyBranch(fx, id, b.id, 200);
        expect(fx.dodge).toBeLessThanOrEqual(0.41);
        expect(fx.critChance).toBeLessThanOrEqual(0.51);
        expect(fx.coinLuck).toBeLessThanOrEqual(0.71);
        expect(fx.panicHeal).toBeLessThanOrEqual(0.7);
        expect(fx.reviveHpFrac).toBeLessThanOrEqual(0.6);
        expect(fx.hitCap === 0 || fx.hitCap >= 0.1).toBe(true);
        expect(fx.gemBurstEveryS === 0 || fx.gemBurstEveryS >= 10).toBe(true);
      }
    }
  });

  test("the Vortex wait shrinks with level but never reaches zero", () => {
    const waits = [3, 4, 5, 6, 9, 30].map((lvl) => {
      const fx = noEffects();
      applyBranch(fx, "magnetism", "vortex", lvl);
      return fx.gemBurstEveryS;
    });
    for (let i = 1; i < waits.length; i++)
      expect(waits[i]).toBeLessThanOrEqual(waits[i - 1]);
    expect(waits[waits.length - 1]).toBe(10);
  });

  test("branchesFor knows only the branched upgrades", () => {
    expect(branchesFor("might")).not.toBeNull();
    expect(branchesFor("recovery")).toBeNull();
  });

  test("soft starts linear and saturates at its cap", () => {
    expect(soft(1, 0.1, 5)).toBeCloseTo(0.1, 1);
    expect(soft(1000, 0.1, 5)).toBeCloseTo(5, 3);
  });
});
