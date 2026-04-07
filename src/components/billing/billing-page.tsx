'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  ExternalLink,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Loader2,
  Crown,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GoldenButton } from '@/components/shared/golden-button';
import { useAuthStore } from '@/store/auth-store';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface Invoice {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

interface SubscriptionStatus {
  plan: string;
  status: string;
  endsAt: string | null;
}

/* ═══════════════════════════════════════════════════════
   STATUS CONFIG
   ═══════════════════════════════════════════════════════ */

const invoiceStatusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  paid: { label: 'Payée', icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  open: { label: 'En attente', icon: Clock, className: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  past_due: { label: 'En retard', icon: AlertCircle, className: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
  void: { label: 'Annulée', icon: XCircle, className: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
};

const subscriptionStatusLabels: Record<string, { text: string; className: string }> = {
  active: { text: 'Actif', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  trialing: { text: 'Essai', className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  past_due: { text: 'Paiement en retard', className: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
  canceled: { text: 'Annulé', className: 'bg-[#64748b]/15 text-[#94a3b8] border-[#64748b]/20' },
};

const planLabels: Record<string, string> = {
  free: 'Libre',
  comfort: 'Confort',
  prestige: 'Prestige',
  starter: 'Starter',
  pro: 'Pro',
};

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
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

function BillingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="text-center space-y-3">
        <div className="h-8 w-64 mx-auto rounded-lg bg-white/[0.04] animate-pulse" />
        <div className="h-5 w-80 mx-auto rounded-lg bg-white/[0.04] animate-pulse" />
      </div>

      {/* Subscription card skeleton */}
      <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/[0.06] animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 rounded bg-white/[0.04]" />
          <div className="h-6 w-20 rounded-full bg-white/[0.04]" />
        </div>
        <div className="h-10 w-48 rounded-xl bg-white/[0.04]" />
      </div>

      {/* Invoice list skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-48 rounded bg-white/[0.04] animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 bg-white/[0.02] border border-white/[0.06] animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 w-32 rounded bg-white/[0.04]" />
                <div className="h-4 w-48 rounded bg-white/[0.03]" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-20 rounded bg-white/[0.04]" />
                <div className="h-8 w-24 rounded-lg bg-white/[0.04]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   INVOICE ROW
   ═══════════════════════════════════════════════════════ */

function InvoiceRow({
  invoice,
  index,
}: {
  invoice: Invoice;
  index: number;
}) {
  const status = invoiceStatusConfig[invoice.status] || invoiceStatusConfig.open;
  const StatusIcon = status.icon;
  const amount = (invoice.amountCents / 100).toFixed(2);
  const periodStart = new Date(invoice.periodStart).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const periodEnd = new Date(invoice.periodEnd).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const createdAt = new Date(invoice.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleDownloadPdf = () => {
    window.open(`/api/billing/invoice-pdf?id=${invoice.id}`, '_blank');
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, transition: { duration: 0.25 } }}
      className="
        group rounded-xl p-5
        glass border border-white/[0.08] hover:border-white/[0.15]
        transition-all duration-300
      "
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 group-hover:bg-[var(--accent-primary)]/10 transition-colors">
            <FileText className="w-5 h-5 text-[#64748b] group-hover:text-[var(--accent-primary)] transition-colors" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-[#e2e8f0] truncate">
                N° {invoice.id.slice(0, 8).toUpperCase()}
              </span>
              <Badge
                variant="outline"
                className={`${status.className} text-[10px] px-2 py-0 shrink-0`}
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <p className="text-xs text-[#64748b] truncate">
              {periodStart} — {periodEnd}
              <span className="ml-2 text-[#475569]">· {createdAt}</span>
            </p>
          </div>
        </div>

        {/* Right: Amount + Action */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="font-serif text-lg font-bold text-gradient-gold">{amount} €</p>
          </div>
          <GoldenButton
            variant="ghost"
            size="sm"
            onClick={handleDownloadPdf}
            className="shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </GoldenButton>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   BILLING PAGE
   ═══════════════════════════════════════════════════════ */

export function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  /* ── Fetch billing data ── */
  const fetchBillingData = useCallback(async () => {
    try {
      const [invoicesRes, statusRes] = await Promise.allSettled([
        fetch('/api/billing/invoices'),
        fetch('/api/billing/status'),
      ]);

      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.ok) {
        const data = await invoicesRes.value.json();
        setInvoices(data.invoices || []);
      }

      if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
        const data = await statusRes.value.json();
        setSubscription(data.subscription);
      }
    } catch {
      // silently fail — billing is optional
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  /* ── Open Stripe portal ── */
  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Impossible d'accéder au portail de facturation");
      }
    } catch {
      toast.error('Erreur de connexion au portail');
    } finally {
      setPortalLoading(false);
    }
  };

  /* ── Render loading ── */
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <BillingSkeleton />
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'free';
  const subStatus = subscription?.status || '';
  const statusLabel = subscriptionStatusLabels[subStatus];
  const isSubscribed = currentPlan !== 'free';
  const hasInvoices = invoices.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* ── Header ── */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="text-center space-y-3"
      >
        <div className="flex items-center justify-center gap-3">
          <h1 className="font-serif text-gradient-gold text-3xl md:text-4xl font-bold">
            Facturation
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
          Gérez votre abonnement et consultez vos factures.
        </p>
      </motion.div>

      {/* ── Subscription Card ── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="
          rounded-2xl p-6
          glass-gold border border-[var(--accent-primary)]/30
          shadow-[0_0_30px_var(--accent-primary-glow)]
        "
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center">
              {isSubscribed ? (
                <Crown className="w-6 h-6 text-[var(--accent-primary)]" />
              ) : (
                <CreditCard className="w-6 h-6 text-[#64748b]" />
              )}
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#e2e8f0]">
                Plan {planLabels[currentPlan] || currentPlan}
              </h2>
              {subscription?.endsAt && subStatus !== 'canceled' && (
                <p className="text-xs text-[#64748b] mt-0.5">
                  Renouvellement le{' '}
                  {new Date(subscription.endsAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
              {subStatus === 'canceled' && subscription?.endsAt && (
                <p className="text-xs text-rose-400/70 mt-0.5">
                  Expire le{' '}
                  {new Date(subscription.endsAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
          <div>
            {isSubscribed ? (
              <GoldenButton
                variant="outline"
                size="md"
                onClick={handleManageSubscription}
                loading={portalLoading}
                disabled={portalLoading}
              >
                <ExternalLink className="w-4 h-4" />
                Gérer l&apos;abonnement
              </GoldenButton>
            ) : (
              <GoldenButton variant="ghost" size="md" disabled className="opacity-50">
                Plan gratuit actif
              </GoldenButton>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Invoices Section ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4">
          <Receipt className="w-5 h-5 text-[#64748b]" />
          <h2 className="font-serif text-xl font-semibold text-[#e2e8f0]">
            Historique des factures
          </h2>
          {hasInvoices && (
            <Badge variant="outline" className="bg-white/[0.04] text-[#64748b] text-[10px] px-2 py-0 border-white/[0.08]">
              {invoices.length}
            </Badge>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {!hasInvoices ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="
                rounded-2xl p-12 text-center
                glass border border-white/[0.08]
              "
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                <FileText className="w-8 h-8 text-[#475569]" />
              </div>
              <h3 className="font-serif text-lg text-[#94a3b8] mb-2">
                Aucune facture
              </h3>
              <p className="text-sm text-[#64748b] max-w-sm mx-auto leading-relaxed">
                Vos factures apparaîtront ici après votre premier paiement.
                Elles sont générées automatiquement à chaque renouvellement.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {invoices.map((invoice, index) => (
                <InvoiceRow key={invoice.id} invoice={invoice} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Footer ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-center space-y-2"
      >
        <p className="text-[11px] text-[#475569]/60 tracking-wide">
          TVA non applicable (article 293 B du CGI). Annulation possible à tout moment.
        </p>
        <p className="text-[11px] text-[#475569]/40">
          Besoin d&apos;aide ? Contactez le support via votre portail client Stripe.
        </p>
      </motion.div>
    </div>
  );
}
