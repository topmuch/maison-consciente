import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server-auth";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════
   LOCATION HISTORY API

   GET /api/location/history?memberId=xxx&limit=50&event=enter

   Retourne l'historique des positions d'un membre.
   Seuls les membres du même foyer sont accessibles.
   Les logs expirés (RGPD) ne sont jamais retournés.
   ═══════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { householdId } = await getAuthUser();
    const { searchParams } = new URL(req.url);

    const memberId = searchParams.get("memberId");
    const limitParam = searchParams.get("limit");
    const eventFilter = searchParams.get("event");
    const sinceParam = searchParams.get("since");

    const limit = Math.min(Math.max(parseInt(limitParam || "50", 10), 1), 200);

    // Build where clause
    const where: Record<string, unknown> = {
      householdId,
      expiresAt: { gt: new Date() }, // Ne jamais retourner les logs expirés
    };

    if (memberId) {
      // Vérifier que le membre appartient au foyer
      const member = await prisma.familyMember.findFirst({
        where: { id: memberId, householdId },
        select: { id: true },
      });
      if (!member) {
        return NextResponse.json(
          { success: false, error: "Membre non trouvé dans ce foyer" },
          { status: 404 },
        );
      }
      where.memberId = memberId;
    }

    if (eventFilter && ["update", "enter", "exit", "idle"].includes(eventFilter)) {
      where.event = eventFilter;
    }

    if (sinceParam) {
      const sinceDate = new Date(sinceParam);
      if (!isNaN(sinceDate.getTime())) {
        where.createdAt = { gte: sinceDate };
      }
    }

    const logs = await prisma.locationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        memberId: true,
        lat: true,
        lng: true,
        accuracy: true,
        speed: true,
        heading: true,
        battery: true,
        event: true,
        geoFenceId: true,
        geoFenceName: true,
        createdAt: true,
        member: {
          select: {
            name: true,
            role: true,
            avatarColor: true,
          },
        },
      },
    });

    // Masquer les coordonnées précises en dehors des zones
    // (flou de confidentialité) : arrondir à ~100m si hors zone
    const blurredLogs = logs.map((log) => {
      if (log.event === "update" && !log.geoFenceId) {
        // Arrondir à ~100m (~0.001 degré)
        return {
          ...log,
          lat: Math.round(log.lat * 1000) / 1000,
          lng: Math.round(log.lng * 1000) / 1000,
          blurred: true,
        };
      }
      return { ...log, blurred: false };
    });

    return NextResponse.json({
      success: true,
      logs: blurredLogs,
      count: blurredLogs.length,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[LocationHistory] Error:", err);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
