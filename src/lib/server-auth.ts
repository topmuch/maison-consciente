/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Server Auth Helper
   
   Évite de répéter la logique de session dans les Server Actions
   et les API Routes. Usage exclusif côté serveur (Node.js runtime).
   
   Supports 3 session sources:
   1. Cookie (mc-session) — standard browser cookie
   2. x-session-id header — fallback for iframe/proxy contexts
   3. URL query param (?s=) — handled by middleware (sets cookie)
   ═══════════════════════════════════════════════════════ */

import { cookies, headers } from "next/headers";
import { auth } from "@/core/auth/lucia";
import { db } from "@/core/db";

/**
 * Récupère le sessionId depuis cookie ou x-session-id header.
 */
async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(auth.sessionCookieName)?.value;
  if (sessionId) return sessionId;

  // Fallback: check x-session-id header (for iframe/proxy contexts where cookies are blocked)
  try {
    const headersList = await headers();
    return headersList.get("x-session-id") || null;
  } catch {
    return null;
  }
}

/**
 * Récupère l'utilisateur authentifié côté serveur.
 * Lance une erreur si non connecté ou sans foyer.
 */
export async function getAuthUser() {
  const sessionId = await getSessionId();

  if (!sessionId) {
    throw new Error("UNAUTHORIZED");
  }

  const { user, session } = await auth.validateSession(sessionId);

  if (!session || !user) {
    throw new Error("UNAUTHORIZED");
  }

  if (!user.householdId) {
    throw new Error("NO_HOUSEHOLD");
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      householdId: user.householdId,
    },
    session,
    householdId: user.householdId,
  };
}

/**
 * Récupère l'utilisateur authentifié (optionnel).
 * Retourne null si non connecté — utile pour les scans anonymes.
 */
export async function getOptionalAuthUser() {
  try {
    const sessionId = await getSessionId();
    if (!sessionId) return null;

    const { user, session } = await auth.validateSession(sessionId);
    if (!session || !user) return null;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        householdId: user.householdId,
      },
      session,
      householdId: user.householdId,
    };
  } catch {
    return null;
  }
}
