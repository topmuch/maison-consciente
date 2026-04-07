'use client';

/* ═══════════════════════════════════════════════════════
   HospitalityExtendedPanel — Extended Hospitality Settings

   Configuration panel for hospitality features:
   - WhatsApp Number input
   - Module Toggles (Room Service, Activities, Wellness)
   - Check-in/Check-out Alert toggles
   - Calendar Events display

   Uses shadcn/ui: Switch, Input, Button, Badge, Separator, Label.
   GlassCard + Dark Luxe amber/gold styling. All labels in French.
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hotel,
  Phone,
  UtensilsCrossed,
  Map,
  HeartPulse,
  CalendarDays,
  Bell,
  BellOff,
  LogIn,
  LogOut,
  Loader2,
  Check,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

import { GlassCard } from '@/components/shared/glass-card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

/* ── Types ── */

interface HospitalityExtendedData {
  whatsappNumber: string;
  modules: {
    roomService: boolean;
    activitiesGuide: boolean;
    wellnessModule: boolean;
  };
  alerts: {
    checkIn: boolean;
    checkOut: boolean;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  type: 'check-in' | 'check-out' | 'reminder';
  date: string;
  guestName?: string;
}

const DEFAULT_HOSPITALITY: HospitalityExtendedData = {
  whatsappNumber: '',
  modules: {
    roomService: false,
    activitiesGuide: false,
    wellnessModule: false,
  },
  alerts: {
    checkIn: true,
    checkOut: true,
  },
};

const MODULE_CONFIG = [
  { key: 'roomService' as const, name: 'Room Service', icon: UtensilsCrossed, color: 'text-amber-400' },
  { key: 'activitiesGuide' as const, name: 'Guide d\'activités', icon: Map, color: 'text-emerald-400' },
  { key: 'wellnessModule' as const, name: 'Module Bien-être', icon: HeartPulse, color: 'text-rose-400' },
] as const;

const EVENT_TYPE_CONFIG: Record<string, { icon: typeof LogIn; color: string; bg: string }> = {
  'check-in': { icon: LogIn, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'check-out': { icon: LogOut, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  'reminder': { icon: Bell, color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

/* ── Main Component ── */

export function HospitalityExtendedPanel() {
  const [settings, setSettings] = useState<HospitalityExtendedData>(DEFAULT_HOSPITALITY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // ── Fetch settings ──
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/household/settings');
        if (res.ok) {
          const data = await res.json();
          const hs = data.hospitality as Partial<HospitalityExtendedData> | undefined;
          if (hs) {
            setSettings(prev => ({
              whatsappNumber: hs.whatsappNumber ?? prev.whatsappNumber,
              modules: {
                roomService: hs.modules?.roomService ?? prev.modules.roomService,
                activitiesGuide: hs.modules?.activitiesGuide ?? prev.modules.activitiesGuide,
                wellnessModule: hs.modules?.wellnessModule ?? prev.modules.wellnessModule,
              },
              alerts: {
                checkIn: hs.alerts?.checkIn ?? prev.alerts.checkIn,
                checkOut: hs.alerts?.checkOut ?? prev.alerts.checkOut,
              },
            }));
          }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // ── Fetch calendar events ──
  useEffect(() => {
    if (loading) return;
    async function fetchEvents() {
      setLoadingEvents(true);
      try {
        const res = await fetch('/api/household/events?limit=5');
        if (res.ok) {
          const data = await res.json();
          setEvents(Array.isArray(data.events) ? data.events : []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoadingEvents(false);
      }
    }
    fetchEvents();
  }, [loading]);

  // ── Save settings ──
  const saveSettings = useCallback(async (newSettings: HospitalityExtendedData) => {
    setSaving(true);
    try {
      const res = await fetch('/api/household/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitality: newSettings }),
      });
      if (res.ok) {
        toast.success('Paramètres d\'hébergement sauvegardés');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Handlers ──
  const handleWhatsAppChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Validate format: starts with + and digits
    if (value === '' || /^\+\d{6,15}$/.test(value)) {
      const updated = { ...settings, whatsappNumber: value };
      setSettings(updated);
    } else if (/^\+?\d*$/.test(value)) {
      // Allow typing
      setSettings(prev => ({ ...prev, whatsappNumber: value }));
    }
  }, [settings]);

  const handleWhatsAppBlur = useCallback(() => {
    const { whatsappNumber } = settings;
    // Save on blur if valid
    if (whatsappNumber === '' || /^\+\d{6,15}$/.test(whatsappNumber)) {
      saveSettings(settings);
    } else if (whatsappNumber) {
      toast.error('Format invalide : utilisez +33XXXXXXXXX');
      setSettings(prev => ({ ...prev, whatsappNumber: '' }));
    }
  }, [settings, saveSettings]);

  const handleModuleToggle = useCallback((key: keyof HospitalityExtendedData['modules'], enabled: boolean) => {
    const updated = {
      ...settings,
      modules: { ...settings.modules, [key]: enabled },
    };
    setSettings(updated);
    saveSettings(updated);
  }, [settings, saveSettings]);

  const handleAlertToggle = useCallback((key: keyof HospitalityExtendedData['alerts'], enabled: boolean) => {
    const updated = {
      ...settings,
      alerts: { ...settings.alerts, [key]: enabled },
    };
    setSettings(updated);
    saveSettings(updated);
  }, [settings, saveSettings]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-48 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="h-10 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.06] animate-pulse" />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  // ── Format date helper ──
  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <GlassCard className="p-6 border border-white/[0.06]">
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
          <Hotel className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">Hébergement — Avancé</h2>
          <p className="text-[10px] text-[#475569]">WhatsApp, modules et alertes invités</p>
        </div>
        {saving && (
          <Badge className="ml-auto bg-amber-400/10 text-amber-400 border-0 text-[10px] px-2 py-0.5">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Sauvegarde…
          </Badge>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
         1. WHATSAPP NUMBER
         ═══════════════════════════════════════════════════ */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Phone className="w-3.5 h-3.5 text-[#64748b]" />
          <Label className="text-xs font-medium text-[#94a3b8]">Numéro WhatsApp de l&apos;hôte</Label>
        </div>
        <Input
          type="tel"
          value={settings.whatsappNumber}
          onChange={handleWhatsAppChange}
          onBlur={handleWhatsAppBlur}
          placeholder="+33XXXXXXXXX"
          disabled={saving}
          className="
            bg-white/[0.04] border-white/[0.08] text-[#e2e8f0]
            placeholder:text-[#475569]
            focus:border-amber-400/40 focus:ring-amber-400/20
            h-10 rounded-xl transition-all duration-300
          "
        />
        <p className="text-[10px] text-[#475569] mt-1.5 ml-1">
          Format international : +33 suivi du numéro à 9 chiffres
        </p>
      </div>

      <Separator className="bg-white/[0.06] mb-5" />

      {/* ═══════════════════════════════════════════════════
         2. MODULES TOGGLES
         ═══════════════════════════════════════════════════ */}
      <div className="mb-5">
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Hotel className="w-3.5 h-3.5" />
          Modules disponibles
        </p>
        <div className="space-y-2">
          {MODULE_CONFIG.map((mod) => {
            const isEnabled = settings.modules[mod.key];
            const Icon = mod.icon;
            return (
              <div
                key={mod.key}
                className={`
                  flex items-center justify-between p-3 rounded-xl
                  border transition-all duration-300
                  ${isEnabled
                    ? 'border-amber-400/20 bg-amber-400/[0.04]'
                    : 'border-white/[0.04]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300
                    ${isEnabled
                      ? 'bg-white/[0.06]'
                      : 'bg-white/[0.03]'
                    }
                  `}>
                    <Icon className={`w-4 h-4 transition-colors duration-300 ${
                      isEnabled ? mod.color : 'text-[#475569]'
                    }`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isEnabled ? 'text-[#e2e8f0]' : 'text-[#64748b]'
                    }`}>
                      {mod.name}
                    </p>
                    <Badge className={`
                      border-0 text-[9px] font-semibold px-2 py-0.5 rounded-full mt-0.5
                      ${isEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-[#475569]'}
                    `}>
                      {isEnabled ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleModuleToggle(mod.key, checked)}
                  className="data-[state=checked]:bg-amber-400 data-[state=unchecked]:bg-white/[0.08]"
                />
              </div>
            );
          })}
        </div>
      </div>

      <Separator className="bg-white/[0.06] mb-5" />

      {/* ═══════════════════════════════════════════════════
         3. CHECK-IN / CHECK-OUT ALERTS
         ═══════════════════════════════════════════════════ */}
      <div className="mb-5">
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Bell className="w-3.5 h-3.5" />
          Alertes d&apos;arrivée / départ
        </p>
        <div className="space-y-2">
          {/* Check-in alert */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <LogIn className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#e2e8f0]">Alerte d&apos;arrivée</p>
                <p className="text-[10px] text-[#475569]">Notification lors du check-in invité</p>
              </div>
            </div>
            <Switch
              checked={settings.alerts.checkIn}
              onCheckedChange={(checked) => handleAlertToggle('checkIn', checked)}
              className="data-[state=checked]:bg-emerald-400 data-[state=unchecked]:bg-white/[0.08]"
            />
          </div>

          {/* Check-out alert */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#e2e8f0]">Alerte de départ</p>
                <p className="text-[10px] text-[#475569]">Notification lors du check-out invité</p>
              </div>
            </div>
            <Switch
              checked={settings.alerts.checkOut}
              onCheckedChange={(checked) => handleAlertToggle('checkOut', checked)}
              className="data-[state=checked]:bg-amber-400 data-[state=unchecked]:bg-white/[0.08]"
            />
          </div>
        </div>

        <AnimatePresence>
          {!settings.alerts.checkIn && !settings.alerts.checkOut && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[10px] text-[#475569] mt-2 ml-1 leading-relaxed flex items-center gap-1.5"
            >
              <BellOff className="w-3 h-3" />
              Les alertes sont désactivées — vous ne recevrez pas de notifications
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <Separator className="bg-white/[0.06] mb-5" />

      {/* ═══════════════════════════════════════════════════
         4. CALENDAR EVENTS
         ═══════════════════════════════════════════════════ */}
      <div>
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-3 flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5" />
          Prochains événements
        </p>

        {loadingEvents ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {events.map((event) => {
              const config = EVENT_TYPE_CONFIG[event.type] ?? EVENT_TYPE_CONFIG.reminder;
              const EventIcon = config.icon;
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.04] hover:bg-white/[0.02] transition-all duration-200"
                >
                  <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center`}>
                    <EventIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e2e8f0] truncate">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-[#475569]" />
                      <span className="text-[10px] text-[#475569]">
                        {formatDate(event.date)}
                      </span>
                      {event.guestName && (
                        <>
                          <span className="text-[10px] text-[#475569]">·</span>
                          <span className="text-[10px] text-[#64748b]">{event.guestName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge className={`
                    border-0 text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0
                    ${config.bg} ${config.color}
                  `}>
                    {event.type === 'check-in' ? 'Arrivée' : event.type === 'check-out' ? 'Départ' : 'Rappel'}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-gold rounded-xl p-6 text-center">
            <CalendarDays className="w-8 h-8 text-amber-400/30 mx-auto mb-2" />
            <p className="text-sm text-[#64748b]">Aucun événement à venir</p>
            <p className="text-[10px] text-[#475569] mt-1">
              Les check-in et check-out apparaîtront ici automatiquement
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
