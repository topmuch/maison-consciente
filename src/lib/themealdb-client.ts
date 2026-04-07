/* ═══════════════════════════════════════════════════════
   THEMEALDB CLIENT — Typed & secure API client
   
   Server-side only. Fetch with 5s timeout.
   Silent error handling — returns [] or null, never throws.
   ═══════════════════════════════════════════════════════ */

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
const FETCH_TIMEOUT_MS = 5_000;

/* ─── Types (TheMealDB raw responses) ─── */

export interface TheMealDBMealRaw {
  idMeal: string;
  strMeal: string;
  strMealThumb: string | null;
  strCategory: string | null;
  strArea: string | null;
  strInstructions: string | null;
  strTags: string | null;
  strYoutube: string | null;
  strSource: string | null;
  strIngredient1: string | null;
  strIngredient2: string | null;
  strIngredient3: string | null;
  strIngredient4: string | null;
  strIngredient5: string | null;
  strIngredient6: string | null;
  strIngredient7: string | null;
  strIngredient8: string | null;
  strIngredient9: string | null;
  strIngredient10: string | null;
  strIngredient11: string | null;
  strIngredient12: string | null;
  strIngredient13: string | null;
  strIngredient14: string | null;
  strIngredient15: string | null;
  strIngredient16: string | null;
  strIngredient17: string | null;
  strIngredient18: string | null;
  strIngredient19: string | null;
  strIngredient20: string | null;
  strMeasure1: string | null;
  strMeasure2: string | null;
  strMeasure3: string | null;
  strMeasure4: string | null;
  strMeasure5: string | null;
  strMeasure6: string | null;
  strMeasure7: string | null;
  strMeasure8: string | null;
  strMeasure9: string | null;
  strMeasure10: string | null;
  strMeasure11: string | null;
  strMeasure12: string | null;
  strMeasure13: string | null;
  strMeasure14: string | null;
  strMeasure15: string | null;
  strMeasure16: string | null;
  strMeasure17: string | null;
  strMeasure18: string | null;
  strMeasure19: string | null;
  strMeasure20: string | null;
}

export interface TheMealDBSearchResponse {
  meals: TheMealDBMealRaw[] | null;
}

export interface TheMealDBFilterResponse {
  meals: { idMeal: string; strMeal: string; strMealThumb: string | null }[] | null;
}

export interface TheMealDBListResponse {
  meals: { strCategory: string }[] | null;
}

/* ─── Parsed types for frontend ─── */

export interface ParsedIngredient {
  name: string;
  measure: string;
}

export interface TheMealDBMeal {
  id: string;
  title: string;
  thumbnail: string | null;
  category: string | null;
  area: string | null;
  instructions: string | null;
  tags: string[];
  youtubeUrl: string | null;
  sourceUrl: string | null;
  ingredients: ParsedIngredient[];
}

export interface TheMealDBSummary {
  id: string;
  title: string;
  thumbnail: string | null;
}

