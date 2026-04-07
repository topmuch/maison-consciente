"use client";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Dashboard: Activities Settings
   
   Interface de gestion des activités & sorties.
   Ajouter / Modifier / Supprimer des recommandations.
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  MapPin,
  Star,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Pencil,
  X,
  ExternalLink,
  Clock,
  Navigation,
  DollarSign,
  Link2,
  Phone,
  ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getActivitiesDashboard,
  createActivity,
  updateActivity,
  deleteActivity,
  togglePartnerStatus,
} from "@/actions/activity-actions";
import type { ActivityRecord } from "@/actions/activity-actions";

/* ── Types ── */
interface ActivityItem {
  id: string;
  householdId: string;
  title: string;
  category: string;
  description?: string | null;
  distance?: string | null;
  link?: string | null;
  isPartner: boolean;
  whatsappNumber?: string | null;
  image?: string | null;
  priceHint?: string | null;
  hoursHint?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Constants ── */
const CATEGORIES = [
  { value: "Culture", label: "Culture", icon: "🎭", color: "text-violet-400", bg: "bg-violet-400/10" },
  { value: "Sport", label: "Sport", icon: "⚽", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { value: "Nature", label: "Nature", icon: "🌿", color: "text-green-400", bg: "bg-green-400/10" },
  { value: "Gastronomie", label: "Gastronomie", icon: "🍽️", color: "text-orange-400", bg: "bg-orange-400/10" },
  { value: "Bien-être", label: "Bien-être", icon: "💆", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  { value: "Shopping", label: "Shopping", icon: "🛍️", color: "text-pink-400", bg: "bg-pink-400/10" },
  { value: "Transport", label: "Transport", icon: "🚊", color: "text-blue-400", bg: "bg-blue-400/10" },
  { value: "Loisir", label: "Loisir", icon: "🎯", color: "text-amber-400", bg: "bg-amber-400/10" },
] as const;

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

/* ── Empty form state ── */
const EMPTY_FORM = {
  title: "",
  category: "Culture",
  description: "",
  distance: "",
  priceHint: "",
  hoursHint: "",
  address: "",
  link: "",
  whatsappNumber: "",
  image: "",
  isPartner: false,
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [householdId] = useState("demo-household");

  /* ── Load activities ── */
  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getActivitiesDashboard(householdId);
      if (result.success) {
        setActivities(result.activities as ActivityItem[]);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Erreur lors du chargement des activités");
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  /* ── Auto-dismiss success ── */
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  /* ── Handle submit (create or update) ── */
  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Entrez le titre de l'activité");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        const result = await updateActivity(editingId, {
          title: form.title,
          category: form.category,
          description: form.description || null,
          distance: form.distance || null,
          priceHint: form.priceHint || null,
          hoursHint: form.hoursHint || null,
          address: form.address || null,
          link: form.link || null,
          whatsappNumber: form.whatsappNumber || null,
          image: form.image || null,
          isPartner: form.isPartner,
        });

        if (result.success) {
          setSuccess("Activité mise à jour avec succès");
          resetForm();
          await loadActivities();
        } else {
          setError(result.error || "Erreur lors de la mise à jour");
        }
      } else {
        const result = await createActivity({
          householdId,
          title: form.title,
          category: form.category,
          description: form.description || null,
          distance: form.distance || null,
          priceHint: form.priceHint || null,
          hoursHint: form.hoursHint || null,
          address: form.address || null,
          link: form.link || null,
          whatsappNumber: form.whatsappNumber || null,
          image: form.image || null,
          isPartner: form.isPartner,
        });

        if (result.success) {
          setSuccess("Activité ajoutée avec succès");
          resetForm();
          await loadActivities();
        } else {
          setError(result.error || "Erreur lors de l'ajout");
        }
      }
    } catch {
      setError("Erreur serveur");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete activity ── */
  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette activité ?")) return;
    setError(null);
    try {
      const result = await deleteActivity(id);
      if (result.success) {
        await loadActivities();
      } else {
        setError(result.error || "Erreur lors de la suppression");
      }
    } catch {
      setError("Erreur serveur");
    }
  };

  /* ── Toggle partner status ── */
  const handleTogglePartner = async (id: string) => {
    try {
      const result = await togglePartnerStatus(id);
      if (result.success) {
        await loadActivities();
      }
    } catch {
      /* silent fail */
    }
  };

