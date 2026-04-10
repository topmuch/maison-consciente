'use client';

import { motion } from 'framer-motion';
import {
  Diamond,
  ChevronRight,
  QrCode,
  Brain,
  Shield,
  Sparkles,
  Home,
  Hotel,
  Sun,
  Moon,
  Music,
  MessageSquare,
  Star,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Landing Page (Public Homepage)
   ═══════════════════════════════════════════════════════ */

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

const features = [
  {
    icon: QrCode,
    title: 'Scannez',
    desc: 'Un QR code dans chaque pièce pour un accès instantané à votre assistant maison.',
    color: 'from-amber-500 to-amber-300',
  },
  {
    icon: Brain,
    title: 'Suggère',
    desc: "L'IA analyse le contexte — pièce, heure, météo — pour vous proposer ce dont vous avez besoin.",
    color: 'from-violet-500 to-purple-300',
  },
  {
    icon: Shield,
    title: 'Protège',
    desc: "Vos données restent chez vous. Chiffrement RGPD, hébergement local, aucune revente.",
    color: 'from-emerald-500 to-teal-300',
  },
];

const experiences = [
  { icon: Sun, title: 'Météo Contextuelle', desc: 'En entrant, votre maison vous accueille avec la météo et des suggestions adaptées.' },
  { icon: Sparkles, title: 'Recettes Malines', desc: "Des idées de repas basées sur vos habitudes, les saisons et votre frigo." },
  { icon: Music, title: 'Ambiance Sonore', desc: 'Playlist et sons d\'environnement automatiques selon la pièce et l\'heure.' },
  { icon: Moon, title: 'Mode Nuit Intelligent', desc: 'Luminosité, sons et suggestions s\'adaptent à la fin de journée.' },
  { icon: MessageSquare, title: 'Messages Famille', desc: 'Laissez des notes aux membres du foyer directement depuis chaque zone.' },
  { icon: Star, title: 'Bien-être Quotidien', desc: 'Suivi d\'humeur, rituels du matin et suggestions de bien-être personnalisées.' },
];

const testimonials = [
  { name: 'Sophie M.', quote: 'Ma maison me suggère la playlist parfaite dès que j\'entre dans le salon.', avatar: 'S', role: 'Utilisatrice Particulier' },
  { name: 'Thomas L.', quote: 'Les recettes adaptées à ce qu\'il me reste dans le frigo, c\'est magique.', avatar: 'T', role: 'Chef de famille' },
  { name: 'Marie D.', quote: 'L\'ambiance sonore change automatiquement quand je cuisine. Un vrai confort.', avatar: 'M', role: 'Utilisatrice Particulier' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-animated-gradient noise-overlay text-[#f1f5f9] overflow-x-hidden">
      {/* ═══ NAVBAR ═══ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/70 backdrop-blur-xl border-b border-white/[0.06]"
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
              Démo
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

      {/* ═══ HERO ═══ */}
      <section className="relative pt-28 sm:pt-32 pb-16 px-4">
        {/* Ambient glow */}
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px] opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #d4a853 0%, transparent 70%)' }}
        />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4a853]/10 border border-[#d4a853]/20 text-[#f0d78c] text-xs font-medium tracking-wide uppercase mb-6"
          >
            <Sparkles className="w-3 h-3" />
            L&rsquo;Habitation Intelligente
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="text-4xl sm:text-5xl md:text-7xl font-serif mb-6 tracking-tight leading-tight"
          >
            Votre maison vous{' '}
            <span className="text-gradient-gold">comprend</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="text-base sm:text-lg md:text-xl text-[#64748b] mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Transformez votre demeure en espace intelligent et sensoriel.
            QR codes, suggestions contextuelles, bien-être au quotidien.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/connexion"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-gold text-[#020617] rounded-xl font-semibold shadow-[0_0_24px_rgba(212,168,83,0.2)] hover:shadow-[0_0_40px_rgba(212,168,83,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              Commencer gratuitement <ChevronRight size={18} />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.06] rounded-xl font-medium transition-all duration-300"
            >
              Voir la démo
            </Link>
          </motion.div>

          {/* Household types */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-12 pt-8 border-t border-white/[0.06]"
          >
            <div className="flex items-center gap-3 text-[#64748b]">
              <div className="p-2 rounded-lg bg-white/[0.04]">
                <Home className="w-5 h-5 text-[#d4a853]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[#cbd5e1]">Particulier</p>
                <p className="text-xs text-[#475569]">Maison & Appartement</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/[0.08]" />
            <div className="flex items-center gap-3 text-[#64748b]">
              <div className="p-2 rounded-lg bg-white/[0.04]">
                <Hotel className="w-5 h-5 text-[#c77d5a]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[#cbd5e1]">Hospitalité</p>
                <p className="text-xs text-[#475569]">Gîtes & Chambres d&rsquo;hôtes</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-16 md:py-20 px-4 relative">
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#d4a853]/[0.03] to-transparent"
        />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.h2 {...fadeUp} className="font-serif text-3xl md:text-4xl text-center mb-4 tracking-tight">
            Comment ça <span className="text-gradient-gold">marche</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-center text-[#64748b] text-base max-w-xl mx-auto mb-14">
            Trois étapes pour une maison qui vous ressemble.
          </motion.p>

          <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 hover:bg-white/[0.05] hover:border-[#d4a853]/20 transition-all duration-300 group"
              >
                {/* Step number */}
                <div className="absolute top-6 right-6 text-6xl font-serif text-white/[0.04] font-bold leading-none">
                  {i + 1}
                </div>
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${f.color} mb-5`}>
                  <f.icon className="w-6 h-6 text-[#020617]" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-serif font-semibold text-[#f1f5f9] mb-3">{f.title}</h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ EXPERIENCES GRID ═══ */}
      <section className="py-16 md:py-20 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <motion.h2 {...fadeUp} className="font-serif text-3xl md:text-4xl text-center text-[#f1f5f9] mb-4 tracking-tight">
            Ce que vous <span className="text-gradient-gold">ressentez</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-center text-[#64748b] text-base max-w-xl mx-auto mb-12">
            Des moments concrets, vécus chaque jour dans votre foyer.
          </motion.p>

          <motion.div {...staggerContainer} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {experiences.map((item, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-[#d4a853]/20 transition-all duration-300 group"
              >
                <div className="inline-flex p-2.5 rounded-lg bg-[#d4a853]/10 mb-4 group-hover:bg-[#d4a853]/15 transition-colors">
                  <item.icon className="w-5 h-5 text-[#d4a853]" />
                </div>
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
            Ils l&rsquo;ont <span className="text-gradient-gold">adopté</span>
          </motion.h2>

          <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-[#d4a853]/15 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a853] to-[#a17c2e] flex items-center justify-center text-sm font-bold text-[#020617]">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#f1f5f9]">{t.name}</p>
                    <p className="text-xs text-[#64748b]">{t.role}</p>
                  </div>
                </div>
                <p className="text-sm text-[#94a3b8] leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex gap-0.5 mt-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="w-3.5 h-3.5 text-[#d4a853]" fill="currentColor" viewBox="0 0 20 20">
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
          style={{ background: 'radial-gradient(circle, #d4a853 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div
            {...fadeUp}
            className="bg-white/[0.03] backdrop-blur-xl border border-[#d4a853]/15 rounded-3xl p-8 md:p-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif text-[#f0d78c] mb-4 tracking-tight">
              Prêt à transformer votre maison ?
            </h2>
            <p className="text-[#64748b] mb-8">
              Rejoignez les premiers foyers conscients dès aujourd&rsquo;hui.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/connexion"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-gold text-[#020617] rounded-xl font-semibold shadow-[0_0_24px_rgba(212,168,83,0.2)] hover:shadow-[0_0_40px_rgba(212,168,83,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                Essai gratuit 14 jours <ArrowRight size={18} />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/[0.06] rounded-xl font-medium transition-all duration-300"
              >
                Voir la démo interactive
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
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xs text-[#f0d78c]/80 hover:text-[#f0d78c] transition-colors">
                Accueil
              </Link>
              <Link href="/demo" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                Démo
              </Link>
              <Link href="/connexion" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                Connexion
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
