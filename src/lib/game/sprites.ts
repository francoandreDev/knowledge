// Phase 9 — richer multi-shape canvas composites, replacing Phase 8's
// single-primitive drawShape() calls per entity. Still pure Canvas drawing
// (circles/triangles/squares/lines, layered) — no external image assets,
// matching GAME-DESIGN.md's "Visual style" ("no external art assets...
// can be swapped for real sprite assets later without touching game
// logic"). engine.ts calls these from render(); simulation/collision code
// is entirely untouched by this file — it is rendering-only.
import type { EnemyKind } from "./engine";

export type Shape = "circle" | "triangle" | "square" | "diamond";

export const ENEMY_SHAPE: Record<EnemyKind, Shape> = {
  zombie: "circle",
  bat: "triangle",
  skeleton: "square",
  ghost: "circle",
  ogre: "square",
  reaper: "circle",
};

interface ShapeOptions {
  glow?: boolean;
  glowColor?: string;
}

// Draws a filled, outlined base shape, with an optional glow (shadowBlur).
// Glow is opt-in per call site — see engine.ts's Phase 8 header note on why
// it's reserved for the player/boss/elites only (perf at up to 60 alive).
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
  if (opts.glow) {
    ctx.shadowColor = opts.glowColor ?? color;
    ctx.shadowBlur = radius * 1.1;
  }
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = Math.max(1, radius * 0.14);
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  } else if (shape === "square") {
    ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
  } else if (shape === "diamond") {
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x + radius, y);
    ctx.lineTo(x, y + radius);
    ctx.lineTo(x - radius, y);
    ctx.closePath();
  } else {
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
      const px = x + Math.cos(a) * radius;
      const py = y + Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Small filled dot, no outline/glow — cheap detail primitive (eyes, etc.).
function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

const DARK = "rgba(15,23,42,0.85)";

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  facingAngle: number,
  glow: boolean,
) {
  drawShape(ctx, "circle", x, y, radius, color, { glow, glowColor: color });
  // Facing nub — a small bright dot toward the last movement direction, so
  // the player reads as oriented even though the body itself is symmetric.
  const nx = x + Math.cos(facingAngle) * radius * 0.85;
  const ny = y + Math.sin(facingAngle) * radius * 0.85;
  drawDot(ctx, nx, ny, radius * 0.28, "rgba(255,255,255,0.9)");
}

// Per-kind accent details layered on top of the base shape — deliberately
// simple (dots/lines/a second shape), not facing-dependent for enemies
// (kept cheap; only the player tracks a facing angle).
export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  kind: EnemyKind,
  x: number,
  y: number,
  radius: number,
  color: string,
  opts: ShapeOptions = {},
) {
  drawShape(ctx, ENEMY_SHAPE[kind], x, y, radius, color, opts);
  const eyeR = Math.max(1, radius * 0.14);
  switch (kind) {
    case "zombie":
      drawDot(ctx, x - radius * 0.3, y - radius * 0.15, eyeR, DARK);
      drawDot(ctx, x + radius * 0.3, y - radius * 0.15, eyeR, DARK);
      drawLine(
        ctx,
        x - radius * 0.3,
        y + radius * 0.35,
        x + radius * 0.3,
        y + radius * 0.28,
        DARK,
        Math.max(1, radius * 0.08),
      );
      break;
    case "bat": {
      const wingR = radius * 0.65;
      drawShape(ctx, "triangle", x - radius * 0.85, y, wingR, color);
      drawShape(ctx, "triangle", x + radius * 0.85, y, wingR, color);
      drawDot(ctx, x - radius * 0.18, y - radius * 0.05, eyeR, DARK);
      drawDot(ctx, x + radius * 0.18, y - radius * 0.05, eyeR, DARK);
      break;
    }
    case "skeleton":
      drawDot(ctx, x - radius * 0.3, y - radius * 0.2, eyeR, DARK);
      drawDot(ctx, x + radius * 0.3, y - radius * 0.2, eyeR, DARK);
      drawLine(
        ctx,
        x,
        y - radius * 0.4,
        x,
        y + radius * 0.5,
        DARK,
        Math.max(1, radius * 0.06),
      );
      drawLine(
        ctx,
        x - radius * 0.35,
        y + radius * 0.05,
        x + radius * 0.35,
        y + radius * 0.05,
        DARK,
        Math.max(1, radius * 0.06),
      );
      break;
    case "ghost":
      drawDot(ctx, x - radius * 0.3, y - radius * 0.1, eyeR, DARK);
      drawDot(ctx, x + radius * 0.3, y - radius * 0.1, eyeR, DARK);
      break;
    case "ogre":
      drawLine(
        ctx,
        x - radius * 0.4,
        y - radius * 0.3,
        x + radius * 0.4,
        y - radius * 0.3,
        DARK,
        Math.max(2, radius * 0.1),
      );
      drawDot(ctx, x - radius * 0.25, y - radius * 0.05, eyeR * 1.3, DARK);
      drawDot(ctx, x + radius * 0.25, y - radius * 0.05, eyeR * 1.3, DARK);
      break;
    case "reaper": {
      ctx.save();
      ctx.fillStyle = "rgba(15,23,42,0.55)";
      ctx.beginPath();
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x - radius * 0.75, y + radius * 0.15);
      ctx.lineTo(x + radius * 0.75, y + radius * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      const glowEye = "rgba(250,204,21,0.9)";
      drawDot(ctx, x - radius * 0.22, y - radius * 0.15, eyeR * 1.4, glowEye);
      drawDot(ctx, x + radius * 0.22, y - radius * 0.15, eyeR * 1.4, glowEye);
      break;
    }
  }
}

export function drawGem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  drawShape(ctx, "diamond", x, y, radius, color);
  drawLine(
    ctx,
    x - radius * 0.4,
    y,
    x + radius * 0.4,
    y,
    "rgba(255,255,255,0.55)",
    1,
  );
}

export function drawCoin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  drawShape(ctx, "circle", x, y, radius, color);
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// A short fading trail opposite the velocity vector, drawn behind the
// projectile's body — makes fast bolts/darts read as moving, not just
// teleporting frame to frame.
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
    const tailLen = radius * 2.4;
    const tx = x - (vx / speed) * tailLen;
    const ty = y - (vy / speed) * tailLen;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, radius);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.restore();
  }
  drawShape(ctx, "circle", x, y, radius, color);
}
