'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Shield,
  Heart,
  Lightbulb,
  Eye,
  Globe,
  Leaf,
  Handshake,
  Users,
  ArrowRight,
  Sparkles,
  Clock,
  Zap,
  Headphones,
} from 'lucide-react';
import { SiteNavbar } from '@/components/layout/SiteNavbar';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/* ═══════════════════════════════════════════════════════
   ABOUT PAGE — Maellis
   Mission, valeurs, histoire et équipe
   Design: Light SaaS with amber/gold accents
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
    transition: { staggerChildren: 0.1 },
  },
  viewport: { once: true, amount: 0.2 },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

/* ─── Data ─── */
const values = [
  {
    icon: Shield,
    title: 'Sécurité Absolue',
    description:
      'Chaque donnée est chiffrée. Chaque alerte est vérifiée. Votre vie privée est notre priorité numéro un.',
  },
  {
    icon: Heart,
    title: 'Bienveillance',
    description:
      'Une voix douce, des rappels attentionnés. Maellis est conçu pour apaiser, pas pour stresser.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation Utile',
    description:
      'Pas de gadgets inutiles. Seulement des fonctionnalités qui résolvent de vrais problèmes du quotidien.',
  },
];

const principles = [
  {
    icon: Eye,
    title: 'Transparence',
    description:
      'Nos algorithmes sont explicables. Vous savez toujours pourquoi Maellis fait telle suggestion.',
  },
  {
    icon: Globe,
    title: 'Localisation Européenne',
    description:
      'Toutes vos données sont hébergées en France. Conformité RGPD totale, dès le premier jour.',
  },
  {
    icon: Leaf,
    title: 'Sobriété Numérique',
    description:
      'Un code léger, des serveurs optimisés. Nous minimisons notre empreinte carbone numérique.',
  },
  {
    icon: Handshake,
    title: 'Accessibilité',
    description:
      "Un design pensé pour tous les âges, des enfants aux personnes âgées. L'inclusion est dans notre ADN.",
  },
];

const stats = [
  { value: '500+', label: 'Foyers accompagnés', icon: Users },
  { value: '99.9%', label: 'Disponibilité service', icon: Zap },
  { value: '< 200ms', label: 'Temps de réponse IA', icon: Clock },
  { value: '24/7', label: 'Support actif', icon: Headphones },
];

const timeline = [
  {
    year: '2024',
    title: "L'idée naît",
    description:
      "Un constat simple : la technologie peut veiller sur notre foyer quand nous ne le pouvons pas.",
  },
  {
    year: '2025',
    title: 'Le premier prototype',
    description:
      'Maellis voit le jour : un assistant vocal qui comprend le contexte de chaque pièce.',
  },
  {
    year: "Aujourd'hui",
    title: "L'expansion",
    description:
      "Des centaines de foyers nous font confiance. L'IA s'améliore chaque jour grâce à vous.",
  },
];

const team = [
  { role: 'Fondation & Vision', description: 'Direction stratégique et vision produit' },
  { role: 'Intelligence Artificielle', description: 'Recherche, modélisation et NLP avancé' },
  { role: 'Design & Expérience', description: 'UX/UI, accessibilité et identité visuelle' },
  { role: 'Sécurité & Infrastructure', description: 'Cloud, chiffrement et conformité RGPD' },
];

