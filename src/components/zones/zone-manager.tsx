'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  QrCode,
  Utensils,
  Bed,
  Bath,
  Sofa,
  DoorOpen,
  Lamp,
  Sparkles,
  Loader2,
  CheckCircle2,
  Download,
  Copy,
  ExternalLink,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app-store';
import { ParallaxCard } from '@/components/shared/parallax-card';
import { CustomQR } from './CustomQR';
import { BatchExportQR } from './BatchExportQR';
import { NFCPairing } from './NFCPairing';
import { ScanAnalytics } from './ScanAnalytics';
import { useAuthStore } from '@/store/auth-store';

/* ═══════════════════════════════════════════════════════════════
   CONFIG & ICONS
   ═══════════════════════════════════════════════════════════════ */

const ZONE_ICONS = [
  { icon: 'Utensils', label: 'Cuisine', component: Utensils },
  { icon: 'Bed', label: 'Chambre', component: Bed },
  { icon: 'Bath', label: 'Salle de bain', component: Bath },
  { icon: 'Sofa', label: 'Salon', component: Sofa },
  { icon: 'DoorOpen', label: 'Entrée', component: DoorOpen },
  { icon: 'Lamp', label: 'Bureau', component: Lamp },
];

const ZONE_COLORS = [
  { name: 'Or', value: 'gold', hex: '#d4a853', bg: 'bg-[var(--accent-primary)]/15', text: 'text-[var(--accent-primary)]', ring: 'ring-[var(--accent-primary)]/40', border: 'border-[var(--accent-primary)]/30' },
  { name: 'Cuivre', value: 'copper', hex: '#c77d5a', bg: 'bg-[#c77d5a]/15', text: 'text-[#c77d5a]', ring: 'ring-[#c77d5a]/40', border: 'border-[#c77d5a]/30' },
  { name: 'Violet', value: 'violet', hex: '#8b5cf6', bg: 'bg-[#8b5cf6]/15', text: 'text-[#8b5cf6]', ring: 'ring-[#8b5cf6]/40', border: 'border-[#8b5cf6]/30' },
  { name: 'Émeraude', value: 'emerald', hex: '#34d399', bg: 'bg-[#34d399]/15', text: 'text-[#34d399]', ring: 'ring-[#34d399]/40', border: 'border-[#34d399]/30' },
  { name: 'Rose', value: 'rose', hex: '#fb7185', bg: 'bg-[#fb7185]/15', text: 'text-[#fb7185]', ring: 'ring-[#fb7185]/40', border: 'border-[#fb7185]/30' },
  { name: 'Ciel', value: 'sky', hex: '#38bdf8', bg: 'bg-[#38bdf8]/15', text: 'text-[#38bdf8]', ring: 'ring-[#38bdf8]/40', border: 'border-[#38bdf8]/30' },
];

