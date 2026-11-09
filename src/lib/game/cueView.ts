// Effect cues: the visible half of every relic and power. A passive bonus is
// invisible by nature, so each effect gets its own short animation at the
// moment it acts: steel flashes where armor soaks a hit, green orbs fly to the
// hero when a kill heals, thorns lash back at an attacker, a magnet ring
// sweeps out when gems are pulled in. The same drawing serves the run and the
// chest's relic cards, so a relic looks the same where you find it and where
// it works. Pure canvas code; engine.ts decides when a cue fires.

type Ctx = CanvasRenderingContext2D;

const INK = "#0b1120";

export type CueKind =
  | "block"
  | "drain"
  | "regen"
  | "reflect"
  | "dodge"
  | "coin"
  | "lucky"
  | "xp"
  | "magnet"
  | "bounty"
  | "echo"
  | "heart"
  | "dash"
  | "sharpen"
  | "haste"
  | "crit"
  | "chill"
  | "phoenix"
  | "crown";

export interface Cue {
  kind: CueKind;
  /** Where it happens (ignored when `onHero`). */
  x: number;
  y: number;
  at: number;
  /** Anchored to the hero's current position rather than a fixed point. */
  onHero?: boolean;
  /** When anchored, a sideways offset, so a row of cues does not overlap. */
  dx?: number;
  /** A number or word that floats up with it. */
  text?: string;
  /** A small caption above, such as the relic's name. */
  label?: string;
  /** Magnet: how far the pull reaches. */
  r?: number;
  /** Block: the direction the hit came from. */
  angle?: number;
}

export const CUE_MS: Record<CueKind, number> = {
  block: 520,
  drain: 650,
  regen: 850,
  reflect: 480,
  dodge: 450,
  coin: 600,
  lucky: 850,
  xp: 650,
  magnet: 650,
  bounty: 800,
  echo: 520,
  heart: 950,
  dash: 750,
  sharpen: 750,
  haste: 850,
  crit: 600,
  chill: 900,
  phoenix: 1150,
  crown: 1050,
};

/** What each relic shows, by relic id. A relic whose bonus has no moment of
 * its own (more HP, more damage) shows it as it is carried. */
export const RELIC_CUE: Record<string, CueKind> = {
  giantsHeart: "heart",
  windBoots: "dash",
  whetstone: "sharpen",
  lodestone: "magnet",
  luckyCoin: "lucky",
  scholarsQuill: "xp",
  ironPlate: "block",
  hourglass: "haste",
  eagleEye: "crit",
  leechFang: "drain",
  thornRing: "reflect",
  emberHeart: "regen",
  frostCharm: "chill",
  phoenixFeather: "phoenix",
  crownOfAges: "crown",
};

/** One line on what a cue means, for the relic's description. */
export const CUE_BLURB: Record<CueKind, string> = {
  block: "A steel flash marks every hit it absorbs.",
  drain: "Green light flies to you from every kill that heals.",
  regen: "Green sparks rise from you as you heal.",
  reflect: "Thorns lash back at whatever hits you.",
  dodge: "A ghost slips away from the blow.",
  coin: "A gold figure floats up from each coin.",
  lucky: "A lucky coin bursts into a shower.",
  xp: "A violet figure floats up from each gem.",
  magnet: "A ring sweeps out showing how far the pull reaches.",
  bounty: "A crown rises over a rich kill.",
  echo: "A second ring answers the hit.",
  heart: "A heart swells around you at the start of the run.",
  dash: "Speed lines trail you at the start of the run.",
  sharpen: "A blade glint flashes at the start of the run.",
  haste: "A ticking ring shows your weapons running fast.",
  crit: "A starburst marks a double-damage hit.",
  chill: "Frost settles on the enemies it slows.",
  phoenix: "Flame feathers rise when you come back.",
  crown: "A golden crown settles over you at the start of the run.",
};

const ease = (t: number) => 1 - (1 - t) * (1 - t);
const fade = (t: number) => Math.max(0, 1 - t * t);

