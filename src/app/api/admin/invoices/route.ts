import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireRole } from "@/core/auth/guards";

/* ═══════════════════════════════════════════════════════
   GET: List all invoices across all households (superadmin only)
   ═══════════════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  try {
    await requireRole("superadmin");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          household: {
            select: { id: true, name: true, subscriptionPlan: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.invoice.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        amountCents: inv.amountCents,
        currency: inv.currency,
        status: inv.status,
        pdfUrl: inv.pdfUrl,
        periodStart: inv.periodStart.toISOString(),
        periodEnd: inv.periodEnd.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        stripeInvoiceId: inv.stripeInvoiceId,
        householdId: inv.householdId,
        householdName: inv.household?.name ?? "—",
        subscriptionPlan: inv.household?.subscriptionPlan ?? "—",
      })),
      total,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Admin invoices error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   POST: Send reminder for past_due invoice (superadmin only)
   ═══════════════════════════════════════════════════════ */
export async function POST(request: NextRequest) {
  try {
    const { session, householdId } = await requireRole("superadmin");
    const body = await request.json();
    const { invoiceId } = body as { invoiceId?: string };

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: "invoiceId requis" },
        { status: 400 }
      );
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        household: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Facture introuvable" },
        { status: 404 }
      );
    }

    if (invoice.status !== "past_due") {
      return NextResponse.json(
        { success: false, error: "Seules les factures en retard peuvent recevoir un rappel" },
        { status: 400 }
      );
    }

    // Log action — placeholder for actual email integration
    await db.userLog.create({
      data: {
        userId: session.userId,
        householdId: householdId,
        action: "subscription_change",
        details: JSON.stringify({
          type: "invoice_reminder_sent",
          invoiceId: invoice.id,
          targetHouseholdId: invoice.householdId,
          targetHouseholdName: invoice.household?.name,
          amountCents: invoice.amountCents,
          currency: invoice.currency,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Rappel envoyé pour la facture du foyer "${invoice.household?.name}"`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Admin invoices POST error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
