'use server';

/* ═══════════════════════════════════════════════════════════════
   MAISON CONSCIENTE — External Data Server Actions

   Server actions that proxy calls to external API service modules.
   Every action follows the same strict pipeline:
   1. Validate input with Zod
   2. Resolve household by displayToken + displayEnabled
   3. Call the appropriate service function from api-services/
   4. Log usage to VoiceLog (non-blocking try/catch)
   5. Return { success, data?, error?, fallback }

   All 15 free APIs are covered.
   ═══════════════════════════════════════════════════════════════ */

import { db } from '@/lib/db';
import { z } from 'zod';

/* ═══════════════════════════════════════════════════════════════
   SERVICE IMPORTS — api-services modules (created in parallel)
   ═══════════════════════════════════════════════════════════════ */

import { searchRadioStations } from '@/lib/api-services/audio-service';
import { getHeadlines, searchWikipedia } from '@/lib/api-services/news-service';
import { searchEvents, getTeamScores } from '@/lib/api-services/sports-service';
import { getFlightsNearby as fetchFlightsNearby, getNextDepartures as fetchNextDepartures } from '@/lib/api-services/transport-service';
import { searchRestaurants, getProductInfo } from '@/lib/api-services/food-service';
import { getNowPlayingMovies as fetchNowPlayingMovies, getNasaApod, getRandomJoke as fetchRandomJoke } from '@/lib/api-services/entertainment-service';
import { getRandomQuote } from '@/lib/api-services/knowledge-service';
import { getHolidays as fetchHolidays, getWordDefinition, getTimeInCity as fetchTimeInCity } from '@/lib/api-services/utils-service';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface ExternalDataResult {
  success: boolean;
  data?: unknown;
  error?: string;
  fallback: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   CORE HELPERS — Household Resolution & Voice Logging
   ═══════════════════════════════════════════════════════════════ */

async function resolveHousehold(
  displayToken?: string,
): Promise<{ id: string } | null> {
  if (!displayToken) return null;
  return db.household.findFirst({
    where: { displayToken, displayEnabled: true },
    select: { id: true },
  });
}

async function logExternalUsage(
  householdId: string,
  intent: string,
  success: boolean,
  errorMessage?: string,
): Promise<void> {
  try {
    await db.voiceLog.create({
      data: {
        householdId,
        intent,
        originalText: `external_api:${intent}`,
        success,
        errorMessage,
      },
    });
  } catch {
    /* non-critical — never block the response for logging */
  }
}

/* ═══════════════════════════════════════════════════════════════
   ZOD SCHEMAS — One per action
   ═══════════════════════════════════════════════════════════════ */

const RadioStationsSchema = z.object({
  query: z.string().min(1, 'Requête requise'),
  displayToken: z.string().min(1, 'Display token requis'),
});

const NewsHeadlinesSchema = z.object({
  category: z.string().min(1, 'Catégorie requise'),
  displayToken: z.string().min(1, 'Display token requis'),
});

const WikipediaSchema = z.object({
  query: z.string().min(1, 'Requête requise'),
  displayToken: z.string().min(1, 'Display token requis'),
});

const SportsScoreSchema = z.object({
  team: z.string().min(1, 'Équipe requise'),
  displayToken: z.string().min(1, 'Display token requis'),
});

const FlightsNearbySchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitude invalide'),
  lon: z.number().min(-180).max(180, 'Longitude invalide'),
  displayToken: z.string().min(1, 'Display token requis'),
});

const NextDepartureSchema = z.object({
  line: z.string().min(1, 'Ligne requise'),
  displayToken: z.string().min(1, 'Display token requis'),
});

const SearchRestaurantsSchema = z.object({
  category: z.string().min(1, 'Catégorie requise'),
  lat: z.number().min(-90).max(90, 'Latitude invalide'),
  lon: z.number().min(-180).max(180, 'Longitude invalide'),
  displayToken: z.string().min(1, 'Display token requis'),
});

const ProductInfoSchema = z.object({
  barcode: z.string().min(1, 'Code-barres requis'),
  displayToken: z.string().min(1, 'Display token requis'),
});

const DisplayTokenOnlySchema = z.object({
  displayToken: z.string().min(1, 'Display token requis'),
});

