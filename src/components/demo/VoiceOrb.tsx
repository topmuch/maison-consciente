'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

interface VoiceOrbProps {
  onTranscript?: (text: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceOrb({ size = 'md' }: VoiceOrbProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const handleClick = () => {
    if (isSpeaking) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        'Bonjour ! Je suis Maellis, votre assistant. Comment puis-je vous aider ?'
      );
      utterance.lang = 'fr-FR';
      utterance.rate = 1.05;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="text-center">
      <button
        onClick={handleClick}
        className={`mx-auto ${sizeClasses[size]} rounded-full flex items-center justify-center text-white shadow-xl transition-all transform ${
          isSpeaking
            ? 'bg-red-500 animate-pulse scale-110'
            : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:scale-105'
        }`}
      >
        {isSpeaking ? (
          <MicOff className={iconSizes[size]} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>
      <p className="text-sm text-slate-500 mt-3">
        {isSpeaking ? '🔊 Je parle...' : '🎤 Appuyez pour parler'}
      </p>
    </div>
  );
}
