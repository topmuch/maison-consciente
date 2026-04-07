import { NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHousehold } from "@/core/auth/guards";

// GET: Return counts and recent activity for household
export async function GET() {
  try {
    const { householdId } = await requireHousehold();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const [totalInteractions, todayInteractions, zoneCount, userCount, recentActivity] = await Promise.all([
      db.interaction.count({
        where: { zone: { householdId: householdId! } },
      }),
      db.interaction.count({
        where: {
          zone: { householdId: householdId! },
          createdAt: { gte: today },
        },
      }),
      db.zone.count({ where: { householdId: householdId! } }),
      db.user.count({ where: { householdId: householdId! } }),
      db.interaction.findMany({
        where: {
          zone: { householdId: householdId! },
          createdAt: { gte: yesterday },
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          zone: { select: { id: true, name: true, icon: true, color: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const unreadMessages = await db.message.count({
      where: {
        householdId: householdId!,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalInteractions,
        todayInteractions,
        zoneCount,
        userCount,
        unreadMessages,
        recentActivity,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Get stats error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
