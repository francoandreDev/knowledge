// Powers the "Instrument Panel" radial gauges (homepage track cards, roadmap
// track headers): a gauge's arc/label reflects the *reader's own* completion
// of a track, not how much content exists for it — that number needs the
// active profile's progress state, so it's computed client-side and applied
// after mount, the same pattern as index.astro's "continue learning" widget.
import { pStorage } from "./profile";

export type TrackUnitMap = Record<string, string[]>;

interface ProgressState {
  done?: boolean;
}

/** Groups written units by track — the pool of slugs a reader could have marked done. */
export function groupSlugsByTrack(
  units: { track: string; unitSlug: string }[],
): TrackUnitMap {
  const map: TrackUnitMap = {};
  for (const u of units) {
    (map[u.track] ??= []).push(u.unitSlug);
  }
  return map;
}

export function countDoneByTrack(
  trackUnits: TrackUnitMap,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [track, slugs] of Object.entries(trackUnits)) {
    let done = 0;
    for (const slug of slugs) {
      const raw = pStorage.getItem(`progress:${track}/${slug}`);
      if (!raw) continue;
      try {
        const state: ProgressState = JSON.parse(raw);
        if (state.done) done++;
      } catch {
        // Malformed entry — treat as not done rather than throwing.
      }
    }
    counts[track] = done;
  }
  return counts;
}

/** Total units marked done across every track — powers the homepage's overall gauge. */
export function countTotalDone(trackUnits: TrackUnitMap): number {
  const counts = countDoneByTrack(trackUnits);
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

interface ProgressStateWithDate extends ProgressState {
  doneAt?: number;
  nextReviewAt?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Local calendar day as an integer "days since epoch" — diffing these
 * (instead of raw millisecond gaps) stays correct across a DST transition,
 * where two consecutive local days aren't exactly 24h apart.
 */
function dayNumber(timestampMs: number): number {
  const d = new Date(timestampMs);
  return Math.floor(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS,
  );
}

/**
 * Every distinct calendar day with at least one unit marked done, derived
 * from progress records' `doneAt` — there's no separate activity log. A
 * unit re-done after a spaced-repetition reset only contributes its latest
 * completion day, so a reader who only ever re-completes the same handful
 * of units across many days would undercount here; for a 246-unit site
 * that's not the common path, and adding a standalone activity log just
 * for this would be a bigger structural change than the streak itself.
 */
function activeDayNumbers(): Set<number> {
  const days = new Set<number>();
  for (const key of pStorage.keys()) {
    if (!key.startsWith("progress:")) continue;
    const raw = pStorage.getItem(key);
    if (!raw) continue;
    try {
      const state: ProgressStateWithDate = JSON.parse(raw);
      if (state.doneAt) days.add(dayNumber(state.doneAt));
    } catch {
      // Malformed entry — ignore.
    }
  }
  return days;
}

export interface StreakInfo {
  /** Consecutive days up to and including today, or up to yesterday if
   * nothing's done yet today — a streak doesn't reset at midnight before
   * the reader's had a chance to act. */
  current: number;
  /** Longest run of consecutive active days on record. */
  longest: number;
  activeToday: boolean;
}

/** Powers the homepage's streak chip — replaces the old fixed weekly-goal
 * gauge with the reader's actual day-over-day continuity. */
export function computeStreak(): StreakInfo {
  const days = activeDayNumbers();
  const today = dayNumber(Date.now());
  const activeToday = days.has(today);

  let current = 0;
  let cursor = activeToday ? today : today - 1;
  while (days.has(cursor)) {
    current++;
    cursor--;
  }

  let longest = 0;
  let run = 0;
  let prevDay: number | null = null;
  for (const d of Array.from(days).sort((a, b) => a - b)) {
    run = prevDay !== null && d === prevDay + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prevDay = d;
  }

  return { current, longest: Math.max(longest, current), activeToday };
}

/** Whether a given calendar day (any timestamp within it) shows activity —
 * powers the homepage's 7-day "don't break the chain" strip. */
export function isDayActive(timestampMs: number): boolean {
  return activeDayNumbers().has(dayNumber(timestampMs));
}

/** Units currently due for their spaced-repetition re-exam — the concrete,
 * specific reason to come back today rather than "sometime." */
export function countReviewDue(): number {
  const now = Date.now();
  let count = 0;
  for (const key of pStorage.keys()) {
    if (!key.startsWith("progress:")) continue;
    const raw = pStorage.getItem(key);
    if (!raw) continue;
    try {
      const state: ProgressStateWithDate = JSON.parse(raw);
      if (state.done && state.nextReviewAt && now >= state.nextReviewAt) {
        count++;
      }
    } catch {
      // Malformed entry — ignore.
    }
  }
  return count;
}

/** Track/slug pairs currently due for review, resolved against a lookup of
 * every written unit — used to build the homepage's due-for-review list
 * without re-deriving titles from raw storage keys. */
export function getDueUnits<T extends { track: string; slug: string }>(
  lookup: T[],
): T[] {
  const now = Date.now();
  return lookup.filter((u) => {
    const raw = pStorage.getItem(`progress:${u.track}/${u.slug}`);
    if (!raw) return false;
    try {
      const state: ProgressStateWithDate = JSON.parse(raw);
      return !!(state.done && state.nextReviewAt && now >= state.nextReviewAt);
    } catch {
      return false;
    }
  });
}

const GAUGE_RADIUS = 16;
export const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

/**
 * Finds every ProgressGauge.astro instance rendered in "dynamic" mode
 * (carrying `data-gauge-track`) and fills in its arc + label from the active
 * profile's real progress. Gauges rendered in "static" mode (a build-time
 * `fraction`, e.g. roadmap's content-coverage tiles) have no such attribute
 * and are left untouched.
 */
export function applyTrackGauges(trackUnits: TrackUnitMap): void {
  const counts = countDoneByTrack(trackUnits);
  document.querySelectorAll<HTMLElement>("[data-gauge-track]").forEach((el) => {
    const track = el.dataset.gaugeTrack;
    if (!track) return;
    const total = Number(el.dataset.gaugeTotal ?? "0");
    const done = counts[track] ?? 0;
    const fraction = total > 0 ? done / total : 0;

    const arc = el.querySelector<SVGCircleElement>("[data-gauge-arc]");
    if (arc) {
      arc.style.strokeDashoffset = String(GAUGE_CIRCUMFERENCE * (1 - fraction));
    }

    const label = el.querySelector<HTMLElement>("[data-gauge-frac]");
    if (label) {
      label.textContent = total > 0 ? `${done}/${total} done` : "Not started";
    }
  });
}
