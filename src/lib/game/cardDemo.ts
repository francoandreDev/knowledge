// Tiny looping scenes for the level-up cards: each pick shows itself working
// in the case it was designed for, so the choice is made by looking, not by
// reading a stat line. Pure drawing; the page owns the animation loop.
import type { EnemyKind, WeaponId } from "./engine";
import { drawBolt, drawMeteorWarning, drawNovaRing, drawSlash } from "./fx";
import {
  drawCoin,
  drawEnemy,
  drawGem,
  drawImpactBurst,
  drawOrbiter,
  drawPlayer,
  drawProjectile,
} from "./sprites";

export const DEMO_W = 150;
export const DEMO_H = 84;
const PERIOD_MS = 2800;
const HERO = { x: 30, y: 50 };
const GROUND_Y = 66;
const INK = "#0f172a";

export interface DemoSpec {
  kind: "weaponUpgrade" | "newWeapon" | "stat" | "ability";
  weaponId?: WeaponId;
  statId?: string;
}

/** The one-line "best when" shown under each pick. */
const IDEAL: Record<string, string> = {
  bladeArc: "Best when a pack is rushing you: one sweep clears the clump.",
  bolt: "Best on a line of enemies: the shot keeps going through them.",
  orbitShield: "Best when enemies surround you: they bounce off the orbit.",
  novaPulse:
    "Best when you are surrounded: everything near you is hit at once.",
  homingDart: "Best against the far, hard-to-aim enemy: the dart curves to it.",
  chainLightning: "Best on a cluster: one strike jumps from foe to foe.",
  meteorRain: "Best on slow crowds: marked ground, then a rock lands on it.",
  gravityWell: "Best on a spread-out swarm: the well packs it into one spot.",
  powerSurge: "Every hit from every weapon lands harder.",
  adrenaline: "Outrun a pack: you pull away from what is chasing you.",
  thickSkin: "More health, and some of it healed on the spot.",
  wideReach: "Gems and coins fly in from farther away.",
  quickRecovery: "Health ticks back while you keep fighting.",
  luckyStar: "Kills sometimes drop a second coin.",
  ironSkin: "Every hit you take is a little smaller.",
  quickDraw: "Your weapons fire sooner: more shots in the same time.",
  keenEye: "Some hits land for double damage.",
  bloodthirst: "Each kill gives a bit of health back.",
  chill: "Enemies move slower: easier to kite and to dodge.",
  scholar: "Gems fill the level bar faster: more picks like this one.",
  spikes: "Whatever touches you gets hurt too.",
  necromancy: "This run's boss becomes a Lich: weaker body, more tricks.",
};

export function idealCase(spec: DemoSpec): string {
  if (spec.kind === "ability") return IDEAL.necromancy;
  return IDEAL[spec.weaponId ?? spec.statId ?? ""] ?? "";
}

type Ctx = CanvasRenderingContext2D;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

function hero(c: Ctx, t: number, x = HERO.x, y = HERO.y, facing = 0) {
  drawPlayer(c, x, y, 7, "#38bdf8", facing, 0, undefined, t);
}

function foe(
  c: Ctx,
  kind: EnemyKind,
  x: number,
  y: number,
  t: number,
  color = "#4ade80",
  r = 7,
) {
  drawEnemy(c, kind, x, y, r, color, { t });
}

/** A foe that stands until `hitAt`, bursts, and comes back before the loop. */
function target(
  c: Ctx,
  p: number,
  hitAt: number,
  kind: EnemyKind,
  x: number,
  y: number,
  t: number,
  color?: string,
) {
  if (p < hitAt || p > 0.93) {
    const back = p > 0.93 ? seg(p, 0.93, 1) : 1;
    c.save();
    c.globalAlpha = back;
    foe(c, kind, x, y + Math.sin(t / 240 + x) * 1.2, t, color);
    c.restore();
  } else {
    drawImpactBurst(c, x, y, seg(p, hitAt, hitAt + 0.18), "#fde047");
  }
}

