/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — External APIs Central Registry

   15 free APIs organized by theme. Every API has:
   - Centralized config via ApiConfig model (Prisma)
   - In-memory cache (5min–24h depending on data freshness)
   - Automatic local fallback when disabled/errored
   - Rate limiting per token + global quota respect
   - 3s timeout on all external calls

   IMPORT: `import { apiRegistry } from '@/lib/external-apis'`
   ═══════════════════════════════════════════════════════ */

/* ─── Types ─── */

export type ApiKey =
  | 'RADIO_BROWSER' | 'GNEWS' | 'WIKIPEDIA' | 'THESPORTSDB'
  | 'OPENSKY' | 'NAVITIA' | 'YELP' | 'OPENFOODFACTS'
  | 'TMDB' | 'NASA' | 'OFFICIAL_JOKE' | 'QUOTEGARDEN'
  | 'HOLIDAYS' | 'DICTIONARY' | 'TIMEZONEDB'
  // Existing keys (backward compat)
  | 'FOURSQUARE' | 'DEEPL' | 'STRIPE' | 'RESEND'
  | 'OPENWEATHER' | 'GOOGLE_PLACES' | 'OPEN_METEO'
  | 'ICECAST' | 'NEWS_API' | 'TRANSIT' | 'SPORTS';

export interface ApiDefinition {
  key: ApiKey;
  name: string;
  description: string;
  theme: string;           // "audio", "news", "sport", "transport", "food", "entertainment", "knowledge", "utils", "core"
  baseUrl: string;
  requiresKey: boolean;
  quotaInfo: string;
  cacheTtlMs: number;      // 300000 = 5min, 1800000 = 30min, 86400000 = 24h
  timeoutMs: number;
  icon: string;            // Lucide icon name
  themeEmoji: string;      // Emoji for UI grouping
}

/* ─── API Registry ─── */

