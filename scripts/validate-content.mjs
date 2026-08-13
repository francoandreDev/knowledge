#!/usr/bin/env bun
// Guards against ROADMAP.md, src/data/roadmap.json, and the actual files under
// src/content/ silently drifting apart. Run via `bun run validate:content`
// (also part of `bun run check`). Exits non-zero on any problem.

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CONTENT_DIR = path.join(ROOT, "src/content");

/** @type {string[]} */
const problems = [];
/** @type {string[]} */
const warnings = [];

async function loadRoadmap() {
  const raw = await readFile(path.join(ROOT, "src/data/roadmap.json"), "utf8");
  return JSON.parse(raw);
}

async function checkGeneratedDataIsFresh() {
  const generatorPath = path.join(ROOT, "scripts/generate-roadmap-data.mjs");
  const roadmapMdPath = path.join(ROOT, "ROADMAP.md");
  const roadmapJsonPath = path.join(ROOT, "src/data/roadmap.json");

  const [mdStat, jsonStat] = await Promise.all([
    stat(roadmapMdPath),
    stat(roadmapJsonPath).catch(() => null),
  ]);

  if (!jsonStat) {
    problems.push(
      "src/data/roadmap.json is missing. Run `bun run generate:roadmap`.",
    );
    return;
  }

  if (mdStat.mtimeMs > jsonStat.mtimeMs) {
    warnings.push(
      "ROADMAP.md was modified more recently than src/data/roadmap.json — " +
        "run `bun run generate:roadmap` and commit the result before finishing this session.",
    );
  }

  void generatorPath;
}

async function listContentUnits() {
  /** @type {{ track: string, unitSlug: string, files: string[] }[]} */
  const units = [];
  let tracks;
  try {
    tracks = await readdir(CONTENT_DIR, { withFileTypes: true });
  } catch {
    return units;
  }

  for (const trackEntry of tracks) {
    if (!trackEntry.isDirectory()) continue;
    if (trackEntry.name.startsWith("_") || trackEntry.name.startsWith(".")) {
      warnings.push(
        `src/content/${trackEntry.name}/ looks like a throwaway/test folder — ` +
          "remove it before committing if it's not a real track.",
      );
      continue;
    }
    const trackPath = path.join(CONTENT_DIR, trackEntry.name);
    const unitEntries = await readdir(trackPath, { withFileTypes: true });
    for (const unitEntry of unitEntries) {
      if (!unitEntry.isDirectory()) continue;
      const unitPath = path.join(trackPath, unitEntry.name);
      const files = await readdir(unitPath, { recursive: true });
      units.push({
        track: trackEntry.name,
        unitSlug: unitEntry.name,
        files: files.filter((f) => f.endsWith(".md") || f.endsWith(".mdx")),
      });
    }
  }
  return units;
}

function levelsPresent(files) {
  const lower = files.map((f) => f.toLowerCase());
  return {
    l1: lower.some((f) => f.startsWith("l1")),
    l2: lower.some((f) => f.startsWith("l2")),
    l3: lower.some((f) => f.startsWith("l3")),
  };
}

