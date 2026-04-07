// ═══════════════════════════════════════════════════════════════
// MAISON CONSCIENTE — Notification Scheduler
// Lightweight 60-second interval scheduler with temporal,
// weather & calendar triggers. No external dependencies.
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import {
  type NotificationType,
  type NotificationPriority,
  type NotificationPrefs,
  type TriggerPayload,
  type NotificationLogEntry,
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_CATEGORIES,
} from './notification-config';
import { evaluateTrigger, formatMessage, getPriority } from './notification-engine';

/* ── Interval cleanup reference ── */
let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let cleanupCounter = 0;

/* ═══════════════════════════════════════════════════════════════
   SAFE JSON HELPERS
   ═══════════════════════════════════════════════════════════════ */

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  if (typeof value === 'object' && value !== null) {
    return value as T;
  }
  return fallback;
}

function safeParseSettings(value: string): Record<string, unknown> {
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
}

/** Get notification preferences from household settings JSON field */
function getNotificationPrefs(settingsJson: string): NotificationPrefs {
  const settings = safeParseSettings(settingsJson);
  const raw = settings.notificationPrefs as NotificationPrefs | undefined;
  return raw ?? DEFAULT_NOTIFICATION_PREFS;
}

/** Get notification log from household settings JSON field */
function getNotificationLog(settingsJson: string): NotificationLogEntry[] {
  const settings = safeParseSettings(settingsJson);
  return (settings.notificationLog as NotificationLogEntry[]) ?? [];
}

/** Deep merge with DEFAULT_NOTIFICATION_PREFS to ensure all keys exist */
function mergePrefs(partial: Partial<NotificationPrefs> | NotificationPrefs): NotificationPrefs {
  const defaults = DEFAULT_NOTIFICATION_PREFS;
  return {
    temporal: { ...defaults.temporal, ...(partial as Record<string, unknown>).temporal },
    weather: { ...defaults.weather, ...(partial as Record<string, unknown>).weather },
    calendar: { ...defaults.calendar, ...(partial as Record<string, unknown>).calendar },
    homeSecurity: { ...defaults.homeSecurity, ...(partial as Record<string, unknown>).homeSecurity },
    inventory: { ...defaults.inventory, ...(partial as Record<string, unknown>).inventory },
    ambiance: { ...defaults.ambiance, ...(partial as Record<string, unknown>).ambiance },
    health: { ...defaults.health, ...(partial as Record<string, unknown>).health },
    hospitality: { ...defaults.hospitality, ...(partial as Record<string, unknown>).hospitality },
    system: { ...defaults.system, ...(partial as Record<string, unknown>).system },
    engagement: { ...defaults.engagement, ...(partial as Record<string, unknown>).engagement },
    quietHours: { ...defaults.quietHours, ...(partial as Record<string, unknown>).quietHours },
    maxPerHour: (partial as NotificationPrefs).maxPerHour ?? defaults.maxPerHour,
    minIntervalMin: (partial as NotificationPrefs).minIntervalMin ?? defaults.minIntervalMin,
    skipIfActiveMin: (partial as NotificationPrefs).skipIfActiveMin ?? defaults.skipIfActiveMin,
  };
}

/* ═══════════════════════════════════════════════════════════════
   API SETTINGS HELPERS
   ═══════════════════════════════════════════════════════════════ */

interface ApiSettings {
  openMeteo?: boolean;
  [key: string]: unknown;
}

interface Coordinates {
  lat: number;
  lon: number;
}

function isOpenMeteoEnabled(apiSettings: unknown): boolean {
  const settings = safeJsonParse<ApiSettings>(apiSettings, {});
  return settings.openMeteo === true;
}

