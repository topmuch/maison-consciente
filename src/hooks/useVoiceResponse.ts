'use client';

/* ═══════════════════════════════════════════════════════
   USE VOICE RESPONSE — Voice Input/Output Hook

   Uses Transformers.js + Whisper-tiny (STT) with browser
   speechSynthesis (TTS) and the voice processing API:

     User speaks → STT (Whisper) → transcript → API → response → TTS

   Falls back to Web Speech API if Transformers.js is unavailable.

   Supports:
   - Push-to-talk and programmatic start/stop
   - Configurable rate/volume
   - Graceful fallbacks for unsupported browsers
   - Model download with loading state (~40MB, cached by browser)
   - Automatic cleanup on unmount

   Usage:
     const voice = useVoiceResponse();
     voice.setHouseholdId('hh-123');
     // User presses orb → startListening()
     // User releases → stopListening() → API → speak()
   ═══════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useEffect } from 'react';

/* ─── Types ─── */

export type VoiceState = 'idle' | 'loading' | 'listening' | 'processing' | 'speaking';

export interface UseVoiceResponseReturn {
  /** Current voice state */
  state: VoiceState;
  /** Start listening (push-to-talk or programmatic) */
  startListening: () => void;
  /** Stop listening and process */
  stopListening: () => void;
  /** Speak a message using TTS */
  speak: (text: string) => void;
  /** Stop speaking */
  stopSpeaking: () => void;
  /** Alias for stopSpeaking */
  stop: () => void;
  /** The last recognized text */
  transcript: string;
  /** The last spoken response */
  lastResponse: string;
  /** Error message if any */
  error: string | null;
  /** Whether speech recognition is available */
  isAvailable: boolean;
  /** Whether TTS is currently speaking (alias: state === 'speaking') */
  isSpeaking: boolean;
  /** Whether audio output is muted */
  isMuted: boolean;
  /** Toggle mute state */
  toggleMute: () => void;
  /** Whether speech synthesis is supported */
  isSupported: boolean;
  /** Set the TTS rate (0.5 - 2.0) */
  setRate: (rate: number) => void;
  /** Set the TTS volume (0 - 1) */
  setVolume: (volume: number) => void;
  /** Household ID for API calls */
  householdId: string | null;
  /** Set household ID */
  setHouseholdId: (id: string) => void;
}

/* ─── Constants ─── */

const FALLBACK_MESSAGE = "Je n'ai pas pu traiter votre demande. Réessayez.";
const DEFAULT_LANG = 'fr-FR';

/* ─── Module-level Whisper pipeline cache ─── */

let cachedPipeline: any = null;
let pipelinePromise: Promise<any> | null = null;
let pipelineFailed = false;

async function getPipeline(): Promise<any> {
  if (cachedPipeline) return cachedPipeline;
  if (pipelineFailed) throw new Error('Pipeline previously failed to load');
  if (pipelinePromise) return pipelinePromise;

  pipelinePromise = (async () => {
    try {
      const { pipeline } = await import('@huggingface/transformers');
      cachedPipeline = await pipeline(
        'automatic-speech-recognition',
        'onnx-community/whisper-tiny',
        { dtype: 'q8' },
      );
      return cachedPipeline;
    } catch (e) {
      pipelinePromise = null;
      pipelineFailed = true;
      throw e;
    }
  })();

  return pipelinePromise;
}

/* ─── Audio utilities ─── */

/**
 * Decode a recorded audio Blob into a 16 kHz mono Float32Array
 * suitable for the Whisper pipeline.
 */
async function audioBlobToFloat32Array(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Mix down to mono
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const mono = new Float32Array(length);

  if (numChannels === 1) {
    mono.set(audioBuffer.getChannelData(0));
  } else {
    for (let ch = 0; ch < numChannels; ch++) {
      const channelData = audioBuffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        mono[i] += channelData[i];
      }
    }
    for (let i = 0; i < length; i++) {
      mono[i] /= numChannels;
    }
  }

  // Resample to 16 kHz (Whisper requirement)
  const targetSampleRate = 16000;
  if (audioBuffer.sampleRate === targetSampleRate) {
    await audioContext.close();
    return mono;
  }

  const ratio = audioBuffer.sampleRate / targetSampleRate;
  const newLength = Math.round(length / ratio);
  const resampled = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const floor = Math.floor(srcIndex);
    const ceil = Math.min(floor + 1, length - 1);
    const t = srcIndex - floor;
    resampled[i] = mono[floor] * (1 - t) + mono[ceil] * t;
  }

  await audioContext.close();
  return resampled;
}

