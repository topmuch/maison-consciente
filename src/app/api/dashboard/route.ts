import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHousehold } from "@/core/auth/guards";
import { fetchWeather, generateDashboardSuggestion } from "@/lib/conscious-engine";
import { cache } from "@/lib/redis";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Dashboard Overview API

   GET /api/dashboard
   Returns: active users, recent messages, weather, suggestion
   
   POST /api/dashboard/messages/mark-read
   Marks all unread messages as read
   
   POST /api/dashboard/ambiance
   Trigger ambiance (reserved for future use)
   ═══════════════════════════════════════════════════════ */

export async function GET() {
  try {
    const { householdId } = await requireHousehold();

    // Active presence: users who scanned in the last 2 hours (cached 15s)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const activeUsers = await cache(
      `dashboard:presence:${householdId}`,
      15,
      () => db.user.findMany({
        where: {
          householdId: householdId!,
          interactions: { some: { createdAt: { gte: twoHoursAgo } } },
        },
        select: { id: true, name: true, email: true, role: true, avatar: true },
      })
    );

    // Wall messages (cached 30s)
    const wallMessages = await cache(
      `dashboard:wall:${householdId}`,
      30,
      () => db.message.findMany({
        where: { householdId: householdId! },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { sender: { select: { id: true, name: true, email: true, avatar: true } } },
      })
    );

    // Recent unread messages
    const recentMessages = await cache(
      `dashboard:unread:${householdId}`,
      15,
      () => db.message.findMany({
        where: { householdId: householdId!, isRead: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { sender: { select: { id: true, name: true, email: true, avatar: true } } },
      })
    );

    // Weather & suggestion (parallel, non-blocking)
    const [weather, suggestion] = await Promise.all([
      fetchWeather().catch(() => null),
      Promise.resolve(
        generateDashboardSuggestion("Dashboard", activeUsers.length)
      ),
    ]);

    return NextResponse.json({
      success: true,
      overview: {
        activeUsersCount: activeUsers.length,
        activeUsers,
        recentMessages,
        wallMessages,
        weather,
        suggestion,
        householdId,
      },
    });
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
    console.error("Dashboard overview error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/* Mark all messages as read */
export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const body = await request.json().catch(() => ({}));

    if (body.action === "mark-read") {
      await db.message.updateMany({
        where: { householdId: householdId!, isRead: false },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Action non reconnue" },
      { status: 400 }
    );
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
    console.error("Dashboard POST error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
