'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Filter, RefreshCw, TrendingUp, TrendingDown,
  DollarSign, AlertTriangle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/shared/glass-card';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface Invoice {
  id: string;
  householdName: string;
  subscriptionPlan: string;
  amountCents: number;
  currency: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

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

const formatCurrency = (cents: number, currency: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const getPlanLabel = (plan: string) => {
  const map: Record<string, string> = { free: 'Gratuit', starter: 'Starter', comfort: 'Confort', prestige: 'Prestige', pro: 'Pro' };
  return map[plan] || plan;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-emerald-500/10 text-emerald-500';
    case 'open': return 'bg-blue-500/10 text-blue-500';
    case 'past_due': return 'bg-red-500/10 text-red-500';
    case 'void': return 'bg-muted/80 text-muted-foreground/70';
    default: return 'bg-muted/80 text-muted-foreground';
  }
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = { paid: 'Payé', open: 'Ouvert', past_due: 'En retard', void: 'Annulé' };
  return map[status] || status;
};

/* ═══════════════════════════════════════════════════════
   PAYMENTS PANEL
   ═══════════════════════════════════════════════════════ */

export function PaymentsPanel() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/invoices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const paidTotal = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amountCents, 0);
  const openTotal = invoices.filter((i) => i.status === 'open').reduce((s, i) => s + i.amountCents, 0);
  const pastDueTotal = invoices.filter((i) => i.status === 'past_due').reduce((s, i) => s + i.amountCents, 0);

  return (
    <div className="space-y-6">
      {/* ═══ FINANCIAL SUMMARY ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenus encaissés', value: paidTotal, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'En attente', value: openTotal, icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'En retard', value: pastDueTotal, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Total factures', value: invoices.length, icon: CreditCard, color: 'text-[var(--accent-primary)]', bg: 'bg-[var(--accent-primary)]/10', isCount: true },
        ].map((card, i) => {
          const Icon = card.icon;
          const displayValue = card.isCount ? String(card.value) : formatCurrency(card.value as number, 'EUR');
          return (
            <motion.div key={card.label} custom={i * 0.06} variants={fadeUp} initial="hidden" animate="visible">
              <GlassCard className="p-5">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium mb-1">{card.label}</p>
                <p className={`text-xl font-serif font-bold ${card.color}`}>
                  {loading ? '—' : displayValue}
                </p>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ FILTERS ═══ */}
      <motion.div custom={0.3} variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>Filtrer par statut :</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['', 'paid', 'open', 'past_due', 'void'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={
                    statusFilter === status
                      ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 text-xs rounded-lg'
                      : 'text-muted-foreground hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 text-xs rounded-lg'
                  }
                >
                  {status === '' ? 'Tous' : getStatusLabel(status)}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="icon" onClick={fetchInvoices}
              className="shrink-0 text-muted-foreground hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </GlassCard>
      </motion.div>

      {/* ═══ INVOICE TABLE ═══ */}
      <motion.div custom={0.4} variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard className="overflow-hidden">
          <div className="p-5 pb-4 border-b border-border flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold tracking-tight">Historique des paiements</h2>
              <p className="text-[10px] text-muted-foreground/70">
                {loading ? 'Chargement...' : `${invoices.length} facture${invoices.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          <ScrollArea className="max-h-[480px] overflow-y-auto scrollbar-luxe">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl glass">
                    <Skeleton className="h-10 w-10 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-48 bg-muted" />
                      <Skeleton className="h-3 w-32 bg-muted" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            ) : invoices.length > 0 ? (
              <div className="p-4 space-y-2">
                {invoices.map((inv, i) => (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.02, duration: 0.3 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl hover:bg-muted/40 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      inv.status === 'paid' ? 'bg-emerald-500/10' :
                      inv.status === 'past_due' ? 'bg-red-500/10' : 'bg-blue-500/10'
                    }`}>
                      <CreditCard className={`w-5 h-5 ${
                        inv.status === 'paid' ? 'text-emerald-500' :
                        inv.status === 'past_due' ? 'text-red-500' : 'text-blue-500'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.householdName}</p>
                      <p className="text-xs text-muted-foreground/70">
                        {getPlanLabel(inv.subscriptionPlan)} — {formatDate(inv.periodStart)} au {formatDate(inv.periodEnd)}
                      </p>
                    </div>

                    <Badge className={`shrink-0 text-[9px] font-semibold px-2.5 py-0.5 rounded-full border-0 ${getStatusBadge(inv.status)}`}>
                      {getStatusLabel(inv.status)}
                    </Badge>

                    <p className={`text-sm font-semibold shrink-0 ${
                      inv.status === 'paid' ? 'text-emerald-500' :
                      inv.status === 'past_due' ? 'text-red-500' : 'text-foreground'
                    }`}>
                      {formatCurrency(inv.amountCents, inv.currency)}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Aucune facture trouvée</p>
              </div>
            )}
          </ScrollArea>
        </GlassCard>
      </motion.div>
    </div>
  );
}
