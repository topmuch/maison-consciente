'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Zap,
  MapPin,
  MessageSquare,
  ScanLine,
  Plus,
  Diamond,
  Clock,
  ArrowRight,
  Sparkles,
  CloudSun,
  Users,
  Send,
  Music,
  Droplets,
  Wind,
  Volume2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { useAudio } from '@/contexts/AudioContext';
import { ParallaxCard } from '@/components/shared/parallax-card';
import { toast } from 'sonner';
import SafetyPanel from '@/components/home/safety-panel';
import WellnessPanel from '@/components/home/wellness-panel';
import GroceryList from '@/components/home/grocery-list';
import SecretVault from '@/components/home/secret-vault';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface ActivityItem {
  id: string;
  user: { name: string; avatar: string | null };
  zone: { name: string; icon: string; color: string };
  context: string;
  createdAt: string;
}

interface StatsData {
  totalInteractions: number;
  todayInteractions: number;
  activeZones: number;
  recentActivity: ActivityItem[];
}

interface WallMessage {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  sender: { id: string; name: string; email: string; avatar: string | null };
}

interface DashboardSuggestion {
  message: string;
  type: 'ritual' | 'reminder' | 'presence' | 'calm';
}

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

interface OverviewData {
  activeUsersCount: number;
  activeUsers: Array<{ id: string; name: string; email: string; role: string }>;
  recentMessages: WallMessage[];
  wallMessages: WallMessage[];
  weather: WeatherData | null;
  suggestion: DashboardSuggestion;
}

