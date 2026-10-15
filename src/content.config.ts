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
// New in the three-tier model (see CLAUDE.md "Exercises"): `tier` splits a
// topic's items into "practice" (easy, interleaved inline in the level
// content, never gates, never resets) and "exam" (the end-of-unit "Domain
// check," gates "Mark as done", resets on the 7/30/90-day schedule).
// `topicId` plays the role `poolId` used to play — the unit of grouping is
// now a topic, not a flat per-level pool — and `reflection` is the ungraded
// "connect this to another domain" prompt shown once an exam-tier topic is
// passed. Older units omitting all three keep working exactly as before
// (ExercisePanel's flat-pool-per-level model); `poolId` stays supported for
// those. `chipLabel` is cosmetic, practice-tier only (the short label on the
// chip that reveals this variant — e.g. "quick check", "what if...?").
const tierFields = {
  tier: z.enum(["practice", "exam"]).optional(),
  topicId: z.string().optional(),
  chipLabel: z.string().optional(),
  reflection: z.string().optional(),
};

const quizExercise = z.object({
  type: z.literal("quiz"),
  id: z.string(),
  poolId: z.string().optional(),
  ...tierFields,
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  prompt: z.string(),
  choices: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
  explanation: z.string(),
  // Trusted HTML (a compact visual + one-line theory statement) shown in
  // the exercise's whiteboard reference panel, below the question — the
  // link from "got it wrong" back to the concept being tested. Optional,
  // but must be identical across every variant sharing a poolId/topicId
  // (checked by validate-content.mjs) since only one variant renders per
  // view.
  reference: z.string().optional(),
  // Trusted HTML — a real, multi-paragraph explanation of the concept this
  // pool tests, shown in a dedicated "Learn more" modal (separate from the
  // whiteboard, see src/lib/learn-more.ts). Deeper than `reference`'s
  // one-line theory statement. Same per-pool consistency rule as above.
  learnMore: z.string().optional(),
});

const codeExercise = z.object({
  type: z.literal("code"),
  id: z.string(),
  poolId: z.string().optional(),
  ...tierFields,
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
  reference: z.string().optional(),
  learnMore: z.string().optional(),
});

const exercises = defineCollection({
  loader: glob({ pattern: "**/exercises.json", base: "./src/content" }),
  schema: z.object({
    items: z.array(z.discriminatedUnion("type", [quizExercise, codeExercise])),
  }),
});

// One interactives.json per unit (optional), id "<track>/<unit-slug>/interactives".
// Ungraded, exploratory "move a parameter, see the result and the trend"
// widgets for the theory sections — distinct from exercises: no pass/fail,
// no gating on ProgressToggle. See CLAUDE.md "Interactive demos".
const interactiveParam = z.object({
  name: z.string(),
  label: z.string(),
  min: z.number(),
  max: z.number(),
  step: z.number(),
  default: z.number(),
  unit: z.string().optional(),
});

const interactiveOutput = z.object({
  key: z.string(),
  label: z.string(),
  unit: z.string().optional(),
  // Hex color for this output's line in the trend chart.
  color: z.string(),
});

const interactiveDemo = z.object({
  id: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  title: z.string(),
  description: z.string(),
  params: z.array(interactiveParam).min(1),
  // JS function body: receives `params` (object keyed by param name) and
  // must return an object keyed by each output's `key`, all numbers.
  compute: z.string(),
  outputs: z.array(interactiveOutput).min(1),
  // Which param's range the trend chart sweeps across (the other params
  // stay fixed at their current slider values).
  chartParam: z.string(),
});

const interactives = defineCollection({
  loader: glob({ pattern: "**/interactives.json", base: "./src/content" }),
  schema: z.object({
    items: z.array(interactiveDemo),
  }),
});

export const collections = { curriculum, exercises, interactives };
