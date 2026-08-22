// Short "what you'd assume vs. what it actually is" hooks, one per track —
// used by TopicMythModal.astro to invite deeper reading from the homepage
// and roadmap track headers. Deliberately brief marketing copy, not
// curriculum content — CLAUDE.md's content-generation rules govern
// L1/L2/L3 units, not this.
export interface TrackTeaser {
  myth: string;
  reality: string;
}

export const TRACK_TEASERS: Record<string, TrackTeaser> = {
  web: {
    myth: "It's just building pages that look good in a browser.",
    reality:
      "It's understanding the request/response, security, and performance contracts every UI silently depends on — the parts that break in production, not in the design file.",
  },
  systems: {
    myth: "Systems knowledge is only for people building OS kernels.",
    reality:
      "It's the reasoning that explains why your app is slow, corrupts data, or falls over under load — regardless of what layer you actually write code in.",
  },
  "git-teamwork": {
    myth: "Git is just “save” and “undo” for code.",
    reality:
      "It's the shared source of truth a whole team reasons from — get the model wrong and you silently lose or overwrite someone's real work.",
  },
  "business-communication": {
    myth: "Communication skill just means being a good talker.",
    reality:
      "It's deliberately shaping a message so a specific audience, in a specific state, actually understands and acts on it.",
  },
  logic: {
    myth: "Logic is abstract puzzle-solving with no real use.",
    reality:
      "It's the toolkit for catching the flawed argument, the buggy conditional, or the leaky abstraction before it ships.",
  },
  security: {
    myth: "Security is a separate team's job, bolted on at the end.",
    reality:
      "It's a default posture in every design decision — most real breaches start from an assumption nobody thought to question.",
  },
  "infra-delivery": {
    myth: "It's just writing YAML for a pipeline.",
    reality:
      "It's designing how software safely reaches real users — repeatably, reversibly, and without anyone getting paged at 3am.",
  },
  "career-craft": {
    myth: "Career growth is just waiting for a title change.",
    reality:
      "It's a set of concrete, learnable moves — scoping work, building visibility, calibrating expectations — that make growth something you drive, not wait for.",
  },
  "product-domain": {
    myth: "Product thinking is the PM's job, not the engineer's.",
    reality:
      "It's understanding *why* a feature matters before writing a line of code — the fastest way to build the wrong thing, perfectly.",
  },
  "corporate-politics": {
    myth: "Office politics means being fake or manipulative.",
    reality:
      "It's understanding how decisions actually get made, around incentives and relationships — ignore it and good ideas lose anyway.",
  },
  "learning-craft": {
    myth: "Learning faster just means reading more.",
    reality:
      "It's a set of techniques — spaced repetition, active recall, deliberate practice — that make the same hours produce deeper, longer retention.",
  },
  "applied-math": {
    myth: "Math at work means academic proofs nobody actually needs.",
    reality:
      "It's the handful of tools — probability, statistics, time series — that turn a gut feeling into a decision you can actually defend.",
  },
  "testing-quality": {
    myth: "Testing is just writing more code to check other code.",
    reality:
      "It's designing a system so its failure modes are visible on your terms — before they're visible on a user's.",
  },
  "software-design": {
    myth: "Design principles are academic rules for “clean code.”",
    reality:
      "They're the difference between a codebase that bends and one that breaks the next time requirements change.",
  },
  "sustainable-performance": {
    myth: "Sustainable performance just means working fewer hours.",
    reality:
      "It's managing attention and energy deliberately, so output doesn't quietly collapse under a schedule that looks fine on paper.",
  },
  "people-management": {
    myth: "Managing people is just assigning tasks and checking status.",
    reality:
      "It's the harder work of calibration, feedback, and trust that decides whether a team's output is more — or less — than the sum of its parts.",
  },
  architecture: {
    myth: "Architecture is just drawing boxes and arrows before the real work starts.",
    reality:
      "It's the set of org-level, hard-to-reverse calls — style, boundaries, build vs. buy — that a single codebase's design can't undo later.",
  },
  design: {
    myth: "Design is just making things look nice at the end.",
    reality:
      "It's understanding the human on the other side of the screen well enough that the interface disappears and the task doesn't fight them.",
  },
};
