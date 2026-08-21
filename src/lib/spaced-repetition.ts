// Client-side only (uses localStorage, via the per-profile pStorage
// wrapper) — imported directly by component <script> tags, never by
// server-rendered .astro frontmatter. Deliberately framework-free so it
// works the same whether or not View Transitions are ever added later.

import { pStorage } from "./profile";

export interface ProgressState {
  done: boolean;
  doneAt?: number;
  nextReviewAt?: number;
  /** How many successful review cycles this unit has been through. */
  stage: number;
}

/** Days until the next re-exam, indexed by stage. Caps at the last value. */
const REVIEW_INTERVALS_DAYS = [7, 30, 90];
const DAY_MS = 24 * 60 * 60 * 1000;

function progressKey(track: string, unitSlug: string): string {
  return `progress:${track}/${unitSlug}`;
}

function exerciseKey(
  track: string,
  unitSlug: string,
  exerciseId: string,
): string {
  return `exercise:${track}/${unitSlug}/${exerciseId}`;
}

export function getProgress(track: string, unitSlug: string): ProgressState {
  const raw = pStorage.getItem(progressKey(track, unitSlug));
  if (!raw) return { done: false, stage: 0 };
  try {
    const parsed = JSON.parse(raw);
    return {
      done: !!parsed.done,
      doneAt: parsed.doneAt,
      nextReviewAt: parsed.nextReviewAt,
      stage: typeof parsed.stage === "number" ? parsed.stage : 0,
    };
  } catch {
    return { done: false, stage: 0 };
  }
}

function saveProgress(track: string, unitSlug: string, state: ProgressState) {
  pStorage.setItem(progressKey(track, unitSlug), JSON.stringify(state));
}

export function isReviewDue(state: ProgressState): boolean {
  return state.done && !!state.nextReviewAt && Date.now() >= state.nextReviewAt;
}

/** Marks a unit done and schedules its next spaced-repetition re-exam. */
export function markDone(track: string, unitSlug: string): ProgressState {
  const previous = getProgress(track, unitSlug);
  const stage = Math.min(previous.stage, REVIEW_INTERVALS_DAYS.length - 1);
  const intervalDays = REVIEW_INTERVALS_DAYS[stage];
  const now = Date.now();
  const next: ProgressState = {
    done: true,
    doneAt: now,
    nextReviewAt: now + intervalDays * DAY_MS,
    stage: Math.min(previous.stage + 1, REVIEW_INTERVALS_DAYS.length - 1),
  };
  saveProgress(track, unitSlug, next);
  return next;
}

/** Manual un-mark — doesn't touch the review schedule or stage. */
export function unmarkDone(track: string, unitSlug: string): ProgressState {
  const previous = getProgress(track, unitSlug);
  const next: ProgressState = { ...previous, done: false };
  saveProgress(track, unitSlug, next);
  return next;
}

export function getExerciseState(
  track: string,
  unitSlug: string,
  exerciseId: string,
): "passed" | "failed" | null {
  const raw = pStorage.getItem(exerciseKey(track, unitSlug, exerciseId));
  return raw === "passed" || raw === "failed" ? raw : null;
}

export function setExerciseState(
  track: string,
  unitSlug: string,
  exerciseId: string,
  state: "passed" | "failed",
) {
  pStorage.setItem(exerciseKey(track, unitSlug, exerciseId), state);
}

export function allExercisesPassed(
  track: string,
  unitSlug: string,
  exerciseIds: string[],
): boolean {
  if (exerciseIds.length === 0) return true;
  return exerciseIds.every(
    (id) => getExerciseState(track, unitSlug, id) === "passed",
  );
}

/**
 * If this unit's review is due, resets it to "not done" and clears every
 * exercise's pass/fail state (forcing a real re-take, not just a re-click)
 * — this is the "exam again to catch regressions" mechanic. Returns true
 * if a reset happened, so the caller can notify other components on the
 * page (see the "unit:exercises-reset" CustomEvent dispatched by
 * ProgressToggle) to re-render as unanswered even if they already
 * initialized before this ran.
 *
 * Clears by localStorage key prefix rather than a passed-in id list — the
 * exercise pool shown to the learner is now chosen randomly per page view
 * (see ExercisePanel), so there's no fixed id list to know ahead of time.
 */
export function checkAndApplyReviewDue(
  track: string,
  unitSlug: string,
): boolean {
  const state = getProgress(track, unitSlug);
  if (!isReviewDue(state)) return false;

  saveProgress(track, unitSlug, { ...state, done: false });
  const prefix = exerciseKey(track, unitSlug, "");
  for (const key of pStorage.keys()) {
    if (key.startsWith(prefix)) pStorage.removeItem(key);
  }
  return true;
}

export function daysUntil(timestampMs: number): number {
  return Math.max(0, Math.ceil((timestampMs - Date.now()) / DAY_MS));
}