async function checkExercisesFile(track, unitSlug) {
  const exercisesPath = path.join(
    CONTENT_DIR,
    track,
    unitSlug,
    "exercises.json",
  );
  const raw = await readFile(exercisesPath, "utf8").catch(() => null);
  if (raw === null) return; // no exercises for this unit — allowed

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    problems.push(
      `src/content/${track}/${unitSlug}/exercises.json is not valid JSON: ${err.message}`,
    );
    return;
  }

  if (!Array.isArray(parsed.items)) {
    problems.push(
      `src/content/${track}/${unitSlug}/exercises.json must have an "items" array.`,
    );
    return;
  }

  const seenIds = new Set();
  const poolLevelAndType = new Map();
  const poolFields = new Map();
  for (const [i, item] of parsed.items.entries()) {
    const where = `${track}/${unitSlug}/exercises.json items[${i}]`;
    if (![1, 2, 3].includes(item.level)) {
      problems.push(`${where}: "level" must be 1, 2, or 3.`);
    }
    if (!item.id || typeof item.id !== "string") {
      problems.push(`${where}: missing "id".`);
    } else if (seenIds.has(item.id)) {
      problems.push(
        `${where}: duplicate exercise id "${item.id}" within this unit.`,
      );
    } else {
      seenIds.add(item.id);
    }
    if (!item.prompt) problems.push(`${where}: missing "prompt".`);
    if (!item.explanation) {
      problems.push(
        `${where}: missing "explanation" — every exercise must say why the answer is what it is, not just pass/fail.`,
      );
    }

    const poolId = item.poolId ?? item.id;
    const prior = poolLevelAndType.get(poolId);
    if (prior && (prior.level !== item.level || prior.type !== item.type)) {
      problems.push(
        `${where}: poolId "${poolId}" mixes variants of different level/type — all variants in a pool must match.`,
      );
    } else {
      poolLevelAndType.set(poolId, { level: item.level, type: item.type });
    }

    // `reference` (whiteboard "Why:" line) and `learnMore` (deep-dive
    // modal) both render only once per pool view (a random variant is
    // shown), so every variant sharing a poolId must carry the identical
    // string where either is set.
    for (const field of ["reference", "learnMore"]) {
      if (!item[field]) continue;
      const key = `${poolId}:${field}`;
      const prior = poolFields.get(key);
      if (prior === undefined) {
        poolFields.set(key, item[field]);
      } else if (prior !== item[field]) {
        problems.push(
          `${where}: poolId "${poolId}" has a "${field}" that differs from another variant in the same pool — only one variant renders per view, so all variants must carry the identical ${field}.`,
        );
      }
    }

    if (item.type === "quiz") {
      if (!Array.isArray(item.choices) || item.choices.length < 2) {
        problems.push(`${where}: quiz needs at least 2 "choices".`);
      } else if (
        typeof item.correctIndex !== "number" ||
        item.correctIndex < 0 ||
        item.correctIndex >= item.choices.length
      ) {
        problems.push(
          `${where}: "correctIndex" must be a valid index into "choices".`,
        );
      }
    } else if (item.type === "code") {
      if (typeof item.starterCode !== "string") {
        problems.push(`${where}: code exercise needs "starterCode".`);
      }
      if (!Array.isArray(item.tests) || item.tests.length === 0) {
        problems.push(
          `${where}: code exercise needs at least one entry in "tests".`,
        );
      }
      if (!item.solution) {
        problems.push(
          `${where}: code exercise needs "solution" — revealed after any attempt so there's real learning behind the pass/fail.`,
        );
      }
    } else {
      problems.push(
        `${where}: "type" must be "quiz" or "code", got ${JSON.stringify(item.type)}.`,
      );
    }
  }
}

