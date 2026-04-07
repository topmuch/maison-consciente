/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Stripe Checkout API
   
   POST /api/billing/checkout
   Creates a Stripe Checkout session for subscription.
   ═══════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { requireHousehold } from "@/core/auth/guards";
import { db } from "@/core/db";
import { stripe, PRICE_MAP, isBillingEnabled } from "@/lib/stripe";
import { checkoutSchema } from "@/core/validations/schemas";

export async function POST(request: Request) {
  try {
    /* ── Auth ── */
    const { user, householdId } = await requireHousehold();

    /* ── Billing availability ── */
    if (!isBillingEnabled) {
      return NextResponse.json(
        { success: false, error: "La fonctionnalité de facturation n'est pas disponible" },
        { status: 503 }
      );
    }

    /* ── Validate body ── */
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Plan invalide", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { plan } = parsed.data;
    const priceId = PRICE_MAP[plan];
    if (!priceId || priceId.includes("placeholder")) {
      return NextResponse.json(
        { success: false, error: "Plan non configuré" },
        { status: 400 }
      );
    }

    /* ── Get household ── */
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: { stripeCustomerId: true, name: true },
    });

    if (!household) {
      return NextResponse.json(
        { success: false, error: "Foyer introuvable" },
        { status: 404 }
      );
    }

    /* ── Create or reuse Stripe customer ── */
    let customerId = household.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: { householdId },
      });
      customerId = customer.id;

      await db.household.update({
        where: { id: householdId },
        data: { stripeCustomerId: customerId },
      });
    }

    /* ── Create Checkout session ── */
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?checkout=canceled`,
      metadata: { householdId, plan },
      subscription_data: {
        metadata: { householdId, plan },
      },
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
    console.error("[BILLING] Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}
