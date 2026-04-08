'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { applyAccentTheme, getPersistedAccentColor, getAccentTheme } from '@/lib/accent-colors';
import { initAudioOnInteraction } from '@/lib/ambient-sounds';
import { useInactivity } from '@/hooks/use-inactivity';
import { trackEvent, identifyUser, resetAnalytics } from '@/lib/analytics';

/* ── Heavy components loaded dynamically ── */
const AppShell = dynamic(() => import('@/components/layout/app-shell').then(m => ({ default: m.AppShell })), { ssr: false });
const AuthPage = dynamic(() => import('@/components/auth/auth-page').then(m => ({ default: m.AuthPage })), { ssr: false });
const AirHomePage = dynamic(() => import('@/components/landing/airhome-page').then(m => ({ default: m.AirHomePage })), { ssr: false });
const Dashboard = dynamic(() => import('@/components/dashboard/dashboard').then(m => ({ default: m.Dashboard })), { ssr: false });
const ZoneManager = dynamic(() => import('@/components/zones/zone-manager').then(m => ({ default: m.ZoneManager })), { ssr: false });
const ZoneDetail = dynamic(() => import('@/components/zones/zone-detail').then(m => ({ default: m.ZoneDetail })), { ssr: false });
const ScanPage = dynamic(() => import('@/components/scan/scan-page').then(m => ({ default: m.ScanPage })), { ssr: false });
const InteractionHistory = dynamic(() => import('@/components/interactions/interaction-history').then(m => ({ default: m.InteractionHistory })), { ssr: false });
const MessageCenter = dynamic(() => import('@/components/messages/message-center').then(m => ({ default: m.MessageCenter })), { ssr: false });
const RecipeList = dynamic(() => import('@/components/recipes/recipe-list').then(m => ({ default: m.RecipeList })), { ssr: false });
const AdminDashboard = dynamic(() => import('@/components/admin/admin-dashboard').then(m => ({ default: m.AdminDashboard })), { ssr: false });
const SettingsPage = dynamic(() => import('@/components/settings/settings-page').then(m => ({ default: m.SettingsPage })), { ssr: false });
const SignatureLoading = dynamic(() => import('@/components/shared/signature-loading').then(m => ({ default: m.SignatureLoading })), { ssr: false });
const StandbyOverlay = dynamic(() => import('@/components/shared/standby-overlay').then(m => ({ default: m.StandbyOverlay })), { ssr: false });
const LuxuryAudioPlayer = dynamic(() => import('@/components/audio/luxury-audio-player').then(m => ({ default: m.LuxuryAudioPlayer })), { ssr: false });
const QuickOnboarding = dynamic(() => import('@/components/onboarding/quick-onboarding').then(m => ({ default: m.QuickOnboarding })), { ssr: false });

const DemoSelection = dynamic(() => import('@/components/demo/DemoSelection'), { ssr: false });
const DemoParticulier = dynamic(() => import('@/components/demo/DemoParticulier'), { ssr: false });
const DemoAirbnb = dynamic(() => import('@/components/demo/DemoAirbnb'), { ssr: false });

const HospitalityDashboard = dynamic(() => import('@/components/hospitality/hospitality-dashboard'), {
  loading: () => <div className="space-y-4"><Skeleton className="h-40 w-full rounded-xl bg-white/[0.04]" /><Skeleton className="h-60 w-full rounded-xl bg-white/[0.04]" /></div>,
  ssr: false
});

const LocalGuide = dynamic(() => import('@/components/hospitality/local-guide'), {
  loading: () => <div className="space-y-4"><Skeleton className="h-11 w-48 rounded-xl bg-white/[0.04]" /><Skeleton className="h-7 w-24 rounded-full bg-white/[0.04]" /><Skeleton className="h-20 w-full rounded-xl bg-white/[0.04]" /><Skeleton className="h-20 w-full rounded-xl bg-white/[0.04]" /></div>,
  ssr: false
});

const GuestCheckIn = dynamic(() => import('@/components/hospitality/guest-check-in'), {
  loading: () => <div className="space-y-4"><Skeleton className="h-32 w-full rounded-xl bg-white/[0.04]" /><Skeleton className="h-48 w-full rounded-xl bg-white/[0.04]" /></div>,
  ssr: false
});

