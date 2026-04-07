"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Audio Context Global

   Gère l'état du lecteur audio sans couper la musique
   lors des navigations entre les vues du SPA.
   ═══════════════════════════════════════════════════════ */

export type Track = {
  id: string;
  title: string;
  category: string;
  url: string;
  duration?: number;
};

export type AudioState = {
  isPlaying: boolean;
  volume: number;
  currentTrack: Track | null;
};

interface AudioContextType extends AudioState {
  play: (track: Track) => void;
  pause: () => void;
  setVolume: (v: number) => void;
  stop: () => void;
  /** Fade-in when playing, fade-out when pausing */
  fadePlay: (track: Track) => void;
  fadePause: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

/* ── Storage Keys ── */
const VOLUME_KEY = "mc-audio-volume";

function getStoredVolume(): number {
  if (typeof window === "undefined") return 0.5;
  try {
    const v = parseFloat(localStorage.getItem(VOLUME_KEY) || "0.5");
    return isNaN(v) ? 0.5 : Math.max(0, Math.min(1, v));
  } catch {
    return 0.5;
  }
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialVolume = useRef<number | null>(null);

  const [state, setState] = useState<AudioState>(() => ({
    isPlaying: false,
    volume: typeof window !== 'undefined' ? getStoredVolume() : 0.5,
    currentTrack: null,
  }));

  /* ── Initialize audio element ── */
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }
    // Sync audio element volume to stored value (no setState needed)
    const storedVol = getStoredVolume();
    audioRef.current.volume = storedVol;
    // Only set state once if initial value was wrong (SSR fallback)
    if (initialVolume.current === null) {
      initialVolume.current = storedVol;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (fadeRef.current) clearInterval(fadeRef.current);
    };
  }, []);

  /* ── Play with fade-in ── */
  const fadePlay = useCallback(
    (track: Track) => {
      const audio = audioRef.current;
      if (!audio) return;

      // Clear any existing fade
      if (fadeRef.current) clearInterval(fadeRef.current);

      audio.src = track.url;
      audio.volume = 0;
      audio.play().catch(console.warn);

      const targetVol = state.volume;
      let vol = 0;
      fadeRef.current = setInterval(() => {
        vol += 0.05;
        if (audio) audio.volume = Math.min(vol, targetVol);
        if (vol >= targetVol && fadeRef.current) {
          clearInterval(fadeRef.current);
          fadeRef.current = null;
        }
      }, 50);

      setState((s) => ({ ...s, isPlaying: true, currentTrack: track }));
    },
    [state.volume]
  );

  /* ── Pause with fade-out ── */
  const fadePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeRef.current) clearInterval(fadeRef.current);

    const currentVol = audio.volume;
    let vol = currentVol;

    fadeRef.current = setInterval(() => {
      vol -= 0.05;
      if (audio) audio.volume = Math.max(vol, 0);
      if (vol <= 0 && fadeRef.current) {
        clearInterval(fadeRef.current);
        fadeRef.current = null;
        audio.pause();
        setState((s) => ({ ...s, isPlaying: false }));
      }
    }, 50);
  }, []);

  /* ── Direct play (no fade) ── */
  const play = useCallback((track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = track.url;
    audio.volume = state.volume;
    audio.play().catch(console.warn);
    setState((s) => ({ ...s, isPlaying: true, currentTrack: track }));
  }, [state.volume]);

  /* ── Direct pause ── */
  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((s) => ({ ...s, isPlaying: false }));
  }, []);

  /* ── Stop ── */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState((s) => ({ ...s, isPlaying: false, currentTrack: null }));
  }, []);

  /* ── Set volume ── */
  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    if (audioRef.current) audioRef.current.volume = clamped;
    try {
      localStorage.setItem(VOLUME_KEY, String(clamped));
    } catch {
      // ignore
    }
    setState((s) => ({ ...s, volume: clamped }));
  }, []);

  return (
    <AudioContext.Provider
      value={{
        ...state,
        play,
        pause,
        setVolume,
        stop,
        fadePlay,
        fadePause,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioContextType {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return ctx;
}
