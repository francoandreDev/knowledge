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
  type AchievementDef,
  type Lifetime,
  type MissionDef,
  type RunStats,
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