const PricingView = dynamic(() => import('@/components/billing/pricing-view').then(m => ({ default: m.PricingView })), {
  loading: () => <div className="max-w-6xl mx-auto"><div className="space-y-8"><div className="text-center space-y-3"><div className="h-8 w-64 mx-auto rounded-lg bg-white/[0.04] animate-pulse" /><div className="h-5 w-96 mx-auto rounded-lg bg-white/[0.04] animate-pulse" /></div></div></div>,
  ssr: false
});

const BillingPage = dynamic(() => import('@/components/billing/billing-page').then(m => ({ default: m.BillingPage })), {
  loading: () => <div className="max-w-4xl mx-auto space-y-4"><Skeleton className="h-40 w-full rounded-xl bg-white/[0.04]" /><Skeleton className="h-60 w-full rounded-xl bg-white/[0.04]" /></div>,
  ssr: false
});

const AnalyticsPanel = dynamic(() => import('@/components/dashboard/analytics-panel').then(m => ({ default: m.AnalyticsPanel })), {
  loading: () => <div className="max-w-6xl mx-auto space-y-4"><Skeleton className="h-10 w-10 rounded-xl bg-white/[0.04]" /><Skeleton className="h-6 w-64 bg-white/[0.04]" /><Skeleton className="h-40 w-full rounded-xl bg-white/[0.04]" /></div>,
  ssr: false
});

function ViewRouter() {
  const { currentView } = useAppStore();
  const { householdType } = useAuthStore();

  // If hospitality mode, route to hospitality views for dashboard
  if (householdType === 'hospitality') {
    switch (currentView) {
      case 'dashboard':
        return <HospitalityDashboard />;
      case 'local-guide':
        return (
          <div className="max-w-2xl mx-auto">
            <LocalGuide />
          </div>
        );
      case 'guest-checkin':
        return (
          <div className="max-w-xl mx-auto">
            <GuestCheckIn />
          </div>
        );
      case 'pricing':
        return <PricingView />;
      case 'billing':
        return <BillingPage />;
      case 'hospitality-settings':
        return <SettingsPage />;
      case 'analytics':
        return <AnalyticsPanel />;
      default:
        return <HospitalityDashboard />;
    }
  }

  // Home mode — original routing
  switch (currentView) {
    case 'dashboard':
      return <Dashboard />;
    case 'zones':
      return <ZoneManager />;
    case 'zone-detail':
      return <ZoneDetail />;
    case 'scan':
      return <ScanPage />;
    case 'interactions':
      return <InteractionHistory />;
    case 'messages':
      return <MessageCenter />;
    case 'recipes':
      return <RecipeList />;
    case 'pricing':
      return <PricingView />;
    case 'billing':
      return <BillingPage />;
    case 'admin':
      return <AdminDashboard />;
    case 'display':
      return <SettingsPage />;
    case 'settings':
    case 'members':
      return <SettingsPage />;
    case 'analytics':
      return <AnalyticsPanel />;
    default:
      return <Dashboard />;
  }
}

/* ── Dynamic SEO: update document meta tags for hospitality households ── */
async function applyHouseholdSEO() {
  try {
    const res = await fetch('/api/household/settings');
    if (!res.ok) return;
    const json = await res.json();
    if (!json.success || !json.settings) return;

    const { seoTitle, seoDescription, seoKeywords, seoOgImage } = json.settings;
    if (seoTitle) document.title = seoTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (seoDescription) {
      setMeta('name', 'description', seoDescription);
    }
    if (seoKeywords && seoKeywords.length > 0) {
      setMeta('name', 'keywords', seoKeywords.join(', '));
    }
    if (seoOgImage) {
      setMeta('property', 'og:image', seoOgImage);
    }
  } catch {
    // Non-critical — silent fail
  }
}

