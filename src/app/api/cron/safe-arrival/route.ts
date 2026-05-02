import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { checkSafeArrivals } from "@/lib/safe-arrival-engine";

/* ═══════════════════════════════════════════════════════
   CRON — Safe Arrival Check

   GET /api/cron/safe-arrival?secret=<CRON_SECRET>

   Checks all pending safe arrival records and marks
   late ones (> expected time). Sends push notifications.

   Recommended frequency: every 5 minutes
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
      { status: 500 }
    );
  }

  if (!safeCompare(secret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkSafeArrivals();

    console.log(
      `[CRON] Safe Arrival: ${result.checked} vérifié(s), ${result.late} en retard`
    );

    return NextResponse.json({
      success: true,
      checked: result.checked,
      late: result.late,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Safe Arrival error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
