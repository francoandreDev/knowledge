import { getCollection, type CollectionEntry } from "astro:content";

export type CurriculumEntry = CollectionEntry<"curriculum">;

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

export interface UnitContent {
  track: string;
  unitSlug: string;
  l1?: CurriculumEntry;
  l2?: CurriculumEntry;
  l3?: CurriculumEntry;
  l3Parts: CurriculumEntry[];
}

/** All units that have at least one written level, grouped and ready to render. */
export async function getWrittenUnits(): Promise<UnitContent[]> {
  const entries = await getCollection("curriculum");
  const byUnit = new Map<string, UnitContent>();

  for (const entry of entries) {
    const parsed = parseEntryId(entry.id);
    if (!parsed) continue;
    const key = `${parsed.track}/${parsed.unitSlug}`;
    if (!byUnit.has(key)) {
      byUnit.set(key, {
        track: parsed.track,
        unitSlug: parsed.unitSlug,
        l3Parts: [],
      });
    }
    const unit = byUnit.get(key)!;
    if (parsed.level === 1) unit.l1 = entry;
    else if (parsed.level === 2) unit.l2 = entry;
    else if (parsed.level === 3 && !parsed.part) unit.l3 = entry;
    else if (parsed.level === 3 && parsed.part && parsed.part !== "00-index") {
      unit.l3Parts.push(entry);
    }
  }

  for (const unit of byUnit.values()) {
    unit.l3Parts.sort((a, b) => a.id.localeCompare(b.id));
  }

  return [...byUnit.values()];
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
