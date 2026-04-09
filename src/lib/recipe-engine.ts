// ═══════════════════════════════════════════════════════
// MAISON CONSCIENTE — Recipe Engine
// Local recipe search, random selection, step-by-step mode
// ═══════════════════════════════════════════════════════

import { LOCAL_RECIPES, type LocalRecipe } from './constants';

/* ── Types ── */
export interface RecipeSearchResult {
  recipe: LocalRecipe;
  matchReason: string;
}

export interface StepByStepRecipe {
  recipe: LocalRecipe;
  currentStep: number;
  totalSteps: number;
  currentInstruction: string;
  isComplete: boolean;
}

/* ═══════════════════════════════════════════════════════
   SEARCH
   ═══════════════════════════════════════════════════════ */

function normalize(text: string): string {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

export function searchRecipes(query: string, limit = 5): RecipeSearchResult[] {
  const queryNorm = normalize(query);
  const queryWords = queryNorm.split(/\s+/).filter(w => w.length > 2);

  const scored = LOCAL_RECIPES.map(recipe => {
    let score = 0;
    let reason = '';

    // Title match
    const titleNorm = normalize(recipe.title);
    if (titleNorm.includes(queryNorm)) { score += 10; reason = 'Titre correspondant'; }
    
    // Tag match
    const matchingTags = recipe.tags.filter(tag => 
      normalize(tag).includes(queryNorm) || 
      queryWords.some(w => normalize(tag).includes(w))
    );
    if (matchingTags.length > 0) { score += matchingTags.length * 5; reason = reason || `Tags: ${matchingTags.join(', ')}`; }

    // Ingredient match
    const matchingIngredients = recipe.ingredients.filter(ing =>
      queryWords.some(w => normalize(ing).includes(w))
    );
    if (matchingIngredients.length > 0) { score += matchingIngredients.length * 3; reason = reason || `Ingrédients: ${matchingIngredients.slice(0, 2).join(', ')}`; }

    // Description match
    const descNorm = normalize(recipe.description);
    if (descNorm.includes(queryNorm)) { score += 4; reason = reason || 'Description correspondante'; }

    // Difficulty match
    if (queryNorm.includes('facile') && recipe.difficulty === 'Facile') { score += 3; reason = 'Recette facile'; }
    if (queryNorm.includes('rapide') && (recipe.prepTimeMin + recipe.cookTimeMin) <= 30) { score += 5; reason = 'Recette rapide'; }

    return { recipe, score, matchReason: reason };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => ({ recipe: r.recipe, matchReason: r.matchReason }));
}

export function getRandomRecipe(): LocalRecipe {
  return LOCAL_RECIPES[Math.floor(Math.random() * LOCAL_RECIPES.length)];
}

export function getRecipeByTag(tag: string): LocalRecipe[] {
  return LOCAL_RECIPES.filter(r => 
    r.tags.some(t => normalize(t).includes(normalize(tag)))
  );
}

export function getQuickRecipes(maxTotalMin = 30): LocalRecipe[] {
  return LOCAL_RECIPES.filter(r => (r.prepTimeMin + r.cookTimeMin) <= maxTotalMin);
}

/* ═══════════════════════════════════════════════════════
   STEP-BY-STEP MODE
   ═══════════════════════════════════════════════════════ */

export function createStepByStep(recipe: LocalRecipe): StepByStepRecipe {
  return {
    recipe,
    currentStep: 0,
    totalSteps: recipe.steps.length,
    currentInstruction: recipe.steps[0],
    isComplete: false,
  };
}

export function advanceStep(state: StepByStepRecipe): StepByStepRecipe {
  const nextStep = state.currentStep + 1;
  if (nextStep >= state.totalSteps) {
    return { ...state, currentStep: state.totalSteps, currentInstruction: '', isComplete: true };
  }
  return {
    ...state,
    currentStep: nextStep,
    currentInstruction: state.recipe.steps[nextStep],
  };
}

/* ═══════════════════════════════════════════════════════
   VOICE FORMATTING
   ═══════════════════════════════════════════════════════ */

export function formatRecipeForVoice(recipe: LocalRecipe, detailed = false): string {
  const totalTime = recipe.prepTimeMin + recipe.cookTimeMin;
  let text = `${recipe.title}. ${recipe.description}. `;
  text += `Temps de préparation : ${recipe.prepTimeMin} minutes. Temps de cuisson : ${recipe.cookTimeMin} minutes. Temps total : ${totalTime} minutes. `;
  text += `Pour ${recipe.servings} personnes. Difficulté ${recipe.difficulty}.`;

  if (detailed) {
    text += ' Ingrédients : ';
    text += recipe.ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('. ');
    text += '. Étapes : ';
    text += recipe.steps.map((step, i) => `Étape ${i + 1}. ${step}`).join('. ');
  }

  return text;
}

export function formatStepForVoice(stepState: StepByStepRecipe): string {
  if (stepState.isComplete) {
    return `Félicitations ! Vous avez terminé la recette de ${stepState.recipe.title}. Bon appétit !`;
  }
  return `Étape ${stepState.currentStep + 1} sur ${stepState.totalSteps}. ${stepState.currentInstruction}`;
}

/* ═══════════════════════════════════════════════════════
   VOICE ACTION COMPATIBILITY WRAPPERS
   ═══════════════════════════════════════════════════════ */

/** Voice-friendly recipe summary */
export interface VoiceRecipeSummary {
  title: string;
  description: string;
  ingredientCount: number;
  stepCount: number;
}

/** Search recipes returning simplified voice-friendly results */
export function searchLocalRecipes(householdId: string, query: string): VoiceRecipeSummary[] {
  const results = searchRecipes(query);
  return results.map(r => ({
    title: r.recipe.title,
    description: r.recipe.description,
    ingredientCount: r.recipe.ingredients.length,
    stepCount: r.recipe.steps.length,
  }));
}

/** Smart search: returns a single best match with voice-ready summary */
export function smartRecipeSearch(householdId: string, query: string): VoiceRecipeSummary | null {
  const results = searchRecipes(query, 1);
  if (results.length === 0) return null;
  const r = results[0].recipe;
  return {
    title: r.title,
    description: r.description,
    ingredientCount: r.ingredients.length,
    stepCount: r.steps.length,
  };
}

/** Step-by-step session store (per householdId) */
const recipeSessions = new Map<string, StepByStepRecipe>();

/** Navigate recipe steps for voice (next/prev). Returns null if no session. */
export function getRecipeStep(
  householdId: string,
  direction: 'next' | 'prev',
): { step: string; stepNumber: number; totalSteps: number; finished?: boolean } | null {
  const session = recipeSessions.get(householdId);
  if (!session || session.isComplete) return null;

  let updated: StepByStepRecipe;
  if (direction === 'next') {
    updated = advanceStep(session);
  } else {
    // Go back one step
    const prev = Math.max(0, session.currentStep - 1);
    updated = {
      ...session,
      currentStep: prev,
      currentInstruction: session.recipe.steps[prev],
      isComplete: false,
    };
  }

  recipeSessions.set(householdId, updated);

  if (updated.isComplete) {
    return {
      step: `Félicitations ! Vous avez terminé la recette de ${updated.recipe.title}. Bon appétit !`,
      stepNumber: updated.totalSteps,
      totalSteps: updated.totalSteps,
      finished: true,
    };
  }

  return {
    step: updated.currentInstruction,
    stepNumber: updated.currentStep + 1,
    totalSteps: updated.totalSteps,
  };
}

/** Get ingredients list formatted for TTS. Requires an active recipe session. */
export async function getIngredientsForTTS(householdId: string): Promise<string> {
  const session = recipeSessions.get(householdId);
  if (!session) {
    throw new Error('No active recipe session');
  }
  const ingredients = session.recipe.ingredients
    .map((ing, i) => `${i + 1}. ${ing}`)
    .join('. ');
  return `Pour la recette de ${session.recipe.title}, il vous faut : ${ingredients}.`;
}
