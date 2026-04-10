/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Session / Me API Route
   
   Retourne l'utilisateur courant + informations du foyer.
   ═══════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { getUserWithHousehold, sanitizeHouseholdSettings } from "@/core/auth/guards";
import { parseJson } from "@/core/db";

export async function GET() {
  try {
    const userWithHousehold = await getUserWithHousehold();

    if (!userWithHousehold) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const household = userWithHousehold.household;

    return NextResponse.json({
      success: true,
      user: {
        id: userWithHousehold.id,
        email: userWithHousehold.email,
        name: userWithHousehold.name,
        role: userWithHousehold.role,
        avatar: userWithHousehold.avatar,
        preferences: parseJson(userWithHousehold.preferences, {}),
        householdId: userWithHousehold.householdId,
      },
      household: household
        ? {
            ...household,
            settings: sanitizeHouseholdSettings(
              parseJson<Record<string, unknown>>(household.settings, {})
            ),
            subscriptionPlan: household.subscriptionPlan ?? "free",
            subscriptionStatus: household.subscriptionStatus ?? "inactive",
            subscriptionEndsAt: household.subscriptionEndsAt ?? null,
          }
        : null,
      onboardingCompleted: !!household?.modulesConfig,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("[AUTH] Get current user error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
