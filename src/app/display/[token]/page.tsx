"use client";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Tablet Display Page (v3.0 — Dynamic Widgets)

   Luxury smart home interface for physical tablets.
   Token-based auth, single column, dark luxe theme.

   Dynamic widget system:
   - Fetches widget config from /api/display/[token]/widgets
   - Falls back to DEFAULT_WIDGETS if no config saved
   - System-level components stay outside widget grid

   System-level (always rendered):
   - DynamicBackground, SleepProvider, SeasonalWrapper, EventOverlay
   - Notification Banner, Emergency Button (fixed position)

   Configurable widgets (via WidgetGrid):
   - Clock, Weather, Calendar, Family Status, Safe Arrival
   - News, Quick Actions, Voice, Messages, Contextual, Emergency
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SeasonalWrapper from "@/components/tablet/SeasonalWrapper";
import DynamicBackground from "@/components/tablet/DynamicBackground";
import EventOverlay from "@/components/tablet/EventOverlay";
import { SleepProvider } from "@/components/tablet/SleepProvider";
import { WidgetGrid } from "@/components/tablet/WidgetGrid";
import { useVoiceCommand } from "@/hooks/useVoiceCommand";
import { useTimePhase } from "@/hooks/useTimePhase";
import { createDefaultWidgets, type WidgetConfig } from "@/lib/widget-types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Bell,
  Loader2,
  X,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface HouseholdData {
  success: boolean;
  householdName: string;
  weather: {
    current_weather: {
      temperature: number;
      weathercode: number;
      windspeed: number;
    };
  } | null;
  config: {
    widgets?: Record<string, boolean>;
    guestMode?: {
      maskPresence?: boolean;
      maskMessages?: boolean;
    };
  };
  whatsappNumber?: string;
}

interface NewsItem {
  title: string;
  source: string;
  link?: string;
}

/* ═══════════════════════════════════════════════════════
   WEATHER HELPERS
   ═══════════════════════════════════════════════════════ */

function weatherCodeToEmoji(code: number): string {
  if (code <= 1) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌧️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code >= 95) return "⛈️";
  return "⛅";
}

