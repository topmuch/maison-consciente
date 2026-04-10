'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ClipboardCheck,
  Phone,
  PhoneCall,
  BarChart3,
  Star,
  AlertTriangle,
  TrendingUp,
  Clock,
  Zap,
  Brain,
  MessageSquare,
  Check,
  ChevronRight,
  Sparkles,
  Heart,
  Mic,
  Globe,
  Eye,
  Bot,
  ArrowRight,
  Loader2,
  Hotel,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HospitalityAnalytics } from '@/components/hospitality/HospitalityAnalytics';

/* ═══════════════════════════════════════════════════════════
   MAELLIS — Safe Departure & Daily Concierge Modules
   
   Homepage showcasing the two new paid hospitality modules
   with pricing, feature breakdown, conversation logic,
   and live analytics dashboard preview.
   ═══════════════════════════════════════════════════════ */

/* ── Animation helpers ── */

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

/* ── Conversation Flow Steps ── */

interface ConversationStep {
  id: number;
  role: 'system' | 'agent' | 'guest' | 'ai';
  message: string;
  icon: React.ElementType;
  color: string;
  delay?: number;
}

const CONVERSATION_FLOW_DEPARTURE: ConversationStep[] = [
  {
    id: 1,
    role: 'system',
    message: 'Cron Job déclenché à 09h00 — Jour de départ détecté pour "Dupont".',
    icon: Clock,
    color: 'text-blue-400',
  },
  {
    id: 2,
    role: 'system',
    message: 'Retell AI initie l\'appel vocal → Appel sortant vers +33 6 XX XX XX XX.',
    icon: PhoneCall,
    color: 'text-emerald-400',
  },
  {
    id: 3,
    role: 'agent',
    message: 'Bonjour ! Puis-je avoir votre attention ? Je suis Maellis, le concierge de Villa Azur. C\'est votre dernier jour — puis-je vous poser 2 petites questions ?',
    icon: Mic,
    color: 'text-[var(--accent-primary)]',
  },
  {
    id: 4,
    role: 'guest',
    message: 'Oui, bien sûr, allez-y.',
    icon: MessageSquare,
    color: 'text-slate-300',
  },
  {
    id: 5,
    role: 'agent',
    message: 'Comment s\'est passé votre séjour dans son ensemble ? Y a-t-il quelque chose que nous pourrions améliorer pour les prochains invités ?',
    icon: Mic,
    color: 'text-[var(--accent-primary)]',
  },
  {
    id: 6,
    role: 'guest',
    message: 'Le séjour était super, mais la climatisation du salon faisait un bruit bizarre la nuit...',
    icon: MessageSquare,
    color: 'text-slate-300',
  },
  {
    id: 7,
    role: 'ai',
    message: '⚠️ Détection: "bruit bizarre" + "climatisation" → Sentiment: negative. Score estimé: 3/5. Déclenchement webhook d\'alerte.',
    icon: Brain,
    color: 'text-amber-400',
  },
  {
    id: 8,
    role: 'agent',
    message: 'Je suis vraiment désolé d\'apprendre cela. C\'est important pour nous. Votre hôte sera immédiatement informé pour résoudre ce problème. Merci pour votre retour, et excellent voyage de retour !',
    icon: Mic,
    color: 'text-[var(--accent-primary)]',
  },
  {
    id: 9,
    role: 'system',
    message: '✅ Alerte envoyée à l\'hôte. Rapport StayReview généré par Gemini. Brouillon d\'avis public créé.',
    icon: Zap,
    color: 'text-emerald-400',
  },
];

/* ── Conversation Flow Component ── */

