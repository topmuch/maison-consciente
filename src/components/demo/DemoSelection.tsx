'use client';

import { motion } from 'framer-motion';
import {
  Home,
  Building2,
  ChevronRight,
  Sparkles,
  Mic,
  QrCode,
  Shield,
  Utensils,
  Heart,
  MessageCircle,
  Wifi,
  Star,
  Sun,
} from 'lucide-react';
import { useMaellisVoice } from '@/hooks/useMaellisVoice';

interface DemoSelectionProps {
  onSelectParticulier: () => void;
  onSelectAirbnb: () => void;
}

/* ─── Animation Helpers ─── */
const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ═══════════════════════════════════════════════════════════════
   FLOATING FEATURE ICONS — Visual Wahoo Elements
   ═══════════════════════════════════════════════════════════════ */
const floatingIcons = [
  { icon: Wifi, color: 'text-blue-500', bg: 'bg-blue-50', x: '10%', y: '15%', delay: 0 },
  { icon: QrCode, color: 'text-violet-500', bg: 'bg-violet-50', x: '85%', y: '12%', delay: 0.5 },
  { icon: Shield, color: 'text-red-500', bg: 'bg-red-50', x: '8%', y: '75%', delay: 1 },
  { icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50', x: '88%', y: '70%', delay: 1.5 },
  { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50', x: '15%', y: '45%', delay: 0.8 },
  { icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', x: '82%', y: '42%', delay: 1.2 },
  { icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', x: '50%', y: '8%', delay: 0.3 },
  { icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-50', x: '92%', y: '88%', delay: 0.7 },
];

/* ═══════════════════════════════════════════════════════════════
   DEMO SELECTION — LUXE LUMINEUX
   ═══════════════════════════════════════════════════════════════ */
export function DemoSelection({ onSelectParticulier, onSelectAirbnb }: DemoSelectionProps) {
  const { speak, isSpeaking } = useMaellisVoice();

  const handleSelectParticulier = () => {
    speak('Bienvenue dans la démo Famille Martin. Découvrez votre assistant familial intelligent.');
    onSelectParticulier();
  };

  const handleSelectAirbnb = () => {
    speak('Bienvenue dans la démo Villa Azur à Nice. Découvrez votre concierge de voyage virtuel.');
    onSelectAirbnb();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-amber-50 text-slate-800 overflow-x-hidden relative">
      {/* ═══ Background decorative elements ═══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Main glow circles */}
        <div className="absolute top-1/4 left-1/6 w-[600px] h-[600px] rounded-full bg-amber-200 blur-[200px] opacity-25" />
        <div className="absolute bottom-1/3 right-1/5 w-[500px] h-[500px] rounded-full bg-indigo-200 blur-[180px] opacity-20" />
        <div className="absolute top-2/3 right-1/4 w-[350px] h-[350px] rounded-full bg-rose-100 blur-[160px] opacity-20" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-sky-100 blur-[140px] opacity-15" />
      </div>

      {/* ═══ Floating feature icons ═══ */}
      {floatingIcons.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: 1,
            y: [0, -12, 0],
          }}
          transition={{
            opacity: { duration: 4, repeat: Infinity, delay: item.delay },
            scale: { duration: 0.6, delay: 0.5 + i * 0.08 },
            y: { duration: 3 + i * 0.3, repeat: Infinity, delay: item.delay, ease: 'easeInOut' },
          }}
          className="fixed pointer-events-none z-0 hidden md:flex"
          style={{ left: item.x, top: item.y }}
        >
          <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shadow-sm`}>
            <item.icon className={`w-5 h-5 ${item.color}`} />
          </div>
        </motion.div>
      ))}

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16">

        {/* ─── MAELLIS BRANDING ─── */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="text-center mb-6 sm:mb-8"
        >
          {/* Logo mark */}
          <div className="flex items-center justify-center mb-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/20"
            >
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-2xl sm:text-3xl font-serif font-bold text-gradient-gold mb-1"
          >
            Maellis
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-xs sm:text-sm text-slate-400 tracking-wider uppercase"
          >
            Assistant Intelligent
          </motion.p>
        </motion.div>

        {/* ─── CENTRE DE COMMANDE MAELLIS ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: easeOut }}
          className="mb-10 sm:mb-14"
        >
          <motion.button
            onClick={() =>
              speak(
                "Bonjour ! Je suis Maellis, votre assistant intelligent. Choisissez une expérience pour me découvrir. Famille ou Hôte Airbnb ?",
              )
            }
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full shadow-2xl flex items-center justify-center border-4 border-white transition-all duration-300 ${
              isSpeaking
                ? 'bg-gradient-to-br from-red-400 to-red-600 animate-pulse'
                : 'bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500'
            }`}
            style={{
              boxShadow: isSpeaking
                ? '0 0 60px rgba(239, 68, 68, 0.3), 0 20px 60px rgba(239, 68, 68, 0.2)'
                : '0 0 60px rgba(245, 158, 11, 0.3), 0 20px 60px rgba(245, 158, 11, 0.2)',
            }}
          >
            {/* Pulsing ring */}
            <motion.span
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500"
            />
            <motion.span
              animate={{
                scale: [1, 1.7, 1],
                opacity: [0.2, 0, 0.2],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500"
            />

            <div className="relative z-10">
              {isSpeaking ? (
                <div className="flex items-end gap-1.5 h-10">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-white rounded-full"
                      animate={{ height: [8, 28, 8, 18, 8] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Mic className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
              )}
            </div>
          </motion.button>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-4 text-sm font-medium text-slate-500"
          >
            {isSpeaking ? 'Maellis parle...' : 'Centre de Commande — Appuyez pour parler'}
          </motion.p>
        </motion.div>

        {/* ─── TITLE ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
          className="text-center mb-10 sm:mb-14 max-w-2xl"
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
            Découvrez Maellis à travers deux démonstrations complètes et immersives avec réponse vocale.
          </p>
        </motion.div>

        {/* ═══ DEMO CARDS — LARGE TOUCH BUTTONS ═══ */}
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl px-2">
          {/* ─── FAMILLE CARD ─── */}
          <motion.button
            onClick={handleSelectParticulier}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: easeOut }}
            whileHover={{
              y: -10,
              boxShadow: '0 30px 80px -12px rgba(99, 102, 241, 0.2)',
            }}
            whileTap={{ scale: 0.97 }}
            className="group relative text-left bg-white/90 backdrop-blur-sm rounded-[2rem] p-8 sm:p-10 overflow-hidden border border-slate-200/80 shadow-lg hover:border-indigo-300 hover:shadow-2xl transition-all duration-500"
          >
            {/* Glassmorphism gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-transparent to-purple-50/40 pointer-events-none" />
            {/* Hover glow */}
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-indigo-200 rounded-full blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-200/50 transition-all duration-300">
                <Home className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-500" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800 mb-3">
                Démo Famille
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mb-8 leading-relaxed">
                Tablette connectée Famille Martin — Santé, Recettes, Courses, Mur Familial et bien plus encore.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {['Santé', 'Recettes', 'Courses', 'Coffre-fort', 'Mur Familial'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-semibold border border-indigo-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-500 group-hover:gap-3 transition-all duration-300">
                <span>Explorer la démo</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </motion.button>

          {/* ─── AIRBNB CARD ─── */}
          <motion.button
            onClick={handleSelectAirbnb}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6, ease: easeOut }}
            whileHover={{
              y: -10,
              boxShadow: '0 30px 80px -12px rgba(245, 158, 11, 0.2)',
            }}
            whileTap={{ scale: 0.97 }}
            className="group relative text-left bg-white/90 backdrop-blur-sm rounded-[2rem] p-8 sm:p-10 overflow-hidden border border-slate-200/80 shadow-lg hover:border-amber-300 hover:shadow-2xl transition-all duration-500"
          >
            {/* Glassmorphism gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-transparent to-orange-50/40 pointer-events-none" />
            {/* Hover glow */}
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-amber-200 rounded-full blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-amber-200/50 transition-all duration-300">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800 mb-3">
                Démo Hôte Airbnb
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mb-8 leading-relaxed">
                Expérience voyageur Villa Azur Nice — QR viral, Activités locales, Check-in et conciergerie vocale.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {['Check-in', 'WiFi', 'Activités', 'Services', 'QR Code'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 text-[11px] font-semibold border border-amber-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 text-sm font-bold text-amber-600 group-hover:gap-3 transition-all duration-300">
                <span>Explorer la démo</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* ─── FOOTER NOTE ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 sm:mt-14 flex flex-col items-center gap-4"
        >
          <p className="text-[11px] text-slate-400 tracking-wide">
            Données simulées — Aucune donnée personnelle réelle
          </p>

          {/* Animated indicator dots */}
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-amber-400"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              className="w-2 h-2 rounded-full bg-indigo-400"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              className="w-2 h-2 rounded-full bg-emerald-400"
            />
          </div>
        </motion.div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 mt-auto py-4 border-t border-slate-200/60 bg-white/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
          <p>&copy; 2026 Maellis — Maison Consciente</p>
          <div className="flex items-center gap-2">
            <span>Démonstration interactive</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </footer>
    </div>
  );
}
