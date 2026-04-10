'use client';

/* ═══════════════════════════════════════════════════════
   AUDIO ORB — Maellis Voice Assistant (ASR + LLM + TTS)

   Reliable push-to-talk orb using HTTP pipeline:
   Microphone → /api/demo/voice (ASR → LLM → TTS) → Speaker

   Usage:
     <AudioOrb
       systemPrompt="Tu es Maellis..."
       onTranscript={(text) => console.log(text)}
       onResponse={(text) => console.log(text)}
     />
   ═══════════════════════════════════════════════════════ */

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Mic, Volume2, Sparkles, Loader2, MessageSquare, Send,
} from 'lucide-react';
import { useAudioAssistant, type AudioState } from '@/hooks/useAudioAssistant';

interface AudioOrbProps {
  systemPrompt?: string;
  voice?: string;
  compact?: boolean;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
}

/* ─── Animation Variants ─── */

const idleGlow: Variants = {
  animate: {
    boxShadow: [
      '0 0 30px rgba(245,158,11,0.2), 0 0 60px rgba(245,158,11,0.08)',
      '0 0 50px rgba(245,158,11,0.35), 0 0 100px rgba(245,158,11,0.15)',
      '0 0 30px rgba(245,158,11,0.2), 0 0 60px rgba(245,158,11,0.08)',
    ],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
};

const pulseRing1: Variants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.6, 1],
    opacity: [0.5, 0, 0.5],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
  exit: { scale: 1.2, opacity: 0 },
};

const pulseRing2: Variants = {
  initial: { scale: 1, opacity: 0.25 },
  animate: {
    scale: [1, 2, 1],
    opacity: [0.25, 0, 0.25],
    transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
  },
  exit: { scale: 1.4, opacity: 0 },
};

const processingSpin: Variants = {
  animate: {
    rotate: [0, 360],
    transition: { duration: 2, repeat: Infinity, ease: 'linear' },
  },
};

const slideUp: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.2 } },
};

/* ─── Sound Wave Bars ─── */

