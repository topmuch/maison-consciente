'use client';

import { useState, useCallback } from 'react';
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
  DollarSign,
  Users,
  Languages,
  Volume2,
  Cpu,
  Wifi,
  Layers,
  Play,
  X,
  CreditCard,
  PartyPopper,
  Sun,
  LogOut,
  Calendar,
  MapPin,
  Utensils,
  Camera,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { modules, packs, getModuleById, getPackSavings } from '@/lib/modules-config';

/* ═══════════════════════════════════════════════════════════
   MAELLIS — Global Host Pro Showcase
   Complete WOW page showcasing all 7 modules + AI Architecture
   ═══════════════════════════════════════════════════════ */

/* ── Animation helpers ── */

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

/* ── Conversation Steps for WOW Demo ── */

interface ConvStep {
  id: number;
  role: 'system' | 'agent' | 'guest' | 'ai';
  message: string;
  icon: React.ElementType;
  color: string;
}

const UPSELL_FLOW: ConvStep[] = [
  { id: 1, role: 'system', message: '⏰ Trigger: J+0, H+2 après check-in de Sophie.', icon: Clock, color: 'text-blue-400' },
  { id: 2, role: 'system', message: 'MaellisBrain → Deepgram STT (silence) → Route vers Gemini.', icon: Cpu, color: 'text-emerald-400' },
  { id: 3, role: 'agent', message: 'Bonjour Sophie ! J\'espère que votre installation s\'est bien passée. Pour rendre votre séjour parfait, nous proposons des services exclusifs...', icon: Mic, color: 'text-[var(--accent-primary)]' },
  { id: 4, role: 'agent', message: 'Un chef à domicile pour une soirée gastronomique, un ménage express, ou encore une navette aéroport. Cliquez sur l\'onglet Services pour découvrir toutes nos offres.', icon: Mic, color: 'text-[var(--accent-primary)]' },
  { id: 5, role: 'ai', message: '✅ TTS Router → ElevenLabs (émotion=enthusiastic). Coût: ~0.02$.', icon: Brain, color: 'text-emerald-400' },
  { id: 6, role: 'system', message: '📊 Analytics: Upsell impression logged. Taux de conversion en temps réel.', icon: TrendingUp, color: 'text-amber-400' },
];

const LATE_CHECKOUT_FLOW: ConvStep[] = [
  { id: 1, role: 'system', message: '⏰ Trigger: Jour de départ, 09h00. Vérification calendrier...', icon: Clock, color: 'text-blue-400' },
  { id: 2, role: 'system', message: '✅ Prochain séjour à 17h00 → Disponibilité confirmée pour Late Checkout 14h.', icon: Calendar, color: 'text-emerald-400' },
  { id: 3, role: 'agent', message: 'Bonjour ! Avant de partir, votre appartement est libre cet après-midi. Souhaitez-vous prolonger jusqu\'à 14h pour 20€ ?', icon: Mic, color: 'text-[var(--accent-primary)]' },
  { id: 4, role: 'guest', message: 'Oh oui, ce serait génial !', icon: MessageSquare, color: 'text-slate-300' },
  { id: 5, role: 'system', message: '💳 Stripe PaymentIntent créé → Transaction confirmée en 2 secondes.', icon: CreditCard, color: 'text-emerald-400' },
  { id: 6, role: 'agent', message: 'Parfait ! Votre départ est repoussé à 14h. Profitez bien de votre dernière journée à Nice !', icon: Mic, color: 'text-[var(--accent-primary)]' },
];

const DAILY_CHECK_FLOW: ConvStep[] = [
  { id: 1, role: 'system', message: '⏰ Trigger: 22h00 — Audit quotidien pour séjours actifs.', icon: Clock, color: 'text-blue-400' },
  { id: 2, role: 'system', message: 'Retell AI initie l\'appel vocal → Permission → Question adaptative.', icon: PhoneCall, color: 'text-emerald-400' },
  { id: 3, role: 'agent', message: 'Puis-je avoir votre attention ? Je suis Maellis, le concierge de Villa Azur. Comment se passe votre séjour ?', icon: Mic, color: 'text-[var(--accent-primary)]' },
  { id: 4, role: 'guest', message: 'Très bien sauf que la climatisation fait un bruit bizarre la nuit...', icon: MessageSquare, color: 'text-slate-300' },
  { id: 5, role: 'ai', message: '⚠️ Gemini 2.0 Flash-Lite: Score 3/5 | Sentiment: negative | Issue: climatisation bruyante', icon: Brain, color: 'text-amber-400' },
  { id: 6, role: 'system', message: '🚨 HostAlert créé (severity=medium) → Push + Email à l\'hôte Isabelle.', icon: AlertTriangle, color: 'text-red-400' },
];

