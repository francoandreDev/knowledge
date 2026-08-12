#!/usr/bin/env bun
// Parses ROADMAP.md's per-track tables into structured data the Astro site consumes.
// ROADMAP.md remains the single human-edited source of truth; this script derives
// a stable slug for any row missing one, rewrites ROADMAP.md with an explicit Slug
// column (so slugs never silently change on a re-run), and emits src/data/roadmap.json.
//
// Run after adding/editing units in ROADMAP.md: `bun run generate:roadmap`

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ROADMAP_PATH = path.join(ROOT, "ROADMAP.md");
const OUT_JSON = path.join(ROOT, "src/data/roadmap.json");

const STOPWORDS = new Set([
  "a", "an", "the", "how", "why", "what", "do", "does", "did", "i", "we",
  "it", "is", "are", "of", "to", "in", "on", "for", "with", "without",
  "that", "this", "or", "and", "vs", "vs.", "not", "actually", "really",
  "instead", "before", "after", "so", "if", "than", "at", "as", "be",
  "my", "me", "someone", "something", "own",
]);

function slugFromText(text, maxWords = 6) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !STOPWORDS.has(w));
  return words.slice(0, maxWords).join("-") || "unit";
}

function deriveSlug(problem) {
  const parenMatch = problem.match(/\(([^)]+)\)/);
  const primary = parenMatch ? parenMatch[1].split(/[,:;]/)[0] : problem;
  return slugFromText(primary);
}

function uniqueSlug(base, used) {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let i = 2;
  while (used.has(`${base}-${i}`)) i++;
  const slug = `${base}-${i}`;
  used.add(slug);
  return slug;
}

async function main() {
  const raw = await readFile(ROADMAP_PATH, "utf8");
  const lines = raw.split("\n");

  const tracks = [];
  let currentTrack = null;
  const usedSlugsByTrack = new Map();
  const outLines = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trackHeading = line.match(/^## ([a-z][a-z0-9-]*)\/$/);
    if (trackHeading) {
      currentTrack = { name: trackHeading[1], units: [] };
      tracks.push(currentTrack);
      usedSlugsByTrack.set(currentTrack.name, new Set());
      outLines.push(line);
      continue;
    }

    const isTableHeader = /^\|\s*#\s*\|/.test(line) || /^\|\s*#\s*\|\s*Slug\s*\|/.test(line);
    if (isTableHeader && currentTrack) {
      outLines.push("| # | Slug | Problem | Status |");
      outLines.push("|---|---|---|---|");
      idx++; // skip the separator line under the original header
      continue;
    }

    const rowNoSlug = line.match(/^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(planned|in-progress|done)\s*\|$/);
    const rowWithSlug = line.match(/^\|\s*(\d+)\s*\|\s*([a-z0-9-]+)\s*\|\s*(.+?)\s*\|\s*(planned|in-progress|done)\s*\|$/);

    if (currentTrack && rowWithSlug) {
      const [, num, slug, problem, status] = rowWithSlug;
      usedSlugsByTrack.get(currentTrack.name).add(slug);
      currentTrack.units.push({ number: num, slug, problem, status });
      outLines.push(`| ${num} | ${slug} | ${problem} | ${status} |`);
      continue;
    }

    if (currentTrack && rowNoSlug) {
      const [, num, problem, status] = rowNoSlug;
      const used = usedSlugsByTrack.get(currentTrack.name);
      const slug = uniqueSlug(deriveSlug(problem), used);
      currentTrack.units.push({ number: num, slug, problem, status });
      outLines.push(`| ${num} | ${slug} | ${problem} | ${status} |`);
      continue;
    }

    outLines.push(line);
  }

  await writeFile(ROADMAP_PATH, outLines.join("\n"));
  await mkdir(path.dirname(OUT_JSON), { recursive: true });
  await writeFile(OUT_JSON, JSON.stringify({ tracks }, null, 2) + "\n");

  const totalUnits = tracks.reduce((sum, t) => sum + t.units.length, 0);
  console.log(`Parsed ${tracks.length} tracks, ${totalUnits} units.`);
  console.log(`Wrote ${path.relative(ROOT, OUT_JSON)} and updated ROADMAP.md with slugs.`);
}

main();
