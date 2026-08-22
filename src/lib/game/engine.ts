// PHASE 1-2 — core loop + full enemy roster (see docs/GAME-PROGRESS.md).
//
// Phase 1 scope: player movement, one weapon (auto-fires at the nearest
// enemy), XP-gem pickup with magnetic pull, contact damage, a fixed-length
// countdown, game over.
// Phase 2 scope, layered on top: the full 5-enemy roster (Zombie/Bat/
// Skeleton/Ghost/Ogre) unlocked on a fixed absolute-time schedule, a boss
// (Reaper) triggered near the end of the run, and an exponential-ish spawn
// density ramp. Enemy tiers (Normal/Veteran/Elite) are stubbed at "always
// Normal" per docs/GAME-PROGRESS.md — they depend on `powerIndex` from the
// Phase 5 shop, which doesn't exist yet.
//
// Spawn/collision math is kept intentionally cheap (linear scans over small
// arrays, no quadtree) and the density ramp is floored at a minimum interval
// so a very long run can't degrade frame time — a deliberate simplification
// of the design doc's literally-uncapped curve, per the user's explicit
// instruction not to overload their machine.
import {
  init,
  initKeys,
  keyPressed,
  GameLoop,
  Sprite,
  type GameObject,
} from "kontra";
import { createLogger } from "./logger";

const log = createLogger("engine");

const PLAYER_SPEED = 160; // px/s
const PLAYER_RADIUS = 14;
const PLAYER_MAX_HP = 100;
const PLAYER_HIT_COOLDOWN_MS = 600; // i-frames, melee contact only
const CONTACT_DAMAGE = 8; // fallback if an enemy def is somehow missing one

const PROJECTILE_SPEED = 320;
const PROJECTILE_RADIUS = 4;
const PROJECTILE_DAMAGE = 6;
const FIRE_INTERVAL_MS = 550;

const GEM_RADIUS = 5;
const GEM_PICKUP_RADIUS = 90; // magnetic pull begins within this distance
const GEM_PULL_SPEED = 260;
const GEM_COLLECT_DISTANCE = 14;

const TEST_RUN_DURATION_S = 90; // fixed placeholder; real formula is Phase 4

// --- Phase 2: spawn density ramp ---
const BASE_SPAWN_INTERVAL_MS = 1400;
const RAMP_HALF_LIFE_S = 45; // spawn interval halves roughly every 45s
const MIN_SPAWN_INTERVAL_MS = 150; // perf floor — see file header
const MAX_ALIVE_ENEMIES = 60; // perf cap — see file header

// --- Phase 2: enemy roster ---
type EnemyKind = "zombie" | "bat" | "skeleton" | "ghost" | "ogre" | "reaper";

interface EnemyDef {
  kind: Exclude<EnemyKind, "reaper">;
  unlockAtS: number;
  radius: number;
  speed: number;
  hp: number;
  contactDamage: number;
  color: string;
  weight: number; // relative spawn weight once unlocked
}

const ENEMY_DEFS: EnemyDef[] = [
  {
    kind: "zombie",
    unlockAtS: 0,
    radius: 12,
    speed: 55,
    hp: 12,
    contactDamage: 8,
    color: "#4ade80",
    weight: 10,
  },
  {
    kind: "bat",
    unlockAtS: 60,
    radius: 8,
    speed: 115,
    hp: 6,
    contactDamage: 5,
    color: "#f472b6",
    weight: 6,
  },
  {
    kind: "skeleton",
    unlockAtS: 120,
    radius: 13,
    speed: 48,
    hp: 26,
    contactDamage: 10,
    color: "#e2e8f0",
    weight: 5,
  },
  {
    kind: "ghost",
    unlockAtS: 180,
    radius: 12,
    speed: 35,
    hp: 16,
    contactDamage: 6,
    color: "#a5f3fc",
    weight: 4,
  },
  {
    kind: "ogre",
    unlockAtS: 240,
    radius: 20,
    speed: 28,
    hp: 90,
    contactDamage: 14,
    color: "#f97316",
    weight: 1,
  },
];

