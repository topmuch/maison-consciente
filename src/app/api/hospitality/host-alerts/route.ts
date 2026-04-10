/* ═══════════════════════════════════════════════════════
   MAELLIS — Host Alerts Management API

   GET   /api/hospitality/host-alerts           — List host alerts (filterable)
   PATCH /api/hospitality/host-alerts           — Acknowledge or resolve an alert
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

/* ═══════════════════════════════════════════════════════
   GET — List Host Alerts
   ═══════════════════════════════════════════════════════ */

export async function GET(req: NextRequest) {
  try {
    const { user, householdId } = await getAuthUser();

    // Verify hospitality household
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: { type: true },
    });

    if (!household || household.type !== "hospitality") {
      return NextResponse.json(
        { success: false, error: "Accès réservé au mode hospitalité" },
        { status: 403 }
      );
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");

    // Build where clause
    const where: Record<string, unknown> = { householdId };

    if (status) {
      where.status = status;
    }
    if (severity) {
      where.severity = severity;
    }
    if (category) {
      where.category = category;
    }

    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      db.hostAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.hostAlert.count({ where }),
    ]);

    // Enrich alerts with related daily check data
    const alertsWithCheckData = await Promise.all(
      alerts.map(async (alert) => {
        let dailyCheckData: { id: string; checkType: string; overallScore: number | null; sentiment: string | null } | null = null;
        if (alert.dailyCheckId) {
          const check = await db.dailyCheck.findUnique({
            where: { id: alert.dailyCheckId },
            select: {
              id: true,
              checkType: true,
              overallScore: true,
              sentiment: true,
            },
          });
          if (check) dailyCheckData = check;
        }
        return { ...alert, dailyCheck: dailyCheckData };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      alerts: alertsWithCheckData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Hospitality HostAlerts] GET error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════
   PATCH — Acknowledge or Resolve an Alert
   ═══════════════════════════════════════════════════════ */

export async function PATCH(req: NextRequest) {
  try {
    const { user, householdId } = await getAuthUser();

    // Verify hospitality household
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: { type: true },
    });

    if (!household || household.type !== "hospitality") {
      return NextResponse.json(
        { success: false, error: "Accès réservé au mode hospitalité" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, action, resolution } = body as {
      id?: string;
      action?: "acknowledge" | "resolve" | "dismiss";
      resolution?: string;
    };

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: "id et action sont requis" },
        { status: 400 }
      );
    }

    const validActions = ["acknowledge", "resolve", "dismiss"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `action doit être l'un de: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify the alert belongs to this household
    const alert = await db.hostAlert.findFirst({
      where: {
        id,
        householdId,
      },
    });

    if (!alert) {
      return NextResponse.json(
        { success: false, error: "Alerte introuvable" },
        { status: 404 }
      );
    }

    // Build update data based on action
    const updateData: Record<string, unknown> = {};

    if (action === "acknowledge") {
      if (alert.status === "acknowledged" || alert.status === "resolved" || alert.status === "dismissed") {
        return NextResponse.json(
          { success: false, error: `Alerte déjà ${alert.status}` },
          { status: 400 }
        );
      }
      updateData.status = "acknowledged";
      updateData.acknowledgedAt = new Date();
    }

    if (action === "resolve") {
      updateData.status = "resolved";
      updateData.resolvedAt = new Date();
      if (resolution) {
        updateData.resolution = resolution;
      }

      // Also mark the related DailyCheck as resolved
      if (alert.dailyCheckId) {
        await db.dailyCheck.update({
          where: { id: alert.dailyCheckId },
          data: {
            resolved: true,
            resolvedAt: new Date(),
          },
        });
      }
    }

    if (action === "dismiss") {
      updateData.status = "dismissed";
      if (resolution) {
        updateData.resolution = resolution;
      }
    }

    const updatedAlert = await db.hostAlert.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      alert: updatedAlert,
      message: `Alerte ${action === "acknowledge" ? "acquittée" : action === "resolve" ? "résolue" : "ignorée"}`,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Hospitality HostAlerts] PATCH error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
