"use client";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Dashboard: Health Settings
   
   Interface de gestion des rappels de médicaments.
   Ajouter / Modifier / Supprimer des rappels de prise.
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Pill,
  Clock,
  CalendarDays,
  Heart,
  RefreshCw,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { createReminder, deleteReminder, getReminders, toggleReminderNotified } from "@/actions/health-actions";

/* ── Types ── */
interface ReminderItem {
  id: string;
  text: string;
  triggerAt: string;
  type: string;
  isRecurring: boolean;
  recurrenceRule: string | null;
  notified: boolean;
  createdAt: string;
}

/* ── Constants ── */
const REMINDER_TYPES = [
  { value: "medication", label: "Médicament", icon: Pill, color: "text-red-400", bg: "bg-red-400/10" },
  { value: "general", label: "Général", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
  { value: "appointment", label: "Rendez-vous", icon: CalendarDays, color: "text-cyan-400", bg: "bg-cyan-400/10" },
  { value: "birthday", label: "Anniversaire", icon: Heart, color: "text-pink-400", bg: "bg-pink-400/10" },
] as const;

const TYPE_LABELS: Record<string, string> = {
  medication: "Médicament",
  general: "Général",
  appointment: "Rendez-vous",
  birthday: "Anniversaire",
};

export default function HealthSettingsPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [newReminder, setNewReminder] = useState({
    name: "",
    time: "08:00",
    type: "medication",
    recurring: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* ── Load reminders ── */
  const loadReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReminders(filter === "all" ? undefined : filter);
      setReminders(data);
    } catch {
      setError("Erreur lors du chargement des rappels");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  /* ── Auto-dismiss success ── */
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  /* ── Add reminder ── */
  const handleAdd = async () => {
    if (!newReminder.name.trim()) {
      setError("Entrez le nom du rappel");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const [h, m] = newReminder.time.split(":").map(Number);
      const triggerDate = new Date();
      triggerDate.setHours(h, m, 0, 0);
      if (triggerDate < new Date()) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      const result = await createReminder({
        text:
          newReminder.type === "medication"
            ? `Prendre ${newReminder.name}`
            : newReminder.name,
        triggerAt: triggerDate.toISOString(),
        type: newReminder.type,
        isRecurring: newReminder.recurring,
      });

      if (result.success) {
        setNewReminder({ name: "", time: "08:00", type: "medication", recurring: true });
        setSuccess("Rappel ajouté avec succès");
        await loadReminders();
      } else {
        setError(result.error || "Erreur lors de l'ajout");
      }
    } catch {
      setError("Erreur serveur");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete reminder ── */
  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce rappel ?")) return;
    setError(null);
    try {
      const result = await deleteReminder(id);
      if (result.success) {
        await loadReminders();
      } else {
        setError(result.error || "Erreur lors de la suppression");
      }
    } catch {
      setError("Erreur serveur");
    }
  };

  /* ── Toggle notified ── */
  const handleToggleNotified = async (id: string) => {
    await toggleReminderNotified(id);
    await loadReminders();
  };

  /* ── Format time ── */
  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  /* ── Filtered reminders ── */
  const filteredReminders =
    filter === "all" ? reminders : reminders.filter((r) => r.type === filter);

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
            <Pill className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif text-amber-100">
              Santé & Rappels
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Gérez vos rappels de médicaments et appointments
            </p>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className="text-2xl font-serif text-amber-200">
              {reminders.filter((r) => r.type === "medication").length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Médicaments</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className="text-2xl font-serif text-cyan-300">
              {reminders.filter((r) => r.type === "appointment").length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Rendez-vous</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className="text-2xl font-serif text-emerald-300">
              {reminders.filter((r) => !r.notified).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">En attente</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className="text-2xl font-serif text-slate-300">
              {reminders.filter((r) => r.isRecurring).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Récurrents</p>
          </div>
        </div>

        {/* ── Add Form ── */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-serif text-amber-200 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            Nouveau rappel
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Nom / Médicament
              </label>
              <input
                type="text"
                placeholder="Ex: Doliprane 1000mg, Vitamine D..."
                value={newReminder.name}
                onChange={(e) => setNewReminder({ ...newReminder, name: e.target.value })}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>

            {/* Time */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Heure
              </label>
              <input
                type="time"
                value={newReminder.time}
                onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Type selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REMINDER_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() =>
                        setNewReminder({ ...newReminder, type: t.value })
                      }
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        newReminder.type === t.value
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : "bg-slate-900/60 border-white/[0.06] text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recurring toggle */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Récurrence
              </label>
              <button
                onClick={() =>
                  setNewReminder({ ...newReminder, recurring: !newReminder.recurring })
                }
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border w-full text-sm transition-all ${
                  newReminder.recurring
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-slate-900/60 border-white/[0.06] text-slate-400"
                }`}
              >
                {newReminder.recurring ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
                {newReminder.recurring ? "Tous les jours" : "Une seule fois"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleAdd}
            disabled={saving || !newReminder.name.trim()}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 transition-all min-h-[48px]"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {saving ? "Ajout en cours..." : "Ajouter le rappel"}
          </button>
        </div>

        {/* ── Error / Success banners ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {/* ── Filter tabs ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === "all"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:border-white/20"
            }`}
          >
            Tous ({reminders.length})
          </button>
          {REMINDER_TYPES.map((t) => {
            const count = reminders.filter((r) => r.type === t.value).length;
            return (
              <button
                key={t.value}
                onClick={() => setFilter(t.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === t.value
                    ? `${t.bg} ${t.color} border border-current/30`
                    : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:border-white/20"
                }`}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>

        {/* ── Reminders List ── */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-500">
              <Pill className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">
                {filter === "all"
                  ? "Aucun rappel configuré"
                  : `Aucun rappel de type "${TYPE_LABELS[filter] ?? filter}"`}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Ajoutez votre premier rappel ci-dessus
              </p>
            </div>
          ) : (
            filteredReminders.map((reminder) => {
              const typeInfo = REMINDER_TYPES.find(
                (t) => t.value === reminder.type
              );
              const TypeIcon = typeInfo?.icon ?? Clock;

              return (
                <div
                  key={reminder.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    reminder.notified
                      ? "bg-white/[0.02] border-white/[0.04] opacity-60"
                      : "bg-white/[0.04] border-white/[0.08] hover:border-white/15"
                  }`}
                >
                  {/* Left: icon + info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        typeInfo?.bg ?? "bg-slate-500/10"
                      }`}
                    >
                      <TypeIcon
                        className={`w-5 h-5 ${
                          typeInfo?.color ?? "text-slate-400"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`font-medium text-amber-50 truncate ${
                          reminder.notified ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {reminder.text}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(reminder.triggerAt)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDate(reminder.triggerAt)}
                        </span>
                        {reminder.isRecurring && (
                          <span className="text-xs text-emerald-400/70">
                            Quotidien
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    {/* Toggle notified */}
                    <button
                      onClick={() => handleToggleNotified(reminder.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        reminder.notified
                          ? "text-emerald-400 hover:bg-emerald-400/10"
                          : "text-slate-500 hover:bg-white/5"
                      }`}
                      aria-label={
                        reminder.notified
                          ? "Marquer comme non fait"
                          : "Marquer comme fait"
                      }
                      title={
                        reminder.notified
                          ? "Marquer comme non fait"
                          : "Marquer comme fait"
                      }
                    >
                      {reminder.notified ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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
              Les rappels médicamenteux sont notifiés avec un ton bienveillant sur la tablette.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400/50 mt-0.5">•</span>
              Les rappels récurrents se déclenchent chaque jour à l&apos;heure configurée.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400/50 mt-0.5">•</span>
              Vous pouvez aussi créer des rappels par commande vocale : &quot;Maison, rappelle-moi de...&quot;
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400/50 mt-0.5">•</span>
              Le bouton d&apos;urgence sur la tablette permet d&apos;alerter directement l&apos;hôte par WhatsApp.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
