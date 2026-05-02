'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  BarChart3,
  Building2,
  Crown,
  CreditCard,
  Brain,
  Users,
  ScrollText,
  Shield,
  Plug,
  Settings,
  ClipboardCheck,
  Loader2,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { GlassCard } from '@/components/shared/glass-card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OverviewPanel } from '@/components/admin/panels/overview-panel';
import { ClientsPanel } from '@/components/admin/panels/clients-panel';
import { SubscriptionsPanel } from '@/components/admin/panels/subscriptions-panel';
import { PaymentsPanel } from '@/components/admin/panels/payments-panel';
import { AIConfigPanel } from '@/components/admin/panels/ai-config-panel';
import { ApiConfigPanel } from '@/components/admin/ApiConfigPanel';
import { SecurityAuditPanel } from '@/components/admin/SecurityAuditPanel';
import { SystemConfigPanel } from '@/components/admin/SystemConfigPanel';
import { DeploymentChecklist } from '@/components/admin/deployment-checklist';

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
  recentActivity: Array<{ id: string; action: string; createdAt: string }>;
  monthlyGrowth: Array<{ month: string; count: number }>;
}

type AdminTab = 'overview' | 'clients' | 'subscriptions' | 'payments' | 'ai-config' | 'users' | 'logs' | 'audit' | 'apis' | 'config' | 'checklist';

/* ═══════════════════════════════════════════════════════
   ANIMATION
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
   TAB DEFINITIONS
   ═══════════════════════════════════════════════════════ */

const adminTabs: Array<{ key: AdminTab; label: string; icon: typeof BarChart3 }> = [
  { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
  { key: 'clients', label: 'Clients', icon: Building2 },
  { key: 'subscriptions', label: 'Abonnements', icon: Crown },
  { key: 'payments', label: 'Paiements', icon: CreditCard },
  { key: 'ai-config', label: 'Configuration IA', icon: Brain },
  { key: 'users', label: 'Utilisateurs', icon: Users },
  { key: 'logs', label: 'Logs', icon: ScrollText },
  { key: 'audit', label: 'Sécurité', icon: Shield },
  { key: 'apis', label: 'APIs', icon: Plug },
  { key: 'config', label: 'Paramètres', icon: Settings },
  { key: 'checklist', label: 'Lancement', icon: ClipboardCheck },
];

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case 'superadmin': return 'bg-red-500/10 text-red-500';
    case 'owner': return 'bg-amber-500/10 text-amber-500';
    default: return 'bg-muted/80 text-muted-foreground';
  }
};

const getActionBadge = (action: string) => {
  switch (action) {
    case 'login': return 'bg-emerald-500/10 text-emerald-500';
    case 'scan': return 'bg-blue-500/10 text-blue-500';
    case 'settings_update': return 'bg-violet-500/10 text-violet-500';
    case 'vault_access': return 'bg-red-500/10 text-red-500';
    case 'subscription_change': return 'bg-amber-500/10 text-amber-500';
    default: return 'bg-muted/80 text-muted-foreground';
  }
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/* ═══════════════════════════════════════════════════════
   USERS TAB
   ═══════════════════════════════════════════════════════ */

function UsersTab() {
  const [users, setUsers] = useState<Array<{
    id: string; name: string; email: string; role: string;
    householdName?: string; createdAt: string;
  }>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) { toast.success('Rôle mis à jour'); fetchUsers(); }
      else { const d = await res.json(); toast.error(d.error || 'Erreur'); }
    } catch { toast.error('Erreur réseau'); } finally { setActionLoading(null); }
  };

  const handleResetSessions = async (userId: string, email: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) { toast.success(`Sessions réinitialisées pour ${email}`); fetchUsers(); }
      else { const d = await res.json(); toast.error(d.error || 'Erreur'); }
    } catch { toast.error('Erreur réseau'); } finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6">
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <Input
                placeholder="Rechercher par email ou nom…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/70 focus:border-[var(--accent-primary)]/40 rounded-xl"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-xl bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:border-[var(--accent-primary)]/40 appearance-none cursor-pointer"
            >
              <option value="">Tous les rôles</option>
              <option value="member">Member</option>
              <option value="owner">Owner</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div custom={0.1} variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard className="overflow-hidden">
          <div className="p-5 pb-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-copper/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-copper" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-semibold tracking-tight">Utilisateurs</h2>
                <p className="text-[10px] text-muted-foreground/70">
                  {loading ? 'Chargement…' : `${total} utilisateur${total !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </div>
          <ScrollArea className="max-h-[560px] overflow-y-auto scrollbar-luxe">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl bg-muted" />
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="p-4 space-y-2">
                {users.map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.03, duration: 0.35 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl hover:bg-muted/40 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-semibold ${getRoleBadgeStyle(u.role)}`}>
                      {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.name || u.email}</p>
                      <p className="text-xs text-muted-foreground/70 truncate">{u.email}</p>
                    </div>
                    <Badge className={`shrink-0 text-[9px] font-semibold px-2.5 py-0.5 rounded-full border-0 ${getRoleBadgeStyle(u.role)}`}>
                      {u.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground/70 hidden md:inline max-w-[120px] truncate">{u.householdName}</span>
                    <span className="text-xs text-muted-foreground/70 hidden lg:inline whitespace-nowrap">{formatDate(u.createdAt)}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        disabled={u.role === 'superadmin' || actionLoading === u.id}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="text-[11px] px-2 py-1 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none appearance-none cursor-pointer disabled:opacity-40"
                      >
                        <option value="member">Member</option>
                        <option value="owner">Owner</option>
                        {u.role === 'superadmin' && <option value="superadmin">Superadmin</option>}
                      </select>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleResetSessions(u.id, u.email)}
                        disabled={actionLoading === u.id || u.role === 'superadmin'}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-copper hover:bg-copper/10 transition-all disabled:opacity-40"
                        title="Réinitialiser sessions"
                      >
                        {actionLoading === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Aucun utilisateur trouvé</p>
              </div>
            )}
          </ScrollArea>
        </GlassCard>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LOGS TAB
   ═══════════════════════════════════════════════════════ */

