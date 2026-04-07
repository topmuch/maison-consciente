// ═══════════════════════════════════════════════════════
// Ambient Sound System — Maison Consciente
// Uses Web Audio API to generate subtle sounds (no files needed)
// Must be activated only after user interaction (browser policy)
// ═══════════════════════════════════════════════════════

export type SoundType = 'chime' | 'breath' | 'success' | 'carillon' | 'souffle';

const DEFAULT_VOLUME = 0.7;
const VOLUME_STORAGE_KEY = 'mc-sound-volume';
const ENABLED_STORAGE_KEY = 'mc-ambient-sounds';

let audioContext: AudioContext | null = null;
let masterVolume: number = DEFAULT_VOLUME;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

// ─── Master Volume Control ───────────────────────────

/** Get the current master volume (0.0 to 1.0), reading from localStorage */
export function getMasterVolume(): number {
  if (typeof window === 'undefined') return DEFAULT_VOLUME;
  try {
    const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        masterVolume = parsed;
        return masterVolume;
      }
    }
  } catch {
    // localStorage unavailable
  }
  masterVolume = DEFAULT_VOLUME;
  return masterVolume;
}

/** Set the master volume (0.0 to 1.0) and persist to localStorage */
export function setMasterVolume(volume: number): void {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(0, Math.min(1, volume));
  masterVolume = clamped;
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
  } catch {
    // localStorage unavailable
  }
}

/** Create a master gain node with volume applied */
function createMasterGain(ctx: AudioContext, baseGain: number): GainNode {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  const effectiveGain = baseGain * masterVolume;
  gain.gain.setValueAtTime(effectiveGain, ctx.currentTime);
  return gain;
}

// ─── Sound: Chime ────────────────────────────────────

/** Subtle chime — gentle bell tone with harmonics */
function playChime(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const masterGain = createMasterGain(ctx, 0.12);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  // Fundamental tone — C6
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1047, now);
  osc1.frequency.exponentialRampToValueAtTime(1047 * 0.98, now + 1.2);
  gain1.gain.setValueAtTime(0.6, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  osc1.connect(gain1);
  gain1.connect(masterGain);
  osc1.start(now);
  osc1.stop(now + 1.2);

  // First harmonic — G6 (softer)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1568, now);
  gain2.gain.setValueAtTime(0.25, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  osc2.connect(gain2);
  gain2.connect(masterGain);
  osc2.start(now);
  osc2.stop(now + 1.0);

  // Soft shimmer — E7
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(2637, now + 0.05);
  gain3.gain.setValueAtTime(0.1, now + 0.05);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc3.connect(gain3);
  gain3.connect(masterGain);
  osc3.start(now + 0.05);
  osc3.stop(now + 0.8);
}

// ─── Sound: Breath ───────────────────────────────────

/** Soft breath — warm, atmospheric tone */
function playBreath(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const masterGain = createMasterGain(ctx, 0.06);
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(masterGain.gain.value + 0.06, now + 0.3);
  masterGain.gain.linearRampToValueAtTime(0.04 * masterVolume, now + 0.8);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

  // Warm pad using multiple detuned oscillators
  const frequencies = [220, 277.18, 329.63];
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq + (i - 1) * 2, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 1.5);
  });
}

// ─── Sound: Carillon (NEW) ───────────────────────────

/** Carillon — gentle bell tower / wind chime effect */
function playCarillon(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const masterGain = createMasterGain(ctx, 0.08);
  masterGain.gain.setValueAtTime(0.08 * masterVolume, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

  // Harmonic intervals: C5, E5, G5, C6, E6
  const notes = [
    { freq: 523.25, delay: 0 },      // C5
    { freq: 659.25, delay: 0.08 },   // E5
    { freq: 783.99, delay: 0.16 },   // G5
    { freq: 1047.00, delay: 0.24 },  // C6
    { freq: 1318.51, delay: 0.32 },  // E6
  ];

  notes.forEach(({ freq, delay }) => {
    const noteStart = now + delay;

    // Main tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteStart);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.985, noteStart + 1.4);
    gain.gain.setValueAtTime(0.5, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 1.2);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(noteStart);
    osc.stop(now + 1.5);

    // Subtle harmonic overtone (octave above, very soft)
    const oscH = ctx.createOscillator();
    const gainH = ctx.createGain();
    oscH.type = 'sine';
    oscH.frequency.setValueAtTime(freq * 2, noteStart + 0.02);
    oscH.frequency.exponentialRampToValueAtTime(freq * 2 * 0.98, noteStart + 0.9);
    gainH.gain.setValueAtTime(0.08, noteStart + 0.02);
    gainH.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.7);
    oscH.connect(gainH);
    gainH.connect(masterGain);
    oscH.start(noteStart + 0.02);
    oscH.stop(now + 1.0);
  });
}

// ─── Sound: Souffle (NEW) ────────────────────────────

