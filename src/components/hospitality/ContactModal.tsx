'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Wrench,
  KeyRound,
  MessageCircle,
  Wifi,
  Bath,
  Thermometer,
  Lock,
  Camera,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Contact Host Modal
   
   Guest-facing modal to report issues to the host with
   category selection, photo upload, and quick templates.
   ═══════════════════════════════════════════════════════ */

/* ── Types ── */
type IssueType = 'cleaning' | 'equipment' | 'access' | 'other';

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillMessage?: string;
  prefillType?: IssueType;
}

/* ── Category Definitions ── */
const CATEGORIES: { value: IssueType; label: string; icon: React.ElementType }[] = [
  { value: 'cleaning', label: 'Ménage & Propreté', icon: Sparkles },
  { value: 'equipment', label: 'Équipement', icon: Wrench },
  { value: 'access', label: 'Accès & Entrée', icon: KeyRound },
  { value: 'other', label: 'Autre', icon: MessageCircle },
];

/* ── Quick Reply Templates ── */
const QUICK_TEMPLATES = [
  { label: 'WiFi', message: 'Le WiFi ne fonctionne pas', icon: Wifi },
  { label: 'Serviettes', message: 'Il manque des serviettes', icon: Bath },
  { label: 'Chauffage', message: 'Le chauffage ne marche pas', icon: Thermometer },
  { label: 'Accès', message: "Je n'arrive pas à ouvrir la porte", icon: Lock },
];

