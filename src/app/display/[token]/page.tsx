"use client";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Tablet Display Page (v2.0)

   Luxury smart home interface for physical tablets.
   Token-based auth, single column, dark luxe theme.

   Sections:
   1. Header — Clock, date, weather, Maellis branding
   2. Notification Banner — Dismissible alerts
   3. Quick Actions Grid — 2×3 buttons (Actualités, Recette, etc.)
   4. News Ticker — Horizontal scrollable headlines
   5. Voice Control — HybridVoiceControl component
   6. Quick Access — WhatsApp, Rappels, POI
   7. Emergency Button — Fixed SOS button (bottom-left)
   8. Footer — Maison Consciente · v2.0
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import HybridVoiceControl from "@/components/voice/HybridVoiceControl";
import EmergencyButton from "@/components/tablet/EmergencyButton";
import { GlassCard } from "@/components/shared/glass-card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useVoiceCommand } from "@/hooks/useVoiceCommand";
import { useTimePhase } from "@/hooks/useTimePhase";
import { LOCAL_RECIPES, FUN_FACTS, JOKES, QUOTES } from "@/lib/constants";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Loader2,
  Newspaper,
  ChefHat,
  CloudSun,
  Sparkles,
  Laugh,
  Lightbulb,
  Phone,
  Bell,
  MapPin,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
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
   CONSTANTS
   ═══════════════════════════════════════════════════════ */

const QUICK_ACTIONS = [
  { id: "news", icon: Newspaper, label: "Actualités", emoji: "📰", color: "text-cyan-400" },
  { id: "recipe", icon: ChefHat, label: "Recette du jour", emoji: "🍽️", color: "text-amber-400" },
  { id: "weather", icon: CloudSun, label: "Météo", emoji: "⛅", color: "text-sky-400" },
  { id: "horoscope", icon: Sparkles, label: "Horoscope", emoji: "♈", color: "text-violet-400" },
  { id: "joke", icon: Laugh, label: "Blague", emoji: "😂", color: "text-emerald-400" },
  { id: "fact", icon: Lightbulb, label: "Le saviez-vous", emoji: "💡", color: "text-yellow-400" },
] as const;

const ZODIAC_SIGNS = [
  "Bélier", "Taureau", "Gémeaux", "Cancer",
  "Lion", "Vierge", "Balance", "Scorpion",
  "Sagittaire", "Capricorne", "Verseau", "Poissons",
];

const HOROSCOPE_MESSAGES = [
  "Les étoiles vous sourient aujourd'hui. Une journée propice aux nouvelles rencontres.",
  "Vos projets avancent doucement mais sûrement. La patience est votre alliée.",
  "Une énergie créative vous envahit. C'est le moment idéal pour exprimer vos talents.",
  "La chance vous accompagne dans vos entreprises. Osez prendre des initiatives.",
  "Un moment de calme s'annonce. Prenez soin de vous et de vos proches.",
  "Les communications sont favorisées. C'est le bon jour pour clarifier les choses.",
  "Votre intuition est particulièrement aiguisée. Écoutez votre voix intérieure.",
];

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
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════ */

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */

