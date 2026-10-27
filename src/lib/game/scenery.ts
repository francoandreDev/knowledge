// Painted once into an offscreen canvas and blitted every frame: the ground
// the fight happens on. Each biome has its own floor, props and light, kept
// low-contrast so it never competes with enemies, pickups or danger tells.

export type Biome = "crypt" | "swamp" | "ember" | "frost";
export const BIOMES: Biome[] = ["crypt", "swamp", "ember", "frost"];

export const BIOME_NAME: Record<Biome, string> = {
  crypt: "Crypt",
  swamp: "Swamp",
  ember: "Ember Pit",
  frost: "Frostfield",
};

interface Palette {
  base: string;
  mid: string;
  line: string;
  accent: string;
}

const PALETTE: Record<Biome, Palette> = {
  crypt: {
    base: "#0a1120",
    mid: "#14203a",
    line: "rgba(148,163,184,0.09)",
    accent: "#94a3b8",
  },
  swamp: {
    base: "#07130e",
    mid: "#10261b",
    line: "rgba(74,222,128,0.07)",
    accent: "#4ade80",
  },
  ember: {
    base: "#170909",
    mid: "#2c1111",
    line: "rgba(251,146,60,0.08)",
    accent: "#fb923c",
  },
  frost: {
    base: "#09131f",
    mid: "#142640",
    line: "rgba(147,197,253,0.09)",
    accent: "#93c5fd",
  },
};

type Ctx = CanvasRenderingContext2D;

function rngFrom(seed: number) {
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement | null {
  if (
    typeof document !== "undefined" &&
    typeof document.createElement === "function"
  ) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  const O = (
    globalThis as { OffscreenCanvas?: new (w: number, h: number) => unknown }
  ).OffscreenCanvas;
  return O ? (new O(w, h) as HTMLCanvasElement) : null;
}

function floor(ctx: Ctx, w: number, h: number, p: Palette, rnd: () => number) {
  const g = ctx.createRadialGradient(
    w / 2,
    h / 2,
    h * 0.1,
    w / 2,
    h / 2,
    w * 0.75,
  );
  g.addColorStop(0, p.mid);
  g.addColorStop(1, p.base);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Flagstones laid in brick courses.
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 1.5;
  const rowH = 46;
  const colW = 70;
  for (let row = 0, y = 0; y < h + rowH; row++, y += rowH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    const off = row % 2 ? colW / 2 : 0;
    ctx.beginPath();
    for (let x = -off; x < w; x += colW) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowH);
    }
    ctx.stroke();
  }
  // A few stones a shade lighter or darker, so the floor is not a grid.
  for (let i = 0; i < 38; i++) {
    const x = Math.floor(rnd() * (w / colW)) * colW;
    const y = Math.floor(rnd() * (h / rowH)) * rowH;
    ctx.fillStyle =
      rnd() < 0.5 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.12)";
    ctx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);
  }
}