/* ── Animation Variants ── */
const modalVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.97,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const successVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const radioBounce = {
  whileTap: { scale: 0.92 },
  animate: { scale: 1 },
  transition: { type: 'spring', stiffness: 400, damping: 25 },
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export function ContactModal({
  open,
  onOpenChange,
  prefillMessage,
  prefillType,
}: ContactModalProps) {
  /* ── State ── */
  const [selectedType, setSelectedType] = useState<IssueType | null>(null);
  const [message, setMessage] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_CHARS = 1000;

  /* ── Reset on open with prefills ── */
  useEffect(() => {
    if (open) {
      setSelectedType(prefillType ?? null);
      setMessage(prefillMessage ?? '');
      setPhotoBase64(null);
      setPhotoName(null);
      setSubmitting(false);
      setSubmitted(false);

      // Clear any pending reset timer
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    }

    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [open, prefillMessage, prefillType]);

  /* ── Photo Upload Handler ── */
  const handlePhotoSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image est trop volumineuse (max 5 Mo)');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setPhotoBase64(reader.result as string);
        setPhotoName(file.name);
      };
      reader.readAsDataURL(file);

      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [],
  );

  const handleRemovePhoto = useCallback(() => {
    setPhotoBase64(null);
    setPhotoName(null);
  }, []);

  /* ── Quick Template Fill ── */
  const handleTemplateClick = useCallback((templateMessage: string) => {
    setMessage(templateMessage);
  }, []);

  /* ── Form Validation ── */
  const canSubmit = selectedType && message.trim().length > 0 && !submitting;

  /* ── Submit Handler ── */
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !selectedType) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/hospitality/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          message: message.trim(),
          photoBase64: photoBase64 || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Erreur serveur');
      }

      // Show success state
      setSubmitted(true);
      toast.success('Message envoyé à l\'hôte', {
        icon: <CheckCircle2 className="w-4 h-4 text-[#34d399]" />,
      });

      // Close modal after 1.5s
      resetTimerRef.current = setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch {
      toast.error('Impossible d\'envoyer le message', {
        description: 'Vérifiez votre connexion et réessayez',
        icon: <AlertCircle className="w-4 h-4 text-[#f87171]" />,
        action: {
          label: 'Réessayer',
          onClick: handleSubmit,
        },
      });
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, selectedType, message, photoBase64, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#0d1117]/95 backdrop-blur-xl border border-white/10 rounded-2xl sm:max-w-lg p-0 overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-luxe"
        showCloseButton={false}
      >
        <AnimatePresence mode="wait">
          {/* ═══ SUCCESS STATE ═══ */}
          {submitted ? (
            <motion.div
              key="success"
              variants={successVariants}
              initial="hidden"
              animate="visible"
              className="p-8 text-center"
            >
              <div className="p-4 bg-[#34d399]/10 rounded-full w-fit mx-auto mb-5 border border-[#34d399]/15">
                <CheckCircle2 className="w-12 h-12 text-[#34d399]" />
              </div>
              <h3 className="text-xl font-serif text-gradient-gold mb-3">
                Message envoyé
              </h3>
              <p className="text-sm text-[#e2e8f0]/80 max-w-xs mx-auto leading-relaxed">
                Nous avons bien transmis votre message. L&apos;hôte vous répondra rapidement.
              </p>
            </motion.div>
          ) : (
            /* ═══ FORM STATE ═══ */
            <motion.div
              key="form"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-6 space-y-6"
            >
              {/* ── Header ── */}
              <DialogHeader className="space-y-0 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[var(--accent-primary)]/10 rounded-xl border border-[var(--accent-primary)]/15">
                      <MessageCircle className="text-[var(--accent-primary)] w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-serif text-[#e2e8f0]">
                        Contacter l&apos;hôte
                      </DialogTitle>
                      <DialogDescription className="text-xs text-[#64748b] mt-0.5">
                        Signalez un problème ou posez une question
                      </DialogDescription>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors text-[#64748b] hover:text-[#e2e8f0] min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </DialogHeader>

              {/* ── Decorative Divider ── */}
              <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/25 to-transparent" />

              {/* ── Category Selection ── */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
                  Quelle est la nature de votre demande ?
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedType === cat.value;
                    return (
                      <motion.button
                        key={cat.value}
                        type="button"
                        onClick={() => setSelectedType(cat.value)}
                        {...radioBounce as any}
                        className={`
                          flex items-center gap-2.5 p-3.5 rounded-xl border transition-all duration-300 cursor-pointer
                          min-h-[48px]
                          ${
                            isSelected
                              ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 shadow-[0_0_16px_oklch(0.78_0.14_85/10%)]'
                              : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]'
                          }
                        `}
                      >
                        <div
                          className={`
                            p-2 rounded-lg transition-colors duration-300
                            ${
                              isSelected
                                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                                : 'bg-white/[0.05] text-[#475569]'
                            }
                          `}
                        >
                          <cat.icon className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-sm font-medium transition-colors duration-300 ${
                            isSelected ? 'text-[var(--accent-primary)]' : 'text-[#e2e8f0]'
                          }`}
                        >
                          {cat.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* ── Quick Templates ── */}
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
                  Messages rapides
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TEMPLATES.map((tpl) => (
                    <motion.button
                      key={tpl.label}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTemplateClick(tpl.message)}
                      className="
                        flex items-center gap-1.5 px-3 py-2 rounded-lg
                        bg-white/[0.04] border border-white/[0.08]
                        hover:bg-[var(--accent-primary)]/[0.06] hover:border-[var(--accent-primary)]/20
                        transition-all duration-300 cursor-pointer group min-h-[48px]
                      "
                    >
                      <tpl.icon className="w-3.5 h-3.5 text-[#475569] group-hover:text-[var(--accent-primary)] transition-colors duration-300" />
                      <span className="text-xs text-[#64748b] group-hover:text-[#e2e8f0] transition-colors duration-300">
                        {tpl.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* ── Message Textarea ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
                    Votre message
                  </p>
                  <span
                    className={`text-xs tabular-nums transition-colors duration-300 ${
                      message.length > MAX_CHARS
                        ? 'text-[#f87171]'
                        : message.length > MAX_CHARS * 0.8
                          ? 'text-[var(--accent-primary)]'
                          : 'text-[#475569]'
                    }`}
                  >
                    {message.length}/{MAX_CHARS}
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARS) {
                      setMessage(e.target.value);
                    }
                  }}
                  placeholder="Décrivez votre problème..."
                  rows={4}
                  className="
                    w-full bg-black/20 border border-white/[0.08] rounded-xl px-4 py-3
                    text-sm text-[#e2e8f0] placeholder:text-[#475569]
                    focus:outline-none focus:border-[var(--accent-primary)]/40 focus:ring-2 focus:ring-[var(--accent-primary)]/10
                    resize-none transition-all duration-300
                    min-h-[100px]
                  "
                />
              </div>

              {/* ── Photo Upload ── */}
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
                  Photo (optionnel)
                </p>

                <AnimatePresence mode="wait">
                  {photoBase64 ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                      className="relative inline-block"
                    >
                      <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg">
                        <img
                          src={photoBase64}
                          alt="Aperçu de la photo"
                          className="w-24 h-24 object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-2 -right-2 p-1.5 bg-[#0d1117] border border-white/10 rounded-full
                          text-[#64748b] hover:text-[#f87171] hover:border-[#f87171]/30
                          transition-all duration-300 cursor-pointer shadow-lg"
                        aria-label="Supprimer la photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {photoName && (
                        <p className="text-[10px] text-[#475569] mt-1.5 max-w-24 truncate">
                          {photoName}
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.button
                      key="upload"
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="
                        flex items-center gap-3 p-4 rounded-xl
                        bg-white/[0.03] border border-dashed border-white/[0.12]
                        hover:bg-white/[0.06] hover:border-[var(--accent-primary)]/20
                        transition-all duration-300 cursor-pointer w-full min-h-[48px]
                      "
                    >
                      <div className="p-2 bg-white/[0.05] rounded-lg">
                        <Camera className="w-5 h-5 text-[#475569]" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-[#e2e8f0] font-medium">
                          Ajouter une photo
                        </p>
                        <p className="text-[11px] text-[#475569]">
                          Appareil photo ou galerie · max 5 Mo
                        </p>
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Hidden file input for camera/gallery */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              {/* ── Submit Button ── */}
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.01 } : undefined}
                whileTap={canSubmit ? { scale: 0.98 } : undefined}
                className={`
                  w-full flex items-center justify-center gap-2.5
                  rounded-xl py-3.5 px-6 font-semibold text-sm
                  transition-all duration-500 min-h-[48px] cursor-pointer
                  ${
                    canSubmit
                      ? 'bg-gradient-gold text-[#0a0a12] shadow-lg shadow-[oklch(0.78_0.14_85/15%)] hover:shadow-[oklch(0.78_0.14_85/30%)]'
                      : 'bg-white/[0.04] text-[#475569] border border-white/[0.08] cursor-not-allowed'
                  }
                `}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Envoyer à l&apos;hôte</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default ContactModal;
