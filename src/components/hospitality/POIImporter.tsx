'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  MapPin,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Navigation,
  Map as MapIcon,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Pill,
  Cross,
  TrainFront,
  Croissant,
  ShoppingBasket,
  Coffee,
  UtensilsCrossed,
  Wine,
  Landmark,
  Trees,
  Sparkles,
  Store,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Foursquare POI Importer
   
   Self-contained component for importing nearby POIs
   from Foursquare, with category selection, geolocation,
   radius toggle, and existing POI management.
   ═══════════════════════════════════════════════════════ */

const POI_CATEGORIES = [
  { id: 'pharmacy', label: 'Pharmacie', icon: Pill, essential: true },
  { id: 'hospital', label: 'Urgences', icon: Cross, essential: true },
  { id: 'transport', label: 'Transport', icon: TrainFront, essential: true },
  { id: 'bakery', label: 'Boulangerie', icon: Croissant, essential: true },
  { id: 'supermarket', label: 'Supérette', icon: ShoppingBasket, essential: true },
  { id: 'cafe', label: 'Café', icon: Coffee, essential: false },
  { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed, essential: false },
  { id: 'bar', label: 'Bar', icon: Wine, essential: false },
  { id: 'museum', label: 'Musée', icon: Landmark, essential: false },
  { id: 'park', label: 'Parc', icon: Trees, essential: false },
  { id: 'spa', label: 'Spa', icon: Sparkles, essential: false },
  { id: 'market', label: 'Marché', icon: Store, essential: false },
] as const;

type CategoryId = (typeof POI_CATEGORIES)[number]['id'];

/* ── Icon lookup for existing POIs ── */
const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  pharmacy: Pill,
  hospital: Cross,
  transport: TrainFront,
  bakery: Croissant,
  supermarket: ShoppingBasket,
  cafe: Coffee,
  restaurant: UtensilsCrossed,
  bar: Wine,
  museum: Landmark,
  park: Trees,
  spa: Sparkles,
  market: Store,
  coffee: Coffee,
  activity: MapPin,
  nightlife: Wine,
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  pharmacy: 'Pharmacie',
  hospital: 'Urgences',
  transport: 'Transport',
  bakery: 'Boulangerie',
  supermarket: 'Supérette',
  cafe: 'Café',
  restaurant: 'Restaurant',
  bar: 'Bar',
  museum: 'Musée',
  park: 'Parc',
  spa: 'Spa',
  market: 'Marché',
  coffee: 'Café',
  activity: 'Activité',
  nightlife: 'Vie nocturne',
};

const CATEGORY_COLOR_MAP: Record<string, string> = {
  pharmacy: 'text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20',
  hospital: 'text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20',
  transport: 'text-[#818cf8] bg-[#818cf8]/10 border-[#818cf8]/20',
  bakery: 'text-[#d4a853] bg-[#d4a853]/10 border-[#d4a853]/20',
  supermarket: 'text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20',
  cafe: 'text-[#c77d5a] bg-[#c77d5a]/10 border-[#c77d5a]/20',
  restaurant: 'text-[#d4a853] bg-[#d4a853]/10 border-[#d4a853]/20',
  bar: 'text-[#a78bfa] bg-[#a78bfa]/10 border-[#a78bfa]/20',
  museum: 'text-[#fbbf24] bg-[#fbbf24]/10 border-[#fbbf24]/20',
  park: 'text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20',
  spa: 'text-[#f9a8d4] bg-[#f9a8d4]/10 border-[#f9a8d4]/20',
  market: 'text-[#fb923c] bg-[#fb923c]/10 border-[#fb923c]/20',
  coffee: 'text-[#c77d5a] bg-[#c77d5a]/10 border-[#c77d5a]/20',
  activity: 'text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20',
  nightlife: 'text-[#a78bfa] bg-[#a78bfa]/10 border-[#a78bfa]/20',
};

/* ── Types ── */
interface ExistingPOI {
  id: string;
  name: string;
  category: string;
  address: string;
  distanceMin: number;
  isActive: boolean;
}

interface ImportResult {
  imported: number;
  updated: number;
}

