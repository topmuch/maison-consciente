'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, Briefcase, Coins, Lightbulb, ChevronDown } from 'lucide-react';
import { horoscopeData, horoscopeSigns } from '@/lib/mock-data-real';
import type { HoroscopeEntry } from '@/lib/mock-data-real';

interface HoroscopeWidgetProps {
  defaultSign?: string;
}

export function HoroscopeWidget({ defaultSign = 'taureau' }: HoroscopeWidgetProps) {
  const [selectedSign, setSelectedSign] = useState(defaultSign);
  const [showSelector, setShowSelector] = useState(false);
  const data: HoroscopeEntry = horoscopeData[selectedSign];

  const sections = [
    { icon: Heart, label: 'Amour', text: data.amour, color: 'text-rose-400 bg-rose-500/10' },
    { icon: Briefcase, label: 'Travail', text: data.travail, color: 'text-blue-400 bg-blue-500/10' },
    { icon: Coins, label: 'Argent', text: data.argent, color: 'text-amber-400 bg-amber-500/10' },
    { icon: Lightbulb, label: 'Conseil', text: data.conseil, color: 'text-emerald-400 bg-emerald-500/10' },
  ];

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
      {/* Header with sign selector */}
      <div className="p-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Star className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Horoscope</h3>
              <p className="text-[10px] text-slate-500">Mon-Horoscope-du-Jour</p>
            </div>
          </div>

          {/* Sign selector */}
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-all"
          >
            <span className="text-base">{data.icon}</span>
            <span className="text-xs font-medium text-slate-300">{data.signe}</span>
            <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${showSelector ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Sign selector dropdown */}
        <AnimatePresence>
          {showSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-4 gap-1 mt-3 p-2 bg-white/[0.02] rounded-xl">
                {horoscopeSigns.map((sign) => {
                  const h = horoscopeData[sign];
                  return (
                    <button
                      key={sign}
                      onClick={() => { setSelectedSign(sign); setShowSelector(false); }}
                      className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all ${
                        selectedSign === sign
                          ? 'bg-amber-500/15 border border-amber-500/30'
                          : 'hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <span className="text-lg">{h.icon}</span>
                      <span className={`text-[9px] font-medium ${
                        selectedSign === sign ? 'text-amber-300' : 'text-slate-500'
                      }`}>
                        {h.signe}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main sign display */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20 flex items-center justify-center">
            <span className="text-3xl">{data.icon}</span>
          </div>
          <div>
            <h4 className="text-lg font-serif font-semibold text-white">{data.signe}</h4>
            <p className="text-[10px] text-slate-500">{data.periode}</p>
          </div>
        </div>

        {/* Mood text */}
        <div className="bg-white/[0.02] rounded-xl p-3 mb-4">
          <p className="text-xs text-slate-400 leading-relaxed italic">
            &ldquo;{data.texte}&rdquo;
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-2.5">
          {sections.map((section) => (
            <motion.div
              key={section.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5"
            >
              <div className={`p-1.5 rounded-lg ${section.color}`}>
                <section.icon className="w-3 h-3" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{section.label}</p>
                <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{section.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
