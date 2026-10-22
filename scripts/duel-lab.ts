// Duel balance: AI vs AI across every weapon pairing. Reads as "row beats
// column in N% of matches" (sides alternate so spawn side cancels out).
//
//   bun scripts/duel-lab.ts [level] [matches]
import { simulateMatch } from "../src/lib/game/duel";
import type { WeaponId } from "../src/lib/game/engine";

const WEAPONS: WeaponId[] = [
  "bolt",
  "homingDart",
  "chainLightning",
  "novaPulse",
  "orbitShield",
  "bladeArc",
];
const level = Number(process.argv[2] ?? 3);
const matches = Number(process.argv[3] ?? 24);

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

function winRate(row: WeaponId, col: WeaponId) {
  let wins = 0;
  let draws = 0;
  let timeMs = 0;
  for (let i = 0; i < matches; i++) {
    const rng = seeded(1000 + i * 37);
    const rowFirst = i % 2 === 0;
    const r = simulateMatch(
      { weaponId: rowFirst ? row : col, level },
      { weaponId: rowFirst ? col : row, level },
      "hard",
      rng,
    );
    timeMs += r.timeMs;
    if (r.winner === null) draws++;
    else if ((r.winner === 0) === rowFirst) wins++;
  }
  return {
    pct: (100 * (wins + draws / 2)) / matches,
    timeS: timeMs / matches / 1000,
  };
}

console.log(
  `Duel win rate of ROW vs COLUMN, level ${level}, ${matches} matches, hard AI`,
);
console.log(
  "".padEnd(16) +
    WEAPONS.map((w) => w.slice(0, 7).padStart(9)).join("") +
    "     avg",
);
for (const row of WEAPONS) {
  let line = row.padEnd(16);
  let sum = 0;
  let t = 0;
  for (const col of WEAPONS) {
    const r = winRate(row, col);
    sum += r.pct;
    t += r.timeS;
    line += `${r.pct.toFixed(0)}%`.padStart(9);
  }
  console.log(
    line +
      `${(sum / WEAPONS.length).toFixed(0)}%`.padStart(8) +
      `  ${(t / WEAPONS.length).toFixed(0)}s`,
  );
}
