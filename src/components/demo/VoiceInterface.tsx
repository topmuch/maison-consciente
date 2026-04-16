'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Keyboard, X, Volume2, AlertCircle } from 'lucide-react';
import { useMaellisVoice, type VoiceState } from '@/hooks/useMaellisVoice';

/* ═══════════════════════════════════════════════════════════════
   VOICE INTERFACE — Interface vocale Maellis

   Composant visuel pour les démos Famille & Airbnb :
   - Cercle animé avec couleur selon l'état
   - Bouton micro tactile
   - Affichage du transcript utilisateur + réponse Maellis
   - Mode clavier fallback
   ═══════════════════════════════════════════════════════════════ */

interface VoiceInterfaceProps {
  /** Contexte : "particulier" ou "airbnb" */
  mode: 'particulier' | 'airbnb';
  /** Fonction appelée quand le transcript final est reçu */
  onUserMessage?: (text: string) => string | void;
  /** Position : "bottom" (fixé en bas) ou "inline" (dans le flux) */
  position?: 'bottom' | 'inline';
  /** Texte d'accueil personnalisé */
  welcomeText?: string;
}

/* ── Couleurs par état ── */
const STATE_COLORS: Record<VoiceState, { bg: string; ring: string; glow: string; label: string; labelColor: string }> = {
  idle: {
    bg: 'bg-blue-500',
    ring: 'ring-blue-400/30',
    glow: 'rgba(59, 130, 246, 0.3)',
    label: 'En veille',
    labelColor: 'text-blue-400',
  },
  listening: {
    bg: 'bg-red-500',
    ring: 'ring-red-400/30',
    glow: 'rgba(239, 68, 68, 0.4)',
    label: 'Je vous écoute...',
    labelColor: 'text-red-400',
  },
  processing: {
    bg: 'bg-amber-500',
    ring: 'ring-amber-400/30',
    glow: 'rgba(245, 158, 11, 0.3)',
    label: 'Traitement...',
    labelColor: 'text-amber-400',
  },
  speaking: {
    bg: 'bg-emerald-500',
    ring: 'ring-emerald-400/30',
    glow: 'rgba(16, 185, 129, 0.4)',
    label: 'Maellis parle...',
    labelColor: 'text-emerald-400',
  },
  error: {
    bg: 'bg-slate-500',
    ring: 'ring-slate-400/30',
    glow: 'rgba(100, 116, 139, 0.3)',
    label: 'Erreur',
    labelColor: 'text-slate-400',
  },
};

