// Character art for the hero and every enemy: each one is built from a few
// inked parts (head, torso, limbs, gear) instead of one tinted blob, so a
// silhouette says what it is before its face does. Pure canvas drawing — the
// simulation never reads anything from here.
import type { EnemyKind } from "./engine";

export const OUTLINE = "#0f172a";

type RGB = [number, number, number];

function parse(c: string): RGB {
  if (c[0] === "#") {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // Veteran tiers hand us "rgb(r, g, b)".
  const m = c.match(/\d+(\.\d+)?/g);
  return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
}

/** Mixes a colour (hex or rgb()) toward white. */
export function lighten(c: string, amount: number): string {
  const [r, g, b] = parse(c);
  const mix = (v: number) => Math.round(v + (255 - v) * amount);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

/** Mixes a colour (hex or rgb()) toward black. */
export function darken(c: string, amount: number): string {
  const [r, g, b] = parse(c);
  const mix = (v: number) => Math.round(v * (1 - amount));
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

// How whited-out the figure being drawn is (the "just got hit" flash).
let flash = 0;
// Outline width of the figure being drawn.
let lw = 2;

type Ctx = CanvasRenderingContext2D;

/** One inked part: fill, outline, and the hit-flash overlay on the same path. */
function part(ctx: Ctx, trace: () => void, fill: string, width = lw) {
  ctx.beginPath();
  trace();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = width;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  if (flash > 0) {
    ctx.save();
    ctx.globalAlpha = flash;
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
  }
}

function dot(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  part(ctx, () => ctx.arc(x, y, r, 0, Math.PI * 2), fill);
}

function ell(
  ctx: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
  rot = 0,
) {
  part(ctx, () => ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2), fill);
}

function rr(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number,
  fill: string,
) {
  part(ctx, () => ctx.roundRect(x, y, w, h, rad), fill);
}

function poly(ctx: Ctx, pts: [number, number][], fill: string) {
  part(
    ctx,
    () => {
      pts.forEach(([px, py], i) =>
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py),
      );
      ctx.closePath();
    },
    fill,
  );
}

/** A limb: an inked stroke with a coloured core. */
function limb(
  ctx: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w: number,
  fill: string,
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = w + lw * 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.lineWidth = w;
  ctx.strokeStyle = fill;
  ctx.stroke();
  if (flash > 0) {
    ctx.globalAlpha = flash;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  }
  ctx.restore();
}

function ink(ctx: Ctx, pts: [number, number][], width = lw) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = width;
  ctx.beginPath();
  pts.forEach(([px, py], i) =>
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py),
  );
  ctx.stroke();
  ctx.restore();
}

function inkDot(ctx: Ctx, x: number, y: number, r: number, fill = OUTLINE) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Face details are skipped while the figure is mostly white from a hit. */
function face(fn: () => void) {
  if (flash <= 0.5) fn();
}

function shadow(ctx: Ctx, r: number, wide = 0.85, drop = 1) {
  ctx.fillStyle = "rgba(15,23,42,0.32)";
  ctx.beginPath();
  ctx.ellipse(0, r * drop, r * wide, r * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
}

function eye(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  lookX = 0,
  lookY = 0,
  iris = OUTLINE,
) {
  inkDot(ctx, x, y, r + lw * 0.55);
  inkDot(ctx, x, y, r, "#ffffff");
  inkDot(ctx, x + lookX, y + lookY, r * 0.58, iris);
  inkDot(ctx, x + lookX - r * 0.18, y + lookY - r * 0.2, r * 0.18, "#ffffff");
}

// --- The hero ------------------------------------------------------------

/** The hero: a capped scout with a trailing scarf. The cap takes the team
 * colour, so the duel's two fighters stay apart at a glance. */
export function drawHeroArt(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  color: string,
  facing: number,
  flashAlpha: number,
  t: number,
) {
  flash = flashAlpha;
  lw = Math.max(1.5, r * 0.12);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const dark = darken(color, 0.42);
  const skin = "#fcd9b6";
  const fx = Math.cos(facing);
  const fy = Math.sin(facing);
  const behind = fx >= 0 ? -1 : 1;
  const flutter = Math.sin(t * 0.009) * r * 0.1;
  shadow(ctx, r);

  // Scarf tail streams behind the direction of travel.
  poly(
    ctx,
    [
      [behind * 0.25 * r, 0.2 * r],
      [behind * 1.05 * r, 0.12 * r + flutter],
      [behind * 0.82 * r, 0.36 * r + flutter],
      [behind * 1.0 * r, 0.52 * r + flutter],
      [behind * 0.3 * r, 0.42 * r],
    ],
    "#fb7185",
  );
  // Boots and legs.
  for (const s of [-1, 1]) {
    rr(
      ctx,
      s * 0.34 * r - 0.14 * r,
      0.7 * r,
      0.28 * r,
      0.22 * r,
      0.08 * r,
      dark,
    );
    ell(
      ctx,
      s * 0.34 * r + s * 0.04 * r,
      0.9 * r,
      0.27 * r,
      0.14 * r,
      "#475569",
    );
  }
  // Tunic.
  rr(ctx, -0.5 * r, 0.14 * r, 1.0 * r, 0.64 * r, 0.22 * r, color);
  rr(ctx, -0.5 * r, 0.56 * r, 1.0 * r, 0.13 * r, 0.04 * r, dark);
  rr(ctx, -0.1 * r, 0.54 * r, 0.2 * r, 0.17 * r, 0.04 * r, "#fde047");
  face(() => {
    // A small star on the chest.
    ctx.fillStyle = "#fef9c3";
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = (i % 2 ? 0.07 : 0.16) * r;
      ctx.lineTo(Math.cos(a) * rad, 0.34 * r + Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1, lw * 0.6);
    ctx.stroke();
  });
  // Arms, hands pointing the way they're facing a little.
  for (const s of [-1, 1]) {
    limb(
      ctx,
      s * 0.5 * r,
      0.28 * r,
      s * 0.68 * r + fx * 0.06 * r,
      0.6 * r + fy * 0.06 * r,
      0.2 * r,
      color,
    );
    dot(
      ctx,
      s * 0.68 * r + fx * 0.06 * r,
      0.64 * r + fy * 0.06 * r,
      0.14 * r,
      skin,
    );
  }
  // Head.
  dot(ctx, 0, -0.3 * r, 0.76 * r, skin);
  // Cap with a fringe and a pompom.
  part(
    ctx,
    () => {
      ctx.moveTo(-0.76 * r, -0.3 * r);
      ctx.arc(0, -0.3 * r, 0.76 * r, Math.PI, 0);
      ctx.quadraticCurveTo(0.3 * r, -0.36 * r, 0, -0.18 * r);
      ctx.quadraticCurveTo(-0.3 * r, -0.36 * r, -0.76 * r, -0.3 * r);
    },
    color,
  );
  dot(ctx, 0, -1.12 * r, 0.2 * r, "#fde047");
  face(() => {
    // Cap stripe.
    ink(
      ctx,
      [
        [-0.5 * r, -0.62 * r],
        [0, -0.72 * r],
        [0.5 * r, -0.62 * r],
      ],
      Math.max(1, lw * 0.7),
    );
    const look = r * 0.07;
    eye(ctx, -0.3 * r, -0.1 * r, 0.2 * r, fx * look, fy * look);
    eye(ctx, 0.3 * r, -0.1 * r, 0.2 * r, fx * look, fy * look);
    ctx.fillStyle = "rgba(251,113,133,0.55)";
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s * 0.5 * r, 0.1 * r, 0.12 * r, 0.07 * r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1.2, lw * 0.8);
    ctx.beginPath();
    ctx.moveTo(-0.16 * r, 0.12 * r);
    ctx.quadraticCurveTo(0, 0.3 * r, 0.16 * r, 0.12 * r);
    ctx.stroke();
  });
  ctx.restore();
}

