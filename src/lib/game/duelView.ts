// Runs a best-of-three duel in a canvas: input, the round flow, rendering and
// feedback. The rules themselves live in duel.ts.
import {
  ARENA_H,
  ARENA_W,
  DIFFICULTY,
  FIGHTER_RADIUS,
  aiInput,
  attackRange,
  chargeFrac,
  createDuel,
  newAiMemory,
  orbiterPositions,
  stepDuel,
  type Difficulty,
  type DuelState,
  type Fighter,
  type Input,
} from "./duel";
import {
  burst,
  drawBolt,
  drawCoverArc,
  drawDamageNumber,
  drawNovaRing,
  drawParticles,
  drawSlamText,
  drawSlash,
  ringPop,
  stepParticles,
  type Particle,
} from "./fx";
import { bladeArcShape, orbitCover, orbitShieldShape } from "./balance";
import {
  drawEnemy,
  drawPlayer,
  drawProjectile,
  drawSwingArm,
  drawWeaponGlyph,
  type EnemyPose,
} from "./sprites";
import { BIOMES, createBackdrop } from "./scenery";
import type { WeaponId } from "./engine";

const INK = "#0f172a";
const ROUND_LIMIT_MS = 60_000;
const COUNTDOWN_MS = 2400;
const ROUND_END_MS = 1800;
const WINS_NEEDED = 2;
const MAX_ROUNDS = 5;
const CHAIN_CONE_HALF = 0.32;
const PLAYER_COLOR = "#38bdf8";
const RIVAL_COLOR = "#fb7185";

const RIVAL_SHAPE: Record<WeaponId, Parameters<typeof drawEnemy>[1]> = {
  bolt: "skeleton",
  homingDart: "bat",
  chainLightning: "ghost",
  novaPulse: "ogre",
  orbitShield: "zombie",
  bladeArc: "reaper",
};
const RIVAL_BODY: Record<WeaponId, string> = {
  bolt: "#e2e8f0",
  homingDart: "#f472b6",
  chainLightning: "#a5f3fc",
  novaPulse: "#f97316",
  orbitShield: "#4ade80",
  bladeArc: "#c026d3",
};

// The rival crouches while it charges and snaps the other way on release.
function fighterPose(f: Fighter): EnemyPose {
  const dir = Math.cos(f.aim) >= 0 ? 1 : -1;
  const c = chargeFrac(f);
  const rec = Math.min(1, f.recoverMs / 400);
  if (c > 0) {
    return {
      sx: 1 + 0.18 * c,
      sy: 1 - 0.22 * c,
      lift: 0,
      tilt: -dir * 0.28 * c,
    };
  }
  return {
    sx: 1 - 0.14 * rec,
    sy: 1 + 0.2 * rec,
    lift: 0,
    tilt: dir * 0.3 * rec,
  };
}

const bladeHalfArc = (f: Fighter) =>
  (bladeArcShape(f.level).arcDeg * Math.PI) / 360;

export const WEAPON_NAME: Record<WeaponId, string> = {
  bolt: "Bolt",
  homingDart: "Homing Dart",
  chainLightning: "Chain Lightning",
  novaPulse: "Nova Pulse",
  orbitShield: "Orbit Shield",
  bladeArc: "Blade Arc",
};

export interface DuelOptions {
  weaponId: WeaponId;
  level: number;
  rivalWeaponId: WeaponId;
  difficulty: Difficulty;
  renderScale?: number;
  reduceMotion?: boolean;
}

export interface DuelSummary {
  won: boolean;
  rounds: {
    winner: 0 | 1 | null;
    timeS: number;
    playerHp: number;
    rivalHp: number;
  }[];
  damageDealt: number;
  hitsTaken: number;
}

export interface DuelCallbacks {
  onMatchEnd: (summary: DuelSummary) => void;
}

type Phase = "countdown" | "fight" | "roundEnd" | "over";

