// Combat feedback in the sticker language of sprites.ts: dark ink outlines,
// flat pastel fills. Pure drawing and particle helpers — the engine decides
// when each effect fires.

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

/** Blade swing: a filled wedge with an ink outline and a bright leading edge. */
export function drawSlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  angle: number,
  halfArc: number,
  progress: number,
) {
  const alpha = Math.max(0, 1 - progress);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, radius, angle - halfArc, angle + halfArc);
  ctx.closePath();
  ctx.fillStyle = "rgba(226,232,240,0.35)";
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.arc(x, y, radius, angle - halfArc, angle + halfArc);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#f8fafc";
  ctx.stroke();
  ctx.restore();
}

/** Nova pulse: a thick ring that grows, outlined like a sticker. */
export function drawNovaRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  progress: number,
) {
  const alpha = Math.max(0, 1 - progress);
  const r = radius * (0.3 + progress * 0.7);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(196,181,253,0.22)";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#c4b5fd";
  ctx.stroke();
  ctx.restore();
}

/** Chain lightning: a jagged bolt, ink underlay, bright core. */
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
  const segments = Math.max(2, Math.round(len / 18));
  const nx = -(y2 - y1) / (len || 1);
  const ny = (x2 - x1) / (len || 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const jitter = Math.sin(seed * 12.9898 + i * 78.233) * 7;
    ctx.lineTo(
      x1 + (x2 - x1) * t + nx * jitter,
      y1 + (y2 - y1) * t + ny * jitter,
    );
  }
  ctx.lineTo(x2, y2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#a5f3fc";
  ctx.stroke();
  ctx.restore();
}

// --- Danger tells --------------------------------------------------------

/** Ogre slam: the danger zone fills up until the hit lands. */
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
  ctx.globalAlpha = 0.55 + Math.sin(nowMs / 80) * 0.25;
  ctx.beginPath();
  ctx.arc(x, y, radius + 3.5, 0, Math.PI * 2);
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
