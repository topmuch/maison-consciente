/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Configuration
   
   Default settings, constants, and validation helpers
   for the Maellis intelligent assistant.
   ═══════════════════════════════════════════════════════ */

// ── Assistant Names ──

export const ASSISTANT_NAMES = [
  'Maellis',
  'Jonia',
  'Amina',
  'Corine',
  'Clara',
  'Cathy',
  'Mouna',
] as const;

export type AssistantName = (typeof ASSISTANT_NAMES)[number];

export const DEFAULT_ASSISTANT_NAME = 'Maellis' as const;

export function isValidAssistantName(name: string): boolean {
  return (ASSISTANT_NAMES as readonly string[]).includes(name);
}

// ── Voice Settings ──

export interface VoiceSettings {
  wakeWord: string;
  wakeWordEnabled: boolean;
  rate: number;
  volume: number;
  language: string;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  wakeWord: DEFAULT_ASSISTANT_NAME,
  wakeWordEnabled: true,
  rate: 1.0,
  volume: 0.8,
  language: 'fr-FR',
};

// ── Music Genres ──

export const MUSIC_GENRES = [
  'jazz',
  'classique',
  'rock',
  'pop',
  'electro',
  'hip-hop',
  'r&b',
  'soul',
  'blues',
  'reggae',
  'chanson française',
  'musique classique',
  'lo-fi',
  'ambient',
  'bossa nova',
  'funk',
  'metal',
  'country',
  'folk',
  'techno',
] as const;

export type MusicGenre = (typeof MUSIC_GENRES)[number];

// ── Zodiac Signs ──

export const ZODIAC_SIGNS = [
  'bélier',
  'taureau',
  'gémeaux',
  'cancer',
  'lion',
  'vierge',
  'balance',
  'scorpion',
  'sagittaire',
  'capricorne',
  'verseau',
  'poissons',
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

/**
 * Validate that a string is a recognized zodiac sign.
 */
export function isValidZodiacSign(sign: string): boolean {
  return (ZODIAC_SIGNS as readonly string[]).includes(sign.toLowerCase());
}

// ── Default User Preferences ──

export interface DefaultUserPreferences {
  musicGenre: string | null;
  zodiacSign: string | null;
  dietaryRestrictions: string[];
  learningMode: boolean;
  knownInterests: string[];
}

export const DEFAULT_USER_PREFERENCES: DefaultUserPreferences = {
  musicGenre: null,
  zodiacSign: null,
  dietaryRestrictions: [],
  learningMode: true,
  knownInterests: [],
};

// ── Dietary Restrictions ──

export const DIETARY_RESTRICTIONS = [
  'végétarien',
  'végétalien',
  'sans gluten',
  'sans lactose',
  'sans porc',
  'halal',
  'casher',
  'sans noix',
  'sans fruits à coque',
  'sans œufs',
  'pescétarien',
  'cétogène',
  'paleo',
] as const;

// ── Intent Categories (for Voice Command Router) ──

export const INTENT_CATEGORIES = [
  'music',
  'ambiance',
  'recipe',
  'news',
  'actualites',
  'weather',
  'meteo',
  'lights',
  'lumieres',
  'temperature',
  'timer',
  'minuteur',
  'reminder',
  'rappel',
  'shopping',
  'courses',
  'mood',
  'humeur',
  'horoscope',
  'translation',
  'traduction',
  'help',
  'aide',
  'joke',
  'blague',
  'greeting',
  'salutation',
  'learning_suggestion',
  'preference_set',
  'preference_rejected',
] as const;

// ── Difficulty Levels ──

export const DIFFICULTY_LEVELS = ['facile', 'moyen', 'difficile'] as const;

// ── Meal Types ──

export const MEAL_TYPES = ['petit-déjeuner', 'déjeuner', 'goûter', 'dîner', 'collation'] as const;

// ── Recipe Tags ──

export const RECIPE_TAGS = [
  'entrée',
  'plat',
  'dessert',
  'boisson',
  'amuse-bouche',
  'rapide',
  'classique',
  'français',
  'italien',
  'asiatique',
  'végétarien',
  'vegan',
  'sans gluten',
  'healthy',
  'hiver',
  'été',
  'automne',
  'printemps',
  'familial',
  'romantique',
  'brunch',
  'fromage',
  'viande',
  'poisson',
  'pâtes',
  'soupes',
  'salade',
  'grillé',
  'mijoté',
  'pâtisserie',
  'réconfortant',
] as const;
