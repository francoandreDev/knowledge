import { describe, expect, test } from "bun:test";
import type { WeaponId } from "./engine";
import {
  BASIC_ENEMY_HP,
  CONTACT_DISTANCE_PX,
  FELT_REGEN_RATIO,
  REFERENCE_INCOMING_HPS,
  WEAPON_MAX_LEVEL,
  DELIVERY_BONUS,
  effectiveDps,
  exposure,
  maxRecoveryHps,
  orbitShieldShape,
  reachPx,
  targetDps,
  weaponDamage,
} from "./balance";

const WEAPONS: WeaponId[] = [
  "bolt",
  "homingDart",
  "chainLightning",
  "novaPulse",
  "orbitShield",
  "bladeArc",
];
const LEVELS = Array.from({ length: WEAPON_MAX_LEVEL }, (_, i) => i + 1);

describe("weapon balance", () => {
  test("authored damage delivers at least the budget, and floors add at most half again", () => {
    for (const id of WEAPONS) {
      for (const level of LEVELS) {
        const ratio = effectiveDps(id, level) / targetDps(id, level);
        expect(ratio).toBeGreaterThan(0.97);
        expect(ratio).toBeLessThan(1.5);
      }
    }
  });

  test("a swing that keeps you in the crowd one-shots what is touching you", () => {
    for (const id of ["bladeArc", "novaPulse"] as const) {
      for (const level of LEVELS.filter((l) => l < WEAPON_MAX_LEVEL)) {
        expect(weaponDamage(id, level)).toBeGreaterThanOrEqual(BASIC_ENEMY_HP);
      }
    }
  });

  test("a weapon always gets stronger as it levels, and evolving is a real payoff", () => {
    for (const id of WEAPONS) {
      for (const level of LEVELS.slice(1)) {
        expect(effectiveDps(id, level)).toBeGreaterThan(
          effectiveDps(id, level - 1),
        );
      }
      expect(effectiveDps(id, WEAPON_MAX_LEVEL)).toBeGreaterThan(
        effectiveDps(id, WEAPON_MAX_LEVEL - 1) * 1.3,
      );
    }
  });

  test("per-hit damage never collapses when a level adds projectiles", () => {
    for (const id of WEAPONS) {
      for (const level of LEVELS.slice(1)) {
        expect(weaponDamage(id, level)).toBeGreaterThan(
          weaponDamage(id, level - 1) * 0.5,
        );
      }
    }
  });

  test("equally exposed weapons are different styles, not different damage", () => {
    for (const level of LEVELS) {
      const safe = WEAPONS.filter((id) => exposure(id, level) <= 0.15).map(
        (id) => effectiveDps(id, level),
      );
      expect(safe.length).toBeGreaterThan(1);
      expect(Math.max(...safe) / Math.min(...safe)).toBeLessThan(1.3);
    }
  });

  test("more exposure always earns more damage", () => {
    for (const level of LEVELS) {
      const ranked = [...WEAPONS].sort(
        (a, b) => exposure(a, level) - exposure(b, level),
      );
      for (let i = 1; i < ranked.length; i++) {
        // Delivery bonuses pay for wasted damage, not for exposure.
        const earned = (id: WeaponId) =>
          effectiveDps(id, level) / (DELIVERY_BONUS[id] ?? 1);
        expect(earned(ranked[i])).toBeGreaterThanOrEqual(
          earned(ranked[i - 1]) * 0.99,
        );
      }
    }
  });

  test("the orbit reaches enemies standing against the player at every level", () => {
    for (const level of LEVELS) {
      const { radius, hitRadius } = orbitShieldShape(level);
      expect(Math.abs(radius - CONTACT_DISTANCE_PX)).toBeLessThan(
        hitRadius + 12,
      );
    }
  });

  test("exposure matches how close a weapon makes you stand", () => {
    for (const id of WEAPONS) {
      for (const level of LEVELS) {
        const reach = reachPx(id, level);
        if (reach >= 300) expect(exposure(id, level)).toBeLessThanOrEqual(0.15);
        if (reach <= 150)
          expect(exposure(id, level)).toBeGreaterThanOrEqual(0.4);
      }
    }
  });

  test("close-range weapons out-earn ranged ones by a clear margin", () => {
    for (const level of LEVELS) {
      const ranged = effectiveDps("bolt", level);
      for (const id of ["bladeArc", "orbitShield", "novaPulse"] as const) {
        expect(effectiveDps(id, level)).toBeGreaterThan(ranged * 1.4);
      }
    }
  });
});

describe("recovery balance", () => {
  test("a full recovery build covers a felt share of typical incoming damage", () => {
    expect(maxRecoveryHps() / REFERENCE_INCOMING_HPS).toBeGreaterThanOrEqual(
      FELT_REGEN_RATIO,
    );
  });
});
