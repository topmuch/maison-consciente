/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Dashboard Widget Config API

   GET  /api/dashboard/widgets  → Get current widget config
   PUT  /api/dashboard/widgets  → Save widget config

   Protected route (session-based auth via dashboard layout).
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { createDefaultWidgets, getEnabledWidgets } from "@/lib/widget-types";
import type { WidgetConfig } from "@/lib/widget-types";

export const dynamic = "force-dynamic";

/* ─── GET: Return widget config for dashboard ─── */
export async function GET() {
  try {
    const authData = await getAuthUser();

    const household = await db.household.findUnique({
      where: { id: authData.householdId },
      select: { displayConfig: true },
    });

    if (!household) {
      return NextResponse.json(
        { success: false, error: "Foyer non trouvé" },
        { status: 404 }
      );
    }

    let config: { dashboardWidgets?: WidgetConfig[] } = {};
    try {
      config = JSON.parse(household.displayConfig || "{}");
    } catch {
      config = {};
    }

    const widgets = config.dashboardWidgets || createDefaultWidgets();

    return NextResponse.json({
      success: true,
      widgets,
      enabledWidgets: getEnabledWidgets(widgets),
    });
  } catch (error) {
    console.error("[Dashboard Widgets API] GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}

/* ─── PUT: Save widget config from dashboard ─── */
export async function PUT(request: NextRequest) {
  try {
    const authData = await getAuthUser();

    const body = await request.json();
    const { widgets } = body as { widgets?: WidgetConfig[] };

    if (!widgets || !Array.isArray(widgets)) {
      return NextResponse.json(
        { success: false, error: "Widgets array requis" },
        { status: 400 }
      );
    }

    // Validate each widget
    const validWidgets = widgets.every(
      (w) =>
        w.id &&
        w.type &&
        typeof w.enabled === "boolean" &&
        typeof w.order === "number"
    );

    if (!validWidgets) {
      return NextResponse.json(
        { success: false, error: "Format de widget invalide" },
        { status: 400 }
      );
    }

    const household = await db.household.findUnique({
      where: { id: authData.householdId },
      select: { id: true, displayConfig: true },
    });

    if (!household) {
      return NextResponse.json(
        { success: false, error: "Foyer non trouvé" },
        { status: 404 }
      );
    }

    // Merge into existing displayConfig
    let existingConfig: Record<string, unknown> = {};
    try {
      existingConfig = JSON.parse(household.displayConfig || "{}");
    } catch {
      existingConfig = {};
    }

    existingConfig.dashboardWidgets = widgets;

    await db.household.update({
      where: { id: authData.householdId },
      data: { displayConfig: JSON.stringify(existingConfig) },
    });

    return NextResponse.json({
      success: true,
      widgets,
      enabledWidgets: getEnabledWidgets(widgets),
    });
  } catch (error) {
    console.error("[Dashboard Widgets API] PUT Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
