// Phase 9 — richer multi-shape canvas composites, replacing Phase 8's
// single-primitive drawShape() calls per entity. Still pure Canvas drawing
// (circles/triangles/squares/lines, layered) — no external image assets,
// matching GAME-DESIGN.md's "Visual style" ("no external art assets...
// can be swapped for real sprite assets later without touching game
// logic"). engine.ts calls these from render(); simulation/collision code
// is entirely untouched by this file — it is rendering-only.
import type { EnemyKind, WeaponId } from "./engine";
import { OUTLINE, drawEnemyArt, drawHeroArt, lighten } from "./characters";

export type Shape = "circle" | "square" | "diamond" | "bat" | "ghost" | "hood";

export const ENEMY_SHAPE: Record<EnemyKind, Shape> = {
  zombie: "circle",
  bat: "bat",
  skeleton: "square",
  ghost: "ghost",
  ogre: "square",
  slime: "circle",
  imp: "bat",
  bomber: "circle",
  knight: "square",
  boar: "square",
  shaman: "ghost",
  wasp: "bat",
  phantom: "ghost",
  spitter: "circle",
  reaper: "hood",
  lich: "diamond",
};

/** Squash-and-stretch applied around an enemy's feet: how it moves and
 * attacks reads from its silhouette, not just from a tell on the ground. */
export interface EnemyPose {
  sx: number;
  sy: number;
  lift: number; // px, negative raises the sprite
  tilt: number; // radians, leaning
}

interface ShapeOptions {
  pose?: EnemyPose;
  glow?: boolean;
  glowColor?: string;
  // Phase 11: 0-1 fade — a white overlay of the same silhouette, used for a
  // brief "just got hit" flash. 0/undefined draws nothing extra.
  flashAlpha?: number;
  // Clock in ms, for things that flap and sway.
  t?: number;
  // False while a swinging arm carries the weapon instead.
  armed?: boolean;
}

// Traces the given shape's outline into ctx's current path (caller controls
// fill/stroke/save/restore) — shared by drawShape() and the flash overlay so
// both draw the exact same silhouette.
function traceShapePath(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  x: number,
  y: number,
  radius: number,
) {
  const r = radius;
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(x, y, r, 0, Math.PI * 2);
  } else if (shape === "square") {
    ctx.roundRect(x - r, y - r, r * 2, r * 2, r * 0.4);
  } else if (shape === "diamond") {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  } else if (shape === "bat") {
    // Wide, flat wings with a notch at the back.
    ctx.moveTo(x, y - r * 0.85);
    ctx.lineTo(x + r, y + r * 0.65);
    ctx.lineTo(x, y + r * 0.1);
    ctx.lineTo(x - r, y + r * 0.65);
    ctx.closePath();
  } else if (shape === "ghost") {
    // Dome on top, wavy hem at the bottom.
    ctx.moveTo(x - r, y + r);
    ctx.lineTo(x - r, y - r * 0.2);
    ctx.arc(x, y - r * 0.2, r, Math.PI, 0);
    ctx.lineTo(x + r, y + r);
    ctx.lineTo(x + r * 0.5, y + r * 0.7);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r * 0.5, y + r * 0.7);
    ctx.closePath();
  } else {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.9, y + r * 0.9);
    ctx.lineTo(x - r * 0.9, y + r * 0.9);
    ctx.closePath();
  }
}

// Sprites are drawn larger than their simulation radius so the faces read at
// the canvas's small size; hitboxes (engine.ts) are untouched.
const PLAYER_SCALE = 1.4;
const ENEMY_SCALE = 1.35;
const PICKUP_SCALE = 1.5;

// Draws a filled shape with a thick dark outline and a hard offset shadow —
// the same sticker look as the site's game buttons — with an optional glow
// (shadowBlur) and an optional white hit-flash overlay of the same silhouette.
// Glow is opt-in per call site — see engine.ts's Phase 8 header note on why
// it's reserved for elites only (perf at up to 60 alive).
export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  x: number,
  y: number,
  radius: number,
  color: string,
  opts: ShapeOptions = {},
) {
  ctx.save();
  ctx.fillStyle = OUTLINE;
  traceShapePath(ctx, shape, x, y + radius * 0.22, radius);
  ctx.fill();
  ctx.restore();

  ctx.save();
  if (opts.glow) {
    ctx.shadowColor = opts.glowColor ?? color;
    ctx.shadowBlur = radius * 1.1;
  }
  ctx.fillStyle = color;
  ctx.strokeStyle = OUTLINE;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1.5, radius * 0.25);
  traceShapePath(ctx, shape, x, y, radius);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (opts.flashAlpha && opts.flashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = opts.flashAlpha;
    ctx.fillStyle = "#ffffff";
    traceShapePath(ctx, shape, x, y, radius);
    ctx.fill();
    ctx.restore();
  }
}

