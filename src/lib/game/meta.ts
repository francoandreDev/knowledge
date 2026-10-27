// Stored meta-progress that sits beside the coin shop: the daily free run,
// unopened chests and the relic collection. Same profile-namespaced pStorage
// as tokens.ts and shop.ts.
import { pStorage } from "../profile";
import { dayKey, isDailyAvailable } from "./daily";
import { rollChest, type ChestLoot, type ChestTier } from "./relics";
import { addCoins, getRelicLevels, setRelicLevel } from "./shop";

const DAILY_KEY = "game:dailyFreeDay";
const CHEST_KEY_PREFIX = "game:chest:";

function readInt(key: string): number {
  const n = parseInt(pStorage.getItem(key) ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// --- Daily free run -------------------------------------------------------

export function dailyFreeAvailable(now: Date = new Date()): boolean {
  return isDailyAvailable(pStorage.getItem(DAILY_KEY), now);
}

/** Spends today's free run. False when it was already used. */
export function consumeDailyFree(now: Date = new Date()): boolean {
  if (!dailyFreeAvailable(now)) return false;
  pStorage.setItem(DAILY_KEY, dayKey(now));
  document.dispatchEvent(new CustomEvent("game:tokens-changed"));
  return true;
}

// --- Chests ---------------------------------------------------------------

export function getChestCount(tier: ChestTier): number {
  return readInt(CHEST_KEY_PREFIX + tier);
}

export function grantChest(tier: ChestTier): void {
  pStorage.setItem(CHEST_KEY_PREFIX + tier, String(getChestCount(tier) + 1));
  document.dispatchEvent(new CustomEvent("game:chests-changed"));
}

// --- Relic collection -----------------------------------------------------

/** Opens one chest of `tier`: removes it, stores what it held, pays its coins.
 * Returns null when there is none to open. */
export function openChest(tier: ChestTier): ChestLoot | null {
  const have = getChestCount(tier);
  if (have < 1) return null;
  const loot = rollChest(tier, getRelicLevels());
  pStorage.setItem(CHEST_KEY_PREFIX + tier, String(have - 1));
  for (const f of loot.finds) {
    if (!f.converted) setRelicLevel(f.relicId, f.level);
  }
  addCoins(loot.coins);
  document.dispatchEvent(new CustomEvent("game:chests-changed"));
  document.dispatchEvent(new CustomEvent("game:upgrades-changed"));
  return loot;
}
