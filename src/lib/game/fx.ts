// Combat feedback in the sticker language of sprites.ts: dark ink outlines,
// flat pastel fills. Pure drawing and particle helpers — the engine decides
// when each effect fires.

import type { WeaponId } from "./engine";
import { drawWeaponGlyph, WEAPON_COLOR } from "./sprites";

const INK = "#0f172a";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number; // ms
  life: number; // ms
  size: number;
  color: string;
  shape: "square" | "circle" | "ring";
  spin: number;
}

const CONFETTI_PALETTE = ["#fde68a", "#ffffff", "#fda4af", "#a5f3fc"];

/** Sticker confetti: `color` plus a few pale accents, flung outward. */
export function burst(
  list: Particle[],
  x: number,
  y: number,
  color: string,
  count: number,
  speed = 150,
) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    list.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 30,
      age: 0,
      life: 380 + Math.random() * 260,
      size: 2.5 + Math.random() * 2.5,
      color:
        i % 3 === 0 ? CONFETTI_PALETTE[i % CONFETTI_PALETTE.length] : color,
      shape: i % 2 === 0 ? "square" : "circle",
      spin: Math.random() * Math.PI * 2,
    });
  }
}

/** One expanding ring — the "pop" under a kill or a level-up. */
export function ringPop(
  list: Particle[],
  x: number,
  y: number,
  color: string,
  size: number,
) {
  list.push({
    x,
    y,
    vx: 0,
    vy: 0,
    age: 0,
    life: 320,
    size,
    color,
    shape: "ring",
    spin: 0,
  });
}

