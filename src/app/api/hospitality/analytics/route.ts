/* ═══════════════════════════════════════════════════════
   MAELLIS — Hospitality Analytics API

   GET /api/hospitality/analytics

   Returns aggregated analytics data for the hospitality dashboard:
   - KPIs: average score, satisfaction rate, total stays, total alerts
   - Recent daily checks with sentiment and scores
   - Stay review reports summary
   - Recent host alerts with status
   - Recurring issues (most common pain points)
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
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

    // 1. KPIs
    const [completedChecks, positiveChecks, totalAlerts, totalReports] =
      await Promise.all([
        // All completed daily checks
        db.dailyCheck.count({
          where: {
            householdId,
            status: "completed",
            overallScore: { not: null },
          },
        }),
        // Positive checks (score >= 4 or sentiment positive)
        db.dailyCheck.count({
          where: {
            householdId,
            status: "completed",
            OR: [
              { overallScore: { gte: 4 } },
              { sentiment: "positive" },
            ],
          },
        }),
        // Total alerts
        db.hostAlert.count({
          where: { householdId },
        }),
        // Total reports
        db.stayReviewReport.count({
          where: { householdId },
        }),
      ]);

    // Average score
    const scoreAgg = await db.dailyCheck.aggregate({
      where: {
        householdId,
        status: "completed",
        overallScore: { not: null },
      },
      _avg: { overallScore: true },
    });

    const averageScore =
      scoreAgg._avg.overallScore !== null
        ? Math.round(scoreAgg._avg.overallScore * 100) / 100
        : 0;

    const satisfactionRate =
      completedChecks > 0
        ? Math.round((positiveChecks / completedChecks) * 100)
        : 0;

    // Count unique stays with checks
    const uniqueStays = await db.dailyCheck.groupBy({
      by: ["checkInStateId"],
      where: {
        householdId,
        status: "completed",
        checkInStateId: { not: null },
      },
    });

    // 2. Recent daily checks (last 20)
    const recentChecks = await db.dailyCheck.findMany({
      where: { householdId },
      orderBy: { checkDate: "desc" },
      take: 20,
      select: {
        id: true,
        guestName: true,
        checkType: true,
        checkDate: true,
        status: true,
        overallScore: true,
        sentiment: true,
        aiSummary: true,
        hostAlerted: true,
        resolved: true,
      },
    });

    // 3. Stay review reports summary
    const reports = await db.stayReviewReport.findMany({
      where: { householdId },
      orderBy: { generatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        guestName: true,
        checkInAt: true,
        checkOutAt: true,
        overallScore: true,
        sentiment: true,
        cleanliness: true,
        comfort: true,
        equipment: true,
        location: true,
        hostContact: true,
        valueForMoney: true,
        highlights: true,
        painPoints: true,
        aiSummary: true,
        recommendation: true,
        dailyCheckCount: true,
        totalAlerts: true,
        resolvedAlerts: true,
        generatedAt: true,
      },
    });

    // 4. Recent host alerts
    const recentAlerts = await db.hostAlert.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        guestName: true,
        severity: true,
        category: true,
        message: true,
        status: true,
        createdAt: true,
        acknowledgedAt: true,
        resolvedAt: true,
        resolution: true,
      },
    });

    // 5. Recurring issues — aggregate from all completed checks
    const allCompletedChecks = await db.dailyCheck.findMany({
      where: {
        householdId,
        status: "completed",
        issues: { not: "[]" },
      },
      select: { issues: true },
    });

    const issueCounts = new Map<string, number>();
    for (const check of allCompletedChecks) {
      try {
        const issues: string[] = JSON.parse(check.issues);
        for (const issue of issues) {
          const normalized = issue.trim().toLowerCase();
          if (normalized) {
            issueCounts.set(
              normalized,
              (issueCounts.get(normalized) || 0) + 1
            );
          }
        }
      } catch {
        // Skip malformed issues
      }
    }

    const recurringIssues = Array.from(issueCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([issue, count]) => ({
        issue,
        count,
        label: issue.charAt(0).toUpperCase() + issue.slice(1),
      }));

    // 6. Sentiment distribution
    const sentimentCounts = await db.dailyCheck.groupBy({
      by: ["sentiment"],
      where: {
        householdId,
        status: "completed",
        sentiment: { not: null },
      },
      _count: { sentiment: true },
    });

    const sentimentDistribution = sentimentCounts.map((s) => ({
      sentiment: s.sentiment,
      count: s._count.sentiment,
    }));

    // 7. Alerts by severity
    const severityCounts = await db.hostAlert.groupBy({
      by: ["severity"],
      where: { householdId },
      _count: { severity: true },
    });

    const alertSeverityDistribution = severityCounts.map((s) => ({
      severity: s.severity,
      count: s._count.severity,
    }));

    // 8. Category score averages
    const allReportsForCategoryAvg = await db.stayReviewReport.findMany({
      where: {
        householdId,
        overallScore: { not: null },
      },
      select: {
        cleanliness: true,
        comfort: true,
        equipment: true,
        location: true,
        hostContact: true,
        valueForMoney: true,
      },
    });

    const categoryAvg = {
      cleanliness: 0,
      comfort: 0,
      equipment: 0,
      location: 0,
      hostContact: 0,
      valueForMoney: 0,
    };

    if (allReportsForCategoryAvg.length > 0) {
      const sum = { cleanliness: 0, comfort: 0, equipment: 0, location: 0, hostContact: 0, valueForMoney: 0 };
      for (const report of allReportsForCategoryAvg) {
        sum.cleanliness += report.cleanliness || 0;
        sum.comfort += report.comfort || 0;
        sum.equipment += report.equipment || 0;
        sum.location += report.location || 0;
        sum.hostContact += report.hostContact || 0;
        sum.valueForMoney += report.valueForMoney || 0;
      }
      const n = allReportsForCategoryAvg.length;
      categoryAvg.cleanliness = Math.round((sum.cleanliness / n) * 100) / 100;
      categoryAvg.comfort = Math.round((sum.comfort / n) * 100) / 100;
      categoryAvg.equipment = Math.round((sum.equipment / n) * 100) / 100;
      categoryAvg.location = Math.round((sum.location / n) * 100) / 100;
      categoryAvg.hostContact = Math.round((sum.hostContact / n) * 100) / 100;
      categoryAvg.valueForMoney = Math.round((sum.valueForMoney / n) * 100) / 100;
    }

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          averageScore,
          satisfactionRate,
          totalStaysAnalyzed: uniqueStays.length,
          totalAlerts,
          totalReports,
          completedChecks,
        },
        recentChecks,
        reports,
        recentAlerts,
        recurringIssues,
        sentimentDistribution,
        alertSeverityDistribution,
        categoryAverages: categoryAvg,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Hospitality Analytics] Error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
