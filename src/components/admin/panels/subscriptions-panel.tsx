'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, Sparkles, Star, Gem, RefreshCw, Check,
  ArrowRight, Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/shared/glass-card';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface PlanDefinition {
  id: string;
  name: string;
  priceCents: number;
  icon: typeof Crown;
  features: string[];
  color: string;
  bg: string;
  borderColor: string;
  badgeColor: string;
}

interface SubscriptionData {
  plans: Array<{
    id: string;
    name: string;
    priceCents: number;
    features: string[];
    counts: Record<string, number>;
  }>;
}

/* ═══════════════════════════════════════════════════════
   PLAN DEFINITIONS
   ═══════════════════════════════════════════════════════ */

const planDefs: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Gratuit',
    priceCents: 0,
    icon: Sparkles,
    features: ['1 foyer', '2 utilisateurs', '3 zones QR', 'Assistant basique'],
    color: 'text-muted-foreground',
    bg: 'bg-muted/30',
    borderColor: 'border-border',
    badgeColor: 'bg-muted/80 text-muted-foreground',
  },
  {
    id: 'starter',
    name: 'Starter',
    priceCents: 1900,
    icon: Star,
    features: ['1 foyer', '5 utilisateurs', '10 zones QR', 'Assistance email', 'IA conversationnelle'],
    color: 'text-blue-500',
    bg: 'bg-blue-500/5',
    borderColor: 'border-blue-500/20',
    badgeColor: 'bg-blue-500/10 text-blue-500',
  },
  {
    id: 'comfort',
    name: 'Confort',
    priceCents: 4900,
    icon: Crown,
    features: ['1 foyer', 'Utilisateurs illimités', 'Zones illimitées', 'Assistance prioritaire', 'IA vocale avancée', 'Tablette affichage', 'Recettes IA'],
    color: 'text-[var(--accent-primary)]',
    bg: 'bg-[var(--accent-primary)]/5',
    borderColor: 'border-[var(--accent-primary)]/20',
    badgeColor: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]',
  },
  {
    id: 'prestige',
    name: 'Prestige',
    priceCents: 9900,
    icon: Gem,
    features: ['Foyers multiples', 'Tout illimité', 'Conciergerie IA complète', 'API complète', 'Support dédié', 'Modules hospitalité', 'Analytics avancés', 'Personnalisation blanche'],
    color: 'text-copper',
    bg: 'bg-copper/5',
    borderColor: 'border-copper/20',
    badgeColor: 'bg-copper/10 text-copper',
  },
];

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const formatPrice = (cents: number) => {
  if (cents === 0) return 'Gratuit';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
};

const tierOrder: Record<string, number> = { free: 0, starter: 1, comfort: 2, prestige: 3, pro: 4 };

/* ═══════════════════════════════════════════════════════
   SUBSCRIPTIONS PANEL
   ═══════════════════════════════════════════════════════ */

export function SubscriptionsPanel() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  const handleChangePlan = async (householdId: string, newPlan: string) => {
    setActionLoading(householdId);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId, plan: newPlan, action: 'upgrade' }),
      });
      if (res.ok) {
        toast.success(`Plan changé vers ${newPlan}`);
        fetchSubscriptions();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Erreur');
      }
    } catch { toast.error('Erreur réseau'); } finally {
      setActionLoading(null);
    }
  };

  const totalSubscribers = data?.plans?.reduce(
    (sum, p) => sum + (p.counts.active || 0) + (p.counts.trialing || 0), 0
  ) || 0;

  const totalMRR = data?.plans?.reduce((sum, p) => {
    const active = p.counts.active || 0;
    const trialing = p.counts.trialing || 0;
    return sum + (active + trialing) * p.priceCents;
  }, 0) || 0;

  return (
    <div className="space-y-6">
      {/* ═══ SUMMARY CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <GlassCard className="p-5">
            <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium">MRR estimé</p>
            <p className="text-2xl font-serif font-bold mt-1 text-[var(--accent-primary)]">
              {loading ? '—' : formatPrice(totalMRR)}
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">Revenu mensuel récurrent</p>
          </GlassCard>
        </motion.div>
        <motion.div custom={0.06} variants={fadeUp} initial="hidden" animate="visible">
          <GlassCard className="p-5">
            <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium">Abonnés actifs</p>
            <p className="text-2xl font-serif font-bold mt-1 text-emerald-500">
              {loading ? '—' : totalSubscribers}
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">actifs + en essai</p>
          </GlassCard>
        </motion.div>
        <motion.div custom={0.12} variants={fadeUp} initial="hidden" animate="visible">
          <GlassCard className="p-5">
            <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium">Plans disponibles</p>
            <p className="text-2xl font-serif font-bold mt-1 text-foreground">{planDefs.length}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">Gratuit → Prestige</p>
          </GlassCard>
        </motion.div>
      </div>

      {/* ═══ PLAN CARDS ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {planDefs.map((plan, i) => {
          const Icon = plan.icon;
          const planData = data?.plans?.find((p) => p.id === plan.id);
          const activeCount = planData?.counts?.active || 0;
          const trialingCount = planData?.counts?.trialing || 0;
          const pastDueCount = planData?.counts?.past_due || 0;

          return (
            <motion.div
              key={plan.id}
              custom={0.2 + i * 0.08}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <GlassCard className={`p-6 ${plan.borderColor} relative overflow-hidden`}>
                {/* Popular badge for Comfort */}
                {plan.id === 'comfort' && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-[var(--accent-primary)] text-white border-0 text-[9px] px-2 py-0.5 rounded-full">
                      Populaire
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-xl ${plan.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${plan.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {loading ? '...' : `${activeCount + trialingCount} abonné${activeCount + trialingCount !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <span className={`text-3xl font-serif font-bold ${plan.color}`}>
                    {formatPrice(plan.priceCents)}
                  </span>
                  {plan.priceCents > 0 && (
                    <span className="text-sm text-muted-foreground">/mois</span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className={`w-4 h-4 shrink-0 ${plan.color}`} />
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* Stats */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-emerald-500">{activeCount}</p>
                    <p className="text-[10px] text-muted-foreground">Actifs</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-blue-500">{trialingCount}</p>
                    <p className="text-[10px] text-muted-foreground">Essais</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-red-500">{pastDueCount}</p>
                    <p className="text-[10px] text-muted-foreground">Retard</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
