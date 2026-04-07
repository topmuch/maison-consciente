'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Send, Plus, Calendar } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  photos: string[];
  createdAt: string;
}

interface TravelJournalProps {
  entries: JournalEntry[];
  onRefresh?: () => void;
}

export default function TravelJournal({ entries, onRefresh }: TravelJournalProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Titre et contenu requis');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/hospitality/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success('Souvenir enregistré !');
      setTitle('');
      setContent('');
      onRefresh?.();
    } catch {
      toast.error("Impossible d'enregistrer");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="glass rounded-2xl p-5 inner-glow overflow-hidden relative">
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-xl border border-[var(--accent-primary)]/15">
          <BookOpen className="text-[var(--accent-primary)] w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-serif text-gradient-gold">
            {t.hospitality.journal || 'Carnet de Séjour'}
          </h3>
          <p className="text-[10px] text-[oklch(0.45_0.02_260)]">
            Vos souvenirs & notes de voyage
          </p>
        </div>
      </div>

      {/* New Entry Form */}
      <div className="space-y-3 mb-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la journée..."
          className="bg-black/20 border-white/[0.08] text-foreground placeholder:text-[oklch(0.40_0.02_260)] focus:border-[var(--accent-primary)]/50 focus:ring-[var(--accent-primary)]/20 h-9 text-sm rounded-lg"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Notes, découvertes, coups de cœur..."
          className="w-full bg-black/20 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-[oklch(0.40_0.02_260)] focus:outline-none focus:border-[var(--accent-primary)]/50 focus:ring-[var(--accent-primary)]/20 resize-none"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !content.trim()}
            size="sm"
            className="h-8 px-4 gap-1.5 bg-[var(--accent-primary)] text-[#0a0a12] hover:bg-[var(--accent-primary)]/90 font-medium text-xs rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <span className="animate-pulse">Enregistrement...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mb-4" />

      {/* Entries List */}
      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-luxe">
        {entries.length === 0 ? (
          <div className="text-center py-6">
            <div className="p-2 bg-white/[0.05] rounded-full w-fit mx-auto mb-2">
              <Plus className="w-5 h-5 text-[oklch(0.35_0.02_260)]" />
            </div>
            <p className="text-xs text-[oklch(0.45_0.02_260)]">
              Aucun souvenir enregistré
            </p>
            <p className="text-[10px] text-[oklch(0.35_0.02_260)] mt-0.5">
              Commencez votre carnet de voyage
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="bg-black/20 rounded-lg p-3 border-l-2 border-[var(--accent-primary)]/40 hover:bg-black/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground/90 truncate">
                    {entry.title}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Calendar className="w-3 h-3 text-[oklch(0.40_0.02_260)]" />
                    <span className="text-[10px] text-[oklch(0.40_0.02_260)] whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[oklch(0.55_0.02_260)] mt-1">
                  {expandedId === entry.id
                    ? entry.content
                    : entry.content.length > 80
                      ? entry.content.slice(0, 80) + '...'
                      : entry.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/* Loading skeleton */
export function TravelJournalSkeleton() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <Skeleton className="h-9 w-9 rounded-xl bg-white/[0.06]" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-32 bg-white/[0.06]" />
          <Skeleton className="h-3 w-44 bg-white/[0.04]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-full rounded-lg bg-white/[0.04]" />
        <Skeleton className="h-14 w-full rounded-lg bg-white/[0.04]" />
      </div>
      <div className="h-px bg-white/[0.06] my-4" />
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-lg bg-white/[0.04]" />
        <Skeleton className="h-14 w-full rounded-lg bg-white/[0.04]" />
      </div>
    </div>
  );
}
