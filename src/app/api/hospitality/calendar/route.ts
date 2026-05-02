/* ═══════════════════════════════════════════════════════
   MAELLIS — Calendrier Intelligent — API Route

   Calendar source management and booking listing.

   GET    /api/hospitality/calendar         — List calendar sources
   POST   /api/hospitality/calendar         — Add a calendar source
   PATCH  /api/hospitality/calendar         — Update a source
   DELETE /api/hospitality/calendar         — Soft-delete a source
   GET    /api/hospitality/calendar/sync    — Force sync a source
   GET    /api/hospitality/calendar/bookings — List synced bookings
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHousehold } from "@/core/auth/guards";
import { parseICalContent } from "@/lib/calendar-sync";

/* ═══════════════════════════════════════════════════════
   GET — List all CalendarSources for the authenticated household
   ═══════════════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();

    const sources = await db.calendarSource.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { calendarEvents: true },
        },
      },
    });

    // Enrich with active booking count
    const enrichedSources = await Promise.all(
      sources.map(async (source) => {
        const activeCount = await db.syncedBooking.count({
          where: {
            calendarSourceId: source.id,
            status: { in: ["confirmed", "pending"] },
          },
        });

        return {
          id: source.id,
          name: source.name,
          type: source.type,
          url: source.url,
          lastSyncAt: source.lastSyncAt,
          syncStatus: source.syncStatus,
          lastError: source.lastError,
          isActive: source.isActive,
          autoSync: source.autoSync,
          syncInterval: source.syncInterval,
          totalEvents: source._count.calendarEvents,
          activeBookings: activeCount,
          createdAt: source.createdAt,
        };
      })
    );

    return NextResponse.json({ success: true, sources: enrichedSources });
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
    console.error("[CALENDAR] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   POST — Add a new calendar source
   ═══════════════════════════════════════════════════════ */
export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const body = await request.json();
    const { name, type, url, autoSync, syncInterval } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Le nom de la source est requis" },
        { status: 400 }
      );
    }

    if (!type || !["ical", "airbnb", "booking", "google"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Type invalide (ical, airbnb, booking, google)",
        },
        { status: 400 }
      );
    }

    if (type === "ical" && (!url || typeof url !== "string" || url.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: "L'URL iCal est requise pour ce type" },
        { status: 400 }
      );
    }

    // Test the iCal URL if provided
    let preview: Array<{
      guestName: string;
      checkInDate: string;
      checkOutDate: string;
    }> = [];

    if (url && url.trim()) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url.trim(), {
          signal: controller.signal,
          headers: {
            "User-Agent": "Maellis-CalendarSync/1.0",
            Accept: "text/calendar, application/ics, text/plain",
          },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          return NextResponse.json(
            {
              success: false,
              error: `Impossible de joindre l'URL iCal (HTTP ${response.status})`,
            },
            { status: 400 }
          );
        }

        const text = await response.text();
        const bookings = parseICalContent(text, type);

        // Preview: first 3 bookings
        preview = bookings.slice(0, 3).map((b) => ({
          guestName: b.guestName,
          checkInDate: b.checkInDate.toISOString(),
          checkOutDate: b.checkOutDate.toISOString(),
        }));
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === "AbortError"
            ? "Délai d'attente dépassé lors de la connexion"
            : err instanceof Error
              ? err.message
              : "Erreur lors du test de l'URL";
        return NextResponse.json(
          { success: false, error: `URL iCal invalide: ${msg}` },
          { status: 400 }
        );
      }
    }

    // Create the source
    const source = await db.calendarSource.create({
      data: {
        householdId,
        name: name.trim(),
        type,
        url: url?.trim() || null,
        autoSync: autoSync !== false,
        syncInterval: syncInterval || 60,
      },
    });

    return NextResponse.json(
      {
        success: true,
        source,
        preview: preview.length > 0 ? { events: preview, total: preview.length } : undefined,
      },
      { status: 201 }
    );
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
    console.error("[CALENDAR] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   PATCH — Update a calendar source
   ═══════════════════════════════════════════════════════ */
export async function PATCH(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const body = await request.json();
    const { id, name, url, autoSync, syncInterval, isActive } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "ID de la source requis" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await db.calendarSource.findFirst({
      where: { id, householdId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Source introuvable" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined && typeof name === "string") updateData.name = name.trim();
    if (url !== undefined) updateData.url = url?.trim() || null;
    if (autoSync !== undefined) updateData.autoSync = Boolean(autoSync);
    if (syncInterval !== undefined && typeof syncInterval === "number") {
      updateData.syncInterval = Math.max(5, Math.min(1440, syncInterval));
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucune modification fournie" },
        { status: 400 }
      );
    }

    const updated = await db.calendarSource.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, source: updated });
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
    console.error("[CALENDAR] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   DELETE — Soft-delete a calendar source
   ═══════════════════════════════════════════════════════ */
export async function DELETE(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "ID de la source requis" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await db.calendarSource.findFirst({
      where: { id, householdId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Source introuvable" },
        { status: 404 }
      );
    }

    // Soft delete
    await db.calendarSource.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
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
    console.error("[CALENDAR] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   Sync sub-route — handled in separate file
   ═══════════════════════════════════════════════════════ */

// Note: Sync and bookings endpoints are in separate route files
// at /api/hospitality/calendar/sync/route.ts
// and /api/hospitality/calendar/bookings/route.ts
