// Mutations: run-long twists offered as level-up cards once the first few
// picks are made. A weapon upgrade or a stat card is predictable: you know
// what level 7 gives you. A mutation changes how the run plays, some of them
// at a price, and which ones show up is luck, so two runs stop looking alike.
// Every fifth level-up is a crossroads: three mutations, none of them common.
// Pure data and rules; engine.ts applies the effects.

export type MutationRarity = "common" | "rare" | "legendary";

export type MutationId =
  | "glassCannon"
  | "momentum"
  | "coldSnap"
  | "bastion"
  | "volatile"
  | "echo"
  | "adrenaline"
  | "demolitionist"
  | "devilsBargain"
  | "timeWarp"
  | "titan";

export interface MutationDef {
  id: MutationId;
  name: string;
  rarity: MutationRarity;
  /** What it does, in the player's words. */
  blurb: string;
  /** What it costs, when it costs something. */
  drawback?: string;
}

export const MUTATIONS: MutationDef[] = [
  {
    id: "glassCannon",
    name: "Glass cannon",
    rarity: "common",
    blurb: "Everything you throw hits 45% harder.",
    drawback: "You lose 25% of your max HP.",
  },
  {
    id: "momentum",
    name: "Momentum",
    rarity: "common",
    blurb:
      "Each kill within 3 seconds of the last adds 4% attack speed, up to 40%. Go quiet and it drains away.",
  },
  {
    id: "coldSnap",
    name: "Cold snap",
    rarity: "common",
    blurb: "Every 18 seconds a wave of frost freezes the enemies near you.",
  },
  {
    id: "bastion",
    name: "Bastion",
    rarity: "common",
    blurb:
      "Standing still, you take 30% less damage and your weapons fire 15% faster.",
    drawback: "You move 10% slower.",
  },
  {
    id: "volatile",
    name: "Volatile",
    rarity: "rare",
    blurb:
      "Enemies you kill explode, hurting the ones around them. Chains build on themselves.",
  },
  {
    id: "echo",
    name: "Echo",
    rarity: "rare",
    blurb: "12% of weapon hits strike a second time, a moment later.",
  },
  {
    id: "adrenaline",
    name: "Adrenaline",
    rarity: "rare",
    blurb: "Under 40% HP you move 25% faster and your weapons fire 30% faster.",
  },
  {
    id: "demolitionist",
    name: "Demolitionist",
    rarity: "rare",
    blurb:
      "Mines, barrels and spikes hit enemies twice as hard, and never hurt you.",
  },
  {
    id: "devilsBargain",
    name: "Devil's bargain",
    rarity: "legendary",
    blurb: "Gems are worth double XP.",
    drawback: "Enemies move 15% faster.",
  },
  {
    id: "timeWarp",
    name: "Time warp",
    rarity: "legendary",
    blurb: "Every 30 seconds time crawls for enemies for 4 seconds.",
  },
  {
    id: "titan",
    name: "Titan",
    rarity: "legendary",
    blurb: "50% more max HP and 25% more damage.",
    drawback: "You move 20% slower.",
  },
];

export const RARITY_WEIGHT: Record<MutationRarity, number> = {
  common: 60,
  rare: 30,
  legendary: 10,
};

export const RARITY_COLOR: Record<MutationRarity, string> = {
  common: "#7dd3fc",
  rare: "#c084fc",
  legendary: "#fcd34d",
};

export const RARITY_ORDER: Record<MutationRarity, number> = {
  common: 0,
  rare: 1,
  legendary: 2,
};

/** The level-up from which a mutation card is added to the usual four. */
export const MUTATION_FIRST_LEVELUP = 4;
/** Every this many level-ups the choice is a crossroads. */
export const CROSSROADS_EVERY = 5;

export function mutationById(id: string): MutationDef | undefined {
  return MUTATIONS.find((m) => m.id === id);
}

/** Level-up number `n` (1 for the first) is a crossroads. */
export function isCrossroads(n: number): boolean {
  return n >= CROSSROADS_EVERY && n % CROSSROADS_EVERY === 0;
}

/** `count` distinct mutations the player does not have yet, weighted by
 * rarity. With `minRarity`, only that rarity or better; if that leaves too
 * few, the shortfall is filled from the rest so a crossroads is never empty
 * while mutations remain. */
export function drawMutations(
  owned: readonly string[],
  count: number,
  rng: () => number = Math.random,
  minRarity: MutationRarity = "common",
): MutationDef[] {
  const free = MUTATIONS.filter((m) => !owned.includes(m.id));
  const good = free.filter(
    (m) => RARITY_ORDER[m.rarity] >= RARITY_ORDER[minRarity],
  );
  const out: MutationDef[] = [];
  const take = (from: MutationDef[]) => {
    const rest = [...from];
    while (out.length < count && rest.length > 0) {
      const weights = rest.map((m) => RARITY_WEIGHT[m.rarity]);
      let r = rng() * weights.reduce((a, b) => a + b, 0);
      let i = 0;
      for (; i < rest.length - 1; i++) {
        r -= weights[i];
        if (r <= 0) break;
      }
      out.push(rest.splice(i, 1)[0]);
    }
  };
  take(good);
  take(free.filter((m) => !out.includes(m)));
  return out;
}
