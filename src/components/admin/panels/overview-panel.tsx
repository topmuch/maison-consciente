'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Home, Users, MapPin, Activity, CreditCard, TrendingUp,
  ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/shared/glass-card';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface EnhancedStats {
  totalHouseholds: number;
  totalUsers: number;
  totalZones: number;
  totalInteractions: number;
  totalInvoices: number;
  paidInvoices: number;
  pastDueInvoices: number;
  totalRevenueCents: number;
  activeSubscriptions: number;
  subscriptionBreakdown: Record<string, number>;
  recentActivity: Array<{
    id: string;
    action: string;
    user?: { name?: string; email?: string } | null;
    household?: { name?: string } | null;
    createdAt: string;
  }>;
  monthlyGrowth: Array<{ month: string; count: number }>;
}

/* ═══════════════════════════════════════════════════════
   ANIMATIONS
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
   HELPERS
   ═══════════════════════════════════════════════════════ */

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
};

const formatDateTime = (iso: string) => {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'login': return 'bg-emerald-500/10 text-emerald-500';
    case 'settings_update': return 'bg-violet-500/10 text-violet-500';
    case 'subscription_change': return 'bg-amber-500/10 text-amber-500';
    case 'vault_access': return 'bg-red-500/10 text-red-500';
    default: return 'bg-muted/80 text-muted-foreground';
  }
};

/* ═══════════════════════════════════════════════════════
   STAT CARDS CONFIG
   ═══════════════════════════════════════════════════════ */

const statCards = [
  { key: 'totalHouseholds', label: 'Foyers actifs', icon: Home, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { key: 'totalUsers', label: 'Utilisateurs', icon: Users, color: 'text-copper', bg: 'bg-copper/10' },
  { key: 'activeSubscriptions', label: 'Abonnements actifs', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { key: 'totalRevenueCents', label: 'Revenus totaux', icon: CreditCard, color: 'text-[var(--accent-primary)]', bg: 'bg-[var(--accent-primary)]/10', format: true },
  { key: 'pastDueInvoices', label: 'Factures en retard', icon: ArrowDownRight, color: 'text-red-500', bg: 'bg-red-500/10' },
  { key: 'totalInteractions', label: 'Interactions', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
] as const;

/* ═══════════════════════════════════════════════════════
   OVERVIEW PANEL
   ═══════════════════════════════════════════════════════ */

interface OverviewPanelProps {
  initialStats: EnhancedStats | null;
}

export function OverviewPanel({ initialStats }: OverviewPanelProps) {
  const [stats, setStats] = useState<EnhancedStats | null>(initialStats);
  const [loading, setLoading] = useState(!initialStats);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || data);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialStats) fetchStats();
  }, [initialStats, fetchStats]);

  const maxGrowth = stats?.monthlyGrowth?.length
    ? Math.max(...stats.monthlyGrowth.map((m) => m.count), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Refresh */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="text-muted-foreground hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const value = stats?.[card.key as keyof EnhancedStats];
          const displayValue = card.format && typeof value === 'number'
            ? formatCurrency(value as number)
            : String(value ?? '—');

          return (
            <motion.div
              key={card.key}
              custom={i * 0.06}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <GlassCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  {card.key === 'activeSubscriptions' && stats && (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px]">
                      <ArrowUpRight className="w-3 h-3 mr-0.5" />
                      actifs
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium mb-1">
                  {card.label}
                </p>
                {loading ? (
                  <Skeleton className="h-8 w-24 bg-muted" />
                ) : (
                  <p className="text-2xl font-serif font-bold text-foreground">
                    {displayValue}
                  </p>
                )}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ TWO COLUMN: SUBSCRIPTION BREAKDOWN + RECENT ACTIVITY ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Breakdown */}
        <motion.div custom={0.4} variants={fadeUp} initial="hidden" animate="visible">
          <GlassCard className="p-5">
            <h3 className="text-base font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
              Répartition abonnements
            </h3>
            <div className="space-y-3">
              {(['free', 'starter', 'comfort', 'prestige', 'pro'] as const).map((plan) => {
                const count = stats?.subscriptionBreakdown?.[plan] || 0;
                const pct = stats?.totalHouseholds ? (count / stats.totalHouseholds) * 100 : 0;
                const planLabel = { free: 'Gratuit', starter: 'Starter', comfort: 'Confort', prestige: 'Prestige', pro: 'Pro' }[plan];
                const barColor = {
                  free: 'bg-muted-foreground/30',
                  starter: 'bg-blue-400',
                  comfort: 'bg-[var(--accent-primary)]',
                  prestige: 'bg-gradient-to-r from-[var(--accent-primary)] to-copper',
                  pro: 'bg-violet-luxe',
                }[plan];

                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground font-medium">{planLabel}</span>
                      <span className="text-xs text-muted-foreground">
                        {count} foyer{count !== 1 ? 's' : ''} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Monthly Growth */}
        <motion.div custom={0.5} variants={fadeUp} initial="hidden" animate="visible">
          <GlassCard className="p-5">
            <h3 className="text-base font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              Croissance mensuelle
            </h3>
            {stats?.monthlyGrowth && stats.monthlyGrowth.length > 0 ? (
              <div className="flex items-end gap-2 h-40">
                {stats.monthlyGrowth.map((m, i) => {
                  const height = maxGrowth > 0 ? (m.count / maxGrowth) * 100 : 5;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{m.count}</span>
                      <motion.div
                        className="w-full rounded-t-lg bg-gradient-to-t from-[var(--accent-primary)]/60 to-[var(--accent-primary)] min-h-[4px]"
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.6, delay: 0.6 + i * 0.08, ease: 'easeOut' }}
                      />
                      <span className="text-[10px] text-muted-foreground">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Aucune donnée de croissance</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* ═══ RECENT ACTIVITY ═══ */}
      <motion.div custom={0.6} variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard className="p-5">
          <h3 className="text-base font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-500" />
            Activité récente
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-luxe">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.03, duration: 0.3 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <Badge className={`shrink-0 text-[9px] font-semibold px-2 py-0.5 rounded-full border-0 ${getActionColor(log.action)}`}>
                    {log.action.replace(/_/g, ' ')}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {log.user?.name || log.user?.email || 'Système'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {log.household?.name || ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </span>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune activité récente</p>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
