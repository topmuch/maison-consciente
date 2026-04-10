'use client';

import { motion } from 'framer-motion';
import {
  Home,
  Building2,
  ChevronRight,
  Sparkles,
  QrCode,
  Shield,
  Utensils,
  Heart,
  MessageCircle,
  Wifi,
  Star,
  Sun,
} from 'lucide-react';
import { GeminiVoiceOrb } from '@/components/demo/GeminiVoiceOrb';

interface DemoSelectionProps {
  onSelectParticulier: () => void;
  onSelectAirbnb: () => void;
}

/* ─── Animation Helpers ─── */
const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ═══════════════════════════════════════════════════════════════
   FLOATING COLOR ORBS — Animated Mesh Gradient Background
   ═══════════════════════════════════════════════════════════════ */
const meshOrbs = [
  {
    color: 'bg-amber-300',
    size: 'w-[700px] h-[700px]',
    blur: 'blur-[220px]',
    opacity: 'opacity-20',
    x: '5%',
    y: '10%',
    animate: { x: [0, 60, -30, 0], y: [0, -40, 30, 0] },
    duration: 18,
  },
  {
    color: 'bg-violet-300',
    size: 'w-[550px] h-[550px]',
    blur: 'blur-[200px]',
    opacity: 'opacity-15',
    x: '60%',
    y: '5%',
    animate: { x: [0, -50, 40, 0], y: [0, 50, -20, 0] },
    duration: 22,
  },
  {
    color: 'bg-rose-200',
    size: 'w-[450px] h-[450px]',
    blur: 'blur-[180px]',
    opacity: 'opacity-18',
    x: '70%',
    y: '55%',
    animate: { x: [0, 40, -60, 0], y: [0, -30, 50, 0] },
    duration: 20,
  },
  {
    color: 'bg-sky-200',
    size: 'w-[500px] h-[500px]',
    blur: 'blur-[190px]',
    opacity: 'opacity-15',
    x: '15%',
    y: '65%',
    animate: { x: [0, -40, 50, 0], y: [0, 40, -40, 0] },
    duration: 25,
  },
  {
    color: 'bg-emerald-200',
    size: 'w-[400px] h-[400px]',
    blur: 'blur-[170px]',
    opacity: 'opacity-12',
    x: '45%',
    y: '35%',
    animate: { x: [0, 30, -50, 20, 0], y: [0, -50, 30, -20, 0] },
    duration: 24,
  },
];

/* ═══════════════════════════════════════════════════════════════
   FLOATING FEATURE ICONS — Visual Wahoo Elements
   ═══════════════════════════════════════════════════════════════ */
