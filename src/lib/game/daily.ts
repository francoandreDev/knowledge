// The daily free run: every calendar day (local time) the player gets one run
// that costs no token, on top of the tokens earned by studying. It does not
// stack — a day that goes unused is simply gone — so it invites a short visit
// each day rather than building a backlog. Pure helpers here; the stored
// "last day used" lives in meta.ts.

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

/** True when the free run for `now`'s day has not been used yet. */
export function isDailyAvailable(
  lastUsedDay: string | null,
  now: Date = new Date(),
): boolean {
  return lastUsedDay !== dayKey(now);
}

/** Milliseconds until the next local midnight, when the free run renews. */
export function msUntilReset(now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

/** "5h 12m" / "42m" — how long until the free run renews. */
export function formatCountdown(ms: number): string {
  const totalMin = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
