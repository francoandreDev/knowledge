// Coarse orientation for track grids and cards — a first-timer scanning 18
// tracks has no way to tell "is this a coding track or a management track"
// without reading all of them. Three groups, purely presentational: they
// never affect track order, roadmap data, or any personalization filter.
// Shared between the homepage's category filter chips (index.astro) and the
// OG-image renderer (og-image.ts), which needed its own accent color per
// category — a single source avoids the two drifting out of sync the way
// ROADMAP.md/roadmap.json would without generate:roadmap.
export type TrackCategory = "engineering" | "people" | "thinking";

export const TRACK_CATEGORIES: Record<string, TrackCategory> = {
  web: "engineering",
  systems: "engineering",
  "git-teamwork": "engineering",
  security: "engineering",
  "infra-delivery": "engineering",
  "testing-quality": "engineering",
  "software-design": "engineering",
  architecture: "engineering",
  "business-communication": "people",
  "career-craft": "people",
  "corporate-politics": "people",
  "people-management": "people",
  "product-domain": "people",
  logic: "thinking",
  "learning-craft": "thinking",
  "applied-math": "thinking",
  design: "thinking",
  "sustainable-performance": "thinking",
};

export const CATEGORY_LABELS: Record<TrackCategory, string> = {
  engineering: "Engineering craft",
  people: "Working with people",
  thinking: "Thinking tools",
};

// A static PNG can't read the site's CSS custom properties, so the OG
// renderer gets its own fixed per-category accent instead of --accent.
export const CATEGORY_OG_COLORS: Record<TrackCategory, string> = {
  engineering: "#38bdf8", // sky-400
  people: "#c084fc", // purple-400
  thinking: "#fbbf24", // amber-400
};
