// ═══════════════════════════════════════════════════════
// MAISON CONSCIENTE — Global Configuration
// Assistant name, available names, system constants
// ═══════════════════════════════════════════════════════

export const ASSISTANT_CONFIG = {
  /** Default assistant name */
  defaultName: 'Maellis' as const,

  /** All available assistant names */
  availableNames: [
    'Maellis',
    'Jonia',
    'Amina',
    'Corine',
    'Clara',
    'Cathy',
    'Mouna',
  ] as const,

  /** Minimum confidence threshold for wake word detection */
  wakeWordConfidence: 0.7,

  /** Default voice settings */
  defaultVoiceSettings: {
    enabled: true,
    wakeWord: 'Maellis',
    wakeWordEnabled: true,
    rate: 1.0,
    volume: 0.8,
    language: 'fr-FR',
    conversationWindow: 10, // seconds to wait for follow-up
  },

  /** Maximum retries for API calls */
  maxApiRetries: 2,

  /** Cache TTL in seconds */
  cacheTtl: {
    weather: 1800,      // 30 min
    news: 1800,          // 30 min
    horoscope: 3600,     // 1 hour
    airQuality: 3600,    // 1 hour
    recipes: 86400,      // 24 hours
  },
} as const;

export type AssistantName = (typeof ASSISTANT_CONFIG.availableNames)[number];

/** Validate if a name is a valid assistant name */
export function isValidAssistantName(name: string): name is AssistantName {
  return (ASSISTANT_CONFIG.availableNames as readonly string[]).includes(name);
}

// ═══════════════════════════════════════════════════════
// BACKWARD-COMPATIBLE RE-EXPORTS
// These keep existing imports working across the codebase.
// ═══════════════════════════════════════════════════════

export const ASSISTANT_NAMES = ASSISTANT_CONFIG.availableNames;
export const DEFAULT_ASSISTANT_NAME = ASSISTANT_CONFIG.defaultName;
export const DEFAULT_VOICE_SETTINGS = ASSISTANT_CONFIG.defaultVoiceSettings;

// ── Voice Settings ──

export interface VoiceSettings {
  wakeWord: string;
  wakeWordEnabled: boolean;
  rate: number;
  volume: number;
  language: string;
}

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
