// Stored side of missions.ts: lifetime counters, which of today's missions
// are done and which achievements are claimed. Same profile-namespaced
// pStorage as meta.ts. A finished run is scored once, in recordRunForMissions.
import { pStorage } from "../profile";
import { dayKey } from "./daily";
import { grantChest } from "./meta";
import {
  ACHIEVEMENTS,
  applyRun,
  EMPTY_LIFETIME,
  isAchieved,
  missionsForDay,
  newlyCompletedStudy,
  STUDY_MISSIONS,
  isStudyDone,
  type AchievementDef,
  type Lifetime,
  type MissionDef,
  type RunStats,
  type StudyMissionDef,
  type StudyStats,
} from "./missions";
import { addCoins } from "./shop";

const LIFETIME_KEY = "game:lifetime";
const MISSIONS_KEY_PREFIX = "game:missions:";
const ACHIEVED_KEY = "game:achieved";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = pStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getLifetime(): Lifetime {
  return {
    ...EMPTY_LIFETIME,
    ...readJson<Partial<Lifetime>>(LIFETIME_KEY, {}),
  };
}

function doneMissionIds(day: string): string[] {
  return readJson<string[]>(MISSIONS_KEY_PREFIX + day, []);
}

function achievedIds(): string[] {
  return readJson<string[]>(ACHIEVED_KEY, []);
}

export interface MissionRow {
  def: MissionDef;
  done: boolean;
}

export interface AchievementRow {
  def: AchievementDef;
  done: boolean;
  progress: [number, number];
}

export function getTodaysMissions(now: Date = new Date()): MissionRow[] {
  const day = dayKey(now);
  const done = new Set(doneMissionIds(day));
  return missionsForDay(day).map((def) => ({ def, done: done.has(def.id) }));
}

export function getAchievementRows(): AchievementRow[] {
  const life = getLifetime();
  const got = new Set(achievedIds());
  return ACHIEVEMENTS.map((def) => {
    const [cur, target] = def.progress(life);
    return {
      def,
      done: got.has(def.id),
      progress: [Math.min(cur, target), target],
    };
  });
}

export interface RunRewards {
  missions: MissionDef[];
  achievements: AchievementDef[];
  coins: number;
}

/** Scores a finished (non-training) run: pays and returns what was newly won. */
export function recordRunForMissions(
  stats: RunStats,
  now: Date = new Date(),
): RunRewards {
  const life = applyRun(getLifetime(), stats);
  pStorage.setItem(LIFETIME_KEY, JSON.stringify(life));

  const day = dayKey(now);
  const done = new Set(doneMissionIds(day));
  const missions = missionsForDay(day).filter(
    (m) => !done.has(m.id) && m.check(stats),
  );
  for (const m of missions) done.add(m.id);
  if (missions.length > 0) {
    pStorage.setItem(MISSIONS_KEY_PREFIX + day, JSON.stringify([...done]));
  }

  const got = new Set(achievedIds());
  const achievements = ACHIEVEMENTS.filter(
    (a) => !got.has(a.id) && isAchieved(a, life),
  );
  for (const a of achievements) got.add(a.id);
  if (achievements.length > 0) {
    pStorage.setItem(ACHIEVED_KEY, JSON.stringify([...got]));
  }

  const coins =
    missions.reduce((n, m) => n + m.coins, 0) +
    achievements.reduce((n, a) => n + a.coins, 0);
  addCoins(coins);
  for (const a of achievements) if (a.chest) grantChest(a.chest);
  document.dispatchEvent(new CustomEvent("game:missions-changed"));
  return { missions, achievements, coins };
}

// --- Study missions --------------------------------------------------------
// Recorded from the curriculum pages (ProgressToggle) rather than from a run.

const STUDY_KEY_PREFIX = "game:study:";

interface StudyDay {
  /** Units marked done today, once each. */
  units: string[];
  /** Units whose pass today was a repeat after a review came due. */
  reviewed: string[];
  /** Study missions already paid today. */
  claimed: string[];
}

function readStudyDay(day: string): StudyDay {
  const raw = readJson<Partial<StudyDay>>(STUDY_KEY_PREFIX + day, {});
  return {
    units: raw.units ?? [],
    reviewed: raw.reviewed ?? [],
    claimed: raw.claimed ?? [],
  };
}

function studyStats(d: StudyDay): StudyStats {
  return { passed: d.units.length, reviewed: d.reviewed.length };
}

/** Units whose spaced-repetition review is due now. */
export function countDueReviews(now: number = Date.now()): number {
  let due = 0;
  for (const key of pStorage.keys()) {
    if (!key.startsWith("progress:")) continue;
    try {
      const p = JSON.parse(pStorage.getItem(key) ?? "");
      if (p && p.stage > 0 && p.nextReviewAt && now >= p.nextReviewAt) due++;
    } catch {
      // malformed entry: ignore rather than crash the lobby
    }
  }
  return due;
}

export interface StudyRow {
  def: StudyMissionDef;
  done: boolean;
  progress: [number, number];
}

/** Today's study missions. The review one is only offered while something is
 * due (or once it has been won), so it is never an impossible ask. */
export function getTodaysStudyMissions(now: Date = new Date()): StudyRow[] {
  const d = readStudyDay(dayKey(now));
  const stats = studyStats(d);
  const reviewOffered =
    countDueReviews(now.getTime()) > 0 || d.reviewed.length > 0;
  return STUDY_MISSIONS.filter(
    (m) => m.id !== "study-review" || reviewOffered,
  ).map((def) => ({
    def,
    done: d.claimed.includes(def.id) || isStudyDone(def, stats),
    progress: def.progress(stats),
  }));
}

/** Records that a unit was marked done and pays whatever that completes.
 * `kind` is "review" when the unit had already been through a review cycle.
 * Returns the missions newly won. */
export function recordStudyEvent(
  kind: "pass" | "review",
  unitId: string,
  now: Date = new Date(),
): StudyMissionDef[] {
  const day = dayKey(now);
  const d = readStudyDay(day);
  if (!d.units.includes(unitId)) d.units.push(unitId);
  if (kind === "review" && !d.reviewed.includes(unitId))
    d.reviewed.push(unitId);
  const won = newlyCompletedStudy(studyStats(d), d.claimed);
  for (const m of won) d.claimed.push(m.id);
  pStorage.setItem(STUDY_KEY_PREFIX + day, JSON.stringify(d));
  if (won.length > 0) {
    addCoins(won.reduce((n, m) => n + m.coins, 0));
    for (const m of won) if (m.chest) grantChest(m.chest);
  }
  document.dispatchEvent(new CustomEvent("game:missions-changed"));
  return won;
}
