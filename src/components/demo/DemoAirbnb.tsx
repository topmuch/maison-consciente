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
  QrCode,
  Sparkles,
  Mic,
} from 'lucide-react';
import { useMaellisVoice } from '@/hooks/useMaellisVoice';

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
   MAIN COMPONENT — LUXE LUMINEUX
   ═══════════════════════════════════════════════════════════════ */
export function DemoAirbnb({ onBack }: { onBack: () => void }) {
  const { speak, isSpeaking } = useMaellisVoice();
  const handleSpeak = (text: string) => speak(text);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      {/* ═══════════════════════════════════════════════════════
         1. STICKY HEADER — Glassmorphism
         ═══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Back button */}
          <motion.button
            onClick={() => {
              onBack();
              handleSpeak('Retour au menu principal.');
            }}
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

          {/* Weather badge */}
          <motion.button
            onClick={() =>
              handleSpeak(
                'Météo à Nice : 24 degrés, ensoleillé. Temps parfait pour une journée en bord de mer.',
              )
            }
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-100 text-amber-700 text-xs font-semibold"
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
      </header>

      {/* ═══════════════════════════════════════════════════════
         2. MAIN CONTENT
         ═══════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 pb-44 space-y-6">
        {/* ─── CHECK-IN / CHECK-OUT / DURATION ─── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Check-in */}
          <motion.button
            onClick={() =>
              handleSpeak(
                "Votre check-in est prévu pour aujourd'hui à 15 heures. La villa est prête à vous accueillir.",
              )
            }
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-3xl p-6 sm:p-8 text-white shadow-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex flex-col items-center justify-center gap-2 text-center"
          >
            <Calendar className="size-10 sm:size-12 mb-1" />
            <span className="text-xs font-medium opacity-90 uppercase tracking-wider">
              Check-in
            </span>
            <span className="text-sm sm:text-base font-bold leading-tight">
              Aujourd&apos;hui 15h00
            </span>
          </motion.button>

          {/* Check-out */}
          <motion.button
            onClick={() =>
              handleSpeak(
                'Votre check-out est prévu pour demain à 11 heures. Pensez à préparer vos affaires la veille.',
              )
            }
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-3xl p-6 sm:p-8 text-white shadow-xl bg-gradient-to-br from-rose-400 to-pink-600 flex flex-col items-center justify-center gap-2 text-center"
          >
            <LogOut className="size-10 sm:size-12 mb-1" />
            <span className="text-xs font-medium opacity-90 uppercase tracking-wider">
              Check-out
            </span>
            <span className="text-sm sm:text-base font-bold leading-tight">
              Demain 11h00
            </span>
          </motion.button>

          {/* Durée */}
          <motion.button
            onClick={() =>
              handleSpeak(
                'Votre séjour dure 1 nuit. Profitez bien de votre temps à Nice !',
              )
            }
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-3xl p-6 sm:p-8 text-white shadow-xl bg-gradient-to-br from-indigo-400 to-purple-600 flex flex-col items-center justify-center gap-2 text-center"
          >
            <Clock className="size-10 sm:size-12 mb-1" />
            <span className="text-xs font-medium opacity-90 uppercase tracking-wider">
              Durée
            </span>
            <span className="text-sm sm:text-base font-bold leading-tight">
              1 Nuit
            </span>
          </motion.button>
        </div>

        {/* ─── WELCOME SECTION ─── */}
        <motion.section
          onClick={() =>
            handleSpeak(
              'Bienvenue Sophie ! Votre villa Azur vous attend. Profitez de votre séjour à Nice. Votre hôte Isabelle est disponible via WhatsApp si vous avez besoin de quoi que ce soit.',
            )
          }
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          className="relative bg-white rounded-3xl shadow-lg border border-slate-100 p-6 sm:p-8 cursor-pointer overflow-hidden"
        >
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
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak(
                    "Je lance la conversation WhatsApp avec Isabelle, votre hôte. Elle sera ravie de vous aider !",
                  );
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-green-500 text-white font-semibold text-sm shadow-md hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="size-5" />
                Contacter Isabelle
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* ─── ACTION GRID (2×4) ─── */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: Wifi,
                label: 'WiFi & Codes',
                color: 'blue',
                bgHover: 'bg-blue-500',
                iconBg: 'bg-blue-50 text-blue-500',
                speakText:
                  'Le WiFi de la villa est Villa Azur Guest, mot de passe : Bienvenue2026. Le code du portail est 4827.',
              },
              {
                icon: MapPin,
                label: 'Activités',
                color: 'orange',
                bgHover: 'bg-orange-500',
                iconBg: 'bg-orange-50 text-orange-500',
                speakText:
                  'Découvrez les meilleures activités à Nice : la promenade des Anglais, le marché Cours Saleya, le château de Nice, et bien plus encore.',
              },
              {
                icon: Utensils,
                label: 'Services',
                color: 'purple',
                bgHover: 'bg-purple-500',
                iconBg: 'bg-purple-50 text-purple-500',
                speakText:
                  'Les services disponibles : ménage, cuisine traditionnelle, massage à domicile, et navette aéroport. Réservez via WhatsApp.',
              },
              {
                icon: Shield,
                label: 'SOS Urgence',
                color: 'red',
                bgHover: 'bg-red-500',
                iconBg: 'bg-red-50 text-red-500',
                speakText:
                  'En cas d\'urgence, composez le 15 pour le SAMU, le 17 pour la police, ou le 18 pour les pompiers. Votre hôte Isabelle est aussi joignable 24h sur 24.',
                pulse: true,
              },
              {
                icon: Camera,
                label: 'Mon Séjour',
                color: 'teal',
                bgHover: 'bg-teal-500',
                iconBg: 'bg-teal-50 text-teal-500',
                speakText:
                  'Votre séjour à Nice : arrivée le mercredi 8 avril, départ le jeudi 9 avril. 1 nuit dans la Villa Azur.',
              },
              {
                icon: Star,
                label: 'Avis',
                color: 'yellow',
                bgHover: 'bg-yellow-500',
                iconBg: 'bg-yellow-50 text-yellow-500',
                speakText:
                  'Vous pouvez laisser votre avis à la fin du séjour. Votre retour est très important pour Isabelle et les futurs voyageurs.',
              },
              {
                icon: AlertTriangle,
                label: 'Support',
                color: 'slate',
                bgHover: 'bg-slate-500',
                iconBg: 'bg-slate-50 text-slate-500',
                speakText:
                  'Pour le support technique, contactez l\'équipe Maellis via le bouton WhatsApp ou par email. Nous répondons sous 15 minutes.',
              },
              {
                icon: Settings,
                label: 'Options',
                color: 'gray',
                bgHover: 'bg-gray-500',
                iconBg: 'bg-gray-50 text-gray-500',
                speakText:
                  'Options du séjour : mode nuit, heures calmes, réglages du volume, préférences de langue. Tout est personnalisable.',
              },
            ].map((item) => (
              <motion.button
                key={item.label}
                onClick={() => handleSpeak(item.speakText)}
                whileHover={{
                  scale: 1.03,
                }}
                whileTap={{ scale: 0.97 }}
                className={`group flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-3xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow ${item.pulse ? 'animate-pulse' : ''}`}
              >
                <div
                  className={`flex items-center justify-center w-14 h-14 rounded-2xl ${item.iconBg} group-hover:${item.bgHover} group-hover:text-white transition-colors`}
                >
                  <item.icon className="size-7" />
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  {item.label}
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ─── NEWS & HOROSCOPE (2 columns) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="border-l-4 border-blue-400 pl-3 py-1.5"
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
            className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl shadow-lg border border-indigo-100 p-6 cursor-pointer"
          >
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-lg">✨</span> Horoscope{' '}
              <span className="text-sm font-normal text-indigo-400">
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
        </div>

        {/* ─── QR CODE VIRAL SECTION ─── */}
        <motion.section
          onClick={() =>
            handleSpeak(
              'Gardez votre concierge dans votre poche ! Scannez ce QR code avec votre téléphone pour continuer l\'expérience Maellis sur mobile. Compatible iOS et Android.',
            )
          }
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl shadow-xl p-6 sm:p-8 cursor-pointer overflow-hidden"
        >
          {/* Decorative dots */}
          <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-32 h-32 bg-yellow-300/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col items-center text-center text-white">
            {/* Viral badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                <Sparkles className="size-3" />
                Scan & Continue
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              Gardez votre concierge dans votre poche ! 📱
            </h3>
            <p className="text-sm text-white/80 mb-6 max-w-xs">
              Scannez le QR code pour retrouver Maellis sur votre téléphone
            </p>

            {/* QR code box */}
            <motion.div
              whileHover={{ rotate: 0 }}
              className="w-48 h-48 bg-white rounded-2xl p-3 shadow-2xl rotate-3 transition-transform duration-300 hover:rotate-0"
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
         7. FLOATING MAELLIS COMMAND BUTTON
         ═══════════════════════════════════════════════════════ */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
        <motion.button
          onClick={() =>
            handleSpeak(
              'Bonjour Sophie ! Je suis Maellis, votre concierge virtuelle. Comment puis-je vous aider pour votre séjour à Nice ?',
            )
          }
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative w-24 h-24 rounded-full shadow-2xl flex items-center justify-center border-4 border-white transition-colors ${
            isSpeaking
              ? 'bg-gradient-to-br from-red-400 to-red-600 animate-pulse'
              : 'bg-gradient-to-br from-amber-400 to-orange-500'
          }`}
          aria-label="Parler à Maellis"
        >
          {isSpeaking ? (
            /* Animated speaking bars */
            <div className="flex items-end gap-1 h-8">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-white rounded-full"
                  animate={{ height: [8, 24, 8, 16, 8] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          ) : (
            /* Microphone SVG icon */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </motion.button>

        <span className="text-xs font-medium text-slate-500 text-center">
          {isSpeaking ? 'Maellis parle...' : 'Appuyez pour parler à Maellis'}
        </span>
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
