'use client';

import { motion } from 'framer-motion';
import { Home, Building2, ChevronRight, Sparkles } from 'lucide-react';

interface DemoSelectionProps {
  onSelectParticulier: () => void;
  onSelectAirbnb: () => void;
}

export function DemoSelection({ onSelectParticulier, onSelectAirbnb }: DemoSelectionProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full blur-[180px] opacity-[0.06]" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.04]" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400/70 uppercase tracking-widest">Expérience interactive</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight mb-4">
            Choisissez votre{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-400">expérience</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
            Découvrez Maellis à travers deux scénarios concrets avec toutes les fonctionnalités.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl">
          {/* Famille Card */}
          <motion.button
            onClick={onSelectParticulier}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative text-left bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 overflow-hidden hover:border-indigo-500/30 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)] transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Home className="w-7 h-7 text-indigo-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-white mb-2">Démo Famille</h2>
              <p className="text-sm text-slate-400 mb-6">Tablette connectée Famille Martin : 15 rubriques interactives complètes.</p>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 group-hover:gap-3 transition-all">
                Explorer <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>

          {/* Airbnb Card */}
          <motion.button
            onClick={onSelectAirbnb}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative text-left bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 overflow-hidden hover:border-amber-500/30 hover:shadow-[0_0_40px_rgba(245,158,11,0.1)] transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/5 transition-all duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-white mb-2">Démo Hôte Airbnb</h2>
              <p className="text-sm text-slate-400 mb-6">Expérience voyageur Villa Azur : QR viral, activités, check-in, et plus.</p>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 group-hover:gap-3 transition-all">
                Explorer <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-10 text-[10px] text-slate-600">
          Données simulées — Aucune donnée personnelle réelle.
        </motion.p>
      </div>
    </div>
  );
}
