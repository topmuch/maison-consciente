'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/server-auth';

const themeConfigSchema = z.object({
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  bgUrl: z.string().url().optional().or(z.literal('')),
});

export async function getTabletTheme() {
  try {
    const auth = await getAuthUser();
    if (!auth?.householdId) return { accent: '#fbbf24', bgUrl: '' };

    const household = await db.household.findUnique({
      where: { id: auth.householdId },
      select: { settings: true },
    });
    const settings = typeof household?.settings === 'string'
      ? JSON.parse(household.settings)
      : (household?.settings ?? {});
    return settings.tabletTheme ?? { accent: '#fbbf24', bgUrl: '' };
  } catch (error) {
    console.error('[getTabletTheme]', error);
    return { accent: '#fbbf24', bgUrl: '' };
  }
}

export async function updateTabletTheme(config: Record<string, unknown>) {
  try {
    const auth = await getAuthUser();
    if (!auth?.householdId) return { success: false, error: 'Non authentifié' };

    const parsed = themeConfigSchema.safeParse(config);
    if (!parsed.success) return { success: false, error: 'Configuration invalide' };

    const household = await db.household.findUnique({
      where: { id: auth.householdId },
      select: { settings: true },
    });
    const settings = typeof household?.settings === 'string'
      ? JSON.parse(household.settings)
      : (household?.settings ?? {});
    settings.tabletTheme = parsed.data;

    await db.household.update({
      where: { id: auth.householdId },
      data: { settings: JSON.stringify(settings) },
    });
    return { success: true };
  } catch (error) {
    console.error('[updateTabletTheme]', error);
    return { success: false, error: 'Erreur serveur' };
  }
}
