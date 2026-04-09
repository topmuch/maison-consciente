'use server';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Notification Server Actions

   Token-based actions for the tablet display to poll
   pending notifications, manage preferences, and
   trigger test notifications.

   All actions validate displayToken + displayEnabled.
   ═══════════════════════════════════════════════════════ */

import { db } from '@/lib/db';
import {
  type NotificationType,
  type NotificationPrefs,
  type NotificationLogEntry,
  type NotificationPriority,
  type TriggerPayload,
  DEFAULT_NOTIFICATION_PREFS,
} from '@/lib/notification-config';
import { evaluateTrigger, formatMessage, getPriority } from '@/lib/notification-engine';

/* ── Zod validation for update inputs ── */
const QuietHoursSchema = {
  start: { min: 0, max: 23 },
  end: { min: 0, max: 23 },
  enabled: { type: 'boolean' },
};

/* ── Valid notification types set ── */
const VALID_TYPES = new Set<string>([
  'morning', 'meal', 'evening', 'night', 'anniversary',
  'rainAlert', 'extremeTemp', 'severeAlert', 'sunEvents',
  'reminder15min', 'immediate', 'travelPrep', 'checkout', 'holiday',
  'doorWindow', 'autoArm', 'deviceBattery', 'leak',
  'stockLow', 'deals', 'autoReorder',
  'routineStart', 'phaseChange', 'sleepMode',
  'medication', 'emergency', 'airQuality',
  'welcome', 'checkoutReminder', 'localTip', 'supportAlert',
  'updateDone', 'lowBattery', 'connectivity',
  'dailyTip', 'quote', 'wellnessChallenge',
]);

/* ── Helpers ── */

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object' && !Array.isArray(value)) return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

/** Deep-merge partial prefs with defaults */
function mergeWithDefaults(partial: Partial<NotificationPrefs>): NotificationPrefs {
  const d = DEFAULT_NOTIFICATION_PREFS;
  return {
    temporal: { ...d.temporal, ...partial.temporal },
    weather: { ...d.weather, ...partial.weather },
    calendar: { ...d.calendar, ...partial.calendar },
    homeSecurity: { ...d.homeSecurity, ...partial.homeSecurity },
    inventory: { ...d.inventory, ...partial.inventory },
    ambiance: { ...d.ambiance, ...partial.ambiance },
    health: { ...d.health, ...partial.health },
    hospitality: { ...d.hospitality, ...partial.hospitality },
    system: { ...d.system, ...partial.system },
    engagement: { ...d.engagement, ...partial.engagement },
    quietHours: { ...d.quietHours, ...partial.quietHours },
    maxPerHour: partial.maxPerHour ?? d.maxPerHour,
    minIntervalMin: partial.minIntervalMin ?? d.minIntervalMin,
    skipIfActiveMin: partial.skipIfActiveMin ?? d.skipIfActiveMin,
  };
}

/** Resolve household by display token */
async function resolveByToken(token: string) {
  return db.household.findUnique({
    where: { displayToken: token, displayEnabled: true },
    select: { id: true, notificationPrefs: true, notificationLog: true },
  });
}

/* ═══════════════════════════════════════════════════════════
   ACTION 1: Get Notification Preferences
   ═══════════════════════════════════════════════════════ */

export async function getNotificationPrefs(
  token: string,
): Promise<{ success: boolean; prefs: NotificationPrefs }> {
  try {
    const household = await resolveByToken(token);
    if (!household) {
      return { success: true, prefs: DEFAULT_NOTIFICATION_PREFS };
    }

    const partial = safeJsonParse<Partial<NotificationPrefs>>(
      household.notificationPrefs,
      {},
    );

    return { success: true, prefs: mergeWithDefaults(partial) };
  } catch {
    return { success: true, prefs: DEFAULT_NOTIFICATION_PREFS };
  }
}

/* ═══════════════════════════════════════════════════════════
   ACTION 2: Update Notification Preferences
   ═══════════════════════════════════════════════════════ */

