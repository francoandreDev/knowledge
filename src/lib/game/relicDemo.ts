// A relic's own animation, shown wherever the relic is: on its card when a
// chest drops it and in its description in the lobby. It is the same drawing
// the run uses (cueView.ts), staged on a tiny scene with the hero and a
// zombie, looping, so a relic looks the same where you find it and where it
// works.
import { drawEnemy, drawPlayer } from "./sprites";
import { CUE_MS, RELIC_CUE, drawCue, type Cue, type CueKind } from "./cueView";

export const DEMO_W = 110;
export const DEMO_H = 70;

const HERO = { x: 34, y: 44 };
const FOE = { x: 80, y: 44 };

/** The cues that happen at the enemy rather than at the hero. */
const AT_ENEMY: ReadonlySet<CueKind> = new Set([
  "drain",
  "reflect",
  "bounty",
  "echo",
  "crit",
  "chill",
]);

const DEMO_TEXT: Partial<Record<CueKind, string>> = {
  block: "-3",
  drain: "+0.3",
  coin: "+4",
  lucky: "×3",
  xp: "+5",
  dodge: "MISS",
};

/** Draws frame `now` (ms) of a relic's loop on a canvas already scaled to
 * DEMO_W x DEMO_H. A relic with no animation draws nothing. */
export function drawRelicDemo(
  c: CanvasRenderingContext2D,
  relicId: string,
  now: number,
) {
  const kind = RELIC_CUE[relicId];
  if (!kind) return;
  c.clearRect(0, 0, DEMO_W, DEMO_H);
  c.fillStyle = "rgba(0,0,0,0.22)";
  c.beginPath();
  c.ellipse(HERO.x, HERO.y + 12, 11, 3.4, 0, 0, Math.PI * 2);
  c.ellipse(FOE.x, FOE.y + 12, 10, 3, 0, 0, Math.PI * 2);
  c.fill();
  drawPlayer(c, HERO.x, HERO.y, 8, "#38bdf8", 0, 0, undefined, now);
  drawEnemy(c, "zombie", FOE.x, FOE.y, 8, "#4ade80", { t: now });
  const period = CUE_MS[kind] + 650;
  const local = now % period;
  const atEnemy = AT_ENEMY.has(kind);
  const cue: Cue = {
    kind,
    x: atEnemy ? FOE.x : HERO.x,
    y: atEnemy ? FOE.y : HERO.y,
    onHero: !atEnemy,
    at: 0,
    r: 42,
    angle: 0,
    text: DEMO_TEXT[kind],
  };
  drawCue(c, cue, local, HERO);
}

let raf = 0;

/** Runs every relic canvas in `items` in one animation loop, replacing any
 * loop already running. Under reduced motion it draws a single still frame. */
export function runRelicDemos(
  items: { canvas: HTMLCanvasElement; relicId: string }[],
  reduced: boolean,
) {
  cancelAnimationFrame(raf);
  const ctxs = items.map((it) => {
    const ctx = it.canvas.getContext("2d")!;
    it.canvas.width = DEMO_W * 2;
    it.canvas.height = DEMO_H * 2;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    return ctx;
  });
  const draw = (now: number) => {
    items.forEach((it, i) => drawRelicDemo(ctxs[i], it.relicId, now));
  };
  if (reduced) {
    // A still frame at the moment the cue is at its fullest.
    items.forEach((it, i) => {
      const kind = RELIC_CUE[it.relicId];
      drawRelicDemo(ctxs[i], it.relicId, kind ? CUE_MS[kind] * 0.35 : 0);
    });
    return;
  }
  const loop = (now: number) => {
    if (!items.some((it) => it.canvas.isConnected)) return;
    draw(now);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

export function stopRelicDemos() {
  cancelAnimationFrame(raf);
}
