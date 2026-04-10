'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Search,
  Filter,
  Download,
  Globe,
  Monitor,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Activity,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface AuditLogUser {
  name: string | null;
  email: string | null;
  role: string | null;
}

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  details: string | null;
  ip: string | null;
  country: string | null;
  city: string | null;
  userAgent: string | null;
  status: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

interface AuditStats {
  total: number;
  securityAlerts: number;
  failedActions: number;
  success: number;
}

interface AuditResponse {
  success: boolean;
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
  error?: string;
}

/* ═══════════════════════════════════════════════════════
   ACTION OPTIONS
   ═══════════════════════════════════════════════════════ */

const ACTION_OPTIONS = [
  { value: '', label: 'Toutes les actions' },
  { value: 'login', label: 'Connexion' },
  { value: 'login_failed', label: 'Échec connexion' },
  { value: 'register', label: 'Inscription' },
  { value: 'logout', label: 'Déconnexion' },
  { value: 'settings_update', label: 'Mise à jour settings' },
  { value: 'vault_access', label: 'Accès coffre-fort' },
  { value: 'subscription_change', label: 'Changement abonnement' },
  { value: 'emergency_call', label: 'Appel urgence' },
  { value: 'api_config_update', label: 'Config API' },
  { value: 'api_config_test', label: 'Test API' },
  { value: 'safe_arrival_alert', label: 'Alerte arrivée' },
  { value: 'payment_failed', label: 'Paiement échoué' },
  { value: 'scan', label: 'Scan QR/NFC' },
] as const;

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'success', label: 'Succès' },
  { value: 'failure', label: 'Échec' },
  { value: 'security_alert', label: 'Alerte sécurité' },
] as const;

/* ═══════════════════════════════════════════════════════
   BADGE STYLERS
   ═══════════════════════════════════════════════════════ */

function getActionBadgeClasses(action: string): string {
  switch (action) {
    case 'login':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'login_failed':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'register':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'logout':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    case 'settings_update':
      return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    case 'vault_access':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'subscription_change':
      return 'bg-[#d4a853]/10 text-[#d4a853] border-[#d4a853]/20';
    case 'emergency_call':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'api_config_update':
    case 'api_config_test':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'safe_arrival_alert':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'payment_failed':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'scan':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'success':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'failure':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'security_alert':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}

function getStatusIcon(status: string | null) {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-3 h-3 text-emerald-400" />;
    case 'failure':
      return <XCircle className="w-3 h-3 text-orange-400" />;
    case 'security_alert':
      return <AlertTriangle className="w-3 h-3 text-red-400" />;
    default:
      return null;
  }
}

function formatActionLabel(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStatus(status: string): string {
  switch (status) {
    case 'success':
      return 'Succès';
    case 'failure':
      return 'Échec';
    case 'security_alert':
      return 'Alerte';
    default:
      return status;
  }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function truncateUserAgent(ua: string | null): string {
  if (!ua) return '—';
  // Extract browser name and OS
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE)\/[\d.]+/)?.[1];
  const os = ua.match(/(Windows|Mac OS X|Linux|Android|iOS|iPhone|iPad)[\w._ ()-]*/)?.[1]?.trim();
  const parts = [browser, os].filter(Boolean);
  if (parts.length === 0) return ua.length > 40 ? ua.slice(0, 40) + '…' : ua;
  return parts.join(' · ');
}

/* ═══════════════════════════════════════════════════════
   PULSE DOT — subtle live indicator
   ═══════════════════════════════════════════════════════ */

function PulseDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════ */

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  colorClass: string;
  loading?: boolean;
}

