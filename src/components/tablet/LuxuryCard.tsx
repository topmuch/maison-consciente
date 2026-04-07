'use client';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — LuxuryCard (Tablet Wahoo)
   
   Glassmorphism card for tablet display with animated
   entrance, themed accents, and touch-friendly sizing.
   ═══════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/* ── Types ── */

interface LuxuryCardProps {
  title: string;
  subtitle: string;
  accent?: 'amber' | 'indigo' | 'rose' | 'emerald';
  children: ReactNode;
  className?: string;
}

/* ── Accent config ── */

const accentMap = {
  amber: {
    border: 'border-amber-500/20 hover:border-amber-500/40',
    title: 'text-amber-100',
    shadow: 'hover:shadow-amber-500/5',
  },
  indigo: {
    border: 'border-indigo-500/20 hover:border-indigo-500/40',
    title: 'text-indigo-100',
    shadow: 'hover:shadow-indigo-500/5',
  },
  rose: {
    border: 'border-rose-500/20 hover:border-rose-500/40',
    title: 'text-rose-100',
    shadow: 'hover:shadow-rose-500/5',
  },
  emerald: {
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    title: 'text-emerald-100',
    shadow: 'hover:shadow-emerald-500/5',
  },
} as const;

/* ── Component ── */

export default function LuxuryCard({
  title,
  subtitle,
  accent = 'amber',
  children,
  className = '',
}: LuxuryCardProps) {
  const colors = accentMap[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className={`
        bg-white/5 backdrop-blur-2xl border ${colors.border}
        rounded-3xl p-6 flex flex-col
        transition-all duration-300 shadow-lg ${colors.shadow}
        ${className}
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <h2 className={`text-2xl font-serif ${colors.title}`}>{title}</h2>
        <span className="text-sm font-medium text-slate-400 bg-white/5 px-3 py-1 rounded-full">
          {subtitle}
        </span>
      </div>
      {children}
    </motion.div>
  );
}
