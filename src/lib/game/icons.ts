// Phase 10 — hand-drawn inline SVG icons for the level-up cards and shop
// rows (both plain DOM, not the game canvas — see src/lib/game/sprites.ts
// for the canvas-side equivalent from Phase 9). Same "no external assets"
// posture as the rest of the game: simple stroke-based shapes, 24x24
// viewBox, styled with `currentColor` so they inherit whatever accent
// color the call site sets — matches the outline style `lucide-astro`
// icons use elsewhere on the site (see CLAUDE.md's "Visual design
// balance"), just hand-authored here since these are built in vanilla
// client-side JS, not `.astro` files where `lucide-astro` components work.
//
// Six "concept" icons are deliberately shared between the run-only temp
// stats (engine.ts's TEMP_STATS) and the permanent shop upgrades
// (shop.ts's UPGRADES) wherever they represent the same underlying idea
// (e.g. Vigor and Thick Skin are both "more HP") — one icon per concept,
// not one per game-mechanic id, so the iconography stays legible instead
// of asking the player to learn 13 unrelated shapes.

const ICON_ATTRS =
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';

const ICON_BLADE = `<svg ${ICON_ATTRS}><line x1="5" y1="19" x2="19" y2="5"/><line x1="14" y1="5" x2="19" y2="5"/><line x1="19" y1="5" x2="19" y2="10"/><line x1="5" y1="19" x2="10" y2="19"/></svg>`;

const ICON_BOLT = `<svg ${ICON_ATTRS} stroke-linejoin="round"><polygon points="13 2 4 14 11 14 9 22 20 10 13 10 13 2" fill="currentColor" stroke="none"/></svg>`;

const ICON_SHIELD = `<svg ${ICON_ATTRS}><path d="M12 2 L20 6 L20 12 C20 17 16.5 20.5 12 22 C7.5 20.5 4 17 4 12 L4 6 Z"/><ellipse cx="12" cy="12" rx="7" ry="3" transform="rotate(20 12 12)"/></svg>`;

const ICON_PULSE = `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="6" stroke-dasharray="2 3"/><circle cx="12" cy="12" r="10" stroke-dasharray="2 4"/></svg>`;

const ICON_DART = `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/></svg>`;

// Phase 15 — three dots connected by a jagged bolt line, "chain lightning"
// (the locked 6th weapon). Distinct from ICON_BOLT (a single filled
// lightning-bolt shape) since this weapon's whole identity is jumping
// between multiple targets, not a straight single-target shot.
const ICON_CHAIN = `<svg ${ICON_ATTRS}><circle cx="4" cy="19" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="20" cy="16" r="2" fill="currentColor" stroke="none"/><polyline points="4 19 9 11 12 8"/><polyline points="12 8 16 14 20 16"/></svg>`;

// Phase 15 — a tombstone with a small rising wisp, "necromancy" (the locked
// run-time ability). Distinct from ICON_SKULL (the kills stat, a literal
// skull) — this represents raising the dead, not a body count.
const ICON_NECROMANCY = `<svg ${ICON_ATTRS}><path d="M6 21V11a6 6 0 0 1 12 0v10Z"/><line x1="6" y1="21" x2="18" y2="21"/><line x1="10" y1="10" x2="14" y2="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>`;

// Phase 15 — a closed padlock, shown on shop unlock rows before purchase
// (chainLightning/necromancy) so "not owned yet" reads at a glance, same
// icon-first convention as everything else in this file.
const ICON_LOCK = `<svg ${ICON_ATTRS}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;

const ICON_X = `<svg ${ICON_ATTRS}><path d="M6 6l12 12M18 6 6 18"/></svg>`;

const ICON_LAB = `<svg ${ICON_ATTRS}><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/></svg>`;

const ICON_SPARKLE = `<svg ${ICON_ATTRS} stroke-linejoin="round"><path d="M12 2 L13.5 9 L21 12 L13.5 15 L12 22 L10.5 15 L3 12 L10.5 9 Z" fill="currentColor" stroke="none"/></svg>`;

// heart — HP-related (Vigor / Thick Skin)
const ICON_HEART = `<svg ${ICON_ATTRS} fill="currentColor"><path d="M12 21 C12 21 4 14.5 4 9 C4 6 6.5 4 9 4 C10.5 4 12 5 12 7 C12 5 13.5 4 15 4 C17.5 4 20 6 20 9 C20 14.5 12 21 12 21 Z"/></svg>`;

// double chevron — speed-related (Fleetness / Adrenaline)
const ICON_SPEED = `<svg ${ICON_ATTRS}><polyline points="4 6 12 12 4 18"/><polyline points="12 6 20 12 12 18"/></svg>`;

// arrows pulling inward — pickup-radius-related (Magnetism / Wide Reach)
const ICON_MAGNET = `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><polyline points="4 4 8 8"/><polyline points="20 4 16 8"/><polyline points="4 20 8 16"/><polyline points="20 20 16 16"/></svg>`;

// overlapping circles — coin-related (Greed / Lucky Star)
const ICON_COIN = `<svg ${ICON_ATTRS}><circle cx="9" cy="9" r="6"/><circle cx="15" cy="15" r="6"/></svg>`;

// flame — damage-related (Might / Power Surge)
const ICON_FLAME = `<svg ${ICON_ATTRS} fill="currentColor"><path d="M12 2 C12 2 7 7 7 12 C7 15.3 9.7 18 13 18 C16.3 18 18 15.5 18 13 C18 11 17 9.5 16 8.5 C16 10 15 11 14 11 C14.5 9 13.5 6 12 2 Z"/></svg>`;

// plus in a circle — regen-related (Recovery / Quick Recovery)
const ICON_REGEN = `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;

