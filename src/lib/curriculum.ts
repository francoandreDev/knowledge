// Type-only import: astro:content is a virtual module that only resolves
// inside Astro's Vite pipeline, not under `bun test`. getCollection is
// dynamic-imported below, inside the functions that actually need it, so
// this file stays importable (and its pure helpers like parseEntryId
// testable) outside of Astro too.
import type { CollectionEntry } from "astro:content";

export type CurriculumEntry = CollectionEntry<"curriculum">;
export type ExerciseItem =
  CollectionEntry<"exercises">["data"]["items"][number];

export interface ParsedEntryId {
  track: string;
  unitSlug: string;
  level: 1 | 2 | 3;
  /** Present only for a split L3-deep-dive/part-N-slug entry. */
  part?: string;
}

export function parseEntryId(id: string): ParsedEntryId | null {
  // The glob loader lowercases generated ids, so "L1-summary" becomes
  // "l1-summary" — match case-insensitively.
  const segments = id.split("/");
  const [track, unitSlug, first, second] = segments;
  if (!track || !unitSlug || !first) return null;
  const firstLower = first.toLowerCase();

  if (firstLower.startsWith("l1")) return { track, unitSlug, level: 1 };
  if (firstLower.startsWith("l2")) return { track, unitSlug, level: 2 };
  if (firstLower.startsWith("l3") && !second) {
    return { track, unitSlug, level: 3 };
  }
  if (firstLower.startsWith("l3") && second) {
    return { track, unitSlug, level: 3, part: second };
  }
  return null;
}

/** Parses "<track>/<unit-slug>/exercises" — the exercises collection's id shape. */
export function parseExercisesEntryId(
  id: string,
): { track: string; unitSlug: string } | null {
  const segments = id.split("/");
  const [track, unitSlug, file] = segments;
  if (!track || !unitSlug || !file) return null;
  if (file.toLowerCase() !== "exercises") return null;
  return { track, unitSlug };
}

export interface UnitContent {
  track: string;
  unitSlug: string;
  l1?: CurriculumEntry;
  l2?: CurriculumEntry;
  l3?: CurriculumEntry;
  l3Parts: CurriculumEntry[];
  exercises: ExerciseItem[];
}

/** All units that have at least one written level, grouped and ready to render. */
export async function getWrittenUnits(): Promise<UnitContent[]> {
  const { getCollection } = await import("astro:content");
  const entries = await getCollection("curriculum");
  const byUnit = new Map<string, UnitContent>();

  function unitFor(track: string, unitSlug: string): UnitContent {
    const key = `${track}/${unitSlug}`;
    if (!byUnit.has(key)) {
      byUnit.set(key, { track, unitSlug, l3Parts: [], exercises: [] });
    }
    return byUnit.get(key)!;
  }

  for (const entry of entries) {
    const parsed = parseEntryId(entry.id);
    if (!parsed) continue;
    const unit = unitFor(parsed.track, parsed.unitSlug);
    if (parsed.level === 1) unit.l1 = entry;
    else if (parsed.level === 2) unit.l2 = entry;
    else if (parsed.level === 3 && !parsed.part) unit.l3 = entry;
    else if (parsed.level === 3 && parsed.part && parsed.part !== "00-index") {
      unit.l3Parts.push(entry);
    }
  }

  const exerciseEntries = await getCollection("exercises");
  for (const entry of exerciseEntries) {
    const parsed = parseExercisesEntryId(entry.id);
    if (!parsed) continue;
    // Only attach exercises to units that actually have written levels —
    // an exercises.json with no L1/L2/L3 alongside it is orphaned content,
    // caught separately by validate-content.mjs.
    const key = `${parsed.track}/${parsed.unitSlug}`;
    if (!byUnit.has(key)) continue;
    unitFor(parsed.track, parsed.unitSlug).exercises = entry.data.items;
  }

  for (const unit of byUnit.values()) {
    unit.l3Parts.sort((a, b) => a.id.localeCompare(b.id));
  }

  return [...byUnit.values()];
}

export interface ExercisePool {
  poolId: string;
  level: 1 | 2 | 3;
  variants: ExerciseItem[];
}

/**
 * Groups exercise items into pools (items sharing a poolId are
 * interchangeable variants of the same question — see content.config.ts).
 * An item with no poolId is its own singleton pool, keyed by its id.
 */
export function groupExercisesIntoPools(items: ExerciseItem[]): ExercisePool[] {
  const byPool = new Map<string, ExercisePool>();
  for (const item of items) {
    const poolId = item.poolId ?? item.id;
    if (!byPool.has(poolId)) {
      byPool.set(poolId, { poolId, level: item.level, variants: [] });
    }
    byPool.get(poolId)!.variants.push(item);
  }
  return [...byPool.values()];
}

export async function getUnitContent(
  track: string,
  unitSlug: string,
): Promise<UnitContent | null> {
  const units = await getWrittenUnits();
  return (
    units.find((u) => u.track === track && u.unitSlug === unitSlug) ?? null
  );
}