function StatCard({ icon, label, value, colorClass, loading }: StatCardProps) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex items-center gap-3.5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#64748b] tracking-wide uppercase font-medium truncate">{label}</p>
        {loading ? (
          <Skeleton className="h-7 w-16 mt-1 bg-white/[0.06]" />
        ) : (
          <p className="text-xl font-bold text-[#e2e8f0] mt-0.5 font-mono tabular-nums">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MOBILE LOG CARD — compact card for small screens
   ═══════════════════════════════════════════════════════ */

interface MobileLogCardProps {
  log: AuditLog;
  index: number;
}

function MobileLogCard({ log, index }: MobileLogCardProps) {
  const statusIcon = getStatusIcon(log.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.02 + index * 0.02, duration: 0.3 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3.5 space-y-2"
    >
      {/* Top row: action + status + time */}
      <div className="flex items-center justify-between gap-2">
        <Badge
          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${getActionBadgeClasses(log.action)}`}
        >
          {formatActionLabel(log.action)}
        </Badge>
        <div className="flex items-center gap-2 shrink-0">
          {log.status && (
            <Badge
              className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeClasses(log.status)}`}
            >
              {statusIcon}
              <span className="ml-1">{formatStatus(log.status)}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* User */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[#e2e8f0] font-medium truncate">
          {log.user ? (log.user.name || log.user.email) : 'Système'}
        </span>
        {log.user?.role && (
          <span className="text-[10px] text-[#475569]">({log.user.role})</span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[10px] text-[#475569]">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDateTime(log.createdAt)}
        </span>
        {log.ip && (
          <span className="font-mono">{log.ip}</span>
        )}
        {log.country && (
          <span className="flex items-center gap-0.5">
            <Globe className="w-3 h-3" />
            {log.country}
          </span>
        )}
      </div>

      {/* Details */}
      {log.details && (
        <p className="text-xs text-[#64748b] truncate">{log.details}</p>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

const AUTO_REFRESH_MS = 30_000;

export function SecurityAuditPanel() {
  /* ── State ── */
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Stats
  const [stats, setStats] = useState<AuditStats>({
    total: 0,
    securityAlerts: 0,
    failedActions: 0,
    success: 0,
  });

  // Auto-refresh
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Details modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  /* ── Build query params ── */
  const buildParams = useCallback(
    (overrides?: { page?: number; limit?: number; exportCsv?: boolean }) => {
      const params = new URLSearchParams();
      const p = overrides?.page ?? page;
      const l = overrides?.limit ?? 50;
      params.set('page', String(p));
      params.set('limit', String(l));
      if (actionFilter) params.set('action', actionFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (countryFilter) params.set('country', countryFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (overrides?.exportCsv) params.set('export', 'csv');
      return params;
    },
    [page, actionFilter, statusFilter, countryFilter, startDate, endDate]
  );

  /* ── Fetch logs ── */
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const res = await fetch(`/api/admin/audit?${params}`);
      const data: AuditResponse = await res.json();

      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setLastRefresh(new Date());
      } else {
        toast.error(data.error || 'Erreur lors du chargement');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  /* ── Fetch stats (separate call to avoid filter overhead) ── */
  const fetchStats = useCallback(async () => {
    try {
      const baseParams = buildParams({ page: 1, limit: 1 });
      const [allRes, alertRes, failRes, successRes] = await Promise.all([
        fetch(`/api/admin/audit?${buildParams({ page: 1, limit: 1 })}`),
        fetch(`/api/admin/audit?${new URLSearchParams({ ...Object.fromEntries(baseParams), status: 'security_alert' })}`),
        fetch(`/api/admin/audit?${new URLSearchParams({ ...Object.fromEntries(baseParams), status: 'failure' })}`),
        fetch(`/api/admin/audit?${new URLSearchParams({ ...Object.fromEntries(baseParams), status: 'success' })}`),
      ]);

      const [allData, alertData, failData, successData] = await Promise.all([
        allRes.json(),
        alertRes.json(),
        failRes.json(),
        successRes.json(),
      ]);

      setStats({
        total: allData.total ?? 0,
        securityAlerts: alertData.total ?? 0,
        failedActions: failData.total ?? 0,
        success: successData.total ?? 0,
      });
    } catch {
      // Silent — stats are supplementary
    }
  }, [buildParams]);

  /* ── Auto-refresh ── */
  useEffect(() => {
    if (!isAutoRefresh) {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      return;
    }

    refreshTimerRef.current = setInterval(() => {
      fetchLogs();
    }, AUTO_REFRESH_MS);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [isAutoRefresh, fetchLogs]);

  /* ── Initial load & filter changes ── */
  useEffect(() => {
    setPage(1);
    fetchLogs();
    fetchStats();
  }, [actionFilter, statusFilter, countryFilter, startDate, endDate]);

  useEffect(() => {
    if (page > 1) fetchLogs();
  }, [page]);

  /* ── CSV Export ── */
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = buildParams({ exportCsv: true });
      const res = await fetch(`/api/admin/audit?${params}`);

      if (!res.ok) {
        toast.error('Erreur lors de l\'export');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Export CSV téléchargé');
    } catch {
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  /* ── Clear filters ── */
  const hasActiveFilters = actionFilter || statusFilter || countryFilter || startDate || endDate;

  const clearFilters = () => {
    setActionFilter('');
    setStatusFilter('');
    setCountryFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  /* ── Pagination ── */
  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  const pageNumbers = (() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  })();

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#d4a853]/15 border border-[#d4a853]/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#d4a853]" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-semibold tracking-tight text-[#e2e8f0]">
              Audit de sécurité
            </h2>
            <p className="text-[10px] text-[#475569]">
              Journal d&apos;activité complet avec filtrage avancé
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`text-xs gap-1.5 h-8 px-3 rounded-lg ${
              isAutoRefresh
                ? 'text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/15'
                : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.04]'
            }`}
          >
            {isAutoRefresh && <PulseDot />}
            {isAutoRefresh ? 'Auto-refresh' : 'Pause'}
          </Button>

          {/* Export CSV */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportCsv}
            disabled={exporting}
            className="text-xs gap-1.5 h-8 px-3 rounded-lg text-[#d4a853] hover:text-[#d4a853] hover:bg-[#d4a853]/10"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* ═══ STATS CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<FileText className="w-5 h-5 text-[#94a3b8]" />}
          label="Total événements"
          value={loading ? '—' : stats.total}
          colorClass="bg-slate-500/10"
          loading={loading}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
          label="Alertes sécurité"
          value={loading ? '—' : stats.securityAlerts}
          colorClass="bg-red-500/10"
          loading={loading}
        />
        <StatCard
          icon={<XCircle className="w-5 h-5 text-orange-400" />}
          label="Actions échouées"
          value={loading ? '—' : stats.failedActions}
          colorClass="bg-orange-500/10"
          loading={loading}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
          label="Succès"
          value={loading ? '—' : stats.success}
          colorClass="bg-emerald-500/10"
          loading={loading}
        />
      </div>

      {/* ═══ FILTER BAR ═══ */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-[#d4a853]" />
          <span className="text-sm font-medium text-[#94a3b8]">Filtres</span>
          {hasActiveFilters && (
            <Badge className="bg-[#d4a853]/10 text-[#d4a853] border-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1">
              Actifs
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Action */}
          <Select value={actionFilter} onValueChange={(v) => setActionFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger
              size="sm"
              className="w-full bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] rounded-lg text-xs h-9"
            >
              <SelectValue placeholder="Type d'action" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || '__all__'} value={opt.value || '__all__'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger
              size="sm"
              className="w-full bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] rounded-lg text-xs h-9"
            >
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || '__all__'} value={opt.value || '__all__'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Country */}
          <div className="relative">
            <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569]" />
            <Input
              placeholder="Pays (ex: France)"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="pl-8 bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] text-xs h-9 rounded-lg placeholder:text-[#475569]"
            />
          </div>

          {/* Start Date */}
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] text-xs h-9 rounded-lg [color-scheme:dark]"
          />

          {/* End Date */}
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] text-xs h-9 rounded-lg [color-scheme:dark]"
          />
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-7 px-2.5 text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04]"
              >
                Réinitialiser
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchLogs()}
              className="text-xs h-7 px-2.5 text-[#64748b] hover:text-[#d4a853] hover:bg-[#d4a853]/10"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Rafraîchir
            </Button>
            {lastRefresh && (
              <span className="text-[10px] text-[#334155]">
                Dernière MAJ : {lastRefresh.toLocaleTimeString('fr-FR')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ RESULTS TABLE ═══ */}

      {/* Desktop table (hidden on mobile) */}
      <div className="hidden md:block bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d4a853]/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#d4a853]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#e2e8f0]">Résultats</h3>
              <p className="text-[10px] text-[#475569]">
                {loading ? 'Chargement…' : `${total} événement${total !== 1 ? 's' : ''} · Page ${page}/${totalPages}`}
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-white/[0.04] rounded-lg" />
              ))}
            </div>
          ) : logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold px-4 py-3">
                    Date
                  </TableHead>
                  <TableHead className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold px-4 py-3">
                    Utilisateur
                  </TableHead>
                  <TableHead className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold px-4 py-3">
                    Action
                  </TableHead>
                  <TableHead className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold px-4 py-3">
                    IP
                  </TableHead>
                  <TableHead className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold px-4 py-3">
                    Pays
                  </TableHead>
                  <TableHead className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold px-4 py-3">
                    User-Agent
                  </TableHead>
                  <TableHead className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold px-4 py-3">
                    Statut
                  </TableHead>
                  <TableHead className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold px-4 py-3 w-10">
                    <span className="sr-only">Détails</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, i) => (
                  <TableRow
                    key={log.id}
                    className="border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                  >
                    <TableCell className="px-4 py-3 text-xs text-[#94a3b8] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#475569]" />
                        {formatDateTime(log.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-[#e2e8f0] font-medium truncate max-w-[160px]">
                          {log.user ? (log.user.name || log.user.email || 'Inconnu') : 'Système'}
                        </span>
                        {log.user?.email && (
                          <span className="text-[10px] text-[#475569] truncate max-w-[160px]">
                            {log.user.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${getActionBadgeClasses(log.action)}`}
                      >
                        {formatActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs font-mono text-[#64748b]">
                      {log.ip || '—'}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {log.country ? (
                        <div className="flex items-center gap-1 text-xs text-[#94a3b8]">
                          <Globe className="w-3 h-3 text-[#475569]" />
                          <span>{log.country}</span>
                          {log.city && (
                            <span className="text-[#475569]">· {log.city}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#475569]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[10px] text-[#64748b] max-w-[140px] truncate" title={log.userAgent || undefined}>
                        <Monitor className="w-3 h-3 shrink-0 text-[#475569]" />
                        <span className="truncate">{truncateUserAgent(log.userAgent)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap gap-1 ${getStatusBadgeClasses(log.status || '')} ${
                          log.status === 'security_alert' ? 'animate-pulse' : ''
                        }`}
                      >
                        {getStatusIcon(log.status)}
                        <span>{formatStatus(log.status || '')}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#475569] hover:text-[#d4a853] hover:bg-[#d4a853]/10"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#475569]" />
              </div>
              <p className="text-sm font-medium text-[#64748b]">Aucun événement trouvé</p>
              <p className="text-xs text-[#475569] mt-1">
                Ajustez vos filtres ou attendez de nouvelles activités
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-[10px] text-[#475569]">
              {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} sur {total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#64748b] hover:text-[#d4a853] hover:bg-[#d4a853]/10 disabled:opacity-30"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {pageNumbers.map((p, idx) =>
                typeof p === 'string' ? (
                  <span key={`ellipsis-${idx}`} className="text-[10px] text-[#475569] px-1">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 text-xs font-medium rounded-lg ${
                      p === page
                        ? 'bg-[#d4a853]/15 text-[#d4a853] hover:bg-[#d4a853]/20'
                        : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04]'
                    }`}
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </Button>
                )
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#64748b] hover:text-[#d4a853] hover:bg-[#d4a853]/10 disabled:opacity-30"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ MOBILE CARDS (visible only on small screens) ═══ */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full bg-white/[0.04] rounded-xl" />
            ))}
          </div>
        ) : logs.length > 0 ? (
          logs.map((log, i) => (
            <MobileLogCard key={log.id} log={log} index={i} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-[#475569]" />
            </div>
            <p className="text-sm font-medium text-[#64748b]">Aucun événement</p>
          </div>
        )}

        {/* Mobile pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2 pb-4">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="text-xs text-[#64748b] hover:text-[#d4a853] hover:bg-[#d4a853]/10"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Préc.
            </Button>
            <span className="text-xs text-[#94a3b8] font-medium px-3">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              className="text-xs text-[#64748b] hover:text-[#d4a853] hover:bg-[#d4a853]/10"
            >
              Suiv.
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* ═══ DETAIL MODAL ═══ */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              className="bg-[#0f172a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#d4a853]/10 flex items-center justify-center">
                    <Eye className="w-4.5 h-4.5 text-[#d4a853]" />
                  </div>
                  <h3 className="text-base font-serif font-semibold text-[#e2e8f0]">
                    Détails de l&apos;événement
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.06] rounded-lg"
                  onClick={() => setSelectedLog(null)}
                >
                  ✕
                </Button>
              </div>

              {/* Content */}
              <div className="space-y-3.5">
                <DetailRow icon={<Clock className="w-3.5 h-3.5" />} label="Date" value={formatDateTime(selectedLog.createdAt)} />
                <DetailRow
                  icon={<Shield className="w-3.5 h-3.5" />}
                  label="Action"
                  value={
                    <Badge className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getActionBadgeClasses(selectedLog.action)}`}>
                      {formatActionLabel(selectedLog.action)}
                    </Badge>
                  }
                />
                <DetailRow
                  icon={<CheckCircle className="w-3.5 h-3.5" />}
                  label="Statut"
                  value={
                    <Badge className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border gap-1 ${getStatusBadgeClasses(selectedLog.status || '')}`}>
                      {getStatusIcon(selectedLog.status)}
                      <span>{formatStatus(selectedLog.status || '')}</span>
                    </Badge>
                  }
                />
                <DetailRow
                  icon={<Search className="w-3.5 h-3.5" />}
                  label="Utilisateur"
                  value={selectedLog.user
                    ? `${selectedLog.user.name || 'Inconnu'} ${selectedLog.user.email ? `(${selectedLog.user.email})` : ''}`
                    : 'Système'}
                />
                {selectedLog.user?.role && (
                  <DetailRow icon={<Shield className="w-3.5 h-3.5" />} label="Rôle" value={selectedLog.user.role} />
                )}
                {selectedLog.ip && (
                  <DetailRow icon={<Globe className="w-3.5 h-3.5" />} label="Adresse IP" value={selectedLog.ip} isMono />
                )}
                {selectedLog.country && (
                  <DetailRow icon={<Globe className="w-3.5 h-3.5" />} label="Localisation" value={`${selectedLog.country}${selectedLog.city ? ` · ${selectedLog.city}` : ''}`} />
                )}
                {selectedLog.userAgent && (
                  <DetailRow icon={<Monitor className="w-3.5 h-3.5" />} label="User-Agent" value={selectedLog.userAgent} />
                )}
                {selectedLog.details && (
                  <DetailRow icon={<FileText className="w-3.5 h-3.5" />} label="Détails" value={selectedLog.details} />
                )}
              </div>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <p className="text-[10px] text-[#334155] font-mono">ID: {selectedLog.id}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DETAIL ROW — for modal
   ═══════════════════════════════════════════════════════ */

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  isMono?: boolean;
}

function DetailRow({ icon, label, value, isMono }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center shrink-0 text-[#475569] mt-0.5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold mb-0.5">{label}</p>
        <div className={`text-sm text-[#e2e8f0] break-all ${isMono ? 'font-mono text-xs' : ''}`}>
          {value}
        </div>
      </div>
    </div>
  );
}