export function VoiceInterface({
  mode,
  onUserMessage,
  position = 'bottom',
  welcomeText,
}: VoiceInterfaceProps) {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardInput, setKeyboardInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    voiceState,
    transcript,
    interimTranscript,
    lastResponse,
    error,
    capabilities,
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stop,
    clearTranscript,
    clearError,
  } = useMaellisVoice({
    lang: 'fr-FR',
    autoRestart: false,
    onTranscript: (text, isFinal) => {
      if (!isFinal) return;
      // Déclencher la réponse simulée
      if (onUserMessage) {
        const response = onUserMessage(text.toLowerCase());
        if (typeof response === 'string' && response) {
          setTimeout(() => speak(response), 300);
        }
      }
    },
  });

  // Auto-scroll vers le bas du chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimTranscript, lastResponse]);

  // Soumission clavier
  const handleKeyboardSubmit = useCallback(() => {
    if (!keyboardInput.trim()) return;
    const text = keyboardInput.trim();
    setKeyboardInput('');
    setShowKeyboard(false);

    if (onUserMessage) {
      const response = onUserMessage(text.toLowerCase());
      if (typeof response === 'string' && response) {
        // Mettre à jour le transcript manuellement
        clearTranscript();
        setTimeout(() => speak(response), 300);
      }
    }
  }, [keyboardInput, onUserMessage, speak, clearTranscript]);

  const colors = STATE_COLORS[voiceState];

  // Contenu du composant
  const interfaceContent = (
    <>
      {/* ═══════════════════════════════════════════════════════════
          1. Erreur Navigateur (si Web Speech API non supportée)
          ═══════════════════════════════════════════════════════════ */}
      {!capabilities.sttSupported && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200"
        >
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Reconnaissance vocale non disponible
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Utilisez Chrome ou Edge sur desktop/tablette Android.
            </p>
          </div>
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
          >
            <Keyboard className="w-3.5 h-3.5" />
            Mode clavier
          </button>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          2. Zone de Transcript (sous-titres)
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {(interimTranscript || transcript || lastResponse || welcomeText) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-lg overflow-hidden"
          >
            {/* Transcript utilisateur */}
            {(interimTranscript || transcript) && (
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-start gap-2">
                  <Mic className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                      Vous
                    </p>
                    <p className="text-sm text-slate-700">
                      {interimTranscript ? (
                        <span className="italic text-slate-400">{interimTranscript}</span>
                      ) : (
                        transcript
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Réponse Maellis */}
            {lastResponse && !interimTranscript && (
              <div className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                      Maellis
                    </p>
                    <p className="text-sm text-slate-700">{lastResponse}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Message d'accueil */}
            {welcomeText && !interimTranscript && !transcript && !lastResponse && (
              <div className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-500 italic">{welcomeText}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            {transcript && (
              <div className="px-4 py-2 bg-slate-50 flex items-center justify-between">
                <button
                  onClick={clearTranscript}
                  className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Effacer
                </button>
                <button
                  onClick={() => stop()}
                  className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-600 transition-colors"
                >
                  <MicOff className="w-3 h-3" />
                  Arrêter
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          3. Clavier Fallback
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showKeyboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-slate-200 shadow-md">
              <input
                type="text"
                value={keyboardInput}
                onChange={(e) => setKeyboardInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleKeyboardSubmit()}
                placeholder="Tapez votre message..."
                className="flex-1 px-3 py-2 text-sm bg-transparent border-none outline-none placeholder:text-slate-400"
                autoFocus
              />
              <button
                onClick={handleKeyboardSubmit}
                disabled={!keyboardInput.trim()}
                className="px-3 py-2 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-blue-500 transition-colors"
              >
                Envoyer
              </button>
              <button
                onClick={() => { setShowKeyboard(false); setKeyboardInput(''); }}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          4. Bouton Micro + Contrôles
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-center gap-3">
        {/* Bouton clavier */}
        <motion.button
          onClick={() => setShowKeyboard(!showKeyboard)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            showKeyboard
              ? 'bg-blue-100 text-blue-600'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
          title="Mode clavier"
        >
          <Keyboard className="w-4 h-4" />
        </motion.button>

        {/* Bouton Micro principal (cercle animé) */}
        <motion.button
          onClick={toggleListening}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          disabled={voiceState === 'error' && !capabilities.sttSupported}
          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-xl transition-all disabled:opacity-50"
          style={{
            backgroundColor: voiceState === 'idle' ? '#3b82f6' : undefined,
          }}
        >
          {/* Anneau de pulsation */}
          {(isListening || isSpeaking) && (
            <>
              <motion.div
                className={`absolute inset-0 rounded-full ${colors.bg} opacity-30`}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className={`absolute inset-0 rounded-full ${colors.bg} opacity-20`}
                animate={{
                  scale: [1, 1.6, 1],
                  opacity: [0.2, 0, 0.2],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.3,
                }}
              />
              {/* Ondes sonores pour l'écoute */}
              {isListening && (
                <>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full bg-red-400/20"
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                      animate={{
                        scale: [1, 1 + 0.3 * (i + 1), 1],
                        opacity: [0.15, 0, 0.15],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </>
              )}
              {/* Halo vert pour la parole */}
              {isSpeaking && (
                <motion.div
                  className="absolute -inset-2 rounded-full bg-emerald-400/20"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </>
          )}

          {/* Glow */}
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-0 transition-opacity duration-300"
            style={{
              backgroundColor: colors.glow,
              opacity: isListening || isSpeaking ? 0.6 : 0,
            }}
          />

          {/* Icône */}
          <div
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white transition-colors duration-300 ${colors.bg}`}
          >
            {isListening ? (
              <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
            ) : isSpeaking ? (
              <Volume2 className="w-7 h-7 sm:w-8 sm:h-8" />
            ) : (
              <Mic className="w-7 h-7 sm:w-8 sm:h-8 opacity-80" />
            )}
          </div>
        </motion.button>

        {/* Bouton stop */}
        {(isListening || isSpeaking) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => { stopListening(); stop(); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
            title="Arrêter"
          >
            <MicOff className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* État label */}
      <motion.p
        key={voiceState}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-xs font-medium text-center ${colors.labelColor}`}
      >
        {voiceState === 'listening' && 'Parlez maintenant...'}
        {voiceState === 'speaking' && 'Maellis répond...'}
        {voiceState === 'idle' && 'Appuyez sur le micro pour parler'}
        {voiceState === 'error' && error || 'Erreur'}
      </motion.p>

      {/* Erreur avec dismiss */}
      <AnimatePresence>
        {error && capabilities.sttSupported && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-xs text-red-500"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="hover:text-red-700">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={chatEndRef} />
    </>
  );

  /* ── Rendu selon position ── */
  if (position === 'inline') {
    return (
      <div className="w-full max-w-md mx-auto space-y-3 py-4">
        {interfaceContent}
      </div>
    );
  }

  // Position "bottom" — fixé en bas de l'écran
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-[80]"
    >
      {/* Bandeau mode (indicateur subtil) */}
      <div className="bg-gradient-to-t from-white via-white/95 to-transparent pt-8 pb-2 px-4">
        <div className="max-w-lg mx-auto flex items-center gap-2 mb-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                voiceState === 'listening'
                  ? '#ef4444'
                  : voiceState === 'speaking'
                  ? '#10b981'
                  : '#3b82f6',
            }}
          />
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            {mode === 'particulier' ? 'Famille Martin' : 'Villa Azur — Airbnb'}
          </span>
          <span className="text-[10px] text-slate-300">|</span>
          <span className={`text-[10px] ${colors.labelColor}`}>
            {colors.label}
          </span>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200/60 px-4 pb-5 pt-2">
        <div className="max-w-lg mx-auto space-y-3">
          {interfaceContent}
        </div>
      </div>
    </motion.div>
  );
}
