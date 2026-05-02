/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Widget Configuration API

   GET  /api/display/[token]/widgets  → Returns widget config
   PUT  /api/display/[token]/widgets  → Saves widget config

   Public route (token-based auth via displayToken).
   Widget config is stored in Household.displayConfig JSON field.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createDefaultWidgets, getEnabledWidgets } from "@/lib/widget-types";
import type { WidgetConfig } from "@/lib/widget-types";

export const dynamic = "force-dynamic";

/* ─── GET: Return widget config ─── */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const household = await db.household.findUnique({
      where: { displayToken: token },
      select: {
        id: true,
        displayEnabled: true,
        displayConfig: true,
      },
    });

    if (!household || !household.displayEnabled) {
      return NextResponse.json(
        { success: false, error: "Display désactivé ou token invalide" },
        { status: 403 }
      );
    }

    // Parse existing displayConfig
    let config: {
      widgets?: Record<string, boolean>;
      guestMode?: { maskPresence?: boolean; maskMessages?: boolean };
      dashboardWidgets?: WidgetConfig[];
    } = {};
    try {
      config = JSON.parse(household.displayConfig || "{}");
    } catch {
      config = {};
    }

    // If no dashboard widgets config, return defaults
    const widgets = config.dashboardWidgets || createDefaultWidgets();

    return NextResponse.json({
      success: true,
      widgets,
      enabledWidgets: getEnabledWidgets(widgets),
    });
  } catch (error) {
    console.error("[Widget Config API] GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}

/* ─── PUT: Save widget config ─── */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const household = await db.household.findUnique({
      where: { displayToken: token },
      select: { id: true, displayEnabled: true, displayConfig: true },
    });

    if (!household || !household.displayEnabled) {
      return NextResponse.json(
        { success: false, error: "Display désactivé ou token invalide" },
        { status: 403 }
      );
    }

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

    // Merge into existing displayConfig, preserving other config keys
    let existingConfig: Record<string, unknown> = {};
    try {
      existingConfig = JSON.parse(household.displayConfig || "{}");
    } catch {
      existingConfig = {};
    }

    existingConfig.dashboardWidgets = widgets;

    await db.household.update({
      where: { id: household.id },
      data: { displayConfig: JSON.stringify(existingConfig) },
    });

    return NextResponse.json({
      success: true,
      widgets,
      enabledWidgets: getEnabledWidgets(widgets),
    });
  } catch (error) {
    console.error("[Widget Config API] PUT Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
