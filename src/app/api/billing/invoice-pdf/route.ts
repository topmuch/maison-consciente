/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Invoice PDF Generation
   GET /api/billing/invoice-pdf?id=xxx
   Returns HTML invoice for download/print-to-PDF.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { requireHousehold } from "@/core/auth/guards";
import { db } from "@/core/db";

export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("id");

    if (!invoiceId) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, householdId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
    }

    const household = await db.household.findUnique({
      where: { id: householdId },
      select: { name: true, contactEmail: true, contactAddress: true },
    });

    const amount = (invoice.amountCents / 100).toFixed(2);
    const statusLabels: Record<string, string> = {
      paid: "Payée",
      open: "En attente",
      past_due: "En retard",
      void: "Annulée",
    };
    const statusLabel = statusLabels[invoice.status] || invoice.status;
    const periodStart = new Date(invoice.periodStart).toLocaleDateString("fr-FR");
    const periodEnd = new Date(invoice.periodEnd).toLocaleDateString("fr-FR");
    const createdAt = new Date(invoice.createdAt).toLocaleDateString("fr-FR");

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${invoice.id.slice(0, 8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f1a; color: #e2e8f0; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 1px solid rgba(212,168,83,0.2); }
    .logo { font-size: 24px; font-weight: 700; color: #d4a853; }
    .logo span { color: #94a3b8; font-weight: 400; font-size: 14px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 28px; color: #d4a853; margin-bottom: 4px; }
    .invoice-meta p { font-size: 13px; color: #64748b; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
    .info-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 8px; }
    .info-block p { font-size: 15px; color: #cbd5e1; line-height: 1.6; }
    .table-section { margin-bottom: 40px; }
    table { width: 100%; border-collapse: collapse; }
    thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; padding: 12px 16px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.06); }
    tbody td { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 14px; }
    .amount-cell { text-align: right; font-weight: 600; color: #d4a853; font-size: 16px; }
    .total-section { display: flex; justify-content: flex-end; margin-bottom: 48px; }
    .total-box { background: rgba(212,168,83,0.08); border: 1px solid rgba(212,168,83,0.15); border-radius: 12px; padding: 20px 32px; text-align: right; }
    .total-box p { font-size: 12px; color: #64748b; margin-bottom: 4px; }
    .total-box .amount { font-size: 32px; font-weight: 700; color: #d4a853; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-paid { background: rgba(16,185,129,0.1); color: #34d399; }
    .status-past_due { background: rgba(239,68,68,0.1); color: #f87171; }
    .status-open { background: rgba(212,168,83,0.1); color: #d4a853; }
    .status-void { background: rgba(100,116,139,0.1); color: #94a3b8; }
    .footer { text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.04); }
    .footer p { font-size: 11px; color: #475569; }
    @media print { body { background: white; color: #1e293b; } .header { border-color: #e2e8f0; } .logo { color: #b8860b; } .amount-cell { color: #b8860b; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Maison Consciente <br><span>Smart Home Solution</span></div>
    <div class="invoice-meta">
      <h2>FACTURE</h2>
      <p>N° ${invoice.id.slice(0, 8).toUpperCase()}</p>
      <p>du ${createdAt}</p>
      <br>
      <span class="status-badge status-${invoice.status}">${statusLabel}</span>
    </div>
  </div>

  <div class="grid">
    <div class="info-block">
      <h3>Facturé à</h3>
      <p><strong>${household?.name || "Foyer"}</strong><br>
      ${household?.contactAddress || ""}<br>
      ${household?.contactEmail || ""}</p>
    </div>
    <div class="info-block">
      <h3>Période de facturation</h3>
      <p>Du ${periodStart}<br>au ${periodEnd}</p>
    </div>
  </div>

  <div class="table-section">
    <table>
      <thead>
        <tr><th>Description</th><th>Période</th><th class="amount-cell">Montant</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Abonnement Maison Consciente</td>
          <td>${periodStart} — ${periodEnd}</td>
          <td class="amount-cell">${amount} €</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="total-section">
    <div class="total-box">
      <p>Total TTC</p>
      <div class="amount">${amount} €</div>
    </div>
  </div>

  <div class="footer">
    <p>Maison Consciente — Facture générée automatiquement. TVA non applicable (article 293 B du CGI).</p>
    <p>Pour toute question, contactez le support via votre portail client.</p>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="facture-${invoice.id.slice(0, 8).toUpperCase()}.html"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
