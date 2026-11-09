// Risk level: chosen in the lobby before a run. A harder night pays more
// coins and asks for more: enemies move faster, arrive in greater numbers and
// have more HP. Calm is the game as it always was. Pure data and rules; the
// stored choice lives in tokens.ts next to the Endless toggle.
import type { Lifetime } from "./missions";

export type RiskId = "calm" | "hard" | "nightmare";

export interface RiskDef {
  id: RiskId;
  label: string;
  /** What it asks of the player, in a line. */
  blurb: string;
  /** Multiplies coins earned in the run. */
  coinMult: number;
  /** Multiplies how fast enemies move and act. */
  enemySpeedMult: number;
  /** Multiplies how often enemies spawn. */
  spawnRateMult: number;
  /** Multiplies every enemy's HP. */
  enemyHpMult: number;
  /** What the player must have done to pick it; empty when always open. */
  unlockText: string;
  unlocked: (life: Lifetime) => boolean;
}

export const RISKS: RiskDef[] = [
  {
    id: "calm",
    label: "Calm",
    blurb: "The game as it always was.",
    coinMult: 1,
    enemySpeedMult: 1,
    spawnRateMult: 1,
    enemyHpMult: 1,
    unlockText: "",
    unlocked: () => true,
  },
  {
    id: "hard",
    label: "Hard",
    blurb: "Faster, thicker waves of tougher enemies.",
    coinMult: 1.35,
    enemySpeedMult: 1.08,
    spawnRateMult: 1.25,
    enemyHpMult: 1.15,
    unlockText: "Play 2 runs",
    unlocked: (l) => l.runs >= 2,
  },
  {
    id: "nightmare",
    label: "Nightmare",
    blurb: "A swarm that does not stop. Not for a fragile build.",
    coinMult: 1.8,
    enemySpeedMult: 1.16,
    spawnRateMult: 1.55,
    enemyHpMult: 1.35,
    unlockText: "Survive a whole timed run",
    unlocked: (l) => l.wins >= 1,
  },
];

export function riskById(id: string | null | undefined): RiskDef {
  return RISKS.find((r) => r.id === id) ?? RISKS[0];
}

/** The level to use: the stored choice if it is still unlocked, else Calm. */
export function effectiveRisk(
  stored: string | null | undefined,
  life: Lifetime,
): RiskDef {
  const r = riskById(stored);
  return r.unlocked(life) ? r : RISKS[0];
}

/** "+35% coins", for the picker. Empty for Calm. */
export function coinBonusLabel(r: RiskDef): string {
  const pct = Math.round((r.coinMult - 1) * 100);
  return pct > 0 ? `+${pct}% coins` : "";
}