// open book — XP-related (Amanuensis, no run-only stat counterpart)
const ICON_BOOK = `<svg ${ICON_ATTRS}><path d="M4 5 C6 4 9 4 12 5 L12 19 C9 18 6 18 4 19 Z"/><path d="M20 5 C18 4 15 4 12 5 L12 19 C15 18 18 18 20 19 Z"/></svg>`;

// Phase 12 — HUD/lobby/results/toolbar icons, replacing plain text labels
// ("HP:", "Kills:", "Sound: On", etc.) so the game screen reads at a glance
// instead of as a wall of stat abbreviations. Same style/sizing convention
// as the icons above.
const ICON_CLOCK = `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>`;
const ICON_SKULL = `<svg ${ICON_ATTRS}><path d="M12 3C7.58 3 4 6.58 4 11c0 2.76 1.44 4.9 3 6.32V19a1 1 0 0 0 1 1h1v-1.5h1.5V20h3v-1.5H15V20h1a1 1 0 0 0 1-1v-1.68c1.56-1.42 3-3.56 3-6.32 0-4.42-3.58-8-8-8Z"/><circle cx="9.5" cy="11" r="1.3" fill="currentColor" stroke="none"/><circle cx="14.5" cy="11" r="1.3" fill="currentColor" stroke="none"/></svg>`;
const ICON_GEM = `<svg ${ICON_ATTRS}><path d="M6 3h12l3 6-9 12L3 9Z"/><path d="M3 9h18"/><path d="M9 3 8 9l4 12 4-12-1-6"/></svg>`;
const ICON_STAR = `<svg ${ICON_ATTRS} stroke-linejoin="round"><polygon points="12 2 15 9 22 9.5 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.5 9 9" fill="currentColor" stroke="none"/></svg>`;
const ICON_TICKET = `<svg ${ICON_ATTRS}><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"/><line x1="10" y1="6" x2="10" y2="18" stroke-dasharray="2 2"/></svg>`;
const ICON_TROPHY = `<svg ${ICON_ATTRS}><path d="M8 4h8v5a4 4 0 0 1-8 0Z"/><path d="M8 5H5a2 2 0 0 0 0 4h1"/><path d="M16 5h3a2 2 0 0 1 0 4h-1"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="9" y1="20" x2="9" y2="17"/><line x1="15" y1="20" x2="15" y2="17"/></svg>`;
const ICON_SOUND_ON = `<svg ${ICON_ATTRS}><polygon points="4 9 8 9 12 5 12 19 8 15 4 15" fill="currentColor" stroke="none"/><path d="M16 8a5 5 0 0 1 0 8"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>`;
const ICON_SOUND_OFF = `<svg ${ICON_ATTRS}><polygon points="4 9 8 9 12 5 12 19 8 15 4 15" fill="currentColor" stroke="none"/><line x1="16" y1="9" x2="21" y2="14"/><line x1="21" y1="9" x2="16" y2="14"/></svg>`;
const ICON_EYE = `<svg ${ICON_ATTRS}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const ICON_EYE_OFF = `<svg ${ICON_ATTRS}><path d="M3 3l18 18"/><path d="M10.6 10.6a3 3 0 0 0 4.24 4.24"/><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a17.3 17.3 0 0 1-2.6 3.6M6.6 6.6C4.3 8.1 2 12 2 12s2.1 4.4 6 6.3"/></svg>`;
const ICON_SHOP = `<svg ${ICON_ATTRS}><path d="M4 8l1-4h14l1 4"/><path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="M9 12a3 3 0 0 0 6 0"/></svg>`;
const ICON_MAXIMIZE = `<svg ${ICON_ATTRS}><polyline points="8 3 3 3 3 8"/><polyline points="16 3 21 3 21 8"/><polyline points="3 16 3 21 8 21"/><polyline points="21 16 21 21 16 21"/></svg>`;
const ICON_MINIMIZE = `<svg ${ICON_ATTRS}><polyline points="3 8 8 8 8 3"/><polyline points="21 8 16 8 16 3"/><polyline points="3 16 8 16 8 21"/><polyline points="21 16 16 16 16 21"/></svg>`;
const ICON_ARROW_LEFT = `<svg ${ICON_ATTRS}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
const ICON_PLAY = `<svg ${ICON_ATTRS} stroke-linejoin="round"><polygon points="6 4 20 12 6 20" fill="currentColor" stroke="none"/></svg>`;

// Phase 13 — rising zigzag line, "difficulty trending up" (engine.ts's
// threatTier HUD readout + onThreatTierUp toast). Distinct from ICON_FLAME
// (raw damage output) since this is about the enemies' own escalating
// toughness over time, not the player's damage stat.
const ICON_TRENDING_UP = `<svg ${ICON_ATTRS}><polyline points="3 17 9 11 13 15 21 6"/><polyline points="15 6 21 6 21 12"/></svg>`;

// Phase 14 — triangle exclamation, "boss incoming" telegraph banner
// (engine.ts's onBossIncoming callback). Distinct from ICON_SKULL (used for
// the kills stat) since this is a warning about what's about to happen, not
// a tally of what already did.
const ICON_WARNING = `<svg ${ICON_ATTRS}><path d="M12 3 L22 20 L2 20 Z"/><line x1="12" y1="9" x2="12" y2="14"/><circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor"/></svg>`;