// Small filled dot, optionally outlined — cheap detail primitive (eyes, etc.).
function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  outlineWidth = 0,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  if (outlineWidth > 0) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = outlineWidth;
    ctx.stroke();
  }
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color = OUTLINE,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  facingAngle: number,
  hitFlashAlpha = 0,
  pose?: EnemyPose,
  t = 0,
) {
  radius *= PLAYER_SCALE;
  if (pose) {
    const feetY = y + radius;
    ctx.save();
    ctx.translate(x, feetY + pose.lift);
    ctx.rotate(pose.tilt);
    ctx.scale(pose.sx, pose.sy);
    ctx.translate(-x, -feetY);
    drawHeroArt(ctx, x, y, radius, color, facingAngle, hitFlashAlpha, t);
    ctx.restore();
    return;
  }
  drawHeroArt(ctx, x, y, radius, color, facingAngle, hitFlashAlpha, t);
}

// Per-kind faces layered on top of the base shape — deliberately simple
// (eyes, mouths, a few extra shapes), not facing-dependent for enemies.
export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  kind: EnemyKind,
  x: number,
  y: number,
  radius: number,
  color: string,
  opts: ShapeOptions = {},
) {
  const pose = opts.pose;
  if (!pose) {
    drawEnemyBody(ctx, kind, x, y, radius, color, opts);
    return;
  }
  const feetY = y + radius * ENEMY_SCALE;
  ctx.save();
  ctx.translate(x, feetY + pose.lift);
  ctx.rotate(pose.tilt);
  ctx.scale(pose.sx, pose.sy);
  ctx.translate(-x, -feetY);
  drawEnemyBody(ctx, kind, x, y, radius, color, opts);
  ctx.restore();
}

/** The arm and weapon of a melee swing. `offset` is how far the arm is
 * rotated from the swing's centre line (pulled back while winding up, then
 * whipped across on the strike). */
export function drawSwingArm(
  ctx: CanvasRenderingContext2D,
  kind: EnemyKind,
  x: number,
  y: number,
  radius: number,
  angle: number,
  offset: number,
  color: string,
) {
  const r = radius * ENEMY_SCALE;
  const a = angle + offset;
  const reach =
    kind === "reaper"
      ? r * 2.6
      : kind === "skeleton" || kind === "knight"
        ? r * 2
        : r * 1.7;
  const sx = x + Math.cos(a) * r * 0.7;
  const sy = y + Math.sin(a) * r * 0.7;
  const ex = x + Math.cos(a) * reach;
  const ey = y + Math.sin(a) * reach;
  const w = Math.max(3, r * (kind === "skeleton" ? 0.42 : 0.32));
  drawLine(ctx, sx, sy, ex, ey, w + 3.5);
  drawLine(ctx, sx, sy, ex, ey, w, kind === "skeleton" ? "#f8fafc" : color);
  if (kind === "reaper") {
    // A scythe blade curving off the end of the haft.
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = r * 0.5;
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.7, a - 1.9, a + 0.2);
    ctx.stroke();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = r * 0.28;
    ctx.stroke();
    ctx.restore();
  } else if (kind === "knight") {
    // A broad blade with a guard.
    drawLine(
      ctx,
      ex,
      ey,
      ex + Math.cos(a) * r * 0.9,
      ey + Math.sin(a) * r * 0.9,
      r * 0.42,
    );
    drawLine(
      ctx,
      ex,
      ey,
      ex + Math.cos(a) * r * 0.9,
      ey + Math.sin(a) * r * 0.9,
      r * 0.24,
      "#e2e8f0",
    );
    drawLine(
      ctx,
      ex + Math.cos(a + Math.PI / 2) * r * 0.4,
      ey + Math.sin(a + Math.PI / 2) * r * 0.4,
      ex - Math.cos(a + Math.PI / 2) * r * 0.4,
      ey - Math.sin(a + Math.PI / 2) * r * 0.4,
      r * 0.2,
      "#fbbf24",
    );
  } else if (kind === "skeleton") {
    drawDot(ctx, ex, ey, r * 0.38, "#f8fafc", Math.max(1.5, r * 0.15));
  } else {
    // Zombie claw: three short talons.
    for (const k of [-0.5, 0, 0.5]) {
      drawLine(
        ctx,
        ex,
        ey,
        ex + Math.cos(a + k) * r * 0.55,
        ey + Math.sin(a + k) * r * 0.55,
        Math.max(2, r * 0.2),
      );
    }
    drawDot(ctx, ex, ey, r * 0.3, color, Math.max(1.5, r * 0.15));
  }
}

