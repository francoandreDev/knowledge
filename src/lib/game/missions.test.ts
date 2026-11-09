import { describe, expect, test } from "bun:test";
import {
  ACHIEVEMENTS,
  applyRun,
  EMPTY_LIFETIME,
  isAchieved,
  MISSION_POOL,
  missionsForDay,
  MISSIONS_PER_DAY,
  type RunStats,
} from "./missions";

const run = (over: Partial<RunStats> = {}): RunStats => ({
  survivedS: 60,
  kills: 10,
  level: 3,
  coinsEarned: 5,
  won: false,
  bossDefeated: false,
  endless: false,
  ...over,
});

describe("daily missions", () => {
  test("a day always gives the same distinct missions", () => {
    const a = missionsForDay("2026-11-09");
    const b = missionsForDay("2026-11-09");
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
    expect(new Set(a.map((m) => m.id)).size).toBe(MISSIONS_PER_DAY);
  });

  test("different days vary", () => {
    const sets = new Set(
      Array.from({ length: 20 }, (_, i) =>
        missionsForDay(`2026-11-${String(i + 1).padStart(2, "0")}`)
          .map((m) => m.id)
          .join(),
      ),
    );
    expect(sets.size).toBeGreaterThan(5);
  });

  test("a trivial run completes no mission, a great one completes several", () => {
    expect(MISSION_POOL.filter((m) => m.check(run()))).toHaveLength(0);
    const great = run({
      survivedS: 300,
      kills: 700,
      level: 16,
      coinsEarned: 200,
      won: true,
      bossDefeated: true,
      endless: true,
    });
    expect(MISSION_POOL.every((m) => m.check(great))).toBe(true);
  });
});

describe("achievements", () => {
  test("lifetime accumulates and keeps bests", () => {
    let l = applyRun(EMPTY_LIFETIME, run({ kills: 100, level: 8 }));
    l = applyRun(
      l,
      run({ kills: 50, level: 5, won: true, bossDefeated: true }),
    );
    expect(l.runs).toBe(2);
    expect(l.kills).toBe(150);
    expect(l.bestLevel).toBe(8);
    expect(l.wins).toBe(1);
    expect(l.bosses).toBe(1);
  });

  test("endless best only counts endless runs", () => {
    const l = applyRun(EMPTY_LIFETIME, run({ survivedS: 700 }));
    expect(l.bestEndlessS).toBe(0);
    const e = applyRun(EMPTY_LIFETIME, run({ survivedS: 700, endless: true }));
    expect(
      isAchieved(
        ACHIEVEMENTS.find((a) => a.id === "marathon")!,
        e,
      ),
    ).toBe(true);
  });

  test("ids are unique", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
