"use client";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Mobile Voice Deep Link Page

   /guest/[token]/mobile-voice

   Interface vocale mobile pour les invités.
   Le token est extrait de l'URL, validé côté serveur,
   puis la session vocale est initialisée.

   Design : mobile-first, dark luxe, Maellis branding.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceChatButton } from "@/components/voice/VoiceChatButton";
import { Loader2, AlertCircle, RefreshCw, Shield, Sparkles } from "lucide-react";

/* ─── Types ─── */

interface VoiceSessionData {
  sessionId: string;
  householdId: string;
  guestName: string;
  householdName: string;
  stayInfo: {
    checkInDate: string | null;
    checkOutDate: string | null;
    stayDayNumber: number;
    expiresAt: string;
  };
}

interface VoiceSessionError {
  error: string;
  code: string;
}

/* ─── Animations ─── */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/* ═══════════════════════════════════════════════════════
   Page principale
   ═══════════════════════════════════════════════════════ */

export default function GuestMobileVoicePage() {
  const params = useParams();
  const token = params.token as string;

  const [session, setSession] = useState<VoiceSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<VoiceSessionError | null>(null);

  const mountedRef = useRef(false);

  /* ─── Validation du token ─── */
  const validateSession = useCallback(async () => {
    if (!token) {
      setError({ error: "Lien invalide — aucun token fourni", code: "NO_TOKEN" });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/guest/voice-session?token=${encodeURIComponent(token)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorCode = (() => {
          switch (data.error) {
            case "Token expiré": return "EXPIRED";
            case "Accès désactivé": return "DISABLED";
            case "Token invalide": return "INVALID";
            default: return "UNKNOWN";
          }
        })();

        setError({ error: data.error || "Erreur inconnue", code: errorCode });
        setLoading(false);
        return;
      }

      setSession(data as VoiceSessionData);
      setLoading(false);
    } catch (err) {
      console.error("[GuestMobileVoice] Erreur de connexion:", err);
      setError({ error: "Impossible de se connecter au serveur", code: "NETWORK" });
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    // Petit délai pour éviter les render waterfalls
    const timeout = setTimeout(validateSession, 0);
    return () => clearTimeout(timeout);
  }, [validateSession]);

  /* ─── Formater la date d'expiration ─── */
  const formatExpiry = (isoDate: string | null): string => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  /* ─── Message d'erreur détaillé ─── */
  const getErrorDetails = (err: VoiceSessionError): { title: string; description: string } => {
    switch (err.code) {
      case "EXPIRED":
        return {
          title: "Accès expiré",
          description: "Votre lien d'accès vocal a expiré. Demandez un nouveau lien à votre hôte.",
        };
      case "DISABLED":
        return {
          title: "Accès désactivé",
          description: "L'accès vocal a été désactivé par l'administrateur. Contactez votre hôte.",
        };
      case "INVALID":
        return {
          title: "Lien invalide",
          description: "Ce lien d'accès n'est pas reconnu. Vérifiez le lien ou demandez-en un nouveau.",
        };
      case "NO_TOKEN":
        return {
          title: "Lien incomplet",
          description: "Le lien d'accès est incomplet. Demandez le lien complet à votre hôte.",
        };
      case "NETWORK":
        return {
          title: "Hors connexion",
          description: "Vérifiez votre connexion internet et réessayez.",
        };
      default:
        return {
          title: "Erreur",
          description: err.error || "Une erreur inattendue est survenue.",
        };
    }
  };

  /* ═══════════════════════════════════════════════════════
     RENDU — Chargement
     ═══════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-6">
        {/* Orbe lumineux animé */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-8"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/30 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          </div>
          {/* Anneau pulsant */}
          <div className="absolute inset-0 rounded-full border border-blue-400/20 animate-ping" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-400 text-sm font-light"
        >
          Connexion à Maellis…
        </motion.p>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDU — Erreur
     ═══════════════════════════════════════════════════════ */

  if (error) {
    const details = getErrorDetails(error);
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center max-w-sm w-full"
        >
          {/* Icône d'erreur */}
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>

          {/* Titre et description */}
          <h1 className="text-xl font-serif text-slate-200 mb-3">{details.title}</h1>
          <p className="text-sm text-slate-400 leading-relaxed mb-8">{details.description}</p>

          {/* Bouton réessayer */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={validateSession}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-slate-300 text-sm hover:bg-white/[0.1] transition-colors min-h-[48px]"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </motion.button>

          {/* Indice pour les erreurs de token */}
          {(error.code === "EXPIRED" || error.code === "INVALID" || error.code === "NO_TOKEN") && (
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3 h-3" />
              <span>Accès sécurisé par Maison Consciente</span>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDU — Interface vocale principale
     ═══════════════════════════════════════════════════════ */

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col text-white relative overflow-hidden">
      {/* Halo lumineux d'ambiance */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-30%] left-[-20%] w-[80vw] h-[80vw] bg-blue-500/[0.03] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-purple-600/[0.03] rounded-full blur-[140px]" />
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ═════════════════════════════════════════
            HEADER
            ═════════════════════════════════════════ */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="pt-12 pb-8 px-6 text-center"
        >
          {/* Maellis branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <Sparkles className="w-4 h-4 text-amber-400/60" />
            <span className="font-serif text-amber-300/80 text-sm tracking-widest uppercase">
              Maellis
            </span>
            <Sparkles className="w-4 h-4 text-amber-400/60" />
          </motion.div>

          {/* Titre */}
          <h1 className="text-2xl md:text-3xl font-serif font-light text-slate-100 mb-2">
            Parlez à Maellis
          </h1>

          {/* Nom de l'invité */}
          <AnimatePresence>
            {session.guestName && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-sm text-blue-300/80 font-light"
              >
                Bonjour, {session.guestName}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.header>

        {/* ═════════════════════════════════════════
            ZONE VOCALE PRINCIPALE
            ═════════════════════════════════════════ */}
        <motion.main
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex-1 flex flex-col items-center justify-center px-4 pb-6 -mt-4"
        >
          {/* Orbe décoratif */}
          <motion.div
            variants={scaleIn}
            className="relative mb-8"
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center border border-white/[0.04]">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/5 to-purple-600/5 flex items-center justify-center">
                <VoiceChatButton
                  sessionId={session.sessionId}
                  householdId={session.householdId}
                  guestName={session.guestName}
                />
              </div>
            </div>
          </motion.div>
        </motion.main>

        {/* ═════════════════════════════════════════
            INFO SÉJOUR
            ═════════════════════════════════════════ */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="pt-4 pb-8 px-6"
        >
          {/* Infos de séjour */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-xs text-slate-500 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05]">
              Jour {session.stayInfo.stayDayNumber}
            </span>
            {session.householdName && (
              <span className="text-xs text-slate-500 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05]">
                {session.householdName}
              </span>
            )}
          </div>

          {/* Expiration */}
          {session.stayInfo.expiresAt && (
            <p className="text-xs text-slate-600 text-center mb-6">
              Accès valide jusqu&apos;au {formatExpiry(session.stayInfo.expiresAt)}
            </p>
          )}

          {/* Séparateur */}
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent mx-auto mb-4" />

          {/* Branding */}
          <p className="text-[10px] text-slate-600 text-center tracking-wider">
            Propulsé par Maellis — Maison Consciente
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
