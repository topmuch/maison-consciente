'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Clock,
  ChefHat,
  Loader2,
  Sparkles,
  Globe,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/auth-store';
import { GoldenButton } from '@/components/shared/golden-button';
import { RecipeCard, type Recipe } from './recipe-card';
import { TheMealDBCard, TheMealDBGridSkeleton } from './TheMealDBCard';
import type { ExternalMeal } from '@/actions/themealdb-recipes';

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function parseJsonArray(raw: string): string[] {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/* ═══════════════════════════════════════════════════════
   LOADING SKELETONS
   ═══════════════════════════════════════════════════════ */

function RecipeGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl overflow-hidden">
          <Skeleton className="h-40 w-full bg-white/[0.04]" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4 bg-white/[0.06]" />
            <Skeleton className="h-3 w-full bg-white/[0.04]" />
            <Skeleton className="h-3 w-1/2 bg-white/[0.04]" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-14 rounded-full bg-white/[0.04]" />
              <Skeleton className="h-5 w-14 rounded-full bg-white/[0.04]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RECIPE DETAIL DIALOG
   ═══════════════════════════════════════════════════════ */

function RecipeDetailDialog({
  recipe,
  open,
  onClose,
}: {
  recipe: Recipe | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!recipe) return null;

  const tags = parseJsonArray(recipe.tags);
  const ingredients = parseJsonArray(recipe.ingredients);
  const steps = parseJsonArray(recipe.steps);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glass-strong rounded-2xl border-white/[0.08] max-h-[85vh] overflow-y-auto scrollbar-luxe">
        <DialogHeader>
          {/* Image */}
          <div className="relative h-48 -mx-6 -mt-2 mb-4 rounded-t-2xl overflow-hidden">
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
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
                {recipe.title}
              </DialogTitle>
              {recipe.description && (
                <DialogDescription className="text-sm text-[#64748b] mt-1.5 leading-relaxed">
                  {recipe.description}
                </DialogDescription>
              )}
            </div>
            {recipe.prepTimeMin > 0 && (
              <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-gold text-xs text-[var(--accent-primary)] font-medium">
                <Clock className="w-3.5 h-3.5" />
                {recipe.prepTimeMin} min
              </div>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  className="bg-[var(--accent-primary)]/[0.07] text-[var(--accent-primary)]/80 border-0 text-[10px] font-medium px-2.5 py-0.5 rounded-full"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </DialogHeader>

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-serif font-semibold text-[#e2e8f0] mb-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              Ingrédients
            </h3>
            <ul className="space-y-1.5">
              {ingredients.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-[#94a3b8] flex items-start gap-2 leading-relaxed"
                >
                  <span className="text-[var(--accent-primary)] mt-1.5 shrink-0">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-serif font-semibold text-[#e2e8f0] mb-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#c77d5a]" />
              Préparation
            </h3>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-[#94a3b8] leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════
   DISCOVERY TAB — TheMealDB Integration
   ═══════════════════════════════════════════════════════ */

function DiscoverySection() {
  const [discoverMeals, setDiscoverMeals] = useState<ExternalMeal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExternalMeal[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [favLoading, setFavLoading] = useState<string | null>(null);

  // Load discovery meals
  const loadDiscovery = useCallback(async () => {
    setIsDiscoverLoading(true);
    try {
      const res = await fetch('/api/themealdb?action=discover&count=6');
      if (res.ok) {
        const data = await res.json();
        setDiscoverMeals(data.meals || []);
      }
    } catch {
      // silent
    } finally {
      setIsDiscoverLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscovery();
  }, [loadDiscovery]);

  // Search handler with debounce
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);
      try {
        const res = await fetch(`/api/themealdb?action=search&query=${encodeURIComponent(query)}&limit=12`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.external || []);
        }
      } catch {
        // silent
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, []);

  const handleFavorite = useCallback((meal: ExternalMeal) => {
    // In production, this would POST to /api/recipes to create a local copy
    setFavLoading(meal.id);
    setTimeout(() => setFavLoading(null), 1500);
  }, []);

  const displayMeals = hasSearched ? searchResults : discoverMeals;

  return (
    <div className="space-y-6">
      {/* Discovery header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-tertiary)]/20 to-[var(--accent-tertiary)]/5 border border-[var(--accent-tertiary)]/20 flex items-center justify-center glow-violet">
            <Globe className="w-5 h-5 text-[var(--accent-tertiary)]" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-gradient-gold">
              Découverte internationale
            </h2>
            <p className="text-sm text-[#64748b] mt-0.5">
              Explorez des recettes du monde entier via TheMealDB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GoldenButton variant="ghost" size="sm" onClick={loadDiscovery} loading={isDiscoverLoading}>
            <RefreshCw className="w-4 h-4" />
            Nouveautés
          </GoldenButton>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
        <Input
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Rechercher une recette (ex: chicken, risotto, french…)"
          className="pl-10 pr-10 h-11 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm placeholder:text-[#475569] focus:border-[var(--accent-primary)]/30 focus:ring-[var(--accent-primary)]/10"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#e2e8f0] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results grid */}
      {isDiscoverLoading || isSearching ? (
        <TheMealDBGridSkeleton count={6} />
      ) : displayMeals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayMeals.map((meal, i) => (
            <TheMealDBCard
              key={meal.id}
              meal={meal}
              index={i}
              onAddFavorite={handleFavorite}
              isFavoriteLoading={favLoading === meal.id}
            />
          ))}
        </div>
      ) : hasSearched ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-tertiary)]/[0.06] border border-[var(--accent-tertiary)]/10 flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-[var(--accent-tertiary)]/40" />
          </div>
          <p className="text-sm font-medium text-[#64748b]">
            Aucun résultat pour &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-xs text-[#475569] mt-1.5 max-w-[280px] leading-relaxed">
            Essayez un autre terme ou explorez nos suggestions ci-dessous.
          </p>
          <button
            onClick={loadDiscovery}
            className="mt-4 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary-light)] transition-colors"
          >
            Voir les suggestions
          </button>
        </div>
      ) : null}
    </div>
  );
}

import React from 'react';

/* ═══════════════════════════════════════════════════════
   RECIPE LIST — With tabs (Local / Discovery)
   ═══════════════════════════════════════════════════════ */

type TabValue = 'local' | 'discover';

export function RecipeList() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabValue>('local');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchRecipes = useCallback(async () => {
    try {
      const res = await fetch('/api/recipes');
      if (res.ok) {
        const data = await res.json();
        setRecipes(data.recipes || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setDialogOpen(true);
  };

  const isOwner = user?.role === 'owner' || user?.role === 'superadmin';

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary-dark)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center glow-gold">
              <BookOpen className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-gradient-gold">
                Recettes
              </h1>
              <p className="text-sm text-[#64748b] mt-0.5">
                {loading
                  ? 'Chargement des recettes…'
                  : activeTab === 'local'
                    ? `${recipes.length} recette${recipes.length !== 1 ? 's' : ''} locale${recipes.length !== 1 ? 's' : ''}`
                    : 'Explorez le catalogue international'}
              </p>
            </div>
          </div>

          {activeTab === 'local' && isOwner && (
            <GoldenButton variant="outline" size="sm">
              <Plus className="w-4 h-4" />
              Ajouter
            </GoldenButton>
          )}
        </div>
      </motion.div>

      {/* ═══ TABS ═══ */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit"
      >
        {([
          { value: 'local' as TabValue, label: 'Mes recettes', icon: BookOpen },
          { value: 'discover' as TabValue, label: 'Découverte', icon: Globe },
        ]).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-300
              ${activeTab === value
                ? 'bg-[var(--accent-primary)]/[0.10] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20'
                : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.03] border border-transparent'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </motion.div>

      {/* ═══ TAB CONTENT ═══ */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        {activeTab === 'local' ? (
          /* ── Local Recipes ── */
          loading ? (
            <RecipeGridSkeleton />
          ) : recipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((recipe, i) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  index={i}
                  onClick={() => handleRecipeClick(recipe)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/[0.06] border border-[var(--accent-primary)]/10 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-[var(--accent-primary)]/40" />
              </div>
              <p className="text-sm font-medium text-[#64748b]">
                Aucune recette disponible
              </p>
              <p className="text-xs text-[#475569] mt-1.5 max-w-[280px] leading-relaxed">
                Les recettes apparaîtront ici une fois ajoutées par les propriétaires du foyer.
              </p>
            </div>
          )
        ) : (
          /* ── Discovery (TheMealDB) ── */
          <DiscoverySection />
        )}
      </motion.div>

      {/* ═══ RECIPE DETAIL DIALOG ═══ */}
      <RecipeDetailDialog
        recipe={selectedRecipe}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
