/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Auth Guards
   Utility functions for route protection
   ═══════════════════════════════════════════════════════ */

import { getSession } from "@/core/auth/lucia";
import { db } from "@/core/db";
import type { UserRole, HouseholdType } from "@/core/types";

/**
 * Returns current authenticated user + session, or null
 */
export async function getAuthUser() {
  const { session, user } = await getSession();
  if (!session || !user) return null;
  return { session, user };
}

/**
 * Strips sensitive fields (inviteCode) from household settings
 */
export function sanitizeHouseholdSettings<T extends Record<string, unknown>>(settings: T): T {
  const { inviteCode, password, secret, ...safe } = settings;
  return safe as T;
}

/**
 * Requires authentication — throws if not logged in
 */
export async function requireAuth() {
  const auth = await getAuthUser();
  if (!auth) throw new Error("UNAUTHORIZED");
  return auth;
}

/**
 * Requires specific role(s) — throws if wrong role
 * Returns householdId for household isolation
 */
export async function requireRole(...roles: UserRole[]) {
  const auth = await requireAuth();
  if (!roles.includes(auth.user.role as UserRole)) {
    throw new Error("FORBIDDEN");
  }
  if (!auth.user.householdId) throw new Error("NO_HOUSEHOLD");
  return { ...auth, householdId: auth.user.householdId as string };
}

/**
 * Requires user to belong to a household
 * Returns householdId as non-null string
 */
export async function requireHousehold() {
  const auth = await requireAuth();
  if (!auth.user.householdId) throw new Error("NO_HOUSEHOLD");
  return { ...auth, householdId: auth.user.householdId as string };
}

/**
 * Requires the user's household to match a specific type(s)
 * Returns householdId as non-null string
 * Throws "FORBIDDEN_TYPE" if household type doesn't match
 */
export async function requireHouseholdType(...types: HouseholdType[]) {
  const authResult = await requireHousehold();
  const { householdId } = authResult;
  const household = await db.household.findUnique({
    where: { id: householdId },
    select: { type: true },
  });
  if (!household || !types.includes(household.type as HouseholdType)) {
    throw new Error("FORBIDDEN_TYPE");
  }
  return { ...authResult, householdId, householdType: household.type as HouseholdType };
}

/**
 * Gets the full user with household relation
 */
export async function getUserWithHousehold() {
  const { user } = await requireAuth();
  return db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      preferences: true,
      householdId: true,
      household: {
        select: {
          id: true,
          name: true,
          type: true,
          settings: true,
          modulesConfig: true,
          templateSlug: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          subscriptionEndsAt: true,
          seoTitle: true,
          seoDescription: true,
          seoOgImage: true,
          isQuietMode: true,
          _count: {
            select: { users: true, zones: true, messages: true },
          },
        },
      },
    },
  });
}
