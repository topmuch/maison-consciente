"use client";

/* ═══════════════════════════════════════════════════════
   ClockWidget — Header clock, greeting, date, weather, branding

   Extracted from the tablet display page.
   This is the "hero" widget at the top of the tablet screen.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTimePhase } from "@/hooks/useTimePhase";
import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudSun,
  Wifi, WifiOff, RefreshCw,
} from "lucide-react";

interface ClockWidgetProps {
  householdName?: string;
  weather?: {
    temp: number;
    code: number;
    desc: string;
    emoji: string;
  } | null;
  online: boolean;
  onRefresh?: () => void;
}

function weatherCodeToEmoji(code: number): string {
  if (code <= 1) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌧️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code >= 95) return "⛈️";
  return "⛅";
}

function renderWeatherIcon(code: number, className: string) {
  if (code <= 1) return <Sun className={className} />;
  if (code <= 3) return <Cloud className={className} />;
  if (code <= 57) return <CloudRain className={className} />;
  if (code <= 77) return <CloudSnow className={className} />;
  if (code >= 95) return <CloudLightning className={className} />;
  return <CloudSun className={className} />;
}

export function ClockWidget({
  householdName,
  weather,
  online,
  onRefresh,
}: ClockWidgetProps) {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const timePhase = useTimePhase();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = currentTime.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const weatherIconCode = weather?.code ?? 2;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }}
      className="pt-8 pb-6 border-b border-white/[0.06]"
    >
      {/* Top row: Clock + Status */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-7xl md:text-8xl font-serif font-light text-amber-100 tracking-tight leading-none tabular-nums">
            {timeStr}
          </h1>
          <p className="text-base md:text-lg text-slate-400 mt-2 font-light">
            {timePhase.greeting} &middot;{" "}
            <span className="capitalize">{dateStr}</span>
          </p>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2 mt-1">
          <motion.div
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              online
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {online ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
          </motion.div>

          {onRefresh && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onRefresh}
              className="p-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Rafraîchir"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Weather + Branding row */}
      <div className="flex items-center justify-between mt-5">
        {weather && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              {renderWeatherIcon(weatherIconCode, "w-5 h-5 text-amber-400")}
            </div>
            <div>
              <p className="text-xl font-serif text-amber-200">
                {weather.temp}°C
              </p>
              <p className="text-xs text-slate-500">{weather.desc}</p>
            </div>
          </div>
        )}

        {/* Maellis branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <motion.span
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="text-amber-400/40 text-sm"
          >
            ◆
          </motion.span>
          <span className="font-serif text-gradient-gold text-lg tracking-wider">
            Maellis
          </span>
          <motion.span
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="text-amber-400/40 text-sm"
          >
            ◆
          </motion.span>
        </motion.div>

        {householdName && (
          <p className="text-xs text-slate-600 font-serif">
            {householdName}
          </p>
        )}
      </div>
    </motion.header>
  );
}
