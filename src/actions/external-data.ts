'use server';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — External Data Server Actions
   Server actions for fetching external data (RSS, Weather,
   Horoscope, Recipes). Each action takes a householdId
   and optional parameters.
   ═══════════════════════════════════════════════════════ */

import { prisma } from '@/lib/db';
import { RSS_SOURCES, JOKES, QUOTES, FUN_FACTS } from '@/lib/constants';
import { fetchAllFeeds, formatArticlesForTTS } from '@/lib/rss-parser';
import { getHoroscope, formatHoroscopeForTTS, getHoroscopeFallback } from '@/lib/horoscope-parser';

/* ═══ TYPES ═══ */

interface SuccessResult<T = unknown> {
  success: true;
  data: T;
}

interface ErrorResult {
  success: false;
  error: string;
}

type ActionResult<T = unknown> = SuccessResult<T> | ErrorResult;

/* ═══ HELPERS ═══ */

async function getHouseholdSettings(householdId: string) {
  try {
    return await prisma.household.findUnique({
      where: { id: householdId },
      select: {
        settings: true,
        coordinates: true,
        apiSettings: true,
        voiceSettings: true,
        userPreferences: true,
        contactPhone: true,
        contactEmail: true,
        whatsappNumber: true,
      },
    });
  } catch {
    return null;
  }
}

function isFeatureEnabled(apiSettings: unknown, feature: string): boolean {
  if (!apiSettings || typeof apiSettings !== 'object') return true; // default enabled
  const settings = apiSettings as Record<string, unknown>;
  return settings[feature] !== false;
}

/* ═══════════════════════════════════════════════════════
   1. NEWS — RSS Feed Fetcher
   ═══════════════════════════════════════════════════════ */

