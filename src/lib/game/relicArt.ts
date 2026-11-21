// Relic illustrations: one inked, filled picture per relic, drawn on a 64x64
// board. Like the lobby art in icons.ts they carry their own colours, so a
// relic reads at a glance in the collection, on the chest-reveal card and in
// its detail view. The rarity frame (ring, glow) is CSS around the picture,
// not part of it — see `.rl-medal` in the game page.

const INK = "#0f172a";
const W = 2.5;

const ATTRS = `viewBox="0 0 64 64" fill="none" stroke="${INK}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"`;

/** A point on a circle centred at (cx, cy), `deg` degrees clockwise from up. */
function polar(cx: number, cy: number, r: number, deg: number): string {
  const a = ((deg - 90) * Math.PI) / 180;
  return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
}

const heart = (fill: string, hi: string) =>
  `<path d="M32 55C11 41 7 28 13 19c5-7 14-6 19 1 5-7 14-8 19-1 6 9 2 22-19 36z" fill="${fill}"/>` +
  `<path d="M17 24c1-4 5-6 8-4" stroke="${hi}" stroke-width="3"/>`;

function thornRing(): string {
  let thorns = "";
  for (let i = 0; i < 8; i++) {
    const deg = i * 45;
    thorns += `<path d="M${polar(32, 34, 13, deg - 9)} L${polar(32, 34, 26, deg)} L${polar(32, 34, 13, deg + 9)}Z" fill="#86efac"/>`;
  }
  return (
    thorns +
    `<circle cx="32" cy="34" r="14" stroke-width="11"/>` +
    `<circle cx="32" cy="34" r="14" stroke="#22c55e" stroke-width="6.5"/>` +
    `<circle cx="32" cy="34" r="14" stroke="#bbf7d0" stroke-width="1.6" stroke-dasharray="4 9"/>`
  );
}

function snowflake(): string {
  let arms = "";
  for (let i = 0; i < 6; i++) {
    const deg = i * 60;
    arms +=
      `<path d="M32 32L${polar(32, 32, 25, deg)}" stroke="#0ea5e9" stroke-width="3.6"/>` +
      `<path d="M${polar(32, 32, 15, deg - 7)} L${polar(32, 32, 20, deg)} L${polar(32, 32, 15, deg + 7)}" stroke="#0ea5e9" stroke-width="2.6"/>`;
  }
  return (
    `<circle cx="32" cy="32" r="27" fill="#e0f2fe" stroke-width="2"/>` +
    arms +
    `<path d="M32 23l7 9-7 9-7-9z" fill="#67e8f9"/>` +
    `<path d="M32 26l3.5 6-3.5 3" stroke="#fff" stroke-width="1.8"/>`
  );
}

