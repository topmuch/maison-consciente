'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sun, Moon, Check, Sparkles, Wrench } from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface Ritual {
  id: string;
  title: string;
  timeOfDay: string;
  isCompleted: boolean;
}

interface MoodEntry {
  id: string;
  mood: number;
  note: string | null;
  createdAt: string;
}

interface MaintenanceTask {
  id: string;
  title: string;
  dueDate: string;
  isDone: boolean;
  recurrence: string | null;
}

interface WellnessPanelProps {
  rituals: Ritual[];
  moods: MoodEntry[];
  maintenance: MaintenanceTask[];
  timeFilter: string;
  onRefresh: () => void;
}

/* ── Mood Config ── */
const moods = [
  { val: 1, emoji: '😞', label: 'Mauvais', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  { val: 2, emoji: '😕', label: 'Pas top', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { val: 3, emoji: '😐', label: 'Neutre', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { val: 4, emoji: '🙂', label: 'Bien', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { val: 5, emoji: '😊', label: 'Super', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
];

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function WellnessPanel({
  rituals,
  moods: moodEntries,
  maintenance,
  timeFilter,
  onRefresh,
}: WellnessPanelProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodSubmitting, setMoodSubmitting] = useState(false);

  const handleMood = async (val: number) => {
    if (moodSubmitting) return;
    setSelectedMood(val);
    setMoodSubmitting(true);
    try {
      const res = await fetch('/api/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit-mood', mood: val }),
      });
      if (res.ok) {
        toast.success('Humeur enregistrée');
        onRefresh();
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setTimeout(() => {
        setSelectedMood(null);
        setMoodSubmitting(false);
      }, 1000);
    }
  };

  const handleToggleRitual = async (id: string) => {
    try {
      const res = await fetch('/api/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-ritual', id }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch {
      toast.error('Erreur réseau');
    }
  };

  const handleToggleMaintenance = async (id: string) => {
    try {
      const res = await fetch('/api/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-maintenance', id }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch {
      toast.error('Erreur réseau');
    }
  };

  /* ── Mood history sparkline ── */
  const avgMood =
    moodEntries.length > 0
      ? (moodEntries.reduce((sum, m) => sum + m.mood, 0) / moodEntries.length).toFixed(1)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="glass rounded-xl overflow-hidden inner-glow"
    >
      {/* Header */}
      <div className="p-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-pink-500/10 rounded-lg">
            <Heart className="text-pink-400 w-5 h-5" />
          </div>
          <h2 className="text-lg font-serif font-semibold tracking-tight text-amber-50">
            Bien-être & Rituels
          </h2>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* ── Mood Tracker ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[oklch(0.55_0.02_260)] uppercase tracking-wider font-medium">
              Comment allez-vous ?
            </span>
            {avgMood && (
              <span className="text-[10px] text-[oklch(0.45_0.02_260)] font-mono">
                Moyenne 7j: {avgMood}/5
              </span>
            )}
          </div>
          <div className="flex justify-between bg-black/20 rounded-xl p-1.5 gap-1">
            {moods.map((m) => (
              <motion.button
                key={m.val}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleMood(m.val)}
                className={`
                  flex-1 py-2 rounded-lg transition-all duration-300 cursor-pointer
                  ${selectedMood === m.val ? `${m.bg} ${m.border} border scale-110` : 'hover:bg-white/[0.04] border border-transparent'}
                `}
                disabled={moodSubmitting}
                aria-label={`Humeur : ${m.label}, ${m.val} sur 5`}
              >
                <span className={`text-xl ${m.color}`}>{m.emoji}</span>
              </motion.button>
            ))}
          </div>
          {/* Mood history mini sparkline */}
          {moodEntries.length > 1 && (
            <div className="flex items-end gap-1 mt-3 h-6">
              {moodEntries.slice(0, 7).reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex-1 rounded-sm transition-all duration-300"
                  style={{
                    height: `${(entry.mood / 5) * 100}%`,
                    backgroundColor: entry.mood >= 4
                      ? 'oklch(0.70 0.15 150)'
                      : entry.mood >= 3
                        ? 'oklch(0.75 0.15 85)'
                        : 'oklch(0.65 0.18 25)',
                    opacity: 0.6,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Rituals ── */}
        <div>
          <h4 className="text-xs text-[oklch(0.55_0.02_260)] uppercase tracking-wider font-medium flex items-center gap-2 mb-3">
            {timeFilter === 'morning' ? (
              <>
                <Sun size={12} className="text-amber-400" />
                Rituels du matin
              </>
            ) : (
              <>
                <Moon size={12} className="text-[var(--accent-primary)]" />
                Rituels du soir
              </>
            )}
          </h4>
          <div className="space-y-2">
            {rituals.length > 0 ? (
              rituals.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  className={`flex items-center gap-3 bg-black/20 px-3 py-2.5 rounded-lg border transition-colors duration-300 ${
                    r.isCompleted
                      ? 'border-emerald-500/20'
                      : 'border-white/[0.06] hover:border-[var(--accent-primary)]/20'
                  }`}
                >
                  <button
                    onClick={() => !r.isCompleted && handleToggleRitual(r.id)}
                    disabled={r.isCompleted}
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      shrink-0 transition-all duration-300 cursor-pointer
                      ${
                        r.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-black'
                          : 'border-[oklch(0.40_0.02_260)] hover:border-[var(--accent-primary)]'
                      }
                    `}
                  >
                    {r.isCompleted && <Check size={10} strokeWidth={3} />}
                  </button>
                  <span
                    className={`text-sm transition-colors duration-300 ${
                      r.isCompleted
                        ? 'text-[oklch(0.45_0.02_260)] line-through'
                        : 'text-[oklch(0.80_0.02_260)]'
                    }`}
                  >
                    {r.title}
                  </span>
                </motion.div>
              ))
            ) : (
              <p className="text-xs text-[oklch(0.45_0.02_260)] italic py-2">
                Aucun rituel programmé pour ce moment
              </p>
            )}
          </div>
        </div>

        {/* ── Maintenance Tasks ── */}
        {maintenance.length > 0 && (
          <div>
            <h4 className="text-xs text-[oklch(0.55_0.02_260)] uppercase tracking-wider font-medium flex items-center gap-2 mb-3">
              <Wrench size={12} className="text-[oklch(0.60_0.08_260)]" />
              Maintenance
            </h4>
            <div className="space-y-2">
              {maintenance.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  className={`flex items-center gap-3 bg-black/20 px-3 py-2.5 rounded-lg border transition-colors duration-300 cursor-pointer ${
                    task.isDone
                      ? 'border-emerald-500/20 opacity-60'
                      : 'border-white/[0.06] hover:border-amber-500/20'
                  }`}
                  onClick={() => handleToggleMaintenance(task.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleToggleMaintenance(task.id)}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                      task.isDone
                        ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-black'
                        : 'border-[oklch(0.40_0.02_260)]'
                    }`}
                  >
                    {task.isDone && <Check size={10} strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm block truncate ${
                        task.isDone
                          ? 'text-[oklch(0.45_0.02_260)] line-through'
                          : 'text-[oklch(0.80_0.02_260)]'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="text-[10px] text-[oklch(0.40_0.02_260)]">
                      {new Date(task.dueDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                      {task.recurrence && ` · ${task.recurrence}`}
                    </span>
                  </div>
                  {!task.isDone && (
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]/40 shrink-0" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