function ConversationFlow({ steps }: { steps: ConversationStep[] }) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSequence = useCallback(() => {
    setVisibleSteps(0);
    setIsPlaying(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleSteps(count);
      if (count >= steps.length) {
        clearInterval(interval);
        setIsPlaying(false);
      }
    }, 800);
  }, [steps.length]);

  useEffect(() => {
    playSequence();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="text-xs font-semibold text-[#e2e8f0]">Flux de conversation vocal</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={playSequence}
          disabled={isPlaying}
          className="h-7 text-[10px] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
        >
          {isPlaying ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Eye className="w-3 h-3 mr-1" />}
          Rejouer
        </Button>
      </div>
      <div className="max-h-[500px] overflow-y-auto scrollbar-luxe space-y-2 pr-1">
        <AnimatePresence>
          {steps.slice(0, visibleSteps).map((step) => {
            const Icon = step.icon;
            const isSystem = step.role === 'system' || step.role === 'ai';
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: step.role === 'guest' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`flex gap-3 ${step.role === 'guest' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${isSystem ? 'bg-white/[0.04]' : step.role === 'agent' ? 'bg-[var(--accent-primary)]/15' : 'bg-slate-700/50'}`}>
                  <Icon className={`w-3.5 h-3.5 ${step.color}`} />
                </div>
                <div className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed ${isSystem ? 'bg-white/[0.02] border border-white/[0.04] text-[#94a3b8] italic' : step.role === 'guest' ? 'bg-slate-700/40 text-[#e2e8f0]' : 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/15 text-[#e2e8f0]'}`}>
                  {step.message}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Feature Card ── */

function FeatureItem({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="shrink-0 w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center mt-0.5">
        <Check className="w-3 h-3 text-emerald-400" />
      </div>
      <span className="text-xs text-[#94a3b8] leading-relaxed">{text}</span>
    </div>
  );
}

/* ── Module Pricing Card ── */

function ModulePricingCard({
  icon: Icon,
  title,
  subtitle,
  price,
  priceYearly,
  features,
  popular,
  accentColor,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  price: number;
  priceYearly: number;
  features: string[];
  popular?: boolean;
  accentColor: string;
}) {
  return (
    <motion.div variants={staggerItem} className={popular ? 'relative' : ''}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-[var(--accent-primary)] text-[#0a0a12] text-[10px] font-semibold px-3 py-0.5 rounded-full shadow-[0_0_16px_var(--accent-primary-glow)]">
            Populaire
          </Badge>
        </div>
      )}
      <Card className={`glass rounded-2xl border overflow-hidden h-full ${popular ? 'border-[var(--accent-primary)]/30 shadow-[0_0_32px_var(--accent-primary-glow)]' : 'border-white/[0.06] hover:border-white/[0.12]'} transition-all duration-500`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accentColor}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-semibold text-[#f1f5f9]">{title}</h3>
              <p className="text-[10px] text-[#64748b] mt-0.5">{subtitle}</p>
            </div>
          </div>

          <Separator className="bg-white/[0.04] mb-4" />

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-5">
            <span className="text-3xl font-bold font-serif text-gradient-gold">{price}</span>
            <span className="text-sm text-[#64748b]">€/mois</span>
          </div>
          <p className="text-[10px] text-[#475569] mb-5">
            ou {priceYearly}€/an (économie {(price * 12 - priceYearly).toFixed(0)}€)
          </p>

          {/* CTA */}
          <Button
            className={`w-full mb-5 ${popular ? 'bg-gradient-gold text-[#0a0a12] hover:opacity-90 shadow-[0_4px_16px_var(--accent-primary-glow)]' : 'bg-white/[0.06] text-[#e2e8f0] hover:bg-white/[0.1] border border-white/[0.08]'}`}
            size="sm"
          >
            Activer
            <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>

          {/* Features */}
          <div className="space-y-2.5">
            {features.map((feature, i) => (
              <FeatureItem key={i} icon={Check} text={feature} />
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ═══ MAIN COMPONENT ═══ */

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('modules');

  return (
    <div className="min-h-screen bg-[#020617] text-[#f1f5f9]">
      {/* ═══ HERO SECTION ═══ */}
      <header className="relative overflow-hidden border-b border-white/[0.04]">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-primary)]/[0.06] via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--accent-primary)]/[0.04] rounded-full blur-[120px]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/15 mb-6"
            >
              <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" />
              <span className="text-[10px] font-semibold text-[var(--accent-primary)] tracking-wide uppercase">Nouveaux modules payants</span>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4">
              <span className="text-gradient-gold">Safe Departure</span>
              <span className="text-[#64748b]"> & </span>
              <span className="text-gradient-gold">Daily Concierge</span>
            </h1>

            <p className="text-sm sm:text-base text-[#94a3b8] max-w-2xl mx-auto mb-8 leading-relaxed">
              Deux modules intelligents propulsés par <strong className="text-[#e2e8f0]">Retell AI</strong> et <strong className="text-[#e2e8f0]">Gemini 2.0 Flash</strong> pour protéger votre réputation et anticiper chaque besoin de vos invités.
            </p>

            {/* Quick stats */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
            >
              {[
                { icon: PhoneCall, label: 'Appels vocaux IA', value: 'Automatiques' },
                { icon: Brain, label: 'Analyse sentiment', value: 'Temps réel' },
                { icon: Shield, label: 'Sauvetage réputation', value: 'Immédiat' },
                { icon: BarChart3, label: 'Rapports IA', value: 'Complets' },
              ].map((stat) => (
                <motion.div key={stat.label} variants={staggerItem} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <stat.icon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <div className="text-left">
                    <p className="text-[10px] text-[#64748b]">{stat.label}</p>
                    <p className="text-xs font-semibold text-[#e2e8f0]">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 h-auto flex flex-wrap gap-1 w-fit mx-auto">
            <TabsTrigger
              value="modules"
              className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-4 py-2.5"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Modules & Tarifs
            </TabsTrigger>
            <TabsTrigger
              value="conversation"
              className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-4 py-2.5"
            >
              <Mic className="w-3.5 h-3.5 mr-1.5" />
              Conversation IA
            </TabsTrigger>
            <TabsTrigger
              value="architecture"
              className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-4 py-2.5"
            >
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Architecture
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-4 py-2.5"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Dashboard Analytics
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════
             TAB 1: MODULES & TARIFS
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="modules">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <ModulePricingCard
                icon={ShieldCheck}
                title="Safe Departure & Security"
                subtitle="Check-out intelligent + sauvetage de réputation"
                price={6.9}
                priceYearly={69}
                accentColor="bg-emerald-600/20"
                features={[
                  'Appel vocal Retell AI le jour du départ',
                  'Détection d\'insatisfaction en temps réel',
                  'Alerte immédiate à l\'hôte (Retell call / Push)',
                  'Rapport IA StayReview avec notes par catégorie',
                  'Génération automatique d\'avis public positif',
                  'Score de sentiment -1.0 à +1.0 (Gemini)',
                  'Webhook Retell → Analyse async non-bloquante',
                ]}
              />
              <ModulePricingCard
                icon={ClipboardCheck}
                title="Daily Concierge & Care"
                subtitle="Audit quotidien à 22h + résolution proactive"
                price={9.9}
                priceYearly={99}
                popular
                accentColor="bg-[var(--accent-primary)]/20"
                features={[
                  'Audit quotidien automatique à 22h',
                  'Appel vocal respectueux (demande permission)',
                  'Gestion du silence → relance dans 1h si pas de réponse',
                  'Analyse sentiment Gemini 2.0 Flash-Lite',
                  'Alerte hôte instantanée si score < 4/5',
                  'Rapport StayReview complet en fin de séjour',
                  'Dashboard analytics avec radar 6 axes',
                  'Questions adaptatives (Arrivée / Quotidien / Départ)',
                ]}
              />
            </motion.div>

            {/* Bundle offer */}
            <motion.div variants={fadeUp} initial="initial" animate="animate" className="mt-8">
              <Card className="glass rounded-2xl border-[var(--accent-primary)]/20 overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 shrink-0">
                    <Heart className="w-6 h-6 text-[var(--accent-primary)]" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-sm font-serif font-semibold text-[#f1f5f9] mb-1">
                      Bundle Complet — Safe Departure + Daily Concierge
                    </h3>
                    <p className="text-xs text-[#94a3b8]">
                      Les deux modules pour une protection complète de votre réputation.
                    </p>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="flex items-baseline gap-1 justify-center">
                      <span className="text-2xl font-bold font-serif text-gradient-gold">14,90</span>
                      <span className="text-sm text-[#64748b]">€/mois</span>
                    </div>
                    <p className="text-[10px] text-emerald-400 mt-1">
                      Économisez 1,90€/mois
                    </p>
                    <Button className="mt-2 bg-gradient-gold text-[#0a0a12] hover:opacity-90 shadow-[0_4px_16px_var(--accent-primary-glow)] text-xs h-8">
                      Activer le bundle
                      <ArrowRight className="w-3 h-3 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Cron schedule */}
            <motion.div variants={fadeUp} initial="initial" animate="animate" className="mt-6">
              <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
                    <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Planification automatique (Cron Jobs)</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-xs font-semibold text-[#e2e8f0]">Quotidien — 22h00</span>
                      </div>
                      <p className="text-[10px] text-[#64748b] leading-relaxed">
                        Vérification du confort de l&apos;invité. Question adaptative selon le jour du séjour.
                      </p>
                      <Badge variant="outline" className="mt-2 text-[9px] px-2 py-0 rounded-full border-white/[0.08] text-emerald-400/80">
                        Daily Concierge
                      </Badge>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-xs font-semibold text-[#e2e8f0]">Départ — 09h00</span>
                      </div>
                      <p className="text-[10px] text-[#64748b] leading-relaxed">
                        Bilan de fin de séjour le jour du check-out. Détection d&apos;insatisfaction prioritaire.
                      </p>
                      <Badge variant="outline" className="mt-2 text-[9px] px-2 py-0 rounded-full border-white/[0.08] text-amber-400/80">
                        Safe Departure
                      </Badge>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-xs font-semibold text-[#e2e8f0]">Rapport — Automatique</span>
                      </div>
                      <p className="text-[10px] text-[#64748b] leading-relaxed">
                        Génération du StayReviewReport après chaque check-out avec checks complétés.
                      </p>
                      <Badge variant="outline" className="mt-2 text-[9px] px-2 py-0 rounded-full border-white/[0.08] text-blue-400/80">
                        Gemini 2.0 Flash
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
             TAB 2: CONVERSATION IA
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="conversation">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversation Flow */}
              <motion.div variants={fadeUp} initial="initial" animate="animate">
                <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <PhoneCall className="w-4 h-4 text-[var(--accent-primary)]" />
                      <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Exemple : Check-out avec problème détecté</h3>
                    </div>
                    <p className="text-[10px] text-[#64748b] mb-4">Simulation du flux Retell AI → Gemini → Alerte hôte</p>
                    <ConversationFlow steps={CONVERSATION_FLOW_DEPARTURE} />
                  </div>
                </Card>
              </motion.div>

              {/* System Prompt Logic */}
              <motion.div variants={scaleIn} initial="initial" animate="animate">
                <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-4 h-4 text-[var(--accent-primary)]" />
                      <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Logique du System Prompt</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Step 1 */}
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="text-[9px] px-1.5 py-0 rounded bg-emerald-500/15 text-emerald-400 border-emerald-500/20">Étape 1</Badge>
                          <span className="text-xs font-medium text-[#e2e8f0]">Demande de permission</span>
                        </div>
                        <p className="text-[10px] text-[#64748b] leading-relaxed italic">
                          &quot;Puis-je avoir votre attention ? Je suis Maellis, le concierge de {propertyName}.&quot;
                        </p>
                        <p className="text-[10px] text-[#475569] mt-1">→ Si refus : termine poliment. Si accepte : passe à l&apos;étape 2.</p>
                      </div>

                      {/* Step 2 */}
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="text-[9px] px-1.5 py-0 rounded bg-amber-500/15 text-amber-400 border-amber-500/20">Étape 2</Badge>
                          <span className="text-xs font-medium text-[#e2e8f0]">Gestion du silence</span>
                        </div>
                        <p className="text-[10px] text-[#64748b] leading-relaxed">
                          Timeout: <strong className="text-[#e2e8f0]">15 secondes</strong> sans réponse → &quot;Je ne vous dérange pas davantage.&quot; → Fin d&apos;appel + relance dans <strong className="text-[#e2e8f0]">1 heure</strong>.
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="text-[9px] px-1.5 py-0 rounded bg-blue-500/15 text-blue-400 border-blue-500/20">Étape 3</Badge>
                          <span className="text-xs font-medium text-[#e2e8f0]">Questionnaire adaptatif</span>
                        </div>
                        <div className="space-y-1.5 mt-2">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] text-[#94a3b8]"><strong className="text-emerald-400">Arrivée</strong> — &quot;Comment s&apos;est passée votre arrivée ?&quot;</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] text-[#94a3b8]"><strong className="text-blue-400">Quotidien</strong> — &quot;Comment se passe votre séjour ?&quot;</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] text-[#94a3b8]"><strong className="text-amber-400">Départ</strong> — &quot;Bilan global + suggestions ?&quot;</span>
                          </div>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="p-3 rounded-xl bg-red-500/[0.04] border border-red-500/15">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="text-[9px] px-1.5 py-0 rounded bg-red-500/15 text-red-400 border-red-500/20">Étape 4</Badge>
                          <span className="text-xs font-medium text-red-400">Détection d&apos;insatisfaction</span>
                        </div>
                        <p className="text-[10px] text-[#94a3b8] leading-relaxed">
                          Si <strong className="text-red-400">score &lt; 4/5</strong> ou mot-clé négatif (&quot;problème&quot;, &quot;sale&quot;, &quot;bruit&quot;, &quot;cassé&quot;...) :
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span className="text-[10px] text-red-400 font-medium">→ Webhook d&apos;alerte immédiate à l&apos;hôte</span>
                        </div>
                      </div>

                      {/* Step 5 */}
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="text-[9px] px-1.5 py-0 rounded bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/20">Étape 5</Badge>
                          <span className="text-xs font-medium text-[#e2e8f0]">Fin gracieuse</span>
                        </div>
                        <p className="text-[10px] text-[#64748b] italic">
                          &quot;Merci {guestName}, votre retour est très précieux. Nous vous souhaitons un excellent séjour. Au revoir !&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Negative keywords detection */}
            <motion.div variants={fadeUp} initial="initial" animate="animate" className="mt-6">
              <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Mots-clés de détection d&apos;insatisfaction</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'problème', 'pas bien', 'déçu(e)', 'mauvais(e)', 'bruyant',
                      'sale', 'cassé', 'inconfortable', 'horrible', 'terrible',
                      'climatisation', 'wi-fi', 'odeur', 'bruit', 'insecte',
                    ].map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="outline"
                        className="text-[9px] px-2 py-0.5 rounded-full border-red-500/15 text-red-400/70 bg-red-500/[0.04]"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#475569] mt-3">
                    28 mots-clés en français détectés en temps réel par le prompt Retell. L&apos;analyse approfondie est ensuite confiée à Gemini 2.0 Flash-Lite pour extraction des scores par catégorie.
                  </p>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
             TAB 3: ARCHITECTURE TECHNIQUE
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="architecture">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Data flow */}
              <motion.div variants={fadeUp} initial="initial" animate="animate">
                <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="w-4 h-4 text-[var(--accent-primary)]" />
                      <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Modèles de données (Prisma)</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          model: 'DailyCheck',
                          desc: 'Audit quotidien — statut, transcription, score, sentiment, IA summary',
                          color: 'bg-blue-500/10 text-blue-400 border-blue-500/15',
                        },
                        {
                          model: 'StayReviewReport',
                          desc: 'Rapport complet — 6 notes catégorielles, sentiment, verbatim, highlights, avis public',
                          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
                        },
                        {
                          model: 'HostAlert',
                          desc: 'Alerte temps réel — sévérité, catégorie, statut, notification hôte',
                          color: 'bg-red-500/10 text-red-400 border-red-500/15',
                        },
                        {
                          model: 'SystemConfig',
                          desc: 'Configuration superadmin — SMTP, Sentry DSN, clés API (chiffrées AES-256)',
                          color: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
                        },
                      ].map((item) => (
                        <div key={item.model} className={`p-3 rounded-xl border ${item.color}`}>
                          <p className="text-xs font-mono font-semibold">{item.model}</p>
                          <p className="text-[10px] text-[#94a3b8] mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* API Endpoints */}
              <motion.div variants={scaleIn} initial="initial" animate="animate">
                <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 text-[var(--accent-primary)]" />
                      <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">API Endpoints & Flux</h3>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-luxe pr-1">
                      {[
                        { method: 'POST', path: '/api/cron/hospitality-check', desc: 'Cron — déclenche les checks automatiques', auth: 'CRON_SECRET' },
                        { method: 'GET', path: '/api/hospitality/analytics', desc: 'KPIs + distribution + catégorie moyennes', auth: 'Auth + Hospitality' },
                        { method: 'GET', path: '/api/hospitality/daily-checks', desc: 'Liste paginée + filtres statut/sentiment', auth: 'Auth + Hospitality' },
                        { method: 'POST', path: '/api/hospitality/daily-checks', desc: 'Déclenche un check manuel (Retell call)', auth: 'Auth + Hospitality' },
                        { method: 'GET', path: '/api/hospitality/host-alerts', desc: 'Liste des alertes avec filtres', auth: 'Auth + Hospitality' },
                        { method: 'PATCH', path: '/api/hospitality/host-alerts', desc: 'Acknowledge / Resolve / Dismiss', auth: 'Auth + Hospitality' },
                        { method: 'GET', path: '/api/hospitality/stay-reports', desc: 'Rapports de séjour avec pagination', auth: 'Auth + Hospitality' },
                        { method: 'POST', path: '/api/hospitality/stay-reports', desc: 'Génère un rapport via Gemini', auth: 'Auth + Hospitality' },
                        { method: 'POST', path: '/api/webhooks/retell-analysis', desc: 'Webhook Retell → transcription → analyse', auth: 'Public (Retell)' },
                      ].map((ep) => (
                        <div key={ep.path} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center gap-2">
                          <Badge className={`text-[9px] px-1.5 py-0 rounded font-mono ${ep.method === 'GET' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : ep.method === 'POST' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 'bg-amber-500/15 text-amber-400 border-amber-500/20'}`}>
                            {ep.method}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-mono text-[#e2e8f0] truncate">{ep.path}</p>
                            <p className="text-[9px] text-[#64748b] truncate">{ep.desc}</p>
                          </div>
                          <Badge variant="outline" className="text-[8px] px-1.5 py-0 rounded-full border-white/[0.06] text-[#475569] shrink-0">
                            {ep.auth}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Cron schedule detail */}
              <motion.div variants={fadeUp} initial="initial" animate="animate">
                <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
                      <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Logique Cron (cron-hospitality-check.ts)</h3>
                    </div>
                    <div className="space-y-2.5 text-[10px] text-[#94a3b8] leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b] font-mono shrink-0">1.</span>
                        <span>Find all <code className="text-blue-400 bg-blue-500/10 px-1 rounded">CheckInState</code> where <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">status = &quot;checked-in&quot;</code></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b] font-mono shrink-0">2.</span>
                        <span>Group by <code className="text-blue-400 bg-blue-500/10 px-1 rounded">householdId</code> → fetch <code className="text-amber-400 bg-amber-500/10 px-1 rounded">modulesConfig</code> + <code className="text-amber-400 bg-amber-500/10 px-1 rounded">timezone</code></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b] font-mono shrink-0">3.</span>
                        <span>If <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">dailyConcierge.active</code> + <code className="text-amber-400 bg-amber-500/10 px-1 rounded">hour ≥ 22</code> → trigger Retell call</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b] font-mono shrink-0">4.</span>
                        <span>If <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">safeDeparture.active</code> + <code className="text-amber-400 bg-amber-500/10 px-1 rounded">hour ≥ 9</code> + checkout today → trigger departure call</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b] font-mono shrink-0">5.</span>
                        <span>Dedup: skip if <code className="text-blue-400 bg-blue-500/10 px-1 rounded">DailyCheck</code> already exists for today + checkType</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#64748b] font-mono shrink-0">6.</span>
                        <span>After check-out: auto-generate <code className="text-blue-400 bg-blue-500/10 px-1 rounded">StayReviewReport</code> via Gemini</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Gemini Analysis */}
              <motion.div variants={scaleIn} initial="initial" animate="animate">
                <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-4 h-4 text-[var(--accent-primary)]" />
                      <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Gemini 2.0 Flash-Lite — Analyse</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <p className="text-[10px] font-semibold text-[#e2e8f0] mb-1">Extraction depuis la transcription</p>
                        <div className="flex flex-wrap gap-1">
                          {['Score 1-5', 'Sentiment', 'Propreté', 'Confort', 'Équipement', 'Emplacement', 'Contact', 'Q/P', 'Issues', 'Keywords'].map((item) => (
                            <Badge key={item} variant="outline" className="text-[8px] px-1.5 py-0 rounded-full border-white/[0.06] text-[#94a3b8]">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <p className="text-[10px] font-semibold text-[#e2e8f0] mb-1">Rapport StayReview généré</p>
                        <div className="flex flex-wrap gap-1">
                          {['AI Summary', 'Verbatim', 'Highlights', 'Pain Points', 'Recommendation', 'Public Review Draft'].map((item) => (
                            <Badge key={item} variant="outline" className="text-[8px] px-1.5 py-0 rounded-full border-[var(--accent-primary)]/15 text-[var(--accent-primary)]/80">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] text-[#475569] leading-relaxed">
                        Temperature: 0.3 | Max tokens: 2048 | Response type: JSON | Retries: 3 avec backoff exponentiel.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
             TAB 4: DASHBOARD ANALYTICS
             ═══════════════════════════════════════════════════ */}
          <TabsContent value="analytics">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
              <h2 className="text-lg font-serif text-gradient-gold">Dashboard Analytics & Avis</h2>
            </div>
            <p className="text-xs text-[#64748b] mb-6 max-w-xl">
              Aperçu du tableau de bord complet disponible dans la navigation &quot;Analytics &amp; Avis&quot;. 
              Connectez-vous en mode hospitalité pour voir les données réelles.
            </p>
            <HospitalityAnalytics />
          </TabsContent>
        </Tabs>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/[0.04] mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-gold flex items-center justify-center">
              <span className="text-[#0a0a12] font-serif font-bold text-[10px]">M</span>
            </div>
            <span className="text-[10px] text-[#475569]">
              Maellis — Maison Consciente · Modules Hospitalité v1.0
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-[#475569]">Retell AI + Gemini 2.0 Flash-Lite</span>
            <span className="text-[10px] text-[#475569]">•</span>
            <span className="text-[10px] text-[#475569]">Cron déclenché chaque heure</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Helpers for prompt template ── */
const { propertyName, guestName } = { propertyName: 'Villa Azur', guestName: 'M. Dupont' };
