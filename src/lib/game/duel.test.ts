import { describe, expect, test } from "bun:test";
import {
  DIFFICULTY,
  DUEL_WEAPONS,
  aiInput,
  attackRange,
  createDuel,
  duelHp,
  newAiMemory,
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
    // A strong player (a hard AI) against each rival difficulty, with the
    // rival's own speed handicap, as in the game.
    const wins = (rival: "easy" | "normal" | "hard") => {
      let w = 0;
      for (let i = 0; i < 40; i++) {
        const r = simulateMatch(
          { weaponId: "bolt", level: 3 },
          {
            weaponId: "bolt",
            level: 3,
            speedMult: DIFFICULTY[rival].speedMult,
          },
          ["hard", rival],
          seeded(5 + i),
        );
        if (r.winner === 0) w += 1;
      }
      return w;
    };
    expect(wins("easy")).toBeGreaterThan(wins("hard"));
    expect(wins("easy")).toBeGreaterThanOrEqual(wins("normal"));
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

  test("the rival cannot snap its aim onto a target", () => {
    // Its aim swings at a human speed however far off it is pointing.
    for (const d of ["easy", "normal", "hard"] as const) {
      const state = createDuel(
        { weaponId: "bolt", level: 3 },
        { weaponId: "bolt", level: 3 },
      );
      const me = state.fighters[1];
      const mem = newAiMemory();
      const rng = seeded(3);
      const STEP = 1000 / 60;
      me.aim = 0;
      let last = me.aim;
      for (let i = 0; i < 240; i++) {
        state.timeMs += STEP;
        const out = aiInput(state, me, d, mem, rng);
        const turned = Math.abs(
          Math.atan2(Math.sin(out.aim! - last), Math.cos(out.aim! - last)),
        );
        // The most it may turn in a frame, with a little slack.
        expect(turned).toBeLessThanOrEqual(
          (DIFFICULTY[d].turnRate * STEP) / 1000 + 0.01,
        );
        me.aim = out.aim!;
        last = me.aim;
      }
    }
  });

  test("the rival is never perfectly accurate, and worse at lower levels", () => {
    const meanError = (d: "easy" | "normal" | "hard") => {
      let total = 0;
      let n = 0;
      for (let seed = 1; seed <= 12; seed++) {
        const state = createDuel(
          { weaponId: "bolt", level: 3 },
          { weaponId: "bolt", level: 3 },
        );
        const [foe, me] = state.fighters;
        foe.x = 200;
        foe.y = 250;
        me.x = 420;
        me.y = 250;
        const mem = newAiMemory();
        const rng = seeded(seed * 17);
        for (let i = 0; i < 480; i++) {
          state.timeMs += 1000 / 60;
          const out = aiInput(state, me, d, mem, rng);
          me.aim = out.aim!;
          if (i > 120) {
            const truth = Math.atan2(foe.y - me.y, foe.x - me.x);
            total += Math.abs(
              Math.atan2(
                Math.sin(out.aim! - truth),
                Math.cos(out.aim! - truth),
              ),
            );
            n += 1;
          }
        }
      }
      return total / n;
    };
    const hard = meanError("hard");
    const normal = meanError("normal");
    const easy = meanError("easy");
    expect(hard).toBeGreaterThan(0.03);
    expect(normal).toBeGreaterThan(hard);
    expect(easy).toBeGreaterThan(normal);
  });

  test("it does not strike the instant something is in reach", () => {
    for (const d of ["easy", "normal", "hard"] as const) {
      let firstSum = 0;
      const runs = 12;
      for (let seed = 1; seed <= runs; seed++) {
        const state = createDuel(
          { weaponId: "bolt", level: 3 },
          { weaponId: "bolt", level: 3 },
        );
        const [foe, me] = state.fighters;
        foe.x = 300;
        foe.y = 250;
        me.x = 450;
        me.y = 250;
        const mem = newAiMemory();
        mem.idleUntilMs = 0;
        const rng = seeded(seed * 29);
        let first = -1;
        for (let i = 0; i < 600 && first < 0; i++) {
          state.timeMs += 1000 / 60;
          const out = aiInput(state, me, d, mem, rng);
          me.aim = out.aim!;
          if (out.charge) first = state.timeMs;
        }
        expect(first).toBeGreaterThan(0);
        firstSum += first;
      }
      // On average it waits at least the low end of its engage delay.
      expect(firstSum / runs).toBeGreaterThanOrEqual(DIFFICULTY[d].engageMs[0]);
    }
  });

  test("it eases into a new direction instead of switching in one frame", () => {
    const state = createDuel(
      { weaponId: "bolt", level: 3 },
      { weaponId: "bolt", level: 3 },
    );
    const [foe, me] = state.fighters;
    foe.x = 100;
    foe.y = 250;
    me.x = 500;
    me.y = 250;
    const mem = newAiMemory();
    const rng = seeded(8);
    let prevX = 0;
    let prevY = 0;
    for (let i = 0; i < 300; i++) {
      state.timeMs += 1000 / 60;
      const out = aiInput(state, me, "hard", mem, rng);
      me.aim = out.aim!;
      if (i > 0) {
        expect(Math.hypot(out.x - prevX, out.y - prevY)).toBeLessThan(0.6);
      }
      prevX = out.x;
      prevY = out.y;
    }
  });
});
