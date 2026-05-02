/* ═══════════════════════════════════════════════════════
   MAELLIS — Calendrier Intelligent — Bookings Endpoint

   GET /api/hospitality/calendar/bookings
   Query params: ?status=confirmed&from=2024-01-01&to=2024-12-31

   List synced bookings for the authenticated household.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHousehold } from "@/core/auth/guards";

export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Build where clause
    const where: Record<string, unknown> = { householdId };

    if (status && ["confirmed", "cancelled", "completed", "pending"].includes(status)) {
      where.status = status;
    }

    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        where.checkOutDate = { ...(where.checkOutDate as Record<string, unknown> || {}), gte: fromDate };
      }
    }

    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) {
        where.checkInDate = { ...(where.checkInDate as Record<string, unknown> || {}), lte: toDate };
      }
    }

    const bookings = await db.syncedBooking.findMany({
      where,
      orderBy: [{ checkInDate: "asc" }],
      include: {
        calendarSource: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      take: 100,
    });

    // Enrich with night count
    const enrichedBookings = bookings.map((booking) => {
      const diffMs =
        booking.checkOutDate.getTime() - booking.checkInDate.getTime();
      const nights = Math.max(
        1,
        Math.round(diffMs / (1000 * 60 * 60 * 24))
      );

      return {
        id: booking.id,
        externalId: booking.externalId,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        numberOfGuests: booking.numberOfGuests,
        source: booking.source,
        status: booking.status,
        notes: booking.notes,
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        listingName: booking.listingName,
        nights,
        calendarSource: booking.calendarSource,
        lastSyncedAt: booking.lastSyncedAt,
      };
    });

    return NextResponse.json({
      success: true,
      bookings: enrichedBookings,
      total: enrichedBookings.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "NO_HOUSEHOLD") {
      return NextResponse.json(
        { success: false, error: "Aucun foyer associé" },
        { status: 401 }
      );
    }
    console.error("[CALENDAR BOOKINGS] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
