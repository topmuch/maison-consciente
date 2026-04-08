'use client';

import { motion } from 'framer-motion';
import { Home, Building2, ChevronRight, Sparkles, Wifi, Users, Newspaper, Star, Phone, Shield, MessageCircle, ChefHat, MapPin } from 'lucide-react';

interface DemoSelectionProps {
  onSelectParticulier: () => void;
  onSelectAirbnb: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function DemoSelection({ onSelectParticulier, onSelectAirbnb }: DemoSelectionProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 overflow-x-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.07]" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.05]" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-serif text-amber-400/80">Maellis Demo</span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Interactive</span>
          </div>
        </div>
      </motion.nav>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16">
        {/* Title */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="text-center mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-slate-500 uppercase tracking-wider mb-4">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Expérience interactive
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight mb-4">
            Choisissez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">expérience</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
            Découvrez Maellis à travers deux scénarios concrets. 
            Explorez l&apos;interface comme si vous étiez chez vous.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl">
          {/* Famille Card */}
          <motion.button
            onClick={onSelectParticulier}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative text-left bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-3xl p-6 sm:p-8 overflow-hidden transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_0_40px_rgba(245,158,11,0.1)]"
          >
            {/* Hover glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/5 transition-all duration-500" />

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Home className="w-7 h-7 text-amber-400" />
              </div>

              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-white mb-2">
                Démo Famille
              </h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Découvrez la tablette connectée de la famille Martin : news, horoscope, rappels et assistant vocal.
              </p>

              {/* Features list */}
              <div className="space-y-2.5 mb-6">
                {[
                  { icon: Newspaper, text: 'Actualités France Info & Le Monde' },
                  { icon: Star, text: 'Horoscope détaillé avec tous les signes' },
                  { icon: Users, text: 'Rappels & listes de courses' },
                  { icon: Wifi, text: 'FAQ Maison & recettes' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-400">
                    <f.icon className="w-3.5 h-3.5 text-amber-500/60" />
                    {f.text}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 group-hover:gap-3 transition-all">
                Explorer la démo famille
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>

          {/* Airbnb Card */}
          <motion.button
            onClick={onSelectAirbnb}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative text-left bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-3xl p-6 sm:p-8 overflow-hidden transition-all duration-500 hover:border-blue-500/30 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]"
          >
            {/* Hover glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-500" />

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-7 h-7 text-blue-400" />
              </div>

              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-white mb-2">
                Démo Hôte Airbnb
              </h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Vivez l&apos;expérience voyageur à la Villa Azur, Nice : QR Code WiFi, activités et services.
              </p>

              {/* Features list */}
              <div className="space-y-2.5 mb-6">
                {[
                  { icon: Wifi, text: 'QR Code WiFi dynamique' },
                  { icon: MapPin, text: 'Activités locales & réservation' },
                  { icon: ChefHat, text: 'Services premium (chef, ménage)' },
                  { icon: Shield, text: 'SOS Urgence & contacts' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-400">
                    <f.icon className="w-3.5 h-3.5 text-blue-500/60" />
                    {f.text}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 group-hover:gap-3 transition-all">
                Explorer la démo Airbnb
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Bottom note */}
        <motion.p
          {...fadeUp}
          transition={{ delay: 0.5 }}
          className="mt-10 text-[10px] text-slate-600 text-center max-w-md"
        >
          Toutes les données affichées sont simulées pour la démonstration. Aucune donnée personnelle réelle n&apos;est utilisée.
        </motion.p>
      </div>
    </div>
  );
}
