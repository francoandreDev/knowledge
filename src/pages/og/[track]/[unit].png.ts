import type { APIRoute } from "astro";
import { getUnit } from "../../../data/roadmap";
import { getWrittenUnits } from "../../../lib/curriculum";
import { renderOgImage } from "../../../lib/og-image";

export async function getStaticPaths() {
  const units = await getWrittenUnits();
  return units.map((u) => ({
    params: { track: u.track, unit: u.unitSlug },
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const roadmapUnit = getUnit(params.track!, params.unit!);
  const png = await renderOgImage({
    title: roadmapUnit?.problem ?? params.unit!,
    eyebrow: params.track!,
  });
  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};