export function stepParticles(list: Particle[], dtMs: number) {
  const dt = dtMs / 1000;
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.age += dtMs;
    if (p.age >= p.life) {
      list.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 260 * dt; // gravity: confetti falls back down
    p.vx *= 0.97;
    p.spin += dt * 9;
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, list: Particle[]) {
  if (list.length === 0) return;
  ctx.save();
  ctx.lineJoin = "round";
  for (const p of list) {
    const t = p.age / p.life;
    if (p.shape === "ring") {
      ctx.globalAlpha = 1 - t;
      ctx.lineWidth = 5;
      ctx.strokeStyle = INK;
      const r = p.size * (0.3 + t * 0.9);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = p.color;
      ctx.stroke();
      continue;
    }
    ctx.globalAlpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    const s = p.size * (1 - t * 0.4);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.spin);
    if (p.shape === "square") {
      ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.strokeRect(-s, -s, s * 2, s * 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

/** Damage number as a sticker label: pops in, rises, fades. */
export function drawDamageNumber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  amount: number,
  progress: number,
  big: boolean,
) {
  const alpha = Math.max(0, 1 - progress * progress);
  const pop =
    progress < 0.18
      ? 0.6 + (progress / 0.18) * 0.6
      : 1.2 - 0.2 * Math.min(1, (progress - 0.18) * 4);
  const size = (big ? 17 : 12) * pop;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `800 ${size.toFixed(1)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  ctx.lineWidth = big ? 5 : 4;
  ctx.strokeStyle = INK;
  const label = String(Math.round(amount));
  ctx.strokeText(label, x, y);
  ctx.fillStyle = big ? "#fde047" : "#ffffff";
  ctx.fillText(label, x, y);
  ctx.restore();
}

/** Blade swing: a tapered crescent that sweeps through the arc, leaving
 * speed streaks behind its bright leading edge. */
export function drawSlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  angle: number,
  halfArc: number,
  progress: number,
  color = "#f5d0fe",
) {
  const alpha = Math.max(
    0,
    1 - Math.pow(Math.max(0, progress - 0.25) / 0.75, 1.5),
  );
  if (alpha <= 0) return;
  const sweep = Math.min(1, progress / 0.4);
  const eased = 1 - (1 - sweep) * (1 - sweep);
  const a0 = angle - halfArc;
  const lead = a0 + halfArc * 2 * eased;
  const steps = 14;
  // The tail thins to nothing; the band is widest just behind the edge.
  const outerAt = (i: number) =>
    radius * (0.97 + 0.03 * Math.sin((i / steps) * Math.PI));
  const widthAt = (i: number) =>
    radius *
    0.5 *
    Math.pow(
      Math.sin(Math.min(1, 0.1 + (i / steps) * 0.9) * Math.PI * 0.5),
      1.2,
    );
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (lead - a0) * (i / steps);
    const rad = outerAt(i);
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  for (let i = steps; i >= 0; i--) {
    const a = a0 + (lead - a0) * (i / steps);
    const rad = outerAt(i) - widthAt(i);
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha * 0.85;
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();
  // Bright outer rim.
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#ffffff";
  ctx.beginPath();
  for (let i = 3; i <= steps; i++) {
    const a = a0 + (lead - a0) * (i / steps);
    const rad = outerAt(i) - 1;
    if (i === 3) ctx.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    else ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.stroke();
  // Speed streaks inside the sweep.
  ctx.lineCap = "round";
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  for (const k of [0.62, 0.74]) {
    ctx.beginPath();
    ctx.arc(
      x,
      y,
      radius * k,
      Math.max(a0, lead - halfArc * 0.9),
      lead - halfArc * 0.15,
    );
    ctx.stroke();
  }
  // A spark at the leading edge while it travels.
  if (sweep < 1) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(
      x + Math.cos(lead) * radius,
      y + Math.sin(lead) * radius,
      3.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

/** Nova pulse: a shockwave — a flash at the core, a thick ring that expands
 * with a crown of spikes on its rim, and a fading disc inside. */
export function drawNovaRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  progress: number,
  color = "#fb923c",
) {
  const alpha = Math.max(0, 1 - progress);
  if (alpha <= 0) return;
  const grow = 1 - Math.pow(1 - progress, 2);
  const r = radius * (0.2 + grow * 0.8);
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, "rgba(254,243,199,0)");
  g.addColorStop(1, color);
  ctx.globalAlpha = alpha * 0.5;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha;
  // Spikes riding the rim.
  const spikes = 16;
  const len = radius * 0.16 * (1 - progress * 0.6);
  ctx.beginPath();
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 + progress * 0.6;
    const half = (Math.PI / spikes) * 0.5;
    ctx.moveTo(x + Math.cos(a - half) * r, y + Math.sin(a - half) * r);
    ctx.lineTo(x + Math.cos(a) * (r + len), y + Math.sin(a) * (r + len));
    ctx.lineTo(x + Math.cos(a + half) * r, y + Math.sin(a + half) * r);
  }
  ctx.fillStyle = "#fef3c7";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.lineWidth = 7 * (1 - progress * 0.5);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 3.5 * (1 - progress * 0.5);
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.84, 0, Math.PI * 2);
  ctx.stroke();
  // The flash at the core, gone in the first quarter.
  if (progress < 0.25) {
    const k = 1 - progress / 0.25;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.22 * k + 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Chain lightning: a forked bolt with an ink underlay, a cyan body and a
 * white core, flaring where it lands. */
export function drawBolt(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  progress: number,
  seed: number,
) {
  const alpha = Math.max(0, 1 - progress);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const segments = Math.max(3, Math.round(len / 14));
  const nx = -(y2 - y1) / (len || 1);
  const ny = (x2 - x1) / (len || 1);
  const pts: [number, number][] = [[x1, y1]];
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const jitter = Math.sin(seed * 12.9898 + i * 78.233) * 8;
    pts.push([
      x1 + (x2 - x1) * t + nx * jitter,
      y1 + (y2 - y1) * t + ny * jitter,
    ]);
  }
  pts.push([x2, y2]);
  const trace = (list: [number, number][]) => {
    ctx.beginPath();
    list.forEach(([px, py], i) =>
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py),
    );
  };
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // Two short forks off the main bolt.
  const forks: [number, number][][] = [];
  for (const [idx, side] of [
    [Math.floor(segments * 0.35), 1],
    [Math.floor(segments * 0.7), -1],
  ] as const) {
    if (idx < 1 || idx >= pts.length - 1) continue;
    const [px, py] = pts[idx];
    const dirx = (x2 - x1) / (len || 1);
    const diry = (y2 - y1) / (len || 1);
    const reach = Math.min(18, len * 0.25);
    forks.push([
      [px, py],
      [
        px + dirx * reach * 0.5 + nx * side * reach * 0.7,
        py + diry * reach * 0.5 + ny * side * reach * 0.7,
      ],
      [
        px + dirx * reach + nx * side * reach * 0.9,
        py + diry * reach + ny * side * reach * 0.9,
      ],
    ]);
  }
  for (const [w, c] of [
    [7, INK],
    [3.6, "#67e8f9"],
    [1.6, "#ffffff"],
  ] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    trace(pts);
    ctx.stroke();
    ctx.lineWidth = w * 0.6;
    for (const fk of forks) {
      trace(fk);
      ctx.stroke();
    }
  }
  // Flares where the bolt leaves and lands.
  for (const [fx2, fy2, big] of [
    [x1, y1, 4],
    [x2, y2, 7],
  ] as const) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + seed;
      const rad = i % 2 ? big * 0.45 : big;
      ctx.lineTo(fx2 + Math.cos(a) * rad, fy2 + Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fillStyle = "#ecfeff";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  ctx.restore();
}

// --- Danger tells --------------------------------------------------------

/** Ogre slam: the danger zone fills up until the hit lands. */
/** Diagonal stripes inside the current path. Danger zones carry this texture
 * on top of their red, so they read without relying on colour alone. */
function hatchFill(
  ctx: CanvasRenderingContext2D,
  trace: () => void,
  x: number,
  y: number,
  reach: number,
  alpha: number,
) {
  ctx.save();
  ctx.beginPath();
  trace();
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let d = -reach * 2; d < reach * 2; d += 9) {
    ctx.moveTo(x + d - reach, y + reach);
    ctx.lineTo(x + d + reach, y - reach);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawSlamWarning(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  range: number,
  progress: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, range, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(251,113,133,0.12)";
  ctx.fill();
  hatchFill(ctx, () => ctx.arc(x, y, range, 0, Math.PI * 2), x, y, range, 0.22);
  ctx.beginPath();
  ctx.arc(x, y, range, 0, Math.PI * 2);
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(x, y, range * Math.min(1, progress), 0, Math.PI * 2);
  ctx.fillStyle = `rgba(251,113,133,${0.25 + progress * 0.3})`;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#fb7185";
  ctx.stroke();
  ctx.restore();
}

/** The cone a melee swing is about to cover; it fills as the blow comes. */
export function drawSwingWarning(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  range: number,
  angle: number,
  halfArc: number,
  progress: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfArc, angle + halfArc);
  ctx.closePath();
  ctx.fillStyle = "rgba(251,113,133,0.12)";
  ctx.fill();
  const wedge = () => {
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, angle - halfArc, angle + halfArc);
    ctx.closePath();
  };
  hatchFill(ctx, wedge, x, y, range, 0.22);
  ctx.beginPath();
  wedge();
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.setLineDash([]);
  const p = Math.min(1, progress);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range * p, angle - halfArc, angle + halfArc);
  ctx.closePath();
  ctx.fillStyle = `rgba(251,113,133,${0.25 + p * 0.3})`;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#fb7185";
  ctx.stroke();
  ctx.restore();
}

/** A pulsing "!" tag over a boss that is about to attack. */
export function drawWindup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  progress: number,
  nowMs: number,
) {
  const pulse = 1 + Math.sin(nowMs / 55) * 0.12;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, (radius + 6 + progress * 8) * pulse, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fb7185";
  ctx.stroke();
  const ty = y - radius - 16;
  ctx.beginPath();
  ctx.arc(x, ty, 9 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = "#fecdd3";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.font = "800 12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK;
  ctx.fillText("!", x, ty + 1);
  ctx.restore();
}

/** Where a dash is about to go. */
export function drawDashLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.lineCap = "round";
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#fb7185";
  ctx.globalAlpha = 0.9;
  ctx.stroke();
  ctx.restore();
}

/** Enemy shots get a red halo so they never read as the player's own. */
export function drawDangerHalo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  nowMs: number,
) {
  ctx.save();
  ctx.globalAlpha = 0.6 + Math.sin(nowMs / 80) * 0.25;
  ctx.beginPath();
  ctx.arc(x, y, radius + 3.5, 0, Math.PI * 2);
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  // Dashed, so a hostile shot is told apart by its outline and not only its
  // colour.
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fb7185";
  ctx.stroke();
  ctx.restore();
}

/** Elite marker: a pulsing gold ring and a small crown. */
export function drawEliteMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  nowMs: number,
) {
  const pulse = 1 + Math.sin(nowMs / 220) * 0.06;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.arc(x, y, (radius + 5) * pulse, 0, Math.PI * 2);
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#facc15";
  ctx.stroke();
  const cy = y - radius - 9;
  ctx.beginPath();
  ctx.moveTo(x - 6, cy + 5);
  ctx.lineTo(x - 6, cy - 1);
  ctx.lineTo(x - 3, cy + 2);
  ctx.lineTo(x, cy - 3);
  ctx.lineTo(x + 3, cy + 2);
  ctx.lineTo(x + 6, cy - 1);
  ctx.lineTo(x + 6, cy + 5);
  ctx.closePath();
  ctx.fillStyle = "#fde047";
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
}

/** Edge arrow for a dangerous enemy that is off-screen. */
export function drawOffscreenArrow(
  ctx: CanvasRenderingContext2D,
  ex: number,
  ey: number,
  width: number,
  height: number,
  color: string,
  nowMs: number,
) {
  const margin = 14;
  const cx = width / 2;
  const cy = height / 2;
  const dx = ex - cx;
  const dy = ey - cy;
  const scale = Math.min(
    (cx - margin) / Math.max(Math.abs(dx), 1e-6),
    (cy - margin) / Math.max(Math.abs(dy), 1e-6),
  );
  const px = cx + dx * scale;
  const py = cy + dy * scale;
  const a = Math.atan2(dy, dx);
  const pulse = 1 + Math.sin(nowMs / 160) * 0.12;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(a);
  ctx.scale(pulse, pulse);
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-6, -8);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-6, 8);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
}

/** Boss health: a wide sticker bar pinned to the top of the field. */
export function drawBossBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  name: string,
  fraction: number,
) {
  const w = Math.min(260, width - 40);
  const x = (width - w) / 2;
  const y = 72; // below the HUD overlay
  const f = Math.max(0, Math.min(1, fraction));
  ctx.save();
  ctx.lineJoin = "round";
  ctx.font = "800 10px sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = INK;
  ctx.strokeText(name, width / 2, y - 4);
  ctx.fillStyle = "#fecdd3";
  ctx.fillText(name, width / 2, y - 4);
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(x, y, w, 10);
  ctx.fillStyle = "#fb7185";
  ctx.fillRect(x, y, w * f, 10);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = INK;
  ctx.strokeRect(x, y, w, 10);
  ctx.restore();
}

// --- Clock ---------------------------------------------------------------

function clockText(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** A faint stopwatch face; the long hand follows the seconds left. */
export function drawClock(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  secondsLeft: number,
  alpha: number,
  color: string,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = r * 0.09;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillRect(cx - r * 0.1, cy - r * 1.28, r * 0.2, r * 0.18); // crown
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
    ctx.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92);
    ctx.stroke();
  }
  const a = ((secondsLeft % 60) / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.lineWidth = r * 0.07;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The time left, big and faint behind the action. */
export function drawBigTime(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  secondsLeft: number,
  alpha: number,
  color: string,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.round(width * 0.3)}px sans-serif`;
  ctx.fillText(clockText(secondsLeft), width / 2, height * 0.46);
  ctx.font = `800 ${Math.round(width * 0.04)}px sans-serif`;
  ctx.fillText("TIME LEFT", width / 2, height * 0.46 + width * 0.2);
  ctx.restore();
}

/** Small health bar under a boss, so its HP is readable at a glance. */
export function drawHpBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  fraction: number,
  color: string,
) {
  const f = Math.max(0, Math.min(1, fraction));
  ctx.save();
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(x - w / 2, y, w, 6);
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, y, w * f, 6);
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.strokeRect(x - w / 2, y, w, 6);
  ctx.restore();
}

/** The wedge an orbiter shields: a faint arc on its ring. */
export function drawCoverArc(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  ringRadius: number,
  bearing: number,
  halfArc: number,
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(px, py, ringRadius, bearing - halfArc, bearing + halfArc);
  ctx.lineWidth = 7;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = "#fde047";
  ctx.stroke();
  ctx.restore();
}

// --- HUD and cinematic helpers -------------------------------------------

/** A heartbeat ring around the player while HP is low. */
export function drawHeartRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  nowMs: number,
) {
  const beat = (nowMs % 900) / 900;
  const k = beat < 0.2 ? beat / 0.2 : Math.max(0, 1 - (beat - 0.2) / 0.5);
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.55 * k;
  ctx.beginPath();
  ctx.arc(x, y, radius + 4 + k * 7, 0, Math.PI * 2);
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#fb7185";
  ctx.stroke();
  ctx.restore();
}

