'use client';

import { useAppStore, type AppView } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Construction, QrCode, History, Palette, Users, Key, MapPin } from 'lucide-react';
import { Diamond } from 'lucide-react';

/* ── Dynamic imports for heavy views ── */
const Dashboard = dynamic(
  () => import('@/components/dashboard/dashboard').then(m => ({ default: m.Dashboard })),
  { ssr: false, loading: () => <ViewLoader /> },
);

const AdminDashboard = dynamic(
  () => import('@/components/admin/admin-dashboard').then(m => ({ default: m.AdminDashboard })),
  { ssr: false, loading: () => <ViewLoader /> },
);

const ZoneManager = dynamic(
  () => import('@/components/zones/zone-manager').then(m => ({ default: m.ZoneManager })),
  { ssr: false, loading: () => <ViewLoader /> },
);

const ZoneDetail = dynamic(
  () => import('@/components/zones/zone-detail').then(m => ({ default: m.ZoneDetail })),
  { ssr: false, loading: () => <ViewLoader /> },
);

const SettingsPage = dynamic(
  () => import('@/components/settings/settings-page').then(m => ({ default: m.SettingsPage })),
  { ssr: false, loading: () => <ViewLoader /> },
);

const MessageCenter = dynamic(
  () => import('@/components/messages/message-center').then(m => ({ default: m.MessageCenter })),
  { ssr: false, loading: () => <ViewLoader /> },
);

const RecipeList = dynamic(
  () => import('@/components/recipes/recipe-list').then(m => ({ default: m.RecipeList })),
  { ssr: false, loading: () => <ViewLoader /> },
);

const PricingView = dynamic(
  () => import('@/components/billing/pricing-view').then(m => ({ default: m.PricingView })),
  { ssr: false, loading: () => <ViewLoader /> },
);

const BillingPage = dynamic(
  () => import('@/components/billing/billing-page').then(m => ({ default: m.BillingPage })),
  { ssr: false, loading: () => <ViewLoader /> },
);

const DisplaySettingsPanel = dynamic(
  () => import('@/components/display/display-settings-panel').then(m => ({ default: m.DisplaySettingsPanel })),
  { ssr: false, loading: () => <ViewLoader /> },
);

const HospitalitySettingsPanel = dynamic(
  () => import('@/components/hospitality/HospitalitySettingsPanel').then(m => ({ default: m.HospitalitySettingsPanel })),
  { ssr: false, loading: () => <ViewLoader /> },
);

const HospitalityExtendedPanel = dynamic(
  () => import('@/components/settings/hospitality-extended-panel').then(m => ({ default: m.HospitalityExtendedPanel })),
  { ssr: false, loading: () => <ViewLoader /> },
);

const HospitalityAnalytics = dynamic(
  () => import('@/components/hospitality/HospitalityAnalytics').then(m => ({ default: m.HospitalityAnalytics })),
  { ssr: false, loading: () => <ViewLoader /> },
);

const BarcodeScannerModal = dynamic(
  () => import('@/components/shared/barcode-scanner-modal'),
  { ssr: false },
);

const AnalyticsPanel = dynamic(
  () => import('@/components/dashboard/analytics-panel').then(m => ({ default: m.AnalyticsPanel })),
  { ssr: false, loading: () => <ViewLoader /> },
);

/* ── Placeholder for views under development ── */
function ComingSoonView({ title, icon: Icon, description }: { title: string; icon: React.ElementType; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center mx-auto mb-6">
          <Icon className="w-7 h-7 text-[var(--accent-primary)]" />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Construction className="w-4 h-4 text-[var(--accent-primary)]/60" />
          <span className="text-[10px] font-semibold text-[var(--accent-primary)]/70 uppercase tracking-widest">Bientôt disponible</span>
        </div>
        <h2 className="text-xl font-serif font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-[oklch(0.60_0.02_260)] max-w-[320px] leading-relaxed">{description}</p>
      </motion.div>
    </div>
  );
}

/* ── Loading skeleton for lazy-loaded views ── */
function ViewLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Diamond className="w-8 h-8 text-[var(--accent-primary)] animate-pulse" />
        <span className="text-xs text-[oklch(0.50_0.02_260)] tracking-wide">Chargement…</span>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW ROUTER
   Maps AppView to the correct component
   ═══════════════════════════════════════════════════════ */
export function ViewRouter() {
  const { currentView, selectedZoneId } = useAppStore();
  const { user } = useAuthStore();

  switch (currentView) {
    case 'dashboard':
      return <Dashboard />;

    case 'admin':
      if (user?.role === 'superadmin') {
        return <AdminDashboard />;
      }
      return <Dashboard />;

    case 'zones':
      return <ZoneManager />;

    case 'zone-detail':
      return <ZoneDetail />;

    case 'scan':
      return (
        <div className="max-w-md mx-auto">
          <BarcodeScannerModal
            onClose={() => useAppStore.getState().setView('dashboard')}
            onResult={(_code, _name) => {
              toast.success('Produit scanné !');
            }}
          />
        </div>
      );

    case 'interactions':
      return <AnalyticsPanel />;

    case 'messages':
      return <MessageCenter />;

    case 'recipes':
      return <RecipeList />;

    case 'settings':
      return <SettingsPage />;

    case 'appearance':
      return (
        <ComingSoonView
          title="Apparence"
          icon={Palette}
          description="Personnalisez le thème, les couleurs et les polices de votre interface."
        />
      );

    case 'members':
      return (
        <ComingSoonView
          title="Membres du foyer"
          icon={Users}
          description="Gérez les membres de votre foyer et leurs permissions."
        />
      );

    case 'display':
      return <DisplaySettingsPanel />;

    case 'hospitality':
      return <HospitalitySettingsPanel />;

    case 'guest-checkin':
      return (
        <ComingSoonView
          title="Enregistrement invité"
          icon={Key}
          description="Gérez l'enregistrement et le départ de vos invités."
        />
      );

    case 'pricing':
      return <PricingView />;

    case 'billing':
      return <BillingPage />;

    case 'local-guide':
      return (
        <ComingSoonView
          title="Guide Local"
          icon={MapPin}
          description="Découvrez les points d'intérêt et recommandations autour de votre lieu."
        />
      );

    case 'hospitality-settings':
      return <HospitalityExtendedPanel />;

    case 'hospitality-analytics':
      return <HospitalityAnalytics />;

    default:
      return <Dashboard />;
  }
}
