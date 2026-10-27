// Phase 9 — richer multi-shape canvas composites, replacing Phase 8's
// single-primitive drawShape() calls per entity. Still pure Canvas drawing
// (circles/triangles/squares/lines, layered) — no external image assets,
// matching GAME-DESIGN.md's "Visual style" ("no external art assets...
// can be swapped for real sprite assets later without touching game
// logic"). engine.ts calls these from render(); simulation/collision code
// is entirely untouched by this file — it is rendering-only.
import type { EnemyKind, WeaponId } from "./engine";

export type Shape = "circle" | "square" | "diamond" | "bat" | "ghost" | "hood";

export const ENEMY_SHAPE: Record<EnemyKind, Shape> = {
  zombie: "circle",
  bat: "bat",
  skeleton: "square",
  ghost: "ghost",
  ogre: "square",
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

const OUTLINE = "#0f172a";

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

// Open path of connected points (mouths, brows).
function drawPolyline(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  width: number,
) {
  ctx.save();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  points.forEach(([px, py], i) => {
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.restore();
}

// White of the eye plus a dark pupil and a thin outline.
function drawEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  pupilDx = 0,
  pupilDy = 0,
) {
  drawDot(ctx, x, y, radius, "#ffffff", Math.max(1, radius * 0.4));
  drawDot(ctx, x + pupilDx, y + pupilDy, radius * 0.5, OUTLINE);
}

// Solid dark socket (skeleton, ghost, ogre-free faces).
function drawSocket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
) {
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Mixes a #rrggbb color toward white; used for the pale core of projectiles.
function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
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
) {
  radius *= PLAYER_SCALE;
  if (pose) {
    const feetY = y + radius;
    ctx.save();
    ctx.translate(x, feetY + pose.lift);
    ctx.rotate(pose.tilt);
    ctx.scale(pose.sx, pose.sy);
    ctx.translate(-x, -feetY);
    drawPlayer(
      ctx,
      x,
      y,
      radius / PLAYER_SCALE,
      color,
      facingAngle,
      hitFlashAlpha,
    );
    ctx.restore();
    return;
  }
  drawShape(ctx, "circle", x, y, radius, color, { flashAlpha: hitFlashAlpha });
  // Eyes look toward the last movement direction, so the player reads as
  // oriented even though the body itself is symmetric.
  const eyeR = radius * 0.24;
  const lookX = Math.cos(facingAngle) * eyeR * 0.45;
  const lookY = Math.sin(facingAngle) * eyeR * 0.45;
  drawEye(ctx, x - radius * 0.36, y - radius * 0.14, eyeR, lookX, lookY);
  drawEye(ctx, x + radius * 0.36, y - radius * 0.14, eyeR, lookX, lookY);
  ctx.save();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1.2, radius * 0.17);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.3, y + radius * 0.42);
  ctx.quadraticCurveTo(
    x,
    y + radius * 0.7,
    x + radius * 0.3,
    y + radius * 0.42,
  );
  ctx.stroke();
  ctx.restore();
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
    kind === "reaper" ? r * 2.6 : kind === "skeleton" ? r * 2 : r * 1.7;
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
  const r = radius * ENEMY_SCALE;
  const line = Math.max(1.2, r * 0.17);
  // Horns sit behind the body, so they're drawn first.
  if (kind === "ogre") {
    const horn = "#fed7aa";
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.fillStyle = horn;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = Math.max(1.5, r * 0.2);
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x + side * r * 0.75, y - r * 0.75);
      ctx.lineTo(x + side * r * 0.85, y - r * 1.4);
      ctx.lineTo(x + side * r * 0.3, y - r * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
  drawShape(ctx, ENEMY_SHAPE[kind], x, y, r, color, opts);
  if (opts.flashAlpha && opts.flashAlpha > 0.5) return; // fully whited-out — skip accents
  switch (kind) {
    case "zombie":
      drawEye(ctx, x - r * 0.3, y - r * 0.15, r * 0.25);
      drawEye(ctx, x + r * 0.3, y - r * 0.1, r * 0.18);
      drawPolyline(
        ctx,
        [
          [x - r * 0.4, y + r * 0.5],
          [x - r * 0.15, y + r * 0.35],
          [x + r * 0.1, y + r * 0.5],
          [x + r * 0.4, y + r * 0.35],
        ],
        line,
      );
      break;
    case "bat":
      drawDot(ctx, x, y - r * 0.05, r * 0.36, color, Math.max(1.2, r * 0.2));
      drawDot(ctx, x - r * 0.14, y - r * 0.05, r * 0.11, "#ffffff");
      drawDot(ctx, x + r * 0.14, y - r * 0.05, r * 0.11, "#ffffff");
      break;
    case "skeleton":
      drawSocket(ctx, x - r * 0.3, y - r * 0.15, r * 0.24, r * 0.24);
      drawSocket(ctx, x + r * 0.3, y - r * 0.15, r * 0.24, r * 0.24);
      drawLine(
        ctx,
        x - r * 0.35,
        y + r * 0.45,
        x + r * 0.35,
        y + r * 0.45,
        line,
      );
      drawLine(
        ctx,
        x - r * 0.12,
        y + r * 0.3,
        x - r * 0.12,
        y + r * 0.62,
        line,
      );
      drawLine(
        ctx,
        x + r * 0.12,
        y + r * 0.3,
        x + r * 0.12,
        y + r * 0.62,
        line,
      );
      break;
    case "ghost":
      drawSocket(ctx, x - r * 0.3, y - r * 0.3, r * 0.17, r * 0.25);
      drawSocket(ctx, x + r * 0.3, y - r * 0.3, r * 0.17, r * 0.25);
      drawSocket(ctx, x, y + r * 0.2, r * 0.17, r * 0.17);
      break;
    case "ogre":
      drawLine(
        ctx,
        x - r * 0.55,
        y - r * 0.28,
        x - r * 0.15,
        y - r * 0.1,
        line,
      );
      drawLine(
        ctx,
        x + r * 0.55,
        y - r * 0.28,
        x + r * 0.15,
        y - r * 0.1,
        line,
      );
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = Math.max(1, r * 0.1);
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(x + side * r * 0.2, y + r * 0.35);
        ctx.lineTo(x + side * r * 0.4, y + r * 0.75);
        ctx.lineTo(x + side * r * 0.6, y + r * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      break;
    case "reaper":
      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.1, r * 0.33, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      drawDot(ctx, x - r * 0.14, y + r * 0.08, r * 0.1, "#f0abfc");
      drawDot(ctx, x + r * 0.14, y + r * 0.08, r * 0.1, "#f0abfc");
      break;
    case "lich": {
      // Three-point crown above the diamond's top corner.
      ctx.save();
      ctx.fillStyle = "#fde047";
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = Math.max(1.2, r * 0.13);
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x - r * 0.3, y - r * 0.35);
      ctx.lineTo(x - r * 0.2, y - r * 0.7);
      ctx.lineTo(x, y - r * 0.5);
      ctx.lineTo(x + r * 0.2, y - r * 0.7);
      ctx.lineTo(x + r * 0.3, y - r * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      drawSocket(ctx, x - r * 0.25, y + r * 0.1, r * 0.14, r * 0.14);
      drawSocket(ctx, x + r * 0.25, y + r * 0.1, r * 0.14, r * 0.14);
      break;
    }
  }
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

// A tapered trail opposite the velocity vector behind a pale, outlined core:
// bright at the head, fading to nothing at the tail.
export function drawProjectile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  vx: number,
  vy: number,
) {
  const speed = Math.hypot(vx, vy);
  if (speed > 0) {
    const tailLen = radius * 5 + Math.min(speed, 400) * 0.04;
    const ux = vx / speed;
    const uy = vy / speed;
    const tx = x - ux * tailLen;
    const ty = y - uy * tailLen;
    ctx.save();
    ctx.lineCap = "round";
    const g = ctx.createLinearGradient(x, y, tx, ty);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = Math.max(2, radius * 1.5);
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.restore();
  }
  drawShape(ctx, "circle", x, y, radius, lighten(color, 0.75));
}

// Phase 11: a small radiating-line burst at a weapon-hit point — the
// "visible attacks" feedback layered on top of each weapon's existing
// swing/burst/ring effect (arcEffects/pulseEffects/orbitTrails in
// engine.ts), giving individual hits an impact even outside those. progress
// runs 0 (just spawned) to 1 (fully faded) — engine.ts owns the timing.
export function drawImpactBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
) {
  const alpha = Math.max(0, 1 - progress);
  if (alpha <= 0) return;
  const inner = 3 + progress * 2;
  const outer = 6 + progress * 8;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
    ctx.lineTo(x + Math.cos(a) * outer, y + Math.sin(a) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

export const WEAPON_COLOR: Record<WeaponId, string> = {
  bolt: "#facc15",
  homingDart: "#f472b6",
  chainLightning: "#67e8f9",
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
