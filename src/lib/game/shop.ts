// Phase 5 — coin balance + permanent shop upgrades (see docs/GAME-DESIGN.md
// "Coins and the shop"). Kept in the same profile-namespaced `pStorage` that
// tokens.ts already uses, not the design doc's originally-specced IndexedDB
// (`idb`) wrapper — see the "Implementation note (Phase 5)" this file's
// header points to in GAME-DESIGN.md for why that migration was skipped.
import { pStorage } from "../profile";

const COIN_BALANCE_KEY = "game:coins";
const UPGRADE_KEY_PREFIX = "game:upgrade:";

export type UpgradeId =
  | "vigor"
  | "fleetness"
  | "might"
  | "magnetism"
  | "greed"
  | "amanuensis"
  | "recovery";

export interface UpgradeDef {
  id: UpgradeId;
  label: string;
  effectLabel: string; // shown per-level in the shop UI
  maxLevel: number;
  baseCost: number;
}

// Per-level magnitudes (Vigor +10% HP, Fleetness +5% speed, etc.) come
// straight from GAME-DESIGN.md's table. `baseCost` and Recovery's per-level
// regen amount aren't specified there — both are open items resolved here:
// a uniform base cost keeps the shop's cost curve easy to reason about, and
// Recovery's regen was set low enough (0.3 HP/s/level, capped at 3 levels)
// that it reads as a steady trickle rather than trivializing contact damage.
export const UPGRADES: UpgradeDef[] = [
  {
    id: "vigor",
    label: "Vigor",
    effectLabel: "+10% max HP",
    maxLevel: 5,
    baseCost: 20,
  },
  {
    id: "fleetness",
    label: "Fleetness",
    effectLabel: "+5% movement speed",
    maxLevel: 5,
    baseCost: 20,
  },
  {
    id: "might",
    label: "Might",
    effectLabel: "+5% damage, all weapons",
    maxLevel: 5,
    baseCost: 20,
  },
  {
    id: "magnetism",
    label: "Magnetism",
    effectLabel: "+15% pickup radius",
    maxLevel: 5,
    baseCost: 20,
  },
  {
    id: "greed",
    label: "Greed",
    effectLabel: "+10% coins earned per run",
    maxLevel: 5,
    baseCost: 20,
  },
  {
    id: "amanuensis",
    label: "Amanuensis",
    effectLabel: "+5% XP earned",
    maxLevel: 5,
    baseCost: 20,
  },
  {
    id: "recovery",
    label: "Recovery",
    effectLabel: "+0.3 HP/s passive regen",
    maxLevel: 3,
    baseCost: 30,
  },
];

export interface UpgradeEffects {
  maxHpMult: number;
  speedMult: number;
  damageMult: number;
  pickupRadiusMult: number;
  coinMult: number;
  xpMult: number;
  regenPerS: number;
}

function readIntKey(key: string): number {
  const raw = pStorage.getItem(key);
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function getCoinBalance(): number {
  return readIntKey(COIN_BALANCE_KEY);
}

/** Adds a run's collected coins to the permanent balance — call once, at
 * game over, with the run's raw coinsEarned total. */
export function addCoins(n: number): void {
  if (n <= 0) return;
  const next = getCoinBalance() + Math.round(n);
  pStorage.setItem(COIN_BALANCE_KEY, String(next));
  document.dispatchEvent(new CustomEvent("game:coins-changed"));
}

export function getUpgradeLevel(id: UpgradeId): number {
  return readIntKey(UPGRADE_KEY_PREFIX + id);
}

/** Cost to go from the current level to current+1, per GAME-DESIGN.md's
 * `cost = base * (current_level + 1)^1.5`. Returns null once maxed. */
export function upgradeCost(id: UpgradeId): number | null {
  const def = UPGRADES.find((u) => u.id === id);
  if (!def) return null;
  const level = getUpgradeLevel(id);
  if (level >= def.maxLevel) return null;
  return Math.ceil(def.baseCost * Math.pow(level + 1, 1.5));
}

/** Spends coins to buy the next level of an upgrade, if affordable and not
 * maxed. Returns true on a successful purchase. */
export function purchaseUpgrade(id: UpgradeId): boolean {
  const cost = upgradeCost(id);
  if (cost === null) return false;
  const balance = getCoinBalance();
  if (balance < cost) return false;
  pStorage.setItem(COIN_BALANCE_KEY, String(balance - cost));
  pStorage.setItem(UPGRADE_KEY_PREFIX + id, String(getUpgradeLevel(id) + 1));
  document.dispatchEvent(new CustomEvent("game:coins-changed"));
  document.dispatchEvent(new CustomEvent("game:upgrades-changed"));
  return true;
}

/** Sum of every owned upgrade level — drives enemy-tier weighting and boss
 * scaling in engine.ts, per GAME-DESIGN.md "Enemy tiers." */
export function computePowerIndex(): number {
  return UPGRADES.reduce((sum, u) => sum + getUpgradeLevel(u.id), 0);
}

/** Aggregates owned upgrade levels into the multipliers engine.ts applies
 * for the duration of one run. */
export function getUpgradeEffects(): UpgradeEffects {
  return {
    maxHpMult: 1 + 0.1 * getUpgradeLevel("vigor"),
    speedMult: 1 + 0.05 * getUpgradeLevel("fleetness"),
    damageMult: 1 + 0.05 * getUpgradeLevel("might"),
    pickupRadiusMult: 1 + 0.15 * getUpgradeLevel("magnetism"),
    coinMult: 1 + 0.1 * getUpgradeLevel("greed"),
    xpMult: 1 + 0.05 * getUpgradeLevel("amanuensis"),
    regenPerS: 0.3 * getUpgradeLevel("recovery"),
  };
}
