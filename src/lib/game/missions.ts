// Daily missions and lifetime achievements. Pure data and rules here; the
// stored counters and payouts live in missionStore.ts. Every run (not
// training) is scored against today's three missions and the achievement
// list, so there is always a small goal beyond "survive longer".
import { dayKey } from "./daily";
import { hashString } from "./hash";

export interface RunStats {
  survivedS: number;
  kills: number;
  level: number;
  coinsEarned: number;
  won: boolean;
  bossDefeated: boolean;
  endless: boolean;
}

export interface MissionDef {
  id: string;
  text: string;
  coins: number;
  check: (r: RunStats) => boolean;
  /** How far `r` gets toward the goal: current and target, current capped at
   * the target. Drives the progress bar and the best-attempt memory. */
  measure: (r: RunStats) => [number, number];
}

/** A run mission as a target on one number from the run. `gate` zeroes the
 * progress when the run is not the kind the mission asks for. */
function runMission(
  id: string,
  text: string,
  coins: number,
  target: number,
  pick: (r: RunStats) => number,
  gate: (r: RunStats) => boolean = () => true,
): MissionDef {
  return {
    id,
    text,
    coins,
    check: (r) => gate(r) && pick(r) >= target,
    measure: (r) => [gate(r) ? Math.min(pick(r), target) : 0, target],
  };
}

export const MISSION_POOL: MissionDef[] = [
  runMission(
    "kills-250",
    "Defeat 250 enemies in one run",
    50,
    250,
    (r) => r.kills,
  ),
  runMission(
    "kills-600",
    "Defeat 600 enemies in one run",
    90,
    600,
    (r) => r.kills,
  ),
  runMission(
    "survive-3m",
    "Survive 3 minutes in one run",
    60,
    180,
    (r) => r.survivedS,
  ),
  runMission("level-10", "Reach level 10 in one run", 60, 10, (r) => r.level),
  runMission("level-15", "Reach level 15 in one run", 100, 15, (r) => r.level),
  runMission(
    "coins-120",
    "Earn 120 coins in one run",
    50,
    120,
    (r) => r.coinsEarned,
  ),
  runMission("win-run", "Survive a whole timed run", 80, 1, (r) =>
    r.won ? 1 : 0,
  ),
  runMission("boss-down", "Defeat a boss", 100, 1, (r) =>
    r.bossDefeated ? 1 : 0,
  ),
  runMission(
    "endless-4m",
    "Survive 4 minutes in Endless",
    90,
    240,
    (r) => r.survivedS,
    (r) => r.endless,
  ),
];

export type MissionTier = "easy" | "medium" | "hard";

/** How demanding a mission is, read off its payout. */
export function missionTier(def: MissionDef): MissionTier {
  return def.coins <= 60 ? "easy" : def.coins <= 90 ? "medium" : "hard";
}

export const MISSIONS_PER_DAY = 3;

/** Today's missions: a stable pick per calendar day, never repeating. */
export function missionsForDay(day: string): MissionDef[] {
  const pool = [...MISSION_POOL];
  let seed = hashString(day);
  const out: MissionDef[] = [];
  while (out.length < MISSIONS_PER_DAY && pool.length > 0) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    out.push(pool.splice(seed % pool.length, 1)[0]);
  }
  return out;
}

// Study missions: the same daily shelf as the run missions above, but won on
// the curriculum pages rather than in a run. Marking a unit done is what pays,
// so the game can ask for the thing it exists to encourage. A unit counts once
// per day however often it is marked, un-marked and marked again.
export interface StudyStats {
  /** Distinct units marked done today. */
  passed: number;
  /** Of those, how many were a repeat pass after a review came due. */
  reviewed: number;
}

export interface StudyMissionDef {
  id: string;
  text: string;
  coins: number;
  chest?: "wooden" | "golden";
  /** Current and target value, for the progress bar. */
  progress: (s: StudyStats) => [number, number];
}

export const STUDY_MISSIONS: StudyMissionDef[] = [
  {
    id: "study-pass-1",
    text: "Mark a unit as done",
    coins: 80,
    progress: (s) => [Math.min(s.passed, 1), 1],
  },
  {
    id: "study-pass-3",
    text: "Mark 3 units as done in one day",
    coins: 200,
    chest: "wooden",
    progress: (s) => [Math.min(s.passed, 3), 3],
  },
  {
    id: "study-review",
    text: "Pass a unit again once its review is due",
    coins: 150,
    chest: "wooden",
    progress: (s) => [Math.min(s.reviewed, 1), 1],
  },
];

export function isStudyDone(def: StudyMissionDef, s: StudyStats): boolean {
  const [cur, target] = def.progress(s);
  return cur >= target;
}

