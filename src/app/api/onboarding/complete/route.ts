/* ═══════════════════════════════════════════════════════
   MAELLIS — Onboarding Complete API Route

   Completes the advanced 6-step onboarding wizard:
   - Updates household name, type, templateSlug
   - Stores selected modules in modulesConfig
   - Stores push preferences in notificationPrefs
   - Stores assistant name in voiceSettings
   - Returns success with household details
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOptionalAuthUser } from '@/lib/server-auth';
import { DEFAULT_NOTIFICATION_PREFS } from '@/lib/notification-config';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const auth = await getOptionalAuthUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      householdId,
      householdName,
      householdType,
      selectedModules,
      pushEnabled,
      quietHoursEnabled,
      templateSlug,
      assistantName,
    } = body as {
      householdId?: string;
      householdName?: string;
      householdType?: 'home' | 'hospitality';
      selectedModules?: string[];
      pushEnabled?: boolean;
      quietHoursEnabled?: boolean;
      templateSlug?: string;
      assistantName?: string;
    };

    // Validate householdId matches the authenticated user
    if (!householdId || householdId !== auth.householdId) {
      return NextResponse.json(
        { success: false, error: 'Foyer invalide' },
        { status: 403 }
      );
    }

    // ── Build modulesConfig ──
    const modulesConfig: Record<string, { active: boolean; status: string }> = {};
    if (Array.isArray(selectedModules) && selectedModules.length > 0) {
      for (const modId of selectedModules) {
        modulesConfig[modId] = { active: true, status: 'active' };
      }
    }

    // ── Build notificationPrefs ──
    const notificationPrefs = {
      ...DEFAULT_NOTIFICATION_PREFS,
      quietHours: {
        ...DEFAULT_NOTIFICATION_PREFS.quietHours,
        enabled: quietHoursEnabled ?? DEFAULT_NOTIFICATION_PREFS.quietHours.enabled,
      },
      pushEnabled: pushEnabled ?? false,
    };

    // ── Build voiceSettings ──
    const voiceSettings = {
      enabled: true,
      rate: 1.0,
      volume: 0.8,
      language: 'fr-FR',
      conversationWindow: 10,
      assistantName: assistantName || 'Maellis',
    };

    // ── Update household ──
    const updatedHousehold = await prisma.household.update({
      where: { id: householdId },
      data: {
        ...(householdName?.trim() ? { name: householdName.trim() } : {}),
        ...(householdType ? { type: householdType } : {}),
        ...(templateSlug ? { templateSlug } : {}),
        ...(Object.keys(modulesConfig).length > 0
          ? { modulesConfig }
          : {}),
        notificationPrefs: notificationPrefs as unknown as Record<string, unknown>,
        voiceSettings: voiceSettings as unknown as Record<string, unknown>,
      },
    });

    return NextResponse.json({
      success: true,
      household: {
        id: updatedHousehold.id,
        name: updatedHousehold.name,
        type: updatedHousehold.type,
        templateSlug: updatedHousehold.templateSlug,
      },
    });
  } catch (error) {
    console.error('[ONBOARDING] Complete error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
