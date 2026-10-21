// Runs the real game engine headless and measures each weapon: kills and HP
// lost over a run, for a player who stands still and for one who circles.
// Kills measure how much a weapon earns; HP lost per kill measures what its
// exposure costs — together they are what balance.ts is checked against.
//
//   bun run balance:lab [seconds]      (default 60)
//
// The engine runs unmodified: kontra's loop is replaced so the script drives
// update() itself, and canvas/DOM are stubbed (nothing here renders).
import { mock } from "bun:test";
import type { WeaponId } from "../src/lib/game/engine";
import { CALIBRATION, exposure } from "../src/lib/game/balance";

// The bare name resolves to kontra's UMD build, which has no named exports.
const kontraEsm = "../node_modules/kontra/kontra.mjs";
const realKontra = (await import(kontraEsm)) as Record<string, unknown>;
let loopOptions: { update: (dt: number) => void } | null = null;
const bot = { x: 0, y: 0 };
let mode: "stand" | "circle" = "stand";

mock.module("kontra", () => ({
  ...realKontra,
  keyPressed: (keys: string[]) => {
    const k = keys.join(",");
    if (k.includes("left")) return bot.x < -0.3;
    if (k.includes("right")) return bot.x > 0.3;
    if (k.includes("up")) return bot.y < -0.3;
    if (k.includes("down")) return bot.y > 0.3;
    return false;
  },
  GameLoop: (o: { update: (dt: number) => void }) => {
    loopOptions = o;
    return { start() {}, stop() {} };
  },
}));

const store = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
  document: {
    addEventListener() {},
    removeEventListener() {},
    getElementById: () => null,
    querySelector: () => null,
  },
  addEventListener() {},
  window: globalThis,
});

const { startGame } = await import("../src/lib/game/engine");

const stubContext = new Proxy(
  {},
  { get: () => () => {}, set: () => true },
) as CanvasRenderingContext2D;

function run(
  weaponId: WeaponId,
  level: number,
  seconds: number,
  seed: number,
  spawnRateMult: number,
) {
  let s = seed;
  Math.random = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const canvas = {
    width: 420,
    height: 500,
    style: {},
    getContext: () => stubContext,
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 420, height: 500 }),
  } as unknown as HTMLCanvasElement;
  let kills = 0;
  let taken = 0;
  let prevHp = -1;
  let ended = false;
  let elapsedS = 0;
  const game = startGame(
    canvas,
    {
      onHudUpdate: (st) => {
        if (prevHp >= 0 && st.hp < prevHp) taken += prevHp - st.hp;
        prevHp = st.hp;
        kills = st.weapons[0].kills;
        elapsedS = st.elapsedS;
      },
      onGameOver: () => {
        ended = true;
      },
      // Keep the weapon under test fixed: take a stat card, never a weapon.
      onLevelUp: (cards, choose) => {
        choose((cards.find((c) => c.kind === "stat") ?? cards[0]).id);
      },
    },
    {
      durationS: seconds + 5,
      startingWeapon: { id: weaponId, level },
      spawnRateMult,
    },
  );
  for (let i = 0; i < seconds * 60 && !ended; i++) {
    const a = (i / 60) * 1.3;
    bot.x = mode === "circle" ? Math.cos(a) : 0;
    bot.y = mode === "circle" ? Math.sin(a) : 0;
    loopOptions!.update(1 / 60);
  }
  game.stop();
  return { kills, taken, survived: ended ? elapsedS : seconds };
}

const weapons: WeaponId[] = [
  "bolt",
  "homingDart",
  "chainLightning",
  "novaPulse",
  "orbitShield",
  "bladeArc",
];
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string, fallback: number) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const seconds = Number(args.find((a) => /^\d+$/.test(a)) ?? 60);
const dense = flag("dense") || flag("fit");
const spawnRateMult = dense ? option("spawn", 3) : 1;
const seeds = [3, 11, 29, 57, 101].slice(0, option("seeds", 5));

function measure(id: WeaponId, level: number, m: typeof mode) {
  mode = m;
  const rs = seeds.map((sd) => run(id, level, seconds, sd, spawnRateMult));
  const mean = (f: (r: (typeof rs)[number]) => number) =>
    rs.reduce((a, r) => a + f(r), 0) / rs.length;
  return {
    kills: mean((r) => r.kills),
    taken: mean((r) => r.taken),
    survived: mean((r) => r.survived),
  };
}

if (flag("fit")) {
  // Fits CALIBRATION for one level so every weapon kills what the Bolt does
  // in a dense wave, times a premium for the exposure it accepts. Kills in a
  // dense wave fold killing power and survival into one number.
  const EXPOSURE_KILL_PREMIUM = 0.4;
  const level = option("level", 1);
  const modes = ["stand", "circle"] as const;
  const avgKills = (id: WeaponId) =>
    modes.reduce((a, m) => a + measure(id, level, m).kills, 0) / modes.length;
  const baseline = avgKills("bolt");
  console.log(`level ${level}: Bolt baseline ${baseline.toFixed(1)} kills`);
  for (const id of weapons.filter((w) => w !== "bolt")) {
    const want = baseline * (1 + EXPOSURE_KILL_PREMIUM * exposure(id, level));
    for (let step = 0; step < option("steps", 5); step++) {
      const got = avgKills(id);
      const factor = CALIBRATION[id][level - 1];
      console.log(
        `  ${id} L${level} step ${step}: ${got.toFixed(1)} kills (want ${want.toFixed(1)}) at x${factor.toFixed(2)}`,
      );
      if (Math.abs(got - want) / want < 0.06) break;
      CALIBRATION[id][level - 1] = Math.min(
        4,
        Math.max(0.4, factor * (want / Math.max(got, 1)) ** 0.8),
      );
    }
    console.log(`FIT ${id} ${level} ${CALIBRATION[id][level - 1].toFixed(2)}`);
  }
} else {
  for (const m of ["stand", "circle"] as const) {
    for (const level of [1, 3, 6]) {
      console.log(
        `\nLevel ${level} — player ${m === "stand" ? "standing still" : "circling"}, ${seconds}s${dense ? `, dense x${spawnRateMult}` : ""}, mean of ${seeds.length} seeds`,
      );
      console.log(
        "weapon".padEnd(16) +
          "kills".padStart(7) +
          "HP lost".padStart(9) +
          "HP/kill".padStart(9) +
          "survived".padStart(10),
      );
      for (const id of weapons) {
        const r = measure(id, level, m);
        console.log(
          id.padEnd(16) +
            r.kills.toFixed(0).padStart(7) +
            r.taken.toFixed(0).padStart(9) +
            (r.taken / Math.max(r.kills, 1)).toFixed(1).padStart(9) +
            `${r.survived.toFixed(0)}s`.padStart(10),
        );
      }
    }
  }
}