function weatherCodeToDesc(code: number): string {
  if (code <= 1) return "Ciel dégagé";
  if (code <= 3) return code === 2 ? "Quelques nuages" : "Couvert";
  if (code <= 48) return "Brouillard";
  if (code <= 57) return "Bruine";
  if (code <= 67) return code <= 61 ? "Pluie légère" : "Pluie";
  if (code <= 77) return "Neige";
  if (code <= 82) return "Averses";
  if (code >= 95) return "Orage";
  return "Conditions variables";
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */

export default function TabletDisplayPage() {
  const params = useParams();
  const token = params.token as string;

  /* ─── State ─── */
  const [household, setHousehold] = useState<HouseholdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<{
    temp: number;
    code: number;
    desc: string;
    emoji: string;
  } | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(createDefaultWidgets());
  const [notifications, setNotifications] = useState<
    { id: string; message: string }[]
  >([]);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  const fetchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── Hooks ─── */
  const timePhase = useTimePhase();

  /* ─── Voice Hook ─── */
  const voice = useVoiceCommand({
    enabled: online && !!token,
    displayToken: token,
    onCommandResult: (result) => {
      if (result.success && result.message) {
        voice.speak(result.message);
      }
    },
  });

  /* ─── Online / Offline ─── */
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  /* ─── Fetch widget configuration ─── */
  const fetchWidgetConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/display/${token}/widgets`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.widgets) {
          setWidgets(data.widgets);
        }
      }
    } catch {
      // Fallback to defaults is already set
    }
  }, [token]);

  /* ─── Fetch household data ─── */
  const fetchHouseholdData = useCallback(async () => {
    try {
      const res = await fetch(`/api/display/${token}`);
      if (!res.ok) {
        setError("Affichage désactivé ou token invalide");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Token invalide");
        setLoading(false);
        return;
      }
      setHousehold(data);

      // Parse weather
      if (data.weather?.current_weather) {
        const cw = data.weather.current_weather;
        setWeather({
          temp: Math.round(cw.temperature),
          code: cw.weathercode,
          desc: weatherCodeToDesc(cw.weathercode),
          emoji: weatherCodeToEmoji(cw.weathercode),
        });
      }

      setLoading(false);
    } catch {
      setError("Erreur de connexion au serveur");
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchWidgetConfig();
      fetchHouseholdData();
    }, 0);
    // Refresh every 5 minutes
    fetchTimerRef.current = setInterval(() => {
      fetchWidgetConfig();
      fetchHouseholdData();
    }, 300_000);
    return () => {
      clearTimeout(timeout);
      if (fetchTimerRef.current) clearInterval(fetchTimerRef.current);
    };
  }, [fetchWidgetConfig, fetchHouseholdData]);

  /* ─── Fetch news (RSS proxy) ─── */
  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/enrichment?XTransformPort=3000");
      if (!res.ok) return;
      const data = await res.json();
      if (data.news?.items) {
        setNews(
          data.news.items.slice(0, 5).map((item: { title: string; source?: string; link?: string }) => ({
            title: item.title,
            source: item.source || "Actualités",
            link: item.link,
          }))
        );
      }
    } catch {
      // Silently fail — news is optional
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchNews, 0);
    const timer = setInterval(fetchNews, 600_000);
    return () => {
      clearTimeout(timeout);
      clearInterval(timer);
    };
  }, [fetchNews]);

  /* ─── Wake Lock ─── */
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    const request = async () => {
      if (!("wakeLock" in navigator)) return;
      try {
        wakeLock = await navigator.wakeLock.request("screen");
      } catch { /* silent */ }
    };
    request();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLock?.release();
    };
  }, []);

  /* ═══════════════════════════════════════════════════════
     RENDER — LOADING
     ═══════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-amber-400 gap-4">
        <Loader2 className="animate-spin w-12 h-12" />
        <p className="text-xl font-serif font-light">Connexion à la maison…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-red-400 gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <X className="w-8 h-8" />
        </div>
        <p className="text-xl font-serif">{error}</p>
        <p className="text-sm text-slate-500">
          Vérifiez le lien d&apos;affichage ou contactez l&apos;administrateur
        </p>
        <button
          onClick={fetchHouseholdData}
          className="mt-4 px-6 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors min-h-[48px]"
        >
          Réessayer
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDER — MAIN
     ═══════════════════════════════════════════════════════ */

  return (
    <SleepProvider timeoutMs={180_000}>
      <SeasonalWrapper>
        <div className="min-h-screen text-white relative overflow-hidden">
          {/* System: Dynamic Background */}
          <DynamicBackground weatherCondition={weather?.desc ?? ""} phase={timePhase.phase} />

          {/* System: Event Overlay */}
          <EventOverlay token={token} />

          {/* Ambient glow orbs */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-amber-500/[0.04] rounded-full blur-[140px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-violet-500/[0.03] rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 pb-8">
            {/* ═══════════════════════════════════════════
                SYSTEM: NOTIFICATION BANNER
                ═══════════════════════════════════════════ */}
            <AnimatePresence>
              {notifications.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="glass-gold rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                          <p className="text-sm text-amber-100">{notif.message}</p>
                        </div>
                        <button
                          onClick={() =>
                            setNotifications((prev) =>
                              prev.filter((n) => n.id !== notif.id)
                            )
                          }
                          className="p-1 rounded-lg hover:bg-white/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                          aria-label="Fermer"
                        >
                          <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════
                DYNAMIC: WIDGET GRID
                ═══════════════════════════════════════════ */}
            <WidgetGrid
              widgets={widgets}
              displayToken={token}
              householdName={household?.householdName}
              weather={weather}
              news={news}
              online={online}
              onRefresh={fetchHouseholdData}
              voiceHook={voice}
            />

            {/* ═══════════════════════════════════════════
                SYSTEM: FOOTER
                ═══════════════════════════════════════════ */}
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="pt-8 pb-4"
            >
              <div className="divider-gold mb-6" />
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="text-amber-400/30 text-xs"
                  >
                    ◆
                  </motion.span>
                  <span className="font-serif text-gradient-gold text-sm tracking-widest">
                    Maison Consciente
                  </span>
                  <motion.span
                    animate={{ rotate: [360, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="text-amber-400/30 text-xs"
                  >
                    ◆
                  </motion.span>
                </div>
                <p className="text-[10px] text-slate-700 tracking-wider">
                  Propulsé par Maellis &middot; v3.0
                </p>
              </div>
            </motion.footer>
          </div>

          {/* System: Quick Access Modal Sheet (used by quick actions widget) */}
          <Sheet open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
            <SheetContent className="bg-[#0a0f1e]/95 backdrop-blur-xl border-white/10 text-white overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="sr-only">Détail</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{modalContent}</div>
            </SheetContent>
          </Sheet>
        </div>
      </SeasonalWrapper>
    </SleepProvider>
  );
}
