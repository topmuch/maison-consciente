'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, MessageCircle, ExternalLink } from 'lucide-react';
import type { Activity } from '@/lib/mock-data-real';

interface ActivityCardProps {
  activity: Activity;
  index?: number;
}

export function ActivityCard({ activity, index = 0 }: ActivityCardProps) {
  const categoryColors: Record<string, string> = {
    'Bord de mer': 'from-cyan-500/20 to-blue-500/20 border-cyan-500/20',
    'Gastronomie': 'from-orange-500/20 to-red-500/20 border-orange-500/20',
    'Nature': 'from-emerald-500/20 to-green-500/20 border-emerald-500/20',
    'Découverte': 'from-purple-500/20 to-violet-500/20 border-purple-500/20',
    'Culture': 'from-rose-500/20 to-pink-500/20 border-rose-500/20',
  };

  const categoryIcons: Record<string, string> = {
    'Bord de mer': '🌊',
    'Gastronomie': '🍽️',
    'Nature': '🌿',
    'Découverte': '🔍',
    'Culture': '🎨',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-gradient-to-br ${categoryColors[activity.category] || 'from-white/[0.03] to-white/[0.01] border-white/[0.08]'} border rounded-2xl p-4 transition-all duration-300 group`}
    >
      <div className="flex items-start gap-3">
        {/* Activity icon */}
        <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center text-2xl flex-shrink-0">
          {categoryIcons[activity.category] || '📍'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white truncate">{activity.name}</h4>
            {activity.isPartner && (
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                PARTENAIRE
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-2">
            {activity.description}
          </p>

          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {activity.distance}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {activity.duration}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
        {activity.whatsappLink ? (
          <a
            href={activity.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Réserver via WhatsApp
          </a>
        ) : (
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs font-medium hover:bg-white/[0.06] transition-all">
            <ExternalLink className="w-3.5 h-3.5" />
            Plus d&apos;infos
          </button>
        )}
      </div>
    </motion.div>
  );
}
