'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap } from 'lucide-react';

interface DemoLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  accentColor: 'blue' | 'amber' | 'indigo' | 'rose';
  onBack: () => void;
}

export function DemoLayout({ children, title, subtitle, accentColor, onBack }: DemoLayoutProps) {
  const gradientClass: Record<string, string> = {
    blue: 'from-blue-500 via-blue-400 to-indigo-500',
    amber: 'from-amber-500 via-orange-400 to-rose-400',
    indigo: 'from-indigo-500 via-violet-400 to-purple-500',
    rose: 'from-rose-500 via-pink-400 to-fuchsia-400',
  };

  const badgeClass: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  const glowColor: Record<string, string> = {
    blue: 'bg-blue-200',
    amber: 'bg-amber-200',
    indigo: 'bg-indigo-200',
    rose: 'bg-rose-200',
  };

  const secondaryGlowColor: Record<string, string> = {
    blue: 'bg-indigo-100',
    amber: 'bg-orange-100',
    indigo: 'bg-violet-100',
    rose: 'bg-pink-100',
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-800 overflow-x-hidden relative">
      {/* Subtle background blur circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full ${glowColor[accentColor]} blur-[180px] opacity-25`} />
        <div className={`absolute bottom-1/4 right-1/5 w-[400px] h-[400px] rounded-full ${secondaryGlowColor[accentColor]} blur-[160px] opacity-20`} />
      </div>

      {/* Top Bar */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors duration-200 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Retour</span>
          </button>

          {/* Demo badge */}
          <div className={`px-3 py-1.5 rounded-full ${badgeClass[accentColor]} border flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider`}>
            <Zap size={12} className="animate-pulse" />
            <span>Mode Démo</span>
          </div>

          {/* Simulated data indicator */}
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Données simulées</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
          className="mb-4 sm:mb-6"
        >
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-serif font-bold bg-gradient-to-r ${gradientClass[accentColor]} bg-clip-text text-transparent mb-1`}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>
          )}
        </motion.div>
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto py-3 sm:py-4 border-t border-slate-200 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
          <div>© 2025 Maellis — Maison Consciente</div>
          <div>Démonstration interactive</div>
        </div>
      </footer>
    </div>
  );
}
