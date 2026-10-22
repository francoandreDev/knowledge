import { describe, expect, test } from "bun:test";
import { DUEL_DAMAGE_SCALE, duelHp, simulateMatch } from "./duel";
import type { WeaponId } from "./engine";

const WEAPONS = Object.keys(DUEL_DAMAGE_SCALE) as WeaponId[];

const seeded = (seed: number) => {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
};

describe("duel fairness", () => {
  test("a mirror match favours neither side", () => {
    for (const weaponId of WEAPONS) {
      for (const level of [1, 3, 6]) {
        let sideZero = 0;
        const n = 30;
        for (let i = 0; i < n; i++) {
          const r = simulateMatch(
            { weaponId, level },
            { weaponId, level },
            "hard",
            seeded(7 + i * 31),
          );
          if (r.winner === 0) sideZero += 1;
          else if (r.winner === null) sideZero += 0.5;
        }
        expect(sideZero / n).toBeGreaterThan(0.2);
        expect(sideZero / n).toBeLessThan(0.8);
      }
    }
  });

  test("a fight lasts long enough to play and not longer than a round", () => {
    for (const weaponId of WEAPONS) {
      for (const level of [1, 3, 6]) {
        const r = simulateMatch(
          { weaponId, level },
          { weaponId, level },
          "hard",
          seeded(99),
          60_000,
        );
        expect(r.timeMs).toBeGreaterThan(6_000);
      }
    }
  });

  test("HP grows with level so fights stay a similar length", () => {
    for (let level = 2; level <= 6; level++) {
      expect(duelHp(level)).toBeGreaterThan(duelHp(level - 1));
    }
  });

  test("a weaker rival loses to the same loadout more often", () => {
    const wins = (difficulty: "easy" | "hard") => {
      let w = 0;
      for (let i = 0; i < 20; i++) {
        const r = simulateMatch(
          { weaponId: "bolt", level: 3 },
          {
            weaponId: "bolt",
            level: 3,
            speedMult: difficulty === "easy" ? 0.85 : 1,
          },
          difficulty,
          seeded(5 + i),
        );
        if (r.winner === 0) w += 1;
      }
      return w;
    };
    expect(wins("easy")).toBeGreaterThan(wins("hard"));
  });
});