export async function fetchNewsForTablet(
  householdId: string,
): Promise<ActionResult<{ articles: Array<{ title: string; source: string; category: string; link: string }>; tts: string }>> {
  try {
    const hh = await getHouseholdSettings(householdId);
    if (!hh) {
      return { success: false, error: 'Maison non trouvée.' };
    }

    if (!isFeatureEnabled(hh.apiSettings, 'news')) {
      return {
        success: true,
        data: {
          articles: [],
          tts: 'Le service d\'actualités est désactivé dans les paramètres.',
        },
      };
    }

    const articles = await fetchAllFeeds();
    const tts = formatArticlesForTTS(articles, 5);

    return {
      success: true,
      data: {
        articles: articles.map(a => ({
          title: a.title,
          source: a.source,
          category: a.category,
          link: a.link,
        })),
        tts,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des actualités.';
    return { success: false, error: message };
  }
}

/* ═══════════════════════════════════════════════════════
   2. WEATHER — Open-Meteo
   ═══════════════════════════════════════════════════════ */

export async function fetchWeatherForTablet(
  householdId: string,
): Promise<ActionResult<{
  temperature: number;
  description: string;
  wind: number;
  maxTemp: number;
  minTemp: number;
  rainProb: number;
  tts: string;
}>> {
  try {
    const hh = await getHouseholdSettings(householdId);
    if (!hh) {
      return { success: false, error: 'Maison non trouvée.' };
    }

    if (!isFeatureEnabled(hh.apiSettings, 'openMeteo')) {
      return {
        success: true,
        data: {
          temperature: 0,
          description: 'service désactivé',
          wind: 0,
          maxTemp: 0,
          minTemp: 0,
          rainProb: 0,
          tts: 'Le service météo est désactivé. Activez Open-Meteo dans les paramètres API.',
        },
      };
    }

    // Get coordinates
    let lat = 48.8566; // Paris default
    let lon = 2.3522;

    if (hh.coordinates && typeof hh.coordinates === 'object') {
      const coords = hh.coordinates as { lat?: number; lon?: number };
      if (coords.lat && coords.lon) {
        lat = coords.lat;
        lon = coords.lon;
      }
    }

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) {
      return {
        success: false,
        error: 'Impossible de récupérer la météo. Réessayez plus tard.',
      };
    }

    const data = await res.json();
    const cw = data.current_weather;
    const today = data.daily;
    const temp = Math.round(cw.temperature);
    const wind = Math.round(cw.windspeed);
    const desc = getWeatherDescription(cw.weathercode);
    const maxTemp = today?.temperature_2m_max?.[0];
    const minTemp = today?.temperature_2m_min?.[0];
    const rain = today?.precipitation_probability_max?.[0];

    const tts = `Actuellement ${desc} avec ${temp} degrés. Vent à ${wind} kilomètres heure. Aujourd'hui, entre ${minTemp} et ${maxTemp} degrés.${rain > 50 ? ` ${rain} pour cent de risque de pluie, prenez un parapluie !` : ''}`;

    return {
      success: true,
      data: {
        temperature: temp,
        description: desc,
        wind,
        maxTemp,
        minTemp,
        rainProb: rain,
        tts,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération de la météo.';
    return { success: false, error: message };
  }
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'le ciel est dégagé';
  if ([1, 2, 3].includes(code)) return 'quelques nuages';
  if ([45, 48].includes(code)) return 'du brouillard';
  if ([51, 53, 55].includes(code)) return 'de la bruine';
  if ([61, 63, 65].includes(code)) return 'de la pluie';
  if ([71, 73, 75].includes(code)) return 'de la neige';
  if ([80, 81, 82].includes(code)) return 'des averses';
  if ([95, 96, 99].includes(code)) return 'un orage';
  return 'un temps variable';
}

/* ═══════════════════════════════════════════════════════
   3. HOROSCOPE — Local Generator
   ═══════════════════════════════════════════════════════ */

export async function fetchHoroscopeForTablet(
  householdId: string,
  sign: string,
): Promise<ActionResult<{ sign: string; tts: string }>> {
  try {
    const hh = await getHouseholdSettings(householdId);
    if (!hh) {
      return { success: false, error: 'Maison non trouvée.' };
    }

    // Try to use provided sign, or fall back to stored preference
    let zodiacSign = sign;
    if (!zodiacSign && hh.userPreferences && typeof hh.userPreferences === 'object') {
      zodiacSign = (hh.userPreferences as Record<string, unknown>).zodiacSign as string || '';
    }

    if (!zodiacSign) {
      const fallback = getHoroscopeFallback();
      return {
        success: true,
        data: { sign: 'inconnu', tts: fallback },
      };
    }

    const reading = await getHoroscope(zodiacSign);
    const tts = formatHoroscopeForTTS(reading);

    return {
      success: true,
      data: { sign: reading.sign, tts },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur horoscope.';
    return { success: false, error: message };
  }
}

/* ═══════════════════════════════════════════════════════
   4. JOKES — Random from Constants
   ═══════════════════════════════════════════════════════ */

export async function fetchRandomJoke(): Promise<ActionResult<{ tts: string }>> {
  try {
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
    const tts = `${joke.setup} ... ${joke.punchline}`;

    return { success: true, data: { tts } };
  } catch {
    return { success: false, error: 'Erreur lors de la récupération d\'une blague.' };
  }
}

/* ═══════════════════════════════════════════════════════
   5. QUOTES — Random from Constants
   ═══════════════════════════════════════════════════════ */

export async function fetchRandomQuote(): Promise<ActionResult<{ tts: string }>> {
  try {
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const tts = `${quote.text} — ${quote.author}`;

    return { success: true, data: { tts } };
  } catch {
    return { success: false, error: 'Erreur lors de la récupération d\'une citation.' };
  }
}

/* ═══════════════════════════════════════════════════════
   6. FUN FACTS — Random from Constants
   ═══════════════════════════════════════════════════════ */

export async function fetchRandomFact(): Promise<ActionResult<{ tts: string }>> {
  try {
    const fact = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];

    return { success: true, data: { tts: `Le saviez-vous ? ${fact}` } };
  } catch {
    return { success: false, error: 'Erreur lors de la récupération d\'un fait amusant.' };
  }
}
