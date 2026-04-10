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
  ArrowLeft,
  Sparkles,
  Users,
  ChefHat,
  Calendar,
  Lock,
  Clock,
  MessageSquare,
  ShoppingBag,
  Baby,
} from 'lucide-react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════
   PRICING PAGE — Maison Consciente
   Modular pricing: Base gratuite + Modules premium
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
    popular: true,
    borderClass: 'border-[#d4a853]/40 shadow-[0_0_40px_rgba(212,168,83,0.1)]',
    badgeBg: 'bg-gradient-gold',
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

      {/* ═══ PRICING GRID ═══ */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                variants={staggerItem}
                className={`relative bg-white/[0.03] backdrop-blur-xl border ${plan.borderClass} rounded-2xl p-6 md:p-8 flex flex-col transition-all duration-300 ${
                  plan.popular ? 'md:scale-105 md:z-10' : ''
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-gold text-[#020617] px-5 py-1 rounded-full text-xs font-bold shadow-[0_0_20px_rgba(212,168,83,0.3)]">
                      Recommand\u00e9
                    </div>
                  </div>
                )}

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
                  className={`w-full py-3.5 rounded-xl font-semibold text-center transition-all duration-300 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-gradient-gold text-[#020617] shadow-[0_0_24px_rgba(212,168,83,0.2)] hover:shadow-[0_0_32px_rgba(212,168,83,0.3)] hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-white/[0.06] hover:bg-white/[0.1] text-[#f1f5f9] border border-white/[0.08] hover:border-[#d4a853]/20'
                  }`}
                >
                  {plan.cta} <ArrowRight size={16} />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CALCULATOR / VISUAL ═══ */}
      <section className="py-16 md:py-20 px-4 bg-black/20">
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
      <section className="py-16 md:py-20 px-4">
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
