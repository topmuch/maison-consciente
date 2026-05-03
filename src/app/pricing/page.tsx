'use client';

import { motion } from 'framer-motion';
import {
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
import { SiteNavbar } from '@/components/layout/SiteNavbar';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/* ═══════════════════════════════════════════════════════
   PRICING PAGE — Maellis (Light SaaS Design System)
   Modular pricing: Base gratuite + Modules premium + Bundle Global Host Pro
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
  viewport: { once: true },
};

const staggerItem = {
  initial: { opacity: 0, y: 30 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

/* ─── Pricing Plans ─── */
const plans = [
  {
    id: 'base',
    name: 'Maellis Base',
    price: '0\u202F\u20AC',
    period: '/mois',
    description: "L'essentiel pour une maison connectée intelligente.",
    features: [
      { icon: MessageSquare, text: 'Assistant Vocal (Web Speech)' },
      { icon: Star, text: 'Météo & Actualités' },
      { icon: ChefHat, text: 'Recettes basiques' },
      { icon: Home, text: 'Contrôle domotique simple' },
      { icon: Users, text: 'Mur familial' },
      { icon: Heart, text: 'Support communautaire' },
    ],
    cta: 'Commencer gratuitement',
    ctaLink: '/connexion',
    popular: false,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
  },
  {
    id: 'safe-arrival',
    name: 'Pack Sécurité',
    price: '6,90\u202F\u20AC',
    period: '/mois',
    description: "La tranquillité d'esprit absolue pour votre famille.",
    features: [
      { icon: Shield, text: 'Safe Arrival (Surveillance enfants/parents)' },
      { icon: Zap, text: "Appel IA Urgence (Retell AI) aux secours" },
      { icon: Lock, text: "Détection d'intrusion & SOS" },
      { icon: MessageSquare, text: 'Alertes SMS/Email automatiques' },
      { icon: Clock, text: 'Historique des arrivées/départs' },
      { icon: Heart, text: 'Support prioritaire 24/7' },
    ],
    cta: 'Activer la Sécurité',
    ctaLink: '/connexion',
    popular: false,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
  },
  {
    id: 'family-zen',
    name: 'Pack Famille Zen',
    price: '12,90\u202F\u20AC',
    period: '/mois',
    description: 'Tout pour organiser et apaiser le quotidien.',
    features: [
      { icon: Shield, text: 'Inclut le Pack Sécurité' },
      { icon: ChefHat, text: 'Recettes Avancées & Chef IA' },
      { icon: Calendar, text: 'Agenda Familial Partagé' },
      { icon: Heart, text: 'Bien-être & Méditation guidée' },
      { icon: Baby, text: 'Contrôle Parental Intelligent' },
      { icon: ShoppingBag, text: 'Liste de courses automatique' },
    ],
    cta: 'Choisir Famille Zen',
    ctaLink: '/connexion',
    popular: false,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-50 dark:bg-orange-500/10',
  },
];

/* ─── Global Host Pro Pack ─── */
const globalHostProFeatures = [
  { icon: Shield, text: 'Safe Departure & Security (Sauvetage avis)' },
  { icon: Clock, text: 'Daily Concierge (Audit quotidien 22h)' },
  { icon: Brain, text: 'Guest Memory (Mémoire préférences)' },
  { icon: Sparkles, text: 'Auto Upsell Intelligent (Présentation services)' },
  { icon: CreditCard, text: 'Smart Late Checkout Seller (Vente heures libres)' },
  { icon: Globe, text: 'Auto Language Adapt (Polyglotte automatique)' },
  { icon: BarChart3, text: 'Analytics & Reports complets' },
];

/* ─── FAQ ─── */
const faqItems = [
  {
    q: 'Puis-je changer de formule à tout moment ?',
    a: "Oui, vous pouvez upgrader ou downgrader votre abonnement en un clic depuis votre espace client. Le prorata est calculé automatiquement.",
  },
  {
    q: 'Y a-t-il un engagement minimum ?',
    a: 'Aucun engagement. Tous nos plans sont sans engagement, vous pouvez résilier à tout moment.',
  },
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Le plan Base est entièrement gratuit et sans limite de temps. Les modules premium bénéficient de 14 jours d'essai sans carte bancaire.",
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Absolument. Toutes les données sont chiffrées AES-256. Nous sommes conformes RGPD et vos données restent sur nos serveurs européens.',
  },
  {
    q: "Qu'est-ce que le pack Global Host Pro ?",
    a: "C'est la solution complète pour hôtes Airbnb professionnels. Il inclut TOUS les modules Maellis (Sécurité, Concierge, Upsell, Late Checkout, Memory, Langues, Analytics) à un prix réduit de 29,90\u202F€/mois au lieu de 38,30\u202F€.",
  },
  {
    q: "Comment l'IA vend-elle les services à ma place ?",
    a: "2 heures après le check-in, l'IA vocale présente automatiquement vos services payants (ménage, chef, transfert). Le jour du départ, elle propose un Late Checkout si le logement est libre. Tout est automatisé via Retell AI.",
  },
];

