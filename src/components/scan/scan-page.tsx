'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ScanLine,
  MapPin,
  QrCode,
  Send,
  CheckCircle2,
  Loader2,
  Clock,
  MessageSquare,
  Sparkles,
  CloudRain,
  Sun,
  Volume2,
  Thermometer,
  Wind,
  Droplets,
  ChefHat,
  Music,
  Zap,
  Utensils,
  Bed,
  Bath,
  Sofa,
  DoorOpen,
  Lamp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/app-store';
import { playRandomChime } from '@/lib/ambient-sounds';
import { trackEvent } from '@/lib/analytics';
import type { ContextSuggestion, WeatherInfo } from '@/core/conscious-engine';

/* ═══════════════════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════════════════ */

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils, Bed, Bath, Sofa, DoorOpen, Lamp, MapPin,
};

const COLOR_MAP: Record<string, { bg: string; text: string; hex: string }> = {
  gold: { bg: 'bg-[var(--accent-primary)]/15', text: 'text-[var(--accent-primary)]', hex: '#d4a853' },
  copper: { bg: 'bg-[#c77d5a]/15', text: 'text-[#c77d5a]', hex: '#c77d5a' },
  violet: { bg: 'bg-[#8b5cf6]/15', text: 'text-[#8b5cf6]', hex: '#8b5cf6' },
  emerald: { bg: 'bg-[#34d399]/15', text: 'text-[#34d399]', hex: '#34d399' },
  rose: { bg: 'bg-[#fb7185]/15', text: 'text-[#fb7185]', hex: '#fb7185' },
  sky: { bg: 'bg-[#38bdf8]/15', text: 'text-[#38bdf8]', hex: '#38bdf8' },
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  music: Volume2,
  recipe: ChefHat,
  note: MessageSquare,
  none: CheckCircle2,
};

interface ScanResult {
  zone: { id: string; name: string; icon: string; color: string; householdName?: string; interactionCount?: number };
  interaction: { id: string; createdAt: string };
  suggestion: ContextSuggestion;
  weather: WeatherInfo;
  context: { hour: number; weekday: string };
}

interface ZoneQuick {
  id: string;
  name: string;
  icon: string;
  color: string;
  qrCode: string;
}

