// Powers the "Instrument Panel" radial gauges (homepage track cards, roadmap
// track headers): a gauge's arc/label reflects the *reader's own* completion
// of a track, not how much content exists for it — that number needs the
// active profile's progress state, so it's computed client-side and applied
// after mount, the same pattern as index.astro's "continue learning" widget.
import { pStorage } from "./profile";

export type TrackUnitMap = Record<string, string[]>;

interface ProgressState {
  done?: boolean;
}

/** Groups written units by track — the pool of slugs a reader could have marked done. */
export function groupSlugsByTrack(
  units: { track: string; unitSlug: string }[],
): TrackUnitMap {
  const map: TrackUnitMap = {};
  for (const u of units) {
    (map[u.track] ??= []).push(u.unitSlug);
  }
  return map;
}

export function countDoneByTrack(
  trackUnits: TrackUnitMap,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [track, slugs] of Object.entries(trackUnits)) {
    let done = 0;
    for (const slug of slugs) {
      const raw = pStorage.getItem(`progress:${track}/${slug}`);
      if (!raw) continue;
      try {
        const state: ProgressState = JSON.parse(raw);
        if (state.done) done++;
      } catch {
        // Malformed entry — treat as not done rather than throwing.
      }
    }
    counts[track] = done;
  }
  return counts;
}

const GAUGE_RADIUS = 16;
export const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

/**
 * Finds every ProgressGauge.astro instance rendered in "dynamic" mode
 * (carrying `data-gauge-track`) and fills in its arc + label from the active
 * profile's real progress. Gauges rendered in "static" mode (a build-time
 * `fraction`, e.g. roadmap's content-coverage tiles) have no such attribute
 * and are left untouched.
 */
export function applyTrackGauges(trackUnits: TrackUnitMap): void {
  const counts = countDoneByTrack(trackUnits);
  document.querySelectorAll<HTMLElement>("[data-gauge-track]").forEach((el) => {
    const track = el.dataset.gaugeTrack;
    if (!track) return;
    const total = Number(el.dataset.gaugeTotal ?? "0");
    const done = counts[track] ?? 0;
    const fraction = total > 0 ? done / total : 0;

    const arc = el.querySelector<SVGCircleElement>("[data-gauge-arc]");
    if (arc) {
      arc.style.strokeDashoffset = String(GAUGE_CIRCUMFERENCE * (1 - fraction));
    }

    const label = el.querySelector<HTMLElement>("[data-gauge-frac]");
    if (label) {
      label.textContent = total > 0 ? `${done}/${total} done` : "Not started";
    }
  });
}
