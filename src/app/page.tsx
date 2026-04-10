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
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

/* ═══════════════════════════════════════════════════════════
   MAELLIS — Landing Page Publique
   Structure classique SaaS : Hero → Features → Démos → Pricing → Footer
   ═══════════════════════════════════════════════════════ */

/* ── Animation helpers ── */
const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

/* ═══ NAVBAR ═══ */

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-gold glow-gold flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#020617]" />
          </div>
          <span className="font-serif text-lg tracking-wide text-gradient-gold">Maellis</span>
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
              className="px-3.5 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100/60 transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/connexion">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800">
              Connexion
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="sm" className="bg-gradient-gold text-[#020617] hover:opacity-90 font-semibold shadow-[0_2px_12px_var(--accent-primary-glow)]">
              Essayer la démo
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-slate-500 hover:text-slate-800">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-b border-slate-200/60 px-4 pb-4 pt-2 space-y-1"
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
              className="block px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100/60 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link href="/connexion" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">Connexion</Button>
            </Link>
            <Link href="/demo" onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full bg-gradient-gold text-[#020617] hover:opacity-90 font-semibold">
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
      {/* Background orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-300/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-violet-200/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="text-center max-w-3xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200/60 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700 tracking-wide">
              Conciergerie IA pour particuliers &amp; hôtes Airbnb
            </span>
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-slate-900 mb-6 leading-tight">
            Votre maison,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500">
              intelligente
            </span>{' '}
            et connectée
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Maellis transforme votre espace en assistant intelligent. Réponse vocale IA,
            gestion des séjours, sécurité, et bien plus — tout depuis une tablette ou un QR code.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/demo">
              <Button size="lg" className="bg-gradient-gold text-[#020617] hover:opacity-90 font-semibold px-8 h-12 shadow-[0_4px_20px_var(--accent-primary-glow)] text-base">
                Découvrir les démos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="border-slate-200 text-slate-600 hover:bg-slate-50 h-12 px-8 text-base">
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
              <motion.div key={item.label} variants={staggerItem} className="flex items-center gap-2 text-sm text-slate-400">
                <item.icon className="w-4 h-4 text-amber-500" />
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
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-slate-50/50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center mb-12">
          <Badge variant="outline" className="border-amber-200 text-amber-600 mb-4">
            <Star className="w-3 h-3 mr-1" /> Deux expériences, une plateforme
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mb-4">
            Pour chaque usage, une solution
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Maellis s&apos;adapte à votre profil — famille moderne ou hôte Airbnb professionnel.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Particulier Card */}
          <motion.div variants={staggerItem} initial="initial" animate="animate">
            <Link href="/demo" className="group block">
              <Card className="relative overflow-hidden border-slate-200/60 hover:border-violet-200 transition-all duration-500 hover:shadow-xl hover:shadow-violet-100/50 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/40 via-transparent to-rose-50/30 pointer-events-none" />
                <div className="relative p-8 sm:p-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-rose-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Home className="w-7 h-7 text-violet-500" />
                  </div>

                  <h3 className="text-2xl font-serif font-bold text-slate-800 mb-3">Maison Particulière</h3>
                  <p className="text-slate-500 mb-6 leading-relaxed">
                    Tablette connectée pour toute la famille : santé, recettes, courses, coffre-fort,
                    mur familial et suggestions contextuelles.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {['Santé', 'Recettes', 'Courses', 'Coffre-fort', 'Voix IA'].map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-medium border border-violet-100">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-violet-500 group-hover:gap-3 transition-all">
                    <span>Essayer la démo famille</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>

          {/* Airbnb Card */}
          <motion.div variants={staggerItem} initial="initial" animate="animate" transition={{ delay: 0.15 }}>
            <Link href="/demo" className="group block">
              <Card className="relative overflow-hidden border-slate-200/60 hover:border-amber-200 transition-all duration-500 hover:shadow-xl hover:shadow-amber-100/50 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-transparent to-orange-50/30 pointer-events-none" />
                <div className="relative p-8 sm:p-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="w-7 h-7 text-amber-600" />
                  </div>

                  <h3 className="text-2xl font-serif font-bold text-slate-800 mb-3">Hôte Airbnb Pro</h3>
                  <p className="text-slate-500 mb-6 leading-relaxed">
                    Conciergerie IA complète : check-in digital, audit quotidien, sauvetage de réputation,
                    upsell automatique et mémoire voyageurs.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {['Check-in QR', 'Audit 22h', 'Sauvetage avis', 'Upsell IA', '7 langues'].map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium border border-amber-100">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 group-hover:gap-3 transition-all">
                    <span>Essayer la démo Airbnb</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        </div>
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
      color: 'bg-violet-50 text-violet-500 border-violet-100',
    },
    {
      icon: PhoneCall,
      title: 'Appels vocaux automatisés',
      desc: 'Audit quotidien, sauvetage de réputation et check-out intelligent via Retell AI.',
      color: 'bg-rose-50 text-rose-500 border-rose-100',
    },
    {
      icon: Globe,
      title: 'Polyglotte automatique',
      desc: 'Détection instantanée de la langue du voyageur et adaptation du guide et de la voix.',
      color: 'bg-sky-50 text-sky-500 border-sky-100',
    },
    {
      icon: Shield,
      title: 'Sécurité & Chiffrement',
      desc: 'Clés API chiffrées AES-256, coffre-fort numérique et authentification sécurisée.',
      color: 'bg-emerald-50 text-emerald-500 border-emerald-100',
    },
    {
      icon: BarChart3,
      title: 'Analytics en temps réel',
      desc: 'Radar 6 axes, KPIs de satisfaction et rapports hebdomadaires automatisés.',
      color: 'bg-amber-50 text-amber-500 border-amber-100',
    },
    {
      icon: Users,
      title: 'Mémoire voyageurs',
      desc: 'Préférences mémorisées : température, vin, musique, oreiller — et message personnalisé au retour.',
      color: 'bg-orange-50 text-orange-500 border-orange-100',
    },
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center mb-12">
          <Badge variant="outline" className="border-violet-200 text-violet-600 mb-4">
            <Zap className="w-3 h-3 mr-1" /> Fonctionnalités
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Une plateforme complète propulsée par les meilleures IA du marché, à une fraction du coût.
          </p>
        </motion.div>

        <motion.div variants={stagger} initial="initial" animate="animate"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <motion.div key={f.title} variants={staggerItem}>
              <Card className="h-full border-slate-200/60 hover:border-slate-300 hover:shadow-lg transition-all duration-300 p-6">
                <div className={`w-11 h-11 rounded-xl ${f.color} border flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </Card>
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
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-amber-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp}>
          <Card className="relative overflow-hidden border-amber-200/60">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-orange-50/30 to-rose-50/40 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
            <div className="relative p-8 sm:p-12 lg:p-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/60 border border-amber-200/40 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">Expérience interactive</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mb-4">
                Testez Maellis maintenant
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
                Deux démonstrations complètes avec réponse vocale IA. Découvrez l&apos;expérience
                Famille ou l&apos;expérience Hôte Airbnb — directement dans votre navigateur.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/demo">
                  <Button size="lg" className="bg-gradient-gold text-[#020617] hover:opacity-90 font-semibold px-10 h-12 shadow-[0_4px_20px_var(--accent-primary-glow)] text-base">
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
                  <div key={item.label} className="flex items-center gap-2 text-sm text-slate-400">
                    <item.icon className="w-4 h-4 text-amber-500" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══ PRICING PREVIEW ═══ */

function PricingPreview() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center mb-12">
          <Badge variant="outline" className="border-emerald-200 text-emerald-600 mb-4">
            <DollarSign className="w-3 h-3 mr-1" /> Tarifs simples
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mb-4">
            Commencez gratuitement, évoluez quand vous voulez
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {/* Free */}
          <Card className="border-slate-200/60 p-6 hover:shadow-lg transition-shadow">
            <p className="text-sm font-semibold text-slate-800 mb-1">Base</p>
            <p className="text-3xl font-bold font-serif text-slate-900 mb-1">0€</p>
            <p className="text-xs text-slate-400 mb-4">pour toujours</p>
            <div className="space-y-2">
              {['QR code digital', 'Guide logement', 'Tablette connectée'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Sécurité */}
          <Card className="border-slate-200/60 p-6 hover:shadow-lg transition-shadow">
            <p className="text-sm font-semibold text-slate-800 mb-1">Sécurité</p>
            <p className="text-3xl font-bold font-serif text-slate-900 mb-1">6,90€</p>
            <p className="text-xs text-slate-400 mb-4">/mois</p>
            <div className="space-y-2">
              {['Safe Departure', 'Sauvetage avis', 'Analyse sentiment'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Concierge */}
          <Card className="border-slate-200/60 p-6 hover:shadow-lg transition-shadow">
            <p className="text-sm font-semibold text-slate-800 mb-1">Concierge</p>
            <p className="text-3xl font-bold font-serif text-slate-900 mb-1">9,90€</p>
            <p className="text-xs text-slate-400 mb-4">/mois</p>
            <div className="space-y-2">
              {['Audit quotidien 22h', 'Daily Concierge', 'Analytics'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Global Host Pro */}
          <Card className="relative border-amber-300/60 p-6 shadow-lg shadow-amber-100/50 hover:shadow-xl transition-shadow overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0 rounded-full mb-2">
              Best Value
            </Badge>
            <p className="text-sm font-semibold text-slate-800 mb-1">Global Host Pro</p>
            <p className="text-3xl font-bold font-serif text-gradient-gold mb-1">29,90€</p>
            <p className="text-xs text-slate-400 mb-4">/mois — 7 modules inclus</p>
            <div className="space-y-2">
              {['Tous les modules', 'IA Gemini 2.0', 'Mémoire voyageurs', 'TTS Premium'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                  <Check className="w-3 h-3 text-amber-500" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Link href="/pricing">
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">
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
    <footer className="border-t border-slate-200/60 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#020617]" />
              </div>
              <span className="font-serif text-gradient-gold font-semibold">Maellis</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              L&apos;assistant intelligent pour votre maison et vos voyageurs.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Produit</h4>
            <div className="space-y-2">
              {[
                { label: 'Démonstration', href: '/demo' },
                { label: 'Tarifs', href: '/pricing' },
                { label: 'Connexion', href: '/connexion' },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                  className="block text-sm text-slate-400 hover:text-slate-600 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Entreprise</h4>
            <div className="space-y-2">
              {[
                { label: 'À propos', href: '/about' },
                { label: 'Contact', href: '/contact' },
                { label: 'Confidentialité', href: '/legal/privacy' },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                  className="block text-sm text-slate-400 hover:text-slate-600 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Modules</h4>
            <div className="space-y-2">
              {['Safe Departure', 'Daily Concierge', 'Auto Upsell', 'Global Host Pro'].map((m) => (
                <Link key={m} href="/pricing"
                  className="block text-sm text-slate-400 hover:text-slate-600 transition-colors">
                  {m}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="divider-gold mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>&copy; {new Date().getFullYear()} Maellis — Maison Consciente. Tous droits réservés.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/legal/privacy" className="hover:text-slate-600 transition-colors">Confidentialité</Link>
            <Link href="/contact" className="hover:text-slate-600 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══ MAIN PAGE ═══ */

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <DualAudience />
        <Features />
        <DemoCTA />
        <PricingPreview />
      </main>
      <Footer />
    </div>
  );
}
