// Runs a best-of-three duel in a canvas: input, the round flow, rendering and
// feedback. The rules themselves live in duel.ts.
import {
  ARENA_H,
  ARENA_W,
  DIFFICULTY,
  FIGHTER_RADIUS,
  aiInput,
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
  drawSlamWarning,
  drawSlash,
  ringPop,
  stepParticles,
  type Particle,
} from "./fx";
import { orbitCover, orbitShieldShape } from "./balance";
import { drawEnemy, drawPlayer, drawProjectile } from "./sprites";
import type { WeaponId } from "./engine";

const INK = "#0f172a";
const ROUND_LIMIT_MS = 60_000;
const COUNTDOWN_MS = 2400;
const ROUND_END_MS = 1800;
const WINS_NEEDED = 2;
const MAX_ROUNDS = 5;
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

  // --- input: WASD / arrows, or drag anywhere on the field --------------
  const keys = new Set<string>();
  const onKey = (down: boolean) => (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
      ].includes(k)
    ) {
      if (down) keys.add(k);
      else keys.delete(k);
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
  const toWorld = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * ARENA_W,
      y: ((e.clientY - r.top) / r.height) * ARENA_H,
    };
  };
  const pDown = (e: PointerEvent) => {
    const p = toWorld(e);
    drag = { id: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y };
    canvas.setPointerCapture?.(e.pointerId);
  };
  const pMove = (e: PointerEvent) => {
    if (!drag || drag.id !== e.pointerId) return;
    const p = toWorld(e);
    drag.x = p.x;
    drag.y = p.y;
  };
  const pUp = (e: PointerEvent) => {
    if (drag?.id === e.pointerId) drag = null;
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
    return { x, y };
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
    nowMs += dtMs;
    stepParticles(particles, dtMs);
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
    if (f.side === 0) {
      drawPlayer(ctx, f.x, f.y, FIGHTER_RADIUS, PLAYER_COLOR, f.aim, flash);
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
        },
      );
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
    // Wind-ups: the tell that makes every hit dodgeable.
    const w = f.windup;
    if (w) {
      const p = 1 - w.msLeft / w.totalMs;
      if (w.kind === "nova") {
        drawSlamWarning(ctx, f.x, f.y, w.radius, p);
      } else {
        ctx.save();
        ctx.globalAlpha = 0.25 + p * 0.4;
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, w.radius, w.angle - w.arc / 2, w.angle + w.arc / 2);
        ctx.closePath();
        ctx.fillStyle = f.side === 0 ? PLAYER_COLOR : RIVAL_COLOR;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function render() {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, ARENA_W, ARENA_H);
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, ARENA_W, ARENA_H);
    ctx.fillStyle = "rgba(148,163,184,0.13)";
    for (let x = 20; x < ARENA_W; x += 30) {
      for (let y = 20; y < ARENA_H; y += 30) ctx.fillRect(x, y, 2, 2);
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
    if (phase === "countdown" && banner !== "FIGHT!") {
      label(`ROUND ${roundNo}`, ARENA_W / 2, ARENA_H * 0.36, 26, "#fde047");
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
        "WASD or drag to move — weapons auto-fire",
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
