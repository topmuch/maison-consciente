'use client';

/* ═══════════════════════════════════════════════════════
   THEMEALDB CARD — Dark Luxe recipe card
   
   Displays external recipe with image, badges, ingredients.
   Supports: hover animation, responsive, accessibility.
   "Voir sur TheMealDB" + "Ajouter aux favoris locaux".
   ═══════════════════════════════════════════════════════ */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChefHat,
  Globe,
  Tag,
  Heart,
  ExternalLink,
  Star,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { ExternalMeal } from '@/actions/themealdb-recipes';

/* ─── Props ─── */

interface TheMealDBCardProps {
  meal: ExternalMeal;
  index?: number;
  onAddFavorite?: (meal: ExternalMeal) => void;
  isFavoriteLoading?: boolean;
}

/* ─── Difficulty config ─── */

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  facile: {
    label: 'Facile',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10 border-emerald-400/20',
  },
  moyen: {
    label: 'Moyen',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10 border-amber-400/20',
  },
  avancé: {
    label: 'Avancé',
    color: 'text-rose-400',
    bgColor: 'bg-rose-400/10 border-rose-400/20',
  },
};

/* ─── Animation ─── */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

/* ─── COMPONENT ─── */

export function TheMealDBCard({
  meal,
  index = 0,
  onAddFavorite,
  isFavoriteLoading = false,
}: TheMealDBCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const diff = DIFFICULTY_CONFIG[meal.estimatedDifficulty] || DIFFICULTY_CONFIG.moyen;

  const handleFavorite = () => {
    setIsFavorited(true);
    onAddFavorite?.(meal);
  };

  return (
    <>
      {/* ═══ CARD ═══ */}
      <motion.div
        custom={index}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.02 }}
        className="group cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
        <div className="glass rounded-2xl inner-glow overflow-hidden transition-all duration-500 hover:shadow-[0_0_24px_oklch(0.78_0.14_85/12%)] hover:border-[var(--accent-primary)]/20">
          {/* Image */}
          <div className="relative h-44 overflow-hidden">
            {meal.thumbnail ? (
              <img
                src={meal.thumbnail}
                alt={meal.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--accent-primary)]/10 via-[#8b5cf6]/5 to-[#c77d5a]/10 flex items-center justify-center">
                <ChefHat className="w-12 h-12 text-[var(--accent-primary)]/30 transition-colors duration-500 group-hover:text-[var(--accent-primary)]/50" />
              </div>
            )}

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12]/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

            {/* External badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full glass-strong text-[10px] text-[#94a3b8] font-medium">
              <Globe className="w-3 h-3" />
              TheMealDB
            </div>

            {/* Ingredient count */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-strong text-[10px] text-[#e2e8f0] font-medium">
              <Utensils className="w-3 h-3 text-[var(--accent-primary)]" />
              {meal.ingredientCount} ingrédient{meal.ingredientCount !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-base font-serif font-semibold text-foreground tracking-tight leading-snug line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors duration-300">
                {meal.title}
              </h3>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {/* Category */}
              {meal.category && (
                <Badge className="bg-[var(--accent-primary)]/[0.07] text-[var(--accent-primary)]/80 border-0 text-[9px] font-medium px-2 py-0.5 rounded-full">
                  <Tag className="w-2.5 h-2.5 mr-1" />
                  {meal.category}
                </Badge>
              )}

              {/* Area */}
              {meal.area && (
                <Badge className="bg-[var(--accent-tertiary)]/[0.07] text-[var(--accent-tertiary)]/80 border-0 text-[9px] font-medium px-2 py-0.5 rounded-full">
                  <Globe className="w-2.5 h-2.5 mr-1" />
                  {meal.area}
                </Badge>
              )}

              {/* Difficulty */}
              <Badge className={`${diff.bgColor} ${diff.color} border text-[9px] font-medium px-2 py-0.5 rounded-full`}>
                <Star className="w-2.5 h-2.5 mr-1" />
                {diff.label}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {/* Favorite button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavorite();
                }}
                disabled={isFavorited || isFavoriteLoading}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
                  transition-all duration-300
                  ${isFavorited
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-white/[0.04] text-[#94a3b8] border border-white/[0.06] hover:bg-[var(--accent-primary)]/[0.08] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/20'
                  }
                  ${isFavoriteLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                `}
                aria-label={isFavorited ? 'Déjà ajouté aux favoris' : 'Ajouter aux favoris locaux'}
              >
                {isFavoriteLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Heart className={`w-3 h-3 ${isFavorited ? 'fill-current' : ''}`} />
                )}
                {isFavorited ? 'Ajouté' : 'Favoris'}
              </motion.button>

              {/* External link */}
              <a
                href={`https://www.themealdb.com/meal/${meal.id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] text-[#94a3b8] border border-white/[0.06] hover:bg-white/[0.08] hover:text-[#e2e8f0] transition-all duration-300"
                aria-label={`Voir ${meal.title} sur TheMealDB`}
              >
                <ExternalLink className="w-3 h-3" />
                Source
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ DETAIL DIALOG ═══ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg glass-strong rounded-2xl border-white/[0.08] max-h-[85vh] overflow-y-auto scrollbar-luxe">
          <DialogHeader>
            {/* Image */}
            <div className="relative h-52 -mx-6 -mt-2 mb-4 rounded-t-2xl overflow-hidden">
              {meal.thumbnail ? (
                <img
                  src={meal.thumbnail}
                  alt={meal.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--accent-primary)]/10 via-[#8b5cf6]/5 to-[#c77d5a]/10 flex items-center justify-center">
                  <ChefHat className="w-16 h-16 text-[var(--accent-primary)]/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/20 to-transparent" />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="font-serif text-xl text-[#e2e8f0]">
                  {meal.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-[#64748b] mt-1.5">
                  Recette {meal.area ? `${meal.area}` : 'internationale'}
                  {meal.category ? ` · ${meal.category}` : ''}
                </DialogDescription>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-gold text-xs text-[var(--accent-primary)] font-medium">
                <Utensils className="w-3.5 h-3.5" />
                {meal.ingredientCount} ingrédients
              </div>
            </div>

            {/* Tags & Badges */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {meal.category && (
                <Badge className="bg-[var(--accent-primary)]/[0.07] text-[var(--accent-primary)]/80 border-0 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
                  {meal.category}
                </Badge>
              )}
              {meal.area && (
                <Badge className="bg-[var(--accent-tertiary)]/[0.07] text-[var(--accent-tertiary)]/80 border-0 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
                  {meal.area}
                </Badge>
              )}
              <Badge className={`${diff.bgColor} ${diff.color} border text-[10px] font-medium px-2.5 py-0.5 rounded-full`}>
                {diff.label}
              </Badge>
              {meal.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} className="bg-white/[0.04] text-[#94a3b8] border-0 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
          </DialogHeader>

          {/* Ingredients */}
          {meal.ingredients.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between text-sm font-serif font-semibold text-[#e2e8f0] mb-2.5 hover:text-[var(--accent-primary)] transition-colors duration-300"
                aria-expanded={expanded}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                  Ingrédients ({meal.ingredients.length})
                </span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    {meal.ingredients.map((ing, i) => (
                      <li
                        key={i}
                        className="text-sm text-[#94a3b8] flex items-start gap-2 leading-relaxed"
                      >
                        <span className="text-[var(--accent-primary)] mt-1.5 shrink-0">•</span>
                        <span>
                          {ing.measure && (
                            <span className="text-[var(--accent-secondary)]/80 font-medium">{ing.measure} </span>
                          )}
                          {ing.name}
                        </span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Instructions */}
          {meal.instructions && (
            <div className="mt-5">
              <h3 className="text-sm font-serif font-semibold text-[#e2e8f0] mb-2.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#c77d5a]" />
                Préparation
              </h3>
              <div className="text-sm text-[#94a3b8] leading-relaxed whitespace-pre-line">
                {meal.instructions}
              </div>
            </div>
          )}

          {/* External link */}
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <a
              href={`https://www.themealdb.com/meal/${meal.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[#94a3b8] hover:bg-white/[0.08] hover:text-[#e2e8f0] transition-all duration-300"
            >
              <ExternalLink className="w-4 h-4" />
              Voir sur TheMealDB
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Loading skeleton ─── */

export function TheMealDBCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <Skeleton className="h-44 w-full bg-white/[0.04]" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 bg-white/[0.06]" />
        <Skeleton className="h-3 w-full bg-white/[0.04]" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full bg-white/[0.04]" />
          <Skeleton className="h-5 w-14 rounded-full bg-white/[0.04]" />
          <Skeleton className="h-5 w-12 rounded-full bg-white/[0.04]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-lg bg-white/[0.04]" />
          <Skeleton className="h-8 w-14 rounded-lg bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

/* ─── Grid skeleton ─── */

export function TheMealDBGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <TheMealDBCardSkeleton key={i} />
      ))}
    </div>
  );
}
