"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * useMaellisVoice — Hook de synthèse vocale pour la démo Maellis
 * Utilise Web Speech API avec une voix française naturelle
 */
export function useMaellisVoice() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Charger les voix disponibles au montage
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Synthèse vocale non supportée");
      return;
    }

    // Annuler toute parole en cours
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Configuration
    utterance.lang = "fr-FR";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Chercher une voix française de qualité (Google ou Microsoft)
    const frenchVoice =
      voices.find(
        (v) =>
          v.lang.includes("fr") &&
          (v.name.includes("Google") || v.name.includes("Microsoft"))
      ) || voices.find((v) => v.lang.includes("fr"));

    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking };
}
