'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, MessageCircle } from 'lucide-react';
import type { Activity } from '@/lib/mock-data-real';

interface ActivityCardProps {
  activity: Activity;
  index?: number;
}

export function ActivityCard({ activity, index = 0 }: ActivityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 sm:p-5 hover:shadow-lg hover:border-amber-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-amber-700 transition">
              {activity.name}
            </h4>
            {activity.isPartner && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">
                Partenaire
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-2">{activity.description}</p>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {activity.distance}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {activity.duration}
            </span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500">{activity.category}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {activity.whatsappLink && (
            <a
              href={activity.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200 transition"
            >
              <MessageCircle size={12} /> Réserver
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
