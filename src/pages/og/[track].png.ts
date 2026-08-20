import type { APIRoute } from "astro";
import { roadmap } from "../../data/roadmap";
import { renderOgImage } from "../../lib/og-image";

export function getStaticPaths() {
  return roadmap.tracks.map((track) => ({ params: { track: track.name } }));
}

export const GET: APIRoute = async ({ params }) => {
  const png = await renderOgImage({
    title: params.track!,
    eyebrow: "systems-mastery track",
  });
  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};
