import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/display/[token]/events
 * Returns upcoming calendar events for the tablet display.
 * Token-based auth — no session required.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const household = await db.household.findUnique({
      where: { displayToken: token },
    });

    if (!household?.displayEnabled) {
      return NextResponse.json(
        { success: false, error: "Display désactivé ou token invalide" },
        { status: 403 }
      );
    }

    const now = new Date();

    // Get upcoming events (today and next 30 days)
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 3600_000);

    const events = await db.calendarEvent.findMany({
      where: {
        householdId: household.id,
        date: { gte: now.toISOString(), lte: thirtyDaysLater.toISOString() },
      },
      orderBy: { date: "asc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        type: e.type,
        isRecurring: e.isRecurring,
      })),
    });
  } catch (error) {
    console.error("[Display Events API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
