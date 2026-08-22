// PHASE 1-3 — core loop + full enemy roster + weapon roster/leveling (see
// docs/GAME-PROGRESS.md).
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
// Phase 3 scope, layered on top: gems now feed a real XP/level counter;
// leveling up pauses the loop and offers 3-4 cards drawn from a pool of
// owned-weapon upgrades, new-weapon offers (max 4 equipped), and temporary
// run-only stat cards. All 5 weapons (Blade Arc, Bolt, Orbit Shield, Nova
// Pulse, Homing Dart) are implemented with real Lv1-5 progression. Lv6
// evolutions from GAME-DESIGN.md are deliberately deferred to a follow-up
// session — see docs/GAME-PROGRESS.md's Phase 3 section.
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

const PROJECTILE_SPEED = 320; // bolt's base projectile speed
const PROJECTILE_RADIUS = 4;

const GEM_RADIUS = 5;
const GEM_PICKUP_RADIUS = 90; // magnetic pull begins within this distance
const GEM_PULL_SPEED = 260;
const GEM_COLLECT_DISTANCE = 14;
const GEM_XP_VALUE = 4; // placeholder — see "Deliberate simplifications"

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

// --- Phase 3: weapon roster ---
type WeaponId =
  "bladeArc" | "bolt" | "orbitShield" | "novaPulse" | "homingDart";

const ALL_WEAPON_IDS: WeaponId[] = [
  "bladeArc",
  "bolt",
  "orbitShield",
  "novaPulse",
  "homingDart",
];

const WEAPON_NAMES: Record<WeaponId, string> = {
  bladeArc: "Blade Arc",
  bolt: "Bolt",
  orbitShield: "Orbit Shield",
  novaPulse: "Nova Pulse",
  homingDart: "Homing Dart",
};

const WEAPON_FLAVOR: Record<WeaponId, string> = {
  bladeArc: "Melee sweep toward the nearest enemy.",
  bolt: "Straight projectile at the nearest enemy, pierces at higher levels.",
  orbitShield: "Shields orbit you, damaging anything they touch.",
  novaPulse: "Periodic AoE burst centered on you.",
  homingDart: "Seeking projectile that homes in on a random enemy.",
};

const UPGRADE_BLURB: Record<WeaponId, string> = {
  bladeArc: "+attack speed, +arc width, +damage",
  bolt: "+fire rate, +1 projectile (at higher levels), +pierce",
  orbitShield: "+orbiter, +rotation speed, +radius",
  novaPulse: "+radius, +damage, +frequency",
  homingDart: "+dart, +damage, -cooldown",
};

const WEAPON_MAX_LEVEL = 5;
const MAX_EQUIPPED_WEAPONS = 4;

const BLADE_ARC_RADIUS = 60;
const ARC_EFFECT_DURATION_MS = 180;

const ORBIT_HIT_RADIUS = 10;
const ORBIT_VISUAL_RADIUS = 6;
const ORBIT_HIT_COOLDOWN_MS = 400;

const PULSE_EFFECT_DURATION_MS = 300;

const HOMING_DART_SPEED = 200;
const HOMING_DART_TURN_RATE = 4; // rad/s

// --- Phase 3: temporary (run-only) stat cards ---
interface TempStatDef {
  id: string;
  label: string;
  effect: string;
  maxStacks: number;
}

const TEMP_STATS: TempStatDef[] = [
  {
    id: "powerSurge",
    label: "Power Surge",
    effect: "+8% damage, all weapons",
    maxStacks: 5,
  },
  {
    id: "adrenaline",
    label: "Adrenaline",
    effect: "+6% movement speed",
    maxStacks: 5,
  },
  {
    id: "thickSkin",
    label: "Thick Skin",
    effect: "+15% max HP (heals that % on pick)",
    maxStacks: 5,
  },
  {
    id: "wideReach",
    label: "Wide Reach",
    effect: "+10% pickup radius",
    maxStacks: 4,
  },
  {
    id: "quickRecovery",
    label: "Quick Recovery",
    effect: "+0.5 HP/s regen",
    maxStacks: 3,
  },
  {
    id: "luckyStar",
    label: "Lucky Star",
    effect: "+10% chance of an extra coin drop",
    maxStacks: 4,
  },
];

