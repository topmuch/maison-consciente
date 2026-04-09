'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Volume2,
  VolumeX,
  TrendingUp,
  Loader2,
  CalendarDays,
  Clock,
  MapPin,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useVoiceResponse } from '@/hooks/useVoiceResponse';

interface ScanStat {
  zoneId: string;
  zoneName: string;
  count: number;
}

interface HourlyStat {
  hour: number;
  label: string;
  scans: number;
}

interface DailyStat {
  date: string;
  label: string;
  scans: number;
}

interface AnalyticsData {
  totalScans: number;
  periodLabel: string;
  zoneStats: ScanStat[];
  hourlyStats: HourlyStat[];
  dailyStats: DailyStat[];
  peakHour: { hour: number; scans: number } | null;
  topZone: { name: string; count: number } | null;
}

interface ScanAnalyticsProps {
  householdId: string;
}

type Period = '7d' | '30d';

export function ScanAnalytics({ householdId }: ScanAnalyticsProps) {
  const [period, setPeriod] = useState<Period>('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartError, setChartError] = useState(false);
  const { speak, isMuted, toggleMute, isSpeaking, isSupported: ttsSupported } = useVoiceResponse();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setChartError(false);
    try {
      const res = await fetch(`/api/analytics/interactions?householdId=${householdId}&period=${period}`);
      if (!res.ok) {
        setChartError(true);
        setData(null);
        return;
      }
      const result = await res.json();
      setData(result);
    } catch {
      setChartError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [householdId, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const speakSummary = useCallback(() => {
    if (!data || isMuted) return;
    const days = period === '7d' ? 7 : 30;
    let summary = `Sur les ${days} derniers jours, ${data.totalScans} scans au total.`;
    if (data.topZone) {
      summary += ` Zone la plus active : ${data.topZone.name} avec ${data.topZone.count} scans.`;
    }
    if (data.peakHour) {
      summary += ` Pic d'activité à ${data.peakHour.hour}h.`;
    }
    speak(summary);
  }, [data, period, speak, isMuted]);

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: '#0f172a',
      border: '1px solid oklch(1 0 0 / 8%)',
      borderRadius: '12px',
      color: '#e2e8f0',
      fontSize: '12px',
      padding: '8px 12px',
    },
    itemStyle: { color: '#94a3b8' },
    labelStyle: { color: '#64748b', fontSize: '11px' },
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl inner-glow border-white/[0.06] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-[var(--accent-primary)] animate-spin" />
          </div>
          <div>
            <div className="h-5 w-40 bg-white/[0.06] rounded" />
            <div className="h-3 w-60 bg-white/[0.04] rounded mt-1.5" />
          </div>
        </div>
        <div className="h-48 bg-white/[0.03] rounded-xl" />
      </div>
    );
  }

  if (chartError || !data) {
    return (
      <div className="glass rounded-2xl inner-glow border-white/[0.06] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#f87171]" />
          </div>
          <div>
            <h3 className="text-base font-serif font-semibold text-[#e2e8f0]">Analytics</h3>
            <p className="text-xs text-[#64748b]">Données indisponibles</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.03] text-center">
          <p className="text-sm text-[#64748b]">Impossible de charger les statistiques de scan.</p>
          <p className="text-xs text-[#475569] mt-1">Vérifiez que des interactions ont été enregistrées.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl inner-glow border-white/[0.06] p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-serif font-semibold text-[#e2e8f0]">
              Scan Analytics
            </h3>
            <p className="text-xs text-[#64748b]">
              {data.totalScans} scan{data.totalScans !== 1 ? 's' : ''} · {data.periodLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            {(['7d', '30d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
                  period === p
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20'
                    : 'text-[#64748b] hover:text-[#94a3b8] border border-transparent'
                }`}
              >
                {p === '7d' ? '7 jours' : '30 jours'}
              </button>
            ))}
          </div>

          {/* TTS toggle */}
          {ttsSupported && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMute}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isMuted ? 'bg-white/[0.03] text-[#475569]' : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
              }`}
              title={isMuted ? 'Activer la synthèse vocale' : 'Désactiver la synthèse vocale'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </motion.button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium">Total</span>
          </div>
          <p className="text-xl font-serif font-bold text-[#e2e8f0]">{data.totalScans}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium">Top zone</span>
          </div>
          <p className="text-sm font-serif font-semibold text-[#e2e8f0] truncate">
            {data.topZone?.name || '—'}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-[var(--accent-tertiary)]" />
            <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium">Pic</span>
          </div>
          <p className="text-sm font-serif font-semibold text-[#e2e8f0]">
            {data.peakHour ? `${data.peakHour.hour}h` : '—'}
          </p>
        </div>
      </div>

      {/* Speak summary button */}
      {ttsSupported && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={speakSummary}
          disabled={isSpeaking}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-[#94a3b8] hover:text-[#e2e8f0] hover:border-white/[0.12] transition-all disabled:opacity-50"
        >
          {isSpeaking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
          {isSpeaking ? 'Lecture en cours…' : 'Écouter le résumé'}
        </motion.button>
      )}

      {/* Daily Line Chart */}
      {data.dailyStats.length > 0 && (
        <div>
          <p className="text-xs text-[#64748b] uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5" />
            Évolution quotidienne
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis dataKey="label" stroke="#475569" tick={{ fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke="oklch(0.78 0.14 85)"
                  strokeWidth={2}
                  dot={{ fill: 'oklch(0.78 0.14 85)', r: 3 }}
                  activeDot={{ r: 5, fill: 'oklch(0.78 0.14 85)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Hourly Bar Chart */}
      {data.hourlyStats.length > 0 && (
        <div>
          <p className="text-xs text-[#64748b] uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Répartition horaire
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis dataKey="label" stroke="#475569" tick={{ fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar
                  dataKey="scans"
                  fill="oklch(0.60 0.22 280 / 60%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Zone breakdown */}
      {data.zoneStats.length > 0 && (
        <div>
          <p className="text-xs text-[#64748b] uppercase tracking-wider font-medium mb-3">
            Scans par zone
          </p>
          <div className="space-y-2">
            {data.zoneStats.map((zone) => {
              const maxCount = Math.max(...data.zoneStats.map((z) => z.count));
              const pct = maxCount > 0 ? (zone.count / maxCount) * 100 : 0;
              return (
                <div key={zone.zoneId} className="flex items-center gap-3">
                  <span className="text-xs text-[#94a3b8] w-24 truncate">{zone.zoneName}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
                    />
                  </div>
                  <span className="text-xs font-mono text-[#64748b] w-8 text-right">{zone.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
