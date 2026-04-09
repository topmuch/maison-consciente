"use client";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — SafeArrivalWidget (Tablet Display)

   Beautiful tablet-friendly widget showing pending safe
   arrival records with live countdown, color-coded status,
   and "Je suis rentré(e)" button.

   Color coding:
   - Green: arrived
   - Amber: late < 30min
   - Red: emergency > 30min
   - Slate: pending

   Used in the tablet display page (/display/[token]).
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Phone,
  Loader2,
} from "lucide-react";

/* ── Types ── */

interface SafeArrivalRecord {
  id: string;
  memberId: string;
  memberName: string;
  status: "pending" | "arrived" | "late" | "emergency";
  expectedBefore: string; // ISO
  arrivedAt: string | null;
  isLate: boolean;
  lateMinutes: number;
  notes: string | null;
}

interface SafeArrivalWidgetProps {
  displayToken: string;
  householdName?: string;
}

/* ── Status Config ── */

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: "En attente",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    text: "text-slate-300",
    iconColor: "text-slate-400",
    badgeBg: "bg-slate-500/15",
    badgeText: "text-slate-300",
  },
  arrived: {
    icon: CheckCircle2,
    label: "Rentré(e)",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-300",
    iconColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
  },
  late: {
    icon: AlertTriangle,
    label: "En retard",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-300",
    iconColor: "text-amber-400",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
  },
  emergency: {
    icon: AlertOctagon,
    label: "URGENCE",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-300",
    iconColor: "text-red-400",
    badgeBg: "bg-red-500/15",
    badgeText: "text-red-300",
  },
} as const;

/* ── Countdown Utility ── */

function getTimeUntil(targetISO: string): {
  isPast: boolean;
  text: string;
  minutes: number;
} {
  const now = Date.now();
  const target = new Date(targetISO).getTime();
  const diff = target - now;

  if (diff <= 0) {
    const lateMin = Math.floor(Math.abs(diff) / 60000);
    return {
      isPast: true,
      text: `Retard: ${lateMin} min`,
      minutes: -lateMin,
    };
  }

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (hours > 0) {
    return { isPast: false, text: `${hours}h ${minutes}min`, minutes: diff / 60000 };
  }
  return { isPast: false, text: `${minutes} min`, minutes: diff / 60000 };
}

/* ── Animation Variants ── */

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

/* ── Main Component ── */