function LogsTab() {
  const [logs, setLogs] = useState<Array<{
    id: string; action: string; createdAt: string;
    user?: { name?: string; email?: string } | null;
    householdName?: string; details?: string; ip?: string;
  }>>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (actionFilter) params.set('action', actionFilter);
      const res = await fetch(`/api/admin/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>Filtrer par action :</span>
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-muted/50 border border-border text-sm text-foreground focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">Toutes les actions</option>
              <option value="login">Login</option>
              <option value="scan">Scan QR</option>
              <option value="settings_update">Settings Update</option>
              <option value="vault_access">Vault Access</option>
              <option value="subscription_change">Subscription Change</option>
            </select>
            <Badge className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              {total} entrée{total !== 1 ? 's' : ''}
            </Badge>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div custom={0.1} variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard className="overflow-hidden">
          <div className="p-5 pb-4 border-b border-border flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <ScrollText className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold tracking-tight">Journal d&apos;audit</h2>
              <p className="text-[10px] text-muted-foreground/70">Activité système en temps réel</p>
            </div>
          </div>
          <ScrollArea className="max-h-[600px] overflow-y-auto scrollbar-luxe">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl bg-muted" />
                ))}
              </div>
            ) : logs.length > 0 ? (
              <div className="p-4 space-y-1">
                {logs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 + i * 0.02, duration: 0.3 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-all"
                  >
                    <Badge className={`shrink-0 text-[9px] font-semibold px-2.5 py-0.5 rounded-full border-0 mt-0.5 ${getActionBadge(log.action)}`}>
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-foreground font-medium">
                          {log.user?.name || log.user?.email || 'Système'}
                        </span>
                        {log.householdName && (
                          <span className="text-xs text-muted-foreground/70">— {log.householdName}</span>
                        )}
                      </div>
                      {log.details && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5 truncate max-w-[500px]">{log.details}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground/50">{formatDateTime(log.createdAt)}</span>
                        {log.ip && <span className="text-[10px] text-muted-foreground/50 font-mono">{log.ip}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <ScrollText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Aucune entrée de log</p>
              </div>
            )}
          </ScrollArea>
        </GlassCard>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ADMIN DASHBOARD (Main Orchestrator)
   ═══════════════════════════════════════════════════════ */

export function AdminDashboard() {
  const { user, setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [initialStats, setInitialStats] = useState<EnhancedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.status === 403 || res.status === 401) {
        setError('access_denied');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setInitialStats(data.stats || data);
      }
    } catch {
      setError('fetch_error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If auth store doesn't have the role yet, fetch it first
    if (!user?.role) {
      fetch('/api/auth/me')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.success && data.user) {
            setAuth({
              userId: data.user.id,
              email: data.user.email,
              role: data.user.role,
              name: data.user.name,
              avatar: data.user.avatar,
              householdId: data.user.householdId,
              householdName: data.household?.name,
              householdType: data.household?.type,
            } as any);
          } else {
            setError('access_denied');
            setLoading(false);
          }
        })
        .catch(() => {
          setError('access_denied');
          setLoading(false);
        });
    } else {
      fetchInitialStats();
    }
  }, []); // Fetch auth if not available

  // Also fetch stats when auth becomes available
  useEffect(() => {
    if (user?.role === 'superadmin' && !initialStats && loading) {
      fetchInitialStats();
    }
  }, [user?.role, initialStats, loading, fetchInitialStats]);

  /* ── Loading (auth not yet confirmed) ── */
  if (loading && !user?.role) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  /* ── Access denied ── */
  if (user?.role !== 'superadmin' || error === 'access_denied') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-serif font-semibold text-foreground mb-2">Accès refusé</h2>
          <p className="text-sm text-muted-foreground max-w-[320px] leading-relaxed">
            Cette section est réservée aux administrateurs principaux (superadmin).
          </p>
        </motion.div>
      </div>
    );
  }

  /* ── Fetch error ── */
  if (error === 'fetch_error' && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-sm text-muted-foreground">Erreur lors du chargement des données</p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={fetchInitialStats}
          className="mt-3 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary-light)] transition-colors"
        >
          Réessayer
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* ═══ HEADER ═══ */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center glow-gold">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gradient-gold">
              Superadmin
            </h1>
            <p className="text-sm text-muted-foreground">
              Administration complète de la plateforme Maison Consciente
            </p>
          </div>
        </div>

        {/* ═══ TAB NAVIGATION ═══ */}
        <div className="flex gap-2 ml-[52px] overflow-x-auto pb-2 scrollbar-luxe">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap
                  ${isActive
                    ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30'
                    : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted/50 border border-transparent'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ TAB CONTENT ═══ */}
      {loading && activeTab === 'overview' ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && <OverviewPanel initialStats={initialStats} />}
          {activeTab === 'clients' && <ClientsPanel />}
          {activeTab === 'subscriptions' && <SubscriptionsPanel />}
          {activeTab === 'payments' && <PaymentsPanel />}
          {activeTab === 'ai-config' && <AIConfigPanel />}
          {activeTab === 'config' && <SystemConfigPanel />}
          {activeTab === 'checklist' && <DeploymentChecklist />}
          {activeTab === 'apis' && <ApiConfigPanel />}
          {activeTab === 'audit' && <SecurityAuditPanel />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'logs' && <LogsTab />}
        </>
      )}
    </div>
  );
}