function getCoordinates(coords: unknown): Coordinates | null {
  const parsed = safeJsonParse<Coordinates>(coords, { lat: 0, lon: 0 });
  if (typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
    return parsed;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   TEMPORAL TRIGGERS
   ═══════════════════════════════════════════════════════════════ */

function checkTemporalTriggers(
  hour: number,
  minute: number,
  notificationLog: NotificationLogEntry[],
): { type: NotificationType; data: TriggerPayload }[] {
  const triggers: { type: NotificationType; data: TriggerPayload }[] = [];
  const todayStr = new Date().toISOString().slice(0, 10);

  // Helper: check if a type was already triggered today
  const triggeredToday = (type: string): boolean => {
    return notificationLog.some(
      (entry) => entry.type === type && entry.createdAt.startsWith(todayStr),
    );
  };

  // Morning: 7:00-9:00, once per day
  if (hour >= 7 && hour < 9 && !triggeredToday('morning')) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    triggers.push({
      type: 'morning',
      data: { time: timeStr, greeting: 'Bonne journée à vous !' },
    });
  }

  // Meal: 11:30-12:00 and 18:30-19:00, once per day each slot
  if (hour === 11 && minute >= 30 && !triggeredToday('meal-midi')) {
    triggers.push({
      type: 'meal',
      data: { mealType: 'midi', mealSuggestion: 'Bon appétit !' },
    });
  }
  if (hour === 18 && minute >= 30 && !triggeredToday('meal-soir')) {
    triggers.push({
      type: 'meal',
      data: { mealType: 'dîner', mealSuggestion: 'Bon appétit !' },
    });
  }

  // Evening: 18:00-20:00, once per day
  if (hour >= 18 && hour < 20 && !triggeredToday('evening')) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    triggers.push({
      type: 'evening',
      data: { time: timeStr, date_summary: `Nous sommes le ${dateStr}.` },
    });
  }

  // Night: 22:00-23:00, once per day
  if (hour >= 22 && hour < 23 && !triggeredToday('night')) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    triggers.push({
      type: 'night',
      data: { time: timeStr },
    });
  }

  return triggers;
}

/* ═══════════════════════════════════════════════════════════════
   WEATHER TRIGGERS (Open-Meteo — optional)
   ═══════════════════════════════════════════════════════════════ */

interface OpenMeteoResponse {
  current?: {
    weather_code?: number;
    temperature_2m?: number;
  };
}

/** WMO rain codes: drizzle (51-57), rain (61-67), rain showers (80-82), thunderstorm (95-99) */
const RAIN_WMO_CODES = new Set([
  51, 53, 55, 56, 57,   // drizzle
  61, 63, 65, 66, 67,   // rain
  80, 81, 82,           // rain showers
  95, 96, 99,           // thunderstorm
]);

