'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Tablet,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Mic,
  RotateCw,
  Copy,
  Check,
  Loader2,
  Monitor,
  Smartphone,
  CloudOff,
  CloudSun,
  Users,
  ShoppingBag,
  MessageCircle,
  ChefHat,
  ShieldCheck,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth-store';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface DisplayConfig {
  layout: string;
  widgets: {
    weather: boolean;
    presence: boolean;
    groceries: boolean;
    messages: boolean;
    recipe: boolean;
  };
  guestMode: {
    enabled: boolean;
    maskPresence: boolean;
    maskMessages: boolean;
  };
  voiceEnabled: boolean;
  autoRotate: boolean;
}

interface DisplaySettings {
  displayEnabled: boolean;
  displayToken: string | null;
  displayConfig: DisplayConfig;
}

const DEFAULT_CONFIG: DisplayConfig = {
  layout: 'grid',
  widgets: {
    weather: true,
    presence: true,
    groceries: true,
    messages: true,
    recipe: true,
  },
  guestMode: {
    enabled: true,
    maskPresence: true,
    maskMessages: false,
  },
  voiceEnabled: true,
  autoRotate: true,
};

/* ═══════════════════════════════════════════════════════
   WIDGET DEFINITIONS
   ═══════════════════════════════════════════════════════ */

const WIDGETS = [
  { key: 'weather' as const, label: 'Météo', description: 'Conditions météo en temps réel', icon: CloudSun },
  { key: 'presence' as const, label: 'Présence', description: 'Nombre de personnes actives', icon: Users },
  { key: 'groceries' as const, label: 'Courses', description: 'Liste de courses partagée', icon: ShoppingBag },
  { key: 'messages' as const, label: 'Messages', description: 'Messages publics du foyer', icon: MessageCircle },
  { key: 'recipe' as const, label: 'Recette du jour', description: 'Recette suggérée', icon: ChefHat },
] as const;

/* ═══════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════ */

