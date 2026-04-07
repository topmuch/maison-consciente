/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Admin Analytics API

   GET /api/admin/analytics
   Platform-wide analytics for superadmin dashboards.
   Cached for 5 minutes in Redis.
   ═══════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { requireRole } from "@/core/auth/guards";
import { db } from "@/core/db";
import { cache, cacheSet } from "@/lib/redis";

const CACHE_KEY = "admin:analytics";
const CACHE_TTL = 300; // 5 minutes

interface AnalyticsData {
  totalHouseholds: number;
  totalUsers: number;
  totalInteractions: number;
  totalZones: number;
  totalMessages: number;
  subscriptionsByPlan: Record<string, number>;
  subscriptionsByStatus: Record<string, number>;
  householdsByType: Record<string, number>;
  newRegistrations7d: number;
}

export async function GET() {
  try {
    /* ── Auth: superadmin only ── */
    await requireRole("superadmin");

    /* ── Aggregation queries (cached 5min) ── */
    const data = await cache<AnalyticsData>(CACHE_KEY, CACHE_TTL, async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalHouseholds,
        totalUsers,
        totalInteractions,
        totalZones,
        totalMessages,
        newRegistrations7d,
        households,
      ] = await Promise.all([
        db.household.count(),
        db.user.count(),
        db.interaction.count(),
        db.zone.count(),
        db.message.count(),
        db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        db.household.findMany({
          select: {
            type: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        }),
      ]);

      /* ── Build breakdown objects ── */
      const subscriptionsByPlan: Record<string, number> = {};
      const subscriptionsByStatus: Record<string, number> = {};
      const householdsByType: Record<string, number> = {};

      for (const h of households) {
        // Plan breakdown
        const plan = h.subscriptionPlan || "free";
        subscriptionsByPlan[plan] = (subscriptionsByPlan[plan] || 0) + 1;

        // Status breakdown
        const status = h.subscriptionStatus || "inactive";
        subscriptionsByStatus[status] = (subscriptionsByStatus[status] || 0) + 1;

        // Type breakdown
        const type = h.type || "home";
        householdsByType[type] = (householdsByType[type] || 0) + 1;
      }

      return {
        totalHouseholds,
        totalUsers,
        totalInteractions,
        totalZones,
        totalMessages,
        subscriptionsByPlan,
        subscriptionsByStatus,
        householdsByType,
        newRegistrations7d,
      };
    });

    return NextResponse.json({ success: true, analytics: data });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN" || error.message === "NO_HOUSEHOLD") {
        return NextResponse.json({ success: false, error: "Accès refusé" }, { status: 403 });
      }
    }
    console.error("[ADMIN ANALYTICS] Error:", error);
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