async function checkWeatherTriggers(
  coords: Coordinates,
  notificationLog: NotificationLogEntry[],
): Promise<{ type: NotificationType; data: TriggerPayload }[]> {
  const triggers: { type: NotificationType; data: TriggerPayload }[] = [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const recentlyAlerted = (type: string, withinMin: number): boolean => {
    const cutoff = new Date(Date.now() - withinMin * 60_000).toISOString();
    return notificationLog.some(
      (entry) => entry.type === type && entry.createdAt >= cutoff,
    );
  };

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=weather_code,temperature_2m&timezone=auto`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return triggers;

    const data = safeJsonParse<OpenMeteoResponse>(await response.text(), {});

    if (!data.current) return triggers;

    const wmoCode = data.current.weather_code ?? 0;
    const temp = data.current.temperature_2m ?? 20;

    // Rain alert — warn only once per hour
    if (RAIN_WMO_CODES.has(wmoCode) && !recentlyAlerted('rainAlert', 60)) {
      triggers.push({
        type: 'rainAlert',
        data: { minutes: '15' },
      });
    }

    // Extreme temperature — warn once per 3 hours
    if ((temp > 35 || temp < -5) && !recentlyAlerted('extremeTemp', 180)) {
      const advice = temp > 35
        ? 'Restez hydraté et évitez les efforts physiques.'
        : 'Couvrez-vous bien et limitez les sorties.';
      triggers.push({
        type: 'extremeTemp',
        data: { temp: Math.round(temp), advice },
      });
    }
  } catch {
    // Silently ignore fetch errors — weather is optional enrichment
  }

  return triggers;
}

/* ═══════════════════════════════════════════════════════════════
   CALENDAR TRIGGERS
   ═══════════════════════════════════════════════════════════════ */

async function checkCalendarTriggers(
  householdId: string,
): Promise<{ type: NotificationType; data: TriggerPayload }[]> {
  const triggers: { type: NotificationType; data: TriggerPayload }[] = [];
  const now = new Date();
  const fifteenMinFromNow = new Date(now.getTime() + 15 * 60_000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60_000);

  try {
    // reminder15min: triggerAt within next 15 minutes, not yet notified
    const upcomingReminders = await db.reminder.findMany({
      where: {
        householdId,
        notified: false,
        triggerAt: { lte: fifteenMinFromNow },
      },
    });

    for (const reminder of upcomingReminders) {
      triggers.push({
        type: 'reminder15min',
        data: { eventTitle: reminder.text },
      });
      // Mark as notified
      await db.reminder.update({
        where: { id: reminder.id },
        data: { notified: true },
      }).catch(() => { /* silent */ });
    }

    // immediate: triggerAt <= now, not yet notified (already covered above, but also catch past ones)
    const pastReminders = await db.reminder.findMany({
      where: {
        householdId,
        notified: false,
        triggerAt: { lte: now },
      },
    });

    for (const reminder of pastReminders) {
      // Avoid duplicate if already added as reminder15min
      if (!triggers.some((t) => t.data.eventTitle === reminder.text)) {
        triggers.push({
          type: 'immediate',
          data: { eventTitle: reminder.text },
        });
        await db.reminder.update({
          where: { id: reminder.id },
          data: { notified: true },
        }).catch(() => { /* silent */ });
      }
    }

    // checkout: CalendarEvent with type='checkout' today
    const todayStr = now.toISOString().slice(0, 10);
    const alreadyNotifiedCheckout = await db.calendarEvent.findFirst({
      where: { householdId, type: 'checkout', date: { gte: todayStart, lt: todayEnd } },
    });

    if (alreadyNotifiedCheckout) {
      const eventTime = alreadyNotifiedCheckout.date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      triggers.push({
        type: 'checkout',
        data: { checkoutTime: eventTime },
      });
    }

    // holiday: CalendarEvent with type='holiday' today
    const holidayToday = await db.calendarEvent.findFirst({
      where: { householdId, type: 'holiday', date: { gte: todayStart, lt: todayEnd } },
    });

    if (holidayToday) {
      triggers.push({
        type: 'holiday',
        data: { holidayName: holidayToday.title, holidayWish: 'Bonne journée !' },
      });
    }
  } catch {
    // Silent — calendar data is optional
  }

  return triggers;
}

/* ═══════════════════════════════════════════════════════════════
   QUEUE NOTIFICATION
   ═══════════════════════════════════════════════════════════════ */

const MAX_LOG_ENTRIES = 10;
const LOG_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Add a notification to the household's notification log.
 * Trims to MAX_LOG_ENTRIES (FIFO) and persists to settings JSON.
 */
export async function queueNotification(
  householdId: string,
  type: NotificationType,
  message: string,
  priority: NotificationPriority,
): Promise<void> {
  try {
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: { settings: true },
    });

    if (!household) return;

    const settings = safeParseSettings(household.settings);
    const log: NotificationLogEntry[] = (settings.notificationLog as NotificationLogEntry[]) ?? [];

    // Check for duplicate (same type in last 5 minutes)
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    const recentDuplicate = log.find(
      (entry) => entry.type === type && entry.createdAt >= fiveMinAgo,
    );
    if (recentDuplicate) return;

    // Add new entry
    log.push({
      type,
      message,
      priority,
      createdAt: new Date().toISOString(),
      consumed: false,
      consumedAt: null,
    });

    // Trim to max 10 items (FIFO — keep newest)
    if (log.length > MAX_LOG_ENTRIES) {
      log.splice(0, log.length - MAX_LOG_ENTRIES);
    }

    // Update household settings
    settings.notificationLog = log;
    await db.household.update({
      where: { id: householdId },
      data: { settings: JSON.stringify(settings) },
    });
  } catch {
    // Silent fail — logging is non-critical
  }
}

/* ═══════════════════════════════════════════════════════════════
   EXPIRED LOG CLEANUP
   ═══════════════════════════════════════════════════════════════ */

async function cleanupExpiredEntries(householdId: string, settingsJson: string): Promise<void> {
  try {
    const settings = safeParseSettings(settingsJson);
    const log: NotificationLogEntry[] = (settings.notificationLog as NotificationLogEntry[]) ?? [];
    const cutoff = new Date(Date.now() - LOG_EXPIRY_MS).toISOString();

    const filtered = log.filter((entry) => entry.createdAt >= cutoff);

    if (filtered.length !== log.length) {
      settings.notificationLog = filtered;
      await db.household.update({
        where: { id: householdId },
        data: { settings: JSON.stringify(settings) },
      });
    }
  } catch {
    // Silent
  }
}

/* ═══════════════════════════════════════════════════════════════
   HOURLY COUNT HELPER
   ═══════════════════════════════════════════════════════════════ */

function getHourlyCount(notificationLog: NotificationLogEntry[]): number {
  const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
  return notificationLog.filter((entry) => entry.createdAt >= oneHourAgo).length;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN SCHEDULER LOOP
   ═══════════════════════════════════════════════════════════════ */

async function tick(): Promise<void> {
  try {
    const households = await db.household.findMany({
      where: {
        displayEnabled: true,
        displayToken: { not: null },
      },
      select: {
        id: true,
        settings: true,
        apiSettings: true,
        coordinates: true,
      },
    });

    for (const household of households) {
      try {
        const prefs = mergePrefs(getNotificationPrefs(household.settings));
        const log = getNotificationLog(household.settings);
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const hourlyCount = getHourlyCount(log);

        // 1. Temporal triggers
        const temporalTriggers = checkTemporalTriggers(hour, minute, log);

        // 2. Weather triggers (only if Open-Meteo enabled and coordinates available)
        let weatherTriggers: { type: NotificationType; data: TriggerPayload }[] = [];
        if (isOpenMeteoEnabled(household.apiSettings)) {
          const coords = getCoordinates(household.coordinates);
          if (coords) {
            weatherTriggers = await checkWeatherTriggers(coords, log);
          }
        }

        // 3. Calendar triggers
        const calendarTriggers = await checkCalendarTriggers(household.id);

        // Combine all triggers
        const allTriggers = [...temporalTriggers, ...weatherTriggers, ...calendarTriggers];

        // Evaluate each trigger and queue if allowed
        for (const trigger of allTriggers) {
          const { allowed } = evaluateTrigger(prefs, trigger.type, now, hourlyCount);
          if (!allowed) continue;

          const message = formatMessage(trigger.type, trigger.data);
          const priority = getPriority(trigger.type);

          await queueNotification(household.id, trigger.type, message, priority);
        }

        // 4. Lazy cleanup every 10 minutes
        cleanupCounter++;
        if (cleanupCounter >= 10) {
          await cleanupExpiredEntries(household.id, household.settings);
        }
      } catch {
        // Per-household errors are silent
      }
    }

    // Reset cleanup counter every 10 minutes
    if (cleanupCounter >= 10) {
      cleanupCounter = 0;
    }
  } catch {
    // Entire tick failure is silent in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('[NotificationScheduler] Tick failed');
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   START / STOP
   ═══════════════════════════════════════════════════════════════ */

/**
 * Start the notification scheduler.
 * Runs every 60 seconds, checking temporal, weather & calendar triggers.
 *
 * @returns Cleanup function — call to stop the scheduler.
 */
export function startNotificationScheduler(): () => void {
  if (schedulerInterval !== null) {
    // Already running
    return () => { /* noop */ };
  }

  // Run first tick immediately, then every 60 seconds
  tick(); // fire-and-forget
  schedulerInterval = setInterval(tick, 60_000);

  return () => {
    if (schedulerInterval !== null) {
      clearInterval(schedulerInterval);
      schedulerInterval = null;
    }
  };
}
