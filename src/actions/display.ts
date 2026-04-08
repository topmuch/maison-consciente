'use server';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Display Server Action
   
   Server-side data fetch for the tablet display page.
   Mirrors the GET /api/display/[token] route logic.
   Returns weather (mapped to human-readable condition),
   groceries, messages, and household metadata.
   ═══════════════════════════════════════════════════════ */

import { db } from '@/lib/db';

/* ── Types ── */

interface DisplayData {
  success: boolean;
  config: {
    widgets?: Record<string, boolean>;
    guestMode?: { maskPresence?: boolean; maskMessages?: boolean };
  };
  householdName: string;
  weather: {
    temp: number;
    condition: string;
    icon: string;
  } | null;
  groceries: {
    id: string;
    name: string;
    isBought: boolean;
    category: string;
  }[];
  messages: {
    id: string;
    content: string;
    createdAt: string;
    sender: { name: string; email: string } | null;
  }[];
  presenceCount: number | null;
  featuredRecipe: {
    id: string;
    title: string;
    description: string;
    prepTimeMin: number;
    tags: string[];
    imageUrl: string | null;
  } | null;
}

/* ── Open-Meteo WMO weather codes → FR condition ── */

const WMO_CONDITIONS: Record<number, string> = {
  0: 'Ciel dégagé',
  1: 'Principalement dégagé',
  2: 'Partiellement nuageux',
  3: 'Couvert',
  45: 'Brouillard',
  48: 'Brouillard givrant',
  51: 'Bruine légère',
  53: 'Bruine modérée',
  55: 'Bruine dense',
  56: 'Bruine verglaçante',
  57: 'Bruine verglaçante forte',
  61: 'Pluie légère',
  63: 'Pluie modérée',
  65: 'Pluie forte',
  66: 'Pluie verglaçante',
  67: 'Pluie verglaçante forte',
  71: 'Neige légère',
  73: 'Neige modérée',
  75: 'Neige forte',
  77: 'Grésil',
  80: 'Averses légères',
  81: 'Averses modérées',
  82: 'Averses violentes',
  85: 'Averses de neige',
  86: 'Fortes averses de neige',
  95: 'Orage',
  96: 'Orage avec grêle',
  99: 'Orage violent avec grêle',
};

function mapWeatherCondition(code: number): { condition: string; icon: string } {
  const condition = WMO_CONDITIONS[code] ?? 'Conditions variables';
  if (code === 0 || code === 1) return { condition, icon: 'sun' };
  if (code <= 3) return { condition, icon: 'cloud-sun' };
  if (code === 45 || code === 48) return { condition, icon: 'cloud-fog' };
  if (code >= 51 && code <= 57) return { condition, icon: 'cloud-drizzle' };
  if (code >= 61 && code <= 67) return { condition, icon: 'cloud-rain' };
  if (code >= 71 && code <= 77) return { condition, icon: 'snowflake' };
  if (code >= 80 && code <= 82) return { condition, icon: 'cloud-rain-wind' };
  if (code >= 95) return { condition, icon: 'cloud-lightning' };
  return { condition, icon: 'cloud' };
}

/* ═══════════════════════════════════════════════════════════
   ACTION: Get Display Data
   ═══════════════════════════════════════════════════════ */

export async function getDisplayData(token: string): Promise<DisplayData> {
  const emptyResult: DisplayData = {
    success: false,
    config: {},
    householdName: '',
    weather: null,
    groceries: [],
    messages: [],
    presenceCount: null,
    featuredRecipe: null,
  };

  try {
    const household = await db.household.findUnique({
      where: { displayToken: token },
    });

    if (!household?.displayEnabled) {
      return emptyResult;
    }

    const config = JSON.parse(household.displayConfig || '{}') as {
      widgets?: Record<string, boolean>;
      guestMode?: { maskPresence?: boolean; maskMessages?: boolean };
    };

    // Default widgets to true if not configured
    const widgets = {
      weather: true,
      groceries: true,
      messages: true,
      recipe: true,
      presence: true,
      vault: true,
      ...config.widgets,
    };

    const result: DisplayData = {
      success: true,
      config,
      householdName: household.name,
      weather: null,
      groceries: [],
      messages: [],
      presenceCount: null,
      featuredRecipe: null,
    };

    // ── Weather ──
    if (widgets.weather) {
      try {
        const weatherRes = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=48.85&longitude=2.35&current_weather=true',
          { signal: AbortSignal.timeout(4000) },
        );
        if (weatherRes.ok) {
          const json = await weatherRes.json();
          const current = json.current_weather;
          if (current) {
            const mapped = mapWeatherCondition(current.weathercode ?? 0);
            result.weather = {
              temp: Math.round(current.temperature ?? 0),
              condition: mapped.condition,
              icon: mapped.icon,
            };
          }
        }
      } catch {
        // Weather fetch failed silently
      }
    }

    // ── Groceries ──
    if (widgets.groceries) {
      result.groceries = await db.groceryItem.findMany({
        where: { householdId: household.id },
        orderBy: { isBought: 'asc' },
      });
    }

    // ── Messages ──
    if (widgets.messages && !config.guestMode?.maskMessages) {
      const msgs = await db.message.findMany({
        where: { householdId: household.id, isPublic: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          sender: { select: { name: true, email: true } },
        },
      });
      result.messages = msgs.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        sender: m.sender ? { name: m.sender.name, email: m.sender.email } : null,
      }));
    }

    // ── Presence ──
    if (widgets.presence && !config.guestMode?.maskPresence) {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000);
      result.presenceCount = await db.interaction.count({
        where: {
          zone: { householdId: household.id },
          createdAt: { gte: twoHoursAgo },
        },
      });
    }

    // ── Featured recipe ──
    if (widgets.recipe) {
      const recipes = await db.recipe.findMany({
        where: {
          isActive: true,
          OR: [{ householdId: household.id }, { householdId: null }],
        },
        take: 5,
      });
      if (recipes.length > 0) {
        const recipe = recipes[Math.floor(Math.random() * recipes.length)];
        result.featuredRecipe = {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          prepTimeMin: recipe.prepTimeMin,
          tags: JSON.parse(recipe.tags || '[]'),
          imageUrl: recipe.imageUrl,
        };
      }
    }

    return result;
  } catch (error) {
    console.error('[getDisplayData] Error:', error);
    return emptyResult;
  }
}

/* ═══════════════════════════════════════════════════════════
   ACTION: Toggle Grocery Item
   ═══════════════════════════════════════════════════════ */

export async function toggleGroceryDisplay(
  token: string,
  itemId: string,
): Promise<{ success: boolean; isBought?: boolean }> {
  try {
    const household = await db.household.findUnique({
      where: { displayToken: token },
    });
    if (!household?.displayEnabled) {
      return { success: false };
    }

    const item = await db.groceryItem.findFirst({
      where: { id: itemId, householdId: household.id },
    });
    if (!item) {
      return { success: false };
    }

    const updated = await db.groceryItem.update({
      where: { id: itemId },
      data: { isBought: !item.isBought },
    });

    return { success: true, isBought: updated.isBought };
  } catch (error) {
    console.error('[toggleGroceryDisplay] Error:', error);
    return { success: false };
  }
}
