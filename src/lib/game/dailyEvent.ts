// The night's event: one small modifier per calendar day, picked from the day
// key so every visit that day sees the same sky. The lobby paints the sky and
// names the change before the run starts; launch() applies the numbers.
import { dayKey } from "./daily";
import { hashString } from "./hash";

export type DailyEventId = "clear" | "blood" | "fog" | "storm";

export interface DailyEvent {
  id: DailyEventId;
  name: string;
  /** One line for the lobby chip; empty on a clear night. */
  blurb: string;
  /** Multiplies coins earned in the run. */
  coinMult: number;
  /** Multiplies how fast enemies move and act. */
  enemySpeedMult: number;
}

const CLEAR: DailyEvent = {
  id: "clear",
  name: "Clear night",
  blurb: "",
  coinMult: 1,
  enemySpeedMult: 1,
};

// Clear appears twice so the events stay a treat rather than the rule.
const EVENTS: DailyEvent[] = [
  CLEAR,
  {
    id: "blood",
    name: "Blood moon",
    blurb: "+25% coins, enemies 10% faster",
    coinMult: 1.25,
    enemySpeedMult: 1.1,
  },
  CLEAR,
  {
    id: "fog",
    name: "Fog night",
    blurb: "Enemies 8% slower",
    coinMult: 1,
    enemySpeedMult: 0.92,
  },
  {
    id: "storm",
    name: "Storm night",
    blurb: "+30% coins, enemies 12% faster",
    coinMult: 1.3,
    enemySpeedMult: 1.12,
  },
];

export function dailyEventForDay(day: string): DailyEvent {
  return EVENTS[hashString(`event:${day}`) % EVENTS.length];
}

export function todaysEvent(now: Date = new Date()): DailyEvent {
  return dailyEventForDay(dayKey(now));
}
