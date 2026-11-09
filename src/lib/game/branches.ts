// Upgrade branches. A flat "+5% per level" upgrade is predictable, so the
// strongest six fork: reaching level 3 asks the player to pick one of two
// paths, and from then on every level feeds that path's own behaviour instead
// of only a bigger number. Level 6 is the path's capstone. Pure data and
// rules; the chosen branch is stored in shop.ts and engine.ts reads the
// aggregated effects.
import type { RelicEffects } from "./relics";

/** The upgrade level at which a path must be chosen. */
export const BRANCH_LEVEL = 3;
/** The level at which a path's capstone switches on. */
export const CAPSTONE_LEVEL = 6;
/** Coins to change a path already chosen (the first choice is free). */
export const BRANCH_SWITCH_COST = 80;

export type BranchedUpgradeId =
  "might" | "vigor" | "fleetness" | "magnetism" | "greed" | "bulwark";

export interface BranchDef {
  id: string;
  label: string;
  /** What the path does, in the player's words. */
  blurb: string;
  /** What level 6 adds. */
  capstone: string;
  /** Adds the path's effects. `steps` is 1 at the branch level, 2 one level
   * later, and so on; the capstone applies from `steps` 4. */
  apply: (fx: RelicEffects, steps: number) => void;
}

/** Diminishing returns: starts as `perStep` per step and bends toward `cap`,
 * so the first steps feel the same and the hundredth cannot break the game. */
export function soft(steps: number, perStep: number, cap: number): number {
  return cap * (1 - Math.exp((-perStep * steps) / cap));
}

const capstoneSteps = CAPSTONE_LEVEL - BRANCH_LEVEL + 1;

export const BRANCHES: Record<BranchedUpgradeId, [BranchDef, BranchDef]> = {
  might: [
    {
      id: "berserker",
      label: "Berserker",
      blurb:
        "The lower your HP, the harder you hit. Every level raises the bonus you get at the brink.",
      capstone: "Bigger bonus, and every kill heals a little.",
      apply(fx, steps) {
        fx.berserk += Math.min(0.9, 0.12 * steps);
        if (steps >= capstoneSteps) {
          fx.berserk += 0.3;
          fx.killHeal += 0.3;
        }
      },
    },
    {
      id: "duelist",
      label: "Duelist",
      blurb:
        "Fewer, heavier hits: more crits, and a crit lands for x2.5 instead of x2.",
      capstone: "Crits land for x3.5.",
      apply(fx, steps) {
        fx.critChance += soft(steps, 0.06, 0.5);
        fx.critDamage += steps >= capstoneSteps ? 1.5 : 0.5;
      },
    },
  ],
  vigor: [
    {
      id: "juggernaut",
      label: "Juggernaut",
      blurb: "Become a wall: much more max HP and a little armor.",
      capstone: "Regenerates HP on top.",
      apply(fx, steps) {
        fx.maxHpMult += 0.08 * steps;
        fx.armor += soft(steps, 0.02, 0.2);
        if (steps >= capstoneSteps) fx.regenPerS += 1;
      },
    },
    {
      id: "phoenix",
      label: "Phoenix",
      blurb:
        "Once a run, a killing blow brings you back with part of your HP. Every level brings you back with more.",
      capstone: "Also heals when you drop under 30% HP.",
      apply(fx, steps) {
        fx.reviveHpFrac = Math.max(
          fx.reviveHpFrac,
          Math.min(0.6, 0.3 + 0.05 * steps),
        );
        if (steps >= capstoneSteps) fx.panicHeal += 0.15;
      },
    },
  ],
  fleetness: [
    {
      id: "phantom",
      label: "Phantom",
      blurb: "A growing chance to slip past a hit entirely.",
      capstone: "Also a lasting burst of speed.",
      apply(fx, steps) {
        fx.dodge += soft(steps, 0.04, 0.4);
        if (steps >= capstoneSteps) fx.speedMult += 0.1;
      },
    },
    {
      id: "gale",
      label: "Gale",
      blurb: "Move faster and let your weapons recharge faster with it.",
      capstone: "Enemies also move a little slower.",
      apply(fx, steps) {
        fx.speedMult += soft(steps, 0.06, 0.6);
        fx.haste += soft(steps, 0.03, 0.5);
        if (steps >= capstoneSteps) fx.enemySlow += 0.05;
      },
    },
  ],
  magnetism: [
    {
      id: "vortex",
      label: "Vortex",
      blurb:
        "Every so often every gem and coin on the field flies to you. Each level shortens the wait.",
      capstone: "A wider everyday pickup radius too.",
      apply(fx, steps) {
        fx.gemBurstEveryS = Math.max(10, 26 - 3 * steps);
        if (steps >= capstoneSteps) fx.pickupRadiusMult += 0.5;
      },
    },
    {
      id: "scholar",
      label: "Scholar",
      blurb: "Gems are worth more, and you pick them up from further away.",
      capstone: "Gems are worth even more.",
      apply(fx, steps) {
        fx.xpMult += 0.07 * steps;
        fx.pickupRadiusMult += soft(steps, 0.1, 1);
        if (steps >= capstoneSteps) fx.xpMult += 0.15;
      },
    },
  ],
  greed: [
    {
      id: "bounty",
      label: "Bounty hunter",
      blurb:
        "Tougher enemies and bosses drop far more coins. Plain enemies pay as usual.",
      capstone: "All coins are worth more too.",
      apply(fx, steps) {
        fx.bounty += 0.5 * steps;
        if (steps >= capstoneSteps) fx.coinMult += 0.2;
      },
    },
    {
      id: "gambler",
      label: "Gambler",
      blurb:
        "Any coin you pick up can pay triple. Each level improves the odds.",
      capstone: "Better odds again.",
      apply(fx, steps) {
        fx.coinLuck += Math.min(
          0.6,
          0.06 * steps + (steps >= capstoneSteps ? 0.1 : 0),
        );
      },
    },
  ],
  bulwark: [
    {
      id: "ironclad",
      label: "Ironclad",
      blurb:
        "No single hit can take more than a slice of your max HP. Each level lowers the slice.",
      capstone: "A thinner slice, and a trickle of regeneration.",
      apply(fx, steps) {
        const extra = steps >= capstoneSteps ? 0.03 : 0;
        fx.hitCap = Math.max(0.1, 0.3 - 0.03 * steps - extra);
        if (steps >= capstoneSteps) fx.regenPerS += 0.5;
      },
    },
    {
      id: "laststand",
      label: "Last stand",
      blurb:
        "When your HP first drops under 30% you heal a chunk of it, once every 25 seconds.",
      capstone: "Also takes less damage all the time.",
      apply(fx, steps) {
        fx.panicHeal += Math.min(0.5, 0.15 + 0.05 * steps);
        if (steps >= capstoneSteps) fx.armor += 0.05;
      },
    },
  ],
};

export function branchesFor(id: string): [BranchDef, BranchDef] | null {
  return (BRANCHES as Record<string, [BranchDef, BranchDef]>)[id] ?? null;
}

/** Adds the chosen path's effects at an upgrade `level`; below the branch
 * level, or with an unknown path, it adds nothing. */
export function applyBranch(
  fx: RelicEffects,
  upgradeId: string,
  branchId: string | null,
  level: number,
): void {
  if (!branchId || level < BRANCH_LEVEL) return;
  const def = branchesFor(upgradeId)?.find((b) => b.id === branchId);
  if (!def) return;
  def.apply(fx, level - BRANCH_LEVEL + 1);
}
