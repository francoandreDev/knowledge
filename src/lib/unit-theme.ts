// Per-unit theme shared by the roadmap and the home page: a hue from the
// unit's main tag (golden-angle steps over the sorted tag list), nudged per
// unit so siblings sharing a tag differ, and one of four background patterns.
export const slugHash = (slug: string) =>
  Array.from(slug).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function makeUnitHue(allTags: string[]) {
  return (tag: string, slug: string) =>
    Math.round(
      (((Math.max(allTags.indexOf(tag), 0) * 137.508 +
        20 +
        (slugHash(slug) % 41) -
        20) %
        360) +
        360) %
        360,
    );
}

export const unitPattern = (slug: string) =>
  ["dots", "lines", "grid", "rings"][slugHash(slug) % 4]!;
