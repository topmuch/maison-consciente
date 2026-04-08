// ═══════════════════════════════════════════════════════
// MAISON CONSCIENTE — Pollen & Air Quality Service
// Uses Open-Meteo Air Quality API (free, no key required)
// ═══════════════════════════════════════════════════════

/* ── Types ── */
export interface AirQualityData {
  pm10: number;
  pm2_5: number;
  european_aqi_pm2_5: number;
  european_aqi_pm10: number;
  ozone?: number;
}

export interface AirQualityAlert {
  level: 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';
  message: string;
  advice: string;
}

/* ── AQI Level thresholds (European scale) ── */
const AQI_LEVELS = [
  { max: 20, level: 'good' as const, label: 'Bon', color: '#22c55e' },
  { max: 40, level: 'moderate' as const, label: 'Moyen', color: '#eab308' },
  { max: 50, level: 'unhealthy-sensitive' as const, label: 'Médiocre', color: '#f97316' },
  { max: 75, level: 'unhealthy' as const, label: 'Mauvais', color: '#ef4444' },
  { max: 100, level: 'very-unhealthy' as const, label: 'Très mauvais', color: '#a855f7' },
  { max: Infinity, level: 'hazardous' as const, label: 'Dangereux', color: '#991b1b' },
];

/* ═══════════════════════════════════════════════════════
   FETCH AIR QUALITY
   ═══════════════════════════════════════════════════════ */

export async function getAirQuality(
  lat: number,
  lon: number,
): Promise<AirQualityData | null> {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,european_aqi_pm2_5,european_aqi_pm10,ozone`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 }, // Cache 1 hour
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const json = await res.json();
    return json.current as AirQualityData;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[pollen-service] Error fetching air quality:', error);
    }
    return null;
  }
}

/* ═══════════════════════════════════════════════════════
   ALERT GENERATION
   ═══════════════════════════════════════════════════════ */

export function generateAirQualityAlert(aqData: AirQualityData): AirQualityAlert | null {
  const aqi = Math.max(
    aqData.european_aqi_pm2_5 ?? 0,
    aqData.european_aqi_pm10 ?? 0,
  );

  const threshold = AQI_LEVELS.find((t) => aqi <= t.max) ?? AQI_LEVELS[AQI_LEVELS.length - 1];

  // Only generate alerts for moderate and above
  if (threshold.level === 'good') return null;

  const messages: Record<string, string> = {
    moderate: "Qualité de l'air moyenne aujourd'hui. Aérez tôt le matin si possible.",
    'unhealthy-sensitive': "Alerte qualité de l'air : Niveau élevé pour les personnes sensibles. Limitez les efforts intenses.",
    unhealthy: "Alerte qualité de l'air : Niveau élevé. Évitez les activités physiques prolongées en extérieur.",
    'very-unhealthy': "Alerte qualité de l'air : Très mauvaise qualité. Restez à l'intérieur si possible.",
    hazardous: "Alerte qualité de l'air critique. Évitez toute sortie prolongée.",
  };

  const advices: Record<string, string> = {
    moderate: "Pensez à aérer aux heures les moins polluées (tôt matin ou tard soir).",
    'unhealthy-sensitive': "Les personnes asthmatiques ou cardiaques doivent rester prudentes.",
    unhealthy: "Portez un masque si vous devez sortir. Gardez les fenêtres fermées.",
    'very-unhealthy': "Utilisez un purificateur d'air si disponible. Limitez les sorties.",
    hazardous: "Restez chez vous. En cas de gêne respiratoire, contactez les secours.",
  };

  return {
    level: threshold.level,
    message: messages[threshold.level] ?? "Alerte qualité de l'air.",
    advice: advices[threshold.level] ?? "",
  };
}

/* ═══════════════════════════════════════════════════════
   HELPER: Get AQI level info
   ═══════════════════════════════════════════════════════ */

export function getAqiInfo(aqi: number): { level: string; label: string; color: string } {
  const threshold = AQI_LEVELS.find((t) => aqi <= t.max) ?? AQI_LEVELS[AQI_LEVELS.length - 1];
  return {
    level: threshold.level,
    label: threshold.label,
    color: threshold.color,
  };
}

/* ═══════════════════════════════════════════════════════
   FORMAT FOR VOICE / NOTIFICATION
   ═══════════════════════════════════════════════════════ */

export function formatAirQualityForVoice(aqData: AirQualityData): string {
  const aqi = Math.max(aqData.european_aqi_pm2_5, aqData.european_aqi_pm10);
  const info = getAqiInfo(aqi);

  if (info.level === 'good') {
    return `La qualité de l'air est bonne aujourd'hui, indice ${Math.round(aqi)}. Profitez de l'extérieur !`;
  }

  return `Attention, la qualité de l'air est ${info.label.toLowerCase()} aujourd'hui, indice ${Math.round(aqi)}. ${generateAirQualityAlert(aqData)?.advice ?? ""}`;
}
