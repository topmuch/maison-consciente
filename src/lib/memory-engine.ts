/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Memory Engine (Cœur Intelligent)
   
   Manages user preferences, learning mode, and proactive
   suggestions. The system remembers what users like and
   progressively personalizes responses.
   ═══════════════════════════════════════════════════════ */

import { prisma } from '@/lib/db';
import {
  DEFAULT_USER_PREFERENCES,
  MUSIC_GENRES,
  ZODIAC_SIGNS,
  isValidZodiacSign,
} from './config';

export interface UserPreferences {
  musicGenre: string | null;
  zodiacSign: string | null;
  dietaryRestrictions: string[];
  learningMode: boolean;
  knownInterests: string[];
}

/** Recent action history (kept in-memory, max 50 entries) */
interface RecentAction {
  intent: string;
  detail?: string;
  timestamp: number;
}

const MAX_HISTORY = 50;
const actionHistory: RecentAction[] = [];

// ── Preference Getters/Setters ──

/**
 * Get user preferences for a household.
 * Returns defaults if none stored.
 */
export async function getPreferences(householdId: string): Promise<UserPreferences> {
  try {
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: { userPreferences: true },
    });
    if (household?.userPreferences && typeof household.userPreferences === 'object') {
      return { ...DEFAULT_USER_PREFERENCES, ...(household.userPreferences as Partial<UserPreferences>) };
    }
  } catch { /* fallback to defaults */ }
  return { ...DEFAULT_USER_PREFERENCES };
}

/**
 * Set a single preference key for a household.
 */
export async function setPreference(
  householdId: string,
  key: keyof UserPreferences,
  value: unknown
): Promise<UserPreferences> {
  const current = await getPreferences(householdId);
  const updated = { ...current, [key]: value };

  await prisma.household.update({
    where: { id: householdId },
    data: { userPreferences: updated as any },
  });

  return updated;
}

/**
 * Set multiple preferences at once.
 */
export async function setPreferences(
  householdId: string,
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  const current = await getPreferences(householdId);
  const updated = { ...current, ...updates };

  await prisma.household.update({
    where: { id: householdId },
    data: { userPreferences: updated as any },
  });

  return updated;
}

// ── Action History ──

/**
 * Record a user action (intent) in the in-memory history.
 */
export function recordAction(intent: string, detail?: string): void {
  actionHistory.push({ intent, detail, timestamp: Date.now() });
  if (actionHistory.length > MAX_HISTORY) actionHistory.shift();
}

/**
 * Get recent action history (last N entries).
 */
export function getRecentActions(limit: number = 20): RecentAction[] {
  return actionHistory.slice(-limit);
}

/**
 * Count how many times an intent was triggered recently (last 24h).
 */
export function countRecentIntent(intent: string): number {
  const oneDayAgo = Date.now() - 86400000;
  return actionHistory.filter(
    a => a.intent === intent && a.timestamp >= oneDayAgo
  ).length;
}

// ── Learning & Suggestions ──

/**
 * Suggest a learning question based on recent usage patterns.
 * Returns null if learning mode is off or no suggestion available.
 */
export async function suggestLearning(householdId: string): Promise<string | null> {
  const prefs = await getPreferences(householdId);
  if (!prefs.learningMode) return null;

  const musicCount = countRecentIntent('music') + countRecentIntent('ambiance');
  const recipeCount = countRecentIntent('recipe');
  const newsCount = countRecentIntent('news') + countRecentIntent('actualites');
  const weatherCount = countRecentIntent('weather') + countRecentIntent('meteo');

  // Pattern: user frequently asks for music but hasn't set a genre
  if (musicCount >= 3 && !prefs.musicGenre) {
    recordAction('learning_suggestion', 'music_genre');
    return "Je remarque que vous écoutez souvent de la musique. Avez-vous un genre préféré ? Jazz, classique, rock ?";
  }

  // Pattern: user asks for recipes but hasn't set dietary restrictions
  if (recipeCount >= 3 && prefs.dietaryRestrictions.length === 0) {
    recordAction('learning_suggestion', 'dietary');
    return "Vous aimez les recettes ! Avez-vous des restrictions alimentaires que je devrais connaître ? Végétarien, sans gluten ?";
  }

  // Pattern: user checks weather often — suggest zodiac
  if (weatherCount >= 3 && !prefs.zodiacSign) {
    recordAction('learning_suggestion', 'zodiac');
    return "Je pourrais vous donner votre horoscope quotidien ! Quel est votre signe astrologique ?";
  }

  // Pattern: user reads news but no preferred source set
  if (newsCount >= 5) {
    recordAction('learning_suggestion', 'news_source');
    return "Vous suivez beaucoup l'actualité. Souhaitez-vous que je privilégie un source en particulier ?";
  }

  return null;
}

