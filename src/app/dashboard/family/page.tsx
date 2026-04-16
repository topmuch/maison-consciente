'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  MapPinned,
  UserPlus,
  Settings,
  Home,
  Clock,
  BatteryMedium,
  BatteryLow,
  BatteryFull,
  BatteryWarning,
  Navigation,
  Shield,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Phone,
  Route,
  User,
  Users,
  Loader2,
  Wifi,
  WifiOff,
  GraduationCap,
  Briefcase,
  Car,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

/* ═══════════════════════════════════════════════════════════
   MAISON CONSCIENTE — Family Geolocation Dashboard
   Real-time family member tracking with map, status,
   alerts, and RGPD-compliant consent management.
   ═══════════════════════════════════════════════════════════ */

/* ── Types ── */

interface LocationLog {
  id: string;
  lat: number;
  lng: number;
  createdAt: string;
}

interface FamilyMember {
  id: string;
  name: string;
  role: 'Parent' | 'Child' | 'Elderly' | 'Other';
  avatarColor: string;
  trackingToken: string;
  consentGiven: boolean;
  consentGivenAt: string | null;
  isActive: boolean;
  lastKnownLat: number | null;
  lastKnownLng: number | null;
  lastKnownAt: string | null;
  lastKnownAccuracy: number | null;
  currentGeoFenceId: string | null;
  status: 'home' | 'away' | 'school' | 'work' | 'offline' | 'en_route';
  batteryLevel: number | null;
  expectedHomeBefore: string | null;
  autoDeleteDays: number;
  createdAt: string;
  updatedAt: string;
  locationLogs: LocationLog[];
  _count?: { locationLogs: number };
}

/* ── Status Config ── */

const STATUS_CONFIG: Record<string, {
  label: string;
  classes: string;
  icon: React.ElementType;
}> = {
  home: {
    label: 'Maison',
    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: Home,
  },
  away: {
    label: 'Absent',
    classes: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    icon: MapPin,
  },
  school: {
    label: '\u00C9cole',
    classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: GraduationCap,
  },
  work: {
    label: 'Travail',
    classes: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    icon: Briefcase,
  },
  en_route: {
    label: 'En route',
    classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: Car,
  },
  offline: {
    label: 'Hors ligne',
    classes: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    icon: WifiOff,
  },
};

const ROLE_COLORS: Record<string, string> = {
  Parent: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Child: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  Elderly: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  Other: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

/* ── Animation Variants ── */

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const slideDown = {
  initial: { opacity: 0, height: 0, marginTop: 0 },
  animate: {
    opacity: 1,
    height: 'auto',
    marginTop: 16,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: { duration: 0.2 },
  },
};

/* ── Helper Functions ── */

function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Jamais';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 1) return "\u00C0 l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffHr < 24) return `il y a ${diffHr}h`;
  const diffDays = Math.floor(diffHr / 24);
  return `il y a ${diffDays}j`;
}

function formatExpectedTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function isOverdue(member: FamilyMember): boolean {
  if (!member.expectedHomeBefore || member.status === 'home') return false;
  return new Date(member.expectedHomeBefore) < new Date();
}

function BatteryIcon({ level }: { level: number | null }) {
  if (level === null) return null;
  if (level >= 75) return <BatteryFull className="w-3.5 h-3.5 text-emerald-400" />;
  if (level >= 30) return <BatteryMedium className="w-3.5 h-3.5 text-amber-400" />;
  if (level >= 15) return <BatteryLow className="w-3.5 h-3.5 text-orange-400" />;
  return <BatteryWarning className="w-3.5 h-3.5 text-red-400" />;
}

/* ── Map Placeholder Component ── */