function drawEnemyBody(
  ctx: CanvasRenderingContext2D,
  kind: EnemyKind,
  x: number,
  y: number,
  radius: number,
  color: string,
  opts: ShapeOptions,
) {
  drawEnemyArt(
    ctx,
    kind,
    x,
    y,
    radius * ENEMY_SCALE,
    color,
    opts.flashAlpha ?? 0,
    opts.t ?? 0,
    opts.armed ?? true,
  );
}

/** Idle shimmer shared by pickups: a gentle bob and a twinkle that sweeps
 * across each one at its own phase, so a pile never blinks in unison. */
interface PickupAnim {
  t: number; // ms
  pulling?: boolean; // being dragged toward the player
  dirX?: number; // unit vector toward the player, for the pull streak
  dirY?: number;
}

function pickupShimmer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  anim: PickupAnim,
): number {
  const phase = x * 0.13 + y * 0.07;
  const bob = anim.pulling ? 0 : Math.sin(anim.t * 0.005 + phase) * 1.5;
  if (anim.pulling && anim.dirX !== undefined && anim.dirY !== undefined) {
    // A short streak behind it shows the pull.
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(2, radius * 0.9);
    ctx.strokeStyle = "#ddd6fe";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - anim.dirX * radius * 3.4, y - anim.dirY * radius * 3.4);
    ctx.stroke();
    ctx.restore();
  }
  // Twinkle: a four-point star flashes for ~250 ms of every ~1.6 s.
  const cycle = (anim.t * 0.0006 + phase) % 1;
  if (cycle < 0.16) {
    const k = Math.sin((cycle / 0.16) * Math.PI);
    const sx = x + radius * 0.6;
    const sy = y - radius * 0.7 + bob;
    const len = radius * (0.5 + k * 0.9);
    ctx.save();
    ctx.globalAlpha = 0.9 * k;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx - len, sy);
    ctx.lineTo(sx + len, sy);
    ctx.moveTo(sx, sy - len);
    ctx.lineTo(sx, sy + len);
    ctx.stroke();
    ctx.restore();
  }
  return bob;
}

export function drawGem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  anim?: PickupAnim,
) {
  radius *= PICKUP_SCALE;
  const bob = anim ? pickupShimmer(ctx, x, y, radius, anim) : 0;
  y += bob;
  drawShape(ctx, "diamond", x, y, radius, color);
  // Pale facet on the upper right.
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.moveTo(x, y - radius * 0.55);
  ctx.lineTo(x + radius * 0.45, y);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawCoin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  anim?: PickupAnim,
) {
  radius *= PICKUP_SCALE;
  const bob = anim ? pickupShimmer(ctx, x, y, radius, anim) : 0;
  y += bob;
  // The coin spins about its vertical axis: its face narrows and widens.
  const spin = anim ? Math.abs(Math.cos(anim.t * 0.004 + x * 0.1)) : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.35 + 0.65 * spin, 1);
  drawShape(ctx, "circle", 0, 0, radius, color);
  ctx.strokeStyle = "#a16207";
  ctx.lineWidth = Math.max(1, radius * 0.22);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function spikeStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outer: number,
  inner: number,
  points: number,
  rot = 0,
) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = rot + (i * Math.PI) / points;
    const rad = i % 2 ? inner : outer;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
}

function inkFill(ctx: CanvasRenderingContext2D, fill: string, width: number) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = width;
  ctx.strokeStyle = OUTLINE;
  ctx.lineJoin = "round";
  ctx.stroke();
}

