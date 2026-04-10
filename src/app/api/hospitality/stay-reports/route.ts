/* ═══════════════════════════════════════════════════════
   MAELLIS — Stay Review Reports API

   GET  /api/hospitality/stay-reports            — List stay review reports
   POST /api/hospitality/stay-reports            — Manually trigger report generation
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/server-auth";
import { generateStayReviewReport } from "@/lib/gemini-analysis";

export const dynamic = "force-dynamic";

/* ═══════════════════════════════════════════════════════
   GET — List Stay Review Reports
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
    const sentiment = searchParams.get("sentiment");

    // Build where clause
    const where: Record<string, unknown> = { householdId };

    if (sentiment) {
      where.sentiment = sentiment;
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      db.stayReviewReport.findMany({
        where,
        orderBy: { generatedAt: "desc" },
        skip,
        take: limit,
      }),
      db.stayReviewReport.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      reports,
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
    console.error("[Hospitality StayReports] GET error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════
   POST — Manually Trigger Report Generation
   ═══════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
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
    const { checkInStateId } = body as {
      checkInStateId?: string;
    };

    if (!checkInStateId) {
      return NextResponse.json(
        { success: false, error: "checkInStateId est requis" },
        { status: 400 }
      );
    }

    // Verify the CheckInState belongs to this household
    const checkInState = await db.checkInState.findFirst({
      where: {
        id: checkInStateId,
        householdId,
      },
    });

    if (!checkInState) {
      return NextResponse.json(
        { success: false, error: "Séjour introuvable" },
        { status: 404 }
      );
    }

    // Check if there are completed daily checks for this stay
    const completedCheckCount = await db.dailyCheck.count({
      where: {
        checkInStateId,
        status: { in: ["completed", "no_answer"] },
      },
    });

    if (completedCheckCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucune vérification quotidienne complétée pour ce séjour. Impossible de générer un rapport.",
        },
        { status: 400 }
      );
    }

    // Generate the report (this may take a few seconds)
    const report = await generateStayReviewReport(checkInStateId);

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Impossible de générer le rapport. Vérifiez la configuration Gemini." },
        { status: 503 }
      );
    }

    // Fetch the saved report from DB
    const savedReport = await db.stayReviewReport.findUnique({
      where: { checkInStateId },
    });

    return NextResponse.json(
      {
        success: true,
        report: savedReport,
        message: `Rapport généré pour le séjour de ${checkInState.guestName}`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Hospitality StayReports] POST error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
