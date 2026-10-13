// Raw SVG geometry for each track's lucide icon (see TrackIcon.astro for the
// same track→icon mapping), copied once from node_modules/lucide-astro's
// source so the OG-image renderer (og-image.ts) can embed a track's icon as
// a plain satori element tree. Satori renders a JSX-like object tree, not
// Astro components, so TrackIcon.astro's <Icon /> can't be reused directly
// there — this is the smallest faithful stand-in: the exact <circle>/<path>/
// <rect>/<line>/<polyline> children lucide ships for each icon, wrapped at
// render time in the same viewBox="0 0 24 24" fill="none" stroke="currentColor"
// svg shell lucide itself uses. Static data, not a runtime dependency on
// lucide-astro's internals — won't silently drift if that package updates.
export interface IconNode {
  type: "circle" | "path" | "rect" | "line" | "polyline";
  props: Record<string, string | number>;
}

export const TRACK_ICON_PATHS: Record<string, IconNode[]> = {
  web: [
    { type: "circle", props: { cx: 12, cy: 12, r: 10 } },
    {
      type: "path",
      props: { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" },
    },
    { type: "path", props: { d: "M2 12h20" } },
  ],
  systems: [
    { type: "rect", props: { width: 20, height: 8, x: 2, y: 2, rx: 2, ry: 2 } },
    {
      type: "rect",
      props: { width: 20, height: 8, x: 2, y: 14, rx: 2, ry: 2 },
    },
    { type: "line", props: { x1: 6, x2: "6.01", y1: 6, y2: 6 } },
    { type: "line", props: { x1: 6, x2: "6.01", y1: 18, y2: 18 } },
  ],
  "git-teamwork": [
    { type: "line", props: { x1: 6, x2: 6, y1: 3, y2: 15 } },
    { type: "circle", props: { cx: 18, cy: 6, r: 3 } },
    { type: "circle", props: { cx: 6, cy: 18, r: 3 } },
    { type: "path", props: { d: "M18 9a9 9 0 0 1-9 9" } },
  ],
  "business-communication": [
    {
      type: "path",
      props: {
        d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
      },
    },
  ],
  logic: [
    {
      type: "path",
      props: {
        d: "M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z",
      },
    },
  ],
  security: [
    {
      type: "path",
      props: {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      },
    },
  ],
  "infra-delivery": [
    {
      type: "path",
      props: {
        d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",
      },
    },
    {
      type: "path",
      props: {
        d: "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",
      },
    },
    { type: "path", props: { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" } },
    { type: "path", props: { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" } },
  ],
  "career-craft": [
    { type: "path", props: { d: "M16 7h6v6" } },
    { type: "path", props: { d: "m22 7-8.5 8.5-5-5L2 17" } },
  ],
  "product-domain": [
    {
      type: "path",
      props: { d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" },
    },
    { type: "rect", props: { width: 20, height: 14, x: 2, y: 6, rx: 2 } },
  ],
  "corporate-politics": [
    {
      type: "polyline",
      props: { points: "14.5 17.5 3 6 3 3 6 3 17.5 14.5" },
    },
    { type: "line", props: { x1: 13, x2: 19, y1: 19, y2: 13 } },
    { type: "line", props: { x1: 16, x2: 20, y1: 16, y2: 20 } },
    { type: "line", props: { x1: 19, x2: 21, y1: 21, y2: 19 } },
    { type: "polyline", props: { points: "14.5 6.5 18 3 21 3 21 6 17.5 9.5" } },
    { type: "line", props: { x1: 5, x2: 9, y1: 14, y2: 18 } },
    { type: "line", props: { x1: 7, x2: 4, y1: 17, y2: 20 } },
    { type: "line", props: { x1: 3, x2: 5, y1: 19, y2: 21 } },
  ],
  "learning-craft": [
    { type: "path", props: { d: "M12 7v14" } },
    {
      type: "path",
      props: {
        d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
      },
    },
  ],
  "applied-math": [
    { type: "rect", props: { width: 16, height: 20, x: 4, y: 2, rx: 2 } },
    { type: "line", props: { x1: 8, x2: 16, y1: 6, y2: 6 } },
    { type: "line", props: { x1: 16, x2: 16, y1: 14, y2: 18 } },
    { type: "path", props: { d: "M16 10h.01" } },
    { type: "path", props: { d: "M12 10h.01" } },
    { type: "path", props: { d: "M8 10h.01" } },
    { type: "path", props: { d: "M12 14h.01" } },
    { type: "path", props: { d: "M8 14h.01" } },
    { type: "path", props: { d: "M12 18h.01" } },
    { type: "path", props: { d: "M8 18h.01" } },
  ],
  "testing-quality": [
    { type: "path", props: { d: "M12 20v-9" } },
    {
      type: "path",
      props: { d: "M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z" },
    },
    { type: "path", props: { d: "M14.12 3.88 16 2" } },
    { type: "path", props: { d: "M21 21a4 4 0 0 0-3.81-4" } },
    { type: "path", props: { d: "M21 5a4 4 0 0 1-3.55 3.97" } },
    { type: "path", props: { d: "M22 13h-4" } },
    { type: "path", props: { d: "M3 21a4 4 0 0 1 3.81-4" } },
    { type: "path", props: { d: "M3 5a4 4 0 0 0 3.55 3.97" } },
    { type: "path", props: { d: "M6 13H2" } },
    { type: "path", props: { d: "m8 2 1.88 1.88" } },
    { type: "path", props: { d: "M9 7.13V6a3 3 0 1 1 6 0v1.13" } },
  ],
  "software-design": [
    {
      type: "path",
      props: {
        d: "M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2",
      },
    },
    { type: "rect", props: { x: 14, y: 2, width: 8, height: 8, rx: 1 } },
  ],
  "sustainable-performance": [
    {
      type: "path",
      props: {
        d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
      },
    },
    {
      type: "path",
      props: { d: "M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" },
    },
  ],
  "people-management": [
    { type: "path", props: { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" } },
    { type: "path", props: { d: "M16 3.128a4 4 0 0 1 0 7.744" } },
    { type: "path", props: { d: "M22 21v-2a4 4 0 0 0-3-3.87" } },
    { type: "circle", props: { cx: 9, cy: 7, r: 4 } },
  ],
  architecture: [
    { type: "rect", props: { x: 16, y: 16, width: 6, height: 6, rx: 1 } },
    { type: "rect", props: { x: 2, y: 16, width: 6, height: 6, rx: 1 } },
    { type: "rect", props: { x: 9, y: 2, width: 6, height: 6, rx: 1 } },
    {
      type: "path",
      props: { d: "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" },
    },
    { type: "path", props: { d: "M12 12V8" } },
  ],
  design: [
    {
      type: "path",
      props: {
        d: "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",
      },
    },
    {
      type: "circle",
      props: { cx: 13.5, cy: 6.5, r: 0.5, fill: "currentColor" },
    },
    {
      type: "circle",
      props: { cx: 17.5, cy: 10.5, r: 0.5, fill: "currentColor" },
    },
    {
      type: "circle",
      props: { cx: 6.5, cy: 12.5, r: 0.5, fill: "currentColor" },
    },
    {
      type: "circle",
      props: { cx: 8.5, cy: 7.5, r: 0.5, fill: "currentColor" },
    },
  ],
};
