/**
 * ═══════════════════════════════════════════════════════════════
 * MAELLIS — Guest Memory Service
 * ═══════════════════════════════════════════════════════════════
 *
 * Manages guest profiles and preferences across stays,
 * enabling personalized hospitality experiences.
 *
 * Storage strategy:
 *   • Guest stays      → CheckInState records (per household)
 *   • Guest ratings    → StayFeedback records (stayRef = CheckInState.id)
 *   • Guest preferences → Household.userPreferences JSON under `guests.{guestName}`
 * ═══════════════════════════════════════════════════════════════
 */

import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

// ─── Public Types ───────────────────────────────────────────────

export interface GuestPreferences {
  temperature: string | null;
  pillowType: string | null;
  dietaryRestrictions: string[];
  musicGenre: string | null;
  knownInterests: string[];
  preferredLanguage: string;
}

export interface StayHistoryEntry {
  checkInAt: Date;
  checkOutAt: Date | null;
  overallRating: number | null;
  sentiment: string | null;
}

export interface GuestProfileData {
  guestName: string;
  visitCount: number;
  firstVisit: Date;
  lastVisit: Date;
  preferences: GuestPreferences;
  stayHistory: StayHistoryEntry[];
  averageRating: number;
  averageSentiment: string;
}

// ─── Internal Types ─────────────────────────────────────────────

/** Shape of per-guest preferences stored inside Household.userPreferences.guests */
type StoredGuestPreferences = Omit<GuestPreferences, 'preferredLanguage'> & {
  preferredLanguage?: string;
};

/** The full shape we expect userPreferences JSON to follow */
interface UserPreferencesPayload {
  guests?: Record<string, StoredGuestPreferences>;
  [key: string]: unknown;
}

/** Valid preference keys that can be updated */
const VALID_PREFERENCE_KEYS = new Set<string>([
  'temperature',
  'pillowType',
  'dietaryRestrictions',
  'musicGenre',
  'knownInterests',
  'preferredLanguage',
]);

/** Keyword → preference mapping for transcription enrichment */
const PREFERENCE_KEYWORDS: Record<string, { key: keyof StoredGuestPreferences; value: string; isArray?: boolean }> = {
  // Temperature
  froid:       { key: 'temperature', value: 'froid' },
  glacé:       { key: 'temperature', value: 'froid' },
  frais:       { key: 'temperature', value: 'frais' },
  chaud:       { key: 'temperature', value: 'chaud' },
  tiède:       { key: 'temperature', value: 'tiède' },
  climatisation: { key: 'temperature', value: 'climatisé' },
  chauffage:   { key: 'temperature', value: 'chaud' },
  // Pillow
  oreiller:    { key: 'pillowType', value: 'confortable' },
  coussin:     { key: 'pillowType', value: 'confortable' },
  ferme:       { key: 'pillowType', value: 'ferme' },
  mou:         { key: 'pillowType', value: 'moelleux' },
  plume:       { key: 'pillowType', value: 'plume' },
  mousse:      { key: 'pillowType', value: 'mousse' },
  // Music
  musique:     { key: 'musicGenre', value: null },  // detected separately
  jazz:        { key: 'musicGenre', value: 'jazz' },
  classique:   { key: 'musicGenre', value: 'classique' },
  rock:        { key: 'musicGenre', value: 'rock' },
  pop:         { key: 'musicGenre', value: 'pop' },
  électro:     { key: 'musicGenre', value: 'électro' },
  edm:         { key: 'musicGenre', value: 'électro' },
  hip:         { key: 'musicGenre', value: 'hip-hop' },    // hip-hop
  rap:         { key: 'musicGenre', value: 'hip-hop' },
  piano:       { key: 'musicGenre', value: 'classique' },
  'lo-fi':     { key: 'musicGenre', value: 'lo-fi' },
  lofi:        { key: 'musicGenre', value: 'lo-fi' },
  // Noise / Environment
  bruyant:     { key: 'knownInterests', value: 'calme', isArray: true },
  silencieux:  { key: 'knownInterests', value: 'calme', isArray: true },
  calme:       { key: 'knownInterests', value: 'calme', isArray: true },
  tranquille:  { key: 'knownInterests', value: 'calme', isArray: true },
  // Diet
  végétarien:  { key: 'dietaryRestrictions', value: 'végétarien', isArray: true },
  végan:       { key: 'dietaryRestrictions', value: 'végétarien', isArray: true },
  vegan:       { key: 'dietaryRestrictions', value: 'végétarien', isArray: true },
  'sans gluten': { key: 'dietaryRestrictions', value: 'sans gluten', isArray: true },
  halal:       { key: 'dietaryRestrictions', value: 'halal', isArray: true },
  cacher:      { key: 'dietaryRestrictions', value: 'cacher', isArray: true },
  casher:      { key: 'dietaryRestrictions', value: 'cacher', isArray: true },
  bio:         { key: 'dietaryRestrictions', value: 'bio', isArray: true },
  allergies:   { key: 'dietaryRestrictions', value: 'allergies alimentaires', isArray: true },
  // Interests
  randonnée:   { key: 'knownInterests', value: 'randonnée', isArray: true },
  sport:       { key: 'knownInterests', value: 'sport', isArray: true },
  yoga:        { key: 'knownInterests', value: 'yoga', isArray: true },
  'bien-être':  { key: 'knownInterests', value: 'bien-être', isArray: true },
  lecture:     { key: 'knownInterests', value: 'lecture', isArray: true },
  vin:         { key: 'knownInterests', value: 'œnologie', isArray: true },
  gastronomie: { key: 'knownInterests', value: 'gastronomie', isArray: true },
  cuisine:     { key: 'knownInterests', value: 'cuisine', isArray: true },
  plage:       { key: 'knownInterests', value: 'plage', isArray: true },
  piscine:     { key: 'knownInterests', value: 'piscine', isArray: true },
  spa:         { key: 'knownInterests', value: 'spa', isArray: true },
  découverte:  { key: 'knownInterests', value: 'découverte culturelle', isArray: true },
  culture:     { key: 'knownInterests', value: 'découverte culturelle', isArray: true },
};

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Derive a sentiment label from a numeric rating (1–5).
 */
