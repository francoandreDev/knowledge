// Phase 5 — coin balance + permanent shop upgrades (see docs/GAME-DESIGN.md
// "Coins and the shop"). Kept in the same profile-namespaced `pStorage` that
// tokens.ts already uses, not the design doc's originally-specced IndexedDB
// (`idb`) wrapper — see the "Implementation note (Phase 5)" this file's
// header points to in GAME-DESIGN.md for why that migration was skipped.
import { pStorage } from "../profile";
import { SHOP_RECOVERY_HPS_PER_LEVEL } from "./balance";
import {
  RELICS,
  RELIC_MAX_LEVEL,
  noEffects,
  relicEffects,
  type RelicEffects,
} from "./relics";

const COIN_BALANCE_KEY = "game:coins";
const UPGRADE_KEY_PREFIX = "game:upgrade:";

export type UpgradeId =
  | "vigor"
  | "fleetness"
  | "might"
  | "magnetism"
  | "greed"
  | "amanuensis"
  | "recovery"
  | "bulwark"
  | "haste"
  | "precision"
  | "siphon";

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
// Recovery's regen comes from balance.ts, which sizes it so a full recovery
// build is felt against typical incoming damage without cancelling it.
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
    effectLabel: `+${SHOP_RECOVERY_HPS_PER_LEVEL} HP/s passive regen`,
    maxLevel: 3,
    baseCost: 30,
  },
  {
    id: "bulwark",
    label: "Bulwark",
    effectLabel: "Ignore 3% of damage taken",
    maxLevel: 5,
    baseCost: 25,
  },
  {
    id: "haste",
    label: "Haste",
    effectLabel: "+4% weapon speed",
    maxLevel: 5,
    baseCost: 25,
  },
  {
    id: "precision",
    label: "Precision",
    effectLabel: "+3% chance of a double-damage hit",
    maxLevel: 5,
    baseCost: 25,
  },
  {
    id: "siphon",
    label: "Siphon",
    effectLabel: "Heal 0.1 HP per kill",
    maxLevel: 5,
    baseCost: 25,
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

export type UpgradeEffects = RelicEffects;

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

const RELIC_KEY_PREFIX = "game:relic:";

/** Owned relic levels, 1-5 each (relics come from chests, see meta.ts). */
export function getRelicLevels(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of RELICS) {
    const l = readIntKey(RELIC_KEY_PREFIX + r.id);
    if (l > 0) out[r.id] = Math.min(RELIC_MAX_LEVEL, l);
  }
  return out;
}

export function setRelicLevel(id: string, level: number): void {
  pStorage.setItem(RELIC_KEY_PREFIX + id, String(level));
}

/** Aggregates owned shop upgrade levels and relics into the numbers
 * engine.ts applies for the duration of one run. */
export function getUpgradeEffects(): UpgradeEffects {
  const fx = noEffects();
  fx.maxHpMult += 0.1 * getUpgradeLevel("vigor");
  fx.speedMult += 0.05 * getUpgradeLevel("fleetness");
  fx.damageMult += 0.05 * getUpgradeLevel("might");
  fx.pickupRadiusMult += 0.15 * getUpgradeLevel("magnetism");
  fx.coinMult += 0.1 * getUpgradeLevel("greed");
  fx.xpMult += 0.05 * getUpgradeLevel("amanuensis");
  fx.regenPerS += SHOP_RECOVERY_HPS_PER_LEVEL * getUpgradeLevel("recovery");
  fx.armor += 0.03 * getUpgradeLevel("bulwark");
  fx.haste += 0.04 * getUpgradeLevel("haste");
  fx.critChance += 0.03 * getUpgradeLevel("precision");
  fx.killHeal += 0.1 * getUpgradeLevel("siphon");
  // Relics stack additively on top of the shop's levels.
  const rel = relicEffects(getRelicLevels());
  fx.maxHpMult += rel.maxHpMult - 1;
  fx.speedMult += rel.speedMult - 1;
  fx.damageMult += rel.damageMult - 1;
  fx.pickupRadiusMult += rel.pickupRadiusMult - 1;
  fx.coinMult += rel.coinMult - 1;
  fx.xpMult += rel.xpMult - 1;
  fx.regenPerS += rel.regenPerS;
  fx.armor += rel.armor;
  fx.haste += rel.haste;
  fx.critChance += rel.critChance;
  fx.killHeal += rel.killHeal;
  fx.thorns += rel.thorns;
  fx.enemySlow += rel.enemySlow;
  fx.reviveHpFrac = rel.reviveHpFrac;
  return fx;
}
