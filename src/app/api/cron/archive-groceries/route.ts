import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timingSafeEqual } from "crypto";

/**
 * CRON — Auto-Archive des courses cochées.
 * Supprime les articles cochés il y a plus de 48h.
 *
 * Sécurisé par CRON_SECRET.
 * Fréquence recommandée: tous les jours à 3h du matin
 */
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
    console.error("[CRON] CRON_SECRET non configuré");
    return NextResponse.json(
      { error: "CRON_SECRET non configuré" },
      { status: 500 }
    );
  }

  if (!safeCompare(secret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fortyEightHoursAgo = new Date(
      Date.now() - 48 * 60 * 60 * 1000
    );

    const deleted = await db.groceryItem.deleteMany({
      where: {
        isBought: true,
        updatedAt: { lt: fortyEightHoursAgo },
      },
    });

    console.log(
      `[CRON] Archive groceries: ${deleted.count} article(s) supprimé(s)`
    );

    return NextResponse.json({
      success: true,
      archived: deleted.count,
      olderThan: fortyEightHoursAgo.toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Archive groceries error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
