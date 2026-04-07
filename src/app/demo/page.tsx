'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Smartphone,
  Home,
  ShoppingCart,
  Sun,
  Moon,
  MessageSquare,
  Music,
  ChevronRight,
  Play,
  Diamond,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════
   DEMO INTERACTIVE — Maison Consciente
   "Wow Effect" interactive demo page with phone simulation
   ═══════════════════════════════════════════════════════ */

const features = [
  {
    icon: QrCode,
    title: 'Scannez',
    desc: 'Un QR dans chaque pièce',
    color: 'from-amber-600 to-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.15)',
  },
  {
    icon: Smartphone,
    title: 'Interagissez',
    desc: 'Suggestions intelligentes',
    color: 'from-violet-500 to-purple-400',
    glowColor: 'rgba(139, 92, 246, 0.15)',
  },
  {
    icon: Home,
    title: 'Ressentez',
    desc: 'Votre maison vous comprend',
    color: 'from-emerald-500 to-teal-400',
    glowColor: 'rgba(16, 185, 129, 0.15)',
  },
];

const mockInteractions = [
  {
    zone: 'Entrée',
    time: '08:30',
    action: 'Bonjour ! Météo: 12°C, Ensoleillé',
    icon: Sun,
  },
  {
    zone: 'Cuisine',
    time: '08:35',
    action: 'Petit-déj: Oeufs brouillés aux herbes',
    icon: ShoppingCart,
  },
  {
    zone: 'Salon',
    time: '19:15',
    action: 'Soirée cinéma ? Playlist prête',
    icon: Music,
  },
  {
    zone: 'Chambre',
    time: '22:00',
    action: 'Mode nuit activé. Douce soirée',
    icon: Moon,
  },
];

const testimonialData = [
  { name: 'Sophie M.', quote: 'Ma maison me suggère la playlist parfaite dès que j\'entre dans le salon.', avatar: 'S' },
  { name: 'Thomas L.', quote: 'Les recettes adaptées à ce qu\'il me reste dans le frigo, c\'est magique.', avatar: 'T' },
  { name: 'Marie D.', quote: 'L\'ambiance sonore change automatiquement quand je cuisine. Un vrai confort.', avatar: 'M' },
];

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
    transition: { staggerChildren: 0.12 },
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

