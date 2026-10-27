// Relics: permanent finds from chests. Each one has up to five levels (every
// duplicate is a level), every owned relic is always active, and together
// they widen what a build can be beyond the coin shop. Pure data and rules —
// the stored levels live in meta.ts, and engine.ts only ever sees the
// aggregated effects.

export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 60,
  rare: 28,
  epic: 9,
  legendary: 3,
};

/** Coins a duplicate of a maxed relic turns into. */
export const RARITY_COINS: Record<Rarity, number> = {
  common: 15,
  rare: 40,
  epic: 90,
  legendary: 200,
};

export const RELIC_MAX_LEVEL = 5;

/** What the engine reads, shop upgrades and relics folded together. */
export interface RelicEffects {
  maxHpMult: number;
  speedMult: number;
  damageMult: number;
  pickupRadiusMult: number;
  coinMult: number;
  xpMult: number;
  regenPerS: number;
  /** Fraction of incoming damage ignored. */
  armor: number;
  /** Weapons recharge this much faster (0.1 = 10%). */
  haste: number;
  /** Chance a weapon hit lands double damage. */
  critChance: number;
  /** HP restored per kill. */
  killHeal: number;
  /** Fraction of contact damage reflected at the attacker. */
  thorns: number;
  /** Enemies move this much slower. */
  enemySlow: number;
  /** HP fraction restored by a once-per-run revive; 0 means none. */
  reviveHpFrac: number;
}

export function noEffects(): RelicEffects {
  return {
    maxHpMult: 1,
    speedMult: 1,
    damageMult: 1,
    pickupRadiusMult: 1,
    coinMult: 1,
    xpMult: 1,
    regenPerS: 0,
    armor: 0,
    haste: 0,
    critChance: 0,
    killHeal: 0,
    thorns: 0,
    enemySlow: 0,
    reviveHpFrac: 0,
  };
}

export interface RelicDef {
  id: string;
  name: string;
  rarity: Rarity;
  /** Per-level effect, as shown on the card. */
  blurb: string;
  /** Applies `level` levels of this relic onto the running effects. */
  apply: (fx: RelicEffects, level: number) => void;
}

export const RELICS: RelicDef[] = [
  {
    id: "giantsHeart",
    name: "Giant's Heart",
    rarity: "common",
    blurb: "+6% max HP per level",
    apply: (fx, l) => (fx.maxHpMult += 0.06 * l),
  },
  {
    id: "windBoots",
    name: "Wind Boots",
    rarity: "common",
    blurb: "+3% move speed per level",
    apply: (fx, l) => (fx.speedMult += 0.03 * l),
  },
  {
    id: "whetstone",
    name: "Whetstone",
    rarity: "common",
    blurb: "+4% damage per level",
    apply: (fx, l) => (fx.damageMult += 0.04 * l),
  },
  {
    id: "lodestone",
    name: "Lodestone",
    rarity: "common",
    blurb: "+10% pickup radius per level",
    apply: (fx, l) => (fx.pickupRadiusMult += 0.1 * l),
  },
  {
    id: "luckyCoin",
    name: "Lucky Coin",
    rarity: "common",
    blurb: "+8% coins per level",
    apply: (fx, l) => (fx.coinMult += 0.08 * l),
  },
  {
    id: "scholarsQuill",
    name: "Scholar's Quill",
    rarity: "common",
    blurb: "+4% XP per level",
    apply: (fx, l) => (fx.xpMult += 0.04 * l),
  },
  {
    id: "ironPlate",
    name: "Iron Plate",
    rarity: "rare",
    blurb: "Ignore 2.5% of damage taken per level",
    apply: (fx, l) => (fx.armor += 0.025 * l),
  },
  {
    id: "hourglass",
    name: "Hourglass",
    rarity: "rare",
    blurb: "Weapons recharge 4% faster per level",
    apply: (fx, l) => (fx.haste += 0.04 * l),
  },
  {
    id: "eagleEye",
    name: "Eagle Eye",
    rarity: "rare",
    blurb: "+3% chance to land a double-damage hit per level",
    apply: (fx, l) => (fx.critChance += 0.03 * l),
  },
  {
    id: "leechFang",
    name: "Leech Fang",
    rarity: "rare",
    blurb: "Heal 0.15 HP per kill per level",
    apply: (fx, l) => (fx.killHeal += 0.15 * l),
  },
  {
    id: "thornRing",
    name: "Thorn Ring",
    rarity: "rare",
    blurb: "Reflect 12% of contact damage per level",
    apply: (fx, l) => (fx.thorns += 0.12 * l),
  },
  {
    id: "emberHeart",
    name: "Ember Heart",
    rarity: "epic",
    blurb: "+0.25 HP/s regeneration per level",
    apply: (fx, l) => (fx.regenPerS += 0.25 * l),
  },
  {
    id: "frostCharm",
    name: "Frost Charm",
    rarity: "epic",
    blurb: "Enemies move 3% slower per level",
    apply: (fx, l) => (fx.enemySlow += 0.03 * l),
  },
  {
    id: "phoenixFeather",
    name: "Phoenix Feather",
    rarity: "legendary",
    blurb: "Once a run, rise again with 30% HP (+10% per level)",
    apply: (fx, l) =>
      (fx.reviveHpFrac = Math.max(fx.reviveHpFrac, 0.2 + 0.1 * l)),
  },
  {
    id: "crownOfAges",
    name: "Crown of Ages",
    rarity: "legendary",
    blurb: "+4% damage, HP, XP and coins per level",
    apply: (fx, l) => {
      fx.damageMult += 0.04 * l;
      fx.maxHpMult += 0.04 * l;
      fx.xpMult += 0.04 * l;
      fx.coinMult += 0.04 * l;
    },
  },
];

