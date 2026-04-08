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
      ? 'from-blue-500 to-purple-600'
      : 'from-amber-500 to-orange-600';

  const badgeClass =
    accentColor === 'blue'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-amber-100 text-amber-800 border-amber-200';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Top Bar */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition font-medium"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Retour</span>
          </button>

          <div
            className={`px-3 sm:px-4 py-1.5 rounded-full ${badgeClass} border flex items-center gap-2 text-xs sm:text-sm font-medium`}
          >
            <Zap size={14} className="animate-pulse" />
            <span className="hidden xs:inline">MODE DÉMO — DONNÉES SIMULÉES</span>
            <span className="xs:hidden">DÉMO</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="hidden sm:inline">Démo active</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 sm:mb-8"
        >
          <h1
            className={`text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent mb-2`}
          >
            {title}
          </h1>
          {subtitle && <p className="text-base sm:text-lg text-slate-600">{subtitle}</p>}
        </motion.div>

        {/* Demo Content */}
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs sm:text-sm text-slate-500">
          <div>&copy; 2025 Maellis — Maison Consciente</div>
          <div>Démonstration interactive &bull; Aucune donnée réelle</div>
        </div>
      </footer>
    </div>
  );
}
