'use client';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — API Config Panel (SuperAdmin)
   
   Grid panel for managing all external API services.
   Fetches configs via server actions, renders responsive
   card grid with Dark Luxe glassmorphism design.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Languages,
  CreditCard,
  Mail,
  CloudSun,
  Building2,
  Sun,
  Radio,
  Newspaper,
  Bus,
  Trophy,
  Loader2,
  RefreshCw,
  Plug,
  // New icons
  Plane,
  UtensilsCrossed,
  Film,
  Telescope,
  Laugh,
  Quote,
  BookOpen,
  BookA,
  Clock,
  Calendar,
  Apple,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ApiConfigCard } from '@/components/admin/ApiConfigCard';
import {
  getApiConfigs,
  updateApiConfig,
  testApiConnection,
  type ApiConfigPublic,
  type TestResult,
  type ServiceKey,
} from '@/actions/admin-api-config';

/* ═══════════════════════════════════════════════════════
   SERVICE METADATA
   ═══════════════════════════════════════════════════════ */

interface ServiceMetadata {
  serviceKey: string;
  serviceName: string;
  serviceDescription: string;
  icon: typeof MapPin;
  iconBg: string;
  iconColor: string;
}

const SERVICE_REGISTRY: ServiceMetadata[] = [
  // ── 📍 Localisation ──
  {
    serviceKey: 'FOURSQUARE',
    serviceName: 'Foursquare',
    serviceDescription: 'Recherche de lieux, restaurants et points d\'intérêt locaux',
    icon: MapPin,
    iconBg: 'bg-[#f94877]/15',
    iconColor: 'text-[#f94877]',
  },
  {
    serviceKey: 'GOOGLE_PLACES',
    serviceName: 'Google Places',
    serviceDescription: 'Recherche avancée de lieux et géolocalisation',
    icon: Building2,
    iconBg: 'bg-[#4285f4]/15',
    iconColor: 'text-[#4285f4]',
  },

  // ── 🌤️ Météo ──
  {
    serviceKey: 'OPENWEATHER',
    serviceName: 'OpenWeather',
    serviceDescription: 'Météo en temps réel pour suggestions contextuelles',
    icon: CloudSun,
    iconBg: 'bg-[#eb6e1e]/15',
    iconColor: 'text-[#eb6e1e]',
  },
  {
    serviceKey: 'OPEN_METEO',
    serviceName: 'Open-Meteo (Météo)',
    serviceDescription: 'Météo en temps réel — gratuit, sans clé API requise',
    icon: Sun,
    iconBg: 'bg-[#22c55e]/15',
    iconColor: 'text-[#22c55e]',
  },

  // ── 🎵 Audio & Radio ──
  {
    serviceKey: 'ICECAST',
    serviceName: 'Icecast (Radio)',
    serviceDescription: 'Annuaire de stations radio en ligne',
    icon: Radio,
    iconBg: 'bg-[#8b5cf6]/15',
    iconColor: 'text-[#8b5cf6]',
  },
  {
    serviceKey: 'RADIO_BROWSER',
    serviceName: 'Radio Browser',
    serviceDescription: 'Annuaire mondial de stations radio — gratuit, sans clé requise',
    icon: Radio,
    iconBg: 'bg-[#f97316]/15',
    iconColor: 'text-[#f97316]',
  },

  // ── 📰 Actualités ──
  {
    serviceKey: 'NEWS_API',
    serviceName: 'News API (Actualités)',
    serviceDescription: 'Flux d\'actualités en temps réel',
    icon: Newspaper,
    iconBg: 'bg-[#f59e0b]/15',
    iconColor: 'text-[#f59e0b]',
  },
  {
    serviceKey: 'GNEWS',
    serviceName: 'GNews',
    serviceDescription: 'Actualités et breaking news en temps réel',
    icon: Sparkles,
    iconBg: 'bg-[#ef4444]/15',
    iconColor: 'text-[#ef4444]',
  },
  {
    serviceKey: 'WIKIPEDIA',
    serviceName: 'Wikipedia',
    serviceDescription: 'Encyclopédie collaborative — résumés et recherches',
    icon: BookOpen,
    iconBg: 'bg-[#b45309]/15',
    iconColor: 'text-[#b45309]',
  },

  // ── ⚽ Sport ──
  {
    serviceKey: 'SPORTS',
    serviceName: 'TheSportsDB (Sports)',
    serviceDescription: 'Scores et résultats sportifs',
    icon: Trophy,
    iconBg: 'bg-[#f43f5e]/15',
    iconColor: 'text-[#f43f5e]',
  },
  {
    serviceKey: 'THESPORTSDB',
    serviceName: 'TheSportsDB',
    serviceDescription: 'Données détaillées équipes, joueurs et championnats',
    icon: Trophy,
    iconBg: 'bg-[#059669]/15',
    iconColor: 'text-[#059669]',
  },

  // ── ✈️ Transport ──
  {
    serviceKey: 'TRANSIT',
    serviceName: 'Transport (Trafic)',
    serviceDescription: 'Informations trafic et transports en commun',
    icon: Bus,
    iconBg: 'bg-[#06b6d4]/15',
    iconColor: 'text-[#06b6d4]',
  },
  {
    serviceKey: 'OPENSKY',
    serviceName: 'OpenSky Network',
    serviceDescription: 'Données de vol en temps réel — gratuit, sans clé requise',
    icon: Plane,
    iconBg: 'bg-[#0d9488]/15',
    iconColor: 'text-[#0d9488]',
  },
  {
    serviceKey: 'NAVITIA',
    serviceName: 'Navitia',
    serviceDescription: 'Transports en commun IDF — lignes, horaires, itinéraires',
    icon: Bus,
    iconBg: 'bg-[#0891b2]/15',
    iconColor: 'text-[#0891b2]',
  },

  // ── 🍽️ Alimentation ──
  {
    serviceKey: 'YELP',
    serviceName: 'Yelp Fusion',
    serviceDescription: 'Avis restaurants, commerces et activités locales',
    icon: UtensilsCrossed,
    iconBg: 'bg-[#dc2626]/15',
    iconColor: 'text-[#dc2626]',
  },
  {
    serviceKey: 'OPENFOODFACTS',
    serviceName: 'Open Food Facts',
    serviceDescription: 'Base de données produits alimentaires — gratuit, sans clé requise',
    icon: Apple,
    iconBg: 'bg-[#16a34a]/15',
    iconColor: 'text-[#16a34a]',
  },

  // ── 🎬 Divertissement ──
  {
    serviceKey: 'TMDB',
    serviceName: 'TMDb',
    serviceDescription: 'Films, séries et acteurs — affiches, notes et détails',
    icon: Film,
    iconBg: 'bg-[#e11d48]/15',
    iconColor: 'text-[#e11d48]',
  },
  {
    serviceKey: 'NASA',
    serviceName: 'NASA APOD',
    serviceDescription: 'Astronomie du jour — image et explication quotidienne',
    icon: Telescope,
    iconBg: 'bg-[#7c3aed]/15',
    iconColor: 'text-[#7c3aed]',
  },
  {
    serviceKey: 'OFFICIAL_JOKE',
    serviceName: 'Blagues API',
    serviceDescription: 'Blagues aléatoires — gratuit, sans clé requise',
    icon: Laugh,
    iconBg: 'bg-[#d946ef]/15',
    iconColor: 'text-[#d946ef]',
  },

  // ── 🧠 Culture ──
  {
    serviceKey: 'QUOTEGARDEN',
    serviceName: 'Citations',
    serviceDescription: 'Citations et proverbes aléatoires — gratuit, sans clé requise',
    icon: Quote,
    iconBg: 'bg-[#c026d3]/15',
    iconColor: 'text-[#c026d3]',
  },

  // ── 🛠️ Utilitaires ──
  {
    serviceKey: 'DEEPL',
    serviceName: 'DeepL',
    serviceDescription: 'Traduction automatique de recettes et contenus multilingues',
    icon: Languages,
    iconBg: 'bg-[#0f2b46]/30',
    iconColor: 'text-[#5bbce4]',
  },
  {
    serviceKey: 'STRIPE',
    serviceName: 'Stripe',
    serviceDescription: 'Paiements en ligne, abonnements et gestion des factures',
    icon: CreditCard,
    iconBg: 'bg-[#635bff]/15',
    iconColor: 'text-[#635bff]',
  },
  {
    serviceKey: 'RESEND',
    serviceName: 'Resend',
    serviceDescription: 'Envoi d\'emails transactionnels et notifications',
    icon: Mail,
    iconBg: 'bg-[#e2e8f0]/10',
    iconColor: 'text-[#e2e8f0]',
  },
  {
    serviceKey: 'HOLIDAYS',
    serviceName: 'Jours Fériés',
    serviceDescription: 'Jours fériés et jours spéciaux par pays et région',
    icon: Calendar,
    iconBg: 'bg-[#ea580c]/15',
    iconColor: 'text-[#ea580c]',
  },
  {
    serviceKey: 'DICTIONARY',
    serviceName: 'Dictionnaire',
    serviceDescription: 'Définitions, synonymes et prononciation — gratuit, sans clé requise',
    icon: BookA,
    iconBg: 'bg-[#65a30d]/15',
    iconColor: 'text-[#65a30d]',
  },
  {
    serviceKey: 'TIMEZONEDB',
    serviceName: 'Fuseaux Horaires',
    serviceDescription: 'Conversions et informations sur les fuseaux horaires mondiaux',
    icon: Clock,
    iconBg: 'bg-[#14b8a6]/15',
    iconColor: 'text-[#14b8a6]',
  },
];

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
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

