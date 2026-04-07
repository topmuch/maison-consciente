'use server';

/* ═══════════════════════════════════════════════════════════════
   MAISON CONSCIENTE — Voice Server Actions (Complete Rewrite)

   Server actions that execute voice commands against the database.
   Uses displayToken (tablet) or householdId (authenticated) for
   household resolution. All responses are in French.

   Architecture:
   - Zod validation on all inputs
   - Handler map pattern (extensible intent registry)
   - VoiceLog audit trail for every command
   - Household isolation via displayToken + displayEnabled
   ═══════════════════════════════════════════════════════════════ */

import { db } from '@/lib/db';
import { z } from 'zod';

/* ═══════════════════════════════════════════════════════════════
   API CONFIG HELPERS — Local-first API availability checking
   ═══════════════════════════════════════════════════════════════ */

interface ApiConfigEntry {
  serviceKey: string;
  isActive: boolean;
  apiKey: string | null;
  baseUrl: string | null;
}

async function getApiConfig(serviceKey: string): Promise<ApiConfigEntry | null> {
  try {
    return await db.apiConfig.findUnique({ where: { serviceKey } });
  } catch {
    return null;
  }
}

async function isApiEnabled(serviceKey: string): Promise<boolean> {
  const config = await getApiConfig(serviceKey);
  return config?.isActive === true && !!config?.apiKey;
}

/* ─── Zod Schema ─── */

const VoiceIntentSchema = z.object({
  intent: z.string().min(1, 'Intent requis'),
  params: z.record(z.string()).optional(),
  originalText: z.string().optional(),
  displayToken: z.string().optional(),
  householdId: z.string().optional(),
});

/* ─── Types ─── */

interface VoiceActionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

type HouseholdRecord = {
  id: string;
  name: string;
  type: string;
  settings: string;
  displayConfig: string;
  timezone: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  [key: string]: unknown;
};

type IntentHandler = (
  householdId: string,
  params: Record<string, string>,
  household: HouseholdRecord,
) => Promise<VoiceActionResult>;

/* ═══════════════════════════════════════════════════════════════
   HELPER FUNCTIONS — French Time/Date Parsing
   ═══════════════════════════════════════════════════════════════ */

/** Convert French relative time expressions to Date */
function parseRelativeTime(text: string): Date {
  const now = new Date();
  const lower = text.toLowerCase().trim();

  // "dans X minutes" / "dans X minute"
  const minMatch = lower.match(/dans\s+(\d+)\s*minut/i);
  if (minMatch) {
    return new Date(now.getTime() + parseInt(minMatch[1], 10) * 60_000);
  }

  // "dans X heures" / "dans X heure"
  const hourMatch = lower.match(/dans\s+(\d+)\s*heure/i);
  if (hourMatch) {
    return new Date(now.getTime() + parseInt(hourMatch[1], 10) * 3_600_000);
  }

  // "à Xh" / "à X:XX"
  const timeMatch = lower.match(/à\s+(\d{1,2})[h:](\d{2})?/);
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10);
    const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    // If target is in the past, assume tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  // "demain Xh" / "demain à Xh"
  const demainMatch = lower.match(/demain\s*(?:à\s*)?(\d{1,2})[h:](\d{2})?/);
  if (demainMatch) {
    const h = parseInt(demainMatch[1], 10);
    const m = demainMatch[2] ? parseInt(demainMatch[2], 10) : 0;
    const target = new Date(now);
    target.setDate(target.getDate() + 1);
    target.setHours(h, m, 0, 0);
    return target;
  }

  // "demain"
  if (lower.includes('demain')) {
    const target = new Date(now);
    target.setDate(target.getDate() + 1);
    target.setHours(9, 0, 0, 0);
    return target;
  }

  // "ce soir" → 19h
  if (lower.includes('ce soir') || lower.includes('cesoir')) {
    const target = new Date(now);
    target.setHours(19, 0, 0, 0);
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  // "tout à l'heure" → +30 min
  if (lower.includes('tout à l\'heure') || lower.includes('toute a l\'heure') || lower.includes('tout a lheure')) {
    return new Date(now.getTime() + 30 * 60_000);
  }

  // Default: 1 hour from now
  return new Date(now.getTime() + 3_600_000);
}

/** Convert French date expressions to Date */
function parseDate(text: string): Date {
  const now = new Date();
  const lower = text.toLowerCase().trim();

  // Day-of-week mapping
  const days: Record<string, number> = {
    'lundi': 1, 'mardi': 2, 'mercredi': 3, 'jeudi': 4,
    'vendredi': 5, 'samedi': 6, 'dimanche': 0,
  };

  for (const [day, target] of Object.entries(days)) {
    if (lower.includes(day)) {
      const current = now.getDay();
      let diff = target - current;
      if (diff <= 0) diff += 7;
      const result = new Date(now);
      result.setDate(result.getDate() + diff);
      result.setHours(9, 0, 0, 0);
      return result;
    }
  }

  // "demain"
  if (lower.includes('demain')) {
    const result = new Date(now);
    result.setDate(result.getDate() + 1);
    result.setHours(9, 0, 0, 0);
    return result;
  }

  // "après-demain"
  if (lower.includes('après-demain') || lower.includes('apres-demain')) {
    const result = new Date(now);
    result.setDate(result.getDate() + 2);
    result.setHours(9, 0, 0, 0);
    return result;
  }

  // "le X janvier/février/..."
  const monthNames: Record<string, number> = {
    'janvier': 0, 'février': 1, 'fevrier': 1, 'mars': 2, 'avril': 3,
    'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7, 'aout': 7,
    'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11, 'decembre': 11,
  };

  const dateMatch = lower.match(/le\s+(\d{1,2})\s+(\w+)/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const monthName = dateMatch[2].toLowerCase();
    const month = monthNames[monthName];
    if (month !== undefined) {
      const result = new Date(now.getFullYear(), month, day, 9, 0, 0, 0);
      if (result < now) {
        result.setFullYear(result.getFullYear() + 1);
      }
      return result;
    }
  }

  // "aujourd'hui"
  return new Date(now);
}

/** Convert French duration expressions to milliseconds */
function parseDuration(text: string): number {
  const lower = text.toLowerCase().trim();

  // "X minutes" / "X minute"
  const minMatch = lower.match(/(\d+)\s*minut/i);
  if (minMatch) return parseInt(minMatch[1], 10) * 60_000;

  // "X heures" / "une heure" / "une heure et demie"
  const hourMatch = lower.match(/(\d+)\s*heure/i);
  if (hourMatch) return parseInt(hourMatch[1], 10) * 3_600_000;
  if (lower.includes('une heure')) return 3_600_000;

  // "une heure et demie"
  if (lower.includes('heure et demie')) return 5_400_000;

  // "X jours"
  const dayMatch = lower.match(/(\d+)\s*jour/i);
  if (dayMatch) return parseInt(dayMatch[1], 10) * 86_400_000;

  // "une semaine"
  if (lower.includes('une semaine') || lower.includes('1 semaine')) return 604_800_000;

  // Default: 1 hour
  return 3_600_000;
}

