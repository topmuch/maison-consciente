'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Diamond,
  ArrowRight,
  QrCode,
  Brain,
  Music,
  Home,
  Globe,
  CheckCircle,
  Shield,
  CloudOff,
  Lock,
  Code2,
  Sparkles,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   LANDING PAGE — Maison Consciente
   Conversion-optimized landing page for smart home QR system
   ═══════════════════════════════════════════════════════ */

interface LandingPageProps {
  onShowAuth: () => void;
  onShowAuthType?: (type: 'home' | 'hospitality') => void;
}

/* ─── Animation Variants ─── */
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  viewport: { once: true },
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: { staggerChildren: 0.15 },
  },
  viewport: { once: true },
};

const staggerItem = {
  initial: { opacity: 0, y: 30 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/* ─── Hero word animation ─── */
const heroWordVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: 0.3 + i * 0.08,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

/* ─── Section Data ─── */
const howItWorksSteps = [
  {
    icon: QrCode,
    step: '1',
    title: 'Scannez',
    description:
      'Collez un QR code dans chaque pièce. Un simple flash avec votre téléphone suffit.',
  },
  {
    icon: Brain,
    step: '2',
    title: 'La maison apprend',
    description:
      'Chaque interaction enrichit le profil de votre foyer : habitudes, moments, préférences.',
  },
  {
    icon: Music,
    step: '3',
    title: 'Elle vous répond',
    description:
      'Conseils personnalisés, ambiances sonores, recettes — au bon moment et au bon endroit.',
  },
];

const homeFeatures = [
  'Zones intelligentes avec QR codes',
  'Suggestions contextuelles par pièce',
  'Ambiances sonores adaptatives',
  'Bien-être : humeur, rituels, courses',
  'Météo locale intégrée',
  'Messages & notes entre membres',
];

const hospitalityFeatures = [
  'Guide local personnalisé (cafés, restos…)',
  'Check-in digital multilingue (FR/EN/ES)',
  'QR codes par zone avec infos contextuelles',
  'Messages voyageur ↔ propriétaire',
  'Recommandations basées sur la météo',
  'Prêt pour les plateformes (Airbnb, Booking)',
];

const stats = [
  {
    icon: Shield,
    value: '100%',
    label: 'Local',
    description: 'Données hébergées chez vous',
  },
  {
    icon: CloudOff,
    value: '0',
    label: 'Cloud',
    description: 'Aucune dépendance externe',
  },
  {
    icon: Lock,
    value: 'RGPD',
    label: 'Ready',
    description: 'Conforme dès le départ',
  },
  {
    icon: Code2,
    value: 'Open',
    label: 'Source',
    description: 'Code transparent & auditable',
  },
];

/* ─── Main Component ─── */
export function LandingPage({ onShowAuth, onShowAuthType }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-[#f1f5f9] overflow-x-hidden">
      {/* ═══════════════════════════════════════════
         1. FIXED NAVBAR
         ═══════════════════════════════════════════ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-gold glow-gold">
              <Diamond className="w-4 h-4 text-[#020617]" strokeWidth={2} />
            </div>
            <span className="font-serif text-gradient-gold text-lg tracking-wide">
              Maison Consciente
            </span>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/demo"
              className="px-3 py-2 text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors duration-200 hidden sm:block"
            >
              Demo
            </Link>
            <Link
              href="/contact"
              className="px-3 py-2 text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors duration-200 hidden sm:block"
            >
              Contact
            </Link>
            <button
              onClick={onShowAuth}
              className="px-4 py-2 text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors duration-200"
            >
              Connexion
            </button>
            <button
              onClick={onShowAuth}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-[#020617] shadow-[0_0_24px_rgba(245,158,11,0.2)] hover:shadow-[0_0_32px_rgba(245,158,11,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Essai Gratuit
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ═══════════════════════════════════════════
         2. HERO SECTION
         ═══════════════════════════════════════════ */}
      <section className="relative pt-32 pb-20">
        {/* Amber glow orb */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* H1 with animated words */}
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] tracking-tight mb-6">
            <motion.span
              custom={0}
              variants={heroWordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block mr-3"
            >
              Votre
            </motion.span>
            <motion.span
              custom={1}
              variants={heroWordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block mr-3"
            >
              maison
            </motion.span>
            <motion.span
              custom={2}
              variants={heroWordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block mr-3"
            >
              ne
            </motion.span>
            <motion.span
              custom={3}
              variants={heroWordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block mr-3"
            >
              se
            </motion.span>
            <motion.span
              custom={4}
              variants={heroWordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block mr-3"
            >
              contente
            </motion.span>
            <motion.span
              custom={5}
              variants={heroWordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block mr-3"
            >
              plus
            </motion.span>
            <motion.span
              custom={6}
              variants={heroWordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block mr-3"
            >
              de
            </motion.span>
            <motion.span
              custom={7}
              variants={heroWordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block mr-3"
            >
              vous
            </motion.span>
            <motion.span
              custom={8}
              variants={heroWordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block mr-3"
            >
              abriter.
            </motion.span>
            <br className="hidden md:block" />
            <motion.span
              custom={9}
              variants={heroWordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block mr-3"
            >
              Elle
            </motion.span>
            <motion.span
              custom={10}
              variants={heroWordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block mr-3"
            >
              vous
            </motion.span>
            <motion.span
              custom={11}
              variants={heroWordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block text-gradient-gold"
            >
              comprend.
            </motion.span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="text-lg text-[#64748b] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Des QR codes intelligents placés dans chaque pièce de votre espace.
            Votre maison apprend vos habitudes et vous offre des expériences
            personnalisées — sans cloud, sans compromis sur votre vie privée.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={onShowAuth}
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 text-base font-semibold rounded-xl bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-[#020617] shadow-[0_0_24px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Commencer maintenant
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              onClick={onShowAuth}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 text-base font-medium rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
            >
              Voir les offres
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
         3. HOW IT WORKS
         ═══════════════════════════════════════════ */}
      <section className="relative py-20 bg-black/20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section Title */}
          <motion.h2
            {...fadeUp}
            className="font-serif text-3xl md:text-4xl text-center text-[#f1f5f9] mb-16 tracking-tight"
          >
            Simple.{' '}
            <span className="text-gradient-gold">Élégant.</span>{' '}
            Intelligent.
          </motion.h2>

          {/* Cards Grid */}
          <motion.div
            {...staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {howItWorksSteps.map((step) => (
              <motion.div
                key={step.step}
                variants={staggerItem}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300"
              >
                {/* Step Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center mb-5">
                  <step.icon className="w-6 h-6 text-[#f59e0b]" strokeWidth={1.5} />
                </div>

                {/* Step Number & Title */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-serif text-[#f59e0b]/20 font-bold">
                    {step.step}
                  </span>
                  <h3 className="text-xl font-semibold text-[#f1f5f9]">
                    {step.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
         4. DUAL OFFER
         ═══════════════════════════════════════════ */}
      <section className="relative py-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section Title */}
          <motion.h2
            {...fadeUp}
            className="font-serif text-3xl md:text-4xl text-center text-[#f1f5f9] mb-4 tracking-tight"
          >
            Deux univers,{' '}
            <span className="text-gradient-gold">une seule plateforme</span>
          </motion.h2>
          <motion.p
            {...fadeUp}
            className="text-center text-[#64748b] text-base max-w-xl mx-auto mb-14"
          >
            Maison Consciente s&apos;adapte à votre usage : personnel ou professionnel.
          </motion.p>

          {/* Dual Cards */}
          <motion.div
            {...staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* LEFT: Pour votre Maison */}
            <motion.div
              variants={staggerItem}
              className="bg-white/[0.03] backdrop-blur-xl border border-[#f59e0b]/20 rounded-2xl p-8 hover:border-[#f59e0b]/30 transition-all duration-300 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center">
                  <Home className="w-5 h-5 text-[#f59e0b]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#f1f5f9]">
                    Pour votre Maison
                  </h3>
                  <p className="text-xs text-[#64748b] tracking-wide uppercase mt-0.5">
                    Usage personnel
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-[#f59e0b]/20 to-transparent mb-6" />

              {/* Features */}
              <ul className="flex-1 space-y-3.5 mb-8">
                {homeFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" strokeWidth={2} />
                    <span className="text-sm text-[#94a3b8] leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => onShowAuthType?.('home')}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-[#020617] shadow-[0_0_24px_rgba(245,158,11,0.2)] hover:shadow-[0_0_32px_rgba(245,158,11,0.3)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
              >
                Essayer pour ma maison
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* RIGHT: Pour vos Locations */}
            <motion.div
              variants={staggerItem}
              className="bg-white/[0.03] backdrop-blur-xl border border-[#10b981]/20 rounded-2xl p-8 hover:border-[#10b981]/30 transition-all duration-300 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-[#10b981]/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#10b981]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#f1f5f9]">
                    Pour vos Locations
                  </h3>
                  <p className="text-xs text-[#64748b] tracking-wide uppercase mt-0.5">
                    Hospitalité &amp; voyageurs
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-[#10b981]/20 to-transparent mb-6" />

              {/* Features */}
              <ul className="flex-1 space-y-3.5 mb-8">
                {hospitalityFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-[#10b981] mt-0.5 shrink-0" strokeWidth={2} />
                    <span className="text-sm text-[#94a3b8] leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => onShowAuthType?.('hospitality')}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#059669] to-[#10b981] text-[#020617] shadow-[0_0_24px_rgba(16,185,129,0.2)] hover:shadow-[0_0_32px_rgba(16,185,129,0.3)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
              >
                Essayer pour mes locations
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
         5. STATS / SOCIAL PROOF
         ═══════════════════════════════════════════ */}
      <section className="relative py-16 bg-black/20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            {...staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={staggerItem}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 text-center"
              >
                <stat.icon
                  className="w-5 h-5 text-[#f59e0b] mx-auto mb-3"
                  strokeWidth={1.5}
                />
                <div className="text-2xl md:text-3xl font-serif text-gradient-gold font-bold mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-[#f1f5f9] mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-[#64748b]">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
         6. PRICING SECTION — Version Corrigée
         ═══════════════════════════════════════════ */}
      <section className="relative py-20 bg-black/20" id="pricing">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            {...fadeUp}
            className="font-serif text-3xl md:text-4xl text-center text-amber-100 mb-4 tracking-tight"
          >
            Choisissez votre <span className="text-gradient-gold">expérience</span>
          </motion.h2>
          <motion.p
            {...fadeUp}
            className="text-center text-slate-400 text-base max-w-2xl mx-auto mb-4"
          >
            Des formules adaptées à vos besoins, sans engagement.
          </motion.p>
          <motion.p
            {...fadeUp}
            className="text-xs text-indigo-400/80 text-center mb-12"
          >
            🏨 Vous êtes hôte Airbnb ?{' '}
            <a href="#hospitality" className="underline hover:text-indigo-300 transition-colors">
              Découvrez le module Espace Voyageur →
            </a>
          </motion.p>

          <motion.div
            {...staggerContainer}
            className="grid md:grid-cols-3 gap-6 md:gap-8 items-start"
          >
            {/* Gratuit */}
            <motion.div
              variants={staggerItem}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300"
            >
              <div className="mb-6">
                <h3 className="text-xl font-serif text-amber-50 mb-2">Découverte</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-light text-amber-100">Gratuit</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {["3 zones QR", "Présence basique", "Messages illimités", "3 ambiances audio"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={14} className="text-amber-400 shrink-0" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onShowAuth}
                className="block w-full py-3 text-center border border-amber-600 text-amber-400 hover:bg-amber-600/10 rounded-xl transition-all duration-300 font-medium text-sm"
              >
                Commencer
              </button>
            </motion.div>

            {/* Confort — Populaire */}
            <motion.div
              variants={staggerItem}
              className="relative bg-gradient-to-b from-amber-900/20 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-8 md:scale-105 shadow-2xl shadow-amber-900/20"
            >
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Populaire
              </div>
              <div className="mb-6 pt-2">
                <h3 className="text-xl font-serif text-amber-50 mb-2">Confort</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-light text-amber-100">4,99€</span>
                  <span className="text-lg text-slate-400">/mois</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">ou 47,90€/an (-20%)</p>
              </div>
              <ul className="space-y-3 mb-8">
                {["Zones illimitées", "Moteur de conscience complet", "Bibliothèque audio (20+)", "Recettes & suggestions", "Tracker d'humeur", "Support prioritaire"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={14} className="text-amber-400 shrink-0" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onShowAuth}
                className="block w-full py-3 text-center bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all duration-300 font-medium text-sm shadow-lg shadow-amber-900/20 hover:shadow-amber-800/30 hover:scale-[1.01] active:scale-[0.99]"
              >
                Choisir Confort
              </button>
            </motion.div>

            {/* Prestige */}
            <motion.div
              variants={staggerItem}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-indigo-500/30 transition-all duration-300"
            >
              <div className="mb-6">
                <h3 className="text-xl font-serif text-amber-50 mb-2">Prestige</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-light text-amber-100">9,99€</span>
                  <span className="text-lg text-slate-400">/mois</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {["Tout Confort +", "Analytics avancés", "Personnalisation UI", "Accès bêta modules", "Capsules temporelles", "Account manager"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={14} className="text-indigo-400 shrink-0" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onShowAuth}
                className="block w-full py-3 text-center border border-indigo-600 text-indigo-400 hover:bg-indigo-600/10 rounded-xl transition-all duration-300 font-medium text-sm"
              >
                Choisir Prestige
              </button>
            </motion.div>
          </motion.div>

          {/* Section Hospitality Add-on */}
          <motion.div
            {...fadeUp}
            id="hospitality"
            className="mt-16 bg-gradient-to-r from-indigo-900/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-8"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-serif text-amber-100 mb-2">
                  🏨 Vous louez sur Airbnb / Booking ?
                </h3>
                <p className="text-slate-300">
                  Ajoutez le module <strong className="text-white">Espace Voyageur</strong> à votre abonnement : guide local intelligent, check-in digital, multi-langue, avis Google.
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-light text-indigo-400">
                  +7€<span className="text-lg text-slate-400">/mois/logement</span>
                </p>
                <button
                  onClick={() => onShowAuthType?.('hospitality')}
                  className="inline-block mt-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all duration-300 font-medium hover:scale-[1.01] active:scale-[0.99]"
                >
                  Activer le module
                </button>
              </div>
            </div>
          </motion.div>

          <motion.p
            {...fadeUp}
            className="text-center text-slate-500 text-sm mt-8"
          >
            Essai gratuit 14 jours &bull; Sans carte bancaire &bull; Annulation en 1 clic
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
         7. FINAL CTA
         ═══════════════════════════════════════════ */}
      <section className="relative py-20 bg-gradient-to-b from-[#020617] via-[#0a0a1a] to-black">
        {/* Decorative emerald orb */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          {/* Sparkle icon */}
          <motion.div
            {...fadeUp}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 mb-8"
          >
            <Sparkles className="w-6 h-6 text-[#f59e0b]" strokeWidth={1.5} />
          </motion.div>

          <motion.h2
            {...fadeUp}
            className="font-serif text-3xl md:text-5xl text-[#f1f5f9] mb-5 tracking-tight leading-tight"
          >
            Prêt à donner une{' '}
            <span className="text-gradient-gold">âme</span>{' '}
            à vos murs&nbsp;?
          </motion.h2>

          <motion.p
            {...fadeUp}
            className="text-[#64748b] text-base mb-10 max-w-lg mx-auto"
          >
            Essai gratuit. Sans carte bancaire. Annulation en 1 clic.
          </motion.p>

          <motion.div
            {...fadeUp}
          >
            <button
              onClick={onShowAuth}
              className="group inline-flex items-center gap-2.5 px-10 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-[#020617] shadow-[0_0_32px_rgba(245,158,11,0.25)] hover:shadow-[0_0_48px_rgba(245,158,11,0.4)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              Lancer l&apos;expérience
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
         8. FOOTER
         ═══════════════════════════════════════════ */}
      <footer className="mt-auto py-8 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <Diamond className="w-4 h-4 text-[#f59e0b]/60" strokeWidth={1.5} />
              <span className="text-xs text-[#64748b]">
                &copy; 2025 Maison Consciente
              </span>
            </div>

            {/* Footer links */}
            <div className="flex items-center gap-6">
              <Link href="/demo" className="text-xs text-[#475569] hover:text-[#f59e0b] transition-colors duration-200">
                Demo
              </Link>
              <Link href="/contact" className="text-xs text-[#475569] hover:text-[#f59e0b] transition-colors duration-200">
                Contact
              </Link>
              <button
                onClick={onShowAuth}
                className="text-xs text-[#475569] hover:text-[#f59e0b] transition-colors duration-200"
              >
                Connexion
              </button>
            </div>

            {/* Tagline */}
            <p className="text-xs text-[#475569] text-center">
              Conçu pour le confort, la privacy et l&apos;élégance.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
