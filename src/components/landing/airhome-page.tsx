'use client';

import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowRight,
  Mic,
  QrCode,
  Bell,
  LayoutDashboard,
  Brain,
  Smartphone,
  MessageCircle,
  Shield,
  Clock,
  Headphones,
  ChefHat,
  Sparkles,
  Home,
  Globe,
  CheckCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Wifi,
  Phone,
  Coffee,
  Smile,
  FileText,
  TrendingUp,
  Zap,
  Heart,
  Users,
  Award,
  Menu,
  X,
  Play,
  User,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   AIRHOME / MAELLIS — LANDING PAGE
   "Dark Luxe Futuriste" Immersive Experience
   ═══════════════════════════════════════════════════════ */

interface AirHomePageProps {
  onShowAuth: () => void;
  onShowAuthType?: (type: 'home' | 'hospitality') => void;
  onShowDemo?: () => void;
}

/* ─── Animation Variants ─── */
const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
  viewport: { once: true, margin: '-80px' },
};

const fadeScale = {
  initial: { opacity: 0, scale: 0.92 },
  whileInView: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: easeOut } },
  viewport: { once: true, margin: '-80px' },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.12 } },
  viewport: { once: true, margin: '-60px' },
};

const staggerItem = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

/* ─── Stat Counter Component ─── */
function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const started = useRef(false);
  const isFloat = value % 1 !== 0;

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    const duration = 2500;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  const displayValue = isFloat
    ? count === Math.floor(value)
      ? value.toFixed(1)
      : count
    : count.toLocaleString();

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 sm:p-6 text-center border border-white/[0.06] hover:border-amber-500/20 transition-colors">
      <span ref={ref} className="block text-3xl sm:text-4xl font-serif text-gradient-gold font-bold mb-1">
        {displayValue}{suffix}
      </span>
      <span className="text-sm text-slate-400">{label}</span>
    </div>
  );
}

/* ─── Feature Cards Data ─── */
const features = [
  {
    icon: Mic,
    title: 'Assistant Vocal Intelligent',
    subtitle: 'Maellis comprend et répond',
    description:
      "Répond instantanément à toutes les questions (WiFi, Netflix, Clim, Check-out). Base de connaissances personnalisable par le propriétaire.",
    gradient: 'from-amber-500/20 to-orange-600/10',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/20 hover:border-amber-500/40',
    dialogBefore: '"Maellis, comment allumer la TV ?"',
    dialogAfter: '"Utilisez la télécommande bleue, bouton power en haut. La Netflix est sur HDMI 2."',
    span: 'md:col-span-2 md:row-span-1',
  },
  {
    icon: QrCode,
    title: 'Scan Viral & Mobile Concierge',
    subtitle: 'Le voyageur garde Maellis dans sa poche',
    description:
      "Le voyageur scanne, garde l'assistant dans sa poche. Créez un réseau mondial de fidèles. Monétisez les recommandations hors du logement.",
    gradient: 'from-violet-500/20 to-purple-600/10',
    iconColor: 'text-violet-400',
    borderColor: 'border-violet-500/20 hover:border-violet-500/40',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    icon: ChefHat,
    title: 'Services & Upselling',
    subtitle: 'Revenus supplémentaires',
    description:
      "Proposez des services premium (Ménage, Linge, Restos partenaires). Commande directe via WhatsApp. +10€/mois pour activer le module.",
    gradient: 'from-emerald-500/20 to-teal-600/10',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    icon: Bell,
    title: 'Notifications Proactives & Sécurité',
    subtitle: 'Voyageur pris en charge 24/7',
    description:
      "Check-in/out automatisés, rappels médicaments, alertes météo. Votre voyageur se sent pris en charge, vous dormez tranquille.",
    gradient: 'from-rose-500/20 to-pink-600/10',
    iconColor: 'text-rose-400',
    borderColor: 'border-rose-500/20 hover:border-rose-500/40',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard Multi-Logements',
    subtitle: 'Portfolio complet',
    description:
      "Gérez un portfolio entier depuis un écran unique. Configurez un modèle global et appliquez-le à tous vos biens en 1 clic.",
    gradient: 'from-sky-500/20 to-cyan-600/10',
    iconColor: 'text-sky-400',
    borderColor: 'border-sky-500/20 hover:border-sky-500/40',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    icon: Brain,
    title: 'Mémoire Intelligente & Apprentissage',
    subtitle: "Maellis s'adapte à chaque voyageur",
    description:
      "Maellis apprend des préférences de vos voyageurs. 'Vous aimez le Jazz ? Je mets ça par défaut la prochaine fois.'",
    gradient: 'from-amber-500/20 to-violet-600/10',
    iconColor: 'text-amber-300',
    borderColor: 'border-amber-500/20 hover:border-violet-500/40',
    span: 'md:col-span-2 md:row-span-1',
  },
];

