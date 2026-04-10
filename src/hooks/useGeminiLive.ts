'use client';

/* ═══════════════════════════════════════════════════════
   USE GEMINI LIVE — Google Gemini Live Voice Interaction

   Manages a real-time voice conversation via WebSocket:
     1. WebSocket connection to Gemini Voice proxy (port 3004)
     2. Microphone audio capture (PCM 16kHz, 16-bit, mono)
     3. Audio playback from Gemini responses (streaming PCM)
     4. State machine for voice interaction lifecycle
     5. Fallback to Web Speech API if Gemini is unavailable

   State machine:
     idle → connecting → connected → listening → processing → speaking → connected
     Any state → error (on error)
     Any state → idle (on disconnect)

   Usage:
     const voice = useGeminiLive({ voice: 'Charon' });
     voice.connect();
     voice.startListening();
   ═══════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useEffect } from 'react';

/* ─── Types ─── */

export type VoiceState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'processing'
  | 'error';

export interface GeminiLiveConfig {
  /** Voice name (default: "Charon") */
  voice?: string;
  /** System prompt for Maellis persona */
  systemPrompt?: string;
  /** Auto-connect on mount (default: false) */
  autoConnect?: boolean;
}

export interface UseGeminiLiveReturn {
  // State
  state: VoiceState;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  error: string | null;
  /** What the user said (STT) */
  transcript: string;
  /** What Maellis said (TTS text) */
  response: string;

  // Actions
  connect: () => void;
  disconnect: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  sendText: (text: string) => void;
  interrupt: () => void;

  // Fallback (Web Speech API)
  speak: (text: string) => void;
  stop: () => void;

  // Gemini availability
  isGeminiAvailable: boolean;
}

/* ─── Constants ─── */

const DEFAULT_VOICE = 'Charon';
const DEFAULT_SYSTEM_PROMPT =
  "Tu es Maellis, l'assistant intelligent de Maison Consciente. Tu es poli, chaleureux et professionnel. Tu parles toujours en français. Tu aides les utilisateurs avec leur maison intelligente, leurs recettes, leurs courses, la santé, et le bien-être familial. Tu es concis mais chaleureux dans tes réponses.";

const WS_PORT = 3004;
const MAX_RECONNECT_ATTEMPTS = 1;
const BASE_RECONNECT_DELAY_MS = 1000;
const AUDIO_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

/* ─── WebSocket URL helper ─── */