export const WEAPON_ICON: Record<
  | "bladeArc"
  | "bolt"
  | "orbitShield"
  | "novaPulse"
  | "homingDart"
  | "chainLightning",
  string
> = {
  bladeArc: ICON_BLADE,
  bolt: ICON_BOLT,
  orbitShield: ICON_SHIELD,
  novaPulse: ICON_PULSE,
  homingDart: ICON_DART,
  chainLightning: ICON_CHAIN,
};

// Pastel badge fill per concept, shared by the shop rows and the level-up
// cards (both draw dark ink on a bordered, shadowed badge). Same grouping as
// the icon map: Vigor and Thick Skin are both "heart", and so on.
const BADGE_BG: Record<string, string> = {
  vigor: "bg-rose-300",
  thickSkin: "bg-rose-300",
  fleetness: "bg-sky-300",
  adrenaline: "bg-sky-300",
  might: "bg-orange-300",
  powerSurge: "bg-orange-300",
  magnetism: "bg-violet-300",
  wideReach: "bg-violet-300",
  greed: "bg-yellow-300",
  luckyStar: "bg-yellow-300",
  amanuensis: "bg-emerald-300",
  recovery: "bg-emerald-300",
  quickRecovery: "bg-emerald-300",
  bulwark: "bg-slate-300",
  ironSkin: "bg-slate-300",
  haste: "bg-amber-300",
  quickDraw: "bg-amber-300",
  precision: "bg-pink-300",
  keenEye: "bg-pink-300",
  siphon: "bg-red-300",
  bloodthirst: "bg-red-300",
  chill: "bg-cyan-300",
};

export function badgeClass(id: string | undefined, fallback = "bg-sky-300") {
  return `border-2 border-slate-900 text-slate-900 shadow-[0_2px_0_#020617] ${BADGE_BG[id ?? ""] ?? fallback}`;
}

export const EVOLUTION_ICON = ICON_SPARKLE;

// Keyed by engine.ts's TEMP_STATS ids.
export const STAT_ICON: Record<string, string> = {
  powerSurge: ICON_FLAME,
  adrenaline: ICON_SPEED,
  thickSkin: ICON_HEART,
  wideReach: ICON_MAGNET,
  quickRecovery: ICON_REGEN,
  luckyStar: ICON_COIN,
  ironSkin: ICON_SHIELD,
  quickDraw: ICON_BOLT,
  keenEye: ICON_DART,
  bloodthirst: ICON_HEART,
  chill: ICON_PULSE,
};

