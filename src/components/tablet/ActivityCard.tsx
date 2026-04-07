'use client';

/* ═══════════════════════════════════════════════════════
   ACTIVITY CARD — Luxe animated card for tablet display
   
   Glassmorphism card with category-based gradients,
   partner badges, and three action buttons (Maps,
   WhatsApp, Details). Framer Motion animated.
   ═══════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';
import {
  MapPin,
  Phone,
  Info,
  Star,
  Clock,
  Navigation,
} from 'lucide-react';

/* ─── Types ─── */

export interface ActivityCardProps {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  distance?: string | null;
  link?: string | null;
  isPartner: boolean;
  whatsappNumber?: string | null;
  image?: string | null;
  priceHint?: string | null;
  hoursHint?: string | null;
  address?: string | null;
  householdName?: string;
  index?: number;
  onDetail?: (activity: ActivityCardProps) => void;
}

/* ─── Category color map ─── */

const CATEGORY_STYLES: Record<string, {
  bg: string;
  gradient: string;
  badge: string;
  badgeText: string;
  icon: string;
}> = {
  'Culture': {
    bg: 'bg-violet-500/10',
    gradient: 'from-violet-900/60 via-purple-900/40 to-slate-950',
    badge: 'bg-violet-500/20 border-violet-400/30 text-violet-200',
    badgeText: 'text-violet-300',
    icon: 'bg-violet-500/20 text-violet-300',
  },
  'Sport': {
    bg: 'bg-emerald-500/10',
    gradient: 'from-emerald-900/60 via-green-900/40 to-slate-950',
    badge: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200',
    badgeText: 'text-emerald-300',
    icon: 'bg-emerald-500/20 text-emerald-300',
  },
  'Nature': {
    bg: 'bg-green-500/10',
    gradient: 'from-green-900/60 via-emerald-900/40 to-slate-950',
    badge: 'bg-green-500/20 border-green-400/30 text-green-200',
    badgeText: 'text-green-300',
    icon: 'bg-green-500/20 text-green-300',
  },
  'Gastronomie': {
    bg: 'bg-orange-500/10',
    gradient: 'from-orange-900/60 via-amber-900/40 to-slate-950',
    badge: 'bg-orange-500/20 border-orange-400/30 text-orange-200',
    badgeText: 'text-orange-300',
    icon: 'bg-orange-500/20 text-orange-300',
  },
  'Bien-être': {
    bg: 'bg-cyan-500/10',
    gradient: 'from-cyan-900/60 via-teal-900/40 to-slate-950',
    badge: 'bg-cyan-500/20 border-cyan-400/30 text-cyan-200',
    badgeText: 'text-cyan-300',
    icon: 'bg-cyan-500/20 text-cyan-300',
  },
  'Shopping': {
    bg: 'bg-pink-500/10',
    gradient: 'from-pink-900/60 via-rose-900/40 to-slate-950',
    badge: 'bg-pink-500/20 border-pink-400/30 text-pink-200',
    badgeText: 'text-pink-300',
    icon: 'bg-pink-500/20 text-pink-300',
  },
  'Transport': {
    bg: 'bg-blue-500/10',
    gradient: 'from-blue-900/60 via-sky-900/40 to-slate-950',
    badge: 'bg-blue-500/20 border-blue-400/30 text-blue-200',
    badgeText: 'text-blue-300',
    icon: 'bg-blue-500/20 text-blue-300',
  },
  'Loisir': {
    bg: 'bg-amber-500/10',
    gradient: 'from-amber-900/60 via-yellow-900/40 to-slate-950',
    badge: 'bg-amber-500/20 border-amber-400/30 text-amber-200',
    badgeText: 'text-amber-300',
    icon: 'bg-amber-500/20 text-amber-300',
  },
};

const DEFAULT_CATEGORY = {
  bg: 'bg-slate-500/10',
  gradient: 'from-slate-900/60 via-slate-800/40 to-slate-950',
  badge: 'bg-slate-500/20 border-slate-400/30 text-slate-200',
  badgeText: 'text-slate-300',
  icon: 'bg-slate-500/20 text-slate-300',
};

/* ─── Animation variants ─── */

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      delay: delay + 0.15,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

/* ─── Helper: encode address for Google Maps ─── */

