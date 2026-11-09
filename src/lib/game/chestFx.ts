// The light show around a chest opening. A chest should not just swap
// pictures: it builds (sparks gather, the glow swells), it bursts (a flash,
// rotating rays, a spray of coins and stars), and it settles. This draws that
// on a canvas laid over the chest. It runs only while something is alive and
// stops itself; the caller skips it entirely under reduced motion.
import type { ChestTier } from "./relics";

type Ctx = CanvasRenderingContext2D;

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: "spark" | "coin" | "star";
  spin: number;
  grav: number;
}

export interface ChestFx {
  /** The build-up: sparks drawn in toward the chest, a glow that swells. */
  anticipate(tier: ChestTier, ms: number): void;
  /** The open: flash, rays, and a spray of coins and stars. `color` is the
   * rarest thing inside, so a legendary find lights the room differently. */
  burst(tier: ChestTier, color: string, coins: number): void;
  stop(): void;
}

const GOLD = "#fde047";

function star(
  c: Ctx,
  x: number,
  y: number,
  outer: number,
  inner: number,
  rot: number,
) {
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * Math.PI) / 4;
    const r = i % 2 ? inner : outer;
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath();
}

export function createChestFx(canvas: HTMLCanvasElement): ChestFx {
  const ctx = canvas.getContext("2d");
  let raf = 0;
  let sparks: Spark[] = [];
  let w = 0;
  let h = 0;
  let last = 0;
  let buildUntil = 0;
  let buildStart = 0;
  let buildTier: ChestTier = "wooden";
  let flashAt = -1;
  let raysAt = -1;
  let rayColor = GOLD;
  let raysStrength = 1;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function alive(now: number) {
    return (
      sparks.length > 0 ||
      now < buildUntil ||
      now - flashAt < 400 ||
      now - raysAt < 1600
    );
  }

  function frame(now: number) {
    if (!ctx) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h * 0.55;

    // Glow swelling during the build-up.
    if (now < buildUntil) {
      const k = Math.min(1, (now - buildStart) / (buildUntil - buildStart));
      const col = buildTier === "golden" ? "253,224,71" : "251,146,60";
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 30 + k * 70);
      g.addColorStop(0, `rgba(${col},${0.15 + k * 0.45})`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 30 + k * 70, 0, Math.PI * 2);
      ctx.fill();
      // Sparks gather from the edges toward the lid.
      if (Math.random() < 0.55 + k * 0.4) {
        const a = Math.random() * Math.PI * 2;
        const d = 60 + Math.random() * 30;
        sparks.push({
          x: cx + Math.cos(a) * d,
          y: cy + Math.sin(a) * d * 0.7,
          vx: -Math.cos(a) * (60 + k * 80),
          vy: -Math.sin(a) * (60 + k * 80) * 0.7,
          life: 0,
          max: d / (60 + k * 80),
          size: 1.4 + Math.random() * 1.6,
          color: buildTier === "golden" ? GOLD : "#fdba74",
          kind: "spark",
          spin: 0,
          grav: 0,
        });
      }
    }

    // Rotating rays behind the chest after it opens.
    if (raysAt >= 0 && now - raysAt < 1600) {
      const k = (now - raysAt) / 1600;
      const alpha =
        Math.sin(Math.min(1, k * 1.2) * Math.PI) * 0.5 * raysStrength;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(now / 1800);
      ctx.fillStyle = rayColor;
      ctx.globalAlpha = Math.max(0, alpha);
      const rays = 12;
      const len = Math.max(w, h) * 0.7;
      for (let i = 0; i < rays; i++) {
        const a = (i / rays) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - 0.09) * len, Math.sin(a - 0.09) * len);
        ctx.lineTo(Math.cos(a + 0.09) * len, Math.sin(a + 0.09) * len);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // The flash at the moment it opens.
    if (flashAt >= 0 && now - flashAt < 400) {
      const k = (now - flashAt) / 400;
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 20 + k * 120);
      g.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - k)})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 20 + k * 120, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const s of sparks) {
      s.life += dt;
      s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.spin += dt * 9;
      const k = s.life / s.max;
      if (k >= 1) continue;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1 - k) * 2);
      ctx.fillStyle = s.color;
      if (s.kind === "coin") {
        ctx.strokeStyle = "#7c5a00";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(
          s.x,
          s.y,
          s.size,
          s.size * Math.abs(Math.cos(s.spin)),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.stroke();
      } else if (s.kind === "star") {
        star(ctx, s.x, s.y, s.size * 1.6, s.size * 0.55, s.spin);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    sparks = sparks.filter((s) => s.life < s.max);

    if (alive(now)) raf = requestAnimationFrame(frame);
    else {
      raf = 0;
      last = 0;
      ctx.clearRect(0, 0, w, h);
    }
  }

  function start() {
    resize();
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  return {
    anticipate(tier, ms) {
      const now = performance.now();
      buildTier = tier;
      buildStart = now;
      buildUntil = now + ms;
      start();
    },
    burst(tier, color, coins) {
      const now = performance.now();
      buildUntil = 0;
      flashAt = now;
      raysAt = now;
      rayColor = color;
      raysStrength = tier === "golden" ? 1 : 0.7;
      resize();
      const cx = w / 2;
      const cy = h * 0.5;
      const n = Math.min(40, 10 + Math.round(coins / 6));
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const sp = 140 + Math.random() * 190;
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0,
          max: 1 + Math.random() * 0.7,
          size: 4 + Math.random() * 2.4,
          color: GOLD,
          kind: "coin",
          spin: Math.random() * 6,
          grav: 520,
        });
      }
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 70 + Math.random() * 150;
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 40,
          life: 0,
          max: 0.8 + Math.random() * 0.8,
          size: 2.4 + Math.random() * 2.6,
          color: i % 3 ? color : "#ffffff",
          kind: "star",
          spin: Math.random() * 6,
          grav: 120,
        });
      }
      start();
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      sparks = [];
      buildUntil = 0;
      flashAt = -1;
      raysAt = -1;
      ctx?.clearRect(0, 0, w, h);
    },
  };
}
