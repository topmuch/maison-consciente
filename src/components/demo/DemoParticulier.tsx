'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Sun,
  Zap,
  Heart,
  Utensils,
  ShoppingCart,
  Users,
  MessageSquare,
  Lock,
  Music,
  CreditCard,
  BarChart3,
  MapPin,
  Settings,
  Clock,
  Cloud,
  Mic,
  MicOff,
  Newspaper,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { useMaellisVoice } from '@/hooks/useMaellisVoice';

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════ */
const REAL_NEWS = [
  {
    title:
      "\u201CJe me suis réveillée avec des coups portés à la porte, la digue avait cédé\u201D",
    source: 'France Info',
  },
  {
    title: 'Ukraine : Macron, Merz, Starmer et Tusk ensemble à Kiev',
    source: 'Le Monde',
  },
];

const REAL_HOROSCOPE_TAURO = {
  sign: 'Taureau',
  mood: 'Vous œuvrez dans l\'ombre, jouez les tacticiens.',
  love: 'D\'autres priorités.',
  advice: 'Cheminer sans trop vous faire remarquer.',
};

/* ═══════════════════════════════════════════════════════════════
   QR CODE SVG COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function QRCodeFamily() {
  const size = 11;
  const seed = 'FamilleMartin-Particulier-2025';
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
      const isCenter =
        x === Math.floor(size / 2) && y === Math.floor(size / 2);
      const pseudoRandom =
        (((seed.charCodeAt((y * size + x) % seed.length) || 7) * 31 +
          x * 17 +
          y * 13) %
          5) >
        2;
      cells[y][x] = isCorner || isBorder || isCenter || pseudoRandom;
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
export function DemoParticulier({ onBack }: { onBack: () => void }) {
  const { speak, isSpeaking } = useMaellisVoice();

  const handleSpeak = useCallback(
    (text: string) => {
      speak(text);
    },
    [speak],
  );

  /* ── Action Grid items ── */
  const actionGrid = [
    {
      icon: MessageSquare,
      label: 'Mur Familial',
      badge: '3 messages non lus',
      color: 'bg-blue-100 text-blue-600',
      hoverBg: 'group-hover:bg-blue-200',
      speakText:
        'Vous avez 3 messages non lus sur le mur familial. Marie a posté un rappel de courses. Pierre a partagé une photo.',
    },
    {
      icon: Lock,
      label: 'Coffre-fort',
      badge: 'Codes & documents',
      color: 'bg-amber-100 text-amber-600',
      hoverBg: 'group-hover:bg-amber-200',
      speakText:
        'Votre coffre-fort numérique contient vos documents importants, codes WiFi, et assurances. Tout est chiffré AES 256.',
    },
    {
      icon: Heart,
      label: 'Bien-être',
      badge: 'Méditation, Sommeil',
      color: 'bg-pink-100 text-pink-600',
      hoverBg: 'group-hover:bg-pink-200',
      speakText:
        'Bien-être : Méditation guidée disponible. Sommeil : score de 7h30 cette nuit. Rituels quotidiens à compléter.',
    },
    {
      icon: Music,
      label: 'Audio',
      badge: 'Ambiance & Radio',
      color: 'bg-purple-100 text-purple-600',
      hoverBg: 'group-hover:bg-purple-200',
      speakText:
        'Audio : Ambiance forêt tropicale en cours. Radio France Inter disponible. Playlist détente prête.',
    },
    {
      icon: CreditCard,
      label: 'Facturation',
      badge: 'Abonnement actif',
      color: 'bg-emerald-100 text-emerald-600',
      hoverBg: 'group-hover:bg-emerald-200',
      speakText:
        'Votre abonnement Famille Premium est actif. Prochaine facture le 15 mai. 4 modules complémentaires activés.',
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      badge: 'Statistiques semaine',
      color: 'bg-indigo-100 text-indigo-600',
      hoverBg: 'group-hover:bg-indigo-200',
      speakText:
        'Cette semaine : 12 heures d\'utilisation, 47 interactions vocales, et 15% d\'économies d\'énergie.',
    },
    {
      icon: MapPin,
      label: 'Zones',
      badge: '5 zones configurées',
      color: 'bg-teal-100 text-teal-600',
      hoverBg: 'group-hover:bg-teal-200',
      speakText:
        '5 zones intelligentes configurées : Salon, Cuisine, Chambres, Jardin, et Garage.',
    },
    {
      icon: Settings,
      label: 'Paramètres',
      badge: 'Préférences',
      color: 'bg-slate-100 text-slate-600',
      hoverBg: 'group-hover:bg-slate-200',
      speakText:
        'Paramètres : Mode famille activé. Langue française. Volume à 70%. Mode nuit de 22h à 7h.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* ═══════════════════════════════════════════════════════════
          1. STICKY HEADER
          ═══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Back button */}
          <motion.button
            onClick={() => {
              onBack();
              handleSpeak('Retour au menu principal.');
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-600 hidden sm:inline">
              Retour
            </span>
          </motion.button>

          {/* Title */}
          <div className="text-center flex-1 mx-4">
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">
              Bonjour Paul !
            </h1>
            <p className="text-xs text-slate-500">
              Famille Martin &bull; Mercredi 8 Avril 2026
            </p>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2">
            {/* Weather badge */}
            <motion.button
              onClick={() =>
                handleSpeak(
                  'Il fait 21 degrés et le ciel est dégagé. Température agréable pour une promenade.',
                )
              }
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-blue-100 text-blue-700 min-h-[44px]"
            >
              <Sun className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">
                21°C Dégagé
              </span>
            </motion.button>

            {/* Mode Demo badge */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-100 text-amber-700"
            >
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Démo</span>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════════════ */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-32">
        {/* ═══════════════════════════════════════════════════════════
            2. TOP 3 ACTION CARDS
            ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Santé & SOS */}
          <motion.button
            onClick={() =>
              handleSpeak(
                'Santé et SOS : Vous avez 2 rappels de médicaments aujourd\'hui. Marie doit prendre son traitement à 18 heures. N\'oubliez pas !',
              )
            }
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-3xl p-8 text-white shadow-xl bg-gradient-to-br from-red-400 to-rose-600 text-center min-h-[140px] flex flex-col items-center justify-center gap-3"
          >
            <Heart className="w-10 h-10" />
            <span className="text-lg font-bold">Santé & SOS</span>
            <span className="text-sm text-white/80">2 rappels aujourd&apos;hui</span>
          </motion.button>

          {/* Recettes du Jour */}
          <motion.button
            onClick={() =>
              handleSpeak(
                'Recettes du jour : 3 suggestions prêtes. Ratatouille provençale, Quiche aux légumes, et Crème brûlée pour le dessert.',
              )
            }
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-3xl p-8 text-white shadow-xl bg-gradient-to-br from-orange-400 to-amber-500 text-center min-h-[140px] flex flex-col items-center justify-center gap-3"
          >
            <Utensils className="w-10 h-10" />
            <span className="text-lg font-bold">Recettes du Jour</span>
            <span className="text-sm text-white/80">3 suggestions prêtes</span>
          </motion.button>

          {/* Courses */}
          <motion.button
            onClick={() =>
              handleSpeak(
                'Liste de courses : 5 articles en attente. Lait, pain, œufs, fruits, et fromage. Le montant estimé est 23 euros 50.',
              )
            }
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-3xl p-8 text-white shadow-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-center min-h-[140px] flex flex-col items-center justify-center gap-3"
          >
            <ShoppingCart className="w-10 h-10" />
            <span className="text-lg font-bold">Courses</span>
            <span className="text-sm text-white/80">5 articles en attente</span>
          </motion.button>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            3. WELCOME MESSAGE CARD
            ═══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 sm:p-8 relative overflow-hidden"
        >
          {/* Decorative blur circle */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-200 rounded-full blur-3xl opacity-40 pointer-events-none" />

          <div className="relative">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-7 h-7 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
                  La maison s&apos;active ! ⚡
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Bonjour Paul, Marie a pris ses médicaments. Le menu du soir
                  est prêt. N&apos;oubliez pas les courses !
                </p>
              </div>
            </div>

            <motion.button
              onClick={() =>
                handleSpeak(
                  'Mur familial : Marie a posté à 10h30 que les médicaments ont été pris. Pierre a envoyé une photo à 12h15. Vous avez 3 messages non lus.',
                )
              }
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-shadow min-h-[44px]"
            >
              Voir le Mur Familial
            </motion.button>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            4. ACTION GRID (2x4)
            ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {actionGrid.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                onClick={() => handleSpeak(item.speakText)}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white rounded-3xl shadow-md border border-slate-100 p-4 sm:p-5 text-center hover:shadow-lg transition-all min-h-[100px] flex flex-col items-center justify-center gap-2.5"
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.color} ${item.hoverBg} flex items-center justify-center transition-colors`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  {item.label}
                </span>
                <span className="text-[11px] text-slate-500 leading-tight">
                  {item.badge}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            5. QUICK INFO CARDS
            ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Prochain Rappel */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() =>
              handleSpeak(
                'Prochain rappel : Médication pour Marie à 18 heures. Il s\'agit de son traitement quotidien. N\'oubliez pas !',
              )
            }
            className="bg-white rounded-3xl shadow-md border border-slate-100 p-5 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Prochain Rappel
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800">
              Médication Marie
            </p>
            <p className="text-xs text-slate-500 mt-1">Aujourd&apos;hui — 18h00</p>
          </motion.div>

          {/* Météo Demain */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() =>
              handleSpeak(
                'Météo de demain : 28 degrés, nuageux. Possibilité d\'averses l\'après-midi. Prévoyez un parapluie.',
              )
            }
            className="bg-white rounded-3xl shadow-md border border-slate-100 p-5 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Météo Demain
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800">
              28°C, Nuageux
            </p>
            <p className="text-xs text-slate-500 mt-1">Averses possibles l&apos;AM</p>
          </motion.div>

          {/* Humeur Maison */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() =>
              handleSpeak(
                'Humeur de la maison : Très bonne ! Toute la famille est de bonne humeur aujourd\'hui. Score moyen de 4 sur 5.',
              )
            }
            className="bg-white rounded-3xl shadow-md border border-slate-100 p-5 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="text-xl">😊</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Humeur Maison
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800">
              😊 Très bonne
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Score moyen : 4.2 / 5
            </p>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            6. NEWS & HOROSCOPE
            ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* News Card */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
              <Newspaper className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-800">
                Actualités
              </h3>
            </div>
            <div className="px-5 pb-5 space-y-3">
              {REAL_NEWS.map((article, i) => (
                <motion.div
                  key={i}
                  onClick={() =>
                    handleSpeak(
                      `${article.source}. ${article.title}`,
                    )
                  }
                  whileHover={{ x: 4 }}
                  className="pl-4 border-l-[3px] border-blue-400 py-2 cursor-pointer group"
                >
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                    {article.source}
                  </p>
                  <p className="text-sm text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
                    {article.title}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Horoscope Card */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() =>
              handleSpeak(
                `Horoscope du Taureau. ${REAL_HOROSCOPE_TAURO.mood} Amour : ${REAL_HOROSCOPE_TAURO.love} Conseil : ${REAL_HOROSCOPE_TAURO.advice}`,
              )
            }
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl p-6 text-white cursor-pointer"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-200" />
              <h3 className="text-base font-bold">Horoscope</h3>
              <span className="ml-auto text-xs font-semibold text-indigo-200">
                ♉ {REAL_HOROSCOPE_TAURO.sign}
              </span>
            </div>
            <p className="text-sm text-indigo-100 italic leading-relaxed mb-4">
              &ldquo;{REAL_HOROSCOPE_TAURO.mood}&rdquo;
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-sm">💕</span>
                <div>
                  <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">
                    Amour
                  </p>
                  <p className="text-sm text-white/90">
                    {REAL_HOROSCOPE_TAURO.love}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm">✨</span>
                <div>
                  <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">
                    Conseil
                  </p>
                  <p className="text-sm text-white/90">
                    {REAL_HOROSCOPE_TAURO.advice}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            7. QR CODE VIRAL SECTION
            ═══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 sm:px-8 py-8 sm:py-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            {/* Left text */}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Toute la famille connectée ! 👨‍👩‍👧‍👦
              </h3>
              <p className="text-sm text-indigo-100 leading-relaxed mb-4">
                Scannez ce QR code pour connecter tous les membres de votre
                famille en un instant.
              </p>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-white text-xs font-semibold border border-white/20">
                  <QrCode className="w-3.5 h-3.5 inline mr-1" />
                  Scan familial
                </span>
              </div>
            </div>

            {/* QR Code */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() =>
                handleSpeak(
                  'QR Code familial. Scannez avec votre téléphone pour connecter tous les membres de la famille Martin.',
                )
              }
              className="relative bg-white p-5 rounded-2xl shadow-xl cursor-pointer flex-shrink-0"
            >
              {/* Pulsing glow */}
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-4 bg-indigo-400/20 rounded-3xl blur-xl pointer-events-none"
              />
              <div className="w-36 h-36 sm:w-44 sm:h-44 relative">
                <QRCodeFamily />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* ═══════════════════════════════════════════════════════════
          8. FLOATING MAELLIS COMMAND BUTTON
          ═══════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
        <motion.button
          onClick={() => {
            if (isSpeaking) return;
            handleSpeak(
              'Bonjour Paul ! Je suis Maellis, votre assistant familial. Que puis-je faire pour vous aujourd\'hui ?',
            );
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={`w-24 h-24 rounded-full border-4 border-white shadow-2xl flex items-center justify-center transition-all ${
            isSpeaking
              ? 'bg-gradient-to-br from-red-500 to-rose-600 animate-pulse'
              : 'bg-gradient-to-br from-indigo-400 to-purple-500'
          }`}
        >
          {isSpeaking ? (
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ height: [8, 20, 8] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                  className="w-1 bg-white rounded-full"
                />
              ))}
            </div>
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </motion.button>
        <span className="text-xs text-slate-500 font-medium text-center bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow-sm">
          Appuyez pour parler à Maellis
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          9. FOOTER
          ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-white border-t border-slate-100 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            &copy; 2026 Maellis &mdash; Famille Martin
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400">
              Mode Démo Active
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </footer>
    </div>
  );
}