function SectionHeader({
  icon: Icon,
  title,
  description,
  color = 'text-[var(--accent-primary)]',
  bgColor = 'bg-[var(--accent-primary)]/10',
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color?: string;
  bgColor?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">{title}</h2>
        <p className="text-[10px] text-[#475569]">{description}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DISPLAY SETTINGS PANEL
   ═══════════════════════════════════════════════════════ */

export function DisplaySettingsPanel() {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner' || user?.role === 'superadmin';

  const [settings, setSettings] = useState<DisplaySettings>({
    displayEnabled: false,
    displayToken: null,
    displayConfig: DEFAULT_CONFIG,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ── Fetch display settings ── */
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/household/display');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSettings({
            displayEnabled: json.displayEnabled ?? false,
            displayToken: json.displayToken ?? null,
            displayConfig: {
              ...DEFAULT_CONFIG,
              ...(json.displayConfig || {}),
              widgets: {
                ...DEFAULT_CONFIG.widgets,
                ...(json.displayConfig?.widgets || {}),
              },
              guestMode: {
                ...DEFAULT_CONFIG.guestMode,
                ...(json.displayConfig?.guestMode || {}),
              },
            },
          });
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOwner) fetchSettings();
    else setLoading(false);
  }, [isOwner, fetchSettings]);

  /* ── Handle enable/disable toggle ── */
  const handleToggleEnabled = (enabled: boolean) => {
    if (enabled && !settings.displayToken) {
      // Generate token client-side preview (server will also generate)
      const previewToken = crypto.randomUUID();
      setSettings((prev) => ({
        ...prev,
        displayEnabled: enabled,
        displayToken: previewToken,
      }));
    } else {
      setSettings((prev) => ({ ...prev, displayEnabled: enabled }));
    }
  };

  /* ── Widget toggle ── */
  const handleWidgetToggle = (widgetKey: keyof DisplayConfig['widgets']) => {
    setSettings((prev) => ({
      ...prev,
      displayConfig: {
        ...prev.displayConfig,
        widgets: {
          ...prev.displayConfig.widgets,
          [widgetKey]: !prev.displayConfig.widgets[widgetKey],
        },
      },
    }));
  };

  /* ── Guest mode toggle ── */
  const handleGuestModeToggle = (enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      displayConfig: {
        ...prev.displayConfig,
        guestMode: {
          ...prev.displayConfig.guestMode,
          enabled,
        },
      },
    }));
  };

  /* ── Voice toggle ── */
  const handleVoiceToggle = (enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      displayConfig: {
        ...prev.displayConfig,
        voiceEnabled: enabled,
      },
    }));
  };

  /* ── Auto-rotate toggle ── */
  const handleAutoRotateToggle = (enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      displayConfig: {
        ...prev.displayConfig,
        autoRotate: enabled,
      },
    }));
  };

  /* ── Copy URL ── */
  const handleCopyUrl = async () => {
    if (!settings.displayToken) return;
    const url = `${window.location.origin}/display/${settings.displayToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('URL copiée dans le presse-papier');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Impossible de copier l\'URL');
    }
  };

  /* ── Save ── */
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/household/display', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayEnabled: settings.displayEnabled,
          displayConfig: settings.displayConfig,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Erreur lors de la sauvegarde');
        return;
      }

      toast.success('Paramètres d\'affichage enregistrés');

      // Re-fetch to get the server-generated token if this was a first enable
      if (settings.displayEnabled) {
        await fetchSettings();
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  /* ── Display URL ── */
  const displayUrl = settings.displayToken
    ? `${window.location.origin}/display/${settings.displayToken}`
    : null;

  const activeWidgetCount = Object.values(settings.displayConfig.widgets).filter(Boolean).length;

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  /* ── Non-owner: info banner ── */
  if (!isOwner) {
    return (
      <div className="glass rounded-2xl p-6 inner-glow text-center">
        <div className="p-3 bg-white/[0.05] rounded-full w-fit mx-auto mb-3">
          <Tablet className="w-6 h-6 text-[#475569]" />
        </div>
        <p className="text-sm text-[#64748b]">
          Les paramètres d&apos;affichage sont réservés au propriétaire du foyer
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════
         ACTIVATION SECTION
         ═══════════════════════════════════════════════════ */}
      <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
        <CardContent className="p-6">
          <SectionHeader
            icon={Tablet}
            title="Tablette d'affichage"
            description="Affichage déporté pour les zones communes"
          />

          {/* Activation toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/[0.06] mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-400"
                style={{
                  backgroundColor: settings.displayEnabled
                    ? 'rgba(var(--accent-primary-rgb, 212, 168, 83), 0.12)'
                    : 'rgba(255, 255, 255, 0.04)',
                }}
              >
                {settings.displayEnabled ? (
                  <Wifi className="w-5 h-5 text-[var(--accent-primary)]" />
                ) : (
                  <WifiOff className="w-5 h-5 text-[#475569]" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[#e2e8f0]">
                  Affichage déporté
                </p>
                <p className="text-[10px] text-[#475569]">
                  {settings.displayEnabled
                    ? `${activeWidgetCount} widget${activeWidgetCount !== 1 ? 's' : ''} actif${activeWidgetCount !== 1 ? 's' : ''}`
                    : 'Désactivé — les invités ne voient rien'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={settings.displayEnabled}
              onCheckedChange={handleToggleEnabled}
              className="data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-white/[0.08]"
            />
          </div>

          {/* URL display when enabled */}
          <AnimatePresence mode="wait">
            {settings.displayEnabled && displayUrl && (
              <motion.div
                key="url-display"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              >
                <div className="glass-gold rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span className="text-[10px] text-[var(--accent-primary)]/70 uppercase tracking-wider font-semibold">
                      URL de l&apos;affichage
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-black/30 rounded-lg px-3 py-2.5 border border-white/[0.06] overflow-hidden">
                      <p className="text-xs text-[#94a3b8] font-mono truncate select-all">
                        {displayUrl}
                      </p>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleCopyUrl}
                        size="sm"
                        variant="outline"
                        className={`h-9 px-3 rounded-lg border transition-all duration-300 shrink-0 ${
                          copied
                            ? 'border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]'
                            : 'border-[var(--accent-primary)]/25 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 hover:border-[var(--accent-primary)]/40'
                        }`}
                      >
                        {copied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                  <p className="text-[10px] text-[#475569] mt-2 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Cette URL est publique — protégez-la ou utilisez le mode invité
                  </p>
                </div>

                {/* Device preview */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-black/20 border border-white/[0.04]">
                  <div className="flex gap-1.5">
                    {[Monitor, Smartphone, Tablet].map((DeviceIcon, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/8 border border-[var(--accent-primary)]/12 flex items-center justify-center"
                      >
                        <DeviceIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]/50" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] text-[#94a3b8] font-medium">Compatible tout écran</p>
                    <p className="text-[10px] text-[#475569]">Tablette, téléphone, ou écran mural</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════
         WIDGET CONFIGURATION
         ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {settings.displayEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
              <CardContent className="p-6">
                <SectionHeader
                  icon={Monitor}
                  title="Widgets"
                  description="Choisissez les informations affichées sur la tablette"
                />

                <div className="space-y-1">
                  {WIDGETS.map((widget, index) => {
                    const Icon = widget.icon;
                    const isActive = settings.displayConfig.widgets[widget.key];
                    return (
                      <motion.div
                        key={widget.key}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.06, duration: 0.3 }}
                        className="flex items-center justify-between py-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              isActive
                                ? 'bg-[var(--accent-primary)]/12'
                                : 'bg-white/[0.04] group-hover:bg-white/[0.06]'
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 transition-colors duration-300 ${
                                isActive
                                  ? 'text-[var(--accent-primary)]'
                                  : 'text-[#475569] group-hover:text-[#64748b]'
                              }`}
                            />
                          </div>
                          <div>
                            <span className="text-sm text-[#e2e8f0]">{widget.label}</span>
                            <p className="text-[10px] text-[#475569]">{widget.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => handleWidgetToggle(widget.key)}
                          className="data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-white/[0.08]"
                        />
                      </motion.div>
                    );
                  })}
                </div>

                {/* Widget count badge */}
                <div className="mt-4 flex items-center justify-center">
                  <Badge className="bg-white/[0.04] text-[#64748b] border-0 text-[10px] px-3 py-1 rounded-full">
                    {activeWidgetCount} / {WIDGETS.length} widgets actifs
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════
         GUEST MODE CONFIGURATION
         ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {settings.displayEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
              <CardContent className="p-6">
                <SectionHeader
                  icon={settings.displayConfig.guestMode.enabled ? Eye : EyeOff}
                  title="Mode invité"
                  description="Contrôlez la visibilité des données sensibles"
                  color={settings.displayConfig.guestMode.enabled ? 'text-[#0ea5e9]' : 'text-[#475569]'}
                  bgColor={settings.displayConfig.guestMode.enabled ? 'bg-[#0ea5e9]/10' : 'bg-white/[0.04]'}
                />

                {/* Guest mode toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/[0.06] mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        settings.displayConfig.guestMode.enabled
                          ? 'bg-[#0ea5e9]/10'
                          : 'bg-white/[0.04]'
                      }`}
                    >
                      {settings.displayConfig.guestMode.enabled ? (
                        <Eye className="w-4 h-4 text-[#0ea5e9]" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-[#475569]" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-[#e2e8f0]">Mode invité</span>
                      <p className="text-[10px] text-[#475569]">
                        Masquer les données sensibles pour les visiteurs
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.displayConfig.guestMode.enabled}
                    onCheckedChange={handleGuestModeToggle}
                    className="data-[state=checked]:bg-[#0ea5e9] data-[state=unchecked]:bg-white/[0.08]"
                  />
                </div>

                {/* Sub-options */}
                <AnimatePresence>
                  {settings.displayConfig.guestMode.enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-4 pl-4 border-l-2 border-[#0ea5e9]/20 space-y-1"
                    >
                      {/* Mask presence */}
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0ea5e9]/8 flex items-center justify-center">
                            <CloudOff className="w-3.5 h-3.5 text-[#0ea5e9]/70" />
                          </div>
                          <div>
                            <span className="text-sm text-[#e2e8f0]">Masquer la présence</span>
                            <p className="text-[10px] text-[#475569]">Ne pas afficher le nombre de personnes actives</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.displayConfig.guestMode.maskPresence}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              displayConfig: {
                                ...prev.displayConfig,
                                guestMode: {
                                  ...prev.displayConfig.guestMode,
                                  maskPresence: checked,
                                },
                              },
                            }))
                          }
                          className="data-[state=checked]:bg-[#0ea5e9] data-[state=unchecked]:bg-white/[0.08]"
                        />
                      </div>

                      {/* Mask messages */}
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0ea5e9]/8 flex items-center justify-center">
                            <MessageCircle className="w-3.5 h-3.5 text-[#0ea5e9]/70" />
                          </div>
                          <div>
                            <span className="text-sm text-[#e2e8f0]">Masquer les messages</span>
                            <p className="text-[10px] text-[#475569]">Ne pas afficher les messages du foyer</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.displayConfig.guestMode.maskMessages}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              displayConfig: {
                                ...prev.displayConfig,
                                guestMode: {
                                  ...prev.displayConfig.guestMode,
                                  maskMessages: checked,
                                },
                              },
                            }))
                          }
                          className="data-[state=checked]:bg-[#0ea5e9] data-[state=unchecked]:bg-white/[0.08]"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════
         OPTIONS
         ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {settings.displayEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
              <CardContent className="p-6">
                <SectionHeader
                  icon={Tablet}
                  title="Options"
                  description="Fonctionnalités avancées de la tablette"
                />

                <div className="space-y-1">
                  {/* Voice commands */}
                  <div className="flex items-center justify-between py-3 group">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          settings.displayConfig.voiceEnabled
                            ? 'bg-[var(--accent-primary)]/12'
                            : 'bg-white/[0.04] group-hover:bg-white/[0.06]'
                        }`}
                      >
                        <Mic
                          className={`w-4 h-4 transition-colors duration-300 ${
                            settings.displayConfig.voiceEnabled
                              ? 'text-[var(--accent-primary)]'
                              : 'text-[#475569] group-hover:text-[#64748b]'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-sm text-[#e2e8f0]">Commandes vocales</span>
                        <p className="text-[10px] text-[#475569]">Activer le microphone pour les commandes vocales</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.displayConfig.voiceEnabled}
                      onCheckedChange={handleVoiceToggle}
                      className="data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-white/[0.08]"
                    />
                  </div>

                  <div className="divider-gold my-1" />

                  {/* Auto-rotate */}
                  <div className="flex items-center justify-between py-3 group">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          settings.displayConfig.autoRotate
                            ? 'bg-[var(--accent-primary)]/12'
                            : 'bg-white/[0.04] group-hover:bg-white/[0.06]'
                        }`}
                      >
                        <RotateCw
                          className={`w-4 h-4 transition-colors duration-300 ${
                            settings.displayConfig.autoRotate
                              ? 'text-[var(--accent-primary)]'
                              : 'text-[#475569] group-hover:text-[#64748b]'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-sm text-[#e2e8f0]">Rotation automatique</span>
                        <p className="text-[10px] text-[#475569]">Rotation des widgets et du contenu affiché</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.displayConfig.autoRotate}
                      onCheckedChange={handleAutoRotateToggle}
                      className="data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-white/[0.08]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════
         SAVE BUTTON
         ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {settings.displayEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                onClick={handleSave}
                disabled={saving || !settings.displayEnabled}
                className="w-full bg-gradient-gold text-[#0a0a12] font-semibold shadow-[0_0_16px_rgba(212,168,83,0.2)] hover:shadow-[0_0_24px_rgba(212,168,83,0.3)] transition-all duration-400 disabled:opacity-50 h-12 text-sm rounded-xl"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0a0a12]" />
                    Enregistrement en cours…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2 text-[#0a0a12]" />
                    Enregistrer la configuration
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
