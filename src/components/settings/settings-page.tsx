'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Settings,
  Home,
  Users,
  User,
  Mail,
  Copy,
  RefreshCw,
  Loader2,
  Shield,
  Palette,
  Info,
  Sun,
  Moon,
  Monitor,
  Check,
  Diamond,
  Sparkles,
  Volume2,
  VolumeX,
  Globe,
} from 'lucide-react';
import { HouseholdSettingsPanel } from '@/components/settings/household-settings-panel';
import { DisplaySettingsPanel } from '@/components/display/display-settings-panel';
import { VoiceSettingsPanel } from '@/components/voice/VoiceSettingsPanel';
import { HospitalitySettingsPanel } from '@/components/hospitality/HospitalitySettingsPanel';
import { NotificationSettingsPanel } from '@/components/notifications/NotificationSettingsPanel';
import { VoiceSettingsPanel as ExtendedVoicePanel } from '@/components/settings/voice-settings-panel';
import { NewsSettingsPanel } from '@/components/settings/news-settings-panel';
import { PreferencesPanel } from '@/components/settings/preferences-panel';
import { HospitalityExtendedPanel } from '@/components/settings/hospitality-extended-panel';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/auth-store';
import {
  type AccentColor,
  ACCENT_THEMES,
  applyAccentTheme,
  persistAccentColor,
  getPersistedAccentColor,
  type AccentTheme,
} from '@/lib/accent-colors';
import {
  isAmbientSoundsEnabled,
  setAmbientSoundsEnabled,
  playAmbientSound,
  playRandomChime,
  getMasterVolume,
  setMasterVolume,
  initAudioOnInteraction,
} from '@/lib/ambient-sounds';
import { useI18n, LOCALE_LABELS, LOCALES, type Locale } from '@/contexts/I18nContext';
import { trackEvent } from '@/lib/analytics';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface HouseholdUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string;
}