export function relicById(id: string): RelicDef | undefined {
  return RELICS.find((r) => r.id === id);
}

/** Folds every owned relic level into one effects object. */
export function relicEffects(levels: Record<string, number>): RelicEffects {
  const fx = noEffects();
  for (const r of RELICS) {
    const l = Math.min(RELIC_MAX_LEVEL, levels[r.id] ?? 0);
    if (l > 0) r.apply(fx, l);
  }
  return fx;
}

// --- Chests ---------------------------------------------------------------

export type ChestTier = "wooden" | "golden";

export interface ChestFind {
  relicId: string;
  /** Level after this find. */
  level: number;
  /** First copy of this relic. */
  isNew: boolean;
  /** Already maxed, so it paid out coins instead. */
  converted: boolean;
}

export interface ChestLoot {
  coins: number;
  finds: ChestFind[];
}

const CHEST_RULES: Record<
  ChestTier,
  { rolls: number; coinsMin: number; coinsMax: number; rareBoost: number }
> = {
  wooden: { rolls: 1, coinsMin: 20, coinsMax: 50, rareBoost: 1 },
  golden: { rolls: 2, coinsMin: 60, coinsMax: 120, rareBoost: 1.8 },
};

/** One weighted draw. `rareBoost` lifts every rarity above common. */
export function pickRelic(rng: () => number, rareBoost = 1): RelicDef {
  const weights = RELICS.map(
    (r) => RARITY_WEIGHT[r.rarity] * (r.rarity === "common" ? 1 : rareBoost),
  );
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < RELICS.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return RELICS[i];
  }
  return RELICS[RELICS.length - 1];
}

/** Rolls a chest against the player's current relic levels. Pure: the caller
 * stores the result. */
export function rollChest(
  tier: ChestTier,
  levels: Record<string, number>,
  rng: () => number = Math.random,
): ChestLoot {
  const rules = CHEST_RULES[tier];
  const working = { ...levels };
  let coins =
    rules.coinsMin + Math.floor(rng() * (rules.coinsMax - rules.coinsMin + 1));
  const finds: ChestFind[] = [];
  for (let i = 0; i < rules.rolls; i++) {
    const relic = pickRelic(rng, rules.rareBoost);
    const have = working[relic.id] ?? 0;
    if (have >= RELIC_MAX_LEVEL) {
      coins += RARITY_COINS[relic.rarity];
      finds.push({
        relicId: relic.id,
        level: have,
        isNew: false,
        converted: true,
      });
      continue;
    }
    working[relic.id] = have + 1;
    finds.push({
      relicId: relic.id,
      level: have + 1,
      isNew: have === 0,
      converted: false,
    });
  }
  return { coins, finds };
}
