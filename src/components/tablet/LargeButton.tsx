'use client';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — LargeButton (Tablet Wahoo)
   
   Oversized touch-friendly button with gradient background,
   icon container, and tactile press feedback.
   min-h-[96px] for 1m-distance interaction on tablets.
   ═══════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/* ── Types ── */

interface LargeButtonProps {
  icon: ReactNode;
  label: string;
  sublabel: string;
  gradient?: string;
  onClick: () => void;
  className?: string;
}

/* ── Component ── */

export default function LargeButton({
  icon,
  label,
  sublabel,
  gradient = 'from-amber-900/40 to-amber-800/20',
  onClick,
  className = '',
}: LargeButtonProps) {
  return (
    <motion.button
      whileHover={{ brightness: 1.1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        w-full bg-gradient-to-br ${gradient}
        backdrop-blur-xl border border-white/10
        rounded-3xl p-6 flex items-center gap-5 text-left
        transition-all hover:brightness-110 active:scale-[0.97]
        shadow-lg min-h-[96px]
        ${className}
      `}
    >
      <div className="p-4 bg-white/10 rounded-2xl text-white shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-2xl font-serif text-white truncate">{label}</h3>
        <p className="text-base text-slate-300 mt-1 truncate">{sublabel}</p>
      </div>
    </motion.button>
  );
}