function popText(
  c: Ctx,
  text: string,
  x: number,
  y: number,
  color: string,
  size: number,
  t: number,
) {
  c.save();
  c.globalAlpha = fade(t);
  c.font = `800 ${size}px sans-serif`;
  c.textAlign = "center";
  c.lineJoin = "round";
  c.lineWidth = 4;
  c.strokeStyle = INK;
  const yy = y - ease(t) * 22;
  c.strokeText(text, x, yy);
  c.fillStyle = color;
  c.fillText(text, x, yy);
  c.restore();
}

function star(
  c: Ctx,
  x: number,
  y: number,
  outer: number,
  inner: number,
  points: number,
  rot = 0,
) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = rot + (i * Math.PI) / points;
    const r = i % 2 ? inner : outer;
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath();
}

function heartPath(c: Ctx, x: number, y: number, s: number) {
  c.beginPath();
  c.moveTo(x, y + s * 0.9);
  c.bezierCurveTo(
    x - s * 1.3,
    y + s * 0.1,
    x - s * 0.9,
    y - s * 0.9,
    x,
    y - s * 0.35,
  );
  c.bezierCurveTo(
    x + s * 0.9,
    y - s * 0.9,
    x + s * 1.3,
    y + s * 0.1,
    x,
    y + s * 0.9,
  );
  c.closePath();
}

/** Draws one cue at its moment `now`. `hero` is where the hero stands now,
 * for the cues that fly to or from it. */
