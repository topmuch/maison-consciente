'use client';

import { motion } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Database,
  Eye,
  Trash2,
  Download,
  Server,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { SiteNavbar } from '@/components/layout/SiteNavbar';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/* ═══════════════════════════════════════════════════════
   PRIVACY PAGE — Maellis
   Politique de Confidentialité RGPD
   ═══════════════════════════════════════════════════════ */

/* ─── Animation Variants ─── */
const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
  viewport: { once: true, amount: 0.2 },
};

const stagger = {
  initial: { opacity: 0 },
  whileInView: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
  viewport: { once: true, amount: 0.2 },
};

const staggerItem = {
  initial: { opacity: 0, y: 30 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

/* ─── Data Collection Sections ─── */
const dataCategories = [
  {
    icon: ShieldCheck,
    title: 'Sécurité (Safe Arrival)',
    description: "Nous collectons les heures de départ et d'arrivée pour détecter les retards anormaux et déclencher les alertes. Ces données sont strictement nécessaires au fonctionnement du service de sécurité.",
  },
  {
    icon: Lock,
    title: 'Vocal & IA',
    description: "Les commandes vocales sont traitées localement ou via nos partenaires sécurisés (Google Gemini) pour améliorer la reconnaissance. Les enregistrements audio bruts ne sont jamais stockés sur nos serveurs.",
  },
  {
    icon: UserCheck,
    title: 'Compte & Facturation',
    description: "Email, nom et informations de facturation pour la gestion de l'abonnement. Ces données sont minimales et traitées par notre prestataire de paiement sécurisé (Stripe).",
  },
];

const rights = [
  {
    icon: Eye,
    title: "Droit d'accès",
    description: 'Vous pouvez demander une copie de toutes vos données personnelles à tout moment.',
  },
  {
    icon: Download,
    title: 'Droit à la portabilité',
    description: 'Exportez vos données dans un format standard et réutilisable.',
  },
  {
    icon: Trash2,
    title: "Droit à l'oubli",
    description: 'Supprimez définitivement votre compte et toutes les données associées.',
  },
];

const securityMeasures = [
  'Chiffrement AES-256 de bout en bout',
  'Hébergement sur serveurs européens (France)',
  'Conformité RGPD totale',
  'Audit de sécurité trimestriel',
  'Aucune revente de données',
  'Accès aux données limité par rôle',
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteNavbar activePage="/legal/privacy" />

      <main className="flex-1">
        {/* ═══ HEADER ═══ */}
        <section className="relative pt-28 sm:pt-32 pb-12 px-4">
          <div
            className="absolute top-16 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="max-w-4xl mx-auto text-center relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/40 mb-6"
            >
              <ShieldCheck className="w-8 h-8 text-amber-500 dark:text-amber-400" strokeWidth={1.5} />
            </motion.div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight">
              Politique de{' '}
              <span className="text-amber-500">Confidentialité</span>
            </h1>
            <p className="text-muted-foreground text-base">
              Dernière mise à jour : Janvier 2025
            </p>
          </motion.div>
        </section>

        {/* ═══ CONTENT ═══ */}
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-4xl mx-auto space-y-12">

            {/* ─── Introduction ─── */}
            <motion.div {...fadeUp}>
              <Card className="border-amber-200/60 dark:border-amber-800/40 shadow-md">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 shrink-0">
                      <ShieldCheck className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-3">
                        1. Vos Données Sensibles
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Maellis traite des données critiques pour la sécurité de votre foyer : horaires de rentrée,
                        localisation, contacts d&apos;urgence et informations de santé. Toutes ces données sont{' '}
                        <strong className="text-foreground">chiffrées de bout en bout (AES-256)</strong> dans notre base
                        de données. Nous ne vendons jamais vos données personnelles.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── Data Collection ─── */}
            <motion.div {...fadeUp}>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                <Database className="text-amber-500" size={20} />
                2. Collecte et Utilisation
              </h2>
              <motion.div {...stagger} className="space-y-4">
                {dataCategories.map((cat, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                  >
                    <Card className="hover:border-amber-200 dark:hover:border-amber-700/60 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 shrink-0">
                            <cat.icon className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-foreground mb-2">{cat.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* ─── GDPR Rights ─── */}
            <motion.div {...fadeUp}>
              <h2 className="text-xl font-bold text-foreground mb-6">
                3. Vos Droits (RGPD)
              </h2>
              <motion.div {...stagger} className="grid md:grid-cols-3 gap-4">
                {rights.map((right, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                  >
                    <Card className="hover:border-amber-200 dark:hover:border-amber-700/60 transition-all duration-300 text-center">
                      <CardContent className="p-5">
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 w-fit mx-auto mb-3">
                          <right.icon className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">{right.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{right.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                Vous pouvez exercer ces droits depuis votre tableau de bord dans la section{' '}
                <em className="text-amber-600 dark:text-amber-400">Paramètres &gt; Données</em>, ou en contactant notre DPO.
              </p>
            </motion.div>

            {/* ─── Security ─── */}
            <motion.div {...fadeUp}>
              <Card className="border-amber-200/60 dark:border-amber-800/40 shadow-md">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 shrink-0">
                      <Server className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-2">
                        4. Mesures de Sécurité
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-3 pl-2">
                    {securityMeasures.map((measure, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-muted-foreground">{measure}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── DPO Contact ─── */}
            <motion.div {...fadeUp}>
              <Card className="border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/50 to-background dark:from-amber-900/20 dark:to-background shadow-md">
                <CardContent className="p-6 md:p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                    <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Contact DPO</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pour toute question sur la protection de vos données :
                  </p>
                  <a
                    href="mailto:privacy@maellis.com"
                    className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium text-sm transition-colors"
                  >
                    privacy@maellis.com
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
