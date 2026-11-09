// Draws the field's hazards. Each one has to read at a glance while enemies
// swarm over it, so every kind has its own silhouette and its own colour
// family: a tar pit is dark and glossy with a toxic rim, a mine is a spiked
// dome with a blinking light, a barrel is a grey steel drum with a fuse, a
// pillar is carved stone, spikes are a riveted plate. Warnings are light and
// motion: spikes glow red before they strike, armed mines show their trigger
// ring, a lit barrel flares. Decoration is seeded from the hazard's id so
// nothing shimmers from frame to frame.
import { spikePhase, type Hazard } from "./hazards";

type Ctx = CanvasRenderingContext2D;

const INK = "#0b1120";

/** Stable 0..1 value for a hazard and a slot, so decoration never flickers. */
function seeded(id: number, k: number): number {
  const v = Math.sin(id * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function groundShadow(c: Ctx, x: number, y: number, rx: number, ry: number) {
  c.save();
  c.fillStyle = "rgba(0,0,0,0.34)";
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// --- Tar pit (slows whoever wades through it) --------------------------------

function blobPath(c: Ctx, h: Hazard, now: number, scale: number) {
  const steps = 28;
  c.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const wob = Math.sin(now / 700 + a * 3 + h.id) * 0.035;
    const rad =
      h.r *
      scale *
      (0.88 +
        0.1 * Math.sin(a * 3 + h.id * 1.7) +
        0.06 * Math.sin(a * 5 + h.id * 0.9) +
        wob);
    const px = h.x + Math.cos(a) * rad;
    const py = h.y + Math.sin(a) * rad * 0.8;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
}

function drawTar(c: Ctx, h: Hazard, now: number) {
  c.save();
  // A toxic halo, so it reads as something to avoid rather than something
  // to stand in.
  const halo = c.createRadialGradient(
    h.x,
    h.y,
    h.r * 0.5,
    h.x,
    h.y,
    h.r * 1.25,
  );
  halo.addColorStop(0, "rgba(163,230,53,0.0)");
  halo.addColorStop(0.7, "rgba(163,230,53,0.16)");
  halo.addColorStop(1, "rgba(163,230,53,0)");
  c.fillStyle = halo;
  c.beginPath();
  c.ellipse(h.x, h.y, h.r * 1.25, h.r * 1.0, 0, 0, Math.PI * 2);
  c.fill();

  // The pit: glossy near-black with a violet cast.
  blobPath(c, h, now, 1);
  const body = c.createRadialGradient(
    h.x - h.r * 0.2,
    h.y - h.r * 0.2,
    h.r * 0.1,
    h.x,
    h.y,
    h.r,
  );
  body.addColorStop(0, "#2a1f4a");
  body.addColorStop(0.6, "#150f2b");
  body.addColorStop(1, "#0a0716");
  c.fillStyle = body;
  c.fill();
  c.lineWidth = 3;
  c.strokeStyle = "#a3e635";
  c.globalAlpha = 0.75;
  c.stroke();
  c.globalAlpha = 1;
  // Wet rim just inside the edge.
  blobPath(c, h, now, 0.86);
  c.lineWidth = 1.5;
  c.strokeStyle = "rgba(190,242,100,0.28)";
  c.stroke();

  // Sheen: two bright slivers that drift, as light on a liquid.
  c.fillStyle = "rgba(196,181,253,0.28)";
  c.beginPath();
  c.ellipse(
    h.x - h.r * 0.3 + Math.sin(now / 1400 + h.id) * 3,
    h.y - h.r * 0.28,
    h.r * 0.3,
    h.r * 0.07,
    -0.35,
    0,
    Math.PI * 2,
  );
  c.fill();
  c.beginPath();
  c.ellipse(
    h.x + h.r * 0.2,
    h.y + h.r * 0.12,
    h.r * 0.16,
    h.r * 0.045,
    -0.35,
    0,
    Math.PI * 2,
  );
  c.fill();

  // Bubbles rise, swell and pop into a ripple.
  for (let i = 0; i < 5; i++) {
    const phase = (now / 1700 + seeded(h.id, i)) % 1;
    const bx = h.x + (seeded(h.id, i + 10) - 0.5) * h.r * 1.3;
    const by = h.y + (seeded(h.id, i + 20) - 0.5) * h.r * 0.9;
    if (phase < 0.8) {
      const size = 1.5 + (phase / 0.8) * 4;
      c.fillStyle = "rgba(190,242,100,0.55)";
      c.strokeStyle = "rgba(236,252,203,0.7)";
      c.lineWidth = 1;
      c.beginPath();
      c.arc(bx, by - phase * 6, size, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    } else {
      const ring = (phase - 0.8) / 0.2;
      c.strokeStyle = `rgba(190,242,100,${0.6 * (1 - ring)})`;
      c.lineWidth = 1.2;
      c.beginPath();
      c.ellipse(bx, by, 5 + ring * 9, (5 + ring * 9) * 0.55, 0, 0, Math.PI * 2);
      c.stroke();
    }
  }
  c.restore();
}

// --- Spike trap ------------------------------------------------------------------

function drawSpikes(c: Ctx, h: Hazard, now: number) {
  const phase = spikePhase(h, now);
  const warn = phase === "warn";
  const up = phase === "up";
  const pulse = 0.5 + 0.5 * Math.sin(now / 90);
  const s = h.r;
  c.save();
  if (warn) {
    c.shadowColor = "#ef4444";
    c.shadowBlur = 10 + pulse * 8;
  }
  // The plate: bevelled steel, lighter at the top-left, darker at the bottom
  // right, with a yellow-black border that says "stay off".
  c.fillStyle = "#1f2937";
  c.beginPath();
  c.roundRect(h.x - s, h.y - s, s * 2, s * 2, 6);
  c.fill();
  c.shadowBlur = 0;
  const plate = c.createLinearGradient(h.x - s, h.y - s, h.x + s, h.y + s);
  plate.addColorStop(0, "#6b7280");
  plate.addColorStop(0.5, "#374151");
  plate.addColorStop(1, "#1f2937");
  c.fillStyle = plate;
  c.beginPath();
  c.roundRect(h.x - s + 3, h.y - s + 3, s * 2 - 6, s * 2 - 6, 4);
  c.fill();
  c.lineWidth = 3;
  c.strokeStyle = warn ? (pulse > 0.5 ? "#f87171" : "#fbbf24") : "#ca8a04";
  c.setLineDash([6, 5]);
  c.beginPath();
  c.roundRect(h.x - s + 1.5, h.y - s + 1.5, s * 2 - 3, s * 2 - 3, 5);
  c.stroke();
  c.setLineDash([]);
  // Rivets.
  c.fillStyle = "#9ca3af";
  for (const [dx, dy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    c.beginPath();
    c.arc(h.x + dx * (s - 8), h.y + dy * (s - 8), 1.7, 0, Math.PI * 2);
    c.fill();
  }
  // Holes the spikes come out of, glowing when about to strike.
  const len = up ? 16 : warn ? 6 : 0;
  for (let ix = 0; ix < 3; ix++) {
    for (let iy = 0; iy < 3; iy++) {
      const sx = h.x + (ix - 1) * (s * 0.55);
      const sy = h.y + (iy - 1) * (s * 0.55);
      c.fillStyle = warn ? "#7f1d1d" : INK;
      c.beginPath();
      c.ellipse(sx, sy + 2, 4.4, 2.6, 0, 0, Math.PI * 2);
      c.fill();
      if (len > 0) {
        const g = c.createLinearGradient(sx - 4, 0, sx + 4, 0);
        g.addColorStop(0, "#94a3b8");
        g.addColorStop(0.5, "#f8fafc");
        g.addColorStop(1, "#64748b");
        c.fillStyle = g;
        c.strokeStyle = INK;
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(sx - 3.6, sy + 2);
        c.lineTo(sx, sy + 2 - len);
        c.lineTo(sx + 3.6, sy + 2);
        c.closePath();
        c.fill();
        c.stroke();
        if (up) {
          c.fillStyle = "#fecaca";
          c.beginPath();
          c.arc(sx, sy + 2 - len, 1.3, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
  }
  c.restore();
}

// --- Pillar (blocks movement) ------------------------------------------------

function drawPillar(c: Ctx, h: Hazard) {
  const r = h.r;
  const baseY = h.y + r * 0.32;
  const topY = h.y - r * 0.55;
  c.save();
  groundShadow(c, h.x + 5, baseY + 3, r * 1.2, r * 0.5);
  // Plinth.
  c.fillStyle = "#334155";
  c.strokeStyle = INK;
  c.lineWidth = 2.5;
  c.beginPath();
  c.ellipse(h.x, baseY, r * 1.08, r * 0.52, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  // Shaft: a cylinder lit from the left, with fluting.
  const shaft = c.createLinearGradient(h.x - r, 0, h.x + r, 0);
  shaft.addColorStop(0, "#1e293b");
  shaft.addColorStop(0.3, "#64748b");
  shaft.addColorStop(0.55, "#475569");
  shaft.addColorStop(1, "#1e293b");
  c.fillStyle = shaft;
  c.beginPath();
  c.moveTo(h.x - r * 0.86, topY);
  c.lineTo(h.x - r * 0.86, baseY);
  c.ellipse(h.x, baseY, r * 0.86, r * 0.42, 0, Math.PI, 0, true);
  c.lineTo(h.x + r * 0.86, topY);
  c.closePath();
  c.fill();
  c.lineWidth = 2.5;
  c.stroke();
  c.strokeStyle = "rgba(15,23,42,0.45)";
  c.lineWidth = 1.2;
  for (const f of [-0.45, 0, 0.45]) {
    c.beginPath();
    c.moveTo(h.x + f * r, topY + 2);
    c.lineTo(h.x + f * r, baseY + r * 0.32 * (1 - Math.abs(f)));
    c.stroke();
  }
  // Cracks and moss, placed once per pillar.
  c.strokeStyle = "rgba(2,6,23,0.7)";
  c.lineWidth = 1.4;
  c.beginPath();
  const cx = h.x + (seeded(h.id, 1) - 0.5) * r * 0.9;
  c.moveTo(cx, topY + 4);
  c.lineTo(cx + 3, topY + 11);
  c.lineTo(cx - 2, topY + 17);
  c.lineTo(cx + 2, topY + 23);
  c.stroke();
  c.fillStyle = "rgba(74,222,128,0.45)";
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.ellipse(
      h.x + (seeded(h.id, 5 + i) - 0.5) * r * 1.3,
      baseY - 1 + (seeded(h.id, 9 + i) - 0.5) * 4,
      3.4,
      1.8,
      0,
      0,
      Math.PI * 2,
    );
    c.fill();
  }
  // Cap with a carved ring.
  const cap = c.createRadialGradient(
    h.x - r * 0.3,
    topY - r * 0.1,
    r * 0.1,
    h.x,
    topY,
    r * 1.05,
  );
  cap.addColorStop(0, "#94a3b8");
  cap.addColorStop(1, "#475569");
  c.fillStyle = cap;
  c.strokeStyle = INK;
  c.lineWidth = 2.5;
  c.beginPath();
  c.ellipse(h.x, topY, r * 1.0, r * 0.5, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.strokeStyle = "rgba(15,23,42,0.5)";
  c.lineWidth = 1.5;
  c.beginPath();
  c.ellipse(h.x, topY, r * 0.62, r * 0.31, 0, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.moveTo(h.x - r * 0.22, topY);
  c.lineTo(h.x + r * 0.22, topY);
  c.moveTo(h.x, topY - r * 0.11);
  c.lineTo(h.x, topY + r * 0.11);
  c.stroke();
  c.restore();
}

// --- Explosive barrel -----------------------------------------------------------

function drawBarrel(c: Ctx, h: Hazard, now: number) {
  const lit = h.fuseAt !== null;
  const flare = lit && Math.floor(now / 55) % 2 === 0;
  const w = h.r * 0.95;
  const topY = h.y - h.r * 0.95;
  const botY = h.y + h.r * 0.85;
  c.save();
  groundShadow(c, h.x + 3, botY + 2, w * 1.15, h.r * 0.4);
  // Steel drum, lit from the left so it reads as round.
  const drum = c.createLinearGradient(h.x - w, 0, h.x + w, 0);
  if (flare) {
    drum.addColorStop(0, "#fca5a5");
    drum.addColorStop(1, "#fecaca");
  } else {
    drum.addColorStop(0, "#1f2937");
    drum.addColorStop(0.3, "#6b7280");
    drum.addColorStop(0.6, "#4b5563");
    drum.addColorStop(1, "#111827");
  }
  c.fillStyle = drum;
  c.strokeStyle = INK;
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(h.x - w, topY);
  c.lineTo(h.x - w * 1.06, h.y);
  c.lineTo(h.x - w, botY);
  c.ellipse(h.x, botY, w, h.r * 0.34, 0, Math.PI, 0, true);
  c.lineTo(h.x + w * 1.06, h.y);
  c.lineTo(h.x + w, topY);
  c.closePath();
  c.fill();
  c.stroke();
  // Two steel hoops that curve with the barrel.
  c.strokeStyle = "rgba(15,23,42,0.75)";
  c.lineWidth = 2;
  for (const yy of [topY + h.r * 0.38, botY - h.r * 0.32]) {
    c.beginPath();
    c.ellipse(h.x, yy, w * 1.02, h.r * 0.3, 0, 0.05, Math.PI - 0.05);
    c.stroke();
  }
  // Warning plate: yellow-black stripes with a flame, nothing like a ribbon.
  c.save();
  c.beginPath();
  c.roundRect(h.x - w * 0.62, h.y - h.r * 0.34, w * 1.24, h.r * 0.7, 2);
  c.clip();
  c.fillStyle = "#facc15";
  c.fillRect(h.x - w, h.y - h.r, w * 2, h.r * 2);
  c.fillStyle = INK;
  for (let i = -3; i < 5; i++) {
    c.beginPath();
    c.moveTo(h.x - w + i * 6, h.y + h.r * 0.4);
    c.lineTo(h.x - w + i * 6 + 3.2, h.y + h.r * 0.4);
    c.lineTo(h.x - w + i * 6 + 3.2 + h.r * 0.7, h.y - h.r * 0.4);
    c.lineTo(h.x - w + i * 6 + h.r * 0.7, h.y - h.r * 0.4);
    c.closePath();
    c.fill();
  }
  c.restore();
  c.strokeStyle = INK;
  c.lineWidth = 1.5;
  c.beginPath();
  c.roundRect(h.x - w * 0.62, h.y - h.r * 0.34, w * 1.24, h.r * 0.7, 2);
  c.stroke();
  // A flame on the plate.
  c.fillStyle = "#dc2626";
  c.strokeStyle = INK;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(h.x, h.y - h.r * 0.3);
  c.bezierCurveTo(h.x + 5, h.y - 3, h.x + 4, h.y + 3, h.x, h.y + h.r * 0.3);
  c.bezierCurveTo(h.x - 4, h.y + 3, h.x - 5, h.y - 3, h.x, h.y - h.r * 0.3);
  c.fill();
  c.stroke();
  // Lid, bung and a fuse that always smoulders.
  const lid = c.createRadialGradient(
    h.x - w * 0.3,
    topY - 2,
    1,
    h.x,
    topY,
    w * 1.1,
  );
  lid.addColorStop(0, "#9ca3af");
  lid.addColorStop(1, "#374151");
  c.fillStyle = lid;
  c.strokeStyle = INK;
  c.lineWidth = 2.5;
  c.beginPath();
  c.ellipse(h.x, topY, w, h.r * 0.34, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = "#111827";
  c.beginPath();
  c.arc(h.x + w * 0.3, topY, 2.2, 0, Math.PI * 2);
  c.fill();
  const fx = h.x + w * 0.3;
  c.strokeStyle = "#a16207";
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(fx, topY);
  c.quadraticCurveTo(fx + 6, topY - 4, fx + 5, topY - 10);
  c.stroke();
  const spark = 2 + (lit ? 3 : 0) + Math.sin(now / 60 + h.id) * 1.2;
  c.shadowColor = "#fb923c";
  c.shadowBlur = lit ? 14 : 7;
  c.fillStyle = lit ? "#fef08a" : "#fb923c";
  c.beginPath();
  c.arc(fx + 5, topY - 10, spark, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// --- Mine ----------------------------------------------------------------------

function drawMine(c: Ctx, h: Hazard, now: number) {
  const armed = now >= h.armedAt;
  const lit = h.fuseAt !== null;
  const r = h.r;
  c.save();
  // The trigger ring: faint and pulsing once armed, so it can be read and
  // avoided or used on purpose.
  if (armed && !lit) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 420 + h.id);
    c.strokeStyle = `rgba(248,113,113,${0.18 + 0.14 * pulse})`;
    c.lineWidth = 1.5;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.arc(h.x, h.y, r + 13, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
  }
  groundShadow(c, h.x + 2, h.y + r * 0.6, r * 1.1, r * 0.45);
  // Horns, like a naval mine, so it cannot be mistaken for a button or a gift.
  c.fillStyle = "#4b5563";
  c.strokeStyle = INK;
  c.lineWidth = 1.6;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    c.beginPath();
    c.moveTo(h.x + ux * r * 0.8 - uy * 2.4, h.y + uy * r * 0.8 + ux * 2.4);
    c.lineTo(h.x + ux * (r + 5), h.y + uy * (r + 5));
    c.lineTo(h.x + ux * r * 0.8 + uy * 2.4, h.y + uy * r * 0.8 - ux * 2.4);
    c.closePath();
    c.fill();
    c.stroke();
  }
  // Dome.
  const dome = c.createRadialGradient(
    h.x - r * 0.35,
    h.y - r * 0.4,
    1,
    h.x,
    h.y,
    r,
  );
  dome.addColorStop(0, armed ? "#9ca3af" : "#6b7280");
  dome.addColorStop(0.55, "#374151");
  dome.addColorStop(1, "#111827");
  c.fillStyle = dome;
  c.lineWidth = 2.4;
  c.beginPath();
  c.arc(h.x, h.y, r, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  // Pressure plate and a seam.
  c.strokeStyle = "rgba(15,23,42,0.7)";
  c.lineWidth = 1.3;
  c.beginPath();
  c.arc(h.x, h.y, r * 0.55, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.moveTo(h.x - r, h.y);
  c.lineTo(h.x + r, h.y);
  c.stroke();
  // The light: dead while arming, a slow blink once armed, a frantic flash lit.
  const on = lit
    ? Math.floor(now / 55) % 2 === 0
    : armed && Math.floor(now / 650) % 2 === 0;
  c.fillStyle = on ? "#f43f5e" : armed ? "#7f1d1d" : "#4b5563";
  if (on) {
    c.shadowColor = "#f43f5e";
    c.shadowBlur = lit ? 14 : 9;
  }
  c.beginPath();
  c.arc(h.x, h.y, 3.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Draws every hazard still on the field. Ground effects first, so the tall
 * things stand on top of them, and in order of depth within each group. */
export function drawHazards(c: Ctx, hazards: readonly Hazard[], now: number) {
  for (const h of hazards) if (h.alive && h.kind === "goo") drawTar(c, h, now);
  for (const h of hazards)
    if (h.alive && h.kind === "spikes") drawSpikes(c, h, now);
  const upright = hazards
    .filter(
      (h) =>
        h.alive &&
        (h.kind === "mine" || h.kind === "barrel" || h.kind === "pillar"),
    )
    .sort((a, b) => a.y - b.y);
  for (const h of upright) {
    if (h.kind === "mine") drawMine(c, h, now);
    else if (h.kind === "barrel") drawBarrel(c, h, now);
    else drawPillar(c, h);
  }
}
