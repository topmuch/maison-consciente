'use client';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Tablet Activities Display Page

   Shows recommended activities & outings in a beautiful
   grid for guests/visitors on the tablet display.

   Token-based auth, same Dark Luxe theme as main display.
   Uses existing ActivityGrid + ActivityCard components.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityGrid from '@/components/tablet/ActivityGrid';
import { getActivities } from '@/actions/activity-actions';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  X,
  Phone,
  Navigation,
  Clock,
  Star,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import type { ActivityCardProps } from '@/components/tablet/ActivityCard';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface ActivityItem {
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
}

/* ── Category emoji map ── */

const CATEGORY_EMOJI: Record<string, string> = {
  Culture: '🎭',
  Sport: '⚽',
  Nature: '🌿',
  Gastronomie: '🍷',
  'Bien-être': '🧘',
  Shopping: '🛍️',
  Transport: '🚂',
  Loisir: '🎪',
  Parc: '🌳',
  Musée: '🏛️',
  Restaurant: '🍽️',
  Café: '☕',
  Marché: '🧺',
  Spa: '♨️',
  Bar: '🍸',
  Plage: '🏖️',
};

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] || '📍';
}

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

/* ═══════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function ActivitiesPage() {
  const params = useParams();
  const token = params.token as string;

  /* ─── State ─── */
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [householdName, setHouseholdName] = useState<string>('Ma Maison');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  /* ─── Fetch activities ─── */
  const fetchActivities = useCallback(async () => {
    try {
      const result = await getActivities(token);
      if (result.success) {
        setActivities(result.activities || []);
        // Get household name
        const hhRes = await fetch(`/api/display/${token}`);
        if (hhRes.ok) {
          const hhData = await hhRes.json();
          setHouseholdName(hhData.householdName || 'Ma Maison');
        }
      } else {
        setError(result.error || 'Erreur');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeout = setTimeout(fetchActivities, 0);
    return () => clearTimeout(timeout);
  }, [fetchActivities]);

  /* ─── Detail handler (from ActivityCard) ─── */
  const handleDetail = useCallback((_activity: ActivityCardProps) => {
    // Map back from ActivityCardProps to ActivityItem for the sheet
    const item: ActivityItem = {
      id: _activity.id,
      title: _activity.title,
      category: _activity.category,
      description: _activity.description,
      distance: _activity.distance,
      link: _activity.link,
      isPartner: _activity.isPartner,
      whatsappNumber: _activity.whatsappNumber,
      image: _activity.image,
      priceHint: _activity.priceHint,
      hoursHint: _activity.hoursHint,
      address: _activity.address,
    };
    setSelectedActivity(item);
    setSheetOpen(true);
  }, []);

  /* ─── WhatsApp link builder ─── */
  const buildWhatsAppLink = useCallback(
    (activity: ActivityItem) => {
      const number = activity.whatsappNumber || '';
      const message = encodeURIComponent(
        `Bonjour, je suis au logement ${householdName}, je souhaite réserver pour ${activity.title}.`
      );
      return `https://wa.me/${number.replace(/[^0-9+]/g, '')}?text=${message}`;
    },
    [householdName]
  );

  /* ─── Geo link builder ─── */
  const buildGeoLink = useCallback((activity: ActivityItem) => {
    if (activity.address) {
      return `geo:0,0?q=${encodeURIComponent(activity.address)}`;
    }
    if (activity.link && activity.link.includes('google.com/maps')) {
      return activity.link;
    }
    if (activity.title) {
      return `geo:0,0?q=${encodeURIComponent(activity.title)}`;
    }
    return '#';
  }, []);

  /* ─── Build grid items with onDetail attached ─── */
  const gridItems: ActivityCardProps[] = activities.map((a) => ({
    ...a,
    householdName,
    onDetail: handleDetail,
  }));

  /* ═══════════════════════════════════════════════════════
     RENDER — LOADING
     ═══════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-amber-400 gap-4">
        <Loader2 className="animate-spin w-12 h-12" />
        <p className="text-xl font-serif font-light">Chargement des activités...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-red-400 gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <X className="w-8 h-8" />
        </div>
        <p className="text-xl font-serif">{error}</p>
        <button
          onClick={fetchActivities}
          className="mt-4 px-6 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors min-h-[48px]"
        >
          Réessayer
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDER — MAIN
     ═══════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-amber-500/[0.04] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-violet-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pb-8">
        {/* ═══════════════════════════════════════════
            1. TOP BAR
            ═══════════════════════════════════════════ */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
          }}
          className="pt-8 pb-6 border-b border-white/[0.06]"
        >
          <div className="flex items-center justify-between">
            {/* Back button + Title */}
            <div className="flex items-center gap-3">
              <Link
                href={`/display/${token}`}
                className="p-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Retour"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-light text-amber-100 tracking-tight">
                  Activités & Sorties
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">{householdName}</p>
              </div>
            </div>

            {/* Activity count */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-slate-400 font-medium">
                {activities.length} {activities.length > 1 ? 'activités' : 'activité'}
              </span>
            </div>
          </div>
        </motion.header>

        {/* ═══════════════════════════════════════════
            2. ACTIVITIES GRID
            ═══════════════════════════════════════════ */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="py-8"
        >
          {activities.length > 0 ? (
            <ActivityGrid
              activities={gridItems}
              householdName={householdName}
            />
          ) : (
            /* Empty state */
            <motion.div
              variants={fadeUp}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
                <MapPin className="w-10 h-10 text-slate-600" />
              </div>
              <h2 className="font-serif text-xl text-slate-300 mb-2">
                Aucune activité recommandée pour le moment
              </h2>
              <p className="text-sm text-slate-500 max-w-sm">
                Votre hôte n&apos;a pas encore ajouté d&apos;activités ou de sorties recommandées.
                Revenez bientôt !
              </p>
            </motion.div>
          )}
        </motion.section>

        {/* ═══════════════════════════════════════════
            3. FOOTER
            ═══════════════════════════════════════════ */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="pt-6 pb-4"
        >
          <div className="divider-gold mb-6" />
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-amber-400/20 text-xs">◆</span>
              <span className="font-serif text-sm text-gradient-gold tracking-wider">
                Maison Consciente
              </span>
              <span className="text-amber-400/20 text-xs">◆</span>
            </div>
            <p className="text-xs text-slate-600">v2.0</p>
          </div>
        </motion.footer>
      </div>

      {/* ═══════════════════════════════════════════
          DETAIL SHEET
          ═══════════════════════════════════════════ */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="bg-[#0a0f1e] border-t border-white/[0.06] rounded-t-3xl max-h-[85vh] overflow-y-auto scrollbar-luxe"
        >
          <SheetHeader className="pb-0">
            <SheetTitle className="sr-only">
              {selectedActivity?.title || 'Détails'}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Détails de l&apos;activité
            </SheetDescription>
          </SheetHeader>

          <AnimatePresence>
            {selectedActivity && (
              <motion.div
                key={selectedActivity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                }}
                className="px-6 pb-8 pt-2"
              >
                {/* Image banner */}
                {selectedActivity.image && (
                  <div className="relative -mx-6 -mt-2 mb-6 h-52 w-[calc(100%+3rem)] overflow-hidden rounded-t-3xl">
                    <img
                      src={selectedActivity.image}
                      alt={selectedActivity.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e]/50 to-transparent" />
                  </div>
                )}

                {/* Title + Badges */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-serif text-2xl text-amber-100 leading-tight">
                      {selectedActivity.title}
                    </h2>
                    {selectedActivity.isPartner && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                          Partenaire
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category badge */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-sm text-amber-200">
                      {getCategoryEmoji(selectedActivity.category)}{' '}
                      {selectedActivity.category}
                    </span>
                  </div>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {selectedActivity.distance && (
                    <div className="glass rounded-xl p-3 border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-1">
                        <Navigation className="w-4 h-4 text-amber-400/70" />
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Distance
                        </span>
                      </div>
                      <p className="text-sm text-slate-200">{selectedActivity.distance}</p>
                    </div>
                  )}

                  {selectedActivity.priceHint && (
                    <div className="glass rounded-xl p-3 border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">💰</span>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Tarif
                        </span>
                      </div>
                      <p className="text-sm text-slate-200">{selectedActivity.priceHint}</p>
                    </div>
                  )}

                  {selectedActivity.hoursHint && (
                    <div className="glass rounded-xl p-3 border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-amber-400/70" />
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Horaires
                        </span>
                      </div>
                      <p className="text-sm text-slate-200">{selectedActivity.hoursHint}</p>
                    </div>
                  )}

                  {selectedActivity.address && (
                    <div className="glass rounded-xl p-3 border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-amber-400/70" />
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Adresse
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {selectedActivity.address}
                      </p>
                    </div>
                  )}
                </div>

                {/* Full description */}
                {selectedActivity.description && (
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.15em] mb-3">
                      Description
                    </h3>
                    <div className="glass rounded-xl p-4 border border-white/[0.06]">
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                        {selectedActivity.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  {/* Y aller (geo link) */}
                  <a
                    href={buildGeoLink(selectedActivity)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors min-h-[48px]"
                  >
                    <Navigation className="w-4 h-4" />
                    Y aller
                  </a>

                  {/* Réserver (WhatsApp) */}
                  {selectedActivity.whatsappNumber && (
                    <a
                      href={buildWhatsAppLink(selectedActivity)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors min-h-[48px]"
                    >
                      <Phone className="w-4 h-4" />
                      Réserver
                    </a>
                  )}

                  {/* Site web */}
                  {selectedActivity.link && (
                    <a
                      href={selectedActivity.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors min-h-[48px]"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Site web
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>
    </div>
  );
}
