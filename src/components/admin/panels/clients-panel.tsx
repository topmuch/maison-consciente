'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Users, MapPin, Search, RefreshCw,
  ChevronLeft, ChevronRight, Filter, Mail, Phone,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/shared/glass-card';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface Client {
  id: string;
  name: string;
  type: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionEndsAt?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  createdAt: string;
  memberCount: number;
  zoneCount: number;
  lastActivity?: string;
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

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'active': return 'bg-emerald-500/10 text-emerald-500';
    case 'trialing': return 'bg-blue-500/10 text-blue-500';
    case 'past_due': return 'bg-red-500/10 text-red-500';
    case 'canceled': case 'inactive': return 'bg-muted/80 text-muted-foreground';
    default: return 'bg-muted/80 text-muted-foreground';
  }
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: 'Actif', trialing: 'Essai', past_due: 'En retard',
    canceled: 'Annulé', inactive: 'Inactif',
  };
  return map[status] || status;
};

const getPlanLabel = (plan: string) => {
  const map: Record<string, string> = {
    free: 'Gratuit', starter: 'Starter', comfort: 'Confort', prestige: 'Prestige', pro: 'Pro',
  };
  return map[plan] || plan;
};

const getPlanStyle = (plan: string) => {
  switch (plan) {
    case 'free': return 'bg-muted/80 text-muted-foreground';
    case 'starter': return 'bg-blue-500/10 text-blue-500';
    case 'comfort': return 'bg-amber-500/10 text-amber-500';
    case 'prestige': return 'bg-gradient-to-r from-amber-500/10 to-copper/10 text-[var(--accent-primary)]';
    case 'pro': return 'bg-violet-500/10 text-violet-500';
    default: return 'bg-muted/80 text-muted-foreground';
  }
};

const getTypeStyle = (type: string) => {
  switch (type) {
    case 'hospitality': return 'bg-copper/10 text-copper';
    default: return 'bg-emerald-500/10 text-emerald-500';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'hospitality': return 'Hospitalité';
    default: return 'Domicile';
  }
};

/* ═══════════════════════════════════════════════════════
   CLIENT MANAGEMENT PANEL
   ═══════════════════════════════════════════════════════ */