/** A shot in flight. What it looks like follows who fired it: the hero's
 * energy bolt and homing dart, a skeleton's thrown bone, a ghost's wisp, the
 * spiked orbs of a reaper's ring, the lich's curse. Anything unnamed is a
 * plain energy bolt. */
export function drawProjectile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  vx: number,
  vy: number,
  source = "bolt",
) {
  const speed = Math.hypot(vx, vy);
  const heading = speed > 0 ? Math.atan2(vy, vx) : 0;
  const lw = Math.max(1.5, radius * 0.4);
  // A tapered trail opposite the velocity vector, bright at the head.
  if (speed > 0 && source !== "skeleton-bone") {
    const tailLen = radius * 5 + Math.min(speed, 400) * 0.04;
    const tx = x - Math.cos(heading) * tailLen;
    const ty = y - Math.sin(heading) * tailLen;
    ctx.save();
    ctx.lineCap = "round";
    const g = ctx.createLinearGradient(x, y, tx, ty);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = Math.max(2, radius * 1.4);
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(x, y);
  if (source === "homingDart") {
    ctx.rotate(heading);
    const L = radius * 2.6;
    // Fletching, shaft, then a pointed head.
    ctx.beginPath();
    ctx.moveTo(-L * 0.9, 0);
    ctx.lineTo(-L * 1.25, -L * 0.45);
    ctx.lineTo(-L * 0.55, -L * 0.1);
    ctx.lineTo(-L * 0.55, L * 0.1);
    ctx.lineTo(-L * 1.25, L * 0.45);
    ctx.closePath();
    inkFill(ctx, "#f472b6", lw);
    ctx.beginPath();
    ctx.moveTo(L * 1.1, 0);
    ctx.lineTo(L * 0.2, -L * 0.4);
    ctx.lineTo(-L * 0.9, -L * 0.14);
    ctx.lineTo(-L * 0.9, L * 0.14);
    ctx.lineTo(L * 0.2, L * 0.4);
    ctx.closePath();
    inkFill(ctx, lighten(color, 0.35), lw);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(L * 0.15, 0, L * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (source === "skeleton-bone") {
    // Tumbles as it travels.
    ctx.rotate((x + y) * 0.12);
    const L = radius * 2.3;
    ctx.lineCap = "round";
    for (const [w, c] of [
      [radius * 1.0 + lw * 2, OUTLINE],
      [radius * 1.0, "#f1f5f9"],
    ] as const) {
      ctx.lineWidth = w;
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.moveTo(-L, 0);
      ctx.lineTo(L, 0);
      ctx.stroke();
    }
    for (const sx of [-L, L]) {
      for (const sy of [-radius * 0.55, radius * 0.55]) {
        ctx.beginPath();
        ctx.arc(sx, sy, radius * 0.62, 0, Math.PI * 2);
        inkFill(ctx, "#f1f5f9", lw * 0.8);
      }
    }
  } else if (source === "ghost") {
    // A wisp: a teardrop whose tail flickers behind it.
    ctx.rotate(heading);
    ctx.beginPath();
    ctx.moveTo(radius * 1.5, 0);
    ctx.bezierCurveTo(
      radius * 1.5,
      -radius * 1.4,
      -radius * 0.4,
      -radius * 1.4,
      -radius * 2.6,
      -radius * 0.2,
    );
    ctx.lineTo(-radius * 1.8, radius * 0.2);
    ctx.lineTo(-radius * 2.4, radius * 0.9);
    ctx.bezierCurveTo(
      -radius * 0.4,
      radius * 1.4,
      radius * 1.5,
      radius * 1.4,
      radius * 1.5,
      0,
    );
    ctx.closePath();
    inkFill(ctx, "#e0f2fe", lw);
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(radius * 0.55, -radius * 0.3, radius * 0.22, 0, Math.PI * 2);
    ctx.arc(radius * 0.55, radius * 0.4, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (source === "imp-fire") {
    // A fireball with licking flames behind it.
    ctx.rotate(heading);
    ctx.beginPath();
    ctx.moveTo(-radius * 3.2, 0);
    ctx.quadraticCurveTo(
      -radius * 1.6,
      -radius * 0.4,
      -radius * 1.1,
      -radius * 1.3,
    );
    ctx.quadraticCurveTo(
      -radius * 0.4,
      -radius * 1.8,
      radius * 0.6,
      -radius * 1.4,
    );
    ctx.arc(radius * 0.4, 0, radius * 1.4, -Math.PI / 2, Math.PI / 2);
    ctx.quadraticCurveTo(
      -radius * 0.4,
      radius * 1.8,
      -radius * 1.1,
      radius * 1.3,
    );
    ctx.quadraticCurveTo(-radius * 1.6, radius * 0.4, -radius * 3.2, 0);
    ctx.closePath();
    inkFill(ctx, "#fb923c", lw);
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(radius * 0.4, 0, radius * 0.85, 0, Math.PI * 2);
    ctx.fill();
  } else if (source === "lich-curse") {
    // A dark orb ringed in violet, with a skull's eyes glaring out of it.
    const flick = 1 + 0.08 * Math.sin((x + y) * 0.3);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.7 * flick, 0, Math.PI * 2);
    inkFill(ctx, "#4c1d95", lw);
    ctx.lineWidth = Math.max(1.5, radius * 0.4);
    ctx.strokeStyle = "#c4b5fd";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.2, 0.4, Math.PI * 1.6);
    ctx.stroke();
    ctx.fillStyle = "#e9d5ff";
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * radius * 0.5, -radius * 0.1, radius * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (source === "reaper-ring") {
    ctx.rotate((x + y) * 0.1);
    spikeStar(ctx, 0, 0, radius * 1.9, radius * 1.0, 8);
    inkFill(ctx, "#fb7185", lw);
    ctx.fillStyle = "#fff1f2";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // The hero's bolt: a glowing teardrop with a pale core.
    ctx.rotate(heading);
    ctx.beginPath();
    ctx.moveTo(-radius * 3.2, 0);
    ctx.quadraticCurveTo(
      -radius * 0.6,
      -radius * 1.5,
      radius * 0.4,
      -radius * 1.45,
    );
    ctx.arc(radius * 0.4, 0, radius * 1.45, -Math.PI / 2, Math.PI / 2);
    ctx.quadraticCurveTo(-radius * 0.6, radius * 1.5, -radius * 3.2, 0);
    ctx.closePath();
    inkFill(ctx, color, lw);
    ctx.fillStyle = "#fffbeb";
    ctx.beginPath();
    ctx.arc(radius * 0.4, 0, radius * 0.85, 0, Math.PI * 2);
    ctx.fill();
    // Two little sparks riding the trail.
    ctx.fillStyle = "#ffffff";
    for (const [px, py] of [
      [-radius * 3.4, -radius * 1.0],
      [-radius * 4.2, radius * 0.9],
    ] as const) {
      spikeStar(ctx, px, py, radius * 0.7, radius * 0.2, 4);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Phase 11: a small radiating-line burst at a weapon-hit point — the
// "visible attacks" feedback layered on top of each weapon's existing
// swing/burst/ring effect (arcEffects/pulseEffects/orbitTrails in
// engine.ts), giving individual hits an impact even outside those. progress
// runs 0 (just spawned) to 1 (fully faded) — engine.ts owns the timing.
// The starburst pops white and settles into `color`.
export function drawImpactBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  color = "#fde047",
) {
  const alpha = Math.max(0, 1 - progress);
  if (alpha <= 0) return;
  const outer = 6 + progress * 12;
  ctx.save();
  ctx.globalAlpha = alpha;
  spikeStar(ctx, x, y, outer, outer * 0.42, 8, progress * 0.8);
  inkFill(ctx, progress < 0.35 ? "#ffffff" : color, 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.5;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * (outer + 2), y + Math.sin(a) * (outer + 2));
    ctx.lineTo(
      x + Math.cos(a) * (outer + 5 + progress * 6),
      y + Math.sin(a) * (outer + 5 + progress * 6),
    );
    ctx.stroke();
  }
  ctx.restore();
}

/** An orbiting shield: a heater shield held flat side out, so what circles
 * the hero looks like what it does. `bearing` is the direction from the hero
 * to the shield. */
export function drawOrbiter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  bearing: number,
) {
  const r = size;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(bearing);
  const trace = (k: number) => {
    ctx.beginPath();
    ctx.moveTo(0.8 * r * k, -0.95 * r * k);
    ctx.lineTo(0.8 * r * k, 0.95 * r * k);
    ctx.lineTo(-0.15 * r * k, 0.8 * r * k);
    ctx.lineTo(-1.0 * r * k, 0);
    ctx.lineTo(-0.15 * r * k, -0.8 * r * k);
    ctx.closePath();
  };
  trace(1);
  inkFill(ctx, "#facc15", Math.max(2, r * 0.3));
  trace(0.62);
  ctx.fillStyle = "#fef08a";
  ctx.fill();
  ctx.lineWidth = Math.max(1.2, r * 0.14);
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0.1 * r, 0, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const WEAPON_COLOR: Record<WeaponId, string> = {
  bolt: "#facc15",
  homingDart: "#f472b6",
  chainLightning: "#67e8f9",
  meteorRain: "#f97316",
  gravityWell: "#a78bfa",
  novaPulse: "#fb923c",
  orbitShield: "#fde047",
  bladeArc: "#e879f9",
};

/** A weapon as a small sticker glyph. Drawn pointing along `angle` (+x is its
 * business end), so the same art serves as a held weapon and as a HUD icon. */
export function drawWeaponGlyph(
  ctx: CanvasRenderingContext2D,
  id: WeaponId,
  cx: number,
  cy: number,
  size: number,
  angle = 0,
) {
  const col = WEAPON_COLOR[id];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const stroke = (trace: () => void, fill?: string) => {
    ctx.beginPath();
    trace();
    ctx.lineWidth = Math.max(3, size * 0.34);
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.lineWidth = Math.max(1.6, size * 0.18);
    ctx.strokeStyle = col;
    ctx.stroke();
  };
  const s = size;
  switch (id) {
    case "bolt":
      stroke(() => {
        ctx.moveTo(-s * 0.7, 0);
        ctx.lineTo(s * 0.5, 0);
      });
      ctx.beginPath();
      ctx.arc(s * 0.7, 0, s * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "#fef9c3";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      break;
    case "homingDart":
      stroke(() => {
        ctx.moveTo(-s * 0.8, 0);
        ctx.quadraticCurveTo(-s * 0.1, -s * 0.5, s * 0.5, 0);
      });
      stroke(() => {
        ctx.moveTo(s * 0.35, -s * 0.28);
        ctx.lineTo(s * 0.85, 0);
        ctx.lineTo(s * 0.35, s * 0.28);
      });
      break;
    case "gravityWell":
      stroke(() => ctx.arc(0, 0, s * 0.75, 0.4, Math.PI * 1.4));
      stroke(() => ctx.arc(0, 0, s * 0.42, Math.PI + 0.4, Math.PI * 2.4));
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      break;
    case "meteorRain":
      stroke(() => {
        ctx.moveTo(-s * 0.95, -s * 0.3);
        ctx.lineTo(-s * 0.2, -s * 0.05);
      });
      stroke(() => {
        ctx.moveTo(-s * 0.95, s * 0.3);
        ctx.lineTo(-s * 0.2, s * 0.05);
      });
      ctx.beginPath();
      ctx.arc(s * 0.35, 0, s * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fed7aa";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.45, 0, s * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      break;
    case "chainLightning":
      stroke(() => {
        ctx.moveTo(-s * 0.85, 0);
        ctx.lineTo(-s * 0.35, -s * 0.4);
        ctx.lineTo(s * 0.05, s * 0.35);
        ctx.lineTo(s * 0.45, -s * 0.35);
        ctx.lineTo(s * 0.9, 0);
      });
      break;
    case "novaPulse":
      stroke(() => ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2));
      stroke(() => ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2), col);
      break;
    case "orbitShield":
      stroke(() => ctx.arc(0, 0, s * 0.65, 0, Math.PI * 2));
      for (const a of [0, Math.PI]) {
        ctx.beginPath();
        ctx.arc(
          Math.cos(a) * s * 0.65,
          Math.sin(a) * s * 0.65,
          s * 0.26,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = col;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
      }
      break;
    case "bladeArc":
      stroke(() => {
        ctx.moveTo(-s * 0.55, 0);
        ctx.lineTo(s * 0.95, 0);
      });
      stroke(() => {
        ctx.moveTo(-s * 0.2, -s * 0.38);
        ctx.lineTo(-s * 0.2, s * 0.38);
      });
      break;
  }
  ctx.restore();
}