export function startDuel(
  canvas: HTMLCanvasElement,
  options: DuelOptions,
  callbacks: DuelCallbacks,
) {
  const scale = options.renderScale ?? 1;
  const ctx = canvas.getContext("2d")!;
  const reduceMotion = options.reduceMotion ?? false;
  const diff = DIFFICULTY[options.difficulty];
  const backdrop = createBackdrop(
    ARENA_W,
    ARENA_H,
    scale,
    BIOMES[Math.floor(Math.random() * BIOMES.length)],
    Math.floor(Math.random() * 1e9),
    true,
  );
  let hitStopMs = 0; // a brief freeze on a heavy hit or a knockout
  let koLoser: Fighter | null = null;
  let koByTime = false;

  let state: DuelState;
  let rivalMem = newAiMemory();
  let phase: Phase = "countdown";
  let phaseMs = 0;
  let roundMs = 0;
  let roundNo = 1;
  const wins: [number, number] = [0, 0];
  const rounds: DuelSummary["rounds"] = [];
  let damageDealt = 0;
  let hitsTaken = 0;
  let banner = "";
  let shakeMag = 0;
  let shakeUntil = 0;
  let nowMs = 0;

  const particles: Particle[] = [];
  const numbers: {
    x: number;
    y: number;
    amount: number;
    at: number;
    big: boolean;
  }[] = [];
  const slashes: {
    x: number;
    y: number;
    angle: number;
    arc: number;
    radius: number;
    at: number;
  }[] = [];
  const novas: { x: number; y: number; radius: number; at: number }[] = [];
  const chains: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    at: number;
  }[] = [];

  function newRound() {
    state = createDuel(
      { weaponId: options.weaponId, level: options.level },
      {
        weaponId: options.rivalWeaponId,
        level: options.level,
        speedMult: diff.speedMult,
      },
    );
    rivalMem = newAiMemory();
    phase = "countdown";
    phaseMs = 0;
    roundMs = 0;
    banner = "";
  }
  newRound();

  // --- input: WASD/arrows move, the pointer aims, hold to charge ---------
  // Mouse: move the cursor to aim, hold the button (or Space) to charge and
  // release to strike. Touch: drag in the left half to move; press and hold
  // on the right half to aim at that spot and charge, lift to strike.
  const keys = new Set<string>();
  let spaceHeld = false;
  const MOVE_KEYS = [
    "w",
    "a",
    "s",
    "d",
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright",
  ];
  const onKey = (down: boolean) => (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (MOVE_KEYS.includes(k)) {
      if (down) keys.add(k);
      else keys.delete(k);
      e.preventDefault();
    } else if (k === " ") {
      spaceHeld = down;
      e.preventDefault();
    }
  };
  const keyDown = onKey(true);
  const keyUp = onKey(false);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);

  let drag: {
    id: number;
    ox: number;
    oy: number;
    x: number;
    y: number;
  } | null = null;
  let aimPoint: { x: number; y: number } | null = null;
  let chargeId: number | null = null;
  const toWorld = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * ARENA_W,
      y: ((e.clientY - r.top) / r.height) * ARENA_H,
    };
  };
  const pDown = (e: PointerEvent) => {
    const p = toWorld(e);
    canvas.setPointerCapture?.(e.pointerId);
    if (e.pointerType === "touch" && p.x < ARENA_W * 0.5 && !drag) {
      drag = { id: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y };
    } else {
      aimPoint = p;
      chargeId = e.pointerId;
    }
  };
  const pMove = (e: PointerEvent) => {
    const p = toWorld(e);
    if (drag && drag.id === e.pointerId) {
      drag.x = p.x;
      drag.y = p.y;
    } else if (e.pointerType === "mouse" || chargeId === e.pointerId) {
      aimPoint = p;
    }
  };
  const pUp = (e: PointerEvent) => {
    if (drag?.id === e.pointerId) drag = null;
    if (chargeId === e.pointerId) chargeId = null;
  };
  canvas.addEventListener("pointerdown", pDown);
  canvas.addEventListener("pointermove", pMove);
  canvas.addEventListener("pointerup", pUp);
  canvas.addEventListener("pointercancel", pUp);

  function playerInput(): Input {
    let x = 0;
    let y = 0;
    if (keys.has("a") || keys.has("arrowleft")) x -= 1;
    if (keys.has("d") || keys.has("arrowright")) x += 1;
    if (keys.has("w") || keys.has("arrowup")) y -= 1;
    if (keys.has("s") || keys.has("arrowdown")) y += 1;
    if (drag) {
      const dx = drag.x - drag.ox;
      const dy = drag.y - drag.oy;
      const len = Math.hypot(dx, dy);
      if (len > 6) {
        x += dx / Math.max(len, 40);
        y += dy / Math.max(len, 40);
      }
    }
    const me = state.fighters[0];
    const aim = aimPoint
      ? Math.atan2(aimPoint.y - me.y, aimPoint.x - me.x)
      : null;
    return { x, y, aim, charge: chargeId !== null || spaceHeld };
  }

  // --- simulation -------------------------------------------------------
  function handleEvents() {
    for (const ev of state.events) {
      if (ev.type === "hit") {
        const mine = ev.side === 0;
        if (!reduceMotion)
          burst(
            particles,
            ev.x,
            ev.y,
            mine ? PLAYER_COLOR : RIVAL_COLOR,
            6,
            150,
          );
        numbers.push({
          x: ev.x,
          y: ev.y - FIGHTER_RADIUS,
          amount: ev.amount,
          at: nowMs,
          big: ev.amount >= 40,
        });
        if (mine && !reduceMotion) {
          shakeMag = 4;
          shakeUntil = nowMs + 180;
        }
        const victim = state.fighters[ev.side];
        if (!reduceMotion && ev.amount >= victim.maxHp * 0.12) hitStopMs = 70;
      } else if (ev.type === "block") {
        if (!reduceMotion) burst(particles, ev.x, ev.y, "#facc15", 5, 110);
      } else if (ev.type === "slash") {
        slashes.push({
          x: ev.x,
          y: ev.y,
          angle: ev.angle,
          arc: ev.arc,
          radius: ev.radius,
          at: nowMs,
        });
      } else if (ev.type === "nova") {
        novas.push({ x: ev.x, y: ev.y, radius: ev.radius, at: nowMs });
      } else if (ev.type === "chain") {
        chains.push({ x1: ev.x1, y1: ev.y1, x2: ev.x2, y2: ev.y2, at: nowMs });
      } else if (ev.type === "dash") {
        if (!reduceMotion) ringPop(particles, ev.x, ev.y, "#facc15", 40);
      } else if (ev.type === "stagger") {
        if (!reduceMotion) {
          burst(particles, ev.x, ev.y, "#f8fafc", 10, 190);
          ringPop(particles, ev.x, ev.y, "#fb7185", 36);
        }
      }
    }
  }

  function endRound(winner: 0 | 1 | null) {
    const [a, b] = state.fighters;
    rounds.push({
      winner,
      timeS: Math.round(roundMs / 100) / 10,
      playerHp: Math.round(a.hp),
      rivalHp: Math.round(b.hp),
    });
    damageDealt += a.damageDealt;
    hitsTaken += a.hitsTaken;
    if (winner !== null) wins[winner] += 1;
    banner = winner === 0 ? "ROUND WON" : winner === 1 ? "ROUND LOST" : "DRAW";
    phase = "roundEnd";
    phaseMs = 0;
    koLoser = winner === 0 ? b : winner === 1 ? a : null;
    koByTime = a.hp > 0 && b.hp > 0;
    if (!reduceMotion) hitStopMs = 140;
    if (!reduceMotion) {
      const loser = winner === 0 ? b : winner === 1 ? a : null;
      if (loser) {
        burst(
          particles,
          loser.x,
          loser.y,
          loser.side === 0 ? PLAYER_COLOR : RIVAL_COLOR,
          26,
          260,
        );
        ringPop(particles, loser.x, loser.y, "#fde047", 120);
      }
    }
  }

  function update(dtMs: number) {
    if (hitStopMs > 0) {
      hitStopMs -= dtMs;
      return;
    }
    // The knockout plays in slow motion.
    const vdt =
      phase === "roundEnd" && phaseMs < 800 && !reduceMotion
        ? dtMs * 0.3
        : dtMs;
    nowMs += vdt;
    stepParticles(particles, vdt);
    phaseMs += dtMs;
    if (phase === "countdown") {
      const left = Math.ceil((COUNTDOWN_MS - phaseMs) / 800);
      banner =
        phaseMs >= COUNTDOWN_MS - 500
          ? "FIGHT!"
          : String(Math.max(1, left - 0));
      if (phaseMs >= COUNTDOWN_MS) {
        phase = "fight";
        phaseMs = 0;
        banner = "";
      }
      return;
    }
    if (phase === "fight") {
      roundMs += dtMs;
      const rival = state.fighters[1];
      stepDuel(state, dtMs, [
        playerInput(),
        aiInput(state, rival, options.difficulty, rivalMem, Math.random),
      ]);
      handleEvents();
      const [a, b] = state.fighters;
      if (a.hp <= 0 || b.hp <= 0) {
        endRound(a.hp <= 0 && b.hp <= 0 ? null : a.hp <= 0 ? 1 : 0);
      } else if (roundMs >= ROUND_LIMIT_MS) {
        const pa = a.hp / a.maxHp;
        const pb = b.hp / b.maxHp;
        endRound(Math.abs(pa - pb) < 0.005 ? null : pa > pb ? 0 : 1);
      }
      return;
    }
    if (phase === "roundEnd" && phaseMs >= ROUND_END_MS) {
      const decided =
        wins[0] >= WINS_NEEDED ||
        wins[1] >= WINS_NEEDED ||
        rounds.length >= MAX_ROUNDS;
      if (decided) {
        phase = "over";
        stop();
        callbacks.onMatchEnd({
          won: wins[0] > wins[1],
          rounds,
          damageDealt: Math.round(damageDealt),
          hitsTaken,
        });
        return;
      }
      roundNo += 1;
      newRound();
    }
  }

  // --- drawing ----------------------------------------------------------
  function bar(
    x: number,
    y: number,
    w: number,
    frac: number,
    color: string,
    flip: boolean,
  ) {
    const f = Math.max(0, Math.min(1, frac));
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(x, y, w, 12);
    ctx.fillStyle = color;
    if (flip) ctx.fillRect(x + w * (1 - f), y, w * f, 12);
    else ctx.fillRect(x, y, w * f, 12);
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.strokeRect(x, y, w, 12);
  }

  function label(
    text: string,
    x: number,
    y: number,
    size: number,
    color: string,
    align: CanvasTextAlign = "center",
  ) {
    ctx.font = `900 ${size}px sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(3, size / 4);
    ctx.strokeStyle = INK;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function drawFighter(f: Fighter) {
    const flash = f.hitFlashMs / 140;
    const tint = f.side === 0 ? PLAYER_COLOR : RIVAL_COLOR;
    // Shadow and a team-coloured ring on the ground, so the two are never
    // mistaken for each other whatever weapon they carry.
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(
      f.x,
      f.y + FIGHTER_RADIUS * 1.5,
      FIGHTER_RADIUS * 1.3,
      FIGHTER_RADIUS * 0.5,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 3;
    ctx.strokeStyle = tint;
    ctx.beginPath();
    ctx.ellipse(
      f.x,
      f.y + FIGHTER_RADIUS * 1.5,
      FIGHTER_RADIUS * 1.8,
      FIGHTER_RADIUS * 0.75,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();
    if (f.side === 0) {
      drawPlayer(
        ctx,
        f.x,
        f.y,
        FIGHTER_RADIUS,
        PLAYER_COLOR,
        f.aim,
        flash,
        fighterPose(f),
      );
    } else {
      drawEnemy(
        ctx,
        RIVAL_SHAPE[f.weaponId],
        f.x,
        f.y,
        FIGHTER_RADIUS,
        RIVAL_BODY[f.weaponId],
        {
          flashAlpha: flash,
          pose: fighterPose(f),
        },
      );
      if (f.weaponId === "bladeArc") {
        // The scythe is drawn back while charging, then whipped across.
        const half = bladeHalfArc(f);
        const c = chargeFrac(f);
        const rec = Math.min(1, f.recoverMs / 300);
        drawSwingArm(
          ctx,
          RIVAL_SHAPE[f.weaponId],
          f.x,
          f.y,
          FIGHTER_RADIUS,
          f.aim,
          f.recoverMs > 0 ? half * 0.6 * rec : -half * Math.min(1, c * 1.5),
          RIVAL_BODY[f.weaponId],
        );
      }
      // A red ring marks the rival so it is never confused with you.
      ctx.save();
      ctx.beginPath();
      ctx.arc(f.x, f.y, FIGHTER_RADIUS + 6, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = RIVAL_COLOR;
      ctx.stroke();
      ctx.restore();
    }
    // The weapon in hand: held out toward the aim, drawn back while charging.
    if (
      f.weaponId !== "orbitShield" &&
      !(f.side === 1 && f.weaponId === "bladeArc")
    ) {
      const c = chargeFrac(f);
      const rec = Math.min(1, f.recoverMs / 300);
      let a = f.aim;
      if (f.weaponId === "bladeArc") {
        a +=
          f.recoverMs > 0
            ? bladeHalfArc(f) * (1.2 - 2.4 * (1 - rec))
            : -bladeHalfArc(f) * c;
      }
      const reach = FIGHTER_RADIUS * 1.9 - c * 4 + rec * 3;
      drawWeaponGlyph(
        ctx,
        f.weaponId,
        f.x + Math.cos(a) * reach,
        f.y + Math.sin(a) * reach,
        FIGHTER_RADIUS * (0.95 + c * 0.3),
        a,
      );
    }
    // A name tag floating over each head.
    {
      const tag = f.side === 0 ? "YOU" : "RIVAL";
      ctx.save();
      ctx.font = "900 10px sans-serif";
      const tw = ctx.measureText(tag).width + 12;
      const tx = f.x - tw / 2;
      const ty = f.y - FIGHTER_RADIUS * 2.7;
      ctx.fillStyle = tint;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(tx, ty, tw, 15, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tag, f.x, ty + 8);
      ctx.restore();
    }
    if (f.weaponId === "orbitShield") {
      const cover = orbitCover(f.level);
      const ring = orbitShieldShape(f.level).radius;
      for (const o of orbiterPositions(f)) {
        drawCoverArc(ctx, f.x, f.y, ring, o.bearing, cover.halfArcRad);
      }
      for (const o of orbiterPositions(f)) {
        ctx.beginPath();
        ctx.arc(o.x, o.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#facc15";
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
    }
    // The charge is the tell: it shows exactly where and how far the strike
    // will land if let go now, for both fighters.
    const c = chargeFrac(f);
    if (c > 0) {
      const col = f.side === 0 ? PLAYER_COLOR : RIVAL_COLOR;
      const reach = attackRange(f.weaponId, f.level, Math.max(0.2, c));
      const full = c >= 1;
      const pulse = full ? 0.5 + 0.5 * Math.sin(nowMs / 60) : 0;
      ctx.save();
      ctx.lineCap = "round";
      if (f.weaponId === "novaPulse") {
        ctx.beginPath();
        ctx.arc(f.x, f.y, reach, 0, Math.PI * 2);
        ctx.globalAlpha = 0.12 + c * 0.2;
        ctx.fillStyle = col;
        ctx.fill();
        ctx.globalAlpha = 0.5 + pulse * 0.4;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = INK;
        ctx.stroke();
      } else if (f.weaponId === "bladeArc" || f.weaponId === "chainLightning") {
        const half =
          f.weaponId === "bladeArc" ? bladeHalfArc(f) : CHAIN_CONE_HALF;
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, reach, f.aim - half, f.aim + half);
        ctx.closePath();
        ctx.globalAlpha = 0.14 + c * 0.28;
        ctx.fillStyle = col;
        ctx.fill();
        ctx.globalAlpha = 0.5 + pulse * 0.4;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = INK;
        ctx.stroke();
      } else {
        const endX = f.x + Math.cos(f.aim) * reach;
        const endY = f.y + Math.sin(f.aim) * reach;
        ctx.globalAlpha = 0.5 + pulse * 0.4;
        ctx.lineWidth = 6 + c * 3;
        ctx.strokeStyle = INK;
        ctx.setLineDash(f.weaponId === "homingDart" ? [4, 8] : []);
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.lineWidth = 3 + c * 3;
        ctx.strokeStyle = col;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(endX, endY, 5 + c * 5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
      // Charge ring around the body.
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(
        f.x,
        f.y,
        FIGHTER_RADIUS + 9,
        -Math.PI / 2,
        -Math.PI / 2 + c * Math.PI * 2,
      );
      ctx.lineWidth = 5;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.strokeStyle = full ? "#fde047" : col;
      ctx.stroke();
      ctx.restore();
    }
  }

  function render() {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, ARENA_W, ARENA_H);
    if (backdrop) {
      ctx.drawImage(backdrop, 0, 0, ARENA_W, ARENA_H);
    } else {
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, ARENA_W, ARENA_H);
    }
    // Centre line: the two spawn sides, and a clock face for the round.
    ctx.strokeStyle = "rgba(148,163,184,0.15)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(ARENA_W / 2, 60);
    ctx.lineTo(ARENA_W / 2, ARENA_H);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    if (!reduceMotion && phase === "roundEnd" && koLoser && phaseMs < 1100) {
      // Punch in on the knockout, then ease back out.
      const k = Math.sin(Math.min(1, phaseMs / 1100) * Math.PI);
      const zoom = 1 + 0.12 * k;
      ctx.translate(koLoser.x * (1 - zoom), koLoser.y * (1 - zoom));
      ctx.scale(zoom, zoom);
    }
    if (!reduceMotion && nowMs < shakeUntil) {
      const fade = Math.min(1, (shakeUntil - nowMs) / 180);
      ctx.translate(
        (Math.random() - 0.5) * 2 * shakeMag * fade,
        (Math.random() - 0.5) * 2 * shakeMag * fade,
      );
    }
    for (const f of state.fighters) drawFighter(f);
    for (const s of state.shots) {
      const mine = s.owner === 0;
      if (!mine) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 8.5, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = RIVAL_COLOR;
        ctx.stroke();
        ctx.restore();
      }
      drawProjectile(
        ctx,
        s.x,
        s.y,
        5,
        mine ? PLAYER_COLOR : "#fda4af",
        s.vx,
        s.vy,
      );
    }
    for (let i = slashes.length - 1; i >= 0; i--) {
      const sl = slashes[i];
      const p = (nowMs - sl.at) / 200;
      if (p >= 1) slashes.splice(i, 1);
      else drawSlash(ctx, sl.x, sl.y, sl.radius, sl.angle, sl.arc / 2, p);
    }
    for (let i = novas.length - 1; i >= 0; i--) {
      const nv = novas[i];
      const p = (nowMs - nv.at) / 320;
      if (p >= 1) novas.splice(i, 1);
      else drawNovaRing(ctx, nv.x, nv.y, nv.radius, p);
    }
    for (let i = chains.length - 1; i >= 0; i--) {
      const c = chains[i];
      const p = (nowMs - c.at) / 220;
      if (p >= 1) chains.splice(i, 1);
      else drawBolt(ctx, c.x1, c.y1, c.x2, c.y2, p, c.at);
    }
    drawParticles(ctx, particles);
    for (let i = numbers.length - 1; i >= 0; i--) {
      const n = numbers[i];
      const p = (nowMs - n.at) / 750;
      if (p >= 1) numbers.splice(i, 1);
      else drawDamageNumber(ctx, n.x, n.y - p * 34, n.amount, p, n.big);
    }
    ctx.restore();

    // HUD
    const [a, b] = state.fighters;
    const bw = 220;
    bar(14, 16, bw, a.hp / a.maxHp, PLAYER_COLOR, false);
    bar(ARENA_W - 14 - bw, 16, bw, b.hp / b.maxHp, RIVAL_COLOR, true);
    label("YOU", 14, 40, 13, "#e0f2fe", "left");
    label(
      WEAPON_NAME[a.weaponId].toUpperCase(),
      14 + bw,
      40,
      11,
      "#94a3b8",
      "right",
    );
    label(
      `RIVAL · ${diff.label.toUpperCase()}`,
      ARENA_W - 14,
      40,
      13,
      "#ffe4e6",
      "right",
    );
    label(
      WEAPON_NAME[b.weaponId].toUpperCase(),
      ARENA_W - 14 - bw,
      40,
      11,
      "#94a3b8",
      "left",
    );
    const left = Math.max(0, Math.ceil((ROUND_LIMIT_MS - roundMs) / 1000));
    label(
      String(left),
      ARENA_W / 2,
      24,
      22,
      left <= 10 ? "#fb7185" : "#f8fafc",
    );
    for (let i = 0; i < WINS_NEEDED; i++) {
      for (const side of [0, 1] as const) {
        const cx = ARENA_W / 2 + (side === 0 ? -1 : 1) * (22 + i * 20);
        ctx.beginPath();
        ctx.arc(cx, 52, 6, 0, Math.PI * 2);
        ctx.fillStyle =
          wins[side] > i
            ? side === 0
              ? PLAYER_COLOR
              : RIVAL_COLOR
            : "#1e293b";
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
    }
    if (phase === "countdown" && roundNo === 1 && phaseMs < COUNTDOWN_MS) {
      // The two fighters are introduced, panels sliding in from each side.
      const slide = Math.min(1, phaseMs / 450);
      const ease = 1 - (1 - slide) * (1 - slide);
      const pw = 214;
      const py = ARENA_H * 0.17;
      const panel = (side: 0 | 1) => {
        const f = state.fighters[side];
        const x =
          side === 0 ? -pw + ease * (pw + 16) : ARENA_W + -ease * (pw + 16);
        const col = side === 0 ? PLAYER_COLOR : RIVAL_COLOR;
        ctx.save();
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x, py, pw, 62, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.roundRect(x, py, pw, 22, [12, 12, 0, 0]);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        label(
          side === 0 ? "YOU" : `RIVAL · ${diff.label.toUpperCase()}`,
          x + pw / 2,
          py + 11,
          13,
          "#f8fafc",
        );
        drawWeaponGlyph(ctx, f.weaponId, x + 26, py + 42, 11, -Math.PI / 4);
        label(WEAPON_NAME[f.weaponId], x + 46, py + 38, 15, "#f8fafc", "left");
        label(`Level ${f.level}`, x + 46, py + 54, 11, "#94a3b8", "left");
      };
      panel(0);
      panel(1);
      drawSlamText(
        ctx,
        "VS",
        ARENA_W / 2,
        py + 31,
        44,
        Math.min(1, phaseMs / 1500),
        "#fde047",
        6,
      );
    }
    if (phase === "countdown" && banner !== "FIGHT!" && roundNo > 1) {
      label(`ROUND ${roundNo}`, ARENA_W / 2, ARENA_H * 0.36, 26, "#fde047");
    }
    if (phase === "roundEnd" && koLoser && phaseMs < 1400) {
      drawSlamText(
        ctx,
        koByTime ? "TIME!" : "K.O.",
        ARENA_W / 2,
        ARENA_H * 0.28,
        koByTime ? 56 : 84,
        phaseMs / 1400,
        "#fde047",
        8,
      );
    }
    if (banner) {
      const big = banner.length <= 2 ? 96 : 56;
      label(
        banner,
        ARENA_W / 2,
        ARENA_H * 0.48,
        big,
        banner === "ROUND LOST" ? "#fb7185" : "#f8fafc",
      );
    }
    if (phase === "countdown" && roundNo === 1) {
      label(
        "WASD move · aim with the mouse · hold click or Space to charge, release to strike",
        ARENA_W / 2,
        ARENA_H - 22,
        13,
        "#94a3b8",
      );
    }
  }

  // --- loop -------------------------------------------------------------
  const STEP = 1000 / 60;
  let acc = 0;
  let last = performance.now();
  let raf = 0;
  let stopped = false;
  function frame(t: number) {
    if (stopped) return;
    acc += Math.min(100, t - last);
    last = t;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
      if (stopped) return;
    }
    render();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function stop() {
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
    canvas.removeEventListener("pointerdown", pDown);
    canvas.removeEventListener("pointermove", pMove);
    canvas.removeEventListener("pointerup", pUp);
    canvas.removeEventListener("pointercancel", pUp);
  }
  return { stop };
}
