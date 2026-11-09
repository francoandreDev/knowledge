// Daily missions and lifetime achievements. Pure data and rules here; the
// stored counters and payouts live in missionStore.ts. Every run (not
// training) is scored against today's three missions and the achievement
// list, so there is always a small goal beyond "survive longer".
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
}

export const MISSION_POOL: MissionDef[] = [
  {
    id: "kills-250",
    text: "Defeat 250 enemies in one run",
    coins: 50,
    check: (r) => r.kills >= 250,
  },
  {
    id: "kills-600",
    text: "Defeat 600 enemies in one run",
    coins: 90,
    check: (r) => r.kills >= 600,
  },
  {
    id: "survive-3m",
    text: "Survive 3 minutes in one run",
    coins: 60,
    check: (r) => r.survivedS >= 180,
  },
  {
    id: "level-10",
    text: "Reach level 10 in one run",
    coins: 60,
    check: (r) => r.level >= 10,
  },
  {
    id: "level-15",
    text: "Reach level 15 in one run",
    coins: 100,
    check: (r) => r.level >= 15,
  },
  {
    id: "coins-120",
    text: "Earn 120 coins in one run",
    coins: 50,
    check: (r) => r.coinsEarned >= 120,
  },
  {
    id: "win-run",
    text: "Survive a whole timed run",
    coins: 80,
    check: (r) => r.won,
  },
  {
    id: "boss-down",
    text: "Defeat a boss",
    coins: 100,
    check: (r) => r.bossDefeated,
  },
  {
    id: "endless-4m",
    text: "Survive 4 minutes in Endless",
    coins: 90,
    check: (r) => r.endless && r.survivedS >= 240,
  },
];

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
