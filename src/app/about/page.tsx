'use client';

import { motion } from 'framer-motion';
import {
  Diamond,
  Shield,
  Heart,
  Lightbulb,
  Users,
  ArrowRight,
  Globe,
  Leaf,
  Eye,
  Handshake,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════
   ABOUT PAGE — Maison Consciente
   Mission, valeurs, histoire et équipe
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

/* ─── Values ─── */
const values = [
  {
    icon: Shield,
    title: 'S\u00e9curit\u00e9 Absolue',
    description: "Chaque donn\u00e9e est chiffr\u00e9e. Chaque alerte est v\u00e9rifi\u00e9e. Votre vie priv\u00e9e est notre priorit\u00e9 num\u00e9ro un.",
    color: '#d4a853',
  },
  {
    icon: Heart,
    title: 'Bienveillance',
    description: "Une voix douce, des rappels attentionn\u00e9s. Maellis est con\u00e7u pour apaiser, pas pour stresser.",
    color: '#c77d5a',
  },
  {
    icon: Lightbulb,
    title: 'Innovation Utile',
    description: "Pas de gadgets inutiles. Seulement des fonctionnalit\u00e9s qui r\u00e9solvent de vrais probl\u00e8mes du quotidien.",
    color: '#f0d78c',
  },
];

const principles = [
  {
    icon: Eye,
    title: 'Transparence',
    description: 'Nos algorithmes sont explicables. Vous savez toujours pourquoi Maellis fait telle suggestion.',
  },
  {
    icon: Globe,
    title: 'Localisation Europ\u00e9enne',
    description: 'Toutes vos donn\u00e9es sont h\u00e9berg\u00e9es en France. Conformit\u00e9 RGPD totale, d\u00e8s le premier jour.',
  },
  {
    icon: Leaf,
    title: 'Sobri\u00e9t\u00e9 Num\u00e9rique',
    description: 'Un code l\u00e9ger, des serveurs optimis\u00e9s. Nous minimisons notre empreinte carbone num\u00e9rique.',
  },
  {
    icon: Handshake,
    title: 'Accessibilit\u00e9',
    description: "Un design pens\u00e9 pour tous les \u00e2ges, des enfants aux personnes \u00e2g\u00e9es. L'inclusion est dans notre ADN.",
  },
];

/* ─── Stats ─── */
const stats = [
  { value: '500+', label: 'Foyers accompagn\u00e9s' },
  { value: '99.9%', label: 'Disponibilit\u00e9 service' },
  { value: '< 200ms', label: 'Temps de r\u00e9ponse IA' },
  { value: '24/7', label: 'Support actif' },
];

/* ─── Timeline ─── */
const timeline = [
  {
    year: '2024',
    title: 'L\u2019id\u00e9e na\u00eet',
    description: "Un constat simple : la technologie peut veiller sur notre foyer quand nous ne le pouvons pas.",
  },
  {
    year: '2025',
    title: 'Le premier prototype',
    description: "Maellis voit le jour : un assistant vocal qui comprend le contexte de chaque pi\u00e8ce.",
  },
  {
    year: 'Aujourd\u2019hui',
    title: 'L\u2019expansion',
    description: "Des centaines de foyers nous font confiance. L\u2019IA s\u2019am\u00e9liore chaque jour gr\u00e2ce \u00e0 vous.",
  },
];

export default function AboutPage() {
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
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Accueil
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ═══ HERO ═══ */}
      <section className="relative pt-28 sm:pt-36 pb-16 md:pb-20 px-4 text-center overflow-hidden">
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px] opacity-12 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #d4a853 0%, transparent 70%)' }}
        />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif mb-6 tracking-tight leading-tight"
          >
            La technologie au service de{' '}
            <span className="text-gradient-gold">l\u2019humain</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="text-lg md:text-xl text-[#64748b] max-w-2xl mx-auto leading-relaxed"
          >
            Maellis n&rsquo;est pas juste une tablette. C&rsquo;est le gardien silencieux de votre foyer,
            con\u00e7u pour veiller sur ceux que vous aimez pendant que vous vivez l&rsquo;instant pr\u00e9sent.
          </motion.p>
        </div>
      </section>

      {/* ═══ VALUES ═══ */}
      <section className="py-16 md:py-20 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <motion.h2 {...fadeUp} className="font-serif text-3xl md:text-4xl text-center mb-4 tracking-tight">
            Nos <span className="text-gradient-gold">valeurs</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-center text-[#64748b] text-base max-w-xl mx-auto mb-14">
            Les principes fondamentaux qui guident chacune de nos d\u00e9cisions.
          </motion.p>

          <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 text-center hover:bg-white/[0.05] hover:border-[#d4a853]/20 transition-all duration-300"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: `${v.color}15` }}
                >
                  <v.icon className="w-7 h-7" style={{ color: v.color }} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#f1f5f9] mb-3">{v.title}</h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed">{v.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ STORY ═══ */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...fadeUp} className="font-serif text-3xl md:text-4xl text-center mb-14 tracking-tight">
            Notre <span className="text-gradient-gold">histoire</span>
          </motion.h2>

          <div className="space-y-12">
            {timeline.map((item, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                className="flex gap-6 md:gap-8"
              >
                {/* Year badge */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-gradient-gold flex items-center justify-center text-[#020617] font-serif font-bold text-lg">
                    {item.year}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 bg-white/[0.08] mt-3" />
                  )}
                </div>
                {/* Content */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 flex-1 hover:border-[#d4a853]/15 transition-all duration-300">
                  <h3 className="text-lg font-serif font-semibold text-[#f1f5f9] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRINCIPLES ═══ */}
      <section className="py-16 md:py-20 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <motion.h2 {...fadeUp} className="font-serif text-3xl md:text-4xl text-center mb-4 tracking-tight">
            Ce qui nous <span className="text-gradient-gold">distingue</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-center text-[#64748b] text-base max-w-xl mx-auto mb-14">
            Des engagements concrets pour une technologie responsable.
          </motion.p>

          <motion.div {...staggerContainer} className="grid sm:grid-cols-2 gap-5">
            {principles.map((p, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-[#d4a853]/20 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-[#d4a853]/10 group-hover:bg-[#d4a853]/15 transition-colors shrink-0">
                    <p.icon className="w-5 h-5 text-[#d4a853]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#f1f5f9] mb-2">{p.title}</h3>
                    <p className="text-sm text-[#94a3b8] leading-relaxed">{p.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 text-center hover:border-[#d4a853]/15 transition-all duration-300"
              >
                <p className="text-3xl md:text-4xl font-serif font-bold text-gradient-gold mb-1">{s.value}</p>
                <p className="text-xs text-[#64748b] uppercase tracking-wider">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ TEAM ═══ */}
      <section className="py-16 md:py-20 px-4 bg-black/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 {...fadeUp} className="font-serif text-3xl md:text-4xl mb-4 tracking-tight">
            Notre <span className="text-gradient-gold">\u00e9quipe</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-[#64748b] text-base max-w-lg mx-auto mb-12">
            Des passionn\u00e9s d&rsquo;IA, de design et de bien-\u00eatre familial, unis par une vision commune.
          </motion.p>

          <motion.div {...staggerContainer} className="flex flex-wrap justify-center gap-8">
            {['Fondation & Vision', 'Intelligence Artificielle', 'Design & Exp\u00e9rience', 'S\u00e9curit\u00e9 & Infrastructure'].map((role, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 w-52 text-center hover:border-[#d4a853]/15 transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#d4a853]/20 to-[#c77d5a]/20 border border-[#d4a853]/20 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-[#d4a853]/60" strokeWidth={1.5} />
                </div>
                <p className="font-serif font-semibold text-[#f1f5f9] text-sm mb-1">L&rsquo;\u00c9quipe Maellis</p>
                <p className="text-xs text-[#64748b]">{role}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-[#020617] via-[#0a0a1a] to-black">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #d4a853 0%, transparent 70%)' }}
        />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp} className="bg-white/[0.03] backdrop-blur-xl border border-[#d4a853]/15 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-serif text-[#f0d78c] mb-4 tracking-tight">
              Rejoignez l&rsquo;aventure
            </h2>
            <p className="text-[#64748b] mb-8">
              D\u00e9couvrez comment Maellis peut transformer votre quotidien.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/connexion"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-gold text-[#020617] rounded-xl font-semibold shadow-[0_0_24px_rgba(212,168,83,0.2)] hover:shadow-[0_0_40px_rgba(212,168,83,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                Commencer gratuitement <ArrowRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.06] rounded-xl font-medium transition-all duration-300"
              >
                Nous contacter
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
              <Link href="/pricing" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                Tarifs
              </Link>
              <Link href="/about" className="text-xs text-[#d4a853]/80 hover:text-[#d4a853] transition-colors">
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
