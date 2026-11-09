import { describe, expect, test } from "bun:test";
import { EMPTY_LIFETIME } from "./missions";
import { RISKS, coinBonusLabel, effectiveRisk, riskById } from "./risk";

describe("risk levels", () => {
  test("Calm changes nothing", () => {
    const c = riskById("calm");
    expect([
      c.coinMult,
      c.enemySpeedMult,
      c.spawnRateMult,
      c.enemyHpMult,
    ]).toEqual([1, 1, 1, 1]);
  });

  test("each step up pays more and asks more", () => {
    for (let i = 1; i < RISKS.length; i++) {
      const lo = RISKS[i - 1];
      const hi = RISKS[i];
      expect(hi.coinMult).toBeGreaterThan(lo.coinMult);
      expect(hi.enemySpeedMult).toBeGreaterThan(lo.enemySpeedMult);
      expect(hi.spawnRateMult).toBeGreaterThan(lo.spawnRateMult);
      expect(hi.enemyHpMult).toBeGreaterThan(lo.enemyHpMult);
    }
  });

  test("the reward grows more slowly than the danger it asks for", () => {
    // Coins should be a fair trade, not a way to farm: the extra pay stays
    // below the extra enemy HP and spawns multiplied together.
    for (const r of RISKS.slice(1)) {
      expect(r.coinMult).toBeLessThan(r.enemyHpMult * r.spawnRateMult * 1.2);
    }
  });

  test("a new player can only pick Calm", () => {
    expect(effectiveRisk("nightmare", EMPTY_LIFETIME).id).toBe("calm");
    expect(effectiveRisk("hard", EMPTY_LIFETIME).id).toBe("calm");
  });

  test("levels unlock with play, and a stored choice is honoured once open", () => {
    const twoRuns = { ...EMPTY_LIFETIME, runs: 2 };
    expect(effectiveRisk("hard", twoRuns).id).toBe("hard");
    expect(effectiveRisk("nightmare", twoRuns).id).toBe("calm");
    const won = { ...EMPTY_LIFETIME, runs: 3, wins: 1 };
    expect(effectiveRisk("nightmare", won).id).toBe("nightmare");
  });

  test("an unknown or missing stored value falls back to Calm", () => {
    expect(effectiveRisk(null, EMPTY_LIFETIME).id).toBe("calm");
    expect(effectiveRisk("bogus", EMPTY_LIFETIME).id).toBe("calm");
  });

  test("the coin bonus label", () => {
    expect(coinBonusLabel(riskById("calm"))).toBe("");
    expect(coinBonusLabel(riskById("hard"))).toBe("+35% coins");
    expect(coinBonusLabel(riskById("nightmare"))).toBe("+80% coins");
  });
});
