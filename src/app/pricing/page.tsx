'use client';

import { motion } from 'framer-motion';
import {
  Diamond,
  Check,
  Shield,
  Home,
  Heart,
  Zap,
  Star,
  ArrowRight,
  Sparkles,
  Users,
  ChefHat,
  Calendar,
  Lock,
  Clock,
  MessageSquare,
  ShoppingBag,
  Baby,
  Crown,
  Globe,
  BarChart3,
  Brain,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════
   PRICING PAGE — Maison Consciente
   Modular pricing: Base gratuite + Modules premium + Bundle Global Host Pro
   ═══════════════════════════════════════════════════════ */

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

/* ─── Pricing Plans ─── */
const plans = [
  {
    id: 'base',
    name: 'Maellis Base',
    price: '0\u202F\u20AC',
    period: '/mois',
    description: "L'essentiel pour une maison connect\u00e9e intelligente.",
    features: [
      { icon: MessageSquare, text: 'Assistant Vocal (Web Speech)' },
      { icon: Star, text: 'M\u00e9t\u00e9o & Actualit\u00e9s' },
      { icon: ChefHat, text: 'Recettes basiques' },
      { icon: Home, text: 'Contr\u00f4le domotique simple' },
      { icon: Users, text: 'Mur familial' },
      { icon: Heart, text: 'Support communautaire' },
    ],
    cta: 'Commencer gratuitement',
    ctaLink: '/connexion',
    popular: false,
    borderClass: 'border-white/[0.08] hover:border-[#d4a853]/20',
    badgeBg: 'bg-white/[0.06]',
    iconColor: '#d4a853',
  },
  {
    id: 'safe-arrival',
    name: 'Pack S\u00e9curit\u00e9',
    price: '6,90\u202F\u20AC',
    period: '/mois',
    description: 'La tranquillit\u00e9 d\u2019esprit absolue pour votre famille.',
    features: [
      { icon: Shield, text: 'Safe Arrival (Surveillance enfants/parents)' },
      { icon: Zap, text: 'Appel IA Urgence (Retell AI) aux secours' },
      { icon: Lock, text: 'D\u00e9tection d\u2019intrusion & SOS' },
      { icon: MessageSquare, text: 'Alertes SMS/Email automatiques' },
      { icon: Clock, text: 'Historique des arriv\u00e9es/d\u00e9parts' },
      { icon: Heart, text: 'Support prioritaire 24/7' },
    ],
    cta: 'Activer la S\u00e9curit\u00e9',
    ctaLink: '/connexion',
    popular: false,
    borderClass: 'border-white/[0.08] hover:border-[#d4a853]/20',
    badgeBg: 'bg-white/[0.06]',
    iconColor: '#f59e0b',
  },
  {
    id: 'family-zen',
    name: 'Pack Famille Zen',
    price: '12,90\u202F\u20AC',
    period: '/mois',
    description: 'Tout pour organiser et apaiser le quotidien.',
    features: [
      { icon: Shield, text: 'Inclut le Pack S\u00e9curit\u00e9' },
      { icon: ChefHat, text: 'Recettes Avanc\u00e9es & Chef IA' },
      { icon: Calendar, text: 'Agenda Familial Partag\u00e9' },
      { icon: Heart, text: 'Bien-\u00eatre & M\u00e9ditation guid\u00e9e' },
      { icon: Baby, text: 'Contr\u00f4le Parental Intelligent' },
      { icon: ShoppingBag, text: 'Liste de courses automatique' },
    ],
    cta: 'Choisir Famille Zen',
    ctaLink: '/connexion',
    popular: false,
    borderClass: 'border-white/[0.08] hover:border-[#d4a853]/20',
    badgeBg: 'bg-white/[0.06]',
    iconColor: '#c77d5a',
  },
];

/* ─── Global Host Pro Pack ─── */
const globalHostProFeatures = [
  { icon: Shield, text: 'Safe Departure & Security (Sauvetage avis)' },
  { icon: Clock, text: 'Daily Concierge (Audit quotidien 22h)' },
  { icon: Brain, text: 'Guest Memory (M\u00e9moire pr\u00e9f\u00e9rences)' },
  { icon: Sparkles, text: 'Auto Upsell Intelligent (Pr\u00e9sentation services)' },
  { icon: CreditCard, text: 'Smart Late Checkout Seller (Vente heures libres)' },
  { icon: Globe, text: 'Auto Language Adapt (Polyglotte automatique)' },
  { icon: BarChart3, text: 'Analytics & Reports complets' },
];

/* ─── FAQ ─── */
const faqItems = [
  {
    q: 'Puis-je changer de formule \u00e0 tout moment ?',
    a: 'Oui, vous pouvez upgrader ou downgrader votre abonnement en un clic depuis votre espace client. Le prorata est calcul\u00e9 automatiquement.',
  },
  {
    q: 'Y a-t-il un engagement minimum ?',
    a: 'Aucun engagement. Tous nos plans sont sans engagement, vous pouvez r\u00e9silier \u00e0 tout moment.',
  },
  {
    q: 'Comment fonctionne l\u2019essai gratuit ?',
    a: 'Le plan Base est enti\u00e8rement gratuit et sans limite de temps. Les modules premium b\u00e9n\u00e9ficient de 14 jours d\u2019essai sans carte bancaire.',
  },
  {
    q: 'Mes donn\u00e9es sont-elles s\u00e9curis\u00e9es ?',
    a: 'Absolument. Toutes les donn\u00e9es sont chiffr\u00e9es AES-256. Nous sommes conformes RGPD et vos donn\u00e9es restent sur nos serveurs europ\u00e9ens.',
  },
  {
    q: 'Qu\u2019est-ce que le pack Global Host Pro ?',
    a: 'C\u2019est la solution compl\u00e8te pour h\u00f4tes Airbnb professionnels. Il inclut TOUS les modules Maellis (S\u00e9curit\u00e9, Concierge, Upsell, Late Checkout, Memory, Langues, Analytics) \u00e0 un prix r\u00e9duit de 29,90\u202F\u20AC/mois au lieu de 38,30\u202F\u20AC.',
  },
  {
    q: 'Comment l\u2019IA vend-elle les services \u00e0 ma place ?',
    a: '2 heures apr\u00e8s le check-in, l\u2019IA vocale pr\u00e9sente automatiquement vos services payants (m\u00e9nage, chef, transfert). Le jour du d\u00e9part, elle propose un Late Checkout si le logement est libre. Tout est automatis\u00e9 via Retell AI.',
  },
];

/* ─── Main Component ─── */
export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-[#f1f5f9]">
      {/* ═══ NAVBAR ═══ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-gold glow-gold">
              <Diamond className="w-4 h-4 text-[#020617]" />
            </div>
            <span className="font-serif text-gradient-gold text-lg tracking-wide">
              Maison Consciente
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/demo"
              className="px-3 sm:px-4 py-2 text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors duration-200"
            >
              D\u00e9mo
            </Link>
            <Link
              href="/pricing"
              className="px-3 sm:px-4 py-2 text-sm font-medium text-[#d4a853] hover:text-[#f0d78c] transition-colors duration-200"
            >
              Tarifs
            </Link>
            <Link
              href="/connexion"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-gradient-gold text-[#020617] rounded-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
            >
              Connexion
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ═══ HEADER ═══ */}
      <section className="relative pt-28 sm:pt-32 pb-12 px-4">
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[120px] opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #d4a853 0%, transparent 70%)' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4a853]/10 border border-[#d4a853]/20 text-[#f0d78c] text-xs font-medium tracking-wide uppercase mb-6"
          >
            <Sparkles className="w-3 h-3" />
            Tarification Transparente
          </motion.div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif mb-4 tracking-tight">
            Choisissez votre{' '}
            <span className="text-gradient-gold">s\u00e9r\u00e9nit\u00e9</span>
          </h1>
          <p className="text-lg md:text-xl text-[#64748b] max-w-2xl mx-auto leading-relaxed">
            Une base gratuite puissante. Des modules premium \u00e0 la carte pour composer le Maellis parfait pour votre foyer.
          </p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         HERO: GLOBAL HOST PRO BUNDLE
         ═══════════════════════════════════════════════════════ */}
      <section className="py-8 md:py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="relative"
          >
            {/* Background glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-amber-500/5 rounded-3xl blur-2xl pointer-events-none" />

            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-[#d4a853]/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(212,168,83,0.08)]">
              {/* Animated gradient top bar */}
              <div
                className="h-1 w-full"
                style={{
                  background: 'linear-gradient(90deg, #d4af37, #7c3aed, #d4af37, #7c3aed)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s linear infinite',
                }}
              />

              <div className="p-6 sm:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  {/* Left: Content */}
                  <div>
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider text-[#f0d78c]">
                        <Crown className="w-3 h-3" />
                        Best Value
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
                        -22% vs modules s\u00e9par\u00e9s
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-3">
                      <span className="text-gradient-gold">Maellis</span>{' '}
                      <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300 bg-clip-text text-transparent">
                        Global Host Pro
                      </span>
                    </h2>

                    <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed mb-6">
                      La solution ultime pour h\u00f4tes professionnels Airbnb. S\u00e9curit\u00e9, Revenus Passifs et Exp\u00e9rience Client 5 \u00e9toiles — le tout pilot\u00e9 par l&apos;IA.
                    </p>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-5xl sm:text-6xl font-bold font-serif text-gradient-gold">29,90</span>
                      <span className="text-xl text-[#64748b]">\u20AC/mois</span>
                    </div>
                    <p className="text-sm text-[#475569] mb-6">
                      ou <span className="text-[#d4a853] font-medium">299\u20AC/an</span> — \u00e9conomisez 60\u20AC
                    </p>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        href="/connexion"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-[#020617] transition-all duration-300 shadow-[0_0_32px_rgba(212,168,83,0.2)] hover:shadow-[0_0_48px_rgba(212,168,83,0.35)] hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          background: 'linear-gradient(135deg, #d4af37 0%, #7c3aed 100%)',
                        }}
                      >
                        Choisir Global Host Pro
                        <ArrowRight size={18} />
                      </Link>
                      <Link
                        href="/demo"
                        className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-medium text-[#94a3b8] bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-[#d4a853]/20 transition-all duration-300 text-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        Voir la d\u00e9mo
                      </Link>
                    </div>
                  </div>

                  {/* Right: Features list */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-4">
                      7 modules inclus
                    </h3>
                    {globalHostProFeatures.map((feat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#d4a853]/15 transition-all duration-300 group"
                      >
                        <div className="shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-[#d4a853]/10 to-purple-500/10 flex items-center justify-center group-hover:from-[#d4a853]/20 group-hover:to-purple-500/20 transition-colors">
                          <feat.icon className="w-4 h-4 text-[#d4a853]" />
                        </div>
                        <span className="text-sm text-[#94a3b8] group-hover:text-[#e2e8f0] transition-colors">
                          {feat.text}
                        </span>
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-auto" />
                      </motion.div>
                    ))}

                    {/* Savings callout */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15"
                    >
                      <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs text-emerald-400/90">
                        Valeur totale : <strong className="text-emerald-300">38,30\u20AC/mois</strong> — vous payez 29,90\u20AC
                      </span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ PRICING GRID (Individual Plans) ═══ */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif mb-3 tracking-tight">
              Ou choisissez un{' '}
              <span className="text-gradient-gold">module individuel</span>
            </h2>
            <p className="text-sm text-[#64748b] max-w-lg mx-auto">
              Composez votre Maellis id\u00e9al en ajoutant uniquement les modules dont vous avez besoin.
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                variants={staggerItem}
                className={`relative bg-white/[0.03] backdrop-blur-xl border ${plan.borderClass} rounded-2xl p-6 md:p-8 flex flex-col transition-all duration-300`}
              >
                {/* Plan header */}
                <div className="mb-6">
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-[#f1f5f9] mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-bold text-[#f1f5f9]">{plan.price}</span>
                  <span className="text-[#64748b] text-sm">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <div className={`mt-0.5 p-1 rounded-md ${plan.popular ? 'bg-[#d4a853]/10' : 'bg-white/[0.06]'}`}>
                        <feat.icon
                          className={`w-3.5 h-3.5 ${plan.popular ? 'text-[#d4a853]' : 'text-[#94a3b8]'}`}
                          strokeWidth={2}
                        />
                      </div>
                      <span className="text-[#94a3b8] leading-relaxed">{feat.text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={plan.ctaLink}
                  className="w-full py-3.5 rounded-xl font-semibold text-center transition-all duration-300 flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-[#f1f5f9] border border-white/[0.08] hover:border-[#d4a853]/20"
                >
                  {plan.cta} <ArrowRight size={16} />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ HOSPITALITY MODULES (Airbnb-specific) ═══ */}
      <section className="py-12 md:py-16 px-4 bg-black/20">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider mb-4"
            >
              <Zap className="w-3 h-3" />
              Pour h\u00f4tes Airbnb
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-serif mb-3 tracking-tight">
              Modules{' '}
              <span className="text-gradient-gold">Hospitality</span>
            </h2>
            <p className="text-sm text-[#64748b] max-w-lg mx-auto">
              Propuls\u00e9s par Retell AI et Gemini 2.0 Flash pour prot\u00e9ger votre r\u00e9putation et booster vos revenus.
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Safe Departure */}
            <motion.div
              variants={staggerItem}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/20 rounded-2xl p-6 md:p-8 flex flex-col transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-600/15 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#f1f5f9]">Safe Departure & Security</h3>
                  <p className="text-[10px] text-[#64748b]">Check-out intelligent + sauvetage de r\u00e9putation</p>
                </div>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-serif text-gradient-gold">6,90</span>
                <span className="text-sm text-[#64748b]">\u20AC/mois</span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  'Appel vocal Retell AI le jour du d\u00e9part',
                  'D\u00e9tection insatisfaction en temps r\u00e9el',
                  'Alerte imm\u00e9diate \u00e0 l\'h\u00f4te',
                  'Rapport IA StayReview complet',
                  'G\u00e9n\u00e9ration automatique d\'avis public',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[#94a3b8] leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/connexion"
                className="w-full py-3 rounded-xl font-semibold text-center flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-[#f1f5f9] border border-white/[0.08] hover:border-emerald-500/20 transition-all duration-300 text-sm"
              >
                Activer <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* Daily Concierge */}
            <motion.div
              variants={staggerItem}
              className="bg-white/[0.03] backdrop-blur-xl border border-[#d4a853]/20 rounded-2xl p-6 md:p-8 flex flex-col transition-all duration-300 shadow-[0_0_40px_rgba(212,168,83,0.06)]"
            >
              {/* Popular badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-gold text-[#020617] px-5 py-1 rounded-full text-xs font-bold shadow-[0_0_20px_rgba(212,168,83,0.3)]">
                  Populaire
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#d4a853]/15 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#d4a853]" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#f1f5f9]">Daily Concierge & Care</h3>
                  <p className="text-[10px] text-[#64748b]">Audit quotidien \u00e0 22h + r\u00e9solution proactive</p>
                </div>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-serif text-gradient-gold">9,90</span>
                <span className="text-sm text-[#64748b]">\u20AC/mois</span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  'Audit quotidien automatique \u00e0 22h',
                  'Appel vocal respectueux (permission)',
                  'Gestion du silence + relance 1h',
                  'Analyse sentiment Gemini 2.0 Flash',
                  'Alerte h\u00f4te si score < 4/5',
                  'Dashboard analytics avec radar 6 axes',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-[#d4a853] shrink-0 mt-0.5" />
                    <span className="text-[#94a3b8] leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/connexion"
                className="w-full py-3 rounded-xl font-semibold text-center flex items-center justify-center gap-2 bg-gradient-gold text-[#020617] shadow-[0_0_24px_rgba(212,168,83,0.2)] hover:shadow-[0_0_32px_rgba(212,168,83,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-sm"
              >
                Activer <ArrowRight size={14} />
              </Link>
            </motion.div>
          </motion.div>

          {/* Bundle offer */}
          <motion.div {...fadeUp} className="mt-8">
            <div className="bg-white/[0.03] backdrop-blur-xl border border-[#d4a853]/15 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="p-3 rounded-xl bg-[#d4a853]/10 shrink-0">
                <Heart className="w-6 h-6 text-[#d4a853]" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-sm font-serif font-semibold text-[#f1f5f9] mb-1">
                  Bundle Hospitality — Safe Departure + Daily Concierge
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Les deux modules pour une protection compl\u00e8te de votre r\u00e9putation Airbnb.
                </p>
              </div>
              <div className="text-center shrink-0">
                <div className="flex items-baseline gap-1 justify-center">
                  <span className="text-2xl font-bold font-serif text-gradient-gold">14,90</span>
                  <span className="text-sm text-[#64748b]">\u20AC/mois</span>
                </div>
                <p className="text-[10px] text-emerald-400 mt-1">
                  \u00c9conomisez 1,90\u20AC/mois
                </p>
                <Link
                  href="/connexion"
                  className="mt-2 inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-gold text-[#020617] shadow-[0_4px_16px_rgba(212,168,83,0.2)] hover:shadow-[0_4px_24px_rgba(212,168,83,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-xs font-semibold"
                >
                  Activer le bundle
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ CALCULATOR / VISUAL ═══ */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 {...fadeUp} className="font-serif text-3xl md:text-4xl mb-4 tracking-tight">
            Envie de <span className="text-gradient-gold">personnaliser</span> ?
          </motion.h2>
          <motion.p {...fadeUp} className="text-[#64748b] text-base max-w-lg mx-auto mb-8">
            Ajoutez uniquement ce dont vous avez besoin. Changez \u00e0 tout moment, sans engagement.
          </motion.p>
          <motion.div {...fadeUp}>
            <Link
              href="/connexion"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-gold text-[#020617] rounded-xl font-semibold shadow-[0_0_24px_rgba(212,168,83,0.2)] hover:shadow-[0_0_40px_rgba(212,168,83,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              Construire mon pack sur mesure <Zap size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-16 md:py-20 px-4 bg-black/20">
        <div className="max-w-3xl mx-auto">
          <motion.h2 {...fadeUp} className="font-serif text-3xl md:text-4xl text-center text-[#f1f5f9] mb-4 tracking-tight">
            Questions <span className="text-gradient-gold">fr\u00e9quentes</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-center text-[#64748b] text-base max-w-lg mx-auto mb-12">
            Tout ce que vous devez savoir sur nos tarifs.
          </motion.p>

          <motion.div {...staggerContainer} className="space-y-4">
            {faqItems.map((faq, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-[#d4a853]/15 transition-all duration-300"
              >
                <h3 className="text-base font-semibold text-[#f1f5f9] mb-2 flex items-start gap-3">
                  <span className="text-[#d4a853] mt-0.5">Q.</span>
                  {faq.q}
                </h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed pl-7">{faq.a}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="mt-auto py-8 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Diamond className="w-4 h-4 text-[#d4a853]/60" strokeWidth={1.5} />
              <span className="text-xs text-[#64748b]">
                &copy; 2025 Maison Consciente
              </span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
              <Link href="/" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                Accueil
              </Link>
              <Link href="/demo" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                D\u00e9mo
              </Link>
              <Link href="/pricing" className="text-xs text-[#d4a853]/80 hover:text-[#d4a853] transition-colors">
                Tarifs
              </Link>
              <Link href="/about" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                \u00c0 propos
              </Link>
              <Link href="/contact" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                Contact
              </Link>
              <Link href="/legal/privacy" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                Confidentialit\u00e9
              </Link>
            </div>
            <p className="text-xs text-[#475569]">
              Con\u00e7u pour le confort et la privacy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
