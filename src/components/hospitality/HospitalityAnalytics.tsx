'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  BarChart3,
  ClipboardCheck,
  AlertTriangle,
  Hotel,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Clock,
  Phone,
  PhoneOff,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  RefreshCw,
  Eye,
  EyeOff,
  Search,
  Sparkles,
  Shield,
  MapPin,
  Home,
  Wrench,
  Volume2,
  XCircle,
  Filter,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

/* ═══════════════════════════════════════════════════════════
   MAELLIS — Hospitality Analytics Dashboard
   
   Comprehensive analytics view for the hospitality module.
   5 tabs: Overview, Daily Checks, Host Alerts, Stay Reports,
   Recurring Issues.
   ═══════════════════════════════════════════════════════════ */

/* ── Types ── */

interface KPIs {
  averageScore: number;
  satisfactionRate: number;
  totalStaysAnalyzed: number;
  totalAlerts: number;
  totalReports: number;
  completedChecks: number;
}

interface DailyCheck {
  id: string;
  checkInStateId: string | null;
  guestName: string;
  checkDate: string;
  checkType: string;
  status: string;
  callId: string | null;
  durationSec: number | null;
  transcription: string | null;
  overallScore: number | null;
  sentiment: string | null;
  issues: string;
  keywords: string;
  aiSummary: string | null;
  hostAlerted: boolean;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface HostAlert {
  id: string;
  householdId: string;
  dailyCheckId: string | null;
  checkInStateId: string | null;
  guestName: string;
  severity: string;
  category: string;
  message: string;
  transcription: string | null;
  status: string;
  notifiedVia: string | null;
  notifiedAt: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  dailyCheck?: { id: string; checkType: string; overallScore: number | null; sentiment: string | null } | null;
}

interface StayReport {
  id: string;
  householdId: string;
  checkInStateId: string;
  guestName: string;
  checkInAt: string;
  checkOutAt: string | null;
  cleanliness: number | null;
  comfort: number | null;
  equipment: number | null;
  location: number | null;
  hostContact: number | null;
  valueForMoney: number | null;
  overallScore: number | null;
  sentiment: string;
  sentimentScore: number | null;
  verbatim: string | null;
  highlights: string;
  painPoints: string;
  keywords: string;
  aiSummary: string | null;
  recommendation: string | null;
  publicReview: string | null;
  dailyCheckCount: number;
  totalAlerts: number;
  resolvedAlerts: number;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface RecurringIssue {
  issue: string;
  count: number;
  label: string;
}

interface AnalyticsData {
  kpis: KPIs;
  recentChecks: DailyCheck[];
  reports: StayReport[];
  recentAlerts: HostAlert[];
  recurringIssues: RecurringIssue[];
  sentimentDistribution: { sentiment: string; count: number }[];
  alertSeverityDistribution: { severity: string; count: number }[];
  categoryAverages: {
    cleanliness: number;
    comfort: number;
    equipment: number;
    location: number;
    hostContact: number;
    valueForMoney: number;
  };
}

/* ── Helpers ── */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getScoreColor(score: number): string {
  if (score >= 5) return 'text-emerald-400';
  if (score >= 4) return 'text-lime-400';
  if (score >= 3) return 'text-amber-400';
  if (score >= 2) return 'text-orange-400';
  return 'text-red-400';
}

function getSentimentConfig(sentiment: string) {
  switch (sentiment) {
    case 'positive':
      return { label: 'Positif', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' };
    case 'neutral':
      return { label: 'Neutre', color: 'bg-slate-500/15 text-slate-400 border-slate-500/20' };
    case 'negative':
      return { label: 'Négatif', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' };
    case 'critical':
      return { label: 'Critique', color: 'bg-red-500/15 text-red-400 border-red-500/20' };
    default:
      return { label: '—', color: 'bg-white/[0.04] text-[#64748b] border-white/[0.06]' };
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'completed':
      return { label: 'Complété', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' };
    case 'pending':
      return { label: 'En attente', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' };
    case 'calling':
      return { label: 'Appel en cours', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' };
    case 'no_answer':
      return { label: 'Pas de réponse', color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' };
    case 'failed':
      return { label: 'Échoué', color: 'bg-red-500/15 text-red-400 border-red-500/20' };
    case 'sent':
      return { label: 'Envoyé', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' };
    case 'acknowledged':
      return { label: 'Acquitté', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' };
    case 'resolved':
      return { label: 'Résolu', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' };
    case 'dismissed':
      return { label: 'Ignoré', color: 'bg-slate-500/15 text-slate-400 border-slate-500/20' };
    default:
      return { label: status, color: 'bg-white/[0.04] text-[#64748b] border-white/[0.06]' };
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'low': return 'border-l-blue-400';
    case 'medium': return 'border-l-amber-400';
    case 'high': return 'border-l-orange-400';
    case 'critical': return 'border-l-red-400';
    default: return 'border-l-slate-400';
  }
}

function getCheckTypeConfig(type: string) {
  switch (type) {
    case 'arrival':
      return { label: 'Arrivée', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: Phone };
    case 'daily':
      return { label: 'Quotidien', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: Phone };
    case 'departure':
      return { label: 'Départ', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: Phone };
    default:
      return { label: type, color: 'bg-white/[0.04] text-[#64748b] border-white/[0.06]', icon: Phone };
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'cleanliness': return Sparkles;
    case 'equipment': return Wrench;
    case 'noise': return Volume2;
    case 'safety': return Shield;
    case 'comfort': return Home;
    case 'location': return MapPin;
    default: return AlertCircle;
  }
}

function getCategoryLabel(category: string) {
  switch (category) {
    case 'cleanliness': return 'Propreté';
    case 'equipment': return 'Équipement';
    case 'noise': return 'Bruit';
    case 'safety': return 'Sécurité';
    case 'comfort': return 'Confort';
    case 'location': return 'Emplacement';
    default: return category;
  }
}

/* ── Animation variants ── */

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

/* ── Radar Chart SVG ── */

function RadarChart({ scores }: { scores: { cleanliness: number; comfort: number; equipment: number; location: number; hostContact: number; valueForMoney: number } }) {
  const labels = ['Propreté', 'Confort', 'Équipement', 'Emplacement', 'Contact', 'Q/P'];
  const keys = ['cleanliness', 'comfort', 'equipment', 'location', 'hostContact', 'valueForMoney'] as const;
  const values = keys.map(k => Math.max(0, scores[k] || 0));
  const cx = 100, cy = 100, maxR = 75;
  const n = 6;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  function getPoint(i: number, r: number) {
    const angle = startAngle + i * angleStep;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  // Grid rings
  const rings = [1, 2, 3, 4, 5];
  const ringPoints = rings.map(level => {
    const r = (level / 5) * maxR;
    return Array.from({ length: n }, (_, i) => {
      const p = getPoint(i, r);
      return `${p.x},${p.y}`;
    }).join(' ');
  });

  // Data polygon
  const dataPoints = values.map((v, i) => {
    const r = (v / 5) * maxR;
    const p = getPoint(i, r);
    return `${p.x},${p.y}`;
  }).join(' ');

  // Labels
  const labelPositions = Array.from({ length: n }, (_, i) => {
    const p = getPoint(i, maxR + 16);
    return { x: p.x, y: p.y, label: labels[i] };
  });

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full max-w-[200px] mx-auto">
      {/* Grid rings */}
      {ringPoints.map((pts, idx) => (
        <polygon
          key={idx}
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.8"
        />
      ))}
      {/* Axes */}
      {Array.from({ length: n }, (_, i) => {
        const p = getPoint(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />;
      })}
      {/* Data polygon */}
      <polygon
        points={dataPoints}
        fill="rgba(212,168,83,0.12)"
        stroke="rgba(212,168,83,0.7)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Data points */}
      {values.map((v, i) => {
        const r = (v / 5) * maxR;
        const p = getPoint(i, r);
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#d4a853"
            stroke="#020617"
            strokeWidth="1"
          />
        );
      })}
      {/* Labels */}
      {labelPositions.map((lp, i) => (
        <text
          key={i}
          x={lp.x}
          y={lp.y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[#94a3b8]"
          fontSize="7.5"
          fontFamily="system-ui, sans-serif"
        >
          {lp.label}
        </text>
      ))}
    </svg>
  );
}

/* ═══ MAIN COMPONENT ═══ */

export function HospitalityAnalytics() {
  /* ── State ── */
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Daily checks
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([]);
  const [checksLoading, setChecksLoading] = useState(false);
  const [checksPage, setChecksPage] = useState(1);
  const [checksTotalPages, setChecksTotalPages] = useState(1);
  const [checksStatusFilter, setChecksStatusFilter] = useState<string>('all');
  const [checksSentimentFilter, setChecksSentimentFilter] = useState<string>('all');
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);

  // Host alerts
  const [alerts, setAlerts] = useState<HostAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsPage, setAlertsPage] = useState(1);
  const [alertsTotalPages, setAlertsTotalPages] = useState(1);
  const [alertsStatusFilter, setAlertsStatusFilter] = useState<string>('all');
  const [alertsSeverityFilter, setAlertsSeverityFilter] = useState<string>('all');
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveAlertId, setResolveAlertId] = useState<string | null>(null);
  const [resolveComment, setResolveComment] = useState('');
  const [resolving, setResolving] = useState(false);

  // Stay reports
  const [reports, setReports] = useState<StayReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [copiedReviewId, setCopiedReviewId] = useState<string | null>(null);

  /* ── Fetch analytics (overview) ── */
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/hospitality/analytics');
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
        setDailyChecks(data.data.recentChecks || []);
        setAlerts(data.data.recentAlerts || []);
        setReports(data.data.reports || []);
      } else {
        setError(data.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      toast.error('Impossible de charger les analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  /* ── Fetch daily checks (paginated) ── */
  const fetchDailyChecks = useCallback(async (page: number, status: string, sentiment: string) => {
    try {
      setChecksLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status !== 'all') params.set('status', status);
      if (sentiment !== 'all') params.set('sentiment', sentiment);
      const res = await fetch(`/api/hospitality/daily-checks?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      if (data.success) {
        setDailyChecks(data.checks || []);
        setChecksPage(data.pagination?.page || 1);
        setChecksTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      toast.error('Impossible de charger les audits quotidiens');
    } finally {
      setChecksLoading(false);
    }
  }, []);

  /* ── Fetch host alerts (paginated) ── */
  const fetchAlerts = useCallback(async (page: number, status: string, severity: string) => {
    try {
      setAlertsLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status !== 'all') params.set('status', status);
      if (severity !== 'all') params.set('severity', severity);
      const res = await fetch(`/api/hospitality/host-alerts?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts || []);
        setAlertsPage(data.pagination?.page || 1);
        setAlertsTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      toast.error('Impossible de charger les alertes');
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  /* ── Fetch stay reports ── */
  const fetchStayReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      const res = await fetch('/api/hospitality/stay-reports?limit=50');
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch {
      toast.error('Impossible de charger les rapports de séjour');
    } finally {
      setReportsLoading(false);
    }
  }, []);

  /* ── Handle filter changes ── */
  const handleChecksFilterChange = useCallback((status: string, sentiment: string) => {
    setChecksStatusFilter(status);
    setChecksSentimentFilter(sentiment);
    fetchDailyChecks(1, status, sentiment);
  }, [fetchDailyChecks]);

  const handleAlertsFilterChange = useCallback((status: string, severity: string) => {
    setAlertsStatusFilter(status);
    setAlertsSeverityFilter(severity);
    fetchAlerts(1, status, severity);
  }, [fetchAlerts]);

  /* ── Alert actions ── */
  const handleAlertAction = useCallback(async (alertId: string, action: string, resolution?: string) => {
    try {
      setResolving(true);
      const res = await fetch('/api/hospitality/host-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, action, resolution: resolution || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Action effectuée');
        fetchAnalytics();
        fetchAlerts(alertsPage, alertsStatusFilter, alertsSeverityFilter);
      } else {
        toast.error(data.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de l\'action');
    } finally {
      setResolving(false);
      setResolveDialogOpen(false);
      setResolveComment('');
    }
  }, [fetchAnalytics, fetchAlerts, alertsPage, alertsStatusFilter, alertsSeverityFilter]);

  const openResolveDialog = useCallback((alertId: string) => {
    setResolveAlertId(alertId);
    setResolveComment('');
    setResolveDialogOpen(true);
  }, []);

  /* ── Copy public review ── */
  const copyPublicReview = useCallback(async (reportId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedReviewId(reportId);
      toast.success('Avis copié dans le presse-papier');
      setTimeout(() => setCopiedReviewId(null), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  }, []);

  /* ── Render stars ── */
  const renderStars = (score: number, size: string = 'w-4 h-4') => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${size} ${s <= Math.round(score) ? 'text-[#d4a853] fill-[#d4a853]' : 'text-white/10'}`}
        />
      ))}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     LOADING STATE
     ═══════════════════════════════════════════════════════════ */
  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-7 w-56" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-64 rounded-2xl bg-white/[0.03]" />
          <Skeleton className="h-48 rounded-2xl bg-white/[0.03]" />
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/15 mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-serif text-[#f1f5f9] mb-2">Erreur de chargement</h3>
        <p className="text-sm text-[#64748b] mb-6">{error}</p>
        <Button
          onClick={fetchAnalytics}
          variant="outline"
          className="border-[var(--accent-primary)]/25 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  const kpis = analytics?.kpis;
  const recurringIssues = analytics?.recurringIssues || [];

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--accent-primary)]/10 rounded-xl border border-[var(--accent-primary)]/15">
            <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h2 className="text-xl font-serif text-gradient-gold">
              Analytics Hospitalité
            </h2>
            <p className="text-xs text-[#64748b]">
              Départ sécurisé & Concierge quotidien
            </p>
          </div>
        </div>
        <Button
          onClick={fetchAnalytics}
          variant="outline"
          size="sm"
          className="border-white/[0.08] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.04]"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Actualiser
        </Button>
      </motion.div>

      {/* ═══ TABS ═══ */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 h-auto flex flex-wrap gap-1">
          <TabsTrigger
            value="overview"
            className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-3 py-2"
          >
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger
            value="daily-checks"
            className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-3 py-2"
          >
            <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
            Audits Quotidiens
          </TabsTrigger>
          <TabsTrigger
            value="host-alerts"
            className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-3 py-2"
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            Alertes Hôte
          </TabsTrigger>
          <TabsTrigger
            value="stay-reports"
            className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-3 py-2"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Rapports de Séjour
          </TabsTrigger>
          <TabsTrigger
            value="recurring"
            className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-3 py-2"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Problèmes Récurrents
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════
           TAB 1: VUE D'ENSEMBLE
           ═══════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* KPI: Note Moyenne */}
            <motion.div variants={staggerItem}>
              <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden hover:border-[var(--accent-primary)]/20 transition-all duration-300">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
                      <Star className="w-4 h-4 text-[var(--accent-primary)]" />
                    </div>
                    <span className="text-3xl font-bold text-gradient-gold font-serif">
                      {kpis?.averageScore?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b] mb-2">Note Moyenne</p>
                  {renderStars(kpis?.averageScore ?? 0, 'w-3.5 h-3.5')}
                </div>
              </Card>
            </motion.div>

            {/* KPI: Taux de Satisfaction */}
            <motion.div variants={staggerItem}>
              <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden hover:border-[var(--accent-primary)]/20 transition-all duration-300">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${(kpis?.satisfactionRate ?? 0) >= 80 ? 'bg-emerald-500/10' : (kpis?.satisfactionRate ?? 0) >= 60 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                      <ThumbsUp className={`w-4 h-4 ${(kpis?.satisfactionRate ?? 0) >= 80 ? 'text-emerald-400' : (kpis?.satisfactionRate ?? 0) >= 60 ? 'text-amber-400' : 'text-red-400'}`} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-3xl font-bold font-serif ${(kpis?.satisfactionRate ?? 0) >= 80 ? 'text-emerald-400' : (kpis?.satisfactionRate ?? 0) >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                        {kpis?.satisfactionRate ?? 0}
                      </span>
                      <span className="text-lg text-[#64748b]">%</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#64748b] mb-2">Taux de Satisfaction</p>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${kpis?.satisfactionRate ?? 0}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                      className={`h-full rounded-full ${(kpis?.satisfactionRate ?? 0) >= 80 ? 'bg-emerald-400' : (kpis?.satisfactionRate ?? 0) >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* KPI: Séjours Analysés */}
            <motion.div variants={staggerItem}>
              <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden hover:border-[var(--accent-primary)]/20 transition-all duration-300">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Hotel className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-3xl font-bold text-[#f1f5f9] font-serif">
                      {kpis?.totalReports ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b] mb-2">Séjours Analysés</p>
                  <p className="text-[10px] text-[#475569]">
                    {kpis?.completedChecks ?? 0} audits complétés
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* KPI: Alertes Actives */}
            <motion.div variants={staggerItem}>
              <Card className={`glass rounded-2xl border-white/[0.06] overflow-hidden hover:border-[var(--accent-primary)]/20 transition-all duration-300 ${(kpis?.totalAlerts ?? 0) > 0 ? 'ring-1 ring-red-500/15' : ''}`}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${(kpis?.totalAlerts ?? 0) > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                      <AlertTriangle className={`w-4 h-4 ${(kpis?.totalAlerts ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
                    </div>
                    <span className={`text-3xl font-bold font-serif ${(kpis?.totalAlerts ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {kpis?.totalAlerts ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b] mb-2">Alertes Actives</p>
                  {(kpis?.totalAlerts ?? 0) > 0 && (
                    <p className="text-[10px] text-red-400/80 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Nécessite attention
                    </p>
                  )}
                  {(kpis?.totalAlerts ?? 0) === 0 && (
                    <p className="text-[10px] text-emerald-400/80 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Tout est calme
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Recent alerts + Recent checks summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Alerts Preview */}
            <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden">
              <div className="p-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Dernières Alertes</h3>
                </div>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full border-white/[0.08] text-[#64748b]">
                  {(analytics?.recentAlerts?.length ?? 0)} récentes
                </Badge>
              </div>
              <div className="max-h-[300px] overflow-y-auto scrollbar-luxe px-5 pb-4">
                {(!analytics?.recentAlerts || analytics.recentAlerts.length === 0) ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Check className="w-8 h-8 text-emerald-400/40 mb-2" />
                    <p className="text-xs text-[#64748b]">Aucune alerte récente</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analytics.recentAlerts.slice(0, 5).map((alert) => {
                      const sevColor = getSeverityColor(alert.severity);
                      const statusConf = getStatusConfig(alert.status);
                      const CatIcon = getCategoryIcon(alert.category);
                      return (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-xl bg-white/[0.02] border-l-2 ${sevColor} border border-white/[0.04] hover:bg-white/[0.04] transition-colors`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <CatIcon className="w-3.5 h-3.5 text-[#94a3b8]" />
                              <span className="text-xs font-medium text-[#e2e8f0]">{alert.guestName}</span>
                            </div>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-full border ${statusConf.color}`}>
                              {statusConf.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#64748b] line-clamp-2">{alert.message}</p>
                          <p className="text-[10px] text-[#475569] mt-1.5">{formatDateTime(alert.createdAt)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Category Averages */}
            <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden">
              <div className="p-5 pb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent-primary)]" />
                <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Scores par Catégorie</h3>
              </div>
              <div className="p-5 pt-2">
                {analytics?.categoryAverages && (
                  <RadarChart scores={analytics.categoryAverages} />
                )}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {Object.entries(analytics?.categoryAverages ?? {}).map(([key, val]) => {
                    const labels: Record<string, string> = {
                      cleanliness: 'Propreté',
                      comfort: 'Confort',
                      equipment: 'Équip.',
                      location: 'Emplac.',
                      hostContact: 'Contact',
                      valueForMoney: 'Q/P',
                    };
                    return (
                      <div key={key} className="text-center p-2 rounded-lg bg-white/[0.02]">
                        <p className="text-[10px] text-[#64748b]">{labels[key]}</p>
                        <p className={`text-sm font-bold ${getScoreColor(val)}`}>{val.toFixed(1)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Sentiment Distribution */}
          <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden">
            <div className="p-5 pb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--accent-primary)]" />
              <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Distribution des Sentiments</h3>
            </div>
            <div className="px-5 pb-5">
              {analytics?.sentimentDistribution && analytics.sentimentDistribution.length > 0 ? (
                <div className="flex gap-3 h-8">
                  {analytics.sentimentDistribution.map((s) => {
                    const conf = getSentimentConfig(s.sentiment);
                    const total = analytics.sentimentDistribution.reduce((sum, x) => sum + x.count, 0);
                    const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                    return (
                      <div key={s.sentiment} className="flex-1 rounded-lg overflow-hidden relative" style={{ flexBasis: `${Math.max(pct, 8)}%` }}>
                        <div className={`w-full h-full ${conf.color.split(' ')[0]} flex items-center justify-center`}>
                          <span className="text-[10px] font-medium">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#64748b] text-center py-4">Aucune donnée de sentiment disponible</p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════
           TAB 2: AUDITS QUOTIDIENS
           ═══════════════════════════════════════════════════ */}
        <TabsContent value="daily-checks" className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#64748b]" />
              <span className="text-xs text-[#64748b]">Filtres :</span>
            </div>
            <Select
              value={checksStatusFilter}
              onValueChange={(v) => handleChecksFilterChange(v, checksSentimentFilter)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a12] border-white/[0.08] rounded-lg">
                <SelectItem value="all" className="text-xs text-[#e2e8f0]">Tous les statuts</SelectItem>
                <SelectItem value="completed" className="text-xs text-[#e2e8f0]">Complété</SelectItem>
                <SelectItem value="pending" className="text-xs text-[#e2e8f0]">En attente</SelectItem>
                <SelectItem value="no_answer" className="text-xs text-[#e2e8f0]">Pas de réponse</SelectItem>
                <SelectItem value="failed" className="text-xs text-[#e2e8f0]">Échoué</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={checksSentimentFilter}
              onValueChange={(v) => handleChecksFilterChange(checksStatusFilter, v)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a12] border-white/[0.08] rounded-lg">
                <SelectItem value="all" className="text-xs text-[#e2e8f0]">Tous sentiments</SelectItem>
                <SelectItem value="positive" className="text-xs text-[#e2e8f0]">Positif</SelectItem>
                <SelectItem value="neutral" className="text-xs text-[#e2e8f0]">Neutre</SelectItem>
                <SelectItem value="negative" className="text-xs text-[#e2e8f0]">Négatif</SelectItem>
                <SelectItem value="critical" className="text-xs text-[#e2e8f0]">Critique</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full border-white/[0.08] text-[#64748b] ml-auto">
              Page {checksPage} / {checksTotalPages}
            </Badge>
          </div>

          {/* Checks List */}
          <div className="max-h-[600px] overflow-y-auto scrollbar-luxe space-y-3 pr-1">
            {checksLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl bg-white/[0.03]" />
              ))
            ) : dailyChecks.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <ClipboardCheck className="w-10 h-10 text-[#475569] mb-3" />
                <p className="text-sm text-[#94a3b8]">Aucun audit trouvé</p>
                <p className="text-xs text-[#475569] mt-1">Les audits apparaîtront ici une fois les appels effectués</p>
              </div>
            ) : (
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
                {dailyChecks.map((check) => {
                  const checkTypeConf = getCheckTypeConfig(check.checkType);
                  const statusConf = getStatusConfig(check.status);
                  const sentimentConf = getSentimentConfig(check.sentiment || 'neutral');
                  const isExpanded = expandedCheckId === check.id;
                  const issuesList = (() => {
                    try { return JSON.parse(check.issues) as string[]; } catch { return []; }
                  })();
                  const keywordsList = (() => {
                    try { return JSON.parse(check.keywords) as string[]; } catch { return []; }
                  })();

                  return (
                    <motion.div key={check.id} variants={staggerItem}>
                      <Card className="glass rounded-xl border-white/[0.06] overflow-hidden hover:border-white/[0.1] transition-all duration-200">
                        <button
                          onClick={() => setExpandedCheckId(isExpanded ? null : check.id)}
                          className="w-full p-4 text-left cursor-pointer"
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-[#e2e8f0]">{check.guestName}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-full border ${checkTypeConf.color}`}>
                              {checkTypeConf.label}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-full border ${statusConf.color}`}>
                              {statusConf.label}
                            </Badge>
                            {check.overallScore && (
                              <span className={`text-xs font-bold ${getScoreColor(check.overallScore)}`}>
                                {check.overallScore}/5
                              </span>
                            )}
                            <span className={`text-[10px] px-1.5 py-0 rounded-full border ${sentimentConf.color}`}>
                              {sentimentConf.label}
                            </span>
                            <span className="text-[10px] text-[#475569] ml-auto flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(check.checkDate)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#64748b]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#64748b]" />
                            )}
                          </div>
                          {check.aiSummary && (
                            <p className="text-xs text-[#64748b] line-clamp-2 leading-relaxed">
                              {check.aiSummary}
                            </p>
                          )}
                        </button>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <Separator className="bg-white/[0.04]" />
                              <div className="p-4 space-y-4 bg-white/[0.01]">
                                {/* Score + Sentiment */}
                                <div className="flex items-center gap-4">
                                  {check.overallScore && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-[#64748b]">Note :</span>
                                      <span className={`text-lg font-bold ${getScoreColor(check.overallScore)}`}>
                                        {check.overallScore}/5
                                      </span>
                                      {renderStars(check.overallScore, 'w-3.5 h-3.5')}
                                    </div>
                                  )}
                                  {check.durationSec && (
                                    <div className="flex items-center gap-1 text-[10px] text-[#64748b]">
                                      <Clock className="w-3 h-3" />
                                      {Math.floor(check.durationSec / 60)}min {check.durationSec % 60}s
                                    </div>
                                  )}
                                </div>

                                {/* AI Summary */}
                                {check.aiSummary && (
                                  <div>
                                    <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">Résumé IA</p>
                                    <p className="text-xs text-[#94a3b8] leading-relaxed">{check.aiSummary}</p>
                                  </div>
                                )}

                                {/* Issues */}
                                {issuesList.length > 0 && (
                                  <div>
                                    <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1.5">Problèmes détectés</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {issuesList.map((issue, idx) => (
                                        <Badge key={idx} variant="outline" className="text-[10px] px-2 py-0.5 rounded-full border-red-500/20 bg-red-500/5 text-red-400">
                                          {issue}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Keywords */}
                                {keywordsList.length > 0 && (
                                  <div>
                                    <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1.5">Mots-clés</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {keywordsList.map((kw, idx) => (
                                        <Badge key={idx} variant="outline" className="text-[10px] px-2 py-0.5 rounded-full border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]">
                                          {kw}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Transcription (if exists) */}
                                {check.transcription && (
                                  <div>
                                    <button
                                      className="text-[10px] text-[#64748b] uppercase tracking-wider flex items-center gap-1 hover:text-[#94a3b8] transition-colors"
                                    >
                                      Transcription brute
                                    </button>
                                    <p className="text-xs text-[#475569] mt-1 italic line-clamp-4 leading-relaxed">
                                      {check.transcription}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Pagination */}
          {checksTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={checksPage <= 1 || checksLoading}
                onClick={() => fetchDailyChecks(checksPage - 1, checksStatusFilter, checksSentimentFilter)}
                className="border-white/[0.08] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.04] text-xs"
              >
                Précédent
              </Button>
              <span className="text-xs text-[#64748b]">{checksPage} / {checksTotalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={checksPage >= checksTotalPages || checksLoading}
                onClick={() => fetchDailyChecks(checksPage + 1, checksStatusFilter, checksSentimentFilter)}
                className="border-white/[0.08] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.04] text-xs"
              >
                Suivant
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════
           TAB 3: ALERTES HÔTE
           ═══════════════════════════════════════════════════ */}
        <TabsContent value="host-alerts" className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#64748b]" />
              <span className="text-xs text-[#64748b]">Filtres :</span>
            </div>
            <Select
              value={alertsStatusFilter}
              onValueChange={(v) => handleAlertsFilterChange(v, alertsSeverityFilter)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a12] border-white/[0.08] rounded-lg">
                <SelectItem value="all" className="text-xs text-[#e2e8f0]">Tous les statuts</SelectItem>
                <SelectItem value="pending" className="text-xs text-[#e2e8f0]">En attente</SelectItem>
                <SelectItem value="sent" className="text-xs text-[#e2e8f0]">Envoyé</SelectItem>
                <SelectItem value="acknowledged" className="text-xs text-[#e2e8f0]">Acquitté</SelectItem>
                <SelectItem value="resolved" className="text-xs text-[#e2e8f0]">Résolu</SelectItem>
                <SelectItem value="dismissed" className="text-xs text-[#e2e8f0]">Ignoré</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={alertsSeverityFilter}
              onValueChange={(v) => handleAlertsFilterChange(alertsStatusFilter, v)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a12] border-white/[0.08] rounded-lg">
                <SelectItem value="all" className="text-xs text-[#e2e8f0]">Toutes sévérités</SelectItem>
                <SelectItem value="low" className="text-xs text-[#e2e8f0]">Faible</SelectItem>
                <SelectItem value="medium" className="text-xs text-[#e2e8f0]">Moyen</SelectItem>
                <SelectItem value="high" className="text-xs text-[#e2e8f0]">Élevé</SelectItem>
                <SelectItem value="critical" className="text-xs text-[#e2e8f0]">Critique</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full border-white/[0.08] text-[#64748b] ml-auto">
              Page {alertsPage} / {alertsTotalPages}
            </Badge>
          </div>

          {/* Alerts List */}
          <div className="max-h-[600px] overflow-y-auto scrollbar-luxe space-y-3 pr-1">
            {alertsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl bg-white/[0.03]" />
              ))
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Check className="w-10 h-10 text-emerald-400/40 mb-3" />
                <p className="text-sm text-[#94a3b8]">Aucune alerte</p>
                <p className="text-xs text-[#475569] mt-1">Aucun problème n&apos;a été détecté</p>
              </div>
            ) : (
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
                {alerts.map((alert) => {
                  const sevColor = getSeverityColor(alert.severity);
                  const statusConf = getStatusConfig(alert.status);
                  const CatIcon = getCategoryIcon(alert.category);
                  const canAcknowledge = alert.status === 'pending' || alert.status === 'sent';
                  const canResolve = alert.status !== 'resolved' && alert.status !== 'dismissed';
                  const canDismiss = alert.status !== 'resolved' && alert.status !== 'dismissed';

                  return (
                    <motion.div key={alert.id} variants={staggerItem}>
                      <Card className={`glass rounded-xl border-l-2 ${sevColor} border border-white/[0.06] overflow-hidden hover:border-white/[0.1] transition-all duration-200`}>
                        <div className="p-4">
                          {/* Header */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <CatIcon className="w-3.5 h-3.5 text-[#94a3b8]" />
                              <span className="text-xs font-medium text-[#94a3b8]">
                                {getCategoryLabel(alert.category)}
                              </span>
                            </div>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-full border ${statusConf.color}`}>
                              {statusConf.label}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 rounded-full border ${
                                alert.severity === 'critical' ? 'border-red-500/25 bg-red-500/10 text-red-400' :
                                alert.severity === 'high' ? 'border-orange-500/25 bg-orange-500/10 text-orange-400' :
                                alert.severity === 'medium' ? 'border-amber-500/25 bg-amber-500/10 text-amber-400' :
                                'border-blue-500/25 bg-blue-500/10 text-blue-400'
                              }`}
                            >
                              {alert.severity === 'critical' ? 'Critique' : alert.severity === 'high' ? 'Élevé' : alert.severity === 'medium' ? 'Moyen' : 'Faible'}
                            </Badge>
                            <span className="text-[10px] text-[#475569] ml-auto">{formatDateTime(alert.createdAt)}</span>
                          </div>

                          {/* Content */}
                          <div className="mb-3">
                            <p className="text-sm font-medium text-[#e2e8f0] mb-0.5">{alert.guestName}</p>
                            <p className="text-xs text-[#94a3b8] leading-relaxed">{alert.message}</p>
                          </div>

                          {/* Resolution (if resolved) */}
                          {alert.resolution && (
                            <div className="mb-3 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                              <p className="text-[10px] text-emerald-400/80 uppercase tracking-wider mb-0.5">Résolution</p>
                              <p className="text-xs text-[#94a3b8]">{alert.resolution}</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            {canAcknowledge && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={resolving}
                                onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                                className="h-7 text-[10px] px-3 rounded-lg border-amber-500/25 text-amber-400 hover:bg-amber-500/10"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Acquitter
                              </Button>
                            )}
                            {canResolve && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={resolving}
                                onClick={() => openResolveDialog(alert.id)}
                                className="h-7 text-[10px] px-3 rounded-lg border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Résoudre
                              </Button>
                            )}
                            {canDismiss && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={resolving}
                                onClick={() => handleAlertAction(alert.id, 'dismiss')}
                                className="h-7 text-[10px] px-3 rounded-lg border-slate-500/25 text-slate-400 hover:bg-slate-500/10"
                              >
                                <EyeOff className="w-3 h-3 mr-1" />
                                Ignorer
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Pagination */}
          {alertsTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={alertsPage <= 1 || alertsLoading}
                onClick={() => fetchAlerts(alertsPage - 1, alertsStatusFilter, alertsSeverityFilter)}
                className="border-white/[0.08] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.04] text-xs"
              >
                Précédent
              </Button>
              <span className="text-xs text-[#64748b]">{alertsPage} / {alertsTotalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={alertsPage >= alertsTotalPages || alertsLoading}
                onClick={() => fetchAlerts(alertsPage + 1, alertsStatusFilter, alertsSeverityFilter)}
                className="border-white/[0.08] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.04] text-xs"
              >
                Suivant
              </Button>
            </div>
          )}

          {/* Resolve Dialog */}
          <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
            <DialogContent className="glass rounded-2xl border-white/[0.08] bg-[#0a0a12]/95 backdrop-blur-xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-gradient-gold font-serif">Résoudre l&apos;alerte</DialogTitle>
                <DialogDescription className="text-[#64748b] text-xs">
                  Ajoutez un commentaire de résolution (optionnel)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={resolveComment}
                  onChange={(e) => setResolveComment(e.target.value)}
                  placeholder="Décrivez comment vous avez résolu le problème..."
                  className="glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all text-sm min-h-[100px] resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setResolveDialogOpen(false)}
                    className="border-white/[0.08] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.04] text-xs"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => resolveAlertId && handleAlertAction(resolveAlertId, 'resolve', resolveComment)}
                    disabled={resolving}
                    className="bg-gradient-gold text-[#0a0a12] font-semibold text-xs rounded-lg hover:shadow-[oklch(0.78_0.14_85/25%)] transition-shadow"
                  >
                    {resolving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                    Résoudre
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════
           TAB 4: RAPPORTS DE SÉJOUR
           ═══════════════════════════════════════════════════ */}
        <TabsContent value="stay-reports" className="space-y-4">
          <div className="max-h-[600px] overflow-y-auto scrollbar-luxe space-y-4 pr-1">
            {reportsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-2xl bg-white/[0.03]" />
              ))
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <FileText className="w-10 h-10 text-[#475569] mb-3" />
                <p className="text-sm text-[#94a3b8]">Aucun rapport de séjour</p>
                <p className="text-xs text-[#475569] mt-1">Les rapports sont générés automatiquement à la fin de chaque séjour</p>
              </div>
            ) : (
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
                {reports.map((report) => {
                  const sentimentConf = getSentimentConfig(report.sentiment);
                  const highlights = (() => {
                    try { return JSON.parse(report.highlights) as string[]; } catch { return []; }
                  })();
                  const painPoints = (() => {
                    try { return JSON.parse(report.painPoints) as string[]; } catch { return []; }
                  })();
                  const isExpanded = expandedReportId === report.id;
                  const scores = {
                    cleanliness: report.cleanliness || 0,
                    comfort: report.comfort || 0,
                    equipment: report.equipment || 0,
                    location: report.location || 0,
                    hostContact: report.hostContact || 0,
                    valueForMoney: report.valueForMoney || 0,
                  };
                  const isCopied = copiedReviewId === report.id;

                  return (
                    <motion.div key={report.id} variants={staggerItem}>
                      <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden hover:border-white/[0.1] transition-all duration-300">
                        {/* Header */}
                        <div className="p-5 pb-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <div>
                              <h4 className="text-sm font-serif font-semibold text-[#e2e8f0]">{report.guestName}</h4>
                              <p className="text-[10px] text-[#475569]">
                                {formatDate(report.checkInAt)}
                                {report.checkOutAt ? ` → ${formatDate(report.checkOutAt)}` : ' (en cours)'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-full border ${sentimentConf.color}`}>
                                {sentimentConf.label}
                              </Badge>
                              {report.overallScore && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                                  <Star className="w-3.5 h-3.5 text-[#d4a853] fill-[#d4a853]" />
                                  <span className={`text-sm font-bold ${getScoreColor(report.overallScore)}`}>
                                    {report.overallScore.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Radar Chart */}
                          <div className="w-48 h-48 mx-auto mb-4">
                            <RadarChart scores={scores} />
                          </div>

                          {/* Highlights & Pain Points */}
                          <div className="space-y-2">
                            {highlights.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {highlights.slice(0, 4).map((h, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[10px] px-2 py-0.5 rounded-full border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                                    {h}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {painPoints.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {painPoints.slice(0, 4).map((p, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[10px] px-2 py-0.5 rounded-full border-red-500/20 bg-red-500/5 text-red-400">
                                    {p}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                              className="h-7 text-[10px] px-3 rounded-lg border-white/[0.08] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.04]"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                              {isExpanded ? 'Masquer' : 'Voir le détail'}
                            </Button>
                            {report.publicReview && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyPublicReview(report.id, report.publicReview!)}
                                className="h-7 text-[10px] px-3 rounded-lg border-[var(--accent-primary)]/25 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
                              >
                                {isCopied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                {isCopied ? 'Copié !' : 'Copier l\'avis public'}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <Separator className="bg-white/[0.04]" />
                              <div className="p-5 space-y-4 bg-white/[0.01]">
                                {/* AI Summary */}
                                {report.aiSummary && (
                                  <div>
                                    <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1.5">Résumé IA</p>
                                    <p className="text-xs text-[#94a3b8] leading-relaxed">{report.aiSummary}</p>
                                  </div>
                                )}

                                {/* Recommendation */}
                                {report.recommendation && (
                                  <div className="p-3 rounded-lg bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10">
                                    <p className="text-[10px] text-[var(--accent-primary)] uppercase tracking-wider mb-1">Recommandation</p>
                                    <p className="text-xs text-[#94a3b8] leading-relaxed">{report.recommendation}</p>
                                  </div>
                                )}

                                {/* Public Review */}
                                {report.publicReview && (
                                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <p className="text-[10px] text-emerald-400 uppercase tracking-wider">Avis public suggéré</p>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyPublicReview(report.id, report.publicReview!)}
                                        className="h-6 text-[10px] px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                      >
                                        {isCopied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                        Copier
                                      </Button>
                                    </div>
                                    <p className="text-xs text-[#94a3b8] leading-relaxed italic">&ldquo;{report.publicReview}&rdquo;</p>
                                  </div>
                                )}

                                {/* Stats */}
                                <div className="flex gap-4 text-[10px] text-[#475569]">
                                  <span>{report.dailyCheckCount} audits</span>
                                  <span>{report.totalAlerts} alerte(s)</span>
                                  <span>{report.resolvedAlerts} résolue(s)</span>
                                  <span>Généré le {formatDate(report.generatedAt)}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════
           TAB 5: PROBLÈMES RÉCURRENTS
           ═══════════════════════════════════════════════════ */}
        <TabsContent value="recurring" className="space-y-4">
          <div className="max-h-[600px] overflow-y-auto scrollbar-luxe space-y-3 pr-1">
            {recurringIssues.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Check className="w-10 h-10 text-emerald-400/40 mb-3" />
                <p className="text-sm text-[#94a3b8]">Aucun problème récurrent</p>
                <p className="text-xs text-[#475569] mt-1">
                  {kpis?.totalAlerts === 0
                    ? 'Excellent ! Aucune alerte n\'a été déclenchée'
                    : 'Les problèmes récurrents apparaîtront ici avec leur fréquence'}
                </p>
              </div>
            ) : (
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
                {recurringIssues.map((issue, idx) => (
                  <motion.div key={issue.issue} variants={staggerItem}>
                    <Card className="glass rounded-xl border-white/[0.06] overflow-hidden hover:border-white/[0.1] transition-all duration-200">
                      <div className="p-4 flex items-center gap-4">
                        {/* Rank */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          idx === 0 ? 'bg-red-500/15 text-red-400' :
                          idx === 1 ? 'bg-orange-500/15 text-orange-400' :
                          idx === 2 ? 'bg-amber-500/15 text-amber-400' :
                          'bg-white/[0.04] text-[#64748b]'
                        }`}>
                          {idx + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#e2e8f0] truncate">
                            {issue.label}
                          </p>
                          <p className="text-[10px] text-[#475569] mt-0.5">
                            Signalé dans {issue.count} audit{issue.count > 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Frequency Badge */}
                        <Badge
                          variant="outline"
                          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                            issue.count >= 5 ? 'border-red-500/25 bg-red-500/10 text-red-400' :
                            issue.count >= 3 ? 'border-amber-500/25 bg-amber-500/10 text-amber-400' :
                            'border-white/[0.08] text-[#94a3b8]'
                          }`}
                        >
                          ×{issue.count}
                        </Badge>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default HospitalityAnalytics;