export function ClientsPanel() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (planFilter) params.set('subscriptionPlan', planFilter);
      if (statusFilter) params.set('subscriptionStatus', statusFilter);
      const res = await fetch(`/api/admin/clients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
        setTotal(data.total || 0);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, planFilter, statusFilter]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  return (
    <div className="space-y-6">
      {/* ═══ SEARCH & FILTERS ═══ */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <Input
                placeholder="Rechercher par nom, email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/70 focus:border-[var(--accent-primary)]/40 rounded-xl"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:border-[var(--accent-primary)]/40 appearance-none cursor-pointer"
              >
                <option value="">Type</option>
                <option value="home">Domicile</option>
                <option value="hospitality">Hospitalité</option>
              </select>
              <select
                value={planFilter}
                onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:border-[var(--accent-primary)]/40 appearance-none cursor-pointer"
              >
                <option value="">Plan</option>
                <option value="free">Gratuit</option>
                <option value="starter">Starter</option>
                <option value="comfort">Confort</option>
                <option value="prestige">Prestige</option>
                <option value="pro">Pro</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:border-[var(--accent-primary)]/40 appearance-none cursor-pointer"
              >
                <option value="">Statut</option>
                <option value="active">Actif</option>
                <option value="trialing">Essai</option>
                <option value="past_due">En retard</option>
                <option value="canceled">Annulé</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchClients}
              className="shrink-0 text-muted-foreground hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </GlassCard>
      </motion.div>

      {/* ═══ CLIENT LIST ═══ */}
      <motion.div custom={0.1} variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard className="overflow-hidden">
          <div className="p-5 pb-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-semibold tracking-tight">Gestion clientèle</h2>
                <p className="text-[10px] text-muted-foreground/70">
                  {loading ? 'Chargement...' : `${total} client${total !== 1 ? 's' : ''} au total`}
                </p>
              </div>
            </div>
            <Badge className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              {clients.length}
            </Badge>
          </div>

          <ScrollArea className="max-h-[520px] overflow-y-auto scrollbar-luxe">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl glass">
                    <Skeleton className="h-10 w-10 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-40 bg-muted" />
                      <Skeleton className="h-3 w-28 bg-muted" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            ) : clients.length > 0 ? (
              <div className="p-4 space-y-2">
                {clients.map((client, i) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.03, duration: 0.35 }}
                    onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl hover:bg-muted/40 transition-all cursor-pointer"
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--accent-primary)]/10`}>
                      <Building2 className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {client.contactEmail && (
                          <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                            <Mail className="w-3 h-3" />{client.contactEmail}
                          </span>
                        )}
                        {client.contactPhone && (
                          <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{client.contactPhone}
                          </span>
                        )}
                        {!client.contactEmail && !client.contactPhone && (
                          <span className="text-xs text-muted-foreground/70">Créé le {formatDate(client.createdAt)}</span>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Badge className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border-0 ${getTypeStyle(client.type)}`}>
                        {getTypeLabel(client.type)}
                      </Badge>
                      <Badge className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border-0 ${getPlanStyle(client.subscriptionPlan)}`}>
                        {getPlanLabel(client.subscriptionPlan)}
                      </Badge>
                      <Badge className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border-0 ${getStatusStyle(client.subscriptionStatus)}`}>
                        {getStatusLabel(client.subscriptionStatus)}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground/70">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{client.memberCount}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{client.zoneCount}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Aucun client trouvé</p>
              </div>
            )}
          </ScrollArea>

          {/* Pagination */}
          {total > 20 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground/70">
                Page {page} — {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} sur {total}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                  className="text-muted-foreground hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Préc.
                </Button>
                <Button variant="ghost" size="sm" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}
                  className="text-muted-foreground hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10">
                  Suiv. <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* ═══ SELECTED CLIENT DETAIL ═══ */}
      {selectedClient && (
        <motion.div custom={0.2} variants={fadeUp} initial="hidden" animate="visible">
          <GlassCard className="p-6" variant="gold">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-foreground">{selectedClient.name}</h3>
                <p className="text-xs text-muted-foreground">ID: {selectedClient.id.slice(0, 12)}...</p>
              </div>
              <Badge className={`text-[10px] font-semibold px-3 py-1 rounded-full border-0 ${getStatusStyle(selectedClient.subscriptionStatus)}`}>
                {getStatusLabel(selectedClient.subscriptionStatus)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Type</p>
                <Badge className={`${getTypeStyle(selectedClient.type)} text-[10px] border-0`}>
                  {getTypeLabel(selectedClient.type)}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Plan</p>
                <Badge className={`${getPlanStyle(selectedClient.subscriptionPlan)} text-[10px] border-0`}>
                  {getPlanLabel(selectedClient.subscriptionPlan)}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Membres</p>
                <p className="text-sm font-medium text-foreground">{selectedClient.memberCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Zones</p>
                <p className="text-sm font-medium text-foreground">{selectedClient.zoneCount}</p>
              </div>
              {selectedClient.contactEmail && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="text-sm text-foreground truncate">{selectedClient.contactEmail}</p>
                </div>
              )}
              {selectedClient.contactPhone && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Téléphone</p>
                  <p className="text-sm text-foreground">{selectedClient.contactPhone}</p>
                </div>
              )}
              {selectedClient.contactAddress && (
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Adresse</p>
                  <p className="text-sm text-foreground truncate">{selectedClient.contactAddress}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Créé le</p>
                <p className="text-sm text-foreground">{formatDate(selectedClient.createdAt)}</p>
              </div>
              {selectedClient.subscriptionEndsAt && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expire le</p>
                  <p className="text-sm text-foreground">{formatDate(selectedClient.subscriptionEndsAt)}</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}
