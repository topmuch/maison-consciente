'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/server-auth';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Activity Server Actions

   CRUD + toggle for the Activity model (Conciergerie).
   Used by the Activities dashboard and public display.
   ═══════════════════════════════════════════════════════ */

// ─── Allowed Categories ─────────────────────────────────
const ACTIVITY_CATEGORIES = [
  'Culture',
  'Sport',
  'Nature',
  'Gastronomie',
  'Bien-être',
  'Shopping',
  'Transport',
  'Loisir',
] as const;

type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

// ─── Zod Schemas ────────────────────────────────────────
const createActivitySchema = z.object({
  householdId: z.string().uuid(),
  title: z.string().min(2, 'Le titre doit contenir au moins 2 caractères').max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  category: z.enum(ACTIVITY_CATEGORIES),
  description: z.string().max(2000, 'La description ne peut pas dépasser 2000 caractères').optional(),
  distance: z.string().max(100, 'La distance ne peut pas dépasser 100 caractères').optional(),
  link: z.string().url('URL invalide').optional().or(z.literal('')),
  isPartner: z.boolean().optional(),
  whatsappNumber: z.string().max(30, 'Le numéro WhatsApp ne peut pas dépasser 30 caractères').optional(),
  image: z.string().max(5000, 'L\'image ne peut pas dépasser 5000 caractères').optional(),
  priceHint: z.string().max(100, 'L\'indice de prix ne peut pas dépasser 100 caractères').optional(),
  hoursHint: z.string().max(100, 'L\'indice d\'heures ne peut pas dépasser 100 caractères').optional(),
  address: z.string().max(300, 'L\'adresse ne peut pas dépasser 300 caractères').optional(),
});

const updateActivitySchema = z.object({
  title: z.string().min(2).max(100).optional(),
  category: z.enum(ACTIVITY_CATEGORIES).optional(),
  description: z.string().max(2000).optional(),
  distance: z.string().max(100).optional(),
  link: z.string().url().optional().or(z.literal('')),
  isPartner: z.boolean().optional(),
  whatsappNumber: z.string().max(30).optional(),
  image: z.string().max(5000).optional(),
  priceHint: z.string().max(100).optional(),
  hoursHint: z.string().max(100).optional(),
  address: z.string().max(300).optional(),
});

