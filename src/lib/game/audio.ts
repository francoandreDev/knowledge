// Phase 6 — synthesized SFX (see docs/GAME-DESIGN.md "Audio"). Everything is
// generated procedurally with the Web Audio API (oscillators + gain
// envelopes) — no audio files, no external assets. Mute state is persisted
// in the same profile-namespaced `pStorage` the rest of the game uses.
import { pStorage } from "../profile";

const MUTED_KEY = "game:audio-muted";
const HIT_THROTTLE_MS = 30; // caps rapid-fire stacking (e.g. Nova Pulse bursts)

let ctx: AudioContext | null = null;
let lastHitPlayedAt = -Infinity;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** Must be called from within a user-gesture handler (e.g. the Start button
 * click) — browsers block audio contexts from starting otherwise. */
export function unlockAudio(): void {
  const c = getContext();
  if (c && c.state === "suspended") {
    void c.resume();
  }
}

export function isMuted(): boolean {
  return pStorage.getItem(MUTED_KEY) === "1";
}

export function setMuted(muted: boolean): void {
  pStorage.setItem(MUTED_KEY, muted ? "1" : "0");
}

export function toggleMuted(): boolean {
  const next = !isMuted();
  setMuted(next);
  return next;
}

interface Tone {
  freq: number;
  type: OscillatorType;
  startAt: number;
  duration: number;
  peakGain: number;
}

function scheduleTone(t: Tone, c: AudioContext) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = t.type;
  osc.frequency.setValueAtTime(t.freq, t.startAt);
  gain.gain.setValueAtTime(0, t.startAt);
  gain.gain.linearRampToValueAtTime(t.peakGain, t.startAt + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t.startAt + t.duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t.startAt);
  osc.stop(t.startAt + t.duration + 0.02);
}

function play(tones: Omit<Tone, "startAt">[], startOffsets: number[]) {
  if (isMuted()) return;
  const c = getContext();
  if (!c || c.state === "suspended") return;
  const now = c.currentTime;
  tones.forEach((tone, i) => {
    scheduleTone({ ...tone, startAt: now + (startOffsets[i] ?? 0) }, c);
  });
}

/** Gem or coin pickup — short high blip. */
export function playPickup(): void {
  play([{ freq: 1040, type: "sine", duration: 0.09, peakGain: 0.12 }], [0]);
}

/** Enemy takes damage — short low thud, throttled against rapid multi-hit
 * bursts (Nova Pulse, overlapping Orbit Shield) so it doesn't stack into
 * a wall of noise. */
export function playHit(): void {
  const c = getContext();
  const now = c?.currentTime ?? 0;
  if (now - lastHitPlayedAt < HIT_THROTTLE_MS / 1000) return;
  lastHitPlayedAt = now;
  play([{ freq: 160, type: "square", duration: 0.06, peakGain: 0.08 }], [0]);
}

/** Player levels up — short ascending two-note arpeggio. */
export function playLevelUp(): void {
  play(
    [
      { freq: 523.25, type: "triangle", duration: 0.12, peakGain: 0.14 },
      { freq: 783.99, type: "triangle", duration: 0.16, peakGain: 0.14 },
    ],
    [0, 0.09],
  );
}

/** Weapon evolves to its Lv6 form — longer, more elaborate ascending run
 * than a normal level-up, per GAME-DESIGN.md's "Audio" section. */
export function playEvolution(): void {
  play(
    [
      { freq: 392.0, type: "triangle", duration: 0.14, peakGain: 0.14 },
      { freq: 523.25, type: "triangle", duration: 0.14, peakGain: 0.14 },
      { freq: 659.25, type: "triangle", duration: 0.14, peakGain: 0.14 },
      { freq: 1046.5, type: "sine", duration: 0.35, peakGain: 0.16 },
    ],
    [0, 0.1, 0.2, 0.32],
  );
}

/** Player dies — descending low tone. */
export function playDeath(): void {
  play(
    [
      { freq: 220, type: "sawtooth", duration: 0.5, peakGain: 0.15 },
      { freq: 110, type: "sawtooth", duration: 0.45, peakGain: 0.12 },
    ],
    [0, 0.12],
  );
}