/** A red wedge on the player's ring pointing at what just hit them. */
export function drawHitIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  progress: number,
) {
  const r = 38 + progress * 6;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - progress);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, r, angle - 0.42, angle + 0.42);
  ctx.lineWidth = 9;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#fb7185";
  ctx.stroke();
  const tx = x + Math.cos(angle) * (r + 9);
  const ty = y + Math.sin(angle) * (r + 9);
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx + Math.cos(angle + 2.5) * 8, ty + Math.sin(angle + 2.5) * 8);
  ctx.lineTo(tx + Math.cos(angle - 2.5) * 8, ty + Math.sin(angle - 2.5) * 8);
  ctx.closePath();
  ctx.fillStyle = "#fb7185";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
}

/** One equipped weapon in the HUD row: its icon, a cooldown sweep and its level. */
export function drawWeaponSlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  id: WeaponId,
  level: number,
  ready: number, // 0..1, 1 = ready to act
  evolved: boolean,
) {
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.72)";
  ctx.strokeStyle = evolved ? "#fde047" : INK;
  ctx.lineWidth = evolved ? 3 : 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 7);
  ctx.fill();
  ctx.stroke();
  drawWeaponGlyph(
    ctx,
    id,
    x + size / 2,
    y + size / 2,
    size * 0.28,
    -Math.PI / 4,
  );
  if (ready < 1) {
    // A clock-wise sweep covering what is still recharging.
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 7);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + size / 2);
    ctx.arc(
      x + size / 2,
      y + size / 2,
      size * 0.75,
      -Math.PI / 2 + ready * Math.PI * 2,
      Math.PI * 1.5,
    );
    ctx.closePath();
    ctx.fillStyle = "rgba(2,6,23,0.6)";
    ctx.fill();
    ctx.restore();
  } else {
    ctx.strokeStyle = WEAPON_COLOR[id];
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, size - 4, size - 4, 5);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Level pips along the bottom.
  const pips = Math.min(level, 6);
  for (let i = 0; i < pips; i++) {
    ctx.fillStyle = evolved ? "#fde047" : "#e2e8f0";
    ctx.fillRect(
      x + 4 + i * ((size - 8) / 6),
      y + size - 5,
      (size - 8) / 6 - 1.5,
      3,
    );
  }
  ctx.restore();
}