/** Format a Date for TTS in French */
function formatTimeForTTS(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Format a Date as readable French string */
function formatDateForTTS(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "aujourd'hui";
  if (date.toDateString() === tomorrow.toDateString()) return 'demain';

  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/* ═══════════════════════════════════════════════════════════════
   CORE: Household Resolution & Voice Logging
   ═══════════════════════════════════════════════════════════════ */

async function resolveHousehold(
  displayToken?: string,
  householdId?: string,
): Promise<HouseholdRecord | null> {
  if (displayToken) {
    return db.household.findFirst({
      where: { displayToken, displayEnabled: true },
    }) as Promise<HouseholdRecord | null>;
  }
  if (householdId) {
    return db.household.findUnique({
      where: { id: householdId },
    }) as Promise<HouseholdRecord | null>;
  }
  return null;
}

async function logVoiceCommand(
  householdId: string,
  intent: string,
  originalText: string,
  success: boolean,
  errorMessage?: string,
): Promise<void> {
  try {
    await db.voiceLog.create({
      data: { householdId, intent, originalText, success, errorMessage },
    });
  } catch {
    /* non-critical — never block the response for logging */
  }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXECUTOR
   ═══════════════════════════════════════════════════════════════ */

export async function executeVoiceCommand(
  input: z.infer<typeof VoiceIntentSchema>,
): Promise<VoiceActionResult> {
  const parsed = VoiceIntentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: 'Commande invalide. Réessayez.' };
  }

  const {
    intent,
    params = {},
    originalText = '',
    displayToken,
    householdId: inputHouseholdId,
  } = parsed.data;

  const household = await resolveHousehold(displayToken, inputHouseholdId);
  if (!household) {
    return { success: false, message: 'Maison non reconnue. Vérifiez votre tablette.' };
  }

  const hhId = household.id;

  try {
    const handler = intentHandlers[intent];
    if (handler) {
      const result = await handler(hhId, params, household);
      await logVoiceCommand(
        hhId,
        intent,
        originalText,
        result.success,
        result.success ? undefined : result.message,
      );
      return result;
    }

    await logVoiceCommand(hhId, intent, originalText, false, 'Intent non géré');
    return {
      success: false,
      message: "Je ne sais pas encore faire ça, mais j'apprends ! Dites « Maison, aide » pour voir ce que je peux faire.",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    await logVoiceCommand(hhId, intent, originalText, false, msg);
    return { success: false, message: 'Une erreur est survenue. Réessayez.' };
  }
}

/* ═══════════════════════════════════════════════════════════════
   INTENT HANDLERS — Organized by Category
   ═══════════════════════════════════════════════════════════════ */

/* ─── Planning & Reminders ─── */

const handleAddReminderTime: IntentHandler = async (hhId, params) => {
  const text = params.text?.trim();
  if (!text) {
    return { success: false, message: 'Quel rappel souhaitez-vous ? Dites par exemple : rappelle-moi d\'arroser les plantes.' };
  }
  if (text.length > 300) {
    return { success: false, message: 'Le texte du rappel est trop long.' };
  }

  const timeExpr = params.time || params.quand || '';
  const triggerAt = timeExpr ? parseRelativeTime(timeExpr) : parseRelativeTime(text);

  await db.reminder.create({
    data: {
      householdId: hhId,
      text,
      triggerAt,
      isRecurring: false,
    },
  });

  const timeStr = formatTimeForTTS(triggerAt);
  const dayStr = formatDateForTTS(triggerAt);
  return {
    success: true,
    message: `C'est noté ! Je vous rappellerai de ${text} ${dayStr} à ${timeStr}.`,
    data: { triggerAt: triggerAt.toISOString(), text },
  };
};

const handleCancelReminder: IntentHandler = async (hhId, params) => {
  const text = params.text?.trim();
  if (!text) {
    return { success: false, message: 'Quel rappel souhaitez-vous annuler ?' };
  }

  const deleted = await db.reminder.deleteMany({
    where: {
      householdId: hhId,
      notified: false,
      text: { contains: text },
    },
  });

  if (deleted.count > 0) {
    return { success: true, message: `Rappel${deleted.count > 1 ? 's' : ''} "${text}" annulé${deleted.count > 1 ? 's' : ''}.` };
  }

  return { success: false, message: `Aucun rappel trouvé contenant "${text}".` };
};

const handleListReminders: IntentHandler = async (hhId) => {
  const now = new Date();
  const reminders = await db.reminder.findMany({
    where: {
      householdId: hhId,
      notified: false,
      triggerAt: { gte: now },
    },
    orderBy: { triggerAt: 'asc' },
    take: 20,
  });

  if (reminders.length === 0) {
    return { success: true, message: 'Vous n\'avez aucun rappel en attente.', data: { reminders: [] } };
  }

  const list = reminders
    .map((r, i) => {
      const dayStr = formatDateForTTS(r.triggerAt);
      const timeStr = formatTimeForTTS(r.triggerAt);
      return `${i + 1}. ${r.text} — ${dayStr} à ${timeStr}`;
    })
    .join('. ');

  return {
    success: true,
    message: `Voici vos rappels : ${list}.`,
    data: { count: reminders.length, reminders: reminders.map((r) => ({ id: r.id, text: r.text, triggerAt: r.triggerAt.toISOString() })) },
  };
};

const handleAddAppointment: IntentHandler = async (hhId, params) => {
  const title = params.title?.trim();
  if (!title) {
    return { success: false, message: 'Quel rendez-vous souhaitez-vous ajouter ?' };
  }

  const dateExpr = params.date || params.quand || '';
  const date = dateExpr ? parseDate(dateExpr) : parseRelativeTime(dateExpr || 'demain');
  const location = params.lieu || params.location || null;

  await db.appointment.create({
    data: {
      householdId: hhId,
      title,
      date,
      location,
    },
  });

  const dayStr = formatDateForTTS(date);
  const timeStr = formatTimeForTTS(date);
  const locStr = location ? ` à ${location}` : '';
  return {
    success: true,
    message: `Rendez-vous "${title}" ajouté${locStr} pour ${dayStr} à ${timeStr}.`,
    data: { date: date.toISOString(), title, location },
  };
};

const handleAddRecurringBirthday: IntentHandler = async (hhId, params) => {
  const name = params.name || params.prenom || '';
  const dateExpr = params.date || params.quand || '';
  if (!name) {
    return { success: false, message: 'De quel anniversaire s\'agit-il ? Dites un prénom ou une description.' };
  }

  const date = dateExpr ? parseDate(dateExpr) : new Date();
  const text = `Anniversaire de ${name}`;

  await db.reminder.create({
    data: {
      householdId: hhId,
      text,
      triggerAt: date,
      isRecurring: true,
      recurrenceRule: 'yearly',
    },
  });

  const dayStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  return {
    success: true,
    message: `Anniversaire de ${name} noté pour le ${dayStr}. Je vous rappellerai chaque année !`,
    data: { name, triggerAt: date.toISOString(), recurrence: 'yearly' },
  };
};

const handleAddCalendarEvent: IntentHandler = async (hhId, params) => {
  const title = params.title?.trim();
  if (!title) {
    return { success: false, message: 'Quel événement souhaitez-vous ajouter au calendrier ?' };
  }

  const dateExpr = params.date || params.quand || '';
  const date = dateExpr ? parseDate(dateExpr) : new Date();
  const type = params.type || 'reminder';

  await db.calendarEvent.create({
    data: {
      householdId: hhId,
      title,
      date,
      type,
    },
  });

  const dayStr = formatDateForTTS(date);
  return {
    success: true,
    message: `Événement "${title}" ajouté pour ${dayStr}.`,
    data: { title, date: date.toISOString(), type },
  };
};

const handleQueryAgenda: IntentHandler = async (hhId, params) => {
  const scope = params.scope || params.quand || 'aujourd\'hui';
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const isToday = scope.includes('aujourd\'hui') || scope.includes('jour');
  const isTomorrow = scope.includes('demain');
  const startDate = isTomorrow ? tomorrowStart : todayStart;
  const endDate = isTomorrow ? tomorrowEnd : tomorrowStart;

  const [reminders, appointments, events] = await Promise.all([
    db.reminder.findMany({
      where: {
        householdId: hhId,
        notified: false,
        triggerAt: { gte: startDate, lt: endDate },
      },
      orderBy: { triggerAt: 'asc' },
    }),
    db.appointment.findMany({
      where: {
        householdId: hhId,
        date: { gte: startDate, lt: endDate },
      },
      orderBy: { date: 'asc' },
    }),
    db.calendarEvent.findMany({
      where: {
        householdId: hhId,
        date: { gte: startDate, lt: endDate },
      },
      orderBy: { date: 'asc' },
    }),
  ]);

  const allItems = [
    ...reminders.map((r) => ({ type: 'rappel', text: r.text, time: r.triggerAt })),
    ...appointments.map((a) => ({ type: 'rdv', text: `${a.title}${a.location ? ` à ${a.location}` : ''}`, time: a.date })),
    ...events.map((e) => ({ type: 'événement', text: e.title, time: e.date })),
  ].sort((a, b) => a.time.getTime() - b.time.getTime());

  if (allItems.length === 0) {
    const when = isTomorrow ? 'demain' : "aujourd'hui";
    return { success: true, message: `Rien de prévu ${when}. Profitez de votre journée !`, data: { items: [] } };
  }

  const scopeLabel = isTomorrow ? 'demain' : "aujourd'hui";
  const list = allItems
    .map((item) => `${item.type} : ${item.text} à ${formatTimeForTTS(item.time)}`)
    .join('. ');

  return {
    success: true,
    message: `Voici votre agenda ${scopeLabel} : ${list}.`,
    data: {
      count: allItems.length,
      items: allItems.map((item) => ({ type: item.type, text: item.text, time: item.time.toISOString() })),
    },
  };
};

/* ─── Grocery ─── */

const handleAddGroceryItem: IntentHandler = async (hhId, params) => {
  const item = params.item || params.text || '';
  const name = item.trim();
  if (!name) {
    return { success: false, message: 'Que souhaitez-vous ajouter aux courses ?' };
  }
  if (name.length > 100) {
    return { success: false, message: 'Le nom de l\'article est trop long.' };
  }

  // Check for duplicates (case-insensitive)
  const existing = await db.groceryItem.findFirst({
    where: {
      householdId: hhId,
      isBought: false,
      name: { equals: name, mode: 'insensitive' },
    },
  });

  if (existing) {
    return { success: true, message: `"${name}" est déjà dans la liste de courses.` };
  }

  await db.groceryItem.create({
    data: {
      householdId: hhId,
      name,
      isBought: false,
    },
  });

  return { success: true, message: `"${name}" ajouté aux courses.` };
};

const handleListActiveGroceries: IntentHandler = async (hhId) => {
  const items = await db.groceryItem.findMany({
    where: { householdId: hhId, isBought: false },
    orderBy: { createdAt: 'asc' },
  });

  if (items.length === 0) {
    return { success: true, message: 'La liste de courses est vide.', data: { items: [] } };
  }

  const list = items.map((item) => item.name).join(', ');
  return {
    success: true,
    message: `Voici votre liste de courses : ${list}.`,
    data: { count: items.length, items: items.map((i) => ({ id: i.id, name: i.name })) },
  };
};

/* ─── Cuisine ─── */

const SUGGESTION_POOL = [
  'Pour ce soir, pourquoi pas une ratatouille provençale ? Simple, healthy et délicieuse.',
  'Essayez un crumble aux pommes pour le dessert — il faut juste des pommes, de la farine et du beurre.',
  'Une salade César maison avec du poulet grillé serait parfaite pour un repas léger.',
  'Que diriez-vous d\'un gratin dauphinois ? Patates, crème, fromage râpé et au four !',
  'Un risotto aux champignons : onctueux et réconfortant. Faites revenir les champignons avant.',
  'Pour un repas rapide, un bowl de quinoa avec avocat, tomates cerises et vinaigrette au citron.',
  'Tarte tatin aux pommes : renversez-la et impressionnez vos invités !',
  'Soupe de lentilles corail au lait de coco — prête en 20 minutes, nourrissante et légère.',
  'Faites des crêpes ! C\'est dimanche après tout. Avec du sucre, du chocolat ou de la confiture.',
  'Un tartare de saumon à l\'aneth, servi sur des blinis. Frais et élégant.',
  'Pasta e fagioli — une soupe italienne aux pâtes et haricots blancs. Réconfortante.',
  'Gaspacho andalou : mixez tomates, concombre, poivron, ail et huile d\'olive. Parfait frais.',
];

const handleSuggestRecipe: IntentHandler = async () => {
  const suggestion = SUGGESTION_POOL[Math.floor(Math.random() * SUGGESTION_POOL.length)];
  return {
    success: true,
    message: suggestion,
    data: { suggestion },
  };
};

const handleSearchRecipeByIngredient: IntentHandler = async (hhId, params) => {
  const ingredient = params.ingredient || params.text || '';
  if (!ingredient.trim()) {
    return { success: false, message: 'Quel ingrédient souhaitez-vous utiliser ?' };
  }

  const recipes = await db.recipe.findMany({
    where: {
      householdId: { in: [hhId, null] },
      isActive: true,
      OR: [
        { title: { contains: ingredient, mode: 'insensitive' } },
        { ingredients: { contains: ingredient, mode: 'insensitive' } },
        { tags: { contains: ingredient, mode: 'insensitive' } },
      ],
    },
    take: 5,
  });

  if (recipes.length === 0) {
    return {
      success: true,
      message: `Je n'ai pas trouvé de recette avec "${ingredient}". Essayez un autre ingrédient ou demandez-moi une suggestion !`,
      data: { recipes: [] },
    };
  }

  const list = recipes.map((r) => `${r.title}${r.prepTimeMin ? ` (${r.prepTimeMin} min)` : ''}`).join(', ');
  return {
    success: true,
    message: `Voici des recettes avec "${ingredient}" : ${list}.`,
    data: {
      count: recipes.length,
      recipes: recipes.map((r) => ({
        id: r.id,
        title: r.title,
        prepTime: r.prepTimeMin,
        description: r.description,
      })),
    },
  };
};

/* ─── Mode Changes ─── */

async function updateDisplayMode(
  hhId: string,
  mode: string,
  modeLabel: string,
): Promise<VoiceActionResult> {
  let config: Record<string, unknown> = {};
  try {
    const household = await db.household.findUnique({ where: { id: hhId }, select: { displayConfig: true } });
    if (household?.displayConfig) {
      config = JSON.parse(household.displayConfig);
    }
  } catch {
    /* use empty config */
  }

  await db.household.update({
    where: { id: hhId },
    data: { displayConfig: JSON.stringify({ ...config, mode }) },
  });

  await db.userLog.create({
    data: {
      householdId: hhId,
      action: `voice_mode_${mode}`,
      details: `Mode ${modeLabel} activé par commande vocale`,
    },
  });

  return { success: true, message: `Mode ${modeLabel} activé.`, data: { mode } };
}

const handleModeNight: IntentHandler = async (hhId) => updateDisplayMode(hhId, 'night', 'nuit');
const handleModeMorning: IntentHandler = async (hhId) => updateDisplayMode(hhId, 'morning', 'matin');
const handleModeDay: IntentHandler = async (hhId) => updateDisplayMode(hhId, 'day', 'jour');

/* ─── Weather (Open-Meteo with local fallback) ─── */

function weatherCodeToDescription(code: number): string {
  const map: Record<number, string> = {
    0: 'dégagé', 1: 'principalement dégagé', 2: 'partiellement nuageux', 3: 'couvert',
    45: 'brouillard', 48: 'brouillard givrant', 51: 'bruine légère', 53: 'bruine modérée',
    55: 'bruine dense', 61: 'pluie légère', 63: 'pluie modérée', 65: 'pluie forte',
    71: 'neige légère', 73: 'neige modérée', 75: 'neige forte', 80: 'averses légères',
    95: 'orage', 96: 'orage avec grêle',
  };
  return map[code] || 'conditions variables';
}

async function fetchWeather(
  lat: number,
  lon: number,
): Promise<{ temp: number; desc: string; humidity: number; wind: number; code?: number } | null> {
  const config = await getApiConfig('OPEN_METEO');
  if (!config?.isActive) return null;

  try {
    const url = `${config.baseUrl || 'https://api.open-meteo.com'}/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const current = data.current;
    return {
      temp: Math.round(current.temperature_2m),
      desc: weatherCodeToDescription(current.weather_code),
      humidity: current.relative_humidity_2m,
      wind: Math.round(current.wind_speed_10m),
      code: current.weather_code,
    };
  } catch {
    return null;
  }
}

const handleAskWeather: IntentHandler = async (hhId, _params, household) => {
  // Try to get coordinates from household
  let lat: number | undefined;
  let lon: number | undefined;
  try {
    const coords = household.coordinates as { lat?: number; lon?: number } | null;
    if (coords?.lat && coords?.lon) {
      lat = coords.lat;
      lon = coords.lon;
    }
  } catch {
    /* coordinates not set or not valid JSON */
  }

  if (!lat || !lon) {
    return {
      success: false,
      message: 'Coordonnées non configurées. Configurez la localisation dans les paramètres.',
    };
  }

  const weather = await fetchWeather(lat, lon);
  if (!weather) {
    return {
      success: true,
      message: 'Météo indisponible. Activez Open-Meteo dans Configuration API.',
      data: { action: 'weather_unavailable' },
    };
  }

  return {
    success: true,
    message: `Il fait ${weather.temp}°C avec ${weather.desc}. Humidité ${weather.humidity}%, vent ${weather.wind} km/h.`,
    data: { temp: weather.temp, desc: weather.desc, humidity: weather.humidity, wind: weather.wind },
  };
};

const handleWeatherAdvice: IntentHandler = async (hhId, _params, household) => {
  let lat: number | undefined;
  let lon: number | undefined;
  try {
    const coords = household.coordinates as { lat?: number; lon?: number } | null;
    if (coords?.lat && coords?.lon) {
      lat = coords.lat;
      lon = coords.lon;
    }
  } catch {
    /* coordinates not set or not valid JSON */
  }

  if (!lat || !lon) {
    return {
      success: true,
      message: 'Coordonnées non configurées. Configurez la localisation dans les paramètres pour des conseils météo personnalisés.',
    };
  }

  const weather = await fetchWeather(lat, lon);
  if (!weather) {
    return {
      success: true,
      message: "N'oubliez pas de vérifier la météo avant de sortir. Prenez un parapluie si nécessaire et habillez-vous en fonction de la température.",
      data: { action: 'weather_advice_generic' },
    };
  }

  // Rain codes: 51, 53, 55 (drizzle), 61, 63, 65 (rain), 80 (showers), 95, 96 (thunderstorm)
  const isRaining = weather.code !== undefined && [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weather.code);

  if (isRaining) {
    return {
      success: true,
      message: `Oui, prenez un parapluie ! Il fait ${weather.temp}°C avec ${weather.desc}.`,
      data: { umbrella: true, ...weather },
    };
  }

  // Cold warning
  if (weather.temp < 5) {
    return {
      success: true,
      message: `Non, pas besoin de parapluie aujourd'hui. Mais il fait froid (${weather.temp}°C), couvrez-vous bien !`,
      data: { umbrella: false, ...weather },
    };
  }

  return {
    success: true,
    message: `Non, pas besoin de parapluie aujourd'hui. Il fait ${weather.temp}°C avec ${weather.desc}. Bonne journée !`,
    data: { umbrella: false, ...weather },
  };
};

/* ─── Wellness ─── */

const handleLogMood: IntentHandler = async (hhId, params) => {
  const moodText = params.mood || params.text || '';
  const moodMap: Record<string, number> = {
    'très bien': 5, 'tres bien': 5, 'super': 5, 'excellent': 5, 'génial': 5, 'genial': 5, 'heureux': 5, 'content': 4,
    'bien': 4, 'bonne humeur': 4, 'bon': 4, 'cool': 4,
    'normal': 3, 'neutre': 3, 'moyen': 3, 'comme d\'habitude': 3,
    'pas top': 2, 'bof': 2, 'fatigué': 2, 'fatigue': 2, 'mouais': 2,
    'mal': 1, 'triste': 1, 'énervé': 1, 'enerve': 1, 'stressé': 1, 'stresse': 1, 'anxieux': 1,
  };

  let moodScore = 3; // default neutral
  for (const [key, val] of Object.entries(moodMap)) {
    if (moodText.toLowerCase().includes(key)) {
      moodScore = val;
      break;
    }
  }

  const numericMood = params.score ? parseInt(params.score, 10) : moodScore;
  const clampedMood = Math.max(1, Math.min(5, isNaN(numericMood) ? 3 : numericMood));

  await db.userLog.create({
    data: {
      householdId: hhId,
      action: 'voice_mood_log',
      details: JSON.stringify({ mood: clampedMood, text: moodText }),
    },
  });

  const responses = [
    { min: 4, msg: 'Super nouvelle ! Continuez comme ça.' },
    { min: 3, msg: 'Merci de partager. C\'est noté !' },
    { min: 1, msg: 'J\'espère que votre journée va s\'améliorer. Prenez soin de vous.' },
  ];

  const response = responses.find((r) => clampedMood >= r.min) || responses[responses.length - 1];
  return { success: true, message: response.msg, data: { mood: clampedMood } };
};

const handleTriggerRitual: IntentHandler = async (hhId, params) => {
  const timeOfDay = params.moment || 'evening';
  const isEvening = timeOfDay.includes('soir') || timeOfDay.includes('evening');

  const rituals = await db.ritualTask.findMany({
    where: { householdId: hhId, timeOfDay: isEvening ? 'evening' : 'morning' },
  });

  if (rituals.length === 0) {
    const when = isEvening ? 'du soir' : 'du matin';
    return {
      success: true,
      message: `Aucun rituel ${when} configuré. Vous pouvez en ajouter dans les paramètres.`,
      data: { timeOfDay, rituals: [] },
    };
  }

  const list = rituals.map((r) => r.title).join(', ');
  return {
    success: true,
    message: `Voici votre routine ${isEvening ? 'du soir' : 'du matin'} : ${list}.`,
    data: { timeOfDay, rituals: rituals.map((r) => ({ id: r.id, title: r.title })) },
  };
};

const handleHydrationReminder: IntentHandler = async (hhId, params) => {
  const timeExpr = params.time || params.quand || 'dans 1 heure';

  await db.reminder.create({
    data: {
      householdId: hhId,
      text: 'Pensez à boire un verre d\'eau !',
      triggerAt: parseRelativeTime(timeExpr),
      isRecurring: false,
    },
  });

  return { success: true, message: 'C\'est noté ! Je vous rappellerai de vous hydrater.' };
};

/* ─── Hospitality ─── */

const handleRepeatWifiCredentials: IntentHandler = async (hhId) => {
  const vault = await db.secretVault.findFirst({
    where: { householdId: hhId, type: 'wifi', isPublic: true },
  });

  if (vault) {
    return {
      success: true,
      message: `Le réseau WiFi est "${vault.title}" et le mot de passe est "${vault.password}".`,
      data: { ssid: vault.title, password: vault.password },
    };
  }

  // Check settings for WiFi info
  let settings: Record<string, unknown> = {};
  try {
    const household = await db.household.findUnique({ where: { id: hhId }, select: { settings: true } });
    if (household?.settings) {
      settings = JSON.parse(household.settings);
    }
  } catch {
    /* empty */
  }

  const wifiSsid = settings.wifiSsid as string | undefined;
  const wifiPassword = settings.wifiPassword as string | undefined;

  if (wifiSsid && wifiPassword) {
    return {
      success: true,
      message: `Le réseau WiFi est "${wifiSsid}" et le mot de passe est "${wifiPassword}".`,
      data: { ssid: wifiSsid, password: wifiPassword },
    };
  }

  return {
    success: false,
    message: 'Les identifiants WiFi ne sont pas configurés. L\'hôte peut les ajouter dans les paramètres.',
  };
};

const handleApplianceGuide: IntentHandler = async (hhId, params) => {
  const appliance = params.appareil || params.text || '';
  const applianceLower = appliance.toLowerCase();

  const guides: Record<string, string> = {
    'lave-linge': 'Pour le lave-linge : mettez la lessive dans le tiroir gauche, le programme coton 40° convient à la plupart des textiles. Ne dépassez pas 7 kg.',
    'lave vaisselle': 'Pour le lave-vaisselle : versez le produit dans le compartiment droit, sel et liquide de rinçage dans les compartiments dédiés. Programme Éco recommandé.',
    'four': 'Pour le four : préchauffez à la température souhaitée. Chaleur tournante pour les pâtisseries, chaleur traditionnelle pour les grillades.',
    'cafetière': 'Pour la cafetière : remplissez le réservoir d\'eau, ajoutez le café moulu dans le filtre (7g par tasse), et appuyez sur marche.',
    'micro-ondes': 'Pour le micro-ondes : utilisez des plats adaptés, couvrez les aliments, et utilisez la fonction décongélation pour les plats surgelés.',
    'télévision': 'Pour la télévision : utilisez la télécommande noire sur la table basse. Bouton rouge pour allumer/éteindre.',
    'chauffage': 'Pour le chauffage : le thermostat est dans le couloir. Tournez dans le sens des aiguilles d\'une montre pour augmenter la température.',
  };

  // Try to find matching guide
  for (const [key, guide] of Object.entries(guides)) {
    if (applianceLower.includes(key) || key.includes(applianceLower)) {
      return { success: true, message: guide };
    }
  }

  return {
    success: true,
    message: `Je n'ai pas de guide spécifique pour "${appliance || 'cet appareil'}". Consultez le manuel ou demandez à votre hôte.`,
    data: { appliance },
  };
};

const handleCheckoutInstructions: IntentHandler = async (hhId) => {
  let config: Record<string, unknown> = {};
  try {
    const household = await db.household.findUnique({ where: { id: hhId }, select: { contactSettings: true } });
    if (household?.contactSettings) {
      config = JSON.parse(household.contactSettings);
    }
  } catch {
    /* empty */
  }

  const checkoutTime = (config.checkoutTime as string) || '11h00';
  const instructions = [
    `Votre heure de départ est ${checkoutTime}.`,
    'Veuillez rassembler vos affaires personnelles.',
    'Vérifiez les tiroirs et placards.',
    'Déposez les clés dans la boîte aux lettres.',
    'Merci pour votre séjour ! Bon voyage !',
  ].join(' ');

  return {
    success: true,
    message: instructions,
    data: { checkoutTime },
  };
};

/* ─── Safety ─── */

const handleSafetyEquipmentLocation: IntentHandler = async (hhId) => {
  const contacts = await db.emergencyContact.findMany({
    where: { householdId: hhId, type: 'emergency' },
  });

  const emergencyInfo = contacts.length > 0
    ? ` Numéros d'urgence : ${contacts.map((c) => `${c.name} — ${c.phone}`).join(', ')}.`
    : '';

  return {
    success: true,
    message: `L'extincteur se trouve près de la sortie principale. La trousse de premiers secours est dans le placard de la salle de bain.${emergencyInfo} Pour toute urgence, composez le 112.`,
    data: {
      emergencyContacts: contacts.map((c) => ({ name: c.name, phone: c.phone })),
    },
  };
};

const handleActivateAwayMode: IntentHandler = async (hhId) => {
  await db.household.update({
    where: { id: hhId },
    data: { isQuietMode: true },
  });

  await db.userLog.create({
    data: {
      householdId: hhId,
      action: 'voice_away_mode',
      details: 'Mode absent activé par commande vocale',
    },
  });

  return {
    success: true,
    message: 'Mode absent activé. Vos notifications sont réduites. Bonne route !',
    data: { awayMode: true },
  };
};

/* ─── System ─── */

const HELP_TEXT = `Voici ce que je peux faire :
Modes : passe en mode nuit, matin ou jour.
Rappels : rappelle-moi de…, dans 5 minutes, demain à 8h.
Courses : ajoute du lait aux courses, liste des courses.
Agenda : quel est mon programme aujourd'hui, ajoute un rendez-vous.
Cuisine : suggère une recette, recette avec du poulet.
Météo : quelle est la météo, conseil météo.
Humeur : je me sens bien, je suis fatigué.
WiFi : quel est le mot de passe WiFi.
Sécurité : où est l'extincteur, active le mode absent.
Messages : vérifie les messages, laisse un message.
Fun : raconte-moi une blague, fait intéressant du jour.
Dites "Maison, stop" pour m'arrêter.`;

const handleHelpCommandList: IntentHandler = async () => {
  return {
    success: true,
    message: HELP_TEXT,
    data: { action: 'help' },
  };
};

const handleToggleTTS: IntentHandler = async (hhId) => {
  let voiceSettings: Record<string, unknown> = {};
  try {
    const household = await db.household.findUnique({ where: { id: hhId }, select: { voiceSettings: true } });
    if (household?.voiceSettings && typeof household.voiceSettings === 'object') {
      voiceSettings = household.voiceSettings as Record<string, unknown>;
    }
  } catch {
    /* use default */
  }

  const currentEnabled = voiceSettings.enabled !== false;
  const newEnabled = !currentEnabled;

  // voiceSettings is a Json field
  await db.household.update({
    where: { id: hhId },
    data: { voiceSettings: { ...voiceSettings, enabled: newEnabled } },
  });

  return {
    success: true,
    message: newEnabled ? 'La voix est maintenant activée.' : 'La voix est maintenant désactivée.',
    data: { voiceEnabled: newEnabled },
  };
};

const handleToggleDetailLevel: IntentHandler = async (hhId) => {
  let voiceSettings: Record<string, unknown> = {};
  try {
    const household = await db.household.findUnique({ where: { id: hhId }, select: { voiceSettings: true } });
    if (household?.voiceSettings && typeof household.voiceSettings === 'object') {
      voiceSettings = household.voiceSettings as Record<string, unknown>;
    }
  } catch {
    /* use default */
  }

  const currentDetail = (voiceSettings.detailLevel as string) || 'normal';
  const newDetail = currentDetail === 'verbose' ? 'concise' : 'verbose';

  await db.household.update({
    where: { id: hhId },
    data: { voiceSettings: { ...voiceSettings, detailLevel: newDetail } },
  });

  return {
    success: true,
    message: newDetail === 'verbose'
      ? 'Mode détaillé activé. Je serai plus précise dans mes réponses.'
      : 'Mode concis activé. Je serai plus directe.',
    data: { detailLevel: newDetail },
  };
};

/* ─── Fun ─── */

const JOKES = [
  'Que dit un Wi-Fi quand il a peur ? Il perd la connexion !',
  'Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tomberaient dans le bateau.',
  'Qu\'est-ce qu\'un canif ? Un petit fien !',
  'Que fait une fraise sur un cheval ? Tagada tagada !',
  'Pourquoi les moutons aiment-ils le chewing-gum ? Parce que c\'est bon pour la laine.',
  'C\'est l\'histoire d\'un pingouin qui respire par les fesses. Un jour il s\'assoit et il meurt.',
  'Quelle est la différence entre un ornithorynque et un chat ? Pas grand-chose, si on enlève les poils.',
  'Pourquoi les escargots ne vont-ils jamais au cinéma ? Parce qu\'ils ont déjà leur coquille.',
];

const TRIVIA = [
  'Le saviez-vous ? La Tour Eiffel peut grandir de 15 cm en été à cause de la dilatation thermique de l\'acier.',
  'Le saviez-vous ? Un chat passe environ 70 % de sa vie à dormir.',
  'Le saviez-vous ? Le premier site web au monde a été créé en 1991 par Tim Berners-Lee.',
  'Le saviez-vous ? Les abeilles peuvent reconnaître des visages humains.',
  'Le saviez-vous ? Le seul aliment qui ne se périme jamais est le miel.',
  'Le saviez-vous ? La lumière du Soleil met environ 8 minutes pour atteindre la Terre.',
  'Le saviez-vous ? Il y a plus d\'étoiles dans l\'univers que de grains de sable sur Terre.',
  'Le saviez-vous ? Le ruban adhésif a été inventé en 1923 par Richard Drew.',
  'Le saviez-vous ? Un escargot peut dormir pendant 3 ans.',
  'Le saviez-vous ? Le cœur d\'une crevette est situé dans sa tête.',
];

const INSPIRATIONS = [
  'Chaque jour est une nouvelle chance de faire quelque chose de bien.',
  'Le bonheur n\'est pas une destination, c\'est un chemin.',
  'La gratitude transforme ce que nous avons en suffisance.',
  'Soyez le changement que vous souhaitez voir dans le monde.',
  'La vie est un mystère qu\'il faut vivre, non un problème à résoudre.',
  'Le succès, c\'est d\'aller d\'échec en échec sans perdre son enthousiasme.',
  'Souriez, la vie est magnifique !',
  'La patience est un arbre dont la racine est amère mais le fruit très doux.',
  'Chaque matin, nous naissons à nouveau. Ce que nous faisons aujourd\'hui est ce qui compte le plus.',
  'L\'imagination est plus importante que le savoir.',
];

const FUN_FACTS = [
  'Le vendredi 13 est considéré comme porte-bonheur en Italie !',
  'La France possède le plus grand nombre de fuseaux horaires au monde grâce à ses territoires d\'outre-mer.',
  'Le mot "bravo" vient de l\'italien et signifie "brave".',
  'Les dauphins dorment avec un œil ouvert.',
  'Le premier SMS de l\'histoire a été envoyé en 1992 avec le message "Joyeux Noël".',
  'En Finlande, il existe un concours annuel de port de femmes sur le dos.',
  'Le café est la deuxième marchandise la plus échangée au monde après le pétrole.',
  'Un groupe de flamants roses s\'appelle une "flamboyance".',
];

const handleEntertainmentRequest: IntentHandler = async (params) => {
  const type = params.type || params.quoi || '';
  if (type.includes('blague') || type.includes('plaisanterie') || type.includes('humour')) {
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
    return { success: true, message: joke };
  }
  const trivia = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
  return { success: true, message: trivia };
};

const handleDailyTrivia: IntentHandler = async () => {
  // Use day index for consistency within the same day
  const dayIndex = Math.floor(Date.now() / 86_400_000) % TRIVIA.length;
  return { success: true, message: TRIVIA[dayIndex] };
};

const handleDailyInspiration: IntentHandler = async () => {
  const dayIndex = Math.floor(Date.now() / 86_400_000) % INSPIRATIONS.length;
  return { success: true, message: INSPIRATIONS[dayIndex] };
};

const handleFunFact: IntentHandler = async () => {
  const dayIndex = Math.floor(Date.now() / 86_400_000) % FUN_FACTS.length;
  return { success: true, message: FUN_FACTS[dayIndex] };
};

/* ─── Communication ─── */

const handleCheckMessages: IntentHandler = async (hhId) => {
  const count = await db.message.count({
    where: { householdId: hhId, isRead: false },
  });

  const recent = await db.message.findMany({
    where: { householdId: hhId, isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { content: true, createdAt: true },
  });

  if (count === 0 && recent.length === 0) {
    return { success: true, message: 'Aucun nouveau message.' };
  }

  const unreadMsg = count > 0 ? `Vous avez ${count} message${count > 1 ? 's' : ''} non lu${count > 1 ? 's' : ''}.` : '';
  const recentMsg = recent.length > 0
    ? ` Dernier${recent.length > 1 ? 's' : ''} message${recent.length > 1 ? 's' : ''} : ${recent.map((m) => m.content).join(', ')}.`
    : '';

  return {
    success: true,
    message: `${unreadMsg}${recentMsg}`.trim(),
    data: { unreadCount: count, recentMessages: recent },
  };
};

const handleQuickHouseholdNote: IntentHandler = async (hhId, params) => {
  const content = params.text || params.message || params.contenu || '';
  if (!content.trim()) {
    return { success: false, message: 'Quel message souhaitez-vous laisser ?' };
  }
  if (content.length > 500) {
    return { success: false, message: 'Le message est trop long (maximum 500 caractères).' };
  }

  await db.message.create({
    data: {
      householdId: hhId,
      content: content.trim(),
      type: 'note',
      isPublic: true,
      isRead: false,
    },
  });

  return { success: true, message: 'Message enregistré sur le tableau de la maison.' };
};

const handleSendMessage: IntentHandler = async (hhId, params) => {
  const content = params.text || params.message || '';
  const recipientName = params.destinataire || params.to || '';

  if (!content.trim()) {
    return { success: false, message: 'Quel message souhaitez-vous envoyer ?' };
  }
  if (content.length > 500) {
    return { success: false, message: 'Le message est trop long (maximum 500 caractères).' };
  }

  // Try to find the recipient user in the household
  if (recipientName) {
    const recipient = await db.user.findFirst({
      where: {
        householdId: hhId,
        name: { contains: recipientName, mode: 'insensitive' },
      },
    });

    if (recipient) {
      await db.message.create({
        data: {
          householdId: hhId,
          senderId: recipient.id,
          content: content.trim(),
          type: 'note',
          isPublic: false,
          isRead: false,
        },
      });
      return { success: true, message: `Message envoyé à ${recipientName}.` };
    }
  }

  // Fallback: post as household note
  await db.message.create({
    data: {
      householdId: hhId,
      content: content.trim(),
      type: 'note',
      isPublic: true,
      isRead: false,
    },
  });

  const extra = recipientName ? ` Je n'ai pas trouvé ${recipientName} dans le foyer, le message est public.` : '';
  return { success: true, message: `Message enregistré.${extra}` };
};

/* ─── Radio (Icecast with local fallback) ─── */

const handlePlayRadioStream: IntentHandler = async (hhId, params) => {
  const station = params.station || params.station_name || 'radio-classique';

  if (!(await isApiEnabled('ICECAST'))) {
    return {
      success: true,
      message: 'Radio en ligne indisponible. Activez Icecast dans Configuration API. Je lance une ambiance locale à la place.',
      data: { action: 'play_radio', station, fallback: true },
    };
  }

  return {
    success: true,
    message: `Je lance ${station}…`,
    data: { action: 'play_radio', station },
  };
};

/* ─── Recommendations (Foursquare with local POI fallback) ─── */

const handleLocalRecommendation: IntentHandler = async (hhId, params) => {
  const category = params.category || params.type || '';

  if (!(await isApiEnabled('FOURSQUARE'))) {
    // Fallback: use local POIs from DB
    const pois = await db.pointOfInterest.findMany({
      where: {
        householdId: hhId,
        isActive: true,
        ...(category ? { category: { contains: category, mode: 'insensitive' as const } } : {}),
      },
      take: 3,
    });

    if (pois.length > 0) {
      const list = pois.map((p) => p.name).join(', ');
      return {
        success: true,
        message: `Je vous recommande : ${list}. Activez Foursquare pour plus de suggestions.`,
        data: { recommendations: pois.map((p) => ({ name: p.name, category: p.category })) },
      };
    }

    return {
      success: true,
      message: 'Je n\'ai pas de recommandations locales pour le moment. Activez Foursquare dans Configuration API pour plus de suggestions.',
      data: { recommendations: [] },
    };
  }

  // Foursquare API call
  try {
    const config = await getApiConfig('FOURSQUARE');
    let lat: number | undefined;
    let lon: number | undefined;
    try {
      const hh = await db.household.findUnique({ where: { id: hhId }, select: { coordinates: true } });
      const coords = hh?.coordinates as { lat?: number; lon?: number } | null;
      if (coords?.lat && coords?.lon) {
        lat = coords.lat;
        lon = coords.lon;
      }
    } catch { /* ignore */ }

    if (!lat || !lon || !config?.apiKey) {
      return {
        success: true,
        message: 'Impossible de géolocaliser votre maison. Vérifiez les coordonnées dans les paramètres.',
      };
    }

    const radius = 2000;
    const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=${radius}&limit=3&categories=${category || '13065'}&lang=fr`;
    const res = await fetch(url, {
      headers: { Authorization: config.apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error('Foursquare API error');

    const data = await res.json();
    const places = (data.results || []).slice(0, 3);
    if (places.length === 0) {
      return { success: true, message: 'Aucun lieu trouvé dans votre secteur.' };
    }

    const list = places.map((p: { name: string }) => p.name).join(', ');
    return {
      success: true,
      message: `Je vous recommande : ${list}.`,
      data: { recommendations: places.map((p: { name: string; categories?: Array<{ name: string }> }) => ({ name: p.name, category: p.categories?.[0]?.name })) },
    };
  } catch {
    return {
      success: true,
      message: 'Erreur lors de la recherche Foursquare. Réessayez plus tard.',
    };
  }
};

/* ─── Translation (DeepL with fallback) ─── */

const handleQuickTranslation: IntentHandler = async (hhId, params) => {
  const text = params.text || params.phrase || '';
  const targetLang = params.to || params.lang || 'en';

  if (!text.trim()) {
    return { success: false, message: 'Que souhaitez-vous traduire ?' };
  }

  if (!(await isApiEnabled('DEEPL'))) {
    return {
      success: true,
      message: 'Traduction indisponible. Activez DeepL dans Configuration API.',
      data: { action: 'translation_unavailable' },
    };
  }

  try {
    const config = await getApiConfig('DEEPL');
    if (!config?.apiKey) throw new Error('No API key');

    const baseUrl = config.baseUrl || (config.apiKey.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com');
    const url = `${baseUrl}/v2/translate`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: [text], target_lang: targetLang.toUpperCase() }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error('DeepL API error');

    const data = await res.json();
    const translated = data.translations?.[0]?.text || text;
    return {
      success: true,
      message: `Traduction : ${translated}`,
      data: { original: text, translated, targetLang },
    };
  } catch {
    return {
      success: true,
      message: 'Erreur lors de la traduction. Réessayez plus tard.',
    };
  }
};

/* ─── News (News API with local fallback) ─── */

const handleNewsBrief: IntentHandler = async () => {
  if (!(await isApiEnabled('NEWS_API'))) {
    const dayIndex = Math.floor(Date.now() / 86_400_000) % TRIVIA.length;
    return {
      success: true,
      message: `Actualités indisponibles hors ligne. Voici le fait du jour : ${TRIVIA[dayIndex]}`,
      data: { action: 'news_fallback' },
    };
  }

  try {
    const config = await getApiConfig('NEWS_API');
    if (!config?.apiKey) throw new Error('No API key');

    const url = `https://newsapi.org/v2/top-headlines?country=fr&pageSize=3&apiKey=${config.apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('News API error');

    const data = await res.json();
    const articles = (data.articles || []).slice(0, 3);
    if (articles.length === 0) {
      return { success: true, message: 'Aucune actualité disponible pour le moment.' };
    }

    const headlines = articles.map((a: { title: string }) => a.title).join('. ');
    return {
      success: true,
      message: `À la une : ${headlines}.`,
      data: { headlines: articles.map((a: { title: string; source?: { name: string } }) => ({ title: a.title, source: a.source?.name })) },
    };
  } catch {
    const dayIndex = Math.floor(Date.now() / 86_400_000) % TRIVIA.length;
    return {
      success: true,
      message: `Erreur de récupération des actualités. Voici le fait du jour : ${TRIVIA[dayIndex]}`,
    };
  }
};

/* ─── Sports (Sports DB with fallback) ─── */

const handleSportsScore: IntentHandler = async (hhId, params) => {
  const sport = params.sport || params.equipe || 'football';

  if (!(await isApiEnabled('SPORTS'))) {
    return {
      success: true,
      message: 'Scores sportifs indisponibles. Activez l\'API Sports dans Configuration API.',
      data: { action: 'sports_unavailable' },
    };
  }

  try {
    const config = await getApiConfig('SPORTS');
    if (!config?.apiKey) throw new Error('No API key');

    const url = `${config.baseUrl || 'https://www.thesportsdb.com/api/v1/json'}/${config.apiKey}/latestscore.php?id=${sport}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('Sports API error');

    const data = await res.json();
    const events = data.events || [];
    if (events.length === 0) {
      return { success: true, message: `Aucun score récent trouvé pour ${sport}.` };
    }

    const scores = events.slice(0, 3).map((e: { strEvent: string; intHomeScore: string; intAwayScore: string }) => `${e.strEvent} : ${e.intHomeScore}-${e.intAwayScore}`).join('. ');
    return {
      success: true,
      message: `Derniers scores : ${scores}.`,
      data: { events: events.slice(0, 3) },
    };
  } catch {
    return {
      success: true,
      message: 'Erreur lors de la récupération des scores. Réessayez plus tard.',
    };
  }
};

/* ─── Transport (Transit API with fallback) ─── */

const handleQueryEta: IntentHandler = async () => {
  if (!(await isApiEnabled('TRANSIT'))) {
    return {
      success: true,
      message: 'Informations trafic indisponibles hors ligne.',
      data: { action: 'transit_unavailable' },
    };
  }
  return { success: true, message: 'Recherche en cours…', data: { action: 'query_eta' } };
};

const handleTrafficAlert: IntentHandler = async () => {
  if (!(await isApiEnabled('TRANSIT'))) {
    return {
      success: true,
      message: 'Informations trafic indisponibles hors ligne.',
      data: { action: 'transit_unavailable' },
    };
  }
  return { success: true, message: 'Analyse du trafic en cours…', data: { action: 'traffic_alert' } };
};

const handlePublicTransitInfo: IntentHandler = async () => {
  if (!(await isApiEnabled('TRANSIT'))) {
    return {
      success: true,
      message: 'Informations transports en commun indisponibles hors ligne.',
      data: { action: 'transit_unavailable' },
    };
  }
  return { success: true, message: 'Recherche des transports en cours…', data: { action: 'public_transit_info' } };
};

const handleParkingAssist: IntentHandler = async () => {
  if (!(await isApiEnabled('TRANSIT'))) {
    return {
      success: true,
      message: 'Informations parking indisponibles hors ligne.',
      data: { action: 'transit_unavailable' },
    };
  }
  return { success: true, message: 'Recherche de parking en cours…', data: { action: 'parking_assist' } };
};

/* ─── Audio (Client-side signals) ─── */

const handlePlayMusicDefault: IntentHandler = async () => {
  return { success: true, message: 'audio_play', data: { action: 'play_default' } };
};

const handlePlayMusicGenre: IntentHandler = async (_hhId, params) => {
  const genre = params.genre || 'pop';
  return { success: true, message: 'audio_play', data: { action: 'play_genre', genre } };
};

const handleVolumeControl: IntentHandler = async (_hhId, params) => {
  const direction = params.direction || 'up';
  return { success: true, message: 'volume_change', data: { direction } };
};

const handlePlaybackControl: IntentHandler = async (_hhId, params) => {
  const action = params.action || 'pause';
  return { success: true, message: 'playback_change', data: { action } };
};

const handleNowPlaying: IntentHandler = async () => {
  return { success: true, message: 'now_playing_query', data: {} };
};

const handleMoodScene: IntentHandler = async (_hhId, params) => {
  const scene = params.scene || 'relax';
  return { success: true, message: 'mood_scene', data: { scene } };
};

/* ─── Other Missing Handlers ─── */

const handleReorderFavorites: IntentHandler = async (hhId) => {
  const items = await db.groceryItem.findMany({
    where: { householdId: hhId, isBought: false },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });

  if (items.length === 0) {
    return { success: true, message: 'Aucun favori de courses à réorganiser.', data: { items: [] } };
  }

  const list = items.map((item, i) => `${i + 1}. ${item.name}`).join(', ');
  return {
    success: true,
    message: `Voici vos favoris de courses : ${list}.`,
    data: { items: items.map((i) => ({ id: i.id, name: i.name })) },
  };
};

const handlePriceComparison: IntentHandler = async () => {
  return {
    success: true,
    message: 'Comparaison de prix indisponible hors ligne.',
    data: { action: 'price_comparison_unavailable' },
  };
};

const handleEmergencyContact: IntentHandler = async (hhId) => {
  const contacts = await db.emergencyContact.findMany({
    where: { householdId: hhId },
  });

  if (contacts.length === 0) {
    return {
      success: true,
      message: 'Aucun contact d\'urgence enregistré. Ajoutez-en dans les paramètres de sécurité.',
      data: { contacts: [] },
    };
  }

  const list = contacts.map((c) => `${c.name} — ${c.phone}`).join('. ');
  const telLinks = contacts.map((c) => ({ name: c.name, phone: c.phone, tel: `tel:${c.phone}` }));
  return {
    success: true,
    message: `Contacts d\'urgence : ${list}.`,
    data: { contacts: telLinks },
  };
};

const handleContactHost: IntentHandler = async (_hhId, _params, household) => {
  const phone = household.contactPhone;
  if (phone) {
    return {
      success: true,
      message: `Je ne peux pas appeler directement. Voici le numéro : ${phone}.`,
      data: { phone, tel: `tel:${phone}` },
    };
  }
  return {
    success: true,
    message: 'Aucun numéro de contact configuré. Demandez à l\'hôte de le renseigner dans les paramètres.',
  };
};

const handleAdjustSpeechRate: IntentHandler = async (_hhId, params) => {
  const rate = params.rate || 'normal';
  return { success: true, message: 'speech_rate_change', data: { rate } };
};

const handleRepeatLastResponse: IntentHandler = async () => {
  return {
    success: true,
    message: 'Je n\'ai pas de réponse précédente en mémoire sur le serveur.',
    data: { action: 'repeat_unavailable' },
  };
};

const handleCancelLastAction: IntentHandler = async () => {
  return {
    success: true,
    message: 'Action annulée.',
    data: { action: 'cancelled' },
  };
};

const handleFollowUpQuestion: IntentHandler = async () => {
  return {
    success: true,
    message: 'Contexte de suivi non disponible sur le serveur.',
    data: { action: 'follow_up_unavailable' },
  };
};

const handleReadMessagesAloud: IntentHandler = async (hhId) => {
  const unread = await db.message.findMany({
    where: { householdId: hhId, isRead: false },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (unread.length === 0) {
    return { success: true, message: 'Aucun message non lu.' };
  }

  const list = unread.map((m) => m.content).join('. ');
  return {
    success: true,
    message: `Vous avez ${unread.length} message${unread.length > 1 ? 's' : ''} : ${list}.`,
    data: { messages: unread.map((m) => ({ content: m.content, createdAt: m.createdAt })) },
  };
};

const handleInteractiveGame: IntentHandler = async () => {
  return {
    success: true,
    message: 'Jeux interactifs bientôt disponibles !',
    data: { action: 'games_coming_soon' },
  };
};

const handleSuggestWellness: IntentHandler = async (hhId) => {
  const rituals = await db.ritualTask.findMany({
    where: { householdId: hhId },
    take: 10,
  });

  if (rituals.length === 0) {
    return {
      success: true,
      message: 'Aucun rituel de bien-être configuré. Voici une suggestion : prenez 5 minutes pour respirer profondément.',
      data: { suggestions: [] },
    };
  }

  const morningRituals = rituals.filter((r) => r.timeOfDay === 'morning').map((r) => r.title);
  const eveningRituals = rituals.filter((r) => r.timeOfDay === 'evening').map((r) => r.title);

  let suggestion = 'Voici vos rituels de bien-être.';
  if (morningRituals.length > 0) suggestion += ` Matin : ${morningRituals.join(', ')}.`;
  if (eveningRituals.length > 0) suggestion += ` Soir : ${eveningRituals.join(', ')}.`;

  return {
    success: true,
    message: suggestion,
    data: { suggestions: rituals.map((r) => ({ title: r.title, timeOfDay: r.timeOfDay })) },
  };
};

const handleQuerySleepStats: IntentHandler = async (hhId) => {
  try {
    // Query MoodEntry for recent sleep-related entries
    const recentEntries = await db.moodEntry.findMany({
      where: {
        user: { householdId: hhId },
      },
      orderBy: { createdAt: 'desc' },
      take: 7,
    });

    if (recentEntries.length === 0) {
      return {
        success: true,
        message: 'Aucune donnée de sommeil disponible. Commencez à suivre votre humeur pour obtenir des statistiques.',
        data: { entries: [] },
      };
    }

    const avgMood = recentEntries.reduce((sum, e) => sum + e.mood, 0) / recentEntries.length;
    const moodLabel = avgMood >= 4 ? 'bonne' : avgMood >= 3 ? 'moyenne' : 'basse';

    return {
      success: true,
      message: `Sur les ${recentEntries.length} dernières entrées, votre humeur moyenne est ${moodLabel} (${avgMood.toFixed(1)}/5). Continuez à suivre votre bien-être !`,
      data: {
        entries: recentEntries.map((e) => ({ mood: e.mood, note: e.note, date: e.createdAt })),
        avgMood: Math.round(avgMood * 10) / 10,
      },
    };
  } catch {
    return {
      success: true,
      message: 'Impossible de récupérer les données de sommeil. Vérifiez que le suivi d\'humeur est activé.',
    };
  }
};

/* ─── Legacy Aliases (backward compatibility with voice-command-router.ts) ─── */

const handleAddReminder: IntentHandler = async (hhId, params) => {
  const text = params.text || '';
  return handleAddReminderTime(hhId, { ...params, text });
};

const handleAddGrocery: IntentHandler = async (hhId, params) => {
  const item = params.item || '';
  return handleAddGroceryItem(hhId, { ...params, item });
};

const handleAskTime: IntentHandler = async () => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return { success: true, message: `Il est ${timeStr}.` };
};

const handleOpenGuide: IntentHandler = async () => {
  return {
    success: true,
    message: 'Ouverture du guide du quartier…',
    data: { action: 'open_guide' },
  };
};

const handleSystemStop: IntentHandler = async () => {
  return { success: true, message: '', data: { action: 'stop' } };
};

/* ═══════════════════════════════════════════════════════════════
   INTENT HANDLER REGISTRY
   ═══════════════════════════════════════════════════════════════ */

const intentHandlers: Record<string, IntentHandler> = {
  // Planning & Reminders
  add_reminder_time: handleAddReminderTime,
  cancel_reminder: handleCancelReminder,
  list_reminders: handleListReminders,
  add_appointment: handleAddAppointment,
  add_recurring_birthday: handleAddRecurringBirthday,
  add_calendar_event: handleAddCalendarEvent,
  query_agenda: handleQueryAgenda,

  // Grocery
  add_grocery_item: handleAddGroceryItem,
  list_active_groceries: handleListActiveGroceries,

  // Cuisine
  suggest_recipe: handleSuggestRecipe,
  search_recipe_by_ingredient: handleSearchRecipeByIngredient,

  // Mode changes
  mode_night: handleModeNight,
  mode_morning: handleModeMorning,
  mode_day: handleModeDay,

  // Weather (Open-Meteo)
  ask_weather: handleAskWeather,
  weather_advice: handleWeatherAdvice,

  // Wellness
  log_mood: handleLogMood,
  trigger_ritual: handleTriggerRitual,
  hydration_reminder: handleHydrationReminder,
  suggest_wellness: handleSuggestWellness,
  query_sleep_stats: handleQuerySleepStats,

  // Hospitality
  repeat_wifi_credentials: handleRepeatWifiCredentials,
  appliance_guide: handleApplianceGuide,
  checkout_instructions: handleCheckoutInstructions,
  local_recommendation: handleLocalRecommendation,
  contact_host: handleContactHost,

  // Safety
  safety_equipment_location: handleSafetyEquipmentLocation,
  emergency_contact: handleEmergencyContact,
  activate_away_mode: handleActivateAwayMode,

  // System
  help_command_list: handleHelpCommandList,
  system_help: handleHelpCommandList,
  toggle_tts: handleToggleTTS,
  toggle_detail_level: handleToggleDetailLevel,
  adjust_speech_rate: handleAdjustSpeechRate,
  cancel_last_action: handleCancelLastAction,
  repeat_last_response: handleRepeatLastResponse,
  follow_up_question: handleFollowUpQuestion,

  // Fun
  entertainment_request: handleEntertainmentRequest,
  daily_trivia: handleDailyTrivia,
  daily_inspiration: handleDailyInspiration,
  fun_fact: handleFunFact,
  interactive_game: handleInteractiveGame,

  // Communication
  check_messages: handleCheckMessages,
  quick_household_note: handleQuickHouseholdNote,
  send_message: handleSendMessage,
  read_messages_aloud: handleReadMessagesAloud,

  // Audio (client-side signals)
  play_music_default: handlePlayMusicDefault,
  play_music_genre: handlePlayMusicGenre,
  volume_control: handleVolumeControl,
  playback_control: handlePlaybackControl,
  now_playing: handleNowPlaying,
  mood_scene: handleMoodScene,

  // Radio (Icecast)
  play_radio_stream: handlePlayRadioStream,

  // External API enrichment
  quick_translation: handleQuickTranslation,
  news_brief: handleNewsBrief,
  sports_score: handleSportsScore,

  // Transport (Transit API)
  query_eta: handleQueryEta,
  traffic_alert: handleTrafficAlert,
  public_transit_info: handlePublicTransitInfo,
  parking_assist: handleParkingAssist,

  // Shopping
  reorder_favorites: handleReorderFavorites,
  price_comparison: handlePriceComparison,

  // Legacy aliases (backward-compatible with voice-command-router.ts)
  add_reminder: handleAddReminder,
  add_grocery: handleAddGrocery,
  ask_time: handleAskTime,
  open_guide: handleOpenGuide,
  system_stop: handleSystemStop,
};
