"use client";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Tablet Display "Wahoo"
   
   Premium tablet interface with monumental clock,
   phase-aware ambience, glassmorphism cards, and
   oversized touch targets for 1m-distance interaction.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTimePhase } from "@/hooks/useTimePhase";
import { useSeason } from "@/hooks/useSeason";
import { useSeasonalAudio } from "@/hooks/useSeasonalAudio";
import { useVoiceCommand } from "@/hooks/useVoiceCommand";
import { useTabletNotifications } from "@/hooks/useTabletNotifications";
import { getDisplayData, toggleGroceryDisplay } from "@/actions/display";
import { SleepProvider } from "@/components/tablet/SleepProvider";
import DynamicBackground from "@/components/tablet/DynamicBackground";
import SeasonalWrapper from "@/components/tablet/SeasonalWrapper";
import EventOverlay from "@/components/tablet/EventOverlay";
import { triggerHaptic } from "@/lib/haptic";
import {
  Sun,
  CloudRain,
  ShoppingCart,
  MessageSquare,
  Phone,
  Star,
  Wifi,
  WifiOff,
  Loader2,
  RefreshCw,
  Send,
  Clock,
  Cloud,
  Snowflake,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudSun,
  Wind,
  Volume2,
  VolumeX,
  Bell,
} from "lucide-react";
import LuxuryCard from "@/components/tablet/LuxuryCard";
import LargeButton from "@/components/tablet/LargeButton";
import CommandOrb from "@/components/voice/CommandOrb";
import VoiceCommandToast from "@/components/voice/VoiceCommandToast";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface WeatherInfo {
  temp: number;
  condition: string;
  icon: string;
}

interface MessageData {
  id: string;
  content: string;
  createdAt: string;
  sender: { name: string; email: string } | null;
}

interface GroceryData {
  id: string;
  name: string;
  isBought: boolean;
}

interface DisplayState {
  success: boolean;
  householdName: string;
  weather: WeatherInfo | null;
  groceries: GroceryData[];
  messages: MessageData[];
  presenceCount: number | null;
  featuredRecipe: {
    id: string;
    title: string;
    description: string;
    prepTimeMin: number;
    tags: string[];
    imageUrl: string | null;
  } | null;
}

/* ═══════════════════════════════════════════════════════
   WEATHER ICON MAPPER
   ═══════════════════════════════════════════════════════ */

function getWeatherIcon(iconKey: string, className: string) {
  const map: Record<string, React.ReactNode> = {
    sun: <Sun className={className} />,
    cloud: <Cloud className={className} />,
    "cloud-sun": <CloudSun className={className} />,
    "cloud-fog": <CloudFog className={className} />,
    "cloud-drizzle": <CloudDrizzle className={className} />,
    "cloud-rain": <CloudRain className={className} />,
    "cloud-rain-wind": <CloudRain className={className} />,
    snowflake: <Snowflake className={className} />,
    "cloud-lightning": <CloudLightning className={className} />,
  };
  return map[iconKey] ?? <Cloud className={className} />;
}

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════ */

const fadeSlideIn = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

/* ═══════════════════════════════════════════════════════
   MAIN DISPLAY PAGE
   ═══════════════════════════════════════════════════════ */

