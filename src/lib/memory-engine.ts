// ═══════════════════════════════════════════════════════
// MAISON CONSCIENTE — Memory Engine
// Tracks user preferences, learning mode, and action history
// ═══════════════════════════════════════════════════════

import { db } from '@/lib/db';

/* ── Types ── */
interface UserPreferences {
  musicGenre?: string | null;
  zodiacSign?: string | null;
  dietaryRestrictions?: string[];
  learningMode?: boolean;
  knownInterests?: string[];
  favoriteRecipes?: string[];
  lastQueries?: { query: string; timestamp: string }[];
  preferredNewsSources?: string[];
  wakeTime?: string | null;
  sleepTime?: string | null;
  preferredTemperature?: string | null;
  language?: string | null;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  musicGenre: null,
  zodiacSign: null,
  dietaryRestrictions: [],
  learningMode: true,
  knownInterests: [],
  favoriteRecipes: [],
  lastQueries: [],
  preferredNewsSources: ['franceinfo', 'lemonde'],
  wakeTime: null,
  sleepTime: null,
  preferredTemperature: null,
  language: 'fr-FR',
};

/* ── Helpers ── */
function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === 'object' && value !== null) return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

function mergeDefaults(partial: Partial<UserPreferences>): UserPreferences {
  return { ...DEFAULT_PREFERENCES, ...partial };
}

/* ═══════════════════════════════════════════════════════
   GET / SET PREFERENCES
   ═══════════════════════════════════════════════════════ */

export async function getPreferences(householdId: string): Promise<UserPreferences> {
  try {
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: { userPreferences: true },
    });
    if (!household) return { ...DEFAULT_PREFERENCES };
    return mergeDefaults(safeJsonParse<UserPreferences>(household.userPreferences, {}));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function setPreference(
  householdId: string,
  key: keyof UserPreferences,
  value: unknown,
): Promise<boolean> {
  try {
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: { userPreferences: true },
    });
    if (!household) return false;

    const prefs = mergeDefaults(safeJsonParse<UserPreferences>(household.userPreferences, {}));
    (prefs as Record<string, unknown>)[key] = value;

    await db.household.update({
      where: { id: householdId },
      data: { userPreferences: prefs as any },
    });
    return true;
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════
   LEARNING / SUGGESTIONS
   ═══════════════════════════════════════════════════════ */

export async function addInterest(householdId: string, interest: string): Promise<void> {
  const prefs = await getPreferences(householdId);
  const interests = new Set(prefs.knownInterests || []);
  interests.add(interest.toLowerCase());
  await setPreference(householdId, 'knownInterests', Array.from(interests));
}

export async function recordQuery(householdId: string, query: string): Promise<void> {
  const prefs = await getPreferences(householdId);
  const queries = [...(prefs.lastQueries || [])];
  queries.unshift({ query: query.toLowerCase(), timestamp: new Date().toISOString() });
  // Keep only last 50 queries
  if (queries.length > 50) queries.length = 50;
  await setPreference(householdId, 'lastQueries', queries);
}

export async function suggestLearning(
  householdId: string,
  context: string,
): Promise<{ suggestion: string | null; confidence: number }> {
  const prefs = await getPreferences(householdId);
  if (!prefs.learningMode) return { suggestion: null, confidence: 0 };

  const interests = prefs.knownInterests || [];

  // Suggest based on context
  const contextLower = context.toLowerCase();

  // Music suggestion
  if (contextLower.includes('musique') || contextLower.includes('son') || contextLower.includes('ambiance')) {
    if (prefs.musicGenre && interests.includes(prefs.musicGenre.toLowerCase())) {
      return {
        suggestion: `Je remarque que vous aimez ${prefs.musicGenre}. Voulez-vous que je mette une ambiance ${prefs.musicGenre} ?`,
        confidence: 0.7,
      };
    }
    if (!prefs.musicGenre && interests.length > 0) {
      return {
        suggestion: 'Vous n\'avez pas encore de genre musical préféré enregistré. Quel style de musique vous plaît ?',
        confidence: 0.4,
      };
    }
  }

  // Recipe suggestion
  if (contextLower.includes('recette') || contextLower.includes('cuisine') || contextLower.includes('manger')) {
    if (prefs.dietaryRestrictions && prefs.dietaryRestrictions.length > 0) {
      return {
        suggestion: `Je sais que vous avez des restrictions : ${prefs.dietaryRestrictions.join(', ')}. Je vais filtrer les recettes en conséquence.`,
        confidence: 0.6,
      };
    }
    if (interests.some(i => i.includes('cuisine'))) {
      return {
        suggestion: 'Je vois que vous aimez la cuisine ! Voulez-vous une recette spéciale aujourd\'hui ?',
        confidence: 0.5,
      };
    }
  }

  // General learning prompt if we have few interests
  if (interests.length < 3 && Math.random() < 0.3) {
    return {
      suggestion: 'Plus j\'apprends vos préférences, mieux je peux vous aider. N\'hésitez pas à me dire ce que vous aimez !',
      confidence: 0.3,
    };
  }

  return { suggestion: null, confidence: 0 };
}

/* ═══════════════════════════════════════════════════════
   ACTION HISTORY
   ═══════════════════════════════════════════════════════ */

export async function getActionHistory(householdId: string, limit = 10): Promise<{ query: string; timestamp: string }[]> {
  const prefs = await getPreferences(householdId);
  return (prefs.lastQueries || []).slice(0, limit);
}

export async function clearMemory(householdId: string): Promise<boolean> {
  try {
    await db.household.update({
      where: { id: householdId },
      data: { userPreferences: DEFAULT_PREFERENCES as any },
    });
    return true;
  } catch {
    return false;
  }
}
