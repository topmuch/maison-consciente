'use server';

import { db } from '@/lib/db';
import { getAuthUser, getOptionalAuthUser } from '@/lib/server-auth';

export interface ModuleConfig {
  roomService: { active: boolean; status: 'pending' | 'active' | 'inactive' };
  activities: { active: boolean; status: 'pending' | 'active' | 'inactive' };
  restaurants: { active: boolean; status: 'pending' | 'active' | 'inactive' };
  wellness: { active: boolean; status: 'pending' | 'active' | 'inactive' };
  premiumVoice: { active: boolean; status: 'pending' | 'active' | 'inactive' };
  advancedAnalytics: { active: boolean; status: 'pending' | 'active' | 'inactive' };
  safeDeparture: { active: boolean; status: 'pending' | 'active' | 'inactive' };
  dailyConcierge: { active: boolean; status: 'pending' | 'active' | 'inactive' };
}

const DEFAULT_MODULES: ModuleConfig = {
  roomService: { active: false, status: 'inactive' },
  activities: { active: false, status: 'inactive' },
  restaurants: { active: false, status: 'inactive' },
  wellness: { active: false, status: 'inactive' },
  premiumVoice: { active: false, status: 'inactive' },
  advancedAnalytics: { active: false, status: 'inactive' },
  safeDeparture: { active: false, status: 'inactive' },
  dailyConcierge: { active: false, status: 'inactive' },
};

/* ═══ MODULES METADATA — Pricing & Descriptions ═══ */

export interface ModuleMeta {
  key: keyof ModuleConfig;
  label: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  icon: string;
  category: 'hospitality' | 'voice' | 'content' | 'analytics' | 'comfort';
  features: string[];
}

export const MODULES_CATALOG: ModuleMeta[] = [
  {
    key: 'safeDeparture',
    label: 'Safe Departure & Security',
    description: 'Check-out intelligent + sauvetage de réputation. Appel vocal automatique le jour du départ pour détecter l\'insatisfaction et alerter l\'hôte immédiatement.',
    priceMonthly: 6.9,
    priceYearly: 69,
    icon: 'Shield',
    category: 'hospitality',
    features: [
      'Appel vocal Retell AI le jour du départ',
      'Détection d\'insatisfaction en temps réel',
      'Alerte immédiate à l\'hôte',
      'Rapport IA de fin de séjour',
      'Génération d\'avis public positif',
    ],
  },
  {
    key: 'dailyConcierge',
    label: 'Daily Concierge & Care',
    description: 'Audit quotidien à 22h + résolution proactive. Vérification vocale chaque soir pour anticiper les problèmes avant qu\'ils ne deviennent des avis négatifs.',
    priceMonthly: 9.9,
    priceYearly: 99,
    icon: 'ClipboardCheck',
    category: 'hospitality',
    features: [
      'Audit quotidien automatique à 22h',
      'Appel vocal respectueux (demande permission)',
      'Analyse sentiment Gemini 2.0 Flash',
      'Alerte hôte si score < 4/5',
      'Rapport StayReview complet',
      'Dashboard analytics temps réel',
    ],
  },
  {
    key: 'roomService',
    label: 'Room Service Digital',
    description: 'Menu interactif avec commande en chambre.',
    priceMonthly: 4.9,
    priceYearly: 49,
    icon: 'UtensilsCrossed',
    category: 'hospitality',
    features: ['Menu digital interactif', 'Commande en chambre', 'Suivi en temps réel'],
  },
  {
    key: 'activities',
    label: 'Guide Local & Activités',
    description: 'Recommandations personnalisées et réservation.',
    priceMonthly: 3.9,
    priceYearly: 39,
    icon: 'MapPin',
    category: 'content',
    features: ['Points d\'intérêt', 'Réservation partenaires', 'Itinéraires personnalisés'],
  },
  {
    key: 'restaurants',
    label: 'Restaurants & Gastronomie',
    description: 'Guide gastronomique avec recommandations IA.',
    priceMonthly: 2.9,
    priceYearly: 29,
    icon: 'Wine',
    category: 'content',
    features: ['Recommandations IA', 'Réservation intégrée', 'Avis vérifiés'],
  },
  {
    key: 'wellness',
    label: 'Bien-être & Santé',
    description: 'Rituels bien-être, méditation et suivi santé.',
    priceMonthly: 3.9,
    priceYearly: 39,
    icon: 'Heart',
    category: 'comfort',
    features: ['Rituels personnalisés', 'Suivi humeur', 'Exercices guidés'],
  },
  {
    key: 'premiumVoice',
    label: 'Assistant Vocal Premium',
    description: 'Reconnaissance vocale avancée avec Gemini.',
    priceMonthly: 7.9,
    priceYearly: 79,
    icon: 'Mic',
    category: 'voice',
    features: ['28 intents vocaux', 'Reconnaissance IA Gemini', 'Multi-langue'],
  },
  {
    key: 'advancedAnalytics',
    label: 'Analytics & Insights',
    description: 'Tableau de bord analytique avancé.',
    priceMonthly: 5.9,
    priceYearly: 59,
    icon: 'BarChart3',
    category: 'analytics',
    features: ['KPI temps réel', 'Radar catégories', 'Export CSV'],
  },
];

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === 'object') return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

export async function getModulesConfig(householdId: string): Promise<ModuleConfig> {
  try {
    const auth = await getOptionalAuthUser();
    if (auth && householdId !== auth.householdId) {
      return { ...DEFAULT_MODULES };
    }
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
    const auth = await getAuthUser();
    if (householdId !== auth.householdId) {
      return { success: false, error: 'Foyer invalide' };
    }
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
    const auth = await getOptionalAuthUser();
    if (auth && householdId !== auth.householdId) {
      return { subscriptionPlan: 'free', subscriptionStatus: 'inactive', subscriptionEndsAt: null, stripeCustomerId: null };
    }
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