/* ─── Fetch helper with timeout ─── */

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 }, // ISR cache: 1h
    });

    clearTimeout(timer);

    if (!res.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[TheMealDB] HTTP ${res.status} for ${url}`);
      }
      return null;
    }

    return await res.json() as T;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.warn(`[TheMealDB] Timeout after ${FETCH_TIMEOUT_MS}ms`);
      } else {
        console.warn(`[TheMealDB] Fetch error:`, err);
      }
    }
    return null;
  }
}

/* ─── Parse helpers ─── */

function parseIngredients(meal: TheMealDBMealRaw): ParsedIngredient[] {
  const ingredients: ParsedIngredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const nameKey = `strIngredient${i}` as keyof TheMealDBMealRaw;
    const measureKey = `strMeasure${i}` as keyof TheMealDBMealRaw;

    const name = (meal[nameKey] as string | null)?.trim();
    const measure = (meal[measureKey] as string | null)?.trim();

    if (name && name.length > 0) {
      ingredients.push({ name, measure: measure || '' });
    }
  }
  return ingredients;
}

function parseTags(tagsRaw: string | null): string[] {
  if (!tagsRaw) return [];
  return tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
}

function parseMeal(raw: TheMealDBMealRaw): TheMealDBMeal {
  return {
    id: raw.idMeal,
    title: raw.strMeal,
    thumbnail: raw.strMealThumb,
    category: raw.strCategory,
    area: raw.strArea,
    instructions: raw.strInstructions,
    tags: parseTags(raw.strTags),
    youtubeUrl: raw.strYoutube,
    sourceUrl: raw.strSource,
    ingredients: parseIngredients(raw),
  };
}

/* ─── API functions ─── */

/**
 * Search meals by name (partial match).
 * Returns parsed meals or [] on error.
 */
export async function searchMeals(query: string): Promise<TheMealDBMeal[]> {
  if (!query || query.trim().length === 0) return [];

  const encoded = encodeURIComponent(query.trim());
  const data = await safeFetch<TheMealDBSearchResponse>(
    `${BASE_URL}/search.php?s=${encoded}`
  );

  if (!data?.meals) return [];
  return data.meals.map(parseMeal);
}

/**
 * Get a single meal by its TheMealDB ID.
 * Returns parsed meal or null on error/not found.
 */
export async function getMealById(id: string): Promise<TheMealDBMeal | null> {
  if (!id) return null;

  const data = await safeFetch<TheMealDBSearchResponse>(
    `${BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`
  );

  if (!data?.meals || data.meals.length === 0) return null;
  return parseMeal(data.meals[0]);
}

/**
 * Filter meals by category name (e.g. "Beef", "Chicken", "Dessert").
 * Returns summaries (id, title, thumbnail) or [].
 */
export async function getMealsByCategory(category: string): Promise<TheMealDBSummary[]> {
  if (!category) return [];

  const data = await safeFetch<TheMealDBFilterResponse>(
    `${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`
  );

  if (!data?.meals) return [];
  return data.meals.map((m) => ({
    id: m.idMeal,
    title: m.strMeal,
    thumbnail: m.strMealThumb,
  }));
}

/**
 * Filter meals by area/cuisine (e.g. "French", "Italian", "Chinese").
 * Returns summaries (id, title, thumbnail) or [].
 */
export async function getMealsByArea(area: string): Promise<TheMealDBSummary[]> {
  if (!area) return [];

  const data = await safeFetch<TheMealDBFilterResponse>(
    `${BASE_URL}/filter.php?a=${encodeURIComponent(area)}`
  );

  if (!data?.meals) return [];
  return data.meals.map((m) => ({
    id: m.idMeal,
    title: m.strMeal,
    thumbnail: m.strMealThumb,
  }));
}

/**
 * Filter meals by main ingredient (e.g. "chicken", "rice").
 * Returns summaries (id, title, thumbnail) or [].
 */
export async function getMealsByIngredient(ingredient: string): Promise<TheMealDBSummary[]> {
  if (!ingredient) return [];

  const data = await safeFetch<TheMealDBFilterResponse>(
    `${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`
  );

  if (!data?.meals) return [];
  return data.meals.map((m) => ({
    id: m.idMeal,
    title: m.strMeal,
    thumbnail: m.strMealThumb,
  }));
}

/**
 * Get a random meal suggestion.
 * Returns parsed meal or null on error.
 */
export async function getRandomMeal(): Promise<TheMealDBMeal | null> {
  const data = await safeFetch<TheMealDBSearchResponse>(
    `${BASE_URL}/random.php`
  );

  if (!data?.meals || data.meals.length === 0) return null;
  return parseMeal(data.meals[0]);
}

/**
 * List all available categories.
 * Returns category names or [].
 */
export async function listCategories(): Promise<string[]> {
  const data = await safeFetch<TheMealDBListResponse>(
    `${BASE_URL}/list.php?c=list`
  );

  if (!data?.meals) return [];
  return data.meals.map((m) => m.strCategory);
}