  /* ── Edit activity ── */
  const handleEdit = (activity: ActivityItem) => {
    setEditingId(activity.id);
    setForm({
      title: activity.title,
      category: activity.category,
      description: activity.description || "",
      distance: activity.distance || "",
      priceHint: activity.priceHint || "",
      hoursHint: activity.hoursHint || "",
      address: activity.address || "",
      link: activity.link || "",
      whatsappNumber: activity.whatsappNumber || "",
      image: activity.image || "",
      isPartner: activity.isPartner,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Reset form ── */
  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
  };

  /* ── Cancel edit ── */
  const handleCancel = () => {
    resetForm();
  };

  /* ── Stats ── */
  const totalActivities = activities.length;
  const partnersCount = activities.filter((a) => a.isPartner).length;
  const categoriesCovered = new Set(activities.map((a) => a.category)).size;
  const withPrice = activities.filter((a) => a.priceHint).length;

  /* ── Filtered list ── */
  const filteredActivities =
    filter === "all" ? activities : activities.filter((a) => a.category === filter);

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <MapPin className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif text-amber-100">
              Activités &amp; Sorties
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Gérez les recommandations d&apos;activités pour vos hôtes
            </p>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center"
          >
            <p className="text-2xl font-serif text-amber-200">{totalActivities}</p>
            <p className="text-xs text-slate-500 mt-1">Total activités</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center"
          >
            <p className="text-2xl font-serif text-yellow-300">{partnersCount}</p>
            <p className="text-xs text-slate-500 mt-1">Partenaires</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center"
          >
            <p className="text-2xl font-serif text-violet-300">{categoriesCovered}</p>
            <p className="text-xs text-slate-500 mt-1">Catégories couvertes</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center"
          >
            <p className="text-2xl font-serif text-emerald-300">{withPrice}</p>
            <p className="text-xs text-slate-500 mt-1">Avec prix</p>
          </motion.div>
        </div>

        {/* ── Add/Edit Form ── */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
          {/* Form toggle header */}
          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              }
              setShowForm(!showForm);
            }}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors"
          >
            <h2 className="text-lg font-serif text-amber-200 flex items-center gap-2">
              {editingId ? (
                <Pencil className="w-5 h-5 text-amber-400" />
              ) : (
                <Plus className="w-5 h-5 text-amber-400" />
              )}
              {editingId ? "Modifier l'activité" : "Nouvelle activité"}
            </h2>
            <div
              className={`transition-transform duration-300 ${showForm ? "rotate-180" : ""}`}
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-5">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Titre *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Musée d'Orsay, Promenade en forêt..."
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                  </div>

