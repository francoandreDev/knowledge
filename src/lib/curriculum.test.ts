import { describe, expect, test } from "bun:test";
import { parseEntryId } from "./curriculum";

describe("parseEntryId", () => {
  test("parses an L1 entry (lowercased by the glob loader)", () => {
    expect(parseEntryId("web/http-basics/l1-summary")).toEqual({
      track: "web",
      unitSlug: "http-basics",
      level: 1,
    });
  });

  test("parses an L2 entry", () => {
    expect(parseEntryId("systems/processes/l2-concept")).toEqual({
      track: "systems",
      unitSlug: "processes",
      level: 2,
    });
  });

  test("parses a single-file L3 entry", () => {
    expect(parseEntryId("logic/decomposition/l3-deep-dive")).toEqual({
      track: "logic",
      unitSlug: "decomposition",
      level: 3,
    });
  });

  test("parses a split L3 part", () => {
    expect(
      parseEntryId("systems/consistency/l3-deep-dive/part-1-cap-theorem"),
    ).toEqual({
      track: "systems",
      unitSlug: "consistency",
      level: 3,
      part: "part-1-cap-theorem",
    });
  });

  test("returns null for something that isn't a curriculum entry", () => {
    expect(parseEntryId("web")).toBeNull();
    expect(parseEntryId("web/http-basics")).toBeNull();
  });
});