/* ─── Helpers ─── */

function checkMediaSupport(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function createRecognition(): SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

/* ─── Hook ─── */

export function useVoiceResponse(): UseVoiceResponseReturn {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [isAvailable] = useState(checkMediaSupport);

  const rateRef = useRef(1.0);
  const volumeRef = useRef(0.8);
  const isMutedRef = useRef(false);

  // Whisper (primary) refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedMimeTypeRef = useRef<string>('audio/webm');

  // Web Speech API (fallback) refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  // General state refs
  const useFallbackRef = useRef(false);
  const isStoppedRef = useRef(false);
  const processTranscriptRef = useRef<(text: string) => Promise<void>>(() => Promise.resolve());

  /* ─── Cleanup on unmount ─── */

  useEffect(() => {
    return () => {
      // Stop any active media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
      }
      // Stop media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      // Abort recognition
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
      // Cancel speech
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /* ─── Process transcript via API ─── */

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim()) {
      setState('idle');
      return;
    }

    setState('processing');
    setError(null);

    try {
      const res = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId: householdId || '',
          text,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      if (data.success && data.message) {
        setLastResponse(data.message);
        setState('speaking');
        speakInternal(data.message);
      } else {
        setLastResponse(FALLBACK_MESSAGE);
        setState('speaking');
        speakInternal(FALLBACK_MESSAGE);
      }
    } catch {
      setLastResponse(FALLBACK_MESSAGE);
      setState('speaking');
      speakInternal(FALLBACK_MESSAGE);
      setError('Erreur de connexion au serveur vocal.');
    }
  }, [householdId]);

  // Keep processTranscript ref in sync (avoids stale closures in callbacks)
  useEffect(() => {
    processTranscriptRef.current = processTranscript;
  }, [processTranscript]);

  /* ─── Internal TTS function ─── */

  const speakInternal = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!text.trim()) return;

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = DEFAULT_LANG;
    utterance.rate = rateRef.current;
    utterance.volume = volumeRef.current;

    // Try to find a French voice
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find((v) => v.lang.startsWith('fr'));
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    utterance.onend = () => {
      setState('idle');
    };

    utterance.onerror = (event) => {
      if (event.error !== 'canceled') {
        setError(`Erreur TTS: ${event.error}`);
      }
      setState('idle');
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  /* ─── Whisper: process recorded audio ─── */

  const processAudioBlob = useCallback(async (blob: Blob) => {
    try {
      setState('processing');
      setError(null);

      const audioData = await audioBlobToFloat32Array(blob);

      // Ignore very short recordings (likely silence / no speech)
      if (audioData.length < 100) {
        setState('idle');
        return;
      }

      const pipeline = await getPipeline();
      const result = await pipeline(audioData, {
        language: 'french',
        task: 'transcribe',
      });

      const text = (result?.text as string)?.trim() || '';
      setTranscript(text);

      if (text) {
        await processTranscriptRef.current(text);
      } else {
        setState('idle');
      }
    } catch {
      setError('Erreur lors de la reconnaissance vocale.');
      setState('idle');
    }
  }, []);

  /* ─── Whisper: start MediaRecorder ─── */

  const startMediaRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick a supported mimeType
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      let mimeType = '';
      for (const candidate of candidates) {
        if (MediaRecorder.isTypeSupported(candidate)) {
          mimeType = candidate;
          break;
        }
      }
      recordedMimeTypeRef.current = mimeType || 'audio/webm';

      const options: MediaRecorderOptions = {};
      if (mimeType) options.mimeType = mimeType;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Release microphone immediately
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (isStoppedRef.current && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, {
            type: recordedMimeTypeRef.current,
          });
          chunksRef.current = [];
          // Fire and forget — processAudioBlob manages its own state
          processAudioBlob(blob);
        } else {
          chunksRef.current = [];
          setState('idle');
        }
      };

      mediaRecorder.onerror = () => {
        setError('Erreur d\'enregistrement audio.');
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setState('idle');
      };

      mediaRecorder.start(100); // collect chunks every 100 ms
      setState('listening');
    } catch {
      setError('Impossible d\'accéder au microphone.');
      setState('idle');
    }
  }, [processAudioBlob]);

  /* ─── Fallback: Web Speech API listening ─── */

  const startFallbackListening = useCallback(() => {
    const recognition = createRecognition();
    if (!recognition) {
      setError('La reconnaissance vocale n\'est pas disponible.');
      setState('idle');
      return;
    }

    recognition.lang = DEFAULT_LANG;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const displayText = finalTranscriptRef.current + finalText + interimTranscript;
      setTranscript(displayText.trim());

      if (finalText) {
        finalTranscriptRef.current += finalText;
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setState('idle');
        return;
      }
      if (event.error === 'aborted') {
        return;
      }
      setError(`Reconnaissance: ${event.error}`);
      setState('idle');
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!isStoppedRef.current) {
        const finalText = finalTranscriptRef.current.trim();
        if (finalText) {
          processTranscriptRef.current(finalText);
        } else {
          setState('idle');
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setState('idle');
    }
  }, []);

  /* ─── Start Listening ─── */

  const startListening = useCallback(() => {
    if (!isAvailable) {
      setError('La reconnaissance vocale n\'est pas disponible dans ce navigateur.');
      return;
    }

    // Already loading or listening — ignore duplicate calls
    if (state === 'loading' || state === 'listening') return;

    // Reset state
    setTranscript('');
    finalTranscriptRef.current = '';
    isStoppedRef.current = false;
    setError(null);

    // Cancel any ongoing speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // If we previously fell back, use the fallback path directly
    if (useFallbackRef.current) {
      startFallbackListening();
      return;
    }

    // Ensure the Whisper model is loaded (first time only)
    if (!cachedPipeline && !pipelinePromise) {
      setState('loading');
      getPipeline()
        .then(() => {
          // Check if user already stopped while we were loading
          if (isStoppedRef.current) {
            setState('idle');
            return;
          }
          startMediaRecorder();
        })
        .catch(() => {
          // Fall back to Web Speech API
          useFallbackRef.current = true;
          // Check if user already stopped
          if (isStoppedRef.current) {
            setState('idle');
            return;
          }
          startFallbackListening();
        });
      return;
    }

    if (pipelinePromise) {
      // Model is currently downloading
      setState('loading');
      pipelinePromise
        .then(() => {
          if (isStoppedRef.current) {
            setState('idle');
            return;
          }
          startMediaRecorder();
        })
        .catch(() => {
          useFallbackRef.current = true;
          if (isStoppedRef.current) {
            setState('idle');
            return;
          }
          startFallbackListening();
        });
      return;
    }

    // Model already cached — go straight to recording
    startMediaRecorder();
  }, [isAvailable, state, startMediaRecorder, startFallbackListening]);

  /* ─── Stop Listening ─── */

  const stopListening = useCallback(() => {
    isStoppedRef.current = true;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Whisper path: stop the recorder; onstop handler will process the blob
      try {
        mediaRecorderRef.current.stop();
      } catch {
        setState('idle');
      }
      mediaRecorderRef.current = null;
    } else if (useFallbackRef.current && recognitionRef.current) {
      // Fallback path: stop recognition
      try {
        const finalText = finalTranscriptRef.current.trim();
        recognitionRef.current.stop();
        recognitionRef.current = null;
        if (finalText) {
          processTranscriptRef.current(finalText);
        } else {
          setState('idle');
        }
      } catch {
        setState('idle');
      }
    } else if (state === 'loading') {
      // User stopped while model was loading — just go idle
      setState('idle');
    } else {
      // Nothing was running
      setState('idle');
    }
  }, [state]);

  /* ─── Speak (public API) ─── */

  const speak = useCallback((text: string) => {
    setState('speaking');
    setLastResponse(text);
    speakInternal(text);
  }, [speakInternal]);

  /* ─── Stop Speaking ─── */

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setState('idle');
  }, []);

  /* ─── Settings ─── */

  const setRate = useCallback((rate: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, rate));
    rateRef.current = clamped;
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    volumeRef.current = clamped;
  }, []);

  /* ─── Derived state ─── */

  const isSpeaking = state === 'speaking';
  const isMuted = isMutedRef.current;
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    if (isMutedRef.current) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setState('idle');
    }
  }, []);

  /* ─── Return ─── */

  return {
    state,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    stop: stopSpeaking,
    transcript,
    lastResponse,
    error,
    isAvailable,
    isSpeaking,
    isMuted,
    toggleMute,
    isSupported,
    setRate,
    setVolume,
    householdId,
    setHouseholdId,
  };
}
