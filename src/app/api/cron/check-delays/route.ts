import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { locationEngine } from "@/lib/location-engine";

/* ═══════════════════════════════════════════════════════
   CRON — Check Delay Alerts

   GET /api/cron/check-delays?secret=<CRON_SECRET>

   Vérifie tous les membres enfants qui ne sont pas
   rentrés à l'heure prévue et déclenche des alertes.

   Fréquence recommandée : toutes les 5 minutes
   ═══════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? "";

  if (!process.env.CRON_SECRET) {
    console.error("[CRON] CRON_SECRET non configuré dans .env");
    return NextResponse.json(
      { error: "CRON_SECRET non configuré" },
      { status: 500 },
    );
  }

  if (!safeCompare(secret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await locationEngine.checkDelayAlerts();

    console.log(
      `[CRON] Check Delays: ${result.checked} vérifié(s), ${result.alertsTriggered} alerte(s) déclenchée(s)`,
    );

    return NextResponse.json({
      success: true,
      checked: result.checked,
      alertsTriggered: result.alertsTriggered,
      details: result.details,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Check Delays error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 },
    );
  }
}
