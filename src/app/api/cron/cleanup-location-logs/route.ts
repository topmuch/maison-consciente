import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { locationEngine } from "@/lib/location-engine";

/* ═══════════════════════════════════════════════════════
   CRON — Cleanup Location Logs (RGPD)

   GET /api/cron/cleanup-location-logs?secret=<CRON_SECRET>

   Supprime tous les logs de localisation expirés.
   Chaque log a un expiresAt configuré selon les
   préférences du membre (1-365 jours, défaut: 7 jours).

   Fréquence recommandée : 1 fois par jour
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
    const result = await locationEngine.cleanupExpiredLogs();

    console.log(
      `[CRON] Cleanup Location Logs: ${result.deleted} logs supprimés (RGPD)`,
    );

    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Cleanup Location Logs error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 },
    );
  }
}
