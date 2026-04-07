'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getAuthUser } from '@/lib/server-auth';

const eventIdSchema = z.string().uuid('ID d\'événement invalide (format UUID requis)');

const addEventSchema = z.object({
  title: z.string().min(1).max(100),
  date: z.string(),
  type: z.enum(['birthday', 'holiday', 'reminder', 'checkout']).default('reminder'),
  recurring: z.boolean().optional(),
});

export async function getCalendarEvents() {
  try {
    const auth = await getAuthUser();
    if (!auth?.householdId) return [];
    return await db.calendarEvent.findMany({
      where: { householdId: auth.householdId },
      orderBy: { date: 'asc' },
    });
  } catch (error) {
    console.error('[getCalendarEvents]', error);
    return [];
  }
}

export async function addCalendarEvent(data: Record<string, unknown>) {
  try {
    const auth = await getAuthUser();
    if (!auth?.householdId) return { success: false, error: 'Non authentifié' };

    const parsed = addEventSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: 'Données invalides' };

    await db.calendarEvent.create({
      data: {
        householdId: auth.householdId,
        title: parsed.data.title,
        date: parsed.data.date,
        type: parsed.data.type,
        recurring: parsed.data.recurring ?? false,
      },
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[addCalendarEvent]', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function deleteCalendarEvent(eventId: string) {
  try {
    const auth = await getAuthUser();
    if (!auth?.householdId) return { success: false, error: 'Non authentifié' };

    const parsedId = eventIdSchema.safeParse(eventId);
    if (!parsedId.success) return { success: false, error: parsedId.error.issues[0]?.message ?? 'ID invalide' };

    const event = await db.calendarEvent.findFirst({
      where: { id: parsedId.data, householdId: auth.householdId },
    });
    if (!event) return { success: false, error: 'Non trouvé' };

    await db.calendarEvent.delete({ where: { id: parsedId.data } });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[deleteCalendarEvent]', error);
    return { success: false, error: 'Erreur serveur' };
  }
}
