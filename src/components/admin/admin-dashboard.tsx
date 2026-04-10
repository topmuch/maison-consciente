'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Home,
  Users,
  MapPin,
  Activity,
  Crown,
  Loader2,
  ChevronRight,
  ChevronLeft,
  ScrollText,
  CreditCard,
  Search,
  RefreshCw,
  Shield,
  Mail,
  Filter,
  Plug,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store/auth-store';
import { GlassCard } from '@/components/shared/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DeploymentChecklist } from '@/components/admin/deployment-checklist';
import { ApiConfigPanel } from '@/components/admin/ApiConfigPanel';
import { SecurityAuditPanel } from '@/components/admin/SecurityAuditPanel';
import { BarChart3, ClipboardCheck } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface AdminStats {
  totalHouseholds: number;
  totalUsers: number;
  totalZones: number;
  totalInteractions: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  householdName?: string;
  createdAt: string;
  suspended?: boolean;
}

interface AuditLogEntry {
  id: string;
  action: string;
  user: { name?: string; email?: string } | null;
  householdName?: string;
  details?: string;
  ip?: string;
  createdAt: string;
}

interface AdminInvoice {
  id: string;
  householdName: string;
  subscriptionPlan: string;
  amountCents: number;
  currency: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  pdfUrl?: string;
  createdAt: string;
}