function getMapsUrl(address?: string | null, link?: string | null): string {
  if (link) return link;
  if (address) {
    const query = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
  return 'https://www.google.com/maps';
}

/* ─── Helper: WhatsApp URL with pre-filled message ─── */

function getWhatsAppUrl(
  number?: string | null,
  householdName?: string,
  title?: string
): string {
  const cleanNumber = number?.replace(/[^0-9+]/g, '');
  if (!cleanNumber) return '#';
  const name = householdName || 'votre logement';
  const msg = `Bonjour, je suis au logement ${name}, je souhaite réserver pour ${title || 'cette activité'}.`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
}

/* ─── Component ─── */

export default function ActivityCard({
  title,
  category,
  description,
  distance,
  link,
  isPartner,
  whatsappNumber,
  image,
  priceHint,
  hoursHint,
  address,
  householdName,
  index = 0,
  onDetail,
}: ActivityCardProps) {
  const styles = CATEGORY_STYLES[category] ?? DEFAULT_CATEGORY;
  const delay = index * 0.08;

  return (
    <motion.div
      custom={delay}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-lg transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.08),0_0_60px_rgba(245,158,11,0.04)] group"
      style={{
        minHeight: '280px',
        touchAction: 'manipulation',
      }}
    >
      {/* ─── Background layer ─── */}
      <div className="absolute inset-0">
        {image ? (
          <>
            <img
              src={image}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            <div className={`absolute inset-0 bg-gradient-to-b ${styles.gradient} opacity-90`} />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient}`} />
        )}
      </div>

      {/* ─── Content layer ─── */}
      <div className="relative z-10 flex flex-col justify-between min-h-[280px] p-4">

        {/* ─── Top row: badges ─── */}
        <div className="flex items-start justify-between gap-2">
          {/* Category badge */}
          <motion.span
            custom={delay}
            variants={badgeVariants}
            initial="hidden"
            animate="visible"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${styles.badge}`}
          >
            {styles.badgeText.includes('violet') && <span className="text-violet-300">🎭</span>}
            {styles.badgeText.includes('emerald') && <span className="text-emerald-300">⚽</span>}
            {styles.badgeText.includes('green') && category === 'Nature' && <span className="text-green-300">🌿</span>}
            {styles.badgeText.includes('orange') && <span className="text-orange-300">🍽️</span>}
            {styles.badgeText.includes('cyan') && <span className="text-cyan-300">🧘</span>}
            {styles.badgeText.includes('pink') && <span className="text-pink-300">🛍️</span>}
            {styles.badgeText.includes('blue') && <span className="text-blue-300">🚌</span>}
            {styles.badgeText.includes('amber') && category === 'Loisir' && <span className="text-amber-300">🎪</span>}
            {styles.badgeText.includes('slate') && <span className="text-slate-300">📌</span>}
            {category}
          </motion.span>

          {/* Partner badge */}
          {isPartner && (
            <motion.span
              custom={delay}
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 border border-amber-400/30 text-amber-200 backdrop-blur-sm"
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              Partenaire
            </motion.span>
          )}
        </div>

        {/* ─── Description (if provided, show preview) ─── */}
        {description && (
          <p className="text-white/60 text-xs leading-relaxed line-clamp-2 mt-2 flex-1">
            {description}
          </p>
        )}

        {/* ─── Bottom section ─── */}
        <div className="mt-auto space-y-3">
          {/* Info tags */}
          <div className="flex items-center flex-wrap gap-2">
            {distance && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/70 border border-white/10 backdrop-blur-sm">
                <Navigation className="w-3 h-3" />
                {distance}
              </span>
            )}
            {priceHint && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 backdrop-blur-sm">
                {priceHint}
              </span>
            )}
            {hoursHint && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/70 border border-white/10 backdrop-blur-sm">
                <Clock className="w-3 h-3" />
                {hoursHint}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-serif text-white font-semibold leading-tight tracking-wide">
            {title}
          </h3>

          {/* Address */}
          {address && (
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3 h-3 text-white/40 mt-0.5 shrink-0" />
              <span className="text-[11px] text-white/50 line-clamp-1">{address}</span>
            </div>
          )}

          {/* ─── Action buttons ─── */}
          <div className="flex items-center gap-2 pt-1">
            {/* Y aller — Google Maps */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const url = getMapsUrl(address, link);
                window.open(url, '_blank', 'noopener');
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-white/10 border border-white/10 text-white/80 backdrop-blur-sm transition-colors duration-200 hover:bg-white/15 hover:text-white min-h-[44px] min-w-[44px]"
              aria-label={`Aller à ${title}`}
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Y aller</span>
            </motion.button>

            {/* Réserver — WhatsApp */}
            {whatsappNumber && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const url = getWhatsAppUrl(whatsappNumber, householdName, title);
                  window.open(url, '_blank', 'noopener');
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-emerald-500/15 border border-emerald-500/20 text-emerald-200 backdrop-blur-sm transition-colors duration-200 hover:bg-emerald-500/25 hover:text-emerald-100 min-h-[44px] min-w-[44px]"
                aria-label={`Réserver ${title}`}
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Réserver</span>
              </motion.button>
            )}

            {/* Détails */}
            {onDetail && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  onDetail({
                    id: '',
                    title,
                    category,
                    description,
                    distance,
                    link,
                    isPartner,
                    whatsappNumber,
                    image,
                    priceHint,
                    hoursHint,
                    address,
                    householdName,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-amber-500/15 border border-amber-500/20 text-amber-200 backdrop-blur-sm transition-colors duration-200 hover:bg-amber-500/25 hover:text-amber-100 min-h-[44px] min-w-[44px]"
                aria-label={`Détails de ${title}`}
              >
                <Info className="w-4 h-4" />
                <span className="hidden sm:inline">Détails</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