const floatingIcons = [
  { icon: Wifi, color: 'text-sky-500', bg: 'bg-sky-50', x: '10%', y: '15%', delay: 0 },
  { icon: QrCode, color: 'text-violet-500', bg: 'bg-violet-50', x: '85%', y: '12%', delay: 0.5 },
  { icon: Shield, color: 'text-rose-500', bg: 'bg-rose-50', x: '8%', y: '75%', delay: 1 },
  { icon: Utensils, color: 'text-amber-500', bg: 'bg-amber-50', x: '88%', y: '70%', delay: 1.5 },
  { icon: Heart, color: 'text-rose-400', bg: 'bg-rose-50', x: '15%', y: '45%', delay: 0.8 },
  { icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', x: '82%', y: '42%', delay: 1.2 },
  { icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', x: '50%', y: '8%', delay: 0.3 },
  { icon: Sun, color: 'text-amber-400', bg: 'bg-amber-50', x: '92%', y: '88%', delay: 0.7 },
];

/* ═══════════════════════════════════════════════════════════════
   TITLE SPARKLE DATA
   ═══════════════════════════════════════════════════════════════ */
const titleSparkles = [
  { x: -80, y: -20, delay: 0, size: 'w-2.5 h-2.5', color: 'text-amber-400' },
  { x: 60, y: -30, delay: 0.4, size: 'w-2 h-2', color: 'text-rose-300' },
  { x: -50, y: 10, delay: 0.8, size: 'w-1.5 h-1.5', color: 'text-violet-300' },
  { x: 90, y: 5, delay: 1.2, size: 'w-3 h-3', color: 'text-amber-300' },
  { x: -20, y: -35, delay: 0.6, size: 'w-1.5 h-1.5', color: 'text-sky-300' },
  { x: 40, y: 20, delay: 1.0, size: 'w-2 h-2', color: 'text-emerald-300' },
  { x: -95, y: 0, delay: 1.4, size: 'w-1.5 h-1.5', color: 'text-amber-400' },
  { x: 110, y: -15, delay: 0.2, size: 'w-2 h-2', color: 'text-rose-300' },
];

/* ═══════════════════════════════════════════════════════════════
   DOT PATTERN — Particle Texture
   ═══════════════════════════════════════════════════════════════ */
function DotPattern() {
  const dots = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 53 + 7) % 100),
    delay: (i * 0.3) % 6,
    size: i % 3 === 0 ? 'w-1 h-1' : i % 3 === 1 ? 'w-0.5 h-0.5' : 'w-1.5 h-1.5',
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[1]">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className={`absolute rounded-full bg-amber-300/20 ${dot.size}`}
          style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
          animate={{
            opacity: [0.15, 0.4, 0.15],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 4 + (dot.id % 3),
            repeat: Infinity,
            delay: dot.delay * 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DEMO SELECTION — LUXE LUMINEUX ✦ WAHOO EDITION
   ═══════════════════════════════════════════════════════════════ */
export function DemoSelection({ onSelectParticulier, onSelectAirbnb }: DemoSelectionProps) {
  const handleSelectParticulier = () => {
    onSelectParticulier();
  };

  const handleSelectAirbnb = () => {
    onSelectAirbnb();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-amber-50/50 text-slate-800 overflow-x-hidden relative">
      {/* ═══ ANIMATED MESH GRADIENT BACKGROUND ═══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {meshOrbs.map((orb, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: i * 0.3 }}
            className={`absolute ${orb.size} ${orb.color} ${orb.blur} ${orb.opacity} rounded-full`}
            style={{ left: orb.x, top: orb.y }}
          >
            <motion.div
              className="w-full h-full rounded-full"
              animate={orb.animate}
              transition={{
                duration: orb.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 2,
              }}
              style={{
                background: `radial-gradient(circle, currentColor 0%, transparent 70%)`,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* ═══ PARTICLE DOT PATTERN ═══ */}
      <DotPattern />

      {/* ═══ Floating feature icons ═══ */}
      {floatingIcons.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.35, 0.65, 0.35],
            scale: 1,
            y: [0, -14, 0],
          }}
          transition={{
            opacity: { duration: 4, repeat: Infinity, delay: item.delay },
            scale: { duration: 0.6, delay: 0.5 + i * 0.08 },
            y: { duration: 3 + i * 0.3, repeat: Infinity, delay: item.delay, ease: 'easeInOut' },
          }}
          className="fixed pointer-events-none z-[2] hidden md:flex"
          style={{ left: item.x, top: item.y }}
        >
          <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shadow-sm ring-1 ring-black/5`}>
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
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/25"
              style={{
                boxShadow: '0 0 40px rgba(245, 158, 11, 0.3), 0 10px 40px rgba(245, 158, 11, 0.2)',
              }}
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

        {/* ─── CENTRE DE COMMANDE MAELLIS — GEMINI LIVE VOICE ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: easeOut }}
          className="mb-10 sm:mb-14"
        >
          <GeminiVoiceOrb
            voice="Charon"
            systemPrompt="Tu es Maellis, l'assistant intelligent de Maison Consciente. Tu es poli, chaleureux et professionnel. Tu parles toujours en français. Tu accueilles les visiteurs et leur présentes les deux démonstrations disponibles : la démo Famille (tablette connectée pour la famille Martin avec santé, recettes, courses) et la démo Hôte Airbnb (Villa Azur à Nice avec QR code viral, activités locales, check-in). Tu es concis mais chaleureux. Si on te demande de choisir, guide-les vers la carte correspondante."
          />
        </motion.div>

        {/* ─── TITLE WITH SPARKLE EFFECT ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
          className="text-center mb-10 sm:mb-14 max-w-2xl relative"
        >
          {/* Sparkle stars behind the title */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative">
              {titleSparkles.map((sp, i) => (
                <motion.div
                  key={i}
                  className={`absolute ${sp.size} ${sp.color}`}
                  style={{ left: sp.x, top: sp.y }}
                  animate={{
                    opacity: [0, 1, 0.3, 1, 0],
                    scale: [0.5, 1.2, 0.8, 1.1, 0.5],
                    rotate: [0, 90, 180, 270, 360],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    delay: sp.delay,
                    ease: 'easeInOut',
                  }}
                >
                  <Star className={`w-full h-full fill-current`} />
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative z-10">
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
          </div>
        </motion.div>

        {/* ═══ DEMO CARDS — ENHANCED WITH GLOW BORDERS & FLOATING ICONS ═══ */}
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl px-2">
          {/* ─── FAMILLE CARD ─── */}
          <motion.button
            onClick={handleSelectParticulier}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: easeOut }}
            whileHover={{
              y: -12,
            }}
            whileTap={{ scale: 0.97 }}
            className="group relative text-left rounded-[2rem] overflow-hidden transition-all duration-500"
            style={{
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Gradient border glow wrapper */}
            <div className="absolute -inset-[2px] rounded-[2rem] bg-gradient-to-br from-violet-200 via-rose-200 to-amber-200 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
            <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-br from-violet-200 via-rose-100 to-amber-100 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Main card */}
            <div className="relative bg-white/95 backdrop-blur-sm rounded-[2rem] p-8 sm:p-10 border border-slate-200/60 group-hover:border-violet-200 transition-all duration-500 overflow-hidden"
              style={{
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
              }}
            >
              {/* Glassmorphism gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50/40 via-transparent to-rose-50/30 pointer-events-none" />
              {/* Hover glow */}
              <motion.div
                className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-200 rounded-full blur-[100px] opacity-0 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none"
              />

              {/* Floating animated icon */}
              <motion.div
                className="absolute top-6 right-6 pointer-events-none opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-700"
                animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Heart className="w-20 h-20 text-violet-400" />
              </motion.div>

              <div className="relative z-10">
                {/* Icon */}
                <motion.div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-rose-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300"
                  style={{
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.15)',
                  }}
                >
                  <Home className="w-8 h-8 sm:w-10 sm:h-10 text-violet-500" />
                </motion.div>

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
                      className="px-3 py-1.5 rounded-full bg-violet-50 text-violet-600 text-[11px] font-semibold border border-violet-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-bold text-violet-500 group-hover:gap-3 transition-all duration-300">
                  <span>Explorer la démo</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
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
              y: -12,
            }}
            whileTap={{ scale: 0.97 }}
            className="group relative text-left rounded-[2rem] overflow-hidden transition-all duration-500"
            style={{
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Gradient border glow wrapper */}
            <div className="absolute -inset-[2px] rounded-[2rem] bg-gradient-to-br from-amber-200 via-amber-300 to-rose-200 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
            <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-br from-amber-200 via-orange-100 to-rose-100 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Main card */}
            <div className="relative bg-white/95 backdrop-blur-sm rounded-[2rem] p-8 sm:p-10 border border-slate-200/60 group-hover:border-amber-200 transition-all duration-500 overflow-hidden"
              style={{
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
              }}
            >
              {/* Glassmorphism gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-transparent to-orange-50/30 pointer-events-none" />
              {/* Hover glow */}
              <motion.div
                className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-200 rounded-full blur-[100px] opacity-0 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none"
              />

              {/* Floating animated icon */}
              <motion.div
                className="absolute top-6 right-6 pointer-events-none opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-700"
                animate={{ y: [0, -8, 0], rotate: [0, -5, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <Star className="w-20 h-20 text-amber-400" />
              </motion.div>

              <div className="relative z-10">
                {/* Icon */}
                <motion.div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300"
                  style={{
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.15)',
                  }}
                >
                  <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
                </motion.div>

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
              className="w-2 h-2 rounded-full bg-violet-400"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              className="w-2 h-2 rounded-full bg-emerald-400"
            />
          </div>
        </motion.div>
      </div>

      {/* ═══ FOOTER WITH GOLDEN DIVIDER ═══ */}
      <footer className="relative z-10 mt-auto">
        {/* Golden divider */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-200/30 to-transparent mt-px" />

        <div className="py-5 bg-gradient-to-b from-white/60 to-white/40 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <p>&copy; 2026 Maellis — Maison Consciente</p>
            </div>
            <div className="flex items-center gap-2">
              <span>Démonstration interactive</span>
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-emerald-500"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
