// Client-side only (localStorage), no backend and no real auth — a "profile"
// is just a named bucket so more than one person can use the same browser
// without stepping on each other's progress. Imported directly by component
// <script> tags, never by server-rendered .astro frontmatter.

export interface Profile {
  id: string;
  name: string;
  createdAt: number;
  // Optional list of tags (the same vocabulary used by ROADMAP.md's `Tags`
  // column / roadmap.json's `tags[]`) this learner cares about — used to
  // personalize the homepage track grid and pre-select roadmap tag chips.
  // Never required: an empty/missing list must leave every page behaving
  // exactly as it does with no profile personalization at all.
  interests?: string[];
}

const PROFILES_KEY = "profiles";
const ACTIVE_PROFILE_KEY = "activeProfileId";

function readProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProfiles(profiles: Profile[]): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function dataPrefix(profileId: string): string {
  return `p:${profileId}:`;
}

function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function getProfiles(): Profile[] {
  return readProfiles().sort((a, b) => a.createdAt - b.createdAt);
}

export function getActiveProfile(): Profile | null {
  const id = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (!id) return null;
  return readProfiles().find((p) => p.id === id) ?? null;
}

export function createProfile(name: string): Profile {
  const profile: Profile = {
    id: generateId(),
    name: name.trim(),
    createdAt: Date.now(),
  };
  writeProfiles([...readProfiles(), profile]);
  localStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
  return profile;
}

export function switchProfile(id: string): void {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

export function updateProfileInterests(id: string, interests: string[]): void {
  const profiles = readProfiles();
  const profile = profiles.find((p) => p.id === id);
  if (!profile) return;
  profile.interests = interests;
  writeProfiles(profiles);
}

/** Removes the profile and every piece of data namespaced under it. */
export function deleteProfile(id: string): void {
  writeProfiles(readProfiles().filter((p) => p.id !== id));

  const prefix = dataPrefix(id);
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(prefix)) localStorage.removeItem(key);
  }

  if (localStorage.getItem(ACTIVE_PROFILE_KEY) === id) {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
}

/**
 * Drop-in replacement for `localStorage` that every other module should use
 * for anything that's actually per-learner data (progress, exercise
 * results, whiteboard drawings) — transparently namespaces reads/writes
 * under the active profile so two profiles in the same browser never see
 * each other's data. Silently no-ops (reads as empty, writes are dropped)
 * when there's no active profile yet, since `ProfileGate` forces one to be
 * chosen — and reloads the page — before any real interaction happens.
 * Device-level preferences that aren't personal progress (theme, whiteboard
 * board-style) intentionally keep using raw `localStorage` instead.
 */
export const pStorage = {
  getItem(key: string): string | null {
    const id = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!id) return null;
    return localStorage.getItem(dataPrefix(id) + key);
  },
  setItem(key: string, value: string): void {
    const id = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!id) return;
    localStorage.setItem(dataPrefix(id) + key, value);
  },
  removeItem(key: string): void {
    const id = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!id) return;
    localStorage.removeItem(dataPrefix(id) + key);
  },
  /** Bare (un-namespaced) keys currently stored for the active profile. */
  keys(): string[] {
    const id = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!id) return [];
    const prefix = dataPrefix(id);
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length));
  },
};
