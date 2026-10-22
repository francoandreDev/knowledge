// Fits DUEL_DAMAGE_SCALE so every weapon averages ~50% across all pairings
// and levels. Prints the table to paste into duel.ts.
import { DUEL_DAMAGE_SCALE, simulateMatch } from "../src/lib/game/duel";
import type { WeaponId } from "../src/lib/game/engine";

const W = Object.keys(DUEL_DAMAGE_SCALE) as WeaponId[];
const LEVELS = [1, 3, 6];
const MATCHES = Number(process.argv[2] ?? 10);
const ITERS = Number(process.argv[3] ?? 8);
const seeded = (seed: number) => {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
};

function averages(): Record<string, number> {
  const sum: Record<string, number> = Object.fromEntries(W.map((w) => [w, 0]));
  let count = 0;
  for (const level of LEVELS) {
    for (const row of W) {
      for (const col of W) {
        if (row === col) continue;
        let score = 0;
        for (let i = 0; i < MATCHES; i++) {
          const rowFirst = i % 2 === 0;
          const r = simulateMatch(
            { weaponId: rowFirst ? row : col, level },
            { weaponId: rowFirst ? col : row, level },
            "hard",
            seeded(500 + i * 53 + level),
            60_000,
          );
          score +=
            r.winner === null ? 0.5 : (r.winner === 0) === rowFirst ? 1 : 0;
        }
        sum[row] += score / MATCHES;
      }
    }
    count++;
  }
  const per = count * (W.length - 1);
  return Object.fromEntries(W.map((w) => [w, (100 * sum[w]) / per]));
}

for (let it = 0; it < ITERS; it++) {
  const avg = averages();
  console.log(
    `iter ${it}: ` +
      W.map(
        (w) =>
          `${w.slice(0, 5)} ${avg[w].toFixed(0)}% x${DUEL_DAMAGE_SCALE[w].toFixed(2)}`,
      ).join("  "),
  );
  for (const w of W) {
    DUEL_DAMAGE_SCALE[w] = Math.min(
      4,
      Math.max(0.2, DUEL_DAMAGE_SCALE[w] * (50 / Math.max(avg[w], 5)) ** 0.4),
    );
  }
}
console.log(
  "FIT",
  JSON.stringify(
    Object.fromEntries(
      W.map((w) => [w, Number(DUEL_DAMAGE_SCALE[w].toFixed(2))]),
    ),
  ),
);
