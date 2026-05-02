/* ═══════════════════════════════════════════════════════
   MAELLIS — Smart Late Checkout Seller API

   POST /api/hospitality/late-checkout
   Two modes via the request body:
     • Trigger check  — determines if a late checkout
       offer can be presented on departure day at 09:00
     • Accept/Decline — processes the guest's response
       to the late checkout offer
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/server-auth";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/* ── Types ── */

interface LateCheckoutTriggerBody {
  householdId: string;
  checkInStateId: string;
  accept?: undefined;
  price?: undefined;
}

interface LateCheckoutAcceptBody {
  householdId: string;
  checkInStateId: string;
  accept: boolean;
  price?: number;
}

type LateCheckoutRequestBody = LateCheckoutTriggerBody | LateCheckoutAcceptBody;

interface ModuleEntry {
  active?: boolean;
  status?: string;
  [key: string]: unknown;
}

interface ModulesConfig {
  [moduleId: string]: ModuleEntry;
}

/* ═══════════════════════════════════════════════════════
   Helper: checkModuleActive
   Parses the household's modulesConfig JSON and checks
   if the given module ID exists and is active.
   ═══════════════════════════════════════════════════════ */

function checkModuleActive(
  modulesConfig: unknown,
  moduleId: string
): boolean {
  if (!modulesConfig || typeof modulesConfig !== "object") {
    return false;
  }

  const config = modulesConfig as ModulesConfig;
  const mod = config[moduleId];

  if (!mod || typeof mod !== "object") {
    return false;
  }

  return mod.active === true;
}

/* ═══════════════════════════════════════════════════════
   Helper: isSameDay
   Compares two dates and returns true if they fall on
   the same calendar day (year + month + date).
   ═══════════════════════════════════════════════════════ */

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ═══════════════════════════════════════════════════════
   Helper: formatTime
   Formats a Date to "HH:MM" string (Europe/Paris).
   ═══════════════════════════════════════════════════════ */

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/* ═══════════════════════════════════════════════════════
   POST — Trigger Check or Accept/Decline Late Checkout
   ═══════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    const { householdId } = await getAuthUser();

    const body: LateCheckoutRequestBody = await req.json();
    const { checkInStateId } = body;

    if (!checkInStateId || typeof checkInStateId !== "string") {
      return NextResponse.json(
        { success: false, error: "checkInStateId est requis" },
        { status: 400 }
      );
    }

    // ── Fetch household with modulesConfig ──
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: {
        id: true,
        type: true,
        modulesConfig: true,
        timezone: true,
      },
    });

    if (!household || household.type !== "hospitality") {
      return NextResponse.json(
        { success: false, error: "Foyer hospitalier introuvable" },
        { status: 404 }
      );
    }

    // ── Fetch the check-in state ──
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

    // ─────────────────────────────────────────────
    //  MODE 1: Accept / Decline the offer
    // ─────────────────────────────────────────────
    if ("accept" in body && body.accept !== undefined) {
      return handleAcceptDecline(body, checkInState, householdId);
    }

    // ─────────────────────────────────────────────
    //  MODE 2: Trigger check (default)
    // ─────────────────────────────────────────────
    return handleTriggerCheck(checkInState, household, householdId);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")
    ) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("[MAELLIS] Late Checkout POST error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   Mode 1: Accept / Decline Handler
   ═══════════════════════════════════════════════════════ */

async function handleAcceptDecline(
  body: LateCheckoutAcceptBody,
  checkInState: { id: string; checkOutAt: Date | null; guestName: string },
  householdId: string
): Promise<NextResponse> {
  if (!checkInState.checkOutAt) {
    return NextResponse.json(
      { success: false, error: "Aucune date de check-out définie pour ce séjour" },
      { status: 400 }
    );
  }

  if (body.accept) {
    // ── ACCEPT: extend check-out to 14:00 ──
    const currentCheckout = new Date(checkInState.checkOutAt);
    const newCheckout = new Date(currentCheckout);
    newCheckout.setHours(14, 0, 0, 0);

    const transactionId = `mock_tx_${randomUUID()}`;
    const price = body.price ?? 20;

    // In production: create Stripe payment intent here
    console.log(
      `[MAELLIS] Late Checkout accepted — guest: ${checkInState.guestName}, ` +
      `txId: ${transactionId}, price: ${price}€`
    );

    // Update the check-out time
    await db.checkInState.update({
      where: { id: checkInState.id },
      data: { checkOutAt: newCheckout },
    });

    // Log the transaction
    await db.userLog.create({
      data: {
        householdId,
        action: "late_checkout_accepted",
        details: JSON.stringify({
          checkInStateId: checkInState.id,
          guestName: checkInState.guestName,
          transactionId,
          price,
          previousCheckout: checkInState.checkOutAt.toISOString(),
          newCheckout: newCheckout.toISOString(),
        }),
        status: "success",
      },
    });

    return NextResponse.json({
      success: true,
      newCheckoutTime: "14:00",
      transactionId,
      price,
    });
  }

  // ── DECLINE ──
  await db.userLog.create({
    data: {
      householdId,
      action: "late_checkout_declined",
      details: JSON.stringify({
        checkInStateId: checkInState.id,
        guestName: checkInState.guestName,
      }),
      status: "success",
    },
  });

  return NextResponse.json({
    success: true,
    message: "Late checkout declined",
  });
}

