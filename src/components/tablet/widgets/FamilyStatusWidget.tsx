"use client";

/* ═══════════════════════════════════════════════════════
   FamilyStatusWidget — Family member status grid

   Shows family members grouped by status (home/away/offline).
   Fetches from family geolocation data.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Home, MapPin, WifiOff, Loader2 } from "lucide-react";

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  status: "home" | "away" | "school" | "work" | "offline" | "en_route";
  lastKnownAt: string | null;
  batteryLevel: number | null;
}

interface FamilyStatusWidgetProps {
  displayToken: string;
}

const STATUS_DISPLAY: Record<string, { label: string; icon: typeof Home; color: string; bgColor: string }> = {
  home: { label: "À la maison", icon: Home, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  away: { label: "Absent", icon: MapPin, color: "text-amber-400", bgColor: "bg-amber-400/10" },
  school: { label: "À l'école", icon: MapPin, color: "text-cyan-400", bgColor: "bg-cyan-400/10" },
  work: { label: "Au travail", icon: MapPin, color: "text-blue-400", bgColor: "bg-blue-400/10" },
  en_route: { label: "En route", icon: MapPin, color: "text-violet-400", bgColor: "bg-violet-400/10" },
  offline: { label: "Hors ligne", icon: WifiOff, color: "text-slate-500", bgColor: "bg-slate-500/10" },
};

export function FamilyStatusWidget({ displayToken }: FamilyStatusWidgetProps) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFamily = useCallback(async () => {
    try {
      const res = await fetch(`/api/display/${displayToken}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.familyMembers) {
        setMembers(data.familyMembers);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [displayToken]);

  useEffect(() => {
    fetchFamily();
    const interval = setInterval(fetchFamily, 60000);
    return () => clearInterval(interval);
  }, [fetchFamily]);

  // Count by status
  const homeCount = members.filter((m) => m.status === "home").length;
  const awayCount = members.filter((m) => m.status !== "home" && m.status !== "offline").length;
  const offlineCount = members.filter((m) => m.status === "offline").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
          Statut Famille
        </h3>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Home className="w-3 h-3" />
            {homeCount}
          </span>
          <span className="flex items-center gap-1 text-xs text-amber-400">
            <MapPin className="w-3 h-3" />
            {awayCount}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <WifiOff className="w-3 h-3" />
            {offlineCount}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-slate-600">
          <Home className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">Aucun membre de la famille</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {members.map((member) => {
            const status = STATUS_DISPLAY[member.status] || STATUS_DISPLAY.offline;
            const StatusIcon = status.icon;

            return (
              <div
                key={member.id}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] min-h-[48px]"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: member.avatarColor }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-200 font-medium truncate">
                    {member.name}
                  </p>
                  <div className={`flex items-center gap-1 ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="text-[10px]">{status.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
