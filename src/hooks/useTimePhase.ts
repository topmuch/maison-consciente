'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

/* ═══════════════════════════════════════════════════════
   useTimePhase — Detects current time-of-day phase
   
   4 phases:
   - morning  (06:00–09:30) : energetic, amber/gold
   - day      (09:30–18:00) : neutral/professional, slate/cyan
   - evening  (18:00–22:30) : warm/chaleureux, orange/copper
   - night    (22:30–06:00) : minimaliste/veille, indigo/dark
   
   Updates every 60s via setInterval (cleaned on unmount).
   ═══════════════════════════════════════════════════════ */

export type TimePhase = 'morning' | 'day' | 'evening' | 'night';

interface PhaseConfig {
  phase: TimePhase;
  label: string;
  greeting: string;
  themeColor: string;         // Tailwind text color
  iconBg: string;             // Tailwind bg for icon containers
  iconColor: string;          // Tailwind text color for icons
  bgGradient: string;         // CSS gradient for card background
  glowColor: string;          // Tailwind color for blurred glow orbs
  cardBorder: string;         // Tailwind border color
  actionBg: string;           // Tailwind bg for action button
  actionText: string;         // Tailwind text for action button
  actionBorder: string;       // Tailwind border for action button
}

const PHASE_CONFIGS: Record<TimePhase, Omit<PhaseConfig, 'phase'>> = {
  morning: {
    label: 'Matin',
    greeting: 'Bonjour',
    themeColor: 'text-amber-300',
    iconBg: 'bg-amber-400/10',
    iconColor: 'text-amber-400',
    bgGradient: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(245,158,11,0.02) 100%)',
    glowColor: 'bg-amber-400/[0.06]',
    cardBorder: 'border-amber-400/15',
    actionBg: 'bg-amber-400/10 hover:bg-amber-400/15',
    actionText: 'text-amber-300',
    actionBorder: 'border-amber-400/20',
  },
  day: {
    label: 'Journée',
    greeting: 'Bonne journée',
    themeColor: 'text-cyan-300',
    iconBg: 'bg-cyan-400/10',
    iconColor: 'text-cyan-400',
    bgGradient: 'linear-gradient(135deg, rgba(34,211,238,0.04) 0%, rgba(34,211,238,0.01) 100%)',
    glowColor: 'bg-cyan-400/[0.04]',
    cardBorder: 'border-cyan-400/10',
    actionBg: 'bg-cyan-400/10 hover:bg-cyan-400/15',
    actionText: 'text-cyan-300',
    actionBorder: 'border-cyan-400/15',
  },
  evening: {
    label: 'Soir',
    greeting: 'Bonsoir',
    themeColor: 'text-orange-300',
    iconBg: 'bg-orange-400/10',
    iconColor: 'text-orange-400',
    bgGradient: 'linear-gradient(135deg, rgba(251,146,60,0.06) 0%, rgba(251,146,60,0.02) 100%)',
    glowColor: 'bg-orange-400/[0.06]',
    cardBorder: 'border-orange-400/15',
    actionBg: 'bg-orange-400/10 hover:bg-orange-400/15',
    actionText: 'text-orange-300',
    actionBorder: 'border-orange-400/20',
  },
  night: {
    label: 'Nuit',
    greeting: 'Bonne nuit',
    themeColor: 'text-indigo-300',
    iconBg: 'bg-indigo-400/10',
    iconColor: 'text-indigo-400',
    bgGradient: 'linear-gradient(135deg, rgba(129,140,248,0.05) 0%, rgba(129,140,248,0.01) 100%)',
    glowColor: 'bg-indigo-400/[0.04]',
    cardBorder: 'border-indigo-400/10',
    actionBg: 'bg-indigo-400/10 hover:bg-indigo-400/15',
    actionText: 'text-indigo-300',
    actionBorder: 'border-indigo-400/15',
  },
};

function detectPhase(hour: number, minute: number): TimePhase {
  const t = hour * 100 + minute;

  if (t >= 600 && t < 930) return 'morning';
  if (t >= 930 && t < 1800) return 'day';
  if (t >= 1800 && t < 2230) return 'evening';
  return 'night';
}

export function useTimePhase(): PhaseConfig {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Update every 60 seconds
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  const phase = detectPhase(now.getHours(), now.getMinutes());

  return useMemo<PhaseConfig>(() => ({
    phase,
    ...PHASE_CONFIGS[phase],
  }), [phase]);
}

export { PHASE_CONFIGS, detectPhase };
export type { PhaseConfig };