// Keyed by shop.ts's UPGRADES ids.
export const UPGRADE_ICON: Record<string, string> = {
  vigor: ICON_HEART,
  fleetness: ICON_SPEED,
  might: ICON_FLAME,
  magnetism: ICON_MAGNET,
  greed: ICON_COIN,
  amanuensis: ICON_BOOK,
  recovery: ICON_REGEN,
  bulwark: ICON_SHIELD,
  haste: ICON_BOLT,
  precision: ICON_DART,
  siphon: ICON_HEART,
};

// A treasure chest, and the relic glyphs that come out of it. Relics reuse the
// concept icons above wherever they mean the same thing.
const ICON_CHEST = `<svg ${ICON_ATTRS}><path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3"/><rect x="3" y="11" width="18" height="9" rx="2"/><line x1="3" y1="15" x2="21" y2="15"/><rect x="10.5" y="13" width="3" height="4" rx="0.6" fill="currentColor"/></svg>`;

export const RELIC_ICON: Record<string, string> = {
  giantsHeart: ICON_HEART,
  windBoots: ICON_SPEED,
  whetstone: ICON_FLAME,
  lodestone: ICON_MAGNET,
  luckyCoin: ICON_COIN,
  scholarsQuill: ICON_BOOK,
  ironPlate: ICON_SHIELD,
  hourglass: ICON_CLOCK,
  eagleEye: ICON_DART,
  leechFang: ICON_HEART,
  thornRing: ICON_PULSE,
  emberHeart: ICON_REGEN,
  frostCharm: ICON_PULSE,
  phoenixFeather: ICON_SPARKLE,
  crownOfAges: ICON_STAR,
};

// HUD/lobby/results/toolbar icons — one lookup for index.astro's client
// script instead of importing 17 individual local consts.
export const UI_ICON = {
  hp: ICON_HEART,
  timer: ICON_CLOCK,
  kills: ICON_SKULL,
  gems: ICON_GEM,
  coins: ICON_COIN,
  level: ICON_STAR,
  tokens: ICON_TICKET,
  chest: ICON_CHEST,
  close: ICON_X,
  lab: ICON_LAB,
  trophy: ICON_TROPHY,
  soundOn: ICON_SOUND_ON,
  soundOff: ICON_SOUND_OFF,
  motionOn: ICON_EYE,
  motionOff: ICON_EYE_OFF,
  shop: ICON_SHOP,
  maximize: ICON_MAXIMIZE,
  minimize: ICON_MINIMIZE,
  back: ICON_ARROW_LEFT,
  play: ICON_PLAY,
  threat: ICON_TRENDING_UP,
  warning: ICON_WARNING,
  necromancy: ICON_NECROMANCY,
  lock: ICON_LOCK,
  // Phase 16 — reuses ICON_SPARKLE (also EVOLUTION_ICON) for the synergy
  // discovery toast: both represent a "special moment" flourish, not a
  // stat or a warning.
  synergy: ICON_SPARKLE,
} as const;

// Injects a size/utility class onto an icon string's root <svg> tag —
// lets one icon constant be reused at different sizes (h-5 w-5 on level-up
// cards, h-4 w-4 in the denser shop rows) without baking a size into it.
// Guards against an undefined/empty `svg` (a lookup miss in one of the
// icon maps above) rather than throwing — a single missing icon key should
// render as nothing, not crash the whole init() call it's used from.
export function sizedIcon(svg: string, className: string): string {
  if (!svg) return "";
  return svg.replace("<svg ", `<svg class="${className}" `);
}

// --- Illustrations ----------------------------------------------------------
// Filled, inked art for the lobby (a real chest, one picture per menu row).
// These are pictures, not the outline glyphs above: they carry their own colours.

const INK = "#0f172a";

const CHEST_PAINT = {
  wooden: {
    body: "#a2602a",
    lid: "#bf7632",
    band: "#9aa5b8",
    lock: "#f5c542",
    shine: "rgba(255,255,255,0.35)",
  },
  golden: {
    body: "#e9a823",
    lid: "#ffd24f",
    band: "#fff1b8",
    lock: "#ef4444",
    shine: "rgba(255,255,255,0.6)",
  },
} as const;

/** A treasure chest: planked wood with iron bands, or gold with a ruby lock.
 * `open` lifts the lid back and lets light pour out. */
