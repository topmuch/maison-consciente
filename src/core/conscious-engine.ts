/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Moteur de Conscience v2
   
   Règles déterministes :
   - Météo Open-Meteo (gratuit, sans clé)
   - Suggestions contextuelles par zone + heure + présence
   - Recettes pondérées par type de repas + saison
   - Soundscapes par humeur
   ═══════════════════════════════════════════════════════ */

import { db, parseJson } from "@/core/db";
import type {
  HouseholdState,
  InteractionContext,
  InteractionResponse,
  WeatherInfo,
  RecipeSummary,
  SoundscapeSummary,
  ZoneConfig,
} from "@/core/types";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

export type ContextSuggestion = {
  title: string;
  message: string;
  actionType: "music" | "recipe" | "note" | "none";
  payload?: unknown;
};

export type ScanResponse = {
  zoneName: string;
  suggestion: ContextSuggestion;
  weather: WeatherInfo | null;
};

/* ═══════════════════════════════════════════════════════
   1. ÉTAT DU FOYER (présence active)
   ═══════════════════════════════════════════════════════ */

export async function getHouseholdState(householdId: string): Promise<HouseholdState> {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const recentInteractions = await db.interaction.findMany({
    where: {
      zone: { householdId },
      createdAt: { gte: twoHoursAgo },
    },
    select: { zoneId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const activeZones = [...new Set(recentInteractions.map((i) => i.zoneId))];
  const lastScan = recentInteractions[0]?.createdAt ?? null;

  return {
    presenceActive: recentInteractions.length > 0,
    activeZones,
    lastScanAt: lastScan,
    currentHour: now.getHours(),
    weekday: getWeekday(now),
    season: getSeason(now),
  };
}

/* ═══════════════════════════════════════════════════════
   2. SUGGESTION CONTEXTUELLE PAR ZONE + HEURE
   
   Version simplifiée : prend zoneName + householdId
   (compatible avec le spec utilisateur)
   ═══════════════════════════════════════════════════════ */

export async function generateContextSuggestion(
  zoneName: string,
  householdId: string
): Promise<ContextSuggestion> {
  const hour = new Date().getHours();

  // 1. Récupérer la présence récente (< 2h)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const activeScans = await db.interaction.count({
    where: { zone: { householdId }, createdAt: { gte: twoHoursAgo } },
  });

  // 2. Règles contextuelles par zone
  const zoneLower = zoneName.toLowerCase();

  // ─── Entrée ───
  if (zoneLower.includes("entr") || zoneLower.includes("entry")) {
    if (hour >= 18) {
      return {
        title: "Bon retour 🌙",
        message: "La maison est calme. Voulez-vous activer l'ambiance soir ?",
        actionType: "music",
      };
    }
    return {
      title: "Bienvenue ☀️",
      message: "Météo du jour et agenda prêts.",
      actionType: "music",
    };
  }

  // ─── Salon ───
  if (zoneLower.includes("salon") || zoneLower.includes("living") || zoneLower.includes("séjour")) {
    if (hour >= 19 && hour <= 23 && activeScans >= 2) {
      return {
        title: "Soirée partagée 🎬",
        message: "Plusieurs personnes sont présentes. Lancer une playlist ou proposer un film ?",
        actionType: "music",
      };
    }
    return {
      title: "Moment détente 📖",
      message: "Le salon est calme. Envie d'une lecture ou d'une ambiance sonore légère ?",
      actionType: "music",
    };
  }

  // ─── Cuisine ───
  if (zoneLower.includes("cuisine") || zoneLower.includes("kitchen")) {
    if (hour >= 7 && hour <= 10) {
      return {
        title: "Petit-déjeuner ☕",
        message: "Il est l'heure. Voici une suggestion de recette rapide.",
        actionType: "recipe",
      };
    }
    if (hour >= 11 && hour < 14) {
      return {
        title: "Préparation déjeuner 🍽️",
        message: "Besoin d'inspiration ? Je peux suggérer une recette selon l'heure.",
        actionType: "recipe",
      };
    }
    return {
      title: "Préparation repas 🍳",
      message: "Besoin d'inspiration ? Je peux suggérer une recette selon l'heure.",
      actionType: "recipe",
    };
  }

  // ─── Chambre ───
  if (zoneLower.includes("chambre") || zoneLower.includes("bedroom") || zoneLower.includes("chamber")) {
    if (hour >= 22 || hour < 6) {
      return {
        title: "Bonne nuit 🌟",
        message: "Il est tard — pensez à vous reposer. Ambiance zen activée.",
        actionType: "music",
      };
    }
    return {
      title: "Ambiance zen 🧘",
      message: "Moment de calme. Une ambiance sonore légère ?",
      actionType: "music",
    };
  }

  // ─── Bureau ───
  if (zoneLower.includes("bureau") || zoneLower.includes("office")) {
    return {
      title: "Session focus 🎧",
      message: "Musique de concentration recommandée. Pensez à faire une pause.",
      actionType: "music",
    };
  }

  // ─── Jardin / Terrasse ───
  if (zoneLower.includes("jardin") || zoneLower.includes("garden") || zoneLower.includes("terrasse")) {
    if (hour >= 8 && hour < 19) {
      return {
        title: "Profitez de l'extérieur 🌿",
        message: "Magnifique moment pour profiter du jardin.",
        actionType: "none",
      };
    }
    return {
      title: "Belle soirée étoilée 🌙",
      message: "Bon moment pour une pause au frais.",
      actionType: "none",
    };
  }

  // ─── Salle de bain ───
  if (zoneLower.includes("bain") || zoneLower.includes("bathroom") || zoneLower.includes("salle d")) {
    return {
      title: "Moment bien-être 🛁",
      message: "Détente garantie. Une ambiance spa ?",
      actionType: "music",
    };
  }

  // ─── Default ───
  return {
    title: "Interaction enregistrée ✅",
    message: "Merci d'être passé. La maison mémorise ce moment.",
    actionType: "none",
  };
}

/* ═══════════════════════════════════════════════════════
   3. SUGGESTION CONTEXTUELLE (version complète par zoneId)
   ═══════════════════════════════════════════════════════ */

export async function generateSuggestion(
  zoneId: string,
  context: InteractionContext
): Promise<InteractionResponse> {
  const zone = await db.zone.findUnique({ where: { id: zoneId } });
  if (!zone) return { greeting: "Bienvenue" };

  const config = parseJson<ZoneConfig>(zone.config, {});
  const { hour, weekday } = context;
  const isWeekend = weekday === "sam" || weekday === "dim";
  const isMorning = hour >= 6 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;
  const isEvening = hour >= 18 && hour < 23;
  const isNight = hour >= 23 || hour < 6;

  const response: InteractionResponse = {};

  // Greeting based on time
  if (isMorning) response.greeting = "Bonjour ✨";
  else if (isAfternoon) response.greeting = "Bon après-midi 🌤️";
  else if (isEvening) response.greeting = "Bonsoir 🌙";
  else response.greeting = "Bonne nuit 🌟";

  // Zone-specific suggestions
  const zoneName = zone.name.toLowerCase();
  const suggestions = buildSuggestions(zoneName, hour, isWeekend);

  if (suggestions.length > 0) {
    const picked = suggestions[Math.floor(Math.random() * suggestions.length)];
    response.suggestion = picked.text;
    response.suggestionIcon = picked.icon;
  }

  // Recipe suggestion (evening/morning kitchen)
  if (isEvening && (zoneName.includes("cuisine") || zoneName.includes("kitchen"))) {
    const recipe = await suggestRecipe(hour, getSeason(new Date()));
    if (recipe) response.recipe = recipe;
  }

  // Soundscape suggestion (living room, bedroom)
  if (zoneName.includes("salon") || zoneName.includes("chambre") || zoneName.includes("bedroom")) {
    const soundscape = await suggestSoundscape(config.mood);
    if (soundscape) response.soundscape = soundscape;
  }

  return response;
}

/* ═══════════════════════════════════════════════════════
   4. MÉTÉO VIA OPEN-METEO (gratuit, sans clé)
   ═══════════════════════════════════════════════════════ */

export async function fetchWeather(lat: number = 48.8566, lon: number = 2.3522): Promise<WeatherInfo> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // Cache 30 min
    if (!res.ok) throw new Error("Weather API error");

    const data = await res.json();
    const current = data.current;

    return {
      temperature: Math.round(current.temperature_2m),
      condition: mapWeatherCode(current.weather_code),
      icon: mapWeatherIcon(current.weather_code),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
    };
  } catch {
    // Fallback
    return {
      temperature: 20,
      condition: "N/A",
      icon: "🌡️",
      humidity: 50,
      windSpeed: 10,
    };
  }
}

