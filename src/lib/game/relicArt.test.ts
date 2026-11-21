import { describe, expect, test } from "bun:test";
import { RELICS } from "./relics";
import { RELIC_ART_IDS, relicArt } from "./relicArt";

describe("relicArt", () => {
  test("every relic has its own illustration", () => {
    for (const r of RELICS) expect(RELIC_ART_IDS).toContain(r.id);
  });

  test("no illustration is left without a relic", () => {
    const ids = new Set(RELICS.map((r) => r.id));
    for (const id of RELIC_ART_IDS) expect(ids.has(id)).toBe(true);
  });

  test("renders a well-formed, decorative svg", () => {
    for (const r of RELICS) {
      const svg = relicArt(r.id, "h-8 w-8");
      expect(svg.startsWith("<svg ")).toBe(true);
      expect(svg.endsWith("</svg>")).toBe(true);
      expect(svg).toContain('class="h-8 w-8"');
      expect(svg).toContain('aria-hidden="true"');
    }
  });

  test("an unknown id renders nothing", () => {
    expect(relicArt("nope")).toBe("");
  });
});
