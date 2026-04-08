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
  const glowColor = accentColor === 'blue' ? 'from-blue-500/10' : 'from-amber-500/10';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-radial ${glowColor} to-transparent blur-[150px] opacity-30`} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-radial from-violet-500/10 to-transparent blur-[150px] opacity-20" />
      </div>

      {/* Top Bar */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition font-medium"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Retour</span>
          </button>

          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Zap size={14} className="text-amber-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Démo Interactive
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">En ligne</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-white tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </motion.div>
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-white/[0.05] bg-slate-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-[10px] sm:text-xs text-slate-600">
          <div>&copy; 2025 Maellis — Maison Consciente</div>
          <div>Démonstration &bull; Aucune donnée réelle</div>
        </div>
      </footer>
    </div>
  );
}