const API_DEFINITIONS: ApiDefinition[] = [
  // ═══ 🎵 AUDIO & RADIO ═══
  {
    key: 'RADIO_BROWSER',
    name: 'Radio Browser',
    description: 'Recherche de stations radio en ligne worldwide',
    theme: 'audio',
    baseUrl: 'https://api.radio-browser.info',
    requiresKey: false,
    quotaInfo: 'Illimité, aucune clé',
    cacheTtlMs: 1800000,
    timeoutMs: 3000,
    icon: 'Radio',
    themeEmoji: '🎵',
  },
  {
    key: 'ICECAST',
    name: 'Icecast (Radio)',
    description: 'Annuaire de stations radio en ligne (legacy)',
    theme: 'audio',
    baseUrl: 'https://directory.shoutcast.com',
    requiresKey: false,
    quotaInfo: 'Illimité, aucune clé',
    cacheTtlMs: 3600000,
    timeoutMs: 3000,
    icon: 'Radio',
    themeEmoji: '🎵',
  },

  // ═══ 📰 ACTUALITÉS & INFO ═══
  {
    key: 'GNEWS',
    name: 'GNews API',
    description: 'Flux d\'actualités en temps réel (FR)',
    theme: 'news',
    baseUrl: 'https://gnews.io',
    requiresKey: true,
    quotaInfo: '100 req/jour, clé gratuite',
    cacheTtlMs: 1800000,
    timeoutMs: 3000,
    icon: 'Newspaper',
    themeEmoji: '📰',
  },
  {
    key: 'WIKIPEDIA',
    name: 'Wikipedia API',
    description: 'Articles, résumés et définitions (FR)',
    theme: 'news',
    baseUrl: 'https://fr.wikipedia.org/api/rest_v1',
    requiresKey: false,
    quotaInfo: 'Illimité, aucune clé',
    cacheTtlMs: 86400000,
    timeoutMs: 3000,
    icon: 'BookOpen',
    themeEmoji: '📰',
  },
  {
    key: 'NEWS_API',
    name: 'News API (legacy)',
    description: 'Flux d\'actualités (legacy)',
    theme: 'news',
    baseUrl: 'https://newsapi.org',
    requiresKey: true,
    quotaInfo: '100 req/jour',
    cacheTtlMs: 1800000,
    timeoutMs: 3000,
    icon: 'Newspaper',
    themeEmoji: '📰',
  },

  // ═══ ⚽ SPORT ═══
  {
    key: 'THESPORTSDB',
    name: 'TheSportsDB',
    description: 'Scores, résultats et événements sportifs',
    theme: 'sport',
    baseUrl: 'https://www.thesportsdb.com',
    requiresKey: true,
    quotaInfo: 'Illimité, clé gratuite (Patreon)',
    cacheTtlMs: 300000,
    timeoutMs: 3000,
    icon: 'Trophy',
    themeEmoji: '⚽',
  },
  {
    key: 'SPORTS',
    name: 'TheSportsDB (legacy)',
    description: 'Scores sportifs (legacy key)',
    theme: 'sport',
    baseUrl: 'https://www.thesportsdb.com',
    requiresKey: true,
    quotaInfo: 'Illimité, clé gratuite',
    cacheTtlMs: 300000,
    timeoutMs: 3000,
    icon: 'Trophy',
    themeEmoji: '⚽',
  },

  // ═══ ✈️ TRANSPORT & VOYAGES ═══
  {
    key: 'OPENSKY',
    name: 'OpenSky Network',
    description: 'Vols en temps réel au-dessus d\'une zone',
    theme: 'transport',
    baseUrl: 'https://opensky-network.org/api',
    requiresKey: false,
    quotaInfo: 'Illimité (anon: 10 req/s)',
    cacheTtlMs: 60000,
    timeoutMs: 3000,
    icon: 'Plane',
    themeEmoji: '✈️',
  },
  {
    key: 'NAVITIA',
    name: 'Navitia.io',
    description: 'Transports en commun IDF',
    theme: 'transport',
    baseUrl: 'https://api.navitia.io',
    requiresKey: true,
    quotaInfo: '10000 req/mois, clé gratuite',
    cacheTtlMs: 300000,
    timeoutMs: 3000,
    icon: 'Bus',
    themeEmoji: '✈️',
  },
  {
    key: 'TRANSIT',
    name: 'Transport (legacy)',
    description: 'Trafic (legacy)',
    theme: 'transport',
    baseUrl: 'https://api.transit.com',
    requiresKey: true,
    quotaInfo: 'Custom',
    cacheTtlMs: 300000,
    timeoutMs: 3000,
    icon: 'Bus',
    themeEmoji: '✈️',
  },

  // ═══ 🍽️ RESTAURANTS & ALIMENTATION ═══
  {
    key: 'YELP',
    name: 'Yelp Fusion',
    description: 'Restaurants et commerces locaux',
    theme: 'food',
    baseUrl: 'https://api.yelp.com/v3',
    requiresKey: true,
    quotaInfo: '5000 req/jour, clé gratuite',
    cacheTtlMs: 1800000,
    timeoutMs: 3000,
    icon: 'UtensilsCrossed',
    themeEmoji: '🍽️',
  },
  {
    key: 'OPENFOODFACTS',
    name: 'Open Food Facts',
    description: 'Infos nutritionnelles par code-barres',
    theme: 'food',
    baseUrl: 'https://world.openfoodfacts.org',
    requiresKey: false,
    quotaInfo: 'Illimité, aucune clé',
    cacheTtlMs: 86400000,
    timeoutMs: 3000,
    icon: 'Apple',
    themeEmoji: '🍽️',
  },

  // ═══ 🎬 DIVERTISSEMENT & CINÉMA ═══
  {
    key: 'TMDB',
    name: 'TMDb',
    description: 'Films au cinéma, séries et notes',
    theme: 'entertainment',
    baseUrl: 'https://api.themoviedb.org/3',
    requiresKey: true,
    quotaInfo: 'Illimité, clé gratuite',
    cacheTtlMs: 3600000,
    timeoutMs: 3000,
    icon: 'Film',
    themeEmoji: '🎬',
  },
  {
    key: 'NASA',
    name: 'NASA API',
    description: 'Photo astronomique du jour (APOD)',
    theme: 'entertainment',
    baseUrl: 'https://api.nasa.gov',
    requiresKey: true,
    quotaInfo: '1000 req/heure, clé DEMO gratuite',
    cacheTtlMs: 86400000,
    timeoutMs: 3000,
    icon: 'Telescope',
    themeEmoji: '🎬',
  },
  {
    key: 'OFFICIAL_JOKE',
    name: 'Official Joke API',
    description: 'Blagues aléatoires (EN)',
    theme: 'entertainment',
    baseUrl: 'https://official-joke-api.appspot.com',
    requiresKey: false,
    quotaInfo: 'Illimité, aucune clé',
    cacheTtlMs: 300000,
    timeoutMs: 3000,
    icon: 'Laugh',
    themeEmoji: '🎬',
  },

  // ═══ 🧠 CONNAISSANCES & CULTURE ═══
  {
    key: 'QUOTEGARDEN',
    name: 'QuoteGarden',
    description: 'Citations et proverbes',
    theme: 'knowledge',
    baseUrl: 'https://quote-garden.onrender.com/api/v3',
    requiresKey: false,
    quotaInfo: 'Illimité, aucune clé',
    cacheTtlMs: 3600000,
    timeoutMs: 3000,
    icon: 'Quote',
    themeEmoji: '🧠',
  },

  // ═══ 🛠️ UTILITAIRES ═══
  {
    key: 'HOLIDAYS',
    name: 'Holidays API',
    description: 'Jours fériés par pays/année',
    theme: 'utils',
    baseUrl: 'https://holidays.abstractapi.com/v1',
    requiresKey: true,
    quotaInfo: '1000 req/mois, clé gratuite',
    cacheTtlMs: 86400000,
    timeoutMs: 3000,
    icon: 'Calendar',
    themeEmoji: '🛠️',
  },
  {
    key: 'DICTIONARY',
    name: 'Dictionary API',
    description: 'Définitions de mots (FR)',
    theme: 'utils',
    baseUrl: 'https://api.dictionaryapi.dev/api/v2',
    requiresKey: false,
    quotaInfo: 'Illimité, aucune clé',
    cacheTtlMs: 86400000,
    timeoutMs: 3000,
    icon: 'BookA',
    themeEmoji: '🛠️',
  },
  {
    key: 'TIMEZONEDB',
    name: 'TimezoneDB',
    description: 'Fuseaux horaires mondiaux',
    theme: 'utils',
    baseUrl: 'https://api.timezonedb.com',
    requiresKey: true,
    quotaInfo: 'Illimité, clé gratuite',
    cacheTtlMs: 3600000,
    timeoutMs: 3000,
    icon: 'Clock',
    themeEmoji: '🛠️',
  },

  // ═══ CORE / EXISTING ═══
  {
    key: 'OPEN_METEO',
    name: 'Open-Meteo (Météo)',
    description: 'Météo en temps réel — gratuit, sans clé',
    theme: 'core',
    baseUrl: 'https://api.open-meteo.com',
    requiresKey: false,
    quotaInfo: 'Illimité, aucune clé',
    cacheTtlMs: 300000,
    timeoutMs: 3000,
    icon: 'Sun',
    themeEmoji: '🌍',
  },
  {
    key: 'FOURSQUARE',
    name: 'Foursquare',
    description: 'Recherche de lieux et POI locaux',
    theme: 'core',
    baseUrl: 'https://api.foursquare.com',
    requiresKey: true,
    quotaInfo: 'Illimité (Patreon)',
    cacheTtlMs: 1800000,
    timeoutMs: 3000,
    icon: 'MapPin',
    themeEmoji: '🌍',
  },
  {
    key: 'DEEPL',
    name: 'DeepL',
    description: 'Traduction automatique multilingue',
    theme: 'core',
    baseUrl: 'https://api-free.deepl.com',
    requiresKey: true,
    quotaInfo: '500000 car/mois (free)',
    cacheTtlMs: 86400000,
    timeoutMs: 3000,
    icon: 'Languages',
    themeEmoji: '🌍',
  },
  {
    key: 'STRIPE',
    name: 'Stripe',
    description: 'Paiements et facturation',
    theme: 'core',
    baseUrl: 'https://api.stripe.com',
    requiresKey: true,
    quotaInfo: 'Usage-based',
    cacheTtlMs: 300000,
    timeoutMs: 5000,
    icon: 'CreditCard',
    themeEmoji: '🌍',
  },
  {
    key: 'RESEND',
    name: 'Resend',
    description: 'Emails transactionnels',
    theme: 'core',
    baseUrl: 'https://api.resend.com',
    requiresKey: true,
    quotaInfo: '100 req/jour (free)',
    cacheTtlMs: 300000,
    timeoutMs: 3000,
    icon: 'Mail',
    themeEmoji: '🌍',
  },
  {
    key: 'OPENWEATHER',
    name: 'OpenWeather',
    description: 'Météo (legacy)',
    theme: 'core',
    baseUrl: 'https://api.openweathermap.org',
    requiresKey: true,
    quotaInfo: 'Illimité (free tier)',
    cacheTtlMs: 300000,
    timeoutMs: 3000,
    icon: 'CloudSun',
    themeEmoji: '🌍',
  },
  {
    key: 'GOOGLE_PLACES',
    name: 'Google Places',
    description: 'Recherche de lieux avancée',
    theme: 'core',
    baseUrl: 'https://places.googleapis.com',
    requiresKey: true,
    quotaInfo: 'Usage-based',
    cacheTtlMs: 86400000,
    timeoutMs: 3000,
    icon: 'Building2',
    themeEmoji: '🌍',
  },
];

