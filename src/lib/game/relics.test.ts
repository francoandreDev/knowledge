import { describe, expect, test } from "bun:test";
import {
  RELICS,
  RELIC_MAX_LEVEL,
  noEffects,
  relicEffects,
  rollChest,
} from "./relics";
import { dayKey, isDailyAvailable, msUntilReset } from "./daily";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("relic effects", () => {
  test("no relics means no change", () => {
    expect(relicEffects({})).toEqual(noEffects());
  });

  test("levels scale an effect linearly and cap at the max", () => {
    const one = relicEffects({ whetstone: 1 }).damageMult;
    const three = relicEffects({ whetstone: 3 }).damageMult;
    const capped = relicEffects({ whetstone: 99 }).damageMult;
    expect(three - 1).toBeCloseTo((one - 1) * 3);
    expect(capped).toBeCloseTo(
      relicEffects({ whetstone: RELIC_MAX_LEVEL }).damageMult,
    );
  });

  test("a maxed collection stays inside sane bounds", () => {
    const all = Object.fromEntries(RELICS.map((r) => [r.id, RELIC_MAX_LEVEL]));
    const fx = relicEffects(all);
    expect(fx.armor).toBeLessThanOrEqual(0.2);
    expect(fx.haste).toBeLessThanOrEqual(0.25);
    expect(fx.critChance).toBeLessThanOrEqual(0.2);
    expect(fx.enemySlow).toBeLessThanOrEqual(0.2);
    expect(fx.reviveHpFrac).toBeGreaterThan(0);
    expect(fx.reviveHpFrac).toBeLessThanOrEqual(1);
  });

  test("relic ids are unique", () => {
    expect(new Set(RELICS.map((r) => r.id)).size).toBe(RELICS.length);
  });
});

describe("chests", () => {
  test("a wooden chest gives coins and one relic, a golden one two", () => {
    const w = rollChest("wooden", {}, seeded(1));
    const g = rollChest("golden", {}, seeded(1));
    expect(w.finds.length).toBe(1);
    expect(g.finds.length).toBe(2);
    expect(g.coins).toBeGreaterThan(w.coins);
  });

  test("a first copy is new, a repeat levels it up", () => {
    const first = rollChest("wooden", {}, () => 0);
    expect(first.finds[0].isNew).toBe(true);
    const again = rollChest("wooden", { [first.finds[0].relicId]: 2 }, () => 0);
    expect(again.finds[0].level).toBe(3);
    expect(again.finds[0].isNew).toBe(false);
  });

  test("a maxed relic turns into coins", () => {
    const all = Object.fromEntries(RELICS.map((r) => [r.id, RELIC_MAX_LEVEL]));
    const loot = rollChest("golden", all, seeded(7));
    expect(loot.finds.every((f) => f.converted)).toBe(true);
    expect(loot.coins).toBeGreaterThan(120);
  });

  test("rarer relics show up more often from golden chests", () => {
    const share = (tier: "wooden" | "golden") => {
      const rng = seeded(42);
      let rare = 0;
      let n = 0;
      for (let i = 0; i < 4000; i++) {
        for (const f of rollChest(tier, {}, rng).finds) {
          n++;
          const r = RELICS.find((x) => x.id === f.relicId)!;
          if (r.rarity !== "common") rare++;
        }
      }
      return rare / n;
    };
    expect(share("golden")).toBeGreaterThan(share("wooden"));
  });
});

describe("daily free run", () => {
  test("available until used, then again the next day", () => {
    const today = new Date(2026, 9, 27, 15, 0);
    const tomorrow = new Date(2026, 9, 28, 0, 5);
    expect(isDailyAvailable(null, today)).toBe(true);
    expect(isDailyAvailable(dayKey(today), today)).toBe(false);
    expect(isDailyAvailable(dayKey(today), tomorrow)).toBe(true);
  });

  test("counts down to local midnight", () => {
    const ms = msUntilReset(new Date(2026, 9, 27, 23, 0));
    expect(ms).toBe(60 * 60 * 1000);
  });
});
