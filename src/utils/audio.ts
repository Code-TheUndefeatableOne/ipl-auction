/**
 * Web Audio API synthesizer for auctioneer gavel, bid chimes, and announcements.
 * Completely self-contained with no external audio file dependencies.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setAudioEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isAudioEnabled(): boolean {
  return soundEnabled;
}

/**
 * Auctioneer wooden gavel hammer sound
 */
export function playGavelStrike() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Strike 1: Impact thump
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(140, now);
  osc1.frequency.exponentialRampToValueAtTime(35, now + 0.12);
  gain1.gain.setValueAtTime(0.8, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  // Wood block crack noise
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.6, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  osc1.start(now);
  noise.start(now);
  osc1.stop(now + 0.15);
  noise.stop(now + 0.06);

  // Secondary resonance knock at +0.07s
  setTimeout(() => {
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, t);
    osc2.frequency.exponentialRampToValueAtTime(55, t + 0.18);
    g2.gain.setValueAtTime(0.4, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc2.connect(g2);
    g2.connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.22);
  }, 70);
}

/**
 * Bid raise bell ding
 */
export function playBidChime() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(659.25, now); // E5
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.36);
}

/**
 * Sold celebration fanfare
 */
export function playSoldFanfare() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  playGavelStrike();

  const notes = [440, 554.37, 659.25, 880]; // A major
  const now = ctx.currentTime + 0.15;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + idx * 0.08;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.5);
  });
}

/**
 * Unsold buzzer tone
 */
export function playUnsoldBuzzer() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.linearRampToValueAtTime(130, now + 0.3);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.36);
}
