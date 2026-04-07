import { db } from './db';
import type { Zone, Interaction, Message, User } from '@prisma/client';
import { suggestHybridRecipe, type SuggestedRecipe } from '@/actions/themealdb-recipes';

/* ═══════════════════════════════════════════════════════
   WEATHER — Open-Meteo API (no key required)
   ═══════════════════════════════════════════════════════ */

export interface WeatherInfo {
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

const WEATHER_CODES: Record<number, { condition: string; icon: string }> = {
  0: { condition: "Ciel dégagé", icon: "☀️" },
  1: { condition: "Peu nuageux", icon: "🌤️" },
  2: { condition: "Partiellement nuageux", icon: "⛅" },
  3: { condition: "Couvert", icon: "☁️" },
  45: { condition: "Brouillard", icon: "🌫️" },
  48: { condition: "Brouillard givrant", icon: "🌫️" },
  51: { condition: "Bruine légère", icon: "🌦️" },
  53: { condition: "Bruine modérée", icon: "🌦️" },
  55: { condition: "Bruine dense", icon: "🌧️" },
  61: { condition: "Pluie légère", icon: "🌧️" },
  63: { condition: "Pluie modérée", icon: "🌧️" },
  65: { condition: "Pluie forte", icon: "🌧️" },
  71: { condition: "Neige légère", icon: "🌨️" },
  73: { condition: "Neige modérée", icon: "🌨️" },
  75: { condition: "Neige forte", icon: "❄️" },
  80: { condition: "Averses légères", icon: "🌦️" },
  81: { condition: "Averses modérées", icon: "🌧️" },
  82: { condition: "Averses violentes", icon: "⛈️" },
  95: { condition: "Orage", icon: "⛈️" },
  96: { condition: "Orage avec grêle", icon: "⛈️" },
  99: { condition: "Orage violent", icon: "⛈️" },
};

let weatherCache: { data: WeatherInfo; timestamp: number } | null = null;
const WEATHER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchWeather(
  lat: number = 48.8566,
  lon: number = 2.3522
): Promise<WeatherInfo | null> {
  try {
    // Check cache
    if (weatherCache && Date.now() - weatherCache.timestamp < WEATHER_CACHE_TTL) {
      return weatherCache.data;
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
    const res = await fetch(url, { next: { revalidate: 600 } });

    if (!res.ok) return null;

    const data = await res.json();
    const current = data.current;

    const weatherInfo: WeatherInfo = {
      temp: Math.round(current.temperature_2m),
      condition:
        WEATHER_CODES[current.weather_code]?.condition || "Indéterminé",
      icon: WEATHER_CODES[current.weather_code]?.icon || "🌡️",
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
    };

    weatherCache = { data: weatherInfo, timestamp: Date.now() };
    return weatherInfo;
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD SUGGESTION — Context-aware greeting for the
   main dashboard view (not zone-specific)
   ═══════════════════════════════════════════════════════ */

interface DashboardSuggestion {
  message: string;
  type: 'ritual' | 'reminder' | 'presence' | 'calm';
}

export function generateDashboardSuggestion(
  context?: string,
  activeUsersCount?: number
): DashboardSuggestion {
  const hour = new Date().getHours();
  const day = new Date().getDay();

  // Weekend special
  if (day === 0 || day === 6) {
    if (hour >= 9 && hour < 12) {
      return {
        message:
          "Week-end matin idéal. Profitez d'un café tranquille dans votre salon.",
        type: "ritual",
      };
    }
    if (hour >= 14 && hour < 17) {
      return {
        message:
          "Après-midi de week-end. Parfait pour une activité créative ou une balade.",
        type: "ritual",
      };
    }
  }

  // Morning ritual
  if (hour >= 6 && hour < 9) {
    return {
      message:
        "Début de journée. Aérez les pièces et préparez votre rituel matinal.",
      type: "ritual",
    };
  }

  // Active presence
  if (activeUsersCount && activeUsersCount > 1) {
    if (hour >= 19 && hour < 22) {
      return {
        message:
          "La maison est animée ce soir. Moment idéal pour un moment partagé.",
        type: "presence",
      };
    }
    return {
      message: `${activeUsersCount} occupant${activeUsersCount > 1 ? "s" : ""} actif${activeUsersCount > 1 ? "s" : ""} dans la maison. Belle journée collective.`,
      type: "presence",
    };
  }

  // Evening calm
  if (hour >= 21) {
    return {
      message:
        "La soirée s'installe. Baissez les lumières et détendez-vous.",
      type: "calm",
    };
  }

  // Afternoon break
  if (hour >= 14 && hour < 16) {
    return {
      message:
        "Pause de l'après-midi. Hydratez-vous et changez d'air quelques minutes.",
      type: "reminder",
    };
  }

  // Default
  return {
    message: "Tout est calme. Votre maison veille sur vous.",
    type: "calm",
  };
}

// Context types for the conscious engine
interface EngineContext {
  zone: Zone;
  user: User;
  recentInteractions: Interaction[];
  householdMessages: Message[];
  householdMembers: User[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  currentHour: number;
}

interface Suggestion {
  type: 'reminder' | 'greeting' | 'tip' | 'message' | 'presence' | 'recipe';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    zoneId?: string;
    type: string;
  };
  recipes?: SuggestedRecipe[];
}

function getTimeOfDay(hour: number): EngineContext['timeOfDay'] {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function getDayInfo(): { timeOfDay: EngineContext['timeOfDay']; dayOfWeek: number; currentHour: number } {
  const now = new Date();
  return {
    timeOfDay: getTimeOfDay(now.getHours()),
    dayOfWeek: now.getDay(),
    currentHour: now.getHours(),
  };
}

// Rule: Greeting based on time of day and zone
function generateGreeting(ctx: EngineContext): Suggestion | null {
  const greetings: Record<string, Record<string, string>> = {
    morning: {
      kitchen: 'Bonjour ! ☀️ Prêt(e) pour un bon petit-déjeuner ?',
      bathroom: 'Début de journée rafraîchissant ! N\'oubliez pas de vous hydrater.',
      bedroom: 'Bonne journée ! Pensez à aérer la chambre.',
      default: 'Bonjour et bienvenue dans votre maison consciente !',
    },
    afternoon: {
      livingRoom: 'Bon après-midi ! C\'est l\'heure idéale pour une pause.',
      kitchen: 'L\'après-midi s\'installe. Envie d\'un goûter ?',
      default: 'Bon après-midi ! Votre maison veille sur vous.',
    },
    evening: {
      kitchen: 'Bonsoir ! C\'est l\'heure de préparer le dîner ?',
      livingRoom: 'Bonne soirée ! Moment de détente en famille.',
      bedroom: 'Il se fait tard... Pensez à vous préparer pour la nuit.',
      default: 'Bonsoir ! Votre maison vous souhaite une agréable soirée.',
    },
    night: {
      bedroom: 'Bonne nuit ! La maison est en mode veille.',
      bathroom: 'Pensez à couper l\'eau ! 🌙',
      default: 'Il est tard... Reposez-vous bien.',
    },
  };

  const zoneGreeting = greetings[ctx.timeOfDay]?.[ctx.zone.name.toLowerCase()] ||
    greetings[ctx.timeOfDay]?.[ctx.zone.config?.toLowerCase() === 'kitchen' ? 'kitchen' : ''] ||
    greetings[ctx.timeOfDay]?.['default'];

  if (!zoneGreeting) return null;

  return {
    type: 'greeting',
    title: `Bienvenue, ${ctx.user.name}`,
    content: zoneGreeting,
    priority: 'low',
  };
}

// Rule: Frequency-based reminders
function generateFrequencyReminder(ctx: EngineContext): Suggestion | null {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const recentInZone = ctx.recentInteractions.filter(
    (i) => i.zoneId === ctx.zone.id && i.createdAt > oneHourAgo
  );

  // If visited same zone multiple times in last hour
  if (recentInZone.length > 3) {
    return {
      type: 'reminder',
      title: 'Activité fréquente détectée',
      content: `Vous avez visité "${ctx.zone.name}" ${recentInZone.length} fois cette heure. Tout va bien ?`,
      priority: 'medium',
    };
  }

  // Check if no interaction in 24h (for specific zones)
  const parsedConfig = ctx.zone.config ? JSON.parse(ctx.zone.config) : {};
  if (parsedConfig.type === 'kitchen' && ctx.currentHour >= 19) {
    const lastKitchenVisit = ctx.recentInteractions
      .filter((i) => i.zoneId === ctx.zone.id && i.createdAt > oneDayAgo)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (!lastKitchenVisit) {
      return {
        type: 'reminder',
        title: 'Repas du soir',
        content: 'Aucune activité en cuisine aujourd\'hui. N\'oubliez pas de dîner !',
        priority: 'medium',
        action: { label: 'Voir la cuisine', type: 'navigate', zoneId: ctx.zone.id },
      };
    }
  }

  return null;
}

// Rule: Presence awareness
function generatePresenceInfo(ctx: EngineContext): Suggestion | null {
  const now = new Date();
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

  const activeUsers = new Set(
    ctx.recentInteractions
      .filter((i) => i.createdAt > thirtyMinAgo && i.userId !== ctx.user.id)
      .map((i) => i.userId)
  );

  if (activeUsers.size > 0) {
    const activeNames = ctx.householdMembers
      .filter((m) => activeUsers.has(m.id))
      .map((m) => m.name);

    if (activeNames.length > 0) {
      return {
        type: 'presence',
        title: 'Présence détectée',
        content: `${activeNames.join(', ')} ${activeNames.length > 1 ? 'sont' : 'est'} actif(ve) dans la maison en ce moment.`,
        priority: 'low',
      };
    }
  }

  return null;
}

// Rule: Unread messages
function generateMessageReminder(ctx: EngineContext): Suggestion | null {
  const unread = ctx.householdMessages.filter(
    (m) => !m.isRead && m.senderId !== ctx.user.id
  );

  if (unread.length > 0) {
    return {
      type: 'message',
      title: `${unread.length} message${unread.length > 1 ? 's' : ''} non lu${unread.length > 1 ? 's' : ''}`,
      content: unread[0].content.length > 80
        ? unread[0].content.substring(0, 80) + '...'
        : unread[0].content,
      priority: unread.length > 3 ? 'high' : 'medium',
      action: { label: 'Voir les messages', type: 'navigate-messages' },
    };
  }

  return null;
}

// Rule: Zone-specific tips based on config
function generateZoneTip(ctx: EngineContext): Suggestion | null {
  const config = ctx.zone.config ? JSON.parse(ctx.zone.config) : {};
  const tips: Record<string, string[]> = {
    kitchen: [
      '💡 Pensez à vérifier si le frigo nécessite un rangement.',
      '💡 Astuce : planifiez vos repas de la semaine pour réduire le gaspillage.',
      '💡 N\'oubliez pas d\'éteindre les plaques de cuisson.',
    ],
    bathroom: [
      '💡 Vérifiez le niveau de vos produits d\'hygiène.',
      '💡 Pensez à aérer après une douche chaude.',
      '💡 Conseil : une douche de 5 minutes consomme 3x moins d\'eau.',
    ],
    bedroom: [
      '💡 Maintenez une température entre 16-18°C pour un sommeil optimal.',
      '💡 Pensez à ouvrir les volets pour réguler la lumière naturelle.',
    ],
    livingRoom: [
      '💡 C\'est le moment idéal pour ranger et désencombrer.',
      '💡 Pensez à ajuster l\'éclairage selon vos activités.',
    ],
    entrance: [
      '💡 Pensez à vérifier votre boîte aux lettres.',
      '💡 Rangez vos affaires dès votre arrivée pour garder l\'entrée dégagée.',
    ],
  };

  const zoneTips = tips[config.type] || tips[ctx.zone.name.toLowerCase()] || [];
  if (zoneTips.length === 0) return null;

  // Use day of week to cycle through tips
  const tipIndex = (ctx.dayOfWeek + ctx.zone.name.charCodeAt(0)) % zoneTips.length;

  return {
    type: 'tip',
    title: 'Conseil Maison',
    content: zoneTips[tipIndex],
    priority: 'low',
  };
}

// Rule: Recipe suggestion based on time/season (hybrid local + TheMealDB)
async function generateRecipeSuggestion(ctx: EngineContext): Promise<Suggestion | null> {
  // Only suggest recipes for kitchen zone or during meal hours
  const parsedConfig = ctx.zone.config ? JSON.parse(ctx.zone.config) : {};
  const isKitchen = parsedConfig.type === 'kitchen' || ctx.zone.name.toLowerCase() === 'kitchen';
  const isMealHour = (ctx.currentHour >= 10 && ctx.currentHour < 14) ||
                     (ctx.currentHour >= 17 && ctx.currentHour < 21);

  if (!isKitchen && !isMealHour) return null;

  try {
    const suggestions = await suggestHybridRecipe(ctx.currentHour);
    if (suggestions.length === 0) return null;

    const firstRecipe = suggestions[0];
    return {
      type: 'recipe',
      title: 'Suggestion du chef',
      content: `${firstRecipe.recipe.title} — ${firstRecipe.recipe.area || 'cuisine internationale'} · ${firstRecipe.recipe.estimatedDifficulty}`,
      priority: 'low',
      recipes: suggestions.slice(0, 3),
      action: { label: 'Voir la recette', type: 'navigate-recipes' },
    };
  } catch {
    return null;
  }
}

// Main engine function
export async function generateSuggestions(
  zoneId: string,
  userId: string
): Promise<Suggestion[]> {
  const { timeOfDay, dayOfWeek, currentHour } = getDayInfo();

  const zone = await db.zone.findUnique({
    where: { id: zoneId },
    include: { household: { include: { users: true, messages: true } } },
  });

  if (!zone) return [];

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return [];

  const recentInteractions = await db.interaction.findMany({
    where: { zone: { householdId: zone.householdId } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const ctx: EngineContext = {
    zone,
    user,
    recentInteractions,
    householdMessages: zone.household.messages,
    householdMembers: zone.household.users,
    timeOfDay,
    dayOfWeek,
    currentHour,
  };

  const suggestions: Suggestion[] = [];

  // Run all rules
  const greeting = generateGreeting(ctx);
  if (greeting) suggestions.push(greeting);

  const frequency = generateFrequencyReminder(ctx);
  if (frequency) suggestions.push(frequency);

  const presence = generatePresenceInfo(ctx);
  if (presence) suggestions.push(presence);

  const messages = generateMessageReminder(ctx);
  if (messages) suggestions.push(messages);

  const tip = generateZoneTip(ctx);
  if (tip) suggestions.push(tip);

  // Recipe suggestion (async — non-blocking)
  const recipe = await generateRecipeSuggestion(ctx);
  if (recipe) suggestions.push(recipe);

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return suggestions;
}

// Get household activity summary
export async function getHouseholdActivity(householdId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const [totalInteractions, todayInteractions, activeZones, recentActivity] = await Promise.all([
    db.interaction.count({
      where: { zone: { householdId } },
    }),
    db.interaction.count({
      where: {
        zone: { householdId },
        createdAt: { gte: today },
      },
    }),
    db.zone.count({ where: { householdId } }),
    db.interaction.findMany({
      where: {
        zone: { householdId },
        createdAt: { gte: yesterday },
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        zone: { select: { id: true, name: true, icon: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return {
    totalInteractions,
    todayInteractions,
    activeZones,
    recentActivity,
  };
}