export function chestArt(
  tier: "wooden" | "golden",
  opts: { open?: boolean; className?: string } = {},
): string {
  const c = CHEST_PAINT[tier];
  const cls = opts.className ? ` class="${opts.className}"` : "";
  const bands = (y: number, h: number) =>
    `<rect x="22" y="${y}" width="12" height="${h}" fill="${c.band}" stroke="${INK}" stroke-width="3"/><rect x="66" y="${y}" width="12" height="${h}" fill="${c.band}" stroke="${INK}" stroke-width="3"/>`;
  const lid = `<path d="M10 40 V28 Q10 10 50 10 Q90 10 90 28 V40 Z" fill="${c.lid}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>${bands(17, 23)}<path d="M18 27 Q22 17 40 15" fill="none" stroke="${c.shine}" stroke-width="3" stroke-linecap="round"/>`;
  const body = `<rect x="10" y="38" width="80" height="38" rx="6" fill="${c.body}" stroke="${INK}" stroke-width="4"/><path d="M12 52 H88 M12 64 H88" stroke="rgba(15,23,42,0.3)" stroke-width="2"/>${bands(38, 38)}`;
  const lock = `<rect x="42" y="36" width="16" height="19" rx="4" fill="${c.lock}" stroke="${INK}" stroke-width="3.5"/><circle cx="50" cy="43" r="2.8" fill="${INK}"/><rect x="48.8" y="44" width="2.4" height="6" fill="${INK}"/>`;
  const sparkle = (x: number, y: number, r: number) =>
    `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z" fill="#fff6c9"/>`;
  const inner = opts.open
    ? `<ellipse cx="50" cy="16" rx="44" ry="30" fill="#ffd24f" opacity="0.35"/><ellipse cx="50" cy="20" rx="30" ry="20" fill="#ffe27a" opacity="0.7"/>${sparkle(26, 2, 7)}${sparkle(76, -2, 9)}${sparkle(50, -12, 6)}<g transform="translate(0 -26) scale(1 .6)">${lid}</g>${body}<ellipse cx="50" cy="39" rx="39" ry="6" fill="#2a1608" stroke="${INK}" stroke-width="3"/><ellipse cx="50" cy="38" rx="30" ry="3" fill="#ffe27a"/>${lock}`
    : `${body}${lid}${lock}`;
  return `<svg viewBox="0 -22 100 106"${cls} role="img" aria-label="${tier === "golden" ? "Golden" : "Wooden"} chest"><ellipse cx="50" cy="78" rx="42" ry="5" fill="rgba(15,23,42,0.35)"/>${inner}</svg>`;
}

const tile = (inner: string) =>
  `<svg viewBox="0 0 48 48" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${inner}</svg>`;

/** One picture per lobby menu row. */
export const MENU_ICON = {
  start: tile(`<path d="M16 9 L39 24 L16 39Z" fill="#fff"/>`),
  duel: tile(
    `<path d="M10 38 L34 12" stroke-width="8"/><path d="M10 38 L34 12" stroke="#e2e8f0" stroke-width="3.5"/><path d="M38 38 L14 12" stroke-width="8"/><path d="M38 38 L14 12" stroke="#e2e8f0" stroke-width="3.5"/><path d="M8 30 L18 40 M40 30 L30 40" stroke="#fbbf24" stroke-width="5"/>`,
  ),
  upgrades: tile(
    `<path d="M24 7 L39 24 H30 V40 H18 V24 H9 Z" fill="#fff"/><path d="M24 14 L31 22" stroke="#bae6fd" stroke-width="3"/>`,
  ),
  chests: tile(
    `<path d="M8 22 V18 Q8 9 24 9 Q40 9 40 18 V22Z" fill="#bf7632"/><rect x="8" y="22" width="32" height="17" rx="3" fill="#a2602a"/><rect x="21" y="20" width="6" height="8" rx="1.5" fill="#f5c542"/>`,
  ),
  relics: tile(
    `<path d="M24 6 L39 17 L24 42 L9 17 Z" fill="#c4b5fd"/><path d="M9 17 H39 M24 6 L18 17 L24 42 L30 17 Z" stroke-width="2.5"/>`,
  ),
};

/** Small pictures for the lobby's score chips. */
export const SCORE_ICON = {
  trophy: tile(
    `<path d="M14 8 H34 V20 Q34 30 24 30 Q14 30 14 20Z" fill="#fde047"/><path d="M14 12 H8 Q8 22 15 23 M34 12 H40 Q40 22 33 23"/><path d="M24 30 V37 M17 41 H31"/>`,
  ),
  clock: tile(
    `<circle cx="24" cy="25" r="16" fill="#fff"/><path d="M24 15 V25 L31 29"/>`,
  ),
  coin: tile(
    `<circle cx="24" cy="24" r="16" fill="#fde047"/><path d="M18 24 H30"/>`,
  ),
};