export interface LevelUpCard {
  id: string;
  title: string;
  description: string;
}

export interface GameHudState {
  hp: number;
  maxHp: number;
  timeRemaining: number;
  kills: number;
  gems: number;
  status: "running" | "gameover" | "levelup";
  level: number;
  xp: number;
  xpToNext: number;
  weapons: { id: WeaponId; level: number }[];
}

export interface GameCallbacks {
  onHudUpdate: (state: GameHudState) => void;
  onGameOver: (summary: {
    survivedS: number;
    kills: number;
    level: number;
  }) => void;
  onLevelUp: (cards: LevelUpCard[], choose: (cardId: string) => void) => void;
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
  // orbit shield hit cooldown (Phase 3)
  lastOrbitHitAt?: number;
}
interface Projectile extends GameObject {
  ttl: number;
  alive: boolean;
  damage: number;
  source: string;
  pierceRemaining?: number;
  hitSet?: Set<Enemy>;
  homingTarget?: Enemy;
  turnRate?: number;
}
interface Gem extends GameObject {
  alive: boolean;
}

interface WeaponRuntime {
  id: WeaponId;
  level: number;
  lastActionAt: number;
  orbitAngle?: number;
}

interface ArcEffect {
  x: number;
  y: number;
  angle: number;
  halfArc: number;
  radius: number;
  createdAt: number;
}

interface PulseEffect {
  x: number;
  y: number;
  radius: number;
  createdAt: number;
}

