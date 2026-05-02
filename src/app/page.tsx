'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Brain,
  MessageSquare,
  BarChart3,
  Home,
  Building2,
  ChevronRight,
  Star,
  Check,
  Heart,
  PhoneCall,
  Clock,
  Globe,
  Users,
  DollarSign,
  Zap,
  Menu,
  X,
  ScanLine,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/home/ThemeToggle';

/* ═══════════════════════════════════════════════════════════
   MAELLIS — Landing Page Publique
   Modern SaaS design — warm amber/gold palette
   ═══════════════════════════════════════════════════════ */

/* ── Noise texture SVG data URI ── */
const NOISE_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

/* ── Grid pattern background ── */
const GRID_BG = `linear-gradient(to right, rgba(180,131,70,0.04) 1px, transparent 1px),
                 linear-gradient(to bottom, rgba(180,131,70,0.04) 1px, transparent 1px)`;

/* ── Animation helpers ── */
const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
  viewport: { once: true, amount: 0.2 },
};

const stagger = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1, transition: { staggerChildren: 0.1 } },
  viewport: { once: true, amount: 0.2 },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

/* ═══ NAVBAR ═══ */

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-['--font-playfair'] text-lg tracking-wide font-bold text-foreground">Maellis</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { label: 'Accueil', href: '/' },
            { label: 'Démonstration', href: '/demo' },
            { label: 'Tarifs', href: '/pricing' },
            { label: 'À propos', href: '/about' },
            { label: 'Contact', href: '/contact' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA + Theme Toggle */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Link href="/connexion">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Connexion
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm">
              Essayer la démo
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <button onClick={() => setOpen(!open)} className="p-2 text-muted-foreground hover:text-foreground">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-background border-b border-border px-4 pb-4 pt-2 space-y-1"
        >
          {[
            { label: 'Accueil', href: '/' },
            { label: 'Démonstration', href: '/demo' },
            { label: 'Tarifs', href: '/pricing' },
            { label: 'À propos', href: '/about' },
            { label: 'Contact', href: '/contact' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            <Link href="/connexion" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">Connexion</Button>
            </Link>
            <Link href="/demo" onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                Essayer la démo
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

/* ═══ HERO ═══ */

function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 sm:pt-36 pb-16 sm:pb-24">
      {/* Dramatic multi-layer gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50/60 to-background dark:from-amber-950/30 dark:via-amber-900/15 dark:to-background" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: GRID_BG,
          backgroundSize: '64px 64px',
          maskImage: 'linear-gradient(to bottom, black 30%, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 90%)',
        }}
      />

      {/* Noise/grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay dark:mix-blend-soft-light"
        style={{
          backgroundImage: NOISE_TEXTURE,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
          opacity: 0.6,
        }}
      />

      {/* Background orbs — warm & dramatic */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-amber-200/25 dark:bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-yellow-200/15 dark:bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-rose-200/10 dark:bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] bg-orange-200/10 dark:bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="text-center max-w-3xl mx-auto"
        >
          {/* Badge pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/40 border border-amber-200/60 dark:border-amber-700/40 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 tracking-wide">
              Conciergerie IA pour particuliers &amp; hôtes Airbnb
            </span>
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Votre maison,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500">
              intelligente
            </span>{' '}
            et connectée
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Maellis transforme votre espace en assistant intelligent. Réponse vocale IA,
            gestion des séjours, sécurité, et bien plus — tout depuis une tablette ou un QR code.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/demo">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 h-12 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 text-base transition-all duration-300">
                Découvrir les démos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="border-border text-muted-foreground hover:bg-muted h-12 px-8 text-base">
                Voir les tarifs
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="flex flex-wrap items-center justify-center gap-6 mt-12"
          >
            {[
              { icon: Brain, label: 'IA Gemini 2.0' },
              { icon: Globe, label: '7 langues auto' },
              { icon: Shield, label: 'Données chiffrées' },
              { icon: DollarSign, label: 'Dès 0€/mois' },
            ].map((item) => (
              <motion.div key={item.label} variants={staggerItem} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══ TWO TARGETS — Particulier & Airbnb ═══ */

function DualAudience() {
  return (
    <section className="py-16 sm:py-24 bg-muted/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center mb-12">
          <Badge variant="outline" className="border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 mb-4 bg-background">
            <Star className="w-3 h-3 mr-1" /> Deux expériences, une plateforme
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Pour chaque usage, une solution
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Maellis s&apos;adapte à votre profil — famille moderne ou hôte Airbnb professionnel.
          </p>
        </motion.div>

        <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.15 }}
          className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Particulier Card */}
          <motion.div variants={staggerItem}>
            <Link href="/demo" className="group block">
              <Card className="relative overflow-hidden border-border bg-card hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-500 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 h-full py-0">
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-transparent to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-amber-500/5 transition-all duration-500 pointer-events-none rounded-lg" />
                <div className="relative p-8 sm:p-10">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-amber-500/10 transition-all duration-500">
                    <Home className="w-7 h-7 text-amber-500 dark:text-amber-400" />
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-3">Maison Particulière</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Tablette connectée pour toute la famille : santé, recettes, courses, coffre-fort,
                    mur familial et suggestions contextuelles.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {['Santé', 'Recettes', 'Courses', 'Coffre-fort', 'Voix IA'].map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-100 dark:border-amber-800/40 group-hover:border-amber-200 dark:group-hover:border-amber-700 transition-colors duration-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-500 dark:text-amber-400 group-hover:gap-3 transition-all duration-300">
                    <span>Essayer la démo famille</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>

          {/* Airbnb Card */}
          <motion.div variants={staggerItem}>
            <Link href="/demo" className="group block">
              <Card className="relative overflow-hidden border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 h-full py-0">
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-emerald-500/5 transition-all duration-500 pointer-events-none rounded-lg" />
                <div className="relative p-8 sm:p-10">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-emerald-500/10 transition-all duration-500">
                    <Building2 className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-3">Hôte Airbnb Pro</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Conciergerie IA complète : check-in digital, audit quotidien, sauvetage de réputation,
                    upsell automatique et mémoire voyageurs.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {['Check-in QR', 'Audit 22h', 'Sauvetage avis', 'Upsell IA', '7 langues'].map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-100 dark:border-emerald-800/40 group-hover:border-emerald-200 dark:group-hover:border-emerald-700 transition-colors duration-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-500 dark:text-emerald-400 group-hover:gap-3 transition-all duration-300">
                    <span>Essayer la démo Airbnb</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══ FEATURES GRID ═══ */

function Features() {
  const features = [
    {
      icon: Brain,
      title: 'IA Gemini 2.0 Flash-Lite',
      desc: 'Réponse vocale ultra-rapide, analyse de sentiment et suggestions contextuelles en temps réel.',
      color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-500',
    },
    {
      icon: PhoneCall,
      title: 'Appels vocaux automatisés',
      desc: 'Audit quotidien, sauvetage de réputation et check-out intelligent via Retell AI.',
      color: 'bg-rose-50 dark:bg-rose-900/30 text-rose-500',
    },
    {
      icon: Globe,
      title: 'Polyglotte automatique',
      desc: 'Détection instantanée de la langue du voyageur et adaptation du guide et de la voix.',
      color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-500',
    },
    {
      icon: Shield,
      title: 'Sécurité & Chiffrement',
      desc: 'Clés API chiffrées AES-256, coffre-fort numérique et authentification sécurisée.',
      color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500',
    },
    {
      icon: BarChart3,
      title: 'Analytics en temps réel',
      desc: 'Radar 6 axes, KPIs de satisfaction et rapports hebdomadaires automatisés.',
      color: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500',
    },
    {
      icon: Users,
      title: 'Mémoire voyageurs',
      desc: 'Préférences mémorisées : température, vin, musique, oreiller — et message personnalisé au retour.',
      color: 'bg-copper/10 dark:bg-copper/10 text-copper',
    },
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center mb-12">
          <Badge variant="outline" className="border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 mb-4 bg-background">
            <Zap className="w-3 h-3 mr-1" /> Fonctionnalités
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Une plateforme complète propulsée par les meilleures IA du marché, à une fraction du coût.
          </p>
        </motion.div>

        <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <motion.div key={f.title} variants={staggerItem}>
              <Card className="h-full border-border bg-card hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-6 py-0">
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══ HOW IT WORKS ═══ */

function HowItWorks() {
  const steps = [
    {
      icon: ScanLine,
      step: '01',
      title: 'Scannez un QR Code',
      desc: 'Votre voyageur scanne le QR code dans le logement. En 2 secondes, il accède au guide digital multilingue et à l\'assistant IA.',
    },
    {
      icon: Brain,
      step: '02',
      title: 'Recevez des suggestions IA',
      desc: 'L\'IA Gemini analyse les demandes en temps réel et propose des réponses intelligentes, des recommandations et des upsells contextuels.',
    },
    {
      icon: Sparkles,
      step: '03',
      title: 'Vivez l\'expérience connectée',
      desc: 'Profitez d\'une conciergerie 24h/24 : audit quotidien, appels automatiques, mémoire voyageurs et satisfaction maximale.',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-muted/50 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-200/10 dark:bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
        <motion.div {...fadeUp} className="text-center mb-14">
          <Badge variant="outline" className="border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 mb-4 bg-background">
            <Clock className="w-3 h-3 mr-1" /> Simple et rapide
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Comment ça marche
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Trois étapes suffisent pour transformer l&apos;expérience de vos voyageurs et simplifier votre quotidien.
          </p>
        </motion.div>

        <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.15 }}
          className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((s, i) => (
            <motion.div key={s.step} variants={staggerItem} className="relative text-center group">
              {/* Connector line (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px">
                  <div className="w-full h-full bg-gradient-to-r from-amber-300 dark:from-amber-700 via-amber-200 dark:via-amber-800 to-transparent" />
                  <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-300 dark:text-amber-700 -mt-px" />
                </div>
              )}

              {/* Step number + icon */}
              <div className="relative inline-flex flex-col items-center mb-5">
                <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-amber-500/10 transition-all duration-500 relative">
                  <s.icon className="w-8 h-8 text-amber-500 dark:text-amber-400" />
                  {/* Step number badge */}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {s.step}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══ DEMO CTA ═══ */

function DemoCTA() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp}>
          <div className="relative rounded-2xl border border-amber-200 dark:border-amber-800 bg-card p-[1px] overflow-hidden">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 opacity-20 dark:opacity-30 pointer-events-none" />
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500" />

            <div className="relative bg-card rounded-2xl p-8 sm:p-12 lg:p-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/40 border border-amber-200/60 dark:border-amber-700/40 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Expérience interactive</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Testez Maellis maintenant
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                Deux démonstrations complètes avec réponse vocale IA. Découvrez l&apos;expérience
                Famille ou l&apos;expérience Hôte Airbnb — directement dans votre navigateur.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/demo">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-10 h-12 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 text-base transition-all duration-300">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Lancer les démos
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
                {[
                  { icon: Home, label: 'Démo Famille' },
                  { icon: Building2, label: 'Démo Airbnb' },
                  { icon: MessageSquare, label: 'Réponse vocale' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <item.icon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══ PRICING PREVIEW ═══ */

function PricingPreview() {
  return (
    <section className="py-16 sm:py-24 bg-muted/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center mb-12">
          <Badge variant="outline" className="border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 mb-4 bg-background">
            <DollarSign className="w-3 h-3 mr-1" /> Tarifs simples
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Commencez gratuitement, évoluez quand vous voulez
          </h2>
        </motion.div>

        <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {/* Free */}
          <motion.div variants={staggerItem}>
            <Card className="h-full border-border bg-card p-6 py-0 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <p className="text-sm font-semibold text-foreground mb-1">Base</p>
              <p className="text-3xl font-bold text-foreground mb-1">0€</p>
              <p className="text-xs text-muted-foreground mb-4">pour toujours</p>
              <div className="space-y-2">
                {['QR code digital', 'Guide logement', 'Tablette connectée'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Sécurité */}
          <motion.div variants={staggerItem}>
            <Card className="h-full border-border bg-card p-6 py-0 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <p className="text-sm font-semibold text-foreground mb-1">Sécurité</p>
              <p className="text-3xl font-bold text-foreground mb-1">6,90€</p>
              <p className="text-xs text-muted-foreground mb-4">/mois</p>
              <div className="space-y-2">
                {['Safe Departure', 'Sauvetage avis', 'Analyse sentiment'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Concierge */}
          <motion.div variants={staggerItem}>
            <Card className="h-full border-border bg-card p-6 py-0 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <p className="text-sm font-semibold text-foreground mb-1">Concierge</p>
              <p className="text-3xl font-bold text-foreground mb-1">9,90€</p>
              <p className="text-xs text-muted-foreground mb-4">/mois</p>
              <div className="space-y-2">
                {['Audit quotidien 22h', 'Daily Concierge', 'Analytics'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Global Host Pro — Best Value with gold gradient border */}
          <motion.div variants={staggerItem}>
            <div className="relative h-full rounded-lg p-[1.5px] bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 shadow-xl shadow-amber-500/10 overflow-hidden">
              {/* Animated shimmer sweep */}
              <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                <div className="absolute -inset-full animate-[border-shimmer_4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/3" />
              </div>
              <Card className="relative h-full bg-card p-6 py-0 border-0 shadow-none overflow-visible rounded-[7px]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-t-[7px]" />
                <Badge className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0 rounded-full mb-2 shadow-sm shadow-amber-500/25">
                  Best Value
                </Badge>
                <p className="text-sm font-semibold text-foreground mb-1">Global Host Pro</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">29,90€</p>
                <p className="text-xs text-muted-foreground mb-4">/mois — 7 modules inclus</p>
                <div className="space-y-2">
                  {['Tous les modules', 'IA Gemini 2.0', 'Mémoire voyageurs', 'TTS Premium'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-amber-500" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>
        </motion.div>

        <div className="text-center mt-8">
          <Link href="/pricing">
            <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted">
              Voir tous les détails
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══ FOOTER ═══ */

function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-['--font-playfair'] text-lg font-bold text-background">Maellis</span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed">
              L&apos;assistant intelligent pour votre maison et vos voyageurs.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-sm font-semibold text-background mb-3">Produit</h4>
            <div className="space-y-2">
              {[
                { label: 'Démonstration', href: '/demo' },
                { label: 'Tarifs', href: '/pricing' },
                { label: 'Connexion', href: '/connexion' },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                  className="block text-sm text-background/60 hover:text-amber-400 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="text-sm font-semibold text-background mb-3">Entreprise</h4>
            <div className="space-y-2">
              {[
                { label: 'À propos', href: '/about' },
                { label: 'Contact', href: '/contact' },
                { label: 'Confidentialité', href: '/legal/privacy' },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                  className="block text-sm text-background/60 hover:text-amber-400 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div>
            <h4 className="text-sm font-semibold text-background mb-3">Modules</h4>
            <div className="space-y-2">
              {['Safe Departure', 'Daily Concierge', 'Auto Upsell', 'Global Host Pro'].map((m) => (
                <Link key={m} href="/pricing"
                  className="block text-sm text-background/60 hover:text-amber-400 transition-colors">
                  {m}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-background/40">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>&copy; {new Date().getFullYear()} Maellis — Maison Consciente. Tous droits réservés.</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/legal/privacy" className="hover:text-amber-400 transition-colors">Confidentialité</Link>
              <Link href="/contact" className="hover:text-amber-400 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══ MAIN PAGE ═══ */

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <DualAudience />
        <Features />
        <HowItWorks />
        <DemoCTA />
        <PricingPreview />
      </main>
      <Footer />
    </div>
  );
}
