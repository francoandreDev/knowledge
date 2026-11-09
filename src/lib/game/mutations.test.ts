import { describe, expect, test } from "bun:test";
import {
  CROSSROADS_EVERY,
  MUTATIONS,
  RARITY_ORDER,
  drawMutations,
  isCrossroads,
  mutationById,
} from "./mutations";

function rngFrom(seed: number) {
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

describe("mutations", () => {
  test("ids are unique and every mutation says what it does", () => {
    expect(new Set(MUTATIONS.map((m) => m.id)).size).toBe(MUTATIONS.length);
    for (const m of MUTATIONS) {
      expect(m.name.length).toBeGreaterThan(2);
      expect(m.blurb.length).toBeGreaterThan(15);
    }
  });

  test("all three rarities exist, and the strongest cost something or are rare", () => {
    const by = (r: string) => MUTATIONS.filter((m) => m.rarity === r);
    expect(by("common").length).toBeGreaterThan(2);
    expect(by("rare").length).toBeGreaterThan(1);
    expect(by("legendary").length).toBeGreaterThan(1);
  });

  test("a draw never repeats a mutation or offers one already owned", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const owned = ["glassCannon", "echo"];
      const picks = drawMutations(owned, 3, rngFrom(seed));
      expect(picks.length).toBe(3);
      expect(new Set(picks.map((m) => m.id)).size).toBe(3);
      for (const m of picks) expect(owned).not.toContain(m.id);
    }
  });

  test("a crossroads draw offers rare or better while there is enough of it", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const picks = drawMutations([], 3, rngFrom(seed), "rare");
      for (const m of picks)
        expect(RARITY_ORDER[m.rarity]).toBeGreaterThanOrEqual(
          RARITY_ORDER.rare,
        );
    }
  });

  test("when little rare stock is left a crossroads still fills from the rest", () => {
    const owned = MUTATIONS.filter((m) => m.rarity !== "common")
      .slice(1)
      .map((m) => m.id);
    const picks = drawMutations(owned, 3, rngFrom(3), "rare");
    expect(picks.length).toBe(3);
  });

  test("an exhausted pool returns fewer rather than failing", () => {
    const all = MUTATIONS.map((m) => m.id);
    expect(drawMutations(all, 3)).toEqual([]);
    expect(drawMutations(all.slice(1), 3).length).toBe(1);
  });

  test("common mutations turn up more often than legendary ones", () => {
    const seen: Record<string, number> = { common: 0, rare: 0, legendary: 0 };
    const rng = rngFrom(11);
    for (let i = 0; i < 3000; i++) seen[drawMutations([], 1, rng)[0].rarity]++;
    expect(seen.common).toBeGreaterThan(seen.legendary);
  });

  test("every fifth level-up is a crossroads, and none before the fifth", () => {
    expect([1, 2, 3, 4].some(isCrossroads)).toBe(false);
    expect(isCrossroads(CROSSROADS_EVERY)).toBe(true);
    expect(isCrossroads(CROSSROADS_EVERY * 2)).toBe(true);
    expect(isCrossroads(CROSSROADS_EVERY + 1)).toBe(false);
  });

  test("lookup by id", () => {
    expect(mutationById("volatile")?.name).toBe("Volatile");
    expect(mutationById("nope")).toBeUndefined();
  });
});
