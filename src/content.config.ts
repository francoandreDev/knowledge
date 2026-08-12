import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Each entry's id looks like "<track>/<unit-slug>/L1-summary" (or
// "<track>/<unit-slug>/L3-deep-dive/part-1-<slug>" for split deep dives).
// See CLAUDE.md for the naming rules this mirrors.
const curriculum = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content" }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = { curriculum };
