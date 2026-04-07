'use server';

/* ═══════════════════════════════════════════════════════
   THEMEALDB RECIPES — Hybrid Server Actions
   
   Combines local DB recipes with TheMealDB for enrichment.
   All API calls go through cache (min 1h TTL).
   Zod validation before returning to frontend.
   ═══════════════════════════════════════════════════════ */

import { z } from 'zod';
import { db } from '@/lib/db';
import {
  searchMeals,
  getMealById,
  getMealsByCategory,
  getMealsByArea,
  getRandomMeal,
  listCategories,
  type TheMealDBMeal,
  type TheMealDBSummary,
} from '@/lib/themealdb-client';
import { withCache } from '@/lib/recipe-cache';

/* ─── Zod Schemas ─── */

const ParsedIngredientSchema = z.object({
  name: z.string(),
  measure: z.string(),
});

const ExternalMealSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string().nullable(),
  category: z.string().nullable(),
  area: z.string().nullable(),
  instructions: z.string().nullable(),
  tags: z.array(z.string()),
  youtubeUrl: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  ingredients: z.array(ParsedIngredientSchema),
  ingredientCount: z.number().int().min(0),
  estimatedDifficulty: z.enum(['facile', 'moyen', 'avancé']),
});

const ExternalSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string().nullable(),
});

const LocalRecipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  prepTimeMin: z.number().int(),
  tags: z.array(z.string()),
  ingredients: z.array(z.string()),
  steps: z.array(z.string()),
  imageUrl: z.string().nullable(),
  source: z.literal('local'),
});

const HybridRecipeSchema = z.union([LocalRecipeSchema, ExternalMealSchema]);

/* ─── Types ─── */

export type ExternalMeal = z.infer<typeof ExternalMealSchema>;
export type ExternalSummary = z.infer<typeof ExternalSummarySchema>;
export type LocalRecipe = z.infer<typeof LocalRecipeSchema>;
export type HybridRecipe = z.infer<typeof HybridRecipeSchema>;

export interface SearchHybridResult {
  local: LocalRecipe[];
  external: ExternalMeal[];
  total: number;
}

export interface SuggestedRecipe {
  recipe: ExternalMeal;
  reason: string;
}

/* ─── Helpers ─── */

/** Estimate difficulty from ingredient count */
function estimateDifficulty(meal: TheMealDBMeal): 'facile' | 'moyen' | 'avancé' {
  const count = meal.ingredients.length;
  if (count <= 6) return 'facile';
  if (count <= 12) return 'moyen';
  return 'avancé';
}

/** Transform TheMealDBMeal into validated ExternalMeal */
function toExternalMeal(meal: TheMealDBMeal): ExternalMeal {
  return ExternalMealSchema.parse({
    id: meal.id,
    title: meal.title,
    thumbnail: meal.thumbnail,
    category: meal.category,
    area: meal.area,
    instructions: meal.instructions,
    tags: meal.tags,
    youtubeUrl: meal.youtubeUrl,
    sourceUrl: meal.sourceUrl,
    ingredients: meal.ingredients,
    ingredientCount: meal.ingredients.length,
    estimatedDifficulty: estimateDifficulty(meal),
  });
}

/** Fetch local recipes from DB */
async function fetchLocalRecipes(householdId?: string | null): Promise<LocalRecipe[]> {
  try {
    const where = householdId
      ? { isActive: true, OR: [{ householdId: null }, { householdId }] }
      : { isActive: true, householdId: null };

    const recipes = await db.recipe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return recipes.map((r) => {
      let tags: string[] = [];
      let ingredients: string[] = [];
      let steps: string[] = [];

      try { tags = typeof r.tags === 'string' ? JSON.parse(r.tags) : []; } catch { /* keep empty */ }
      try { ingredients = typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : []; } catch { /* keep empty */ }
      try { steps = typeof r.steps === 'string' ? JSON.parse(r.steps) : []; } catch { /* keep empty */ }

      return LocalRecipeSchema.parse({
        id: r.id,
        title: r.title,
        description: r.description,
        prepTimeMin: r.prepTimeMin,
        tags,
        ingredients,
        steps,
        imageUrl: r.imageUrl,
        source: 'local',
      });
    });
  } catch {
    return [];
  }
}