interface POIImporterProps {
  compact?: boolean;
}

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export function POIImporter({ compact = false }: POIImporterProps) {
  /* ── State ── */
  const [radius, setRadius] = useState<500 | 1000>(500);
  const [selectedCategories, setSelectedCategories] = useState<Set<CategoryId>>(() => {
    const essential = new Set<CategoryId>();
    POI_CATEGORIES.forEach((cat) => {
      if (cat.essential) essential.add(cat.id);
    });
    return essential;
  });
  const [lat, setLat] = useState('48.8566');
  const [lon, setLon] = useState('2.3522');
  const [geoLoading, setGeoLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingPOIs, setExistingPOIs] = useState<ExistingPOI[]>([]);
  const [poisLoading, setPoisLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showImportPanel, setShowImportPanel] = useState(false);

  /* ── Fetch existing POIs ── */
  const fetchExistingPOIs = useCallback(async () => {
    try {
      setPoisLoading(true);
      const res = await fetch('/api/hospitality/guide');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.pois) {
          setExistingPOIs(json.pois);
          // Auto-expand categories that have POIs
          const cats = new Set<string>(json.pois.map((p: ExistingPOI) => p.category));
          setExpandedCategories(cats);
        }
      }
    } catch {
      // Silent fail for POI list — non-critical
    } finally {
      setPoisLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExistingPOIs();
  }, [fetchExistingPOIs]);

  /* ── Geolocation ── */
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée par ce navigateur');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(4));
        setLon(position.coords.longitude.toFixed(4));
        setGeoLoading(false);
        toast.success('Position mise à jour');
      },
      (err) => {
        setGeoLoading(false);
        toast.error(`Géolocalisation échouée: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  /* ── Category selection ── */
  const toggleCategory = useCallback((id: CategoryId) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedCategories.size === POI_CATEGORIES.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(POI_CATEGORIES.map((c) => c.id)));
    }
  }, [selectedCategories]);

  /* ── Import ── */
  const handleImport = useCallback(async () => {
    if (selectedCategories.size === 0) {
      toast.error('Sélectionnez au moins une catégorie');
      return;
    }
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (isNaN(latNum) || isNaN(lonNum)) {
      toast.error('Coordonnées invalides');
      return;
    }

    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const res = await fetch('/api/hospitality/foursquare-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: latNum,
          lon: lonNum,
          radius,
          categories: Array.from(selectedCategories),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 401) {
          throw new Error('Non authentifié');
        }
        if (data?.error?.includes('clé API') || data?.error?.includes('API key') || data?.error?.includes('Foursquare')) {
          throw new Error('Clé API Foursquare non configurée. Contactez l\'administrateur.');
        }
        throw new Error(data?.error || 'Erreur lors de l\'import');
      }

      const data = await res.json();
      if (data.success) {
        const imported = data.imported ?? 0;
        const updated = data.updated ?? 0;
        setImportResult({ imported, updated });
        toast.success(`${imported} importés, ${updated} mis à jour`);
        fetchExistingPOIs();
      } else {
        throw new Error(data.error || 'Import échoué');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur réseau';
      setError(message);
      toast.error(message);
    } finally {
      setImporting(false);
    }
  }, [lat, lon, radius, selectedCategories, fetchExistingPOIs]);

  /* ── Toggle POI active/inactive ── */
  const togglePOIActive = useCallback(async (poi: ExistingPOI) => {
    try {
      const res = await fetch('/api/hospitality/guide', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: poi.id, isActive: !poi.isActive }),
      });
      if (res.ok) {
        setExistingPOIs((prev) =>
          prev.map((p) => (p.id === poi.id ? { ...p, isActive: !poi.isActive } : p))
        );
        toast.success(poi.isActive ? 'POI désactivé' : 'POI activé');
      }
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  }, []);

  /* ── Delete POI ── */
  const deletePOI = useCallback(async (poi: ExistingPOI) => {
    try {
      const res = await fetch(`/api/hospitality/guide?id=${poi.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setExistingPOIs((prev) => prev.filter((p) => p.id !== poi.id));
        toast.success('POI supprimé');
      }
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }, []);

  /* ── Toggle category section ── */
  const toggleCategorySection = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  /* ── Group POIs by category ── */
  const groupedPOIs = existingPOIs.reduce<Record<string, ExistingPOI[]>>((acc, poi) => {
    if (!acc[poi.category]) acc[poi.category] = [];
    acc[poi.category].push(poi);
    return acc;
  }, {});

  /* ═══ COMPACT MODE ═══ */
  if (compact) {
    return (
      <motion.button
        onClick={() => setShowImportPanel(!showImportPanel)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full min-h-[48px] rounded-xl p-4 flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] hover:bg-[var(--accent-primary)]/[0.06] hover:border-[var(--accent-primary)]/20 transition-all duration-300 group cursor-pointer"
      >
        <div className="p-2 rounded-lg text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/15">
          <Plus className="w-4 h-4" />
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-medium text-[#e2e8f0] group-hover:text-[var(--accent-primary)] transition-colors">
            Importer des POIs
          </p>
          <p className="text-[10px] text-[#64748b]">
            {existingPOIs.length} point{existingPOIs.length !== 1 ? 's' : ''} d&apos;intérêt
          </p>
        </div>
        <AnimatePresence mode="wait">
          {showImportPanel ? (
            <motion.div key="up" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }} transition={{ duration: 0.2 }}>
              <ChevronUp className="w-4 h-4 text-[#64748b]" />
            </motion.div>
          ) : (
            <motion.div key="down" initial={{ rotate: 0 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-[#64748b]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  /* ═══ FULL MODE ═══ */
  return (
    <div className="space-y-5">
      {/* ═══ IMPORT PANEL ═══ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="glass rounded-2xl p-5 inner-glow overflow-hidden relative"
      >
        {/* Gold accent line */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-[var(--accent-primary)]/10 rounded-xl border border-[var(--accent-primary)]/15">
            <MapPin className="text-[var(--accent-primary)] w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-serif text-gradient-gold">
              Import Foursquare
            </h3>
            <p className="text-[10px] text-[#475569]">
              Importez les lieux à proximité pour vos voyageurs
            </p>
          </div>
          {existingPOIs.length > 0 && (
            <div className="px-2.5 py-1 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/15">
              <span className="text-xs font-medium text-[var(--accent-primary)]">
                {existingPOIs.length} POIs
              </span>
            </div>
          )}
        </div>

        {/* Radius Toggle */}
        <div className="mb-5">
          <label className="text-xs font-medium text-[#64748b] mb-2 block uppercase tracking-wider">
            Rayon de recherche
          </label>
          <div className="flex gap-2">
            {([500, 1000] as const).map((r) => (
              <motion.button
                key={r}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setRadius(r)}
                className={`flex-1 min-h-[48px] rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer border ${
                  radius === r
                    ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/30 text-[var(--accent-primary)] shadow-lg shadow-[oklch(0.78_0.14_85/10%)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-[#64748b] hover:border-white/[0.15] hover:text-[#e2e8f0]'
                }`}
              >
                <MapIcon className="w-4 h-4 mx-auto mb-1 opacity-60" />
                {r === 500 ? '500 m' : '1 km'}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
              Catégories
            </label>
            <button
              onClick={selectAll}
              className="text-[10px] text-[var(--accent-primary)]/70 hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
            >
              {selectedCategories.size === POI_CATEGORIES.length
                ? 'Tout désélectionner'
                : 'Tout sélectionner'}
            </button>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 gap-2"
          >
            {POI_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategories.has(cat.id);
              return (
                <motion.button
                  key={cat.id}
                  variants={staggerItem}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleCategory(cat.id)}
                  className={`min-h-[48px] rounded-xl p-2.5 flex items-center gap-2.5 transition-all duration-300 cursor-pointer border ${
                    isSelected
                      ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/25 shadow-sm'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  {/* Custom Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] shadow-sm shadow-[oklch(0.78_0.14_85/20%)]'
                        : 'bg-white/[0.05] border border-white/[0.12]'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0a0a12]" />
                      </motion.div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[#475569]'}`} />
                    <span className={`text-xs font-medium truncate ${isSelected ? 'text-[#e2e8f0]' : 'text-[#64748b]'}`}>
                      {cat.label}
                    </span>
                  </div>
                  {cat.essential && (
                    <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]/70 border border-[var(--accent-primary)]/15 shrink-0">
                      Essentiel
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* Coordinates */}
        <div className="mb-5">
          <label className="text-xs font-medium text-[#64748b] mb-2 block uppercase tracking-wider">
            Coordonnées
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
                className="w-full min-h-[48px] bg-black/20 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e2e8f0] placeholder:text-[#475569] focus:outline-none focus:border-[var(--accent-primary)]/40 focus:ring-1 focus:ring-[var(--accent-primary)]/20 transition-all font-mono"
              />
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                placeholder="Longitude"
                className="w-full min-h-[48px] bg-black/20 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e2e8f0] placeholder:text-[#475569] focus:outline-none focus:border-[var(--accent-primary)]/40 focus:ring-1 focus:ring-[var(--accent-primary)]/20 transition-all font-mono"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGeolocate}
              disabled={geoLoading}
              className="min-h-[48px] px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-[var(--accent-primary)]/10 hover:border-[var(--accent-primary)]/20 transition-all duration-300 text-[#64748b] hover:text-[var(--accent-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              <Navigation className={`w-4 h-4 ${geoLoading ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-medium hidden sm:inline">
                {geoLoading ? '...' : 'Géoloc.'}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f87171]/8 border border-[#f87171]/15">
                <XCircle className="w-4 h-4 text-[#f87171] shrink-0 mt-0.5" />
                <p className="text-xs text-[#f87171]/90">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Import Result */}
        <AnimatePresence>
          {importResult && !importing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#34d399]/8 border border-[#34d399]/15">
                <CheckCircle2 className="w-4 h-4 text-[#34d399] shrink-0" />
                <p className="text-xs text-[#34d399]">
                  <span className="font-semibold">{importResult.imported} importés</span>
                  {importResult.updated > 0 && (
                    <>, <span className="font-semibold">{importResult.updated} mis à jour</span></>
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Import Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleImport}
          disabled={importing || selectedCategories.size === 0}
          className="w-full min-h-[48px] bg-gradient-gold text-[#0a0a12] font-semibold rounded-xl py-2.5 shadow-lg shadow-[oklch(0.78_0.14_85/15%)] hover:shadow-[oklch(0.78_0.14_85/30%)] transition-shadow duration-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {importing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Import en cours...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Importer {selectedCategories.size} catégorie{selectedCategories.size !== 1 ? 's' : ''}</span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* ═══ EXISTING POIs LIST ═══ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5 inner-glow overflow-hidden relative"
      >
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#34d399]/10 rounded-xl border border-[#34d399]/15">
              <MapIcon className="text-[#34d399] w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif text-gradient-gold">
                POIs existants
              </h3>
              <p className="text-[10px] text-[#475569]">
                {existingPOIs.length} lieu{existingPOIs.length !== 1 ? 'x' : ''} enregistré{existingPOIs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={fetchExistingPOIs}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-all text-[#64748b] hover:text-[#e2e8f0] cursor-pointer"
            title="Rafraîchir"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Loading */}
        {poisLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[var(--accent-primary)] animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!poisLoading && existingPOIs.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-[#475569] mx-auto mb-2 opacity-40" />
              <p className="text-sm text-[#64748b]">Aucun POI importé</p>
              <p className="text-[10px] text-[#475569] mt-1">
                Utilisez le formulaire ci-dessus pour commencer
              </p>
            </div>
          </div>
        )}

        {/* Grouped POIs */}
        {!poisLoading && existingPOIs.length > 0 && (
          <div className="max-h-96 overflow-y-auto scrollbar-luxe space-y-2">
            {Object.entries(groupedPOIs).map(([category, pois]) => {
              const Icon = CATEGORY_ICON_MAP[category] || MapPin;
              const label = CATEGORY_LABEL_MAP[category] || category;
              const colorClass = CATEGORY_COLOR_MAP[category] || 'text-[#64748b] bg-[#64748b]/10 border-[#64748b]/20';
              const isExpanded = expandedCategories.has(category);

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-white/[0.06] overflow-hidden"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategorySection(category)}
                    className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <div className={`p-1.5 rounded-lg ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-[#e2e8f0] flex-1 text-left">
                      {label}
                    </span>
                    <span className="text-[10px] text-[#475569] px-1.5 py-0.5 rounded-full bg-white/[0.04]">
                      {pois.length}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-[#475569]" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-[#475569]" />
                    )}
                  </button>

                  {/* POI Items */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                        className="overflow-hidden"
                      >
                        <div className="divide-y divide-white/[0.04]">
                          {pois.map((poi, idx) => (
                            <motion.div
                              key={poi.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05, duration: 0.3 }}
                              className={`flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.02] transition-colors ${
                                !poi.isActive ? 'opacity-50' : ''
                              }`}
                            >
                              {/* Icon */}
                              <div className={`p-1 rounded-lg ${colorClass} shrink-0`}>
                                <Icon className="w-3 h-3" />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#e2e8f0] truncate">
                                  {poi.name}
                                </p>
                                {poi.address && (
                                  <p className="text-[10px] text-[#475569] truncate mt-0.5">
                                    {poi.address}
                                  </p>
                                )}
                              </div>

                              {/* Distance Badge */}
                              <span className="text-[10px] text-[#64748b] px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] shrink-0">
                                {poi.distanceMin} min
                              </span>

                              {/* Category Badge */}
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${colorClass} shrink-0 hidden sm:inline-block`}>
                                {CATEGORY_LABEL_MAP[poi.category] || poi.category}
                              </span>

                              {/* Active Toggle */}
                              <button
                                onClick={() => togglePOIActive(poi)}
                                className="shrink-0 p-1 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer"
                                title={poi.isActive ? 'Désactiver' : 'Activer'}
                              >
                                {poi.isActive ? (
                                  <ToggleRight className="w-5 h-5 text-[#34d399]" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-[#475569]" />
                                )}
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => deletePOI(poi)}
                                className="shrink-0 p-1 rounded-lg hover:bg-[#f87171]/10 transition-colors cursor-pointer group"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-[#475569] group-hover:text-[#f87171] transition-colors" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default POIImporter;