function ratingToSentiment(rating: number): string {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  if (rating === 2) return 'negative';
  return 'critical';
}

/**
 * Derive an overall sentiment label from an average rating.
 */
function averageRatingToSentiment(avg: number): string {
  if (avg >= 4) return 'positive';
  if (avg >= 3) return 'neutral';
  if (avg >= 2) return 'negative';
  return 'critical';
}

/**
 * Safe-read the `userPreferences` JSON from a Household record,
 * returning a typed object.
 */
function parseUserPreferences(raw: Prisma.JsonValue | null): UserPreferencesPayload {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { guests: {} };
  }
  return raw as UserPreferencesPayload;
}

/**
 * Return the stored preferences for a specific guest, with defaults.
 */
function extractGuestPreferences(
  payload: UserPreferencesPayload,
  guestName: string,
): GuestPreferences {
  const guests = payload.guests ?? {};
  const stored = guests[guestName];

  return {
    temperature: stored?.temperature ?? null,
    pillowType: stored?.pillowType ?? null,
    dietaryRestrictions: Array.isArray(stored?.dietaryRestrictions)
      ? stored.dietaryRestrictions
      : [],
    musicGenre: stored?.musicGenre ?? null,
    knownInterests: Array.isArray(stored?.knownInterests)
      ? stored.knownInterests
      : [],
    preferredLanguage: stored?.preferredLanguage ?? 'fr-FR',
  };
}

/**
 * Get the French ordinal suffix for a visit number (2e, 3e, 4e…).
 */
function visitOrdinal(n: number): string {
  return `${n}e`;
}

// ─── Public Functions ───────────────────────────────────────────

/**
 * Build a comprehensive guest profile from stay history, feedback,
 * and stored preferences.
 *
 * Returns `null` if the guest has no recorded stays.
 */
