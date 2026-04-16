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
import { AudioOrb } from '@/components/demo/AudioOrb';
import { VoiceInterface } from '@/components/demo/VoiceInterface';

/* ═══════════════════════════════════════════════════════════════
   Réponses simulées par mots-clés (Confort & Sécurité)
   ═══════════════════════════════════════════════════════════════ */
const FAMILY_KEYWORDS: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ['bonjour', 'salut', 'bonsoir', 'hello', 'coucou'],
    response: "Bonjour Paul ! Prêt à contrôler la maison ? Il fait 20 degrés dans le salon. Marie a pris ses médicaments à 10h30. N'oubliez pas les courses !",
  },
  {
    keywords: ['lumière', 'lumieres', 'allumer', 'éteindre', 'light'],
    response: "J'ai allumé les lumières du salon. La température d'ambiance est de 20 degrés. Voulez-vous que je règle l'éclairage tamisé pour le soir ?",
  },
  {
    keywords: ['température', 'chauffage', 'chaud', 'froid', 'clim'],
    response: "Il fait actuellement 21 degrés dans le salon et 19 degrés dans les chambres. Le chauffage est en mode automatique. Voulez-vous ajuster ?",
  },
  {
    keywords: ['recette', 'manger', 'dîner', 'déjeuner', 'repas', 'cuisine'],
    response: '3 recettes sont suggérées pour ce soir : Ratatouille provençale, Quiche aux légumes du jardin, et Crème brûlée pour le dessert. Laquelle vous tente ?',
  },
  {
    keywords: ['courses', 'listes', 'achat', 'supermarché'],
    response: "Votre liste de courses contient 5 articles : lait, pain, œufs, fruits frais, et fromage. Le montant estimé est 23 euros 50. Voulez-vous que je commande en ligne ?",
  },
  {
    keywords: ['médicament', 'santé', 'rappel', 'traitement'],
    response: "Prochain rappel de médicaments : Marie à 18 heures. Il s'agit de son traitement quotidien. Je vous rappellerai automatiquement à 17h45.",
  },
  {
    keywords: ['météo', 'temps', 'pluie', 'soleil'],
    response: "Météo : 21 degrés et ciel dégagé aujourd'hui. Demain, 28 degrés avec nuages et averses possibles l'après-midi. Prévoyez un parapluie !",
  },
  {
    keywords: ['musique', 'radio', 'ambiance', 'son', 'playlist'],
    response: "L'ambiance forêt tropicale est en cours dans le salon. Radio France Inter est disponible. Je peux aussi lancer votre playlist détente préférée.",
  },
  {
    keywords: ['marie', 'femme', 'épouse'],
    response: "Marie a posté sur le mur familial à 10h30 que les médicaments ont été pris. Elle a aussi partagé une photo du jardin ce matin.",
  },
  {
    keywords: ['pierre', 'fils', 'enfant'],
    response: "Pierre est actuellement à l'école. Son bus est prévu à 16h30. Tout va bien !",
  },
  {
    keywords: ['maison', 'contrôler', 'étage', 'pièce'],
    response: "La maison est active ! Salon : 21 degrés, lumières allumées. Chambres : 19 degrés. Jardin : éclairage automatique à la tombée de la nuit.",
  },
  {
    keywords: ['nuit', 'dormir', 'sommeil', 'bonne nuit'],
    response: "Mode nuit activé. J'ai baissé le chauffage à 18 degrés, éteint les lumières non essentielles, et verrouillé les portes. Bonne nuit Paul !",
  },
  {
    keywords: ['sécurité', 'alarme', 'caméra', 'porte'],
    response: "Système de sécurité actif. Porte d'entrée verrouillée. Caméra de jardin en marche. Aucune alerte récente. Tout est calme.",
  },
  {
    keywords: ['aide', 'help', 'que peux', 'fonction'],
    response: 'Je peux contrôler les lumières, le chauffage, la musique, vous donner la météo, rappeler les médicaments, suggérer des recettes, et gérer les courses. Essayez de me demander quelque chose !',
  },
];