// --- Enemies -------------------------------------------------------------

function zombie(ctx: Ctx, r: number, color: string) {
  const dark = darken(color, 0.4);
  const shirt = "#7c6f64";
  shadow(ctx, r);
  for (const s of [-1, 1]) {
    rr(ctx, s * 0.32 * r - 0.15 * r, 0.62 * r, 0.3 * r, 0.3 * r, 0.1 * r, dark);
    ell(
      ctx,
      s * 0.32 * r + s * 0.03 * r,
      0.92 * r,
      0.25 * r,
      0.12 * r,
      "#44403c",
    );
  }
  // Arms reach out in front.
  for (const s of [-1, 1]) {
    limb(ctx, s * 0.46 * r, 0.3 * r, s * 0.9 * r, 0.02 * r, 0.24 * r, color);
    dot(ctx, s * 0.92 * r, 0.0, 0.17 * r, color);
  }
  // Torn shirt.
  poly(
    ctx,
    [
      [-0.5 * r, 0.1 * r],
      [0.5 * r, 0.1 * r],
      [0.6 * r, 0.8 * r],
      [0.4 * r, 0.66 * r],
      [0.22 * r, 0.84 * r],
      [0.0, 0.68 * r],
      [-0.2 * r, 0.86 * r],
      [-0.4 * r, 0.68 * r],
      [-0.6 * r, 0.8 * r],
    ],
    shirt,
  );
  face(() => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0.16 * r, 0.42 * r, 0.16 * r, 0.12 * r, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ink(
      ctx,
      [
        [-0.3 * r, 0.3 * r],
        [-0.1 * r, 0.5 * r],
      ],
      Math.max(1, lw * 0.6),
    );
  });
  dot(ctx, 0, -0.3 * r, 0.7 * r, color);
  // Patchy hair.
  for (const [hx, hy, hs] of [
    [-0.42, -0.92, 0.2],
    [0.05, -1.05, 0.24],
    [0.45, -0.88, 0.18],
  ] as const) {
    poly(
      ctx,
      [
        [(hx - hs) * r, (hy + hs) * r],
        [hx * r, (hy - hs * 0.6) * r],
        [(hx + hs) * r, (hy + hs) * r],
      ],
      dark,
    );
  }
  dot(ctx, 0, -0.3 * r, 0.7 * r, color);
  face(() => {
    // Stitched forehead scar.
    ink(
      ctx,
      [
        [-0.5 * r, -0.62 * r],
        [-0.05 * r, -0.55 * r],
      ],
      Math.max(1, lw * 0.7),
    );
    for (const sx of [-0.4, -0.25, -0.1]) {
      ink(
        ctx,
        [
          [sx * r, -0.68 * r],
          [(sx + 0.03) * r, -0.5 * r],
        ],
        Math.max(1, lw * 0.6),
      );
    }
    eye(ctx, -0.3 * r, -0.3 * r, 0.24 * r, 0.04 * r, 0.04 * r, "#b91c1c");
    eye(ctx, 0.32 * r, -0.26 * r, 0.16 * r, -0.02 * r, 0.02 * r);
    ink(
      ctx,
      [
        [-0.55 * r, -0.62 * r],
        [-0.1 * r, -0.5 * r],
      ],
      Math.max(1.2, lw * 0.9),
    );
    // Gaping mouth with a few teeth.
    ell(ctx, 0, 0.0, 0.3 * r, 0.18 * r, OUTLINE);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(-0.2 * r, -0.17 * r, 0.12 * r, 0.12 * r);
    ctx.fillRect(0.06 * r, -0.17 * r, 0.12 * r, 0.12 * r);
    inkDot(ctx, 0.05 * r, 0.1 * r, 0.1 * r, "#fb7185");
  });
}

function bat(ctx: Ctx, r: number, color: string, t: number) {
  const flap = Math.sin(t * 0.022);
  const membrane = darken(color, 0.25);
  shadow(ctx, r, 0.55, 1.15);
  for (const s of [-1, 1]) {
    const tipX = s * 1.7 * r;
    const tipY = -0.7 * r - flap * 0.6 * r;
    const lowY = 0.35 * r - flap * 0.2 * r;
    part(
      ctx,
      () => {
        ctx.moveTo(s * 0.2 * r, -0.15 * r);
        ctx.quadraticCurveTo(
          s * 0.8 * r,
          -0.95 * r - flap * 0.4 * r,
          tipX,
          tipY,
        );
        // Scalloped trailing edge.
        ctx.quadraticCurveTo(
          s * 1.15 * r,
          lowY - 0.2 * r,
          s * 0.95 * r,
          lowY + 0.1 * r,
        );
        ctx.quadraticCurveTo(
          s * 0.75 * r,
          lowY - 0.18 * r,
          s * 0.55 * r,
          lowY + 0.22 * r,
        );
        ctx.quadraticCurveTo(s * 0.4 * r, lowY, s * 0.2 * r, 0.3 * r);
        ctx.closePath();
      },
      membrane,
    );
    face(() => {
      for (const k of [0.45, 0.8]) {
        ink(
          ctx,
          [
            [s * 0.25 * r, -0.05 * r],
            [s * k * 1.2 * r, (tipY * 0.6 + lowY * 0.4) * (k > 0.6 ? 1 : 0.8)],
          ],
          Math.max(1, lw * 0.55),
        );
      }
    });
  }
  // Ears.
  for (const s of [-1, 1]) {
    poly(
      ctx,
      [
        [s * 0.12 * r, -0.62 * r],
        [s * 0.3 * r, -1.1 * r],
        [s * 0.5 * r, -0.55 * r],
      ],
      color,
    );
  }
  ell(ctx, 0, 0.02 * r, 0.46 * r, 0.54 * r, color);
  face(() => {
    ctx.fillStyle = lighten(color, 0.55);
    ctx.beginPath();
    ctx.ellipse(0, 0.2 * r, 0.26 * r, 0.3 * r, 0, 0, Math.PI * 2);
    ctx.fill();
    eye(ctx, -0.2 * r, -0.2 * r, 0.14 * r, 0, 0.02 * r, "#dc2626");
    eye(ctx, 0.2 * r, -0.2 * r, 0.14 * r, 0, 0.02 * r, "#dc2626");
    for (const s of [-1, 1]) {
      poly(
        ctx,
        [
          [s * 0.14 * r, 0.04 * r],
          [s * 0.05 * r, 0.04 * r],
          [s * 0.1 * r, 0.22 * r],
        ],
        "#ffffff",
      );
    }
  });
}