/**
 * Process a potential preference declaration from user speech.
 * E.g. "j'aime le jazz" → set musicGenre to "jazz"
 * Returns true if a preference was detected and saved.
 */
export async function processPreferenceFromSpeech(
  householdId: string,
  text: string
): Promise<{ detected: boolean; message?: string }> {
  const lower = text.toLowerCase();

  // Music genre detection
  for (const genre of MUSIC_GENRES) {
    if (lower.includes(`j'aime ${genre}`) || lower.includes(`j'adore ${genre}`) || lower.includes(`je kiffe ${genre}`)) {
      const prefs = await setPreference(householdId, 'musicGenre', genre);
      recordAction('preference_set', `musicGenre:${genre}`);
      return {
        detected: true,
        message: `C'est noté ! Je mémorise que vous aimez le ${genre}. Je vous en proposerai plus souvent.`,
      };
    }
    if (lower.includes(`je n'aime pas ${genre}`) || lower.includes(`j'aime pas ${genre}`)) {
      recordAction('preference_rejected', `musicGenre:${genre}`);
      return {
        detected: true,
        message: `Compris, pas de ${genre} alors !`,
      };
    }
  }

  // Zodiac sign detection
  for (const sign of ZODIAC_SIGNS) {
    if (lower.includes(`mon signe est ${sign}`) || lower.includes(`je suis ${sign}`) || lower.includes(`signe ${sign}`)) {
      await setPreference(householdId, 'zodiacSign', sign);
      recordAction('preference_set', `zodiacSign:${sign}`);
      return {
        detected: true,
        message: `Parfait ! Je mémorise que vous êtes ${sign.charAt(0).toUpperCase() + sign.slice(1)}. Je vous donnerai votre horoscope chaque matin.`,
      };
    }
  }

  // Dietary restriction detection
  if (lower.includes('végétarien') || lower.includes('vegetarien')) {
    const prefs = await getPreferences(householdId);
    if (!prefs.dietaryRestrictions.includes('végétarien')) {
      await setPreference(householdId, 'dietaryRestrictions', [...prefs.dietaryRestrictions, 'végétarien']);
      recordAction('preference_set', 'dietary:végétarien');
      return { detected: true, message: "Noté ! Je vous proposerai des recettes végétariennes." };
    }
  }

  if (lower.includes('sans gluten') || lower.includes('intolérant gluten') || lower.includes('coeliaque')) {
    const prefs = await getPreferences(householdId);
    if (!prefs.dietaryRestrictions.includes('sans gluten')) {
      await setPreference(householdId, 'dietaryRestrictions', [...prefs.dietaryRestrictions, 'sans gluten']);
      recordAction('preference_set', 'dietary:sans gluten');
      return { detected: true, message: "Compris ! Je filtrerai les recettes sans gluten pour vous." };
    }
  }

  return { detected: false };
}

/**
 * Clear all learned preferences for a household (reset to defaults).
 */
export async function clearMemory(householdId: string): Promise<UserPreferences> {
  await prisma.household.update({
    where: { id: householdId },
    data: { userPreferences: DEFAULT_USER_PREFERENCES as any },
  });
  actionHistory.length = 0;
  return { ...DEFAULT_USER_PREFERENCES };
}