export async function getGuestProfile(
  householdId: string,
  guestName: string,
): Promise<GuestProfileData | null> {
  try {
    // 1. Fetch all check-in states for this guest
    const checkIns = await db.checkInState.findMany({
      where: { householdId, guestName },
      orderBy: { checkInAt: 'asc' },
    });

    if (checkIns.length === 0) {
      return null;
    }

    const stayIds = checkIns.map((c) => c.id);

    // 2. Fetch feedback linked to those stays
    const feedbacks = await db.stayFeedback.findMany({
      where: { householdId, stayRef: { in: stayIds } },
    });

    // Build a lookup: stayRef → feedback
    const feedbackByStay = new Map<string, (typeof feedbacks)[number]>();
    for (const fb of feedbacks) {
      feedbackByStay.set(fb.stayRef, fb);
    }

    // 3. Compose stay history
    const stayHistory: StayHistoryEntry[] = checkIns.map((ci) => {
      const fb = feedbackByStay.get(ci.id);
      return {
        checkInAt: ci.checkInAt,
        checkOutAt: ci.checkOutAt,
        overallRating: fb ? fb.rating : null,
        sentiment: fb ? ratingToSentiment(fb.rating) : null,
      };
    });

    // 4. Compute averages
    const ratedFeedbacks = feedbacks.filter((fb) => fb.rating > 0);
    const averageRating =
      ratedFeedbacks.length > 0
        ? ratedFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) / ratedFeedbacks.length
        : 0;
    const averageSentiment =
      ratedFeedbacks.length > 0
        ? averageRatingToSentiment(averageRating)
        : 'neutral';

    // 5. Load preferences from Household
    const household = await db.household.findUniqueOrThrow({
      where: { id: householdId },
      select: { userPreferences: true },
    });

    const prefs = parseUserPreferences(household.userPreferences);
    const preferences = extractGuestPreferences(prefs, guestName);

    // 6. First & last visit
    const firstVisit = checkIns[0].checkInAt;
    const lastVisit = checkIns[checkIns.length - 1].checkInAt;

    return {
      guestName,
      visitCount: checkIns.length,
      firstVisit,
      lastVisit,
      preferences,
      stayHistory,
      averageRating: Math.round(averageRating * 100) / 100,
      averageSentiment,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'PrismaClientKnownRequestError'
    ) {
      console.error(
        `[GuestMemory] DB error in getGuestProfile for ${guestName}:`,
        error,
      );
      return null;
    }
    throw error;
  }
}

/**
 * Update a single preference key for a specific guest.
 *
 * `dietaryRestrictions` and `knownInterests` are merged as arrays
 * (duplicates are ignored). All other keys are replaced.
 */
export async function updateGuestPreference(
  householdId: string,
  guestName: string,
  preference: string,
  value: string | string[],
): Promise<void> {
  if (!VALID_PREFERENCE_KEYS.has(preference)) {
    throw new Error(
      `[GuestMemory] Invalid preference key: "${preference}". ` +
        `Valid keys: ${[...VALID_PREFERENCE_KEYS].join(', ')}`,
    );
  }

  const household = await db.household.findUniqueOrThrow({
    where: { id: householdId },
    select: { userPreferences: true },
  });

  const prefs = parseUserPreferences(household.userPreferences);
  if (!prefs.guests) prefs.guests = {};
  if (!prefs.guests[guestName]) {
    prefs.guests[guestName] = {
      temperature: null,
      pillowType: null,
      dietaryRestrictions: [],
      musicGenre: null,
      knownInterests: [],
    };
  }

  const guestPrefs = prefs.guests[guestName];

  if (preference === 'dietaryRestrictions' || preference === 'knownInterests') {
    const existing: string[] = Array.isArray(guestPrefs[preference])
      ? guestPrefs[preference]
      : [];
    const incoming: string[] = Array.isArray(value) ? value : [value];

    // Merge without duplicates (case-insensitive)
    const existingLower = new Set(existing.map((s) => s.toLowerCase()));
    const merged = [...existing];
    for (const item of incoming) {
      if (!existingLower.has(item.toLowerCase())) {
        merged.push(item);
        existingLower.add(item.toLowerCase());
      }
    }
    guestPrefs[preference] = merged;
  } else {
    (guestPrefs as Record<string, unknown>)[preference] = value;
  }

  await db.household.update({
    where: { id: householdId },
    data: { userPreferences: prefs as Prisma.JsonValue },
  });
}

/**
 * Generate a personalized welcome message based on guest history.
 *
 * - Returning guests receive a warm acknowledgment with a personalized
 *   detail drawn from their preferences.
 * - New guests receive a generic welcome.
 * - If `preferredLanguage` is set and not French (`fr` / `fr-FR`),
 *   the message is adapted accordingly.
 */