// Inline weather icon rendering to avoid creating components during render
function renderWeatherIcon(code: number, className: string) {
  if (code <= 1) return <Sun className={className} />;
  if (code <= 3) return <Cloud className={className} />;
  if (code <= 57) return <CloudRain className={className} />;
  if (code <= 77) return <CloudSnow className={className} />;
  if (code >= 95) return <CloudLightning className={className} />;
  return <CloudSun className={className} />;
}

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
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [notifications, setNotifications] = useState<
    { id: string; message: string }[]
  >([]);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [tickerOffset, setTickerOffset] = useState(0);

  const tickerRef = useRef<HTMLDivElement>(null);
  const fetchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── Hooks ─── */
  const { phase } = useTimePhase();

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

  /* ─── Clock (1s tick) ─── */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    // Defer first fetch to avoid setState-in-effect
    const timeout = setTimeout(fetchHouseholdData, 0);
    // Refresh every 5 minutes
    fetchTimerRef.current = setInterval(fetchHouseholdData, 300_000);
    return () => {
      clearTimeout(timeout);
      if (fetchTimerRef.current) clearInterval(fetchTimerRef.current);
    };
  }, [fetchHouseholdData]);

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
    // Defer first fetch to avoid setState-in-effect
    const timeout = setTimeout(fetchNews, 0);
    const timer = setInterval(fetchNews, 600_000); // refresh every 10 min
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

  /* ─── News ticker auto-scroll ─── */
  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setTickerOffset((prev) => {
        if (prev >= news.length) return 0;
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [news.length]);

  /* ═══════════════════════════════════════════════════════
     QUICK ACTION HANDLERS
     ═══════════════════════════════════════════════════════ */

  const handleQuickAction = useCallback(
    (actionId: string) => {
      switch (actionId) {
        case "news": {
          if (news.length === 0) {
            setModalContent(
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Newspaper className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">Aucune actualité disponible</p>
              </div>
            );
          } else {
            setModalContent(
              <div className="space-y-4">
                <h3 className="font-serif text-xl text-amber-200">Dernières actualités</h3>
                <div className="space-y-3">
                  {news.map((item, i) => (
                    <div key={i} className="glass rounded-xl p-4 border border-white/5">
                      <p className="text-sm text-slate-200 leading-relaxed">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-2">{item.source}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          setActiveModal("news");
          break;
        }

        case "recipe": {
          const recipe = LOCAL_RECIPES[Math.floor(Math.random() * LOCAL_RECIPES.length)];
          setModalContent(
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl text-amber-200">{recipe.title}</h3>
                <span className="text-xs px-2 py-1 rounded-full glass text-amber-400/80">
                  {recipe.difficulty}
                </span>
              </div>
              <p className="text-sm text-slate-300">{recipe.description}</p>
              <div className="flex gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {recipe.prepTimeMin + recipe.cookTimeMin} min
                </span>
                <span>👥 {recipe.servings} pers.</span>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2">
                  Ingrédients
                </h4>
                <ul className="space-y-1">
                  {recipe.ingredients.slice(0, 8).map((ing, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400/50 mt-1">•</span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2">
                  Préparation
                </h4>
                <ol className="space-y-1.5">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-amber-400/60 font-mono text-xs shrink-0 mt-0.5">
                        {i + 1}.
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
          setActiveModal("recipe");
          break;
        }

        case "weather": {
          setModalContent(
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-amber-200">Météo</h3>
              {weather ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <span className="text-6xl">{weather.emoji}</span>
                  <div className="text-center">
                    <p className="text-4xl font-serif text-amber-200">{weather.temp}°C</p>
                    <p className="text-sm text-slate-400 mt-1">{weather.desc}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-slate-400">
                  <CloudSun className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm">Données météo non disponibles</p>
                </div>
              )}
              <div className="text-xs text-slate-500 text-center">
                Données fournies par Open-Meteo
              </div>
            </div>
          );
          setActiveModal("weather");
          break;
        }

        case "horoscope": {
          const sign = ZODIAC_SIGNS[Math.floor(Math.random() * ZODIAC_SIGNS.length)];
          const message = HOROSCOPE_MESSAGES[Math.floor(Math.random() * HOROSCOPE_MESSAGES.length)];
          setModalContent(
            <div className="space-y-4 text-center">
              <h3 className="font-serif text-xl text-amber-200">Horoscope</h3>
              <div className="text-5xl py-4">♈</div>
              <p className="text-lg font-serif text-amber-300">{sign}</p>
              <p className="text-sm text-slate-300 leading-relaxed mt-2">{message}</p>
              <p className="text-xs text-slate-500 mt-4">
                Message inspiré — pour le divertissement uniquement
              </p>
            </div>
          );
          setActiveModal("horoscope");
          break;
        }

        case "joke": {
          const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
          setModalContent(
            <div className="space-y-4 text-center">
              <h3 className="font-serif text-xl text-amber-200">Blague du jour</h3>
              <div className="text-5xl py-4">😂</div>
              <p className="text-sm text-slate-200 leading-relaxed">{joke.setup} ... {joke.punchline}</p>
            </div>
          );
          setActiveModal("joke");
          break;
        }

        case "fact": {
          const fact = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
          setModalContent(
            <div className="space-y-4 text-center">
              <h3 className="font-serif text-xl text-amber-200">Le saviez-vous ?</h3>
              <div className="text-5xl py-4">💡</div>
              <p className="text-sm text-slate-200 leading-relaxed">{fact}</p>
            </div>
          );
          setActiveModal("fact");
          break;
        }
      }
    },
    [news, weather]
  );

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

  /* ─── Derived ─── */
  const timeStr = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = currentTime.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // Render weather icon (use code directly to avoid creating component during render)
  const weatherIconCode = weather?.code ?? 2;

  /* ═══════════════════════════════════════════════════════
     RENDER — MAIN
     ═══════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-amber-500/[0.04] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-violet-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 pb-8">
        {/* ═══════════════════════════════════════════
            1. HEADER
            ═══════════════════════════════════════════ */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="pt-8 pb-6 border-b border-white/[0.06]"
        >
          {/* Top row: Clock + Status */}
          <div className="flex items-start justify-between">
            {/* Clock + Greeting */}
            <div>
              <h1 className="text-7xl md:text-8xl font-serif font-light text-amber-100 tracking-tight leading-none tabular-nums">
                {timeStr}
              </h1>
              <p className="text-base md:text-lg text-slate-400 mt-2 font-light">
                {phase.greeting} &middot;{" "}
                <span className="capitalize">{dateStr}</span>
              </p>
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-2 mt-1">
              {/* Online indicator */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  online
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {online ? (
                  <Wifi className="w-3 h-3" />
                ) : (
                  <WifiOff className="w-3 h-3" />
                )}
              </motion.div>

              {/* Refresh */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={fetchHouseholdData}
                className="p-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Rafraîchir"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
              </motion.button>
            </div>
          </div>

          {/* Weather + Branding row */}
          <div className="flex items-center justify-between mt-5">
            {/* Weather */}
            {weather && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  {renderWeatherIcon(weatherIconCode, "w-5 h-5 text-amber-400")}
                </div>
                <div>
                  <p className="text-xl font-serif text-amber-200">{weather.temp}°C</p>
                  <p className="text-xs text-slate-500">{weather.desc}</p>
                </div>
              </div>
            )}

            {/* Maellis branding */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex items-center gap-2"
            >
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="text-amber-400/40 text-sm"
              >
                ◆
              </motion.span>
              <span className="font-serif text-gradient-gold text-lg tracking-wider">
                Maellis
              </span>
              <motion.span
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="text-amber-400/40 text-sm"
              >
                ◆
              </motion.span>
            </motion.div>

            {/* Household name */}
            {household?.householdName && (
              <p className="text-xs text-slate-600 font-serif">
                {household.householdName}
              </p>
            )}
          </div>
        </motion.header>

        {/* ═══════════════════════════════════════════
            2. NOTIFICATION BANNER
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
            3. QUICK ACTIONS GRID (2×3)
            ═══════════════════════════════════════════ */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="py-8"
        >
          <motion.h2
            variants={fadeUp}
            className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-5"
          >
            Accès rapide
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {QUICK_ACTIONS.map((action) => (
              <motion.button
                key={action.id}
                variants={scaleIn}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                onClick={() => handleQuickAction(action.id)}
                className="group flex flex-col items-center justify-center gap-3 p-5 md:p-6 rounded-2xl glass hover:bg-white/[0.06] transition-all cursor-pointer min-h-[120px]"
              >
                <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-200">
                  {action.emoji}
                </span>
                <span className="text-xs md:text-sm font-medium text-slate-300 group-hover:text-amber-200 transition-colors text-center">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════
            4. NEWS TICKER
            ═══════════════════════════════════════════ */}
        {news.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="pb-6"
          >
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-3">
              Actualités
            </h2>
            <div className="relative overflow-hidden rounded-2xl glass py-3 px-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tickerOffset}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs font-bold text-amber-400/70 shrink-0">
                    {String(tickerOffset + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-1">
                    {news[tickerOffset]?.title}
                  </p>
                  <span className="text-xs text-slate-600 shrink-0 ml-auto">
                    {news[tickerOffset]?.source}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Ticker dots */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {news.slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTickerOffset(i)}
                    className={`h-1 rounded-full transition-all duration-300 min-w-[24px] min-h-[12px] ${
                      i === tickerOffset
                        ? "bg-amber-400 w-6"
                        : "bg-white/10 w-2 hover:bg-white/20"
                    }`}
                    aria-label={`Actualité ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* ═══════════════════════════════════════════
            5. VOICE CONTROL SECTION
            ═══════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="py-8"
        >
          <div className="divider-gold mb-8" />
          <HybridVoiceControl
            state={voice.isSpeaking ? "speaking" : voice.state}
            transcript={voice.transcript}
            lastResponse={voice.lastResponse}
            isSpeaking={voice.isSpeaking}
            isMuted={voice.isMuted}
            onStartListening={voice.startListening}
            onToggleMute={voice.toggleMute}
            error={voice.error}
            isSupported={voice.isSupported}
          />
        </motion.section>

        {/* ═══════════════════════════════════════════
            6. QUICK ACCESS ROW
            ═══════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="py-6"
        >
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-4">
            Liens rapides
          </h2>
          <div className="flex gap-3">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${household?.whatsappNumber || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl glass hover:bg-white/[0.06] transition-all min-h-[80px]"
            >
              <span className="text-2xl">📱</span>
              <span className="text-xs text-slate-400 text-center">WhatsApp</span>
            </a>

            {/* Rappels */}
            <button
              onClick={() => {
                setModalContent(
                  <div className="space-y-4">
                    <h3 className="font-serif text-xl text-amber-200">Rappels</h3>
                    <div className="flex flex-col items-center py-8 text-slate-400">
                      <Bell className="w-10 h-10 mb-3 opacity-40" />
                      <p className="text-sm">Aucun rappel actif</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Utilisez la commande vocale &ldquo;Maison, rappelle-moi de…&rdquo;
                      </p>
                    </div>
                  </div>
                );
                setActiveModal("reminders");
              }}
              className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl glass hover:bg-white/[0.06] transition-all min-h-[80px]"
            >
              <span className="text-2xl">🔔</span>
              <span className="text-xs text-slate-400 text-center">Rappels</span>
            </button>

            {/* POI */}
            <button
              onClick={() => {
                setModalContent(
                  <div className="space-y-4">
                    <h3 className="font-serif text-xl text-amber-200">
                      Points d&apos;intérêt
                    </h3>
                    <div className="flex flex-col items-center py-8 text-slate-400">
                      <MapPin className="w-10 h-10 mb-3 opacity-40" />
                      <p className="text-sm">Aucun point d&apos;intérêt configuré</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Les POI apparaîtront ici une fois configurés par l&apos;administrateur
                      </p>
                    </div>
                  </div>
                );
                setActiveModal("poi");
              }}
              className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl glass hover:bg-white/[0.06] transition-all min-h-[80px]"
            >
              <span className="text-2xl">📍</span>
              <span className="text-xs text-slate-400 text-center">
                Points d&apos;intérêt
              </span>
            </button>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════
            7. EMERGENCY BUTTON
            ═══════════════════════════════════════════ */}
        <EmergencyButton
          hostWhatsapp={household?.whatsappNumber ?? null}
          householdName={household?.householdName ?? "Maison"}
        />

        {/* ═══════════════════════════════════════════
            8. FOOTER
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
                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                className="text-amber-400/20 text-xs"
              >
                ◆
              </motion.span>
              <span className="font-serif text-sm text-gradient-gold tracking-wider">
                Maison Consciente
              </span>
              <motion.span
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                className="text-amber-400/20 text-xs"
              >
                ◆
              </motion.span>
            </div>
            <p className="text-xs text-slate-600">v2.0</p>
          </div>
        </motion.footer>
      </div>

      {/* ═══════════════════════════════════════════
          MODAL SHEET
          ═══════════════════════════════════════════ */}
      <Sheet
        open={activeModal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveModal(null);
            setModalContent(null);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="bg-[#0a0f1e] border-t border-white/[0.06] rounded-t-3xl max-h-[85vh] overflow-y-auto scrollbar-luxe"
        >
          <SheetHeader className="pb-0">
            <SheetTitle className="sr-only">
              {activeModal || "Détails"}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Contenu détaillé
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-8 pt-2">{modalContent}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
