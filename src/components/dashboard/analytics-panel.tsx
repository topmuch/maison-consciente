'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Mic,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface VoiceStats {
  totalQuestions: number;
  topIntents: Array<{ intent: string; count: number }>;
  questionsByDay: Array<{ date: string; count: number }>;
  successRate: number;
  avgPerDay: number;
  mostActiveHour: number;
  recentQuestions: Array<{
    text: string;
    intent: string;
    success: boolean;
    createdAt: string;
  }>;
}

interface AnalyticsResponse {
  success: boolean;
  stats: VoiceStats;
}

/* ═══════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════ */

function useAnimatedCounter(target: number, duration: number = 1200, decimals: number = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      setValue(decimals > 0
        ? Math.round(current * Math.pow(10, decimals)) / Math.pow(10, decimals)
        : Math.round(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals]);

  return value;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}h`;
}

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const s = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

/* ═══════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════ */

function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  iconBg,
  iconColor,
  delay,
  decimals,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  delay: number;
  decimals?: number;
}) {
  const animatedValue = useAnimatedCounter(value, 1400, decimals);

  return (
    <motion.div custom={delay} variants={fadeUp} initial="hidden" animate="visible">
      <Card className="glass border-white/[0.06] bg-black/20 backdrop-blur-xl inner-glow hover:shadow-[0_0_24px_oklch(0.78_0.14_85/10%)] transition-shadow duration-500">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${iconBg}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
          </div>
          <p className="text-xs text-[oklch(0.55_0.02_260)] uppercase tracking-wider font-medium mb-1">
            {label}
          </p>
          <p className="text-3xl font-serif font-bold tracking-tight text-foreground">
            {animatedValue.toLocaleString('fr-FR', {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
            {suffix && <span className="text-lg ml-1 text-[oklch(0.55_0.02_260)]">{suffix}</span>}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   BAR CHART (Questions by Day)
   ═══════════════════════════════════════════════════════ */

function DailyBarChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <motion.div
          key={item.date}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
          className="flex items-center gap-3"
        >
          <span className="text-xs text-[oklch(0.50_0.02_260)] w-12 shrink-0 font-mono text-right">
            {formatDayLabel(item.date)}
          </span>
          <div className="flex-1 h-7 bg-white/[0.04] rounded-lg overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
              transition={{ delay: 0.4 + i * 0.06, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              className="h-full rounded-lg bg-gradient-to-r from-[var(--accent-primary)]/80 to-[var(--accent-primary)]/50 relative"
            >
              <div className="absolute inset-0 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
            </motion.div>
          </div>
          <span className="text-sm font-semibold text-foreground w-8 text-right tabular-nums">
            {item.count}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TOP INTENTS
   ═══════════════════════════════════════════════════════ */

function TopIntentsList({ intents }: { intents: Array<{ intent: string; count: number }> }) {
  const maxCount = Math.max(...intents.map((i) => i.count), 1);

  return (
    <div className="space-y-3">
      {intents.map((item, i) => (
        <motion.div
          key={item.intent}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="w-20 shrink-0">
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wider font-semibold border-[var(--accent-primary)]/20 text-[var(--accent-primary)]/90 bg-[var(--accent-primary)]/[0.06] rounded-md px-2 py-0.5"
            >
              {item.intent}
            </Badge>
          </div>
          <div className="flex-1 h-5 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.count / maxCount) * 100}%` }}
              transition={{ delay: 0.4 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-amber-500/70 to-amber-400/40"
            />
          </div>
          <span className="text-xs font-mono font-semibold text-[oklch(0.70_0.02_260)] w-8 text-right">
            {item.count}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RECENT QUESTIONS
   ═══════════════════════════════════════════════════════ */

function RecentQuestionsList({ questions }: { questions: VoiceStats['recentQuestions'] }) {
  if (questions.length === 0) {
    return (
      <div className="py-10 text-center">
        <MessageSquare className="w-8 h-8 text-[oklch(0.30_0.02_260)] mx-auto mb-3" />
        <p className="text-sm text-[oklch(0.50_0.02_260)] italic">
          Aucune question vocale enregistrée.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {questions.map((q, i) => (
        <motion.div
          key={`${q.createdAt}-${i}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.04, duration: 0.35 }}
          className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-white/[0.03] transition-colors duration-300"
        >
          <div className="mt-0.5 shrink-0">
            {q.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-500/80" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400/80" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground/90 truncate">&ldquo;{q.text}&rdquo;</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-[9px] uppercase tracking-wider font-medium border-white/[0.08] text-[oklch(0.50_0.02_260)] rounded-md px-1.5 py-0"
              >
                {q.intent}
              </Badge>
              <span className="text-[10px] text-[oklch(0.40_0.02_260)] font-mono">
                {relativeTime(q.createdAt)}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════════ */

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-xl bg-white/[0.06]" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-64 bg-white/[0.06]" />
          <Skeleton className="h-4 w-80 bg-white/[0.06]" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glass border-white/[0.06] bg-black/20">
            <CardContent className="p-5">
              <Skeleton className="h-11 w-11 rounded-xl bg-white/[0.06] mb-4" />
              <Skeleton className="h-3 w-24 bg-white/[0.06] mb-2" />
              <Skeleton className="h-8 w-16 bg-white/[0.06]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass border-white/[0.06] bg-black/20">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40 bg-white/[0.06]" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-12 bg-white/[0.06]" />
                <Skeleton className="h-7 flex-1 bg-white/[0.06] rounded-lg" />
                <Skeleton className="h-3 w-6 bg-white/[0.06]" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass border-white/[0.06] bg-black/20">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40 bg-white/[0.06]" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-16 bg-white/[0.06] rounded-md" />
                <Skeleton className="h-5 flex-1 bg-white/[0.06] rounded-full" />
                <Skeleton className="h-3 w-6 bg-white/[0.06]" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent */}
      <Card className="glass border-white/[0.06] bg-black/20">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48 bg-white/[0.06]" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-4 w-4 rounded-full bg-white/[0.06] mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-56 bg-white/[0.06]" />
                <Skeleton className="h-3 w-20 bg-white/[0.06]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN ANALYTICS PANEL
   ═══════════════════════════════════════════════════════ */

export function AnalyticsPanel() {
  const { setView } = useAppStore();
  const { userName, householdName } = useAuthStore();
  const [stats, setStats] = useState<VoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analytics/voice');
      if (!res.ok) {
        throw new Error('Erreur de chargement');
      }
      const data: AnalyticsResponse = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        setError('Données indisponibles');
      }
    } catch {
      setError('Impossible de charger les analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <AnalyticsSkeleton />
      </div>
    );
  }

  /* ── Error state ── */
  if (error || !stats) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <BarChart3 className="w-12 h-12 text-[oklch(0.30_0.02_260)] mb-4" />
          <p className="text-[oklch(0.60_0.02_260)] mb-4">{error || 'Données indisponibles'}</p>
          <Button
            variant="outline"
            onClick={fetchAnalytics}
            className="rounded-xl border-[var(--accent-primary)]/25 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/[0.08]"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  /* ── Compute values ── */
  const displayHousehold = householdName || userName || 'Maellis';
  const heroSentence = `${displayHousehold} a répondu ${stats.totalQuestions} question${stats.totalQuestions > 1 ? 's' : ''} cette semaine`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ═══ HEADER ═══ */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('dashboard')}
            className="rounded-xl text-[oklch(0.50_0.02_260)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/[0.06] transition-colors duration-300 -ml-2"
            aria-label="Retour au tableau de bord"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Retour
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary-dark)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center glow-gold shrink-0">
            <Mic className="w-6 h-6 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif tracking-tight text-gradient-gold">
              Analytics Vocales
            </h1>
            <p className="text-sm text-[oklch(0.60_0.02_260)] mt-0.5">
              {heroSentence}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ STAT CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Questions cette semaine"
          value={stats.totalQuestions}
          icon={MessageSquare}
          iconBg="bg-[var(--accent-primary)]/15"
          iconColor="text-[var(--accent-primary)]"
          delay={0.05}
        />
        <StatCard
          label="Taux de réussite"
          value={stats.successRate}
          suffix="%"
          icon={TrendingUp}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-500"
          delay={0.1}
        />
        <StatCard
          label="Moyenne / jour"
          value={stats.avgPerDay}
          decimals={1}
          icon={BarChart3}
          iconBg="bg-amber-500/15"
          iconColor="text-amber-500"
          delay={0.15}
        />
        <StatCard
          label="Heure la plus active"
          value={stats.mostActiveHour}
          suffix="h"
          icon={Clock}
          iconBg="bg-violet-500/15"
          iconColor="text-violet-500"
          delay={0.2}
        />
      </div>

      {/* ═══ CHARTS ROW: Daily Bar Chart + Top Intents ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily bar chart */}
        <motion.div custom={0.25} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="glass border-white/[0.06] bg-black/20 backdrop-blur-xl inner-glow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
                <CardTitle className="text-base font-serif text-amber-50">
                  Questions par jour
                </CardTitle>
              </div>
              <p className="text-xs text-[oklch(0.45_0.02_260)] mt-1">
                7 derniers jours
              </p>
            </CardHeader>
            <CardContent>
              {stats.questionsByDay.length > 0 ? (
                <DailyBarChart data={stats.questionsByDay} />
              ) : (
                <div className="py-8 text-center text-sm text-[oklch(0.50_0.02_260)] italic">
                  Aucune donnée cette semaine.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top intents */}
        <motion.div custom={0.3} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="glass border-white/[0.06] bg-black/20 backdrop-blur-xl inner-glow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <Mic className="w-5 h-5 text-[var(--accent-primary)]" />
                <CardTitle className="text-base font-serif text-amber-50">
                  Intentions les plus posées
                </CardTitle>
              </div>
              <p className="text-xs text-[oklch(0.45_0.02_260)] mt-1">
                Top {stats.topIntents.length} intentions
              </p>
            </CardHeader>
            <CardContent>
              {stats.topIntents.length > 0 ? (
                <TopIntentsList intents={stats.topIntents} />
              ) : (
                <div className="py-8 text-center text-sm text-[oklch(0.50_0.02_260)] italic">
                  Aucune intention enregistrée.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ═══ RECENT QUESTIONS ═══ */}
      <motion.div custom={0.35} variants={fadeUp} initial="hidden" animate="visible">
        <Card className="glass border-white/[0.06] bg-black/20 backdrop-blur-xl inner-glow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />
                <CardTitle className="text-base font-serif text-amber-50">
                  Questions récentes
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-white/[0.08] text-[oklch(0.45_0.02_260)] rounded-md px-2 py-0.5"
              >
                10 dernières
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto scrollbar-luxe">
            <RecentQuestionsList questions={stats.recentQuestions} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default AnalyticsPanel;
