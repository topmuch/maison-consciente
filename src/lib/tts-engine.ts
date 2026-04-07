/* ═══════════════════════════════════════════════════════
   TTS ENGINE — Local Text-to-Speech Queue

   FIFO queue wrapper around Web Speech API (SpeechSynthesis).
   Supports French voice auto-detection, priority queueing,
   volume/rate/pitch control, and graceful fallback.

   100% LOCAL — no external API calls.

   Usage:
     import { ttsEngine } from '@/lib/tts-engine';
     ttsEngine.speak("Bienvenue dans votre maison");
     ttsEngine.addToQueue("Deuxième message", true); // priority
   ═══════════════════════════════════════════════════════ */

/* ─── Types ─── */

interface TTSQueueItem {
  id: string;
  text: string;
  priority: boolean;
  options: TTSSpeakOptions;
}

interface TTSSettings {
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface TTSSpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

/* ─── Constants ─── */

const DEFAULT_SETTINGS: TTSSettings = {
  lang: 'fr-FR',
  rate: 0.9,
  pitch: 1.0,
  volume: 0.8,
};

const LS_ENABLED_KEY = 'mc_voice_enabled';
const LS_MUTED_KEY = 'mc_voice_muted';
const LS_VOLUME_KEY = 'mc_voice_volume';
const LS_RATE_KEY = 'mc_voice_rate';

const PROCESSING_DELAY_MS = 150; // small delay between queue items to avoid browser throttling

/* ─── Helpers ─── */

let itemIdCounter = 0;
function generateItemId(): string {
  itemIdCounter += 1;
  return `tts-${Date.now()}-${itemIdCounter}`;
}

/** Check if TTS is supported in this browser */
function checkTTSSupport(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Try to find a French voice from available voices */
function findFrenchVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // Prefer exact fr-FR match
  const frFR = voices.find(v => v.lang === 'fr-FR');
  if (frFR) return frFR;

  // Then any fr-*
  const frAny = voices.find(v => v.lang.startsWith('fr'));
  if (frAny) return frAny;

  // Fallback: nothing
  return null;
}

/** Safely load persisted boolean from localStorage */
function loadBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

/** Safely load persisted number from localStorage */
function loadNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = parseFloat(raw);
    return Number.isNaN(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
}

/** Safely persist a value to localStorage */
function persistValue(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently fail — quota or private browsing
  }
}

/* ═══════════════════════════════════════════════════════
   TTSEngine Class
   ═══════════════════════════════════════════════════════ */

class TTSEngine {
  private queue: TTSQueueItem[] = [];
  private isProcessing = false;
  private _currentUtterance: SpeechSynthesisUtterance | null = null;
  private _cachedVoices: SpeechSynthesisVoice[] = [];
  private _voicesLoaded = false;
  private _destroyed = false;
  private voicesChangedHandler: (() => void) | null = null;

  /* ─── Public Settings (reactive) ─── */

  private _enabled: boolean;
  private _muted: boolean;
  private _volume: number;
  private _rate: number;

  constructor() {
    // Load persisted preferences
    this._enabled = loadBoolean(LS_ENABLED_KEY, true);
    this._muted = loadBoolean(LS_MUTED_KEY, false);
    this._volume = loadNumber(LS_VOLUME_KEY, DEFAULT_SETTINGS.volume);
    this._rate = loadNumber(LS_RATE_KEY, DEFAULT_SETTINGS.rate);
  }

  /* ─── Getters / Setters ─── */

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(val: boolean) {
    this._enabled = val;
    persistValue(LS_ENABLED_KEY, String(val));
    if (!val) {
      this.stop();
    }
  }

  get muted(): boolean {
    return this._muted;
  }

  set muted(val: boolean) {
    this._muted = val;
    persistValue(LS_MUTED_KEY, String(val));
    if (val) {
      this.stop();
    }
  }

  get volume(): number {
    return this._volume;
  }

  set volume(val: number) {
    const clamped = Math.max(0, Math.min(1, val));
    this._volume = clamped;
    persistValue(LS_VOLUME_KEY, String(clamped));
  }

  get rate(): number {
    return this._rate;
  }

  set rate(val: number) {
    const clamped = Math.max(0.1, Math.min(2, val));
    this._rate = clamped;
    persistValue(LS_RATE_KEY, String(clamped));
  }

  /* ─── Support Check ─── */

  get isSupported(): boolean {
    return checkTTSSupport();
  }

  get isSpeaking(): boolean {
    return this.isSupported && window.speechSynthesis.speaking;
  }

  get isPaused(): boolean {
    return this.isSupported && window.speechSynthesis.paused;
  }

  /* ─── Voice Loading ─── */