/* ═══════════════════════════════════════════════════════
   Mode 2: Trigger Check Handler
   ═══════════════════════════════════════════════════════ */

async function handleTriggerCheck(
  checkInState: {
    id: string;
    status: string;
    checkOutAt: Date | null;
    guestName: string;
  },
  household: { id: string; modulesConfig: unknown },
  householdId: string
): Promise<NextResponse> {
  const now = new Date();

  // ── 1. Verify departure day (checkOutAt is today) ──
  if (!checkInState.checkOutAt) {
    return NextResponse.json(
      { success: false, error: "Aucune date de check-out définie" },
      { status: 400 }
    );
  }

  if (!isSameDay(now, checkInState.checkOutAt)) {
    const daysUntil = Math.ceil(
      (checkInState.checkOutAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return NextResponse.json(
      {
        success: false,
        canOffer: false,
        error: `Ce n'est pas le jour du départ (départ dans ${daysUntil > 0 ? daysUntil : "passé"} jour(s))`,
      },
      { status: 400 }
    );
  }

  // ── 2. Verify current time is >= 09:00 ──
  const nineAM = new Date(now);
  nineAM.setHours(9, 0, 0, 0);

  if (now < nineAM) {
    return NextResponse.json(
      {
        success: false,
        canOffer: false,
        error: "La proposition de late checkout est disponible à partir de 09:00",
        availableAt: nineAM.toISOString(),
      },
      { status: 425 }
    );
  }

  // ── 3. Check if smart_late_checkout module is active ──
  if (!checkModuleActive(household.modulesConfig, "smart_late_checkout")) {
    return NextResponse.json(
      {
        success: false,
        canOffer: false,
        error: "Le module Smart Late Checkout Seller n'est pas activé",
        moduleRequired: "smart_late_checkout",
      },
      { status: 403 }
    );
  }

  // ── 4. Check availability: look for next booking after current check-out ──
  // For MVP: check if there are any CheckInState records for this household
  // where checkInAt is on the same day as the current checkOutAt
  const checkoutDayStart = new Date(checkInState.checkOutAt);
  checkoutDayStart.setHours(0, 0, 0, 0);

  const checkoutDayEnd = new Date(checkInState.checkOutAt);
  checkoutDayEnd.setHours(23, 59, 59, 999);

  const nextBookings = await db.checkInState.findMany({
    where: {
      householdId,
      id: { not: checkInState.id }, // Exclude current stay
      checkInAt: {
        gte: checkoutDayStart,
        lte: checkoutDayEnd,
      },
      status: {
        in: ["checked-in", "pending"],
      },
    },
    select: {
      id: true,
      guestName: true,
      checkInAt: true,
    },
    orderBy: { checkInAt: "asc" },
  });

  // ── 5. Determine if late checkout is available ──
  const blockingBooking = nextBookings.find((booking) => {
    const arrivalHour = booking.checkInAt.getHours();
    const arrivalMinute = booking.checkInAt.getMinutes();
    // If next booking arrives before 16:00, we cannot offer late checkout
    return arrivalHour < 16 || (arrivalHour === 16 && arrivalMinute === 0);
  });

  if (blockingBooking) {
    const arrivalTimeStr = formatTime(blockingBooking.checkInAt);

    await db.userLog.create({
      data: {
        householdId,
        action: "late_checkout_unavailable",
        details: JSON.stringify({
          checkInStateId: checkInState.id,
          guestName: checkInState.guestName,
          reason: "Prochain séjour prévu",
          nextBookingId: blockingBooking.id,
          nextBookingName: blockingBooking.guestName,
          nextBookingTime: blockingBooking.checkInAt.toISOString(),
        }),
        status: "success",
      },
    });

    return NextResponse.json({
      success: true,
      canOffer: false,
      reason: `Prochain séjour prévu à ${arrivalTimeStr}`,
    });
  }

  // ── 6. Late checkout is available! ──
  const suggestedPrice = 20;
  const suggestedNewTime = "14:00";
  const currentCheckoutTime = formatTime(checkInState.checkOutAt);

  await db.userLog.create({
    data: {
      householdId,
      action: "late_checkout_offered",
      details: JSON.stringify({
        checkInStateId: checkInState.id,
        guestName: checkInState.guestName,
        suggestedPrice,
        suggestedNewTime,
        currentCheckoutTime,
      }),
      status: "success",
    },
  });

  return NextResponse.json({
    success: true,
    canOffer: true,
    suggestedPrice,
    suggestedNewTime,
    currentCheckoutTime,
  });
}
