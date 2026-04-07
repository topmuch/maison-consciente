'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Filter,
  MapPin,
  User,
  Loader2,
  ArrowDown,
  Utensils,
  Bed,
  Bath,
  Sofa,
  DoorOpen,
  Lamp,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ═══════════════════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════════════════ */

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils, Bed, Bath, Sofa, DoorOpen, Lamp, MapPin,
};

const COLOR_MAP: Record<string, { bg: string; text: string; hex: string }> = {
  gold: { bg: 'bg-[var(--accent-primary)]/15', text: 'text-[var(--accent-primary)]', hex: '#d4a853' },
  copper: { bg: 'bg-[#c77d5a]/15', text: 'text-[#c77d5a]', hex: '#c77d5a' },
  violet: { bg: 'bg-[#8b5cf6]/15', text: 'text-[#8b5cf6]', hex: '#8b5cf6' },
  emerald: { bg: 'bg-[#34d399]/15', text: 'text-[#34d399]', hex: '#34d399' },
  rose: { bg: 'bg-[#fb7185]/15', text: 'text-[#fb7185]', hex: '#fb7185' },
  sky: { bg: 'bg-[#38bdf8]/15', text: 'text-[#38bdf8]', hex: '#38bdf8' },
};

interface InteractionItem {
  id: string;
  user?: { name: string; avatar?: string };
  userName?: string;
  userAvatar?: string;
  zone?: { name: string; icon?: string; color?: string };
  zoneName?: string;
  zoneIcon?: string;
  zoneColor?: string;
  context?: string;
  createdAt: string;
}

