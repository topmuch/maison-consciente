'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  CloudSun,
  Cloud,
  Moon,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  CalendarClock,
  Thermometer,
  Wind,
  Droplets,
  Car,
  Bus,
  Leaf,
  Music,
  MessageSquare,
  ShoppingCart,
  ChefHat,
  Home,
  Bell,
} from 'lucide-react';
import { useTimePhase, type PhaseConfig } from '@/hooks/useTimePhase';
import type { TimePhase } from '@/hooks/useTimePhase';

/* ═══════════════════════════════════════════════════════
   ContextualWidget — "Infos Contextuelles du Jour"
   
   Phase-aware widget for tablet display.
   Adapts content, theme, and suggestions to time of day.
   Touch-friendly (min-h-[48px]), responsive, glassmorphism.
   ═══════════════════════════════════════════════════════ */

/* ─── Types ─── */

interface TabletContextData {
  phase: TimePhase;
  weather: {
    temperature: number;
    condition: string;
    high: number;
    low: number;
    icon: string;
  };
  message: string;
  action: {
    label: string;
    type: string;
    payload: string;
  };
  nextEvent: {
    title: string;
    time: string;
  } | null;
  householdStatus: {
    doors: 'locked' | 'unlocked';
    windows: 'closed' | 'open';
    alarm: 'armed' | 'disarmed';
  };
  extra: string[];
}

interface ContextualWidgetProps {
  /** Display token for fetching context data (token-based auth) */
  displayToken: string;
  /** Optional: callback when action button is pressed */
  onAction?: (action: TabletContextData['action']) => void;
}

/* ─── Icon helpers ─── */

function WeatherIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className ?? 'w-5 h-5';
  switch (icon) {
    case 'sun': return <Sun className={cls} />;
    case 'moon': return <Moon className={cls} />;
    case 'cloud-sun': return <CloudSun className={cls} />;
    default: return <Cloud className={cls} />;
  }
}

function ExtraIcon({ text }: { text: string }) {
  if (text.toLowerCase().includes('trafic') || text.toLowerCase().includes('bus')) {
    return text.toLowerCase().includes('bus') ? <Bus className="w-4 h-4 shrink-0" /> : <Car className="w-4 h-4 shrink-0" />;
  }
  if (text.toLowerCase().includes('air') || text.toLowerCase().includes('humid')) {
    return <Leaf className="w-4 h-4 shrink-0" />;
  }
  if (text.toLowerCase().includes('musique') || text.toLowerCase().includes('playlist')) {
    return <Music className="w-4 h-4 shrink-0" />;
  }
  if (text.toLowerCase().includes('message') || text.toLowerCase().includes('urgent')) {
    return <MessageSquare className="w-4 h-4 shrink-0" />;
  }
  if (text.toLowerCase().includes('course')) {
    return <ShoppingCart className="w-4 h-4 shrink-0" />;
  }
  if (text.toLowerCase().includes('consommation') || text.toLowerCase().includes('thermostat')) {
    return <Thermometer className="w-4 h-4 shrink-0" />;
  }
  if (text.toLowerCase().includes('porte') || text.toLowerCase().includes('volet') || text.toLowerCase().includes('capteur')) {
    return <Home className="w-4 h-4 shrink-0" />;
  }
  if (text.toLowerCase().includes('invité')) {
    return <Bell className="w-4 h-4 shrink-0" />;
  }
  return <ChevronRight className="w-4 h-4 shrink-0" />;
}

function PhaseIcon({ phase, className }: { phase: TimePhase; className?: string }) {
  const cls = className ?? 'w-6 h-6';
  switch (phase) {
    case 'morning': return <Sun className={cls} />;
    case 'day': return <CloudSun className={cls} />;
    case 'evening': return <Cloud className={cls} />;
    case 'night': return <Moon className={cls} />;
  }
}

/* ─── Animation variants ─── */

