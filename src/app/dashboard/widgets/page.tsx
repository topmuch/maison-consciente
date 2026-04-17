"use client";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Dashboard Widget Configuration Page

   Allows users to:
   - Enable/disable widgets via toggles
   - Reorder widgets via drag & drop (@dnd-kit)
   - Save configuration to Household.displayConfig

   Protected route (requires authentication via dashboard layout).
   Luxury gold theme consistent with dashboard.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Save,
  Loader2,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  RotateCcw,
  Info,
} from "lucide-react";
import type { WidgetConfig, WidgetType } from "@/lib/widget-types";
import { WIDGET_META, createDefaultWidgets } from "@/lib/widget-types";

/* ─── Sortable Widget Item ─── */

interface SortableWidgetItemProps {
  widget: WidgetConfig;
  onToggle: (id: string) => void;
}

function SortableWidgetItem({ widget, onToggle }: SortableWidgetItemProps) {
  const meta = WIDGET_META[widget.type as WidgetType];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
        isDragging
          ? "bg-[var(--accent)]/10 border-[var(--accent)]/30 shadow-lg"
          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]"
      } ${!widget.enabled ? "opacity-50" : ""}`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-grab active:cursor-grabbing min-w-[36px] min-h-[36px] flex items-center justify-center touch-none"
        aria-label="Réorganiser"
      >
        <GripVertical className="w-4 h-4 text-slate-500" />
      </button>

      {/* Icon */}
      <span className="text-2xl shrink-0">{meta?.icon || "📦"}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {meta?.label || widget.title}
          </p>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-500 font-mono uppercase">
            {widget.size}
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
          {meta?.description || widget.type}
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <button
        onClick={() => onToggle(widget.id)}
        className={`p-2 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
          widget.enabled
            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            : "bg-white/[0.04] text-slate-500 hover:bg-white/[0.08]"
        }`}
        aria-label={widget.enabled ? "Désactiver" : "Activer"}
      >
        {widget.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </div>
  );
}

/* ─── Main Page ─── */

export default function DashboardWidgetsPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ─── Sensors for DnD ─── */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /* ─── Fetch widgets ─── */
  const fetchWidgets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/widgets");
      if (!res.ok) {
        setError("Erreur lors du chargement de la configuration");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setWidgets(data.widgets);
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  /* ─── Toggle widget ─── */
  const handleToggle = useCallback((id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
    setSaved(false);
  }, []);

  /* ─── Drag end handler ─── */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setWidgets((prev) => {
      const oldIndex = prev.findIndex((w) => w.id === active.id);
      const newIndex = prev.findIndex((w) => w.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((w, i) => ({ ...w, order: i }));
    });
    setSaved(false);
  }, []);

  /* ─── Save ─── */
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/dashboard/widgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets }),
      });
      if (!res.ok) {
        setError("Erreur lors de la sauvegarde");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  }, [widgets]);

  /* ─── Reset to defaults ─── */
  const handleReset = useCallback(() => {
    if (!confirm("Réinitialiser tous les widgets aux valeurs par défaut ?")) return;
    setWidgets(createDefaultWidgets());
    setSaved(false);
  }, []);

  /* ─── Stats ─── */
  const enabledCount = widgets.filter((w) => w.enabled).length;
  const totalCount = widgets.length;

  /* ─── Render ─── */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-4" />
        <p className="text-sm text-[var(--text-secondary)]">
          Chargement de la configuration…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Page Header */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-2"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
            <span className="text-xl">🧩</span>
          </div>
          <div>
            <h1 className="text-2xl font-serif text-[var(--text-primary)]">
              Widgets de l&apos;écran
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Configurez et réorganisez les widgets affichés sur la tablette
            </p>
          </div>
        </motion.div>

        {/* Status bar */}
        <div className="flex items-center gap-4 mt-4 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <Eye className="w-3 h-3 text-emerald-400" />
            <span>
              {enabledCount}/{totalCount} actifs
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <Info className="w-3 h-3 text-[var(--accent)]" />
            <span>Glissez pour réorganiser</span>
          </div>
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget List with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgets.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            <AnimatePresence>
              {widgets.map((widget) => (
                <motion.div
                  key={widget.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <SortableWidgetItem
                    widget={widget}
                    onToggle={handleToggle}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all min-h-[48px] ${
            saved
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-gradient-gold text-white hover:shadow-lg"
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sauvegarde…</span>
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Configuration sauvegardée !</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Sauvegarder</span>
            </>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleReset}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-[var(--text-secondary)] hover:bg-white/[0.08] transition-all min-h-[48px]"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Réinitialiser</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={fetchWidgets}
          className="flex items-center justify-center p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[var(--text-secondary)] hover:bg-white/[0.08] transition-all min-w-[48px] min-h-[48px]"
          aria-label="Rafraîchir"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Help text */}
      <div className="text-center text-xs text-[var(--text-secondary)] opacity-60 pb-4">
        <p>Les modifications seront visibles sur la tablette après rechargement.</p>
      </div>
    </div>
  );
}
