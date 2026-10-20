// Sequential unlock rule shared by the roadmap's level map and the unit-page
// guard. Client-side only (reads the active profile's localStorage through
// pStorage), same as spaced-repetition.ts.
//
// A unit is unlocked when it is the first written unit of its track, or when
// the unit before it has ever been completed. "Ever completed" (not "done
// right now") on purpose: a spaced-repetition reset or a manual un-mark
// flips `done` back to false but keeps `doneAt`, and a re-exam coming due
// must not re-lock everything after it.

import { pStorage } from "./profile";

export type UnitState = "done" | "next" | "locked";

interface StoredProgress {
  done?: boolean;
  doneAt?: number;
  stage?: number;
}

export function hasCompleted(track: string, slug: string): boolean {
  const raw = pStorage.getItem(`progress:${track}/${slug}`);
  if (!raw) return false;
  try {
    const s: StoredProgress = JSON.parse(raw);
    return !!(s.done || s.doneAt || (s.stage ?? 0) > 0);
  } catch {
    return false;
  }
}

/** States for a track's written units, given their slugs in curriculum order. */
export function unitStates(track: string, slugs: string[]): UnitState[] {
  return slugs.map((slug, i) => {
    if (hasCompleted(track, slug)) return "done";
    if (i === 0 || hasCompleted(track, slugs[i - 1])) return "next";
    return "locked";
  });
}

/** Track of the most recently completed unit, if any — where to open the map. */
export function lastTouchedTrack(validTracks: string[]): string | null {
  let best: { track: string; at: number } | null = null;
  for (const key of pStorage.keys()) {
    if (!key.startsWith("progress:")) continue;
    const track = key.slice("progress:".length).split("/")[0];
    if (!validTracks.includes(track)) continue;
    try {
      const s: StoredProgress = JSON.parse(pStorage.getItem(key) || "{}");
      const at = s.doneAt ?? 0;
      if (!best || at > best.at) best = { track, at };
    } catch {
      // Malformed entry — ignore.
    }
  }
  return best?.track ?? null;
}
