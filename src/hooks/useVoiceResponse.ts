'use client';

/* ═══════════════════════════════════════════════════════
   USE VOICE RESPONSE — Voice Input/Output Hook

   Combines Web Speech API (STT + TTS) with the voice
   processing API for a complete voice assistant pipeline:

     User speaks → STT → transcript → API → response → TTS

   Supports:
   - Push-to-talk and programmatic start/stop
   - Configurable rate/volume
   - Graceful fallbacks for unsupported browsers
   - Automatic cleanup on unmount

   Usage:
     const voice = useVoiceResponse();
     voice.setHouseholdId('hh-123');
     // User presses orb → startListening()
     // User releases → stopListening() → API → speak()
   ═══════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useEffect } from 'react';

/* ─── Types ─── */

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

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
  /** The last recognized text */
  transcript: string;
  /** The last spoken response */
  lastResponse: string;
  /** Error message if any */
  error: string | null;
  /** Whether speech recognition is available */
  isAvailable: boolean;
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

/* ─── Helpers ─── */

function checkSpeechSupport(): boolean {
  if (typeof window === 'undefined') return false;
  const hasRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const hasSynthesis = 'speechSynthesis' in window;
  return hasRecognition && hasSynthesis;
}

function createRecognition(): SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  const SpeechRecognitionCtor =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) return null;
  return new SpeechRecognitionCtor();
}

/* ─── Hook ─── */

export function useVoiceResponse(): UseVoiceResponseReturn {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [isAvailable] = useState(checkSpeechSupport);

  const rateRef = useRef(1.0);
  const volumeRef = useRef(0.8);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const isStoppedRef = useRef(false);

  /* ─── Cleanup on unmount ─── */

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore cleanup errors
        }
      }
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
        // Speak the response
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

  /* ─── Start Listening ─── */

  const startListening = useCallback(() => {
    if (!isAvailable) {
      setError('La reconnaissance vocale n\'est pas disponible dans ce navigateur.');
      return;
    }

    // Reset state
    setTranscript('');
    finalTranscriptRef.current = '';
    isStoppedRef.current = false;
    setError(null);

    // Cancel any ongoing speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const recognition = createRecognition();
    if (!recognition) {
      setError('Impossible de créer la reconnaissance vocale.');
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

      // Update the displayed transcript (interim + final)
      const displayText = finalTranscriptRef.current + finalText + interimTranscript;
      setTranscript(displayText.trim());

      // Accumulate final transcripts
      if (finalText) {
        finalTranscriptRef.current += finalText;
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' is common and not a real error
      if (event.error === 'no-speech') {
        setState('idle');
        return;
      }
      // 'aborted' happens when we call stop() ourselves
      if (event.error === 'aborted') {
        return;
      }
      setError(`Reconnaissance: ${event.error}`);
      setState('idle');
    };

    recognition.onend = () => {
      recognitionRef.current = null;

      // If the user didn't manually stop, process what we have
      if (!isStoppedRef.current) {
        const finalText = finalTranscriptRef.current.trim();
        if (finalText) {
          processTranscript(finalText);
        } else {
          setState('idle');
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      // Recognition may already be running
      setState('idle');
    }
  }, [isAvailable, processTranscript]);

  /* ─── Stop Listening ─── */

  const stopListening = useCallback(() => {
    isStoppedRef.current = true;

    if (recognitionRef.current) {
      try {
        // Get whatever final transcript we have before stopping
        const finalText = finalTranscriptRef.current.trim();
        recognitionRef.current.stop();
        recognitionRef.current = null;

        // Process the final transcript
        if (finalText) {
          processTranscript(finalText);
        } else {
          setState('idle');
        }
      } catch {
        setState('idle');
      }
    }
  }, [processTranscript]);

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

  /* ─── Return ─── */

  return {
    state,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    transcript,
    lastResponse,
    error,
    isAvailable,
    setRate,
    setVolume,
    householdId,
    setHouseholdId,
  };
}
