/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Notification Settings API (Session Auth)

   GET  → Return notificationPrefs + notificationLog (last 10)
   PUT  → Update notificationPrefs with deep merge + validation
   POST → Trigger test notification
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { db, parseJson } from '@/core/db';
import { requireHousehold } from '@/core/auth/guards';
import {
  type NotificationPrefs,
  type NotificationLogEntry,
  type NotificationType,
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_TEMPLATES,
  getRandomDailyTip,
  getRandomQuote,
} from '@/lib/notification-config';

/* ── Valid notification types ── */
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

/* ── Deep-merge partial prefs with defaults ── */
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

/* ── Validate notification prefs ── */
function validatePrefs(prefs: Partial<NotificationPrefs>): string[] {
  const errors: string[] = [];

  if (prefs.maxPerHour !== undefined && (prefs.maxPerHour < 1 || prefs.maxPerHour > 10)) {
    errors.push('maxPerHour doit être entre 1 et 10');
  }
  if (prefs.minIntervalMin !== undefined && (prefs.minIntervalMin < 1 || prefs.minIntervalMin > 60)) {
    errors.push('minIntervalMin doit être entre 1 et 60');
  }
  if (prefs.quietHours) {
    const qh = prefs.quietHours;
    if (qh.start !== undefined && (qh.start < 0 || qh.start > 23)) {
      errors.push('quietHours.start doit être entre 0 et 23');
    }
    if (qh.end !== undefined && (qh.end < 0 || qh.end > 23)) {
      errors.push('quietHours.end doit être entre 0 et 23');
    }
  }

  return errors;
}

/* ═══════════════════════════════════════════════════════
   GET — Fetch notification prefs + last 10 log entries
   ═══════════════════════════════════════════════════════ */
export async function GET() {
  try {
    const { householdId } = await requireHousehold();

    const household = await db.household.findUnique({
      where: { id: householdId },
      select: { notificationPrefs: true, notificationLog: true },
    });

    if (!household) {
      return NextResponse.json(
        { success: false, error: 'Foyer introuvable' },
        { status: 404 },
      );
    }

    const rawPrefs = household.notificationPrefs as Record<string, unknown> | null;
    const prefs = rawPrefs
      ? mergeWithDefaults(rawPrefs as Partial<NotificationPrefs>)
      : DEFAULT_NOTIFICATION_PREFS;

    const rawLog = parseJson<NotificationLogEntry[]>(
      household.notificationLog as string | null,
      [],
    );
    const log = rawLog.slice(-10);

    return NextResponse.json({ success: true, prefs, log });
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'NO_HOUSEHOLD')) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 },
      );
    }
    console.error('[NOTIFICATION SETTINGS] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}

/* ═══════════════════════════════════════════════════════
   PUT — Update notification prefs (deep merge)
   ═══════════════════════════════════════════════════════ */
export async function PUT(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();

    const body = await request.json();
    const updates = body.prefs as Partial<NotificationPrefs>;

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, error: 'prefs est requis' },
        { status: 400 },
      );
    }

    // Validate
    const errors = validatePrefs(updates);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join('. ') },
        { status: 400 },
      );
    }

    // Get current prefs and merge
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: { notificationPrefs: true },
    });

    const rawPrefs = household?.notificationPrefs as Record<string, unknown> | null;
    const current = rawPrefs
      ? mergeWithDefaults(rawPrefs as Partial<NotificationPrefs>)
      : DEFAULT_NOTIFICATION_PREFS;

    const merged = mergeWithDefaults({ ...current, ...updates });

    await db.household.update({
      where: { id: householdId },
      data: { notificationPrefs: merged },
    });

    return NextResponse.json({ success: true, prefs: merged });
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'NO_HOUSEHOLD')) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 },
      );
    }
    console.error('[NOTIFICATION SETTINGS] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}

/* ═══════════════════════════════════════════════════════
   POST — Trigger test notification
   ═══════════════════════════════════════════════════════ */
export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();

    const body = await request.json();
    const type = body.type as string;

    if (!type || !VALID_TYPES.has(type)) {
      return NextResponse.json(
        { success: false, error: `Type invalide: ${type ?? 'manquant'}` },
        { status: 400 },
      );
    }

    // Fetch current prefs
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: { notificationPrefs: true, notificationLog: true },
    });

    if (!household) {
      return NextResponse.json(
        { success: false, error: 'Foyer introuvable' },
        { status: 404 },
      );
    }

    const notifType = type as NotificationType;

    // Build message from template
    const template = NOTIFICATION_TEMPLATES[notifType];

    let message: string;
    if (notifType === 'dailyTip') {
      message = getRandomDailyTip();
    } else if (notifType === 'quote') {
      const q = getRandomQuote();
      message = `« ${q.text} » — ${q.author}`;
    } else {
      message = template?.template.replace(/\{[^}]+\}/g, '?') ?? `Notification test: ${type}`;
    }

    const priority = template?.priority ?? 'normal';

    // Append to notification log
    const rawLog = parseJson<NotificationLogEntry[]>(
      household.notificationLog as string | null,
      [],
    );
    const now = new Date().toISOString();

    rawLog.push({
      type: notifType,
      message,
      priority,
      createdAt: now,
      consumed: false,
      consumedAt: null,
    });

    const trimmed = rawLog.length > 10 ? rawLog.slice(-10) : rawLog;

    await db.household.update({
      where: { id: householdId },
      data: { notificationLog: trimmed },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'NO_HOUSEHOLD')) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 },
      );
    }
    console.error('[NOTIFICATION SETTINGS] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