interface Zone {
  id: string;
  name: string;
  icon: string;
  color: string;
  qrCode: string;
  interactionCount?: number;
  createdAt?: string;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function getColorClasses(colorValue: string) {
  return ZONE_COLORS.find((c) => c.value === colorValue) || ZONE_COLORS[0];
}

function getIconComponent(iconName: string) {
  return ZONE_ICONS.find((i) => i.icon === iconName)?.component || MapPin;
}

function getScanUrl(qrCode: string) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/scan/${qrCode}`;
  }
  return `/scan/${qrCode}`;
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
      delay: i * 0.07,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const cardHover = {
  scale: 1.01,
  transition: { duration: 0.3, ease: 'easeOut' },
};

/* ═══════════════════════════════════════════════════════════════
   QR CODE DIALOG
   ═══════════════════════════════════════════════════════════════ */

function QRCodeDialog({
  zone,
  open,
  onClose,
}: {
  zone: Zone;
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const scanUrl = getScanUrl(zone.qrCode);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(scanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${zone.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 50, 50, 300, 300);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `qr-${zone.qrCode}.png`;
        a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm glass-strong rounded-2xl border-white/[0.08] p-6">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-[#e2e8f0] flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[var(--accent-primary)]" />
            QR Code — {zone.name}
          </DialogTitle>
          <DialogDescription className="text-[#64748b]">
            Imprimez ce QR code et placez-le dans votre zone
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* QR Code */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative p-4 rounded-2xl bg-white shadow-lg shadow-black/20"
          >
            <QRCode
              id={`qr-${zone.id}`}
              value={scanUrl}
              size={180}
              bgColor="#ffffff"
              fgColor="#0a0a12"
              level="H"
            />
          </motion.div>

          {/* Scan URL */}
          <div className="w-full px-1">
            <p className="text-[10px] text-[#475569] uppercase tracking-wider font-medium mb-1.5">
              URL de scan
            </p>
            <div className="flex items-center gap-2 p-2.5 rounded-lg glass border-white/[0.06]">
              <code className="text-xs text-[#94a3b8] flex-1 truncate font-mono">
                {scanUrl}
              </code>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCopyUrl}
                className="shrink-0 p-1.5 rounded-md hover:bg-white/[0.06] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Copier l'URL"
                aria-label="Copier l'URL"
              >
                {copied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#64748b]" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
          >
            Fermer
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-gradient-gold text-[#0a0a12] font-semibold shadow-[0_0_16px_var(--accent-primary-glow)] transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ZONE MANAGER COMPONENT
   ═══════════════════════════════════════════════════════════════ */

type ZoneTab = 'zones' | 'custom-qr' | 'batch-export' | 'nfc' | 'analytics';

export function ZoneManager() {
  const { setView } = useAppStore();
  const { user } = useAuthStore();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ZoneTab>('zones');

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('Utensils');
  const [formColor, setFormColor] = useState('gold');

  const fetchZones = useCallback(async () => {
    try {
      const res = await fetch('/api/zones');
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data.zones) ? data.zones : Array.isArray(data) ? data : [];
        const parsed = raw.map((z: Zone & { _count?: { interactions: number } }) => ({
          ...z,
          interactionCount: z.interactionCount ?? z._count?.interactions ?? 0,
        }));
        setZones(parsed);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const resetForm = () => {
    setFormName('');
    setFormIcon('Utensils');
    setFormColor('gold');
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEditDialog = (zone: Zone) => {
    setEditingZone(zone);
    setFormName(zone.name);
    setFormIcon(zone.icon);
    setFormColor(zone.color);
    setEditOpen(true);
  };

  const openDeleteDialog = (zone: Zone) => {
    setDeletingZone(zone);
    setDeleteOpen(true);
  };

  const openQRDialog = (zone: Zone) => {
    setSelectedZone(zone);
    setQrOpen(true);
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error('Veuillez entrer un nom de zone');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), icon: formIcon, color: formColor }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la création');
        return;
      }
      toast.success('Zone créée avec succès');
      setCreateOpen(false);
      resetForm();
      fetchZones();
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingZone || !formName.trim()) {
      toast.error('Veuillez entrer un nom de zone');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/zones/${editingZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), icon: formIcon, color: formColor }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la modification');
        return;
      }
      toast.success('Zone modifiée avec succès');
      setEditOpen(false);
      setEditingZone(null);
      fetchZones();
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingZone) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/zones/${deletingZone.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la suppression');
        return;
      }
      toast.success('Zone supprimée');
      setDeleteOpen(false);
      setDeletingZone(null);
      fetchZones();
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setSubmitting(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════════
     ZONE FORM (shared between Create & Edit dialogs)
     ═══════════════════════════════════════════════════════════════ */

  const ZoneFormContent = () => (
    <div className="space-y-6 py-2">
      {/* Name */}
      <div className="space-y-2">
        <Label className="text-[#94a3b8] text-sm">Nom de la zone</Label>
        <Input
          placeholder="Ex: Cuisine, Chambre…"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          disabled={submitting}
          className="glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all duration-300"
        />
      </div>

      {/* Icon Selector Grid */}
      <div className="space-y-2">
        <Label className="text-[#94a3b8] text-sm">Icône</Label>
        <div className="grid grid-cols-6 gap-2">
          {ZONE_ICONS.map((item) => {
            const IconComp = item.component;
            const isSelected = formIcon === item.icon;
            return (
              <motion.button
                key={item.icon}
                type="button"
                onClick={() => setFormIcon(item.icon)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-300
                  ${isSelected
                    ? 'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/10 shadow-[0_0_12px_var(--accent-primary-glow)]'
                    : 'border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]'
                  }
                `}
                disabled={submitting}
              >
                <IconComp className={`w-5 h-5 transition-colors duration-300 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[#64748b]'}`} />
                <span className={`text-[9px] leading-tight truncate w-full text-center transition-colors duration-300 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[#475569]'}`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Color Picker */}
      <div className="space-y-2">
        <Label className="text-[#94a3b8] text-sm">Couleur</Label>
        <div className="flex gap-3">
          {ZONE_COLORS.map((color) => {
            const isSelected = formColor === color.value;
            return (
              <motion.button
                key={color.value}
                type="button"
                onClick={() => setFormColor(color.value)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`
                  relative w-9 h-9 rounded-full transition-all duration-300
                  ${isSelected
                    ? 'ring-2 ring-offset-2 ring-offset-[#0a0a12]'
                    : 'hover:ring-1 hover:ring-offset-1 hover:ring-offset-[#0a0a12]'
                  }
                `}
                style={{
                  backgroundColor: color.hex,
                  ...(isSelected ? { boxShadow: `0 0 16px ${color.hex}40` } : {}),
                }}
                disabled={submitting}
                title={color.name}
                aria-label={"Couleur : " + color.name}
              >
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 absolute inset-0 m-auto text-white drop-shadow-md" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════
     LOADING SKELETON
     ═══════════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40 bg-white/[0.06]" />
            <Skeleton className="h-4 w-72 bg-white/[0.06]" />
          </div>
          <Skeleton className="h-10 w-36 bg-white/[0.06] rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 inner-glow">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-12 w-12 rounded-xl bg-white/[0.06]" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-28 bg-white/[0.06]" />
                  <Skeleton className="h-3 w-20 bg-white/[0.06]" />
                </div>
              </div>
              <Skeleton className="h-5 w-32 bg-white/[0.06]" />
            </div>
          ))}
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
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gradient-gold">
            Zones & QR Codes
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Gérez les zones de votre maison et générez leurs QR codes
          </p>
        </div>
        {activeTab === 'zones' && (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={openCreateDialog}
              className="bg-gradient-gold text-[#0a0a12] font-semibold shadow-[0_0_20px_var(--accent-primary-glow)] hover:shadow-[0_0_30px_var(--accent-primary-glow)] transition-all duration-400"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Ajouter une Zone</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* ── Tab Navigation ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit overflow-x-auto"
      >
        {([
          { value: 'zones' as ZoneTab, label: 'Zones', icon: MapPin },
          { value: 'custom-qr' as ZoneTab, label: 'QR Logo', icon: QrCode },
          { value: 'batch-export' as ZoneTab, label: 'Export PDF', icon: Download },
          { value: 'nfc' as ZoneTab, label: 'NFC', icon: Sparkles },
          { value: 'analytics' as ZoneTab, label: 'Analytics', icon: ExternalLink },
        ]).map(({ value, label, icon: TabIcon }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-300 ${
              activeTab === value
                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20'
                : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            <TabIcon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </motion.div>

      {/* ── Custom QR Tab ── */}
      {activeTab === 'custom-qr' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          {zones.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {zones.map((zone) => (
                <div key={zone.id} className="glass rounded-2xl inner-glow border-white/[0.06] p-5">
                  <CustomQR
                    zoneName={zone.name}
                    qrCode={zone.qrCode}
                    color={getColorClasses(zone.color).hex}
                    size={200}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl inner-glow border-white/[0.06] p-12 text-center">
              <p className="text-sm text-[#64748b]">Créez d'abord des zones pour générer des QR codes personnalisés.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Batch Export Tab ── */}
      {activeTab === 'batch-export' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <BatchExportQR
            zones={zones.map((z) => ({ id: z.id, name: z.name, qrCode: z.qrCode, color: getColorClasses(z.color).hex }))}
          />
        </motion.div>
      )}

      {/* ── NFC Tab ── */}
      {activeTab === 'nfc' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <NFCPairing zones={zones} onPaired={fetchZones} />
        </motion.div>
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === 'analytics' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          {user?.householdId ? (
            <ScanAnalytics householdId={user.householdId} />
          ) : (
            <div className="glass rounded-2xl inner-glow border-white/[0.06] p-12 text-center">
              <p className="text-sm text-[#64748b]">Rejoignez un foyer pour voir les analytics.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Zone Grid (main tab) ── */}
      {activeTab === 'zones' && (
      <>
      {zones.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {zones.map((zone, i) => {
              const IconComp = getIconComponent(zone.icon);
              const colorClasses = getColorClasses(zone.color);
              return (
                <motion.div
                  key={zone.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
                  custom={i}
                  whileHover={cardHover}
                  className="cursor-pointer"
                >
                  <ParallaxCard intensity={0.15}>
                  <Card
                    className="glass rounded-2xl inner-glow border-white/[0.06] group overflow-hidden transition-all duration-500 hover:border-white/[0.12] hover:shadow-[0_0_30px_var(--accent-primary-glow)]"
                  >
                    <CardContent className="p-5">
                      {/* Top row: icon, name, actions */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl ${colorClasses.bg} flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_16px_${colorClasses.hex}30]`}
                          >
                            <IconComp className={`w-6 h-6 ${colorClasses.text}`} />
                          </div>
                          <div>
                            <h3 className="font-serif font-semibold text-[#e2e8f0] text-base leading-tight">
                              {zone.name}
                            </h3>
                            <p className="text-xs text-[#475569] font-mono mt-0.5">
                              {zone.qrCode}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons on hover */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={(e) => { e.stopPropagation(); openQRDialog(zone); }}
                            className="p-1.5 rounded-lg hover:bg-[var(--accent-primary)]/[0.08] text-[#64748b] hover:text-[var(--accent-primary)] transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Voir le QR Code"
                            aria-label="Générer le QR code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditDialog(zone); }}
                            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#64748b] hover:text-[var(--accent-primary)] transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Modifier la zone"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openDeleteDialog(zone); }}
                            className="p-1.5 rounded-lg hover:bg-[#f87171]/[0.08] text-[#64748b] hover:text-[#f87171] transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Supprimer la zone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* QR Code Preview */}
                      <div className="flex items-center gap-4 mb-4">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          onClick={(e) => { e.stopPropagation(); openQRDialog(zone); }}
                          className="p-2 rounded-xl bg-white shadow-md shadow-black/10 cursor-pointer hover:shadow-lg transition-shadow duration-300"
                        >
                          <QRCode
                            value={getScanUrl(zone.qrCode)}
                            size={56}
                            bgColor="#ffffff"
                            fgColor="#0a0a12"
                            level="M"
                          />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#64748b] truncate mb-1">
                            Cliquez pour agrandir
                          </p>
                          <Badge className={`${colorClasses.bg} ${colorClasses.text} border-0 text-[10px] font-medium px-2 py-0.5 rounded-full`}>
                            <QrCode className="w-3 h-3 mr-1" />
                            {zone.interactionCount || 0} scan{zone.interactionCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>

                      {/* Bottom: scan URL */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                        <ExternalLink className="w-3 h-3 text-[#475569] shrink-0" />
                        <code className="text-[10px] text-[#475569] font-mono truncate flex-1">
                          {getScanUrl(zone.qrCode)}
                        </code>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(getScanUrl(zone.qrCode));
                            toast.success('URL copiée !');
                          }}
                          className="shrink-0 p-1 rounded hover:bg-white/[0.06] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          aria-label="Copier l'URL"
                        >
                          <Copy className="w-3 h-3 text-[#475569]" />
                        </motion.button>
                      </div>
                    </CardContent>
                  </Card>
                  </ParallaxCard>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* ── Add Zone Card ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={zones.length}
            whileHover={{ scale: 1.01, transition: { duration: 0.3 } }}
          >
            <Card
              className="rounded-2xl border-2 border-dashed border-[var(--accent-primary)]/25 hover:border-[var(--accent-primary)]/50 min-h-[140px] flex items-center justify-center cursor-pointer transition-all duration-500 hover:shadow-[0_0_30px_var(--accent-primary-glow)] group bg-transparent"
              onClick={openCreateDialog}
            >
              <CardContent className="p-6 text-center">
                <motion.div
                  className="w-14 h-14 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[var(--accent-primary)]/20 transition-all duration-500 group-hover:shadow-[0_0_20px_var(--accent-primary-glow)]"
                  whileHover={{ scale: 1.05 }}
                >
                  <Plus className="w-6 h-6 text-[var(--accent-primary)]" />
                </motion.div>
                <p className="text-sm font-medium text-[var(--accent-primary)]/70 group-hover:text-[var(--accent-primary)] transition-colors duration-300">
                  Ajouter une Zone
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : (
        /* ── Empty State ── */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <Card className="glass rounded-2xl inner-glow border-white/[0.06]">
            <CardContent className="py-20 text-center">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center mx-auto mb-4 glow-gold"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <MapPin className="w-8 h-8 text-[var(--accent-primary)]" />
              </motion.div>
              <h3 className="text-xl font-serif font-semibold text-[#e2e8f0] mb-2">
                Aucune zone créée
              </h3>
              <p className="text-sm text-[#64748b] mb-6 max-w-sm mx-auto">
                Créez votre première zone pour commencer à utiliser Maison Consciente.
                Chaque zone génère automatiquement un QR code unique.
              </p>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={openCreateDialog}
                  className="bg-gradient-gold text-[#0a0a12] font-semibold shadow-[0_0_20px_var(--accent-primary-glow)] hover:shadow-[0_0_30px_var(--accent-primary-glow)] transition-all duration-400"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Créer une zone
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      </>
      )}

      {/* ═══════════════════════════════════════════════════════════
         QR CODE DIALOG
         ═══════════════════════════════════════════════════════════ */}
      {selectedZone && (
        <QRCodeDialog
          zone={selectedZone}
          open={qrOpen}
          onClose={() => { setQrOpen(false); setSelectedZone(null); }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════
         CREATE DIALOG
         ═══════════════════════════════════════════════════════════ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md glass-strong rounded-2xl border-white/[0.08] p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#e2e8f0]">
              Nouvelle zone
            </DialogTitle>
            <DialogDescription className="text-[#64748b]">
              Créez une zone pour votre maison. Un QR code sera généré automatiquement.
            </DialogDescription>
          </DialogHeader>
          <ZoneFormContent />
          <DialogFooter className="gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setCreateOpen(false)}
              disabled={submitting}
              className="text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all duration-300"
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-gradient-gold text-[#0a0a12] font-semibold shadow-[0_0_16px_var(--accent-primary-glow)] hover:shadow-[0_0_24px_var(--accent-primary-glow)] transition-all duration-400 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0a0a12]" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Créer & Générer QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
         EDIT DIALOG
         ═══════════════════════════════════════════════════════════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md glass-strong rounded-2xl border-white/[0.08] p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#e2e8f0]">
              Modifier la zone
            </DialogTitle>
            <DialogDescription className="text-[#64748b]">
              Modifiez les informations de la zone
            </DialogDescription>
          </DialogHeader>
          <ZoneFormContent />
          <DialogFooter className="gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setEditOpen(false)}
              disabled={submitting}
              className="text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all duration-300"
            >
              Annuler
            </Button>
            <Button
              onClick={handleEdit}
              disabled={submitting}
              className="bg-gradient-gold text-[#0a0a12] font-semibold shadow-[0_0_16px_var(--accent-primary-glow)] hover:shadow-[0_0_24px_var(--accent-primary-glow)] transition-all duration-400 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0a0a12]" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
         DELETE DIALOG
         ═══════════════════════════════════════════════════════════ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="glass-strong rounded-2xl border-white/[0.08] p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg text-[#e2e8f0]">
              Supprimer la zone
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#64748b]">
              Êtes-vous sûr de vouloir supprimer la zone &quot;{deletingZone?.name}&quot; ?
              Cette action est irréversible. Toutes les interactions associées seront également supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-4">
            <AlertDialogCancel
              disabled={submitting}
              className="text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04] border-white/[0.08] transition-all duration-300"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-[#f87171]/90 hover:bg-[#f87171] text-white font-semibold transition-all duration-300 shadow-[0_0_16px_rgba(248,113,113,0.2)]"
            >
              {submitting ? (
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