interface FilterOption {
  id: string;
  name: string;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} semaine${Math.floor(days / 7) > 1 ? 's' : ''}`;
  return date.toLocaleDateString('fr-FR');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

/* ═══════════════════════════════════════════════════════════════
   INTERACTION HISTORY COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function InteractionHistory() {
  const [interactions, setInteractions] = useState<InteractionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [zones, setZones] = useState<FilterOption[]>([]);

  const fetchInteractions = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const params = new URLSearchParams({ page: pageNum.toString(), limit: '20' });
        if (zoneFilter !== 'all') params.set('zoneId', zoneFilter);
        const res = await fetch(`/api/interactions?${params}`);
        if (res.ok) {
          const data = await res.json();
          const items: InteractionItem[] = Array.isArray(data.interactions)
            ? data.interactions
            : Array.isArray(data) ? data : [];
          const mapped = items.map((item) => ({
            ...item,
            userName: item.userName || item.user?.name || 'Utilisateur',
            userAvatar: item.userAvatar || item.user?.avatar,
            zoneName: item.zoneName || item.zone?.name || 'Zone',
            zoneIcon: item.zoneIcon || item.zone?.icon,
            zoneColor: item.zoneColor || item.zone?.color,
          }));
          if (append) setInteractions((prev) => [...prev, ...mapped]);
          else setInteractions(mapped);
          setHasMore(mapped.length >= 20);

          if (pageNum === 1) {
            const zoneMap = new Map<string, string>();
            mapped.forEach((item) => {
              if (item.zoneName) zoneMap.set(item.zoneName, item.zoneName);
            });
            setZones(Array.from(zoneMap.entries()).map(([name]) => ({ id: name, name })));
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [zoneFilter]
  );

  useEffect(() => {
    setPage(1);
    fetchInteractions(1);
  }, [fetchInteractions]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchInteractions(nextPage, true);
  };

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gradient-gold">
          Historique
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Toutes les interactions enregistrées dans votre foyer
        </p>
      </motion.div>

      {/* ── Filter Bar ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="flex items-center gap-3"
      >
        <div className="flex items-center gap-2 text-[#64748b]">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtrer :</span>
        </div>
        <Select value={zoneFilter} onValueChange={setZoneFilter}>
          <SelectTrigger className="w-full sm:w-52 glass bg-white/[0.04] border-white/[0.08] text-[#94a3b8] hover:border-white/[0.15] transition-all duration-300">
            <MapPin className="w-4 h-4 mr-2 text-[#475569]" />
            <SelectValue placeholder="Toutes les zones" />
          </SelectTrigger>
          <SelectContent className="glass-strong rounded-xl border-white/[0.08]">
            <SelectItem value="all" className="text-[#94a3b8]">Toutes les zones</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.name} className="text-[#94a3b8]">
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* ── Interactions List ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              /* Loading skeleton */
              <div className="px-6 py-5 space-y-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <Skeleton className="h-10 w-10 rounded-full bg-white/[0.06] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24 bg-white/[0.06]" />
                        <Skeleton className="h-4 w-2 bg-white/[0.06]" />
                        <Skeleton className="h-5 w-20 bg-white/[0.06] rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-48 bg-white/[0.06]" />
                    </div>
                    <Skeleton className="h-3 w-16 bg-white/[0.06] shrink-0" />
                  </div>
                ))}
              </div>
            ) : interactions.length > 0 ? (
              /* Interaction list */
              <>
                <div className="px-5 py-3 border-b border-white/[0.04]">
                  <p className="text-xs text-[#475569] font-medium uppercase tracking-wider">
                    {interactions.length} interaction{interactions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ScrollArea className="max-h-[520px] scrollbar-luxe">
                  <div className="divide-y divide-white/[0.04]">
                    {interactions.map((item, i) => {
                      const ZoneIcon = ICON_MAP[item.zoneIcon || ''] || MapPin;
                      const colorCls = COLOR_MAP[item.zoneColor || ''] || COLOR_MAP.gold;
                      const userName = item.userName || 'Utilisateur';

                      return (
                        <motion.div
                          key={item.id || i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03, duration: 0.3 }}
                          className="flex items-start gap-3.5 px-6 py-4 hover:bg-white/[0.02] transition-all duration-300 cursor-default"
                          title={formatDate(item.createdAt)}
                        >
                          {/* User Avatar */}
                          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-[var(--accent-primary)]/30 ring-offset-2 ring-offset-transparent">
                            <AvatarFallback className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-semibold">
                              {item.userAvatar ? (
                                <img
                                  src={item.userAvatar}
                                  alt={userName}
                                  className="h-full w-full rounded-full object-cover"
                                />
                              ) : (
                                getInitials(userName)
                              )}
                            </AvatarFallback>
                          </Avatar>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-[#e2e8f0]">{userName}</span>
                              <span className="text-[#334155]">→</span>
                              <Badge
                                variant="outline"
                                className={`${colorCls.bg} ${colorCls.text} border-0 text-[10px] font-medium px-2 py-0.5 rounded-full`}
                              >
                                <ZoneIcon className="w-3 h-3 mr-1" />
                                {item.zoneName}
                              </Badge>
                            </div>
                            {item.context && (
                              <p className="text-xs text-[#64748b] mt-1.5 line-clamp-2 leading-relaxed">
                                {item.context}
                              </p>
                            )}
                          </div>

                          {/* Timestamp */}
                          <span className="text-xs text-[#475569] font-mono whitespace-nowrap shrink-0 mt-0.5">
                            {relativeTime(item.createdAt)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Load more */}
                {hasMore && interactions.length > 0 && (
                  <div className="p-4 border-t border-white/[0.04]">
                    <Button
                      variant="ghost"
                      className="w-full text-[#64748b] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-300"
                      onClick={loadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowDown className="w-4 h-4 mr-2" />
                      )}
                      Charger plus
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Empty state */
              <div className="px-6 py-20 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center mx-auto mb-4 glow-gold">
                    <Clock className="w-7 h-7 text-[var(--accent-primary)]" />
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-[#e2e8f0] mb-2">
                    Aucune interaction
                  </h3>
                  <p className="text-sm text-[#64748b] max-w-sm mx-auto">
                    {zoneFilter !== 'all'
                      ? 'Aucune interaction trouvée pour cette zone. Essayez un autre filtre.'
                      : 'Les interactions apparaîtront ici après vos premiers scans.'}
                  </p>
                </motion.div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