// ─── Exported Type ──────────────────────────────────────
export type ActivityItem = {
  id: string;
  householdId: string;
  title: string;
  category: ActivityCategory;
  description: string | null;
  distance: string | null;
  link: string | null;
  isPartner: boolean;
  whatsappNumber: string | null;
  image: string | null;
  priceHint: string | null;
  hoursHint: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Helper: serialize Activity to JSON-safe type ───────
function serializeActivity(a: {
  id: string;
  householdId: string;
  title: string;
  category: string;
  description: string | null;
  distance: string | null;
  link: string | null;
  isPartner: boolean;
  whatsappNumber: string | null;
  image: string | null;
  priceHint: string | null;
  hoursHint: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ActivityItem {
  return {
    id: a.id,
    householdId: a.householdId,
    title: a.title,
    category: a.category as ActivityCategory,
    description: a.description,
    distance: a.distance,
    link: a.link,
    isPartner: a.isPartner,
    whatsappNumber: a.whatsappNumber,
    image: a.image,
    priceHint: a.priceHint,
    hoursHint: a.hoursHint,
    address: a.address,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

// ─── Response Types ─────────────────────────────────────
type SuccessResponse = { success: true; activities: ActivityItem[] };
type ErrorResponse = { success: false; error: string };
type SingleSuccessResponse = { success: true; activity: ActivityItem };
type MutateResponse = { success: true } | { success: false; error: string };

/* ═══════════════════════════════════════════════════════
   1. getActivities — Public (token-based)
   ═══════════════════════════════════════════════════════ */
export async function getActivities(
  token: string,
  category?: string,
): Promise<SuccessResponse | ErrorResponse> {
  try {
    if (!token) {
      return { success: false, error: 'Token requis' };
    }

    const household = await prisma.household.findUnique({
      where: { displayToken: token },
      select: { id: true, displayEnabled: true },
    });

    if (!household) {
      return { success: false, error: 'Foyer non trouvé' };
    }

    if (!household.displayEnabled) {
      return { success: false, error: 'Affichage désactivé pour ce foyer' };
    }

    const where: Record<string, unknown> = {
      householdId: household.id,
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: [
        { isPartner: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return { success: true, activities: activities.map(serializeActivity) };
  } catch (error) {
    console.error('[activity-actions] getActivities error:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

/* ═══════════════════════════════════════════════════════
   2. getActivitiesDashboard — Dashboard (householdId-based)
   ═══════════════════════════════════════════════════════ */
export async function getActivitiesDashboard(
  householdId: string,
  category?: string,
): Promise<SuccessResponse | ErrorResponse> {
  try {
    const auth = await getAuthUser();
    if (!householdId) {
      return { success: false, error: 'householdId requis' };
    }
    if (householdId !== auth.householdId) {
      return { success: false, error: 'Foyer invalide' };
    }

    const where: Record<string, unknown> = { householdId };

    if (category && category !== 'all') {
      where.category = category;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: [
        { isPartner: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return { success: true, activities: activities.map(serializeActivity) };
  } catch (error) {
    console.error('[activity-actions] getActivitiesDashboard error:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

/* ═══════════════════════════════════════════════════════
   3. createActivity
   ═══════════════════════════════════════════════════════ */
export async function createActivity(
  data: {
    householdId: string;
    title: string;
    category: string;
    description?: string;
    distance?: string;
    link?: string;
    isPartner?: boolean;
    whatsappNumber?: string;
    image?: string;
    priceHint?: string;
    hoursHint?: string;
    address?: string;
  },
): Promise<SingleSuccessResponse | ErrorResponse> {
  try {
    const auth = await getAuthUser();
    const parsed = createActivitySchema.safeParse(data);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Données invalides';
      return { success: false, error: firstError };
    }

    if (parsed.data.householdId !== auth.householdId) {
      return { success: false, error: 'Foyer invalide' };
    }

    const activity = await prisma.activity.create({
      data: {
        householdId: parsed.data.householdId,
        title: parsed.data.title,
        category: parsed.data.category,
        description: parsed.data.description ?? null,
        distance: parsed.data.distance ?? null,
        link: parsed.data.link && parsed.data.link !== '' ? parsed.data.link : null,
        isPartner: parsed.data.isPartner ?? false,
        whatsappNumber: parsed.data.whatsappNumber ?? null,
        image: parsed.data.image ?? null,
        priceHint: parsed.data.priceHint ?? null,
        hoursHint: parsed.data.hoursHint ?? null,
        address: parsed.data.address ?? null,
      },
    });

    return { success: true, activity: serializeActivity(activity) };
  } catch (error) {
    console.error('[activity-actions] createActivity error:', error);
    return { success: false, error: 'Erreur lors de la création de l\'activité' };
  }
}

/* ═══════════════════════════════════════════════════════
   4. updateActivity
   ═══════════════════════════════════════════════════════ */
export async function updateActivity(
  id: string,
  data: Partial<{
    title: string;
    category: string;
    description: string;
    distance: string;
    link: string;
    isPartner: boolean;
    whatsappNumber: string;
    image: string;
    priceHint: string;
    hoursHint: string;
    address: string;
  }>,
): Promise<MutateResponse> {
  try {
    const auth = await getAuthUser();
    if (!id) {
      return { success: false, error: 'ID requis' };
    }

    // Verify household ownership
    const existing = await prisma.activity.findUnique({
      where: { id },
      select: { householdId: true },
    });
    if (!existing || existing.householdId !== auth.householdId) {
      return { success: false, error: 'Activité non trouvée ou accès refusé' };
    }

    const parsed = updateActivitySchema.safeParse(data);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Données invalides';
      return { success: false, error: firstError };
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.distance !== undefined) updateData.distance = parsed.data.distance;
    if (parsed.data.link !== undefined) updateData.link = parsed.data.link === '' ? null : parsed.data.link;
    if (parsed.data.isPartner !== undefined) updateData.isPartner = parsed.data.isPartner;
    if (parsed.data.whatsappNumber !== undefined) updateData.whatsappNumber = parsed.data.whatsappNumber;
    if (parsed.data.image !== undefined) updateData.image = parsed.data.image;
    if (parsed.data.priceHint !== undefined) updateData.priceHint = parsed.data.priceHint;
    if (parsed.data.hoursHint !== undefined) updateData.hoursHint = parsed.data.hoursHint;
    if (parsed.data.address !== undefined) updateData.address = parsed.data.address;

    await prisma.activity.update({
      where: { id },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error('[activity-actions] updateActivity error:', error);
    return { success: false, error: 'Erreur lors de la mise à jour' };
  }
}

/* ═══════════════════════════════════════════════════════
   5. deleteActivity
   ═══════════════════════════════════════════════════════ */
export async function deleteActivity(
  id: string,
): Promise<MutateResponse> {
  try {
    const auth = await getAuthUser();
    if (!id) {
      return { success: false, error: 'ID requis' };
    }

    // Verify household ownership
    const existing = await prisma.activity.findUnique({
      where: { id },
      select: { householdId: true },
    });
    if (!existing || existing.householdId !== auth.householdId) {
      return { success: false, error: 'Activité non trouvée ou accès refusé' };
    }

    await prisma.activity.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error('[activity-actions] deleteActivity error:', error);
    return { success: false, error: 'Erreur lors de la suppression' };
  }
}

/* ═══════════════════════════════════════════════════════
   6. togglePartnerStatus
   ═══════════════════════════════════════════════════════ */
export async function togglePartnerStatus(
  id: string,
): Promise<MutateResponse> {
  try {
    const auth = await getAuthUser();
    if (!id) {
      return { success: false, error: 'ID requis' };
    }

    // Verify household ownership
    const activity = await prisma.activity.findUnique({
      where: { id },
      select: { isPartner: true, householdId: true },
    });

    if (!activity || activity.householdId !== auth.householdId) {
      return { success: false, error: 'Activité non trouvée ou accès refusé' };
    }

    await prisma.activity.update({
      where: { id },
      data: { isPartner: !activity.isPartner },
    });

    return { success: true };
  } catch (error) {
    console.error('[activity-actions] togglePartnerStatus error:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}