function buildWsUrl(): string {
  if (typeof window === 'undefined') return '';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/?XTransformPort=${WS_PORT}`;
}

/* ─── Audio utilities ─── */

/** Convert Float32 samples to Int16 PCM */
function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

/* ─── Streaming Audio Player ─── */

class StreamingAudioPlayer {
  private audioContext: AudioContext | null = null;
  private audioQueue: Int16Array[] = [];
  private nextPlayTime = 0;
  private playbackActive = false;
  private rafId: number | null = null;
  private onSpeakingChange: (speaking: boolean) => void;

  constructor(onSpeakingChange: (speaking: boolean) => void) {
    this.onSpeakingChange = onSpeakingChange;
  }

  /** Ensure AudioContext is created and resumed */
  private ensureContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE });
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /** Enqueue a chunk of Int16 PCM audio data */
  enqueue(pcmInt16: Int16Array) {
    this.audioQueue.push(pcmInt16);

    if (!this.playbackActive) {
      this.playbackActive = true;
      this.onSpeakingChange(true);
      this.scheduleProcessing();
    }
  }

  /** Reset playback state (on interrupt or disconnect) */
  reset() {
    this.audioQueue = [];
    this.nextPlayTime = 0;
    this.playbackActive = false;
    this.onSpeakingChange(false);

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Process queued audio chunks */
  private scheduleProcessing() {
    this.rafId = requestAnimationFrame(() => this.processQueue());
  }

  private processQueue() {
    this.rafId = null;

    if (this.audioQueue.length === 0) {
      // Check if there's still audio playing
      if (this.audioContext && this.audioContext.currentTime >= this.nextPlayTime) {
        this.playbackActive = false;
        this.onSpeakingChange(false);
      } else if (this.audioContext) {
        // Audio is still playing out, check again soon
        this.rafId = requestAnimationFrame(() => this.processQueue());
      } else {
        this.playbackActive = false;
        this.onSpeakingChange(false);
      }
      return;
    }

    this.playbackActive = true;
    const ctx = this.ensureContext();

    while (this.audioQueue.length > 0) {
      const chunk = this.audioQueue.shift()!;
      const float32 = new Float32Array(chunk.length);
      for (let i = 0; i < chunk.length; i++) {
        float32[i] = chunk[i] / 32768;
      }

      const buffer = ctx.createBuffer(1, float32.length, AUDIO_SAMPLE_RATE);
      buffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + buffer.duration;
    }

    // Schedule next check
    this.rafId = requestAnimationFrame(() => this.processQueue());
  }

  /** Close and clean up */
  destroy() {
    this.reset();
    if (this.audioContext) {
      this.audioContext.close().catch(() => { /* ignore */ });
      this.audioContext = null;
    }
  }
}

/* ─── Web Speech API fallback TTS ─── */

function speakFallback(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const frenchVoice =
    voices.find(
      (v) =>
        v.lang.includes('fr') &&
        (v.name.includes('Google') || v.name.includes('Microsoft')),
    ) ?? voices.find((v) => v.lang.includes('fr'));

  if (frenchVoice) utterance.voice = frenchVoice;
  window.speechSynthesis.speak(utterance);
}

function stopFallback(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/* ═══════════════════════════════════════════════════════
   HOOK
   ═══════════════════════════════════════════════════════ */

export function useGeminiLive(config?: GeminiLiveConfig): UseGeminiLiveReturn {
  const {
    voice = DEFAULT_VOICE,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    autoConnect = false,
  } = config ?? {};

  /* ─── State ─── */

  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeminiAvailable] = useState(true); // Assume available; error shows if not

  /* ─── Refs ─── */

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  // Use stateRef to avoid stale closures in handleMessage
  const stateRef = useRef<VoiceState>(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Audio capture refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Audio playback
  const playerRef = useRef<StreamingAudioPlayer | null>(null);

  // Config refs (avoid stale closures)
  const configRef = useRef({ voice, systemPrompt });
  useEffect(() => {
    configRef.current = { voice, systemPrompt };
  }, [voice, systemPrompt]);

  /* ─── Derived state ─── */

  const isConnected = state === 'connected' || state === 'listening' || state === 'processing' || state === 'speaking';
  const isListening = state === 'listening';

  /* ─── StreamingAudioPlayer init ─── */

  useEffect(() => {
    playerRef.current = new StreamingAudioPlayer((speaking) => {
      if (mountedRef.current) {
        setIsSpeaking(speaking);
        if (!speaking && (state === 'speaking')) {
          // Player finished speaking, return to connected
          setState('connected');
        }
      }
    });

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  /* ─── Forward refs for circular dependency resolution ─── */

  const connectRef = useRef<() => void>(() => {});
  const handleMessageRef = useRef<(event: MessageEvent) => void>(() => {});
  const stopAudioCaptureRef = useRef<() => void>(() => {});

  /* ─── WebSocket message handler ─── */

  const handleMessage = useCallback((event: MessageEvent) => {
    if (!mountedRef.current) return;

    const currentState = stateRef.current;

    // Binary data → audio playback
    if (event.data instanceof ArrayBuffer) {
      const int16 = new Int16Array(event.data);
      if (int16.length > 0) {
        playerRef.current?.enqueue(int16);

        if (currentState !== 'speaking' && currentState !== 'processing') {
          setState('speaking');
        }
      }
      return;
    }

    // JSON text messages
    try {
      const msg = JSON.parse(event.data as string);

      switch (msg.type) {
        case 'setup_complete':
          setState('connected');
          setError(null);
          break;

        case 'transcript':
          setTranscript((prev) => {
            return msg.isFinal ? msg.text : msg.text;
          });
          break;

        case 'response':
          setResponse(msg.text);
          break;

        case 'turn_complete':
          // Keep response visible for a moment, then clear
          setState('connected');
          setTimeout(() => {
            if (mountedRef.current) {
              setTranscript('');
              setResponse('');
            }
          }, 3000);
          break;

        case 'audio_activity':
          setIsSpeaking(msg.speaking === true);
          if (msg.speaking === true && currentState !== 'speaking') {
            setState('speaking');
          }
          break;

        case 'error':
          setError(msg.message ?? 'Erreur Gemini');
          if (msg.fatal) {
            setState('error');
          }
          break;

        default:
          break;
      }
    } catch {
      // Not JSON — ignore
    }
  }, []);

  useEffect(() => { handleMessageRef.current = handleMessage; }, [handleMessage]);

  /* ─── Connection timeout guard ─── */
  useEffect(() => {
    if (state === 'connecting') {
      const timer = setTimeout(() => {
        if (mountedRef.current && stateRef.current === 'connecting') {
          setError('Délai de connexion dépassé. Réessayez.');
          setState('error');
        }
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  /* ─── Audio capture cleanup (defined early for ref) ─── */

  const stopAudioCapture = useCallback(() => {
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch { /* ignore */ }
      scriptProcessorRef.current = null;
    }

    if (mediaStreamSourceRef.current) {
      try {
        mediaStreamSourceRef.current.disconnect();
      } catch { /* ignore */ }
      mediaStreamSourceRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => { /* ignore */ });
      audioContextRef.current = null;
    }
  }, []);

  useEffect(() => { stopAudioCaptureRef.current = stopAudioCapture; }, [stopAudioCapture]);

  /* ─── WebSocket connection ─── */

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    setState('connecting');
    setError(null);

    const url = buildWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      if (!mountedRef.current) return;

      reconnectCountRef.current = 0;

      // Send setup message
      ws.send(JSON.stringify({
        type: 'setup',
        voice: configRef.current.voice,
        systemPrompt: configRef.current.systemPrompt,
      }));
    };

    ws.onmessage = (event: MessageEvent) => {
      handleMessageRef.current(event);
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setError('Erreur de connexion WebSocket');
    };

    ws.onclose = (event) => {
      if (!mountedRef.current) return;

      wsRef.current = null;

      // Stop audio capture if active
      stopAudioCaptureRef.current();

      // Reset player
      playerRef.current?.reset();
      setIsSpeaking(false);

      if (event.code !== 1000) {
        // Non-normal close — attempt reconnection with exponential backoff
        if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectCountRef.current);
          reconnectCountRef.current += 1;

          setState('connecting');
          setError(`Reconnexion ${reconnectCountRef.current}/${MAX_RECONNECT_ATTEMPTS}...`);

          reconnectTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connectRef.current();
            }
          }, delay);
        } else {
          setError('Service vocal indisponible. Vérifiez la clé API Gemini dans le panneau admin.');
          setState('error');
        }
      } else {
        setState('idle');
      }
    };
  }, []);

  useEffect(() => { connectRef.current = connect; }, [connect]);

  /* ─── Audio capture (microphone → PCM → WebSocket) ─── */

  const startListening = useCallback(async () => {
    // Must be connected to start listening
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Non connecté au service vocal.');
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Microphone non disponible dans ce navigateur.');
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: AUDIO_SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;

      // Create AudioContext at 16kHz
      const audioContext = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE });
      audioContextRef.current = audioContext;

      // Create source from mic stream
      const source = audioContext.createMediaStreamSource(stream);
      mediaStreamSourceRef.current = source;

      // ScriptProcessorNode for raw PCM capture (deprecated but widely supported)
      const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmInt16 = float32ToInt16(inputData);

        // Send binary PCM frame via WebSocket
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(pcmInt16.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination); // Required for the processor to work

      setState('listening');
      setError(null);
      setTranscript('');
      setResponse('');
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'accéder au microphone.";
      setError(message);
      setState('error');
    }
  }, []);

  const stopListening = useCallback(() => {
    stopAudioCapture();

    if (mountedRef.current) {
      if (state === 'listening') {
        setState('processing');
      }
    }
  }, [stopAudioCapture, state]);

  /* ─── Send text message (text input mode) ─── */

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setError('Non connecté au service vocal.');
      return;
    }

    ws.send(JSON.stringify({
      type: 'text',
      text,
    }));

    setState('processing');
    setError(null);
  }, []);

  /* ─── Interrupt (stop current interaction) ─── */

  const interrupt = useCallback(() => {
    // Stop audio capture
    stopAudioCapture();

    // Reset audio player
    playerRef.current?.reset();
    setIsSpeaking(false);

    // Send interrupt signal to server
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'interrupt' }));
    }

    // Clear state
    setTranscript('');
    setResponse('');
    setState('connected');
  }, [stopAudioCapture]);

  /* ─── Disconnect ─── */

  const disconnect = useCallback(() => {
    // Clear reconnection timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Stop audio capture
    stopAudioCapture();

    // Reset audio player
    playerRef.current?.reset();
    setIsSpeaking(false);

    // Close WebSocket with normal close code (1000)
    const ws = wsRef.current;
    if (ws) {
      reconnectCountRef.current = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect
      ws.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    // Reset state
    setTranscript('');
    setResponse('');
    setError(null);
    setState('idle');
  }, [stopAudioCapture]);

  /* ─── Fallback speak (Web Speech API) ─── */

  const speak = useCallback((text: string) => {
    speakFallback(text);
  }, []);

  const stop = useCallback(() => {
    stopFallback();
    interrupt();
  }, [interrupt]);

  /* ─── Auto-connect ─── */

  useEffect(() => {
    if (autoConnect) {
      // Defer to next frame to avoid issues during hydration
      const frameId = requestAnimationFrame(() => {
        cancelAnimationFrame(frameId);
        if (mountedRef.current) {
          connectRef.current();
        }
      });
    }
  }, [autoConnect]);

  /* ─── Cleanup on unmount ─── */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      // Clear timers
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // Stop audio capture
      if (scriptProcessorRef.current) {
        try { scriptProcessorRef.current.disconnect(); } catch { /* ignore */ }
        scriptProcessorRef.current = null;
      }
      if (mediaStreamSourceRef.current) {
        try { mediaStreamSourceRef.current.disconnect(); } catch { /* ignore */ }
        mediaStreamSourceRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => { /* ignore */ });
        audioContextRef.current = null;
      }

      // Reset player
      playerRef.current?.destroy();
      playerRef.current = null;

      // Close WebSocket (prevent reconnect)
      if (wsRef.current) {
        reconnectCountRef.current = MAX_RECONNECT_ATTEMPTS;
        wsRef.current.close(1000, 'Unmount');
        wsRef.current = null;
      }

      // Cancel fallback TTS
      stopFallback();
    };
  }, []);

  /* ─── Return ─── */

  return {
    // State
    state,
    isConnected,
    isListening,
    isSpeaking,
    error,
    transcript,
    response,

    // Actions
    connect,
    disconnect,
    startListening,
    stopListening,
    sendText,
    interrupt,

    // Fallback
    speak,
    stop,

    // Availability
    isGeminiAvailable,
  };
}