function skeleton(ctx: Ctx, r: number, color: string) {
  const bone = color;
  shadow(ctx, r);
  for (const s of [-1, 1]) {
    limb(ctx, s * 0.2 * r, 0.6 * r, s * 0.26 * r, 0.88 * r, 0.14 * r, bone);
    ell(ctx, s * 0.3 * r, 0.93 * r, 0.22 * r, 0.1 * r, bone);
  }
  ell(ctx, 0, 0.62 * r, 0.34 * r, 0.13 * r, bone);
  // Ribcage.
  rr(ctx, -0.42 * r, 0.1 * r, 0.84 * r, 0.52 * r, 0.22 * r, bone);
  face(() => {
    for (const ry of [0.24, 0.37, 0.5]) {
      ink(
        ctx,
        [
          [-0.3 * r, ry * r],
          [0.3 * r, ry * r],
        ],
        Math.max(1, lw * 0.7),
      );
    }
    ink(
      ctx,
      [
        [0, 0.12 * r],
        [0, 0.6 * r],
      ],
      Math.max(1, lw * 0.7),
    );
  });
  for (const s of [-1, 1]) {
    limb(ctx, s * 0.42 * r, 0.2 * r, s * 0.72 * r, 0.52 * r, 0.14 * r, bone);
    dot(ctx, s * 0.74 * r, 0.56 * r, 0.12 * r, bone);
  }
  // Jaw, then skull.
  rr(ctx, -0.38 * r, -0.04 * r, 0.76 * r, 0.3 * r, 0.1 * r, bone);
  face(() => {
    for (const tx of [-0.2, 0, 0.2]) {
      ink(
        ctx,
        [
          [tx * r, 0.0],
          [tx * r, 0.2 * r],
        ],
        Math.max(1, lw * 0.6),
      );
    }
  });
  dot(ctx, 0, -0.38 * r, 0.7 * r, bone);
  // A dented, rusted cap.
  part(
    ctx,
    () => {
      ctx.moveTo(-0.72 * r, -0.5 * r);
      ctx.arc(0, -0.5 * r, 0.72 * r, Math.PI, 0);
      ctx.lineTo(0.72 * r, -0.5 * r);
      ctx.closePath();
    },
    "#94a3b8",
  );
  face(() => {
    ink(
      ctx,
      [
        [-0.72 * r, -0.5 * r],
        [0.72 * r, -0.5 * r],
      ],
      Math.max(1.4, lw * 1.1),
    );
    inkDot(ctx, -0.35 * r, -0.78 * r, 0.06 * r, "#e2e8f0");
    inkDot(ctx, 0.35 * r, -0.78 * r, 0.06 * r, "#e2e8f0");
    ink(
      ctx,
      [
        [0.1 * r, -1.2 * r],
        [0.2 * r, -1.0 * r],
        [0.12 * r, -0.85 * r],
      ],
      Math.max(1, lw * 0.6),
    );
    for (const s of [-1, 1]) {
      ell(ctx, s * 0.27 * r, -0.28 * r, 0.21 * r, 0.24 * r, OUTLINE);
      inkDot(ctx, s * 0.27 * r, -0.26 * r, 0.07 * r, "#ef4444");
    }
    poly(
      ctx,
      [
        [0, -0.14 * r],
        [-0.08 * r, 0.0],
        [0.08 * r, 0.0],
      ],
      OUTLINE,
    );
  });
}

