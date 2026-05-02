/* ═══════════════════════════════════════════════════════
   MAELLIS — Daily Checks CRUD API

   GET  /api/hospitality/daily-checks          — List daily checks (paginated, filterable)
   POST /api/hospitality/daily-checks          — Manually trigger a daily check
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/server-auth";
import { initiateHospitalityCall } from "@/lib/retell-hospitality";

export const dynamic = "force-dynamic";

/* ═══════════════════════════════════════════════════════
   GET — List Daily Checks
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
    const sentiment = searchParams.get("sentiment");
    const checkType = searchParams.get("checkType");
    const checkInStateId = searchParams.get("checkInStateId");
    const guestName = searchParams.get("guestName");

    // Build where clause
    const where: Record<string, unknown> = { householdId };

    if (status) {
      where.status = status;
    }
    if (sentiment) {
      where.sentiment = sentiment;
    }
    if (checkType) {
      where.checkType = checkType;
    }
    if (checkInStateId) {
      where.checkInStateId = checkInStateId;
    }
    if (guestName) {
      where.guestName = { contains: guestName };
    }

    const skip = (page - 1) * limit;

    const [checks, total] = await Promise.all([
      db.dailyCheck.findMany({
        where,
        orderBy: { checkDate: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          checkInStateId: true,
          guestName: true,
          checkDate: true,
          checkType: true,
          status: true,
          callId: true,
          durationSec: true,
          transcription: true,
          overallScore: true,
          sentiment: true,
          issues: true,
          keywords: true,
          aiSummary: true,
          hostAlerted: true,
          resolved: true,
          resolvedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.dailyCheck.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      checks,
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
    console.error("[Hospitality DailyChecks] GET error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════
   POST — Manually Trigger a Daily Check
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
    const { checkInStateId, checkType } = body as {
      checkInStateId?: string;
      checkType?: "arrival" | "daily" | "departure";
    };

    if (!checkInStateId || !checkType) {
      return NextResponse.json(
        { success: false, error: "checkInStateId et checkType sont requis" },
        { status: 400 }
      );
    }

    const validTypes = ["arrival", "daily", "departure"];
    if (!validTypes.includes(checkType)) {
      return NextResponse.json(
        { success: false, error: `checkType doit être l'un de: ${validTypes.join(", ")}` },
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

    if (checkInState.status !== "checked-in") {
      return NextResponse.json(
        { success: false, error: "Le séjour doit être actif (checked-in) pour lancer un check" },
        { status: 400 }
      );
    }

    // Initiate the hospitality call
    const result = await initiateHospitalityCall(householdId, checkInState, checkType);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Impossible de lancer l'appel",
          dailyCheckId: result.dailyCheckId,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        callId: result.callId,
        dailyCheckId: result.dailyCheckId,
        message: `Appel ${checkType} lancé pour ${checkInState.guestName}`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Hospitality DailyChecks] POST error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
