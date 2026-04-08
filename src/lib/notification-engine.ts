// ═══════════════════════════════════════════════════════════════
// MAISON CONSCIENTE — Notification Engine
// Core evaluation, formatting & priority logic
// ═══════════════════════════════════════════════════════════════

import {
  type NotificationType,
  type NotificationCategory,
  type NotificationPrefs,
  type NotificationPriority,
  type TriggerPayload,
  type QueuedNotification,
  NOTIFICATION_TEMPLATES,
  NOTIFICATION_CATEGORIES,
  getRandomDailyTip,
  getRandomQuote,
} from './notification-config';

/* ── Priority weight for sorting (lower = more urgent) ── */
const PRIORITY_WEIGHT: Record<NotificationPriority, number> = {
  emergency: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/* ═══════════════════════════════════════════════════════════════
   TRIGGER EVALUATION
   ═══════════════════════════════════════════════════════════════ */

/**
 * Check whether a notification type is allowed given current preferences & time.
 *
 * @param prefs   The household's notification preferences
 * @param type    The notification type to evaluate
 * @param now     Current datetime
 * @param hourlyCount  (optional) How many notifications have already been sent this hour
 */
export function evaluateTrigger(
  prefs: NotificationPrefs,
  type: NotificationType,
  now: Date,
  hourlyCount = 0,
): { allowed: boolean; reason?: string } {
  // 1. Check quiet hours (respect emergency overrides)
  if (type !== 'emergency' && isInQuietHours(prefs, now)) {
    return { allowed: false, reason: 'Heures calmes actives' };
  }

  // 2. Check max per hour (except emergency)
  if (type !== 'emergency' && hourlyCount >= prefs.maxPerHour) {
    return { allowed: false, reason: `Limite de ${prefs.maxPerHour} notifications/heure atteinte` };
  }

  // 3. Check if the type is enabled in preferences
  const enabled = isTypeEnabled(prefs, type);
  if (!enabled) {
    return { allowed: false, reason: `Notification "${type}" désactivée` };
  }

  return { allowed: true };
}

/* ── Helper: check if a type is toggled on in preferences ── */
function isTypeEnabled(prefs: NotificationPrefs, type: NotificationType): boolean {
  const category = getNotificationCategory(type);
  const categoryPrefs = prefs[category] as Record<string, boolean>;
  return categoryPrefs[type] === true;
}

/* ── Helper: reverse-lookup category from type ── */
function getNotificationCategory(type: NotificationType): NotificationCategory {
  for (const [cat, types] of Object.entries(NOTIFICATION_CATEGORIES)) {
    if ((types as readonly NotificationType[]).includes(type)) {
      return cat as NotificationCategory;
    }
  }
  // Fallback — should never happen with valid types
  return 'system';
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGE FORMATTING
   ═══════════════════════════════════════════════════════════════ */

/**
 * Build a human-readable French notification message.
 *
 * For `dailyTip` and `quote`, picks a random entry from the pool.
 * For all other types, replaces `{variable}` placeholders with payload values.
 */
export function formatMessage(type: NotificationType, data: TriggerPayload): string {
  // Handle special random types
  if (type === 'dailyTip') {
    return getRandomDailyTip();
  }

  if (type === 'quote') {
    const q = getRandomQuote();
    return `« ${q.text} » — ${q.author}`;
  }

  // Medication-specific messages with empathetic tone
  if (type === 'medication') {
    const medName = data.medicationName ?? data.eventTitle ?? 'votre traitement';
    const text = String(medName);
    const isConfirmation = data.isMedication === true || text.toLowerCase().includes('prendre');
    if (isConfirmation) {
      return `Rappel important : ${text}. N'oubliez pas ! Je peux noter si c'est fait.`;
    }
    return `Rappel médicament : ${text}.`;
  }

  // Air quality with contextual advice
  if (type === 'airQuality') {
    const aqiLevel = data.aqiLevel ?? 'indéterminé';
    const advice = data.airAdvice ?? 'Consultez les recommandations locales.';
    if (String(aqiLevel) === 'good' || String(aqiLevel) === 'bon') {
      return "La qualité de l'air est bonne aujourd'hui. Profitez de l'extérieur !";
    }
    return `Alerte qualité de l'air : Niveau ${aqiLevel}. ${advice}`;
  }

  // Emergency override — always urgent
  if (type === 'emergency') {
    const desc = data.emergencyDescription ?? 'Situation d\'urgence';
    return `ALERTE URGENCE : ${desc}. Contactez les secours si nécessaire.`;
  }

  // Checkout reminder with checklist
  if (type === 'checkout' || type === 'checkoutReminder') {
    const time = data.checkoutTime ?? 'bientôt';
    return `Votre départ est prévu à ${time}. Checklist : clés, fenêtres fermées, poubelles sorties, appareils éteints.`;
  }

  // Welcome guest with WiFi
  if (type === 'welcome') {
    const name = data.guestName ?? '';
    const wifi = data.wifiCode ?? 'affiché sur le routeur';
    return `Bienvenue ${name} ! Le code WiFi est ${wifi}. Je suis là pour vous aider.`;
  }

  const tmpl = NOTIFICATION_TEMPLATES[type];
  if (!tmpl) {
    return `Notification: ${type}`;
  }

  let result = tmpl.template;

  // Replace all {variable} placeholders with values from data
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      result = result.replaceAll(`{${key}}`, String(value));
    }
  }

  // Clean up unreplaced placeholders
  result = result.replaceAll(/\{[^}]+\}/g, '?');

  return result;
}

/* ═══════════════════════════════════════════════════════════════
   PRIORITY HELPERS
   ═══════════════════════════════════════════════════════════════ */

/** Look up priority from the template registry */
export function getPriority(type: NotificationType): NotificationPriority {
  return NOTIFICATION_TEMPLATES[type]?.priority ?? 'normal';
}

/* ═══════════════════════════════════════════════════════════════
   QUIET HOURS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Check if the current hour falls within quiet hours.
 *
 * Handles overnight ranges (e.g. start=22, end=7 means
 * quiet from 22:00 to 07:00).
 */
export function isInQuietHours(prefs: NotificationPrefs, now: Date): boolean {
  const { start, end, enabled } = prefs.quietHours;

  if (!enabled) return false;

  const hour = now.getHours();

  if (start <= end) {
    // Same-day range (e.g. 1:00–5:00)
    return hour >= start && hour < end;
  }

  // Overnight range (e.g. 22:00–7:00)
  return hour >= start || hour < end;
}

/* ═══════════════════════════════════════════════════════════════
   SORTING
   ═══════════════════════════════════════════════════════════════ */

/**
 * Sort two notifications by priority (emergency first, low last).
 * Compatible with Array.prototype.sort().
 */
export function sortNotificationsByPriority(
  a: QueuedNotification,
  b: QueuedNotification,
): number {
  const wa = PRIORITY_WEIGHT[a.priority] ?? 2;
  const wb = PRIORITY_WEIGHT[b.priority] ?? 2;
  return wa - wb;
}
