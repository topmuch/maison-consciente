/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Subscription Status API
   
   GET /api/billing/status
   Returns the household's current subscription info + plan details.
   ═══════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { requireHousehold } from "@/core/auth/guards";
import { db } from "@/core/db";
import { PLANS } from "@/lib/stripe";
import { cache } from "@/lib/redis";

export async function GET() {
  try {
    /* ── Auth ── */
    const { householdId } = await requireHousehold();

    /* ── Get household (cached 60s) ── */
    const household = await cache(
      `billing:status:${householdId}`,
      60,
      () => db.household.findUnique({
        where: { id: householdId },
        select: {
          subscriptionPlan: true,
          subscriptionStatus: true,
          subscriptionEndsAt: true,
        },
      })
    );

    if (!household) {
      return NextResponse.json(
        { success: false, error: "Foyer introuvable" },
        { status: 404 }
      );
    }

    const planKey = household.subscriptionPlan as keyof typeof PLANS;
    const planDetails = PLANS[planKey] || PLANS.free;

    return NextResponse.json({
      success: true,
      subscription: {
        plan: household.subscriptionPlan,
        status: household.subscriptionStatus,
        endsAt: household.subscriptionEndsAt,
      },
      planDetails: {
        name: planDetails.name,
        price: planDetails.price,
        features: planDetails.features,
        limits: planDetails.limits,
        popular: "popular" in planDetails ? (planDetails.popular as boolean) : false,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "NO_HOUSEHOLD") {
      return NextResponse.json(
        { success: false, error: "Aucun foyer associé" },
        { status: 403 }
      );
    }
    console.error("[BILLING] Status error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du statut" },
      { status: 500 }
    );
  }
}