/* ─── Main Component ─── */
export default function DemoPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeInteraction, setActiveInteraction] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-advance through features
  useEffect(() => {
    if (!isPlaying) return;
    const featureTimer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % features.length);
    }, 3500);
    return () => clearInterval(featureTimer);
  }, [isPlaying]);

  // Auto-advance through mock interactions
  useEffect(() => {
    if (!isPlaying) return;
    const interactionTimer = setInterval(() => {
      setActiveInteraction((prev) => (prev + 1) % mockInteractions.length);
    }, 2500);
    return () => clearInterval(interactionTimer);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const currentFeature = features[activeStep];
  const currentMock = mockInteractions[activeInteraction];

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-[#f1f5f9] overflow-x-hidden">
      {/* ═══ NAVBAR ═══ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-gold glow-gold">
                <Diamond className="w-4 h-4 text-[#020617]" strokeWidth={2} />
              </div>
              <span className="font-serif text-gradient-gold text-lg tracking-wide">
                Maison Consciente
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Accueil
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors duration-200"
            >
              Contact
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ═══ HERO ═══ */}
      <section className="relative pt-28 pb-16 px-4">
        {/* Amber glow orb */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-xs font-medium tracking-wide uppercase mb-6"
          >
            <Play className="w-3 h-3" />
            Démo Interactive
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="text-4xl sm:text-5xl md:text-7xl font-serif mb-6 tracking-tight"
          >
            Découvrez l&apos;expérience{' '}
            <span className="text-gradient-gold">Maison Consciente</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="text-lg md:text-xl text-[#64748b] mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Une démonstration interactive de votre futur quotidien connecté, intelligent et serein.
          </motion.p>

          {/* Play/Pause control */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            onClick={togglePlay}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.06] transition-all duration-300"
          >
            {isPlaying ? (
              <>
                <div className="flex gap-1">
                  <div className="w-1.5 h-4 bg-current rounded-sm" />
                  <div className="w-1.5 h-4 bg-current rounded-sm" />
                </div>
                Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Lecture
              </>
            )}
          </motion.button>
        </div>
      </section>

      {/* ═══ INTERACTIVE DEMO ═══ */}
      <section className="py-16 md:py-20 px-4 relative">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 70% 50%, ${currentFeature.glowColor} 0%, transparent 60%)`,
            transition: 'background 0.8s ease',
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Left: Feature Steps */}
            <div className="space-y-5">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: activeStep === i ? 1 : 0.35,
                    x: activeStep === i ? 0 : -10,
                    scale: activeStep === i ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                  className={`p-5 md:p-6 rounded-2xl border transition-all cursor-pointer ${
                    activeStep === i
                      ? `bg-gradient-to-r ${f.color} border-transparent shadow-2xl`
                      : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]'
                  }`}
                  onClick={() => {
                    setActiveStep(i);
                    setIsPlaying(false);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl transition-colors ${
                        activeStep === i ? 'bg-white/20' : 'bg-[#f59e0b]/10'
                      }`}
                    >
                      <f.icon
                        size={26}
                        className={activeStep === i ? 'text-white' : 'text-[#f59e0b]'}
                        strokeWidth={1.5}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-lg md:text-xl font-serif ${
                          activeStep === i ? 'text-white font-semibold' : 'text-[#f1f5f9]'
                        }`}
                      >
                        {f.title}
                      </h3>
                      <p className={activeStep === i ? 'text-white/80 text-sm' : 'text-[#64748b] text-sm'}>
                        {f.desc}
                      </p>
                    </div>
                    {/* Active indicator */}
                    {activeStep === i && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto flex items-center gap-1 text-white/60 text-xs"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                        En cours
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 pt-2">
                {features.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveStep(i);
                      setIsPlaying(false);
                    }}
                    className={`rounded-full transition-all duration-300 ${
                      activeStep === i
                        ? 'w-8 h-2 bg-[#f59e0b]'
                        : 'w-2 h-2 bg-white/20 hover:bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right: Phone Simulation */}
            <div className="relative flex justify-center">
              {/* Outer glow */}
              <div
                className="absolute inset-0 rounded-[3rem] blur-3xl opacity-40 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${currentFeature.glowColor}, transparent 60%)`,
                  transition: 'background 0.8s ease',
                }}
              />

              {/* Phone frame */}
              <div className="relative w-full max-w-[320px] bg-[#0c1222] border-[6px] border-[#1e293b] rounded-[2.5rem] p-5 shadow-2xl">
                {/* Phone notch */}
                <div className="flex items-center justify-center mb-5">
                  <div className="h-6 w-28 bg-[#1e293b] rounded-full" />
                </div>

                {/* Status bar */}
                <div className="flex items-center justify-between text-[10px] text-[#64748b] mb-4 px-1">
                  <span>09:41</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-[2px]">
                      {[1, 2, 3, 4].map((h) => (
                        <div
                          key={h}
                          className="w-[3px] rounded-full bg-[#f59e0b]"
                          style={{ height: `${4 + h * 2}px` }}
                        />
                      ))}
                    </div>
                    <div className="w-5 h-2.5 border border-[#64748b] rounded-sm relative">
                      <div className="absolute inset-[1px] right-[3px] bg-[#10b981] rounded-sm" />
                    </div>
                  </div>
                </div>

                {/* App header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-gold flex items-center justify-center">
                      <Diamond className="w-3 h-3 text-[#020617]" />
                    </div>
                    <span className="text-xs font-serif text-gradient-gold">Maison Consciente</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center">
                    <MessageSquare className="w-3 h-3 text-[#64748b]" />
                  </div>
                </div>

                {/* Interaction feed */}
                <div className="space-y-3 min-h-[200px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeInteraction}
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -15, scale: 0.98 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                      className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="p-2 rounded-lg bg-[#f59e0b]/10">
                          <currentMock.icon className="text-[#f59e0b]" size={16} />
                        </div>
                        <div>
                          <span className="text-xs font-medium text-[#f1f5f9]">{currentMock.zone}</span>
                          <span className="text-[10px] text-[#64748b] ml-2">{currentMock.time}</span>
                        </div>
                      </div>
                      <p className="text-sm text-[#cbd5e1] leading-relaxed pl-[2.25rem]">
                        {currentMock.action}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Previous interactions (faded) */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2">
                      {(() => {
                        const prev = mockInteractions[(activeInteraction - 1 + mockInteractions.length) % mockInteractions.length];
                        const PrevIcon = prev.icon;
                        return (
                          <>
                            <PrevIcon className="text-[#64748b]" size={14} />
                            <span className="text-[11px] text-[#64748b]">{prev.zone} &bull; {prev.time}</span>
                            <span className="text-[11px] text-[#475569] truncate ml-auto">{prev.action}</span>
                          </>
                        );
                      })()}
                    </div>
                  </motion.div>
                </div>

                {/* Bottom bar */}
                <div className="mt-5 flex items-center justify-center gap-6 text-[10px] text-[#475569]">
                  <span className="flex flex-col items-center gap-0.5">
                    <QrCode className="w-3.5 h-3.5 text-[#f59e0b]" />
                    Scanner
                  </span>
                  <span className="flex flex-col items-center gap-0.5">
                    <Home className="w-3.5 h-3.5" />
                    Accueil
                  </span>
                  <span className="flex flex-col items-center gap-0.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Messages
                  </span>
                  <span className="flex flex-col items-center gap-0.5">
                    <Music className="w-3.5 h-3.5" />
                    Audio
                  </span>
                </div>

                {/* Home indicator */}
                <div className="mt-4 flex justify-center">
                  <div className="w-24 h-1 bg-[#1e293b] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ KEY FEATURES GRID ═══ */}
      <section className="py-16 md:py-20 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <motion.h2 {...fadeUp} className="font-serif text-3xl md:text-4xl text-center text-[#f1f5f9] mb-4 tracking-tight">
            Ce que vous <span className="text-gradient-gold">ressentez</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-center text-[#64748b] text-base max-w-xl mx-auto mb-12">
            Des moments concrets, vécus chaque jour dans votre foyer.
          </motion.p>

          <motion.div {...staggerContainer} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { emoji: '\u2600\uFE0F', title: 'Météo Contextuelle', desc: 'En entrant, votre maison vous accueille avec la météo et des suggestions adaptées.' },
              { emoji: '\uD83C\uDF73', title: 'Recettes Malines', desc: 'Des idées de repas basées sur vos habitudes, les saisons et votre frigo.' },
              { emoji: '\uD83C\uDFB5', title: 'Ambiance Sonore', desc: 'Playlist et sons d\'environnement automatiques selon la pièce et l\'heure.' },
              { emoji: '\uD83C\uDF19', title: 'Mode Nuit Intelligent', desc: 'Luminosité, sons et suggestions s\'adaptent à la fin de journée.' },
              { emoji: '\uD83D\uDCDD', title: 'Messages Famille', desc: 'Laissez des notes aux membres du foyer directement depuis chaque zone.' },
              { emoji: '\uD83D\uDCCA', title: 'Bien-être Quotidien', desc: 'Suivi d\'humeur, rituels du matin et suggestions de bien-être personnalisées.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-[#f59e0b]/20 transition-all duration-300 group"
              >
                <div className="text-3xl mb-4">{item.emoji}</div>
                <h3 className="text-lg font-semibold text-[#f1f5f9] mb-2">{item.title}</h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...fadeUp} className="font-serif text-3xl md:text-4xl text-center text-[#f1f5f9] mb-12 tracking-tight">
            Ils l&apos;ont <span className="text-gradient-gold">adopté</span>
          </motion.h2>

          <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-5">
            {testimonialData.map((t, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-[#f59e0b]/15 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center text-sm font-bold text-[#020617]">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#f1f5f9]">{t.name}</p>
                    <p className="text-xs text-[#64748b]">Utilisateur Confort</p>
                  </div>
                </div>
                <p className="text-sm text-[#94a3b8] leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex gap-0.5 mt-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="w-3.5 h-3.5 text-[#f59e0b]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-[#020617] via-[#0a0a1a] to-black">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div
            {...fadeUp}
            className="bg-white/[0.03] backdrop-blur-xl border border-[#f59e0b]/15 rounded-3xl p-8 md:p-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif text-[#f0d78c] mb-4 tracking-tight">
              Prêt à transformer votre maison ?
            </h2>
            <p className="text-[#64748b] mb-8">
              Rejoignez les premiers foyers conscients dès aujourd&apos;hui.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/?auth=register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-[#020617] rounded-xl font-semibold shadow-[0_0_24px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                Essai gratuit 14 jours <ChevronRight size={18} />
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.06] rounded-xl font-medium transition-all duration-300"
              >
                Voir les tarifs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="mt-auto py-8 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Diamond className="w-4 h-4 text-[#f59e0b]/60" strokeWidth={1.5} />
              <span className="text-xs text-[#64748b]">
                &copy; 2025 Maison Consciente
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                Accueil
              </Link>
              <Link href="/demo" className="text-xs text-[#f59e0b]/80 hover:text-[#f59e0b] transition-colors">
                Démo
              </Link>
              <Link href="/contact" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-xs text-[#475569]">
              Conçu pour le confort et la privacy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
