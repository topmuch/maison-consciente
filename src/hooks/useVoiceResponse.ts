'use client';

/* ═══════════════════════════════════════════════════════
   USE VOICE RESPONSE — TTS Hook
   
   Uses the Web Speech API (SpeechSynthesis) for contextual
   vocal feedback. Graceful fallback when not supported.
   
   Usage:
     const { speak, stop, isSpeaking } = useVoiceResponse();
     speak("Export réussi, 4 zones imprimées");
   ═══════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceResponseOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface VoiceResponseReturn {
  speak: (text: string, options?: VoiceResponseOptions) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
}

function checkTtsSupport(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function useVoiceResponse(): VoiceResponseReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(checkTtsSupport);
  const [isMuted, setIsMuted] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, options?: VoiceResponseOptions) => {
    if (!isSupported || isMuted || !text.trim()) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.lang || 'fr-FR';
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;
    utterance.volume = options?.volume ?? 0.8;

    // Try to find a French voice
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find((v) => v.lang.startsWith('fr'));
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      options?.onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
      options?.onEnd?.();
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      utteranceRef.current = null;
      if (event.error !== 'canceled') {
        options?.onError?.(event.error);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, isMuted]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev && isSpeaking) {
        stop();
      }
      return !prev;
    });
  }, [isSpeaking, stop]);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    if (muted && isSpeaking) {
      stop();
    }
  }, [isSpeaking, stop]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    isMuted,
    toggleMute,
    setMuted,
  };
}
