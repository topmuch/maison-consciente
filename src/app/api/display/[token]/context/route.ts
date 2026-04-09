import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/display/[token]/context
 * Returns contextual tablet data based on time-of-day phase.
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
      select: { id: true, displayEnabled: true },
    });

    if (!household?.displayEnabled) {
      return NextResponse.json(
        { success: false, error: "Display désactivé ou token invalide" },
        { status: 403 }
      );
    }

    const hour = new Date().getHours();
    const phase = getPhaseFromHour(hour);

    const messages: Record<string, string> = {
      morning: "Bonjour ! Une belle journée vous attend. N'oubliez pas votre rituel du matin.",
      day: "Bon après-midi ! Profitez de votre journée. Pensez à faire une pause.",
      evening: "Bonsoir ! La journée touche à sa fin. Moment idéal pour se détendre.",
      night: "Bonne nuit ! La maison est en mode veille. Tout est en ordre.",
    };

    const actions: Record<string, { label: string; type: string; payload: string }> = {
      morning: { label: "Voir les rappels du jour", type: "open-reminders", payload: "" },
      day: { label: "Scanner un QR code", type: "open-scan", payload: "" },
      evening: { label: "Ambiance du soir", type: "open-ambiance", payload: "evening" },
      night: { label: "Vérifier les portes", type: "security-check", payload: "" },
    };

    // Get next event
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 3600_000);
    const nextEvent = await db.calendarEvent.findFirst({
      where: {
        householdId: household.id,
        date: { gte: now.toISOString(), lte: sevenDaysLater.toISOString() },
      },
      orderBy: { date: "asc" },
    });

    const weatherIcons: Record<string, string> = {
      morning: "sun",
      day: "cloud-sun",
      evening: "cloud",
      night: "moon",
    };

    const extra: string[] = [];
    if (phase === "morning") extra.push("Pensez à prendre votre petit-déjeuner ☕");
    if (phase === "evening") extra.push("Moment de détente recommandé 🧘");
    if (phase === "night") {
      extra.push("Mode nocturne activé 🔒");
      extra.push("Alarme armée");
    }

    return NextResponse.json({
      success: true,
      context: {
        phase,
        weather: {
          temperature: 18,
          condition: "Dégagé",
          high: 22,
          low: 14,
          icon: weatherIcons[phase] ?? "cloud-sun",
        },
        message: messages[phase] ?? messages.day,
        action: actions[phase] ?? actions.day,
        nextEvent: nextEvent
          ? {
              title: nextEvent.title,
              time: new Date(nextEvent.date).toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : null,
        householdStatus: {
          doors: "locked" as const,
          windows: "closed" as const,
          alarm: phase === "night" ? ("armed" as const) : ("disarmed" as const),
        },
        extra,
      },
    });
  } catch (error) {
    console.error("[Display Context API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}

function getPhaseFromHour(hour: number): "morning" | "day" | "evening" | "night" {
  if (hour >= 6 && hour < 10) return "morning";
  if (hour >= 10 && hour < 18) return "day";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}
