/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Weather-Tourism Suggestion Engine
   
   Correlates weather conditions and time of day with
   Points of Interest to generate contextual recommendations.
   ═══════════════════════════════════════════════════════ */

export interface WeatherInfo {
  weathercode: number;
  temperature: number;
  condition: string;
}

export interface POI {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number | null;
  address: string;
  tags: string[];
  isActive: boolean;
  distanceMin: number;
}

export interface Suggestion {
  poi: POI;
  reason: string;
  score: number;
}

/** WMO Weather codes that indicate rain */
const RAIN_CODES = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82, 95]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const STORM_CODES = new Set([96, 99]);
const CLEAR_CODES = new Set([0, 1]);
const CLOUDY_CODES = new Set([2, 3]);

/** Categories suitable for different conditions */
const RAINY_DAY_CATEGORIES = new Set(['museum', 'cafe', 'spa', 'coffee']);
const RAINY_TAGS = new Set(['indoor', 'rainy-day']);
const EVENING_CATEGORIES = new Set(['restaurant', 'bar', 'nightlife']);
const EVENING_TAGS = new Set(['romantic', 'evening']);
const DAYTIME_CATEGORIES = new Set(['activity', 'park', 'market', 'transport']);
const DAYTIME_TAGS = new Set(['family', 'outdoor', 'sunny']);
const SNOW_TAGS = new Set(['indoor', 'cozy']);

/**
 * Get contextual POI suggestions based on weather and time
 */
export function getContextualPOIs(weather: WeatherInfo | null, hour: number, pois: POI[]): Suggestion[] {
  const activePOIs = pois.filter(p => p.isActive);
  if (activePOIs.length === 0) return [];

  const code = weather?.weathercode ?? 0;
  const isRainy = RAIN_CODES.has(code);
  const isSnowy = SNOW_CODES.has(code);
  const isStormy = STORM_CODES.has(code);
  const isClear = CLEAR_CODES.has(code);
  const isCloudy = CLOUDY_CODES.has(code);
  const isBadWeather = isRainy || isSnowy || isStormy;
  const isEvening = hour >= 18;
  const isMorning = hour < 12;

  const scored: Suggestion[] = activePOIs.map(poi => {
    const tags = poi.tags || [];
    const tagSet = new Set(tags);
    let score = 0;
    let reason = '';

    // Weather-based scoring
    if (isRainy) {
      if (RAINY_DAY_CATEGORIES.has(poi.category)) { score += 3; reason = 'Parfait pour un jour de pluie'; }
      if (tagSet.has('indoor')) { score += 2; reason = 'Activité en intérieur'; }
      if (tagSet.has('rainy-day')) { score += 3; reason = 'Idéal par temps de pluie'; }
      // Penalize outdoor activities
      if (DAYTIME_CATEGORIES.has(poi.category) && !tagSet.has('indoor')) { score -= 2; }
    } else if (isSnowy) {
      if (tagSet.has('indoor') || tagSet.has('cozy')) { score += 3; reason = 'Ressourcement au chaud'; }
      if (RAINY_DAY_CATEGORIES.has(poi.category)) { score += 2; reason = 'Abri confortable'; }
    } else if (isStormy) {
      if (tagSet.has('indoor')) { score += 4; reason = 'Activité en intérieur recommandée'; }
    } else if (isClear || isCloudy) {
      // Good weather — boost outdoor
      if (tagSet.has('outdoor') || tagSet.has('sunny')) { score += 2; }
      if (DAYTIME_CATEGORIES.has(poi.category)) { score += 1; }
    }

    // Time-based scoring
    if (isEvening) {
      if (EVENING_CATEGORIES.has(poi.category)) { score += 3; reason = reason || 'Ambiance soirée'; }
      if (tagSet.has('romantic') || tagSet.has('evening')) { score += 2; reason = reason || 'Parfait pour le soir'; }
      // Penalize parks at night
      if (poi.category === 'park') { score -= 2; }
    } else if (isMorning) {
      if (poi.category === 'cafe' || poi.category === 'coffee') { score += 2; }
      if (poi.category === 'market') { score += 1; }
    }

    // Rating bonus
    if (poi.rating && poi.rating >= 4.5) score += 1;

    // Proximity bonus (closer = higher score)
    if (poi.distanceMin <= 5) score += 1;
    else if (poi.distanceMin <= 15) score += 0.5;

    return { poi, reason, score: Math.max(0, score) };
  });

  // Sort by score descending, take top 6
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

/**
 * Get a human-readable weather context string (i18n-ready)
 */
export function getWeatherContext(weather: WeatherInfo | null, hour: number): string {
  if (!weather) return 'good';

  const code = weather.weathercode;
  if (RAIN_CODES.has(code)) return hour >= 18 ? 'rainy_evening' : 'rainy_day';
  if (SNOW_CODES.has(code)) return 'snowy';
  if (STORM_CODES.has(code)) return 'stormy';
  if (CLEAR_CODES.has(code)) return hour >= 18 ? 'clear_evening' : 'clear_day';
  if (CLOUDY_CODES.has(code)) return hour >= 18 ? 'cloudy_evening' : 'cloudy_day';
  return 'good';
}
