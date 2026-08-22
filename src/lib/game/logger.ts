// Namespaced console logging for the in-site game, gated behind a
// localStorage flag so verbose per-event logs (spawn/hit/pickup/etc.) can
// stay on during early phases without permanently cluttering the console
// once the game is polished — flip `game:debug` to "false" to go quiet.
const STORAGE_KEY = "game:debug";

function isEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  // Defaulted ON through Phase 1-3 while mechanics were still being
  // validated; flipped to default OFF in Phase 4 now that tokens gate real
  // play — still flippable via localStorage.setItem("game:debug", "true")
  // for future debugging sessions.
  return stored === null ? false : stored === "true";
}

export function setDebug(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

export function createLogger(namespace: string) {
  const prefix = `[game:${namespace}]`;
  return {
    log(...args: unknown[]) {
      if (isEnabled()) console.log(prefix, ...args);
    },
    warn(...args: unknown[]) {
      console.warn(prefix, ...args);
    },
    error(...args: unknown[]) {
      console.error(prefix, ...args);
    },
  };
}