const GHOST_FIRE_INTERVAL_MS = 2200;
const GHOST_PROJECTILE_SPEED = 90;
const GHOST_PROJECTILE_DAMAGE = 7;
const GHOST_KEEP_DISTANCE = 150; // stops approaching once this close

const OGRE_SLAM_RANGE = 70;
const OGRE_SLAM_TELEGRAPH_MS = 700;
const OGRE_SLAM_DAMAGE = 22;
const OGRE_SLAM_COOLDOWN_MS = 2500;

const REAPER_RADIUS = 26;
const REAPER_SPEED = 42;
const REAPER_HP = 420;
const REAPER_CONTACT_DAMAGE = 16;
const REAPER_RING_COUNT = 10;
const REAPER_RING_DAMAGE = 9;
const REAPER_RING_PROJECTILE_SPEED = 130;
const REAPER_RING_INTERVAL_MS = 4000;
const REAPER_DASH_INTERVAL_MS = 6000;
const REAPER_DASH_SPEED = 230;
const REAPER_DASH_DURATION_MS = 500;
const REAPER_COLOR = "#c026d3";

const EP_RADIUS = 5; // enemy projectile radius (ghost bolts, reaper ring)

export interface GameHudState {
  hp: number;
  maxHp: number;
  timeRemaining: number;
  kills: number;
  gems: number;
  status: "running" | "gameover";
}

export interface GameCallbacks {
  onHudUpdate: (state: GameHudState) => void;
  onGameOver: (summary: { survivedS: number; kills: number }) => void;
}