/** Souffle — gentle whooshing / whisper sound using filtered noise */
function playSouffle(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const duration = 1.5;
  const sampleRate = ctx.sampleRate;
  const bufferSize = Math.floor(sampleRate * duration);

  // Create noise buffer
  const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const channelData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    channelData[i] = Math.random() * 2 - 1;
  }

  // Noise source
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  // Bandpass filter — center ~400Hz, Q ~0.5
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(400, now);
  bandpass.Q.setValueAtTime(0.5, now);

  // Master gain with envelope
  const masterGain = createMasterGain(ctx, 0.04);
  const fadeIn = 0.1;
  const sustainEnd = 0.9;
  const fadeOut = 0.6;

  masterGain.gain.setValueAtTime(0.001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.04 * masterVolume, now + fadeIn);
  masterGain.gain.setValueAtTime(0.04 * masterVolume, now + sustainEnd);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + sustainEnd + fadeOut);

  // Additional lowpass for extra softness
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(1200, now);

  noiseSource.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(masterGain);
  masterGain.connect(ctx.destination);

  noiseSource.start(now);
  noiseSource.stop(now + duration);
}

// ─── Sound: Success (ENHANCED) ───────────────────────

/** Success — bright ascending arpeggio with reverb tail and sustaining chord */
function playSuccess(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const masterGain = createMasterGain(ctx, 0.1);
  masterGain.gain.setValueAtTime(0.1 * masterVolume, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

  // Ascending arpeggio — slower (0.12s between notes)
  const notes = [523.25, 659.25, 783.99, 1047]; // C5, E5, G5, C6
  const noteDelay = 0.12;

  // Delay nodes for reverb-like tail
  const delay1 = ctx.createDelay(1.0);
  delay1.delayTime.setValueAtTime(0.15, now);
  const delayGain1 = ctx.createGain();
  delayGain1.gain.setValueAtTime(0.2, now);
  delayGain1.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

  const delay2 = ctx.createDelay(2.0);
  delay2.delayTime.setValueAtTime(0.3, now);
  const delayGain2 = ctx.createGain();
  delayGain2.gain.setValueAtTime(0.1, now);
  delayGain2.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

  // Connect delay chain
  delay1.connect(delayGain1);
  delayGain1.connect(ctx.destination);
  delay1.connect(delay2);
  delay2.connect(delayGain2);
  delayGain2.connect(ctx.destination);

  notes.forEach((freq, i) => {
    const noteStart = now + i * noteDelay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteStart);
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.5, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.6);
    osc.connect(gain);
    gain.connect(masterGain);
    // Feed into delay chain for reverb tail
    gain.connect(delay1);
    osc.start(noteStart);
    osc.stop(noteStart + 0.7);
  });

  // Final sustaining chord — C5 + G5 together (starts after arpeggio)
  const chordStart = now + notes.length * noteDelay + 0.05;
  const chordNotes = [523.25, 783.99]; // C5 + G5

  chordNotes.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, chordStart);
    gain.gain.setValueAtTime(0, chordStart);
    gain.gain.linearRampToValueAtTime(0.3, chordStart + 0.08);
    gain.gain.setValueAtTime(0.25, chordStart + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, chordStart + 1.5);
    osc.connect(gain);
    gain.connect(masterGain);
    // Feed into delay chain
    gain.connect(delay1);
    osc.start(chordStart);
    osc.stop(chordStart + 1.6);
  });
}

// ─── Sound Dispatch ──────────────────────────────────

/** Main play function — checks if ambient sounds are enabled */
export function playAmbientSound(type: SoundType): void {
  if (typeof window === 'undefined') return;

  // Check if ambient sounds are enabled in localStorage
  const enabled = localStorage.getItem(ENABLED_STORAGE_KEY) === 'true';
  if (!enabled) return;

  // Ensure master volume is loaded
  getMasterVolume();

  const ctx = getAudioContext();
  if (!ctx) return;

  switch (type) {
    case 'chime':
      playChime(ctx);
      break;
    case 'breath':
      playBreath(ctx);
      break;
    case 'success':
      playSuccess(ctx);
      break;
    case 'carillon':
      playCarillon(ctx);
      break;
    case 'souffle':
      playSouffle(ctx);
      break;
  }
}

// ─── Random Chime Selection ──────────────────────────

/** Play a random chime sound — for QR scan events to add variety */
export function playRandomChime(): void {
  const choices: SoundType[] = ['chime', 'carillon', 'breath'];
  const randomIndex = Math.floor(Math.random() * choices.length);
  playAmbientSound(choices[randomIndex]);
}

// ─── Audio Initialization ────────────────────────────

/** Initialize audio context on first user interaction (required by browsers) */
export function initAudioOnInteraction(): void {
  if (typeof window === 'undefined') return;

  // Load master volume from storage on init
  getMasterVolume();

  const handler = () => {
    getAudioContext();
    window.removeEventListener('click', handler);
    window.removeEventListener('touchstart', handler);
    window.removeEventListener('keydown', handler);
  };

  window.addEventListener('click', handler, { once: true });
  window.addEventListener('touchstart', handler, { once: true });
  window.addEventListener('keydown', handler, { once: true });
}

/** Check if ambient sounds are currently enabled */
export function isAmbientSoundsEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(ENABLED_STORAGE_KEY) === 'true';
}

/** Set ambient sounds preference */
export function setAmbientSoundsEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');

  // Initialize audio context when user enables sounds
  if (enabled) {
    getAudioContext();
  }
}
