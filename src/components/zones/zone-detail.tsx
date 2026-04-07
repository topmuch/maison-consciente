'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  QrCode,
  Printer,
  Download,
  Pencil,
  Trash2,
  MapPin,
  Clock,
  Sparkles,
  AlertTriangle,
  Utensils,
  Bed,
  Bath,
  Sofa,
  DoorOpen,
  Lamp,
  Loader2,
  Shield,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';

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

interface ZoneData {
  id: string;
  name: string;
  icon: string;
  color: string;
  qrCode: string;
  interactionCount?: number;
}

interface Suggestion {
  id?: string;
  type: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

const PRIORITY_COLORS = {
  high: { border: 'border-l-[#fb7185]', bg: 'bg-[#fb7185]/5', label: 'Haute', labelColor: 'text-[#fb7185]' },
  medium: { border: 'border-l-[#f59e0b]', bg: 'bg-[#f59e0b]/5', label: 'Moyenne', labelColor: 'text-[#f59e0b]' },
  low: { border: 'border-l-[#34d399]', bg: 'bg-[#34d399]/5', label: 'Basse', labelColor: 'text-[#34d399]' },
};

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return date.toLocaleDateString('fr-FR');
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
   ZONE DETAIL COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function ZoneDetail() {
  const { selectedZoneId, setView } = useAppStore();
  const { user } = useAuthStore();
  const [zone, setZone] = useState<ZoneData | null>(null);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!selectedZoneId) return;
    setLoading(true);
    try {
      const [zoneRes, qrRes, sugRes] = await Promise.all([
        fetch(`/api/zones/${selectedZoneId}`),
        fetch(`/api/qrcode?zoneId=${selectedZoneId}`),
        fetch(`/api/suggestions?zoneId=${selectedZoneId}`),
      ]);

      if (zoneRes.ok) {
        const data = await zoneRes.json();
        const z = data.zone || data;
        setZone({
          ...z,
          interactionCount: z.interactionCount ?? z._count?.interactions ?? 0,
        });
      }
      if (qrRes.ok) {
        const data = await qrRes.json();
        setQrSvg(data.svg || '');
      }
      if (sugRes.ok) {
        const data = await sugRes.json();
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [selectedZoneId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!selectedZoneId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/zones/${selectedZoneId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Zone supprimée');
        setView('zones');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const escapedName = (zone?.name || 'Zone')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const sanitizedQr = qrSvg.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '');
    printWindow.document.write(`
      <html>
        <head><title>QR Code — ${escapedName}</title></head>
        <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:Georgia,serif;background:#0a0a12;color:#e2e8f0;">
          <div style="text-align:center;">
            <h1 style="margin-bottom:16px;font-size:24px;color:var(--accent-primary);">${escapedName}</h1>
            <div style="background:white;padding:24px;border-radius:16px;display:inline-block;margin-bottom:16px;">${sanitizedQr}</div>
            <p style="color:#64748b;font-size:14px;font-family:monospace;">Code: ${zone?.qrCode || ''}</p>
            <p style="color:#475569;font-size:12px;margin-top:8px;">Maison Consciente</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    if (!qrSvg) return;
    const svgBlob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcode-${zone?.name || 'zone'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('QR code téléchargé');
  };

  /* ── No zone selected ── */
  if (!selectedZoneId) {
    return (
      <div className="text-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <MapPin className="w-14 h-14 text-[#64748b] mx-auto mb-4" />
          <p className="text-[#64748b] font-serif text-lg">Aucune zone sélectionnée</p>
          <Button
            variant="ghost"
            className="mt-4 text-[var(--accent-primary)] hover:text-[var(--accent-primary-light)] hover:bg-[var(--accent-primary)]/10 transition-all duration-300"
            onClick={() => setView('zones')}
          >
            Voir les zones
          </Button>
        </motion.div>
      </div>
    );
  }

  const IconComp = zone ? (ICON_MAP[zone.icon] || MapPin) : MapPin;
  const colorClasses = zone ? (COLOR_MAP[zone.color] || COLOR_MAP.gold) : COLOR_MAP.gold;

  /* ═══════════════════════════════════════════════════════════════
     LOADING SKELETON
     ═══════════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl bg-white/[0.06]" />
          <Skeleton className="h-8 w-48 bg-white/[0.06]" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 inner-glow">
            <Skeleton className="h-48 w-48 rounded-xl mx-auto bg-white/[0.06]" />
            <Skeleton className="h-4 w-32 mx-auto mt-4 bg-white/[0.06]" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-2xl bg-white/[0.06]" />
            <Skeleton className="h-40 w-full rounded-2xl bg-white/[0.06]" />
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView('zones')}
              className="text-[#64748b] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-300 rounded-xl h-10 w-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </motion.div>
          <div className={`w-14 h-14 rounded-2xl ${colorClasses.bg} flex items-center justify-center`} style={{ boxShadow: `0 0 20px ${colorClasses.hex}20` }}>
            <IconComp className={`w-7 h-7 ${colorClasses.text}`} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#e2e8f0]">
              {zone?.name || 'Zone'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-[#475569] font-mono">{zone?.qrCode}</p>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorClasses.hex }} />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#64748b] hover:text-[#f87171] hover:bg-[#f87171]/[0.06] transition-all duration-300"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Supprimer
                </Button>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      {/* ── Main Content Grid ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* ── QR Code Card ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
            <CardContent className="p-6">
              {/* Section header */}
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-[var(--accent-primary)]" />
                </div>
                <div>
                  <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">QR Code</h2>
                  <p className="text-[10px] text-[#475569]">Imprimez et placez dans la zone</p>
                </div>
              </div>

              {/* QR Code display */}
              <div className="flex flex-col items-center py-4">
                {qrSvg ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="bg-white p-5 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_0_30px_var(--accent-primary-glow)]"
                  >
                    <div className="w-48 h-48 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: qrSvg.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+=/gi, 'data-blocked=') }} />
                  </motion.div>
                ) : (
                  <Skeleton className="h-48 w-48 rounded-2xl bg-white/[0.06]" />
                )}
                <p className="text-sm font-mono text-[#475569] mt-4">{zone?.qrCode}</p>

                {/* Action buttons */}
                <div className="flex gap-3 mt-5">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="border-[var(--accent-primary)]/25 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 hover:border-[var(--accent-primary)]/40 hover:shadow-[0_0_12px_var(--accent-primary-glow)] transition-all duration-300"
                    >
                      <Printer className="w-4 h-4 mr-1.5" />
                      Imprimer
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="border-white/[0.1] text-[#94a3b8] hover:bg-white/[0.04] hover:text-[#e2e8f0] transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      Télécharger
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Right Column ── */}
        <div className="space-y-6">
          {/* ── Stats Card ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <Card className="glass rounded-2xl inner-glow border-white/[0.06]">
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-gold rounded-xl p-4 text-center">
                    <QrCode className="w-5 h-5 text-[var(--accent-primary)] mx-auto mb-2" />
                    <p className="text-2xl font-serif font-bold text-gradient-gold">
                      {zone?.interactionCount || 0}
                    </p>
                    <p className="text-[10px] text-[#64748b] uppercase tracking-wider mt-0.5">
                      Interactions
                    </p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <Clock className="w-5 h-5 text-[#c77d5a] mx-auto mb-2" />
                    <p className="text-lg font-serif font-semibold text-[#c77d5a]">
                      {zone?.createdAt ? relativeTime(zone.createdAt) : '—'}
                    </p>
                    <p className="text-[10px] text-[#64748b] uppercase tracking-wider mt-0.5">
                      Création
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Suggestions Card ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
              <CardContent className="p-5">
                {/* Section header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">Suggestions</h2>
                    <p className="text-[10px] text-[#475569]">Conseils personnalisés pour cette zone</p>
                  </div>
                </div>

                {suggestions.length > 0 ? (
                  <ScrollArea className="max-h-72 scrollbar-luxe">
                    <div className="space-y-2.5 pr-2">
                      {suggestions.map((sug, idx) => {
                        const prio = PRIORITY_COLORS[sug.priority] || PRIORITY_COLORS.low;
                        return (
                          <motion.div
                            key={sug.id || idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + idx * 0.05, duration: 0.3 }}
                            className={`p-3.5 rounded-xl border-l-[3px] ${prio.border} ${prio.bg} hover:bg-white/[0.04] transition-all duration-300`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-medium text-[#e2e8f0]">{sug.title}</p>
                              <Badge className={`${prio.bg} ${prio.labelColor} border-0 text-[9px] font-semibold px-1.5 py-0 rounded-full shrink-0`}>
                                {prio.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#94a3b8] leading-relaxed">{sug.content}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <Info className="w-8 h-8 text-[#475569] mx-auto mb-2" />
                    <p className="text-sm text-[#475569]">
                      Aucune suggestion pour le moment
                    </p>
                    <p className="text-xs text-[#334155] mt-1">
                      Scannez cette zone pour générer des suggestions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         DELETE CONFIRMATION DIALOG
         ═══════════════════════════════════════════════════════════ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="glass-strong rounded-2xl border-white/[0.08] p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg text-[#e2e8f0] flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#f87171]" />
              Supprimer la zone
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#64748b]">
              Êtes-vous sûr de vouloir supprimer &quot;{zone?.name}&quot; ?
              Cette action est irréversible et supprimera également toutes les interactions associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-4">
            <AlertDialogCancel
              disabled={deleting}
              className="text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04] border-white/[0.08] transition-all duration-300"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-[#f87171]/90 hover:bg-[#f87171] text-white font-semibold transition-all duration-300 shadow-[0_0_16px_rgba(248,113,113,0.2)]"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