export async function getPersonalizedWelcome(
  householdId: string,
  guestName: string,
  propertyName: string,
): Promise<string> {
  const profile = await getGuestProfile(householdId, guestName);
  const lang = profile?.preferences.preferredLanguage ?? 'fr-FR';
  const isFrench = lang.startsWith('fr');

  if (!profile || profile.visitCount <= 1) {
    // New guest
    if (isFrench) {
      return `Bienvenue ${guestName} ! Nous espérons que votre séjour à ${propertyName} sera mémorable.`;
    }
    if (lang.startsWith('en')) {
      return `Welcome ${guestName}! We hope your stay at ${propertyName} will be memorable.`;
    }
    // Fallback — English for non-French, non-English
    return `Welcome ${guestName}! We hope your stay at ${propertyName} will be memorable.`;
  }

  // ── Returning guest ──
  const ordinal = visitOrdinal(profile.visitCount);
  const detail = buildPersonalizedDetail(profile, isFrench);

  if (isFrench) {
    return `Bienvenue ${guestName} ! Ravi de vous revoir pour votre ${ordinal} visite. ${detail}`;
  }
  if (lang.startsWith('en')) {
    const enOrdinal = getEnglishOrdinal(profile.visitCount);
    return `Welcome back, ${guestName}! Happy to see you for your ${enOrdinal} visit. ${buildPersonalizedDetailEnglish(profile)}`;
  }

  // Fallback — English
  const enOrdinal = getEnglishOrdinal(profile.visitCount);
  return `Welcome back, ${guestName}! Happy to see you for your ${enOrdinal} visit. ${buildPersonalizedDetailEnglish(profile)}`;
}

/**
 * Analyze a transcription from a daily-check or voice interaction
 * and extract potential preferences via keyword matching.
 *
 * This is a simple rule-based MVP — no AI inference.
 */
export async function enrichGuestProfileFromFeedback(
  householdId: string,
  checkInStateId: string,
  transcription: string,
): Promise<void> {
  if (!transcription || transcription.trim().length === 0) return;

  // Resolve the guest name from the CheckInState
  const checkIn = await db.checkInState.findUnique({
    where: { id: checkInStateId },
    select: { guestName: true, householdId: true },
  });

  if (!checkIn || checkIn.householdId !== householdId) {
    console.warn(
      `[GuestMemory] enrichGuestProfileFromFeedback: CheckInState not found or mismatch for ${checkInStateId}`,
    );
    return;
  }

  const normalized = transcription.toLowerCase().trim();
  const words = normalized.split(/[\s,;.!?]+/);

  // Scan for known keywords
  const updates: Array<{ key: keyof StoredGuestPreferences; value: string; isArray?: boolean }> = [];

  for (const word of words) {
    const match = PREFERENCE_KEYWORDS[word];
    if (match && match.value !== null) {
      updates.push(match);
    }
  }

  // Also scan bigrams for multi-word matches
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    const match = PREFERENCE_KEYWORDS[bigram];
    if (match && match.value !== null) {
      updates.push(match);
    }
  }

  if (updates.length === 0) return;

  // Group updates by key — for array-type keys, collect all values
  const grouped = new Map<string, { value: string; isArray?: boolean }[]>();
  for (const update of updates) {
    const existing = grouped.get(update.key as string) ?? [];
    existing.push({ value: update.value, isArray: update.isArray });
    grouped.set(update.key as string, existing);
  }

  // Apply updates sequentially
  for (const [key, entries] of grouped) {
    const preferenceKey = key as keyof StoredGuestPreferences;
    if (entries[0]?.isArray) {
      const values = entries.map((e) => e.value);
      await updateGuestPreference(householdId, checkIn.guestName, preferenceKey, values);
    } else {
      // For scalar keys, take the last match (most recent mention wins)
      const lastEntry = entries[entries.length - 1];
      await updateGuestPreference(
        householdId,
        checkIn.guestName,
        preferenceKey,
        lastEntry.value,
      );
    }
  }
}

/**
 * Simple check: has this guest stayed more than once?
 */
export async function isReturningGuest(
  householdId: string,
  guestName: string,
): Promise<boolean> {
  const count = await db.checkInState.count({
    where: { householdId, guestName },
  });
  return count > 1;
}

/**
 * Return the stored language preference for a guest,
 * defaulting to `"fr-FR"`.
 */
