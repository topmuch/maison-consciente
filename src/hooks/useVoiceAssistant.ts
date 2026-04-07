'use client';

/* ═══════════════════════════════════════════════════════
   USE VOICE ASSISTANT — Unified Hook

   Combines TTS Engine + Voice Commands + Settings
   persistence + automatic cleanup.

   Returns everything needed for voice interaction:
     { isSupported, isEnabled, isListening, isSpeaking,
       volume, rate, transcript, lastCommand,
       toggleMute, setVolume, setRate, startListening,
       stopListening, speak, speakNow, stop, clearQueue }

   Usage:
     const voice = useVoiceAssistant({
       onCommand: (cmd) => { ... },
     });
   ═══════════════════════════════════════════════════════ */

import { useState, useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { getTTSEngine, type TTSSpeakOptions } from '@/lib/tts-engine';
import {
  VoiceCommandEngine,
  type VoiceCommandResult,
  type VoiceEngineState,
  VOICE_COMMANDS_HELP,
} from '@/lib/voice-commands';

export type { VoiceCommandResult, VoiceEngineState };

/* ─── Types ─── */

export interface UseVoiceAssistantConfig {
  /** Called when a voice command is matched */
  onCommand?: (result: VoiceCommandResult) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Called when transcript changes */
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  /** Auto-initialize TTS on mount */
  autoInit?: boolean;
}

export interface UseVoiceAssistantReturn {
  // Support
  ttsSupported: boolean;
  sttSupported: boolean;
  isFullySupported: boolean;

  // TTS State
  isSpeaking: boolean;
  isMuted: boolean;
  isEnabled: boolean;
  volume: number;
  rate: number;

  // STT State
  isListening: boolean;
  engineState: VoiceEngineState;
  transcript: string;
  lastCommand: VoiceCommandResult | null;

  // TTS Actions
  speak: (text: string, options?: TTSSpeakOptions) => string;
  speakNow: (text: string, options?: TTSSpeakOptions) => string;
  stop: () => void;
  clearQueue: () => void;

  // STT Actions
  startListening: () => boolean;
  stopListening: () => void;
  toggleListening: () => boolean;

  // Settings
  setVolume: (v: number) => void;
  setRate: (r: number) => void;
  toggleMute: () => boolean;
  toggleEnabled: () => boolean;

  // Help
  commandsHelp: string[];
}

/* ─── Helpers ─── */

function getInitialMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('mc_voice_muted') === 'true';
  } catch {
    return false;
  }
}

function getInitialVolume(): number {
  if (typeof window === 'undefined') return 0.8;
  try {
    const raw = localStorage.getItem('mc_voice_volume');
    if (raw === null) return 0.8;
    const parsed = parseFloat(raw);
    return Number.isNaN(parsed) ? 0.8 : parsed;
  } catch {
    return 0.8;
  }
}

function getInitialRate(): number {
  if (typeof window === 'undefined') return 0.9;
  try {
    const raw = localStorage.getItem('mc_voice_rate');
    if (raw === null) return 0.9;
    const parsed = parseFloat(raw);
    return Number.isNaN(parsed) ? 0.9 : parsed;
  } catch {
    return 0.9;
  }
}

