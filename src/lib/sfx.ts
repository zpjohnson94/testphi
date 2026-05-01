// Tiny WebAudio sound effects — no asset loading needed.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { ctx = null; }
  }
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15, when = 0) {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + when);
  g.gain.setValueAtTime(0, c.currentTime + when);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + duration);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + when);
  o.stop(c.currentTime + when + duration + 0.02);
}

export const sfx = {
  correct() { tone(660, 0.1, "triangle", 0.18); tone(990, 0.18, "triangle", 0.16, 0.08); },
  wrong() { tone(220, 0.18, "sawtooth", 0.12); tone(160, 0.22, "sawtooth", 0.1, 0.08); },
  levelUp() {
    tone(523, 0.1, "triangle", 0.18);
    tone(659, 0.1, "triangle", 0.18, 0.1);
    tone(784, 0.18, "triangle", 0.18, 0.2);
    tone(1047, 0.3, "triangle", 0.2, 0.32);
  },
  tap() { tone(440, 0.05, "sine", 0.08); },
};