/** Big sticker text that slams in (scales down from large) and fades out. */
export function drawSlamText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  progress: number, // 0..1 over the whole display
  color = "#f8fafc",
  shake = 0,
) {
  const inP = Math.min(1, progress / 0.16);
  const outP = progress > 0.75 ? (progress - 0.75) / 0.25 : 0;
  const scale = 1 + (1 - inP) * (1 - inP) * 1.2;
  ctx.save();
  ctx.globalAlpha = Math.min(1, inP * 1.4) * (1 - outP);
  ctx.translate(x + (shake ? (Math.random() - 0.5) * shake * (1 - inP) : 0), y);
  ctx.scale(scale, scale);
  ctx.font = `900 ${size}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(5, size / 4);
  ctx.strokeStyle = INK;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = INK;
  ctx.fillText(text, 0, size * 0.07);
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** Boss entrance: letterbox bars slide in, the name slams down. */
export function drawBossIntro(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  name: string,
  sub: string,
  progress: number,
) {
  const bar = h * 0.11;
  const slide =
    Math.min(1, progress / 0.12) *
    (progress > 0.88 ? (1 - progress) / 0.12 : 1);
  ctx.save();
  ctx.fillStyle = "rgba(2,6,23,0.92)";
  ctx.fillRect(0, 0, w, bar * slide);
  ctx.fillRect(0, h - bar * slide, w, bar * slide);
  // Red wash that pulses once as the boss lands.
  ctx.globalAlpha = Math.max(0, 0.22 - progress * 0.3);
  ctx.fillStyle = "#be123c";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  drawSlamText(
    ctx,
    name,
    w / 2,
    h * 0.44,
    Math.min(54, w * 0.1),
    progress,
    "#fb7185",
    8,
  );
  if (progress > 0.14) {
    drawSlamText(
      ctx,
      sub,
      w / 2,
      h * 0.44 + Math.min(54, w * 0.1) * 0.85,
      Math.min(20, w * 0.04),
      Math.min(1, (progress - 0.14) / 0.86),
      "#e2e8f0",
    );
  }
}

/** A boss's aura: it burns brighter and faster with each phase. */
export function drawBossAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  phase: number,
  nowMs: number,
  color: string,
) {
  const speed = 0.004 * phase;
  ctx.save();
  for (let i = 0; i < phase; i++) {
    const k = (nowMs * speed * 0.25 + i / phase) % 1;
    ctx.globalAlpha = (1 - k) * (0.22 + phase * 0.07);
    ctx.beginPath();
    ctx.arc(x, y, radius * (1.1 + k * 0.9), 0, Math.PI * 2);
    ctx.lineWidth = 3 + phase;
    ctx.strokeStyle = phase === 3 ? "#fb7185" : color;
    ctx.stroke();
  }
  if (phase >= 2) {
    // Flame ticks flickering round the body.
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = phase === 3 ? "#fb7185" : "#f0abfc";
    for (let i = 0; i < 6 + phase * 2; i++) {
      const a = (i / (6 + phase * 2)) * Math.PI * 2 + nowMs * 0.0012 * phase;
      const flick = 0.5 + 0.5 * Math.sin(nowMs * 0.02 + i * 2.3);
      const rr = radius * 1.15;
      ctx.beginPath();
      ctx.arc(
        x + Math.cos(a) * rr,
        y + Math.sin(a) * rr,
        1.5 + flick * 2.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.restore();
}