async function checkInteractivesFile(track, unitSlug) {
  const interactivesPath = path.join(
    CONTENT_DIR,
    track,
    unitSlug,
    "interactives.json",
  );
  const raw = await readFile(interactivesPath, "utf8").catch(() => null);
  if (raw === null) return; // no interactive demos for this unit — allowed

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    problems.push(
      `src/content/${track}/${unitSlug}/interactives.json is not valid JSON: ${err.message}`,
    );
    return;
  }

  if (!Array.isArray(parsed.items)) {
    problems.push(
      `src/content/${track}/${unitSlug}/interactives.json must have an "items" array.`,
    );
    return;
  }

  for (const [i, demo] of parsed.items.entries()) {
    const where = `${track}/${unitSlug}/interactives.json items[${i}]`;
    if (![1, 2, 3].includes(demo.level)) {
      problems.push(`${where}: "level" must be 1, 2, or 3.`);
    }
    if (!demo.id) problems.push(`${where}: missing "id".`);
    if (!demo.title) problems.push(`${where}: missing "title".`);
    if (!demo.description) problems.push(`${where}: missing "description".`);
    if (!Array.isArray(demo.params) || demo.params.length === 0) {
      problems.push(`${where}: needs at least one entry in "params".`);
    }
    if (!Array.isArray(demo.outputs) || demo.outputs.length === 0) {
      problems.push(`${where}: needs at least one entry in "outputs".`);
    }
    if (typeof demo.compute !== "string" || !demo.compute.includes("return")) {
      problems.push(
        `${where}: "compute" must be a JS function body string that returns an object keyed by each output's "key".`,
      );
    }
    const paramNames = new Set((demo.params ?? []).map((p) => p.name));
    if (!paramNames.has(demo.chartParam)) {
      problems.push(
        `${where}: "chartParam" (${JSON.stringify(demo.chartParam)}) must name one of "params".`,
      );
    }
    for (const p of demo.params ?? []) {
      if (
        typeof p.min !== "number" ||
        typeof p.max !== "number" ||
        p.min >= p.max
      ) {
        problems.push(`${where}: param "${p.name}" needs min < max.`);
      }
      if (
        typeof p.default !== "number" ||
        p.default < p.min ||
        p.default > p.max
      ) {
        problems.push(
          `${where}: param "${p.name}"'s "default" must be within [min, max].`,
        );
      }
    }
  }
}

async function checkFrontmatter(track, unitSlug, files) {
  for (const file of files) {
    const full = path.join(CONTENT_DIR, track, unitSlug, file);
    const raw = await readFile(full, "utf8");
    if (!/^---\n[\s\S]*?title:\s*.+\n[\s\S]*?---/.test(raw)) {
      problems.push(
        `src/content/${track}/${unitSlug}/${file} is missing a "title" in its frontmatter.`,
      );
    }
  }
}

async function main() {
  await checkGeneratedDataIsFresh();
  const { tracks } = await loadRoadmap();
  const roadmapKeys = new Set(
    tracks.flatMap((t) => t.units.map((u) => `${t.name}/${u.slug}`)),
  );
  const statusByKey = new Map(
    tracks.flatMap((t) =>
      t.units.map((u) => [`${t.name}/${u.slug}`, u.status]),
    ),
  );

  const units = await listContentUnits();

  for (const unit of units) {
    const key = `${unit.track}/${unit.unitSlug}`;

    if (!roadmapKeys.has(key)) {
      problems.push(
        `src/content/${key}/ has no matching row in ROADMAP.md. Either the ` +
          "slug drifted from what `generate:roadmap` assigned, or this unit " +
          "was never added to the roadmap. Fix the folder name or add the row.",
      );
      continue;
    }

    const { l1, l2, l3 } = levelsPresent(unit.files);
    const status = statusByKey.get(key);

    if (!l1 && !l2 && !l3) {
      problems.push(
        `src/content/${key}/ has files but none look like L1/L2/L3.`,
      );
    }

    if (status === "done" && !(l1 && l2 && l3)) {
      problems.push(
        `${key} is marked "done" in ROADMAP.md but is missing ${[
          !l1 && "L1",
          !l2 && "L2",
          !l3 && "L3",
        ]
          .filter(Boolean)
          .join("/")}.`,
      );
    }

    if (status === "planned" && (l1 || l2 || l3)) {
      warnings.push(
        `${key} has written content but is still marked "planned" in ` +
          "ROADMAP.md — update its status (in-progress/done) and re-run generate:roadmap.",
      );
    }

    await checkFrontmatter(unit.track, unit.unitSlug, unit.files);
    await checkExercisesFile(unit.track, unit.unitSlug);
    await checkInteractivesFile(unit.track, unit.unitSlug);
  }

  if (warnings.length > 0) {
    console.warn("Warnings:");
    for (const w of warnings) console.warn(`  - ${w}`);
  }

  if (problems.length > 0) {
    console.error("\nContent validation failed:");
    for (const p of problems) console.error(`  ✘ ${p}`);
    process.exit(1);
  }

  console.log(
    `Content validation passed (${units.length} written unit(s) checked).`,
  );
}

main();
