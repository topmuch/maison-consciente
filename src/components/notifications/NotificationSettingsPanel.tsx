'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Bell,
  Clock,
  CloudRain,
  CalendarDays,
  ShieldCheck,
  Package,
  Palette,
  HeartPulse,
  Hotel,
  Settings2,
  Sparkles,
  MoonStar,
  Loader2,
  ChevronDown,
  Check,
  BellRing,
  BellOff,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  type NotificationPrefs,
  type NotificationCategory,
  type NotificationType,
  NOTIFICATION_TEMPLATES,
  NOTIFICATION_CATEGORIES,
  DEFAULT_NOTIFICATION_PREFS,
} from '@/lib/notification-config';
import { useOneSignal } from '@/hooks/useOneSignal';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface CategoryConfig {
  key: NotificationCategory;
  label: string;
  icon: LucideIcon;
  emoji: string;
  description: string;
  items: { key: string; label: string; description: string }[];
}

/* ═══════════════════════════════════════════════════════════════
   CATEGORY CONFIGS
   ═══════════════════════════════════════════════════════════════ */

const CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    key: 'temporal',
    label: 'Temporelles',
    icon: Clock,
    emoji: '⏰',
    description: 'Messages horaires automatiques',
    items: [
      { key: 'morning', label: 'Bonjour matinal', description: 'Message de bienveillance le matin (7h-9h)' },
      { key: 'meal', label: 'Rappel repas', description: 'Rappel de repas (midi ou soir)' },
      { key: 'evening', label: 'Bonsoir', description: 'Message de bonne soirée (18h-20h)' },
      { key: 'night', label: 'Bonne nuit', description: 'Rappel nocturne (22h-23h)' },
      { key: 'anniversary', label: 'Anniversaire', description: 'Souhait d\'anniversaire' },
    ],
  },
  {
    key: 'weather',
    label: 'Météo',
    icon: CloudRain,
    emoji: '🌤️',
    description: 'Alertes météo proactives',
    items: [
      { key: 'rainAlert', label: 'Alerte pluie', description: 'Pluie imminente' },
      { key: 'extremeTemp', label: 'Température extrême', description: 'Alerte chaleur ou grand froid' },
      { key: 'severeAlert', label: 'Alerte sévère', description: 'Alerte météo grave (tempête, etc.)' },
      { key: 'sunEvents', label: 'Lever/coucher soleil', description: 'Événements solaires' },
    ],
  },
  {
    key: 'calendar',
    label: 'Calendrier',
    icon: CalendarDays,
    emoji: '📅',
    description: 'Rappels et événements',
    items: [
      { key: 'reminder15min', label: 'Rappel 15 min', description: 'Rappel 15 min avant un événement' },
      { key: 'immediate', label: 'Immédiat', description: 'Rappel immédiat pour événement en cours' },
      { key: 'travelPrep', label: 'Préparation voyage', description: 'Préparation départ imminente' },
      { key: 'checkout', label: 'Check-out', description: 'Rappel de check-out hôtelier' },
      { key: 'holiday', label: 'Jour férié', description: 'Jour férié ou événement spécial' },
    ],
  },
  {
    key: 'homeSecurity',
    label: 'Sécurité',
    icon: ShieldCheck,
    emoji: '🔒',
    description: 'Détection et protection',
    items: [
      { key: 'doorWindow', label: 'Porte/fenêtre', description: 'Ouverture de porte/fenêtre détectée' },
      { key: 'autoArm', label: 'Activation auto', description: 'Mode sécurité activé automatiquement' },
      { key: 'deviceBattery', label: 'Batterie capteur', description: 'Batterie faible d\'un capteur' },
      { key: 'leak', label: 'Fuite d\'eau', description: 'Détection de fuite d\'eau' },
    ],
  },
  {
    key: 'inventory',
    label: 'Inventaire',
    icon: Package,
    emoji: '📦',
    description: 'Stocks et achats',
    items: [
      { key: 'stockLow', label: 'Stock bas', description: 'Stock bas sur un produit' },
      { key: 'deals', label: 'Bonne affaire', description: 'Promotion sur un produit récurrent' },
      { key: 'autoReorder', label: 'Réapprovisionnement', description: 'Commande automatique' },
    ],
  },
  {
    key: 'ambiance',
    label: 'Ambiance',
    icon: Palette,
    emoji: '🎨',
    description: 'Routines et modes',
    items: [
      { key: 'routineStart', label: 'Début routine', description: 'Début d\'une routine d\'ambiance' },
      { key: 'phaseChange', label: 'Transition', description: 'Changement de phase d\'ambiance' },
      { key: 'sleepMode', label: 'Mode sommeil', description: 'Activation du mode nuit' },
    ],
  },
  {
    key: 'health',
    label: 'Santé',
    icon: HeartPulse,
    emoji: '💊',
    description: 'Bien-être et urgences',
    items: [
      { key: 'medication', label: 'Médicament', description: 'Rappel de prise de médicament' },
      { key: 'emergency', label: 'Urgence', description: 'Alerte médicale ou urgence' },
      { key: 'airQuality', label: 'Qualité de l\'air', description: 'Information qualité de l\'air' },
    ],
  },
  {
    key: 'hospitality',
    label: 'Hospitalité',
    icon: Hotel,
    emoji: '🏨',
    description: 'Accueil et service',
    items: [
      { key: 'welcome', label: 'Accueil invité', description: 'Message de bienvenue invité' },
      { key: 'checkoutReminder', label: 'Rappel départ', description: 'Rappel de check-out' },
      { key: 'localTip', label: 'Conseil local', description: 'Conseil découverte locale' },
      { key: 'supportAlert', label: 'Support', description: 'Nouveau ticket support reçu' },
    ],
  },
  {
    key: 'system',
    label: 'Système',
    icon: Settings2,
    emoji: '⚙️',
    description: 'Mises à jour et connectivité',
    items: [
      { key: 'updateDone', label: 'Mise à jour', description: 'Fin de mise à jour système' },
      { key: 'lowBattery', label: 'Batterie tablette', description: 'Batterie faible de la tablette' },
      { key: 'connectivity', label: 'Connectivité', description: 'Changement de statut réseau' },
    ],
  },
  {
    key: 'engagement',
    label: 'Engagement',
    icon: Sparkles,
    emoji: '✨',
    description: 'Tips et défis du jour',
    items: [
      { key: 'dailyTip', label: 'Astuce du jour', description: 'Astuce ou fait amusant quotidien' },
      { key: 'quote', label: 'Citation', description: 'Citation inspirante quotidienne' },
      { key: 'wellnessChallenge', label: 'Défi bien-être', description: 'Défi santé/bien-être quotidien' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function NotificationSettingsPanel() {
  /* ── State ── */
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testType, setTestType] = useState<string>('');
  const [testing, setTesting] = useState(false);

  /* ── OneSignal Push ── */
  const push = useOneSignal();
  const [pushSubscribing, setPushSubscribing] = useState(false);

  /* ── Fetch prefs ── */
  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch('/api/household/notifications');
      if (res.ok) {
        const data = await res.json();
        setPrefs(data.prefs);
      } else {
        setPrefs(DEFAULT_NOTIFICATION_PREFS);
      }
    } catch {
      setPrefs(DEFAULT_NOTIFICATION_PREFS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  /* ── Save prefs ── */
  const savePrefs = useCallback(async (updates: Partial<NotificationPrefs>) => {
    if (!prefs) return;
    const newPrefs = { ...prefs, ...updates };
    setPrefs(newPrefs);
    setSaving(true);
    try {
      const res = await fetch('/api/household/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefs: updates }),
      });
      if (res.ok) {
        toast.success('Préférences enregistrées');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la sauvegarde');
        setPrefs(prefs); // revert
      }
    } catch {
      toast.error('Erreur de connexion');
      setPrefs(prefs); // revert
    } finally {
      setSaving(false);
    }
  }, [prefs]);

  /* ── Toggle single notification ── */
  const handleToggle = useCallback((category: NotificationCategory, key: string, value: boolean) => {
    if (!prefs) return;
    const categoryPrefs = prefs[category] as Record<string, boolean>;
    const updated = { [key]: value };
    savePrefs({ [category]: { ...categoryPrefs, ...updated } });
  }, [prefs, savePrefs]);

  /* ── Toggle all items in category ── */
  const handleToggleCategory = useCallback((category: NotificationCategory, allOn: boolean) => {
    if (!prefs) return;
    const catConfig = CATEGORIES_CONFIG.find((c) => c.key === category);
    if (!catConfig) return;
    const categoryPrefs = prefs[category] as Record<string, boolean>;
    const updated: Record<string, boolean> = {};
    for (const item of catConfig.items) {
      updated[item.key] = allOn;
    }
    savePrefs({ [category]: { ...categoryPrefs, ...updated } });
  }, [prefs, savePrefs]);

  /* ── Toggle expanded category ── */
  const toggleExpanded = useCallback((key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  /* ── Check if all items in category are on ── */
  const isCategoryAllOn = useCallback((category: NotificationCategory): boolean => {
    if (!prefs) return false;
    const catConfig = CATEGORIES_CONFIG.find((c) => c.key === category);
    if (!catConfig) return false;
    const categoryPrefs = prefs[category] as Record<string, boolean>;
    return catConfig.items.every((item) => categoryPrefs[item.key] === true);
  }, [prefs]);

  /* ── Quiet hours handler ── */
  const handleQuietHoursChange = useCallback((field: 'start' | 'end', value: number) => {
    if (!prefs) return;
    if (value < 0 || value > 23) return;
    savePrefs({ quietHours: { ...prefs.quietHours, [field]: value } });
  }, [prefs, savePrefs]);

  const handleQuietHoursToggle = useCallback((enabled: boolean) => {
    if (!prefs) return;
    savePrefs({ quietHours: { ...prefs.quietHours, enabled } });
  }, [prefs, savePrefs]);

  /* ── Frequency handler ── */
  const handleMaxPerHourChange = useCallback((value: number) => {
    if (!prefs) return;
    const clamped = Math.max(1, Math.min(10, value));
    savePrefs({ maxPerHour: clamped });
  }, [prefs, savePrefs]);

  /* ── Test notification ── */
  const handleTestNotification = useCallback(async () => {
    if (!testType) {
      toast.error('Sélectionnez un type de notification');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch('/api/household/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: testType }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        setShowTestDialog(false);
        setTestType('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors du test');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setTesting(false);
    }
  }, [testType]);

  /* ── Format hour for display ── */
  const formatHour = (h: number) => `${String(h).padStart(2, '0')}:00`;

  /* ── Count enabled notifications ── */
  const enabledCount = prefs
    ? CATEGORIES_CONFIG.reduce((acc, cat) => {
        const catPrefs = prefs[cat.key] as Record<string, boolean>;
        return acc + cat.items.filter((item) => catPrefs[item.key]).length;
      }, 0)
    : 0;

  const totalCount = CATEGORIES_CONFIG.reduce((acc, cat) => acc + cat.items.length, 0);

  /* ── Loading state ── */
  if (loading) {
    return (
      <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center animate-pulse">
              <Bell className="w-4 h-4 text-[var(--accent-primary)]/50" />
            </div>
            <div>
              <div className="h-4 w-48 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-32 bg-white/[0.04] rounded animate-pulse mt-1" />
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-white/[0.03] rounded-xl mb-2 animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!prefs) return null;

  return (
    <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
      <CardContent className="p-6">
        {/* ── Header ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="flex items-center justify-between mb-2"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">
                Notifications vocales
              </h2>
              <p className="text-[10px] text-[#475569]">
                Moteur proactif de notifications
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--accent-primary)]/70 font-mono">
              {enabledCount}/{totalCount}
            </span>
            {saving && <Loader2 className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-spin" />}
          </div>
        </motion.div>

        <p className="text-[10px] text-[#475569] mb-5 ml-[42px] leading-relaxed">
          Configurez quelles notifications vocales sont activées par catégorie.
          Les notifications sont diffusées automatiquement selon vos préférences.
        </p>

        {/* ── Push Notifications (OneSignal) ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.5}
          className="rounded-xl border border-white/[0.06] p-4 mb-5 bg-gradient-to-r from-[var(--accent-primary, #d4a853)]/5 to-transparent"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${push.isSubscribed ? 'bg-emerald-500/15' : 'bg-white/[0.06]'}`}>
                {push.isSubscribed
                  ? <BellRing className="w-4 h-4 text-emerald-400" />
                  : <BellOff className="w-4 h-4 text-[#64748b]" />
                }
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#e2e8f0]">Notifications Push</p>
                  {push.isSubscribed && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/15 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Actif
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#475569]">
                  {push.isSubscribed
                    ? 'Recevez des notifications même hors de l\'application'
                    : 'Activez pour recevoir des alertes sur votre appareil'
                  }
                </p>
              </div>
            </div>
            {push.isInitialized && !push.isSubscribed && (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="sm"
                  onClick={async () => {
                    setPushSubscribing(true);
                    const ok = await push.subscribe();
                    setPushSubscribing(false);
                    if (ok) toast.success('Notifications push activées !');
                    else toast.error('Impossible d\'activer les notifications');
                  }}
                  disabled={pushSubscribing}
                  className="bg-gradient-to-r from-[var(--accent-primary, #d4a853)] to-[var(--accent-primary, #d4a853)]/80 text-[#0a0a12] font-semibold text-xs shadow-[0_0_12px_rgba(212,168,83,0.2)] hover:shadow-[0_0_20px_rgba(212,168,83,0.3)] transition-all duration-300 disabled:opacity-50"
                >
                  {pushSubscribing
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    : <Bell className="w-3.5 h-3.5 mr-1.5" />
                  }
                  Activer
                </Button>
              </motion.div>
            )}
            {push.isSubscribed && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  setPushSubscribing(true);
                  await push.unsubscribe();
                  setPushSubscribing(false);
                  toast.info('Notifications push désactivées');
                }}
                disabled={pushSubscribing}
                className="text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04] text-xs transition-all duration-300"
              >
                Désactiver
              </Button>
            )}
            {!push.isInitialized && (
              <div className="flex items-center gap-1.5 text-[10px] text-[#64748b]">
                <Loader2 className="w-3 h-3 animate-spin" />
                Initialisation...
              </div>
            )}
          </div>
        </motion.div>

        <div className="divider-gold mb-5" />

        {/* ── Category Sections ── */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-luxe pr-1">
          {CATEGORIES_CONFIG.map((cat, idx) => {
            const Icon = cat.icon;
            const isExpanded = expandedCategories.has(cat.key);
            const allOn = isCategoryAllOn(cat.key);
            const catPrefs = prefs[cat.key] as Record<string, boolean>;
            const enabledInCat = cat.items.filter((item) => catPrefs[item.key]).length;

            return (
              <motion.div
                key={cat.key}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={idx + 1}
                className="rounded-xl border border-white/[0.06] overflow-hidden transition-colors duration-300 hover:border-white/[0.12]"
              >
                {/* Category header row */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(cat.key)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[var(--accent-primary)]" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#e2e8f0]">
                        {cat.emoji} {cat.label}
                      </span>
                      <span className="text-[9px] font-mono text-[var(--accent-primary)]/60 bg-[var(--accent-primary)]/5 px-1.5 py-0.5 rounded-full">
                        {enabledInCat}/{cat.items.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#475569] truncate">{cat.description}</p>
                  </div>
                  {/* Category toggle (all on/off) */}
                  <div
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCategory(cat.key, !allOn);
                    }}
                  >
                    <Switch
                      checked={allOn}
                      onCheckedChange={(val) => handleToggleCategory(cat.key, val)}
                      className="data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-white/[0.08]"
                    />
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="w-4 h-4 text-[#475569]" />
                  </motion.div>
                </button>

                {/* Expanded items */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-1">
                        {cat.items.map((item) => {
                          const isEnabled = catPrefs[item.key] === true;
                          return (
                            <div
                              key={item.key}
                              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors duration-200 group"
                            >
                              <div className="flex-1 min-w-0 mr-3">
                                <p className={`text-xs font-medium transition-colors duration-200 ${isEnabled ? 'text-[#e2e8f0]' : 'text-[#475569]'}`}>
                                  {item.label}
                                </p>
                                <p className="text-[10px] text-[#475569] truncate">
                                  {item.description}
                                </p>
                              </div>
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={(val) => handleToggle(cat.key, item.key, val)}
                                className="data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-white/[0.08] shrink-0"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <div className="divider-gold my-5" />

        {/* ── Quiet Hours Section ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={12}
          className="rounded-xl border border-white/[0.06] p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#6366f1]/10 flex items-center justify-center">
                <MoonStar className="w-4 h-4 text-[#6366f1]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#e2e8f0]">Heures de silence</p>
                <p className="text-[10px] text-[#475569]">Aucune notification vocale pendant cette plage</p>
              </div>
            </div>
            <Switch
              checked={prefs.quietHours.enabled}
              onCheckedChange={handleQuietHoursToggle}
              className="data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-white/[0.08]"
            />
          </div>
          {prefs.quietHours.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-4 ml-11"
            >
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider">Début</label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={prefs.quietHours.start}
                  onChange={(e) => handleQuietHoursChange('start', parseInt(e.target.value, 10) || 0)}
                  className="w-16 h-8 text-center text-xs glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] focus:border-[var(--accent-primary)]/40 transition-all duration-300"
                />
                <span className="text-[10px] text-[#475569] font-mono">{formatHour(prefs.quietHours.start)}</span>
              </div>
              <span className="text-[#475569]">→</span>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider">Fin</label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={prefs.quietHours.end}
                  onChange={(e) => handleQuietHoursChange('end', parseInt(e.target.value, 10) || 0)}
                  className="w-16 h-8 text-center text-xs glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] focus:border-[var(--accent-primary)]/40 transition-all duration-300"
                />
                <span className="text-[10px] text-[#475569] font-mono">{formatHour(prefs.quietHours.end)}</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ── Frequency Section ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={13}
          className="rounded-xl border border-white/[0.06] p-4 mt-2"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-[#0ea5e9]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#e2e8f0]">Fréquence</p>
              <p className="text-[10px] text-[#475569]">Limitez le nombre de notifications par heure</p>
            </div>
          </div>
          <div className="flex items-center gap-4 ml-11">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Max / heure</span>
                <span className="text-sm font-semibold text-[var(--accent-primary)] font-mono">{prefs.maxPerHour}</span>
              </div>
              <div className="relative h-1.5 rounded-full bg-white/[0.06]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#0ea5e9]/60 to-[#0ea5e9]"
                  style={{ width: `${((prefs.maxPerHour - 1) / 9) * 100}%` }}
                />
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={prefs.maxPerHour}
                  onChange={(e) => handleMaxPerHourChange(parseInt(e.target.value, 10))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Maximum de notifications par heure"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#0ea5e9] shadow-[0_0_8px_rgba(14,165,233,0.4)] pointer-events-none transition-all duration-100"
                  style={{ left: `calc(${((prefs.maxPerHour - 1) / 9) * 100}% - 6px)` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-[#475569]">1</span>
                <span className="text-[9px] text-[#475569]">10</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[10px] text-[#475569] block">Intervalle min.</span>
              <span className="text-sm font-semibold text-[#e2e8f0] font-mono">{prefs.minIntervalMin} min</span>
            </div>
          </div>
        </motion.div>

        <div className="divider-gold my-5" />

        {/* ── Test Button ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={14}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#f59e0b]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#e2e8f0]">Tester une notification</p>
              <p className="text-[10px] text-[#475569]">Envoyez une notification test dans le journal</p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              onClick={() => setShowTestDialog(true)}
              className="border-[var(--accent-primary)]/25 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 hover:border-[var(--accent-primary)]/40 transition-all duration-300"
            >
              🧪 Tester
            </Button>
          </motion.div>
        </motion.div>
      </CardContent>

      {/* ── Test Notification Dialog ── */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="sm:max-w-lg glass-strong rounded-2xl border-white/[0.08] p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#e2e8f0]">
              🧪 Tester une notification
            </DialogTitle>
            <DialogDescription className="text-[#64748b]">
              Sélectionnez un type de notification pour l&apos;ajouter au journal.
              La notification sera disponible sur la tablette familiale.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto scrollbar-luxe space-y-2 py-2">
            {CATEGORIES_CONFIG.map((cat) => (
              <div key={cat.key}>
                <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5">
                  <span>{cat.emoji}</span> {cat.label}
                </p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {cat.items.map((item) => {
                    const isSelected = testType === item.key;
                    return (
                      <motion.button
                        key={item.key}
                        type="button"
                        onClick={() => setTestType(item.key)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className={`
                          flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all duration-200
                          ${isSelected
                            ? 'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/10'
                            : 'border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]'
                          }
                        `}
                      >
                        <div className={`
                          w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200
                          ${isSelected
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
                            : 'border-white/20'
                          }
                        `}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-[#0a0a12]" />}
                        </div>
                        <span className={`text-[11px] font-medium truncate transition-colors duration-200 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[#94a3b8]'}`}>
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowTestDialog(false)}
              disabled={testing}
              className="text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all duration-300"
            >
              Annuler
            </Button>
            <Button
              onClick={handleTestNotification}
              disabled={testing || !testType}
              className="bg-gradient-gold text-[#0a0a12] font-semibold shadow-[0_0_16px_rgba(212,168,83,0.2)] hover:shadow-[0_0_24px_rgba(212,168,83,0.3)] transition-all duration-400 disabled:opacity-50"
            >
              {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0a0a12]" />}
              Envoyer le test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