export function drawCue(
  c: Ctx,
  cue: Cue,
  now: number,
  hero: { x: number; y: number },
) {
  const t = (now - cue.at) / CUE_MS[cue.kind];
  if (t < 0 || t >= 1) return;
  const x = cue.onHero ? hero.x + (cue.dx ?? 0) : cue.x;
  const y = cue.onHero ? hero.y : cue.y;
  c.save();
  switch (cue.kind) {
    case "block": {
      // A hexagonal shield snaps up on the side the hit came from, flares
      // and shatters into steel sparks.
      const a = cue.angle ?? -Math.PI / 2;
      const r = 26;
      const grow = Math.min(1, t / 0.25);
      c.globalAlpha = fade(Math.max(0, (t - 0.35) / 0.65));
      c.translate(x + Math.cos(a) * 6, y + Math.sin(a) * 6);
      c.rotate(a);
      c.strokeStyle = "#e2e8f0";
      c.fillStyle = "rgba(148,163,184,0.35)";
      c.lineWidth = 2.4;
      c.beginPath();
      c.arc(0, 0, r * grow, -0.95, 0.95);
      c.stroke();
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.arc(r * 0.78 * grow, i * 7 * grow, 5.2 * grow, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      if (t > 0.3) {
        c.fillStyle = "#f8fafc";
        for (let i = 0; i < 6; i++) {
          const sa = -0.9 + (i / 5) * 1.8;
          const sd = r + (t - 0.3) * 40;
          c.beginPath();
          c.arc(Math.cos(sa) * sd, Math.sin(sa) * sd, 1.6, 0, Math.PI * 2);
          c.fill();
        }
      }
      break;
    }
    case "drain": {
      // Four green orbs fly from the kill to the hero along a curve, then
      // the hero's heart pulses.
      c.fillStyle = "#4ade80";
      c.strokeStyle = "#dcfce7";
      c.lineWidth = 1.2;
      const mx = (x + hero.x) / 2;
      const my = Math.min(y, hero.y) - 26;
      for (let i = 0; i < 4; i++) {
        const k = Math.min(1, Math.max(0, t * 1.4 - i * 0.12));
        if (k <= 0 || k >= 1) continue;
        const px =
          (1 - k) * (1 - k) * x + 2 * (1 - k) * k * mx + k * k * hero.x;
        const py =
          (1 - k) * (1 - k) * y + 2 * (1 - k) * k * my + k * k * hero.y;
        c.globalAlpha = 0.95;
        c.beginPath();
        c.arc(px, py, 3.2 - k * 1.2, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      if (t > 0.6) {
        const k = (t - 0.6) / 0.4;
        c.globalAlpha = 1 - k;
        c.strokeStyle = "#86efac";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(hero.x, hero.y, 14 + k * 10, 0, Math.PI * 2);
        c.stroke();
      }
      break;
    }
    case "regen": {
      c.fillStyle = "#4ade80";
      c.strokeStyle = INK;
      c.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const k = (t + i * 0.18) % 1;
        const px = x + (i - 1.5) * 8 + Math.sin(k * 6 + i) * 2;
        const py = y - 8 - k * 26;
        c.globalAlpha = Math.max(0, 1 - k) * fade(t);
        c.beginPath();
        c.rect(px - 1.4, py - 4, 2.8, 8);
        c.rect(px - 4, py - 1.4, 8, 2.8);
        c.fill();
      }
      break;
    }
    case "reflect": {
      // A jagged line lashes from the hero to the attacker, which bursts in
      // thorns.
      c.strokeStyle = "#f87171";
      c.lineWidth = 2.4;
      c.lineCap = "round";
      c.lineJoin = "round";
      const reach = Math.min(1, t / 0.35);
      c.globalAlpha = fade(Math.max(0, (t - 0.4) / 0.6));
      c.beginPath();
      const segs = 6;
      for (let i = 0; i <= segs; i++) {
        const k = (i / segs) * reach;
        const jx = i === 0 || i === segs ? 0 : Math.sin(i * 12.9) * 4;
        const jy = i === 0 || i === segs ? 0 : Math.cos(i * 7.7) * 4;
        c.lineTo(
          hero.x + (x - hero.x) * k + jx,
          hero.y + (y - hero.y) * k + jy,
        );
      }
      c.stroke();
      c.fillStyle = "#fca5a5";
      c.strokeStyle = INK;
      c.lineWidth = 1.4;
      star(c, x, y, 7 + t * 10, 2.6, 8, t);
      c.fill();
      c.stroke();
      break;
    }
    case "dodge": {
      c.globalAlpha = 0.55 * fade(t);
      c.strokeStyle = "#a5f3fc";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x + ease(t) * 16, y - ease(t) * 4, 11, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 0.3 * fade(t);
      c.beginPath();
      c.arc(x + ease(t) * 30, y - ease(t) * 8, 11, 0, Math.PI * 2);
      c.stroke();
      break;
    }
    case "coin":
    case "lucky": {
      const lucky = cue.kind === "lucky";
      if (lucky) {
        c.fillStyle = "#fde047";
        c.strokeStyle = INK;
        c.lineWidth = 1.2;
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          const d = 8 + ease(t) * 26;
          const arc = Math.sin(t * Math.PI) * 12;
          c.globalAlpha = fade(t);
          c.beginPath();
          c.ellipse(
            x + Math.cos(a) * d,
            y + Math.sin(a) * d * 0.6 - arc,
            3.4,
            3.4 * Math.abs(Math.cos(t * 9 + i)),
            0,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.stroke();
        }
      }
      break;
    }
    case "xp": {
      c.fillStyle = "#c4b5fd";
      for (let i = 0; i < 4; i++) {
        const k = (t + i * 0.2) % 1;
        c.globalAlpha = Math.max(0, 1 - k) * fade(t);
        star(c, x + (i - 1.5) * 7, y - k * 20, 3.2, 1.2, 4, k * 3);
        c.fill();
      }
      break;
    }
    case "magnet": {
      const R = cue.r ?? 70;
      c.strokeStyle = "#7dd3fc";
      c.lineWidth = 2;
      c.setLineDash([5, 6]);
      c.globalAlpha = 0.7 * fade(t);
      c.beginPath();
      c.arc(hero.x, hero.y, R * ease(t), 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      // Little arrowheads pointing in, riding the ring.
      c.fillStyle = "#e0f2fe";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 1.5;
        const d = R * (1 - ease(t) * 0.4);
        const px = hero.x + Math.cos(a) * d;
        const py = hero.y + Math.sin(a) * d;
        c.save();
        c.translate(px, py);
        c.rotate(a + Math.PI);
        c.globalAlpha = 0.8 * fade(t);
        c.beginPath();
        c.moveTo(5, 0);
        c.lineTo(-3, -3.4);
        c.lineTo(-3, 3.4);
        c.closePath();
        c.fill();
        c.restore();
      }
      break;
    }
    case "bounty": {
      const yy = y - 12 - ease(t) * 18;
      c.globalAlpha = fade(t);
      c.fillStyle = "#fde047";
      c.strokeStyle = INK;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(x - 9, yy + 6);
      c.lineTo(x - 10, yy - 5);
      c.lineTo(x - 4, yy);
      c.lineTo(x, yy - 8);
      c.lineTo(x + 4, yy);
      c.lineTo(x + 10, yy - 5);
      c.lineTo(x + 9, yy + 6);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = "#fef08a";
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        c.beginPath();
        c.arc(
          x + Math.cos(a + t * 4) * (10 + t * 12),
          y + Math.sin(a + t * 4) * (6 + t * 8),
          1.6,
          0,
          Math.PI * 2,
        );
        c.fill();
      }
      break;
    }
    case "echo": {
      c.strokeStyle = "#c084fc";
      c.lineWidth = 2;
      for (const [k0, w] of [
        [0, 2.4],
        [0.25, 1.6],
      ] as const) {
        const k = Math.max(0, (t - k0) / (1 - k0));
        c.globalAlpha = 0.8 * (1 - k);
        c.lineWidth = w;
        c.beginPath();
        c.arc(x, y, 8 + k * 22, 0, Math.PI * 2);
        c.stroke();
      }
      break;
    }
    case "heart": {
      const s = 7 + ease(t) * 12;
      c.globalAlpha = fade(t);
      c.fillStyle = "#fb7185";
      c.strokeStyle = INK;
      c.lineWidth = 2;
      heartPath(c, x, y - 18 - ease(t) * 10, s);
      c.fill();
      c.stroke();
      c.strokeStyle = "#fda4af";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, 12 + ease(t) * 26, 0, Math.PI * 2);
      c.globalAlpha = 0.6 * fade(t);
      c.stroke();
      break;
    }
    case "dash": {
      c.strokeStyle = "#bae6fd";
      c.lineWidth = 2;
      c.lineCap = "round";
      for (let i = 0; i < 5; i++) {
        const oy = (i - 2) * 5;
        const k = Math.min(1, t * 1.6);
        c.globalAlpha = 0.8 * fade(t);
        c.beginPath();
        c.moveTo(x - 10 - k * 6, y + oy);
        c.lineTo(x - 10 - k * 6 - 14 - i * 3 * k, y + oy);
        c.stroke();
      }
      c.fillStyle = "#e0f2fe";
      for (let i = 0; i < 2; i++) {
        c.globalAlpha = fade(t);
        c.beginPath();
        c.moveTo(x + 14 + ease(t) * 12 - i * 8, y - 5);
        c.lineTo(x + 20 + ease(t) * 12 - i * 8, y);
        c.lineTo(x + 14 + ease(t) * 12 - i * 8, y + 5);
        c.lineTo(x + 16 + ease(t) * 12 - i * 8, y);
        c.closePath();
        c.fill();
      }
      break;
    }
    case "sharpen": {
      // A diagonal glint sweeps across and ends in a four-point star.
      const k = ease(Math.min(1, t * 1.3));
      c.globalAlpha = fade(Math.max(0, (t - 0.4) / 0.6));
      c.strokeStyle = "#ffffff";
      c.lineWidth = 3;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x - 18, y + 14);
      c.lineTo(x - 18 + 36 * k, y + 14 - 28 * k);
      c.stroke();
      c.fillStyle = "#fef9c3";
      c.strokeStyle = INK;
      c.lineWidth = 1.4;
      star(c, x - 18 + 36 * k, y + 14 - 28 * k, 8, 2, 4, 0);
      c.fill();
      c.stroke();
      break;
    }
    case "haste": {
      c.globalAlpha = fade(t);
      c.strokeStyle = "#fde68a";
      c.lineWidth = 2.2;
      c.beginPath();
      c.arc(x, y - 22, 11, 0, Math.PI * 2);
      c.stroke();
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, y - 22);
      c.lineTo(
        x + Math.cos(t * 14 - 1.57) * 8,
        y - 22 + Math.sin(t * 14 - 1.57) * 8,
      );
      c.stroke();
      c.fillStyle = "#fde68a";
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        c.beginPath();
        c.arc(
          x + Math.cos(a) * 15,
          y - 22 + Math.sin(a) * 15,
          1.1,
          0,
          Math.PI * 2,
        );
        c.fill();
      }
      break;
    }
    case "crit": {
      c.globalAlpha = fade(t);
      c.fillStyle = "#fff7ed";
      c.strokeStyle = "#fb923c";
      c.lineWidth = 2;
      star(c, x, y - 4, 10 + ease(t) * 12, 3, 4, 0.4);
      c.fill();
      c.stroke();
      c.strokeStyle = "#fdba74";
      c.lineWidth = 1.6;
      c.lineCap = "round";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        const d1 = 14 + ease(t) * 8;
        c.beginPath();
        c.moveTo(x + Math.cos(a) * d1, y - 4 + Math.sin(a) * d1);
        c.lineTo(x + Math.cos(a) * (d1 + 6), y - 4 + Math.sin(a) * (d1 + 6));
        c.stroke();
      }
      break;
    }
    case "chill": {
      c.fillStyle = "#e0f2fe";
      c.strokeStyle = "#38bdf8";
      c.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const k = (t + i * 0.16) % 1;
        const px = x + (i - 2.5) * 6 + Math.sin(k * 5 + i) * 3;
        const py = y - 16 + k * 28;
        c.globalAlpha = Math.max(0, 1 - k) * fade(t);
        c.beginPath();
        c.moveTo(px, py - 3.4);
        c.lineTo(px + 2, py);
        c.lineTo(px, py + 3.4);
        c.lineTo(px - 2, py);
        c.closePath();
        c.fill();
        c.stroke();
      }
      break;
    }
    case "phoenix": {
      // Flame feathers fan out and rise.
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.32;
        const k = Math.min(1, Math.max(0, t * 1.2 - i * 0.04));
        const len = 10 + ease(k) * 28;
        c.save();
        c.translate(x, y);
        c.rotate(a);
        c.globalAlpha = (1 - k) * 0.95;
        c.fillStyle = i % 2 ? "#fb923c" : "#fbbf24";
        c.strokeStyle = INK;
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(4, 0);
        c.quadraticCurveTo(len * 0.5, -6, len, 0);
        c.quadraticCurveTo(len * 0.5, 6, 4, 0);
        c.fill();
        c.stroke();
        c.restore();
      }
      break;
    }
    case "crown": {
      const yy = y - 22 - (1 - ease(Math.min(1, t * 1.6))) * 16;
      c.globalAlpha = fade(Math.max(0, (t - 0.5) / 0.5));
      c.fillStyle = "#fcd34d";
      c.strokeStyle = INK;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x - 11, yy + 7);
      c.lineTo(x - 12, yy - 6);
      c.lineTo(x - 5, yy);
      c.lineTo(x, yy - 9);
      c.lineTo(x + 5, yy);
      c.lineTo(x + 12, yy - 6);
      c.lineTo(x + 11, yy + 7);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = "#fffbeb";
      for (let i = 0; i < 4; i++) {
        const k = (t * 2 + i * 0.25) % 1;
        star(c, x + (i - 1.5) * 8, yy - 6 - k * 10, 2.6, 1, 4, k * 3);
        c.fill();
      }
      break;
    }
  }
  c.restore();
  if (cue.text) {
    const color =
      cue.kind === "coin" || cue.kind === "lucky" || cue.kind === "bounty"
        ? "#fde047"
        : cue.kind === "xp"
          ? "#c4b5fd"
          : cue.kind === "drain" || cue.kind === "regen"
            ? "#86efac"
            : cue.kind === "block"
              ? "#e2e8f0"
              : cue.kind === "reflect"
                ? "#fca5a5"
                : "#ffffff";
    popText(c, cue.text, x, y - 20, color, cue.kind === "lucky" ? 15 : 12, t);
  }
  if (cue.label) {
    c.save();
    c.globalAlpha = fade(Math.max(0, (t - 0.2) / 0.8));
    c.font = "800 9px sans-serif";
    c.textAlign = "center";
    c.lineJoin = "round";
    c.lineWidth = 3;
    c.strokeStyle = INK;
    c.strokeText(cue.label.toUpperCase(), x, y - 40 - ease(t) * 6);
    c.fillStyle = "#f8fafc";
    c.fillText(cue.label.toUpperCase(), x, y - 40 - ease(t) * 6);
    c.restore();
  }
}