/* ─── In-Memory Cache ─── */

interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Cleanup expired entries every 10 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (now > entry.expiresAt) cache.delete(key);
    }
  }, 600_000);
}

/* ─── Quota Tracker (per API key, per day) ─── */

interface QuotaEntry {
  count: number;
  resetAt: number;
  limit: number;
}

const quotaMap = new Map<string, QuotaEntry>();

function getQuotaUsage(apiKey: string): { used: number; limit: number; remaining: number; resetAt: number } {
  const now = Date.now();
  const dayMs = 86_400_000;
  const key = apiKey;
  const entry = quotaMap.get(key);

  if (!entry || now > entry.resetAt) {
    const def = getDefinition(apiKey);
    const limit = getDailyLimit(def?.key);
    const newEntry = { count: 1, resetAt: now + dayMs, limit };
    quotaMap.set(key, newEntry);
    return { used: 1, limit, remaining: limit - 1, resetAt: newEntry.resetAt };
  }

  entry.count++;
  return {
    used: entry.count,
    limit: entry.limit,
    remaining: Math.max(0, entry.limit - entry.count),
    resetAt: entry.resetAt,
  };
}

function getDailyLimit(key?: string): number {
  switch (key) {
    case 'GNEWS': return 100;
    case 'YELP': return 5000;
    case 'NAVITIA': return 333; // ~10000/month
    case 'HOLIDAYS': return 33; // ~1000/month
    case 'RESEND': return 100;
    case 'NASA': return 24000; // ~1000/hour
    default: return 10000;
  }
}