const HolidaysSchema = z.object({
  year: z.number().int().min(1900).max(2100, 'Année invalide'),
  displayToken: z.string().min(1, 'Display token requis'),
});

const WordDefinitionSchema = z.object({
  word: z.string().min(1, 'Mot requis'),
  displayToken: z.string().min(1, 'Display token requis'),
});

const TimeInCitySchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitude invalide'),
  lon: z.number().min(-180).max(180, 'Longitude invalide'),
  displayToken: z.string().min(1, 'Display token requis'),
});

/* ═══════════════════════════════════════════════════════════════
   1. 🎵 RADIO — searchRadioStations
   ═══════════════════════════════════════════════════════════════ */

export async function getRadioStations(input: { query: string; displayToken: string }): Promise<ExternalDataResult> {
  // 1. Validate input with Zod
  const parsed = RadioStationsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { query, displayToken } = parsed.data;

  // 2. Resolve household
  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  // 3. Call service
  try {
    const data = await searchRadioStations(query);

    // 4. Log usage (non-blocking)
    await logExternalUsage(household.id, 'getRadioStations', true);

    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service radio';

    // Log failure (non-blocking)
    await logExternalUsage(household.id, 'getRadioStations', false, message);

    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   2. 📰 NEWS — getHeadlines
   ═══════════════════════════════════════════════════════════════ */

export async function getNewsHeadlines(input: { category: string; displayToken: string }): Promise<ExternalDataResult> {
  const parsed = NewsHeadlinesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { category, displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await getHeadlines(category);
    await logExternalUsage(household.id, 'getNewsHeadlines', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service actualités';
    await logExternalUsage(household.id, 'getNewsHeadlines', false, message);
    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   3. 📰 WIKIPEDIA — searchWikipedia
   ═══════════════════════════════════════════════════════════════ */

export async function searchWikipediaAction(input: { query: string; displayToken: string }): Promise<ExternalDataResult> {
  const parsed = WikipediaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { query, displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await searchWikipedia(query);
    await logExternalUsage(household.id, 'searchWikipedia', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service Wikipedia';
    await logExternalUsage(household.id, 'searchWikipedia', false, message);
    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   4. ⚽ SPORTS — getTeamScores
   ═══════════════════════════════════════════════════════════════ */

export async function getSportsScore(input: { team: string; displayToken: string }): Promise<ExternalDataResult> {
  const parsed = SportsScoreSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { team, displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await getTeamScores(team);
    await logExternalUsage(household.id, 'getSportsScore', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service sportif';
    await logExternalUsage(household.id, 'getSportsScore', false, message);
    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   5. ✈️ TRANSPORT — getFlightsNearby
   ═══════════════════════════════════════════════════════════════ */

export async function getFlightsNearby(input: { lat: number; lon: number; displayToken: string }): Promise<ExternalDataResult> {
  const parsed = FlightsNearbySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { lat, lon, displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await fetchFlightsNearby(lat, lon);
    await logExternalUsage(household.id, 'getFlightsNearby', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service vols';
    await logExternalUsage(household.id, 'getFlightsNearby', false, message);
    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   6. ✈️ TRANSPORT — getNextDeparture
   ═══════════════════════════════════════════════════════════════ */

export async function getNextDeparture(input: { line: string; displayToken: string }): Promise<ExternalDataResult> {
  const parsed = NextDepartureSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { line, displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await fetchNextDepartures(line);
    await logExternalUsage(household.id, 'getNextDeparture', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service transports';
    await logExternalUsage(household.id, 'getNextDeparture', false, message);
    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   7. 🍽️ FOOD — searchRestaurants
   ═══════════════════════════════════════════════════════════════ */

export async function searchRestaurantsAction(input: { category: string; lat: number; lon: number; displayToken: string }): Promise<ExternalDataResult> {
  const parsed = SearchRestaurantsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { category, lat, lon, displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await searchRestaurants(category, lat, lon);
    await logExternalUsage(household.id, 'searchRestaurants', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service restaurants';
    await logExternalUsage(household.id, 'searchRestaurants', false, message);
    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   8. 🍽️ FOOD — getProductInfo
   ═══════════════════════════════════════════════════════════════ */

export async function getProductInfoAction(input: { barcode: string; displayToken: string }): Promise<ExternalDataResult> {
  const parsed = ProductInfoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { barcode, displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await getProductInfo(barcode);
    await logExternalUsage(household.id, 'getProductInfo', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service code-barres';
    await logExternalUsage(household.id, 'getProductInfo', false, message);
    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   9. 🎬 ENTERTAINMENT — getNowPlayingMovies
   ═══════════════════════════════════════════════════════════════ */

export async function getNowPlayingMovies(input: { displayToken: string }): Promise<ExternalDataResult> {
  const parsed = DisplayTokenOnlySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await fetchNowPlayingMovies();
    await logExternalUsage(household.id, 'getNowPlayingMovies', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service cinéma';
    await logExternalUsage(household.id, 'getNowPlayingMovies', false, message);
    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   10. 🎬 ENTERTAINMENT — getNasaImageOfDay
   ═══════════════════════════════════════════════════════════════ */

export async function getNasaImageOfDay(input: { displayToken: string }): Promise<ExternalDataResult> {
  const parsed = DisplayTokenOnlySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await getNasaApod();
    await logExternalUsage(household.id, 'getNasaImageOfDay', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service NASA';
    await logExternalUsage(household.id, 'getNasaImageOfDay', false, message);
    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   11. 🎬 ENTERTAINMENT — getRandomJoke
   ═══════════════════════════════════════════════════════════════ */

export async function getRandomJoke(input: { displayToken: string }): Promise<ExternalDataResult> {
  const parsed = DisplayTokenOnlySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await fetchRandomJoke();
    await logExternalUsage(household.id, 'getRandomJoke', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service blagues';
    await logExternalUsage(household.id, 'getRandomJoke', false, message);
    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   12. 🧠 KNOWLEDGE — getQuoteOfTheDay
   ═══════════════════════════════════════════════════════════════ */

export async function getQuoteOfTheDay(input: { displayToken: string }): Promise<ExternalDataResult> {
  const parsed = DisplayTokenOnlySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await getRandomQuote();
    await logExternalUsage(household.id, 'getQuoteOfTheDay', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service citations';
    await logExternalUsage(household.id, 'getQuoteOfTheDay', false, message);
    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   13. 🛠️ UTILS — getHolidays
   ═══════════════════════════════════════════════════════════════ */

export async function getHolidays(input: { year: number; displayToken: string }): Promise<ExternalDataResult> {
  const parsed = HolidaysSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { year, displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await fetchHolidays(year);
    await logExternalUsage(household.id, 'getHolidays', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service jours fériés';
    await logExternalUsage(household.id, 'getHolidays', false, message);
    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   14. 🛠️ UTILS — getWordDefinition
   ═══════════════════════════════════════════════════════════════ */

export async function getWordDefinitionAction(input: { word: string; displayToken: string }): Promise<ExternalDataResult> {
  const parsed = WordDefinitionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { word, displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await getWordDefinition(word);
    await logExternalUsage(household.id, 'getWordDefinition', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service dictionnaire';
    await logExternalUsage(household.id, 'getWordDefinition', false, message);
    return { success: false, error: message, fallback: true };
  }
}

/* ═══════════════════════════════════════════════════════════════
   15. 🛠️ UTILS — getTimeInCity
   ═══════════════════════════════════════════════════════════════ */

export async function getTimeInCity(input: { lat: number; lon: number; displayToken: string }): Promise<ExternalDataResult> {
  const parsed = TimeInCitySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', '), fallback: false };
  }

  const { lat, lon, displayToken } = parsed.data;

  const household = await resolveHousehold(displayToken);
  if (!household) {
    return { success: false, error: 'Maison non reconnue. Vérifiez votre tablette.', fallback: false };
  }

  try {
    const data = await fetchTimeInCity(lat, lon);
    await logExternalUsage(household.id, 'getTimeInCity', true);
    return { success: true, data, fallback: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur service fuseau horaire';
    await logExternalUsage(household.id, 'getTimeInCity', false, message);
    return { success: false, error: message, fallback: true };
  }
}