export async function getGuestLanguagePreference(
  householdId: string,
  guestName: string,
): Promise<string> {
  const household = await db.household.findUniqueOrThrow({
    where: { id: householdId },
    select: { userPreferences: true },
  });

  const prefs = parseUserPreferences(household.userPreferences);
  const guestPrefs = prefs.guests?.[guestName];

  if (guestPrefs?.preferredLanguage && typeof guestPrefs.preferredLanguage === 'string') {
    return guestPrefs.preferredLanguage;
  }

  return 'fr-FR';
}

// ─── Welcome Detail Builders ────────────────────────────────────

/**
 * Build a personalized detail sentence in French based on known preferences.
 */
function buildPersonalizedDetail(profile: GuestProfileData, _isFrench: boolean): string {
  const parts: string[] = [];

  if (profile.preferences.musicGenre) {
    parts.push(`La musique ${profile.preferences.musicGenre} a été configurée pour vous.`);
  }

  if (profile.preferences.temperature) {
    const tempMap: Record<string, string> = {
      froid: 'La température a été réglée plus fraîche.',
      frais: 'Une ambiance fraîche vous attend.',
      chaud: 'La température a été réglée plus chaude.',
      tiède: 'Une température agréable vous attend.',
      climatisé: 'La climatisation a été activée selon vos préférences.',
    };
    parts.push(tempMap[profile.preferences.temperature] ?? `La température est adaptée à votre préférence (${profile.preferences.temperature}).`);
  }

  if (profile.preferences.pillowType) {
    parts.push(`Nous avons préparé un oreiller ${profile.preferences.pillowType} pour vous.`);
  }

  if (profile.preferences.dietaryRestrictions.length > 0) {
    const joined = profile.preferences.dietaryRestrictions.join(', ');
    parts.push(`Nous avons noté vos restrictions alimentaires (${joined}) pour vos repas.`);
  }

  if (profile.preferences.knownInterests.length > 0) {
    parts.push(`Nous avons préparé des recommandations basées sur vos centres d'intérêt.`);
  }

  if (profile.averageRating > 0 && profile.averageRating >= 4) {
    parts.push('Nous sommes ravis que vos séjours précédents aient été appréciés !');
  }

  if (parts.length === 0) {
    return 'Nous avons hâte de vous offrir un séjour parfait.';
  }

  return parts.join(' ');
}

/**
 * Build a personalized detail sentence in English based on known preferences.
 */
function buildPersonalizedDetailEnglish(profile: GuestProfileData): string {
  const parts: string[] = [];

  if (profile.preferences.musicGenre) {
    parts.push(`${capitalize(profile.preferences.musicGenre)} music has been set up for you.`);
  }

  if (profile.preferences.temperature) {
    const tempMap: Record<string, string> = {
      froid: 'The room has been set a bit cooler for you.',
      frais: 'A refreshing temperature awaits you.',
      chaud: 'The room has been warmed up for you.',
      tiède: 'A cozy temperature has been set for you.',
      climatisé: 'Air conditioning has been activated to your preference.',
    };
    parts.push(tempMap[profile.preferences.temperature] ?? `The temperature is adjusted to your preference (${profile.preferences.temperature}).`);
  }

  if (profile.preferences.pillowType) {
    parts.push(`We've prepared a ${profile.preferences.pillowType} pillow for you.`);
  }

  if (profile.preferences.dietaryRestrictions.length > 0) {
    const joined = profile.preferences.dietaryRestrictions.join(', ');
    parts.push(`We've noted your dietary restrictions (${joined}) for your meals.`);
  }

  if (profile.preferences.knownInterests.length > 0) {
    parts.push("We've prepared recommendations based on your interests.");
  }

  if (profile.averageRating > 0 && profile.averageRating >= 4) {
    parts.push("We're thrilled your previous stays were enjoyable!");
  }

  if (parts.length === 0) {
    return "We can't wait to offer you a perfect stay.";
  }

  return parts.join(' ');
}

/**
 * Return the English ordinal string for a number (1st, 2nd, 3rd, 4th…).
 */
function getEnglishOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  const suffix = s[(v - 20) % 10] ?? s[v] ?? s[0];
  return `${n}${suffix}`;
}

/**
 * Capitalize the first letter of a string.
 */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