interface Enemy extends GameObject {
  kind: EnemyKind;
  hp: number;
  alive: boolean;
  radius: number;
  contactDamage: number;
  // bat
  wigglePhase?: number;
  // ghost
  lastRangedAt?: number;
  // ogre
  chargeUntil?: number;
  slamReadyAt?: number;
  baseWidth?: number;
  baseHeight?: number;
  // reaper
  lastRingAt?: number;
  lastDashAt?: number;
  dashUntil?: number;
  dashDx?: number;
  dashDy?: number;
}
interface Projectile extends GameObject {
  ttl: number;
  alive: boolean;
  damage: number;
}
interface Gem extends GameObject {
  alive: boolean;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function spawnEdgePosition(canvas: HTMLCanvasElement) {
  const side = Math.floor(Math.random() * 4);
  let x: number;
  let y: number;
  if (side === 0) {
    x = -20;
    y = Math.random() * canvas.height;
  } else if (side === 1) {
    x = canvas.width + 20;
    y = Math.random() * canvas.height;
  } else if (side === 2) {
    x = Math.random() * canvas.width;
    y = -20;
  } else {
    x = Math.random() * canvas.width;
    y = canvas.height + 20;
  }
  return { x, y };
}

function currentSpawnIntervalMs(elapsedS: number): number {
  const interval =
    BASE_SPAWN_INTERVAL_MS * Math.pow(0.5, elapsedS / RAMP_HALF_LIFE_S);
  return Math.max(MIN_SPAWN_INTERVAL_MS, interval);
}

function pickEnemyDef(elapsedS: number): EnemyDef {
  const unlocked = ENEMY_DEFS.filter((d) => d.unlockAtS <= elapsedS);
  const totalWeight = unlocked.reduce((sum, d) => sum + d.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const def of unlocked) {
    roll -= def.weight;
    if (roll <= 0) return def;
  }
  return unlocked[unlocked.length - 1];
}

export function startGame(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
  log.log("startGame() called", { width: canvas.width, height: canvas.height });

  const { context } = init(canvas);
  initKeys();

  const player = Sprite({
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: PLAYER_RADIUS * 2,
    height: PLAYER_RADIUS * 2,
    anchor: { x: 0.5, y: 0.5 },
    color: "#38bdf8",
  }) as unknown as GameObject & { hp: number; lastHitAt: number };
  player.hp = PLAYER_MAX_HP;
  player.lastHitAt = -Infinity;

  const enemies: Enemy[] = [];
  const projectiles: Projectile[] = [];
  const enemyProjectiles: Projectile[] = [];
  const gems: Gem[] = [];

  let elapsedMs = 0;
  let lastSpawnAt = 0;
  let lastFireAt = 0;
  let kills = 0;
  let gemsCollected = 0;
  let status: GameHudState["status"] = "running";
  let hudAccumulatorMs = 0;
  const HUD_UPDATE_INTERVAL_MS = 100; // throttle DOM writes, not every frame

  const bossSpawnAtS = Math.max(20, TEST_RUN_DURATION_S - 20);
  let bossSpawned = false;
  const unlockedPools = new Set<string>();

  function spawnEnemy(elapsedS: number) {
    if (enemies.length >= MAX_ALIVE_ENEMIES) {
      log.log("spawn skipped, at MAX_ALIVE_ENEMIES cap", enemies.length);
      return;
    }
    const def = pickEnemyDef(elapsedS);
    if (!unlockedPools.has(def.kind)) {
      unlockedPools.add(def.kind);
      log.log("pool:unlocked", { kind: def.kind, atS: elapsedS.toFixed(1) });
    }
    const { x, y } = spawnEdgePosition(canvas);
    const sprite = Sprite({
      x,
      y,
      width: def.radius * 2,
      height: def.radius * 2,
      anchor: { x: 0.5, y: 0.5 },
      color: def.color,
    }) as unknown as Enemy;
    sprite.kind = def.kind;
    sprite.hp = def.hp;
    sprite.alive = true;
    sprite.radius = def.radius;
    sprite.contactDamage = def.contactDamage;
    sprite.wigglePhase = Math.random() * Math.PI * 2;
    sprite.lastRangedAt = elapsedMs;
    sprite.slamReadyAt = elapsedMs;
    sprite.baseWidth = sprite.width;
    sprite.baseHeight = sprite.height;
    enemies.push(sprite);
    log.log("spawn:enemy", {
      kind: def.kind,
      x: Math.round(x),
      y: Math.round(y),
      aliveCount: enemies.length,
    });
  }

  function spawnBoss() {
    const sprite = Sprite({
      x: canvas.width / 2,
      y: -40,
      width: REAPER_RADIUS * 2,
      height: REAPER_RADIUS * 2,
      anchor: { x: 0.5, y: 0.5 },
      color: REAPER_COLOR,
    }) as unknown as Enemy;
    sprite.kind = "reaper";
    sprite.hp = REAPER_HP;
    sprite.alive = true;
    sprite.radius = REAPER_RADIUS;
    sprite.contactDamage = REAPER_CONTACT_DAMAGE;
    sprite.lastRingAt = elapsedMs;
    sprite.lastDashAt = elapsedMs;
    enemies.push(sprite);
    bossSpawned = true;
    log.log("boss:spawned", {
      hp: REAPER_HP,
      atS: (elapsedMs / 1000).toFixed(1),
    });
  }

  function findNearestEnemy(): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = distance(player, e);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  function fireAt(target: Enemy) {
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const projectile = Sprite({
      x: player.x,
      y: player.y,
      width: PROJECTILE_RADIUS * 2,
      height: PROJECTILE_RADIUS * 2,
      anchor: { x: 0.5, y: 0.5 },
      color: "#fbbf24",
      dx: Math.cos(angle) * PROJECTILE_SPEED,
      dy: Math.sin(angle) * PROJECTILE_SPEED,
    }) as unknown as Projectile;
    projectile.ttl = 1.5;
    projectile.alive = true;
    projectile.damage = PROJECTILE_DAMAGE;
    projectiles.push(projectile);
    log.log("fire:projectile", {
      targetKind: target.kind,
      targetHp: target.hp,
    });
  }

  function fireEnemyProjectile(
    from: { x: number; y: number },
    angle: number,
    speed: number,
    damage: number,
    source: string,
  ) {
    const projectile = Sprite({
      x: from.x,
      y: from.y,
      width: EP_RADIUS * 2,
      height: EP_RADIUS * 2,
      anchor: { x: 0.5, y: 0.5 },
      color: "#f87171",
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
    }) as unknown as Projectile;
    projectile.ttl = 3;
    projectile.alive = true;
    projectile.damage = damage;
    enemyProjectiles.push(projectile);
    log.log("fire:enemyProjectile", { source, damage });
  }

  function spawnGem(x: number, y: number) {
    const gem = Sprite({
      x,
      y,
      width: GEM_RADIUS * 2,
      height: GEM_RADIUS * 2,
      anchor: { x: 0.5, y: 0.5 },
      color: "#a78bfa",
    }) as unknown as Gem;
    gem.alive = true;
    gems.push(gem);
  }

  function damagePlayer(amount: number, source: string) {
    player.hp = Math.max(0, player.hp - amount);
    log.log("player:damaged", { amount, source, hpRemaining: player.hp });
    if (player.hp <= 0) {
      endGame("death");
    }
  }

  function updateEnemyBehavior(e: Enemy, dt: number) {
    if (e.kind === "bat") {
      const toPlayerAngle = Math.atan2(player.y - e.y, player.x - e.x);
      e.wigglePhase = (e.wigglePhase ?? 0) + dt * 8;
      const wiggle = Math.sin(e.wigglePhase) * 0.6;
      const angle = toPlayerAngle + wiggle;
      const def = ENEMY_DEFS.find((d) => d.kind === "bat")!;
      e.x += Math.cos(angle) * def.speed * dt;
      e.y += Math.sin(angle) * def.speed * dt;
      return;
    }
    if (e.kind === "ghost") {
      const def = ENEMY_DEFS.find((d) => d.kind === "ghost")!;
      const d = distance(player, e);
      if (d > GHOST_KEEP_DISTANCE) {
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angle) * def.speed * dt;
        e.y += Math.sin(angle) * def.speed * dt;
      }
      if (elapsedMs - (e.lastRangedAt ?? 0) >= GHOST_FIRE_INTERVAL_MS) {
        e.lastRangedAt = elapsedMs;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        fireEnemyProjectile(
          e,
          angle,
          GHOST_PROJECTILE_SPEED,
          GHOST_PROJECTILE_DAMAGE,
          "ghost",
        );
      }
      return;
    }
    if (e.kind === "ogre") {
      const def = ENEMY_DEFS.find((d) => d.kind === "ogre")!;
      const d = distance(player, e);
      if (e.chargeUntil) {
        if (elapsedMs >= e.chargeUntil) {
          e.chargeUntil = undefined;
          e.width = e.baseWidth ?? e.width;
          e.height = e.baseHeight ?? e.height;
          if (distance(player, e) <= OGRE_SLAM_RANGE) {
            damagePlayer(OGRE_SLAM_DAMAGE, "ogre-slam");
            log.log("ogre:slam-hit");
          } else {
            log.log("ogre:slam-miss");
          }
          e.slamReadyAt = elapsedMs + OGRE_SLAM_COOLDOWN_MS;
        }
        return; // frozen mid-telegraph
      }
      if (d <= OGRE_SLAM_RANGE && elapsedMs >= (e.slamReadyAt ?? 0)) {
        e.chargeUntil = elapsedMs + OGRE_SLAM_TELEGRAPH_MS;
        e.baseWidth = e.width;
        e.baseHeight = e.height;
        e.width *= 1.4;
        e.height *= 1.4;
        log.log("ogre:telegraph-start");
        return;
      }
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * def.speed * dt;
      e.y += Math.sin(angle) * def.speed * dt;
      return;
    }
    if (e.kind === "reaper") {
      if (e.dashUntil && elapsedMs < e.dashUntil) {
        e.x += (e.dashDx ?? 0) * dt;
        e.y += (e.dashDy ?? 0) * dt;
        return;
      }
      if (e.dashUntil && elapsedMs >= e.dashUntil) {
        e.dashUntil = undefined;
      }
      if (elapsedMs - (e.lastDashAt ?? 0) >= REAPER_DASH_INTERVAL_MS) {
        e.lastDashAt = elapsedMs;
        e.dashUntil = elapsedMs + REAPER_DASH_DURATION_MS;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.dashDx = Math.cos(angle) * REAPER_DASH_SPEED;
        e.dashDy = Math.sin(angle) * REAPER_DASH_SPEED;
        log.log("boss:attack", { pattern: "dash" });
      }
      if (elapsedMs - (e.lastRingAt ?? 0) >= REAPER_RING_INTERVAL_MS) {
        e.lastRingAt = elapsedMs;
        for (let i = 0; i < REAPER_RING_COUNT; i++) {
          const angle = (i / REAPER_RING_COUNT) * Math.PI * 2;
          fireEnemyProjectile(
            e,
            angle,
            REAPER_RING_PROJECTILE_SPEED,
            REAPER_RING_DAMAGE,
            "reaper-ring",
          );
        }
        log.log("boss:attack", { pattern: "ring", count: REAPER_RING_COUNT });
      }
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * REAPER_SPEED * dt;
      e.y += Math.sin(angle) * REAPER_SPEED * dt;
      return;
    }
    // zombie, skeleton: straight approach
    const def = ENEMY_DEFS.find((d) => d.kind === e.kind)!;
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * def.speed * dt;
    e.y += Math.sin(angle) * def.speed * dt;
  }