interface InternalCard {
  id: string;
  kind: "weaponUpgrade" | "newWeapon" | "stat";
  weaponId?: WeaponId;
  statId?: string;
  title: string;
  description: string;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizeAngle(a: number): number {
  let angle = a;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function xpForNextLevel(level: number): number {
  return 20 + (level - 1) * 12;
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
  const arcEffects: ArcEffect[] = [];
  const pulseEffects: PulseEffect[] = [];
  let orbiterPositions: { x: number; y: number }[] = [];

  // --- Phase 3: weapons, leveling, run-only stat modifiers ---
  const ownedWeapons: WeaponRuntime[] = [
    { id: "bolt", level: 1, lastActionAt: 0 },
  ];
  let playerLevel = 1;
  let xp = 0;
  let pendingLevelUps = 0;
  let lastDrawnCards: Map<string, InternalCard> = new Map();
  const statStacks: Record<string, number> = {};
  let damageMult = 1;
  let speedMult = 1;
  let maxHpBonus = 0;
  let pickupRadiusMult = 1;
  let hpRegenPerS = 0;
  let extraCoinChance = 0; // no-op until Phase 5 coins exist

  function effectiveMaxHp(): number {
    return PLAYER_MAX_HP + maxHpBonus;
  }

  let elapsedMs = 0;
  let lastSpawnAt = 0;
  let kills = 0;
  let gemsCollected = 0;
  let status: GameHudState["status"] = "running";
  let hudAccumulatorMs = 0;
  const HUD_UPDATE_INTERVAL_MS = 100; // throttle DOM writes, not every frame

  const bossSpawnAtS = Math.max(20, TEST_RUN_DURATION_S - 20);
  let bossSpawned = false;
  const unlockedPools = new Set<string>();

  function pushHud() {
    callbacks.onHudUpdate({
      hp: player.hp,
      maxHp: effectiveMaxHp(),
      timeRemaining: Math.max(0, TEST_RUN_DURATION_S - elapsedMs / 1000),
      kills,
      gems: gemsCollected,
      status,
      level: playerLevel,
      xp,
      xpToNext: xpForNextLevel(playerLevel),
      weapons: ownedWeapons.map((w) => ({ id: w.id, level: w.level })),
    });
  }

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

  function damageEnemy(e: Enemy, amount: number, source: string) {
    e.hp -= amount;
    log.log("hit:enemy", { kind: e.kind, source, remainingHp: e.hp });
    if (e.hp <= 0 && e.alive) {
      e.alive = false;
      kills += 1;
      log.log("kill:enemy", { kind: e.kind, source, totalKills: kills });
      spawnGem(e.x, e.y);
      if (e.kind === "reaper") {
        log.log("boss:defeated");
      }
    }
  }

  function spawnPlayerProjectile(
    angle: number,
    speed: number,
    damage: number,
    pierce: number,
    source: string,
  ): Projectile {
    const projectile = Sprite({
      x: player.x,
      y: player.y,
      width: PROJECTILE_RADIUS * 2,
      height: PROJECTILE_RADIUS * 2,
      anchor: { x: 0.5, y: 0.5 },
      color: source === "homingDart" ? "#38bdf8" : "#fbbf24",
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
    }) as unknown as Projectile;
    projectile.ttl = 2;
    projectile.alive = true;
    projectile.damage = damage;
    projectile.pierceRemaining = pierce;
    projectile.hitSet = new Set();
    projectile.source = source;
    projectiles.push(projectile);
    log.log("weapon:fire", { source, damage, pierce });
    return projectile;
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
    projectile.source = source;
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

  function addXp(amount: number) {
    xp += amount;
    let leveledUp = false;
    while (xp >= xpForNextLevel(playerLevel)) {
      xp -= xpForNextLevel(playerLevel);
      playerLevel += 1;
      pendingLevelUps += 1;
      leveledUp = true;
    }
    if (leveledUp) {
      log.log("player:levelup", { newLevel: playerLevel, pendingLevelUps });
    }
  }

  function applyStatEffect(statId: string) {
    switch (statId) {
      case "powerSurge":
        damageMult += 0.08;
        break;
      case "adrenaline":
        speedMult += 0.06;
        break;
      case "thickSkin": {
        const inc = PLAYER_MAX_HP * 0.15;
        maxHpBonus += inc;
        player.hp = Math.min(effectiveMaxHp(), player.hp + inc);
        break;
      }
      case "wideReach":
        pickupRadiusMult += 0.1;
        break;
      case "quickRecovery":
        hpRegenPerS += 0.5;
        break;
      case "luckyStar":
        extraCoinChance += 0.1;
        break;
    }
  }

  function applyCard(card: InternalCard) {
    if (card.kind === "weaponUpgrade" && card.weaponId) {
      const w = ownedWeapons.find((w) => w.id === card.weaponId);
      if (w) {
        w.level += 1;
        log.log("card:weaponUpgrade", { id: w.id, newLevel: w.level });
      }
    } else if (card.kind === "newWeapon" && card.weaponId) {
      if (ownedWeapons.some((w) => w.id === card.weaponId)) {
        log.warn("card:newWeapon ignored — already owned", card.weaponId);
        return;
      }
      ownedWeapons.push({
        id: card.weaponId,
        level: 1,
        lastActionAt: elapsedMs,
      });
      log.log("card:newWeapon", { id: card.weaponId });
    } else if (card.kind === "stat" && card.statId) {
      statStacks[card.statId] = (statStacks[card.statId] ?? 0) + 1;
      applyStatEffect(card.statId);
      log.log("card:stat", {
        id: card.statId,
        stacks: statStacks[card.statId],
        damageMult,
        speedMult,
        maxHpBonus,
        pickupRadiusMult,
        hpRegenPerS,
        extraCoinChance,
      });
    }
  }

  function buildCardPool(): InternalCard[] {
    const pool: InternalCard[] = [];
    for (const w of ownedWeapons) {
      if (w.level < WEAPON_MAX_LEVEL) {
        pool.push({
          id: `weaponUpgrade:${w.id}`,
          kind: "weaponUpgrade",
          weaponId: w.id,
          title: `Upgrade ${WEAPON_NAMES[w.id]} — Lv ${w.level + 1}`,
          description: UPGRADE_BLURB[w.id],
        });
      }
    }
    if (ownedWeapons.length < MAX_EQUIPPED_WEAPONS) {
      for (const id of ALL_WEAPON_IDS) {
        if (!ownedWeapons.some((w) => w.id === id)) {
          pool.push({
            id: `newWeapon:${id}`,
            kind: "newWeapon",
            weaponId: id,
            title: `New: ${WEAPON_NAMES[id]}`,
            description: WEAPON_FLAVOR[id],
          });
        }
      }
    }
    for (const stat of TEMP_STATS) {
      const stacks = statStacks[stat.id] ?? 0;
      if (stacks < stat.maxStacks) {
        pool.push({
          id: `stat:${stat.id}`,
          kind: "stat",
          statId: stat.id,
          title: `${stat.label} (${stacks + 1}/${stat.maxStacks})`,
          description: stat.effect,
        });
      }
    }
    return pool;
  }

  function drawCards(): InternalCard[] {
    return shuffle(buildCardPool()).slice(0, 4);
  }

  function presentLevelUp() {
    status = "levelup";
    const cards = drawCards();
    lastDrawnCards = new Map(cards.map((c) => [c.id, c]));
    const external: LevelUpCard[] = cards.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
    }));
    log.log("levelup:cards", {
      level: playerLevel,
      cardIds: external.map((c) => c.id),
    });
    pushHud();
    callbacks.onLevelUp(external, (chosenId: string) => {
      const card = lastDrawnCards.get(chosenId);
      if (!card) {
        log.error("chooseCard: unknown id", chosenId);
        return;
      }
      applyCard(card);
      pendingLevelUps -= 1;
      log.log("levelup:chosen", { id: chosenId, remaining: pendingLevelUps });
      if (pendingLevelUps > 0) {
        presentLevelUp();
      } else {
        status = "running";
        pushHud();
        log.log("levelup:resume");
      }
    });
  }