/* ─── Testimonials Data ─── */
const testimonials = [
  {
    name: 'Sophie L.',
    role: 'Propriétaire Airbnb — Nice',
    text: "Depuis que j'ai installé Maellis, mes appels nocturnes ont diminué de 90%. Les voyageurs trouvent tout seul, et mes avis ont bondi de 4.6 à 4.9.",
    rating: 5,
    avatar: 'S',
  },
  {
    name: 'Marc D.',
    role: 'Gérant de 12 appartements — Paris',
    text: "Le dashboard multi-logements est un game changer. Je configure un modèle une fois et l'applique partout. Gain de temps énorme.",
    rating: 5,
    avatar: 'M',
  },
  {
    name: 'Amina B.',
    role: 'Hôte Superhost — Marrakech',
    text: "Le module services m'a rapporté 400€ de revenus supplémentaires le premier mois. Ménage express et transferts aéroport, commandés directement par les voyageurs.",
    rating: 5,
    avatar: 'A',
  },
  {
    name: 'Thomas R.',
    role: 'Propriétaire saisonnier — Annecy',
    text: "Maellis répond en 3 langues. Mes voyageurs internationaux sont ravis, et je ne reçois plus de questions sur le WiFi ou la climatisation.",
    rating: 5,
    avatar: 'T',
  },
  {
    name: 'Claire V.',
    role: 'Gérance immobilière — Bordeaux',
    text: "L'alerte météo et les rappels check-out ont sauvé plusieurs séjours. Nos voyageurs se sentent vraiment accompagnés.",
    rating: 5,
    avatar: 'C',
  },
];

/* ─── Stats Data ─── */
const statsData = [
  { value: 10000, suffix: '+', label: 'Voyageurs assistés' },
  { value: 500, suffix: '+', label: 'Propriétaires' },
  { value: 80, suffix: '%', label: 'Temps gagné' },
  { value: 4.9, suffix: '/5', label: 'Note moyenne' },
];

/* ─── Pricing Data ─── */
const plans = [
  {
    name: 'Starter',
    price: '9,99€',
    period: '/mois',
    description: 'Parfait pour un premier logement',
    features: [
      '1 logement inclus',
      'Assistant vocal illimité',
      'QR Code & guide digital',
      'Notifications automatiques',
      'Base de connaissances (50 FAQ)',
      'Support email',
    ],
    cta: 'Commencer',
    popular: false,
    gradient: '',
  },
  {
    name: 'Pro',
    price: '19,99€',
    period: '/mois',
    description: 'Pour les propriétaires sérieux',
    features: [
      '5 logements inclus',
      'Tout Starter +',
      'Module Services (+10€/mois)',
      'Module Restaurants (+10€/mois)',
      'Dashboard multi-logements',
      'Analytics & rapports',
      'Support prioritaire',
    ],
    cta: 'Choisir Pro',
    popular: true,
    gradient: 'border-amber-500/50 bg-gradient-to-b from-amber-900/20 to-slate-900',
  },
  {
    name: 'Agency',
    price: '49,99€',
    period: '/mois',
    description: 'Gérances & portefeuilles importants',
    features: [
      'Logements illimités',
      'Tout Pro +',
      'Marque blanche personnalisée',
      'API & webhooks',
      'Account manager dédié',
      'Formation équipe incluse',
      'SLA garanti 99.9%',
    ],
    cta: 'Contacter les ventes',
    popular: false,
    gradient: '',
  },
];

