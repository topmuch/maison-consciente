'use client';

import { motion } from 'framer-motion';
import type { NewsItem } from '@/lib/mock-data-real';

interface NewsWidgetProps {
  news: NewsItem[];
}

export function NewsWidget({ news }: NewsWidgetProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          📰 Actualités du jour
        </h3>
        <p className="text-sm text-slate-500 mt-1">Cliquez sur un titre pour écouter</p>
      </div>

      <div className="divide-y divide-slate-100">
        {news.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-4 sm:p-5 hover:bg-blue-50 transition cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-[80px] sm:min-w-[90px] text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded text-center flex-shrink-0">
                {item.source}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 group-hover:text-blue-700 transition leading-snug">
                  {item.title}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <span className="text-xs text-slate-400">{item.time}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
