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

// One exercises.json per unit (optional), id "<track>/<unit-slug>/exercises".
// Quiz exercises self-grade against a correct choice index; code exercises
// run learner-edited code in a sandboxed Web Worker against expect()
// assertions. Every exercise must explain itself after an attempt — a pass
// isn't the point, understanding why is (see CLAUDE.md "Exercises").
//
// Items that share a `poolId` are interchangeable variants of the same
// question: the page picks one at random per view/re-exam, so a re-take
// after the spaced-repetition reset isn't just re-answering from memory.
// Omitting `poolId` makes an item a singleton pool of one (its own id).
const quizExercise = z.object({
  type: z.literal("quiz"),
  id: z.string(),
  poolId: z.string().optional(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  prompt: z.string(),
  choices: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
  explanation: z.string(),
});

const codeExercise = z.object({
  type: z.literal("code"),
  id: z.string(),
  poolId: z.string().optional(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  prompt: z.string(),
  starterCode: z.string(),
  tests: z
    .array(
      z.object({
        description: z.string(),
        // A JS expression string evaluated against the learner's code,
        // using the injected expect() helper — e.g. "expect(add(2,3)).toBe(5)".
        expr: z.string(),
      }),
    )
    .min(1),
  // Revealed after any attempt (pass or fail) — the point is the reasoning,
  // not just the pass/fail signal.
  solution: z.string(),
  explanation: z.string(),
});

const exercises = defineCollection({
  loader: glob({ pattern: "**/exercises.json", base: "./src/content" }),
  schema: z.object({
    items: z.array(z.discriminatedUnion("type", [quizExercise, codeExercise])),
  }),
});

export const collections = { curriculum, exercises };