function ghost(ctx: Ctx, r: number, color: string, t: number) {
  const sway = Math.sin(t * 0.006) * r * 0.1;
  shadow(ctx, r, 0.6, 1.05);
  ctx.save();
  ctx.globalAlpha = 0.92;
  part(
    ctx,
    () => {
      ctx.moveTo(-0.8 * r, 0.8 * r);
      ctx.lineTo(-0.8 * r, -0.25 * r);
      ctx.arc(0, -0.25 * r, 0.8 * r, Math.PI, 0);
      ctx.lineTo(0.8 * r, 0.8 * r);
      // Ragged, swaying hem.
      for (let i = 0; i < 4; i++) {
        const x0 = 0.8 * r - i * 0.4 * r;
        const bulge = (i % 2 ? 1 : -1) * sway;
        ctx.quadraticCurveTo(
          x0 - 0.2 * r,
          1.15 * r + bulge,
          x0 - 0.4 * r,
          0.8 * r,
        );
      }
      ctx.closePath();
    },
    color,
  );
  ctx.restore();
  face(() => {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.ellipse(-0.3 * r, -0.62 * r, 0.22 * r, 0.12 * r, -0.5, 0, Math.PI * 2);
    ctx.fill();
  });
  // Stubby arms.
  for (const s of [-1, 1]) {
    ell(
      ctx,
      s * 0.86 * r,
      0.22 * r + sway * s,
      0.2 * r,
      0.3 * r,
      color,
      s * 0.5,
    );
  }
  face(() => {
    for (const s of [-1, 1]) {
      ell(ctx, s * 0.3 * r, -0.3 * r, 0.17 * r, 0.26 * r, OUTLINE);
      inkDot(ctx, s * 0.27 * r, -0.4 * r, 0.06 * r, "#ffffff");
    }
    ctx.fillStyle = "rgba(251,113,133,0.45)";
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(
        s * 0.52 * r,
        0.02 * r,
        0.14 * r,
        0.08 * r,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ell(ctx, 0, 0.16 * r, 0.14 * r, 0.2 * r, OUTLINE);
  });
}

function ogre(ctx: Ctx, r: number, color: string) {
  const dark = darken(color, 0.38);
  shadow(ctx, r, 1.0);
  // Horns sit behind the head.
  for (const s of [-1, 1]) {
    poly(
      ctx,
      [
        [s * 0.3 * r, -0.85 * r],
        [s * 0.62 * r, -1.35 * r],
        [s * 0.7 * r, -0.7 * r],
      ],
      "#fde68a",
    );
  }
  for (const s of [-1, 1]) {
    rr(
      ctx,
      s * 0.42 * r - 0.22 * r,
      0.62 * r,
      0.44 * r,
      0.34 * r,
      0.12 * r,
      dark,
    );
  }
  // Big arms and fists.
  for (const s of [-1, 1]) {
    limb(ctx, s * 0.72 * r, 0.1 * r, s * 0.98 * r, 0.52 * r, 0.42 * r, color);
    dot(ctx, s * 0.98 * r, 0.62 * r, 0.3 * r, color);
    face(() => {
      for (const k of [-0.1, 0.1]) {
        inkDot(ctx, s * 0.9 * r + k * r, 0.5 * r, 0.04 * r, "#fde68a");
      }
      inkDot(ctx, s * 0.98 * r, 0.42 * r, 0.04 * r, "#fde68a");
    });
  }
  // Belly and loincloth.
  rr(ctx, -0.8 * r, -0.05 * r, 1.6 * r, 0.95 * r, 0.4 * r, color);
  face(() => {
    ctx.fillStyle = lighten(color, 0.3);
    ctx.beginPath();
    ctx.ellipse(0, 0.28 * r, 0.5 * r, 0.32 * r, 0, 0, Math.PI * 2);
    ctx.fill();
    // Warts.
    inkDot(ctx, -0.6 * r, 0.18 * r, 0.05 * r, dark);
    inkDot(ctx, 0.62 * r, 0.3 * r, 0.06 * r, dark);
  });
  poly(
    ctx,
    [
      [-0.55 * r, 0.52 * r],
      [0.55 * r, 0.52 * r],
      [0.4 * r, 0.98 * r],
      [0, 0.84 * r],
      [-0.4 * r, 0.98 * r],
    ],
    "#92400e",
  );
  rr(ctx, -0.82 * r, 0.46 * r, 1.64 * r, 0.14 * r, 0.05 * r, "#451a03");
  dot(ctx, 0, 0.53 * r, 0.14 * r, "#fde047");
  // Small head with a heavy brow and tusks.
  dot(ctx, 0, -0.5 * r, 0.56 * r, color);
  face(() => {
    for (const s of [-1, 1]) {
      ink(
        ctx,
        [
          [s * 0.5 * r, -0.78 * r],
          [s * 0.1 * r, -0.58 * r],
        ],
        Math.max(2, lw * 1.5),
      );
      eye(ctx, s * 0.26 * r, -0.5 * r, 0.1 * r, 0, 0.01 * r, "#b91c1c");
    }
    ell(ctx, 0, -0.18 * r, 0.32 * r, 0.14 * r, dark);
    inkDot(ctx, -0.07 * r, -0.28 * r, 0.04 * r);
    inkDot(ctx, 0.07 * r, -0.28 * r, 0.04 * r);
    for (const s of [-1, 1]) {
      poly(
        ctx,
        [
          [s * 0.12 * r, -0.2 * r],
          [s * 0.28 * r, -0.2 * r],
          [s * 0.22 * r, -0.52 * r],
        ],
        "#fef9c3",
      );
    }
  });
}

function slime(ctx: Ctx, r: number, color: string, t: number) {
  const wob = Math.sin(t * 0.008) * r * 0.05;
  const hi = lighten(color, 0.5);
  shadow(ctx, r, 0.95);
  part(
    ctx,
    () => {
      ctx.moveTo(-0.95 * r, 0.9 * r);
      ctx.bezierCurveTo(
        -1.05 * r,
        -0.2 * r,
        -0.55 * r,
        -0.95 * r + wob,
        0,
        -0.95 * r + wob,
      );
      ctx.bezierCurveTo(
        0.55 * r,
        -0.95 * r + wob,
        1.05 * r,
        -0.2 * r,
        0.95 * r,
        0.9 * r,
      );
      ctx.quadraticCurveTo(0.5 * r, 1.0 * r, 0, 0.92 * r);
      ctx.quadraticCurveTo(-0.5 * r, 1.0 * r, -0.95 * r, 0.9 * r);
      ctx.closePath();
    },
    color,
  );
  face(() => {
    ctx.fillStyle = hi;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(-0.45 * r, -0.5 * r, 0.22 * r, 0.12 * r, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Bubbles suspended inside.
    inkDot(ctx, 0.5 * r, 0.45 * r, 0.1 * r, hi);
    inkDot(ctx, 0.3 * r, 0.7 * r, 0.06 * r, hi);
    eye(ctx, -0.3 * r, -0.12 * r, 0.22 * r, 0.04 * r, 0.04 * r);
    eye(ctx, 0.3 * r, -0.12 * r, 0.22 * r, 0.04 * r, 0.04 * r);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1.2, lw * 0.9);
    ctx.beginPath();
    ctx.moveTo(-0.3 * r, 0.28 * r);
    ctx.quadraticCurveTo(0, 0.55 * r, 0.3 * r, 0.28 * r);
    ctx.stroke();
  });
}

function imp(ctx: Ctx, r: number, color: string, t: number) {
  const dark = darken(color, 0.4);
  const flap = Math.sin(t * 0.02);
  shadow(ctx, r, 0.7, 1.05);
  // Pointed tail with an arrowhead.
  part(
    ctx,
    () => {
      ctx.moveTo(0.2 * r, 0.6 * r);
      ctx.quadraticCurveTo(1.1 * r, 0.7 * r, 0.95 * r, 0.1 * r);
      ctx.lineTo(1.15 * r, 0.2 * r);
      ctx.lineTo(1.0 * r, -0.15 * r);
      ctx.lineTo(0.78 * r, 0.1 * r);
      ctx.quadraticCurveTo(0.85 * r, 0.5 * r, 0.1 * r, 0.45 * r);
      ctx.closePath();
    },
    dark,
  );
  for (const s of [-1, 1]) {
    part(
      ctx,
      () => {
        ctx.moveTo(s * 0.25 * r, 0.0);
        ctx.quadraticCurveTo(
          s * 1.0 * r,
          -0.9 * r - flap * 0.3 * r,
          s * 1.15 * r,
          -0.4 * r - flap * 0.3 * r,
        );
        ctx.lineTo(s * 0.8 * r, -0.15 * r);
        ctx.lineTo(s * 0.9 * r, 0.2 * r);
        ctx.lineTo(s * 0.45 * r, 0.15 * r);
        ctx.closePath();
      },
      dark,
    );
  }
  ell(ctx, 0, 0.32 * r, 0.4 * r, 0.45 * r, color);
  for (const s of [-1, 1]) {
    limb(ctx, s * 0.12 * r, 0.62 * r, s * 0.24 * r, 0.92 * r, 0.16 * r, color);
  }
  face(() => {
    ctx.fillStyle = lighten(color, 0.45);
    ctx.beginPath();
    ctx.ellipse(0, 0.4 * r, 0.22 * r, 0.28 * r, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  // Head with horns.
  for (const s of [-1, 1]) {
    poly(
      ctx,
      [
        [s * 0.22 * r, -0.6 * r],
        [s * 0.5 * r, -1.15 * r],
        [s * 0.55 * r, -0.5 * r],
      ],
      "#fde68a",
    );
  }
  dot(ctx, 0, -0.3 * r, 0.62 * r, color);
  face(() => {
    for (const s of [-1, 1]) {
      eye(ctx, s * 0.25 * r, -0.36 * r, 0.16 * r, 0, 0.02 * r, "#f59e0b");
      ink(
        ctx,
        [
          [s * 0.42 * r, -0.62 * r],
          [s * 0.08 * r, -0.5 * r],
        ],
        Math.max(1.2, lw),
      );
    }
    // A wide fanged grin.
    part(
      ctx,
      () => {
        ctx.moveTo(-0.3 * r, -0.04 * r);
        ctx.quadraticCurveTo(0, 0.28 * r, 0.3 * r, -0.04 * r);
        ctx.closePath();
      },
      OUTLINE,
      Math.max(1, lw * 0.6),
    );
    for (const s of [-1, 1]) {
      poly(
        ctx,
        [
          [s * 0.18 * r, -0.03 * r],
          [s * 0.08 * r, -0.03 * r],
          [s * 0.13 * r, 0.1 * r],
        ],
        "#ffffff",
      );
    }
  });
}

function bomber(ctx: Ctx, r: number, color: string, t: number) {
  shadow(ctx, r, 0.85);
  for (const s of [-1, 1]) {
    limb(ctx, s * 0.3 * r, 0.7 * r, s * 0.36 * r, 0.95 * r, 0.2 * r, "#334155");
  }
  // The bomb: a heavy black sphere with a hazard band.
  dot(ctx, 0, 0.05 * r, 0.9 * r, "#1e293b");
  face(() => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0.05 * r, 0.9 * r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.fillRect(-r, 0.28 * r, 2 * r, 0.22 * r);
    ctx.restore();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1, lw * 0.7);
    ctx.beginPath();
    ctx.moveTo(-0.9 * r, 0.28 * r);
    ctx.lineTo(0.9 * r, 0.28 * r);
    ctx.moveTo(-0.9 * r, 0.5 * r);
    ctx.lineTo(0.9 * r, 0.5 * r);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(-0.4 * r, -0.4 * r, 0.2 * r, 0.12 * r, -0.7, 0, Math.PI * 2);
    ctx.fill();
  });
  // Cap and fuse.
  rr(ctx, -0.2 * r, -1.0 * r, 0.4 * r, 0.22 * r, 0.06 * r, "#475569");
  const flicker = 0.7 + 0.3 * Math.sin(t * 0.04);
  ink(
    ctx,
    [
      [0, -1.0 * r],
      [0.15 * r, -1.25 * r],
      [0.35 * r, -1.28 * r],
    ],
    Math.max(1.4, lw),
  );
  face(() => {
    ctx.save();
    ctx.shadowColor = "#fde047";
    ctx.shadowBlur = r * 0.4;
    inkDot(ctx, 0.38 * r, -1.3 * r, 0.14 * r * flicker, "#fef08a");
    ctx.restore();
    for (const s of [-1, 1]) {
      eye(ctx, s * 0.3 * r, -0.2 * r, 0.2 * r, 0, 0.03 * r, "#dc2626");
      ink(
        ctx,
        [
          [s * 0.52 * r, -0.5 * r],
          [s * 0.1 * r, -0.34 * r],
        ],
        Math.max(1.4, lw * 1.1),
      );
    }
    ink(
      ctx,
      [
        [-0.22 * r, 0.12 * r],
        [0, 0.04 * r],
        [0.22 * r, 0.12 * r],
      ],
      Math.max(1.2, lw),
    );
  });
}

function knight(ctx: Ctx, r: number, color: string) {
  const dark = darken(color, 0.35);
  shadow(ctx, r, 1.0);
  for (const s of [-1, 1]) {
    rr(ctx, s * 0.36 * r - 0.2 * r, 0.62 * r, 0.4 * r, 0.34 * r, 0.1 * r, dark);
  }
  // Cuirass, belt and tabard.
  rr(ctx, -0.65 * r, 0.0, 1.3 * r, 0.8 * r, 0.22 * r, color);
  rr(ctx, -0.65 * r, 0.56 * r, 1.3 * r, 0.14 * r, 0.04 * r, "#475569");
  poly(
    ctx,
    [
      [-0.22 * r, 0.7 * r],
      [0.22 * r, 0.7 * r],
      [0.16 * r, 1.0 * r],
      [-0.16 * r, 1.0 * r],
    ],
    "#b91c1c",
  );
  face(() => {
    ink(
      ctx,
      [
        [0, 0.04 * r],
        [0, 0.52 * r],
      ],
      Math.max(1, lw * 0.7),
    );
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.ellipse(-0.35 * r, 0.22 * r, 0.14 * r, 0.22 * r, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  // Big round pauldrons.
  for (const s of [-1, 1]) dot(ctx, s * 0.72 * r, 0.06 * r, 0.3 * r, dark);
  // A round shield on the off arm.
  limb(ctx, -0.8 * r, 0.2 * r, -0.95 * r, 0.5 * r, 0.22 * r, dark);
  dot(ctx, -1.0 * r, 0.52 * r, 0.42 * r, "#64748b");
  face(() => {
    dot(ctx, -1.0 * r, 0.52 * r, 0.16 * r, "#fbbf24");
    ink(
      ctx,
      [
        [-1.0 * r, 0.2 * r],
        [-1.0 * r, 0.84 * r],
      ],
      Math.max(1, lw * 0.6),
    );
  });
  // Helmet with visor slit and a plume.
  part(
    ctx,
    () => {
      ctx.moveTo(-0.5 * r, -0.2 * r);
      ctx.lineTo(-0.5 * r, -0.62 * r);
      ctx.arc(0, -0.62 * r, 0.5 * r, Math.PI, 0);
      ctx.lineTo(0.5 * r, -0.2 * r);
      ctx.quadraticCurveTo(0, -0.05 * r, -0.5 * r, -0.2 * r);
      ctx.closePath();
    },
    lighten(color, 0.15),
  );
  face(() => {
    rr(ctx, -0.38 * r, -0.54 * r, 0.76 * r, 0.14 * r, 0.05 * r, OUTLINE);
    ink(
      ctx,
      [
        [0, -1.1 * r],
        [0, -0.72 * r],
      ],
      Math.max(1, lw * 0.7),
    );
    for (const s of [-1, 1]) {
      inkDot(ctx, s * 0.14 * r, -0.47 * r, 0.04 * r, "#fde047");
    }
    // Vents.
    for (const vy of [-0.3, -0.22]) {
      ink(
        ctx,
        [
          [-0.2 * r, vy * r],
          [0.2 * r, vy * r],
        ],
        Math.max(1, lw * 0.6),
      );
    }
  });
  poly(
    ctx,
    [
      [-0.12 * r, -1.08 * r],
      [0.0, -1.42 * r],
      [0.38 * r, -1.2 * r],
      [0.12 * r, -1.05 * r],
    ],
    "#dc2626",
  );
}

function reaper(ctx: Ctx, r: number, color: string, t: number, armed: boolean) {
  const dark = darken(color, 0.4);
  const sway = Math.sin(t * 0.005) * r * 0.08;
  shadow(ctx, r, 0.95, 1.02);
  if (armed) {
    // The scythe it carries when it isn't swinging.
    limb(ctx, 0.95 * r, 0.9 * r, 0.95 * r, -0.95 * r, 0.12 * r, "#78350f");
    part(
      ctx,
      () => {
        ctx.moveTo(0.95 * r, -0.95 * r);
        ctx.quadraticCurveTo(0.5 * r, -1.35 * r, 0.05 * r, -1.05 * r);
        ctx.quadraticCurveTo(0.5 * r, -1.1 * r, 0.9 * r, -0.78 * r);
        ctx.closePath();
      },
      "#e2e8f0",
    );
  }
  // Cloak with a ragged hem.
  part(
    ctx,
    () => {
      ctx.moveTo(0, -1.15 * r);
      ctx.quadraticCurveTo(0.95 * r, -0.7 * r, 0.95 * r, 0.95 * r);
      const teeth = 5;
      for (let i = 0; i < teeth; i++) {
        const x0 = 0.95 * r - (i * 1.9 * r) / teeth;
        const x1 = 0.95 * r - ((i + 1) * 1.9 * r) / teeth;
        ctx.lineTo((x0 + x1) / 2, 0.7 * r + (i % 2 ? sway : -sway));
        ctx.lineTo(x1, 0.98 * r);
      }
      ctx.quadraticCurveTo(-0.95 * r, -0.7 * r, 0, -1.15 * r);
      ctx.closePath();
    },
    color,
  );
  face(() => {
    for (const s of [-1, 1]) {
      ink(
        ctx,
        [
          [s * 0.35 * r, 0.1 * r],
          [s * 0.55 * r, 0.85 * r],
        ],
        Math.max(1, lw * 0.6),
      );
    }
    ctx.fillStyle = dark;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.ellipse(0.5 * r, 0.1 * r, 0.3 * r, 0.7 * r, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  // Hood opening: a void with glowing eyes.
  part(
    ctx,
    () => ctx.ellipse(0, -0.4 * r, 0.46 * r, 0.52 * r, 0, 0, Math.PI * 2),
    OUTLINE,
  );
  face(() => {
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.shadowColor = "#f0abfc";
      ctx.shadowBlur = r * 0.4;
      ctx.fillStyle = "#f5d0fe";
      ctx.beginPath();
      ctx.ellipse(
        s * 0.17 * r,
        -0.4 * r,
        0.1 * r,
        0.14 * r,
        s * 0.3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }
    ink(
      ctx,
      [
        [-0.16 * r, -0.12 * r],
        [0, -0.04 * r],
        [0.16 * r, -0.12 * r],
      ],
      Math.max(1, lw * 0.6),
    );
  });
  // Clasp and bony hands.
  dot(ctx, 0, 0.06 * r, 0.12 * r, "#fde047");
  for (const s of [-1, 1]) {
    dot(ctx, s * 0.62 * r, 0.52 * r, 0.14 * r, "#f1f5f9");
  }
}

function lich(ctx: Ctx, r: number, color: string, t: number) {
  const dark = darken(color, 0.45);
  const bob = Math.sin(t * 0.004) * r * 0.06;
  shadow(ctx, r, 0.8, 1.05);
  // Cape spread behind.
  poly(
    ctx,
    [
      [-0.5 * r, -0.2 * r],
      [-1.0 * r, 0.9 * r],
      [1.0 * r, 0.9 * r],
      [0.5 * r, -0.2 * r],
    ],
    dark,
  );
  // Robe with a wavy hem.
  part(
    ctx,
    () => {
      ctx.moveTo(-0.5 * r, -0.1 * r);
      ctx.lineTo(0.5 * r, -0.1 * r);
      ctx.lineTo(0.7 * r, 0.95 * r);
      for (let i = 0; i < 4; i++) {
        const x0 = 0.7 * r - (i * 1.4 * r) / 4;
        ctx.quadraticCurveTo(
          x0 - 0.175 * r,
          1.15 * r + (i % 2 ? bob : -bob),
          x0 - 0.35 * r,
          0.95 * r,
        );
      }
      ctx.closePath();
    },
    color,
  );
  face(() => {
    ink(
      ctx,
      [
        [0, 0.1 * r],
        [0, 0.9 * r],
      ],
      Math.max(1, lw * 0.6),
    );
    poly(
      ctx,
      [
        [-0.12 * r, 0.1 * r],
        [0.12 * r, 0.1 * r],
        [0, 0.3 * r],
      ],
      "#fde047",
    );
  });
  // Spiked shoulders.
  for (const s of [-1, 1]) {
    poly(
      ctx,
      [
        [s * 0.35 * r, -0.12 * r],
        [s * 1.0 * r, -0.5 * r],
        [s * 0.85 * r, 0.12 * r],
        [s * 0.5 * r, 0.2 * r],
      ],
      "#475569",
    );
  }
  // Skull face.
  dot(ctx, 0, -0.5 * r, 0.52 * r, "#f1f5f9");
  face(() => {
    for (const s of [-1, 1]) {
      ell(ctx, s * 0.2 * r, -0.5 * r, 0.14 * r, 0.17 * r, OUTLINE);
      ctx.save();
      ctx.shadowColor = "#67e8f9";
      ctx.shadowBlur = r * 0.35;
      inkDot(ctx, s * 0.2 * r, -0.5 * r, 0.07 * r, "#a5f3fc");
      ctx.restore();
    }
    poly(
      ctx,
      [
        [0, -0.36 * r],
        [-0.06 * r, -0.26 * r],
        [0.06 * r, -0.26 * r],
      ],
      OUTLINE,
    );
    for (const tx of [-0.14, 0, 0.14]) {
      ink(
        ctx,
        [
          [tx * r, -0.18 * r],
          [tx * r, -0.06 * r],
        ],
        Math.max(1, lw * 0.6),
      );
    }
  });
  // Crown.
  poly(
    ctx,
    [
      [-0.42 * r, -0.8 * r],
      [-0.46 * r, -1.2 * r],
      [-0.22 * r, -0.98 * r],
      [0, -1.34 * r],
      [0.22 * r, -0.98 * r],
      [0.46 * r, -1.2 * r],
      [0.42 * r, -0.8 * r],
    ],
    "#fde047",
  );
  face(() => {
    inkDot(ctx, 0, -0.95 * r, 0.06 * r, "#ef4444");
  });
  // A floating orb it conjures beside it.
  const ox = 1.02 * r;
  const oy = -0.1 * r + bob * 2;
  ctx.save();
  ctx.shadowColor = "#c4b5fd";
  ctx.shadowBlur = r * 0.5;
  dot(ctx, ox, oy, 0.24 * r, "#c4b5fd");
  ctx.restore();
  face(() => {
    inkDot(ctx, ox - 0.07 * r, oy - 0.08 * r, 0.07 * r, "#ffffff");
    dot(ctx, 0.66 * r, 0.4 * r, 0.13 * r, "#f1f5f9");
  });
}

function boar(ctx: Ctx, r: number, color: string, t: number) {
  shadow(ctx, r, 0.95);
  for (const s of [-1, 1]) {
    limb(
      ctx,
      s * 0.45 * r,
      0.6 * r,
      s * 0.5 * r,
      0.98 * r,
      0.26 * r,
      darken(color, 0.3),
    );
  }
  // Heavy shoulders and a head thrust forward.
  ell(ctx, 0, 0.05 * r, 1.0 * r, 0.82 * r, color);
  ell(ctx, 0, -0.35 * r, 0.62 * r, 0.5 * r, lighten(color, 0.12));
  for (const s of [-1, 1]) {
    poly(
      ctx,
      [
        [s * 0.42 * r, -0.72 * r],
        [s * 0.78 * r, -1.08 * r],
        [s * 0.7 * r, -0.5 * r],
      ],
      darken(color, 0.25),
    );
  }
  // Snout and tusks.
  ell(ctx, 0, -0.18 * r, 0.34 * r, 0.24 * r, "#fda4af");
  for (const s of [-1, 1]) {
    poly(
      ctx,
      [
        [s * 0.22 * r, -0.12 * r],
        [s * 0.5 * r, -0.42 * r],
        [s * 0.34 * r, -0.04 * r],
      ],
      "#fefce8",
    );
  }
  face(() => {
    inkDot(ctx, -0.1 * r, -0.2 * r, 0.05 * r);
    inkDot(ctx, 0.1 * r, -0.2 * r, 0.05 * r);
    for (const s of [-1, 1]) {
      eye(ctx, s * 0.3 * r, -0.52 * r, 0.14 * r, 0, 0.02 * r, "#dc2626");
      ink(
        ctx,
        [
          [s * 0.52 * r, -0.74 * r],
          [s * 0.1 * r, -0.6 * r],
        ],
        Math.max(1.4, lw * 1.2),
      );
    }
    // Dust kicked up at its heels.
    ctx.fillStyle = "rgba(226,232,240,0.5)";
    const puff = 0.5 + 0.5 * Math.sin(t * 0.02);
    inkDot(ctx, -0.8 * r, 0.9 * r, 0.12 * r * puff, "rgba(226,232,240,0.5)");
  });
}

function cultist(ctx: Ctx, r: number, color: string, t: number) {
  shadow(ctx, r, 0.8);
  // Long crimson robe, hem swaying.
  const sway = 0.06 * r * Math.sin(t * 0.005);
  poly(
    ctx,
    [
      [-0.5 * r, -0.2 * r],
      [0.5 * r, -0.2 * r],
      [0.9 * r + sway, 0.98 * r],
      [-0.9 * r + sway, 0.98 * r],
    ],
    darken(color, 0.2),
  );
  rr(ctx, -0.45 * r, 0.25 * r, 0.9 * r, 0.14 * r, 0.05 * r, "#fbbf24");
  // Raised hands over a glowing sigil.
  const glow = 0.7 + 0.3 * Math.sin(t * 0.007);
  ctx.save();
  ctx.shadowColor = "#fb7185";
  ctx.shadowBlur = r * 0.8 * glow;
  dot(ctx, 0, -1.25 * r, 0.22 * r * glow, "#fecdd3");
  ctx.restore();
  limb(ctx, -0.5 * r, 0.0, -0.7 * r, -0.85 * r, 0.12 * r, darken(color, 0.3));
  limb(ctx, 0.5 * r, 0.0, 0.7 * r, -0.85 * r, 0.12 * r, darken(color, 0.3));
  // Deep hood.
  dot(ctx, 0, -0.45 * r, 0.62 * r, color);
  dot(ctx, 0, -0.38 * r, 0.4 * r, "#1c0a12");
  dot(ctx, -0.14 * r, -0.4 * r, 0.07 * r, "#fda4af");
  dot(ctx, 0.14 * r, -0.4 * r, 0.07 * r, "#fda4af");
}

function golem(ctx: Ctx, r: number, color: string, t: number) {
  shadow(ctx, r, 1.1);
  const dark = darken(color, 0.35);
  // Stubby legs, a boulder torso, heavy fists.
  for (const s of [-1, 1]) {
    rr(
      ctx,
      s * 0.45 * r - 0.25 * r,
      0.6 * r,
      0.5 * r,
      0.42 * r,
      0.12 * r,
      dark,
    );
    dot(ctx, s * 1.0 * r, 0.25 * r, 0.34 * r, dark);
  }
  rr(ctx, -0.8 * r, -0.55 * r, 1.6 * r, 1.3 * r, 0.35 * r, color);
  rr(ctx, -0.3 * r, -0.95 * r, 0.6 * r, 0.5 * r, 0.18 * r, darken(color, 0.12));
  // Cracks and a glowing core that brightens as it breaks.
  const pulse = 0.6 + 0.4 * Math.sin(t * 0.006);
  ink(
    ctx,
    [
      [-0.5 * r, -0.4 * r],
      [-0.2 * r, 0.0],
      [-0.4 * r, 0.4 * r],
    ],
    Math.max(1, lw * 0.7),
  );
  ctx.save();
  ctx.shadowColor = "#fb923c";
  ctx.shadowBlur = r * 0.6 * pulse;
  dot(ctx, 0.1 * r, 0.1 * r, 0.22 * r * pulse, "#fdba74");
  ctx.restore();
  dot(ctx, -0.1 * r, -0.72 * r, 0.07 * r, "#fdba74");
  dot(ctx, 0.1 * r, -0.72 * r, 0.07 * r, "#fdba74");
}

function shaman(ctx: Ctx, r: number, color: string, t: number) {
  shadow(ctx, r, 0.8);
  // Robe that flares at the hem.
  poly(
    ctx,
    [
      [-0.5 * r, -0.2 * r],
      [0.5 * r, -0.2 * r],
      [0.85 * r, 0.98 * r],
      [-0.85 * r, 0.98 * r],
    ],
    darken(color, 0.25),
  );
  rr(ctx, -0.4 * r, 0.3 * r, 0.8 * r, 0.16 * r, 0.06 * r, "#fde047");
  // Staff with a glowing leaf-green orb.
  limb(ctx, 0.78 * r, -0.7 * r, 0.7 * r, 0.95 * r, 0.12 * r, "#92400e");
  const glow = 0.75 + 0.25 * Math.sin(t * 0.006);
  ctx.save();
  ctx.shadowColor = "#86efac";
  ctx.shadowBlur = r * 0.7 * glow;
  dot(ctx, 0.78 * r, -0.85 * r, 0.26 * r * glow, "#bbf7d0");
  ctx.restore();
  // Hood and a face deep in it.
  dot(ctx, 0, -0.45 * r, 0.62 * r, color);
  poly(
    ctx,
    [
      [-0.5 * r, -0.7 * r],
      [0, -1.25 * r],
      [0.5 * r, -0.7 * r],
    ],
    color,
  );
  ell(ctx, 0, -0.4 * r, 0.36 * r, 0.3 * r, "#052e16");
  face(() => {
    for (const s of [-1, 1]) {
      inkDot(ctx, s * 0.14 * r, -0.42 * r, 0.07 * r, "#bbf7d0");
    }
  });
}

function wasp(ctx: Ctx, r: number, color: string, t: number) {
  shadow(ctx, r, 0.6, 1.2);
  const flap = Math.sin(t * 0.09);
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.globalAlpha = 0.75;
    ell(
      ctx,
      s * 0.8 * r,
      -0.5 * r,
      0.7 * r,
      0.3 * r * (0.5 + 0.5 * Math.abs(flap)),
      "#e0f2fe",
      s * (0.5 + 0.25 * flap),
    );
    ctx.restore();
  }
  // Striped abdomen ending in a stinger, then thorax and head.
  ell(ctx, 0, 0.5 * r, 0.6 * r, 0.75 * r, color);
  for (const y of [0.3, 0.62]) {
    rr(ctx, -0.5 * r, y * r, 1.0 * r, 0.16 * r, 0.05 * r, "#1e1b4b");
  }
  poly(
    ctx,
    [
      [-0.1 * r, 1.1 * r],
      [0.1 * r, 1.1 * r],
      [0, 1.42 * r],
    ],
    "#1e1b4b",
  );
  dot(ctx, 0, -0.15 * r, 0.5 * r, darken(color, 0.15));
  face(() => {
    for (const s of [-1, 1]) {
      eye(ctx, s * 0.2 * r, -0.2 * r, 0.16 * r, 0, 0.02 * r, "#dc2626");
    }
  });
}

function phantom(ctx: Ctx, r: number, color: string, t: number) {
  const sway = Math.sin(t * 0.005) * 0.12 * r;
  // A tattered wraith: hood, ragged hem that ripples, two pale eyes.
  poly(
    ctx,
    [
      [-0.8 * r, -0.2 * r],
      [0.8 * r, -0.2 * r],
      [0.9 * r + sway, 1.0 * r],
      [0.5 * r, 0.75 * r],
      [0.2 * r - sway, 1.1 * r],
      [-0.1 * r, 0.78 * r],
      [-0.45 * r + sway, 1.08 * r],
      [-0.9 * r, 0.9 * r],
    ],
    darken(color, 0.15),
  );
  dot(ctx, 0, -0.35 * r, 0.8 * r, color);
  poly(
    ctx,
    [
      [-0.55 * r, -0.8 * r],
      [0, -1.4 * r],
      [0.55 * r, -0.8 * r],
    ],
    color,
  );
  ell(ctx, 0, -0.3 * r, 0.46 * r, 0.4 * r, "#1e1b4b");
  face(() => {
    ctx.save();
    ctx.shadowColor = "#ddd6fe";
    ctx.shadowBlur = r * 0.5;
    for (const s of [-1, 1])
      inkDot(ctx, s * 0.18 * r, -0.32 * r, 0.1 * r, "#f5f3ff");
    ctx.restore();
  });
}

function spitter(ctx: Ctx, r: number, color: string, t: number) {
  shadow(ctx, r, 0.9);
  const puff = 1 + 0.08 * Math.sin(t * 0.008);
  for (const s of [-1, 1]) {
    ell(ctx, s * 0.6 * r, 0.8 * r, 0.3 * r, 0.18 * r, darken(color, 0.2));
  }
  // A squat toad with a swelling throat sac.
  ell(ctx, 0, 0.2 * r, 0.95 * r, 0.75 * r, color);
  ell(ctx, 0, 0.5 * r, 0.5 * r * puff, 0.38 * r * puff, "#d9f99d");
  for (const s of [-1, 1]) {
    dot(ctx, s * 0.5 * r, -0.4 * r, 0.3 * r, color);
  }
  face(() => {
    for (const s of [-1, 1]) {
      eye(ctx, s * 0.5 * r, -0.42 * r, 0.2 * r, 0, 0.03 * r, "#facc15");
    }
    for (const x of [-0.3, 0.3]) inkDot(ctx, x * r, 0.05 * r, 0.05 * r);
    ink(
      ctx,
      [
        [-0.3 * r, 0.3 * r],
        [0, 0.34 * r],
        [0.3 * r, 0.3 * r],
      ],
      Math.max(1.4, lw),
    );
  });
}

export function drawEnemyArt(
  ctx: Ctx,
  kind: EnemyKind,
  x: number,
  y: number,
  r: number,
  color: string,
  flashAlpha: number,
  t: number,
  armed: boolean,
) {
  flash = flashAlpha;
  lw = Math.max(1.4, r * 0.12);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  switch (kind) {
    case "zombie":
      zombie(ctx, r, color);
      break;
    case "bat":
      bat(ctx, r, color, t);
      break;
    case "skeleton":
      skeleton(ctx, r, color);
      break;
    case "ghost":
      ghost(ctx, r, color, t);
      break;
    case "ogre":
      ogre(ctx, r, color);
      break;
    case "slime":
      slime(ctx, r, color, t);
      break;
    case "imp":
      imp(ctx, r, color, t);
      break;
    case "bomber":
      bomber(ctx, r, color, t);
      break;
    case "knight":
      knight(ctx, r, color);
      break;
    case "boar":
      boar(ctx, r, color, t);
      break;
    case "phantom":
      phantom(ctx, r, color, t);
      break;
    case "spitter":
      spitter(ctx, r, color, t);
      break;
    case "cultist":
      cultist(ctx, r, color, t);
      break;
    case "golem":
      golem(ctx, r, color, t);
      break;
    case "shaman":
      shaman(ctx, r, color, t);
      break;
    case "wasp":
      wasp(ctx, r, color, t);
      break;
    case "reaper":
      reaper(ctx, r, color, t, armed);
      break;
    case "lich":
      lich(ctx, r, color, t);
      break;
  }
  ctx.restore();
}
