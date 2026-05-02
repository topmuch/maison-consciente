"use client";

/* ═══════════════════════════════════════════════════════
   MAELLIS — Calendrier Intelligent — Dashboard Page

   /dashboard/calendar

   Gestion des sources de calendrier (iCal Airbnb/Booking)
   et visualisation des réservations synchronisées.
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Link,
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Building2,
  Trash2,
  Eye,
  AlertTriangle,
  Wifi,
} from "lucide-react";

/* ─── Types ─── */

interface CalendarSource {
  id: string;
  name: string;
  type: string;
  url: string | null;
  lastSyncAt: string | null;
  syncStatus: string;
  lastError: string | null;
  isActive: boolean;
  autoSync: boolean;
  syncInterval: number;
  totalEvents: number;
  activeBookings: number;
  createdAt: string;
}

interface SyncedBooking {
  id: string;
  externalId: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number | null;
  source: string;
  status: string;
  nights: number;
  calendarSource: {
    id: string;
    name: string;
    type: string;
  };
}

/* ─── Composants ─── */

function StatusBadge({ status }: { status: string }) {
  const config = {
    confirmed: {
      label: "Confirmé",
      className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
      icon: CheckCircle,
    },
    pending: {
      label: "En attente",
      className: "bg-amber-500/15 text-amber-400 border-amber-500/20",
      icon: Clock,
    },
    cancelled: {
      label: "Annulé",
      className: "bg-red-500/15 text-red-400 border-red-500/20",
      icon: XCircle,
    },
    completed: {
      label: "Terminé",
      className: "bg-slate-500/15 text-slate-400 border-slate-500/20",
      icon: CheckCircle,
    },
  }[status] || {
    label: status,
    className: "bg-slate-500/15 text-slate-400 border-slate-500/20",
    icon: AlertTriangle,
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function SourceTypeIcon({ type }: { type: string }) {
  const config = {
    ical: { icon: Link, color: "text-blue-400", bg: "bg-blue-500/10" },
    airbnb: { icon: Building2, color: "text-rose-400", bg: "bg-rose-500/10" },
    booking: { icon: Building2, color: "text-blue-400", bg: "bg-blue-500/10" },
    google: { icon: Calendar, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  }[type] || { icon: Link, color: "text-slate-400", bg: "bg-slate-500/10" };

  const Icon = config.icon;

  return (
    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
      <Icon className={`w-4 h-4 ${config.color}`} />
    </div>
  );
}

function FormatDate({ iso, showYear = false }: { iso: string; showYear?: boolean }) {
  const date = new Date(iso);
  return (
    <span className="text-sm text-slate-300">
      {date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        ...(showYear ? { year: "numeric" } : {}),
      })}
    </span>
  );
}

function RelativeTime({ iso }: { iso: string | null }) {
  if (!iso) return <span className="text-xs text-slate-500">Jamais</span>;

  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return <span className="text-xs text-emerald-400">À l&apos;instant</span>;
  if (diffMin < 60) return <span className="text-xs text-slate-400">Il y a {diffMin} min</span>;
  if (diffHour < 24) return <span className="text-xs text-slate-400">Il y a {diffHour}h</span>;
  return <span className="text-xs text-slate-500">Il y a {diffDay}j</span>;
}

/* ═══════════════════════════════════════════════════════
   Page principale
   ═══════════════════════════════════════════════════════ */

export default function CalendarDashboardPage() {
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [bookings, setBookings] = useState<SyncedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("confirmed");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", type: "ical", url: "", autoSync: true, syncInterval: 60 });
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [preview, setPreview] = useState<Array<{ guestName: string; checkInDate: string; checkOutDate: string }> | null>(null);

  /* ─── Charger les données ─── */
  const loadData = useCallback(async () => {
    try {
      const [sourcesRes, bookingsRes] = await Promise.all([
        fetch("/api/hospitality/calendar"),
        fetch(`/api/hospitality/calendar/bookings?status=${statusFilter}`),
      ]);

      const sourcesData = await sourcesRes.json();
      const bookingsData = await bookingsRes.json();

      if (sourcesData.success) setSources(sourcesData.sources);
      if (bookingsData.success) setBookings(bookingsData.bookings);
    } catch (err) {
      console.error("[Calendar Dashboard] Erreur de chargement:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ─── Synchroniser une source ─── */
  const syncSource = async (sourceId: string) => {
    setSyncingSourceId(sourceId);
    try {
      const res = await fetch(`/api/hospitality/calendar/sync?sourceId=${sourceId}`);
      const data = await res.json();
      if (data.success) {
        console.log("[Calendar] Sync OK:", data);
        await loadData();
      }
    } catch (err) {
      console.error("[Calendar] Sync error:", err);
    } finally {
      setSyncingSourceId(null);
    }
  };

  /* ─── Supprimer une source ─── */
  const deleteSource = async (sourceId: string) => {
    if (!confirm("Supprimer cette source de calendrier ?")) return;
    try {
      await fetch(`/api/hospitality/calendar?id=${sourceId}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      console.error("[Calendar] Delete error:", err);
    }
  };

  /* ─── Ajouter une source ─── */
  const addSource = async () => {
    setAddError(null);
    setAddLoading(true);
    setPreview(null);

    try {
      const res = await fetch("/api/hospitality/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || "Erreur lors de l&apos;ajout");
        return;
      }

      if (data.preview) {
        setPreview(data.preview.events);
      }

      setShowAddDialog(false);
      setAddForm({ name: "", type: "ical", url: "", autoSync: true, syncInterval: 60 });
      await loadData();
    } catch (err) {
      setAddError("Erreur de connexion au serveur");
    } finally {
      setAddLoading(false);
    }
  };

  /* ─── Stats calculées ─── */
  const totalActiveBookings = sources.reduce((sum, s) => sum + s.activeBookings, 0);
  const errorSources = sources.filter((s) => s.syncStatus === "error");

  /* ─── Rendu : Chargement ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-[var(--accent)] animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ═════════════════════════════════════════
          HEADER
          ═════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[var(--text-primary)]">Calendrier Intelligent</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Synchronisez vos réservations Airbnb, Booking.com et Google Calendar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sm text-[var(--text-secondary)] hover:bg-white/[0.1] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Ajouter une source
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════
          STATS RAPIDES
          ═════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">{sources.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">Sources connectées</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">{totalActiveBookings}</p>
              <p className="text-xs text-[var(--text-secondary)]">Réservations actives</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${errorSources.length > 0 ? "bg-amber-500/10" : "bg-emerald-500/10"} flex items-center justify-center`}>
              {errorSources.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">{errorSources.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">Erreurs de sync</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════
          SOURCES DE CALENDRIER
          ═════════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-medium text-[var(--text-primary)] mb-4">Sources de calendrier</h2>

        {sources.length === 0 ? (
          <div className="rounded-xl bg-white/[0.02] border border-dashed border-white/[0.1] p-8 text-center">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-[var(--text-secondary)] mb-1">Aucune source connectée</p>
            <p className="text-xs text-slate-500">
              Ajoutez votre lien iCal Airbnb ou Booking.com pour synchroniser vos réservations automatiquement.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((source) => (
              <div
                key={source.id}
                className={`rounded-xl bg-white/[0.03] border p-4 transition-colors ${
                  source.isActive ? "border-white/[0.06]" : "border-red-500/10 opacity-60"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Type icon + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <SourceTypeIcon type={source.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {source.name}
                        </h3>
                        {!source.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                            Désactivé
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-[var(--text-secondary)] capitalize">{source.type}</span>
                        {source.lastSyncAt && (
                          <>
                            <span className="text-xs text-slate-600">|</span>
                            <RelativeTime iso={source.lastSyncAt} />
                          </>
                        )}
                        {source.activeBookings > 0 && (
                          <>
                            <span className="text-xs text-slate-600">|</span>
                            <span className="text-xs text-emerald-400">{source.activeBookings} réservation(s)</span>
                          </>
                        )}
                      </div>
                      {source.lastError && (
                        <p className="text-xs text-red-400/80 mt-1 truncate">{source.lastError}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {source.syncStatus === "syncing" ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-xs">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Synchronisation...
                      </div>
                    ) : (
                      <button
                        onClick={() => syncSource(source.id)}
                        disabled={syncingSourceId === source.id || !source.isActive}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.06] text-xs text-[var(--text-secondary)] hover:bg-white/[0.1] transition-colors disabled:opacity-40"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingSourceId === source.id ? "animate-spin" : ""}`} />
                        Synchroniser
                      </button>
                    )}
                    <button
                      onClick={() => deleteSource(source.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═════════════════════════════════════════
          RÉSERVATIONS
          ═════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">Réservations synchronisées</h2>
          <div className="flex items-center gap-1">
            {["confirmed", "pending", "cancelled", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-[var(--accent)] text-white"
                    : "bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/[0.08]"
                }`}
              >
                {status === "confirmed" ? "Confirmées" : status === "pending" ? "En attente" : status === "cancelled" ? "Annulées" : "Terminées"}
              </button>
            ))}
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-xl bg-white/[0.02] border border-dashed border-white/[0.1] p-8 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">
              {statusFilter === "confirmed"
                ? "Aucune réservation confirmée"
                : `Aucune réservation avec le statut "${statusFilter}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {booking.guestName}
                      </h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <FormatDate iso={booking.checkInDate} />
                      </span>
                      <span className="text-slate-600">→</span>
                      <span className="flex items-center gap-1">
                        <FormatDate iso={booking.checkOutDate} />
                      </span>
                      <span className="text-slate-600">|</span>
                      <span>{booking.nights} nuit{booking.nights > 1 ? "s" : ""}</span>
                      {booking.numberOfGuests && (
                        <>
                          <span className="text-slate-600">|</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {booking.numberOfGuests} voyageur{booking.numberOfGuests > 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.04] text-[var(--text-secondary)] capitalize">
                      {booking.calendarSource.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═════════════════════════════════════════
          DIALOG : Ajouter une source
          ═════════════════════════════════════════ */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-white/[0.08] shadow-2xl p-6 space-y-5">
            <h2 className="text-lg font-serif text-[var(--text-primary)]">Ajouter une source</h2>

            {/* Nom */}
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Nom de la source</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Airbnb - Mon appartement"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[var(--text-primary)] placeholder:text-slate-500 focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Type</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "ical", label: "iCal", icon: Link },
                  { value: "airbnb", label: "Airbnb", icon: Building2 },
                  { value: "booking", label: "Booking", icon: Building2 },
                  { value: "google", label: "Google", icon: Calendar },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setAddForm((f) => ({ ...f, type: t.value }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                        addForm.type === t.value
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "border-white/[0.06] bg-white/[0.02] text-[var(--text-secondary)] hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* URL iCal */}
            {addForm.type === "ical" && (
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">URL iCal</label>
                <input
                  type="url"
                  value={addForm.url}
                  onChange={(e) => setAddForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://calendar.icloud.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[var(--text-primary)] placeholder:text-slate-500 focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Collez le lien iCal privé depuis Airbnb ou Booking.com
                </p>
              </div>
            )}

            {/* Auto-sync */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-primary)]">Synchronisation automatique</p>
                <p className="text-xs text-slate-500">Sync toutes les {addForm.syncInterval} minutes</p>
              </div>
              <button
                onClick={() => setAddForm((f) => ({ ...f, autoSync: !f.autoSync }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${addForm.autoSync ? "bg-[var(--accent)]" : "bg-slate-600"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${addForm.autoSync ? "translate-x-5" : ""}`} />
              </button>
            </div>

            {/* Erreur */}
            {addError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/15">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-300">{addError}</p>
              </div>
            )}

            {/* Preview */}
            {preview && preview.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/15">
                <p className="text-xs text-emerald-400 font-medium mb-2">
                  Aperçu : {preview.length} événement(s) détecté(s)
                </p>
                <div className="space-y-1">
                  {preview.map((p, i) => (
                    <p key={i} className="text-xs text-emerald-300/80">
                      {p.guestName} — {new Date(p.checkInDate).toLocaleDateString("fr-FR")} → {new Date(p.checkOutDate).toLocaleDateString("fr-FR")}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => { setShowAddDialog(false); setAddError(null); setPreview(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-[var(--text-secondary)] hover:bg-white/[0.1] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={addSource}
                disabled={addLoading || !addForm.name.trim() || (addForm.type === "ical" && !addForm.url.trim())}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {addLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Test et ajout...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