function cracks(
  ctx: Ctx,
  w: number,
  h: number,
  color: string,
  n: number,
  rnd: () => number,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < n; i++) {
    let x = rnd() * w;
    let y = rnd() * h;
    let a = rnd() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      a += (rnd() - 0.5) * 1.3;
      x += Math.cos(a) * (14 + rnd() * 22);
      y += Math.sin(a) * (14 + rnd() * 22);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function glow(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  color: string,
  a: number,
) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function props(
  ctx: Ctx,
  w: number,
  h: number,
  biome: Biome,
  rnd: () => number,
) {
  const n = Math.round((w * h) / 9000);
  for (let i = 0; i < n; i++) {
    const x = 12 + rnd() * (w - 24);
    const y = 12 + rnd() * (h - 24);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rnd() - 0.5) * 1.2);
    switch (biome) {
      case "crypt": {
        const k = rnd();
        if (k < 0.4) {
          // A scatter of bones.
          ctx.strokeStyle = "rgba(226,232,240,0.28)";
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-7, -3);
          ctx.lineTo(7, 3);
          ctx.moveTo(-6, 4);
          ctx.lineTo(6, -4);
          ctx.stroke();
          ctx.fillStyle = "rgba(226,232,240,0.3)";
          ctx.beginPath();
          ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (k < 0.62) {
          // A guttering candle.
          glow(ctx, 0, 0, 34, "#fbbf24", 0.22);
          ctx.fillStyle = "rgba(254,243,199,0.7)";
          ctx.fillRect(-2, -1, 4, 6);
          ctx.fillStyle = "rgba(251,191,36,0.95)";
          ctx.beginPath();
          ctx.arc(0, -3, 2.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "rgba(100,116,139,0.3)";
          ctx.beginPath();
          ctx.moveTo(-6, 3);
          ctx.lineTo(-2, -5);
          ctx.lineTo(5, -2);
          ctx.lineTo(6, 4);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case "swamp": {
        const k = rnd();
        if (k < 0.4) {
          ctx.fillStyle = "rgba(6,28,18,0.8)";
          ctx.beginPath();
          ctx.ellipse(0, 0, 16 + rnd() * 12, 7 + rnd() * 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(110,231,183,0.2)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (k < 0.75) {
          ctx.strokeStyle = "rgba(74,222,128,0.34)";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          for (const dx of [-4, 0, 4]) {
            ctx.beginPath();
            ctx.moveTo(dx, 6);
            ctx.quadraticCurveTo(
              dx + dx * 0.5,
              -2,
              dx * 1.6,
              -9 - Math.abs(dx),
            );
            ctx.stroke();
          }
          ctx.fillStyle = "rgba(146,64,14,0.55)";
          ctx.fillRect(-0.8, -12, 1.8, 5);
        } else {
          ctx.fillStyle = "rgba(134,239,172,0.28)";
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0.4, Math.PI * 2 - 0.4);
          ctx.fill();
        }
        break;
      }
      case "ember": {
        const k = rnd();
        if (k < 0.45) {
          ctx.shadowColor = "#f97316";
          ctx.shadowBlur = 10;
          ctx.strokeStyle = "rgba(251,146,60,0.55)";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(-14, 0);
          ctx.lineTo(-5, -5);
          ctx.lineTo(2, 3);
          ctx.lineTo(9, -3);
          ctx.lineTo(15, 2);
          ctx.stroke();
        } else if (k < 0.8) {
          ctx.fillStyle = "rgba(68,64,60,0.5)";
          ctx.beginPath();
          ctx.ellipse(0, 0, 6 + rnd() * 6, 3 + rnd() * 3, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "rgba(251,191,36,0.7)";
          ctx.beginPath();
          ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case "frost": {
        const k = rnd();
        if (k < 0.4) {
          ctx.fillStyle = "rgba(241,245,249,0.22)";
          ctx.beginPath();
          ctx.ellipse(0, 0, 10 + rnd() * 8, 4 + rnd() * 3, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (k < 0.7) {
          ctx.fillStyle = "rgba(125,211,252,0.35)";
          ctx.strokeStyle = "rgba(224,242,254,0.45)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, -9);
          ctx.lineTo(5, 0);
          ctx.lineTo(0, 9);
          ctx.lineTo(-5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(224,242,254,0.5)";
          ctx.beginPath();
          ctx.arc(0, 0, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
    }
    ctx.restore();
  }
}

/** Paints the ground. Returns null where there is no canvas to paint on
 * (headless runs), and callers fall back to a flat fill. */
export function createBackdrop(
  w: number,
  h: number,
  scale: number,
  biome: Biome,
  seed: number,
  arena = false,
): CanvasImageSource | null {
  const canvas = makeCanvas(Math.round(w * scale), Math.round(h * scale));
  const ctx = canvas?.getContext("2d") as Ctx | null | undefined;
  if (!canvas || !ctx) return null;
  const p = PALETTE[biome];
  const rnd = rngFrom(seed);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  floor(ctx, w, h, p, rnd);
  cracks(
    ctx,
    w,
    h,
    biome === "ember"
      ? "rgba(251,146,60,0.22)"
      : biome === "frost"
        ? "rgba(186,230,253,0.18)"
        : "rgba(148,163,184,0.1)",
    12,
    rnd,
  );
  props(ctx, w, h, biome, rnd);
  if (arena) {
    // Spawn pads and a centre emblem, so the duel ground reads as an arena.
    for (const fx of [0.2, 0.8]) {
      ctx.beginPath();
      ctx.arc(w * fx, h / 2, 34, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle =
        fx < 0.5 ? "rgba(56,189,248,0.3)" : "rgba(251,113,133,0.3)";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w * fx, h / 2, 22, 0, Math.PI * 2);
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = p.accent;
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 40, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 + Math.cos(a) * 40, h / 2 + Math.sin(a) * 40);
      ctx.lineTo(w / 2 + Math.cos(a) * 58, h / 2 + Math.sin(a) * 58);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // Vignette: the eye stays in the middle, the edges fall into shadow.
  const v = ctx.createRadialGradient(
    w / 2,
    h / 2,
    h * 0.35,
    w / 2,
    h / 2,
    w * 0.72,
  );
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  return canvas;
}