interface SessionScan {
  id: string;
  zoneName: string;
  scannedAt: string;
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
   WEATHER DISPLAY COMPONENT
   ═══════════════════════════════════════════════════════════════ */

function WeatherDisplay({ weather }: { weather: WeatherInfo }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
    >
      <div className="text-3xl">{weather.icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[#e2e8f0]">{weather.condition}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-[#94a3b8]">
            <Thermometer className="w-3 h-3" /> {weather.temperature}°C
          </span>
          <span className="flex items-center gap-1 text-xs text-[#94a3b8]">
            <Droplets className="w-3 h-3" /> {weather.humidity}%
          </span>
          <span className="flex items-center gap-1 text-xs text-[#94a3b8]">
            <Wind className="w-3 h-3" /> {weather.windSpeed} km/h
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCAN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function ScanPage() {
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [zones, setZones] = useState<ZoneQuick[]>([]);
  const [sessionScans, setSessionScans] = useState<SessionScan[]>([]);
  const [noteContent, setNoteContent] = useState('');
  const [sendingNote, setSendingNote] = useState(false);
  const [zonesLoading, setZonesLoading] = useState(true);
  const { setView } = useAppStore();

  const fetchZones = useCallback(async () => {
    try {
      const res = await fetch('/api/zones');
      if (res.ok) {
        const data = await res.json();
        setZones(Array.isArray(data.zones) ? data.zones : Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    } finally {
      setZonesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleScan = async (qrCode: string) => {
    if (!qrCode.trim()) {
      toast.error('Veuillez entrer ou sélectionner un code QR');
      return;
    }
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: qrCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Code QR non reconnu');
        setScanning(false);
        return;
      }
      setScanResult(data);
      setSessionScans((prev) => [
        {
          id: Date.now().toString(),
          zoneName: data.zone?.name || 'Zone',
          scannedAt: new Date().toISOString(),
        },
        ...prev.slice(0, 19),
      ]);
      setQrInput('');
      toast.success(`Zone "${data.zone?.name}" scannée`);

      // Record last scan time & play ambient sound
      localStorage.setItem('mc-last-scan-time', Date.now().toString());
      playRandomChime();
      // Track scan event in analytics
      trackEvent('scan_zone', { zone: data.zone?.name, hour: new Date().getHours() });
    } catch {
      toast.error('Erreur lors du scan');
    } finally {
      setScanning(false);
    }
  };

  const handleQuickScan = (zone: ZoneQuick) => {
    handleScan(zone.qrCode);
  };

  const handleSendNote = async () => {
    if (!scanResult?.zone?.id || !noteContent.trim()) return;
    setSendingNote(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent.trim(),
          type: 'note',
          zoneId: scanResult.zone.id,
        }),
      });
      if (res.ok) {
        toast.success('Note ajoutée');
        setNoteContent('');
      } else {
        toast.error("Erreur lors de l'envoi");
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSendingNote(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gradient-gold">
          Scanner un QR Code
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Entrez un code QR ou sélectionnez une zone pour interagir
        </p>
      </motion.div>

      {/* ── Scan Input Card ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <Card className="glass rounded-2xl inner-glow border-2 border-dashed border-[var(--accent-primary)]/20 hover:border-[var(--accent-primary)]/35 transition-all duration-500">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <Input
                  placeholder="Entrez le code QR (ex: abc12345-salon)"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan(qrInput)}
                  className="glass bg-white/[0.04] border-white/[0.08] pl-10 text-[#e2e8f0] placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all duration-300 h-11"
                  disabled={scanning}
                />
              </div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={() => handleScan(qrInput)}
                  disabled={scanning || !qrInput.trim()}
                  className="bg-gradient-gold text-[#0a0a12] font-semibold h-11 px-6 shadow-[0_0_20px_var(--accent-primary-glow)] hover:shadow-[0_0_30px_var(--accent-primary-glow)] transition-all duration-400 disabled:opacity-50"
                >
                  {scanning ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0a0a12]" />
                  ) : (
                    <ScanLine className="w-4 h-4 mr-2" />
                  )}
                  Scanner
                </Button>
              </motion.div>
            </div>

            {/* Scanning animation */}
            <AnimatePresence>
              {scanning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-center gap-3 mt-4 py-3 rounded-xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/15">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                      <ScanLine className="w-5 h-5 text-[var(--accent-primary)]" />
                    </motion.div>
                    <span className="text-sm text-[var(--accent-primary)] font-medium">
                      Scan en cours…
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Quick Scan Zones ── */}
      {!scanResult && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <Card className="glass rounded-2xl inner-glow border-white/[0.06]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#c77d5a]/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#c77d5a]" />
                </div>
                <div>
                  <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">Scan rapide</h2>
                  <p className="text-[10px] text-[#475569]">Sélectionnez une zone pour scanner directement</p>
                </div>
              </div>

              {zonesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl bg-white/[0.06]" />
                  ))}
                </div>
              ) : zones.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {zones.map((zone, idx) => {
                    const IconComp = ICON_MAP[zone.icon] || MapPin;
                    const colorCls = COLOR_MAP[zone.color] || COLOR_MAP.gold;
                    return (
                      <motion.button
                        key={zone.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleQuickScan(zone)}
                        disabled={scanning}
                        className={`
                          flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-300
                          border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]
                          hover:shadow-[0_0_16px_${colorCls.hex}15]
                        `}
                      >
                        <IconComp className={`w-5 h-5 ${colorCls.text}`} />
                        <span className="text-xs text-[#94a3b8] truncate w-full text-center">{zone.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-10 h-10 text-[#475569] mx-auto mb-3" />
                  <p className="text-sm text-[#64748b]">Aucune zone disponible</p>
                  <Button
                    variant="ghost"
                    className="mt-3 text-[var(--accent-primary)] hover:text-[var(--accent-primary-light)] hover:bg-[var(--accent-primary)]/10 transition-all duration-300"
                    onClick={() => setView('zones')}
                  >
                    Créer une zone
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Scan Result ── */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <Card className="glass rounded-2xl inner-glow border-[#34d399]/20 overflow-hidden">
              <CardContent className="p-6 space-y-5">
                {/* Result header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                      className="w-10 h-10 rounded-xl bg-[#34d399]/15 flex items-center justify-center"
                      style={{ boxShadow: '0 0 16px rgba(52,211,153,0.15)' }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-[#34d399]" />
                    </motion.div>
                    <div>
                      <h3 className="font-serif font-semibold text-[#e2e8f0]">
                        Zone détectée : {scanResult.zone?.name}
                      </h3>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        Interaction enregistrée · {scanResult.zone?.householdName}
                      </p>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScanResult(null)}
                      className="text-[#64748b] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-300"
                    >
                      Nouveau scan
                    </Button>
                  </motion.div>
                </div>

                <div className="divider-gold" />

                {/* Weather */}
                {scanResult.weather && (
                  <div>
                    <h4 className="text-sm font-serif font-semibold text-[#e2e8f0] flex items-center gap-2 mb-3">
                      <CloudRain className="w-4 h-4 text-[#38bdf8]" />
                      Météo actuelle
                    </h4>
                    <WeatherDisplay weather={scanResult.weather} />
                  </div>
                )}

                {/* Context Suggestion from Conscious Engine */}
                {scanResult.suggestion && (
                  <div>
                    <h4 className="text-sm font-serif font-semibold text-[#e2e8f0] flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                      Suggestion contextuelle
                    </h4>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="p-4 rounded-xl bg-[var(--accent-primary)]/[0.06] border border-[var(--accent-primary)]/15"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/15 flex items-center justify-center">
                          {(() => {
                            const ActionIcon = ACTION_ICONS[scanResult.suggestion.actionType] || CheckCircle2;
                            return <ActionIcon className="w-4 h-4 text-[var(--accent-primary)]" />;
                          })()}
                        </div>
                        <h5 className="font-serif font-semibold text-[#e2e8f0]">
                          {scanResult.suggestion.title}
                        </h5>
                      </div>
                      <p className="text-sm text-[#94a3b8] leading-relaxed ml-[42px]">
                        {scanResult.suggestion.message}
                      </p>
                    </motion.div>
                  </div>
                )}

                <div className="divider-gold" />

                {/* Leave a note */}
                <div>
                  <h4 className="text-sm font-serif font-semibold text-[#e2e8f0] flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-[#8b5cf6]" />
                    Laisser une note
                  </h4>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Écrivez une note pour cette zone…"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={3}
                      disabled={sendingNote}
                      className="glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[#8b5cf6]/30 focus:ring-[#8b5cf6]/15 transition-all duration-300 resize-none rounded-xl"
                    />
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        size="sm"
                        onClick={handleSendNote}
                        disabled={sendingNote || !noteContent.trim()}
                        className="bg-gradient-gold text-[#0a0a12] font-semibold shadow-[0_0_16px_var(--accent-primary-glow)] hover:shadow-[0_0_24px_var(--accent-primary-glow)] transition-all duration-400 disabled:opacity-50"
                      >
                        {sendingNote ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0a0a12]" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Envoyer
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Session Scan History ── */}
      {sessionScans.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <Card className="glass rounded-2xl inner-glow border-white/[0.06]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#8b5cf6]" />
                </div>
                <div>
                  <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">Scans de cette session</h2>
                  <p className="text-[10px] text-[#475569]">{sessionScans.length} scan(s) effectué(s)</p>
                </div>
              </div>
              <ScrollArea className="max-h-48 scrollbar-luxe">
                <div className="space-y-1.5 pr-2">
                  {sessionScans.map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/[0.03] transition-all duration-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#34d399] shrink-0" />
                      <span className="text-sm text-[#94a3b8] flex-1">{scan.zoneName}</span>
                      <span className="text-xs text-[#475569] font-mono">
                        {new Date(scan.scannedAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
