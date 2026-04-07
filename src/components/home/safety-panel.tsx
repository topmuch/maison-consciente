'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Phone, AlertTriangle, CheckCircle, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface Contact {
  id: string;
  name: string;
  phone: string;
  type: string;
}

interface SafetyPanelProps {
  contacts: Contact[];
  onRefresh: () => void;
}

const contactTypeLabels: Record<string, string> = {
  emergency: '🚨 Urgence',
  service: '🔧 Service',
  family: '👨‍👩‍👧 Famille',
};

const contactTypeColors: Record<string, string> = {
  emergency: 'border-red-500/20 hover:border-red-500/40',
  service: 'border-amber-500/20 hover:border-amber-500/40',
  family: 'border-emerald-500/20 hover:border-emerald-500/40',
};

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function SafetyPanel({ contacts, onRefresh }: SafetyPanelProps) {
  const [lateAlert, setLateAlert] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newType, setNewType] = useState('emergency');
  const [adding, setAdding] = useState(false);

  const handleLate = async () => {
    try {
      const res = await fetch('/api/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'late-arrival' }),
      });
      if (res.ok) {
        setLateAlert(true);
        toast.success('Alerte envoyée au foyer');
        onRefresh();
        setTimeout(() => setLateAlert(false), 3000);
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    }
  };

  const handleAddContact = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-contact', name: newName, phone: newPhone, type: newType }),
      });
      if (res.ok) {
        toast.success('Contact ajouté');
        setNewName('');
        setNewPhone('');
        setShowAddContact(false);
        onRefresh();
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const res = await fetch('/api/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-contact', id }),
      });
      if (res.ok) {
        toast.success('Contact supprimé');
        onRefresh();
      }
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="glass rounded-xl overflow-hidden inner-glow"
    >
      {/* Header */}
      <div className="p-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Shield className="text-red-400 w-5 h-5" />
            </div>
            <h2 className="text-lg font-serif font-semibold tracking-tight text-amber-50">
              Sécurité & Sérénité
            </h2>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              onClick={() => setShowAddContact(!showAddContact)}
              className="p-2 rounded-lg text-[oklch(0.50_0.02_260)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/[0.06] transition-colors duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Ajouter un contact"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Late Arrival Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleLate}
          className={`
            w-full py-3 rounded-xl flex items-center justify-center gap-2
            transition-all duration-500 cursor-pointer border
            ${
              lateAlert
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/[0.06] hover:bg-red-500/15 border-red-500/20 hover:border-red-500/40 text-red-400'
            }
          `}
        >
          {lateAlert ? (
            <>
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Alerte envoyée</span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">Je rentre tard</span>
            </>
          )}
        </motion.button>

        {/* Add Contact Form */}
        {showAddContact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/20 rounded-xl p-3 border border-white/[0.08] space-y-2"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[oklch(0.60_0.02_260)] font-medium uppercase tracking-wider">
                Nouveau contact
              </span>
              <button
                onClick={() => setShowAddContact(false)}
                className="text-[oklch(0.40_0.02_260)] hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Fermer le formulaire"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom..."
              className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-foreground placeholder-[oklch(0.40_0.02_260)] focus:outline-none focus:border-[var(--accent-primary)]/30 transition-colors"
            />
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Téléphone..."
              className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-foreground placeholder-[oklch(0.40_0.02_260)] focus:outline-none focus:border-[var(--accent-primary)]/30 transition-colors"
            />
            <div className="flex gap-2">
              {(['emergency', 'service', 'family'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`flex-1 text-[10px] py-1.5 rounded-lg border transition-all cursor-pointer ${
                    newType === t
                      ? 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'border-white/[0.06] text-[oklch(0.50_0.02_260)] hover:border-white/[0.12]'
                  }`}
                >
                  {contactTypeLabels[t]}
                </button>
              ))}
            </div>
            <button
              onClick={handleAddContact}
              disabled={adding || !newName.trim() || !newPhone.trim()}
              className="w-full py-2 rounded-lg bg-gradient-gold text-[#0a0a12] text-sm font-semibold disabled:opacity-40 transition-opacity cursor-pointer"
            >
              {adding ? 'Ajout...' : 'Ajouter'}
            </button>
          </motion.div>
        )}

        {/* Contacts List */}
        <div className="space-y-2">
          {contacts.length > 0 ? (
            contacts.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center justify-between bg-black/20 px-3 py-2.5 rounded-lg border transition-colors duration-300 group ${contactTypeColors[c.type] || 'border-white/[0.06]'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-[oklch(0.80_0.02_260)] block truncate">
                      {c.name}
                    </span>
                    <span className="text-[10px] text-[oklch(0.45_0.02_260)]">
                      {contactTypeLabels[c.type] || c.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    href={`tel:${c.phone}`}
                    className="p-2 rounded-lg text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Appeler ${c.name} au ${c.phone}`}
                  >
                    <Phone size={14} />
                  </motion.a>
                  <button
                    onClick={() => handleDeleteContact(c.id)}
                    className="p-1.5 rounded-lg text-[oklch(0.35_0.02_260)] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Supprimer le contact"
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-xs text-[oklch(0.45_0.02_260)] italic text-center py-3">
              Aucun contact configuré
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