  private loadVoices(): SpeechSynthesisVoice[] {
    if (this._voicesLoaded && this._cachedVoices.length > 0) {
      return this._cachedVoices;
    }

    if (!this.isSupported) return [];

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      this._cachedVoices = voices;
      this._voicesLoaded = true;
    }
    return voices;
  }

  private initVoiceLoading(): void {
    if (!this.isSupported) return;

    // Voices may load asynchronously
    this.voicesChangedHandler = () => {
      this._cachedVoices = window.speechSynthesis.getVoices();
      this._voicesLoaded = true;
    };
    window.speechSynthesis.addEventListener('voiceschanged', this.voicesChangedHandler);

    // Try loading immediately
    this.loadVoices();
  }

  /* ─── Queue Management ─── */

  /** Add text to the queue. Priority items are prepended. */
  addToQueue(text: string, priority = false, options: TTSSpeakOptions = {}): string {
    if (!this.isSupported || !text.trim()) return '';

    const id = generateItemId();
    const item: TTSQueueItem = {
      id,
      text: text.trim(),
      priority,
      options,
    };

    if (priority) {
      // Insert after any existing priority items
      const lastPriorityIdx = this.queue.findLastIndex(q => q.priority);
      this.queue.splice(lastPriorityIdx + 1, 0, item);
    } else {
      this.queue.push(item);
    }

    // Start processing if idle
    if (!this.isProcessing) {
      this.processQueue();
    }

    return id;
  }

  /** Process the queue FIFO */
  private processQueue(): void {
    if (this._destroyed) return;

    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    // Check preconditions
    if (!this._enabled || this._muted || !this.isSupported) {
      this.queue = [];
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const item = this.queue.shift();
    if (!item) {
      this.isProcessing = false;
      return;
    }

    // Small delay between items to prevent browser throttling
    setTimeout(() => {
      this.speakItem(item);
    }, PROCESSING_DELAY_MS);
  }

  /** Speak a single queue item */
  private speakItem(item: TTSQueueItem): void {
    if (this._destroyed || !this.isSupported) {
      this.isProcessing = false;
      return;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(item.text);

    // Apply settings
    utterance.lang = item.options.lang || DEFAULT_SETTINGS.lang;
    utterance.rate = item.options.rate || this._rate;
    utterance.pitch = item.options.pitch || DEFAULT_SETTINGS.pitch;
    utterance.volume = item.options.volume ?? this._volume;

    // Try French voice
    const voices = this.loadVoices();
    const frenchVoice = findFrenchVoice(voices);
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    this._currentUtterance = utterance;

    utterance.onstart = () => {
      item.options.onStart?.();
    };

    utterance.onend = () => {
      this._currentUtterance = null;
      item.options.onEnd?.();
      // Process next item
      this.processQueue();
    };

    utterance.onerror = (event) => {
      this._currentUtterance = null;
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[TTS Engine] Error:', event.error);
        }
        item.options.onError?.(event.error);
      }
      // Continue processing even on error
      this.processQueue();
    };

    window.speechSynthesis.speak(utterance);
  }

  /* ─── Public Speak (convenience — adds to queue) ─── */

  /** Speak text immediately (non-priority, added to end of queue) */
  speak(text: string, options?: TTSSpeakOptions): string {
    return this.addToQueue(text, false, options);
  }

  /** Speak text with high priority (prepended) */
  speakNow(text: string, options?: TTSSpeakOptions): string {
    return this.addToQueue(text, true, options);
  }

  /* ─── Control ─── */

  /** Stop all speech and clear the queue */
  stop(): void {
    this.queue = [];
    if (this.isSupported) {
      window.speechSynthesis.cancel();
    }
    this._currentUtterance = null;
    this.isProcessing = false;
  }

  /** Pause current speech */
  pause(): void {
    if (this.isSupported && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  }

  /** Resume paused speech */
  resume(): void {
    if (this.isSupported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  /** Clear the queue without stopping current speech */
  clearQueue(): void {
    this.queue = [];
  }

  /** Toggle mute state */
  toggleMute(): boolean {
    this.muted = !this._muted;
    return this._muted;
  }

  /** Toggle enabled state */
  toggleEnabled(): boolean {
    this.enabled = !this._enabled;
    return this._enabled;
  }

  /* ─── Lifecycle ─── */

  /** Initialize voice loading. Call once on mount. */
  init(): void {
    this.initVoiceLoading();
  }

  /** Clean up. Call on unmount. */
  destroy(): void {
    this._destroyed = true;
    if (this.voicesChangedHandler && this.isSupported) {
      window.speechSynthesis.removeEventListener('voiceschanged', this.voicesChangedHandler);
      this.voicesChangedHandler = null;
    }
    this.stop();
  }

  /** Get queue length */
  get queueLength(): number {
    return this.queue.length;
  }
}

/* ─── Singleton Export ─── */

// Lazy singleton — initialized on first import in browser context
let _instance: TTSEngine | null = null;

export function getTTSEngine(): TTSEngine {
  if (!_instance) {
    _instance = new TTSEngine();
  }
  return _instance;
}

/** Convenience singleton for direct import */
export const ttsEngine: TTSEngine = typeof window !== 'undefined'
  ? getTTSEngine()
  : ({} as TTSEngine);

/* ─── React Hook ─── */

export interface UseTTSEngineReturn {
  speak: (text: string, options?: TTSSpeakOptions) => string;
  speakNow: (text: string, options?: TTSSpeakOptions) => string;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  clearQueue: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  isMuted: boolean;
  isEnabled: boolean;
  volume: number;
  rate: number;
  setVolume: (v: number) => void;
  setRate: (r: number) => void;
  toggleMute: () => void;
  toggleEnabled: () => void;
}

export function useTTSEngine(): UseTTSEngineReturn {
  // We use a function-based approach to avoid SSR issues
  const engine = getTTSEngine();

  return {
    speak: (text, opts) => engine.speak(text, opts),
    speakNow: (text, opts) => engine.speakNow(text, opts),
    stop: () => engine.stop(),
    pause: () => engine.pause(),
    resume: () => engine.resume(),
    clearQueue: () => engine.clearQueue(),
    get isSpeaking() { return engine.isSpeaking; },
    get isSupported() { return engine.isSupported; },
    get isMuted() { return engine.muted; },
    get isEnabled() { return engine.enabled; },
    get volume() { return engine.volume; },
    get rate() { return engine.rate; },
    setVolume: (v: number) => { engine.volume = v; },
    setRate: (r: number) => { engine.rate = r; },
    toggleMute: () => engine.toggleMute(),
    toggleEnabled: () => engine.toggleEnabled(),
  };
}
