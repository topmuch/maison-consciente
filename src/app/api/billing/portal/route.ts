/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Stripe Billing Portal API
   
   POST /api/billing/portal
   Creates a Stripe Customer Portal session.
   ═══════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { requireHousehold } from "@/core/auth/guards";
import { db } from "@/core/db";
import { stripe, isBillingEnabled } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    /* ── Auth ── */
    const { householdId } = await requireHousehold();

    /* ── Billing availability ── */
    if (!isBillingEnabled) {
      return NextResponse.json(
        { success: false, error: "La fonctionnalité de facturation n'est pas disponible" },
        { status: 503 }
      );
    }

    /* ── Get household ── */
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: { stripeCustomerId: true },
    });

    if (!household?.stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: "Aucun client Stripe associé à ce foyer" },
        { status: 400 }
      );
    }

    /* ── Create Portal session ── */
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: household.stripeCustomerId,
      return_url: `${origin}?billing=portal`,
    });

    return NextResponse.json({ success: true, url: session.url });
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
    console.error("[BILLING] Portal error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création du portail de facturation" },
      { status: 500 }
    );
  }
}