const ART: Record<string, string> = {
  giantsHeart:
    heart("#ef4444", "#fecaca") +
    `<path d="M26 34l4 4 8-9" stroke="#fff" stroke-width="3.2"/>`,

  windBoots:
    `<path d="M5 22h14M3 30h13M7 38h11" stroke="#7dd3fc" stroke-width="3"/>` +
    `<path d="M23 8h16v22l13 7c3 2 4 7 2 10H20c-2 0-4-1-4-3z" fill="#b45309"/>` +
    `<path d="M16 46h38v6a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2z" fill="#451a03"/>` +
    `<path d="M23 8h16v7H23z" fill="#fde68a"/>` +
    `<path d="M44 12c6-5 11-4 14-1-4 1-6 2-8 5 3-1 5 0 6 1-4 2-8 2-13 1z" fill="#fff" stroke-width="2"/>`,

  whetstone:
    `<path d="M9 38l29-21 17 15-29 21z" fill="#94a3b8"/>` +
    `<path d="M9 38l29-21 4 3-29 21z" fill="#cbd5e1"/>` +
    `<path d="M20 28l25 19" stroke="#64748b" stroke-width="2"/>` +
    `<path d="M40 40l16-13" stroke="#e2e8f0" stroke-width="4"/>` +
    `<path d="M14 12v8M10 16h8M52 46v7M48.5 49.5h7" stroke="#fde047" stroke-width="2.6"/>`,

  lodestone:
    `<path d="M15 14v20a17 17 0 0 0 34 0V14" stroke-width="15"/>` +
    `<path d="M15 14v20a17 17 0 0 0 34 0V14" stroke="#dc2626" stroke-width="10"/>` +
    `<path d="M15 14v8M49 14v8" stroke="#2563eb" stroke-width="10"/>` +
    `<path d="M9 10h12v6H9zM43 10h12v6H43z" fill="#e5e7eb"/>` +
    `<circle cx="32" cy="6" r="2.4" fill="#fde047" stroke-width="1.6"/>` +
    `<path d="M24 52c2 3 5 4 8 4" stroke="#fecaca" stroke-width="2.4"/>`,

  luckyCoin:
    `<circle cx="32" cy="32" r="26" fill="#facc15"/>` +
    `<circle cx="32" cy="32" r="19" fill="#fde68a" stroke-width="2"/>` +
    `<circle cx="32" cy="25" r="5.6" fill="#16a34a" stroke-width="2"/>` +
    `<circle cx="25" cy="32" r="5.6" fill="#16a34a" stroke-width="2"/>` +
    `<circle cx="39" cy="32" r="5.6" fill="#16a34a" stroke-width="2"/>` +
    `<circle cx="32" cy="39" r="5.6" fill="#16a34a" stroke-width="2"/>` +
    `<path d="M32 36c0 6 2 9 6 11" stroke="#166534" stroke-width="2.6"/>` +
    `<path d="M15 20a19 19 0 0 1 8-8" stroke="#fff" stroke-width="3"/>`,

  scholarsQuill:
    `<path d="M8 56c6-2 9-5 10-8" stroke-width="3"/>` +
    `<path d="M20 48C16 30 30 10 56 6c-1 22-14 38-32 42z" fill="#f8fafc"/>` +
    `<path d="M20 48C34 36 44 22 56 6" stroke-width="2.2"/>` +
    `<path d="M28 38c5 0 9-2 12-5M33 29c4 0 7-1 10-4M38 20c3 0 6-1 8-3" stroke="#93c5fd" stroke-width="2.2"/>` +
    `<path d="M10 52l10-4 1 4z" fill="#fde047"/>` +
    `<path d="M30 56h24v4H30z" fill="#1e3a8a"/>`,

  ironPlate:
    `<path d="M32 5l22 7v18c0 14-9 24-22 29C19 54 10 44 10 30V12z" fill="#94a3b8"/>` +
    `<path d="M32 5v54C19 54 10 44 10 30V12z" fill="#cbd5e1"/>` +
    `<path d="M32 12l15 5v12c0 10-6 17-15 21-9-4-15-11-15-21V17z" fill="#64748b" stroke-width="2"/>` +
    `<circle cx="20" cy="18" r="2" fill="#fde047" stroke-width="1.4"/>` +
    `<circle cx="44" cy="18" r="2" fill="#fde047" stroke-width="1.4"/>` +
    `<path d="M32 22v20M24 32h16" stroke="#e2e8f0" stroke-width="3.2"/>`,

  hourglass:
    `<path d="M14 6h36v6H14zM14 52h36v6H14z" fill="#b45309"/>` +
    `<path d="M18 12h28c0 10-6 15-10 20 4 5 10 10 10 20H18c0-10 6-15 10-20-4-5-10-10-10-20z" fill="#e0f2fe"/>` +
    `<path d="M22 16h20c-1 6-5 9-10 13-5-4-9-7-10-13z" fill="#fbbf24" stroke-width="1.6"/>` +
    `<path d="M32 34v12" stroke="#fbbf24" stroke-width="2.4"/>` +
    `<path d="M22 52c1-5 5-8 10-12 5 4 9 7 10 12z" fill="#fbbf24" stroke-width="1.6"/>` +
    `<path d="M20 14c0 6 3 9 6 13" stroke="#fff" stroke-width="2"/>`,

  eagleEye:
    `<path d="M3 32C12 18 22 13 32 13s20 5 29 19c-9 14-19 19-29 19S12 46 3 32z" fill="#f8fafc"/>` +
    `<circle cx="32" cy="32" r="12.5" fill="#f59e0b"/>` +
    `<circle cx="32" cy="32" r="6" fill="${INK}"/>` +
    `<circle cx="28.5" cy="28.5" r="2.2" fill="#fff" stroke="none"/>` +
    `<path d="M32 5v6M32 53v6M5 32H0M64 32h-5" stroke="#ef4444" stroke-width="2.6"/>`,

  leechFang:
    `<path d="M20 7c13-1 25 5 27 20 1 11-3 21-10 29-1-10-5-17-11-23-6-6-8-16-6-26z" fill="#f1f5f9"/>` +
    `<path d="M24 13c8 0 15 4 17 12" stroke="#fff" stroke-width="3"/>` +
    `<path d="M20 7c-3 6-3 14 0 20" stroke="#94a3b8" stroke-width="2"/>` +
    `<path d="M46 54c3 2 4 4 4 6a4 4 0 0 1-8 0c0-2 1-4 4-6z" fill="#dc2626" stroke-width="2"/>`,

  thornRing: thornRing(),

  emberHeart:
    `<path d="M32 3c5 7 10 9 10 16a10 10 0 0 1-20 0c0-4 3-5 4-9 2 3 4 3 4 5 2-3 2-8 2-12z" fill="#fbbf24" stroke-width="2.2"/>` +
    heart("#9a3412", "#fdba74") +
    `<path d="M32 24l-5 9 5 4-3 8 10-12-6-4z" fill="#fb923c" stroke="#fde047" stroke-width="2"/>`,

  frostCharm: snowflake(),

  phoenixFeather:
    `<path d="M14 58C14 36 26 14 50 5c3 20-6 40-28 50z" fill="#f97316"/>` +
    `<path d="M26 46C30 32 38 20 50 5c3 20-6 40-28 50z" fill="#fbbf24" stroke-width="2"/>` +
    `<path d="M14 58C28 38 38 22 50 5" stroke-width="2.4"/>` +
    `<path d="M24 38l-9-1M30 28l-8-4M37 20l-6-5" stroke="#fde047" stroke-width="2.4"/>` +
    `<path d="M9 28c2-3 1-6-1-8 4 0 8 3 7 8M54 38c1-4 5-5 7-4-3 2-3 5-2 8z" fill="#fde047" stroke-width="1.8"/>`,

  crownOfAges:
    `<path d="M7 50l4-30 13 14 8-20 8 20 13-14 4 30z" fill="#facc15"/>` +
    `<path d="M7 50l4-30 7 8-2 22z" fill="#fde68a" stroke="none"/>` +
    `<path d="M6 50h52v8H6z" fill="#eab308"/>` +
    `<circle cx="32" cy="42" r="4.6" fill="#ef4444" stroke-width="2"/>` +
    `<circle cx="18" cy="43" r="3.6" fill="#3b82f6" stroke-width="2"/>` +
    `<circle cx="46" cy="43" r="3.6" fill="#22c55e" stroke-width="2"/>` +
    `<circle cx="11" cy="19" r="3" fill="#fde047" stroke-width="2"/>` +
    `<circle cx="32" cy="12" r="3" fill="#fde047" stroke-width="2"/>` +
    `<circle cx="53" cy="19" r="3" fill="#fde047" stroke-width="2"/>`,
};

/** Every relic id that has a picture. */
export const RELIC_ART_IDS: readonly string[] = Object.keys(ART);

/** The relic's illustration as an inline <svg>, or "" for an unknown id.
 * `className` lands on the root element (sizing, filters). */
export function relicArt(id: string, className = ""): string {
  const body = ART[id];
  if (!body) return "";
  const cls = className ? ` class="${className}"` : "";
  return `<svg ${ATTRS}${cls}>${body}</svg>`;
}
