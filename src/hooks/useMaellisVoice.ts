"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   MAELLIS VOICE HOOK — Web Speech API (STT + TTS + Barge-in)

   Fonctionnalités :
   1. Reconnaissance vocale (STT) via SpeechRecognition
   2. Synthèse vocale (TTS) via SpeechSynthesis
   3. Barge-in : si l'utilisateur parle, Maellis s'arrête
   4. Support multilingue (FR par défaut)
   5. Gestion d'erreurs et fallback clavier
   ═══════════════════════════════════════════════════════════════ */

export type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

export interface VoiceCapabilities {
  sttSupported: boolean;
  ttsSupported: boolean;
}

export function useMaellisVoice(
  options: {
    lang?: string;
    onTranscript?: (text: string, isFinal: boolean) => void;
    autoRestart?: boolean;
    maxSilenceMs?: number;
  } = {}
) {
  const {
    lang = "fr-FR",
    onTranscript,
    autoRestart = true,
  } = options;

  /* ── State ── */
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<VoiceCapabilities>({
    sttSupported: false,
    ttsSupported: false,
  });

  /* ── Refs ── */
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const isStoppingRef = useRef(false);
  const manualStopRef = useRef(false);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ═══════════════════════════════════════════════════════════
     1. INIT — Vérifier la compatibilité navigateur
     ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasSTT = !!SpeechRecognitionAPI;
    const hasTTS = "speechSynthesis" in window;

    setCapabilities({ sttSupported: hasSTT, ttsSupported: hasTTS });

    if (!hasSTT) {
      setError(
        "Reconnaissance vocale non supportée. Utilisez Chrome ou Edge."
      );
    }

    // Charger les voix TTS
    if (hasTTS) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0) voicesRef.current = v;
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (hasTTS) {
        window.speechSynthesis.cancel();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  /* ═══════════════════════════════════════════════════════════
     2. STT — Reconnaissance vocale (Speech-to-Text)
     ═══════════════════════════════════════════════════════════ */

  const createRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Quand on reçoit un résultat (temporaire ou final)
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Barge-in : si Maellis parle, couper la parole
      if (
        utteranceRef.current &&
        window.speechSynthesis.speaking &&
        !manualStopRef.current
      ) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
        setVoiceState("listening");
      }

      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
      }

      if (final) {
        setInterimTranscript("");
        setTranscript((prev) => {
          const newTranscript = prev ? `${prev} ${final}` : final;
          onTranscript?.(final, true);
          return newTranscript;
        });
      }
    };

    // Quand la reconnaissance se termine
    recognition.onend = () => {
      if (isStoppingRef.current) {
        isStoppingRef.current = false;
        setVoiceState("idle");
        return;
      }

      // Redémarrage automatique si activé
      if (autoRestart && !manualStopRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch {
            setVoiceState("idle");
          }
        }, 300);
      } else {
        setVoiceState("idle");
      }
    };

    // Gestion des erreurs
    recognition.onerror = (event) => {
      // "no-speech" et "aborted" ne sont pas des erreurs critiques
      if (event.error === "no-speech" || event.error === "aborted") {
        setVoiceState("idle");
        return;
      }

      if (event.error === "not-allowed") {
        setError("Micro non autorisé. Veuillez autoriser l'accès au micro.");
        setVoiceState("error");
      } else if (event.error === "network") {
        setError("Erreur réseau. Vérifiez votre connexion internet.");
        setVoiceState("error");
      } else {
        console.warn("[MaellisVoice] STT Error:", event.error);
        setVoiceState("idle");
      }
    };

    return recognition;
  }, [lang, autoRestart, onTranscript]);

  /* ── Démarrer l'écoute ── */
  const startListening = useCallback(() => {
    if (!capabilities.sttSupported) {
      setError("Reconnaissance vocale non disponible sur ce navigateur.");
      setVoiceState("error");
      return;
    }

    // Arrêter la synthèse en cours (barge-in)
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }

    manualStopRef.current = false;

    // Nettoyer le précédent
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setVoiceState("listening");
      setError(null);
    } catch (err) {
      // Si déjà démarré, ignore
      console.warn("[MaellisVoice] Start error:", err);
    }
  }, [capabilities.sttSupported, createRecognition]);

  /* ── Arrêter l'écoute ── */
  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    isStoppingRef.current = true;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    setVoiceState("idle");
    setInterimTranscript("");
  }, []);

  /* ── Basculer l'écoute ── */
  const toggleListening = useCallback(() => {
    if (voiceState === "listening") {
      stopListening();
    } else {
      startListening();
    }
  }, [voiceState, startListening, stopListening]);

  /* ═══════════════════════════════════════════════════════════
     3. TTS — Synthèse vocale (Text-to-Speech)
     ═══════════════════════════════════════════════════════════ */

  const speak = useCallback(
    (text: string, speakOptions?: { rate?: number; pitch?: number }) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        console.warn("[MaellisVoice] Synthèse vocale non supportée");
        return;
      }

      // Annuler toute parole en cours
      window.speechSynthesis.cancel();

      // Arrêter l'écoute pendant que Maellis parle
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const utterance = new SpeechSynthesisUtterance(text);

      // Configuration
      utterance.lang = lang;
      utterance.rate = speakOptions?.rate ?? 1.05;
      utterance.pitch = speakOptions?.pitch ?? 1.0;
      utterance.volume = 1.0;

      // Sélectionner une voix française naturelle
      const voices = voicesRef.current;
      const frenchVoice =
        voices.find(
          (v) =>
            v.lang.includes("fr") &&
            (v.name.includes("Google") || v.name.includes("Microsoft"))
        ) ||
        voices.find((v) => v.lang.includes("fr")) ||
        voices.find((v) => v.lang.startsWith("fr"));

      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      utterance.onstart = () => {
        setVoiceState("speaking");
        utteranceRef.current = utterance;
      };
      utterance.onend = () => {
        setVoiceState("idle");
        utteranceRef.current = null;
      };
      utterance.onerror = (e) => {
        if (e.error !== "canceled") {
          console.warn("[MaellisVoice] TTS Error:", e.error);
        }
        setVoiceState("idle");
        utteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
      setLastResponse(text);
      setError(null);
    },
    [lang]
  );

  /* ── Arrêter la parole ── */
  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    setVoiceState("idle");
  }, []);

  /* ── Réinitialiser le transcript ── */
  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setLastResponse("");
  }, []);

  /* ── Effacer l'erreur ── */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    /* State */
    voiceState,
    transcript,
    interimTranscript,
    lastResponse,
    error,
    capabilities,
    isListening: voiceState === "listening",
    isSpeaking: voiceState === "speaking",
    isError: voiceState === "error",

    /* Actions */
    startListening,
    stopListening,
    toggleListening,
    speak,
    stop,
    clearTranscript,
    clearError,
  };
}

/* ═══════════════════════════════════════════════════════════════
   TypeScript declarations pour Web Speech API
   ═══════════════════════════════════════════════════════════════ */
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