/* ═══════════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════════ */

function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-xl bg-white/[0.06] shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28 bg-white/[0.06]" />
          <Skeleton className="h-3 w-48 bg-white/[0.06]" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full bg-white/[0.06]" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-12 bg-white/[0.06]" />
        <Skeleton className="h-10 w-full rounded-xl bg-white/[0.06]" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-16 bg-white/[0.06]" />
        <Skeleton className="h-10 w-full rounded-xl bg-white/[0.06]" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-10 flex-1 rounded-xl bg-white/[0.06]" />
        <Skeleton className="h-10 w-20 rounded-xl bg-white/[0.06]" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   API CONFIG PANEL
   ═══════════════════════════════════════════════════════ */

export function ApiConfigPanel() {
  const [configs, setConfigs] = useState<ApiConfigPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Fetch configs ── */
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getApiConfigs();
      if (result.success) {
        setConfigs(result.configs);
      } else {
        setError('Impossible de charger les configurations API');
      }
    } catch {
      setError('Erreur réseau lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  /* ── Save handler ── */
  const handleSave = async (data: {
    serviceKey: string;
    apiKey: string;
    isActive: boolean;
    baseUrl: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await updateApiConfig({
        serviceKey: data.serviceKey as ServiceKey,
        apiKey: data.apiKey,
        isActive: data.isActive,
        baseUrl: data.baseUrl || undefined,
      });

      if (result.success) {
        // Refresh configs after save
        await fetchConfigs();
      }

      return result;
    } catch {
      return { success: false, error: 'Erreur serveur' };
    }
  };

  /* ── Test handler ── */
  const handleTest = async (
    serviceKey: string,
  ): Promise<{
    success: boolean;
    result?: TestResult;
    error?: string;
  }> => {
    try {
      const result = await testApiConnection({
        serviceKey: serviceKey as ServiceKey,
      });

      if (result.success) {
        // Refresh to get updated status
        await fetchConfigs();
      }

      return result;
    } catch {
      return { success: false, error: 'Erreur serveur' };
    }
  };

  /* ── Get service metadata ── */
  const getMetadata = (serviceKey: string): ServiceMetadata => {
    return (
      SERVICE_REGISTRY.find((s) => s.serviceKey === serviceKey) ?? {
        serviceKey,
        serviceName: serviceKey,
        serviceDescription: 'Service externe',
        icon: Plug,
        iconBg: 'bg-[#64748b]/15',
        iconColor: 'text-[#64748b]',
      }
    );
  };

  /* ── Compute summary stats ── */
  const configuredCount = configs.filter(
    (c) => c.maskedKey && c.isActive && c.status === 'ok',
  ).length;
  const totalCount = SERVICE_REGISTRY.length;
  const errorCount = configs.filter(
    (c) => c.maskedKey && c.status === 'error',
  ).length;

  return (
    <motion.div
      custom={0}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Summary header ── */}
      <div className="glass rounded-xl p-5 inner-glow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center">
              <Plug className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold tracking-tight text-foreground">
                APIs & Intégrations
              </h2>
              <p className="text-[11px] text-[#475569] mt-0.5">
                Configuration centralisée des services externes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats badges */}
            <div className="flex items-center gap-2">
              <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                {configuredCount}/{totalCount} actifs
              </Badge>
              {errorCount > 0 && (
                <Badge className="bg-[#f87171]/10 text-[#f87171] border-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  {errorCount} erreur{errorCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Refresh button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchConfigs()}
              disabled={loading}
              className="shrink-0 text-[#64748b] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
              aria-label="Rafraîchir les configurations"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Security notice */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-start gap-2">
          <span className="text-[10px] text-[#475569] leading-relaxed">
            🔐 Les clés API sont chiffrées (AES-256-GCM) et ne sont jamais exposées côté client.
            Toute modification est tracée dans le journal d&apos;audit.
          </span>
        </div>
      </div>

      {/* ── Error state ── */}
      {error && !loading && (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-sm text-[#f87171]">{error}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={fetchConfigs}
            className="mt-3 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary-light)] transition-colors"
          >
            Réessayer
          </motion.button>
        </div>
      )}

      {/* ── Cards grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: SERVICE_REGISTRY.length }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SERVICE_REGISTRY.map((meta, i) => {
            const config = configs.find(
              (c) => c.serviceKey === meta.serviceKey,
            );

            return (
              <motion.div
                key={meta.serviceKey}
                custom={0.05 + i * 0.06}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                <ApiConfigCard
                  id={config?.id ?? ''}
                  serviceKey={meta.serviceKey}
                  maskedKey={config?.maskedKey ?? ''}
                  baseUrl={config?.baseUrl ?? null}
                  isActive={config?.isActive ?? false}
                  status={config?.status ?? 'untested'}
                  lastTested={config?.lastTested ?? null}
                  icon={meta.icon}
                  iconBg={meta.iconBg}
                  iconColor={meta.iconColor}
                  serviceName={meta.serviceName}
                  serviceDescription={meta.serviceDescription}
                  onSave={handleSave}
                  onTest={handleTest}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Fallback notice ── */}
      <div className="glass rounded-xl p-4">
        <p className="text-[11px] text-[#475569] leading-relaxed">
          💡 <strong className="text-[#94a3b8]">Fallback automatique :</strong> Si un service est inactif ou en erreur,
          l&apos;application utilise automatiquement les données locales ou désactive la fonctionnalité correspondante
          sans interrompre l&apos;expérience utilisateur.
        </p>
      </div>
    </motion.div>
  );
}
