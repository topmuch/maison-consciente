'use server';

import { db } from '@/lib/db';

export interface ModuleConfig {
  roomService: { active: boolean; status: 'pending' | 'active' | 'inactive' };
  activities: { active: boolean; status: 'pending' | 'active' | 'inactive' };
  restaurants: { active: boolean; status: 'pending' | 'active' | 'inactive' };
  wellness: { active: boolean; status: 'pending' | 'active' | 'inactive' };
  premiumVoice: { active: boolean; status: 'pending' | 'active' | 'inactive' };
  advancedAnalytics: { active: boolean; status: 'pending' | 'active' | 'inactive' };
}

const DEFAULT_MODULES: ModuleConfig = {
  roomService: { active: false, status: 'inactive' },
  activities: { active: false, status: 'inactive' },
  restaurants: { active: false, status: 'inactive' },
  wellness: { active: false, status: 'inactive' },
  premiumVoice: { active: false, status: 'inactive' },
  advancedAnalytics: { active: false, status: 'inactive' },
};

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === 'object') return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

export async function getModulesConfig(householdId: string): Promise<ModuleConfig> {
  try {
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: { modulesConfig: true },
    });
    if (!household) return { ...DEFAULT_MODULES };
    return { ...DEFAULT_MODULES, ...safeJsonParse<Partial<ModuleConfig>>(household.modulesConfig, {}) };
  } catch {
    return { ...DEFAULT_MODULES };
  }
}

export async function toggleModule(
  householdId: string,
  moduleName: keyof ModuleConfig,
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getModulesConfig(householdId);
    const moduleConfig = current[moduleName];

    if (!moduleConfig) return { success: false, error: 'Module inconnu' };

    if (!moduleConfig.active) {
      // Activate module — set to pending (would need Stripe in production)
      moduleConfig.active = true;
      moduleConfig.status = 'active'; // Simulated activation
    } else {
      moduleConfig.active = false;
      moduleConfig.status = 'inactive';
    }

    await db.household.update({
      where: { id: householdId },
      data: { modulesConfig: current as any },
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function getSubscriptionStatus(householdId: string) {
  try {
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        stripeCustomerId: true,
      },
    });
    return household || { subscriptionPlan: 'free', subscriptionStatus: 'inactive', subscriptionEndsAt: null, stripeCustomerId: null };
  } catch {
    return { subscriptionPlan: 'free', subscriptionStatus: 'inactive', subscriptionEndsAt: null, stripeCustomerId: null };
  }
}
