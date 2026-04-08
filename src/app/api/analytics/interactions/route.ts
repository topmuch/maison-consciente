import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { requireHousehold } from '@/core/auth/guards';

/* ═══════════════════════════════════════════════════════
   API — /api/analytics/interactions
   
   Returns scan analytics: totals, zone breakdown, hourly
   distribution, and daily trend for the last 7 or 30 days.
   ═══════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    if (!householdId) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const days = period === '30d' ? 30 : 7;

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    // 1. Total scans in period
    const totalScans = await db.interaction.count({
      where: {
        zone: { householdId },
        createdAt: { gte: since },
      },
    });

    // 2. Scans grouped by zone
    const zoneGroups = await db.interaction.groupBy({
      by: ['zoneId'],
      where: {
        zone: { householdId },
        createdAt: { gte: since },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    // Resolve zone names
    const zoneIds = zoneGroups.map((g) => g.zoneId);
    const zones = zoneIds.length > 0
      ? await db.zone.findMany({
          where: { id: { in: zoneIds } },
          select: { id: true, name: true },
        })
      : [];

    const zoneMap = new Map(zones.map((z) => [z.id, z.name]));

    const zoneStats = zoneGroups.map((g) => ({
      zoneId: g.zoneId,
      zoneName: zoneMap.get(g.zoneId) || 'Inconnue',
      count: g._count.id,
    }));

    // 3. Hourly distribution (0-23)
    const allInteractions = await db.interaction.findMany({
      where: {
        zone: { householdId },
        createdAt: { gte: since },
      },
      select: { createdAt: true },
    });

    const hourlyCounts = new Array(24).fill(0) as number[];
    for (const interaction of allInteractions) {
      const hour = interaction.createdAt.getHours();
      hourlyCounts[hour]++;
    }

    const hourlyStats = hourlyCounts.map((scans, hour) => ({
      hour,
      label: `${hour}h`,
      scans,
    }));

    // 4. Daily trend
    const dailyCounts = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyCounts.set(key, 0);
    }

    for (const interaction of allInteractions) {
      const key = interaction.createdAt.toISOString().split('T')[0];
      if (dailyCounts.has(key)) {
        dailyCounts.set(key, (dailyCounts.get(key) || 0) + 1);
      }
    }

    const dailyStats = Array.from(dailyCounts.entries()).map(([date, scans]) => {
      const d = new Date(date + 'T12:00:00');
      return {
        date,
        label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        scans,
      };
    });

    // 5. Peak hour & top zone
    let peakHour: { hour: number; scans: number } | null = null;
    let maxHourly = 0;
    for (let h = 0; h < 24; h++) {
      if (hourlyCounts[h] > maxHourly) {
        maxHourly = hourlyCounts[h];
        peakHour = { hour: h, scans: hourlyCounts[h] };
      }
    }

    const topZone = zoneStats.length > 0
      ? { name: zoneStats[0].zoneName, count: zoneStats[0].count }
      : null;

    const periodLabel = period === '30d' ? '30 derniers jours' : '7 derniers jours';

    return NextResponse.json({
      success: true,
      totalScans,
      periodLabel,
      zoneStats,
      hourlyStats,
      dailyStats,
      peakHour,
      topZone,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'NO_HOUSEHOLD')) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }
    console.error('[Analytics] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne' },
      { status: 500 }
    );
  }
}
