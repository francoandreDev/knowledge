// Phase 4 — token/run-duration/best-time bookkeeping for the game.
//
// Deviation from docs/GAME-DESIGN.md worth noting: the design doc's gating
// section assumes ProgressToggle marks individual levels (L1/L2/L3) done
// independently ("every time ProgressToggle marks an individual level...
// done, the player earns 1 token"). The site's actual data model (see
// src/lib/spaced-repetition.ts) only ever marks a whole *unit* done/not-done
// — there is one ProgressToggle per unit page, not one per level. So here,
// "mark done" (initial or a spaced-repetition re-mark) grants 1 token per
// unit, not per level. This also means "units with L1+L2+L3 all currently
// done" (the run-duration formula) collapses to "units currently marked
// done", since marking done already requires every exercise pool on the
// page — across whichever levels the unit has — to have passed.
//
// Also a deviation from the design doc's "Technical foundations" (which
// specs IndexedDB via `idb` for all game-owned persistence): that wiring is
// Phase 5 work. Tokens/best-time are per-learner data just like progress and
// exercise state, so for now they live in the same place progress does
// (`pStorage`, profile-namespaced localStorage) rather than raw
// `localStorage` or an not-yet-existing IndexedDB store. Migrate this to the
// `idb` wrapper in Phase 5 alongside coins/shop levels.
import { pStorage } from "../profile";

const TOKENS_KEY = "game:tokens";
const BEST_TIME_KEY = "game:bestTimeS";

const BASE_RUN_DURATION_S = 60;
const RUN_DURATION_BONUS_PER_UNIT_S = 30;

function readIntKey(key: string): number {
  const raw = pStorage.getItem(key);
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function getTokenCount(): number {
  return readIntKey(TOKENS_KEY);
}

function setTokenCount(n: number): void {
  pStorage.setItem(TOKENS_KEY, String(Math.max(0, n)));
  document.dispatchEvent(new CustomEvent("game:tokens-changed"));
}

/** Called whenever ProgressToggle marks a unit done (first time or a
 * spaced-repetition re-mark) — see the file header for why it's per-unit. */
export function addToken(): void {
  setTokenCount(getTokenCount() + 1);
}

/** Consumes one token if available. Returns false (no-op) at 0 tokens. */
export function consumeToken(): boolean {
  const current = getTokenCount();
  if (current < 1) return false;
  setTokenCount(current - 1);
  return true;
}

/** `base + 30s * (units currently marked done)`, per GAME-DESIGN.md's "Run
 * duration" section — recomputed live from the current progress state. */
export function computeRunDurationS(): number {
  let doneUnits = 0;
  for (const key of pStorage.keys()) {
    if (!key.startsWith("progress:")) continue;
    try {
      const parsed = JSON.parse(pStorage.getItem(key) ?? "");
      if (parsed && parsed.done) doneUnits++;
    } catch {
      // malformed entry — ignore rather than crash the lobby
    }
  }
  return BASE_RUN_DURATION_S + RUN_DURATION_BONUS_PER_UNIT_S * doneUnits;
}

export function getBestTimeS(): number {
  const raw = pStorage.getItem(BEST_TIME_KEY);
  const n = raw ? parseFloat(raw) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Persists a run's survived time as the new best if it beats the previous
 * one. Returns true when this run set a new record. */
export function recordRunResult(survivedS: number): boolean {
  const best = getBestTimeS();
  if (survivedS > best) {
    pStorage.setItem(BEST_TIME_KEY, String(survivedS));
    return true;
  }
  return false;
}