export async function updateNotificationPrefs(
  token: string,
  updates: Partial<NotificationPrefs>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const household = await resolveByToken(token);
    if (!household) {
      return { success: false, error: 'Tablette non trouvée' };
    }

    // Validate numeric constraints
    const merged = mergeWithDefaults(updates);
    const errors: string[] = [];

    if (merged.maxPerHour < 1 || merged.maxPerHour > 10) {
      errors.push('maxPerHour doit être entre 1 et 10');
    }
    if (merged.minIntervalMin < 1 || merged.minIntervalMin > 60) {
      errors.push('minIntervalMin doit être entre 1 et 60');
    }
    if (
      merged.quietHours.start < 0 || merged.quietHours.start > 23 ||
      merged.quietHours.end < 0 || merged.quietHours.end > 23
    ) {
      errors.push('Les heures de silence doivent être entre 0 et 23');
    }

    if (errors.length > 0) {
      return { success: false, error: errors.join('. ') };
    }

    await db.household.update({
      where: { id: household.id },
      data: { notificationPrefs: merged as any },
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Erreur serveur' };
  }
}

/* ═══════════════════════════════════════════════════════════
   ACTION 3: Trigger Proactive Notification (for testing)
   ═══════════════════════════════════════════════════════════ */

export async function triggerProactiveNotification(
  token: string,
  type: string,
  payload: Record<string, string | number | boolean | null>,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const household = await resolveByToken(token);
    if (!household) {
      return { success: false, error: 'Tablette non trouvée' };
    }

    if (!VALID_TYPES.has(type)) {
      return { success: false, error: `Type inconnu: ${type}` };
    }

    const notifType = type as NotificationType;

    // Get prefs and evaluate trigger
    const prefs = safeJsonParse<Partial<NotificationPrefs>>(
      household.notificationPrefs,
      {},
    );
    const fullPrefs = mergeWithDefaults(prefs);

    const { allowed, reason } = evaluateTrigger(fullPrefs, notifType, new Date());
    if (!allowed) {
      return { success: true, message: `Notification bloquée: ${reason}` };
    }

    // Format message
    const message = formatMessage(notifType, payload as TriggerPayload);
    const priority = getPriority(notifType);

    // Add to notificationLog
    const log = safeJsonParse<NotificationLogEntry[]>(household.notificationLog, []);
    const now = new Date().toISOString();

    log.push({
      type: notifType,
      message,
      priority,
      createdAt: now,
      consumed: false,
      consumedAt: null,
    });

    // FIFO trim to 10
    const trimmed = log.length > 10 ? log.slice(-10) : log;

    await db.household.update({
      where: { id: household.id },
      data: { notificationLog: trimmed as any },
    });

    return { success: true, message };
  } catch {
    return { success: false, error: 'Erreur serveur' };
  }
}

/* ═══════════════════════════════════════════════════════════
   ACTION 4: Get Pending Notifications (polling)
   ═══════════════════════════════════════════════════════════ */

const PRIORITY_WEIGHT: Record<NotificationPriority, number> = {
  emergency: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export async function getPendingNotifications(
  token: string,
): Promise<NotificationLogEntry[]> {
  try {
    const household = await resolveByToken(token);
    if (!household) return [];

    const log = safeJsonParse<NotificationLogEntry[]>(household.notificationLog, []);
    const pending = log.filter((entry) => !entry.consumed);

    if (pending.length === 0) return [];

    // Sort by priority (emergency first), then by createdAt
    const sorted = [...pending].sort((a, b) => {
      const pa = PRIORITY_WEIGHT[a.priority] ?? 2;
      const pb = PRIORITY_WEIGHT[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      return a.createdAt.localeCompare(b.createdAt);
    });

    // Mark all as consumed
    const now = new Date().toISOString();
    const updated = log.map((entry) =>
      entry.consumed
        ? entry
        : { ...entry, consumed: true, consumedAt: now },
    );

    await db.household.update({
      where: { id: household.id },
      data: { notificationLog: updated as any },
    });

    return sorted;
  } catch {
    return [];
  }
}
