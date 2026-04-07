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
      household: userWithHousehold.household
        ? {
            ...userWithHousehold.household,
            settings: sanitizeHouseholdSettings(
              parseJson<Record<string, unknown>>(userWithHousehold.household.settings, {})
            ),
            subscriptionPlan: userWithHousehold.household.subscriptionPlan ?? "free",
            subscriptionStatus: userWithHousehold.household.subscriptionStatus ?? "inactive",
            subscriptionEndsAt: userWithHousehold.household.subscriptionEndsAt ?? null,
          }
        : null,
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