// --- Effects that stay on while they hold -----------------------------------

/** Weapons running fast: a ring of ticks with one bright tick sweeping. */
export function drawHasteRing(
  c: Ctx,
  x: number,
  y: number,
  r: number,
  now: number,
) {
  c.save();
  c.translate(x, y);
  c.rotate(now / 1400);
  c.strokeStyle = "rgba(253,230,138,0.38)";
  c.lineWidth = 1.6;
  c.lineCap = "round";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const hot = Math.floor((now / 110) % 12) === i;
    c.strokeStyle = hot ? "#fde68a" : "rgba(253,230,138,0.34)";
    c.lineWidth = hot ? 2.6 : 1.6;
    c.beginPath();
    c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    c.lineTo(
      Math.cos(a) * (r + (hot ? 7 : 4)),
      Math.sin(a) * (r + (hot ? 7 : 4)),
    );
    c.stroke();
  }
  c.restore();
}

/** Berserker: flame-shaped red spikes lick off the hero, more of them and
 * brighter the lower the HP. `missing` runs 0..1. */
export function drawBerserkAura(
  c: Ctx,
  x: number,
  y: number,
  r: number,
  now: number,
  missing: number,
) {
  if (missing <= 0.1) return;
  c.save();
  c.translate(x, y);
  c.globalAlpha = Math.min(0.85, 0.2 + missing * 0.6);
  c.fillStyle = "#ef4444";
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + now / 900;
    const len =
      r * (0.5 + missing * 0.9) * (0.7 + 0.3 * Math.sin(now / 90 + i * 2));
    c.save();
    c.rotate(a);
    c.beginPath();
    c.moveTo(r * 0.9, -3);
    c.quadraticCurveTo(r * 0.9 + len * 0.6, -1, r * 0.9 + len, 0);
    c.quadraticCurveTo(r * 0.9 + len * 0.6, 1, r * 0.9, 3);
    c.closePath();
    c.fill();
    c.restore();
  }
  c.restore();
}

