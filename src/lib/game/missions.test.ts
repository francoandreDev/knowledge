import { describe, expect, test } from "bun:test";
import {
  ACHIEVEMENTS,
  advanceStreak,
  applyRun,
  currentStreakDays,
  EMPTY_LIFETIME,
  isAchieved,
  MISSION_POOL,
  missionsForDay,
  MISSIONS_PER_DAY,
  missionTier,
  nextStreakBonus,
  previousDay,
  streakBonus,
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

describe("mission progress", () => {
  test("measure caps at the target and agrees with check", () => {
    const partial = run({ kills: 100 });
    const kills = MISSION_POOL.find((m) => m.id === "kills-250")!;
    expect(kills.measure(partial)).toEqual([100, 250]);
    expect(kills.measure(run({ kills: 900 }))).toEqual([250, 250]);
    for (const m of MISSION_POOL) {
      const [cur, target] = m.measure(
        run({
          kills: 900,
          survivedS: 900,
          level: 30,
          coinsEarned: 500,
          won: true,
          bossDefeated: true,
          endless: true,
        }),
      );
      expect(cur).toBe(target);
    }
  });

  test("an Endless mission shows no progress in a normal run", () => {
    const endless = MISSION_POOL.find((m) => m.id === "endless-4m")!;
    expect(endless.measure(run({ survivedS: 300, endless: false }))[0]).toBe(0);
    expect(endless.measure(run({ survivedS: 120, endless: true }))[0]).toBe(
      120,
    );
  });

  test("tiers follow the payout", () => {
    expect(missionTier(MISSION_POOL.find((m) => m.id === "kills-250")!)).toBe(
      "easy",
    );
    expect(missionTier(MISSION_POOL.find((m) => m.id === "kills-600")!)).toBe(
      "medium",
    );
    expect(missionTier(MISSION_POOL.find((m) => m.id === "boss-down")!)).toBe(
      "hard",
    );
  });
});

describe("streak", () => {
  test("starts, continues, repeats and breaks", () => {
    const none = { days: 0, last: null };
    const one = advanceStreak(none, "2026-11-20");
    expect(one).toEqual({ days: 1, last: "2026-11-20" });
    expect(advanceStreak(one, "2026-11-20")).toBe(one);
    expect(advanceStreak(one, "2026-11-21")).toEqual({
      days: 2,
      last: "2026-11-21",
    });
    expect(advanceStreak(one, "2026-11-23")).toEqual({
      days: 1,
      last: "2026-11-23",
    });
  });

  test("steps across month and year ends", () => {
    expect(previousDay("2026-12-01")).toBe("2026-11-30");
    expect(previousDay("2027-01-01")).toBe("2026-12-31");
  });

  test("a lapsed streak reads as zero", () => {
    expect(
      currentStreakDays({ days: 5, last: "2026-11-20" }, "2026-11-21"),
    ).toBe(5);
    expect(
      currentStreakDays({ days: 5, last: "2026-11-20" }, "2026-11-22"),
    ).toBe(0);
  });

  test("milestone bonuses", () => {
    expect(streakBonus(3)).toBe(60);
    expect(streakBonus(4)).toBe(0);
    expect(nextStreakBonus(3)?.days).toBe(7);
    expect(nextStreakBonus(30)).toBeNull();
  });
});