function getFamilyResponse(text: string): string {
  const lower = text.toLowerCase();
  for (const entry of FAMILY_KEYWORDS) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }
  return "Je n'ai pas bien compris. Vous pouvez me demander la météo, les lumières, la température, les recettes, les courses, ou l'état de la maison. Essayez encore !";
}

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
   SHIMMER OVERLAY COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function ShimmerOverlay() {
  return (
    <motion.div
      className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SPARKLE DOT COMPONENT (for QR code & horoscope)
   ═══════════════════════════════════════════════════════════════ */
function SparkleDot({
  size = 4,
  top,
  left,
  delay = 0,
  duration = 3,
}: {
  size?: number;
  top: string;
  left: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-white pointer-events-none"
      style={{
        width: size,
        height: size,
        top,
        left,
        boxShadow: `0 0 ${size * 2}px rgba(255,255,255,0.6)`,
      }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0.5, 1, 0.5],
        y: [0, -8, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   HEADER SHIMMER
   ═══════════════════════════════════════════════════════════════ */
function HeaderShimmer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent"
        animate={{ x: ['-100%', '400%'] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatDelay: 4,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

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
   MAIN COMPONENT — LUXE LUMINEUX (ENHANCED WAHOO)
   ═══════════════════════════════════════════════════════════════ */
export function DemoParticulier({ onBack }: { onBack: () => void }) {
  const { speak, isSpeaking } = useMaellisVoice();

  const handleSpeak = useCallback(
    (text: string) => {
      speak(text);
    },
    [speak],
  );

  /* ── Réponse simulée vocale par mots-clés ── */
  const handleVoiceMessage = useCallback(
    (text: string): string => {
      return getFamilyResponse(text);
    },
    [],
  );

  /* ── Action Grid items ── */
  const actionGrid = [
    {
      icon: MessageSquare,
      label: 'Mur Familial',
      badge: '3 messages non lus',
      color: 'bg-blue-100 text-blue-600',
      hoverBg: 'group-hover:bg-blue-500',
      solidHoverColor: 'bg-blue-500',
      hasUnread: true,
      speakText:
        'Vous avez 3 messages non lus sur le mur familial. Marie a posté un rappel de courses. Pierre a partagé une photo.',
    },
    {
      icon: Lock,
      label: 'Coffre-fort',
      badge: 'Codes & documents',
      color: 'bg-amber-100 text-amber-600',
      hoverBg: 'group-hover:bg-amber-500',
      solidHoverColor: 'bg-amber-500',
      hasUnread: false,
      speakText:
        'Votre coffre-fort numérique contient vos documents importants, codes WiFi, et assurances. Tout est chiffré AES 256.',
    },
    {
      icon: Heart,
      label: 'Bien-être',
      badge: 'Méditation, Sommeil',
      color: 'bg-pink-100 text-pink-600',
      hoverBg: 'group-hover:bg-pink-500',
      solidHoverColor: 'bg-pink-500',
      hasUnread: false,
      speakText:
        'Bien-être : Méditation guidée disponible. Sommeil : score de 7h30 cette nuit. Rituels quotidiens à compléter.',
    },
    {
      icon: Music,
      label: 'Audio',
      badge: 'Ambiance & Radio',
      color: 'bg-purple-100 text-purple-600',
      hoverBg: 'group-hover:bg-purple-500',
      solidHoverColor: 'bg-purple-500',
      hasUnread: false,
      speakText:
        'Audio : Ambiance forêt tropicale en cours. Radio France Inter disponible. Playlist détente prête.',
    },
    {
      icon: CreditCard,
      label: 'Facturation',
      badge: 'Abonnement actif',
      color: 'bg-emerald-100 text-emerald-600',
      hoverBg: 'group-hover:bg-emerald-500',
      solidHoverColor: 'bg-emerald-500',
      hasUnread: false,
      speakText:
        'Votre abonnement Famille Premium est actif. Prochaine facture le 15 mai. 4 modules complémentaires activés.',
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      badge: 'Statistiques semaine',
      color: 'bg-indigo-100 text-indigo-600',
      hoverBg: 'group-hover:bg-indigo-500',
      solidHoverColor: 'bg-indigo-500',
      hasUnread: false,
      speakText:
        'Cette semaine : 12 heures d\'utilisation, 47 interactions vocales, et 15% d\'économies d\'énergie.',
    },
    {
      icon: MapPin,
      label: 'Zones',
      badge: '5 zones configurées',
      color: 'bg-teal-100 text-teal-600',
      hoverBg: 'group-hover:bg-teal-500',
      solidHoverColor: 'bg-teal-500',
      hasUnread: false,
      speakText:
        '5 zones intelligentes configurées : Salon, Cuisine, Chambres, Jardin, et Garage.',
    },
    {
      icon: Settings,
      label: 'Paramètres',
      badge: 'Préférences',
      color: 'bg-slate-100 text-slate-600',
      hoverBg: 'group-hover:bg-slate-500',
      solidHoverColor: 'bg-slate-500',
      hasUnread: false,
      speakText:
        'Paramètres : Mode famille activé. Langue française. Volume à 70%. Mode nuit de 22h à 7h.',
    },
  ];

  /* ── Sparkle positions for QR Code ── */
  const qrSparkles = [
    { top: '-6px', left: '10%', size: 5, delay: 0, duration: 3 },
    { top: '20%', left: '-8px', size: 4, delay: 0.8, duration: 2.8 },
    { top: '60%', left: '-5px', size: 3, delay: 1.5, duration: 3.2 },
    { top: '-4px', left: '60%', size: 4, delay: 0.5, duration: 2.6 },
    { top: '30%', left: '105%', size: 5, delay: 1.2, duration: 3.5 },
    { top: '70%', left: '102%', size: 3, delay: 2.0, duration: 2.4 },
    { top: '104%', left: '25%', size: 4, delay: 0.3, duration: 3.1 },
    { top: '102%', left: '70%', size: 5, delay: 1.8, duration: 2.9 },
    { top: '10%', left: '105%', size: 3, delay: 2.2, duration: 3.3 },
    { top: '85%', left: '-7px', size: 4, delay: 0.7, duration: 2.7 },
  ];

  /* ── Sparkle positions for Horoscope ── */
  const horoSparkles = [
    { top: '8%', left: '85%', size: 3, delay: 0, duration: 4 },
    { top: '15%', left: '12%', size: 4, delay: 1.0, duration: 3.5 },
    { top: '45%', left: '90%', size: 3, delay: 2.0, duration: 4.2 },
    { top: '75%', left: '8%', size: 4, delay: 0.5, duration: 3.8 },
    { top: '88%', left: '78%', size: 3, delay: 1.5, duration: 3.2 },
    { top: '30%', left: '5%', size: 2, delay: 2.5, duration: 4.5 },
    { top: '60%', left: '92%', size: 2, delay: 3.0, duration: 3.6 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* ═══════════════════════════════════════════════════════════
          1. STICKY HEADER (Enhanced with gradient shimmer + blue glow)
          ═══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 relative overflow-hidden">
        <HeaderShimmer />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
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
            {/* Weather badge with soft blue glow */}
            <motion.button
              onClick={() =>
                handleSpeak(
                  'Il fait 21 degrés et le ciel est dégagé. Température agréable pour une promenade.',
                )
              }
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-blue-100 text-blue-700 min-h-[44px]"
            >
              {/* Soft blue glow */}
              <motion.div
                className="absolute -inset-1.5 rounded-2xl bg-blue-300/40 blur-md pointer-events-none"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <Sun className="w-4 h-4 relative" />
              <span className="text-xs font-semibold hidden sm:inline relative">
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-40">
        {/* ═══════════════════════════════════════════════════════════
            2. TOP 3 ACTION CARDS (Float + Emoji + Shimmer)
            ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Santé & SOS ❤️ */}
          <motion.button
            onClick={() =>
              handleSpeak(
                'Santé et SOS : Vous avez 2 rappels de médicaments aujourd\'hui. Marie doit prendre son traitement à 18 heures. N\'oubliez pas !',
              )
            }
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 0,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="relative rounded-3xl p-8 text-white shadow-xl bg-gradient-to-br from-red-400 to-rose-600 text-center min-h-[140px] flex flex-col items-center justify-center gap-3 overflow-hidden"
          >
            <ShimmerOverlay />
            <Heart className="w-10 h-10 relative" />
            <span className="text-lg font-bold relative">Santé & SOS</span>
            <span className="text-sm text-white/80 relative">
              ❤️ 2 rappels aujourd&apos;hui
            </span>
          </motion.button>

          {/* Recettes du Jour 🍽️ */}
          <motion.button
            onClick={() =>
              handleSpeak(
                'Recettes du jour : 3 suggestions prêtes. Ratatouille provençale, Quiche aux légumes, et Crème brûlée pour le dessert.',
              )
            }
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 0.4,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="relative rounded-3xl p-8 text-white shadow-xl bg-gradient-to-br from-orange-400 to-amber-500 text-center min-h-[140px] flex flex-col items-center justify-center gap-3 overflow-hidden"
          >
            <ShimmerOverlay />
            <Utensils className="w-10 h-10 relative" />
            <span className="text-lg font-bold relative">Recettes du Jour</span>
            <span className="text-sm text-white/80 relative">
              🍽️ 3 suggestions prêtes
            </span>
          </motion.button>

          {/* Courses 🛒 */}
          <motion.button
            onClick={() =>
              handleSpeak(
                'Liste de courses : 5 articles en attente. Lait, pain, œufs, fruits, et fromage. Le montant estimé est 23 euros 50.',
              )
            }
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 0.8,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="relative rounded-3xl p-8 text-white shadow-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-center min-h-[140px] flex flex-col items-center justify-center gap-3 overflow-hidden"
          >
            <ShimmerOverlay />
            <ShoppingCart className="w-10 h-10 relative" />
            <span className="text-lg font-bold relative">Courses</span>
            <span className="text-sm text-white/80 relative">
              🛒 5 articles en attente
            </span>
          </motion.button>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            3. WELCOME MESSAGE CARD (Animated gradient border + badge)
            ═══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl p-[2px] overflow-hidden"
        >
          {/* Animated gradient border */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-500 to-blue-400"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              backgroundSize: '200% 200%',
            }}
          />
          {/* Inner white card */}
          <div className="relative bg-white rounded-[22px] shadow-lg p-6 sm:p-8 overflow-hidden">
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
                className="relative w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-shadow min-h-[44px] inline-flex items-center gap-2"
              >
                Voir le Mur Familial
                {/* "3 nouveaux" notification badge */}
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring', stiffness: 400, damping: 15 }}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/40"
                >
                  3
                  <motion.span
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-300"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            4. ACTION GRID (2x4) — Staggered + hover solid + Mur badge
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
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                className="group bg-white rounded-3xl shadow-md border border-slate-100 p-4 sm:p-5 text-center hover:shadow-lg transition-all min-h-[100px] flex flex-col items-center justify-center gap-2.5 relative overflow-visible"
              >
                {/* Red unread badge for Mur Familial */}
                {item.hasUnread && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.08, type: 'spring', stiffness: 500, damping: 15 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center z-10 shadow-md shadow-red-500/40"
                  >
                    3
                  </motion.span>
                )}
                {/* Icon container — transitions to solid color on hover */}
                <motion.div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.color} flex items-center justify-center transition-colors duration-300`}
                  whileHover={{ scale: 1.1 }}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </motion.div>
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
            5. QUICK INFO CARDS (Entrance animation + Humeur bounce)
            ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Prochain Rappel */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72, duration: 0.5 }}
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

          {/* Humeur Maison (emoji animated bounce) */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.84, duration: 0.5 }}
            onClick={() =>
              handleSpeak(
                'Humeur de la maison : Très bonne ! Toute la famille est de bonne humeur aujourd\'hui. Score moyen de 4 sur 5.',
              )
            }
            className="bg-white rounded-3xl shadow-md border border-slate-100 p-5 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <motion.span
                  className="text-xl inline-block"
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  😊
                </motion.span>
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Humeur Maison
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800">
              <motion.span
                className="inline-block"
                animate={{ y: [0, -2, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                😊
              </motion.span>{' '}
              Très bonne
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Score moyen : 4.2 / 5
            </p>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            6. NEWS & HOROSCOPE (Dramatic gradient + sparkles)
            ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* News Card */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
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

          {/* Horoscope Card (Dramatic indigo → violet → purple + sparkles) */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() =>
              handleSpeak(
                `Horoscope du Taureau. ${REAL_HOROSCOPE_TAURO.mood} Amour : ${REAL_HOROSCOPE_TAURO.love} Conseil : ${REAL_HOROSCOPE_TAURO.advice}`,
              )
            }
            whileHover={{ scale: 1.01 }}
            className="relative bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-3xl shadow-xl p-6 text-white cursor-pointer overflow-hidden"
          >
            {/* Sparkle animations in background */}
            {horoSparkles.map((s, i) => (
              <SparkleDot
                key={`horo-${i}`}
                size={s.size}
                top={s.top}
                left={s.left}
                delay={s.delay}
                duration={s.duration}
              />
            ))}

            <div className="relative">
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
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            7. QR CODE VIRAL SECTION (Vibrant gradient + sparkles + glow)
            ═══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 rounded-3xl shadow-2xl overflow-hidden relative"
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

            {/* QR Code with sparkle dots and breathing glow */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() =>
                handleSpeak(
                  'QR Code familial. Scannez avec votre téléphone pour connecter tous les membres de la famille Martin.',
                )
              }
              className="relative bg-white p-5 rounded-2xl shadow-xl cursor-pointer flex-shrink-0"
            >
              {/* Breathing glow - larger pulse */}
              <motion.div
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                  scale: [0.95, 1.05, 0.95],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-6 bg-purple-400/30 rounded-3xl blur-2xl pointer-events-none"
              />
              {/* Inner glow ring */}
              <motion.div
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-3 bg-indigo-400/20 rounded-2xl blur-xl pointer-events-none"
              />

              {/* Floating sparkle dots */}
              {qrSparkles.map((s, i) => (
                <SparkleDot
                  key={`qr-${i}`}
                  size={s.size}
                  top={s.top}
                  left={s.left}
                  delay={s.delay}
                  duration={s.duration}
                />
              ))}

              <div className="w-36 h-36 sm:w-44 sm:h-44 relative">
                <QRCodeFamily />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* ═══════════════════════════════════════════════════════════
          8. GEMINI LIVE VOICE ORB (real-time AI conversation)
          ═══════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <AudioOrb
          systemPrompt="Tu es Maellis, l'assistant familial intelligent de la famille Martin. Tu es poli, chaleureux et professionnel. Tu parles toujours en français. Tu aides Paul et sa famille avec leur maison intelligente, leurs recettes, leurs courses, la santé, et le bien-être familial. Tu connais les membres : Paul (père), Marie (mère), Pierre (fils). Tu es concis mais chaleureux."
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          9. VOICE INTERFACE (Web Speech API — démo vocale)
          ═══════════════════════════════════════════════════════════ */}
      <VoiceInterface
        mode="particulier"
        onUserMessage={handleVoiceMessage}
        position="bottom"
        welcomeText='Dites "Bonjour" ou appuyez sur le micro pour parler à Maellis !'
      />

      {/* ═══════════════════════════════════════════════════════════
          10. FOOTER (Golden divider + visible pulse)
          ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-white mt-auto">
        {/* Golden divider line */}
        <div
          className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent"
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            &copy; 2026 Maellis &mdash; Famille Martin
          </p>
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-xs font-semibold text-amber-600"
            >
              Mode Démo Active
            </motion.span>
            <motion.div
              animate={{
                scale: [1, 1.4, 1],
                opacity: [1, 0.6, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2.5 h-2.5 rounded-full bg-emerald-500"
              style={{
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
              }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