function floatText(
  c: Ctx,
  x: number,
  y: number,
  text: string,
  color: string,
  prog: number,
  size = 12,
) {
  if (prog <= 0 || prog >= 1) return;
  c.save();
  c.globalAlpha = 1 - prog * prog;
  c.font = `900 ${size}px system-ui, sans-serif`;
  c.textAlign = "center";
  c.lineWidth = 3;
  c.strokeStyle = INK;
  c.lineJoin = "round";
  c.strokeText(text, x, y - prog * 12);
  c.fillStyle = color;
  c.fillText(text, x, y - prog * 12);
  c.restore();
}

function bar(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  frac: number,
  color: string,
) {
  c.fillStyle = INK;
  c.beginPath();
  c.roundRect(x - 1.5, y - 1.5, w + 3, 9, 4);
  c.fill();
  c.fillStyle = "#e2e8f0";
  c.beginPath();
  c.roundRect(x, y, w, 6, 3);
  c.fill();
  if (frac > 0) {
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y, Math.max(3, w * clamp01(frac)), 6, 3);
    c.fill();
  }
}

type Scene = (c: Ctx, p: number, t: number) => void;

const WEAPON_SCENE: Partial<Record<WeaponId, Scene>> = {
  bladeArc(c, p, t) {
    hero(c, t);
    const spots: [number, number][] = [
      [62, 40],
      [70, 52],
      [60, 62],
    ];
    for (const [x, y] of spots) target(c, p, 0.5, "zombie", x, y, t);
    if (p > 0.34 && p < 0.62) {
      drawSlash(c, HERO.x, HERO.y, 44, 0, 0.95, seg(p, 0.34, 0.62));
    }
  },
  bolt(c, p, t) {
    hero(c, t);
    target(c, p, 0.4, "skeleton", 78, 50, t, "#e2e8f0");
    target(c, p, 0.52, "skeleton", 112, 50, t, "#e2e8f0");
    if (p > 0.2 && p < 0.65) {
      const x = HERO.x + 12 + seg(p, 0.2, 0.6) * 118;
      drawProjectile(c, x, 50, 3, "#facc15", 220, 0, "bolt");
    }
  },
  orbitShield(c, p, t) {
    hero(c, t);
    for (let k = 0; k < 2; k++) {
      const a = t / 380 + k * Math.PI;
      drawOrbiter(
        c,
        HERO.x + Math.cos(a) * 24,
        HERO.y + Math.sin(a) * 24,
        4,
        a,
      );
    }
    const x = 124 - seg(p, 0, 0.62) * 70;
    if (p < 0.64 || p > 0.93) {
      const back = p > 0.93 ? seg(p, 0.93, 1) : 1;
      c.save();
      c.globalAlpha = back;
      foe(c, "zombie", x, HERO.y + 2, t);
      c.restore();
    } else {
      drawImpactBurst(c, 54, HERO.y, seg(p, 0.64, 0.84), "#fde047");
    }
  },
  novaPulse(c, p, t) {
    hero(c, t);
    const ring: [number, number][] = [
      [HERO.x + 30, HERO.y],
      [HERO.x - 4, HERO.y - 30],
      [HERO.x + 22, HERO.y - 26],
      [HERO.x + 22, HERO.y + 26],
    ];
    for (const [x, y] of ring) target(c, p, 0.5, "ghost", x, y, t, "#a5f3fc");
    if (p > 0.34 && p < 0.7) {
      drawNovaRing(c, HERO.x, HERO.y, 36, seg(p, 0.34, 0.7));
    }
  },
  homingDart(c, p, t) {
    hero(c, t);
    target(c, p, 0.62, "bat", 72, 20, t, "#f472b6");
    target(c, p, 0.99, "bat", 96, 66, t, "#f472b6");
    target(c, p, 0.62, "bat", 128, 30, t, "#f472b6");
    if (p > 0.15 && p < 0.65) {
      const u = seg(p, 0.15, 0.62);
      const at = (k: number) => {
        const x =
          (1 - k) * (1 - k) * HERO.x + 2 * (1 - k) * k * 50 + k * k * 128;
        const y =
          (1 - k) * (1 - k) * HERO.y + 2 * (1 - k) * k * 84 + k * k * 30;
        return [x, y] as const;
      };
      const [x, y] = at(u);
      const [x0, y0] = at(Math.max(0, u - 0.04));
      drawProjectile(
        c,
        x,
        y,
        3,
        "#f472b6",
        (x - x0) * 40,
        (y - y0) * 40,
        "homingDart",
      );
    }
  },
  chainLightning(c, p, t) {
    hero(c, t);
    const chain: [number, number][] = [
      [66, 46],
      [90, 34],
      [112, 52],
      [128, 36],
    ];
    chain.forEach(([x, y], i) =>
      target(c, p, 0.34 + i * 0.07, "ghost", x, y, t, "#a5f3fc"),
    );
    if (p > 0.28 && p < 0.7) {
      let from: [number, number] = [HERO.x, HERO.y];
      chain.forEach(([x, y], i) => {
        const start = 0.3 + i * 0.07;
        if (p > start) {
          drawBolt(c, from[0], from[1], x, y, seg(p, start, start + 0.3), i);
        }
        from = [x, y];
      });
    }
  },
  gravityWell(c, p, t) {
    hero(c, t);
    const cx = 100;
    const cy = 48;
    const grow = seg(p, 0.1, 0.25);
    const spots: [number, number][] = [
      [74, 24],
      [130, 30],
      [76, 66],
      [128, 62],
    ];
    const pull = seg(p, 0.2, 0.7);
    for (const [x, y] of spots) {
      const px = x + (cx - x) * pull * 0.8;
      const py = y + (cy - y) * pull * 0.8;
      if (p < 0.78 || p > 0.93) {
        c.save();
        c.globalAlpha = p > 0.93 ? seg(p, 0.93, 1) : 1;
        foe(c, "bat", px, py, t, "#f472b6");
        c.restore();
      } else drawImpactBurst(c, px, py, seg(p, 0.78, 0.93), "#c4b5fd");
    }
    if (p > 0.1 && p < 0.85) {
      c.save();
      c.globalAlpha = 0.9;
      c.lineWidth = 3;
      for (const [rad, col] of [
        [30, "#c4b5fd"],
        [18, "#a78bfa"],
        [8, "#ddd6fe"],
      ] as const) {
        c.strokeStyle = col;
        for (let k = 0; k < 3; k++) {
          const a0 = t / 450 + (k * Math.PI * 2) / 3 + rad / 50;
          c.beginPath();
          c.arc(cx, cy, rad * (0.4 + 0.6 * grow), a0, a0 + 0.9);
          c.stroke();
        }
      }
      c.restore();
    }
  },
  meteorRain(c, p, t) {
    hero(c, t);
    const x = 100;
    const y = 52;
    if (p < 0.5) {
      foe(c, "zombie", x + Math.sin(t / 500) * 2, y, t);
      foe(c, "zombie", x + 14, y + 8, t);
      drawMeteorWarning(c, x + 6, y + 4, 24, seg(p, 0.05, 0.5));
    } else if (p < 0.93) {
      drawNovaRing(c, x + 6, y + 4, 24, seg(p, 0.5, 0.8), "#fb923c");
      drawImpactBurst(c, x, y, seg(p, 0.5, 0.75), "#fb923c");
    } else {
      c.save();
      c.globalAlpha = seg(p, 0.93, 1);
      foe(c, "zombie", x, y, t);
      foe(c, "zombie", x + 14, y + 8, t);
      c.restore();
    }
  },
};