                  {/* Category selector (8 buttons grid) */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Catégorie
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setForm({ ...form, category: c.value })}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            form.category === c.value
                              ? `${c.bg} ${c.color} border-current/30`
                              : "bg-slate-900/60 border-white/[0.06] text-slate-400 hover:border-white/20"
                          }`}
                        >
                          <span className="text-base">{c.icon}</span>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      placeholder="Décrivez l'activité en quelques mots..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none"
                    />
                  </div>

                  {/* 3-column row: Distance, Price, Hours */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        Distance
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: À 10 min à pied"
                        value={form.distance}
                        onChange={(e) => setForm({ ...form, distance: e.target.value })}
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Prix
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Gratuit, ~15€"
                        value={form.priceHint}
                        onChange={(e) => setForm({ ...form, priceHint: e.target.value })}
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Horaires
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 09h-18h"
                        value={form.hoursHint}
                        onChange={(e) => setForm({ ...form, hoursHint: e.target.value })}
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Adresse
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 12 Rue de la Paix, 75002 Paris"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                  </div>

                  {/* 3-column row: Link, WhatsApp, Image */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        Lien
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={form.link}
                        onChange={(e) => setForm({ ...form, link: e.target.value })}
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        placeholder="+33612345678"
                        value={form.whatsappNumber}
                        onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Partner toggle */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Statut Partenaire
                    </label>
                    <button
                      onClick={() => setForm({ ...form, isPartner: !form.isPartner })}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border w-full text-sm transition-all ${
                        form.isPartner
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : "bg-slate-900/60 border-white/[0.06] text-slate-400"
                      }`}
                    >
                      {form.isPartner ? (
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ) : (
                        <Star className="w-5 h-5" />
                      )}
                      {form.isPartner ? "Partenaire actif — Badge doré affiché" : "Non partenaire"}
                    </button>
                  </div>

                  {/* Submit + Cancel buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={saving || !form.title.trim()}
                      className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 transition-all min-h-[48px]"
                    >
                      {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : editingId ? (
                        <Pencil className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {saving
                        ? "Enregistrement..."
                        : editingId
                          ? "Mettre à jour"
                          : "Ajouter l'activité"}
                    </button>
                    {editingId && (
                      <button
                        onClick={handleCancel}
                        className="px-6 bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 text-slate-400 hover:text-white hover:border-white/20 font-medium flex items-center justify-center gap-2 transition-all min-h-[48px]"
                      >
                        <X className="w-4 h-4" />
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Error / Success banners ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Category Filter Tabs ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === "all"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:border-white/20"
            }`}
          >
            Tous ({activities.length})
          </button>
          {CATEGORIES.map((c) => {
            const count = activities.filter((a) => a.category === c.value).length;
            return (
              <button
                key={c.value}
                onClick={() => setFilter(c.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === c.value
                    ? `${c.bg} ${c.color} border border-current/30`
                    : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:border-white/20"
                }`}
              >
                <span className="mr-1">{c.icon}</span>
                {c.label} ({count})
              </button>
            );
          })}
        </div>

        {/* ── Activities List ── */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-500">
              <MapPin className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">
                {filter === "all"
                  ? "Aucune activité configurée"
                  : `Aucune activité dans "${filter}"`}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Ajoutez votre première activité ci-dessus
              </p>
            </div>
          ) : (
            filteredActivities.map((activity, index) => {
              const catInfo = CATEGORY_MAP[activity.category];
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="flex items-start justify-between p-4 rounded-xl border bg-white/[0.04] border-white/[0.08] hover:border-white/15 transition-all"
                >
                  {/* Left: icon/emoji + info */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Thumbnail or category icon */}
                    {activity.image ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                        <img
                          src={activity.image}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl ${catInfo?.bg ?? "bg-slate-500/10"}">${catInfo?.icon ?? "📍"}</div>`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-2xl ${
                          catInfo?.bg ?? "bg-slate-500/10"
                        }`}
                      >
                        {catInfo?.icon ?? "📍"}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {/* Title + partner badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-amber-50 truncate">
                          {activity.title}
                        </p>
                        {activity.isPartner && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium shrink-0"
                          >
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            Partenaire
                          </motion.span>
                        )}
                      </div>

                      {/* Category badge */}
                      <p className={`text-xs font-medium mt-1 ${catInfo?.color ?? "text-slate-400"}`}>
                        {catInfo?.icon} {activity.category}
                      </p>

                      {/* Description preview */}
                      {activity.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}

                      {/* Badges row */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {activity.distance && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/60 border border-white/[0.06] text-xs text-slate-400">
                            <Navigation className="w-3 h-3" />
                            {activity.distance}
                          </span>
                        )}
                        {activity.priceHint && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/60 border border-white/[0.06] text-xs text-slate-400">
                            <DollarSign className="w-3 h-3" />
                            {activity.priceHint}
                          </span>
                        )}
                        {activity.hoursHint && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/60 border border-white/[0.06] text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {activity.hoursHint}
                          </span>
                        )}
                        {activity.address && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/60 border border-white/[0.06] text-xs text-slate-400">
                            <MapPin className="w-3 h-3" />
                            {activity.address.length > 30 ? `${activity.address.slice(0, 30)}…` : activity.address}
                          </span>
                        )}
                        {activity.link && (
                          <a
                            href={activity.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/60 border border-white/[0.06] text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Lien
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-3 mt-1">
                    {/* Partner toggle */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleTogglePartner(activity.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        activity.isPartner
                          ? "text-amber-400 hover:bg-amber-400/10"
                          : "text-slate-500 hover:bg-white/5"
                      }`}
                      aria-label={
                        activity.isPartner
                          ? "Retirer le statut partenaire"
                          : "Définir comme partenaire"
                      }
                      title={
                        activity.isPartner
                          ? "Retirer le statut partenaire"
                          : "Définir comme partenaire"
                      }
                    >
                      <Star
                        className={`w-4 h-4 ${activity.isPartner ? "fill-amber-400" : ""}`}
                      />
                    </motion.button>

                    {/* Edit */}
                    <button
                      onClick={() => handleEdit(activity)}
                      className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                      aria-label="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* ── Info section ── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Informations
          </h3>
          <ul className="space-y-2 text-xs text-slate-500">
            <li className="flex items-start gap-2">
              <span className="text-amber-400/50 mt-0.5">•</span>
              Les activités s&apos;affichent sur la tablette de l&apos;hôte avec les badges de distance, prix et horaires.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400/50 mt-0.5">•</span>
              Le statut &quot;Partenaire&quot; affiche une étoile dorée et met l&apos;activité en avant.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400/50 mt-0.5">•</span>
              Vous pouvez aussi ajouter des activités par commande vocale : &quot;Maison, quelle activité proche ?&quot;
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400/50 mt-0.5">•</span>
              Le lien WhatsApp permet à l&apos;hôte de contacter directement le partenaire.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