/* ─── Public API ─── */

/** Get definition for an API key */
export function getDefinition(key: string): ApiDefinition | undefined {
  return API_DEFINITIONS.find((d) => d.key === key);
}

/** Get all API definitions, optionally filtered by theme */
export function getAllDefinitions(theme?: string): ApiDefinition[] {
  if (theme) return API_DEFINITIONS.filter((d) => d.theme === theme);
  return API_DEFINITIONS;
}

/** Get all unique themes */
export function getThemes(): Array<{ id: string; label: string; emoji: string }> {
  const themes = new Map<string, { id: string; label: string; emoji: string }>();
  for (const def of API_DEFINITIONS) {
    if (!themes.has(def.theme)) {
      const labels: Record<string, string> = {
        audio: 'Audio & Radio', news: 'Actualités & Info', sport: 'Sport',
        transport: 'Transport & Voyages', food: 'Restaurants & Alimentation',
        entertainment: 'Divertissement & Cinéma', knowledge: 'Connaissances & Culture',
        utils: 'Utilitaires', core: 'Core & Paiements',
      };
      themes.set(def.theme, {
        id: def.theme,
        label: labels[def.theme] || def.theme,
        emoji: def.themeEmoji,
      });
    }
  }
  return Array.from(themes.values());
}

/** Get all new API keys (15 free APIs from the spec) */
export const NEW_API_KEYS: ApiKey[] = [
  'RADIO_BROWSER', 'GNEWS', 'WIKIPEDIA', 'THESPORTSDB',
  'OPENSKY', 'NAVITIA', 'YELP', 'OPENFOODFACTS',
  'TMDB', 'NASA', 'OFFICIAL_JOKE', 'QUOTEGARDEN',
  'HOLIDAYS', 'DICTIONARY', 'TIMEZONEDB',
];

/** Fetch with caching, timeout and error handling */
export async function fetchWithCache<T>(
  apiDef: ApiDefinition,
  cacheKey: string,
  fetcher: () => Promise<T>,
): Promise<{ data: T; fallback: boolean }> {
  // Check cache first
  const cached = getCached<T>(cacheKey);
  if (cached) return { data: cached, fallback: false };

  try {
    const data = await fetcher();
    setCache(cacheKey, data, apiDef.cacheTtlMs);
    return { data, fallback: false };
  } catch {
    return { data: null as unknown as T, fallback: true };
  }
}

/** Check quota before making a request */
export function checkAndIncrementQuota(apiKey: string): { allowed: boolean; usage: ReturnType<typeof getQuotaUsage> } {
  const usage = getQuotaUsage(apiKey);
  return { allowed: usage.remaining > 0, usage };
}

/** Safe fetch with timeout */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = 3000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Get cache entry directly (for external-data.ts to check) */
export { getCached, setCache };