export default function Home() {
  const { isAuthenticated, isLoading, setAuth, setLoading, clearAuth, setHouseholdType, user, householdName } = useAuthStore();
  const { isIdle, resetTimer } = useInactivity({ timeout: 120000, enabled: isAuthenticated });
  const [showStandby, setShowStandby] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [prefillType, setPrefillType] = useState<'home' | 'hospitality' | null>(null);
  const [demoView, setDemoView] = useState<'landing' | 'select' | 'particulier' | 'airbnb'>('landing');

  useEffect(() => {
    // Apply accent color from localStorage on mount
    const accent = getPersistedAccentColor();
    applyAccentTheme(getAccentTheme(accent));

    // Initialize audio context on first interaction
    initAudioOnInteraction();

    // Check initial standby mode from localStorage
    const lastScan = localStorage.getItem('mc-last-scan-time');
    if (lastScan) {
      const elapsed = Date.now() - parseInt(lastScan, 10);
      if (elapsed > 7200000) {
        setShowStandby(true);
      }
    }

    // Handle Stripe checkout result
    const params = new URLSearchParams(window.location.search);
    const checkoutResult = params.get('checkout');
    if (checkoutResult === 'success') {
      toast.success('Paiement réussi ! Votre abonnement est maintenant actif.');
      trackEvent('subscription_checkout_success');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (checkoutResult === 'canceled') {
      toast.error('Paiement annulé. Votre abonnement reste inchangé.');
      trackEvent('subscription_checkout_canceled');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('billing') === 'portal') {
      toast.info('Retour du portail de facturation Stripe.');
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Check auth
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          const user = data.user || data;
          if (user && user.id) {
            setAuth({
              userId: user.id,
              email: user.email,
              householdId: user.householdId,
              role: user.role,
              name: user.name,
              avatar: user.avatar,
              householdName: user.household?.name,
              householdType: user.household?.type,
            });
            // Identify user in analytics
            identifyUser(user.id, {
              email: user.email,
              name: user.name,
              householdType: user.household?.type,
              role: user.role,
            });
            // Dynamic SEO: apply household meta tags for hospitality
            if (user.household?.type === 'hospitality') {
              applyHouseholdSEO();
            }
          } else {
            clearAuth();
            resetAnalytics();
          }
        } else {
          clearAuth();
          resetAnalytics();
        }
      } catch {
        clearAuth();
        resetAnalytics();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [setAuth, clearAuth, setLoading]);

  const handleDismissStandby = () => {
    setShowStandby(false);
    resetTimer();
    localStorage.setItem('mc-last-scan-time', Date.now().toString());
  };

  const handleRegisterSuccess = useCallback((regHouseholdType: string) => {
    if (regHouseholdType === 'hospitality') {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  if (isLoading) {
    return <SignatureLoading />;
  }

  // Demo views (accessible without authentication)
  if (demoView === 'select') {
    return (
      <DemoSelection
        onSelectParticulier={() => setDemoView('particulier')}
        onSelectAirbnb={() => setDemoView('airbnb')}
      />
    );
  }
  if (demoView === 'particulier') {
    return <DemoParticulier onBack={() => setDemoView('select')} />;
  }
  if (demoView === 'airbnb') {
    return <DemoAirbnb onBack={() => setDemoView('select')} />;
  }

  if (!isAuthenticated) {
    if (!showAuth) {
      return (
        <AirHomePage
          onShowAuth={() => setShowAuth(true)}
          onShowAuthType={(type) => {
            setPrefillType(type);
            setShowAuth(true);
          }}
          onShowDemo={() => setDemoView('select')}
        />
      );
    }
    return <AuthPage onBack={() => { setShowAuth(false); setPrefillType(null); }} prefillType={prefillType} onRegisterSuccess={handleRegisterSuccess} />;
  }

  if (showOnboarding && user?.householdId) {
    return <QuickOnboarding onComplete={handleOnboardingComplete} householdId={user.householdId} currentHouseholdName={householdName || undefined} />;
  }

  return (
    <>
      <StandbyOverlay
        isActive={showStandby || isIdle}
        onDismiss={handleDismissStandby}
      />
      <AppShell>
        <ViewRouter />
      </AppShell>
      <LuxuryAudioPlayer />
    </>
  );
}