/* ─── Magnetic Button Component ─── */
function MagneticButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    if (!el) return;
    el.style.transform = 'translate(0, 0)';
  }, []);

  return (
    <button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════ */
function Navbar({
  onShowAuth,
  onShowAuthType,
  onScrollToTop,
  onShowDemo,
}: {
  onShowAuth: () => void;
  onShowAuthType?: (type: 'home' | 'hospitality') => void;
  onScrollToTop: () => void;
  onShowDemo?: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Témoignages', href: '#testimonials' },
    { label: 'Tarifs', href: '#pricing' },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: easeOut }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
        {/* Logo */}
        <button onClick={onScrollToTop} className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-gold glow-gold transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]">
            <Sparkles className="w-5 h-5 text-slate-950" strokeWidth={2} />
          </div>
          <span className="font-serif text-gradient-gold text-lg sm:text-xl tracking-wide hidden sm:inline">
            Maellis
          </span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 text-sm font-medium text-slate-400 hover:text-amber-200 transition-colors duration-200 rounded-lg hover:bg-white/[0.04]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onShowDemo?.()}
            className="px-3 py-2 text-sm font-medium text-amber-400/70 hover:text-amber-300 transition-colors duration-200 hidden sm:flex items-center gap-1.5"
          >
            <Play className="w-3 h-3" />
            Démo
          </button>
          <button
            onClick={onShowAuth}
            className="px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors duration-200 hidden sm:block"
          >
            Connexion
          </button>
          <button
            onClick={() => onShowAuthType?.('hospitality')}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-[0_0_24px_rgba(245,158,11,0.15)] hover:shadow-[0_0_32px_rgba(245,158,11,0.3)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
          >
            Essai Gratuit
          </button>
          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-slate-950/95 backdrop-blur-xl border-b border-white/[0.06] overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-amber-200 transition-colors rounded-lg hover:bg-white/[0.04]"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onShowAuth();
                }}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
              >
                Connexion
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════ */
function HeroSection({ onShowAuth }: { onShowAuth: () => void }) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Amber glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-amber-500/[0.07] blur-[120px]" />
        {/* Violet glow */}
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/[0.05] blur-[100px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] mb-8"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-slate-300">
            Propulsé par l&apos;Intelligence Artificielle
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: easeOut }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08] tracking-tight mb-6"
        >
          <span className="text-slate-50">Transformez vos locations</span>
          <br />
          <span className="text-gradient-gold">en expériences 5 étoiles,</span>
          <br />
          <span className="text-slate-50">sans lever le petit doigt.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7, ease: easeOut }}
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          <strong className="text-amber-400 font-semibold">Maellis</strong> : L&apos;assistant vocal
          intelligent qui gère le check-in, répond aux voyageurs 24/7, et booste vos revenus.
          <span className="text-amber-300 font-semibold"> Réduisez votre temps de gestion de 80%.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.0, ease: easeOut }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <MagneticButton
            onClick={onShowAuth}
            className="group relative inline-flex items-center gap-3 px-8 sm:px-10 py-4 text-base font-bold rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.35)] transition-all duration-300"
          >
            <span className="relative z-10">Essayer la démo gratuite</span>
            <ArrowRight className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl bg-amber-500/30 animate-ping [animation-duration:3s]" />
          </MagneticButton>

          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2.5 px-8 py-4 text-base font-medium rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300"
          >
            <Play className="w-4 h-4" />
            Voir comment ça marche
          </a>
        </motion.div>

        {/* Floating tablet mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.3, ease: easeOut }}
          className="mt-16 sm:mt-20 relative"
        >
          <div className="relative mx-auto max-w-3xl">
            {/* Glow behind tablet */}
            <div className="absolute inset-0 bg-amber-500/[0.08] blur-[80px] rounded-3xl" />
            {/* Tablet frame */}
            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/[0.08] p-1 shadow-2xl">
              <div className="bg-slate-950 rounded-xl sm:rounded-2xl overflow-hidden">
                {/* Tablet screen header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs text-slate-400 font-medium">Maellis — Bienvenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-slate-500">En ligne</span>
                  </div>
                </div>
                {/* Screen content */}
                <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-4">
                  {/* Voice orb */}
                  <div className="flex justify-center mb-2">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/30 to-violet-500/20 flex items-center justify-center border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]">
                      <Mic className="w-8 h-8 text-amber-400" />
                    </div>
                  </div>
                  <p className="text-center text-sm text-slate-400">Dites &quot;Maellis&quot; ou appuyez sur le bouton</p>
                  {/* Mock widgets */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                      { icon: Wifi, label: 'WiFi', color: 'text-sky-400' },
                      { icon: ChefHat, label: 'Restos', color: 'text-emerald-400' },
                      { icon: Bell, label: 'Check-out', color: 'text-amber-400' },
                    ].map((w) => (
                      <div
                        key={w.label}
                        className="bg-white/[0.04] rounded-xl p-3 text-center border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                      >
                        <w.icon className={`w-5 h-5 ${w.color} mx-auto mb-1.5`} />
                        <span className="text-[10px] sm:text-xs text-slate-400">{w.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative floating elements */}
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -right-4 sm:-right-8 bg-white/[0.06] backdrop-blur-xl rounded-xl p-2.5 border border-white/[0.08] shadow-lg hidden sm:block"
            >
              <MessageCircle className="w-5 h-5 text-amber-400" />
            </motion.div>
            <motion.div
              animate={{ y: [6, -6, 6] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-4 -left-4 sm:-left-8 bg-white/[0.06] backdrop-blur-xl rounded-xl p-2.5 border border-white/[0.08] shadow-lg hidden sm:block"
            >
              <Star className="w-5 h-5 text-amber-400" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   PROBLEM / SOLUTION SECTION
   ═══════════════════════════════════════════════════════ */
function ProblemSolutionSection() {
  const [hoveredSide, setHoveredSide] = useState<'before' | 'after' | null>(null);

  return (
    <section className="relative py-20 sm:py-28" id="how-it-works">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.h2
          {...fadeUp}
          className="font-serif text-3xl sm:text-4xl md:text-5xl text-center text-slate-50 mb-4 tracking-tight"
        >
          Fini les appels à{' '}
          <span className="text-rose-400">23h</span> pour le code WiFi.
        </motion.h2>
        <motion.p
          {...fadeUp}
          className="text-center text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-14 sm:mb-20"
        >
          Découvrez le gain de temps radical que Maellis apporte à votre quotidien de propriétaire.
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* AVANT - Before */}
          <motion.div
            {...fadeScale}
            onMouseEnter={() => setHoveredSide('before')}
            onMouseLeave={() => setHoveredSide(null)}
            className={`relative bg-white/[0.03] backdrop-blur-xl rounded-3xl p-8 sm:p-10 border transition-all duration-500 ${
              hoveredSide === 'after'
                ? 'border-white/[0.04] grayscale-[60%] opacity-50 scale-[0.98]'
                : 'border-rose-500/20 hover:border-rose-500/40'
            }`}
          >
            {/* "Before" badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 mb-6">
              <span className="text-rose-400 text-xs font-bold uppercase tracking-wider">Avant</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl text-slate-100 mb-6">
              Gestion manuelle, stress permanente
            </h3>

            <div className="space-y-5">
              {[
                { icon: Phone, text: 'Appels à toute heure pour des questions basiques', color: 'text-rose-400' },
                { icon: FileText, text: 'Guide imprimé jamais mis à jour', color: 'text-rose-400' },
                { icon: Clock, text: 'Heures perdues par semaine en gestion', color: 'text-rose-400' },
                { icon: MessageCircle, text: 'Messages WhatsApp qui s\'accumulent', color: 'text-rose-400' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={1.5} />
                  </div>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Stress illustration */}
            <div className="mt-8 p-4 bg-rose-500/[0.05] rounded-2xl border border-rose-500/10">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-rose-500/20 border-2 border-slate-900 flex items-center justify-center"
                    >
                      <Phone className="w-3 h-3 text-rose-400" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-rose-300 text-sm font-medium">23 appels manqués aujourd&apos;hui</p>
                  <p className="text-rose-400/60 text-xs">15 min en moyenne par réponse</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* APRÈS - After */}
          <motion.div
            {...fadeScale}
            onMouseEnter={() => setHoveredSide('after')}
            onMouseLeave={() => setHoveredSide(null)}
            className={`relative bg-white/[0.03] backdrop-blur-xl rounded-3xl p-8 sm:p-10 border transition-all duration-500 ${
              hoveredSide === 'after'
                ? 'border-amber-500/40 scale-[1.02] shadow-[0_0_40px_rgba(245,158,11,0.1)]'
                : 'border-emerald-500/20 hover:border-emerald-500/40'
            }`}
          >
            {/* Glow on hover */}
            {hoveredSide === 'after' && (
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/[0.05] to-emerald-500/[0.03] pointer-events-none" />
            )}

            <div className="relative z-10">
              {/* "After" badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Avec Maellis</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl text-slate-100 mb-6">
                Réponses automatiques, voyageur autonome
              </h3>

              <div className="space-y-5">
                {[
                  { icon: Mic, text: 'Maellis répond instantanément 24/7', color: 'text-emerald-400' },
                  { icon: QrCode, text: 'Guide digital toujours à jour', color: 'text-emerald-400' },
                  { icon: Coffee, text: 'Vous vous concentrez sur l\'essentiel', color: 'text-emerald-400' },
                  { icon: TrendingUp, text: 'Revenus augmentés grâce aux services', color: 'text-emerald-400' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={1.5} />
                    </div>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              {/* Success illustration */}
              <div className="mt-8 p-4 bg-emerald-500/[0.05] rounded-2xl border border-emerald-500/10">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-slate-900 flex items-center justify-center"
                      >
                        <Smile className="w-3 h-3 text-emerald-400" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-emerald-300 text-sm font-medium">0 appel nocturne cette semaine</p>
                    <p className="text-emerald-400/60 text-xs">98% des questions résolues automatiquement</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FEATURE CARD COMPONENT
   ═══════════════════════════════════════════════════════ */
function FeatureCard({ feature }: { feature: (typeof features)[number] }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={staggerItem}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group bg-white/[0.02] backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border transition-all duration-500 overflow-hidden ${feature.span} ${feature.borderColor} hover:bg-white/[0.04]`}
    >
      {/* Background gradient on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center">
            <feature.icon className={`w-6 h-6 ${feature.iconColor}`} strokeWidth={1.5} />
          </div>
        </div>

        <h3 className="font-serif text-xl sm:text-2xl text-slate-50 mb-1">{feature.title}</h3>
        <p className="text-sm text-amber-400/70 mb-3 font-medium">{feature.subtitle}</p>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-4">{feature.description}</p>

        {/* Dialog demo for voice card */}
        {'dialogBefore' in feature && feature.dialogBefore && (
          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-3 h-3 text-sky-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-500 italic">{feature.dialogBefore}</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Mic className="w-3 h-3 text-amber-400" />
              </div>
              <p className="text-xs sm:text-sm text-amber-300/80 italic">{feature.dialogAfter}</p>
            </div>
          </div>
        )}

        {/* Learn more link */}
        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-amber-400/70 group-hover:text-amber-400 transition-colors">
          En savoir plus
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   FEATURES BENTO GRID
   ═══════════════════════════════════════════════════════ */
function FeaturesBentoGrid() {
  return (
    <section className="relative py-20 sm:py-28 bg-black/20" id="features">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/[0.04] blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Fonctionnalités</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-slate-50 mb-4 tracking-tight">
            Tout ce dont vous avez besoin,{' '}
            <span className="text-gradient-gold">en une seule plateforme</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Six piliers technologiques pour transformer votre gestion locative et ravir vos voyageurs.
          </p>
        </motion.div>

        <motion.div
          {...staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   INTERACTIVE DEMO SECTION
   ═══════════════════════════════════════════════════════ */
const demoResponses: Record<string, { text: string; followUp: string[] }> = {
  'Code WiFi ?': {
    text: "Le réseau WiFi est 'MaisonConsciente_5G', le mot de passe est 'Bienvenue2025'. Vous êtes connecté !",
    followUp: ['Comment connecter la TV ?', 'Mot de passe du coffre ?'],
  },
  'Comment allumer la clim ?': {
    text: "La climatisation se trouve dans le couloir. Utilisez la télécommande blanche sur la table basse. Bouton 'ON' puis +/- pour la température. Je recommande 23°C pour un confort optimal.",
    followUp: ['Chauffer aussi possible ?', 'Où sont les radiateurs ?'],
  },
  'Heure de check-out ?': {
    text: "Le check-out est à 11h00. Pensez à déposer les clés dans la boîte aux lettres noire à l'entrée. Un rappel vous sera envoyé à 9h00 le jour du départ.",
    followUp: ['Taxi pour l\'aéroport ?', 'Prolonger le séjour ?'],
  },
  'Bon restaurant nearby ?': {
    text: "Je recommande 'La Petite Maison' à 3 min à pied (★★★★ 4.7/5 sur Google). Cuisine méditerranéenne, terrasse agréable. Réservation conseillée : +33 4 93 XX XX XX.",
    followUp: ['Autre restaurant ?', 'Boulangerie autour ?'],
  },
};

const defaultSuggestions = ['Code WiFi ?', 'Comment allumer la clim ?', 'Heure de check-out ?', 'Bon restaurant nearby ?'];

const defaultResponse = {
  text: "Je ne suis pas sûr de comprendre votre question. Essayez l'une des suggestions ci-dessous, ou reformulez votre demande. Je suis là pour vous aider !",
  followUp: defaultSuggestions,
};

function InteractiveDemo() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'maellis'; text: string }>>([
    { role: 'maellis', text: 'Bonjour ! Je suis Maellis, votre assistant. Comment puis-je vous aider ?' },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || isTyping) return;
    const userMessage = text.trim();
    setInputValue('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);
    setSuggestions([]);

    const matchedKey = Object.keys(demoResponses).find(
      (key) => userMessage.toLowerCase().includes(key.toLowerCase().replace(' ?', '').replace(' ?', ''))
    );
    const response = matchedKey ? demoResponses[matchedKey] : defaultResponse;

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: 'maellis', text: response.text }]);
      setSuggestions(response.followUp);
    }, 1200);
  }, [isTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  return (
    <section className="relative py-20 sm:py-28">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/[0.05] blur-[130px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div {...fadeUp} className="text-center mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Démo interactive</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-slate-50 mb-4 tracking-tight">
            Essayez Maellis{' '}
            <span className="text-gradient-gold">— en direct</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            Posez une question ou cliquez sur une suggestion pour voir Maellis en action.
          </p>
        </motion.div>

        {/* Chat container */}
        <motion.div {...fadeScale} className="flex justify-center">
          <div className="relative w-full max-w-lg">
            {/* Demo badge */}
            <div className="absolute -top-3 -right-3 z-20 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Démo</span>
            </div>

            {/* Tablet frame */}
            <div className="bg-slate-900/60 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/[0.08] shadow-[0_8px_60px_rgba(0,0,0,0.4)] overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/20 flex items-center justify-center border border-amber-500/30">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-100">Maellis</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-slate-500">En ligne</span>
                  </div>
                </div>
              </div>

              {/* Chat messages area */}
              <div className="h-[340px] sm:h-[380px] overflow-y-auto px-4 py-4 space-y-3 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: easeOut }}
                      className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Maellis avatar */}
                      {msg.role === 'maellis' && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/20 flex items-center justify-center border border-amber-500/30 shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 rounded-br-md'
                            : 'bg-white/[0.05] text-slate-200 border border-white/[0.08] rounded-bl-md'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* User avatar */}
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-slate-700/60 flex items-center justify-center border border-slate-600/40 shrink-0">
                          <User className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-end gap-2"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/20 flex items-center justify-center border border-amber-500/30 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400/80 animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-amber-400/80 animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-amber-400/80 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </motion.div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && !isTyping && (
                <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-white/[0.04]">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-amber-500/30 text-amber-300/90 bg-amber-500/[0.06] hover:bg-amber-500/[0.15] hover:border-amber-500/50 transition-all duration-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.01]">
                <div className="flex items-center gap-2 bg-white/[0.04] rounded-xl border border-white/[0.08] px-3 py-2 focus-within:border-amber-500/30 transition-colors">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Posez votre question..."
                    disabled={isTyping}
                    className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSend(inputValue)}
                    disabled={!inputValue.trim() || isTyping}
                    className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-200 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   TESTIMONIALS SECTION
   ═══════════════════════════════════════════════════════ */
function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoScroll = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
  }, []);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoScroll]);

  const goTo = (index: number) => {
    setActiveIndex(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
    startAutoScroll();
  };

  return (
    <section className="relative py-20 sm:py-28" id="testimonials">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
            <Heart className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-violet-400 text-xs font-bold uppercase tracking-wider">Témoignages</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-slate-50 mb-4 tracking-tight">
            Ils nous font{' '}
            <span className="text-gradient-gold">confiance</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            Découvrez comment Maellis transforme le quotidien de propriétaires partout dans le monde.
          </p>
        </motion.div>

        {/* Stats counters */}
        <motion.div
          {...staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-14 sm:mb-20"
        >
          {statsData.map((stat) => (
            <motion.div key={stat.label} variants={staggerItem}>
              <StatCounter value={stat.value} suffix={stat.suffix} label={stat.label} />
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-white/[0.06]"
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-5">
                {Array.from({ length: testimonials[activeIndex].rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-lg sm:text-xl text-slate-200 leading-relaxed mb-8 font-serif italic">
                &ldquo;{testimonials[activeIndex].text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500/30 to-violet-500/20 flex items-center justify-center border border-amber-500/20">
                  <span className="text-sm font-bold text-amber-300">{testimonials[activeIndex].avatar}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{testimonials[activeIndex].name}</p>
                  <p className="text-xs text-slate-500">{testimonials[activeIndex].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => goTo((activeIndex - 1 + testimonials.length) % testimonials.length)}
              className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === activeIndex ? 'w-8 bg-amber-400' : 'w-2 bg-white/[0.15] hover:bg-white/[0.3]'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => goTo((activeIndex + 1) % testimonials.length)}
              className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   PRICING SECTION
   ═══════════════════════════════════════════════════════ */
function PricingSection({ onShowAuth }: { onShowAuth: () => void }) {
  return (
    <section className="relative py-20 sm:py-28 bg-black/20" id="pricing">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeUp} className="text-center mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Tarification</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-slate-50 mb-4 tracking-tight">
            Des formules{' '}
            <span className="text-gradient-gold">flexibles</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Abonnement de base + Modules optionnels. Sans commission sur vos ventes.
          </p>
        </motion.div>

        <motion.div
          {...staggerContainer}
          className="grid md:grid-cols-3 gap-6 sm:gap-8 items-start max-w-5xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={staggerItem}
              className={`relative bg-white/[0.03] backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border transition-all duration-300 ${
                plan.gradient || 'border-white/[0.08] hover:border-white/[0.15]'
              } ${plan.popular ? 'md:-translate-y-4 shadow-2xl shadow-amber-900/10' : ''}`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 px-4 py-1 rounded-full text-xs font-bold">
                  Le plus populaire
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-serif text-slate-100 mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-light text-slate-50">{plan.price}</span>
                  <span className="text-base text-slate-400">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" strokeWidth={2} />
                    <span className="text-sm text-slate-300 leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onShowAuth}
                className={`w-full py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-lg shadow-amber-900/20 hover:shadow-amber-800/30 hover:scale-[1.01] active:scale-[0.99]'
                    : 'border border-white/[0.12] text-slate-300 hover:bg-white/[0.05] hover:border-white/[0.2]'
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* Revenue note */}
        <motion.div {...fadeUp} className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/[0.06] border border-emerald-500/15">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300/80">
              Sans commission sur vos ventes. Vous gardez <strong className="text-emerald-300">100%</strong> de vos revenus de services.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOTER CTA
   ═══════════════════════════════════════════════════════ */
function FooterCTA({ onShowAuth }: { onShowAuth: () => void }) {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-amber-500/[0.06] blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-violet-600/[0.04] blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div {...fadeUp}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-8">
            <Sparkles className="w-7 h-7 text-amber-400" />
          </div>
        </motion.div>

        <motion.h2
          {...fadeUp}
          className="font-serif text-3xl sm:text-4xl md:text-5xl text-slate-50 mb-5 tracking-tight leading-tight"
        >
          Prêt à moderniser{' '}
          <span className="text-gradient-gold">votre patrimoine</span>&nbsp;?
        </motion.h2>

        <motion.p {...fadeUp} className="text-slate-400 text-base sm:text-lg mb-10 max-w-lg mx-auto">
          Rejoignez les propriétaires qui ont déjà transformé leur gestion locative avec Maellis.
        </motion.p>

        <motion.div {...fadeUp}>
          <MagneticButton
            onClick={onShowAuth}
            className="group relative inline-flex items-center gap-3 px-10 sm:px-12 py-4 sm:py-5 text-lg font-bold rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-[0_0_40px_rgba(245,158,11,0.2)] hover:shadow-[0_0_60px_rgba(245,158,11,0.35)] transition-all duration-300"
          >
            Commencer maintenant
            <span className="text-sm font-medium opacity-70">— Essai 14 jours gratuit</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </MagneticButton>
        </motion.div>

        <motion.div {...fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Essai gratuit 14 jours
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Sans carte bancaire
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Annulation en 1 clic
          </span>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════ */
function Footer({ onScrollToTop }: { onScrollToTop: () => void }) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const footerLinks = [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Témoignages', href: '#testimonials' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      {/* Scroll to top floating button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onScrollToTop}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-900/20 hover:bg-amber-400 transition-colors"
            aria-label="Retour à l'accueil"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <footer className="mt-auto py-10 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <span className="font-serif text-gradient-gold text-base">Maellis</span>
                <p className="text-[10px] text-slate-600">anciennement AirHome</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              {footerLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-xs text-slate-500 hover:text-amber-400 transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Tagline */}
            <p className="text-xs text-slate-600 text-center">
              &copy; {new Date().getFullYear()} Maellis. Conçu pour l&apos;hospitalité premium.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
export function AirHomePage({ onShowAuth, onShowAuthType, onShowDemo }: AirHomePageProps) {
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
      <Navbar
        onShowAuth={onShowAuth}
        onShowAuthType={onShowAuthType}
        onScrollToTop={scrollToTop}
        onShowDemo={onShowDemo}
      />

      <main className="flex-1">
        <HeroSection onShowAuth={onShowAuth} />
        <ProblemSolutionSection />
        <FeaturesBentoGrid />
        <InteractiveDemo />
        <TestimonialsSection />
        <PricingSection onShowAuth={onShowAuth} />
        <FooterCTA onShowAuth={onShowAuth} />
      </main>

      <Footer onScrollToTop={scrollToTop} />
    </div>
  );
}