function SoundWaveBars({ compact }: { compact: boolean }) {
  const h = compact ? 'h-2.5' : 'h-4';
  const gap = compact ? 'gap-0.5' : 'gap-1';
  return (
    <div className={`flex items-center justify-center ${gap}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className={`${h} w-[3px] rounded-full bg-white`}
          animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }}
        />
      ))}
    </div>
  );
}

/* ─── Status Badge ─── */

function StatusBadge({ state }: { state: AudioState }) {
  const cfg: Record<AudioState, { label: string; color: string; icon: React.ReactNode }> = {
    idle: { label: 'Maellis Voice', color: 'bg-amber-50 text-amber-600 border-amber-200/60', icon: <Sparkles className="w-3 h-3" /> },
    recording: { label: "J'écoute...", color: 'bg-amber-50 text-amber-600 border-amber-200/60', icon: <Mic className="w-3 h-3" /> },
    processing: { label: 'Réflexion...', color: 'bg-violet-50 text-violet-600 border-violet-200/60', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    speaking: { label: 'Maellis répond...', color: 'bg-sky-50 text-sky-600 border-sky-200/60', icon: <Volume2 className="w-3 h-3" /> },
    error: { label: 'Erreur', color: 'bg-red-50 text-red-500 border-red-200/60', icon: <MessageSquare className="w-3 h-3" /> },
  };
  const { label, color, icon } = cfg[state];
  return (
    <motion.span
      key={state}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border shadow-sm ${color}`}
    >
      {icon}
      {label}
    </motion.span>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export function AudioOrb({
  compact = false,
  onTranscript,
  onResponse,
}: AudioOrbProps) {
  const audio = useAudioAssistant({ onTranscript, onResponse });

  // Text chat fallback state
  const [textMode, setTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState('');
  const [chatError, setChatError] = useState('');
  const chatHistoryRef = useRef<Array<{ role: string; content: string }>>([]);

  const orbSize = compact ? 'w-20 h-20' : 'w-32 h-32 sm:w-36 sm:h-36';
  const iconSize = compact ? 'w-8 h-8' : 'w-14 h-14 sm:w-16 sm:h-16';

  /* ─── Push-to-talk handlers ─── */

  const handlePointerDown = useCallback(async (e: React.PointerEvent) => {
    e.preventDefault();
    if (textMode) return;
    if (audio.state === 'speaking') {
      audio.stopSpeaking();
      return;
    }
    await audio.toggleRecording();
  }, [audio, textMode]);

  const handlePointerUp = useCallback(async (e: React.PointerEvent) => {
    e.preventDefault();
    if (textMode) return;
    if (audio.state === 'recording') {
      await audio.toggleRecording(); // stops recording & processes
    }
  }, [audio, textMode]);

  /* ─── Text chat submit ─── */

  const handleTextSubmit = useCallback(async () => {
    const msg = textInput.trim();
    if (!msg || chatLoading) return;
    setTextInput('');
    setChatLoading(true);
    setChatError('');
    setChatResponse('');

    try {
      const res = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: chatHistoryRef.current }),
      });
      const data = await res.json();
      if (data.response) {
        setChatResponse(data.response);
        chatHistoryRef.current.push(
          { role: 'user', content: msg },
          { role: 'assistant', content: data.response },
        );
        if (chatHistoryRef.current.length > 12) {
          chatHistoryRef.current = chatHistoryRef.current.slice(-8);
        }
        onResponse?.(data.response);
      } else {
        setChatError(data.error || 'Erreur inconnue');
      }
    } catch {
      setChatError('Erreur de connexion.');
    } finally {
      setChatLoading(false);
    }
  }, [textInput, chatLoading, onResponse]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  }, [handleTextSubmit]);

  /* ─── Orb visual style ─── */

  const getOrbStyle = (state: AudioState) => {
    switch (state) {
      case 'idle':
        return { bg: 'from-amber-400 via-orange-400 to-amber-500', shadow: '0 0 80px rgba(245,158,11,0.35), 0 0 40px rgba(245,158,11,0.2), 0 25px 70px rgba(245,158,11,0.25)' };
      case 'recording':
        return { bg: 'from-amber-500 via-orange-500 to-red-400', shadow: '0 0 100px rgba(245,158,11,0.5), 0 0 50px rgba(239,68,68,0.3), 0 25px 70px rgba(245,158,11,0.35)' };
      case 'processing':
        return { bg: 'from-violet-400 via-purple-500 to-violet-600', shadow: '0 0 60px rgba(139,92,246,0.3)' };
      case 'speaking':
        return { bg: 'from-sky-400 via-blue-500 to-indigo-500', shadow: '0 0 100px rgba(14,165,233,0.4), 0 0 50px rgba(99,102,241,0.2), 0 25px 70px rgba(14,165,233,0.3)' };
      case 'error':
        return { bg: 'from-red-400 via-red-500 to-rose-500', shadow: '0 0 60px rgba(239,68,68,0.3)' };
    }
  };

  const orbStyle = getOrbStyle(textMode ? 'idle' : audio.state);

  const renderOrbContent = () => {
    if (textMode) {
      return chatLoading ? (
        <motion.div variants={processingSpin} animate="animate">
          <Loader2 className={`${iconSize} text-white`} />
        </motion.div>
      ) : (
        <MessageSquare className={`${iconSize} text-white`} />
      );
    }

    switch (audio.state) {
      case 'idle':
        return <Mic className={`${iconSize} text-white drop-shadow-lg`} />;
      case 'recording':
        return <Mic className={`${iconSize} text-white animate-pulse`} />;
      case 'processing':
        return <motion.div variants={processingSpin} animate="animate"><Sparkles className={`${iconSize} text-white`} /></motion.div>;
      case 'speaking':
        return <SoundWaveBars compact={compact} />;
      case 'error':
        return <MessageSquare className={`${iconSize} text-white`} />;
    }
  };

  const displayState: AudioState = textMode ? 'idle' : audio.state;
  const displayResponse = textMode ? chatResponse : audio.response;
  const displayError = textMode ? chatError : audio.error;
  const displayTranscript = !textMode ? audio.transcript : '';

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-5">
      {/* Status badge */}
      <AnimatePresence mode="wait">
        <StatusBadge state={displayState} />
      </AnimatePresence>

      {/* Orb — push to talk */}
      <motion.button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={(e) => {
          if (audio.state === 'recording') handlePointerUp(e);
        }}
        whileHover={audio.state === 'idle' ? { scale: 1.08 } : undefined}
        whileTap={{ scale: 0.95 }}
        className={`relative ${orbSize} rounded-full flex items-center justify-center cursor-pointer select-none touch-manipulation bg-gradient-to-br border-4 border-white/90 transition-all duration-500 ${orbStyle.bg}`}
        style={{ boxShadow: orbStyle.shadow }}
        aria-label={
          textMode
            ? 'Mode chat texte'
            : audio.state === 'idle'
              ? 'Maintenez pour parler'
              : audio.state === 'recording'
                ? "J'écoute — relâchez pour envoyer"
                : audio.state === 'speaking'
                  ? 'Cliquez pour arrêter'
                  : 'Traitement...'
        }
      >
        {/* Idle glow */}
        {(audio.state === 'idle' || textMode) && (
          <motion.div
            className="absolute inset-0 rounded-full opacity-50"
            style={{ background: 'radial-gradient(circle, transparent 40%, rgba(245,158,11,0.1) 100%)' }}
            variants={idleGlow}
            animate="animate"
          />
        )}

        {/* Pulse rings when recording */}
        <AnimatePresence>
          {audio.state === 'recording' && (
            <>
              <motion.span key="r1" variants={pulseRing1} initial="initial" animate="animate" exit="exit"
                className={`absolute rounded-full border-2 border-amber-300/40 ${compact ? 'w-28 h-28' : 'w-44 h-44 sm:w-52 sm:h-52'}`} />
              <motion.span key="r2" variants={pulseRing2} initial="initial" animate="animate" exit="exit"
                className={`absolute rounded-full border border-amber-300/20 ${compact ? 'w-32 h-32' : 'w-56 h-56 sm:w-64 sm:h-64'}`} />
            </>
          )}
        </AnimatePresence>

        <div className="relative z-10">{renderOrbContent()}</div>
      </motion.button>

      {/* Prompt text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={textMode ? 'text' : audio.state}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-center text-xs sm:text-sm text-slate-500 max-w-[280px]"
        >
          {textMode && !chatLoading && !chatResponse && 'Écrivez votre message ci-dessous'}
          {textMode && chatLoading && <span className="font-semibold text-violet-600">Maellis réfléchit...</span>}
          {!textMode && audio.state === 'idle' && (
            <>Maintenez pour parler à <span className="font-semibold text-amber-600">Maellis</span></>
          )}
          {!textMode && audio.state === 'recording' && (
            <span className="font-semibold text-amber-600">Maellis vous écoute... relâchez</span>
          )}
          {!textMode && audio.state === 'processing' && 'Maellis réfléchit...'}
          {!textMode && audio.state === 'speaking' && (
            <span className="font-semibold text-sky-600">Maellis répond...</span>
          )}
          {!textMode && audio.state === 'error' && (
            <span className="text-red-500">{audio.error ?? 'Erreur'}</span>
          )}
        </motion.p>
      </AnimatePresence>

      {/* Text input for text mode */}
      {textMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez une question à Maellis..."
              disabled={chatLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 disabled:opacity-50 transition-all"
            />
            <button
              onClick={handleTextSubmit}
              disabled={chatLoading || !textInput.trim()}
              className="px-3 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Envoyer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Toggle text/voice */}
      {!textMode && audio.state === 'error' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setTextMode(true)}
          className="text-xs text-amber-600 hover:text-amber-700 underline underline-offset-2 transition-colors"
        >
          Passer en mode texte
        </motion.button>
      )}

      {textMode && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => { setTextMode(false); setChatResponse(''); setChatError(''); }}
          className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
        >
          Essayer le mode vocal
        </motion.button>
      )}

      {/* Transcript */}
      <AnimatePresence>
        {displayTranscript && (
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-xs text-center px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm"
          >
            <p className="text-[10px] text-slate-400 mb-0.5">Vous avez dit :</p>
            <p className="text-sm text-slate-700 font-medium leading-snug">&quot;{displayTranscript}&quot;</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {displayError && (
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-sm text-center px-4 py-2 rounded-xl bg-red-50 border border-red-200/60 shadow-sm"
          >
            <p className="text-xs text-red-600">{displayError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response */}
      <AnimatePresence>
        {displayResponse && (
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-sm text-center px-4 py-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 shadow-sm"
          >
            <p className="text-[10px] text-amber-500 mb-0.5 flex items-center justify-center gap-1">
              <Volume2 className="w-3 h-3" />
              Maellis
            </p>
            <p className="text-sm text-slate-700 font-medium leading-snug">{displayResponse}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


