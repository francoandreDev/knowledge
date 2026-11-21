// The game's base pictures: stats, upgrades, weapons, special moves, run
// styles and the HUD glyphs. Filled and inked like the relic and chest art
// (see relicArt.ts), on a 32x32 board, so everything in the game speaks one
// visual language instead of mixing outline icons with painted ones.
//
// Each picture carries its own colours. The call sites that used to tint an
// outline with `currentColor` still work: they size it with sizedIcon() and
// the weapon glow (neonStyle) now lights the coloured art from behind.

const INK = "#0f172a";

const art = (inner: string, w = 2) =>
  `<svg viewBox="0 0 32 32" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;

/** A point on a circle at `deg` degrees clockwise from up. */
const at = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
};

const flake = (arm: string, core: string) => {
  let arms = "";
  for (let i = 0; i < 6; i++)
    arms += `<path d="M16 16L${at(16, 16, 13, i * 60)}" stroke="${arm}" stroke-width="3"/>`;
  return `<circle cx="16" cy="16" r="14" fill="#e0f2fe" stroke-width="1.6"/>${arms}<circle cx="16" cy="16" r="4" fill="${core}"/>`;
};

const flame = `<path d="M16 2c1 6 9 8 9 18a9 9 0 0 1-18 0c0-4 2-6 4-8 0 3 1.5 4 3 4-1-5-1-9 2-14z" fill="#f97316"/><path d="M16 30a5.2 5.2 0 0 1-5.2-5.2c0-3 3-4.4 4.2-7.6 2.2 2 6.2 4 6.2 7.6A5.2 5.2 0 0 1 16 30z" fill="#fde047" stroke-width="1.6"/>`;
const bolt = `<path d="M19 2 5 18h8l-3 12 17-19h-8z" fill="#facc15"/><path d="M17 8l-6 8" stroke="#fef9c3" stroke-width="2"/>`;
const shield = `<path d="M16 3l11 4v9c0 7-5 11-11 13C10 27 5 23 5 16V7z" fill="#94a3b8"/><path d="M16 3v26C10 27 5 23 5 16V7z" fill="#cbd5e1"/><path d="M16 9v14M10 15h12" stroke="#f1f5f9" stroke-width="2.4"/>`;
const heart = `<path d="M16 28C5 20 3 13 7 8.5c3-3.4 7.5-2.6 9 .8 1.5-3.4 6-4.2 9-.8 4 4.5 2 11.5-9 19.5z" fill="#ef4444"/><path d="M9 11c.6-2 2.6-3 4-2.2" stroke="#fecaca" stroke-width="2"/>`;
const coin = `<circle cx="16" cy="16" r="12.5" fill="#facc15"/><circle cx="16" cy="16" r="8" fill="#fde68a" stroke-width="1.5"/><path d="M12.6 13.6a3.6 3 0 0 1 6.8 0c0 3-6.8 2-6.8 5a3.6 3 0 0 0 6.8 0" stroke-width="1.7"/>`;
const sparkle = `<path d="M16 2l3.2 10.8L30 16l-10.8 3.2L16 30l-3.2-10.8L2 16l10.8-3.2z" fill="#c4b5fd"/><path d="M16 8l1.6 6.4L24 16l-6.4 1.6L16 24l-1.6-6.4L8 16l6.4-1.6z" fill="#f5f3ff" stroke="none"/>`;
const star = `<path d="M16 2.5l3.9 8.3 9.1 1.1-6.7 6.2 1.8 9L16 22.6 7.9 27.1l1.8-9L3 11.9l9.1-1.1z" fill="#fde047"/><path d="M11 12l5-5" stroke="#fef9c3" stroke-width="2"/>`;

/** The picture for each concept, weapon, special and glyph. */
const RAW = {
  // --- concepts shared by temp stats and shop upgrades ---
  heart,
  speed: `<path d="M3 5l11 11L3 27h6l11-11L9 5z" fill="#38bdf8"/><path d="M15 5l11 11-11 11h6l9-11-9-11z" fill="#bae6fd"/>`,
  magnet:
    `<path d="M7 6v10a9 9 0 0 0 18 0V6" stroke-width="9.5"/>` +
    `<path d="M7 6v10a9 9 0 0 0 18 0V6" stroke="#ef4444" stroke-width="6"/>` +
    `<path d="M7 6v4M25 6v4" stroke="#e5e7eb" stroke-width="6"/>` +
    `<path d="M10 20a6 6 0 0 0 4 4" stroke="#fecaca" stroke-width="1.8"/>`,
  coin,
  flame,
  regen: `<path d="M12 3h8v9h9v8h-9v9h-8v-9H3v-8h9z" fill="#4ade80"/><path d="M14 6v8H6" stroke="#dcfce7" stroke-width="2" />`,
  book:
    `<path d="M3 7c5-2.5 10-2 13 1v19c-3-3-8-3.5-13-1z" fill="#f8fafc"/>` +
    `<path d="M29 7c-5-2.5-10-2-13 1v19c3-3 8-3.5 13-1z" fill="#e2e8f0"/>` +
    `<path d="M6 11c3-1 5-1 7 .5M6 16c3-1 5-1 7 .5M19 11.5c2-1.5 4-1.5 7-.5M19 16.500c2-1.5 4-1.5 7-.5" stroke="#3b82f6" stroke-width="1.6"/>`,
  shield,
  bolt,
  dart:
    `<circle cx="14" cy="18" r="12" fill="#f8fafc"/><circle cx="14" cy="18" r="8" fill="#f472b6"/><circle cx="14" cy="18" r="4" fill="#f8fafc"/><circle cx="14" cy="18" r="1.4" fill="${INK}"/>` +
    `<path d="M15 17L27 5" stroke-width="2.4"/><path d="M23 4h5v5" stroke-width="2.4"/>`,
  pulse: `<circle cx="16" cy="16" r="13" fill="#cffafe"/><circle cx="16" cy="16" r="8" fill="#67e8f9"/><circle cx="16" cy="16" r="3" fill="#fff" stroke-width="1.6"/>`,
  clock: `<path d="M12 3h8" stroke-width="3"/><circle cx="16" cy="18" r="12" fill="#f8fafc"/><path d="M16 11v7l5 3" stroke-width="2.4"/><path d="M6 8l3 3M26 8l-3 3" stroke-width="2.2"/>`,
  // --- HUD, lobby and results glyphs ---
  skull:
    `<path d="M16 3C9 3 5 8 5 14c0 4 2 6 4 8v4h14v-4c2-2 4-4 4-8 0-6-4-11-11-11z" fill="#e5e7eb"/>` +
    `<circle cx="11.5" cy="15" r="3.2" fill="${INK}"/><circle cx="20.5" cy="15" r="3.2" fill="${INK}"/>` +
    `<path d="M16 18l-1.5 3h3zM12.5 26v-3M16 26v-3M19.5 26v-3" stroke-width="1.8"/>`,
  gem:
    `<path d="M8 4h16l6 8-14 17L2 12z" fill="#22d3ee"/>` +
    `<path d="M8 4 2 12h28l-6-8z" fill="#a5f3fc"/>` +
    `<path d="M2 12h28M12 4l-4 8 8 17 8-17-4-8" stroke-width="1.6"/>`,
  star,
  ticket: `<path d="M3 9a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v4a3 3 0 0 0 0 6v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a3 3 0 0 0 0-6z" fill="#f472b6"/><path d="M12 9v14" stroke-dasharray="2 3" stroke-width="1.8"/><path d="M20 12.500l1.2 2.5 2.8.4-2 2 .5 2.7-2.5-1.3-2.5 1.3.5-2.7-2-2 2.8-.4z" fill="#fde047" stroke-width="1.2"/>`,
  trophy:
    `<path d="M9 7H4c0 6 2 9 6 9.500M23 7h5c0 6-2 9-6 9.5"/>` +
    `<path d="M9 4h14v9a7 7 0 0 1-14 0z" fill="#facc15"/>` +
    `<path d="M12 7v6" stroke="#fef9c3" stroke-width="2"/>` +
    `<path d="M16 20v5"/><path d="M9 28h14v-3H9z" fill="#b45309"/>`,
  lab:
    `<path d="M12 3h8M13 3v9L5.5 24.500A3 3 0 0 0 8 29h16a3 3 0 0 0 2.5-4.500L19 12V3" fill="#e0f2fe"/>` +
    `<path d="M9 21h14l3.5 4.500A2 2 0 0 1 25 29H7a2 2 0 0 1-1.5-3.500z" fill="#a78bfa"/>` +
    `<circle cx="14" cy="25" r="1.4" fill="#ede9fe" stroke="none"/><circle cx="19" cy="23" r="1" fill="#ede9fe" stroke="none"/>`,
  shop:
    `<path d="M5 12h22v16H5z" fill="#fef3c7"/>` +
    `<path d="M4 12 6 5h20l2 7z" fill="#f87171"/><path d="M11 12l1-7M16 12V5M21 12l-1-7" stroke-width="1.6"/>` +
    `<rect x="13" y="18" width="7" height="10" fill="#92400e"/>`,
  trending: `<path d="M3 24l9-9 6 6 10-12" stroke-width="6.5"/><path d="M3 24l9-9 6 6 10-12" stroke="#f43f5e" stroke-width="3"/><path d="M21 8h8v8" stroke-width="5"/><path d="M21 8h8v8" stroke="#f43f5e" stroke-width="2.2"/>`,
  warning: `<path d="M16 3l14 25H2z" fill="#fde047"/><path d="M16 12v8" stroke-width="3"/><circle cx="16" cy="24" r="1.7" fill="${INK}"/>`,
  necromancy:
    `<path d="M6 29V14a10 10 0 0 1 20 0v15z" fill="#cbd5e1"/>` +
    `<path d="M16 11v10M12 15h8" stroke-width="2.5"/>` +
    `<path d="M25 4c-3 2 0 4-2 7" stroke="#4ade80" stroke-width="2.6"/>`,
  sparkle,
  chest:
    `<rect x="3" y="14" width="26" height="14" rx="2" fill="#a2602a"/>` +
    `<path d="M3 14v-3a8 8 0 0 1 8-8h10a8 8 0 0 1 8 8v3z" fill="#bf7632"/>` +
    `<rect x="13" y="12" width="6" height="9" rx="1.5" fill="#f5c542"/>`,
  // --- weapons ---
  bladeArc:
    `<path d="M3 16C4 9 9 4 16 3" stroke="#e879f9" stroke-width="3.5"/>` +
    `<path d="M27 3l3 3L15 21l-4-4z" fill="#e2e8f0"/>` +
    `<path d="M9 15l8 8" stroke="#a16207" stroke-width="4"/><path d="M11 21l-6 6" stroke="#a16207" stroke-width="3.5"/>`,
  boltShot:
    `<path d="M2 11h6M1 16h7M2 21h6" stroke="#fde68a" stroke-width="2.2"/>` +
    `<path d="M30 16 17 6l2 7h-8v6h8l-2 7z" fill="#facc15"/>`,
  orbitShield:
    `<ellipse cx="16" cy="16" rx="13" ry="6" transform="rotate(-28 16 16)" stroke-dasharray="3 3"/>` +
    `<circle cx="16" cy="16" r="4" fill="#fef9c3"/>` +
    `<circle cx="5" cy="21" r="3.2" fill="#fde047"/><circle cx="27" cy="11" r="3.2" fill="#fde047"/>`,
  novaPulse:
    `<circle cx="16" cy="16" r="13" fill="#ffedd5" stroke-dasharray="4 3"/>` +
    `<circle cx="16" cy="16" r="8" fill="#fb923c"/><circle cx="16" cy="16" r="3.2" fill="#fff7ed" stroke-width="1.6"/>`,
  homingDart:
    `<path d="M3 28C4 13 16 6 23 11" stroke-dasharray="1.5 3.5"/>` +
    `<path d="M20 9l10 1-6 8z" fill="#f472b6"/><path d="M20 9l5 3" stroke="#fbcfe8" stroke-width="2"/>` +
    `<circle cx="6" cy="27" r="2.5" fill="#f8fafc"/>`,
  chainLightning:
    `<path d="M5 26l5-7-3-2 8-10 1 0 4 8-3 2 6 8" stroke-width="5.5"/>` +
    `<path d="M5 26l5-7-3-2 8-10 1 0 4 8-3 2 6 8" stroke="#67e8f9" stroke-width="2.4"/>` +
    `<circle cx="5" cy="26" r="3.2" fill="#cffafe"/><circle cx="16" cy="7" r="3.2" fill="#cffafe"/><circle cx="27" cy="26" r="3.2" fill="#cffafe"/>`,
  meteorRain:
    `<path d="M3 3l10 10M3 11l7 5M11 3l5 7" stroke="#fdba74" stroke-width="3"/>` +
    `<circle cx="21" cy="21" r="8.5" fill="#f97316"/><circle cx="23" cy="19" r="2.8" fill="#fdba74" stroke-width="1.4"/><circle cx="19" cy="24" r="1.6" fill="#9a3412" stroke="none"/>`,
  gravityWell:
    `<circle cx="16" cy="16" r="13.5" fill="#4c1d95"/>` +
    `<path d="M16 16a2 2 0 0 1 4 0 5 5 0 0 1-10 0 8 8 0 0 1 16 0" stroke="#c4b5fd" stroke-width="2.2"/>` +
    `<circle cx="16" cy="16" r="2" fill="#fff" stroke="none"/>`,
  flameTrail:
    flame +
    `<circle cx="4" cy="26" r="1.7" fill="#fb923c"/><circle cx="28" cy="22" r="1.4" fill="#fde047"/>`,
  sentryTotem:
    `<path d="M9 29V12l7-9 7 9v17z" fill="#a8a29e"/>` +
    `<path d="M9 29V12l7-9v26z" fill="#d6d3d1" stroke="none"/>` +
    `<circle cx="16" cy="14" r="4" fill="#fef08a"/><circle cx="16" cy="14" r="1.6" fill="${INK}"/>` +
    `<path d="M11 22h10M11 26h10M4 29h24"/>`,
  // --- special moves ---
  dash: `<path d="M2 9h6M1 16h7M2 23h6" stroke="#bae6fd" stroke-width="2.2"/><path d="M10 5l10 11-10 11h6l10-11L16 5z" fill="#38bdf8"/>`,
  slam:
    `<path d="M16 3v14M8 12l8 9 8-9" stroke-width="6.5"/>` +
    `<path d="M16 3v14M8 12l8 9 8-9" stroke="#fb923c" stroke-width="3.2"/>` +
    `<path d="M3 28h26M7 24l-4 4M25 24l4 4"/>`,
  freeze: flake("#0ea5e9", "#67e8f9"),
  barrier: `<path d="M16 3l11 4v9c0 7-5 11-11 13C10 27 5 23 5 16V7z" fill="#67e8f9"/><path d="M16 3v26C10 27 5 23 5 16V7z" fill="#cffafe" stroke="none"/><path d="M16 3l11 4v9c0 7-5 11-11 13C10 27 5 23 5 16V7z" /><path d="M11 11c2-1 4-1 5-3" stroke="#fff" stroke-width="2"/>`,
  // --- run styles ---
  brawler:
    `<path d="M5 27 25 7" stroke-width="5.5"/><path d="M5 27 25 7" stroke="#e2e8f0" stroke-width="2.2"/>` +
    `<path d="M27 27 7 7" stroke-width="5.5"/><path d="M27 27 7 7" stroke="#e2e8f0" stroke-width="2.2"/>` +
    `<path d="M6 20l6 6M26 20l-6 6" stroke="#a16207" stroke-width="3.5"/>`,
  sharpshooter:
    `<circle cx="16" cy="16" r="9" fill="#fce7f3"/><circle cx="16" cy="16" r="3" fill="#ef4444"/>` +
    `<path d="M16 2v7M16 23v7M2 16h7M23 16h7" stroke-width="2.6"/>`,
  arcanist:
    `<path d="M4 28 16 16" stroke-width="5"/><path d="M4 28 16 16" stroke="#a16207" stroke-width="2.2"/>` +
    `<path d="M21 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#c4b5fd"/>`,
} as const;

export type ArtKey = keyof typeof RAW;

export const A = Object.fromEntries(
  Object.entries(RAW).map(([key, inner]) => [key, art(inner)]),
) as Record<ArtKey, string>;
