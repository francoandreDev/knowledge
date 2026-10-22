import { describe, expect, test } from "bun:test";
import {
  DUEL_WEAPONS,
  attackRange,
  createDuel,
  duelHp,
  simulateMatch,
  stepDuel,
  strikeDamage,
} from "./duel";

const WEAPONS = DUEL_WEAPONS;

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

  test("nothing fires on its own: idle fighters never hurt each other", () => {
    const state = createDuel(
      { weaponId: "bolt", level: 3 },
      { weaponId: "bladeArc", level: 3 },
    );
    const idle = { x: 0, y: 0 };
    for (let i = 0; i < 600; i++) stepDuel(state, 1000 / 60, [idle, idle]);
    expect(state.fighters[0].hp).toBe(state.fighters[0].maxHp);
    expect(state.fighters[1].hp).toBe(state.fighters[1].maxHp);
  });

  test("a longer charge reaches farther and hits harder", () => {
    for (const weaponId of WEAPONS) {
      const f = createDuel({ weaponId, level: 3 }, { weaponId, level: 3 })
        .fighters[0];
      expect(attackRange(weaponId, 3, 1)).toBeGreaterThan(
        attackRange(weaponId, 3, 0.3),
      );
      expect(strikeDamage(f, 1)).toBeGreaterThan(strikeDamage(f, 0.3) * 2);
    }
  });

  test("a hit while charging knocks the charge away", () => {
    const state = createDuel(
      { weaponId: "bolt", level: 3 },
      { weaponId: "novaPulse", level: 3 },
    );
    const [a, b] = state.fighters;
    b.x = a.x + 40;
    b.y = a.y;
    const hold = { x: 0, y: 0, charge: true };
    for (let i = 0; i < 20; i++) stepDuel(state, 1000 / 60, [hold, hold]);
    expect(a.chargeMs).toBeGreaterThan(0);
    // Let the nova go: it lands on the close fighter and breaks their charge.
    for (let i = 0; i < 60 && a.hp === a.maxHp; i++) {
      stepDuel(state, 1000 / 60, [hold, { x: 0, y: 0, charge: i < 30 }]);
    }
    expect(a.hp).toBeLessThan(a.maxHp);
    expect(a.chargeMs).toBe(0);
  });
});
