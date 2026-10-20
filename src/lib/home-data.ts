// Build-time data shared by the home menu and the hub pages it links to
// (/tracks, /search, /review, /question, /stats, /progress). Each page embeds
// only the slice of this it needs as JSON for its client script.
import { roadmap, getUnit } from "../data/roadmap";
import { getWrittenUnits } from "./curriculum";
import { groupSlugsByTrack } from "./progress-gauges";

export async function loadHomeData() {
  const writtenUnits = await getWrittenUnits();

  const writtenByTrack = new Map<string, number>();
  const writtenSlugsByTrack = new Map<string, Set<string>>();
  for (const u of writtenUnits) {
    writtenByTrack.set(u.track, (writtenByTrack.get(u.track) ?? 0) + 1);
    if (!writtenSlugsByTrack.has(u.track))
      writtenSlugsByTrack.set(u.track, new Set());
    writtenSlugsByTrack.get(u.track)!.add(u.unitSlug);
  }

  // A bare track/slug progress key resolves back to a title + href through
  // this table, written units only.
  const unitLookup = roadmap.tracks.flatMap((t) =>
    t.units
      .filter((u) => writtenSlugsByTrack.get(t.name)?.has(u.slug))
      .map((u) => ({ track: t.name, slug: u.slug, problem: u.problem })),
  );

  // One representative level-1 quiz per written unit, tagged with the unit's
  // roadmap tags so the client can prefer the active profile's interests.
  const previewPool = writtenUnits
    .map((u) => {
      const quizL1 = u.exercises.find(
        (e) => e.type === "quiz" && e.level === 1,
      );
      if (!quizL1 || quizL1.type !== "quiz") return null;
      const roadmapUnit = getUnit(u.track, u.unitSlug);
      return {
        track: u.track,
        slug: u.unitSlug,
        problem: roadmapUnit?.problem ?? "",
        prompt: quizL1.prompt,
        choices: quizL1.choices,
        correctIndex: quizL1.correctIndex,
        tags: roadmapUnit?.tags ?? [],
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    writtenUnits,
    writtenByTrack,
    trackUnitSlugs: groupSlugsByTrack(writtenUnits),
    unitLookup,
    previewPool,
    writtenUnitHrefs: writtenUnits.map((u) => `/${u.track}/${u.unitSlug}/`),
    totalUnits: roadmap.tracks.reduce((n, t) => n + t.units.length, 0),
    tracksStarted: roadmap.tracks.filter(
      (t) => (writtenByTrack.get(t.name) ?? 0) > 0,
    ).length,
  };
}

// Fixed pick for a brand-new reader with nothing to continue yet: the most
// foundational problem on the site.
export const STARTER_UNIT = {
  track: "web",
  slug: "http-request-response-basics",
  reason:
    "The most foundational problem on the site — most other web/ units assume you already feel this one.",
};
export const starterProblem =
  getUnit(STARTER_UNIT.track, STARTER_UNIT.slug)?.problem ?? "";
