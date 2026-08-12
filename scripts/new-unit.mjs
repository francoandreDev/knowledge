#!/usr/bin/env bun
// One-command way to start a new unit safely:
//   bun run new:unit <track> <unit-number-or-slug>
//
// Looks the unit up in ROADMAP.md (via src/data/roadmap.json — run
// `generate:roadmap` first if you just edited ROADMAP.md), scaffolds
// src/content/<track>/<slug>/{L1-summary,L2-concept,L3-deep-dive}.md with
// correct frontmatter, and flips its ROADMAP.md status to "in-progress".
//
// This exists so a session always starts from the same known-good shape —
// see CLAUDE.md for what belongs in each level.

import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

function usageAndExit() {
  console.error("Usage: bun run new:unit <track> <unit-number-or-slug>");
  console.error("Example: bun run new:unit web 01");
  console.error("Example: bun run new:unit web http-request-response-basics");
  process.exit(1);
}

function levelStub(levelLabel, title, body) {
  return `---\ntitle: "${levelLabel} — ${title}"\n---\n\n${body}\n`;
}

async function main() {
  const [trackArg, unitArg] = process.argv.slice(2);
  if (!trackArg || !unitArg) usageAndExit();

  const roadmapJsonPath = path.join(ROOT, "src/data/roadmap.json");
  const { tracks } = JSON.parse(await readFile(roadmapJsonPath, "utf8"));
  const track = tracks.find((t) => t.name === trackArg);
  if (!track) {
    console.error(`No track named "${trackArg}" in ROADMAP.md.`);
    console.error(`Known tracks: ${tracks.map((t) => t.name).join(", ")}`);
    process.exit(1);
  }

  const unit = track.units.find(
    (u) => u.slug === unitArg || u.number === unitArg.padStart(2, "0"),
  );
  if (!unit) {
    console.error(`No unit "${unitArg}" found in track "${trackArg}".`);
    console.error(
      "Run `bun run validate:content` or check ROADMAP.md for valid slugs/numbers.",
    );
    process.exit(1);
  }

  const unitDir = path.join(ROOT, "src/content", track.name, unit.slug);
  const alreadyExists = await access(unitDir)
    .then(() => true)
    .catch(() => false);
  if (alreadyExists) {
    console.error(
      `${path.relative(ROOT, unitDir)} already exists — refusing to overwrite. ` +
        "Edit the files directly instead.",
    );
    process.exit(1);
  }

  await mkdir(unitDir, { recursive: true });

  await writeFile(
    path.join(unitDir, "L1-summary.md"),
    levelStub(
      "L1",
      unit.problem,
      "<!-- Tight outline: bullet points, key terms, the shape of the problem. -->\n",
    ),
  );
  await writeFile(
    path.join(unitDir, "L2-concept.md"),
    levelStub(
      "L2",
      unit.problem,
      "<!-- The idea itself: pseudocode, a diagram (```mermaid fences render live), architecture sketch. No production code yet. -->\n",
    ),
  );
  await writeFile(
    path.join(unitDir, "L3-deep-dive.md"),
    levelStub(
      "L3",
      unit.problem,
      "<!-- Extensive theory with real, runnable code. Trade-offs, edge cases, failure modes, at least one worked example. -->\n",
    ),
  );

  const roadmapMdPath = path.join(ROOT, "ROADMAP.md");
  const roadmapMd = await readFile(roadmapMdPath, "utf8");
  // Prettier pads table cells for column alignment, so match on whitespace
  // (\s*) around each cell rather than assuming single spaces — the exact
  // padding gets normalized again by the next `generate:roadmap` run anyway.
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rowPattern = new RegExp(
    `^(\\|\\s*${escape(unit.number)}\\s*\\|\\s*${escape(unit.slug)}\\s*\\|.*\\|\\s*)planned(\\s*\\|)$`,
    "m",
  );
  const updated = roadmapMd.replace(rowPattern, "$1in-progress$2");
  if (updated === roadmapMd) {
    console.warn(
      `Could not auto-update ROADMAP.md status for ${track.name}/${unit.slug} ` +
        '(maybe it wasn\'t "planned"?) — update it by hand.',
    );
  } else {
    await writeFile(roadmapMdPath, updated);
  }

  console.log(`Scaffolded ${path.relative(ROOT, unitDir)}/`);
  console.log(`  L1-summary.md, L2-concept.md, L3-deep-dive.md`);
  console.log(
    `Marked ${track.name}/${unit.slug} as in-progress in ROADMAP.md.`,
  );
  console.log("\nNext: bun run generate:roadmap, then write the content.");
}

main();