interface Household {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  zoneCount: number;
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

/* ═══════════════════════════════════════════════════════
   STAT CARD CONFIG
   ═══════════════════════════════════════════════════════ */

const statCardConfig = [
  {
    key: 'totalHouseholds',
    label: 'Foyers',
    icon: Home,
    iconBg: 'bg-[var(--accent-primary)]/15',
    iconColor: 'text-[var(--accent-primary)]',
  },
  {
    key: 'totalUsers',
    label: 'Utilisateurs',
    icon: Users,
    iconBg: 'bg-[#c77d5a]/15',
    iconColor: 'text-[#c77d5a]',
  },
  {
    key: 'totalZones',
    label: 'Zones',
    icon: MapPin,
    iconBg: 'bg-[#8b5cf6]/15',
    iconColor: 'text-[#8b5cf6]',
  },
  {
    key: 'totalInteractions',
    label: 'Interactions',
    icon: Activity,
    iconBg: 'bg-gradient-to-br from-[var(--accent-primary)]/15 to-[#c77d5a]/15',
    iconColor: 'text-[var(--accent-primary)]',
  },
] as const;

/* ═══════════════════════════════════════════════════════
   LOADING SKELETONS
   ═══════════════════════════════════════════════════════ */

function StatSkeleton() {
  return (
    <div className="glass rounded-xl p-5 inner-glow">
      <Skeleton className="h-11 w-11 rounded-xl bg-white/[0.06] mb-4" />
      <Skeleton className="h-3.5 w-28 bg-white/[0.06] mb-1.5" />
      <Skeleton className="h-9 w-16 bg-white/[0.06]" />
    </div>
  );
}

function HouseholdRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl glass">
      <Skeleton className="h-10 w-10 rounded-xl bg-white/[0.06]" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40 bg-white/[0.06]" />
        <Skeleton className="h-3 w-24 bg-white/[0.06]" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full bg-white/[0.06]" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════════════════ */

type AdminTab = 'overview' | 'users' | 'logs' | 'audit' | 'subscriptions' | 'checklist' | 'apis';

export function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Users tab state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersActionLoading, setUsersActionLoading] = useState<string | null>(null);

  // Logs tab state
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsActionFilter, setLogsActionFilter] = useState('');

  // Subscriptions tab state
  const [allInvoices, setAllInvoices] = useState<AdminInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesStatusFilter, setInvoicesStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, householdsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/households'),
      ]);

      if (statsRes.status === 403 || householdsRes.status === 403) {
        setError('access_denied');
        return;
      }

      if (statsRes.status === 401 || householdsRes.status === 401) {
        setError('access_denied');
        return;
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats || data);
      }

      if (householdsRes.ok) {
        const data = await householdsRes.json();
        setHouseholds(data.households || []);
      }
    } catch {
      setError('fetch_error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Users tab fetch ── */
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ page: String(usersPage), limit: '20' });
      if (usersSearch) params.set('search', usersSearch);
      if (usersRoleFilter) params.set('role', usersRoleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setUsersTotal(data.total || 0);
      }
    } catch { /* silent */ } finally {
      setUsersLoading(false);
    }
  }, [usersPage, usersSearch, usersRoleFilter]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  /* ── Logs tab fetch ── */
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (logsActionFilter) params.set('action', logsActionFilter);
      const res = await fetch(`/api/admin/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setLogsTotal(data.total || 0);
      }
    } catch { /* silent */ } finally {
      setLogsLoading(false);
    }
  }, [logsActionFilter]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, fetchLogs]);

  /* ── Subscriptions tab fetch ── */
  const fetchInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const params = new URLSearchParams();
      if (invoicesStatusFilter) params.set('status', invoicesStatusFilter);
      const res = await fetch(`/api/admin/invoices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAllInvoices(data.invoices || []);
      }
    } catch { /* silent */ } finally {
      setInvoicesLoading(false);
    }
  }, [invoicesStatusFilter]);

  useEffect(() => {
    if (activeTab === 'subscriptions') fetchInvoices();
  }, [activeTab, fetchInvoices]);

  /* ── Users actions ── */
  const handleRoleChange = async (userId: string, newRole: string) => {
    setUsersActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        toast.success('Rôle mis à jour');
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur');
      }
    } catch { toast.error('Erreur réseau'); } finally {
      setUsersActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId: string, email: string) => {
    setUsersActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, suspended: true }),
      });
      if (res.ok) {
        toast.success(`Sessions réinitialisées pour ${email}`);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur');
      }
    } catch { toast.error('Erreur réseau'); } finally {
      setUsersActionLoading(null);
    }
  };

  const handleResetSessions = async (userId: string, email: string) => {
    setUsersActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        toast.success(`Sessions réinitialisées pour ${email}`);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur');
      }
    } catch { toast.error('Erreur réseau'); } finally {
      setUsersActionLoading(null);
    }
  };

  /* ── Invoice actions ── */
  const handleSendReminder = async (invoiceId: string) => {
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });
      if (res.ok) {
        toast.success('Rappel envoyé');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur');
      }
    } catch { toast.error('Erreur réseau'); }
  };

  /* ── Action badge colors ── */
  const getActionBadgeStyle = (action: string) => {
    switch (action) {
      case 'login': return 'bg-[#22c55e]/10 text-[#22c55e]';
      case 'scan': return 'bg-[#3b82f6]/10 text-[#3b82f6]';
      case 'settings_update': return 'bg-[#8b5cf6]/10 text-[#8b5cf6]';
      case 'vault_access': return 'bg-[#f87171]/10 text-[#f87171]';
      case 'subscription_change': return 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]';
      default: return 'bg-[#64748b]/10 text-[#64748b]';
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-[#f87171]/10 text-[#f87171]';
      case 'owner': return 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]';
      case 'member': return 'bg-[#64748b]/10 text-[#64748b]';
      default: return 'bg-[#64748b]/10 text-[#64748b]';
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-[#22c55e]/10 text-[#22c55e]';
      case 'open': return 'bg-[#3b82f6]/10 text-[#3b82f6]';
      case 'past_due': return 'bg-[#f87171]/10 text-[#f87171]';
      case 'void': return 'bg-[#64748b]/10 text-[#475569]';
      default: return 'bg-[#64748b]/10 text-[#64748b]';
    }
  };

  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  /* ── Access denied ── */
  if (user?.role !== 'superadmin' || error === 'access_denied') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <div className="w-20 h-20 rounded-2xl bg-[#f87171]/10 border border-[#f87171]/20 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-[#f87171]" />
          </div>
          <h2 className="text-xl font-serif font-semibold text-[#e2e8f0] mb-2">
            Accès refusé
          </h2>
          <p className="text-sm text-[#64748b] max-w-[320px] leading-relaxed">
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
        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-[var(--accent-primary)]" />
        </div>
        <p className="text-sm text-[#64748b]">Erreur lors du chargement des données</p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={fetchData}
          className="mt-3 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary-light)] transition-colors"
        >
          Réessayer
        </motion.button>
      </div>
    );
  }

  const delays = [0, 0.08, 0.16, 0.24, 0.32];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* ═══ HEADER ═══ */}
      <motion.div
        custom={delays[0]}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary-dark)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center glow-gold">
            <Crown className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gradient-gold">
              Administration
            </h1>
            <p className="text-sm text-[#64748b]">
              Vue d&apos;ensemble du système Maison Consciente
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 ml-[52px]">
          {([
            { key: 'overview' as AdminTab, label: 'Vue d\'ensemble', icon: BarChart3 },
            { key: 'checklist' as AdminTab, label: 'Pré-Lancement', icon: ClipboardCheck },
            { key: 'users' as AdminTab, label: 'Utilisateurs', icon: Users },
            { key: 'logs' as AdminTab, label: 'Logs', icon: ScrollText },
            { key: 'audit' as AdminTab, label: 'Audit sécurité', icon: Shield },
            { key: 'subscriptions' as AdminTab, label: 'Abonnements', icon: CreditCard },
            { key: 'apis' as AdminTab, label: 'APIs', icon: Plug },
          ]).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                  ${isActive
                    ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                    : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.04] border border-transparent'
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

      {/* ═══ DEPLOYMENT CHECKLIST ═══ */}
      {activeTab === 'checklist' && <DeploymentChecklist />}

      {/* ═══ USERS TAB ═══ */}
      {activeTab === 'users' && (
        <motion.div
          custom={delays[0]}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Search & Filters */}
          <div className="glass rounded-xl p-4 inner-glow">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <Input
                  placeholder="Rechercher par email ou nom…"
                  value={usersSearch}
                  onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1); }}
                  className="pl-10 bg-white/[0.04] border-white/[0.08] text-foreground placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 rounded-xl"
                />
              </div>
              <select
                value={usersRoleFilter}
                onChange={(e) => { setUsersRoleFilter(e.target.value); setUsersPage(1); }}
                className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[#e2e8f0] focus:outline-none focus:border-[var(--accent-primary)]/40 appearance-none cursor-pointer"
              >
                <option value="">Tous les rôles</option>
                <option value="member">Member</option>
                <option value="owner">Owner</option>
                <option value="superadmin">Superadmin</option>
              </select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchUsers()}
                className="shrink-0 text-[#64748b] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
              >
                <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <div className="glass rounded-xl overflow-hidden inner-glow">
            <div className="p-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#c77d5a]/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#c77d5a]" />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-semibold tracking-tight">Utilisateurs</h2>
                  <p className="text-[10px] text-[#475569]">
                    {usersLoading ? 'Chargement…' : `${usersTotal} utilisateur${usersTotal !== 1 ? 's' : ''} au total`}
                  </p>
                </div>
              </div>
              <Badge className="bg-[#c77d5a]/10 text-[#c77d5a] border-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                {users.length}
              </Badge>
            </div>

            <ScrollArea className="max-h-[560px] overflow-y-auto scrollbar-luxe">
              {usersLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl glass">
                      <Skeleton className="h-10 w-10 rounded-xl bg-white/[0.06]" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-48 bg-white/[0.06]" />
                        <Skeleton className="h-3 w-32 bg-white/[0.06]" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full bg-white/[0.06]" />
                      <Skeleton className="h-8 w-24 rounded-lg bg-white/[0.06]" />
                    </div>
                  ))}
                </div>
              ) : users.length > 0 ? (
                <div className="p-4 space-y-2">
                  {users.map((u, i: number) => (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 + i * 0.03, duration: 0.35 }}
                      className="group/u flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-all duration-300"
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-semibold ${getRoleBadgeStyle(u.role)}`}>
                        {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.name || u.email}</p>
                        <p className="text-xs text-[#475569] truncate">{u.email}</p>
                      </div>

                      {/* Role Badge */}
                      <Badge className={`shrink-0 text-[9px] font-semibold px-2.5 py-0.5 rounded-full border-0 ${getRoleBadgeStyle(u.role)}`}>
                        {u.role}
                      </Badge>

                      {/* Household */}
                      <span className="text-xs text-[#475569] hidden md:inline max-w-[120px] truncate">{u.householdName}</span>

                      {/* Created */}
                      <span className="text-xs text-[#475569] hidden lg:inline whitespace-nowrap">{formatDate(u.createdAt)}</span>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          disabled={u.role === 'superadmin' || usersActionLoading === u.id}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#e2e8f0] focus:outline-none focus:border-[var(--accent-primary)]/40 appearance-none cursor-pointer disabled:opacity-40"
                        >
                          <option value="member">Member</option>
                          <option value="owner">Owner</option>
                          {u.role === 'superadmin' && <option value="superadmin">Superadmin</option>}
                        </select>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSuspendUser(u.id, u.email)}
                          disabled={usersActionLoading === u.id || u.role === 'superadmin'}
                          className="p-1.5 rounded-lg text-[#64748b] hover:text-[#f87171] hover:bg-[#f87171]/10 transition-all disabled:opacity-40"
                          title="Réinitialiser sessions (forcer déconnexion)"
                        >
                          {usersActionLoading === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleResetSessions(u.id, u.email)}
                          disabled={usersActionLoading === u.id || u.role === 'superadmin'}
                          className="p-1.5 rounded-lg text-[#64748b] hover:text-[#c77d5a] hover:bg-[#c77d5a]/10 transition-all disabled:opacity-40"
                          title="Supprimer toutes les sessions"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#c77d5a]/[0.06] border border-[#c77d5a]/10 mb-4">
                    <Users className="w-6 h-6 text-[#c77d5a]/50" />
                  </div>
                  <p className="text-sm font-medium text-[#64748b]">Aucun utilisateur trouvé</p>
                </div>
              )}
            </ScrollArea>

            {/* Pagination */}
            {usersTotal > 20 && (
              <div className="p-4 border-t border-white/[0.06] flex items-center justify-between">
                <p className="text-xs text-[#475569]">
                  Page {usersPage} — {(usersPage - 1) * 20 + 1}–{Math.min(usersPage * 20, usersTotal)} sur {usersTotal}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={usersPage <= 1}
                    onClick={() => setUsersPage((p) => p - 1)}
                    className="text-[#64748b] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Préc.
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={usersPage * 20 >= usersTotal}
                    onClick={() => setUsersPage((p) => p + 1)}
                    className="text-[#64748b] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
                  >
                    Suiv. <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ LOGS TAB ═══ */}
      {activeTab === 'logs' && (
        <motion.div
          custom={delays[0]}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Filters */}
          <div className="glass rounded-xl p-4 inner-glow">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2 text-sm text-[#64748b]">
                <Filter className="w-4 h-4" />
                <span>Filtrer par action :</span>
              </div>
              <select
                value={logsActionFilter}
                onChange={(e) => setLogsActionFilter(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[#e2e8f0] focus:outline-none focus:border-[var(--accent-primary)]/40 appearance-none cursor-pointer"
              >
                <option value="">Toutes les actions</option>
                <option value="login">Login</option>
                <option value="scan">Scan QR</option>
                <option value="settings_update">Settings Update</option>
                <option value="vault_access">Vault Access</option>
                <option value="subscription_change">Subscription Change</option>
                <option value="api_config_update">API Config Update</option>
                <option value="api_config_test">API Config Test</option>
              </select>
              <Badge className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                {logsTotal} entrée{logsTotal !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass rounded-xl overflow-hidden inner-glow">
            <div className="p-5 pb-4 border-b border-white/[0.06] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                <ScrollText className="w-4 h-4 text-[#8b5cf6]" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-semibold tracking-tight">Journal d&apos;audit</h2>
                <p className="text-[10px] text-[#475569]">Activité système en temps réel</p>
              </div>
            </div>

            <ScrollArea className="max-h-[600px] overflow-y-auto scrollbar-luxe">
              {logsLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 p-3">
                      <Skeleton className="h-8 w-20 rounded-full bg-white/[0.06] shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-60 bg-white/[0.06]" />
                        <Skeleton className="h-3 w-40 bg-white/[0.06]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : logs.length > 0 ? (
                <div className="p-4 space-y-1">
                  {logs.map((log, i: number) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 + i * 0.02, duration: 0.3 }}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-all duration-200 group/log"
                    >
                      {/* Action Badge */}
                      <Badge className={`shrink-0 text-[9px] font-semibold px-2.5 py-0.5 rounded-full border-0 mt-0.5 ${getActionBadgeStyle(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-foreground font-medium">
                            {log.user ? (log.user.name || log.user.email) : 'Système'}
                          </span>
                          <span className="text-xs text-[#475569]">
                            — {log.householdName}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-xs text-[#475569] mt-0.5 truncate max-w-[500px]" title={log.details}>
                            {log.details.length > 80 ? log.details.slice(0, 80) + '…' : log.details}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-[#334155]">{formatDateTime(log.createdAt)}</span>
                          {log.ip && (
                            <span className="text-[10px] text-[#334155] font-mono">{log.ip}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#8b5cf6]/[0.06] border border-[#8b5cf6]/10 mb-4">
                    <ScrollText className="w-6 h-6 text-[#8b5cf6]/50" />
                  </div>
                  <p className="text-sm font-medium text-[#64748b]">Aucune entrée de log</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </motion.div>
      )}

      {/* ═══ SUBSCRIPTIONS TAB ═══ */}
      {activeTab === 'subscriptions' && (
        <motion.div
          custom={delays[0]}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.div variants={fadeUp} custom={0.05} initial="hidden" animate="visible">
              <div className="glass rounded-xl p-4 inner-glow">
                <p className="text-xs text-[#64748b] tracking-wide uppercase font-medium">MRR Estimé</p>
                <p className="text-2xl font-serif font-bold mt-1 text-[var(--accent-primary)]">
                  {invoicesLoading ? '—' : formatCurrency(
                    allInvoices.filter((inv) => inv.status === 'paid').reduce((sum: number, inv) => sum + inv.amountCents, 0),
                    'eur'
                  )}
                </p>
                <p className="text-[10px] text-[#475569] mt-1">Total factures payées</p>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={0.1} initial="hidden" animate="visible">
              <div className="glass rounded-xl p-4 inner-glow">
                <p className="text-xs text-[#64748b] tracking-wide uppercase font-medium">En retard</p>
                <p className="text-2xl font-serif font-bold mt-1 text-[#f87171]">
                  {invoicesLoading ? '—' : allInvoices.filter((inv) => inv.status === 'past_due').length}
                </p>
                <p className="text-[10px] text-[#475569] mt-1">Factures past_due</p>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={0.15} initial="hidden" animate="visible">
              <div className="glass rounded-xl p-4 inner-glow">
                <p className="text-xs text-[#64748b] tracking-wide uppercase font-medium">Total factures</p>
                <p className="text-2xl font-serif font-bold mt-1 text-[#e2e8f0]">
                  {invoicesLoading ? '—' : allInvoices.length}
                </p>
                <p className="text-[10px] text-[#475569] mt-1">{invoicesLoading ? '—' : `De ${allInvoices.length} foyer${allInvoices.length !== 1 ? 's' : ''}`}</p>
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="glass rounded-xl p-4 inner-glow">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2 text-sm text-[#64748b]">
                <Filter className="w-4 h-4" />
                <span>Filtrer par statut :</span>
              </div>
              <select
                value={invoicesStatusFilter}
                onChange={(e) => setInvoicesStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[#e2e8f0] focus:outline-none focus:border-[var(--accent-primary)]/40 appearance-none cursor-pointer"
              >
                <option value="">Tous les statuts</option>
                <option value="paid">Payé</option>
                <option value="open">Ouvert</option>
                <option value="past_due">En retard</option>
                <option value="void">Annulé</option>
              </select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchInvoices()}
                className="shrink-0 text-[#64748b] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
              >
                <RefreshCw className={`w-4 h-4 ${invoicesLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="glass rounded-xl overflow-hidden inner-glow">
            <div className="p-5 pb-4 border-b border-white/[0.06] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-semibold tracking-tight">Factures</h2>
                <p className="text-[10px] text-[#475569]">
                  {invoicesLoading ? 'Chargement…' : `${allInvoices.length} facture${allInvoices.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            <ScrollArea className="max-h-[480px] overflow-y-auto scrollbar-luxe">
              {invoicesLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl glass">
                      <Skeleton className="h-10 w-10 rounded-xl bg-white/[0.06]" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-48 bg-white/[0.06]" />
                        <Skeleton className="h-3 w-32 bg-white/[0.06]" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full bg-white/[0.06]" />
                      <Skeleton className="h-8 w-20 rounded-lg bg-white/[0.06]" />
                    </div>
                  ))}
                </div>
              ) : allInvoices.length > 0 ? (
                <div className="p-4 space-y-2">
                  {allInvoices.map((inv, i: number) => (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 + i * 0.03, duration: 0.35 }}
                      className="group/inv flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-all duration-300"
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 text-[var(--accent-primary)]" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{inv.householdName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[#475569]">{inv.subscriptionPlan}</span>
                          <span className="text-[10px] text-[#334155]">•</span>
                          <span className="text-xs text-[#475569]">{formatDate(inv.periodStart)} — {formatDate(inv.periodEnd)}</span>
                        </div>
                      </div>

                      {/* Amount */}
                      <span className="text-sm font-semibold text-[#e2e8f0] whitespace-nowrap">
                        {formatCurrency(inv.amountCents, inv.currency)}
                      </span>

                      {/* Status */}
                      <Badge className={`shrink-0 text-[9px] font-semibold px-2.5 py-0.5 rounded-full border-0 ${getInvoiceStatusBadge(inv.status)}`}>
                        {inv.status.replace(/_/g, ' ')}
                      </Badge>

                      {/* Created */}
                      <span className="text-xs text-[#475569] hidden lg:inline whitespace-nowrap">{formatDate(inv.createdAt)}</span>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {inv.pdfUrl && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.open(inv.pdfUrl, '_blank')}
                            className="p-1.5 rounded-lg text-[#64748b] hover:text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-all"
                            title="Télécharger PDF"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                        {inv.status === 'past_due' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSendReminder(inv.id)}
                            className="p-1.5 rounded-lg text-[#64748b] hover:text-[#f87171] hover:bg-[#f87171]/10 transition-all"
                            title="Envoyer rappel"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[var(--accent-primary)]/[0.06] border border-[var(--accent-primary)]/10 mb-4">
                    <CreditCard className="w-6 h-6 text-[var(--accent-primary)]/50" />
                  </div>
                  <p className="text-sm font-medium text-[#64748b]">Aucune facture trouvée</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </motion.div>
      )}

      {/* ═══ APIs TAB ═══ */}
      {activeTab === 'apis' && <ApiConfigPanel />}

      {/* ═══ SECURITY AUDIT TAB ═══ */}
      {activeTab === 'audit' && (
        <motion.div
          custom={delays[0]}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <SecurityAuditPanel />
        </motion.div>
      )}

      {/* ═══ OVERVIEW (default) ═══ */}
      {activeTab === 'overview' && <>

      {/* ═══ STATS GRID ═══ */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCardConfig.map((card, i) => {
            const Icon = card.icon;
            const value = stats ? (stats[card.key] as number) ?? 0 : 0;

            return (
              <motion.div
                key={card.key}
                custom={delays[1] + i * 0.08}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="glass rounded-xl p-5 inner-glow transition-shadow duration-500 hover:shadow-[0_0_20px_oklch(0.78_0.14_85/10%)] group"
                >
                  <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${card.iconBg} transition-shadow duration-500 group-hover:shadow-[0_0_12px_oklch(0.78_0.14_85/15%)]`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <p className="text-xs text-[#64748b] mt-4 tracking-wide uppercase font-medium">
                    {card.label}
                  </p>
                  <p className="text-3xl font-serif font-bold mt-0.5 tracking-tight text-foreground">
                    {value.toLocaleString('fr-FR')}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ HOUSEHOLDS LIST ═══ */}
      <motion.div
        custom={delays[3]}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className="glass rounded-xl overflow-hidden inner-glow">
          {/* Header */}
          <div className="p-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                <Home className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-semibold tracking-tight">
                  Foyers
                </h2>
                <p className="text-[10px] text-[#475569]">
                  {loading
                    ? 'Chargement…'
                    : `${households.length} foyer${households.length !== 1 ? 's' : ''} enregistré${households.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <Badge className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                households.length
              )}
            </Badge>
          </div>

          {/* Content */}
          <ScrollArea className="max-h-[480px] overflow-y-auto scrollbar-luxe">
            <div className="p-4 space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <HouseholdRowSkeleton key={i} />
                ))
              ) : households.length > 0 ? (
                households.map((household, i) => (
                  <motion.div
                    key={household.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: delays[3] + 0.05 + i * 0.04,
                      duration: 0.4,
                      ease: 'easeOut',
                    }}
                    className="group/hh flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-all duration-300"
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0 transition-shadow duration-500 group-hover/hh:shadow-[0_0_12px_oklch(0.78_0.14_85/15%)]">
                      <Home className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {household.name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-[#475569] flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {household.memberCount} membre{household.memberCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-[#475569] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {household.zoneCount} zone{household.zoneCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Type badge */}
                    <Badge
                      className={`
                        shrink-0 text-[9px] font-semibold px-2.5 py-0.5 rounded-full border-0
                        ${household.type === 'home'
                          ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                          : 'bg-[#c77d5a]/10 text-[#c77d5a]'
                        }
                      `}
                    >
                      {household.type === 'home' ? '🏠 Maison' : '🏨 Hospitalité'}
                    </Badge>

                    <ChevronRight className="w-4 h-4 text-[#334155] shrink-0 transition-colors group-hover/hh:text-[#64748b]" />
                  </motion.div>
                ))
              ) : (
                <div className="p-10 text-center">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[var(--accent-primary)]/[0.06] border border-[var(--accent-primary)]/10 mb-4">
                    <Home className="w-6 h-6 text-[var(--accent-primary)]/50" />
                  </div>
                  <p className="text-sm font-medium text-[#64748b]">
                    Aucun foyer enregistré
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </motion.div></>}
    </div>
  );
}
