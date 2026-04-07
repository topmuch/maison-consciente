'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Star,
  Zap,
  Crown,
  Building2,
  Loader2,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { GoldenButton } from '@/components/shared/golden-button';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/lib/analytics';

/* ═══════════════════════════════════════════════════════
   TYPES & CONFIG
   ═══════════════════════════════════════════════════════ */

interface SubscriptionStatus {
  plan: string;
  status: string;
  endsAt: string | null;
}

interface PlanCardData {
  key: string;
  name: string;
  price: string;
  icon: React.ElementType;
  features: string[];
  popular?: boolean;
  category: 'free' | 'home' | 'hospitality';
}

const ALL_PLANS: PlanCardData[] = [
  {
    key: 'free',
    name: 'Libre',
    price: 'Gratuit',
    icon: Shield,
    category: 'free',
    features: ['1 zone', '3 recettes', 'Messagerie basique', 'Scanner QR'],
  },
  {
    key: 'comfort',
    name: 'Confort',
    price: '4,99€/mois',
    icon: Zap,
    category: 'home',
    features: [
      'Zones illimitées',
      'Audio complet',
      'Recettes illimitées',
      'Humeur & rituels',
    ],
  },
  {
    key: 'prestige',
    name: 'Prestige',
    price: '9,99€/mois',
    icon: Crown,
    category: 'home',
    popular: true,
    features: [
      'Tout Confort',
      'Analytics avancés',
      'Support prioritaire',
      'Accès bêta',
      'Export données',
    ],
  },
  {
    key: 'starter',
    name: 'Starter',
    price: '12€/mois',
    icon: Building2,
    category: 'hospitality',
    features: [
      'Check-in digital',
      'Guide local',
      'Multi-langue',
      '5 chambres',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '29€/mois',
    icon: Star,
    category: 'hospitality',
    popular: true,
    features: [
      'Tout Starter',
      'Chambres illimitées',
      'Analytics',
      'API',
      'White-label',
    ],
  },
];

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/* ═══════════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════════ */

function PricingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="text-center space-y-3">
        <div className="h-8 w-64 mx-auto rounded-lg bg-white/[0.04] animate-pulse" />
        <div className="h-5 w-96 mx-auto rounded-lg bg-white/[0.04] animate-pulse" />
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 space-y-4 bg-white/[0.02] border border-white/[0.06] animate-pulse"
          >
            <div className="h-6 w-24 rounded bg-white/[0.04]" />
            <div className="h-8 w-32 rounded bg-white/[0.04]" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 w-full rounded bg-white/[0.03]" />
              ))}
            </div>
            <div className="h-10 w-full rounded-xl bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PLAN CARD
   ═══════════════════════════════════════════════════════ */

