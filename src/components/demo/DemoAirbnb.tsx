'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Sun,
  Zap,
  Calendar,
  LogOut,
  Clock,
  Home,
  MessageCircle,
  Wifi,
  MapPin,
  Utensils,
  Shield,
  Camera,
  Star,
  AlertTriangle,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useMaellisVoice } from '@/hooks/useMaellisVoice';
import { GeminiVoiceOrb } from '@/components/demo/GeminiVoiceOrb';

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════ */
const REAL_NEWS = [
  {
    title:
      '"Je me suis réveillée avec des coups portés à la porte, la digue avait cédé"',
    source: 'France Info',
  },
  {
    title: 'Ukraine : Macron, Merz, Starmer et Tusk ensemble à Kiev',
    source: 'Le Monde',
  },
];

const REAL_HOROSCOPE_TAURO = {
  sign: 'Taureau',
  mood: "Vous œuvrez dans l'ombre, jouez les tacticiens.",
  love: "D'autres priorités.",
  advice: 'Cheminer sans trop vous faire remarquer.',
};

/* ═══════════════════════════════════════════════════════════════
   SPARKLE DOT COMPONENT (for QR section)
   ═══════════════════════════════════════════════════════════════ */
function SparkleDot({
  style,
  delay,
}: {
  style: React.CSSProperties;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full bg-white/80"
      style={style}
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], y: [-4, 4, -4] }}
      transition={{ duration: 2.4, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   QR CODE SVG COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function QRCodeDisplay({ size = 11 }: { size?: number }) {
  const seed = 'Maellis-VillaAzur-Viral-2026';
  const cells: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    cells[y] = [];
    for (let x = 0; x < size; x++) {
      const isCorner =
        (x < 3 && y < 3) ||
        (x >= size - 3 && y < 3) ||
        (x < 3 && y >= size - 3);
      const isBorder =
        x === 0 || x === size - 1 || y === 0 || y === size - 1;
      const isInnerBorder =
        x === 1 || x === size - 2 || y === 1 || y === size - 2;
      const isCenter =
        x === Math.floor(size / 2) && y === Math.floor(size / 2);
      const isCenterCross =
        (x === Math.floor(size / 2) || y === Math.floor(size / 2)) &&
        Math.abs(x - Math.floor(size / 2)) <= 1 &&
        Math.abs(y - Math.floor(size / 2)) <= 1;
      const pseudoRandom =
        ((seed.charCodeAt((y * size + x) % seed.length) || 7) * 31 +
          x * 17 +
          y * 13) %
          5 >
        2;
      cells[y][x] =
        isCorner ||
        (isBorder && !isCorner) ||
        isCenter ||
        isCenterCross ||
        pseudoRandom;
    }
  }
  return (
    <svg
      viewBox={`0 0 ${size * 10 + 20} ${size * 10 + 20}`}
      className="w-full h-full"
    >
      <rect width="100%" height="100%" fill="white" rx="8" />
      {cells.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * 10 + 10}
              y={y * 10 + 10}
              width="8"
              height="8"
              fill="#0f172a"
              rx="1"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════ */
const floatAnimation = {
  animate: {
    y: [-2, 2, -2],
  },
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

const containerStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.2,
    },
  },
};

const itemBounceIn = {
  hidden: { opacity: 0, scale: 0.7, y: 16 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

const fadeInSlideUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — LUXE LUMINEUX (MAXIMUM WAHOO)
   ═══════════════════════════════════════════════════════════════ */
export function DemoAirbnb({ onBack }: { onBack: () => void }) {
  const { speak, isSpeaking } = useMaellisVoice();
  const handleSpeak = (text: string) => speak(text);

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      handleSpeak('Retour au menu principal.');
      onBack();
    }, 300);
  };

  /* Sparkle positions around QR code */
  const sparklePositions = [
    { top: '8%', left: '10%' },
    { top: '5%', right: '15%' },
    { top: '15%', right: '8%' },
    { bottom: '10%', left: '12%' },
    { bottom: '5%', right: '10%' },
    { top: '40%', left: '5%' },
    { top: '40%', right: '5%' },
    { bottom: '25%', left: '8%' },
    { bottom: '20%', right: '12%' },
    { top: '25%', left: '3%' },
    { top: '20%', right: '3%' },
    { bottom: '35%', right: '8%' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 flex flex-col">
      {/* ═══════════════════════════════════════════════════════
         1. STICKY HEADER — Gradient Shimmer + Weather Glow
         ═══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 overflow-hidden">
        {/* Animated gradient shimmer bar */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-amber-200/40 via-amber-100/20 to-amber-200/40"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <div className="relative bg-white/80 backdrop-blur-md border-b border-amber-200/50 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            {/* Back button */}
            <motion.button
              onClick={handleBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="size-5 text-slate-600" />
            </motion.button>

            {/* Title & subtitle */}
            <div className="flex-1 min-w-0 text-center">
              <h1 className="text-base font-bold text-slate-800 truncate">
                Villa Azur — Nice
              </h1>
              <p className="text-xs text-slate-500 truncate">
                Voyageur : Sophie • Mercredi 8 Avril 2026
              </p>
            </div>

            {/* Weather badge with glow */}
            <motion.button
              onClick={() =>
                handleSpeak(
                  'Météo à Nice : 24 degrés, ensoleillé. Temps parfait pour une journée en bord de mer.',
                )
              }
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-100 text-amber-700 text-xs font-semibold"
              animate={{
                boxShadow: [
                  '0 0 8px 2px rgba(245, 158, 11, 0.15)',
                  '0 0 16px 4px rgba(245, 158, 11, 0.35)',
                  '0 0 8px 2px rgba(245, 158, 11, 0.15)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sun className="size-4" />
              <span>24°C Ensoleillé</span>
            </motion.button>

            {/* Mode Demo badge */}
            <motion.div
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="size-3" />
              <span>Démo</span>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
         2. MAIN CONTENT
         ═══════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 pb-56 space-y-6">
        {/* ─── CHECK-IN / CHECK-OUT / DURATION (Floating + Icon Badges) ─── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Check-in */}
          <motion.div {...floatAnimation} transition={{ ...floatAnimation.transition, delay: 0 } as any}>
            <motion.button
              onClick={() =>
                handleSpeak(
                  "Votre check-in est prévu pour aujourd'hui à 15 heures. La villa est prête à vous accueillir.",
                )
              }
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="relative rounded-3xl p-6 sm:p-8 text-white shadow-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex flex-col items-center justify-center gap-2 text-center overflow-hidden"
            >
              {/* Icon badge top-right */}
              <span className="absolute top-2 right-2 text-lg leading-none">✈️</span>
              <Calendar className="size-10 sm:size-12 mb-1" />
              <span className="text-xs font-medium opacity-90 uppercase tracking-wider">
                Check-in
              </span>
              <span className="text-sm sm:text-base font-bold leading-tight">
                Aujourd&apos;hui 15h00
              </span>
            </motion.button>
          </motion.div>

          {/* Check-out */}
          <motion.div {...floatAnimation} transition={{ ...floatAnimation.transition, delay: 0.5 } as any}>
            <motion.button
              onClick={() =>
                handleSpeak(
                  'Votre check-out est prévu pour demain à 11 heures. Pensez à préparer vos affaires la veille.',
                )
              }
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="relative rounded-3xl p-6 sm:p-8 text-white shadow-xl bg-gradient-to-br from-rose-400 to-pink-600 flex flex-col items-center justify-center gap-2 text-center overflow-hidden"
            >
              {/* Icon badge top-right */}
              <span className="absolute top-2 right-2 text-lg leading-none">🏠</span>
              <LogOut className="size-10 sm:size-12 mb-1" />
              <span className="text-xs font-medium opacity-90 uppercase tracking-wider">
                Check-out
              </span>
              <span className="text-sm sm:text-base font-bold leading-tight">
                Demain 11h00
              </span>
            </motion.button>
          </motion.div>

          {/* Durée */}
          <motion.div {...floatAnimation} transition={{ ...floatAnimation.transition, delay: 1 } as any}>
            <motion.button
              onClick={() =>
                handleSpeak(
                  'Votre séjour dure 1 nuit. Profitez bien de votre temps à Nice !',
                )
              }
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="relative rounded-3xl p-6 sm:p-8 text-white shadow-xl bg-gradient-to-br from-amber-400 to-orange-500 flex flex-col items-center justify-center gap-2 text-center overflow-hidden"
            >
              {/* Icon badge top-right */}
              <span className="absolute top-2 right-2 text-lg leading-none">⏰</span>
              <Clock className="size-10 sm:size-12 mb-1" />
              <span className="text-xs font-medium opacity-90 uppercase tracking-wider">
                Durée
              </span>
              <span className="text-sm sm:text-base font-bold leading-tight">
                1 Nuit
              </span>
            </motion.button>
          </motion.div>
        </div>

        {/* ─── WELCOME SECTION (Animated Gradient Border + WhatsApp Glow) ─── */}
        <motion.section
          onClick={() =>
            handleSpeak(
              'Bienvenue Sophie ! Votre villa Azur vous attend. Profitez de votre séjour à Nice. Votre hôte Isabelle est disponible via WhatsApp si vous avez besoin de quoi que ce soit.',
            )
          }
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          className="relative cursor-pointer"
        >
          {/* Animated gradient border wrapper */}
          <motion.div
            className="absolute -inset-[2px] rounded-[1.35rem] bg-gradient-to-r from-amber-300 via-rose-400 to-amber-300"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ backgroundSize: '200% 200%' }}
          />
          {/* Inner content */}
          <div className="relative bg-white rounded-3xl shadow-lg p-6 sm:p-8 overflow-hidden">
            {/* Amber decorative blur circle */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 flex-shrink-0">
                <Home className="size-7 text-amber-600" />
              </div>

              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
                  Bienvenue Sophie ! 👋
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Votre villa Azur vous attend avec impatience. Profitez de votre
                  séjour dans le magnifique quartier de Nice. N&apos;hésitez pas à
                  contacter Isabelle pour toute question.
                </p>
                {/* WhatsApp-style green glow button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak(
                      "Je lance la conversation WhatsApp avec Isabelle, votre hôte. Elle sera ravie de vous aider !",
                    );
                  }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow:
                      '0 0 20px 4px rgba(34, 197, 94, 0.45)',
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-green-500 text-white font-semibold text-sm shadow-md hover:bg-green-600 transition-colors"
                >
                  <MessageCircle className="size-5" />
                  Contacter Isabelle
                </motion.button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ─── ACTION GRID (Staggered Bounce Mount + Enhanced SOS) ─── */}
        <section>
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            variants={containerStagger}
            initial="hidden"
            animate="show"
          >
            {[
              {
                icon: Wifi,
                label: 'WiFi & Codes',
                iconBg: 'bg-sky-50 text-sky-500',
                speakText:
                  'Le WiFi de la villa est Villa Azur Guest, mot de passe : Bienvenue2026. Le code du portail est 4827.',
              },
              {
                icon: MapPin,
                label: 'Activités',
                iconBg: 'bg-orange-50 text-orange-500',
                speakText:
                  'Découvrez les meilleures activités à Nice : la promenade des Anglais, le marché Cours Saleya, le château de Nice, et bien plus encore.',
              },
              {
                icon: Utensils,
                label: 'Services',
                iconBg: 'bg-purple-50 text-purple-500',
                speakText:
                  'Les services disponibles : ménage, cuisine traditionnelle, massage à domicile, et navette aéroport. Réservez via WhatsApp.',
              },
              {
                icon: Shield,
                label: 'SOS Urgence',
                iconBg: 'bg-red-50 text-red-500',
                speakText:
                  "En cas d'urgence, composez le 15 pour le SAMU, le 17 pour la police, ou le 18 pour les pompiers. Votre hôte Isabelle est aussi joignable 24h sur 24.",
                pulse: true,
              },
              {
                icon: Camera,
                label: 'Mon Séjour',
                iconBg: 'bg-teal-50 text-teal-500',
                speakText:
                  'Votre séjour à Nice : arrivée le mercredi 8 avril, départ le jeudi 9 avril. 1 nuit dans la Villa Azur.',
              },
              {
                icon: Star,
                label: 'Avis',
                iconBg: 'bg-amber-50 text-amber-500',
                speakText:
                  'Vous pouvez laisser votre avis à la fin du séjour. Votre retour est très important pour Isabelle et les futurs voyageurs.',
              },
              {
                icon: AlertTriangle,
                label: 'Support',
                iconBg: 'bg-slate-50 text-slate-500',
                speakText:
                  "Pour le support technique, contactez l'équipe Maellis via le bouton WhatsApp ou par email. Nous répondons sous 15 minutes.",
              },
              {
                icon: Settings,
                label: 'Options',
                iconBg: 'bg-gray-50 text-gray-500',
                speakText:
                  'Options du séjour : mode nuit, heures calmes, réglages du volume, préférences de langue. Tout est personnalisable.',
              },
            ].map((item) => (
              <motion.button
                key={item.label}
                variants={itemBounceIn as any}
                onClick={() => handleSpeak(item.speakText)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className={`group flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-3xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow relative overflow-hidden`}
              >
                {/* SOS enhanced pulse */}
                {item.pulse && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-3xl bg-red-500/20 pointer-events-none"
                      animate={{
                        opacity: [0.3, 0.8, 0.3],
                        scale: [0.98, 1.02, 0.98],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="absolute -inset-1 rounded-[1.5rem] border-2 border-red-400/40 pointer-events-none"
                      animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.04, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                    />
                  </>
                )}
                <div
                  className={`relative flex items-center justify-center w-14 h-14 rounded-2xl ${item.iconBg} transition-colors`}
                >
                  <item.icon className="size-7" />
                </div>
                <span className="relative text-xs font-semibold text-slate-700">
                  {item.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </section>

        {/* ─── NEWS & HOROSCOPE (Fade + Slide from bottom entrance) ─── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          variants={fadeInSlideUp as any}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* News card */}
          <motion.section
            onClick={() =>
              handleSpeak(
                "Aujourd'hui dans l'actualité. Première info : Je me suis réveillée avec des coups portés à la porte, la digue avait cédé, selon France Info. Deuxième info : Ukraine, Macron, Merz, Starmer et Tusk ensemble à Kiev, selon Le Monde.",
              )
            }
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 cursor-pointer"
          >
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-lg">📰</span> Actualités
            </h3>

            <div className="space-y-3">
              {REAL_NEWS.map((article, i) => (
                <div
                  key={i}
                  className="border-l-4 border-amber-400 pl-3 py-1.5"
                >
                  <p className="text-sm font-medium text-slate-700 leading-snug">
                    {article.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {article.source}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Horoscope card */}
          <motion.section
            onClick={() =>
              handleSpeak(
                `Horoscope du jour pour le signe Taureau. Humeur : ${REAL_HOROSCOPE_TAURO.mood} Amour : ${REAL_HOROSCOPE_TAURO.love} Conseil : ${REAL_HOROSCOPE_TAURO.advice}`,
              )
            }
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="bg-gradient-to-br from-purple-50 to-rose-50 rounded-3xl shadow-lg border border-purple-100 p-6 cursor-pointer"
          >
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-lg">✨</span> Horoscope{' '}
              <span className="text-sm font-normal text-purple-400">
                — {REAL_HOROSCOPE_TAURO.sign}
              </span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-base">🌙</span>
                <div>
                  <span className="font-semibold text-slate-600">Humeur :</span>{' '}
                  <span className="text-slate-700">
                    {REAL_HOROSCOPE_TAURO.mood}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base">❤️</span>
                <div>
                  <span className="font-semibold text-slate-600">Amour :</span>{' '}
                  <span className="text-slate-700">
                    {REAL_HOROSCOPE_TAURO.love}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base">💎</span>
                <div>
                  <span className="font-semibold text-slate-600">
                    Conseil :
                  </span>{' '}
                  <span className="text-slate-700">
                    {REAL_HOROSCOPE_TAURO.advice}
                  </span>
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>

        {/* ─── QR CODE VIRAL SECTION (Dramatic Gradient + Sparkles + 3D Hover) ─── */}
        <motion.section
          onClick={() =>
            handleSpeak(
              'Gardez votre concierge dans votre poche ! Scannez ce QR code avec votre téléphone pour continuer l\'expérience Maellis sur mobile. Compatible iOS et Android.',
            )
          }
          whileTap={{ scale: 0.995 }}
          className="relative bg-gradient-to-br from-amber-500 via-rose-500 to-orange-500 rounded-3xl shadow-2xl p-6 sm:p-8 cursor-pointer overflow-hidden"
        >
          {/* Decorative glow blobs */}
          <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-32 h-32 bg-yellow-300/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-200/10 rounded-full blur-3xl pointer-events-none" />

          {/* Confetti sparkle dots around QR code */}
          {sparklePositions.map((pos, i) => (
            <SparkleDot key={i} style={pos} delay={i * 0.2} />
          ))}

          <div className="relative flex flex-col items-center text-center text-white">
            {/* Viral badge */}
            <div className="flex items-center gap-2 mb-4">
              <motion.span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
                animate={{ boxShadow: ['0 0 8px rgba(255,255,255,0.1)', '0 0 20px rgba(255,255,255,0.3)', '0 0 8px rgba(255,255,255,0.1)'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="size-3" />
                Scan & Continue
              </motion.span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              Gardez votre concierge dans votre poche ! 📱
            </h3>
            <p className="text-sm text-white/80 mb-6 max-w-xs">
              Scannez le QR code pour retrouver Maellis sur votre téléphone
            </p>

            {/* QR code box with 3D hover */}
            <motion.div
              className="w-48 h-48 bg-white rounded-2xl p-3 shadow-2xl"
              style={{ perspective: 600 }}
              whileHover={{
                rotateY: -5,
                rotateX: 3,
                scale: 1.04,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <QRCodeDisplay size={11} />
            </motion.div>

            <p className="mt-4 text-xs text-white/60">
              Compatible iOS & Android
            </p>
          </div>
        </motion.section>
      </main>

      {/* ═══════════════════════════════════════════════════════
         7. GEMINI LIVE VOICE ORB (real-time AI conversation)
         ═══════════════════════════════════════════════════════ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <GeminiVoiceOrb
          systemPrompt="Tu es Maellis, la concierge virtuelle intelligente de la Villa Azur à Nice. Tu es poli, chaleureuse et professionnelle. Tu parles toujours en français. Tu aides Sophie, la voyageuse, avec son séjour : check-in, check-out, activités, restaurants, services, et urgences. Tu connais la villa et ses équipements. Tu es concis mais chaleureuse. L'hôte est Isabelle."
          voice="Charon"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════
         8. FOOTER
         ═══════════════════════════════════════════════════════ */}
      <footer className="mt-auto py-4 text-center text-xs text-slate-400">
        <p>Maellis — Concierge Virtuelle • Villa Azur • Nice</p>
      </footer>
    </div>
  );
}