/* ─── Season detection ─── */

function getCurrentSeason(): string {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

function getTimeMealType(hour: number): string {
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 17) return 'snack';
  if (hour >= 17 && hour < 21) return 'dinner';
  return 'late';
}

/* ═══════════════════════════════════════════════════════
   SERVER ACTIONS
   ═══════════════════════════════════════════════════════ */

/**
 * searchHybridRecipes — Fuses local + TheMealDB results.
 * Local recipes prioritized, then enriched with external.
 */
export async function searchHybridRecipes(
  query: string,
  limit: number = 12,
  householdId?: string | null
): Promise<SearchHybridResult> {
  const safeQuery = String(query || '').trim().slice(0, 100);
  if (!safeQuery) {
    return { local: [], external: [], total: 0 };
  }

  // Fetch local + external in parallel
  const [local, externalRaw] = await Promise.all([
    fetchLocalRecipes(householdId),
    withCache(
      `themealdb:search:${safeQuery.toLowerCase()}`,
      () => searchMeals(safeQuery),
    ).catch(() => [] as TheMealDBMeal[]),
  ]);

  // Filter local recipes matching query
  const queryLower = safeQuery.toLowerCase();
  const localFiltered = local.filter(
    (r) =>
      r.title.toLowerCase().includes(queryLower) ||
      r.tags.some((t) => t.toLowerCase().includes(queryLower)) ||
      r.description.toLowerCase().includes(queryLower)
  );

  // Transform & validate external results
  const external = externalRaw
    .slice(0, limit)
    .map(toExternalMeal);

  return {
    local: localFiltered.slice(0, limit),
    external,
    total: localFiltered.length + external.length,
  };
}

/**
 * suggestHybridRecipe — Contextual recipe suggestion.
 * Uses time of day, season, and categories for relevance.
 */
