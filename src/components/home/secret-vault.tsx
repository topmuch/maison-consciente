"use client";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — SecretVault Component
   Coffre-Fort Numérique pour codes WiFi, Netflix, etc.
   ═══════════════════════════════════════════════════════ */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  Tv,
  Landmark,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Trash2,
  X,
  Shield,
  Globe,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

/* ═══ TYPES ═══ */

interface Secret {
  id: string;
  title: string;
  username: string | null;
  password: string;
  type: string;
  isPublic: boolean;
  createdAt: string;
}

interface SecretVaultProps {
  onRefresh?: () => void;
}

/* ═══ CONSTANTS ═══ */

const typeConfig: Record<
  string,
  { icon: typeof Wifi; color: string; bg: string; label: string }
> = {
  wifi: {
    icon: Wifi,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    label: "WiFi",
  },
  streaming: {
    icon: Tv,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    label: "Streaming",
  },
  banking: {
    icon: Landmark,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    label: "Banque",
  },
  other: {
    icon: KeyRound,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    label: "Autre",
  },
};

const typeOptions = [
  { value: "wifi", label: "WiFi", icon: "📶" },
  { value: "streaming", label: "Streaming", icon: "📺" },
  { value: "banking", label: "Banque", icon: "🏦" },
  { value: "other", label: "Autre", icon: "🔑" },
];

/* ═══ COMPONENT ═══ */

export default function SecretVault({ onRefresh }: SecretVaultProps) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add form state
  const [newTitle, setNewTitle] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newType, setNewType] = useState("wifi");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [adding, setAdding] = useState(false);

  /* ─── Fetch Secrets ─── */
  const fetchSecrets = useCallback(async () => {
    try {
      const res = await fetch("/api/vault");
      if (res.ok) {
        const data = await res.json();
        setSecrets(data.secrets || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecrets();
  }, [fetchSecrets]);

  /* ─── Toggle Visibility ─── */
  const toggleVis = (id: string) => {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* ─── Copy to Clipboard ─── */
  const copyToClip = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copié dans le presse-papier");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  /* ─── Add Secret ─── */
  const handleAdd = async () => {
    if (!newTitle.trim() || !newPassword.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          username: newUsername.trim() || null,
          password: newPassword.trim(),
          type: newType,
          isPublic: newIsPublic,
        }),
      });
      if (res.ok) {
        toast.success("Secret ajouté");
        setNewTitle("");
        setNewUsername("");
        setNewPassword("");
        setNewType("wifi");
        setNewIsPublic(false);
        setShowAddModal(false);
        fetchSecrets();
        onRefresh?.();
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setAdding(false);
    }
  };

  /* ─── Delete Secret ─── */
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/vault?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Secret supprimé");
        fetchSecrets();
        onRefresh?.();
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  /* ═══ RENDER ═══ */
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="glass rounded-xl overflow-hidden inner-glow"
    >
      {/* Header */}
      <div className="p-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Shield className="text-amber-400 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold tracking-tight text-amber-50">
                Coffre-Fort
              </h2>
              {secrets.length > 0 && (
                <span className="text-[10px] text-[oklch(0.45_0.02_260)]">
                  {secrets.length} secret{secrets.length > 1 ? "s" : ""} stocké{secrets.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="p-2 bg-amber-500/10 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors duration-300 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Ajouter un secret"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Secrets List */}
      <div className="p-5 space-y-2 max-h-64 overflow-y-auto scrollbar-luxe">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-[oklch(0.40_0.02_260)] animate-spin" />
          </div>
        ) : secrets.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {secrets.map((secret) => {
              const config = typeConfig[secret.type] || typeConfig.other;
              const Icon = config.icon;
              const isVis = visible[secret.id];

              return (
                <motion.div
                  key={secret.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-black/20 px-3 py-3 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-colors duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Icon + Title + Password */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`p-2 rounded-lg ${config.bg} shrink-0`}
                      >
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[oklch(0.80_0.02_260)] truncate">
                            {secret.title}
                          </p>
                          {secret.isPublic && (
                            <Globe className="w-3 h-3 text-emerald-400/60 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[oklch(0.50_0.02_260)] font-mono truncate">
                          {isVis ? secret.password : "••••••••••"}
                        </p>
                        {secret.username && isVis && (
                          <p className="text-[10px] text-[oklch(0.45_0.02_260)] font-mono truncate mt-0.5">
                            Utilisateur: {secret.username}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => toggleVis(secret.id)}
                        className="p-1.5 rounded-lg text-[oklch(0.40_0.02_260)] hover:text-[oklch(0.70_0.02_260)] hover:bg-white/[0.06] transition-all duration-200 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title={isVis ? "Masquer" : "Afficher"}
                        aria-label={isVis ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {isVis ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClip(secret.password, secret.id)}
                        className="p-1.5 rounded-lg text-[oklch(0.40_0.02_260)] hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-200 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Copier le mot de passe"
                        aria-label="Copier le mot de passe"
                      >
                        {copiedId === secret.id ? (
                          <span className="text-[10px] text-emerald-400 font-medium">
                            OK
                          </span>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(secret.id)}
                        className="p-1.5 rounded-lg text-[oklch(0.35_0.02_260)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Supprimer le secret"
                        aria-label="Supprimer le secret"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="py-6 text-center">
            <Shield className="w-8 h-8 text-[oklch(0.25_0.02_260)] mx-auto mb-2" />
            <p className="text-xs text-[oklch(0.45_0.02_260)] italic">
              Coffre-fort vide
            </p>
            <p className="text-[10px] text-[oklch(0.35_0.02_260)] mt-1">
              Stockez vos codes WiFi, Netflix, etc.
            </p>
          </div>
        )}
      </div>

      {/* ═══ ADD SECRET MODAL ═══ */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-serif text-amber-50">
                  Ajouter un secret
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-[oklch(0.40_0.02_260)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Fermer le formulaire"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Type selector */}
              <div className="flex gap-2 mb-4">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setNewType(opt.value)}
                    className={`flex-1 py-2 rounded-lg text-xs border transition-all duration-200 cursor-pointer ${
                      newType === opt.value
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                        : "border-white/[0.06] text-[oklch(0.50_0.02_260)] hover:border-white/[0.12]"
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Titre (ex: WiFi Salon)"
                  className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-[oklch(0.40_0.02_260)] focus:outline-none focus:border-amber-500/30 transition-colors"
                />
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Identifiant (optionnel)"
                  className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-[oklch(0.40_0.02_260)] focus:outline-none focus:border-amber-500/30 transition-colors"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-[oklch(0.40_0.02_260)] focus:outline-none focus:border-amber-500/30 transition-colors"
                />

                {/* Public toggle */}
                <label className="flex items-center gap-2 text-xs text-[oklch(0.50_0.02_260)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsPublic}
                    onChange={(e) => setNewIsPublic(e.target.checked)}
                    className="rounded border-white/20"
                  />
                  <Globe className="w-3 h-3" />
                  Afficher sur la tablette familiale
                </label>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAdd}
                disabled={!newTitle.trim() || !newPassword.trim() || adding}
                className="w-full mt-5 bg-gradient-gold text-[#0a0a12] font-semibold rounded-xl px-4 py-2.5 text-sm disabled:opacity-40 transition-opacity cursor-pointer"
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Ajouter"
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