const STAT_SCENE: Record<string, Scene> = {
  powerSurge(c, p, t) {
    hero(c, t);
    target(c, p, 0.4, "ogre", 100, 50, t, "#f97316");
    floatText(c, 100, 34, "6", "#fde047", seg(p, 0.4, 0.62), 11);
    floatText(c, 100, 34, "9!", "#fb923c", seg(p, 0.62, 0.9), 16);
  },
  adrenaline(c, p, t) {
    const x = 26 + seg(p, 0, 0.85) * 96;
    for (let i = 0; i < 4; i++) {
      c.strokeStyle = "rgba(226,232,240,0.7)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x - 14 - i * 10, 44 + i * 5);
      c.lineTo(x - 26 - i * 10, 44 + i * 5);
      c.stroke();
    }
    hero(c, t, x, 50);
    foe(c, "zombie", 14 + seg(p, 0, 0.85) * 38, 54, t);
  },
  thickSkin(c, p, t) {
    hero(c, t);
    const grow = seg(p, 0.25, 0.6);
    bar(c, 60, 36, 40 + grow * 36, 0.55 + grow * 0.45, "#f43f5e");
    floatText(c, 112, 44, "+HP", "#fda4af", seg(p, 0.3, 0.8), 11);
  },
  wideReach(c, p, t) {
    hero(c, t);
    const r = 20 + seg(p, 0.1, 0.5) * 30;
    c.setLineDash([4, 4]);
    c.strokeStyle = "rgba(167,139,250,0.9)";
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(HERO.x, HERO.y, r, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    const gems: [number, number][] = [
      [HERO.x + 44, HERO.y - 8],
      [HERO.x + 30, HERO.y + 22],
      [HERO.x + 50, HERO.y + 10],
    ];
    gems.forEach(([x, y], i) => {
      const pulled = seg(p, 0.45 + i * 0.08, 0.9);
      const gx = x + (HERO.x - x) * pulled;
      const gy = y + (HERO.y - y) * pulled;
      if (pulled < 1) drawGem(c, gx, gy, 4, "#a78bfa");
    });
  },
  quickRecovery(c, p, t) {
    hero(c, t);
    const frac = 0.35 + seg(p, 0.1, 0.9) * 0.5;
    bar(c, 60, 44, 56, frac, "#34d399");
    for (let i = 0; i < 3; i++) {
      floatText(
        c,
        66 + i * 20,
        40,
        "+",
        "#6ee7b7",
        seg((p * 3 + i / 3) % 1, 0, 1),
        11,
      );
    }
  },
  luckyStar(c, p, t) {
    hero(c, t);
    target(c, p, 0.35, "zombie", 90, 50, t);
    if (p > 0.4 && p < 0.93) {
      drawCoin(
        c,
        86,
        54 - Math.sin(seg(p, 0.4, 0.6) * Math.PI) * 6,
        4,
        "#fbbf24",
        { t },
      );
    }
    if (p > 0.55 && p < 0.93) {
      drawCoin(
        c,
        100,
        56 - Math.sin(seg(p, 0.55, 0.75) * Math.PI) * 8,
        4,
        "#fbbf24",
        { t },
      );
      floatText(c, 104, 36, "extra!", "#fde047", seg(p, 0.55, 0.9), 10);
    }
  },
  ironSkin(c, p, t) {
    hero(c, t);
    foe(
      c,
      "skeleton",
      62 - Math.sin(seg(p, 0.3, 0.5) * Math.PI) * 6,
      50,
      t,
      "#e2e8f0",
    );
    floatText(c, HERO.x, 32, "-10", "#fca5a5", seg(p, 0.45, 0.7), 10);
    floatText(c, HERO.x, 32, "-9", "#fde047", seg(p, 0.7, 0.95), 14);
    if (p > 0.45 && p < 0.7) {
      c.strokeStyle = "rgba(203,213,225,0.9)";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(HERO.x, HERO.y, 14, -0.6, 0.6);
      c.stroke();
    }
  },
  quickDraw(c, p, t) {
    hero(c, t);
    for (let i = 0; i < 3; i++) {
      const start = i * 0.22;
      if (p > start && p < start + 0.3) {
        drawProjectile(
          c,
          HERO.x + 12 + seg(p, start, start + 0.3) * 100,
          50,
          3,
          "#facc15",
          220,
          0,
          "bolt",
        );
      }
    }
    foe(c, "zombie", 128, 50, t);
  },
  keenEye(c, p, t) {
    hero(c, t);
    target(c, p, 0.5, "ogre", 100, 50, t, "#f97316");
    floatText(c, 100, 34, "x2 CRIT", "#f472b6", seg(p, 0.5, 0.92), 13);
  },
  bloodthirst(c, p, t) {
    hero(c, t);
    bar(c, 8, 20, 50, 0.4 + seg(p, 0.6, 0.85) * 0.2, "#f43f5e");
    target(c, p, 0.35, "zombie", 96, 56, t);
    if (p > 0.38 && p < 0.7) {
      const u = seg(p, 0.38, 0.7);
      c.fillStyle = "#fb7185";
      c.font = "900 12px system-ui, sans-serif";
      c.textAlign = "center";
      c.fillText("♥", 96 + (HERO.x - 96) * u, 50 - u * 26 + 8);
    }
  },
  chill(c, p, t) {
    hero(c, t, 30, 50);
    const x = 128 - seg(p, 0, 0.9) * 44;
    c.fillStyle = "rgba(125,211,252,0.35)";
    c.beginPath();
    c.arc(x, 54, 14, 0, Math.PI * 2);
    c.fill();
    foe(c, "zombie", x, 54, t);
    floatText(c, x, 34, "*", "#7dd3fc", seg((p * 2) % 1, 0, 1), 14);
    floatText(c, x + 12, 40, "*", "#bae6fd", seg((p * 2 + 0.5) % 1, 0, 1), 11);
  },
  scholar(c, p, t) {
    hero(c, t);
    const g = seg(p, 0.1, 0.4);
    if (g < 1) drawGem(c, 70 - g * 30, 50, 4, "#a78bfa");
    bar(c, 40, 22, 80, 0.3 + seg(p, 0.4, 0.8) * 0.7, "#a78bfa");
    floatText(c, 120, 40, "LEVEL!", "#fde047", seg(p, 0.8, 1), 11);
  },
  spikes(c, p, t) {
    hero(c, t);
    const x = 56 - Math.sin(seg(p, 0.3, 0.5) * Math.PI) * 4;
    foe(c, "zombie", x, 50, t);
    if (p > 0.45 && p < 0.7) {
      drawImpactBurst(c, 46, 48, seg(p, 0.45, 0.7), "#fde047");
      floatText(c, 54, 34, "ouch", "#fca5a5", seg(p, 0.45, 0.8), 10);
    }
  },
};

const ABILITY_SCENE: Scene = (c, p, t) => {
  hero(c, t);
  c.save();
  c.globalAlpha = 0.5 + 0.5 * seg(p, 0, 0.5);
  drawEnemy(c, "lich", 106, 46 + Math.sin(t / 300) * 2, 13, "#c084fc", { t });
  c.restore();
};

export function drawCardDemo(c: Ctx, t: number, spec: DemoSpec) {
  const p = (t % PERIOD_MS) / PERIOD_MS;
  c.fillStyle = "#2a2160";
  c.fillRect(0, 0, DEMO_W, DEMO_H);
  c.fillStyle = "#1b1445";
  c.fillRect(0, GROUND_Y, DEMO_W, DEMO_H - GROUND_Y);
  c.strokeStyle = "#5a4ca8";
  c.lineWidth = 2;
  c.setLineDash([8, 6]);
  c.beginPath();
  c.moveTo(0, GROUND_Y);
  c.lineTo(DEMO_W, GROUND_Y);
  c.stroke();
  c.setLineDash([]);
  const scene =
    spec.kind === "ability"
      ? ABILITY_SCENE
      : spec.kind === "stat"
        ? STAT_SCENE[spec.statId ?? ""]
        : WEAPON_SCENE[spec.weaponId as WeaponId];
  if (scene) scene(c, p, t);
  else hero(c, t);
}
