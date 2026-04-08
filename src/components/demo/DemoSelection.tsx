'use client';

import { motion } from 'framer-motion';
import {
  Home, Briefcase, Wifi, Utensils, Shield, MapPin, Sun, ChevronRight,
  Newspaper, Star, Users, QrCode,
} from 'lucide-react';

interface DemoSelectionProps {
  onSelectParticulier: () => void;
  onSelectAirbnb: () => void;
}

const particulierFeatures = [
  { icon: Newspaper, text: 'News France Info & Le Monde', color: 'text-blue-400' },
  { icon: Star, text: 'Horoscope 12 signes complet', color: 'text-purple-400' },
  { icon: Shield, text: 'Santé, SOS & Médicaments', color: 'text-rose-400' },
  { icon: Utensils, text: 'Recettes pas-à-pas vocales', color: 'text-orange-400' },
  { icon: QrCode, text: 'Zones & QR Codes', color: 'text-cyan-400' },
  { icon: Users, text: 'Mur familial & Bien-être', color: 'text-emerald-400' },
];

const airbnbFeatures = [
  { icon: Sun, text: 'Check-in/out automatisé', color: 'text-amber-400' },
  { icon: Wifi, text: 'QR Code WiFi & Jetons d\'accès', color: 'text-cyan-400' },
  { icon: MapPin, text: 'Guide local & Activités partenaires', color: 'text-emerald-400' },
  { icon: Shield, text: 'SOS, Support & Feedback', color: 'text-rose-400' },
  { icon: Star, text: 'Smart Review & Journal', color: 'text-violet-400' },
  { icon: QrCode, text: 'QR Code viral Scan & Continue', color: 'text-amber-400' },
];

export function DemoSelection({ onSelectParticulier, onSelectAirbnb }: DemoSelectionProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-amber-500/8 to-transparent blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-radial from-violet-500/6 to-transparent blur-[130px]" />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Sun className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-serif text-gradient-gold text-lg">Maellis</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Demo</span>
          </div>
        </div>
      </motion.nav>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight mb-3">
            Choisissez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">expérience</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
            Découvrez Maellis à travers deux scénarios complets et immersifs.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 w-full max-w-5xl">
          {/* Card Particulier */}
          <motion.button
            onClick={onSelectParticulier}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            className="group text-left bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 overflow-hidden hover:border-blue-500/30 hover:shadow-[0_0_50px_rgba(59,130,246,0.08)] transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-violet-500/0 group-hover:from-blue-500/5 group-hover:to-violet-500/5 transition-all duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Home className="w-7 h-7 text-blue-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-white mb-1">Démo Famille</h2>
              <p className="text-xs text-slate-500 mb-5">Tablette connectée — 15 rubriques interactives</p>
              <ul className="space-y-2 mb-6">
                {particulierFeatures.map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5 text-xs text-slate-400">
                    <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
                    {f.text}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 group-hover:gap-3 transition-all">
                Explorer <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>

          {/* Card Airbnb */}
          <motion.button
            onClick={onSelectAirbnb}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            className="group text-left bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 overflow-hidden hover:border-amber-500/30 hover:shadow-[0_0_50px_rgba(245,158,11,0.08)] transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/5 transition-all duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Briefcase className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-white mb-1">Démo Hôte Airbnb</h2>
              <p className="text-xs text-slate-500 mb-5">Expérience voyageur — 14 rubriques interactives</p>
              <ul className="space-y-2 mb-6">
                {airbnbFeatures.map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5 text-xs text-slate-400">
                    <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
                    {f.text}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 group-hover:gap-3 transition-all">
                Explorer <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-[10px] text-slate-600">
          Toutes les données affichées sont simulées. Aucune donnée personnelle réelle n&apos;est utilisée.
        </motion.p>
      </div>
    </div>
  );
}