function MapPlaceholder({ members }: { members: FamilyMember[] }) {
  const homeMembers = members.filter((m) => m.status === 'home' && m.lastKnownLat && m.lastKnownLng);
  const activeMembers = members.filter(
    (m) => m.status !== 'offline' && m.lastKnownLat && m.lastKnownLng,
  );

  // Generate fake positions for the map dots (based on hash of id for consistency)
  const getMapPosition = (id: string, index: number) => {
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const x = 15 + ((hash * 17 + index * 31) % 70);
    const y = 15 + ((hash * 23 + index * 37) % 60);
    return { x, y };
  };

  return (
    <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPinned className="w-4 h-4 text-[#d4a853]" />
          <h2 className="text-sm font-semibold text-white/90">Carte de la famille</h2>
          <Badge variant="outline" className="ml-auto text-[10px] px-2 py-0.5 border-white/10 text-white/50 bg-white/5">
            {activeMembers.length}/{members.length} en ligne
          </Badge>
        </div>

        {/* Map Area */}
        <div className="relative w-full h-[280px] sm:h-[360px] rounded-xl overflow-hidden bg-slate-900 border border-white/5">
          {/* Gradient map background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 via-slate-900 to-slate-800/30" />

          {/* Grid lines */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute w-full h-px bg-white/30"
                style={{ top: `${(i + 1) * 12.5}%` }}
              />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute h-full w-px bg-white/30"
                style={{ left: `${(i + 1) * 16.66}%` }}
              />
            ))}
          </div>

          {/* Home zone indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-emerald-500/30 bg-emerald-500/5 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Home className="w-4 h-4 text-emerald-400/60" />
          </div>

          {/* Member position dots */}
          <AnimatePresence>
            {activeMembers.map((member, index) => {
              const pos = getMapPosition(member.id, index);
              const statusConf = STATUS_CONFIG[member.status] || STATUS_CONFIG.offline;
              const StatusIcon = statusConf.icon;
              const isHomePos = member.status === 'home';

              return (
                <motion.div
                  key={member.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
                  className="absolute flex flex-col items-center gap-1"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  {/* Pulse ring */}
                  {!isHomePos && (
                    <motion.div
                      className={`absolute w-8 h-8 rounded-full ${member.status === 'en_route' ? 'bg-amber-500/20' : 'bg-sky-500/20'}`}
                      animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  {/* Dot */}
                  <div
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                      isHomePos
                        ? 'bg-emerald-500 ring-2 ring-emerald-400/30'
                        : member.status === 'en_route'
                          ? 'bg-amber-500 ring-2 ring-amber-400/30'
                          : 'bg-sky-500 ring-2 ring-sky-400/30'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-white">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Label */}
                  <span className="text-[9px] font-medium text-white/70 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">
                    {member.name}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Loading overlay */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10">
            <Loader2 className="w-3 h-3 text-[#d4a853] animate-spin" />
            <span className="text-[10px] text-white/60">Carte interactive en cours de chargement...</span>
          </div>

          {/* Scale indicator */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-white/30">
            <div className="w-12 h-px bg-current" />
            <span className="text-[8px]">500m</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── Member Card Component ── */

function MemberCard({ member }: { member: FamilyMember }) {
  const statusConf = STATUS_CONFIG[member.status] || STATUS_CONFIG.offline;
  const StatusIcon = statusConf.icon;

  return (
    <motion.div variants={staggerItem}>
      <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors duration-300">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="w-11 h-11 sm:w-12 sm:h-12 border-2 border-white/10">
                <AvatarFallback
                  className="text-base font-semibold"
                  style={{ backgroundColor: member.avatarColor + '30', color: member.avatarColor }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                  member.status !== 'offline' ? 'bg-emerald-500' : 'bg-gray-500'
                }`}
              />
              {/* Consent indicator */}
              {member.consentGiven && (
                <div className="absolute -top-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center border border-slate-950">
                  <Shield className="w-2 h-2 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Name + Badges */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-white/90 truncate">{member.name}</h3>
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1.5 py-0 border rounded-full shrink-0 ${ROLE_COLORS[member.role] || ROLE_COLORS.Other}`}
                >
                  {member.role}
                </Badge>
              </div>

              {/* Status */}
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 border rounded-full inline-flex items-center gap-1.5 ${statusConf.classes}`}
              >
                <StatusIcon className="w-3 h-3" />
                {statusConf.label}
              </Badge>

              {/* Details Grid */}
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {/* Last known time */}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-white/30" />
                  <span className="text-[11px] text-white/50">
                    {getRelativeTime(member.lastKnownAt)}
                  </span>
                </div>

                {/* Battery */}
                <div className="flex items-center gap-1.5">
                  {member.batteryLevel !== null ? (
                    <>
                      <BatteryIcon level={member.batteryLevel} />
                      <span className="text-[11px] text-white/50">{member.batteryLevel}%</span>
                    </>
                  ) : (
                    <>
                      <BatteryMedium className="w-3.5 h-3.5 text-white/20" />
                      <span className="text-[11px] text-white/30">N/A</span>
                    </>
                  )}
                </div>

                {/* ETA (if en_route) */}
                {member.status === 'en_route' && (
                  <div className="flex items-center gap-1.5 col-span-2 mt-1">
                    <Navigation className="w-3 h-3 text-amber-400/70" />
                    <span className="text-[11px] text-amber-400/70">
                      En route vers la maison
                    </span>
                    {member.expectedHomeBefore && (
                      <span className="text-[10px] text-white/40 ml-auto">
                        ETA {formatExpectedTime(member.expectedHomeBefore)}
                      </span>
                    )}
                  </div>
                )}

                {/* Expected return (if set and not home) */}
                {member.expectedHomeBefore && member.status !== 'home' && member.status !== 'en_route' && (
                  <div className="flex items-center gap-1.5 col-span-2 mt-1">
                    <Route className="w-3 h-3 text-white/30" />
                    <span className="text-[11px] text-white/50">
                      Retour pr\u00E9vu : {formatExpectedTime(member.expectedHomeBefore)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Add Member Form Component ── */

function AddMemberForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; role: string; consentGiven: boolean }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Parent');
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !consentGiven) return;
      setSubmitting(true);
      try {
        await onSubmit({ name: name.trim(), role, consentGiven: true });
        setName('');
        setRole('Parent');
        setConsentGiven(false);
      } finally {
        setSubmitting(false);
      }
    },
    [name, role, consentGiven, onSubmit],
  );

  return (
    <motion.div
      variants={slideDown}
      initial="initial"
      animate="animate"
      exit="exit"
      className="overflow-hidden"
    >
      <Card className="backdrop-blur-xl bg-white/5 border border-[#d4a853]/20 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#d4a853] flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Ajouter un membre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-[11px] font-medium text-white/50 mb-1.5">
                Nom du membre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Marie, Pierre..."
                className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-[#d4a853]/40 focus:ring-1 focus:ring-[#d4a853]/20 transition-colors"
                required
                minLength={1}
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-[11px] font-medium text-white/50 mb-1.5">
                R\u00F4le
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 focus:outline-none focus:border-[#d4a853]/40 focus:ring-1 focus:ring-[#d4a853]/20 transition-colors appearance-none cursor-pointer"
              >
                <option value="Parent" className="bg-slate-900">Parent</option>
                <option value="Child" className="bg-slate-900">Enfant</option>
                <option value="Elderly" className="bg-slate-900">Personne \u00E2g\u00E9e</option>
                <option value="Other" className="bg-slate-900">Autre</option>
              </select>
            </div>

            {/* Consent Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/80">Consentement RGPD</p>
                  <p className="text-[10px] text-white/40">
                    Obligatoire pour activer la g\u00E9olocalisation
                  </p>
                </div>
              </div>
              <Switch
                checked={consentGiven}
                onCheckedChange={setConsentGiven}
                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/10"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="submit"
                disabled={!name.trim() || !consentGiven || submitting}
                className="flex-1 bg-gradient-to-r from-[#d4a853] to-[#c49a48] text-slate-950 hover:opacity-90 font-semibold text-sm h-9 disabled:opacity-40"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-1.5" />
                )}
                Ajouter
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="text-white/50 hover:text-white/80 hover:bg-white/5 text-sm h-9"
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Alert Panel Component ── */

function AlertPanel({ members }: { members: FamilyMember[] }) {
  const overdueMembers = members.filter(isOverdue);

  if (overdueMembers.length === 0) return null;

  return (
    <motion.div variants={fadeUp} initial="initial" animate="animate">
      <Card className="backdrop-blur-xl bg-red-500/5 border border-red-500/20 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Retards d\u00E9tect\u00E9s
            <Badge className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0 border border-red-500/30">
              {overdueMembers.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overdueMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-red-500/[0.04] border border-red-500/10"
              >
                <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/80">{member.name}</p>
                  <p className="text-[10px] text-red-400/70">
                    Devait rentrer avant {formatExpectedTime(member.expectedHomeBefore!)}
                    {' \u2014 '}Statut actuel : {STATUS_CONFIG[member.status]?.label || member.status}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                    title="Appeler"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function FamilyGeoPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  /* ── Fetch members ── */
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/family-members');
      const data = await res.json();
      if (data.success) {
        setMembers(data.members);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  /* ── Create member ── */
  const handleAddMember = useCallback(
    async (data: { name: string; role: string; consentGiven: boolean }) => {
      try {
        const res = await fetch('/api/family-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (result.success) {
          setShowAddForm(false);
          fetchMembers();
        }
      } catch {
        // Silently fail — form stays open
      }
    },
    [fetchMembers],
  );

  /* ── Computed ── */
  const homeCount = members.filter((m) => m.status === 'home').length;
  const awayCount = members.filter((m) => m.status !== 'offline' && m.status !== 'home').length;
  const offlineCount = members.filter((m) => m.status === 'offline').length;

  return (
    <div className="min-h-screen bg-slate-950 text-white/90 flex flex-col">
      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} initial="initial" animate="animate">
        <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/10 p-5 sm:p-6 mb-6">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#d4a853]/[0.04] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-9 h-9 rounded-xl bg-[#d4a853]/15 flex items-center justify-center">
                  <MapPinned className="w-4.5 h-4.5 text-[#d4a853]" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white/95">
                    G\u00E9olocalisation Famille
                  </h1>
                  <p className="text-xs sm:text-sm text-white/40">
                    Suivez en temps r\u00E9el la position de chaque membre de votre foyer
                  </p>
                </div>
              </div>
            </div>
            <a
              href="/dashboard/family/config"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white/70 hover:text-white/90 hover:bg-white/10 hover:border-white/20 transition-all duration-200 self-start sm:self-auto"
            >
              <Settings className="w-4 h-4" />
              Configurer les zones
            </a>
          </div>

          {/* Quick stats */}
          <div className="relative mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15">
              <Home className="w-3 h-3 text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-400">{homeCount} \u00E0 la maison</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/[0.06] border border-sky-500/15">
              <MapPin className="w-3 h-3 text-sky-400" />
              <span className="text-[11px] font-medium text-sky-400">{awayCount} en d\u00E9placement</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-500/[0.06] border border-gray-500/15">
              <WifiOff className="w-3 h-3 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-400">{offlineCount} hors ligne</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ LOADING STATE ═══ */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#d4a853] animate-spin" />
            <p className="text-sm text-white/40">Chargement de la carte familiale...</p>
          </div>
        </div>
      )}

      {/* ═══ ERROR STATE ═══ */}
      {error && !loading && (
        <Card className="backdrop-blur-xl bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-400">{error}</p>
          <Button
            variant="ghost"
            onClick={fetchMembers}
            className="mt-3 text-white/50 hover:text-white/80 text-sm"
          >
            R\u00E9essayer
          </Button>
        </Card>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      {!loading && !error && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* ── Alert Panel ── */}
          <AlertPanel members={members} />

          {/* ── Map Section ── */}
          <MapPlaceholder members={members} />

          {/* ── Family Members Grid ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#d4a853]" />
                Membres de la famille
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0 border-white/10 text-white/40 bg-white/5"
                >
                  {members.length}
                </Badge>
              </h2>
              <Button
                onClick={() => setShowAddForm((prev) => !prev)}
                variant="ghost"
                size="sm"
                className="text-[#d4a853] hover:bg-[#d4a853]/10 text-xs h-8"
              >
                {showAddForm ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 mr-1" />
                    Fermer
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    Ajouter
                  </>
                )}
              </Button>
            </div>

            {/* Add Member Form */}
            <AnimatePresence>
              {showAddForm && (
                <AddMemberForm
                  onSubmit={handleAddMember}
                  onCancel={() => setShowAddForm(false)}
                />
              )}
            </AnimatePresence>

            {/* Members Grid */}
            {members.length === 0 ? (
              <motion.div variants={fadeUp} initial="initial" animate="animate">
                <Card className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-white/20" />
                  </div>
                  <h3 className="text-sm font-semibold text-white/50 mb-1">Aucun membre</h3>
                  <p className="text-xs text-white/30 mb-4">
                    Commencez par ajouter les membres de votre famille pour activer la g\u00E9olocalisation.
                  </p>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    variant="ghost"
                    className="text-[#d4a853] hover:bg-[#d4a853]/10 text-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Ajouter un premier membre
                  </Button>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {members.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </motion.div>
            )}
          </div>

          {/* ── Quick Actions Bottom Bar ── */}
          <motion.div variants={fadeUp} initial="initial" animate="animate">
            <Card className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
                  Actions rapides
                </span>
                <div className="h-4 w-px bg-white/10" />
                <Button
                  onClick={() => setShowAddForm(true)}
                  variant="ghost"
                  size="sm"
                  className="text-white/50 hover:text-white/80 hover:bg-white/5 text-xs h-8"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Nouveau membre
                </Button>
                <a
                  href="/dashboard/family/config"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
                >
                  <MapPinned className="w-3.5 h-3.5" />
                  Zones g\u00E9ographiques
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/50 hover:text-white/80 hover:bg-white/5 text-xs h-8"
                  onClick={fetchMembers}
                >
                  <Wifi className="w-3.5 h-3.5 mr-1.5" />
                  Actualiser
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
