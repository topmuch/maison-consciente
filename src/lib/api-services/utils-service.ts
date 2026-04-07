/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Utilities Service
   Holidays API, Dictionary API, TimezoneDB
   ═══════════════════════════════════════════════════════ */

import { db } from '@/lib/db';
import { safeFetch, fetchWithCache, getDefinition } from '@/lib/external-apis';
import { decryptSecret } from '@/lib/aes-crypto';
import type { ApiKey } from '@/lib/external-apis';

/* ─── Types ─── */

export interface Holiday {
  name: string;
  date: string;
  type: string;
  countryCode: string;
}

export interface WordDefinition {
  word: string;
  phonetic?: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
    synonyms: string[];
    antonyms: string[];
  }>;
}

export interface TimezoneInfo {
  zoneName: string;
  abbreviation: string;
  gmtOffset: number;
  dst: string;
  formatted: string;
  timestamp: number;
  city?: string;
  country?: string;
}

interface HolidaysApiResponse {
  error?: string;
  [key: string]: unknown;
}

interface HolidayItem {
  name: string;
  date_iso: string;
  type: string[];
  country_code: string;
}

interface DictionaryResponse {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
    synonyms: string[];
    antonyms: string[];
  }>;
}

interface TimezoneDbResponse {
  status: string;
  message?: string;
  zoneName?: string;
  abbreviation?: string;
  gmtOffset?: number;
  dst?: string;
  formatted?: string;
  timestamp?: number;
  zoneStart?: number;
  zoneEnd?: number;
}

/* ─── Helpers ─── */

async function getApiConfig(serviceKey: ApiKey): Promise<{ active: boolean; apiKey?: string }> {
  const config = await db.apiConfig.findUnique({ where: { serviceKey } });
  if (!config || !config.isActive) return { active: false };
  return { active: true, apiKey: config.apiKey ? decryptSecret(config.apiKey) : undefined };
}

/* ─── Fallback Data ─── */

const FALLBACK_HOLIDAYS_2024: Holiday[] = [
  { name: 'Jour de l\'An', date: '2024-01-01', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Lundi de Pâques', date: '2024-04-01', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Fête du Travail', date: '2024-05-01', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Victoire 1945', date: '2024-05-08', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Ascension', date: '2024-05-09', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Lundi de Pentecôte', date: '2024-05-20', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Fête nationale', date: '2024-07-14', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Assomption', date: '2024-08-15', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Toussaint', date: '2024-11-01', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Armistice 1918', date: '2024-11-11', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Noël', date: '2024-12-25', type: 'Public Holiday', countryCode: 'FR' },
];