/* ─── Main Component ─── */
export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ═══ NAVBAR ═══ */}
      <SiteNavbar activePage="/pricing" />

      {/* ═══ HEADER ═══ */}
      <section className="relative pt-28 sm:pt-32 pb-12 px-4">
        {/* Decorative glow */}
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium tracking-wide uppercase mb-6"
            >
              <Sparkles className="w-3 h-3" />
              Tarification Transparente
            </Badge>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-['--font-playfair'] mb-4 tracking-tight text-foreground">
            Choisissez votre{' '}
            <span className="text-amber-600 dark:text-amber-400">sérénité</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Une base gratuite puissante. Des modules premium à la carte pour composer le Maellis parfait pour votre foyer.
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
            transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
            className="relative"
          >
            {/* Gradient border wrapper */}
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-80 blur-[1px]" />

            <Card className="relative bg-card rounded-2xl border-0 overflow-hidden shadow-lg">
              {/* Animated gradient top bar */}
              <div
                className="h-1 w-full"
                style={{
                  background: 'linear-gradient(90deg, #f59e0b, #f97316, #f59e0b, #f97316)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s linear infinite',
                }}
              />

              <CardContent className="p-6 sm:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  {/* Left: Content */}
                  <div>
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] font-bold uppercase tracking-wider">
                        <Crown className="w-3 h-3" />
                        Best Value
                      </Badge>
                      <Badge variant="outline" className="px-2.5 py-1 rounded-full border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                        -22% vs modules séparés
                      </Badge>
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-['--font-playfair'] font-bold mb-3">
                      <span className="text-amber-600 dark:text-amber-400">Maellis</span>{' '}
                      <span className="text-foreground">Global Host Pro</span>
                    </h2>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                      La solution ultime pour hôtes professionnels Airbnb. Sécurité, Revenus Passifs et Expérience Client 5 étoiles — le tout piloté par l&apos;IA.
                    </p>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-5xl sm:text-6xl font-bold font-['--font-playfair'] text-amber-600 dark:text-amber-400">29,90</span>
                      <span className="text-xl text-muted-foreground">€/mois</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      ou <span className="text-amber-600 dark:text-amber-400 font-medium">299€/an</span> — économisez 60€
                    </p>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href="/connexion">
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 px-8 py-4 rounded-xl"
                        >
                          Choisir Global Host Pro
                          <ArrowRight size={18} />
                        </Button>
                      </Link>
                      <Link href="/demo">
                        <Button
                          variant="outline"
                          size="lg"
                          className="text-muted-foreground hover:text-foreground px-6 py-4 rounded-xl"
                        >
                          <Sparkles className="w-4 h-4" />
                          Voir la démo
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Right: Features list */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                      7 modules inclus
                    </h3>
                    {globalHostProFeatures.map((feat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:border-amber-300 dark:hover:border-amber-500/30 transition-all duration-300 group"
                      >
                        <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-colors">
                          <feat.icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {feat.text}
                        </span>
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-auto" />
                      </motion.div>
                    ))}

                    {/* Savings callout */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20"
                    >
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-xs text-emerald-700 dark:text-emerald-400">
                        Valeur totale : <strong className="text-emerald-800 dark:text-emerald-300">38,30€/mois</strong> — vous payez 29,90€
                      </span>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ═══ PRICING GRID (Individual Plans) ═══ */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-['--font-playfair'] mb-3 tracking-tight text-foreground">
              Ou choisissez un{' '}
              <span className="text-amber-600 dark:text-amber-400">module individuel</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Composez votre Maellis idéal en ajoutant uniquement les modules dont vous avez besoin.
            </p>
          </motion.div>

          <motion.div {...stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                variants={staggerItem}
              >
                <Card className="group h-full hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500/30 transition-all duration-300 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-xl md:text-2xl font-['--font-playfair'] text-foreground">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="leading-relaxed">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    {/* Price */}
                    <div className="mb-6 flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div className={`mt-0.5 p-1.5 rounded-md ${plan.iconBg}`}>
                            <feat.icon
                              className={`w-3.5 h-3.5 ${plan.iconColor}`}
                              strokeWidth={2}
                            />
                          </div>
                          <span className="text-muted-foreground leading-relaxed">{feat.text}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Link href={plan.ctaLink} className="w-full">
                      <Button
                        variant="outline"
                        className="w-full py-3 rounded-xl font-semibold group-hover:bg-amber-50 dark:group-hover:bg-amber-500/10 group-hover:border-amber-300 dark:group-hover:border-amber-500/30 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-all duration-300"
                      >
                        {plan.cta} <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ HOSPITALITY MODULES (Airbnb-specific) ═══ */}
      <section className="py-12 md:py-16 px-4 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                variant="outline"
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wider mb-4"
              >
                <Zap className="w-3 h-3" />
                Pour hôtes Airbnb
              </Badge>
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-['--font-playfair'] mb-3 tracking-tight text-foreground">
              Modules{' '}
              <span className="text-amber-600 dark:text-amber-400">Hospitality</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Propulsés par Retell AI et Gemini 2.0 Flash pour protéger votre réputation et booster vos revenus.
            </p>
          </motion.div>

          <motion.div {...stagger} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Safe Departure */}
            <motion.div variants={staggerItem}>
              <Card className="group h-full hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all duration-300 rounded-2xl">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-['--font-playfair'] text-foreground">Safe Departure & Security</CardTitle>
                      <CardDescription className="text-[10px]">Check-out intelligent + sauvetage de réputation</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-['--font-playfair'] text-amber-600 dark:text-amber-400">6,90</span>
                    <span className="text-sm text-muted-foreground">€/mois</span>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {[
                      'Appel vocal Retell AI le jour du départ',
                      'Détection insatisfaction en temps réel',
                      "Alerte immédiate à l'hôte",
                      'Rapport IA StayReview complet',
                      "Génération automatique d'avis public",
                    ].map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Link href="/connexion" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full py-3 rounded-xl font-semibold group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 group-hover:border-emerald-300 dark:group-hover:border-emerald-500/30 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-all duration-300 text-sm"
                    >
                      Activer <ArrowRight size={14} />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Daily Concierge */}
            <motion.div variants={staggerItem}>
              <Card className="relative group h-full border-amber-300 dark:border-amber-500/30 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl">
                {/* Popular badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-5 py-1 rounded-full text-xs font-bold shadow-md">
                    Populaire
                  </Badge>
                </div>

                <CardHeader className="pt-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-['--font-playfair'] text-foreground">Daily Concierge & Care</CardTitle>
                      <CardDescription className="text-[10px]">Audit quotidien à 22h + résolution proactive</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-['--font-playfair'] text-amber-600 dark:text-amber-400">9,90</span>
                    <span className="text-sm text-muted-foreground">€/mois</span>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {[
                      'Audit quotidien automatique à 22h',
                      'Appel vocal respectueux (permission)',
                      'Gestion du silence + relance 1h',
                      'Analyse sentiment Gemini 2.0 Flash',
                      "Alerte hôte si score < 4/5",
                      'Dashboard analytics avec radar 6 axes',
                    ].map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Link href="/connexion" className="w-full">
                    <Button
                      className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-300 text-sm"
                    >
                      Activer <ArrowRight size={14} />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>

          {/* Bundle offer */}
          <motion.div {...fadeUp} className="mt-8">
            <Card className="border-amber-200 dark:border-amber-500/20 rounded-2xl overflow-hidden">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 shrink-0">
                  <Heart className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-sm font-['--font-playfair'] font-semibold text-foreground mb-1">
                    Bundle Hospitality — Safe Departure + Daily Concierge
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Les deux modules pour une protection complète de votre réputation Airbnb.
                  </p>
                </div>
                <div className="text-center shrink-0">
                  <div className="flex items-baseline gap-1 justify-center">
                    <span className="text-2xl font-bold font-['--font-playfair'] text-amber-600 dark:text-amber-400">14,90</span>
                    <span className="text-sm text-muted-foreground">€/mois</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                    Économisez 1,90€/mois
                  </p>
                  <Link href="/connexion">
                    <Button
                      size="sm"
                      className="mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm hover:shadow-md transition-all duration-300 text-xs font-semibold rounded-xl px-5"
                    >
                      Activer le bundle
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ═══ CUSTOM CTA ═══ */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 {...fadeUp} className="font-['--font-playfair'] text-3xl md:text-4xl mb-4 tracking-tight text-foreground">
            Envie de <span className="text-amber-600 dark:text-amber-400">personnaliser</span> ?
          </motion.h2>
          <motion.p {...fadeUp} className="text-muted-foreground text-base max-w-lg mx-auto mb-8">
            Ajoutez uniquement ce dont vous avez besoin. Changez à tout moment, sans engagement.
          </motion.p>
          <motion.div {...fadeUp}>
            <Link href="/connexion">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 px-8 py-4 rounded-xl"
              >
                Construire mon pack sur mesure <Zap size={18} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-16 md:py-20 px-4 bg-muted/40">
        <div className="max-w-3xl mx-auto">
          <motion.h2 {...fadeUp} className="font-['--font-playfair'] text-3xl md:text-4xl text-center text-foreground mb-4 tracking-tight">
            Questions <span className="text-amber-600 dark:text-amber-400">fréquentes</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-center text-muted-foreground text-base max-w-lg mx-auto mb-12">
            Tout ce que vous devez savoir sur nos tarifs.
          </motion.p>

          <motion.div {...stagger} className="space-y-4">
            {faqItems.map((faq, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
              >
                <Card className="hover:border-amber-200 dark:hover:border-amber-500/20 transition-all duration-300 rounded-2xl">
                  <CardContent className="p-6">
                    <h3 className="text-base font-semibold text-foreground mb-2 flex items-start gap-3">
                      <span className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">Q.</span>
                      {faq.q}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-7">{faq.a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <SiteFooter />
    </div>
  );
}
