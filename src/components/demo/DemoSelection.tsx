'use client';

import { motion } from 'framer-motion';
import { Home, Building2, ChevronRight, Sparkles } from 'lucide-react';

interface DemoSelectionProps {
  onSelectParticulier: () => void;
  onSelectAirbnb: () => void;
}

export function DemoSelection({ onSelectParticulier, onSelectAirbnb }: DemoSelectionProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-amber-50 text-slate-800 overflow-x-hidden relative">
      {/* Subtle decorative blur circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] rounded-full bg-amber-200 blur-[180px] opacity-30" />
        <div className="absolute bottom-1/3 right-1/5 w-[400px] h-[400px] rounded-full bg-indigo-200 blur-[160px] opacity-25" />
        <div className="absolute top-2/3 right-1/4 w-[300px] h-[300px] rounded-full bg-rose-100 blur-[140px] opacity-20" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-20">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12 sm:mb-14 max-w-2xl"
        >
          <div className="flex items-center justify-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-[11px] font-semibold text-amber-600/80 uppercase tracking-[0.15em]">
              Expérience interactive
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight mb-5 text-slate-800">
            Choisissez votre{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400">
              expérience
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
            Découvrez Maellis à travers deux démonstrations complètes et immersives.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Famille Card */}
          <motion.button
            onClick={onSelectParticulier}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            whileHover={{
              y: -8,
              boxShadow: '0 25px 60px -12px rgba(99, 102, 241, 0.18)',
            }}
            whileTap={{ scale: 0.98 }}
            className="group relative text-left bg-white rounded-3xl p-6 sm:p-8 overflow-hidden border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors duration-500"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Home className="w-7 h-7 text-indigo-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-slate-800 mb-2">
                Démo Famille
              </h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Tablette connectée Famille Martin — 15 rubriques interactives pour explorer toutes les fonctionnalités.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 group-hover:gap-3 transition-all duration-300">
                Explorer <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>

          {/* Airbnb Card */}
          <motion.button
            onClick={onSelectAirbnb}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
            whileHover={{
              y: -8,
              boxShadow: '0 25px 60px -12px rgba(245, 158, 11, 0.18)',
            }}
            whileTap={{ scale: 0.98 }}
            className="group relative text-left bg-white rounded-3xl p-6 sm:p-8 overflow-hidden border border-slate-200 shadow-sm hover:border-amber-300 transition-colors duration-500"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-7 h-7 text-amber-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-slate-800 mb-2">
                Démo Hôte Airbnb
              </h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Expérience voyageur Villa Azur — QR viral, activités locales, check-in et bien plus encore.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 group-hover:gap-3 transition-all duration-300">
                Explorer <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-[11px] text-slate-400 tracking-wide"
        >
          Données simulées — Aucune donnée personnelle réelle.
        </motion.p>
      </div>
    </div>
  );
}
