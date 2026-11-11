// The profile avatar is the /game hero: the same capped scout, drawn by the
// same `drawHeroArt`, in the profile's colour. Every avatar on the page is
// one small canvas; a single shared loop gives them an idle bob and stops
// itself when none are left in the document.
import { drawHeroArt } from "./game/characters";

interface Mounted {
  canvas: HTMLCanvasElement;
  color: string;
  phase: number;
}

const mounted = new Set<Mounted>();
let raf = 0;

const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function size(canvas: HTMLCanvasElement): number {
  const css = canvas.clientWidth || Number(canvas.dataset.size) || 48;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const px = Math.round(css * dpr);
  if (canvas.width !== px) {
    canvas.width = px;
    canvas.height = px;
  }
  return css;
}

/** Draws the hero once. `t` drives the scarf and the idle bob. */
export function drawAvatar(
  canvas: HTMLCanvasElement,
  color: string,
  t = 0,
  bob = 0,
): void {
  const css = size(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = canvas.width / css;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, css, css);
  // Small avatars get a larger hero so the face and cap still read. The hero
  // reaches about 1.5r above its centre and 1.05r below, so shift it down to
  // sit in the middle of the canvas.
  const r = css * (css <= 40 ? 0.34 : 0.3);
  drawHeroArt(
    ctx,
    css * 0.5,
    css * 0.5 + r * 0.22 + bob * r,
    r,
    color,
    0.5,
    0,
    t,
  );
}

function frame(now: number) {
  for (const m of mounted) {
    if (!m.canvas.isConnected) {
      mounted.delete(m);
      continue;
    }
    drawAvatar(m.canvas, m.color, now, Math.sin(now / 420 + m.phase) * 0.05);
  }
  raf = mounted.size > 0 ? requestAnimationFrame(frame) : 0;
}

/**
 * Paints `canvas` with the hero in `color` and keeps it gently moving.
 * Calling it again on the same canvas just changes the colour.
 */
export function mountAvatar(canvas: HTMLCanvasElement, color: string): void {
  for (const m of mounted) {
    if (m.canvas === canvas) {
      m.color = color;
      drawAvatar(canvas, color);
      return;
    }
  }
  drawAvatar(canvas, color);
  if (reduced()) return;
  mounted.add({ canvas, color, phase: Math.random() * 6 });
  if (!raf) raf = requestAnimationFrame(frame);
}