  function endGame(reason: "death" | "timer") {
    if (status === "gameover") return;
    status = "gameover";
    const survivedS = Math.min(elapsedMs / 1000, TEST_RUN_DURATION_S);
    log.log("game:over", {
      reason,
      survivedS: survivedS.toFixed(1),
      kills,
      gemsCollected,
    });
    callbacks.onGameOver({ survivedS, kills });
  }

  const loop = GameLoop({
    update(dt = 1 / 60) {
      if (status !== "running") return;
      elapsedMs += dt * 1000;
      const elapsedS = elapsedMs / 1000;

      // --- player movement ---
      let mvx = 0;
      let mvy = 0;
      if (keyPressed(["arrowleft", "a"])) mvx -= 1;
      if (keyPressed(["arrowright", "d"])) mvx += 1;
      if (keyPressed(["arrowup", "w"])) mvy -= 1;
      if (keyPressed(["arrowdown", "s"])) mvy += 1;
      if (mvx !== 0 || mvy !== 0) {
        const len = Math.hypot(mvx, mvy);
        player.x = Math.min(
          Math.max(player.x + (mvx / len) * PLAYER_SPEED * dt, PLAYER_RADIUS),
          canvas.width - PLAYER_RADIUS,
        );
        player.y = Math.min(
          Math.max(player.y + (mvy / len) * PLAYER_SPEED * dt, PLAYER_RADIUS),
          canvas.height - PLAYER_RADIUS,
        );
      }

      // --- boss trigger (relative, near run end) ---
      if (!bossSpawned && elapsedS >= bossSpawnAtS) {
        spawnBoss();
      }

      // --- spawning (exponential-ish ramp, floored — see file header) ---
      const spawnIntervalMs = currentSpawnIntervalMs(elapsedS);
      if (elapsedMs - lastSpawnAt >= spawnIntervalMs) {
        lastSpawnAt = elapsedMs;
        spawnEnemy(elapsedS);
      }

      // --- enemy movement/attacks + contact damage ---
      for (const e of enemies) {
        if (!e.alive) continue;
        updateEnemyBehavior(e, dt);
        if (status !== "running") return; // damagePlayer may have ended the run
        if (distance(player, e) < PLAYER_RADIUS + e.radius) {
          if (elapsedMs - player.lastHitAt >= PLAYER_HIT_COOLDOWN_MS) {
            player.lastHitAt = elapsedMs;
            damagePlayer(
              e.contactDamage || CONTACT_DAMAGE,
              `contact:${e.kind}`,
            );
            if (status !== "running") return;
          }
        }
      }

      // --- auto-fire ---
      if (elapsedMs - lastFireAt >= FIRE_INTERVAL_MS) {
        const target = findNearestEnemy();
        if (target) {
          lastFireAt = elapsedMs;
          fireAt(target);
        }
      }

      // --- player projectiles ---
      for (const p of projectiles) {
        if (!p.alive) continue;
        p.x += p.dx * dt;
        p.y += p.dy * dt;
        p.ttl -= dt;
        if (
          p.ttl <= 0 ||
          p.x < -20 ||
          p.x > canvas.width + 20 ||
          p.y < -20 ||
          p.y > canvas.height + 20
        ) {
          p.alive = false;
          continue;
        }
        for (const e of enemies) {
          if (!e.alive) continue;
          if (distance(p, e) < PROJECTILE_RADIUS + e.radius) {
            p.alive = false;
            e.hp -= p.damage;
            log.log("hit:enemy", { kind: e.kind, remainingHp: e.hp });
            if (e.hp <= 0) {
              e.alive = false;
              kills += 1;
              log.log("kill:enemy", { kind: e.kind, totalKills: kills });
              spawnGem(e.x, e.y);
              if (e.kind === "reaper") {
                log.log("boss:defeated");
              }
            }
            break;
          }
        }
      }
      for (let i = projectiles.length - 1; i >= 0; i--) {
        if (!projectiles[i].alive) projectiles.splice(i, 1);
      }
      for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i].alive) enemies.splice(i, 1);
      }

