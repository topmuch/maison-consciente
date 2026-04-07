'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Key,
  Compass,
  Sparkles,
  Globe,
  MessageSquare,
  MessageCircle,
  ScanLine,
  Heart,
  Sun,
  Moon,
  CloudRain,
  Thermometer,
  Plane,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { useI18n, LOCALE_LABELS, type Locale } from '@/contexts/I18nContext';
import { getContextualPOIs, type WeatherInfo, type POI } from '@/lib/weather-suggestions';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/shared/glass-card';
import GuestCheckIn from '@/components/hospitality/guest-check-in';
import TravelJournal from '@/components/hospitality/travel-journal';
import FeedbackForm from '@/components/hospitality/feedback-form';
import { ReviewFlow } from '@/components/hospitality/ReviewFlow';
import { ContactModal } from '@/components/hospitality/ContactModal';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Hospitality Dashboard V2

   Full traveler-facing dashboard integrating:
   - Contextual weather-based POI suggestions
   - Digital check-in/out with live guest list
   - Travel journal (carnet de séjour)
   - Post-stay feedback form
   - i18n across 10 languages
   ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

/* ── Types ── */
interface DashboardData {
  pois: POI[];
  checkIns: { id: string; guestName: string; checkInAt: string; notes: string | null }[];
  journal: { id: string; title: string; content: string; photos: string[]; createdAt: string }[];
  feedbacks: { id: string; rating: number; comment: string | null; submittedAt: string }[];
  activeGuestCount: number;
}

/* ── Language Selector ── */
function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as Locale;
    setLocale(newLocale);
    toast.success(`Langue: ${LOCALE_LABELS[newLocale]}`);
  };

  return (
    <div className="relative flex items-center gap-2">
      <Globe className="w-4 h-4 text-[oklch(0.50_0.02_260)]" />
      <select
        value={locale}
        onChange={handleChange}
        className="bg-black/20 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[oklch(0.70_0.02_260)] focus:outline-none focus:border-[var(--accent-primary)]/30 transition-colors duration-300 appearance-none cursor-pointer pr-8"
        aria-label="Langue"
      >
        <option value="fr">FR</option>
        <option value="en">EN</option>
        <option value="es">ES</option>
        <option value="de">DE</option>
        <option value="it">IT</option>
        <option value="pt">PT</option>
        <option value="nl">NL</option>
        <option value="pl">PL</option>
        <option value="ja">JA</option>
        <option value="ar">AR</option>
      </select>
    </div>
  );
}

/* ── Weather Icon ── */
function WeatherIcon({ weathercode }: { weathercode: number }) {
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(weathercode)) {
    return <CloudRain className="w-5 h-5 text-[#818cf8]" />;
  }
  return <Sun className="w-5 h-5 text-[var(--accent-primary)]" />;
}

/* ── Suggestion Card ── */
function SuggestionCard({
  poi,
  reason,
  index,
}: {
  poi: POI;
  reason: string;
  index: number;
}) {
  const catIcons: Record<string, React.ElementType> = {
    coffee: Compass, restaurant: Compass, pharmacy: MapPin, activity: Compass,
    museum: Heart, spa: Heart, bar: Compass, nightlife: Compass,
    market: MapPin, park: MapPin, cafe: Compass, transport: MapPin,
  };
  const catColors: Record<string, string> = {
    coffee: 'text-[#c77d5a] bg-[#c77d5a]/10',
    restaurant: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10',
    pharmacy: 'text-[#f87171] bg-[#f87171]/10',
    activity: 'text-[#34d399] bg-[#34d399]/10',
    default: 'text-[oklch(0.60_0.02_260)] bg-[oklch(0.60_0.02_260)]/10',
  };
  const Icon = catIcons[poi.category] || Compass;
  const colorClass = catColors[poi.category] || catColors.default;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      whileHover={{ scale: 1.01 }}
      className="bg-black/20 rounded-xl p-3 border border-white/[0.05] hover:border-[var(--accent-primary)]/20 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${colorClass}`}>
            <Icon size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground/90 truncate">{poi.name}</p>
            <p className="text-[10px] text-[oklch(0.45_0.02_260)] mt-0.5">
              {poi.distanceMin} min · {poi.address || 'Quartier Centre'}
            </p>
            {poi.description && (
              <p className="text-[11px] text-[oklch(0.55_0.02_260)] mt-1 line-clamp-2">
                {poi.description}
              </p>
            )}
          </div>
        </div>
        {poi.rating && (
          <span className="text-xs text-[var(--accent-primary)] flex items-center gap-0.5 shrink-0">
            ★ {poi.rating}
          </span>
        )}
      </div>
      {reason && (
        <div className="mt-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[var(--accent-primary)]/50" />
          <span className="text-[10px] text-[var(--accent-primary)]/70">{reason}</span>
        </div>
      )}
    </motion.div>
  );
}

