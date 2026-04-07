'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Star, Send, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

function StarRating({ value, onChange, size = 'md' }: { value: number; onChange: (n: number) => void; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`${starSize} transition-all duration-200 cursor-pointer hover:scale-110 ${
            i <= value
              ? 'text-[var(--accent-primary)] drop-shadow-[0_0_4px_rgba(212,168,83,0.4)]'
              : 'text-[oklch(0.30_0.02_260)] hover:text-[oklch(0.50_0.02_260)]'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function FeedbackForm() {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [comfort, setComfort] = useState(0);
  const [location, setLocation] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSend = async () => {
    if (rating === 0) {
      toast.error('Une note globale est requise');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/hospitality/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stayRef: 'direct_feedback',
          rating,
          cleanliness: cleanliness || 3,
          comfort: comfort || 3,
          location: location || 3,
          comment: comment.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      toast.success('Merci pour votre avis !');
      // Auto-reset after 3s
      setTimeout(() => {
        setRating(0);
        setCleanliness(0);
        setComfort(0);
        setLocation(0);
        setComment('');
        setSubmitted(false);
      }, 3000);
    } catch {
      toast.error("Impossible d'envoyer l'avis");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-5 inner-glow overflow-hidden relative">
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-xl border border-[var(--accent-primary)]/15">
          <MessageSquare className="text-[var(--accent-primary)] w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-serif text-gradient-gold">
            {t.hospitality.feedback || 'Votre Avis'}
          </h3>
          <p className="text-[10px] text-[oklch(0.45_0.02_260)]">
            Aidez-nous à améliorer votre expérience
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-6"
          >
            <div className="p-3 bg-[#34d399]/10 rounded-full w-fit mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-[#34d399]" />
            </div>
            <p className="text-sm font-medium text-foreground/90">Merci pour votre retour !</p>
            <p className="text-xs text-[oklch(0.50_0.02_260)] mt-1">
              Votre avis nous aide à progresser
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Global Rating */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[oklch(0.70_0.02_260)] font-medium">Note globale</span>
              <StarRating value={rating} onChange={setRating} />
            </div>

            {/* Sub-ratings */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center bg-black/20 p-3 rounded-xl border border-white/[0.06]">
                <p className="text-[10px] text-[oklch(0.50_0.02_260)] mb-1.5 font-medium uppercase tracking-wider">Propreté</p>
                <StarRating value={cleanliness} onChange={setCleanliness} size="sm" />
              </div>
              <div className="text-center bg-black/20 p-3 rounded-xl border border-white/[0.06]">
                <p className="text-[10px] text-[oklch(0.50_0.02_260)] mb-1.5 font-medium uppercase tracking-wider">Confort</p>
                <StarRating value={comfort} onChange={setComfort} size="sm" />
              </div>
              <div className="text-center bg-black/20 p-3 rounded-xl border border-white/[0.06]">
                <p className="text-[10px] text-[oklch(0.50_0.02_260)] mb-1.5 font-medium uppercase tracking-wider">Localisation</p>
                <StarRating value={location} onChange={setLocation} size="sm" />
              </div>
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Commentaires, suggestions..."
              rows={3}
              className="w-full bg-black/20 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-[oklch(0.40_0.02_260)] focus:outline-none focus:border-[var(--accent-primary)]/50 focus:ring-[var(--accent-primary)]/20 resize-none"
            />

            {/* Submit */}
            <Button
              onClick={handleSend}
              disabled={submitting || rating === 0}
              className="w-full bg-gradient-gold text-[#0a0a12] font-semibold rounded-xl py-2.5 shadow-lg shadow-[oklch(0.78_0.14_85/15%)] hover:shadow-[oklch(0.78_0.14_85/30%)] transition-shadow duration-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <span className="animate-pulse">Envoi en cours...</span>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer mon avis
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Loading skeleton */
export function FeedbackFormSkeleton() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-5">
        <Skeleton className="h-9 w-9 rounded-xl bg-white/[0.06]" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-28 bg-white/[0.06]" />
          <Skeleton className="h-3 w-48 bg-white/[0.04]" />
        </div>
      </div>
      <div className="flex justify-between mb-4">
        <Skeleton className="h-5 w-24 bg-white/[0.04]" />
        <Skeleton className="h-7 w-32 bg-white/[0.04]" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Skeleton className="h-20 rounded-xl bg-white/[0.04]" />
        <Skeleton className="h-20 rounded-xl bg-white/[0.04]" />
        <Skeleton className="h-20 rounded-xl bg-white/[0.04]" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl bg-white/[0.04] mb-4" />
      <Skeleton className="h-10 w-full rounded-xl bg-white/[0.04]" />
    </div>
  );
}
