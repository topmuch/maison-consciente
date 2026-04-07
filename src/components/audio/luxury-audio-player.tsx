'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Music,
  Loader2,
  SkipBack,
  SkipForward,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface Soundscape {
  id: string;
  title: string;
  category: string;
  sourceType: string;
  url: string;
}

interface AudioPlayerState {
  isVisible: boolean;
  isPlaying: boolean;
  currentTrack: Soundscape | null;
  volume: number;
  progress: number;
  duration: number;
}

/* ═══════════════════════════════════════════════════════
   AUDIO PLAYER
   ═══════════════════════════════════════════════════════ */

export function LuxuryAudioPlayer() {
  const [state, setState] = useState<AudioPlayerState>({
    isVisible: false,
    isPlaying: false,
    currentTrack: null,
    volume: 0.7,
    progress: 0,
    duration: 0,
  });

  const [soundscapes, setSoundscapes] = useState<Soundscape[]>([]);
  const [loading, setLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchAttemptedRef = useRef(false);

  /* ── Fetch soundscapes on mount ── */
  useEffect(() => {
    if (fetchAttemptedRef.current) return;
    fetchAttemptedRef.current = true;

    fetch('/api/soundscapes')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed');
      })
      .then((data) => {
        const list: Soundscape[] = data.soundscapes || [];
        setSoundscapes(list);
        if (list.length > 0) {
          setState((prev) => ({ ...prev, currentTrack: list[0], isVisible: true }));
        }
      })
      .catch(() => {
        // Silent fail — no soundscapes available
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Initialize audio element ── */
  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    const audio = new Audio();
    audio.volume = state.volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  /* ── Update audio source when track changes ── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentTrack) return;

    audio.src = state.currentTrack.url;
    audio.volume = state.volume;
    audio.load();

    if (state.isPlaying) {
      audio.play().catch(() => {
        setState((prev) => ({ ...prev, isPlaying: false }));
      });
    }
  }, [state.currentTrack?.id, state.isPlaying, state.volume]);

  /* ── Progress tracking ── */
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused && audio.duration) {
        setState((prev) => ({
          ...prev,
          progress: audio.currentTime,
          duration: audio.duration,
        }));
      }
    }, 250);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  /* ── Play / Pause ── */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentTrack) return;

    if (state.isPlaying) {
      audio.pause();
      stopProgressTracking();
      setState((prev) => ({ ...prev, isPlaying: false }));
    } else {
      audio.play().then(() => {
        startProgressTracking();
        setState((prev) => ({ ...prev, isPlaying: true }));
      }).catch(() => {
        setState((prev) => ({ ...prev, isPlaying: false }));
      });
    }
  }, [state.isPlaying, state.currentTrack, startProgressTracking, stopProgressTracking]);

  /* ── Volume ── */
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.volume = v;
    setState((prev) => ({ ...prev, volume: v }));
  }, []);

  /* ── Seek ── */
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = time;
      setState((prev) => ({ ...prev, progress: time }));
    }
  }, []);

  /* ── Next / Previous track ── */
  const changeTrack = useCallback((direction: 1 | -1) => {
    if (soundscapes.length <= 1) return;
    const currentIndex = soundscapes.findIndex((s) => s.id === state.currentTrack?.id);
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = soundscapes.length - 1;
    if (newIndex >= soundscapes.length) newIndex = 0;
    setState((prev) => ({
      ...prev,
      currentTrack: soundscapes[newIndex],
      progress: 0,
      duration: 0,
    }));
  }, [soundscapes, state.currentTrack]);

  /* ── Close player ── */
  const closePlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    stopProgressTracking();
    setState((prev) => ({
      ...prev,
      isVisible: false,
      isPlaying: false,
      progress: 0,
      duration: 0,
    }));
  }, [stopProgressTracking]);

  /* ── Format time ── */
  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  /* Don't render if not visible or loading with no tracks */
  if (loading) return null;
  if (!state.isVisible || !state.currentTrack) return null;

  const progressPercent = state.duration > 0 ? (state.progress / state.duration) * 100 : 0;

  return (
    <AnimatePresence>
      {state.isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="fixed bottom-0 left-0 right-0 z-50 md:left-[288px]"
        >
          <div className="glass-strong border-t border-white/[0.08] px-4 md:px-6 py-3">
            {/* Top gold shimmer line */}
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />

            <div className="flex items-center gap-4 max-w-5xl mx-auto">
              {/* Track info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary-dark)]/10 border border-[var(--accent-primary)]/15 flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {state.currentTrack.title}
                  </p>
                  <p className="text-[10px] text-[#475569] capitalize">
                    {state.currentTrack.category}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => changeTrack(-1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/[0.06] transition-all duration-300"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  className="w-11 h-11 rounded-full bg-gradient-gold flex items-center justify-center shadow-[0_0_16px_oklch(0.78_0.14_85/20%)] hover:shadow-[0_0_24px_oklch(0.78_0.14_85/30%)] transition-shadow duration-500"
                >
                  {state.isPlaying ? (
                    <Pause className="w-5 h-5 text-[#0a0a12]" />
                  ) : (
                    <Play className="w-5 h-5 text-[#0a0a12] ml-0.5" />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => changeTrack(1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/[0.06] transition-all duration-300"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {/* Progress + Volume */}
              <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
                {/* Progress bar */}
                <div className="flex items-center gap-2 w-[180px]">
                  <span className="text-[10px] text-[#475569] font-mono w-8 text-right">
                    {formatTime(state.progress)}
                  </span>
                  <div className="flex-1 relative h-1.5 rounded-full bg-white/[0.06] group/progress">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--accent-primary-dark)] to-[var(--accent-primary)] transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                    <input
                      type="range"
                      min="0"
                      max={state.duration || 0}
                      step="0.1"
                      value={state.progress}
                      onChange={handleSeek}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Progression de la lecture"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary-glow)] pointer-events-none opacity-0 group-hover/progress:opacity-100 transition-opacity duration-200"
                      style={{ left: `calc(${progressPercent}% - 6px)` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#475569] font-mono w-8">
                    {formatTime(state.duration)}
                  </span>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2 w-[120px]">
                  <button
                    onClick={() => {
                      const newVolume = state.volume > 0 ? 0 : 0.7;
                      if (audioRef.current) audioRef.current.volume = newVolume;
                      setState((prev) => ({ ...prev, volume: newVolume }));
                    }}
                    className="text-[#64748b] hover:text-[var(--accent-primary)] transition-colors duration-300"
                  >
                    {state.volume > 0 ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>
                  <div className="flex-1 relative h-1.5 rounded-full bg-white/[0.06] group/vol">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--accent-primary-dark)] to-[var(--accent-primary)]"
                      style={{ width: `${state.volume * 100}%` }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={state.volume}
                      onChange={handleVolumeChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Volume"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary-glow)] pointer-events-none opacity-0 group-hover/vol:opacity-100 transition-opacity duration-200"
                      style={{ left: `calc(${state.volume * 100}% - 6px)` }}
                    />
                  </div>
                </div>
              </div>

              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={closePlayer}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#475569] hover:text-[#f87171] hover:bg-[#f87171]/[0.06] transition-all duration-300"
                aria-label="Fermer le lecteur"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
