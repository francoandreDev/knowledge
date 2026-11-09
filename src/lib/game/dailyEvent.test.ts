import { describe, expect, test } from "bun:test";
import { dailyEventForDay } from "./dailyEvent";

describe("dailyEventForDay", () => {
  test("is stable for a given day", () => {
    expect(dailyEventForDay("2026-11-09")).toEqual(
      dailyEventForDay("2026-11-09"),
    );
  });

  test("every event keeps the multipliers positive and modest", () => {
    for (let d = 1; d <= 60; d++) {
      const e = dailyEventForDay(`2026-12-${String(d).padStart(2, "0")}`);
      expect(e.coinMult).toBeGreaterThanOrEqual(1);
      expect(e.coinMult).toBeLessThanOrEqual(1.5);
      expect(e.enemySpeedMult).toBeGreaterThan(0.8);
      expect(e.enemySpeedMult).toBeLessThan(1.25);
    }
  });

  test("a clear night changes nothing and has no blurb", () => {
    const clear = Array.from({ length: 60 }, (_, i) =>
      dailyEventForDay(`2027-01-${i}`),
    ).find((e) => e.id === "clear");
    expect(clear).toBeDefined();
    expect(clear!.coinMult).toBe(1);
    expect(clear!.enemySpeedMult).toBe(1);
    expect(clear!.blurb).toBe("");
  });

  test("over a stretch of days every event shows up", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(dailyEventForDay(`d${i}`).id);
    expect([...seen].sort()).toEqual(["blood", "clear", "fog", "storm"]);
  });
});
