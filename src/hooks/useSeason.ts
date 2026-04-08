"use client";

/* ═══════════════════════════════════════════════════════
   useSeason — Season Detection Hook

   Maps current date to a season with associated theme
   data (accent color, gradient, decoration hints).
   Also detects special periods like Christmas.
   ═══════════════════════════════════════════════════════ */

import { useMemo } from "react";

export type Season = "spring" | "summer" | "autumn" | "winter" | "christmas";

interface SeasonTheme {
  season: Season;
  label: string;
  emoji: string;
  accentHex: string;
  accentClass: string;       // Tailwind text color
  glowClass: string;         // Tailwind bg for glow orbs
  gradientClass: string;     // Tailwind gradient
  particleColor: string;     // CSS color for decorative particles
}

const SEASON_THEMES: Record<Season, Omit<SeasonTheme, "season">> = {
  spring: {
    label: "Printemps",
    emoji: "🌸",
    accentHex: "#f472b6",
    accentClass: "text-pink-400",
    glowClass: "bg-pink-500/5",
    gradientClass: "from-pink-950/20 via-slate-950 to-green-950/20",
    particleColor: "#f9a8d4",
  },
  summer: {
    label: "Été",
    emoji: "☀️",
    accentHex: "#fbbf24",
    accentClass: "text-amber-400",
    glowClass: "bg-amber-500/5",
    gradientClass: "from-amber-950/20 via-slate-950 to-cyan-950/10",
    particleColor: "#fcd34d",
  },
  autumn: {
    label: "Automne",
    emoji: "🍂",
    accentClass: "text-orange-400",
    accentHex: "#fb923c",
    glowClass: "bg-orange-500/5",
    gradientClass: "from-orange-950/20 via-slate-950 to-amber-950/20",
    particleColor: "#fdba74",
  },
  winter: {
    label: "Hiver",
    emoji: "❄️",
    accentHex: "#93c5fd",
    accentClass: "text-blue-300",
    glowClass: "bg-blue-500/5",
    gradientClass: "from-blue-950/20 via-slate-950 to-slate-900",
    particleColor: "#bfdbfe",
  },
  christmas: {
    label: "Noël",
    emoji: "🎄",
    accentHex: "#4ade80",
    accentClass: "text-green-400",
    glowClass: "bg-green-500/5",
    gradientClass: "from-green-950/20 via-slate-950 to-red-950/10",
    particleColor: "#86efac",
  },
};

function detectSeason(date: Date): Season {
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // Christmas: Dec 20 – Jan 2
  if ((month === 11 && day >= 20) || (month === 0 && day <= 2)) {
    return "christmas";
  }

  // Spring: Mar 20 – Jun 20
  if ((month === 2 && day >= 20) || month === 3 || month === 4 || (month === 5 && day < 20)) {
    return "spring";
  }

  // Summer: Jun 20 – Sep 22
  if ((month === 5 && day >= 20) || month === 6 || month === 7 || (month === 8 && day < 22)) {
    return "summer";
  }

  // Autumn: Sep 22 – Dec 20
  if ((month === 8 && day >= 22) || month === 9 || month === 10 || (month === 11 && day < 20)) {
    return "autumn";
  }

  // Winter: Dec 21 – Mar 19
  return "winter";
}

export function useSeason(manualSeason?: Season): SeasonTheme {
  const detected = detectSeason(new Date());
  const season = manualSeason ?? detected;

  return useMemo<SeasonTheme>(
    () => ({
      season,
      ...SEASON_THEMES[season],
    }),
    [season],
  );
}

export { SEASON_THEMES, detectSeason };
export type { SeasonTheme };
