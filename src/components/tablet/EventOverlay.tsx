"use client";

/* ═══════════════════════════════════════════════════════
   EventOverlay — Tablet Event Notification Pill
   
   Fixed-position notification bar showing the next
   upcoming calendar event. Auto-refreshes hourly.
   Uses Dark Luxe glassmorphism theme.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback } from "react";
import { getUpcomingEvents } from "@/actions/events";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Bell, Calendar, LogOut } from "lucide-react";

interface EventData {
  id: string;
  title: string;
  date: string;
  type: string;
  isRecurring: boolean;
}

const TYPE_ICONS: Record<string, typeof Calendar> = {
  birthday: Cake,
  holiday: Bell,
  reminder: Calendar,
  checkout: LogOut,
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  birthday: { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30" },
  holiday: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  reminder: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
  checkout: { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30" },
  default: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
};

interface Props {
  token: string;
}

export default function EventOverlay({ token }: Props) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const loadEvents = useCallback(async () => {
    const evts = await getUpcomingEvents(token, 3);
    setEvents(evts);
  }, [token]);

  useEffect(() => {
    loadEvents();
    // Refresh every hour
    const interval = setInterval(loadEvents, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  // Visible events = not dismissed
  const visibleEvents = events.filter((e) => !dismissed.has(e.id));
  if (visibleEvents.length === 0) return null;

  const evt = visibleEvents[0];
  const Icon = TYPE_ICONS[evt.type] || Calendar;
  const colors = TYPE_COLORS[evt.type] || TYPE_COLORS.default;

  const eventDate = new Date(evt.date);
  const diffMs = eventDate.getTime() - Date.now();
  const hoursUntil = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
  const minutesUntil = Math.max(0, Math.round(diffMs / (1000 * 60)));

  const timeLabel =
    minutesUntil === 0
      ? "En cours"
      : hoursUntil < 1
        ? `Dans ${minutesUntil} min`
        : hoursUntil === 1
          ? "Dans 1 heure"
          : `Dans ${hoursUntil}h`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 150 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50
                   bg-slate-900/90 backdrop-blur-2xl border rounded-2xl
                   px-6 py-3 shadow-2xl flex items-center gap-4
                   min-w-[320px] max-w-[500px]"
        style={{ borderColor: "var(--tw-border-opacity)" }}
      >
        <div
          className={`p-2 rounded-xl ${colors.bg} ${colors.text}`}
        >
          <Icon size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${colors.text} truncate`}>
            {evt.title}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {timeLabel}
            {evt.isRecurring && (
              <span className="ml-2 text-slate-500">♻️ Récurrent</span>
            )}
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => {
            setDismissed((prev) => new Set(prev).add(evt.id));
          }}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-slate-300 shrink-0"
          aria-label="Masquer"
        >
          <span className="text-xs">✕</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