const widgetVariants = {
  hidden: { scale: 0.96, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    scale: 0.96,
    opacity: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

/* ─── Main Component ─── */

export function ContextualWidget({ displayToken, onAction }: ContextualWidgetProps) {
  const config: PhaseConfig = useTimePhase();
  const [context, setContext] = useState<TabletContextData | null>(null);
  const [loading, setLoading] = useState(true);

  /* ─── Fetch context data ─── */
  const fetchContext = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/display/${displayToken}/context`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.context) {
          setContext(data.context);
        }
      }
    } catch {
      // Silent fail — keep previous data or show nothing
    } finally {
      setLoading(false);
    }
  }, [displayToken]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // Re-fetch every 5 minutes to stay current
  useEffect(() => {
    const interval = setInterval(fetchContext, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchContext]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={config.phase}
        variants={widgetVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="glass rounded-2xl relative overflow-hidden"
        style={{ background: config.bgGradient }}
        touch-action="manipulation"
      >
        {/* Background glow orb */}
        <div className={`absolute top-0 right-0 w-40 h-40 rounded-full ${config.glowColor} blur-[80px] pointer-events-none`} />
        <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full ${config.glowColor} blur-[60px] pointer-events-none`} />

        <div className="relative z-10 p-5">
          {/* ─── Header: Phase + Greeting ─── */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center`}>
                <PhaseIcon phase={config.phase} className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${config.themeColor}`}>
                    {config.label}
                  </span>
                  <span className="text-[10px] text-[#475569] uppercase tracking-wider font-medium">
                    Infos du jour
                  </span>
                </div>
                <span className="text-[#64748b] text-xs">{config.greeting}</span>
              </div>
            </div>

            {/* Temperature badge */}
            {context?.weather && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.iconBg}`}>
                <WeatherIcon icon={context.weather.icon} className={`w-4 h-4 ${config.iconColor}`} />
                <span className={`text-sm font-medium ${config.themeColor}`}>
                  {context.weather.temperature}°C
                </span>
              </div>
            )}
          </div>

          {/* ─── Content ─── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${config.phase}-${context?.message ?? ''}`}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3"
            >
              {/* Contextual message */}
              {context?.message && (
                <p className="text-[#cbd5e1] text-sm leading-relaxed">
                  {context.message}
                </p>
              )}

              {/* Weather details row */}
              {context?.weather && (
                <div className="flex items-center gap-4 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>{context.weather.low}°/{context.weather.high}°</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{context.weather.condition}</span>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-white/5" />

              {/* Next event */}
              {context?.nextEvent && (
                <div className="flex items-center gap-3 min-h-[48px]">
                  <div className={`w-9 h-9 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0`}>
                    <CalendarClock className={`w-4 h-4 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#e2e8f0] text-sm font-medium truncate">
                      {context.nextEvent.title}
                    </p>
                    <p className="text-[#64748b] text-xs">{context.nextEvent.time}</p>
                  </div>
                </div>
              )}

              {/* Extra info items */}
              {context?.extra && context.extra.length > 0 && (
                <div className="space-y-1.5">
                  {context.extra.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04] min-h-[44px]"
                    >
                      <span className={config.iconColor}>
                        <ExtraIcon text={item} />
                      </span>
                      <span className="text-[#94a3b8] text-sm flex-1">{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Night mode: Security status */}
              {config.phase === 'night' && context?.householdStatus && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] min-h-[48px]">
                    {context.householdStatus.doors === 'locked'
                      ? <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                      : <Unlock className="w-4 h-4 text-amber-400 shrink-0" />
                    }
                    <span className="text-[#94a3b8] text-sm flex-1">Portes</span>
                    <span className={`text-xs font-medium ${context.householdStatus.doors === 'locked' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {context.householdStatus.doors === 'locked' ? 'Verrouillées' : 'Déverrouillées'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] min-h-[48px]">
                    {context.householdStatus.alarm === 'armed'
                      ? <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      : <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    }
                    <span className="text-[#94a3b8] text-sm flex-1">Alarme</span>
                    <span className={`text-xs font-medium ${context.householdStatus.alarm === 'armed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {context.householdStatus.alarm === 'armed' ? 'Armée' : 'Désactivée'}
                    </span>
                  </div>
                </div>
              )}

              {/* Divider before action */}
              <div className="h-px bg-white/5" />

              {/* Action button */}
              {context?.action && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onAction?.(context.action)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border ${config.actionBorder} ${config.actionBg} transition-all duration-200 min-h-[48px]`}
                >
                  <span className={`text-sm font-medium ${config.actionText}`}>
                    {context.action.label}
                  </span>
                  <ChevronRight className={`w-4 h-4 ${config.actionText} opacity-60`} />
                </motion.button>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Loading skeleton */}
          {loading && !context && (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-3/4 rounded bg-white/5" />
              <div className="h-3 w-1/2 rounded bg-white/5" />
              <div className="h-px bg-white/5" />
              <div className="h-12 w-full rounded-xl bg-white/5" />
              <div className="h-12 w-full rounded-xl bg-white/5" />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