function checkTtsSupportSync(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function checkSttSupportSync(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/* ─── External store subscribe for TTS speaking state ─── */
let ttsSubscribeListeners: Array<() => void> = [];

function subscribeToTTSSpeaking(callback: () => void): () => void {
  ttsSubscribeListeners.push(callback);
  return () => {
    ttsSubscribeListeners = ttsSubscribeListeners.filter(l => l !== callback);
  };
}

function getTTSSpeakingSnapshot(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking;
}

/* ─── Hook ─── */

export function useVoiceAssistant(config: UseVoiceAssistantConfig = {}): UseVoiceAssistantReturn {
  const {
    onCommand,
    onError,
    onTranscript,
    autoInit = true,
  } = config;

  /* ─── Refs ─── */

  const ttsRef = useRef<ReturnType<typeof getTTSEngine> | null>(null);
  const sttRef = useRef<VoiceCommandEngine | null>(null);
  const onCommandRef = useRef(onCommand);
  const onErrorRef = useRef(onError);
  const onTranscriptRef = useRef(onTranscript);

  // Keep callback refs fresh
  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  /* ─── State (initialized from localStorage, not from effects) ─── */

  const [isMuted, setIsMuted] = useState(getInitialMuted);
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolumeState] = useState(getInitialVolume);
  const [rate, setRateState] = useState(getInitialRate);
  const [isListening, setIsListening] = useState(false);
  const [engineState, setEngineState] = useState<VoiceEngineState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null);

  // Use useSyncExternalStore for TTS speaking state (avoids setState in effect)
  const isSpeaking = useSyncExternalStore(
    subscribeToTTSSpeaking,
    getTTSSpeakingSnapshot,
    () => false, // server snapshot
  );

  // Use lazy initializers for support detection (no setState in effects)
  const [ttsSupported] = useState(checkTtsSupportSync);
  const [sttSupported] = useState(checkSttSupportSync);

  /* ─── Initialize TTS Engine ─── */

  useEffect(() => {
    if (!ttsSupported) return;

    const engine = getTTSEngine();
    ttsRef.current = engine;

    if (autoInit) {
      engine.init();
    }

    // Poll to trigger speaking state re-subscription
    const pollInterval = setInterval(() => {
      ttsSubscribeListeners.forEach(l => l());
    }, 500);

    return () => {
      clearInterval(pollInterval);
    };
  }, [ttsSupported, autoInit]);

  /* ─── Initialize STT Engine ─── */

  useEffect(() => {
    if (!sttSupported) return;

    const stt = new VoiceCommandEngine({
      lang: 'fr-FR',
      continuous: false,
      interimResults: false,
      silenceTimeoutMs: 5000,
      onCommand: (result) => {
        setLastCommand(result);

        // Handle system:stop command automatically
        if (result.action === 'system:stop') {
          ttsRef.current?.stop();
          stt.stopListening();
        }

        onCommandRef.current?.(result);
      },
      onError: (error) => {
        onErrorRef.current?.(error);
      },
      onTranscript: (text, isFinal) => {
        setTranscript(text);
        onTranscriptRef.current?.(text, isFinal);
        if (isFinal) {
          // Clear transcript after 3 seconds
          setTimeout(() => setTranscript(''), 3000);
        }
      },
      onStateChange: (state) => {
        setEngineState(state);
        setIsListening(state === 'listening');
      },
    });
    sttRef.current = stt;

    return () => {
      stt.destroy();
    };
  }, [sttSupported]);

  /* ─── Cleanup ─── */

  useEffect(() => {
    return () => {
      sttRef.current?.destroy();
      ttsRef.current?.destroy();
    };
  }, []);

  /* ─── Offline Detection ─── */

  useEffect(() => {
    const handleOffline = () => {
      // Disable STT when offline (Chrome requires network for STT)
      sttRef.current?.stopListening();
      setIsListening(false);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOffline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOffline);
    };
  }, []);

  /* ─── TTS Actions ─── */

  const speak = useCallback((text: string, options?: TTSSpeakOptions): string => {
    return ttsRef.current?.speak(text, options) || '';
  }, []);

  const speakNow = useCallback((text: string, options?: TTSSpeakOptions): string => {
    return ttsRef.current?.speakNow(text, options) || '';
  }, []);

  const stop = useCallback(() => {
    ttsRef.current?.stop();
    sttRef.current?.stopListening();
  }, []);

  const clearQueue = useCallback(() => {
    ttsRef.current?.clearQueue();
  }, []);

  /* ─── STT Actions ─── */

  const startListening = useCallback((): boolean => {
    return sttRef.current?.startListening() || false;
  }, []);

  const stopListening = useCallback(() => {
    sttRef.current?.stopListening();
  }, []);

  const toggleListening = useCallback((): boolean => {
    return sttRef.current?.toggleListening() || false;
  }, []);

  /* ─── Settings Actions ─── */

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    if (ttsRef.current) ttsRef.current.volume = clamped;
    setVolumeState(clamped);
  }, []);

  const setRate = useCallback((r: number) => {
    const clamped = Math.max(0.1, Math.min(2, r));
    if (ttsRef.current) ttsRef.current.rate = clamped;
    setRateState(clamped);
  }, []);

  const toggleMute = useCallback((): boolean => {
    if (ttsRef.current) {
      ttsRef.current.toggleMute();
      return ttsRef.current.muted;
    }
    return !isMuted;
  }, [isMuted]);

  const toggleEnabled = useCallback((): boolean => {
    if (ttsRef.current) {
      ttsRef.current.toggleEnabled();
      return ttsRef.current.enabled;
    }
    return !isEnabled;
  }, [isEnabled]);

  /* ─── Return ─── */

  return {
    // Support
    ttsSupported,
    sttSupported,
    isFullySupported: ttsSupported && sttSupported,

    // TTS State
    isSpeaking,
    isMuted,
    isEnabled,
    volume,
    rate,

    // STT State
    isListening,
    engineState,
    transcript,
    lastCommand,

    // TTS Actions
    speak,
    speakNow,
    stop,
    clearQueue,

    // STT Actions
    startListening,
    stopListening,
    toggleListening,

    // Settings
    setVolume,
    setRate,
    toggleMute,
    toggleEnabled,

    // Help
    commandsHelp: VOICE_COMMANDS_HELP,
  };
}