const FALLBACK_HOLIDAYS_2025: Holiday[] = [
  { name: 'Jour de l\'An', date: '2025-01-01', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Lundi de Pâques', date: '2025-04-21', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Fête du Travail', date: '2025-05-01', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Victoire 1945', date: '2025-05-08', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Ascension', date: '2025-05-29', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Lundi de Pentecôte', date: '2025-06-09', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Fête nationale', date: '2025-07-14', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Assomption', date: '2025-08-15', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Toussaint', date: '2025-11-01', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Armistice 1918', date: '2025-11-11', type: 'Public Holiday', countryCode: 'FR' },
  { name: 'Noël', date: '2025-12-25', type: 'Public Holiday', countryCode: 'FR' },
];

/* ─── Functions ─── */

export async function getHolidays(year: number): Promise<{
  success: boolean;
  data: Holiday[];
  fallback: boolean;
}> {
  const serviceKey = 'HOLIDAYS' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active || !config.apiKey) {
    const fallback = year === 2025 ? FALLBACK_HOLIDAYS_2025 : FALLBACK_HOLIDAYS_2024;
    return { success: true, data: fallback, fallback: true };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    const fallback = year === 2025 ? FALLBACK_HOLIDAYS_2025 : FALLBACK_HOLIDAYS_2024;
    return { success: true, data: fallback, fallback: true };
  }

  try {
    const result = await fetchWithCache<HolidayItem[]>(
      def,
      `holidays:FR:${year}`,
      async () => {
        const url = `${def.baseUrl}/holidays/?api_key=${config.apiKey}&country=FR&year=${year}`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`Holidays API returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !Array.isArray(result.data)) {
      const fallback = year === 2025 ? FALLBACK_HOLIDAYS_2025 : FALLBACK_HOLIDAYS_2024;
      return { success: true, data: fallback, fallback: true };
    }

    const holidays: Holiday[] = result.data.map((h) => ({
      name: h.name,
      date: h.date_iso,
      type: Array.isArray(h.type) ? h.type.join(', ') : h.type,
      countryCode: h.country_code,
    }));

    return { success: true, data: holidays, fallback: false };
  } catch {
    const fallback = year === 2025 ? FALLBACK_HOLIDAYS_2025 : FALLBACK_HOLIDAYS_2024;
    return { success: true, data: fallback, fallback: true };
  }
}

export async function getWordDefinition(word: string): Promise<{
  success: boolean;
  data: WordDefinition;
  fallback: boolean;
}> {
  const serviceKey = 'DICTIONARY' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active) {
    return {
      success: false,
      data: {
        word,
        meanings: [{
          partOfSpeech: 'unknown',
          definitions: [{ definition: `Définition non disponible pour « ${word} »` }],
          synonyms: [],
          antonyms: [],
        }],
      },
      fallback: true,
    };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return {
      success: false,
      data: {
        word,
        meanings: [{
          partOfSpeech: 'unknown',
          definitions: [{ definition: `Définition non disponible pour « ${word} »` }],
          synonyms: [],
          antonyms: [],
        }],
      },
      fallback: true,
    };
  }

  try {
    const result = await fetchWithCache<DictionaryResponse[]>(
      def,
      `dict:fr:${word}`,
      async () => {
        const url = `${def.baseUrl}/entries/fr/${encodeURIComponent(word)}`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`Dictionary returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !Array.isArray(result.data) || !result.data.length) {
      return {
        success: false,
        data: {
          word,
          meanings: [{
            partOfSpeech: 'unknown',
            definitions: [{ definition: `Définition non disponible pour « ${word} »` }],
            synonyms: [],
            antonyms: [],
          }],
        },
        fallback: true,
      };
    }

    const entry = result.data[0];
    const definition: WordDefinition = {
      word: entry.word,
      phonetic: entry.phonetic || entry.phonetics?.find((p) => p.text)?.text,
      meanings: entry.meanings.map((m) => ({
        partOfSpeech: m.partOfSpeech,
        definitions: m.definitions.slice(0, 5).map((d) => ({
          definition: d.definition,
          example: d.example,
          synonyms: d.synonyms,
          antonyms: d.antonyms,
        })),
        synonyms: m.synonyms || [],
        antonyms: m.antonyms || [],
      })),
    };

    return { success: true, data: definition, fallback: false };
  } catch {
    return {
      success: false,
      data: {
        word,
        meanings: [{
          partOfSpeech: 'unknown',
          definitions: [{ definition: `Définition non disponible pour « ${word} »` }],
          synonyms: [],
          antonyms: [],
        }],
      },
      fallback: true,
    };
  }
}

export async function getTimeInCity(lat: number, lon: number): Promise<{
  success: boolean;
  data: TimezoneInfo;
  fallback: boolean;
}> {
  const serviceKey = 'TIMEZONEDB' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active || !config.apiKey) {
    return {
      success: true,
      data: getTimezoneFallback(lat, lon),
      fallback: true,
    };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return {
      success: true,
      data: getTimezoneFallback(lat, lon),
      fallback: true,
    };
  }

  try {
    const result = await fetchWithCache<TimezoneDbResponse>(
      def,
      `tz:${lat.toFixed(2)}:${lon.toFixed(2)}`,
      async () => {
        const url = `${def.baseUrl}/v2.1/get-time-zone?key=${config.apiKey}&format=json&by=position&lat=${lat}&lng=${lon}`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`TimezoneDB returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || result.data?.status !== 'OK' || !result.data.zoneName) {
      return {
        success: true,
        data: getTimezoneFallback(lat, lon),
        fallback: true,
      };
    }

    const info: TimezoneInfo = {
      zoneName: result.data.zoneName,
      abbreviation: result.data.abbreviation || '',
      gmtOffset: result.data.gmtOffset || 0,
      dst: result.data.dst || '0',
      formatted: result.data.formatted || '',
      timestamp: result.data.timestamp || Date.now(),
    };

    return { success: true, data: info, fallback: false };
  } catch {
    return {
      success: true,
      data: getTimezoneFallback(lat, lon),
      fallback: true,
    };
  }
}

/**
 * Basic timezone fallback using Intl.DateTimeFormat
 * Attempts to determine timezone from coordinates (approximate)
 */
function getTimezoneFallback(lat: number, lon: number): TimezoneInfo {
  try {
    // Try common timezones based on longitude
    const offsetHours = Math.round(lon / 15);
    const offsetSeconds = offsetHours * 3600;

    // Create a date in that timezone
    const now = new Date();
    const localTime = new Date(now.getTime() + (offsetSeconds - (-now.getTimezoneOffset() * 60)) * 1000);

    // Try to find the best timezone name
    let zoneName = 'Europe/Paris'; // Default for France
    if (lon > -10 && lon < 40) {
      // European region — use Intl
      const formatter = new Intl.DateTimeFormat('fr-FR', {
        timeZone: zoneName,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      return {
        zoneName,
        abbreviation: new Intl.DateTimeFormat('fr-FR', { timeZone: zoneName, timeZoneName: 'short' })
          .formatToParts(now)
          .find((p) => p.type === 'timeZoneName')?.value || '',
        gmtOffset: offsetSeconds,
        dst: new Date().getTimezoneOffset() < 3600 ? '1' : '0',
        formatted: formatter.format(now),
        timestamp: Math.floor(now.getTime() / 1000),
      };
    }

    return {
      zoneName,
      abbreviation: 'UTC',
      gmtOffset: offsetSeconds,
      dst: '0',
      formatted: now.toISOString(),
      timestamp: Math.floor(now.getTime() / 1000),
    };
  } catch {
    return {
      zoneName: 'Europe/Paris',
      abbreviation: 'CET',
      gmtOffset: 3600,
      dst: '0',
      formatted: new Date().toLocaleString('fr-FR'),
      timestamp: Math.floor(Date.now() / 1000),
    };
  }
}
