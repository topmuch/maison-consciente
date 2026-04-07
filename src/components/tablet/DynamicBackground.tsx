"use client";

/* ═══════════════════════════════════════════════════════
   DynamicBackground — Phase & Weather Wallpaper Engine

   Selects HD backgrounds based on time-of-day phase and
   weather conditions. Smooth crossfade transitions via
   Framer Motion. Graceful fallback to gradient when
   images are missing (offline mode).
   ═══════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TimePhase } from "@/hooks/useTimePhase";

interface Props {
  weatherCondition?: string;
  phase?: TimePhase;
}

const WALLPAPERS: Record<string, string[]> = {
  morning: ["/backgrounds/morning-1.jpg", "/backgrounds/morning-2.jpg"],
  day: ["/backgrounds/day-1.jpg", "/backgrounds/day-2.jpg"],
  evening: ["/backgrounds/evening-1.jpg", "/backgrounds/evening-2.jpg"],
  night: ["/backgrounds/night-1.jpg", "/backgrounds/night-2.jpg"],
  rain: ["/backgrounds/rain-1.jpg", "/backgrounds/rain-2.jpg"],
  snow: ["/backgrounds/snow-1.jpg"],
  default: ["/backgrounds/default.jpg"],
};

/** Phase-aware gradient fallbacks when images are unavailable */
const PHASE_GRADIENTS: Record<string, string> = {
  morning: "from-amber-950 via-slate-950 to-orange-950",
  day: "from-slate-900 via-cyan-950/30 to-slate-950",
  evening: "from-orange-950 via-slate-950 to-rose-950",
  night: "from-indigo-950 via-slate-950 to-slate-900",
  rain: "from-slate-800 via-slate-900 to-slate-800",
  snow: "from-slate-700 via-blue-950/20 to-slate-800",
  default: "from-slate-950 via-slate-900 to-slate-950",
};

function pickBackground(weatherCondition: string, phase: TimePhase): { category: string; path: string } {
  const wc = weatherCondition.toLowerCase();

  let category: string = phase;

  if (
    wc.includes("pluie") ||
    wc.includes("rain") ||
    wc.includes("bruine") ||
    wc.includes("averse") ||
    wc.includes("drizzle")
  ) {
    category = "rain";
  } else if (
    wc.includes("neige") ||
    wc.includes("snow") ||
    wc.includes("grésil") ||
    wc.includes("sleet")
  ) {
    category = "snow";
  }

  const pool = WALLPAPERS[category] ?? WALLPAPERS[phase] ?? WALLPAPERS.default;
  const path = pool[Math.floor(Math.random() * pool.length)];

  return { category, path };
}

export default function DynamicBackground({ weatherCondition = "", phase = "day" }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  const { category, path } = useMemo(
    () => pickBackground(weatherCondition, phase),
    [weatherCondition, phase],
  );

  const gradientClass = PHASE_GRADIENTS[category] ?? PHASE_GRADIENTS.default;

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950" key={category}>
      {/* Photo Background */}
      {!imgFailed ? (
        <AnimatePresence mode="wait">
          <motion.img
            key={path}
            src={path}
            alt=""
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="w-full h-full object-cover will-change-transform"
            onError={() => setImgFailed(true)}
          />
        </AnimatePresence>
      ) : (
        /* Gradient Fallback */
        <div className={`absolute inset-0 bg-gradient-to-b ${gradientClass}`} />
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/30 pointer-events-none" />
    </div>
  );
}
