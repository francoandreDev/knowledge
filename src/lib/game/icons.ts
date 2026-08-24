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
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const ICON_BLADE = `<svg ${ICON_ATTRS}><line x1="5" y1="19" x2="19" y2="5"/><line x1="14" y1="5" x2="19" y2="5"/><line x1="19" y1="5" x2="19" y2="10"/><line x1="5" y1="19" x2="10" y2="19"/></svg>`;

const ICON_BOLT = `<svg ${ICON_ATTRS} stroke-linejoin="round"><polygon points="13 2 4 14 11 14 9 22 20 10 13 10 13 2" fill="currentColor" stroke="none"/></svg>`;

const ICON_SHIELD = `<svg ${ICON_ATTRS}><path d="M12 2 L20 6 L20 12 C20 17 16.5 20.5 12 22 C7.5 20.5 4 17 4 12 L4 6 Z"/><ellipse cx="12" cy="12" rx="7" ry="3" transform="rotate(20 12 12)"/></svg>`;

const ICON_PULSE = `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="6" stroke-dasharray="2 3"/><circle cx="12" cy="12" r="10" stroke-dasharray="2 4"/></svg>`;

const ICON_DART = `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/></svg>`;

const ICON_SPARKLE = `<svg ${ICON_ATTRS} stroke-linejoin="round"><path d="M12 2 L13.5 9 L21 12 L13.5 15 L12 22 L10.5 15 L3 12 L10.5 9 Z" fill="currentColor" stroke="none"/></svg>`;

// heart — HP-related (Vigor / Thick Skin)
const ICON_HEART = `<svg ${ICON_ATTRS}><path d="M12 21 C12 21 4 14.5 4 9 C4 6 6.5 4 9 4 C10.5 4 12 5 12 7 C12 5 13.5 4 15 4 C17.5 4 20 6 20 9 C20 14.5 12 21 12 21 Z"/></svg>`;

// double chevron — speed-related (Fleetness / Adrenaline)
const ICON_SPEED = `<svg ${ICON_ATTRS}><polyline points="4 6 12 12 4 18"/><polyline points="12 6 20 12 12 18"/></svg>`;

// arrows pulling inward — pickup-radius-related (Magnetism / Wide Reach)
const ICON_MAGNET = `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><polyline points="4 4 8 8"/><polyline points="20 4 16 8"/><polyline points="4 20 8 16"/><polyline points="20 20 16 16"/></svg>`;

// overlapping circles — coin-related (Greed / Lucky Star)
const ICON_COIN = `<svg ${ICON_ATTRS}><circle cx="9" cy="9" r="6"/><circle cx="15" cy="15" r="6"/></svg>`;

// flame — damage-related (Might / Power Surge)
const ICON_FLAME = `<svg ${ICON_ATTRS}><path d="M12 2 C12 2 7 7 7 12 C7 15.3 9.7 18 13 18 C16.3 18 18 15.5 18 13 C18 11 17 9.5 16 8.5 C16 10 15 11 14 11 C14.5 9 13.5 6 12 2 Z"/></svg>`;

// plus in a circle — regen-related (Recovery / Quick Recovery)
const ICON_REGEN = `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;

// open book — XP-related (Amanuensis, no run-only stat counterpart)
const ICON_BOOK = `<svg ${ICON_ATTRS}><path d="M4 5 C6 4 9 4 12 5 L12 19 C9 18 6 18 4 19 Z"/><path d="M20 5 C18 4 15 4 12 5 L12 19 C15 18 18 18 20 19 Z"/></svg>`;

export const WEAPON_ICON: Record<
  "bladeArc" | "bolt" | "orbitShield" | "novaPulse" | "homingDart",
  string
> = {
  bladeArc: ICON_BLADE,
  bolt: ICON_BOLT,
  orbitShield: ICON_SHIELD,
  novaPulse: ICON_PULSE,
  homingDart: ICON_DART,
};

export const EVOLUTION_ICON = ICON_SPARKLE;

// Keyed by engine.ts's TEMP_STATS ids.
export const STAT_ICON: Record<string, string> = {
  powerSurge: ICON_FLAME,
  adrenaline: ICON_SPEED,
  thickSkin: ICON_HEART,
  wideReach: ICON_MAGNET,
  quickRecovery: ICON_REGEN,
  luckyStar: ICON_COIN,
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
};

// Injects a size/utility class onto an icon string's root <svg> tag —
// lets one icon constant be reused at different sizes (h-5 w-5 on level-up
// cards, h-4 w-4 in the denser shop rows) without baking a size into it.
export function sizedIcon(svg: string, className: string): string {
  return svg.replace("<svg ", `<svg class="${className}" `);
}
