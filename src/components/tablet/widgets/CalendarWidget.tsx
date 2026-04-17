"use client";

/* ═══════════════════════════════════════════════════════
   CalendarWidget — Next upcoming bookings

   Shows the next 2-3 upcoming calendar events/bookings.
   Fetches from /api/display/[token] or from synced bookings.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Clock, MapPin } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  source?: string;
}

interface CalendarWidgetProps {
  displayToken: string;
}

export function CalendarWidget({ displayToken }: CalendarWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/display/${displayToken}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.events) {
        setEvents(data.events.slice(0, 3));
      } else if (data.success && data.bookings) {
        setEvents(
          data.bookings.slice(0, 3).map((b: { id: string; guestName: string; checkInDate: string; checkOutDate: string; source: string }) => ({
            id: b.id,
            title: b.guestName,
            date: b.checkInDate,
            time: new Date(b.checkInDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            source: b.source,
          }))
        );
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [displayToken]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 300_000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === tomorrow.toDateString()) return "Demain";

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
          Prochains Événements
        </h3>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-slate-600">
          <CalendarClock className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">Aucun événement à venir</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] min-h-[48px]"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
                <CalendarClock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">
                  {event.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {event.time && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </span>
                  )}
                  <span className="text-xs text-slate-600">
                    {formatDate(event.date)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
