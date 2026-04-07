import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timingSafeEqual } from "crypto";

/**
 * CRON — Nettoyage des messages publics de plus de 24h.
 *
 * Sécurisé par un secret partagé (CRON_SECRET dans .env).
 * Appel externe: GET /api/cron/cleanup-messages?secret=<CRON_SECRET>
 *
 * Fréquence recommandée: toutes les 4 heures (cron: 0 * * * * )
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
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    );

    // First count what will be deleted (for the response)
    const countBefore = await db.message.count({
      where: {
        isPublic: true,
        createdAt: { lt: twentyFourHoursAgo },
      },
    });

    const deleted = await db.message.deleteMany({
      where: {
        isPublic: true,
        createdAt: { lt: twentyFourHoursAgo },
      },
    });

    console.log(
      `[CRON] Cleanup messages: ${deleted.count} supprimé(s) (${countBefore} trouvés)`
    );

    return NextResponse.json({
      success: true,
      deleted: deleted.count,
      olderThan: twentyFourHoursAgo.toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Erreur cleanup messages:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
