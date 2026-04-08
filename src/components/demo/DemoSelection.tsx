'use client';

import { motion } from 'framer-motion';
import {
  Home,
  Briefcase,
  Wifi,
  Utensils,
  Shield,
  MapPin,
  Newspaper,
  Star,
  Users,
  Sun,
  ChevronRight,
} from 'lucide-react';

interface DemoSelectionProps {
  onSelectParticulier: () => void;
  onSelectAirbnb: () => void;
}

const particulierFeatures = [
  { icon: Users, text: 'Gestion familiale & enfants', color: 'bg-blue-500' },
  { icon: Shield, text: 'Alertes Santé & SOS', color: 'bg-purple-500' },
  { icon: Utensils, text: 'Assistant Cuisine & Recettes', color: 'bg-pink-500' },
  { icon: Newspaper, text: 'News, Météo & Horoscope', color: 'bg-orange-500' },
];

const airbnbFeatures = [
  { icon: Sun, text: 'Check-in/out Automatisé', color: 'bg-amber-500' },
  { icon: Wifi, text: 'Guide Maison & WiFi QR', color: 'bg-orange-500' },
  { icon: MapPin, text: 'Conciergerie & Activités', color: 'bg-red-500' },
  { icon: Star, text: 'Support Urgent & Partenaires', color: 'bg-pink-500' },
];

export function DemoSelection({ onSelectParticulier, onSelectAirbnb }: DemoSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 sm:mb-16"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sun className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
            Maellis
          </h1>
        </div>
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
          Découvrez notre assistant intelligent en action. Choisissez votre expérience de démonstration.
        </p>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 w-full max-w-5xl">
        {/* Card 1: Particulier / Famille */}
        <motion.button
          onClick={onSelectParticulier}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className="group relative text-left bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-blue-300"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50 opacity-50 group-hover:opacity-70 transition-opacity" />

          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white shadow-lg">
                <Home size={28} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Version Famille</h2>
                <p className="text-blue-600 font-medium text-sm">Pour la maison &amp; le quotidien</p>
              </div>
            </div>

            <ul className="space-y-3 text-slate-700 mb-6 sm:mb-8">
              {particulierFeatures.map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <div className={`w-2 h-2 ${f.color} rounded-full`} />
                  {f.text}
                </li>
              ))}
            </ul>

            <div className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:from-blue-600 group-hover:to-purple-700 rounded-xl font-bold text-white text-center transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
              Essayer la Démo Famille
              <ChevronRight size={18} />
            </div>
          </div>
        </motion.button>

        {/* Card 2: Airbnb / Hôte */}
        <motion.button
          onClick={onSelectAirbnb}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className="group relative text-left bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-amber-300"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-red-50 opacity-50 group-hover:opacity-70 transition-opacity" />

          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl text-white shadow-lg">
                <Briefcase size={28} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Version Hôte</h2>
                <p className="text-amber-600 font-medium text-sm">Pour Airbnb &amp; Locations</p>
              </div>
            </div>

            <ul className="space-y-3 text-slate-700 mb-6 sm:mb-8">
              {airbnbFeatures.map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <div className={`w-2 h-2 ${f.color} rounded-full`} />
                  {f.text}
                </li>
              ))}
            </ul>

            <div className="w-full py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-600 group-hover:from-amber-600 group-hover:to-orange-700 rounded-xl font-bold text-white text-center transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
              Essayer la Démo Hôte
              <ChevronRight size={18} />
            </div>
          </div>
        </motion.button>
      </div>

      {/* Bottom note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 sm:mt-12 text-slate-500 text-sm flex items-center gap-2"
      >
        <span className="animate-pulse w-2 h-2 bg-green-500 rounded-full" />
        Toutes les données affichées sont simulées pour la démonstration.
      </motion.p>
    </div>
  );
}