  function updateWeapon(w: WeaponRuntime, dt: number) {
    switch (w.id) {
      case "bolt": {
        const interval = 550 - (w.level - 1) * 60;
        if (elapsedMs - w.lastActionAt >= interval) {
          const target = findNearestEnemy();
          if (target) {
            w.lastActionAt = elapsedMs;
            const damage = (6 + (w.level - 1) * 2) * damageMult;
            const pierce = w.level >= 4 ? 1 : 0;
            const count = w.level >= 5 ? 3 : w.level >= 3 ? 2 : 1;
            const baseAngle = Math.atan2(
              target.y - player.y,
              target.x - player.x,
            );
            const spread = count > 1 ? 0.18 : 0;
            for (let i = 0; i < count; i++) {
              const offset = count > 1 ? (i - (count - 1) / 2) * spread : 0;
              spawnPlayerProjectile(
                baseAngle + offset,
                PROJECTILE_SPEED,
                damage,
                pierce,
                "bolt",
              );
            }
          }
        }
        break;
      }
      case "bladeArc": {
        const interval = 700 - (w.level - 1) * 70;
        if (elapsedMs - w.lastActionAt >= interval) {
          const target = findNearestEnemy();
          const facing = target
            ? Math.atan2(target.y - player.y, target.x - player.x)
            : 0;
          w.lastActionAt = elapsedMs;
          const arcDeg = 70 + (w.level - 1) * 15;
          const halfArc = (arcDeg * Math.PI) / 180 / 2;
          const damage = (10 + (w.level - 1) * 3) * damageMult;
          for (const e of enemies) {
            if (!e.alive) continue;
            const d = distance(player, e);
            if (d > BLADE_ARC_RADIUS) continue;
            const angleToE = Math.atan2(e.y - player.y, e.x - player.x);
            const diff = Math.abs(normalizeAngle(angleToE - facing));
            if (diff <= halfArc) damageEnemy(e, damage, "bladeArc");
          }
          arcEffects.push({
            x: player.x,
            y: player.y,
            angle: facing,
            halfArc,
            radius: BLADE_ARC_RADIUS,
            createdAt: elapsedMs,
          });
          log.log("weapon:bladeArc:sweep", { arcDeg });
        }
        break;
      }
      case "orbitShield": {
        w.orbitAngle = (w.orbitAngle ?? 0) + (1.5 + (w.level - 1) * 0.3) * dt;
        const count = w.level >= 3 ? 2 : 1;
        const radius = 50 + (w.level - 1) * 6;
        const damage = (5 + (w.level - 1) * 2) * damageMult;
        const positions: { x: number; y: number }[] = [];
        for (let i = 0; i < count; i++) {
          const angle = w.orbitAngle + i * ((Math.PI * 2) / count);
          const ox = player.x + Math.cos(angle) * radius;
          const oy = player.y + Math.sin(angle) * radius;
          positions.push({ x: ox, y: oy });
          for (const e of enemies) {
            if (!e.alive) continue;
            if (distance({ x: ox, y: oy }, e) < ORBIT_HIT_RADIUS + e.radius) {
              if (
                elapsedMs - (e.lastOrbitHitAt ?? -Infinity) >=
                ORBIT_HIT_COOLDOWN_MS
              ) {
                e.lastOrbitHitAt = elapsedMs;
                damageEnemy(e, damage, "orbitShield");
              }
            }
          }
        }
        orbiterPositions = positions;
        break;
      }
      case "novaPulse": {
        const interval = 2500 - (w.level - 1) * 250;
        if (elapsedMs - w.lastActionAt >= interval) {
          w.lastActionAt = elapsedMs;
          const radius = 70 + (w.level - 1) * 12;
          const damage = (8 + (w.level - 1) * 3) * damageMult;
          for (const e of enemies) {
            if (!e.alive) continue;
            if (distance(player, e) <= radius)
              damageEnemy(e, damage, "novaPulse");
          }
          pulseEffects.push({
            x: player.x,
            y: player.y,
            radius,
            createdAt: elapsedMs,
          });
          log.log("weapon:novaPulse:burst", { radius });
        }
        break;
      }
      case "homingDart": {
        const interval = 1200 - (w.level - 1) * 100;
        if (elapsedMs - w.lastActionAt >= interval) {
          const count = w.level >= 3 ? 2 : 1;
          const candidates = enemies.filter((e) => e.alive);
          if (candidates.length > 0) {
            w.lastActionAt = elapsedMs;
            const damage = (5 + (w.level - 1) * 2) * damageMult;
            for (let i = 0; i < count; i++) {
              const target =
                candidates[Math.floor(Math.random() * candidates.length)];
              const angle = Math.atan2(
                target.y - player.y,
                target.x - player.x,
              );
              const p = spawnPlayerProjectile(
                angle,
                HOMING_DART_SPEED,
                damage,
                0,
                "homingDart",
              );
              p.homingTarget = target;
              p.turnRate = HOMING_DART_TURN_RATE;
            }
          }
        }
        break;
      }
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
      level: playerLevel,
    });
    callbacks.onGameOver({ survivedS, kills, level: playerLevel });
  }

  const loop = GameLoop({
    update(dt = 1 / 60) {
      if (status !== "running") return;
      elapsedMs += dt * 1000;
      const elapsedS = elapsedMs / 1000;

      // --- passive regen (Quick Recovery stacks) ---
      if (hpRegenPerS > 0 && player.hp > 0) {
        player.hp = Math.min(effectiveMaxHp(), player.hp + hpRegenPerS * dt);
      }

      // --- player movement ---
      let mvx = 0;
      let mvy = 0;
      if (keyPressed(["arrowleft", "a"])) mvx -= 1;
      if (keyPressed(["arrowright", "d"])) mvx += 1;
      if (keyPressed(["arrowup", "w"])) mvy -= 1;
      if (keyPressed(["arrowdown", "s"])) mvy += 1;
      if (mvx !== 0 || mvy !== 0) {
        const len = Math.hypot(mvx, mvy);
        const speed = PLAYER_SPEED * speedMult;
        player.x = Math.min(
          Math.max(player.x + (mvx / len) * speed * dt, PLAYER_RADIUS),
          canvas.width - PLAYER_RADIUS,
        );
        player.y = Math.min(
          Math.max(player.y + (mvy / len) * speed * dt, PLAYER_RADIUS),
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

      // --- weapons (Phase 3: all owned weapons act every frame) ---
      for (const w of ownedWeapons) {
        updateWeapon(w, dt);
      }

      // --- player projectiles ---
      for (const p of projectiles) {
        if (!p.alive) continue;
        if (p.homingTarget) {
          if (p.homingTarget.alive) {
            const desiredAngle = Math.atan2(
              p.homingTarget.y - p.y,
              p.homingTarget.x - p.x,
            );
            const currentAngle = Math.atan2(p.dy, p.dx);
            const diff = normalizeAngle(desiredAngle - currentAngle);
            const maxTurn = (p.turnRate ?? 4) * dt;
            const turn = Math.max(-maxTurn, Math.min(maxTurn, diff));
            const newAngle = currentAngle + turn;
            const speed = Math.hypot(p.dx, p.dy);
            p.dx = Math.cos(newAngle) * speed;
            p.dy = Math.sin(newAngle) * speed;
          }
        }
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
          if (p.hitSet?.has(e)) continue;
          if (distance(p, e) < PROJECTILE_RADIUS + e.radius) {
            p.hitSet?.add(e);
            damageEnemy(e, p.damage, p.source);
            if ((p.pierceRemaining ?? 0) > 0) {
              p.pierceRemaining! -= 1;
            } else {
              p.alive = false;
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

      // --- gems: magnetic pull + collect (feeds XP) ---
      const pickupRadius = GEM_PICKUP_RADIUS * pickupRadiusMult;
      for (const g of gems) {
        if (!g.alive) continue;
        const d = distance(player, g);
        if (d < GEM_COLLECT_DISTANCE) {
          g.alive = false;
          gemsCollected += 1;
          addXp(GEM_XP_VALUE);
          log.log("pickup:gem", { totalGems: gemsCollected });
          continue;
        }
        if (d < pickupRadius) {
          const angle = Math.atan2(player.y - g.y, player.x - g.x);
          g.x += Math.cos(angle) * GEM_PULL_SPEED * dt;
          g.y += Math.sin(angle) * GEM_PULL_SPEED * dt;
        }
      }
      for (let i = gems.length - 1; i >= 0; i--) {
        if (!gems[i].alive) gems.splice(i, 1);
      }

      // --- level-up pause: XP thresholds crossed this frame ---
      if (pendingLevelUps > 0) {
        presentLevelUp();
        return;
      }

      // --- transient visual effects ---
      for (let i = arcEffects.length - 1; i >= 0; i--) {
        if (elapsedMs - arcEffects[i].createdAt >= ARC_EFFECT_DURATION_MS) {
          arcEffects.splice(i, 1);
        }
      }
      for (let i = pulseEffects.length - 1; i >= 0; i--) {
        if (elapsedMs - pulseEffects[i].createdAt >= PULSE_EFFECT_DURATION_MS) {
          pulseEffects.splice(i, 1);
        }
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
        pushHud();
      }
    },
    render() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (const g of gems) g.render();
      for (const e of enemies) e.render();
      for (const p of projectiles) p.render();
      for (const p of enemyProjectiles) p.render();
      player.render();

      context.fillStyle = "#facc15";
      for (const pos of orbiterPositions) {
        context.beginPath();
        context.arc(pos.x, pos.y, ORBIT_VISUAL_RADIUS, 0, Math.PI * 2);
        context.fill();
      }

      for (const a of arcEffects) {
        const age = elapsedMs - a.createdAt;
        const alpha = Math.max(0, 1 - age / ARC_EFFECT_DURATION_MS);
        context.strokeStyle = `rgba(226,232,240,${alpha})`;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.arc(
          a.x,
          a.y,
          a.radius,
          a.angle - a.halfArc,
          a.angle + a.halfArc,
        );
        context.closePath();
        context.stroke();
      }

      for (const p of pulseEffects) {
        const age = elapsedMs - p.createdAt;
        const progress = Math.min(1, age / PULSE_EFFECT_DURATION_MS);
        const alpha = Math.max(0, 1 - progress);
        context.strokeStyle = `rgba(167,139,250,${alpha})`;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(
          p.x,
          p.y,
          p.radius * (0.3 + progress * 0.7),
          0,
          Math.PI * 2,
        );
        context.stroke();
      }
    },
  });

  log.log("loop starting", {
    BASE_SPAWN_INTERVAL_MS,
    MAX_ALIVE_ENEMIES,
    TEST_RUN_DURATION_S,
    bossSpawnAtS,
    startingWeapons: ownedWeapons.map((w) => w.id),
  });
  loop.start();

  return {
    stop() {
      log.log("loop stopped manually");
      loop.stop();
    },
  };
}
