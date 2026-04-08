'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Clock, ChevronRight, ExternalLink } from 'lucide-react';
import type { NewsItem } from '@/lib/mock-data-real';

interface NewsWidgetProps {
  news: NewsItem[];
}

export function NewsWidget({ news }: NewsWidgetProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Newspaper className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Actualités</h3>
              <p className="text-[10px] text-slate-500">France Info &bull; Le Monde</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">Live</span>
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
        </div>
      </div>

      {/* News Items */}
      <div className="divide-y divide-white/[0.04]">
        <AnimatePresence>
          {news.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={`p-3.5 cursor-pointer transition-all duration-200 hover:bg-white/[0.03] ${
                expanded === item.id ? 'bg-white/[0.04]' : ''
              }`}
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
            >
              <div className="flex items-start gap-3">
                {/* Source badge */}
                <div className={`flex-shrink-0 mt-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold ${
                  item.source === 'France Info'
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-purple-500/10 text-purple-400'
                }`}>
                  {item.source === 'France Info' ? 'FI' : 'LM'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm leading-snug transition-all ${
                    i === 0 ? 'text-white font-semibold' : 'text-slate-300'
                  }`}>
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-white/[0.04]">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-600">
                      <Clock className="w-2.5 h-2.5" />
                      {item.time}
                    </div>
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 text-slate-600 flex-shrink-0 mt-1 transition-transform duration-200 ${
                  expanded === item.id ? 'rotate-90' : ''
                }`} />
              </div>

              {/* Expanded view */}
              <AnimatePresence>
                {expanded === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-white/[0.06]">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Article complet disponible sur {item.source}. Consultez le site pour plus de détails sur cette actualité.
                      </p>
                      <button className="mt-2 flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors">
                        Lire sur {item.source} <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.06]">
        <button className="w-full text-center text-[10px] text-slate-500 hover:text-slate-400 transition-colors">
          Voir toutes les actualités →
        </button>
      </div>
    </div>
  );
}
