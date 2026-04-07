/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Recipe Engine
   Local-first recipe management with optional API fallback.
   Supports step-by-step vocal mode.
   ═══════════════════════════════════════════════════════ */

import { LOCAL_RECIPES, type LocalRecipe } from './constants';

export interface RecipeResult {
  title: string;
  description: string;
  prepTimeMin: number;
  cookTimeMin: number;
  servings: number;
  difficulty: string;
  tags: string[];
  ingredients: string[];
  steps: string[];
  source: 'local' | 'api';
}

/**
 * Search local recipes by keyword (title, tags, ingredients).
 */
export function searchLocalRecipes(query: string): RecipeResult[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();

  return LOCAL_RECIPES
    .filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q)) ||
      r.ingredients.some(i => i.toLowerCase().includes(q))
    )
    .slice(0, 10)
    .map(localToResult);
}

/**
 * Get a random recipe from local database.
 * Optionally filter by tag.
 */
export function getRandomRecipe(tag?: string): RecipeResult {
  let pool = LOCAL_RECIPES;
  if (tag) {
    const t = tag.toLowerCase();
    pool = pool.filter(r => r.tags.some(tag => tag.toLowerCase().includes(t)));
  }
  if (pool.length === 0) pool = LOCAL_RECIPES;

  const recipe = pool[Math.floor(Math.random() * pool.length)];
  return localToResult(recipe);
}

/**
 * Get recipe by ID (local).
 */
export function getLocalRecipeById(id: string): RecipeResult | null {
  const recipe = LOCAL_RECIPES.find(r => r.id === id);
  return recipe ? localToResult(recipe) : null;
}

/**
 * Get a specific step for vocal "next step" mode.
 * Returns formatted text suitable for TTS.
 */
export function getRecipeStep(recipeId: string, stepIndex: number): { text: string; isLast: boolean } | null {
  const recipe = LOCAL_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return null;

  if (stepIndex >= recipe.steps.length || stepIndex < 0) return null;

  const isLast = stepIndex === recipe.steps.length - 1;
  const stepNum = stepIndex + 1;
  const totalSteps = recipe.steps.length;

  return {
    text: `Étape ${stepNum} sur ${totalSteps}. ${recipe.steps[stepIndex]}`,
    isLast,
  };
}

/**
 * Get ingredient list formatted for TTS.
 */
export function getIngredientsForTTS(recipeId: string): string | null {
  const recipe = LOCAL_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return null;

  const intro = `Pour ${recipe.title}, il vous faut : `;
  const list = recipe.ingredients.slice(0, 10).join(', ');
  const more = recipe.ingredients.length > 10 ? ` et ${recipe.ingredients.length - 10} autres ingrédients.` : '.';
  return intro + list + more;
}

/**
 * Try to fetch from TheMealDB API if enabled.
 * Returns null if disabled or on error.
 */
export async function fetchExternalRecipe(query?: string): Promise<RecipeResult | null> {
  try {
    const endpoint = query
      ? `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
      : 'https://www.themealdb.com/api/json/v1/1/random.php';

    const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const data = await res.json();
    const meal = data.meals?.[0];
    if (!meal) return null;

    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const meas = meal[`strMeasure${i}`];
      if (ing && ing.trim()) {
        ingredients.push(`${meas ? meas.trim() + ' de ' : ''}${ing.trim()}`);
      }
    }

    const steps = (meal.strInstructions || '')
      .split(/\r?\n/)
      .map(s => s.replace(/^\d+\.\s*/, '').trim())
      .filter(s => s.length > 0)
      .map(s => s.length > 60 ? s.slice(0, 57) + '...' : s)
      .slice(0, 8);

    return {
      title: meal.strMeal || 'Recette inconnue',
      description: meal.strCategory || '',
      prepTimeMin: 0,
      cookTimeMin: 0,
      servings: 4,
      difficulty: 'moyen',
      tags: [meal.strCategory || 'international'].filter(Boolean),
      ingredients,
      steps,
      source: 'api',
    };
  } catch {
    return null;
  }
}

/**
 * Smart recipe search: local first, API fallback if enabled.
 */
export async function smartRecipeSearch(
  query: string,
  useApi: boolean = false
): Promise<RecipeResult[]> {
  const local = searchLocalRecipes(query);
  if (local.length > 0 || !useApi) return local;

  const api = await fetchExternalRecipe(query);
  return api ? [api] : local;
}

function localToResult(r: LocalRecipe): RecipeResult {
  return {
    ...r,
    source: 'local' as const,
    cookTimeMin: r.cookTimeMin ?? 0,
  };
}