export default function SafeArrivalWidget({
  displayToken,
  householdName,
}: SafeArrivalWidgetProps) {
  const [arrivals, setArrivals] = useState<SafeArrivalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [markingId, setMarkingId] = useState<string | null>(null);

  /* ── Fetch arrivals ── */
  const fetchArrivals = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/display/${displayToken}/safe-arrivals`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setArrivals(data.arrivals);
        }
      }
    } catch {
      // Silently fail — widget is non-critical
    } finally {
      setLoading(false);
    }
  }, [displayToken]);

  useEffect(() => {
    fetchArrivals();
    // Refresh every 30 seconds
    const interval = setInterval(fetchArrivals, 30000);
    return () => clearInterval(interval);
  }, [fetchArrivals]);

  /* ── Clock tick (1s) for live countdown ── */
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ── Mark as arrived ── */
  const handleMarkArrived = useCallback(
    async (id: string) => {
      setMarkingId(id);
      try {
        await fetch(`/api/display/${displayToken}/safe-arrivals/${id}/arrive`, {
          method: "POST",
        });
        // Optimistic update
        setArrivals((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, status: "arrived" as const, arrivedAt: new Date().toISOString() }
              : a
          )
        );
      } catch {
        // Revert on failure
        fetchArrivals();
      } finally {
        setMarkingId(null);
      }
    },
    [displayToken, fetchArrivals]
  );

  /* ── Trigger emergency call ── */
  const handleEmergencyCall = useCallback(
    async (id: string) => {
      if (!confirm("⚠️ Appeler le contact d'urgence ?")) return;

      try {
        await fetch(`/api/display/${displayToken}/safe-arrivals/${id}/call`, {
          method: "POST",
        });
      } catch {
        // Silent fail
      }
    },
    [displayToken]
  );

  /* ── Filter active arrivals (pending, late, emergency) ── */
  const activeArrivals = arrivals.filter(
    (a) => a.status !== "arrived"
  );
  const arrivedArrivals = arrivals.filter((a) => a.status === "arrived");

  // Don't render widget if no arrivals exist
  if (!loading && arrivals.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.4 }}
      className="py-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
            Safe Arrival
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Suivi des retours à la maison
          </p>
        </div>
        {activeArrivals.length > 0 && (
          <motion.span
            key={activeArrivals.length}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs font-bold"
          >
            {activeArrivals.length} en attente
          </motion.span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
        </div>
      )}

      {/* Arrivals List */}
      <div className="space-y-3">
        <AnimatePresence>
          {activeArrivals.map((arrival) => {
            const config = STATUS_CONFIG[arrival.status];
            const StatusIcon = config.icon;
            const countdown = getTimeUntil(arrival.expectedBefore);
            const isEmergency = arrival.status === "emergency";
            const isLate = arrival.status === "late" || isEmergency;

            return (
              <motion.div
                key={arrival.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={`
                  relative rounded-2xl border p-4 transition-all duration-300
                  backdrop-blur-xl
                  ${config.bg} ${config.border}
                  ${isEmergency ? "ring-1 ring-red-500/30" : ""}
                `}
              >
                {/* Animated pulse ring for late/emergency */}
                {isLate && (
                  <motion.div
                    className={`absolute inset-0 rounded-2xl pointer-events-none ${
                      isEmergency
                        ? "bg-red-500/5"
                        : "bg-amber-500/5"
                    }`}
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{
                      duration: isEmergency ? 1.5 : 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-between gap-3">
                  {/* Left: Member info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Status icon */}
                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                        ${isEmergency ? "bg-red-500/20" : isLate ? "bg-amber-500/20" : "bg-slate-500/20"}
                      `}
                    >
                      <StatusIcon
                        className={`w-5 h-5 ${config.iconColor} ${
                          isEmergency ? "animate-pulse" : ""
                        }`}
                      />
                    </div>

                    {/* Name + countdown */}
                    <div className="min-w-0">
                      <p className={`font-serif font-medium truncate ${config.text}`}>
                        {arrival.memberName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                        <span
                          className={`text-xs font-mono ${
                            countdown.isPast
                              ? isEmergency
                                ? "text-red-400 font-bold"
                                : "text-amber-400 font-medium"
                              : "text-slate-500"
                          }`}
                        >
                          {countdown.isPast
                            ? `Retard: ${Math.abs(countdown.minutes)} min`
                            : `Expire dans ${countdown.text}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Emergency call button */}
                    {isEmergency && (
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEmergencyCall(arrival.id)}
                          className="h-10 px-3 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 rounded-xl"
                        >
                          <Phone className="w-4 h-4 mr-1.5" />
                          <span className="text-xs">Appeler</span>
                        </Button>
                      </motion.div>
                    )}

                    {/* Mark arrived button */}
                    {arrival.status !== "arrived" && (
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={markingId === arrival.id}
                          onClick={() => handleMarkArrived(arrival.id)}
                          className="h-10 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl"
                        >
                          {markingId === arrival.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          )}
                          <span className="text-xs font-medium">
                            Je suis rentré(e)
                          </span>
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {arrival.notes && (
                  <p className="relative z-10 text-xs text-slate-500 mt-2 pl-[52px]">
                    {arrival.notes}
                  </p>
                )}

                {/* Status badge */}
                <div className="relative z-10 mt-2 pl-[52px]">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.badgeBg} ${config.badgeText}`}
                  >
                    {config.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Arrived section (collapsed) */}
        {arrivedArrivals.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="pt-2"
          >
            <p className="text-xs text-emerald-500/60 flex items-center gap-1.5 px-1">
              <CheckCircle2 className="w-3 h-3" />
              {arrivedArrivals.length} membre{arrivedArrivals.length > 1 ? "s" : ""} rentré{arrivedArrivals.length > 1 ? "s" : ""} à la maison
            </p>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
