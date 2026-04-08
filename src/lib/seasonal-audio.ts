/* ═══════════════════════════════════════════════════════
   seasonal-audio.ts — Seasonal Ambient Sound Engine

   Manages background audio tracks based on season.
   Crossfade transitions between tracks. Volume fade
   with smooth ramp. Graceful fallback when audio
   files are missing (autoplay-blocked handling).
   100% local — no external API calls.
   ═══════════════════════════════════════════════════════ */

interface SeasonTrack {
  src: string;
  label: string;
}

const SEASON_AUDIO: Record<string, SeasonTrack> = {
  spring: { src: "/audio/seasons/birds-spring.wav", label: "Oiseaux & Brise printanière" },
  summer: { src: "/audio/seasons/rain-summer.wav", label: "Pluie d'été légère" },
  autumn: { src: "/audio/seasons/wind-autumn.wav", label: "Vent d'automne & feuilles" },
  winter: { src: "/audio/seasons/fireplace-winter.wav", label: "Feu de cheminée" },
  christmas: { src: "/audio/seasons/fireplace-winter.wav", label: "Feu de cheminée & cloches" },
};

let audioEl: HTMLAudioElement | null = null;
let fadeInterval: ReturnType<typeof setInterval> | null = null;
let currentVolume = 0.3;
let currentTrackKey: string | null = null;

/**
 * Initialize or return the shared audio element.
 */
export function initSeasonalAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.loop = true;
    audioEl.volume = 0;
    audioEl.preload = "auto";
  }
  return audioEl;
}

/**
 * Play a seasonal ambient sound with crossfade.
 * Respects browser autoplay policy — returns null if blocked.
 */
export async function playSeasonalSound(
  season: string,
  volume = 0.3,
): Promise<string | null> {
  const el = initSeasonalAudio();
  if (!el) return null;

  const track = SEASON_AUDIO[season] || SEASON_AUDIO.winter;
  currentVolume = volume;

  // Crossfade out current track if switching
  if (currentTrackKey && currentTrackKey !== season) {
    await fadeVolume(0, 800);
  }

  // Only reload if track actually changed
  if (currentTrackKey !== season) {
    el.src = track.src;
    el.load();
    currentTrackKey = season;
  }

  try {
    await el.play();
    await fadeVolume(currentVolume, 600);
    return track.label;
  } catch {
    // Autoplay blocked or file missing
    currentTrackKey = null;
    return null;
  }
}

/**
 * Smoothly ramp volume to target over given duration.
 */
function fadeVolume(target: number, ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = null;
    }

    const el = audioEl;
    if (!el) {
      resolve();
      return;
    }

    const step = 20; // ms per tick
    const steps = ms / step;
    const start = el.volume;
    const diff = (target - start) / steps;
    let current = start;

    fadeInterval = setInterval(() => {
      current += diff;
      el.volume = Math.max(0, Math.min(1, current));

      if (
        (diff > 0 && current >= target) ||
        (diff < 0 && current <= target) ||
        Math.abs(current - target) < 0.01
      ) {
        el.volume = target;
        if (fadeInterval) {
          clearInterval(fadeInterval);
          fadeInterval = null;
        }
        resolve();
      }
    }, step);
  });
}

/**
 * Fade out and pause seasonal audio.
 */
export function stopSeasonalAudio(): void {
  if (!audioEl) return;
  fadeVolume(0, 400).then(() => {
    if (audioEl) {
      audioEl.pause();
      currentTrackKey = null;
    }
  });
}

/**
 * Check if seasonal audio is currently playing.
 */
export function isSeasonalAudioPlaying(): boolean {
  return audioEl ? !audioEl.paused && audioEl.volume > 0.01 : false;
}

/**
 * Set volume on the fly (no fade).
 */
export function setSeasonalVolume(volume: number): void {
  currentVolume = Math.max(0, Math.min(1, volume));
  if (audioEl && !audioEl.paused) {
    audioEl.volume = currentVolume;
  }
}

/**
 * Get current track label.
 */
export function getCurrentTrackLabel(): string | null {
  if (!currentTrackKey) return null;
  return SEASON_AUDIO[currentTrackKey]?.label ?? null;
}

export { SEASON_AUDIO };
