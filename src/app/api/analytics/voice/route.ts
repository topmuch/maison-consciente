import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireHousehold } from '@/core/auth/guards';

/* ═══════════════════════════════════════════════════════
   API — /api/analytics/voice
   
   Returns voice analytics for the authenticated household:
   - Total questions this week (last 7 days)
   - Top intents by count
   - Questions by day
   - Success rate
   - Average per day
   - Most active hour
   - Recent questions (last 10)
   ═══════════════════════════════════════════════════════ */

export async function GET() {
  try {
    const { householdId } = await requireHousehold();
    if (!householdId) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Last 7 days window
    const now = new Date();
    const since = new Date();
    since.setDate(since.getDate() - 7);
    since.setHours(0, 0, 0, 0);

    // 1. Fetch all voice logs for this week
    const weekLogs = await prisma.voiceLog.findMany({
      where: {
        householdId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalQuestions = weekLogs.length;

    // 2. Top intents (grouped by intent, sorted by count desc)
    const intentCounts = new Map<string, number>();
    for (const log of weekLogs) {
      intentCounts.set(log.intent, (intentCounts.get(log.intent) || 0) + 1);
    }
    const topIntents = Array.from(intentCounts.entries())
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 3. Questions by day (last 7 days, fill zeros)
    const dailyCounts = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().split('T')[0];
      dailyCounts.set(key, 0);
    }
    for (const log of weekLogs) {
      const key = log.createdAt.toISOString().split('T')[0];
      if (dailyCounts.has(key)) {
        dailyCounts.set(key, (dailyCounts.get(key) || 0) + 1);
      }
    }
    const questionsByDay = Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }));

    // 4. Success rate
    const successCount = weekLogs.filter((l) => l.success).length;
    const successRate = totalQuestions > 0
      ? Math.round((successCount / totalQuestions) * 100)
      : 0;

    // 5. Average per day
    const avgPerDay = totalQuestions > 0
      ? Math.round((totalQuestions / 7) * 10) / 10
      : 0;

    // 6. Most active hour
    const hourlyCounts = new Array(24).fill(0) as number[];
    for (const log of weekLogs) {
      const hour = log.createdAt.getHours();
      hourlyCounts[hour]++;
    }
    let mostActiveHour = 0;
    let maxHourly = 0;
    for (let h = 0; h < 24; h++) {
      if (hourlyCounts[h] > maxHourly) {
        maxHourly = hourlyCounts[h];
        mostActiveHour = h;
      }
    }

    // 7. Recent questions (last 10)
    const recentLogs = await prisma.voiceLog.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        originalText: true,
        intent: true,
        success: true,
        createdAt: true,
      },
    });
    const recentQuestions = recentLogs.map((log) => ({
      text: log.originalText,
      intent: log.intent,
      success: log.success,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalQuestions,
        topIntents,
        questionsByDay,
        successRate,
        avgPerDay,
        mostActiveHour,
        recentQuestions,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'NO_HOUSEHOLD')) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }
    console.error('[Analytics Voice] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne' },
      { status: 500 }
    );
  }
}