function PlanCard({
  plan,
  currentPlan,
  onChoose,
  onManage,
  isLoading,
}: {
  plan: PlanCardData;
  currentPlan: string;
  onChoose: (planKey: string) => void;
  onManage: () => void;
  isLoading: boolean;
}) {
  const isCurrent = currentPlan === plan.key;
  const isFree = plan.key === 'free';
  const isSubscribed = currentPlan !== 'free' && currentPlan !== '';
  const Icon = plan.icon;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
      className={`
        relative group rounded-2xl p-6 flex flex-col
        transition-all duration-500
        ${
          isCurrent
            ? 'glass-gold border-2 border-[var(--accent-primary)] shadow-[0_0_40px_var(--accent-primary-glow)]'
            : plan.popular
              ? 'glass-strong border border-[var(--accent-primary)]/30 hover:border-[var(--accent-primary)]/50'
              : 'glass border border-white/[0.08] hover:border-white/[0.15]'
        }
      `}
    >
      {/* Popular badge */}
      {plan.popular && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-gold text-[#0a0a12] text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-[oklch(0.78_0.14_85/20%)] border-0">
            Populaire
          </Badge>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-[var(--accent-primary)] text-[#0a0a12] text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-[oklch(0.78_0.14_85/20%)] border-0">
            Plan actuel
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center shrink-0
            ${
              isCurrent
                ? 'bg-[var(--accent-primary)]/20'
                : plan.popular
                  ? 'bg-[var(--accent-primary)]/10'
                  : 'bg-white/[0.06]'
            }
          `}
        >
          <Icon
            className={`w-5 h-5 ${
              isCurrent
                ? 'text-[var(--accent-primary)]'
                : plan.popular
                  ? 'text-[var(--accent-primary)]/70'
                  : 'text-[#64748b]'
            }`}
          />
        </div>
        <div>
          <h3
            className={`font-serif text-lg font-semibold ${
              isCurrent
                ? 'text-gradient-gold'
                : 'text-[#e2e8f0]'
            }`}
          >
            {plan.name}
          </h3>
          {plan.category !== 'free' && (
            <span className="text-[10px] uppercase tracking-widest text-[#64748b]">
              {plan.category === 'home' ? 'Maison' : 'Hospitalité'}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="mb-5">
        <span
          className={`
            font-serif text-3xl font-bold
            ${isCurrent ? 'text-gradient-gold' : 'text-[#f1f5f9]'}
          `}
        >
          {plan.price}
        </span>
      </div>

      {/* Divider */}
      <div className="divider-gold mb-5" />

      {/* Features */}
      <ul className="flex-1 space-y-2.5 mb-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check
              className={`
                w-4 h-4 mt-0.5 shrink-0
                ${
                  isCurrent
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[#475569]'
                }
              `}
            />
            <span className="text-sm text-[#94a3b8] leading-snug">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Action button */}
      <div className="mt-auto">
        {isCurrent ? (
          isSubscribed ? (
            <GoldenButton
              variant="outline"
              size="md"
              onClick={onManage}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4" />
              Gérer l&apos;abonnement
            </GoldenButton>
          ) : (
            <GoldenButton
              variant="outline"
              size="md"
              disabled
              className="w-full opacity-60"
            >
              Plan actuel
            </GoldenButton>
          )
        ) : isFree ? (
          <GoldenButton
            variant="ghost"
            size="md"
            disabled
            className="w-full opacity-40"
          >
            Plan actuel
          </GoldenButton>
        ) : (
          <GoldenButton
            variant="primary"
            size="md"
            onClick={() => onChoose(plan.key)}
            disabled={isLoading}
            loading={isLoading}
            className="w-full"
          >
            Choisir
          </GoldenButton>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   PRICING VIEW
   ═══════════════════════════════════════════════════════ */

export function PricingView() {
  const { householdType } = useAuthStore();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [choosingPlan, setChoosingPlan] = useState<string | null>(null);

  /* ── Fetch subscription status ── */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/status');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch {
      // silently fail — billing is optional
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /* ── Filter plans by household type ── */
  const visiblePlans = ALL_PLANS.filter((p) => {
    if (p.category === 'free') return true;
    if (p.category === 'home' && householdType === 'home') return true;
    if (p.category === 'hospitality' && householdType === 'hospitality') return true;
    return false;
  });

  /* ── Choose plan ── */
  const handleChoose = async (planKey: string) => {
    setChoosingPlan(planKey);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        trackEvent('subscription_started', { plan: planKey });
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Impossible de créer la session de paiement');
      }
    } catch {
      toast.error('Erreur de connexion au service de paiement');
    } finally {
      setChoosingPlan(null);
    }
  };

  /* ── Manage subscription ── */
  const handleManage = async () => {
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Impossible d\'accéder au portail de facturation');
      }
    } catch {
      toast.error('Erreur de connexion au portail');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <PricingSkeleton />
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'free';
  const statusLabel = (() => {
    switch (subscription?.status) {
      case 'active':
        return { text: 'Actif', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' };
      case 'trialing':
        return { text: 'Essai', className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' };
      case 'past_due':
        return { text: 'Paiement en retard', className: 'bg-rose-500/15 text-rose-400 border-rose-500/20' };
      case 'canceled':
        return { text: 'Annulé', className: 'bg-[#64748b]/15 text-[#94a3b8] border-[#64748b]/20' };
      default:
        return null;
    }
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Header ── */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="text-center space-y-3"
      >
        <div className="flex items-center justify-center gap-3">
          <h1 className="font-serif text-gradient-gold text-3xl md:text-4xl font-bold">
            Abonnement
          </h1>
          {statusLabel && (
            <Badge
              variant="outline"
              className={`${statusLabel.className} text-xs`}
            >
              {statusLabel.text}
            </Badge>
          )}
        </div>
        <p className="text-[#64748b] text-sm max-w-lg mx-auto leading-relaxed">
          Choisissez le plan qui correspond à vos besoins.
          {subscription?.endsAt && (
            <span className="block mt-1 text-[#94a3b8]">
              Renouvellement le{' '}
              {new Date(subscription.endsAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          )}
        </p>
      </motion.div>

      {/* ── Plan Grid ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {visiblePlans.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            currentPlan={currentPlan}
            onChoose={handleChoose}
            onManage={handleManage}
            isLoading={choosingPlan === plan.key}
          />
        ))}
      </motion.div>

      {/* ── Footer Note ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-center"
      >
        <p className="text-[11px] text-[#475569]/60 tracking-wide">
          Tous les plans incluent le scanner QR, la messagerie et les mises à jour.
          Annulation possible à tout moment.
        </p>
      </motion.div>
    </div>
  );
}
