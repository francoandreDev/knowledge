import { describe, expect, test } from "bun:test";
import { deriveSlug } from "./generate-roadmap-data.mjs";

describe("deriveSlug", () => {
  test("prefers the parenthetical concept over the question", () => {
    expect(
      deriveSlug(
        "How does a browser turn a URL into a rendered page? (HTTP request/response basics)",
      ),
    ).toBe("http-request-response-basics");
  });

  test("falls back to the question when there's no parenthetical", () => {
    expect(
      deriveSlug("Why do we need HTML semantics instead of just divs?"),
    ).toBe("need-html-semantics-just-divs");
  });

  test("never returns an empty slug", () => {
    expect(deriveSlug("How do I do it?")).not.toBe("");
  });

  test("is deterministic", () => {
    const problem =
      "How do we scale beyond one machine? (horizontal scaling, load balancing, statelessness)";
    expect(deriveSlug(problem)).toBe(deriveSlug(problem));
  });
});
