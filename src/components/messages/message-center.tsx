'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  MessageSquare,
  Send,
  Plus,
  Bell,
  MapPin,
  Loader2,
  Filter,
  Clock,
  AlertTriangle,
  StickyNote,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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

interface Message {
  id: string;
  content: string;
  type: 'note' | 'reminder' | 'urgent';
  isRead: boolean;
  zoneId?: string;
  zoneName?: string;
  senderName?: string;
  senderAvatar?: string;
  createdAt: string;
}

interface ZoneOption {
  id: string;
  name: string;
}

const typeConfig = {
  note: {
    label: 'Note',
    icon: StickyNote,
    color: 'text-[#94a3b8]',
    bg: 'bg-[#94a3b8]/10',
    badgeBg: 'bg-[#94a3b8]/10',
    badgeText: 'text-[#94a3b8]',
  },
  reminder: {
    label: 'Rappel',
    icon: Bell,
    color: 'text-[#f59e0b]',
    bg: 'bg-[#f59e0b]/10',
    badgeBg: 'bg-[#f59e0b]/10',
    badgeText: 'text-[#f59e0b]',
  },
  urgent: {
    label: 'Urgent',
    icon: AlertTriangle,
    color: 'text-[#fb7185]',
    bg: 'bg-[#fb7185]/10',
    badgeBg: 'bg-[#fb7185]/10',
    badgeText: 'text-[#fb7185]',
  },
};

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
  return date.toLocaleDateString('fr-FR');
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
   MESSAGE CENTER COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function MessageCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeContent, setComposeContent] = useState('');
  const [composeType, setComposeType] = useState<'note' | 'reminder' | 'urgent'>('note');
  const [composeZoneId, setComposeZoneId] = useState<string>('');
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (zoneFilter !== 'all') {
        params.set('zoneId', zoneFilter);
      }
      const res = await fetch(`/api/messages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [zoneFilter]);

  const fetchZones = useCallback(async () => {
    try {
      const res = await fetch('/api/zones');
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data.zones) ? data.zones : Array.isArray(data) ? data : [];
        setZones(raw.map((z: { id: string; name: string }) => ({ id: z.id, name: z.name })));
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m))
      );
    } catch {
      // silent
    }
  };

  const handleSendMessage = async () => {
    if (!composeContent.trim()) {
      toast.error('Veuillez écrire un message');
      return;
    }
    setSending(true);
    try {
      const body: Record<string, string> = {
        content: composeContent.trim(),
        type: composeType,
      };
      if (composeZoneId) body.zoneId = composeZoneId;
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success('Message envoyé');
        setComposeOpen(false);
        setComposeContent('');
        setComposeType('note');
        setComposeZoneId('');
        fetchMessages();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gradient-gold">
            Messages
          </h1>
          {unreadCount > 0 && (
            <Badge className="bg-[var(--accent-primary)] text-[#0a0a12] border-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-[0_0_12px_var(--accent-primary-glow)]">
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={() => setComposeOpen(true)}
            className="bg-gradient-gold text-[#0a0a12] font-semibold shadow-[0_0_20px_var(--accent-primary-glow)] hover:shadow-[0_0_30px_var(--accent-primary-glow)] transition-all duration-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau message
          </Button>
        </motion.div>
      </motion.div>

      {/* ── Filter ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <Select value={zoneFilter} onValueChange={setZoneFilter}>
          <SelectTrigger className="w-full sm:w-60 glass bg-white/[0.04] border-white/[0.08] text-[#94a3b8] hover:border-white/[0.15] transition-all duration-300">
            <Filter className="w-4 h-4 mr-2 text-[#475569]" />
            <SelectValue placeholder="Toutes les zones" />
          </SelectTrigger>
          <SelectContent className="glass-strong rounded-xl border-white/[0.08]">
            <SelectItem value="all" className="text-[#94a3b8]">Toutes les zones</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id} className="text-[#94a3b8]">
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* ── Messages List ── */}
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
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <Skeleton className="h-10 w-10 rounded-full bg-white/[0.06] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24 bg-white/[0.06]" />
                        <Skeleton className="h-5 w-14 bg-white/[0.06] rounded-full" />
                      </div>
                      <Skeleton className="h-14 w-full bg-white/[0.06] rounded-xl" />
                      <Skeleton className="h-3 w-20 bg-white/[0.06]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedMessages.length > 0 ? (
              <ScrollArea className="max-h-[620px] scrollbar-luxe">
                <div className="divide-y divide-white/[0.04]">
                  {sortedMessages.map((message, i) => {
                    const config = typeConfig[message.type] || typeConfig.note;
                    const TypeIcon = config.icon;
                    const senderName = message.senderName || 'Système';

                    return (
                      <motion.div
                        key={message.id || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02, duration: 0.3 }}
                        className={`
                          px-6 py-4 cursor-pointer transition-all duration-300
                          ${!message.isRead ? 'bg-[var(--accent-primary)]/[0.03] hover:bg-[var(--accent-primary)]/[0.05]' : 'hover:bg-white/[0.02]'}
                        `}
                        onClick={() => !message.isRead && markAsRead(message.id)}
                      >
                        <div className="flex items-start gap-3.5">
                          {/* Avatar */}
                          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-[var(--accent-primary)]/30 ring-offset-2 ring-offset-transparent">
                            <AvatarFallback className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-semibold">
                              {message.senderAvatar ? (
                                <img
                                  src={message.senderAvatar}
                                  alt={senderName}
                                  className="h-full w-full rounded-full object-cover"
                                />
                              ) : (
                                getInitials(senderName)
                              )}
                            </AvatarFallback>
                          </Avatar>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-medium ${!message.isRead ? 'text-[#e2e8f0]' : 'text-[#94a3b8]'}`}>
                                {senderName}
                              </span>
                              <Badge className={`${config.badgeBg} ${config.badgeText} border-0 text-[9px] font-semibold px-2 py-0.5 rounded-full`}>
                                <TypeIcon className="w-2.5 h-2.5 mr-1" />
                                {config.label}
                              </Badge>
                              {message.zoneName && (
                                <Badge className="bg-white/[0.04] text-[#64748b] border-0 text-[9px] font-medium px-2 py-0.5 rounded-full">
                                  <MapPin className="w-2.5 h-2.5 mr-1" />
                                  {message.zoneName}
                                </Badge>
                              )}
                              {/* Unread indicator */}
                              {!message.isRead && (
                                <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shadow-[0_0_6px_var(--accent-primary-glow)]" />
                              )}
                            </div>
                            <p className="text-sm text-[#94a3b8] mt-1.5 whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                            <p className="text-[11px] text-[#475569] mt-2 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {relativeTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              /* Empty state */
              <div className="px-6 py-20 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center mx-auto mb-4 glow-gold">
                    <MessageSquare className="w-7 h-7 text-[var(--accent-primary)]" />
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-[#e2e8f0] mb-2">
                    Aucun message
                  </h3>
                  <p className="text-sm text-[#64748b] mb-6 max-w-sm mx-auto">
                    Commencez par envoyer un message à votre foyer
                  </p>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={() => setComposeOpen(true)}
                      className="bg-gradient-gold text-[#0a0a12] font-semibold shadow-[0_0_20px_var(--accent-primary-glow)] hover:shadow-[0_0_30px_var(--accent-primary-glow)] transition-all duration-400"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Nouveau message
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         COMPOSE DIALOG
         ═══════════════════════════════════════════════════════════ */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-md glass-strong rounded-2xl border-white/[0.08] p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#e2e8f0]">
              Nouveau message
            </DialogTitle>
            <DialogDescription className="text-[#64748b]">
              Envoyez un message aux membres de votre foyer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Type selector */}
            <div className="space-y-2">
              <Label className="text-[#94a3b8] text-sm">Type de message</Label>
              <div className="grid grid-cols-3 gap-2.5">
                {Object.entries(typeConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = composeType === key;
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      onClick={() => setComposeType(key as 'note' | 'reminder' | 'urgent')}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`
                        flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-300
                        ${isSelected
                          ? 'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/10 shadow-[0_0_12px_var(--accent-primary-glow)]'
                          : 'border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 transition-colors duration-300 ${isSelected ? config.color : 'text-[#64748b]'}`} />
                      <span className={`text-xs font-medium transition-colors duration-300 ${isSelected ? config.color : 'text-[#64748b]'}`}>
                        {config.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Zone selector */}
            <div className="space-y-2">
              <Label className="text-[#94a3b8] text-sm">Zone (optionnel)</Label>
              <Select value={composeZoneId} onValueChange={setComposeZoneId}>
                <SelectTrigger className="glass bg-white/[0.04] border-white/[0.08] text-[#94a3b8] hover:border-white/[0.15] transition-all duration-300">
                  <MapPin className="w-4 h-4 mr-2 text-[#475569]" />
                  <SelectValue placeholder="Aucune zone" />
                </SelectTrigger>
                <SelectContent className="glass-strong rounded-xl border-white/[0.08]">
                  <SelectItem value="" className="text-[#94a3b8]">Aucune zone</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id} className="text-[#94a3b8]">
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message content */}
            <div className="space-y-2">
              <Label className="text-[#94a3b8] text-sm">Message</Label>
              <Textarea
                placeholder="Écrivez votre message…"
                value={composeContent}
                onChange={(e) => setComposeContent(e.target.value)}
                rows={4}
                disabled={sending}
                className="glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all duration-300 resize-none rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setComposeOpen(false)}
              disabled={sending}
              className="text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all duration-300"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sending || !composeContent.trim()}
              className="bg-gradient-gold text-[#0a0a12] font-semibold shadow-[0_0_16px_var(--accent-primary-glow)] hover:shadow-[0_0_24px_var(--accent-primary-glow)] transition-all duration-400 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0a0a12]" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
