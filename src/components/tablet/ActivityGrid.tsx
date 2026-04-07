'use client';

/* ═══════════════════════════════════════════════════════
   ACTIVITY GRID — Responsive grid with category filtering
   
   Displays ActivityCards in a responsive grid with
   horizontally scrollable category filter pills, skeleton
   loading, empty state, and AnimatePresence transitions.
   ═══════════════════════════════════════════════════════ */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { MapPin, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ActivityCard from './ActivityCard';
import type { ActivityCardProps } from './ActivityCard';

/* ─── Types ─── */

interface ActivityGridProps {
  activities: ActivityCardProps[];
  householdName?: string;
  loading?: boolean;
}

/* ─── Category list ─── */

const ALL_CATEGORIES = [
  'Culture',
  'Sport',
  'Nature',
  'Gastronomie',
  'Bien-être',
  'Shopping',
  'Transport',
  'Loisir',
] as const;

/* ─── Category pill animation variants ─── */

const pillVariants = {
  idle: { scale: 1 },
  active: { scale: 1.02 },
  tap: { scale: 0.97 },
};

/* ─── Grid item animation ─── */

const gridItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: i * 0.06,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

/* ─── Skeleton card ─── */

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 overflow-hidden" style={{ minHeight: '280px' }}>
      <div className="p-4 flex flex-col gap-3 h-full">
        {/* Top badges */}
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-20 rounded-full bg-white/5" />
          <Skeleton className="h-6 w-20 rounded-full bg-white/5" />
        </div>

        {/* Description lines */}
        <div className="flex-1 space-y-2 mt-1">
          <Skeleton className="h-3 w-full rounded bg-white/5" />
          <Skeleton className="h-3 w-2/3 rounded bg-white/5" />
        </div>

        {/* Info tags */}
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14 rounded-full bg-white/5" />
          <Skeleton className="h-5 w-16 rounded-full bg-white/5" />
        </div>

        {/* Title */}
        <Skeleton className="h-6 w-3/4 rounded bg-white/5" />

        {/* Address */}
        <Skeleton className="h-3 w-1/2 rounded bg-white/5" />

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-11 w-20 rounded-xl bg-white/5" />
          <Skeleton className="h-11 w-20 rounded-xl bg-white/5" />
          <Skeleton className="h-11 w-20 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}

/* ─── Empty state ─── */

function EmptyState({ category }: { category: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
        <MapPin className="w-8 h-8 text-white/20" />
      </div>
      <h3 className="text-lg font-serif text-white/60 mb-2">
        Aucune activité trouvée
      </h3>
      <p className="text-sm text-white/30 max-w-xs leading-relaxed">
        {category === 'Tout'
          ? 'Aucune activité disponible pour le moment. Revenez bientôt !'
          : `Aucune activité dans la catégorie "${category}". Essayez une autre catégorie.`}
      </p>
    </motion.div>
  );
}

/* ─── Main Component ─── */

export default function ActivityGrid({
  activities,
  householdName,
  loading = false,
}: ActivityGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Tout');

  /* ─── Count activities per category ─── */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Tout': activities.length };
    for (const cat of ALL_CATEGORIES) {
      counts[cat] = activities.filter((a) => a.category === cat).length;
    }
    return counts;
  }, [activities]);

  /* ─── Filter activities ─── */
  const filteredActivities = useMemo(() => {
    if (activeCategory === 'Tout') return activities;
    return activities.filter((a) => a.category === activeCategory);
  }, [activities, activeCategory]);

  /* ─── All filter items ─── */
  const filterItems = ['Tout', ...ALL_CATEGORIES] as const;

  return (
    <div className="w-full space-y-6">
      {/* ─── Category filter pills ─── */}
      <div className="relative">
        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-luxe"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Hide scrollbar via Tailwind-compatible inline style */}
          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>

          <LayoutGroup>
            {filterItems.map((cat) => {
              const isActive = activeCategory === cat;
              const count = categoryCounts[cat] ?? 0;

              return (
                <motion.button
                  key={cat}
                  layout
                  variants={pillVariants}
                  whileHover="active"
                  whileTap="tap"
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    relative shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full
                    text-sm font-medium transition-all duration-300 min-h-[44px]
                    cursor-pointer select-none
                    ${
                      isActive
                        ? 'bg-amber-500/20 border border-amber-400/40 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.12)]'
                        : 'bg-white/[0.04] border border-white/[0.08] text-white/50 backdrop-blur-sm hover:bg-white/[0.08] hover:text-white/70 hover:border-white/[0.15]'
                    }
                  `}
                  aria-pressed={isActive}
                  aria-label={`Filtrer par ${cat}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activePillGlow"
                      className="absolute inset-0 rounded-full bg-amber-500/10 pointer-events-none"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {cat === 'Tout' && <Sparkles className="w-3.5 h-3.5" />}
                    {cat}
                    <span
                      className={`
                        text-[11px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                        ${isActive ? 'bg-amber-500/30 text-amber-100' : 'bg-white/[0.06] text-white/40'}
                      `}
                    >
                      {count}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </LayoutGroup>
        </div>

        {/* Fade edges for scroll indication */}
        <div className="pointer-events-none absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-slate-950 to-transparent z-10 rounded-l-full" />
        <div className="pointer-events-none absolute top-0 right-0 w-4 h-full bg-gradient-to-l from-slate-950 to-transparent z-10 rounded-r-full" />
      </div>

      {/* ─── Loading skeleton state ─── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </div>
      )}

      {/* ─── Activity grid ─── */}
      {!loading && (
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            {filteredActivities.length > 0 ? (
              <motion.div
                key={activeCategory}
                layout
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {filteredActivities.map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    layout
                    variants={gridItemVariants}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <ActivityCard
                      {...activity}
                      householdName={householdName}
                      index={i}
                      onDetail={activity.onDetail}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <EmptyState category={activeCategory} />
            )}
          </AnimatePresence>
        </LayoutGroup>
      )}

      {/* ─── Result count ─── */}
      {!loading && filteredActivities.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-white/30"
        >
          {filteredActivities.length} activité{filteredActivities.length > 1 ? 's' : ''}
          {activeCategory !== 'Tout' && ` en ${activeCategory}`}
        </motion.p>
      )}
    </div>
  );
}
