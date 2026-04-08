'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageSquare } from 'lucide-react';
import { horoscopeData, horoscopeSigns } from '@/lib/mock-data-real';

interface HoroscopeWidgetProps {
  defaultSign?: string;
}

export function HoroscopeWidget({ defaultSign = 'taureau' }: HoroscopeWidgetProps) {
  const [selectedSign, setSelectedSign] = useState(defaultSign);
  const h = horoscopeData[selectedSign];

  if (!h) return null;

  return (
    <div className="space-y-4">
      {/* Sign selector */}
      <div className="flex flex-wrap gap-2">
        {horoscopeSigns.map((key) => {
          const sign = horoscopeData[key];
          if (!sign) return null;
          return (
            <button
              key={key}
              onClick={() => setSelectedSign(key)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedSign === key
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-purple-300'
              }`}
            >
              <span className="mr-1">{sign.icon}</span>
              {sign.signe}
            </button>
          );
        })}
      </div>

      {/* Horoscope detail */}
      <motion.div
        key={selectedSign}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg border border-indigo-100 overflow-hidden"
      >
        <div className="p-4 sm:p-6 border-b border-indigo-100 bg-white/50">
          <h3 className="text-xl sm:text-2xl font-bold text-indigo-900 flex items-center gap-2">
            <span className="text-3xl">{h.icon}</span>
            {h.signe}
            <span className="text-sm font-normal text-indigo-500">{h.periode}</span>
          </h3>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <div className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Heart size={14} /> Humeur
            </div>
            <p className="text-slate-700 italic">&ldquo;{h.humeur}&rdquo;</p>
          </div>
          <div>
            <div className="text-xs font-bold text-pink-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <MessageSquare size={14} /> Amour
            </div>
            <p className="text-slate-700">{h.amour}</p>
          </div>
          <div>
            <div className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">⭐ Travail</div>
            <p className="text-slate-700">{h.travail}</p>
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-1">💰 Argent</div>
            <p className="text-slate-700">{h.argent}</p>
          </div>
          <div>
            <div className="text-xs font-bold text-amber-500 uppercase tracking-wide mb-1">💡 Conseil</div>
            <p className="text-slate-700 font-medium">{h.conseil}</p>
          </div>
          <div className="pt-3 border-t border-indigo-100">
            <p className="text-sm text-slate-600 leading-relaxed">{h.texte}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
