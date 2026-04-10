/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Stripe Webhook Handler
   
   POST /api/webhooks/stripe
   Handles Stripe webhook events for subscription lifecycle.
   
   This route is PUBLIC — called by Stripe, not the user.
   ═══════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/core/db";
import type Stripe from "stripe";
import { sendPaymentFailedAlert, sendSubscriptionChangedEmail } from "@/lib/email-service";
import { logActionSync } from "@/lib/audit";

export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

if (!webhookSecret && process.env.NODE_ENV === "production") {
  console.error('STRIPE_WEBHOOK_SECRET is required in production');
}

export async function POST(request: Request) {
  try {
    /* ── Read raw body ── */
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !webhookSecret) {
      console.error("[WEBHOOK] Missing stripe-signature or STRIPE_WEBHOOK_SECRET");
      return NextResponse.json(
        { error: "Signature manquante" },
        { status: 400 }
      );
    }

    /* ── Verify signature ── */
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[WEBHOOK] Signature verification failed:", err);
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 400 }
      );
    }

    /* ── Handle events ── */
    switch (event.type) {
      /* ── Checkout completed → activate subscription ── */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const householdId = session.metadata?.householdId;
        const plan = session.metadata?.plan;

        if (householdId && plan) {
          await db.household.update({
            where: { id: householdId },
            data: {
              stripeCustomerId: session.customer as string,
              subscriptionPlan: plan,
              subscriptionStatus: "active",
            },
          });
          console.log(`[WEBHOOK] Checkout completed for household ${householdId}, plan: ${plan}`);
        }
        break;
      }

      /* ── Subscription updated → sync status & period end ── */
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const householdId = subscription.metadata?.householdId;

        if (householdId) {
          const status = subscription.status; // "active" | "trialing" | "past_due" | "canceled" | "unpaid"
          // In newer Stripe API versions, current_period_end is on SubscriptionItem
          let endsAt: Date | null = null;
          const firstItem = subscription.items?.data?.[0];
          if (firstItem && "current_period_end" in firstItem) {
            endsAt = new Date((firstItem as unknown as { current_period_end: number }).current_period_end * 1000);
          }

          await db.household.update({
            where: { id: householdId },
            data: {
              subscriptionStatus: status,
              subscriptionEndsAt: endsAt,
            },
          });
          console.log(`[WEBHOOK] Subscription updated for household ${householdId}, status: ${status}`);

          /* ── Send email notification for status changes ── */
          try {
            const household = await db.household.findUnique({
              where: { id: householdId },
              select: { contactEmail: true, name: true },
            });
            if (household?.contactEmail && (status === "active" || status === "canceled" || status === "past_due")) {
              const planLabel = subscription.metadata?.plan || status;
              await sendSubscriptionChangedEmail(household.contactEmail, {
                userName: household.name || "Utilisateur",
                newPlan: planLabel as string,
                effectiveDate: new Date().toLocaleDateString("fr-FR"),
              }).catch(() => {});
            }
          } catch (emailErr) {
            console.warn("[WEBHOOK] Could not send subscription email:", emailErr);
          }

          /* ── Audit log ── */
          logActionSync({ action: "subscription_change", details: `Stripe: ${status}`, householdId, status: status === "past_due" ? "failure" : "success" });

          /* ── Sync latest invoice PDF if available ── */
          try {
            const latestInvoice = (subscription as unknown as Record<string, unknown>).latest_invoice;
            if (latestInvoice && typeof latestInvoice === "object" && latestInvoice !== null) {
              const inv = latestInvoice as { id: string; invoice_pdf?: string | null; amount_paid?: number; currency?: string; period_start?: number; period_end?: number; status?: string };
              if (inv.invoice_pdf && inv.id) {
                await db.invoice.upsert({
                  where: { stripeInvoiceId: inv.id },
                  create: {
                    householdId,
                    stripeInvoiceId: inv.id,
                    amountCents: inv.amount_paid || 0,
                    currency: inv.currency || "eur",
                    status: inv.status || "paid",
                    pdfUrl: inv.invoice_pdf,
                    periodStart: new Date((inv.period_start || Math.floor(Date.now() / 1000)) * 1000),
                    periodEnd: new Date((inv.period_end || Math.floor(Date.now() / 1000)) * 1000),
                  },
                  update: {
                    pdfUrl: inv.invoice_pdf,
                    amountCents: inv.amount_paid || undefined,
                    status: inv.status || undefined,
                  },
                });
                console.log(`[WEBHOOK] Invoice synced for household ${householdId}: ${inv.id}`);
              }
            }
          } catch (invErr) {
            console.warn(`[WEBHOOK] Could not sync invoice for household ${householdId}:`, invErr);
          }
        }
        break;
      }

      /* ── Subscription deleted → downgrade to free ── */
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const householdId = subscription.metadata?.householdId;

        if (householdId) {
          await db.household.update({
            where: { id: householdId },
            data: {
              subscriptionPlan: "free",
              subscriptionStatus: "canceled",
            },
          });
          console.log(`[WEBHOOK] Subscription deleted for household ${householdId}`);
        }
        break;
      }

      /* ── Payment failed → mark past_due ── */
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          const household = await db.household.findUnique({
            where: { stripeCustomerId: customerId },
            select: { id: true },
          });

          if (household) {
            const failAmountCents = invoice.amount_due || invoice.amount_remaining || 0;
            await db.household.update({
              where: { id: household.id },
              data: {
                subscriptionStatus: "past_due",
              },
            });
            console.log(`[WEBHOOK] Payment failed for household ${household.id}`);

            /* ── Send email alert for payment failure ── */
            try {
              const hh = await db.household.findUnique({
                where: { id: household.id },
                select: { contactEmail: true, name: true },
              });
              if (hh?.contactEmail) {
                const amount = `${(failAmountCents / 100).toFixed(2)} €`;
                await sendPaymentFailedAlert(hh.contactEmail, {
                  userName: hh.name || "Utilisateur",
                  amount,
                  reason: "Paiement refusé par la banque",
                }).catch(() => {});
              }
            } catch (emailErr) {
              console.warn("[WEBHOOK] Could not send payment failed email:", emailErr);
            }

            /* ── Audit log ── */
            logActionSync({ action: "payment_failed", details: `Amount: ${failAmountCents} cents`, householdId: household.id, status: "failure" });

            /* ── Create Invoice record with past_due status ── */
            try {
              const amountCents = invoice.amount_due || invoice.amount_remaining || 0;
              const periodStart = new Date((invoice.period_start || Math.floor(Date.now() / 1000)) * 1000);
              const periodEnd = new Date((invoice.period_end || Math.floor(Date.now() / 1000)) * 1000);

              if (invoice.id) {
                await db.invoice.upsert({
                  where: { stripeInvoiceId: invoice.id },
                  create: {
                    householdId: household.id,
                    stripeInvoiceId: invoice.id,
                    amountCents,
                    currency: invoice.currency || "eur",
                    status: "past_due",
                    pdfUrl: invoice.invoice_pdf || null,
                    periodStart,
                    periodEnd,
                  },
                  update: {
                    status: "past_due",
                    amountCents,
                  },
                });
                console.log(`[WEBHOOK] Past-due invoice created for household ${household.id}: ${invoice.id}`);
              }
            } catch (invErr) {
              console.warn(`[WEBHOOK] Could not create invoice for household ${household.id}:`, invErr);
            }
          }
        }
        break;
      }

      default:
        // Unhandled event — just log
        console.log(`[WEBHOOK] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
