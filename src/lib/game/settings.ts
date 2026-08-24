// Phase 8 — reduce-motion setting (see docs/GAME-DESIGN.md's "Open items
// deferred to implementation time": "whether a settings toggle (mute audio,
// reduce motion) is worth adding"). Mute already shipped in audio.ts
// (Phase 6); this is the reduce-motion half, persisted the same way —
// profile-namespaced pStorage, not raw localStorage.
import { pStorage } from "../profile";

const REDUCE_MOTION_KEY = "game:reduce-motion";

export function isReducedMotion(): boolean {
  return pStorage.getItem(REDUCE_MOTION_KEY) === "1";
}

export function setReducedMotion(enabled: boolean): void {
  pStorage.setItem(REDUCE_MOTION_KEY, enabled ? "1" : "0");
}

export function toggleReducedMotion(): boolean {
  const next = !isReducedMotion();
  setReducedMotion(next);
  return next;
}