/** The study missions `stats` completes that were not already claimed. */
export function newlyCompletedStudy(
  stats: StudyStats,
  claimed: readonly string[],
): StudyMissionDef[] {
  return STUDY_MISSIONS.filter(
    (m) => !claimed.includes(m.id) && isStudyDone(m, stats),
  );
}

export interface Lifetime {
  runs: number;
  kills: number;
  wins: number;
  bosses: number;
  bestLevel: number;
  bestEndlessS: number;
}

export const EMPTY_LIFETIME: Lifetime = {
  runs: 0,
  kills: 0,
  wins: 0,
  bosses: 0,
  bestLevel: 0,
  bestEndlessS: 0,
};

export function applyRun(l: Lifetime, r: RunStats): Lifetime {
  return {
    runs: l.runs + 1,
    kills: l.kills + r.kills,
    wins: l.wins + (r.won ? 1 : 0),
    bosses: l.bosses + (r.bossDefeated ? 1 : 0),
    bestLevel: Math.max(l.bestLevel, r.level),
    bestEndlessS: r.endless
      ? Math.max(l.bestEndlessS, r.survivedS)
      : l.bestEndlessS,
  };
}

export interface AchievementDef {
  id: string;
  name: string;
  text: string;
  coins: number;
  chest?: "wooden" | "golden";
  /** Current and target value, for the progress bar. */
  progress: (l: Lifetime) => [number, number];
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-steps",
    name: "First steps",
    text: "Finish 1 run",
    coins: 20,
    progress: (l) => [l.runs, 1],
  },
  {
    id: "regular",
    name: "Regular",
    text: "Finish 25 runs",
    coins: 120,
    progress: (l) => [l.runs, 25],
  },
  {
    id: "slayer",
    name: "Slayer",
    text: "Defeat 1,000 enemies in total",
    coins: 100,
    progress: (l) => [l.kills, 1000],
  },
  {
    id: "exterminator",
    name: "Exterminator",
    text: "Defeat 10,000 enemies in total",
    coins: 300,
    chest: "wooden",
    progress: (l) => [l.kills, 10000],
  },
  {
    id: "survivor",
    name: "Survivor",
    text: "Survive 5 whole timed runs",
    coins: 150,
    chest: "wooden",
    progress: (l) => [l.wins, 5],
  },
  {
    id: "boss-hunter",
    name: "Boss hunter",
    text: "Defeat 3 bosses",
    coins: 200,
    chest: "golden",
    progress: (l) => [l.bosses, 3],
  },
  {
    id: "power-climb",
    name: "Power climb",
    text: "Reach level 20 in one run",
    coins: 150,
    progress: (l) => [l.bestLevel, 20],
  },
  {
    id: "marathon",
    name: "Marathon",
    text: "Survive 10 minutes in Endless",
    coins: 250,
    chest: "golden",
    progress: (l) => [l.bestEndlessS, 600],
  },
];

export function isAchieved(a: AchievementDef, l: Lifetime): boolean {
  const [cur, target] = a.progress(l);
  return cur >= target;
}

// --- The daily sweep and the streak -----------------------------------------

/** Paid once a day, when all of that day's run missions are done. */
export const SWEEP_BONUS = { coins: 120, chest: "wooden" as const };

export interface Streak {
  /** Consecutive days with a mission won. */
  days: number;
  /** The last day (dayKey) that counted; null before the first. */
  last: string | null;
}

/** The day before `day` ("YYYY-MM-DD"). */
export function previousDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d - 1));
}

/** The streak after a mission is won on `today`: unchanged if today already
 * counted, one longer if yesterday did, otherwise back to 1. */
export function advanceStreak(prev: Streak, today: string): Streak {
  if (prev.last === today) return prev;
  if (prev.last === previousDay(today))
    return { days: prev.days + 1, last: today };
  return { days: 1, last: today };
}

/** The streak as it stands on `today`: a streak whose last day is older than
 * yesterday has lapsed. */
export function currentStreakDays(prev: Streak, today: string): number {
  if (prev.last === today || prev.last === previousDay(today)) return prev.days;
  return 0;
}

export const STREAK_BONUSES: { days: number; coins: number }[] = [
  { days: 3, coins: 60 },
  { days: 7, coins: 150 },
  { days: 14, coins: 300 },
  { days: 30, coins: 600 },
];

/** Coins for reaching exactly `days` in a row; 0 for any other length. */
export function streakBonus(days: number): number {
  return STREAK_BONUSES.find((b) => b.days === days)?.coins ?? 0;
}

/** The next milestone after `days`, or null past the last one. */
export function nextStreakBonus(
  days: number,
): { days: number; coins: number } | null {
  return STREAK_BONUSES.find((b) => b.days > days) ?? null;
}
