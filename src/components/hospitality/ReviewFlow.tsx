'use client';

/* ═══════════════════════════════════════════════════════
   REVIEW FLOW — Smart Review Google

   State machine: idle → rating → comment → submitting → success-high | success-low
   Dark Luxe theme with Framer Motion animations.
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, CheckCircle2, ExternalLink, MessageCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/* ── Types ── */
interface ReviewFlowProps {
  onComplete?: () => void;
  onContactHost?: (message?: string) => void;
}

type FlowState = 'idle' | 'rating' | 'comment' | 'submitting' | 'success-high' | 'success-low' | 'expired';

interface ReviewConfig {
  googleRating: number | null;
  googlePlaceId: string | null;
  reviewSettings: Record<string, unknown>;
}

/* ── Star Rating Component ── */
function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange?.(star)}
          disabled={readonly}
          className="p-1 cursor-pointer disabled:cursor-default"
          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`w-8 h-8 transition-colors duration-200 ${
              star <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-[#475569]'
            }`}
          />
        </motion.button>
      ))}
    </div>
  );
}

/* ── Animation Variants ── */
const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const itemFade = (delay: number) => ({
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
});

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

/* ═══ MAIN COMPONENT ═══ */
export function ReviewFlow({ onComplete, onContactHost }: ReviewFlowProps) {
  const [state, setState] = useState<FlowState>('idle');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [config, setConfig] = useState<ReviewConfig | null>(null);
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Fetch review config on mount ── */
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/hospitality/review');
        if (!res.ok) throw new Error('Erreur serveur');
        const data = await res.json();
        if (data.success) {
          setConfig({
            googleRating: data.googleRating ?? null,
            googlePlaceId: data.googlePlaceId ?? null,
            reviewSettings: data.reviewSettings ?? {},
          });
          // Check if reviews are enabled
          const isEnabled = data.reviewSettings?.enabled !== false;
          if (!isEnabled) {
            setState('expired');
          } else {
            setState('rating');
          }
        } else {
          setError(data.error || 'Erreur de chargement');
        }
      } catch {
        setError("Impossible de charger la configuration d'avis");
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  /* ── Handle rating selection → move to comment ── */
  const handleRating = useCallback((value: number) => {
    setRating(value);
    setState('comment');
  }, []);

  /* ── Skip comment ── */
  const skipComment = useCallback(() => {
    setComment('');
    handleSubmit();
  }, [rating]);

  /* ── Submit review ── */
  const handleSubmit = useCallback(async () => {
    if (rating === 0) return;

    setState('submitting');
    try {
      const res = await fetch('/api/hospitality/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Impossible d'envoyer l'avis");
      }

      const data = await res.json();

      if (rating >= 4 && data.googleReviewUrl) {
        setGoogleReviewUrl(data.googleReviewUrl);
        setState('success-high');
      } else if (rating <= 3 && data.showContact) {
        setState('success-low');
      } else {
        setState('success-high');
      }

      onComplete?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi");
      setState('rating');
      setRating(0);
    }
  }, [rating, comment, onComplete]);

  /* ── Open Google Review ── */
  const openGoogleReview = useCallback(() => {
    if (googleReviewUrl) {
      window.open(googleReviewUrl, '_blank', 'noopener,noreferrer');
    }
  }, [googleReviewUrl]);

  /* ── Contact host (low rating) ── */
  const contactHost = useCallback(() => {
    onContactHost?.(comment.trim() || undefined);
  }, [onContactHost, comment]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center justify-center min-h-[48px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full"
        />
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-[#e2e8f0]">{error}</p>
      </div>
    );
  }

  /* ── Expired state ── */
  if (state === 'expired') {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
        <Clock className="w-8 h-8 text-[#64748b] mx-auto mb-3" />
        <p className="text-sm font-medium text-[#e2e8f0] mb-1">La période de retour est terminée.</p>
        <p className="text-xs text-[#64748b]">Merci pour votre séjour !</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      {/* Decorative top line */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* ═══ IDLE / LOADING — Initial state (transition) ═══ */}
          {state === 'idle' && (
            <motion.div
              key="idle"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center py-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full mx-auto mb-4"
              />
              <p className="text-sm text-[#64748b]">Chargement...</p>
            </motion.div>
          )}

          {/* ═══ RATING STEP ═══ */}
          {state === 'rating' && (
            <motion.div
              key="rating"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              {/* Step indicator */}
              <motion.div variants={itemFade(0)} className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 mb-4">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Étape 1 sur 2</span>
                </div>
                <h3 className="text-xl font-serif text-gradient-gold mb-2">
                  Comment s&apos;est passé votre séjour ?
                </h3>
                <p className="text-sm text-[#64748b]">Votre avis nous aide à nous améliorer</p>
              </motion.div>

              {/* Google Rating display */}
              {config?.googleRating && (
                <motion.div
                  variants={itemFade(0.1)}
                  className="text-center p-3 rounded-xl bg-amber-400/5 border border-amber-400/10"
                >
                  <p className="text-xs text-[#64748b] mb-1">Note Google actuelle</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-2xl font-serif text-amber-400">{config.googleRating}</span>
                    <span className="text-sm text-[#64748b]">/5</span>
                    <span className="ml-2 text-amber-400 text-sm">★★★★★</span>
                  </div>
                </motion.div>
              )}

              {!config?.googleRating && (
                <motion.div
                  variants={itemFade(0.1)}
                  className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <p className="text-xs text-[#64748b]">
                    Avis Google non configuré — configurez votre établissement pour afficher la note
                  </p>
                </motion.div>
              )}

              {/* Star rating */}
              <motion.div variants={itemFade(0.2)} className="flex justify-center">
                <StarRating value={rating} onChange={handleRating} />
              </motion.div>
            </motion.div>
          )}

          {/* ═══ COMMENT STEP ═══ */}
          {state === 'comment' && (
            <motion.div
              key="comment"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-5"
            >
              {/* Step indicator */}
              <motion.div variants={itemFade(0)} className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 mb-4">
                  <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Étape 2 sur 2</span>
                </div>
                <h3 className="text-xl font-serif text-gradient-gold mb-2">
                  Merci pour votre note !
                </h3>
                {/* Show selected rating */}
                <div className="flex justify-center mb-2">
                  <StarRating value={rating} readonly />
                </div>
              </motion.div>

              {/* Comment textarea */}
              <motion.div variants={itemFade(0.1)}>
                <textarea
                  value={comment}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setComment(e.target.value);
                    }
                  }}
                  placeholder="Partagez votre expérience (optionnel)..."
                  rows={4}
                  className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#e2e8f0] placeholder:text-[#475569] focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20 resize-none transition-all duration-300"
                />
                <div className="flex justify-end mt-1.5">
                  <span className="text-xs text-[#475569]">
                    {comment.length}/500
                  </span>
                </div>
              </motion.div>

              {/* Action buttons */}
              <motion.div variants={itemFade(0.2)} className="flex gap-3">
                <Button
                  onClick={skipComment}
                  variant="ghost"
                  className="flex-1 rounded-xl py-3 text-sm text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.05] border border-white/[0.08] cursor-pointer"
                >
                  Passer
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-gold text-[#0a0a12] font-semibold rounded-xl py-3 text-sm shadow-lg shadow-amber-400/20 hover:shadow-amber-400/40 transition-shadow duration-500 cursor-pointer"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ═══ SUBMITTING ═══ */}
          {state === 'submitting' && (
            <motion.div
              key="submitting"
              variants={scaleIn as any}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center py-10"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-10 h-10 border-2 border-amber-400/30 border-t-amber-400 rounded-full mx-auto mb-4"
              />
              <p className="text-sm text-[#64748b]">Envoi en cours...</p>
            </motion.div>
          )}

          {/* ═══ SUCCESS HIGH (≥4 stars) ═══ */}
          {state === 'success-high' && (
            <motion.div
              key="success-high"
              variants={scaleIn as any}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center space-y-5"
            >
              <motion.div
                variants={itemFade(0)}
                className="p-3 bg-emerald-500/10 rounded-full w-fit mx-auto"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </motion.div>

              <motion.div variants={itemFade(0.1)}>
                <h3 className="text-xl font-serif text-gradient-gold mb-2">
                  Merci ! Votre avis compte beaucoup.
                </h3>
                <div className="flex justify-center mb-2">
                  <StarRating value={rating} readonly />
                </div>
                {comment && (
                  <p className="text-sm text-[#64748b] italic mt-2 max-w-md mx-auto">
                    &ldquo;{comment}&rdquo;
                  </p>
                )}
              </motion.div>

              {/* Google Review CTA */}
              {googleReviewUrl && (
                <motion.div variants={itemFade(0.2)}>
                  <Button
                    onClick={openGoogleReview}
                    className="bg-gradient-gold text-[#0a0a12] font-semibold rounded-xl py-3 px-6 text-sm shadow-lg shadow-amber-400/25 hover:shadow-amber-400/45 transition-shadow duration-500 cursor-pointer"
                  >
                    <Star className="w-4 h-4 mr-2 fill-current" />
                    Laisser un avis Google
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                  <p className="text-xs text-[#64748b] mt-2">
                    Partagez votre expérience sur Google pour aider d&apos;autres voyageurs
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ═══ SUCCESS LOW (≤3 stars) ═══ */}
          {state === 'success-low' && (
            <motion.div
              key="success-low"
              variants={scaleIn as any}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center space-y-5"
            >
              <motion.div
                variants={itemFade(0)}
                className="p-3 bg-amber-400/10 rounded-full w-fit mx-auto"
              >
                <CheckCircle2 className="w-10 h-10 text-amber-400" />
              </motion.div>

              <motion.div variants={itemFade(0.1)}>
                <h3 className="text-xl font-serif text-gradient-gold mb-2">
                  Merci pour votre retour honnête.
                </h3>
                <div className="flex justify-center mb-2">
                  <StarRating value={rating} readonly />
                </div>
                {comment && (
                  <p className="text-sm text-[#64748b] italic mt-2 max-w-md mx-auto">
                    &ldquo;{comment}&rdquo;
                  </p>
                )}
              </motion.div>

              {/* Contact host CTA */}
              <motion.div variants={itemFade(0.2)}>
                <Button
                  onClick={contactHost}
                  variant="outline"
                  className="rounded-xl py-3 px-6 text-sm border-amber-400/30 text-amber-400 hover:bg-amber-400/10 hover:text-amber-300 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contacter l&apos;hôte
                </Button>
                <p className="text-xs text-[#64748b] mt-2">
                  Votre retour nous aide à améliorer notre hébergement
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
