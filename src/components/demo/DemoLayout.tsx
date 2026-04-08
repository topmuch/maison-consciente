'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap } from 'lucide-react';

interface DemoLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  accentColor: 'blue' | 'amber';
  onBack: () => void;
}

export function DemoLayout({ children, title, subtitle, accentColor, onBack }: DemoLayoutProps) {
  const gradientClass =
    accentColor === 'blue'
      ? 'from-blue-400 via-indigo-400 to-purple-400'
      : 'from-amber-400 via-orange-400 to-red-400';

  const glowClass =
    accentColor === 'blue'
      ? 'shadow-[0_0_30px_rgba(99,102,241,0.15)]'
      : 'shadow-[0_0_30px_rgba(245,158,11,0.15)]';

  const badgeClass =
    accentColor === 'blue'
      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
      : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 overflow-x-hidden">
      {/* Subtle background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[180px] opacity-[0.04]" style={{ background: accentColor === 'blue' ? '#6366f1' : '#f59e0b' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[150px] opacity-[0.03]" style={{ background: accentColor === 'blue' ? '#8b5cf6' : '#ef4444' }} />
      </div>

      {/* Top Bar */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06]"
          >
            <ArrowLeft size={16} />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Retour</span>
          </button>

          <div className={`px-3 py-1.5 rounded-full ${badgeClass} border flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider`}>
            <Zap size={12} className="animate-pulse" />
            <span className="hidden xs:inline">Mode Démo</span>
            <span className="xs:hidden">Démo</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Données simulées</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 sm:mb-6"
        >
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-serif font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent mb-1 ${glowClass}`}>
            {title}
          </h1>
          {subtitle && <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>}
        </motion.div>
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto py-3 sm:py-4 border-t border-white/[0.05] bg-[#020617]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between text-[10px] sm:text-xs text-slate-600">
          <div>&copy; 2025 Maellis — Maison Consciente</div>
          <div>Démonstration interactive</div>
        </div>
      </footer>
    </div>
  );
}