interface EnrichmentData {
  groceries: Array<{ id: string; name: string; isBought: boolean; category: string }>;
  rituals: Array<{ id: string; title: string; timeOfDay: string; isCompleted: boolean }>;
  moods: Array<{ id: string; mood: number; note: string | null; createdAt: string }>;
  contacts: Array<{ id: string; name: string; phone: string; type: string }>;
  maintenance: Array<{ id: string; title: string; dueDate: string; isDone: boolean; recurrence: string | null }>;
  timeFilter: string;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const s = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function parseContext(raw: string): string {
  try {
    const ctx = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (ctx.type === 'qr_scan') return 'Scan QR Code';
    if (ctx.note) return ctx.note;
    if (ctx.type) return ctx.type.replace(/_/g, ' ');
  } catch {
    // ignore
  }
  return '';
}

function getSenderInitial(msg: WallMessage): string {
  return getInitials(msg.sender?.name || '??');
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

const scaleHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.01,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const messageVariant = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
};

/* ═══════════════════════════════════════════════════════
   LUXURY TIPS DATA
   ═══════════════════════════════════════════════════════ */

const luxuryTips = [
  { emoji: '🛒', title: 'Rangement cuisine', desc: "Pensez à vérifier et ranger votre réfrigérateur chaque semaine pour une fraîcheur optimale." },
  { emoji: '💧', title: 'Hydratation', desc: "Gardez une bouteille d'eau dans chaque pièce principale de votre maison." },
  { emoji: '🌿', title: "Qualité de l'air", desc: "Aérez votre intérieur 10 minutes par jour, même en hiver, pour renouveler l'air." },
  { emoji: '💡', title: 'Éclairage', desc: "Utilisez des variateurs pour adapter la lumière au moment de journée et à l'ambiance." },
  { emoji: '🔒', title: 'Sécurité', desc: "Vérifiez régulièrement l'état des serrures et des détecteurs de fumée." },
  { emoji: '📱', title: 'QR Codes', desc: "Scannez les QR codes de vos zones pour recevoir des suggestions personnalisées." },
];

/* ═══════════════════════════════════════════════════════
   LOADING SKELETONS
   ═══════════════════════════════════════════════════════ */

function HeroSkeleton() {
  return (
    <div className="glass rounded-2xl p-8 relative overflow-hidden">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl bg-white/[0.06]" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-white/[0.06]" />
          <Skeleton className="h-4 w-96 max-w-full bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="glass rounded-xl p-5 inner-glow">
      <Skeleton className="h-11 w-11 rounded-xl bg-white/[0.06] mb-4" />
      <Skeleton className="h-3.5 w-28 bg-white/[0.06] mb-1.5" />
      <Skeleton className="h-9 w-16 bg-white/[0.06] font-serif" />
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-5 pb-3 border-b border-white/[0.06]">
        <Skeleton className="h-5 w-40 bg-white/[0.06]" />
      </div>
      <div className="p-5 space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-2 w-2 rounded-full bg-[var(--accent-primary)]/30 shrink-0 mt-2" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-full bg-white/[0.06]" />
                <Skeleton className="h-4 w-32 bg-white/[0.06]" />
              </div>
              <Skeleton className="h-3 w-48 bg-white/[0.06] ml-9" />
            </div>
            <Skeleton className="h-3 w-14 bg-white/[0.06] shrink-0 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   WEATHER CARD
   ═══════════════════════════════════════════════════════ */

function WeatherRitualCard({
  weather,
  suggestion,
  activeUsersCount,
}: {
  weather: WeatherData | null;
  suggestion: DashboardSuggestion;
  activeUsersCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="glass rounded-xl p-5 inner-glow"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
          <CloudSun className="text-[var(--accent-primary)] w-5 h-5" />
        </div>
        <h2 className="text-lg font-serif text-amber-50">Rituel du Jour</h2>
      </div>

      {/* Weather */}
      {weather ? (
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{weather.icon}</span>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light text-foreground">
                {weather.temp}°C
              </span>
              <span className="text-sm text-[oklch(0.60_0.02_260)]">
                {weather.condition}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-[oklch(0.50_0.02_260)] flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                {weather.humidity}%
              </span>
              <span className="text-xs text-[oklch(0.50_0.02_260)] flex items-center gap-1">
                <Wind className="w-3 h-3" />
                {weather.windSpeed} km/h
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-4 text-[oklch(0.50_0.02_260)]">
          <CloudSun className="w-4 h-4" />
          <span className="text-sm">Météo indisponible</span>
        </div>
      )}

      {/* Suggestion */}
      <div className="border-t border-white/[0.06] pt-3">
        <div className="bg-black/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="text-[10px] uppercase tracking-widest text-[oklch(0.50_0.02_260)] font-medium">
              Conscience
            </span>
          </div>
          <p className="text-sm text-[oklch(0.80_0.02_260)] italic leading-relaxed">
            &ldquo;{suggestion.message}&rdquo;
          </p>
        </div>
      </div>

      {/* Active presence badge */}
      {activeUsersCount > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[oklch(0.55_0.02_260)]">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span>
            {activeUsersCount} occupant{activeUsersCount > 1 ? 's' : ''} actif{activeUsersCount > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MESSAGES WALL
   ═══════════════════════════════════════════════════════ */

function MessagesWall({
  messages,
  onSend,
  sending,
}: {
  messages: WallMessage[];
  onSend: (content: string) => void;
  sending: boolean;
}) {
  const [newMsg, setNewMsg] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || sending) return;
    onSend(newMsg.trim());
    setNewMsg('');
  };

  return (
    <div className="glass rounded-xl overflow-hidden inner-glow">
      {/* Header */}
      <div className="p-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />
          <h2 className="text-lg font-serif font-semibold tracking-tight">
            Messages du Foyer
          </h2>
        </div>
        {messages.length > 0 && (
          <span className="text-[10px] text-[oklch(0.45_0.02_260)] font-mono">
            {messages.length} message{messages.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Messages list */}
      <div ref={scrollRef} className="max-h-64 overflow-y-auto scrollbar-luxe">
        <div className="p-4 space-y-2.5">
          {messages.length > 0 ? (
            messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                variants={messageVariant}
                initial="initial"
                animate="animate"
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className="bg-black/20 rounded-xl p-3 border-l-2 border-[var(--accent-primary)]/40 hover:border-[var(--accent-primary)]/70 transition-colors duration-300"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Avatar className="h-6 w-6 ring-1 ring-white/[0.06]">
                    <AvatarFallback className="text-[9px] font-medium bg-white/[0.06] text-[oklch(0.70_0.02_260)]">
                      {getSenderInitial(msg)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-[oklch(0.80_0.02_260)]">
                    {msg.sender?.name || 'Anonyme'}
                  </span>
                  <span className="text-[10px] text-[oklch(0.40_0.02_260)] font-mono ml-auto">
                    {relativeTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-[oklch(0.75_0.02_260)] leading-relaxed">
                  {msg.content}
                </p>
              </motion.div>
            ))
          ) : (
            <div className="py-8 text-center">
              <MessageSquare className="w-8 h-8 text-[oklch(0.30_0.02_260)] mx-auto mb-2" />
              <p className="text-sm text-[oklch(0.50_0.02_260)] italic">
                Aucun message. La maison est silencieuse.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/[0.06]">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Laisser une note..."
            className="flex-1 bg-black/30 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-[oklch(0.40_0.02_260)] focus:outline-none focus:border-[var(--accent-primary)]/30 transition-colors duration-300"
            disabled={sending}
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              disabled={!newMsg.trim() || sending}
              className="bg-gradient-gold text-[#0a0a12] font-semibold rounded-xl px-4 py-2.5 shadow-lg shadow-[oklch(0.78_0.14_85/15%)] hover:shadow-[oklch(0.78_0.14_85/30%)] transition-shadow duration-500 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
              size="sm"
              aria-label="Envoyer le message"
            >
              {sending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   AMBIANCE BUTTON
   ═══════════════════════════════════════════════════════ */

function AmbianceButton() {
  const { fadePlay, fadePause, isPlaying, currentTrack } = useAudio();

  const triggerAmbiance = () => {
    if (isPlaying) {
      fadePause();
      toast.info('Ambiance arrêtée');
    } else {
      fadePlay({
        id: 'ambient-rain',
        title: 'Pluie Douce 🌧️',
        category: 'Nature',
        url: '/audio/rain.mp3',
      });
      toast.success('Ambiance activée');
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.25 }}>
      <button
        onClick={triggerAmbiance}
        className={`
          relative w-full rounded-xl p-4 flex flex-col items-center justify-center gap-2
          transition-all duration-500 group cursor-pointer
          ${
            isPlaying
              ? 'bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary-dark)]/10 border border-[var(--accent-primary)]/30 shadow-[0_0_20px_var(--accent-primary-glow)]'
              : 'bg-white/[0.03] border border-white/[0.08] hover:bg-[var(--accent-primary)]/[0.06] hover:border-[var(--accent-primary)]/20'
          }
        `}
      >
        <div className="relative">
          <Music className={`w-6 h-6 transition-colors duration-300 ${isPlaying ? 'text-[var(--accent-primary)]' : 'text-[oklch(0.55_0.02_260)] group-hover:text-[var(--accent-primary)]'}`} />
          {isPlaying && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--accent-primary)]"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </div>
        <span className={`text-sm font-medium transition-colors duration-300 ${isPlaying ? 'text-[var(--accent-primary)]' : 'text-[oklch(0.70_0.02_260)]'}`}>
          {isPlaying ? (currentTrack?.title || 'En lecture') : 'Lancer Ambiance'}
        </span>
        {isPlaying && (
          <Volume2 className="w-3.5 h-3.5 text-[var(--accent-primary)]/60" />
        )}
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   PRESENCE CARD
   ═══════════════════════════════════════════════════════ */

function PresenceCard({
  count,
  users,
}: {
  count: number;
  users: Array<{ id: string; name: string; email: string }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="glass rounded-xl p-5 inner-glow group hover:shadow-[0_0_20px_oklch(0.78_0.14_85/8%)] transition-shadow duration-500"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
          <Users className="text-[var(--accent-primary)] w-5 h-5" />
        </div>
        <h2 className="text-lg font-serif text-amber-50">Présence Active</h2>
      </div>
      <div className="text-4xl font-light text-foreground mb-1">{count}</div>
      <p className="text-xs text-[oklch(0.50_0.02_260)]">
        occupant{count > 1 ? 's' : ''} détecté{count > 1 ? 's' : ''}
      </p>

      {/* Active user avatars */}
      {users.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
          {users.slice(0, 4).map((u, i) => (
            <div key={u.id} className="relative" style={{ zIndex: 10 - i }}>
              <Avatar className="h-7 w-7 ring-2 ring-[#0a0a12]">
                <AvatarFallback className="text-[9px] font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                  {getInitials(u.name || u.email)}
                </AvatarFallback>
              </Avatar>
            </div>
          ))}
          {users.length > 4 && (
            <div className="h-7 w-7 rounded-full bg-white/[0.06] flex items-center justify-center text-[9px] text-[oklch(0.50_0.02_260)]">
              +{users.length - 4}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════ */

export function Dashboard() {
  const { userName } = useAuthStore();
  const { setView } = useAppStore();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');
  const [enrichment, setEnrichment] = useState<EnrichmentData | null>(null);
  const markReadDoneRef = useRef(false);

  /* ── Fetch stats data ── */
  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, msgsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/messages?limit=100'),
      ]);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats || data);
      }
      if (msgsRes.ok) {
        const data = await msgsRes.json();
        const msgs = data.messages || [];
        setUnreadMessages(msgs.filter((m: { isRead: boolean }) => !m.isRead).length);
      }
    } catch {
      // silently fail
    }
  }, []);

  /* ── Fetch enrichment data (groceries, rituals, moods, etc.) ── */
  const fetchEnrichment = useCallback(async () => {
    try {
      const res = await fetch('/api/enrichment');
      if (res.ok) {
        const data = await res.json();
        setEnrichment(data.data);
      }
    } catch {
      // silently fail
    }
  }, []);

  /* ── Fetch overview (weather, presence, messages wall) ── */
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setOverview(data.overview);
        setLastSync(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {
      // silently fail
    }
  }, []);

  /* ── Initial load ── */
  const fetchAll = useCallback(async () => {
    await Promise.all([fetchStats(), fetchOverview(), fetchEnrichment()]);
    setLoading(false);
  }, [fetchStats, fetchOverview, fetchEnrichment]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ── Polling every 15 seconds ── */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOverview();
      fetchEnrichment();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchOverview, fetchEnrichment]);

  /* ── Mark messages as read on first load ── */
  useEffect(() => {
    if (overview?.recentMessages && overview.recentMessages.length > 0 && !markReadDoneRef.current) {
      markReadDoneRef.current = true;
      fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read' }),
      }).catch(() => {});
    }
  }, [overview?.recentMessages]);

  /* ── Send message ── */
  const handleSendMessage = useCallback(
    async (content: string) => {
      setSending(true);
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, type: 'note' }),
        });
        if (res.ok) {
          toast.success('Message envoyé');
          fetchOverview();
        } else {
          toast.error("Erreur lors de l'envoi");
        }
      } catch {
        toast.error("Erreur réseau");
      } finally {
        setSending(false);
      }
    },
    [fetchOverview]
  );

  /* ─── Stat cards config ─── */
  const statCards = [
    {
      label: 'Total interactions',
      value: stats?.totalInteractions ?? 0,
      icon: Activity,
      iconBg: 'bg-[var(--accent-primary)]/15',
      iconColor: 'text-[var(--accent-primary)]',
      glowClass: 'group-hover:shadow-[0_0_20px_oklch(0.78_0.14_85/12%)]',
    },
    {
      label: "Aujourd'hui",
      value: stats?.todayInteractions ?? 0,
      icon: Zap,
      iconBg: 'bg-[#c77d5a]/15',
      iconColor: 'text-[#c77d5a]',
      glowClass: 'group-hover:shadow-[0_0_20px_oklch(0.65_0.18_20/12%)]',
    },
    {
      label: 'Zones actives',
      value: stats?.activeZones ?? 0,
      icon: MapPin,
      iconBg: 'bg-[#8b5cf6]/15',
      iconColor: 'text-[#8b5cf6]',
      glowClass: 'group-hover:shadow-[0_0_20px_oklch(0.60_0.22_280/12%)]',
    },
    {
      label: 'Messages',
      value: unreadMessages,
      icon: MessageSquare,
      iconBg: 'bg-gradient-to-br from-[var(--accent-primary)]/15 to-[#c77d5a]/15',
      iconColor: 'text-[var(--accent-primary)]',
      glowClass: 'group-hover:shadow-[0_0_20px_oklch(0.74_0.16_55/12%)]',
    },
  ];

  /* ─── Section delay calculation (80ms stagger) ─── */
  const delays = [0, 0.08, 0.16, 0.24, 0.32, 0.40, 0.48, 0.56, 0.64];

  return (
    <div className="space-y-6">
      {/* ═══ WELCOME HERO ═══ */}
      <motion.div custom={delays[0]} variants={fadeUp} initial="hidden" animate="visible">
        <div className="relative glass rounded-2xl p-6 md:p-8 inner-glow overflow-hidden">
          <div className="absolute inset-0 rounded-2xl opacity-40 pointer-events-none">
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(212,168,83,0.25) 0%, transparent 40%, transparent 60%, rgba(139,92,246,0.2) 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 8s ease infinite',
              }}
            />
          </div>
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/40 to-transparent" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="hidden sm:flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary-dark)]/10 border border-[var(--accent-primary)]/20 shrink-0 glow-gold">
              <Diamond className="w-7 h-7 text-[var(--accent-primary)]" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-serif tracking-tight">
                <span className="text-gradient-gold">
                  {getGreeting()}, {userName || 'Utilisateur'}
                </span>
              </h1>
              <p className="text-sm md:text-base text-[oklch(0.60_0.02_260)] mt-1.5 leading-relaxed">
                Bienvenue dans votre espace Maison Consciente. Voici un aperçu de votre activité.
              </p>
              {lastSync && (
                <p className="text-[10px] text-[oklch(0.40_0.02_260)] mt-1 font-mono">
                  Conscience active • Dernière sync: {lastSync}
                </p>
              )}
            </div>

            <div className="hidden md:block shrink-0">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-[var(--accent-primary)]/[0.04] border border-[var(--accent-primary)]/10" />
                <div className="absolute inset-2 rounded-full bg-[var(--accent-primary)]/[0.03] border border-[var(--accent-primary)]/[0.07]" />
                <div className="absolute inset-4 rounded-full bg-[var(--accent-primary)]/[0.04] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[var(--accent-primary)]/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ STATS GRID ═══ */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={delays[1] + i * 0.08}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <ParallaxCard intensity={0.2}>
                <motion.div
                  variants={scaleHover}
                  initial="rest"
                  whileHover="hover"
                  className={`group glass rounded-xl p-5 inner-glow transition-shadow duration-500 relative ${stat.glowClass}`}
                >
                  <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${stat.iconBg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <p className="text-xs text-[oklch(0.60_0.02_260)] mt-4 tracking-wide uppercase font-medium">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-serif font-bold mt-0.5 tracking-tight text-foreground">
                    {stat.value.toLocaleString('fr-FR')}
                  </p>
                </motion.div>
              </ParallaxCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* ═══ PRESENCE + WEATHER/ritual ROW ═══ */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PresenceCard
            count={overview.activeUsersCount}
            users={overview.activeUsers}
          />
          <WeatherRitualCard
            weather={overview.weather}
            suggestion={overview.suggestion}
            activeUsersCount={overview.activeUsersCount}
          />
        </div>
      )}

      {/* ═══ QUICK ACTIONS ═══ */}
      <motion.div custom={delays[2]} variants={fadeUp} initial="hidden" animate="visible">
        <div className="grid grid-cols-2 gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.25 }}>
            <Button
              onClick={() => setView('scan')}
              className="w-full bg-gradient-gold text-[#0a0a12] font-semibold rounded-xl h-12 px-6 text-sm tracking-wide shadow-lg shadow-[oklch(0.78_0.14_85/15%)] hover:shadow-[oklch(0.78_0.14_85/30%)] transition-shadow duration-500"
            >
              <ScanLine className="w-4 h-4 mr-2.5" />
              Scanner un QR Code
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.25 }}>
            <Button
              variant="outline"
              onClick={() => setView('zones')}
              className="w-full rounded-xl h-12 px-6 text-sm tracking-wide border-[var(--accent-primary)]/25 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/[0.08] hover:border-[var(--accent-primary)]/40 hover:text-[var(--accent-primary-light)] transition-all duration-300 bg-transparent"
            >
              <Plus className="w-4 h-4 mr-2.5" />
              Gérer les Zones
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══ AMBIANCE + NEW NOTE ACTIONS ═══ */}
      <div className="grid grid-cols-2 gap-3">
        <AmbianceButton />
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.25 }}>
          <button
            onClick={() => setView('messages')}
            className="w-full rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-all duration-300 group cursor-pointer"
          >
            <MessageSquare className="w-6 h-6 text-[oklch(0.55_0.02_260)] group-hover:text-[var(--accent-primary)] transition-colors duration-300" />
            <span className="text-sm font-medium text-[oklch(0.70_0.02_260)] group-hover:text-[var(--accent-primary)] transition-colors duration-300">
              Nouvelle Note
            </span>
          </button>
        </motion.div>
      </div>

      {/* ═══ ENRICHMENT MODULES: Safety + Wellness + Grocery ═══ */}
      {enrichment && (
        <motion.div custom={delays[6]} variants={fadeUp} initial="hidden" animate="visible">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SafetyPanel
              contacts={enrichment.contacts}
              onRefresh={fetchEnrichment}
            />
            <WellnessPanel
              rituals={enrichment.rituals}
              moods={enrichment.moods}
              maintenance={enrichment.maintenance}
              timeFilter={enrichment.timeFilter}
              onRefresh={fetchEnrichment}
            />
          </div>
        </motion.div>
      )}

      {enrichment && (
        <motion.div custom={delays[7]} variants={fadeUp} initial="hidden" animate="visible">
          <GroceryList
            items={enrichment.groceries}
            onRefresh={fetchEnrichment}
          />
        </motion.div>
      )}

      {/* ═══ SECRET VAULT ═══ */}
      <motion.div custom={delays[8]} variants={fadeUp} initial="hidden" animate="visible">
        <SecretVault />
      </motion.div>

      {/* ═══ TWO COLUMN LAYOUT: Activity + Messages Wall ═══ */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ─── ACTIVITY FEED (Left) ─── */}
        {loading ? (
          <ActivitySkeleton />
        ) : (
          <motion.div custom={delays[3]} variants={fadeUp} initial="hidden" animate="visible">
            <div className="glass rounded-xl overflow-hidden inner-glow">
              <div className="p-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="text-lg font-serif font-semibold tracking-tight">
                  Activité Récente
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('interactions')}
                  className="text-[var(--accent-primary)]/70 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/[0.06] rounded-lg text-xs transition-colors duration-300"
                >
                  Tout voir
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>

              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <ScrollArea className="max-h-96 overflow-y-auto scrollbar-luxe">
                  <div className="p-4">
                    {stats.recentActivity.slice(0, 10).map((activity, i) => {
                      const initials = getInitials(activity.user?.name || '??');
                      const contextStr = parseContext(activity.context);
                      const zoneColor = activity.zone?.color || 'var(--accent-primary)';

                      return (
                        <motion.div
                          key={activity.id || i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: delays[3] + i * 0.06, duration: 0.4, ease: 'easeOut' }}
                          className="group/item flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-white/[0.03] transition-colors duration-300 cursor-default"
                        >
                          <div className="flex flex-col items-center pt-2.5 shrink-0">
                            <div
                              className="h-2 w-2 rounded-full transition-shadow duration-500 group-hover/item:shadow-[0_0_8px_currentColor]"
                              style={{ backgroundColor: zoneColor, color: zoneColor }}
                            />
                            {i < stats.recentActivity.slice(0, 10).length - 1 && (
                              <div className="w-px flex-1 bg-white/[0.06] mt-2" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <Avatar className="h-7 w-7 mt-0.5 shrink-0 ring-1 ring-white/[0.08]">
                                <AvatarFallback className="text-[10px] font-medium bg-white/[0.06] text-[oklch(0.70_0.02_260)]">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm leading-snug">
                                  <span className="font-medium text-foreground/90">{activity.user?.name || 'Utilisateur'}</span>
                                  {activity.zone?.name && (
                                    <>
                                      <span className="text-[oklch(0.50_0.02_260)]"> · </span>
                                      <span className="text-[var(--accent-primary)]/80 font-medium">{activity.zone.name}</span>
                                    </>
                                  )}
                                </p>
                                {contextStr && (
                                  <p className="text-xs text-[oklch(0.50_0.02_260)] mt-0.5 truncate">{contextStr}</p>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-[oklch(0.45_0.02_260)] whitespace-nowrap shrink-0 mt-1 font-mono tracking-wide">
                              {relativeTime(activity.createdAt)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-10 text-center">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[var(--accent-primary)]/[0.06] border border-[var(--accent-primary)]/10 mb-4">
                    <Clock className="w-6 h-6 text-[var(--accent-primary)]/50" />
                  </div>
                  <p className="text-sm font-medium text-[oklch(0.60_0.02_260)]">Aucune activité récente</p>
                  <p className="text-xs text-[oklch(0.45_0.02_260)] mt-1.5 max-w-[240px] mx-auto leading-relaxed">
                    Commencez par scanner un QR code pour voir votre activité apparaître ici.
                  </p>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-5 inline-block">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setView('scan')}
                      className="rounded-lg text-xs border-[var(--accent-primary)]/20 text-[var(--accent-primary)]/70 hover:bg-[var(--accent-primary)]/[0.06] hover:border-[var(--accent-primary)]/30 hover:text-[var(--accent-primary)] transition-all duration-300 bg-transparent"
                    >
                      <ScanLine className="w-3.5 h-3.5 mr-2" />
                      Scanner maintenant
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── MESSAGES WALL (Right) ─── */}
        {overview ? (
          <motion.div custom={delays[4]} variants={fadeUp} initial="hidden" animate="visible">
            <MessagesWall
              messages={overview.wallMessages}
              onSend={handleSendMessage}
              sending={sending}
            />
          </motion.div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.06]">
              <Skeleton className="h-5 w-40 bg-white/[0.06]" />
            </div>
            <div className="p-5 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-white/[0.06]" />
                  <Skeleton className="h-3 w-full bg-white/[0.06]" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ TIPS SECTION ═══ */}
      <motion.div custom={delays[5]} variants={fadeUp} initial="hidden" animate="visible">
        <div className="glass rounded-xl overflow-hidden inner-glow">
          <div className="p-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-semibold tracking-tight flex items-center gap-2.5">
                <div className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-[var(--accent-primary)]/15 to-[#c77d5a]/10 border border-[var(--accent-primary)]/10">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                </div>
                Conseils de la Maison
              </h2>
            </div>
            <p className="text-xs text-[oklch(0.50_0.02_260)] mt-1.5 ml-[38px]">
              Astuces pour votre maison consciente
            </p>
          </div>

          <ScrollArea className="max-h-96 overflow-y-auto scrollbar-luxe">
            <div className="p-3 space-y-2">
              {luxuryTips.map((tip, i) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: delays[5] + 0.1 + i * 0.05,
                    duration: 0.4,
                    ease: 'easeOut',
                  }}
                  className="group/tip p-3 rounded-lg glass hover:bg-white/[0.04] transition-colors duration-300 cursor-default"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5 shrink-0 filter drop-shadow-[0_0_4px_oklch(0.78_0.14_85/20%)]">
                      {tip.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground/90 leading-snug">{tip.title}</p>
                      <p className="text-xs text-[oklch(0.50_0.02_260)] mt-1 leading-relaxed">{tip.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </motion.div>
    </div>
  );
}