/** Bastion: a steel hexagon holds around the hero while they stand still. */
export function drawBastionShield(
  c: Ctx,
  x: number,
  y: number,
  r: number,
  now: number,
) {
  c.save();
  c.translate(x, y);
  c.rotate(now / 3000);
  const pulse = 0.5 + 0.5 * Math.sin(now / 260);
  c.globalAlpha = 0.45 + 0.2 * pulse;
  c.strokeStyle = "#cbd5e1";
  c.fillStyle = "rgba(148,163,184,0.14)";
  c.lineWidth = 2.2;
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    c.lineTo(Math.cos(a) * r * 1.9, Math.sin(a) * r * 1.9);
  }
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();
}

/** Momentum: a stack of chevrons above the hero, one per kill in the streak. */
export function drawMomentumChevrons(
  c: Ctx,
  x: number,
  y: number,
  r: number,
  stacks: number,
) {
  if (stacks <= 0) return;
  c.save();
  c.strokeStyle = "#fde047";
  c.lineWidth = 2.4;
  c.lineCap = "round";
  c.lineJoin = "round";
  const n = Math.min(10, stacks);
  for (let i = 0; i < n; i++) {
    const yy = y - r * 1.9 - i * 4.2;
    c.globalAlpha = 0.95 - i * 0.05;
    c.beginPath();
    c.moveTo(x - 6, yy + 3);
    c.lineTo(x, yy - 1);
    c.lineTo(x + 6, yy + 3);
    c.stroke();
  }
  c.restore();
}