/* ── Main Component ── */
export default function HospitalityDashboard() {
  const { userName, householdName } = useAuthStore();
  const { setView } = useAppStore();
  const { t } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactPrefill, setContactPrefill] = useState<{ message?: string; type?: 'cleaning' | 'equipment' | 'access' | 'other' }>({});

  /* ── Fetch all dashboard data ── */
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/hospitality/dashboard');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      }
    } catch {
      // silent — will show skeleton
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Fetch weather from Open-Meteo ── */
  const fetchWeather = useCallback(async () => {
    try {
      setWeatherLoading(true);
      // Default: Paris coordinates. In production, use household settings.
      const lat = 48.8566;
      const lon = 2.3522;
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );
      if (res.ok) {
        const json = await res.json();
        const cw = json.current_weather;
        if (cw) {
          setWeather({
            weathercode: cw.weathercode,
            temperature: cw.temperature,
            condition: getWeatherLabel(cw.weathercode),
          });
        }
      }
    } catch {
      // Weather unavailable — non-critical
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchWeather();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData, fetchWeather]);

  const hour = new Date().getHours();
  const isEvening = hour >= 18;

  /* ── Generate contextual suggestions ── */
  const suggestions = weather && data?.pois
    ? getContextualPOIs(weather, hour, data.pois)
    : [];

  const delays = [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48];

  return (
    <div className="space-y-6">
      {/* ═══ WELCOME HERO ═══ */}
      <motion.div custom={delays[0]} variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard variant="default" glow className="p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none">
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(212,168,83,0.2) 0%, transparent 40%, transparent 60%, rgba(52,211,153,0.15) 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 8s ease infinite',
              }}
            />
          </div>
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/40 to-transparent" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="hidden sm:flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[#34d399]/10 border border-[var(--accent-primary)]/20 shrink-0">
                <Heart className="w-7 h-7 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-serif tracking-tight">
                  <span className="text-gradient-gold">
                    {t.hospitality.greeting}, {userName || 'Voyageur'}
                  </span>
                </h1>
                <p className="text-sm text-[oklch(0.60_0.02_260)] mt-1.5">
                  {householdName || 'Hébergement'}
                </p>
              </div>
            </div>
            <LanguageSelector />
          </div>
        </GlassCard>
      </motion.div>

      {/* ═══ WEATHER + CONTEXT HEADER ═══ */}
      <motion.div custom={delays[1]} variants={fadeUp} initial="hidden" animate="visible">
        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {weatherLoading ? (
              <Skeleton className="h-10 w-10 rounded-xl bg-white/[0.06]" />
            ) : weather ? (
              <div className="p-2 bg-black/20 rounded-xl border border-white/[0.06]">
                <WeatherIcon weathercode={weather.weathercode} />
              </div>
            ) : (
              <div className="p-2 bg-black/20 rounded-xl">
                <Plane className="w-5 h-5 text-[var(--accent-primary)]/40" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-serif text-gradient-gold">
                  {t.hospitality.intelligent_guide}
                </p>
                {isEvening ? (
                  <Moon className="w-4 h-4 text-[#818cf8]" />
                ) : (
                  <Sun className="w-4 h-4 text-[var(--accent-primary)]/60" />
                )}
              </div>
              <p className="text-xs text-[oklch(0.50_0.02_260)]">
                {weatherLoading
                  ? t.hospitality.weather_loading
                  : weather
                    ? `${weather.temperature}°C · ${weather.condition}`
                    : 'Prêt à vous guider'}
              </p>
            </div>
          </div>
          {data && data.activeGuestCount > 0 && (
            <div className="flex items-center gap-2 bg-[#34d399]/10 px-3 py-1.5 rounded-full border border-[#34d399]/15">
              <Users className="w-3.5 h-3.5 text-[#34d399]" />
              <span className="text-xs font-medium text-[#34d399]">
                {data.activeGuestCount} {t.hospitality.travelers_present}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ LOADING STATE ═══ */}
      {loading && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-72 w-full rounded-2xl bg-white/[0.04]" />
            <Skeleton className="h-72 w-full rounded-2xl bg-white/[0.04]" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-2xl bg-white/[0.04]" />
            <Skeleton className="h-64 w-full rounded-2xl bg-white/[0.04]" />
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT GRID ═══ */}
      {!loading && data && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Check-in/out */}
            <motion.div custom={delays[2]} variants={fadeUp} initial="hidden" animate="visible">
              <GuestCheckIn activeGuests={data.checkIns} onRefresh={fetchDashboardData} />
            </motion.div>

            {/* Contextual Guide / Suggestions */}
            <motion.div custom={delays[3]} variants={fadeUp} initial="hidden" animate="visible">
              <div className="glass rounded-2xl p-5 inner-glow overflow-hidden relative h-full">
                <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 bg-[var(--accent-primary)]/10 rounded-xl border border-[var(--accent-primary)]/15">
                    <Sparkles className="text-[var(--accent-primary)] w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-gradient-gold">
                      {t.hospitality.intelligent_guide}
                    </h3>
                    <p className="text-[10px] text-[oklch(0.45_0.02_260)]">
                      {suggestions.length > 0 ? t.hospitality.suggestions_reason : 'Découvrez les environs'}
                    </p>
                  </div>
                  <button
                    onClick={() => setView('local-guide')}
                    className="ml-auto text-[10px] text-[var(--accent-primary)]/70 hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                  >
                    Voir tout →
                  </button>
                </div>

                {suggestions.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-luxe">
                    {suggestions.map((s, i) => (
                      <SuggestionCard key={s.poi.id} poi={s.poi} reason={s.reason} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Compass className="w-8 h-8 text-[oklch(0.30_0.02_260)] mx-auto mb-2" />
                      <p className="text-xs text-[oklch(0.45_0.02_260)]">
                        Ajoutez des points d&apos;intérêt pour voir des suggestions
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Travel Journal */}
            <motion.div custom={delays[4]} variants={fadeUp} initial="hidden" animate="visible">
              <TravelJournal entries={data.journal} onRefresh={fetchDashboardData} />
            </motion.div>

            {/* Smart Review Google */}
            <motion.div custom={delays[5]} variants={fadeUp} initial="hidden" animate="visible">
              <ReviewFlow
                onComplete={() => fetchDashboardData()}
                onContactHost={(message) => {
                  setContactPrefill({ message });
                  setShowContactModal(true);
                }}
              />
            </motion.div>
          </div>
        </>
      )}

      {/* ═══ CONTACT HOST MODAL ═══ */}
      <ContactModal
        open={showContactModal}
        onOpenChange={setShowContactModal}
        prefillMessage={contactPrefill.message}
        prefillType={contactPrefill.type}
      />

      {/* ═══ QUICK ACTIONS ═══ */}
      <motion.div custom={delays[6]} variants={fadeUp} initial="hidden" animate="visible">
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Compass, label: t.hospitality.guide, view: 'local-guide' as const, color: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10' },
            { icon: ScanLine, label: t.home.scan_prompt, view: 'scan' as const, color: 'text-[#34d399] bg-[#34d399]/10' },
            { icon: MessageSquare, label: t.home.messages, view: 'messages' as const, color: 'text-[#818cf8] bg-[#818cf8]/10' },
            { icon: MessageCircle, label: 'Contacter', action: 'contact' as const, color: 'text-[#f87171] bg-[#f87171]/10' },
          ].map((action) => (
            <motion.div key={action.view || action.action} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <button
                onClick={() => action.view ? setView(action.view) : action.action === 'contact' ? setShowContactModal(true) : null}
                className="w-full rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.08] hover:bg-[var(--accent-primary)]/[0.06] hover:border-[var(--accent-primary)]/20 transition-all duration-300 group cursor-pointer"
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-[oklch(0.70_0.02_260)] group-hover:text-[var(--accent-primary)] transition-colors duration-300">
                  {action.label}
                </span>
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Footer ═══ */}
      <div className="text-center py-4">
        <p className="text-[10px] text-[oklch(0.35_0.02_260)] font-mono tracking-wider">
          Maison Consciente · Mode Hospitalité · v2.0
        </p>
      </div>
    </div>
  );
}

/* ── Weather label helper ── */
function getWeatherLabel(code: number): string {
  if ([0].includes(code)) return 'Dégagé';
  if ([1, 2, 3].includes(code)) return 'Partiellement nuageux';
  if ([45, 48].includes(code)) return 'Brouillard';
  if ([51, 53, 55].includes(code)) return 'Bruine';
  if ([61, 63, 65].includes(code)) return 'Pluie';
  if ([71, 73, 75, 77].includes(code)) return 'Neige';
  if ([80, 81, 82].includes(code)) return 'Averses';
  if ([95, 96, 99].includes(code)) return 'Orage';
  return 'Variable';
}