export async function suggestHybridRecipe(
  hour: number,
  season?: string
): Promise<SuggestedRecipe[]> {
  const currentSeason = season || getCurrentSeason();
  const mealType = getTimeMealType(hour);

  // Strategy: map meal type → TheMealDB category
  const categoryMap: Record<string, string[]> = {
    breakfast: ['Breakfast', 'Dessert'],
    lunch: ['Chicken', 'Beef', 'Pasta', 'Seafood', 'Vegetarian'],
    snack: ['Dessert', 'Side'],
    dinner: ['Chicken', 'Beef', 'Lamb', 'Pork', 'Seafood', 'Vegetarian'],
    late: ['Dessert'],
  };

  // Season-based category preference
  const seasonCategoryBoost: Record<string, string[]> = {
    spring: ['Vegetarian', 'Salad', 'Chicken'],
    summer: ['Salad', 'Seafood', 'Dessert'],
    autumn: ['Beef', 'Lamb', 'Pork', 'Soup'],
    winter: ['Soup', 'Stew', 'Lamb', 'Pork'],
  };

  const baseCategories = categoryMap[mealType] || ['Chicken', 'Beef'];
  const boostedCategories = seasonCategoryBoost[currentSeason] || [];

  // Combine with dedup
  const allCategories = [...new Set([...baseCategories, ...boostedCategories])];

  // Fetch from TheMealDB for 2-3 random categories
  const shuffled = allCategories.sort(() => Math.random() - 0.5).slice(0, 3);

  const results = await Promise.allSettled(
    shuffled.map(async (cat) => {
      const meals = await withCache(
        `themealdb:category:${cat}`,
        () => getMealsByCategory(cat),
      );
      return meals || [];
    })
  );

  // Flatten and pick a random meal from the results
  const allSummaries: TheMealDBSummary[] = results
    .filter((r): r is PromiseFulfilledResult<TheMealDBSummary[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  if (allSummaries.length === 0) {
    // Fallback: random meal
    const randomMeal = await withCache(
      `themealdb:random:${Math.floor(Math.random() * 20)}`, // 20 random slots
      () => getRandomMeal(),
    );
    if (randomMeal) {
      return [{
        recipe: toExternalMeal(randomMeal),
        reason: `Suggestion aléatoire pour ${mealType === 'breakfast' ? 'le matin' : mealType === 'lunch' ? 'le midi' : mealType === 'dinner' ? 'le dîner' : 'ce moment'}`,
      }];
    }
    return [];
  }

  // Pick 3 random meals from summaries
  const picks = allSummaries
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const detailedMeals = await Promise.allSettled(
    picks.map((pick) =>
      withCache(
        `themealdb:detail:${pick.id}`,
        () => getMealById(pick.id),
      )
    )
  );

  const suggestions: SuggestedRecipe[] = detailedMeals
    .filter((r): r is PromiseFulfilledResult<TheMealDBMeal | null> => r.status === 'fulfilled' && r.value !== null)
    .map((r) => ({
      recipe: toExternalMeal(r.value!),
      reason: `Recette de ${mealType === 'breakfast' ? 'matin' : mealType === 'lunch' ? 'midi' : mealType === 'dinner' ? 'soir' : 'collation'} — saison ${currentSeason}`,
    }));

  return suggestions;
}

/**
 * getMealDetailsExternal — Fetches full details for a TheMealDB meal.
 * Parses ingredients/measures into a structured array.
 */
export async function getMealDetailsExternal(
  id: string
): Promise<ExternalMeal | null> {
  if (!id) return null;

  const meal = await withCache(
    `themealdb:detail:${id}`,
    () => getMealById(id),
  );

  if (!meal) return null;
  return toExternalMeal(meal);
}

/**
 * getCategories — Lists all available TheMealDB categories.
 * Used for filter UI.
 */
export async function getCategories(): Promise<string[]> {
  return withCache(
    'themealdb:categories',
    () => listCategories(),
    24 * 3_600_000, // 24h cache for categories
  );
}

/**
 * browseByCategory — Browse meals by category with pagination.
 */
export async function browseByCategory(
  category: string,
  page: number = 1,
  perPage: number = 12
): Promise<{ meals: ExternalSummary[]; total: number }> {
  const summaries = await withCache(
    `themealdb:filter:cat:${category}`,
    () => getMealsByCategory(category),
  );

  const start = (page - 1) * perPage;
  const paged = (summaries || []).slice(start, start + perPage);

  return {
    meals: paged.map((s) => ExternalSummarySchema.parse(s)),
    total: (summaries || []).length,
  };
}

/**
 * browseByArea — Browse meals by cuisine area with pagination.
 */
export async function browseByArea(
  area: string,
  page: number = 1,
  perPage: number = 12
): Promise<{ meals: ExternalSummary[]; total: number }> {
  const summaries = await withCache(
    `themealdb:filter:area:${area}`,
    () => getMealsByArea(area),
  );

  const start = (page - 1) * perPage;
  const paged = (summaries || []).slice(start, start + perPage);

  return {
    meals: paged.map((s) => ExternalSummarySchema.parse(s)),
    total: (summaries || []).length,
  };
}

/**
 * discoverRandom — Get N random meals for discovery carousel.
 */
export async function discoverRandom(
  count: number = 6
): Promise<ExternalMeal[]> {
  const meals: ExternalMeal[] = [];

  for (let i = 0; i < count; i++) {
    const meal = await withCache(
      `themealdb:random:${i}`,
      () => getRandomMeal(),
    );
    if (meal) {
      meals.push(toExternalMeal(meal));
    }
  }

  return meals;
}
