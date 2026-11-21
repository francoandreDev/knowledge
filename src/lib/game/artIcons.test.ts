import { describe, expect, test } from "bun:test";
import { A } from "./artIcons";
import {
  EVOLUTION_ICON,
  SPECIAL_ICON,
  STAT_ICON,
  STYLE_ICON,
  UI_ICON,
  UPGRADE_ICON,
  WEAPON_ICON,
  sizedIcon,
} from "./icons";

const wellFormed = (svg: string) =>
  svg.startsWith("<svg ") && svg.endsWith("</svg>") && svg.includes("viewBox");

describe("game art", () => {
  test("every picture is a well-formed, decorative svg", () => {
    for (const [key, svg] of Object.entries(A)) {
      expect(wellFormed(svg)).toBe(true);
      expect(svg).toContain('aria-hidden="true"');
      expect(key.length).toBeGreaterThan(0);
    }
  });

  test("every icon map is filled in", () => {
    const maps = [
      WEAPON_ICON,
      SPECIAL_ICON,
      STYLE_ICON,
      STAT_ICON,
      UPGRADE_ICON,
      UI_ICON,
    ];
    for (const map of maps)
      for (const svg of Object.values(map))
        expect(wellFormed(svg as string)).toBe(true);
    expect(wellFormed(EVOLUTION_ICON)).toBe(true);
  });

  test("sizedIcon still lands the class on the root element", () => {
    expect(sizedIcon(A.heart, "h-4 w-4")).toContain('<svg class="h-4 w-4" ');
  });
});
