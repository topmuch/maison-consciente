'use server';

import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/server-auth';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Health Server Actions
   
   CRUD operations for medication reminders.
   ═══════════════════════════════════════════════════════ */

export async function getReminders(
  type?: string,
  householdId?: string,
): Promise<ReminderRecord[]> {
  try {
    const auth = await getAuthUser();
    if (householdId && householdId !== auth.householdId) {
      return [];
    }
    const effectiveHouseholdId = auth.householdId;

    const where: Record<string, unknown> = {};
    if (type && type !== 'all') {
      where.type = type;
    }
    if (effectiveHouseholdId) {
      where.householdId = effectiveHouseholdId;
    }

    const reminders = await db.reminder.findMany({
      where,
      orderBy: { triggerAt: 'asc' },
      take: 100,
    });

    return reminders.map((r) => ({
      id: r.id,
      text: r.text,
      triggerAt: r.triggerAt.toISOString(),
      type: r.type,
      isRecurring: r.isRecurring,
      recurrenceRule: r.recurrenceRule,
      notified: r.notified,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function createReminder(input: {
  text: string;
  triggerAt: string;
  type?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  householdId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthUser();
    if (!input.text || !input.triggerAt) {
      return { success: false, error: 'Champs requis manquants' };
    }

    const triggerDate = new Date(input.triggerAt);
    if (isNaN(triggerDate.getTime())) {
      return { success: false, error: 'Date invalide' };
    }

    const householdId = auth.householdId;
    if (!householdId) {
      return { success: false, error: 'Aucun foyer trouvé' };
    }

    await db.reminder.create({
      data: {
        householdId,
        text: input.text,
        triggerAt: triggerDate,
        type: (input.type as 'general' | 'medication' | 'birthday' | 'appointment') || 'general',
        isRecurring: input.isRecurring ?? false,
        recurrenceRule: input.recurrenceRule ?? null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[health-actions] createReminder error:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function updateReminder(
  id: string,
  updates: {
    text?: string;
    triggerAt?: string;
    type?: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthUser();
    if (!id) {
      return { success: false, error: 'ID requis' };
    }

    const data: Record<string, unknown> = {};
    if (updates.text !== undefined) data.text = updates.text;
    if (updates.triggerAt !== undefined) {
      const d = new Date(updates.triggerAt);
      if (isNaN(d.getTime())) return { success: false, error: 'Date invalide' };
      data.triggerAt = d;
    }
    if (updates.type !== undefined) data.type = updates.type;
    if (updates.isRecurring !== undefined) data.isRecurring = updates.isRecurring;
    if (updates.recurrenceRule !== undefined) data.recurrenceRule = updates.recurrenceRule;

    await db.reminder.update({
      where: { id },
      data,
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function deleteReminder(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthUser();
    if (!id) {
      return { success: false, error: 'ID requis' };
    }

    await db.reminder.delete({
      where: { id },
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function toggleReminderNotified(
  id: string,
): Promise<{ success: boolean }> {
  try {
    const auth = await getAuthUser();
    const reminder = await db.reminder.findUnique({
      where: { id },
      select: { notified: true },
    });

    if (!reminder) return { success: false };

    await db.reminder.update({
      where: { id },
      data: { notified: !reminder.notified },
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}

/* ── Type ── */
interface ReminderRecord {
  id: string;
  text: string;
  triggerAt: string;
  type: string;
  isRecurring: boolean;
  recurrenceRule: string | null;
  notified: boolean;
  createdAt: string;
}
