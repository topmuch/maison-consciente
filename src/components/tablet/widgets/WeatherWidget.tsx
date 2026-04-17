"use client";

/* ═══════════════════════════════════════════════════════
   WeatherWidget — Temperature + description display

   Shows current weather conditions in a compact glass card.
   ═══════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudSun } from "lucide-react";

interface WeatherWidgetProps {
  weather?: {
    temp: number;
    code: number;
    desc: string;
    emoji: string;
  } | null;
}

function renderWeatherIcon(code: number, className: string) {
  if (code <= 1) return <Sun className={className} />;
  if (code <= 3) return <Cloud className={className} />;
  if (code <= 57) return <CloudRain className={className} />;
  if (code <= 77) return <CloudSnow className={className} />;
  if (code >= 95) return <CloudLightning className={className} />;
  return <CloudSun className={className} />;
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="glass rounded-2xl p-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
          {renderWeatherIcon(weather.code, "w-6 h-6 text-amber-400")}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif text-amber-200">{weather.temp}°C</span>
            <span className="text-sm text-slate-500">{weather.emoji}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{weather.desc}</p>
        </div>
      </div>
    </motion.div>
  );
}
