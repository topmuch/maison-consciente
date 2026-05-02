'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Users,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Loader2,
  Check,
  ShieldCheck,
  Clock,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Home,
  GraduationCap,
  Briefcase,
  Star,
  ToggleLeft,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   MAELLIS — Family Config: GeoFences & Members Consent

   Luxury gold-theme page for managing geo-fences and
   family member tracking consent / privacy settings.
   ═══════════════════════════════════════════════════════ */

// ─── Types ────────────────────────────────────────────

interface GeoFence {
  id: string;
  name: string;
  type: 'home' | 'school' | 'work' | 'custom';
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  address?: string;
  color: string;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  haSceneOnEntry?: string;
  haSceneOnExit?: string;
  isActive: boolean;
  createdAt?: string;
}

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  consentGiven: boolean;
  isActive: boolean;
  autoDeleteDays: number;
  expectedHomeBefore?: string;
  trackingToken: string;
  createdAt?: string;
}

type TabKey = 'geofences' | 'members';

// ─── Constants ────────────────────────────────────────

const FENCE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  home: { icon: <Home className="w-3.5 h-3.5" />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  school: { icon: <GraduationCap className="w-3.5 h-3.5" />, color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  work: { icon: <Briefcase className="w-3.5 h-3.5" />, color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  custom: { icon: <Star className="w-3.5 h-3.5" />, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

const FENCE_TYPE_LABELS: Record<string, string> = {
  home: 'Maison',
  school: 'École',
  work: 'Travail',
  custom: 'Personnalisé',
};

const EMPTY_FENCE: Omit<GeoFence, 'id'> = {
  name: '',
  type: 'home',
  centerLat: 0,
  centerLng: 0,
  radiusMeters: 200,
  address: '',
  color: '#d4a853',
  notifyOnEntry: true,
  notifyOnExit: false,
  haSceneOnEntry: '',
  haSceneOnExit: '',
  isActive: true,
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const cardVariant = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

// ─── Component ────────────────────────────────────────

export default function FamilyConfigPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('geofences');

  // GeoFence state
  const [fences, setFences] = useState<GeoFence[]>([]);
  const [fencesLoading, setFencesLoading] = useState(true);
  const [fenceForm, setFenceForm] = useState<Omit<GeoFence, 'id'>>(EMPTY_FENCE);
  const [editingFenceId, setEditingFenceId] = useState<string | null>(null);
  const [showFenceForm, setShowFenceForm] = useState(false);
  const [fenceSubmitting, setFenceSubmitting] = useState(false);
  const [deletingFenceId, setDeletingFenceId] = useState<string | null>(null);

  // Member state
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [revealedTokens, setRevealedTokens] = useState<Set<string>>(new Set());
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [memberPatching, setMemberPatching] = useState<string | null>(null);
  const [autoDeleteEdits, setAutoDeleteEdits] = useState<Record<string, number>>({});
  const [homeBeforeEdits, setHomeBeforeEdits] = useState<Record<string, string>>({});

  // ─── Fetch GeoFences ───
  const fetchFences = useCallback(async () => {
    try {
      const res = await fetch('/api/geofences');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setFences(data.fences || []);
      }
    } catch {
      // silent
    } finally {
      setFencesLoading(false);
    }
  }, []);

  // ─── Fetch Family Members ───
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/family-members');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setMembers(data.members || []);
      }
    } catch {
      // silent
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFences();
    fetchMembers();
  }, [fetchFences, fetchMembers]);

  // ─── GeoFence CRUD ───

  const handleFenceSubmit = async () => {
    setFenceSubmitting(true);
    try {
      if (editingFenceId) {
        const res = await fetch(`/api/geofences/${editingFenceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fenceForm),
        });
        if (res.ok) {
          setFences((prev) =>
            prev.map((f) => (f.id === editingFenceId ? { ...f, ...fenceForm } : f))
          );
        }
      } else {
        const res = await fetch('/api/geofences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fenceForm),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.fence) setFences((prev) => [...prev, data.fence]);
        }
      }
      setFenceForm(EMPTY_FENCE);
      setEditingFenceId(null);
      setShowFenceForm(false);
      fetchFences();
    } catch {
      // silent
    } finally {
      setFenceSubmitting(false);
    }
  };

  const handleEditFence = (fence: GeoFence) => {
    setEditingFenceId(fence.id);
    setFenceForm({
      name: fence.name,
      type: fence.type,
      centerLat: fence.centerLat,
      centerLng: fence.centerLng,
      radiusMeters: fence.radiusMeters,
      address: fence.address || '',
      color: fence.color,
      notifyOnEntry: fence.notifyOnEntry,
      notifyOnExit: fence.notifyOnExit,
      haSceneOnEntry: fence.haSceneOnEntry || '',
      haSceneOnExit: fence.haSceneOnExit || '',
      isActive: fence.isActive,
    });
    setShowFenceForm(true);
  };

  const handleDeleteFence = async (id: string) => {
    setDeletingFenceId(id);
    try {
      const res = await fetch(`/api/geofences/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFences((prev) => prev.filter((f) => f.id !== id));
      }
    } catch {
      // silent
    } finally {
      setDeletingFenceId(null);
    }
  };

  const handleToggleFenceActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/geofences/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      setFences((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isActive } : f))
      );
    } catch {
      // silent
    }
  };

  // ─── Family Member Actions ───

  const handlePatchMember = async (id: string, patch: Record<string, unknown>) => {
    setMemberPatching(id);
    try {
      const res = await fetch(`/api/family-members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.member) {
          setMembers((prev) =>
            prev.map((m) => (m.id === id ? { ...m, ...data.member } : m))
          );
        }
      }
    } catch {
      // silent
    } finally {
      setMemberPatching(null);
    }
  };

  const handleDeleteMember = async (id: string) => {
    setDeletingMemberId(id);
    try {
      const res = await fetch(`/api/family-members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {
      // silent
    } finally {
      setDeletingMemberId(null);
    }
  };

  const handleCopyToken = async (token: string, memberId: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(memberId);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      // silent
    }
  };

  const toggleTokenReveal = (memberId: string) => {
    setRevealedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const maskToken = (token: string) => {
    if (!token) return '—';
    return token.slice(0, 8) + '••••••••••••••••' + token.slice(-4);
  };

  const handleAutoDeleteBlur = (memberId: string, value: number) => {
    const member = members.find((m) => m.id === memberId);
    if (member && value !== member.autoDeleteDays && value > 0) {
      handlePatchMember(memberId, { autoDeleteDays: value });
    }
    setAutoDeleteEdits((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
  };

  const handleHomeBeforeBlur = (memberId: string, value: string) => {
    const member = members.find((m) => m.id === memberId);
    if (member && value !== (member.expectedHomeBefore || '')) {
      handlePatchMember(memberId, { expectedHomeBefore: value ? new Date(value).toISOString() : null });
    }
    setHomeBeforeEdits((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
  };

  // ─── Render Helpers ───

  const toLocalDatetime = (iso: string | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // ─── Main Render ────────────────────────────────────

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#d4a853]/10 border border-[#d4a853]/20 flex items-center justify-center">
          <Users className="w-6 h-6 text-[#d4a853]" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-[var(--text-primary, #f8fafc)]">
            Famille & Localisation
          </h1>
          <p className="text-sm text-[var(--text-secondary, #94a3b8)]">
            Géorepérages et consentements des membres
          </p>
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.1}
        className="flex gap-2 p-1 rounded-xl bg-slate-950/80 border border-white/10 backdrop-blur-xl w-fit"
      >
        {[
          { key: 'geofences' as TabKey, label: 'Zones Géographiques', icon: <MapPin className="w-4 h-4" /> },
          { key: 'members' as TabKey, label: 'Membres & Consentements', icon: <Users className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === tab.key
                ? 'text-[#020617] bg-[#d4a853] shadow-lg shadow-[#d4a853]/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-lg bg-[#d4a853] -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'geofences' ? (
          <motion.div
            key="geofences"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* ── Tab 1: GeoFences ── */}

            {/* Add / Edit Fence Form */}
            <AnimatePresence>
              {showFenceForm && (
                <motion.div
                  variants={cardVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-serif text-[var(--text-primary, #f8fafc)] flex items-center gap-2">
                        {editingFenceId ? (
                          <>
                            <Pencil className="w-4 h-4 text-[#d4a853]" />
                            Modifier la zone
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 text-[#d4a853]" />
                            Nouvelle zone géographique
                          </>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Row 1: Name + Type */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wider">
                            Nom de la zone
                          </Label>
                          <Input
                            value={fenceForm.name}
                            onChange={(e) => setFenceForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="Ex: Maison, École..."
                            className="bg-slate-900/60 border-white/10 text-[var(--text-primary, #f8fafc)] placeholder:text-slate-600 focus:border-[#d4a853]/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wider">
                            Type
                          </Label>
                          <div className="relative">
                            <select
                              value={fenceForm.type}
                              onChange={(e) =>
                                setFenceForm((f) => ({
                                  ...f,
                                  type: e.target.value as GeoFence['type'],
                                }))
                              }
                              className="w-full h-10 rounded-md bg-slate-900/60 border border-white/10 text-[var(--text-primary, #f8fafc)] text-sm px-3 focus:outline-none focus:border-[#d4a853]/50 appearance-none cursor-pointer"
                            >
                              <option value="home">Maison</option>
                              <option value="school">École</option>
                              <option value="work">Travail</option>
                              <option value="custom">Personnalisé</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Coordinates + Radius */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wider">
                            Latitude
                          </Label>
                          <Input
                            type="number"
                            step="any"
                            value={fenceForm.centerLat}
                            onChange={(e) =>
                              setFenceForm((f) => ({ ...f, centerLat: parseFloat(e.target.value) || 0 }))
                            }
                            placeholder="48.8566"
                            className="bg-slate-900/60 border-white/10 text-[var(--text-primary, #f8fafc)] placeholder:text-slate-600 focus:border-[#d4a853]/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wider">
                            Longitude
                          </Label>
                          <Input
                            type="number"
                            step="any"
                            value={fenceForm.centerLng}
                            onChange={(e) =>
                              setFenceForm((f) => ({ ...f, centerLng: parseFloat(e.target.value) || 0 }))
                            }
                            placeholder="2.3522"
                            className="bg-slate-900/60 border-white/10 text-[var(--text-primary, #f8fafc)] placeholder:text-slate-600 focus:border-[#d4a853]/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wider">
                            Rayon (mètres)
                          </Label>
                          <Input
                            type="number"
                            min={10}
                            value={fenceForm.radiusMeters}
                            onChange={(e) =>
                              setFenceForm((f) => ({ ...f, radiusMeters: parseInt(e.target.value) || 200 }))
                            }
                            placeholder="200"
                            className="bg-slate-900/60 border-white/10 text-[var(--text-primary, #f8fafc)] placeholder:text-slate-600 focus:border-[#d4a853]/50"
                          />
                        </div>
                      </div>

                      {/* Row 3: Address + Color */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wider">
                            Adresse <span className="text-slate-600 normal-case">(optionnel)</span>
                          </Label>
                          <Input
                            value={fenceForm.address}
                            onChange={(e) => setFenceForm((f) => ({ ...f, address: e.target.value }))}
                            placeholder="123 Rue de la Paix, Paris"
                            className="bg-slate-900/60 border-white/10 text-[var(--text-primary, #f8fafc)] placeholder:text-slate-600 focus:border-[#d4a853]/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wider">
                            Couleur
                          </Label>
                          <div className="flex gap-2">
                            <div
                              className="w-10 h-10 rounded-lg border border-white/10 shrink-0"
                              style={{ backgroundColor: fenceForm.color }}
                            />
                            <Input
                              value={fenceForm.color}
                              onChange={(e) => setFenceForm((f) => ({ ...f, color: e.target.value }))}
                              placeholder="#d4a853"
                              className="bg-slate-900/60 border-white/10 text-[var(--text-primary, #f8fafc)] placeholder:text-slate-600 focus:border-[#d4a853]/50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 4: Notification switches */}
                      <div className="space-y-3">
                        <Label className="text-xs text-slate-400 uppercase tracking-wider">
                          Notifications
                        </Label>
                        <div className="flex flex-wrap gap-6">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={fenceForm.notifyOnEntry}
                              onCheckedChange={(checked) =>
                                setFenceForm((f) => ({ ...f, notifyOnEntry: checked }))
                              }
                              className="data-[state=checked]:bg-[#d4a853]"
                            />
                            <Label className="text-sm text-slate-300 cursor-pointer select-none">
                              Notifier à l&apos;entrée
                            </Label>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={fenceForm.notifyOnExit}
                              onCheckedChange={(checked) =>
                                setFenceForm((f) => ({ ...f, notifyOnExit: checked }))
                              }
                              className="data-[state=checked]:bg-[#d4a853]"
                            />
                            <Label className="text-sm text-slate-300 cursor-pointer select-none">
                              Notifier à la sortie
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Row 5: HA Scenes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wider">
                            Scène HA entrée <span className="text-slate-600 normal-case">(optionnel)</span>
                          </Label>
                          <Input
                            value={fenceForm.haSceneOnEntry}
                            onChange={(e) => setFenceForm((f) => ({ ...f, haSceneOnEntry: e.target.value }))}
                            placeholder="scene.arrive_maison"
                            className="bg-slate-900/60 border-white/10 text-[var(--text-primary, #f8fafc)] placeholder:text-slate-600 focus:border-[#d4a853]/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wider">
                            Scène HA sortie <span className="text-slate-600 normal-case">(optionnel)</span>
                          </Label>
                          <Input
                            value={fenceForm.haSceneOnExit}
                            onChange={(e) => setFenceForm((f) => ({ ...f, haSceneOnExit: e.target.value }))}
                            placeholder="scene.depart_maison"
                            className="bg-slate-900/60 border-white/10 text-[var(--text-primary, #f8fafc)] placeholder:text-slate-600 focus:border-[#d4a853]/50"
                          />
                        </div>
                      </div>

                      <Separator className="bg-white/10" />

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={handleFenceSubmit}
                          disabled={fenceSubmitting || !fenceForm.name.trim()}
                          className="bg-[#d4a853] hover:bg-[#c49a48] text-[#020617] font-semibold shadow-lg shadow-[#d4a853]/20"
                        >
                          {fenceSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : editingFenceId ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          <span className="ml-2">
                            {editingFenceId ? 'Mettre à jour' : 'Créer la zone'}
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowFenceForm(false);
                            setEditingFenceId(null);
                            setFenceForm(EMPTY_FENCE);
                          }}
                          className="text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        >
                          Annuler
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add Fence Button (when form hidden) */}
            {!showFenceForm && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.2}>
                <Button
                  onClick={() => {
                    setFenceForm(EMPTY_FENCE);
                    setEditingFenceId(null);
                    setShowFenceForm(true);
                  }}
                  className="bg-[#d4a853]/10 hover:bg-[#d4a853]/20 text-[#d4a853] border border-[#d4a853]/20 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span className="ml-2">Ajouter une zone</span>
                </Button>
              </motion.div>
            )}

            {/* Fences List */}
            {fencesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#d4a853] animate-spin" />
                <span className="ml-3 text-sm text-slate-400">Chargement des zones...</span>
              </div>
            ) : fences.length === 0 ? (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.3}
              >
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
                  <CardContent className="py-12 text-center">
                    <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                      Aucune zone géographique configurée.
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      Ajoutez votre première zone pour commencer le suivi.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {fences.map((fence, idx) => {
                    const typeConf = FENCE_TYPE_CONFIG[fence.type] || FENCE_TYPE_CONFIG.custom;
                    return (
                      <motion.div
                        key={fence.id}
                        variants={cardVariant}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        custom={idx}
                      >
                        <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-[#d4a853]/20 transition-colors duration-300">
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              {/* Color indicator + Info */}
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div
                                  className="w-10 h-10 rounded-xl border border-white/10 shrink-0 flex items-center justify-center"
                                  style={{ backgroundColor: fence.color + '20' }}
                                >
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: fence.color }}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-semibold text-[var(--text-primary, #f8fafc)] truncate">
                                      {fence.name}
                                    </h3>
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${typeConf.color}`}
                                    >
                                      {typeConf.icon}
                                      {FENCE_TYPE_LABELS[fence.type] || fence.type}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {fence.centerLat.toFixed(4)}, {fence.centerLng.toFixed(4)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <RefreshCw className="w-3 h-3" />
                                      {fence.radiusMeters}m
                                    </span>
                                    {fence.address && (
                                      <span className="hidden md:inline truncate max-w-[200px]">
                                        {fence.address}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-3 shrink-0">
                                {/* Active Toggle */}
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={fence.isActive}
                                    onCheckedChange={(checked) => handleToggleFenceActive(fence.id, checked)}
                                    className="data-[state=checked]:bg-[#d4a853]"
                                  />
                                  <span className="text-xs text-slate-400 hidden sm:inline">
                                    {fence.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>

                                <Separator orientation="vertical" className="h-6 bg-white/10 hidden sm:block" />

                                {/* Edit */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditFence(fence)}
                                  className="text-slate-400 hover:text-[#d4a853] hover:bg-[#d4a853]/10 h-8 w-8 p-0"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>

                                {/* Delete */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteFence(fence.id)}
                                  disabled={deletingFenceId === fence.id}
                                  className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 p-0"
                                >
                                  {deletingFenceId === fence.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Notification badges */}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                              {fence.notifyOnEntry && (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                                  Entrée
                                </Badge>
                              )}
                              {fence.notifyOnExit && (
                                <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px]">
                                  Sortie
                                </Badge>
                              )}
                              {fence.haSceneOnEntry && (
                                <span className="text-[10px] text-slate-500 truncate">
                                  HA entrée: {fence.haSceneOnEntry}
                                </span>
                              )}
                              {fence.haSceneOnExit && (
                                <span className="text-[10px] text-slate-500 truncate">
                                  HA sortie: {fence.haSceneOnExit}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="members"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* ── Tab 2: Family Members & Consent ── */}

            {/* Privacy Info Card */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.1}>
              <Card className="backdrop-blur-xl bg-white/5 border border-[#d4a853]/15 rounded-2xl overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#d4a853]/10 border border-[#d4a853]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4.5 h-4.5 text-[#d4a853]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-[var(--text-primary, #f8fafc)]">
                        Confidentialité &amp; RGPD
                      </h3>
                      <ul className="space-y-1.5 text-xs text-slate-400">
                        <li className="flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#d4a853] shrink-0 mt-0.5" />
                          Les données de localisation sont automatiquement supprimées après la période configurée.
                        </li>
                        <li className="flex items-start gap-2">
                          <ToggleLeft className="w-3.5 h-3.5 text-[#d4a853] shrink-0 mt-0.5" />
                          Le consentement peut être révoqué à tout moment depuis cette page ou depuis le mobile.
                        </li>
                        <li className="flex items-start gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#d4a853] shrink-0 mt-0.5" />
                          Le tracking est entièrement local — aucune donnée n&apos;est partagée avec des tiers.
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Members List */}
            {membersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#d4a853] animate-spin" />
                <span className="ml-3 text-sm text-slate-400">Chargement des membres...</span>
              </div>
            ) : members.length === 0 ? (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.2}>
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
                  <CardContent className="py-12 text-center">
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                      Aucun membre de la famille.
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      Les membres apparaîtront une fois le tracking activé.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {members.map((member, idx) => (
                    <motion.div
                      key={member.id}
                      variants={cardVariant}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={idx}
                    >
                      <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-[#d4a853]/20 transition-colors duration-300">
                        <CardContent className="p-4 sm:p-5 space-y-4">
                          {/* Member Header Row */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-[#d4a853]/10 border border-[#d4a853]/20 flex items-center justify-center shrink-0 text-[#d4a853] font-bold text-sm">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-[var(--text-primary, #f8fafc)] truncate">
                                  {member.name}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="mt-0.5 text-[10px] border-[#d4a853]/30 text-[#d4a853] bg-[#d4a853]/5"
                                >
                                  {member.role}
                                </Badge>
                              </div>
                            </div>

                            {/* Quick toggles */}
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="flex items-center gap-2">
                                <Label className="text-[10px] text-slate-500 uppercase tracking-wider hidden md:inline">
                                  Consentement
                                </Label>
                                <Switch
                                  checked={member.consentGiven}
                                  onCheckedChange={(checked) =>
                                    handlePatchMember(member.id, { consentGiven: checked })
                                  }
                                  disabled={memberPatching === member.id}
                                  className="data-[state=checked]:bg-emerald-500"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-[10px] text-slate-500 uppercase tracking-wider hidden md:inline">
                                  Actif
                                </Label>
                                <Switch
                                  checked={member.isActive}
                                  onCheckedChange={(checked) =>
                                    handlePatchMember(member.id, { isActive: checked })
                                  }
                                  disabled={memberPatching === member.id}
                                  className="data-[state=checked]:bg-[#d4a853]"
                                />
                              </div>
                            </div>
                          </div>

                          <Separator className="bg-white/5" />

                          {/* Settings Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Auto-delete days */}
                            <div className="space-y-2">
                              <Label className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                Suppression auto (jours)
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                value={
                                  autoDeleteEdits[member.id] !== undefined
                                    ? autoDeleteEdits[member.id]
                                    : member.autoDeleteDays
                                }
                                onChange={(e) =>
                                  setAutoDeleteEdits((prev) => ({
                                    ...prev,
                                    [member.id]: parseInt(e.target.value) || 0,
                                  }))
                                }
                                onBlur={() =>
                                  handleAutoDeleteBlur(
                                    member.id,
                                    autoDeleteEdits[member.id] ?? member.autoDeleteDays
                                  )
                                }
                                className="bg-slate-900/60 border-white/10 text-[var(--text-primary, #f8fafc)] focus:border-[#d4a853]/50"
                              />
                            </div>

                            {/* Expected home before */}
                            <div className="space-y-2">
                              <Label className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Home className="w-3 h-3" />
                                Retour attendu avant
                              </Label>
                              <Input
                                type="datetime-local"
                                value={
                                  homeBeforeEdits[member.id] !== undefined
                                    ? homeBeforeEdits[member.id]
                                    : toLocalDatetime(member.expectedHomeBefore)
                                }
                                onChange={(e) =>
                                  setHomeBeforeEdits((prev) => ({
                                    ...prev,
                                    [member.id]: e.target.value,
                                  }))
                                }
                                onBlur={() =>
                                  handleHomeBeforeBlur(
                                    member.id,
                                    homeBeforeEdits[member.id] ?? toLocalDatetime(member.expectedHomeBefore)
                                  )
                                }
                                className="bg-slate-900/60 border-white/10 text-[var(--text-primary, #f8fafc)] focus:border-[#d4a853]/50 [color-scheme:dark]"
                              />
                            </div>
                          </div>

                          {/* Tracking Token */}
                          <div className="space-y-2">
                            <Label className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldCheck className="w-3 h-3" />
                              Jeton de tracking
                            </Label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-xs font-mono text-slate-300 truncate select-all">
                                {revealedTokens.has(member.id)
                                  ? member.trackingToken
                                  : maskToken(member.trackingToken)}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleTokenReveal(member.id)}
                                className="text-slate-400 hover:text-slate-200 hover:bg-white/5 h-9 w-9 p-0 shrink-0"
                              >
                                {revealedTokens.has(member.id) ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyToken(member.trackingToken, member.id)}
                                className="text-slate-400 hover:text-[#d4a853] hover:bg-[#d4a853]/10 h-9 w-9 p-0 shrink-0"
                              >
                                {copiedToken === member.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <Separator className="bg-white/5" />

                          {/* Delete with RGPD notice */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-start gap-2 flex-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500/70 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Supprimer un membre efface immédiatement toutes ses données de localisation.
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMember(member.id)}
                              disabled={deletingMemberId === member.id}
                              className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 h-8 px-3 shrink-0"
                            >
                              {deletingMemberId === member.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="ml-1.5 text-xs">Supprimer</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
