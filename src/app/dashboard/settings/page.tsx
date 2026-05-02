'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Home,
  Building2,
  Volume2,
  HeartPulse,
  BookOpen,
  MapPin,
  Palette,
  Bell,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TemplateSelector } from '@/components/themes/TemplateSelector';
import { NotificationSettingsPanel } from '@/components/notifications/NotificationSettingsPanel';

/* ═══════════════════════════════════════════════════════
   MAELLIS — Dashboard Settings Index Page

   Shows current household info, quick links to sub-pages,
   TemplateSelector and NotificationSettingsPanel.
   ═══════════════════════════════════════════════════════ */

interface HouseholdInfo {
  name: string;
  type: string;
  templateSlug: string;
}

interface SettingsLink {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const SETTINGS_LINKS: SettingsLink[] = [
  {
    href: '/dashboard/settings/voice',
    label: 'Voix',
    description: 'Nom de l\'assistant, mot de réveil, paramètres vocaux',
    icon: <Volume2 className="w-5 h-5" />,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    href: '/dashboard/settings/health',
    label: 'Santé',
    description: 'Rappels médicaments, bien-être, urgence',
    icon: <HeartPulse className="w-5 h-5" />,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  {
    href: '/dashboard/settings/knowledge',
    label: 'Connaissances',
    description: 'FAQ, informations logement, base de connaissances',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  },
  {
    href: '/dashboard/settings/activities',
    label: 'Activités',
    description: 'Sorties, partenaires, recommandations locales',
    icon: <MapPin className="w-5 h-5" />,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function SettingsPage() {
  const [household, setHousehold] = useState<HouseholdInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHousehold() {
      try {
        const res = await fetch('/api/household/settings');
        if (res.ok) {
          const data = await res.json();
          setHousehold({
            name: data.name || 'Mon Foyer',
            type: data.type || 'home',
            templateSlug: data.templateSlug || 'nexus-modern',
          });
        } else {
          // Fallback
          setHousehold({ name: 'Mon Foyer', type: 'home', templateSlug: 'nexus-modern' });
        }
      } catch {
        setHousehold({ name: 'Mon Foyer', type: 'home', templateSlug: 'nexus-modern' });
      } finally {
        setLoading(false);
      }
    }
    fetchHousehold();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Settings className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-[var(--text-primary, #f8fafc)]">
            Paramètres
          </h1>
          <p className="text-sm text-[var(--text-secondary, #94a3b8)]">
            Configurez votre foyer et vos préférences
          </p>
        </div>
      </motion.div>

      {/* Household Info Card */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.1}
      >
        <Card className="rounded-2xl border-[var(--border, rgba(212,168,83,0.15))] bg-[var(--bg-card, #1e293b)] overflow-hidden">
          <CardContent className="p-5">
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[var(--accent, #d4a853)] animate-spin" />
                <span className="text-sm text-[var(--text-secondary, #94a3b8)]">Chargement...</span>
              </div>
            ) : household ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent, #d4a853)]/15 flex items-center justify-center">
                    {household.type === 'hospitality' ? (
                      <Building2 className="w-6 h-6 text-[var(--accent, #d4a853)]" />
                    ) : (
                      <Home className="w-6 h-6 text-[var(--accent, #d4a853)]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary, #f8fafc)]">
                      {household.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium',
                        household.type === 'hospitality'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      )}>
                        {household.type === 'hospitality' ? 'Hospitalité' : 'Maison'}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary, #94a3b8)]">
                        {household.templateSlug}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.2}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary, #94a3b8)] mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Réglages rapides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SETTINGS_LINKS.map((link, idx) => (
            <motion.a
              key={link.href}
              href={link.href}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.3 + idx * 0.08}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border, rgba(212,168,83,0.15))] bg-[var(--bg-card, #1e293b)] hover:border-[var(--accent, #d4a853)]/30 transition-all duration-300 group"
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border shrink-0', link.color)}>
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary, #f8fafc)]">
                  {link.label}
                </p>
                <p className="text-[11px] text-[var(--text-secondary, #94a3b8)] mt-0.5 truncate">
                  {link.description}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-secondary, #94a3b8)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* Template Selector */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.6}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary, #94a3b8)] mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Thème visuel
        </h2>
        <TemplateSelector showSeasonal={false} />
      </motion.div>

      {/* Notification Settings */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.8}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary, #94a3b8)] mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications
        </h2>
        <NotificationSettingsPanel />
      </motion.div>
    </div>
  );
}