interface HouseholdData {
  name?: string;
  membersCount?: number;
  zonesCount?: number;
  users?: HouseholdUser[];
  settings?: Record<string, unknown>;
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

/* ═══════════════════════════════════════════════════════════════
   SETTINGS PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function SettingsPage() {
  const { userName, userEmail, userAvatar, householdName, user, isAuthenticated } = useAuthStore();
  const { locale, setLocale, isRTL } = useI18n();
  const { theme, setTheme } = useTheme();
  const voice = useVoiceAssistant();
  const [voiceLanguage, setVoiceLanguage] = useState('fr-FR');
  const [voiceConvWindow, setVoiceConvWindow] = useState(10);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [household, setHousehold] = useState<HouseholdData | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  // Edit states
  const [editHouseholdOpen, setEditHouseholdOpen] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [savingHousehold, setSavingHousehold] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);

  // Accent color
  const [selectedAccent, setSelectedAccent] = useState<AccentColor>('gold');

  // Ambient sounds
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.7);

  useEffect(() => {
    setMounted(true);
    // Load persisted preferences
    setSelectedAccent(getPersistedAccentColor());
    setAmbientEnabled(isAmbientSoundsEnabled());
    setSoundVolume(getMasterVolume());
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        const u = data.user || data;
        if (u?.household) {
          setHousehold(u.household);
          if (u.household.name) setNewHouseholdName(u.household.name);

          // Load accent color from household settings
          const settings = u.household.settings as Record<string, unknown> | undefined;
          if (settings?.accentColor && ACCENT_THEMES[settings.accentColor as AccentColor]) {
            const accent = settings.accentColor as AccentColor;
            setSelectedAccent(accent);
            applyAccentTheme(ACCENT_THEMES[accent]);
            persistAccentColor(accent);
          }
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  const handleSaveHouseholdName = async () => {
    if (!newHouseholdName.trim()) {
      toast.error('Le nom ne peut pas être vide');
      return;
    }
    setSavingHousehold(true);
    try {
      const res = await fetch('/api/household', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHouseholdName.trim() }),
      });
      if (res.ok) {
        toast.success('Nom du foyer mis à jour');
        setEditHouseholdOpen(false);
        fetchData();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSavingHousehold(false);
    }
  };

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    try {
      const res = await fetch('/api/household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-invite' }),
      });
      if (res.ok) {
        const data = await res.json();
        setInviteCode(data.inviteCode || '');
        setShowInvite(true);
        toast.success('Code d\'invitation généré');
      } else {
        toast.error('Erreur lors de la génération');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Code copié dans le presse-papier');
  };

  // ─── Accent color handler ───
  const handleAccentChange = async (accent: AccentColor) => {
    const theme = ACCENT_THEMES[accent];
    setSelectedAccent(accent);
    applyAccentTheme(theme);
    persistAccentColor(accent);
    toast.success(`Accent "${theme.label}" appliqué`);

    // Save to household settings via API
    try {
      const currentSettings: Record<string, unknown> = {};
      if (household?.settings) {
        Object.assign(currentSettings, household.settings);
      }
      currentSettings.accentColor = accent;

      await fetch('/api/household', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: currentSettings }),
      });
    } catch {
      // Settings still work locally even if API fails
    }
  };

  // ─── Ambient sound handler ───
  const handleAmbientToggle = (enabled: boolean) => {
    setAmbientEnabled(enabled);
    setAmbientSoundsEnabled(enabled);
    if (enabled) {
      initAudioOnInteraction();
      toast.success('Ambiance sonore activée');
      setTimeout(() => playRandomChime(), 300);
    } else {
      toast.success('Ambiance sonore désactivée');
    }
  };

  const handleVolumeChange = (volume: number) => {
    const v = Math.round(volume * 100) / 100;
    setSoundVolume(v);
    setMasterVolume(v);
  };

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const members: HouseholdUser[] = household?.users || [];

  const themeOptions = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système', icon: Monitor },
  ];

  const accentColors: AccentTheme[] = [
    ACCENT_THEMES.gold,
    ACCENT_THEMES.silver,
    ACCENT_THEMES.copper,
    ACCENT_THEMES.emerald,
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gradient-gold">
          Paramètres
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Gérez votre foyer et vos préférences
        </p>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         PROFILE SECTION
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                <User className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">Mon profil</h2>
            </div>

            <div className="flex items-center gap-5">
              <Avatar className="h-16 w-16 ring-2 ring-[var(--accent-primary)]/50 ring-offset-3 ring-offset-transparent">
                <AvatarFallback className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-lg font-semibold relative">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt={userName ? `Photo de ${userName}` : 'Avatar utilisateur'}
                      className="h-full w-full rounded-full object-cover"
                      fill
                    />
                  ) : (
                    initials
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1.5">
                <p className="font-serif font-semibold text-lg text-[#e2e8f0]">
                  {userName || 'Utilisateur'}
                </p>
                <p className="text-sm text-[#64748b] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {userEmail || 'email@exemple.com'}
                </p>
                <Badge className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full mt-1">
                  <Shield className="w-3 h-3 mr-1" />
                  {user?.role === 'admin' ? 'Administrateur' : 'Membre'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         HOUSEHOLD SECTION
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
          <CardContent className="p-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#c77d5a]/10 flex items-center justify-center">
                  <Home className="w-4 h-4 text-[#c77d5a]" />
                </div>
                <div>
                  <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">Mon foyer</h2>
                  <p className="text-[10px] text-[#475569]">
                    {loading ? (
                      <Skeleton className="h-3 w-28 inline-block bg-white/[0.06]" />
                    ) : (
                      `${members.length} membre${members.length !== 1 ? 's' : ''} · ${household?.zonesCount ?? 0} zone${(household?.zonesCount ?? 0) !== 1 ? 's' : ''}`
                    )}
                  </p>
                </div>
              </div>
              {user?.role === 'admin' && (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditHouseholdOpen(true)}
                    className="text-[#64748b] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-300"
                  >
                    Modifier
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Household name */}
            <div className="glass-gold rounded-xl p-4 mb-5">
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-[var(--accent-primary)]" />
                <div>
                  <p className="text-sm font-semibold text-[#e2e8f0]">
                    {householdName || household?.name || 'Mon foyer'}
                  </p>
                  <p className="text-[10px] text-[#475569]">Nom du foyer</p>
                </div>
              </div>
            </div>

            {/* Members list */}
            <div className="mb-5">
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Membres
              </p>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-xl bg-white/[0.06]" />
                  ))}
                </div>
              ) : members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member) => {
                    const memberInitials = member.name
                      ? member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                      : '??';
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-all duration-300"
                      >
                        <Avatar className="h-9 w-9 ring-1 ring-[var(--accent-primary)]/20 ring-offset-1 ring-offset-transparent">
                          <AvatarFallback className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-semibold relative">
                            {member.avatar ? (
                              <Image src={member.avatar} alt={member.name ? `Photo de ${member.name}` : 'Avatar utilisateur'} className="h-full w-full rounded-full object-cover" fill />
                            ) : (
                              memberInitials
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#e2e8f0] truncate">{member.name || 'Membre'}</p>
                          <p className="text-[10px] text-[#475569] truncate">{member.email || ''}</p>
                        </div>
                        <Badge className={`${member.role === 'admin' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-white/[0.04] text-[#64748b]'} border-0 text-[9px] font-semibold px-2 py-0.5 rounded-full`}>
                          {member.role === 'admin' ? 'Admin' : 'Membre'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#475569] text-center py-4">Aucun membre trouvé</p>
              )}
            </div>

            <div className="divider-gold mb-5" />

            {/* Invite code */}
            <div>
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Inviter un membre
              </p>
              <p className="text-xs text-[#475569] mb-3">
                Générez un code d&apos;invitation pour ajouter un membre à votre foyer
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outline"
                  onClick={handleGenerateInvite}
                  disabled={generatingInvite}
                  className="border-[var(--accent-primary)]/25 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 hover:border-[var(--accent-primary)]/40 hover:shadow-[0_0_12px_rgba(212,168,83,0.1)] transition-all duration-300"
                >
                  {generatingInvite ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Générer un code
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         HOUSEHOLD SETTINGS V2 (Identity / SEO / Preferences)
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
      >
        <HouseholdSettingsPanel />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         DISPLAY SETTINGS (Tablet)
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={3}
      >
        <DisplaySettingsPanel />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         VOICE ASSISTANT (TTS + STT)
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={4}
      >
        <VoiceSettingsPanel
          voiceSettings={{
            enabled: voice.isEnabled,
            rate: voice.rate,
            volume: voice.volume,
            language: voiceLanguage,
            conversationWindow: voiceConvWindow,
          }}
          onSave={(settings) => {
            if (settings.enabled !== voice.isEnabled) voice.toggleEnabled();
            voice.setVolume(settings.volume);
            voice.setRate(settings.rate);
            setVoiceLanguage(settings.language);
            setVoiceConvWindow(settings.conversationWindow);
          }}
        />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         NOTIFICATION SETTINGS (Proactive Voice)
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={5}
      >
        <NotificationSettingsPanel />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         HOSPITALITY SETTINGS (Review, Contact, POI)
         ═══════════════════════════════════════════════════════════ */}
      {user?.role === 'admin' && household?.settings && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={6}
        >
          <HospitalitySettingsPanel />
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         VOICE SETTINGS EXTENDED (Name, Wake Word, TTS, Language)
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={7}
      >
        <ExtendedVoicePanel />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         NEWS SETTINGS (RSS Sources, Refresh Interval)
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={8}
      >
        <NewsSettingsPanel />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         MEMORY & PREFERENCES (Learned prefs, Manual overrides)
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={9}
      >
        <PreferencesPanel />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         HOSPITALITY EXTENDED (WhatsApp, Modules, Alerts, Calendar)
         ═══════════════════════════════════════════════════════════ */}
      {user?.role === 'admin' && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={10}
        >
          <HospitalityExtendedPanel />
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         ACCENT COLOR SECTION
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={11}
      >
        <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                <Palette className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">Couleur d&apos;accent</h2>
                <p className="text-[10px] text-[#475569]">Personnalisez l&apos;identité visuelle de votre foyer</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {accentColors.map((accent) => {
                const isSelected = selectedAccent === accent.id;
                return (
                  <motion.button
                    key={accent.id}
                    type="button"
                    onClick={() => handleAccentChange(accent.id)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className={`
                      flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-400
                      ${isSelected
                        ? 'border-2 shadow-lg'
                        : 'border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]'
                      }
                    `}
                    style={isSelected ? {
                      borderColor: accent.primary,
                      boxShadow: `0 0 20px ${accent.primary}25, 0 4px 12px rgba(0,0,0,0.3)`,
                      backgroundColor: `${accent.primary}10`,
                    } : {}}
                  >
                    {/* Color preview swatch */}
                    <div
                      className="w-10 h-10 rounded-full border-2 transition-all duration-400"
                      style={{
                        background: `linear-gradient(135deg, ${accent.primary}, ${accent.primaryLight})`,
                        borderColor: isSelected ? accent.primaryLight : 'rgba(255,255,255,0.1)',
                        boxShadow: isSelected ? `0 0 16px ${accent.primary}40` : 'none',
                      }}
                    />
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className="text-sm font-semibold transition-colors duration-300"
                        style={{ color: isSelected ? accent.primary : '#64748b' }}
                      >
                        {accent.label}
                      </span>
                      <span className="text-xs">{accent.emoji}</span>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <Check className="w-4 h-4" style={{ color: accent.primary }} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <p className="text-[10px] text-[#475569] mt-4 text-center">
              L&apos;accent est appliqué instantanément et sauvegardé pour tous les membres du foyer
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         LANGUAGE SECTION (i18n)
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={12}
      >
        <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-[#0ea5e9]" />
              </div>
              <div>
                <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">Langue</h2>
                <p className="text-[10px] text-[#475569]">Interface en 10 langues, changement instantané</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {LOCALES.map((loc) => {
                const isSelected = locale === loc;
                return (
                  <motion.button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setLocale(loc);
                      trackEvent('settings_language_changed', { locale: loc });
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`
                      flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-300
                      ${isSelected
                        ? 'border-[#0ea5e9]/50 bg-[#0ea5e9]/10 shadow-[0_0_12px_rgba(14,165,233,0.15)]'
                        : 'border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]'
                      }
                    `}
                  >
                    <span className={`text-sm font-medium transition-colors duration-300 ${isSelected ? 'text-[#0ea5e9]' : 'text-[#64748b]'}`}>
                      {LOCALE_LABELS[loc]}
                    </span>
                    <span className="text-[10px] text-[#475569] uppercase font-mono">{loc}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0ea5e9]" />}
                  </motion.button>
                );
              })}
            </div>

            {isRTL && (
              <p className="text-[10px] text-[#0ea5e9]/60 mt-3 text-center">
                ← Mode droite-à-gauche activé pour l&apos;arabe →
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         THEME SECTION
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={13}
      >
        <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                <Settings className="w-4 h-4 text-[#8b5cf6]" />
              </div>
              <div>
                <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">Apparence</h2>
                <p className="text-[10px] text-[#475569]">Thème et préférences d&apos;affichage</p>
              </div>
            </div>

            {mounted && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = theme === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`
                        flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-300
                        ${isSelected
                          ? 'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/10 shadow-[0_0_16px_rgba(212,168,83,0.15)]'
                          : 'border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 transition-colors duration-300 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[#64748b]'}`} />
                      <span className={`text-sm font-medium transition-colors duration-300 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[#64748b]'}`}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[var(--accent-primary)]" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* ── Ambient Sounds Toggle ── */}
            <div className="divider-gold mb-5" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
                  {ambientEnabled ? (
                    <Volume2 className="w-4 h-4 text-[var(--accent-primary)]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-[#475569]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#e2e8f0]">Ambiance sonore</p>
                  <p className="text-[10px] text-[#475569]">Sons subtils lors des scans QR</p>
                </div>
              </div>
              <Switch
                checked={ambientEnabled}
                onCheckedChange={handleAmbientToggle}
                className="data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-white/[0.08]"
              />
            </div>
            {ambientEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 ml-12 space-y-3"
              >
                <p className="text-[10px] text-[var(--accent-primary)]/60 leading-relaxed">
                  🔔 Carillon doux lors des scans QR · Sons activés uniquement après interaction
                </p>
                {/* Volume slider */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#475569] uppercase tracking-wider w-12">Volume</span>
                  <div className="flex-1 relative h-1.5 rounded-full bg-white/[0.06]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--accent-primary-dark)] to-[var(--accent-primary)]"
                      style={{ width: `${soundVolume * 100}%` }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={soundVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Volume du son"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary-glow)] pointer-events-none transition-all duration-100"
                      style={{ left: `calc(${soundVolume * 100}% - 6px)` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#64748b] font-mono w-8 text-right">{Math.round(soundVolume * 100)}%</span>
                </div>
                {/* Test sound button */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => playRandomChime()}
                  className="inline-flex items-center gap-1.5 text-[10px] text-[var(--accent-primary)]/70 hover:text-[var(--accent-primary)] transition-colors duration-300"
                >
                  <Volume2 className="w-3 h-3" />
                  Tester le son
                </motion.button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         ABOUT SECTION
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={14}
      >
        <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                <Info className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">À propos</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-[#64748b]">Application</span>
                <div className="flex items-center gap-2">
                  <Diamond className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span className="text-sm font-serif font-medium text-gradient-gold">Maison Consciente</span>
                </div>
              </div>
              <div className="divider-gold" />
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-[#64748b]">Version</span>
                <Badge className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  1.1.0
                </Badge>
              </div>
              <div className="divider-gold" />
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-[#64748b]">Technologie</span>
                <span className="text-sm text-[#94a3b8]">Next.js 16 + React 19</span>
              </div>
              <div className="divider-gold" />
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-[#64748b]">Description</span>
                <span className="text-sm text-[#94a3b8] text-right max-w-[200px]">
                  L&apos;Habitation Intelligente
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         EDIT HOUSEHOLD DIALOG
         ═══════════════════════════════════════════════════════════ */}
      <Dialog open={editHouseholdOpen} onOpenChange={setEditHouseholdOpen}>
        <DialogContent className="sm:max-w-md glass-strong rounded-2xl border-white/[0.08] p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#e2e8f0]">
              Modifier le foyer
            </DialogTitle>
            <DialogDescription className="text-[#64748b]">
              Changez le nom de votre foyer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[#94a3b8] text-sm">Nom du foyer</Label>
              <Input
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                disabled={savingHousehold}
                placeholder="Mon foyer"
                className="glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all duration-300"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setEditHouseholdOpen(false)}
              disabled={savingHousehold}
              className="text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all duration-300"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveHouseholdName}
              disabled={savingHousehold || !newHouseholdName.trim()}
              className="bg-gradient-gold text-[#0a0a12] font-semibold shadow-[0_0_16px_rgba(212,168,83,0.2)] hover:shadow-[0_0_24px_rgba(212,168,83,0.3)] transition-all duration-400 disabled:opacity-50"
            >
              {savingHousehold && <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0a0a12]" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
         INVITE CODE DIALOG
         ═══════════════════════════════════════════════════════════ */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-md glass-strong rounded-2xl border-white/[0.08] p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#e2e8f0]">
              Code d&apos;invitation
            </DialogTitle>
            <DialogDescription className="text-[#64748b]">
              Partagez ce code avec la personne que vous souhaitez inviter
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-5 rounded-xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20">
              <span className="text-2xl font-mono font-bold text-gradient-gold flex-1 text-center tracking-widest">
                {inviteCode}
              </span>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyInviteCode}
                  className="border-[var(--accent-primary)]/25 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 hover:border-[var(--accent-primary)]/40 transition-all duration-300 h-10 w-10 rounded-xl"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
            <p className="text-xs text-[#475569] mt-4 text-center">
              Ce code est valable pendant 7 jours et peut être utilisé une seule fois
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowInvite(false)}
              className="text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all duration-300"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
