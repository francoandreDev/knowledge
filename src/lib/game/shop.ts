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

// Phase 15 — one-time "unlock" purchases, distinct from the leveled
// UPGRADES above: these aren't a 1-N stat multiplier, they're a binary
// owned/not-owned gate on content that doesn't exist for a player at all
// until bought. Chain Lightning is a locked 6th weapon (engine.ts's
// `WeaponId`) that only appears in a run's level-up "new weapon" offers
// once purchased; Necromancy is a locked run-time ability that, once
// purchased, can appear as a one-time level-up card whose pick swaps the
// run's boss from the Reaper to the Lich (different stats/attack pattern —
// see engine.ts's `spawnBoss()`/`bossVariant`).
export type UnlockId = "chainLightning" | "necromancy";

export interface UnlockDef {
  id: UnlockId;
  label: string;
  effectLabel: string;
  cost: number;
}

export const UNLOCKS: UnlockDef[] = [
  {
    id: "chainLightning",
    label: "Chain Lightning",
    effectLabel: "Unlocks a 6th weapon — arcs between nearby enemies",
    cost: 200,
  },
  {
    id: "necromancy",
    label: "Necromancy",
    effectLabel:
      "Unlocks a run-time ability — summons the Lich instead of the Reaper",
    cost: 350,
  },
];

const UNLOCK_KEY_PREFIX = "game:unlock:";

export function isUnlocked(id: UnlockId): boolean {
  return pStorage.getItem(UNLOCK_KEY_PREFIX + id) === "1";
}

/** Spends coins to permanently unlock a one-time item. Returns true on a
 * successful purchase (false if already owned or unaffordable). */
export function purchaseUnlock(id: UnlockId): boolean {
  if (isUnlocked(id)) return false;
  const def = UNLOCKS.find((u) => u.id === id);
  if (!def) return false;
  const balance = getCoinBalance();
  if (balance < def.cost) return false;
  pStorage.setItem(COIN_BALANCE_KEY, String(balance - def.cost));
  pStorage.setItem(UNLOCK_KEY_PREFIX + id, "1");
  document.dispatchEvent(new CustomEvent("game:coins-changed"));
  document.dispatchEvent(new CustomEvent("game:upgrades-changed"));
  return true;
}

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
