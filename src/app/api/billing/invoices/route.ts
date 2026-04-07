/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Billing Invoices API
   GET /api/billing/invoices — List household invoices
   GET /api/billing/invoices?id=xxx — Get single invoice
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { requireHousehold } from "@/core/auth/guards";
import { db } from "@/core/db";

export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("id");

    if (invoiceId) {
      // Get single invoice
      const invoice = await db.invoice.findFirst({
        where: { id: invoiceId, householdId },
      });

      if (!invoice) {
        return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
      }

      return NextResponse.json({ success: true, invoice });
    }

    // List all invoices for household
    const invoices = await db.invoice.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "NO_HOUSEHOLD") {
      return NextResponse.json({ error: "Aucun foyer associé" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
