'use client';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Unified Household Features Hook

   Conditionally exposes features based on householdType.
   Home features: mood tracking, rituals, groceries, zones, recipes
   Hospitality features: guide, check-in, i18n, guest access
   ═══════════════════════════════════════════════════════ */

import { useAuthStore } from '@/store/auth-store';

interface HouseholdFeatures {
  // Mode flags
  isHome: boolean;
  isHospitality: boolean;
  householdType: 'home' | 'hospitality';

  // Available feature flags (for conditional rendering)
  features: {
    zones: boolean;
    recipes: boolean;
    scan: boolean;
    messages: boolean;
    mood: boolean;
    rituals: boolean;
    groceries: boolean;
    localGuide: boolean;
    guestCheckIn: boolean;
    guestAccess: boolean;
    i18n: boolean;
    settings: boolean;
    admin: boolean;
    interactions: boolean;
  };
}

export function useHouseholdFeatures(): HouseholdFeatures {
  const { householdType, user } = useAuthStore();
  const isHome = householdType === 'home';
  const isHospitality = householdType === 'hospitality';
  const isAdmin = user?.role === 'superadmin';

  return {
    isHome,
    isHospitality,
    householdType,

    features: {
      // Shared features (both modes)
      scan: true,
      messages: true,
      settings: true,
      interactions: true,

      // Home-only features
      zones: isHome,
      recipes: isHome,
      mood: isHome,
      rituals: isHome,
      groceries: isHome,

      // Hospitality-only features
      localGuide: isHospitality,
      guestCheckIn: isHospitality,
      guestAccess: isHospitality,
      i18n: isHospitality,

      // Admin (superadmin only)
      admin: isAdmin,
    },
  };
}
