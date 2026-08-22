// PHASE 1 — core loop prototype (see docs/GAME-PROGRESS.md).
//
// Scope, deliberately narrow: player movement, one weapon (auto-fires at
// the nearest enemy), one enemy type (Zombie), XP-gem pickup with magnetic
// pull, contact damage, a fixed-length countdown, game over. No level-up
// cards, no full enemy/weapon roster, no tokens/duration formula from
// GAME-DESIGN.md yet, no shop. Those are later phases, layered on once this
// skeleton is confirmed to run smoothly and every interaction logs
// correctly. Spawn/collision math is kept intentionally cheap (linear
// scans over small arrays, no quadtree, no exponential curve yet) so we
// validate performance on simple ground before adding real wave-scaling
// cost in a later phase.
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
const PLAYER_HIT_COOLDOWN_MS = 600;
const CONTACT_DAMAGE = 8;

const ZOMBIE_RADIUS = 12;
const ZOMBIE_SPEED = 55;
const ZOMBIE_HP = 12;
const ZOMBIE_SPAWN_INTERVAL_MS = 1400; // fixed for Phase 1, no ramp yet
const ZOMBIE_MAX_ALIVE = 25; // hard cap keeps Phase 1 perf predictable

const PROJECTILE_SPEED = 320;
const PROJECTILE_RADIUS = 4;
const PROJECTILE_DAMAGE = 6;
const FIRE_INTERVAL_MS = 550;

const GEM_RADIUS = 5;
const GEM_PICKUP_RADIUS = 90; // magnetic pull begins within this distance
const GEM_PULL_SPEED = 260;
const GEM_COLLECT_DISTANCE = 14;

const TEST_RUN_DURATION_S = 90; // fixed placeholder; real formula is a later phase

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
  hp: number;
  alive: boolean;
}
interface Projectile extends GameObject {
  ttl: number;
  alive: boolean;
}
interface Gem extends GameObject {
  alive: boolean;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
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
  const gems: Gem[] = [];

  let elapsedMs = 0;
  let lastSpawnAt = 0;
  let lastFireAt = 0;
  let kills = 0;
  let gemsCollected = 0;
  let status: GameHudState["status"] = "running";
  let hudAccumulatorMs = 0;
  const HUD_UPDATE_INTERVAL_MS = 100; // throttle DOM writes, not every frame

  function spawnZombie() {
    if (enemies.length >= ZOMBIE_MAX_ALIVE) {
      log.log("spawn skipped, at ZOMBIE_MAX_ALIVE cap", enemies.length);
      return;
    }
    // Spawn just outside the canvas edge, random side.
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
    const zombie = Sprite({
      x,
      y,
      width: ZOMBIE_RADIUS * 2,
      height: ZOMBIE_RADIUS * 2,
      anchor: { x: 0.5, y: 0.5 },
      color: "#4ade80",
    }) as unknown as Enemy;
    zombie.hp = ZOMBIE_HP;
    zombie.alive = true;
    enemies.push(zombie);
    log.log("spawn:zombie", {
      x: Math.round(x),
      y: Math.round(y),
      aliveCount: enemies.length,
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
    projectiles.push(projectile);
    log.log("fire:projectile", { targetHp: target.hp });
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

      // --- spawning (fixed interval, no ramp yet — Phase 1 scope) ---
      if (elapsedMs - lastSpawnAt >= ZOMBIE_SPAWN_INTERVAL_MS) {
        lastSpawnAt = elapsedMs;
        spawnZombie();
      }

      // --- enemy movement + contact damage ---
      for (const e of enemies) {
        if (!e.alive) continue;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angle) * ZOMBIE_SPEED * dt;
        e.y += Math.sin(angle) * ZOMBIE_SPEED * dt;
        if (distance(player, e) < PLAYER_RADIUS + ZOMBIE_RADIUS) {
          if (elapsedMs - player.lastHitAt >= PLAYER_HIT_COOLDOWN_MS) {
            player.lastHitAt = elapsedMs;
            player.hp = Math.max(0, player.hp - CONTACT_DAMAGE);
            log.log("player:damaged", {
              damage: CONTACT_DAMAGE,
              hpRemaining: player.hp,
            });
            if (player.hp <= 0) {
              endGame("death");
              return;
            }
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

      // --- projectiles ---
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
          if (distance(p, e) < PROJECTILE_RADIUS + ZOMBIE_RADIUS) {
            p.alive = false;
            e.hp -= PROJECTILE_DAMAGE;
            log.log("hit:enemy", { remainingHp: e.hp });
            if (e.hp <= 0) {
              e.alive = false;
              kills += 1;
              log.log("kill:zombie", { totalKills: kills });
              spawnGem(e.x, e.y);
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
      if (elapsedMs / 1000 >= TEST_RUN_DURATION_S) {
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
          timeRemaining: Math.max(0, TEST_RUN_DURATION_S - elapsedMs / 1000),
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
      player.render();
    },
  });

  log.log("loop starting", {
    ZOMBIE_SPAWN_INTERVAL_MS,
    ZOMBIE_MAX_ALIVE,
    FIRE_INTERVAL_MS,
    TEST_RUN_DURATION_S,
  });
  loop.start();

  return {
    stop() {
      log.log("loop stopped manually");
      loop.stop();
    },
  };
}