      // --- enemy projectiles (ghost bolts, reaper ring) ---
      for (const p of enemyProjectiles) {
        if (!p.alive) continue;
        p.x += p.dx * dt;
        p.y += p.dy * dt;
        p.ttl -= dt;
        if (
          p.ttl <= 0 ||
          p.x < -20 ||
          p.x > canvas.width + 20 ||
          p.y < -20 ||
          p.y > canvas.height + 20
        ) {
          p.alive = false;
          continue;
        }
        if (distance(p, player) < EP_RADIUS + PLAYER_RADIUS) {
          p.alive = false;
          damagePlayer(p.damage, "ranged");
          if (status !== "running") break;
        }
      }
      for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        if (!enemyProjectiles[i].alive) enemyProjectiles.splice(i, 1);
      }
      if (status !== "running") return;

      // --- gems: magnetic pull + collect ---
      for (const g of gems) {
        if (!g.alive) continue;
        const d = distance(player, g);
        if (d < GEM_COLLECT_DISTANCE) {
          g.alive = false;
          gemsCollected += 1;
          log.log("pickup:gem", { totalGems: gemsCollected });
          continue;
        }
        if (d < GEM_PICKUP_RADIUS) {
          const angle = Math.atan2(player.y - g.y, player.x - g.x);
          g.x += Math.cos(angle) * GEM_PULL_SPEED * dt;
          g.y += Math.sin(angle) * GEM_PULL_SPEED * dt;
        }
      }
      for (let i = gems.length - 1; i >= 0; i--) {
        if (!gems[i].alive) gems.splice(i, 1);
      }

      // --- timer ---
      if (elapsedS >= TEST_RUN_DURATION_S) {
        endGame("timer");
        return;
      }

      // --- throttled HUD push ---
      hudAccumulatorMs += dt * 1000;
      if (hudAccumulatorMs >= HUD_UPDATE_INTERVAL_MS) {
        hudAccumulatorMs = 0;
        callbacks.onHudUpdate({
          hp: player.hp,
          maxHp: PLAYER_MAX_HP,
          timeRemaining: Math.max(0, TEST_RUN_DURATION_S - elapsedS),
          kills,
          gems: gemsCollected,
          status,
        });
      }
    },
    render() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (const g of gems) g.render();
      for (const e of enemies) e.render();
      for (const p of projectiles) p.render();
      for (const p of enemyProjectiles) p.render();
      player.render();
    },
  });

  log.log("loop starting", {
    BASE_SPAWN_INTERVAL_MS,
    MAX_ALIVE_ENEMIES,
    FIRE_INTERVAL_MS,
    TEST_RUN_DURATION_S,
    bossSpawnAtS,
  });
  loop.start();

  return {
    stop() {
      log.log("loop stopped manually");
      loop.stop();
    },
  };
}
