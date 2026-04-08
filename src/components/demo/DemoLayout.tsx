'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

interface DemoLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  onBack: () => void;
}

export function DemoLayout({ children, title, subtitle, onBack }: DemoLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 overflow-x-hidden">
      {/* Top status bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400 hidden sm:inline">Retour</span>
            </motion.button>
          </div>

          {/* Demo badge */}
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-400">
              Mode Démo &mdash; Données Simulées
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Démo active
          </div>
        </div>
      </motion.div>

      {/* Demo title bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-b from-amber-500/[0.03] to-transparent border-b border-white/[0.04]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl sm:text-2xl font-serif font-semibold text-white">{title}</h1>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
      </motion.div>

      {/* Content area */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 border-t border-white/[0.05] bg-[#020617]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <p className="text-[10px] text-slate-600">
            &copy; 2025 Maellis &mdash; Maison Consciente
          </p>
          <p className="text-[10px] text-slate-600">
            Démonstration interactive &bull; Aucune donnée réelle
          </p>
        </div>
      </footer>
    </div>
  );
}