export default function DisplayPage() {
  const params = useParams();
  const token = params.token as string;

  /* ─── State ─── */
  const [data, setData] = useState<DisplayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState<Date | null>(null);
  const [online, setOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'listening' | 'success' | 'error' | 'info'>('info');
  const [toastMessage, setToastMessage] = useState('');

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Hooks ─── */
  const { phase } = useTimePhase();
  const { season } = useSeason();
  const { isPlaying, trackLabel, toggle: toggleAudio, setVolume: setAudioVolume } = useSeasonalAudio(season, true);

  /* ─── Proactive Notifications Hook ─── */
  const { hasPending: notifHasPending, lastMessage: notifMessage } = useTabletNotifications(token);

  /* ─── Voice Command Hook (enhanced) ─── */
  // Stable ref for voice result handler (avoids re-creating hook on every render)
  const voiceResultRef = useRef<(result: { success: boolean; message: string; data?: Record<string, unknown> }) => void>();
  voiceResultRef.current = (result) => {
    const intent = (result.data?.intent as string) ?? '';

    // system_stop: already handled by hook (TTS stopped internally), just dismiss toast
    if (intent === 'system_stop') {
      setToastVisible(false);
      return;
    }

    // now_playing: report current audio state
    if (intent === 'now_playing') {
      const msg = isPlaying
        ? `En écoute : ${trackLabel || 'Ambiance sonore'}`
        : 'Aucune musique en cours de lecture';
      voice.speak(msg);
      setToastVisible(true);
      setToastType('info');
      setToastMessage(msg);
      return;
    }

    // volume_control: adjust ambient volume
    if (intent === 'volume_control') {
      const direction = (result.data?.payload as Record<string, string>)?.direction ?? 'up';
      const currentVol = 0.3;
      const newVol = direction === 'up'
        ? Math.min(currentVol + 0.1, 1.0)
        : Math.max(currentVol - 0.1, 0.0);
      setAudioVolume(newVol);
      const msg = direction === 'up' ? 'Volume augmenté' : 'Volume baissé';
      voice.speak(msg);
      setToastVisible(true);
      setToastType('success');
      setToastMessage(msg);
      return;
    }

    // playback_control: play or stop ambient audio
    if (intent === 'playback_control') {
      const action = (result.data?.payload as Record<string, string>)?.action ?? 'toggle';
      if (action === 'stop') {
        if (isPlaying) toggleAudio();
        voice.speak('Musique arrêtée');
        setToastVisible(true);
        setToastType('info');
        setToastMessage('Ambiance sonore coupée');
      } else {
        if (!isPlaying) toggleAudio();
        voice.speak('Musique lancée');
        setToastVisible(true);
        setToastType('success');
        setToastMessage('Ambiance sonore activée');
      }
      return;
    }

    // Standard result: speak message, show toast
    if (result.success && result.message) {
      voice.speak(result.message);
    }
    setToastVisible(true);
    setToastType(result.success ? 'success' : 'error');
    setToastMessage(result.message);

    // Refresh data for server-side mutations (grocery, reminder, mode changes)
    if (['add_grocery', 'add_reminder', 'mode_night', 'mode_morning', 'mode_day', 'open_guide'].includes(intent)) {
      fetchDisplayData();
    }
  };

  const voice = useVoiceCommand({
    enabled: online,
    displayToken: token,
    onCommandResult: (result) => voiceResultRef.current?.(result),
  });

  // Show listening toast when wake word detected
  useEffect(() => {
    if (voice.state === 'waiting_command') {
      setToastVisible(true);
      setToastType('listening');
      setToastMessage('Je vous écoute…');
    } else if (voice.state === 'idle' || voice.state === 'listening') {
      if (toastType === 'listening') {
        setToastVisible(false);
      }
    }
  }, [voice.state, toastType]);

  /* ─── Clock (1s) — deferred to client to avoid hydration mismatch ─── */
  useEffect(() => {
    setClock(new Date());
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ─── Online / Offline ─── */
  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => {
      setOnline(false);
      eventSourceRef.current?.close();
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  /* ─── Wake Lock ─── */
  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      if (wakeLockRef.current?.released) wakeLockRef.current = null;
      if (!wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      }
    } catch {
      /* Silently fail */
    }
  }, []);

  useEffect(() => {
    requestWakeLock();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") requestWakeLock();
    };
    const handleInteraction = () => {
      requestWakeLock();
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      wakeLockRef.current?.release();
    };
  }, [requestWakeLock]);

  /* ─── Fetch Data (Server Action) ─── */
  const fetchDisplayData = useCallback(async () => {
    try {
      setRefreshing(true);
      const result = await getDisplayData(token);
      if (result.success) {
        setData(result as DisplayState);
      }
    } catch {
      /* Silent fallback */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDisplayData();
  }, [fetchDisplayData]);

  /* ─── SSE Real-time ─── */
  useEffect(() => {
    if (!token || !online) return;

    const connect = () => {
      const es = new EventSource(`/api/display/${token}/stream`);
      eventSourceRef.current = es;

      es.addEventListener("connected", () => {
        /* SSE connected */
      });
      es.addEventListener("messages", () => fetchDisplayData());
      es.addEventListener("groceries", () => fetchDisplayData());
      es.addEventListener("ping", () => {
        /* Heartbeat */
      });

      es.onerror = () => {
        es.close();
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          if (navigator.onLine) connect();
        }, 3000);
      };
    };

    connect();
    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [token, online, fetchDisplayData]);

  /* ─── Toggle Grocery ─── */
  const handleToggleGrocery = async (itemId: string) => {
    try {
      await toggleGroceryDisplay(token, itemId);
      fetchDisplayData();
    } catch {
      /* Offline fallback — optimistic UI update */
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          groceries: prev.groceries.map((g) =>
            g.id === itemId ? { ...g, isBought: !g.isBought } : g,
          ),
        };
      });
    }
  };

  /* ─── Derived values ─── */
  const groceriesCount = data?.groceries?.filter((g) => !g.isBought).length ?? 0;
  const messagesCount = data?.messages?.length ?? 0;

  /* ═══════════════════════════════════════════════════════
     RENDER — LOADING
     ═══════════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-amber-400">
        <Loader2 className="animate-spin w-12 h-12 mb-4" />
        <p className="text-xl font-light">Connexion à la maison…</p>
      </div>
    );
  }

  const weatherCondition = data?.weather?.condition ?? "";
  const isRainy =
    weatherCondition.includes("pluie") ||
    weatherCondition.includes("Bruine") ||
    weatherCondition.includes("Averse");
  const isCloudy =
    weatherCondition.includes("nuage") ||
    weatherCondition.includes("Couvert") ||
    weatherCondition.includes("Brouillard");
  const isSnowy = weatherCondition.includes("Neige") || weatherCondition.includes("Grésil");
  const isStormy = weatherCondition.includes("Orage");

  return (
    <SleepProvider timeoutMs={120_000}>
      <SeasonalWrapper manualSeason={season}>
      <div className="relative min-h-screen w-screen overflow-hidden bg-slate-950 text-white select-none touch-manipulation">
        {/* ═══ Event Overlay ═══ */}
        <EventOverlay token={token} />
        {/* ═══ Dynamic Background ═══ */}
        <DynamicBackground
          weatherCondition={weatherCondition}
          phase={phase.phase}
        />

        {/* ═══ Ambient Halos ═══ */}
        <div className="absolute inset-0 pointer-events-none z-[1]">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-amber-500/5 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 p-6 md:p-10 h-screen flex flex-col">
        {/* ═══ MONUMENTAL HEADER ═══ */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-white/10 pb-6"
        >
          {/* Left: Clock + Greeting */}
          <div>
            <h1 className="text-7xl md:text-9xl font-serif font-light text-amber-100 tracking-tight leading-none tabular-nums">
              {clock?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </h1>
            <p className="text-2xl md:text-3xl text-slate-300 mt-2 font-light">
              {phase.greeting} •{" "}
              {clock?.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>

          {/* Right: Weather + Network */}
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            {/* Weather */}
            {data?.weather && (
              <div className="text-right">
                <div className="flex items-center gap-3 justify-end">
                  {isRainy || isStormy ? (
                    <CloudRain className="text-indigo-300 w-8 h-8" />
                  ) : isSnowy ? (
                    <Snowflake className="text-blue-200 w-8 h-8" />
                  ) : isCloudy ? (
                    <Cloud className="text-slate-400 w-8 h-8" />
                  ) : (
                    <Sun className="text-amber-300 w-8 h-8" />
                  )}
                  <span className="text-4xl font-light text-amber-400">
                    {data.weather.temp}°C
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {data.weather.condition}
                </p>
              </div>
            )}

            {/* Notification Indicator */}
            <AnimatePresence>
              {notifHasPending && notifMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1.5"
                >
                  <Bell className="w-3 h-3" />
                  <span className="hidden sm:inline">Notification</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Network Status */}
            <div
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${
                online
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : "bg-red-500/10 text-red-400 border-red-500/30"
              }`}
            >
              {online ? (
                <Wifi className="inline w-3 h-3 mr-1" />
              ) : (
                <WifiOff className="inline w-3 h-3 mr-1" />
              )}
              {online ? "En ligne" : "Hors ligne"}
            </div>

            {/* Refresh */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic("light");
                fetchDisplayData();
              }}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              title="Rafraîchir"
            >
              <RefreshCw
                className={`w-4 h-4 text-slate-400 ${refreshing ? "animate-spin" : ""}`}
              />
            </motion.button>
          </div>
        </motion.header>

        {/* ═══ MAIN GRID ═══ */}
        <main className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 pb-8">
          {/* ─── 1. COURSES CARD ─── */}
          <LuxuryCard
            title="🛒 Courses"
            subtitle={`${groceriesCount} article${groceriesCount !== 1 ? "s" : ""} à prendre`}
            accent="amber"
          >
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-64">
              {data?.groceries && data.groceries.length > 0 ? (
                data.groceries.slice(0, 6).map((g) => (
                  <motion.button
                    key={g.id}
                    whileTap={{ scale: 0.98 }}
                          onClick={() => {
                      triggerHaptic("light");
                      handleToggleGrocery(g.id);
                    }}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      g.isBought
                        ? "bg-white/5 border-white/10 opacity-50"
                        : "bg-black/20 border-white/10 hover:border-amber-500/40 active:bg-white/10"
                    }`}
                  >
                    <span
                      className={`text-xl text-left ${g.isBought ? "line-through text-slate-500" : "text-amber-100"}`}
                    >
                      {g.name}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        g.isBought
                          ? "bg-green-500/20 border-green-500 text-green-400"
                          : "border-white/30"
                      }`}
                    >
                      {g.isBought && <span className="text-lg">✓</span>}
                    </div>
                  </motion.button>
                ))
              ) : (
                <p className="text-slate-500 text-lg italic text-center py-4">
                  Liste de courses vide
                </p>
              )}
            </div>
            {data?.groceries && data.groceries.length > 6 && (
              <p className="text-slate-400 text-sm mt-2 text-center">
                + {data.groceries.length - 6} autres
              </p>
            )}
          </LuxuryCard>

          {/* ─── 2. MESSAGES CARD ─── */}
          <LuxuryCard
            title="💬 Messages"
            subtitle={`${messagesCount} nouveau${messagesCount !== 1 ? "x" : ""}`}
            accent="indigo"
          >
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-52">
              <AnimatePresence mode="popLayout">
                {data?.messages && data.messages.length > 0 ? (
                  data.messages.slice(0, 4).map((m) => (
                    <motion.div
                      key={m.id}
                      variants={fadeSlideIn}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="p-4 bg-black/20 rounded-2xl border border-white/10"
                    >
                      <p className="text-xl text-slate-200 leading-relaxed">
                        &ldquo;{m.content}&rdquo;
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {m.sender?.name || m.sender?.email || "Inconnu"} •{" "}
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-slate-500 text-lg italic text-center py-4">
                    Aucun message pour le moment
                  </p>
                )}
              </AnimatePresence>
            </div>

            {/* Message Input */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && messageInput.trim()) {
                    triggerHaptic("success");
                    fetch(
                      `/api/display/${token}/action?XTransformPort=3000`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "add-message",
                          content: messageInput.trim(),
                        }),
                      },
                    ).then(() => {
                      setMessageInput("");
                      fetchDisplayData();
                    });
                  }
                }}
                placeholder="Écrire un message…"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base
                           text-amber-100 placeholder:text-slate-500 outline-none
                           focus:border-amber-400/30 transition-all"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (!messageInput.trim()) return;
                  triggerHaptic("success");
                  fetch(
                    `/api/display/${token}/action?XTransformPort=3000`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "add-message",
                        content: messageInput.trim(),
                      }),
                    },
                  ).then(() => {
                    setMessageInput("");
                    fetchDisplayData();
                  });
                }}
                disabled={!messageInput.trim()}
                className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20
                           flex items-center justify-center transition-all
                           hover:bg-amber-400/20 disabled:opacity-30 disabled:pointer-events-none"
              >
                <Send className="w-4 h-4 text-amber-400" />
              </motion.button>
            </div>
          </LuxuryCard>

          {/* ─── 3. ACTION BUTTONS + PHASE INFO ─── */}
          <div className="space-y-6">
            <LargeButton
              icon={<Phone className="w-10 h-10" />}
              label="Contacter l&apos;hôte"
              sublabel="Urgence, ménage, question"
              gradient="from-rose-900/40 to-rose-800/20"
              onClick={() => {
                triggerHaptic("medium");
                voice.speak("Ouverture du formulaire de contact");
              }}
            />

            <LargeButton
              icon={<Star className="w-10 h-10" />}
              label="Laisser un avis"
              sublabel="Feedback & checkout"
              gradient="from-amber-900/40 to-amber-800/20"
              onClick={() => {
                triggerHaptic("medium");
                voice.speak("Merci pour votre feedback");
              }}
            />

            {/* Phase Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <p className="text-lg text-slate-400">Mode {phase.label}</p>
              </div>
              <p className="text-sm text-slate-500">{phase.message}</p>
              {data?.householdName && (
                <p className="text-xs text-slate-600 mt-3 font-serif">
                  {data.householdName}
                </p>
              )}
            </motion.div>
          </div>
        </main>
        </div>

        {/* ═══ COMMAND ORB (Floating) ═══ */}
        <div className="fixed bottom-8 right-8 z-[100]">
          <CommandOrb
            state={voice.state}
            onClick={voice.startListening}
            transcript={voice.transcript}
            size="lg"
          />
        </div>
        {/* ═══ VOICE COMMAND TOAST ═══ */}
        <VoiceCommandToast
          visible={toastVisible}
          type={toastType as 'listening' | 'success' | 'error' | 'info'}
          message={toastMessage}
          onClose={() => setToastVisible(false)}
        />
        {/* ═══ SEASONAL AUDIO TOGGLE ═══ */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic("light");
            toggleAudio();
          }}
          className="fixed bottom-8 left-8 z-[100] flex items-center gap-3 px-5 py-3
                     bg-white/5 backdrop-blur-xl rounded-full border border-white/10
                     hover:bg-white/10 transition-all text-sm"
          aria-label={isPlaying ? "Couper l'ambiance sonore" : "Activer l'ambiance sonore"}
        >
          {isPlaying ? (
            <Volume2 className="w-4 h-4 text-amber-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-400" />
          )}
          <span className={`max-w-[180px] truncate ${isPlaying ? "text-amber-200" : "text-slate-400"}`}>
            {isPlaying && trackLabel ? trackLabel : "Ambiance"}
          </span>
        </motion.button>
      </div>
      </SeasonalWrapper>
    </SleepProvider>
  );
}