/* ── Conversation Flow Component ── */

function ConversationFlow({ steps, title, accentColor }: { steps: ConvStep[]; title: string; accentColor: string }) {
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
    }, 900);
  }, [steps.length]);

  return (
    <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${accentColor}`} />
            <span className="text-xs font-semibold text-[#e2e8f0]">{title}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={playSequence} disabled={isPlaying}
            className="h-7 text-[10px] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10">
            {isPlaying ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
            Rejouer
          </Button>
        </div>
        <div className="max-h-[360px] overflow-y-auto scrollbar-luxe space-y-2 pr-1">
          <AnimatePresence>
            {steps.slice(0, visibleSteps).map((step) => {
              const Icon = step.icon;
              const isSystem = step.role === 'system' || step.role === 'ai';
              return (
                <motion.div key={step.id}
                  initial={{ opacity: 0, x: step.role === 'guest' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className={`flex gap-3 ${step.role === 'guest' ? 'flex-row-reverse' : ''}`}>
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
    </Card>
  );
}

/* ── Feature Check Item ── */

function FeatureCheck({ text }: { text: string }) {
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

function ModuleCard({ module }: { module: typeof modules[0] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div variants={staggerItem}>
      <Card className={`glass rounded-2xl border overflow-hidden h-full transition-all duration-500 ${module.popular ? 'border-[var(--accent-primary)]/30 shadow-[0_0_32px_var(--accent-primary-glow)]' : 'border-white/[0.06] hover:border-white/[0.12]'}`}>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${module.accentColor}`}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-serif font-semibold text-[#f1f5f9] truncate">{module.name}</h3>
                {module.popular && <Badge className="bg-[var(--accent-primary)] text-[#0a0a12] text-[9px] px-2 py-0 rounded-full shrink-0">{module.badge}</Badge>}
              </div>
              <p className="text-[10px] text-[#64748b] mt-0.5 line-clamp-1">{module.description}</p>
            </div>
          </div>

          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-bold font-serif text-gradient-gold">{module.price}</span>
            <span className="text-xs text-[#64748b]">€/mois</span>
            <span className="text-[10px] text-[#475569] ml-2">ou {module.priceYearly}€/an</span>
          </div>

          <Button className={`w-full mb-3 ${module.popular ? 'bg-gradient-gold text-[#0a0a12] hover:opacity-90 shadow-[0_4px_16px_var(--accent-primary-glow)]' : 'bg-white/[0.06] text-[#e2e8f0] hover:bg-white/[0.1] border border-white/[0.08]'}`}
            size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Voir moins' : 'Voir les fonctionnalités'}
            <ChevronRight className={`w-3.5 h-3.5 ml-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </Button>

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="space-y-2.5 overflow-hidden">
                {module.features.map((f, i) => (
                  f.included && <FeatureCheck key={i} text={f.text} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}

/* ── AI Architecture Diagram ── */

function ArchitectureDiagram() {
  const nodes = [
    { label: 'Audio Guest', icon: Mic, x: 0, color: 'bg-sky-500/20 border-sky-500/30', desc: 'Voice input' },
    { label: 'Deepgram Nova-2', icon: Wifi, x: 1, color: 'bg-emerald-500/20 border-emerald-500/30', desc: 'STT — 0.0043$/min' },
    { label: 'Gemini 2.0 Flash', icon: Brain, x: 2, color: 'bg-purple-500/20 border-purple-500/30', desc: 'LLM — 0.08$/1M tokens' },
    { label: 'TTS Router', icon: Volume2, x: 3, color: 'bg-amber-500/20 border-amber-500/30', desc: 'Smart routing' },
    { label: 'ElevenLabs', icon: Cpu, x: 4, color: 'bg-rose-500/20 border-rose-500/30', desc: 'Premium TTS' },
    { label: 'Web Speech', icon: Globe, x: 4, color: 'bg-teal-500/20 border-teal-500/30', desc: 'Free TTS' },
  ];

  return (
    <div className="space-y-6">
      {/* Flow diagram */}
      <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden p-6">
        <div className="flex items-center gap-2 mb-6">
          <Cpu className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">MaellisBrain — Architecture Hybride</h3>
        </div>

        {/* Pipeline visualization */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2 overflow-x-auto pb-2">
          {nodes.map((node, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-2 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div variants={staggerItem} initial="initial" animate="animate"
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${node.color} min-w-[90px] cursor-default`}>
                      <node.icon className="w-5 h-5 text-white/80" />
                      <span className="text-[10px] font-semibold text-white/90 text-center leading-tight">{node.label}</span>
                      <span className="text-[8px] text-white/50">{node.desc}</span>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-slate-800 text-slate-200 text-xs">
                    {node.desc}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {i < 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.15 }}
                  className="text-white/20 hidden sm:block">
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Cost table */}
        <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <h4 className="text-xs font-semibold text-[#e2e8f0] mb-3">Coûts par interaction typique</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'STT (Deepgram)', cost: '~0.002$', icon: Mic },
              { label: 'LLM (Gemini)', cost: '~0.001$', icon: Brain },
              { label: 'TTS Premium', cost: '~0.015$', icon: Cpu },
              { label: 'TTS Gratuit', cost: '0.000$', icon: Globe },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                <div>
                  <p className="text-[10px] text-[#94a3b8]">{item.label}</p>
                  <p className="text-xs font-mono font-semibold text-emerald-400">{item.cost}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* TTS Decision Logic */}
      <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden p-6">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">TTS Router — Logique de décision</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-rose-500/[0.04] border border-rose-500/15">
            <p className="text-[10px] font-semibold text-rose-400 mb-2">ElevenLabs (Premium)</p>
            <div className="space-y-1.5">
              {['Emotion forte (urgent, apologetic, warm)', 'Sentiment négatif ou critique', 'Vente / Upsell / Late Checkout', 'Accueil personnalisé voyageur récurrent'].map(t => (
                <div key={t} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-rose-400" /><span className="text-[10px] text-[#94a3b8]">{t}</span></div>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/[0.04] border border-teal-500/15">
            <p className="text-[10px] font-semibold text-teal-400 mb-2">Web Speech API (Gratuit)</p>
            <div className="space-y-1.5">
              {['Questions fonctionnelles (WiFi, horaires)', 'Réponses neutres ou positives', 'Informations de base (météo, check-in)', 'Confirmation et rappels'].map(t => (
                <div key={t} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-teal-400" /><span className="text-[10px] text-[#94a3b8]">{t}</span></div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Data Models */}
      <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Modèles Prisma (34 modèles)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { name: 'GuestProfile', desc: 'Préférences voyageur, historique', color: 'bg-purple-500/10 text-purple-400 border-purple-500/15' },
            { name: 'DailyCheck', desc: 'Audit quotidien, score, sentiment', color: 'bg-blue-500/10 text-blue-400 border-blue-500/15' },
            { name: 'StayReviewReport', desc: 'Rapport IA 6 axes, verbatim', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' },
            { name: 'HostAlert', desc: 'Alerte temps réel, sévérité', color: 'bg-red-500/10 text-red-400 border-red-500/15' },
            { name: 'CheckInState', desc: 'Check-in/out digital', color: 'bg-amber-500/10 text-amber-400 border-amber-500/15' },
            { name: 'ApiConfig', desc: 'Clés API chiffrées AES-256', color: 'bg-sky-500/10 text-sky-400 border-sky-500/15' },
          ].map((model) => (
            <div key={model.name} className={`p-3 rounded-xl border ${model.color}`}>
              <p className="text-xs font-mono font-semibold">{model.name}</p>
              <p className="text-[10px] text-[#94a3b8] mt-0.5">{model.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Radar Chart Mock ── */

function RadarChartMock() {
  const axes = [
    { label: 'Propreté', score: 4.5, color: 'bg-emerald-400' },
    { label: 'Confort', score: 4.2, color: 'bg-sky-400' },
    { label: 'Équipement', score: 3.8, color: 'bg-purple-400' },
    { label: 'Emplacement', score: 4.7, color: 'bg-amber-400' },
    { label: 'Contact Hôte', score: 4.9, color: 'bg-rose-400' },
    { label: 'Qualité/Prix', score: 4.1, color: 'bg-teal-400' },
  ];

  return (
    <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-4 h-4 text-[var(--accent-primary)]" />
        <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Radar 6 Axes — Villa Azur</h3>
      </div>

      {/* Overall score */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">4.4</p>
            <p className="text-[9px] text-emerald-400/60">/5.0</p>
          </div>
        </div>
        <p className="text-xs text-[#94a3b8] mt-2">Score Moyen Pondéré</p>
      </div>

      {/* Axes */}
      <div className="space-y-3">
        {axes.map((axis) => (
          <div key={axis.label} className="flex items-center gap-3">
            <span className="text-[10px] text-[#94a3b8] w-24 shrink-0 text-right">{axis.label}</span>
            <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div className={`h-full rounded-full ${axis.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${(axis.score / 5) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} />
            </div>
            <span className="text-xs font-mono font-semibold text-[#e2e8f0] w-6">{axis.score}</span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <p className="text-lg font-bold text-[#e2e8f0]">12</p>
          <p className="text-[9px] text-[#64748b]">Séjours analysés</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <p className="text-lg font-bold text-amber-400">3</p>
          <p className="text-[9px] text-[#64748b]">Alertes ce mois</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <p className="text-lg font-bold text-emerald-400">92%</p>
          <p className="text-[9px] text-[#64748b]">Satisfaction</p>
        </div>
      </div>
    </Card>
  );
}

/* ═══ MAIN COMPONENT ═══ */

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-[#020617] text-[#f1f5f9] flex flex-col">
      {/* ═══ HERO SECTION ═══ */}
      <header className="relative overflow-hidden border-b border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-primary)]/[0.06] via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent-primary)]/[0.03] rounded-full blur-[150px]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/15 mb-6">
              <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" />
              <span className="text-[10px] font-semibold text-[var(--accent-primary)] tracking-wide uppercase">7 Modules WOW + Architecture IA</span>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4">
              <span className="text-gradient-gold">Maellis</span>
              <span className="text-[#64748b]"> </span>
              <span className="text-gradient-gold">Global Host Pro</span>
            </h1>

            <p className="text-sm sm:text-base text-[#94a3b8] max-w-2xl mx-auto mb-8 leading-relaxed">
              La solution ultime pour hôtes Airbnb professionnels.{' '}
              <strong className="text-[#e2e8f0]">7 modules intelligents</strong> propulsés par{' '}
              <strong className="text-[#e2e8f0]">Gemini 2.0 Flash-Lite</strong>,{' '}
              <strong className="text-[#e2e8f0]">Deepgram STT</strong> et{' '}
              <strong className="text-[#e2e8f0]">Retell AI</strong> pour une expérience client 5 étoiles automatisée.
            </p>

            {/* Key stats */}
            <motion.div variants={staggerContainer} initial="initial" animate="animate"
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {[
                { icon: DollarSign, label: 'Coût/interaction', value: '< 0.02$' },
                { icon: Brain, label: 'LLM', value: 'Gemini 2.0' },
                { icon: Shield, label: 'Reputation', value: 'Sauvetage auto' },
                { icon: BarChart3, label: 'Analytics', value: 'Temps réel' },
                { icon: Users, label: 'Voyageurs', value: 'Mémoire IA' },
                { icon: Languages, label: 'Langues', value: 'Auto-detect' },
              ].map((stat) => (
                <motion.div key={stat.label} variants={staggerItem}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
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
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 h-auto flex flex-wrap gap-1 w-fit mx-auto">
            <TabsTrigger value="overview" className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-4 py-2.5">
              <Star className="w-3.5 h-3.5 mr-1.5" /> Pack Pro
            </TabsTrigger>
            <TabsTrigger value="modules" className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-4 py-2.5">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> 7 Modules
            </TabsTrigger>
            <TabsTrigger value="demo" className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-4 py-2.5">
              <Play className="w-3.5 h-3.5 mr-1.5" /> Démos WOW
            </TabsTrigger>
            <TabsTrigger value="architecture" className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-4 py-2.5">
              <Cpu className="w-3.5 h-3.5 mr-1.5" /> Architecture IA
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg text-xs data-[state=active]:bg-[var(--accent-primary)]/15 data-[state=active]:text-[var(--accent-primary)] data-[state=active]:shadow-none text-[#94a3b8] px-4 py-2.5">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Analytics
            </TabsTrigger>
          </TabsList>

          {/* ═════════════════════════════════════════
             TAB: GLOBAL HOST PRO
             ═════════════════════════════════════════ */}
          <TabsContent value="overview">
            {packs.map((pack) => {
              const savings = getPackSavings(pack);
              return (
                <motion.div key={pack.id} variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
                  {/* Hero Pack Card */}
                  <Card className="glass rounded-2xl border-[var(--accent-primary)]/20 overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-purple-500 to-rose-500" />
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        {/* Left */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-gradient-to-r from-amber-500 to-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                              {pack.badge}
                            </Badge>
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#f1f5f9] mb-2">{pack.name}</h2>
                          <p className="text-sm text-[#94a3b8] mb-6 max-w-xl">{pack.description}</p>

                          <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-4xl font-bold font-serif text-gradient-gold">{pack.price}</span>
                            <span className="text-lg text-[#64748b]">€/mois</span>
                            <span className="text-xs text-[#475569] ml-1">ou {pack.priceYearly}€/an</span>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-6">
                            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 text-[10px]">
                              <Check className="w-3 h-3 mr-1" /> Économisez {savings}€/mois
                            </Badge>
                            <Badge variant="outline" className="border-purple-500/20 text-purple-400 text-[10px]">
                              <Zap className="w-3 h-3 mr-1" /> 7 modules inclus
                            </Badge>
                            <Badge variant="outline" className="border-amber-500/20 text-amber-400 text-[10px]">
                              <Sparkles className="w-3 h-3 mr-1" /> IA Gemini 2.0
                            </Badge>
                          </div>

                          <Button className="bg-gradient-gold text-[#0a0a12] hover:opacity-90 shadow-[0_4px_20px_var(--accent-primary-glow)] font-semibold px-8">
                            Choisir Global Host Pro
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>

                        {/* Right — Included modules grid */}
                        <div className="w-full sm:w-auto sm:min-w-[280px] space-y-2">
                          <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">7 Modules Inclus</h3>
                          {pack.includedModules.map((modId) => {
                            const mod = getModuleById(modId);
                            if (!mod) return null;
                            const ModIcon = mod.features[0]?.icon === 'PhoneCall' ? PhoneCall
                              : mod.features[0]?.icon === 'Clock' ? Clock
                              : mod.features[0]?.icon === 'Brain' ? Brain
                              : mod.features[0]?.icon === 'Sparkles' ? Sparkles
                              : mod.features[0]?.icon === 'BarChart3' ? BarChart3
                              : mod.features[0]?.icon === 'Globe' ? Globe
                              : mod.features[0]?.icon === 'MessageSquare' ? MessageSquare
                              : Star;
                            return (
                              <motion.div key={modId} variants={staggerItem}
                                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mod.accentColor}`}>
                                  <ModIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-[#e2e8f0] truncate">{mod.name}</p>
                                  <p className="text-[9px] text-[#64748b]">{mod.price}€/mois séparé</p>
                                </div>
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Features grid */}
                  <motion.div variants={staggerContainer} initial="initial" animate="animate"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {pack.features.map((f, i) => (
                      <motion.div key={i} variants={staggerItem}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#e2e8f0]">{f.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              );
            })}
          </TabsContent>

          {/* ═════════════════════════════════════════
             TAB: 7 MODULES
             ═════════════════════════════════════════ */}
          <TabsContent value="modules">
            <motion.div variants={staggerContainer} initial="initial" animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod) => (
                <ModuleCard key={mod.id} module={mod} />
              ))}
            </motion.div>

            {/* Cost comparison */}
            <motion.div variants={fadeUp} initial="initial" animate="animate" className="mt-8">
              <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden p-6">
                <h3 className="text-sm font-serif font-semibold text-[#e2e8f0] mb-4">Comparaison des coûts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] text-[#64748b] mb-2">Modules individuels (total)</p>
                    <p className="text-2xl font-bold text-[#94a3b8] line-through">{(37.30).toFixed(2)}€<span className="text-sm text-[#64748b]">/mois</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-400 mb-2">Global Host Pro (bundle)</p>
                    <p className="text-2xl font-bold text-gradient-gold">29.90€<span className="text-sm text-[#64748b]">/mois</span></p>
                    <p className="text-xs text-emerald-400 mt-1">Vous économisez 7.40€/mois soit 88.80€/an</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ═════════════════════════════════════════
             TAB: DEMOS WOW
             ═════════════════════════════════════════ */}
          <TabsContent value="demo">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConversationFlow steps={UPSELL_FLOW} title="Scénario A — Auto Upsell (J+0, H+2)" accentColor="bg-emerald-400" />
              <ConversationFlow steps={LATE_CHECKOUT_FLOW} title="Scénario B — Late Checkout (Départ 09h)" accentColor="bg-amber-400" />
              <ConversationFlow steps={DAILY_CHECK_FLOW} title="Scénario C — Audit Quotidien (22h)" accentColor="bg-purple-400" />
              <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Module — Guest Memory</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[10px] text-[#64748b] mb-1">Premier séjour</p>
                    <p className="text-xs text-[#e2e8f0] italic">&quot;Bienvenue Sophie ! Nous espérons que votre séjour à Villa Azur sera mémorable.&quot;</p>
                  </div>
                  <div className="flex justify-center"><ChevronRight className="w-4 h-4 text-[#475569] rotate-90" /></div>
                  <div className="p-3 rounded-xl bg-[var(--accent-primary)]/[0.04] border border-[var(--accent-primary)]/15">
                    <p className="text-[10px] text-[var(--accent-primary)] mb-1">3e séjour — Mémoire activée</p>
                    <p className="text-xs text-[#e2e8f0] italic">&quot;Ravi de vous revoir Sophie ! Le Pinot Noir est au frais, j&apos;ai mis la climatisation à 21°C comme vous préférez, et le jazz est prêt. Bon retour !&quot;</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {['Température: 21°C', 'Vin: Pinot Noir', 'Musique: Jazz', 'Oreiller: Moyen', 'Régime: Sans gluten'].map(pref => (
                      <Badge key={pref} variant="outline" className="text-[9px] px-2 py-0.5 rounded-full border-[var(--accent-primary)]/15 text-[var(--accent-primary)]/80 bg-[var(--accent-primary)]/[0.04]">{pref}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Module descriptions */}
            <motion.div variants={fadeUp} initial="initial" animate="animate" className="mt-6">
              <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden p-6">
                <h3 className="text-sm font-serif font-semibold text-[#e2e8f0] mb-4">5 Modules WOW Airbnb — Résumé technique</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    { name: 'Auto Upsell', icon: DollarSign, trigger: 'J+0, H+2', color: 'bg-purple-500/20', route: '/api/hospitality/upsell' },
                    { name: 'Late Checkout', icon: Clock, trigger: 'Départ 09h', color: 'bg-rose-500/20', route: '/api/hospitality/late-checkout' },
                    { name: 'Guest Memory', icon: Brain, trigger: 'Check-in', color: 'bg-sky-500/20', route: '@/lib/guest-memory' },
                    { name: 'Daily Audit', icon: ClipboardCheck, trigger: '22h quotid.', color: 'bg-amber-500/20', route: '@/lib/cron-hospitality-check' },
                    { name: 'Analytics', icon: BarChart3, trigger: 'Temps réel', color: 'bg-orange-500/20', route: '/api/hospitality/analytics' },
                  ].map((m) => (
                    <div key={m.name} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.color} mb-2`}>
                        <m.icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-xs font-semibold text-[#e2e8f0]">{m.name}</p>
                      <p className="text-[9px] text-[#64748b] mt-0.5">Trigger: {m.trigger}</p>
                      <p className="text-[8px] font-mono text-[#475569] mt-1 truncate">{m.route}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ═════════════════════════════════════════
             TAB: ARCHITECTURE IA
             ═════════════════════════════════════════ */}
          <TabsContent value="architecture">
            <ArchitectureDiagram />
          </TabsContent>

          {/* ═════════════════════════════════════════
             TAB: ANALYTICS
             ═════════════════════════════════════════ */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RadarChartMock />

              {/* KPIs */}
              <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden p-6">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">KPIs — Ce mois</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Upsell Conversion Rate', value: '34%', change: '+8%', positive: true, progress: 34 },
                    { label: 'Late Checkout Acceptance', value: '67%', change: '+12%', positive: true, progress: 67 },
                    { label: 'Guest Satisfaction Score', value: '4.4/5', change: '+0.3', positive: true, progress: 88 },
                    { label: 'Alert Resolution Time', value: '2.1h', change: '-0.8h', positive: true, progress: 78 },
                    { label: 'Negative Reviews Prevented', value: '5', change: '+3', positive: true, progress: 62 },
                    { label: 'Recurring Guest Rate', value: '28%', change: '+5%', positive: true, progress: 28 },
                  ].map((kpi) => (
                    <div key={kpi.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-[#94a3b8]">{kpi.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#e2e8f0]">{kpi.value}</span>
                          <Badge className={`text-[9px] px-1.5 py-0 rounded ${kpi.positive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                            {kpi.change}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={kpi.progress} className="h-1.5 bg-white/[0.04]" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* AI Summary */}
              <Card className="glass rounded-2xl border-white/[0.06] overflow-hidden p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h3 className="text-sm font-serif font-semibold text-[#e2e8f0]">Résumé IA du mois</h3>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-3">
                  <p className="text-xs text-[#94a3b8] leading-relaxed italic">
                    &quot;Les 12 séjours de ce mois affichent une satisfaction moyenne de 4.4/5, en hausse de 0.3 points. 
                    La climatisation du salon reste le sujet de mécontentement principal (3 signalements). 
                    L&apos;upsell Chef à domicile a le meilleur taux de conversion (45%). 
                    Le Late Checkout génère en moyenne 180€/mois de revenus additionnels. 
                    3 avis négatifs ont été prévenus grâce au module Safe Departure.&quot;
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-full border-emerald-500/15 text-emerald-400">
                      Trend: Positif
                    </Badge>
                    <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-full border-amber-500/15 text-amber-400">
                      Action: Clim salon
                    </Badge>
                    <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-full border-purple-500/15 text-purple-400">
                      Revenue: +180€/mois
                    </Badge>
                  </div>
                </div>

                {/* Top issues */}
                <h4 className="text-xs font-semibold text-[#e2e8f0] mt-5 mb-3">Problèmes récurrents</h4>
                <div className="space-y-2">
                  {[
                    { issue: 'Climatisation salon bruyante', count: 3, severity: 'high' },
                    { issue: 'WiFi instable chambre 2', count: 2, severity: 'medium' },
                    { issue: 'Manque de cintres', count: 1, severity: 'low' },
                  ].map((item) => (
                    <div key={item.issue} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                      <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${item.severity === 'high' ? 'text-red-400' : item.severity === 'medium' ? 'text-amber-400' : 'text-sky-400'}`} />
                      <span className="text-xs text-[#e2e8f0] flex-1">{item.issue}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-full border-white/[0.08] text-[#64748b]">
                        {item.count}x
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/[0.04] mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-xs font-serif font-semibold text-[#94a3b8]">Maellis — Maison Consciente</span>
            </div>
            <p className="text-[10px] text-[#475569]">
              Propulsé par Gemini 2.0 Flash-Lite + Deepgram Nova-2 + Retell AI + ElevenLabs
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