/* ─── Page Component ─── */
export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteNavbar activePage="/about" />

      <main className="flex-1">
        {/* ═══ HERO ═══ */}
        <section className="relative pt-24 sm:pt-32 pb-16 md:pb-24 px-4 text-center overflow-hidden">
          {/* Subtle decorative orb */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[120px] pointer-events-none bg-amber-500/10 dark:bg-amber-400/5" />

          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div {...fadeUp}>
              <Badge
                variant="secondary"
                className="mb-6 px-4 py-1.5 text-sm font-medium bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Notre histoire
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: easeOut }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight leading-tight"
            >
              La technologie au service de{' '}
              <span className="text-amber-500">l&apos;humain</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: easeOut }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Maellis n&apos;est pas juste une tablette. C&apos;est le gardien silencieux de votre
              foyer, conçu pour veiller sur ceux que vous aimez pendant que vous vivez
              l&apos;instant présent.
            </motion.p>
          </div>
        </section>

        {/* ═══ VALUES ═══ */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Nos <span className="text-amber-500">valeurs</span>
              </h2>
              <p className="text-muted-foreground text-base max-w-xl mx-auto">
                Les principes fondamentaux qui guident chacune de nos décisions.
              </p>
            </motion.div>

            <motion.div {...stagger} className="grid md:grid-cols-3 gap-6">
              {values.map((v, i) => (
                <motion.div key={i} variants={staggerItem}>
                  <Card className="h-full border-border hover:border-amber-500/30 hover:shadow-md hover:shadow-amber-500/5 transition-all duration-300 group">
                    <CardContent className="pt-6 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-5 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
                        <v.icon className="w-7 h-7 text-amber-500" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{v.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {v.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══ STORY / TIMELINE ═══ */}
        <section className="py-16 md:py-24 px-4 bg-muted/40">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Notre <span className="text-amber-500">histoire</span>
              </h2>
              <p className="text-muted-foreground text-base max-w-lg mx-auto">
                De l&apos;idée à la réalité, chaque étape compte.
              </p>
            </motion.div>

            <div className="space-y-8 md:space-y-10">
              {timeline.map((item, i) => (
                <motion.div
                  key={i}
                  {...fadeUp}
                  className="flex gap-5 md:gap-8 items-start"
                >
                  {/* Year badge */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {item.year}
                    </div>
                    {i < timeline.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-3 min-h-[40px]" />
                    )}
                  </div>
                  {/* Content card */}
                  <Card className="flex-1 border-border hover:border-amber-500/20 hover:shadow-sm transition-all duration-300">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PRINCIPLES ═══ */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Ce qui nous <span className="text-amber-500">distingue</span>
              </h2>
              <p className="text-muted-foreground text-base max-w-xl mx-auto">
                Des engagements concrets pour une technologie responsable.
              </p>
            </motion.div>

            <motion.div {...stagger} className="grid sm:grid-cols-2 gap-5">
              {principles.map((p, i) => (
                <motion.div key={i} variants={staggerItem}>
                  <Card className="h-full border-border hover:border-amber-500/30 hover:shadow-md hover:shadow-amber-500/5 transition-all duration-300 group">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors shrink-0">
                          <p.icon
                            className="w-5 h-5 text-amber-500"
                            strokeWidth={1.5}
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="py-16 md:py-24 px-4 bg-muted/40">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Maellis en <span className="text-amber-500">chiffres</span>
              </h2>
              <p className="text-muted-foreground text-base max-w-lg mx-auto">
                Des résultats concrets qui parlent d&apos;eux-mêmes.
              </p>
            </motion.div>

            <motion.div {...stagger} className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {stats.map((s, i) => (
                <motion.div key={i} variants={staggerItem}>
                  <Card className="border-border hover:border-amber-500/20 transition-all duration-300">
                    <CardContent className="pt-6 text-center">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                        <s.icon className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
                      </div>
                      <p className="text-3xl md:text-4xl font-bold text-amber-500 mb-1">
                        {s.value}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {s.label}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══ TEAM ═══ */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Notre <span className="text-amber-500">équipe</span>
              </h2>
              <p className="text-muted-foreground text-base max-w-lg mx-auto">
                Des passionnés d&apos;IA, de design et de bien-être familial, unis par une vision
                commune.
              </p>
            </motion.div>

            <motion.div {...stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {team.map((member, i) => (
                <motion.div key={i} variants={staggerItem}>
                  <Card className="h-full border-border hover:border-amber-500/30 hover:shadow-md hover:shadow-amber-500/5 transition-all duration-300 group text-center">
                    <CardContent className="pt-6">
                      <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/30 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 border border-amber-200/50 dark:border-amber-800/30 mx-auto mb-4 flex items-center justify-center transition-colors">
                        <Users
                          className="w-7 h-7 text-amber-500/70"
                          strokeWidth={1.5}
                        />
                      </div>
                      <p className="font-bold text-sm mb-1">
                        L&apos;Équipe Maellis
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1.5">
                        {member.role}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeUp}>
              <Card className="border-amber-500/20 bg-gradient-to-br from-amber-50/60 to-background dark:from-amber-900/20 dark:to-background shadow-lg shadow-amber-500/5">
                <CardContent className="pt-8 pb-8 md:pt-10 md:pb-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center mx-auto mb-5">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                    Rejoignez l&apos;aventure
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Découvrez comment Maellis peut transformer votre quotidien. Commencez
                    gratuitement, sans engagement.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/connexion">
                      <Button
                        size="lg"
                        className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300"
                      >
                        Commencer gratuitement
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto border-border hover:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-300"
                      >
                        Nous contacter
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
