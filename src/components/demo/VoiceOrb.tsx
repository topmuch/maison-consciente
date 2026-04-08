'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2 } from 'lucide-react';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceOrbProps {
  onTranscript?: (text: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceOrb({ onTranscript, size = 'md' }: VoiceOrbProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [pulseCount, setPulseCount] = useState(0);
  const animationRef = useRef<ReturnType<typeof setInterval>>();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const sizeMap = {
    sm: { orb: 'w-10 h-10', ring: 'w-14 h-14', icon: 'w-4 h-4' },
    md: { orb: 'w-16 h-16', ring: 'w-24 h-24', icon: 'w-6 h-6' },
    lg: { orb: 'w-24 h-24', ring: 'w-36 h-36', icon: 'w-8 h-8' },
  };

  const sizes = sizeMap[size];

  const handleClick = useCallback(() => {
    if (state === 'idle' || state === 'listening') {
      if (state === 'idle') {
        // Start listening
        const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
        
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.lang = 'fr-FR';
          recognition.continuous = false;
          recognition.interimResults = true;

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            const t = Array.from(event.results)
              .map((r) => r[0].transcript)
              .join('');
            setTranscript(t);
            onTranscript?.(t);
          };

          recognition.onend = () => {
            setState('processing');
            setTimeout(() => {
              setState('speaking');
              setTimeout(() => setState('idle'), 3000);
            }, 1000);
          };

          recognition.onerror = () => {
            // Fallback to simulation
            simulateListening();
          };

          recognitionRef.current = recognition;
          recognition.start();
          setState('listening');
        } else {
          simulateListening();
        }
      } else {
        // Stop listening
        recognitionRef.current?.stop();
        setState('processing');
        setTimeout(() => {
          setState('speaking');
          setTimeout(() => setState('idle'), 3000);
        }, 1000);
      }
    }
  }, [state, onTranscript]);

  const simulateListening = () => {
    setState('listening');
    const phrases = [
      "Quelle est la météo aujourd'hui ?",
      "Allume la lumière du salon",
      "Rappelle-moi d'appeler Mamie",
      "Quelles sont les actualités ?",
      "Donne-moi mon horoscope",
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < phrase.length) {
        setTranscript(phrase.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setState('processing');
        setTimeout(() => {
          const responses = [
            "La météo est ensoleillée, 18°C à Bordeaux ☀️",
            "Lumière du salon allumée 💡",
            "Rappel ajouté : Appeler Mamie à 18h00 📞",
            "Voici les dernières actualités... 📰",
            "Votre horoscope du jour est prêt ✨",
          ];
          setTranscript(responses[Math.floor(Math.random() * responses.length)]);
          setState('speaking');
          setTimeout(() => {
            setState('idle');
            setTranscript('');
          }, 3000);
        }, 800);
      }
    }, 60);

    animationRef.current = typingInterval;
  };

  // Pulse animation for listening state
  useEffect(() => {
    if (state === 'listening') {
      const interval = setInterval(() => {
        setPulseCount((prev) => prev + 1);
      }, 600);
      return () => clearInterval(interval);
    }
  }, [state]);

  const stateColors = {
    idle: 'bg-slate-700/50 border-slate-600/50',
    listening: 'bg-amber-500/20 border-amber-500/40',
    processing: 'bg-blue-500/20 border-blue-500/40',
    speaking: 'bg-emerald-500/20 border-emerald-500/40',
  };

  const orbColors = {
    idle: 'from-slate-600 to-slate-700',
    listening: 'from-amber-400 to-orange-500',
    processing: 'from-blue-400 to-indigo-500',
    speaking: 'from-emerald-400 to-teal-500',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Pulse rings for listening */}
      <div className="relative flex items-center justify-center">
        <AnimatePresence>
          {state === 'listening' && (
            <>
              <motion.div
                key={`ring-${pulseCount}`}
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 1.4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                className={`absolute ${sizes.ring} rounded-full border-2 border-amber-400/30`}
              />
              <motion.div
                key={`ring2-${pulseCount}`}
                initial={{ scale: 0.8, opacity: 0.4 }}
                animate={{ scale: 1.6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, delay: 0.3 }}
                className={`absolute ${sizes.ring} rounded-full border border-amber-400/20`}
              />
            </>
          )}
          {state === 'speaking' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.5, 0.1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`absolute ${sizes.ring} rounded-full border border-emerald-400/20`}
            />
          )}
        </AnimatePresence>

        {/* Main orb */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleClick}
          className={`relative ${sizes.orb} rounded-full bg-gradient-to-br ${orbColors[state]} border-2 ${stateColors[state].split(' ')[1]} flex items-center justify-center shadow-lg cursor-pointer transition-colors duration-500`}
        >
          {state === 'idle' && <Mic className={`${sizes.icon} text-white/80`} />}
          {state === 'listening' && (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <Mic className={`${sizes.icon} text-white`} />
            </motion.div>
          )}
          {state === 'processing' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <MicOff className={`${sizes.icon} text-white/80`} />
            </motion.div>
          )}
          {state === 'speaking' && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            >
              <Volume2 className={`${sizes.icon} text-white`} />
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* State label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={state}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-[10px] font-medium"
        >
          {state === 'idle' && <span className="text-slate-500">Appuyez pour parler</span>}
          {state === 'listening' && <span className="text-amber-400">Écoute en cours...</span>}
          {state === 'processing' && <span className="text-blue-400">Analyse...</span>}
          {state === 'speaking' && <span className="text-emerald-400">Maellis répond...</span>}
        </motion.p>
      </AnimatePresence>

      {/* Transcript */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-[200px] text-center"
          >
            <p className={`text-xs px-3 py-1.5 rounded-lg ${
              state === 'speaking'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-white/[0.04] text-slate-300 border border-white/[0.06]'
            }`}>
              {transcript}
              {state === 'listening' && <span className="animate-pulse">|</span>}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