// Alias pour compatibilité avec le spec utilisateur
export const getWeatherInfo = fetchWeather;

/* ═══════════════════════════════════════════════════════
   5. RECETTE ALÉATOIRE PONDÉRÉE
   ═══════════════════════════════════════════════════════ */

export async function suggestRecipe(
  hour: number,
  season: string
): Promise<RecipeSummary | null> {
  try {
    const recipes = await db.recipe.findMany({
      where: { isActive: true },
      select: { id: true, title: true, description: true, prepTimeMin: true, tags: true, imageUrl: true },
      take: 20,
    });

    if (recipes.length === 0) return null;

    const mealType = hour < 11 ? "petit-déjeuner" : hour < 14 ? "déjeuner" : hour < 18 ? "goûter" : "dîner";
    const seasonTag = season;

    const scored = recipes.map((r) => {
      const tags = parseJson<string[]>(r.tags, []);
      let score = Math.random();
      if (tags.some((t: string) => t.toLowerCase().includes(mealType))) score += 2;
      if (tags.some((t: string) => t.toLowerCase().includes(seasonTag))) score += 1;
      return { recipe: r as unknown as RecipeSummary, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].recipe;
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════
   6. SOUNDSCAPE SUGGESTION
   ═══════════════════════════════════════════════════════ */

async function suggestSoundscape(mood?: string): Promise<SoundscapeSummary | null> {
  try {
    const where: Record<string, unknown> = { isActive: true };
    if (mood) {
      const moodMap: Record<string, string> = {
        relax: "nature",
        focus: "instrumental",
        energy: "urban",
        calme: "nature",
        concentration: "instrumental",
      };
      where.category = moodMap[mood.toLowerCase()] || "nature";
    }

    const soundscapes = await db.soundscape.findMany({
      where,
      select: { id: true, title: true, category: true, sourceType: true, url: true },
      take: 10,
    });

    if (soundscapes.length === 0) return null;
    return soundscapes[Math.floor(Math.random() * soundscapes.length)];
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function getWeekday(date: Date): string {
  return ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"][date.getDay()];
}

function getSeason(date: Date): "spring" | "summer" | "autumn" | "winter" {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

function mapWeatherCode(code: number): string {
  const map: Record<number, string> = {
    0: "Ciel dégagé",
    1: "Peu nuageux",
    2: "Partiellement nuageux",
    3: "Couvert",
    45: "Brouillard",
    48: "Brouillard givrant",
    51: "Bruine légère",
    53: "Bruine modérée",
    55: "Bruine dense",
    61: "Pluie légère",
    63: "Pluie modérée",
    65: "Pluie forte",
    71: "Neige légère",
    73: "Neige modérée",
    75: "Neige forte",
    80: "Averses légères",
    95: "Orage",
  };
  return map[code] || "Inconnu";
}

function mapWeatherIcon(code: number): string {
  if (code <= 1) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 65) return "🌧️";
  if (code <= 75) return "❄️";
  if (code <= 80) return "🌦️";
  return "⛈️";
}

interface Suggestion {
  text: string;
  icon: string;
}

function buildSuggestions(zoneName: string, hour: number, isWeekend: boolean): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (zoneName.includes("salon") || zoneName.includes("living") || zoneName.includes("séjour")) {
    if (hour >= 18) {
      suggestions.push({ text: "Moment détente — lancez un film ou une playlist", icon: "🎬" });
      suggestions.push({ text: "Une soirée lecture ? Ambiance tamisée recommandée", icon: "📖" });
    } else if (hour >= 12) {
      suggestions.push({ text: "L'après-midi idéal pour un moment créatif", icon: "🎨" });
      suggestions.push({ text: "Musique d'ambiance pour la détente", icon: "🎵" });
    }
    if (isWeekend) {
      suggestions.push({ text: "Week-end : temps pour un jeu de société ?", icon: "🎲" });
    }
  }

  if (zoneName.includes("cuisine") || zoneName.includes("kitchen")) {
    if (hour >= 7 && hour < 10) suggestions.push({ text: "Un bon café et une recette du matin ?", icon: "☕" });
    if (hour >= 11 && hour < 14) suggestions.push({ text: "Idéal pour préparer le déjeuner", icon: "👨‍🍳" });
    if (hour >= 18) suggestions.push({ text: "Quelle recette pour ce soir ?", icon: "🍽️" });
  }

  if (zoneName.includes("chambre") || zoneName.includes("bedroom")) {
    if (hour >= 22) suggestions.push({ text: "Il est tard — pensez à vous reposer", icon: "😴" });
    else suggestions.push({ text: "Ambiance zen pour ce moment de calme", icon: "🧘" });
  }

  if (zoneName.includes("entr") || zoneName.includes("entry")) {
    suggestions.push({ text: "Bienvenue à la maison ✨", icon: "🏠" });
  }

  if (zoneName.includes("bureau") || zoneName.includes("office")) {
    suggestions.push({ text: "Session focus — musique de concentration", icon: "🎧" });
    if (!isWeekend) suggestions.push({ text: "Pensez à faire une pause toutes les heures", icon: "⏰" });
  }

  if (zoneName.includes("jardin") || zoneName.includes("garden") || zoneName.includes("terrasse")) {
    if (hour >= 8 && hour < 19) suggestions.push({ text: "Magnifique moment pour profiter de l'extérieur", icon: "🌿" });
    else suggestions.push({ text: "Belle soirée étoilée ?", icon: "🌙" });
  }

  return suggestions;
}
