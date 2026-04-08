"use client";

/* ═══════════════════════════════════════════════════════
   useSeasonalAudio — React Hook for Seasonal Sound

   Manages seasonal ambient audio lifecycle:
   - Waits for first user interaction (autoplay policy)
   - Auto-starts when enabled
   - Crossfades on season change
   - Cleans up on unmount
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  playSeasonalSound,
  stopSeasonalAudio,
  isSeasonalAudioPlaying as checkPlaying,
  getCurrentTrackLabel,
  setSeasonalVolume,
} from "@/lib/seasonal-audio";

interface UseSeasonalAudioReturn {
  isPlaying: boolean;
  trackLabel: string | null;
  toggle: () => void;
  play: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
}

export function useSeasonalAudio(
  season: string,
  enabled = true,
  defaultVolume = 0.3,
): UseSeasonalAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackLabel, setTrackLabel] = useState<string | null>(null);
  const hasInteracted = useRef(false);

  const play = useCallback(async () => {
    const label = await playSeasonalSound(season, defaultVolume);
    if (label) {
      setIsPlaying(true);
      setTrackLabel(label);
    }
  }, [season, defaultVolume]);

  const stop = useCallback(() => {
    stopSeasonalAudio();
    setIsPlaying(false);
    setTrackLabel(null);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  const setVolume = useCallback((v: number) => {
    setSeasonalVolume(v);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Respect browser autoplay: wait for first interaction
    const startOnInteraction = () => {
      if (hasInteracted.current) return;
      hasInteracted.current = true;
      play();
    };

    const events = ["click", "touchstart", "keydown"] as const;
    events.forEach((evt) => window.addEventListener(evt, startOnInteraction, { once: true, passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, startOnInteraction));
      stopSeasonalAudio();
      setIsPlaying(false);
      setTrackLabel(null);
    };
  }, [enabled, play]);

  // Re-play when season changes (deferred via rAF)
  useEffect(() => {
    if (!enabled || !hasInteracted.current) return;
    const id = requestAnimationFrame(() => {
      playSeasonalSound(season, defaultVolume).then((label) => {
        if (label) {
          setIsPlaying(true);
          setTrackLabel(label);
        }
      });
    });
    return () => cancelAnimationFrame(id);
  }, [season, enabled, defaultVolume]);

  // Periodically sync playing state
  useEffect(() => {
    const interval = setInterval(() => {
      const playing = checkPlaying();
      setIsPlaying(playing);
      if (playing) {
        setTrackLabel(getCurrentTrackLabel());
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return { isPlaying, trackLabel, toggle, play, stop, setVolume };
}
