'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, QrCode, MapPin, Star, MessageCircle, Phone, ShieldAlert,
  Clock, CalendarCheck, CalendarX, Info, Key, ChevronRight,
  Sun, CloudRain, Wind, Mic, MicOff, Send, Copy, Check,
  Heart, AlertTriangle, FileText, Sparkles, Lock, Globe,
  Image as ImageIcon, Bell, Settings, Moon, Volume2,
  Plus, X, Download, CreditCard, Filter, Eye,
  ChevronDown, PartyPopper, ThumbsUp, MessageSquare, Zap,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DemoLayout } from './DemoLayout';
import { useMaellisVoice } from '@/hooks/useMaellisVoice';
import { airbnbConfig, currentDemoTime, airbnbExtended } from '@/lib/mock-data-real';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
type AirbnbTab = 'accueil' | 'decouvrir' | 'communiquer' | 'monSejour';

interface ChecklistItem {
  label: string;
  done: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   QR CODE SVG COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function QRCodeDisplay({ size = 11 }: { size?: number }) {
  const seed = 'Maellis-VillaAzur-Viral-2025';
  const cells: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    cells[y] = [];
    for (let x = 0; x < size; x++) {
      const isCorner = (x < 3 && y < 3) || (x >= size - 3 && y < 3) || (x < 3 && y >= size - 3);
      const isBorder = x === 0 || x === size - 1 || y === 0 || y === size - 1;
      const isInnerBorder = x === 1 || x === size - 2 || y === 1 || y === size - 2;
      const isCenter = x === Math.floor(size / 2) && y === Math.floor(size / 2);
      const isCenterCross = (x === Math.floor(size / 2) || y === Math.floor(size / 2)) && Math.abs(x - Math.floor(size / 2)) <= 1 && Math.abs(y - Math.floor(size / 2)) <= 1;
      const pseudoRandom = ((seed.charCodeAt((y * size + x) % seed.length) || 7) * 31 + x * 17 + y * 13) % 5 > 2;
      cells[y][x] = isCorner || (isBorder && !isCorner) || isCenter || isCenterCross || pseudoRandom;
    }
  }
  return (
    <svg viewBox={`0 0 ${size * 10 + 20} ${size * 10 + 20}`} className="w-full h-full">
      <rect width="100%" height="100%" fill="white" rx="8" />
      {cells.map((row, y) =>
        row.map((cell, x) =>
          cell ? <rect key={`${x}-${y}`} x={x * 10 + 10} y={y * 10 + 10} width="8" height="8" fill="#0f172a" rx="1" /> : null
        )
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REUSABLE CARD COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.04]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-4 border-b border-white/[0.06] flex items-center gap-2.5">{children}</div>;
}
function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function DemoAirbnb({ onBack }: { onBack: () => void }) {
  const { speak, isSpeaking, stop } = useMaellisVoice();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AirbnbTab>('accueil');

  // ── Rubrique 1: Onboarding checklist ──
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { label: 'WiFi connecté', done: true },
    { label: 'Règles lues', done: true },
    { label: 'Tour de la villa', done: false },
    { label: 'Services consultés', done: false },
  ]);
  const [showConfetti, setShowConfetti] = useState(false);

  // ── Rubrique 4: Check-in steps ──
  const [checkInSteps, setCheckInSteps] = useState([true, true, false, false]);

  // ── Rubrique 5: Access tokens copy ──
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // ── Rubrique 9: Feedback ──
  const [starRating, setStarRating] = useState(0);
  const [sliderValues, setSliderValues] = useState({ propreté: 4, confort: 5, localisation: 5, rapport: 4 });
  const [feedbackComment, setFeedbackComment] = useState('');

  // ── Rubrique 10: Travel journal ──
  const [journalEntries, setJournalEntries] = useState(airbnbExtended.travelJournal.map(j => ({ ...j })));
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [newJournalMood, setNewJournalMood] = useState('😊');
  const [newJournalText, setNewJournalText] = useState('');
  const moods = ['😊', '😍', '🤩', '😎', '😌', '🥰', '🤔', '😢'];

  // ── Rubrique 11: Smart Review ──
  const [smartReviewActivities, setSmartReviewActivities] = useState([
    { label: 'Promenade des Anglais', done: true },
    { label: 'Restaurant La Petite Maison', done: true },
    { label: 'Musée Matisse', done: false },
    { label: 'Château de Nice & Parc', done: false },
    { label: 'Marché Cours Saleya', done: false },
  ]);
  const [generatedReview, setGeneratedReview] = useState('');
  const [editedReview, setEditedReview] = useState('');

  // ── Rubrique 12: Notifications filter ──
  const [notifFilter, setNotifFilter] = useState<'all' | 'messages' | 'rappels' | 'promos'>('all');

  // ── Rubrique 13: Settings ──
  const [settings, setSettings] = useState({
    nightMode: false,
    quietHours: true,
    language: 'Français',
    units: 'Métrique',
    volume: 70,
  });

  // ── Rubrique 8: Support ticket form ──
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');

  /* ── Loading skeleton ── */
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  /* ── Helpers ── */
  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  }, []);

  const toggleChecklistItem = useCallback((index: number) => {
    setChecklist(prev => {
      const next = prev.map((item, i) => (i === index ? { ...item, done: !item.done } : item));
      const allDone = next.every(item => item.done);
      if (allDone) {
        setTimeout(() => setShowConfetti(true), 300);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      return next;
    });
    const item = checklist[index];
    speak(`${item.label} : ${item.done ? 'non terminé' : 'terminé'}`);
  }, [checklist, speak]);

  const completedChecklist = checklist.filter(c => c.done).length;
  const checklistProgress = (completedChecklist / checklist.length) * 100;

  /* ── Tabs ── */
  const tabs: { key: AirbnbTab; label: string; emoji: string }[] = [
    { key: 'accueil', label: 'Accueil', emoji: '🏠' },
    { key: 'decouvrir', label: 'Découvrir', emoji: '🗺️' },
    { key: 'communiquer', label: 'Communiquer', emoji: '💬' },
    { key: 'monSejour', label: 'Mon Séjour', emoji: '⚙️' },
  ];

  const completedSteps = checkInSteps.filter(Boolean).length;

  /* ═══════════════════════════════════════════════════════════════
     LOADING SKELETON
     ═══════════════════════════════════════════════════════════════ */
  if (loading) {
    return (
      <DemoLayout title="Villa Azur" subtitle="Chargement..." accentColor="amber" onBack={onBack}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64 rounded-xl bg-white/[0.03]" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-28 rounded-xl bg-white/[0.03]" />)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl bg-white/[0.03]" />)}
          </div>
          <Skeleton className="h-48 rounded-2xl bg-white/[0.03]" />
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-2xl bg-white/[0.03]" />
            <Skeleton className="h-64 rounded-2xl bg-white/[0.03]" />
          </div>
          <Skeleton className="h-96 rounded-2xl bg-white/[0.03]" />
        </div>
      </DemoLayout>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <DemoLayout
      title={`Villa Azur — ${airbnbConfig.location}`}
      subtitle={`Voyageur : ${airbnbConfig.guest.name} | ${currentDemoTime.date}`}
      accentColor="amber"
      onBack={onBack}
    >
      {/* Confetti celebration overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🎉🎊✨</div>
              <div className="text-2xl font-serif font-bold text-white bg-black/60 backdrop-blur-xl px-8 py-4 rounded-2xl">
                Bienvenue Sophie ! Tout est prêt !
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab Bar ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === t.key
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.05]'
            }`}
          >
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════════════════
           TAB: ACCUEIL
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'accueil' && (
          <motion.div
            key="accueil"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* ─── 1. ONBOARDING VOYAGEUR ─── */}
            <Card onClick={() => speak(airbnbConfig.welcomeMessage)} className="hover:border-amber-500/20">
              <CardBody>
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-2xl">
                    🏠
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-serif font-semibold text-white mb-1">
                      Bienvenue {airbnbConfig.guest.name} !
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {airbnbConfig.welcomeMessage}
                    </p>
                  </div>
                </div>

                {/* Animated checklist */}
                <div className="space-y-2 mb-4">
                  {checklist.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={(e) => { e.stopPropagation(); toggleChecklistItem(i); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition group"
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        item.done
                          ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : 'border-amber-500/40 group-hover:border-amber-500/60'
                      }`}>
                        {item.done ? <Check className="w-3.5 h-3.5 text-white" /> : null}
                      </div>
                      <span className={`text-sm transition-all ${item.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {item.done ? '✅' : '☐'} {item.label}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Progression</span>
                    <span className="text-xs font-bold text-amber-400">{Math.round(checklistProgress)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${checklistProgress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-600">
                    {completedChecklist}/{checklist.length} étapes terminées
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* ─── 2. DASHBOARD SÉJOUR ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: CalendarCheck, label: 'Check-in', value: 'Sam. 7 juin', sub: '14h00', color: 'bg-emerald-500/10 border-emerald-500/20', speakText: 'Check-in samedi 7 juin à 14 heures' },
                { icon: CalendarX, label: 'Check-out', value: 'Dim. 8 juin', sub: '11h00', color: 'bg-rose-500/10 border-rose-500/20', speakText: 'Check-out dimanche 8 juin à 11 heures' },
                { icon: Moon, label: 'Durée', value: `${airbnbExtended.staySummary.nights}`, sub: 'nuit', color: 'bg-violet-500/10 border-violet-500/20', speakText: `Durée du séjour : ${airbnbExtended.staySummary.nights} nuit` },
                { icon: Star, label: 'Note', value: `${airbnbExtended.staySummary.rating}`, sub: 'sur 5 étoiles', color: 'bg-amber-500/10 border-amber-500/20', speakText: `Note moyenne : ${airbnbExtended.staySummary.rating} sur 5 étoiles` },
              ].map((item, i) => (
                <Card
                  key={i}
                  onClick={() => speak(item.speakText)}
                  className="hover:border-white/[0.15]"
                >
                  <CardBody className="text-center py-4">
                    <div className={`w-10 h-10 rounded-xl ${item.color} border flex items-center justify-center mx-auto mb-2`}>
                      <item.icon className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="text-xl font-bold text-white">{item.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
                    <div className="text-[10px] text-slate-600 mt-1">{item.label}</div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Weather card for Nice */}
            <Card
              onClick={() => speak(`Météo à Nice : ${airbnbConfig.weather.temp}, ${airbnbConfig.weather.condition}. Humidité ${airbnbConfig.weather.humidity}, vent ${airbnbConfig.weather.wind}.`)}
              className="hover:border-amber-500/20"
            >
              <CardBody className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{airbnbConfig.weather.icon}</span>
                  <div>
                    <p className="text-3xl font-bold text-white">{airbnbConfig.weather.temp}</p>
                    <p className="text-xs text-slate-400">{airbnbConfig.weather.condition} · Nice</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 bg-white/[0.02] p-3 rounded-xl">
                  <span className="flex items-center gap-1"><CloudRain className="w-3 h-3" />{airbnbConfig.weather.humidity}</span>
                  <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{airbnbConfig.weather.wind}</span>
                </div>
              </CardBody>
            </Card>

            {/* ─── 4. CHECK-IN / CHECK-OUT STEPPER ─── */}
            <Card>
              <CardHeader>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Check-in Progression</span>
                <span className="ml-auto text-[10px] text-amber-400 font-medium">{completedSteps}/4</span>
              </CardHeader>
              <CardBody>
                <div className="relative mb-2">
                  {/* Progress line */}
                  <div className="absolute top-5 left-6 right-6 h-0.5 bg-white/[0.06]" />
                  <div
                    className="absolute top-5 left-6 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-500"
                    style={{ width: `${((completedSteps - 1) / 3) * 100}%` }}
                  />
                  {/* Steps */}
                  <div className="relative flex justify-between">
                    {[
                      { label: 'Scanner le QR', desc: 'Code scanné' },
                      { label: 'Code portail', desc: 'Code: 4827' },
                      { label: 'Explorer', desc: 'En cours...' },
                      { label: 'Profiter !', desc: '' },
                    ].map((step, i) => (
                      <div
                        key={step.label}
                        onClick={() => speak(`Étape ${i + 1} : ${step.label}. ${checkInSteps[i] ? 'Terminé.' : step.desc}`)}
                        className="flex flex-col items-center gap-2 cursor-pointer group"
                      >
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                            checkInSteps[i]
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              : i === completedSteps
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                              : 'bg-white/[0.03] border-white/[0.1] text-slate-600 group-hover:border-white/[0.2]'
                          }`}
                        >
                          {checkInSteps[i] ? '✓' : i + 1}
                        </motion.div>
                        <div className="text-center">
                          <span className={`text-[10px] font-medium ${checkInSteps[i] ? 'text-emerald-400' : i === completedSteps ? 'text-amber-400' : 'text-slate-600'}`}>
                            {step.label}
                          </span>
                          {checkInSteps[i] && step.desc && (
                            <p className="text-[9px] text-slate-600 mt-0.5">{step.desc}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Step 3 action */}
                {!checkInSteps[2] && (
                  <motion.button
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      setCheckInSteps(prev => [true, true, true, false]);
                      speak('Étape 3 validée ! Explorez la villa. Plus qu\'une étape !');
                    }}
                    className="w-full mt-3 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-sm font-medium hover:bg-amber-500/25 transition flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" /> Valider l&apos;exploration
                  </motion.button>
                )}
              </CardBody>
            </Card>

            {/* ─── 15. QR CODE VIRAL (PROMINENT) ─── */}
            <Card className="relative overflow-visible border-amber-500/10">
              {/* Glow background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-orange-500/[0.04] pointer-events-none rounded-2xl" />
              <CardBody className="relative text-center py-8">
                {/* Viral badge */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Viral
                  </span>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/25 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                    Scan & Continue
                  </span>
                </div>

                <h3 className="text-2xl font-serif font-bold text-white mb-2">
                  Continuez sur votre mobile !
                </h3>
                <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                  Scannez pour emporter Maellis dans votre poche
                </p>

                {/* QR Code with pulsing glow */}
                <div className="relative inline-block mb-6">
                  {/* Pulsing outer glow */}
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(245,158,11,0.15), 0 0 60px rgba(245,158,11,0.05)',
                        '0 0 40px rgba(245,158,11,0.25), 0 0 100px rgba(245,158,11,0.1)',
                        '0 0 20px rgba(245,158,11,0.15), 0 0 60px rgba(245,158,11,0.05)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -inset-8 bg-amber-500/10 rounded-3xl blur-xl"
                  />
                  {/* Inner glow */}
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-2xl"
                  />
                  {/* QR code */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    onClick={() => speak('QR Code Maellis. Scannez avec votre téléphone pour continuer l\'expérience sur mobile. Compatible iOS et Android.')}
                    className="relative bg-white p-6 rounded-2xl shadow-2xl shadow-amber-500/10 inline-block cursor-pointer"
                  >
                    <div className="w-52 h-52 sm:w-60 sm:h-60">
                      <QRCodeDisplay size={13} />
                    </div>
                  </motion.div>
                </div>

                {/* Compatibility info */}
                <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">📱</span> Compatible iOS & Android
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 mt-2">QR Code Maellis — Villa Azur</p>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB: DÉCOUVRIR
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'decouvrir' && (
          <motion.div
            key="decouvrir"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* ─── 3. GUIDE LOCAL / POI ─── */}
            <Card>
              <CardHeader>
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Guide Local</span>
                <span className="ml-auto text-[10px] text-slate-500">{airbnbExtended.localPOIs.length} lieux</span>
              </CardHeader>
              <div className="divide-y divide-white/[0.04]">
                {airbnbExtended.localPOIs.map((poi, i) => {
                  const catColors: Record<string, string> = {
                    Plage: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                    Restaurant: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    Pharmacie: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    Musée: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
                    Marché: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                  };
                  return (
                    <motion.div
                      key={i}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => speak(`${poi.name}, ${poi.category}, à ${poi.distance}. ${poi.description}. Note : ${poi.rating} sur 5.`)}
                      className="p-4 hover:bg-white/[0.03] cursor-pointer transition group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                              {poi.name}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${catColors[poi.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                              {poi.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mb-2 leading-relaxed">{poi.description}</p>
                          <div className="flex items-center gap-4 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{poi.distance}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />{poi.rating}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition mt-1" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>

            {/* ─── 7. ACTIVITÉS PARTENAIRES ─── */}
            <Card>
              <CardHeader>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Activités Partenaires</span>
                <span className="ml-auto text-[10px] text-amber-400 font-medium">
                  {airbnbConfig.activities.filter(a => a.isPartner).length} partenaires
                </span>
              </CardHeader>
              <div className="divide-y divide-white/[0.04]">
                {airbnbConfig.activities.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => speak(`${a.name}, ${a.description}. Durée : ${a.duration}. Distance : ${a.distance}.`)}
                    className="p-4 hover:bg-white/[0.03] cursor-pointer transition group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-sm font-semibold text-white">{a.name}</h4>
                          {a.isPartner && (
                            <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/25 rounded-full text-[10px] font-bold text-amber-400 flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-amber-400" /> Partenaire
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded-full text-[10px] text-slate-400">
                            {a.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{a.description}</p>
                        <div className="flex items-center gap-4 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.distance}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.duration}</span>
                        </div>
                      </div>
                      {a.whatsappLink && (
                        <a
                          href={a.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition flex items-center gap-1 flex-shrink-0"
                        >
                          <MessageCircle className="w-3 h-3" /> Réserver via WhatsApp
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* ─── 10. JOURNAL DE VOYAGE ─── */}
            <Card>
              <CardHeader>
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Journal de Voyage</span>
                <span className="ml-auto text-[10px] text-slate-500">{journalEntries.length} entrées</span>
              </CardHeader>

              {/* Timeline entries */}
              <div className="relative px-4 pb-2">
                {/* Timeline line */}
                <div className="absolute left-7 top-4 bottom-4 w-px bg-white/[0.06]" />

                {journalEntries.map((j, i) => (
                  <motion.div
                    key={j.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => speak(`${j.day} : ${j.title}. ${j.content}`)}
                    className="relative flex gap-4 mb-4 cursor-pointer group"
                  >
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                      </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition group-hover:border group-hover:border-white/[0.08]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[10px] text-blue-400 font-medium">
                          {j.day}
                        </span>
                        <span className="text-lg">{j.mood}</span>
                      </div>
                      <h4 className="text-sm font-medium text-white mb-1">{j.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{j.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add entry button / form */}
              <CardBody>
                {!showJournalForm ? (
                  <button
                    onClick={() => { setShowJournalForm(true); speak('Ajoutez une nouvelle entrée dans votre journal de voyage.'); }}
                    className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-400 hover:bg-white/[0.06] transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Ajouter une entrée
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    {/* Mood selector */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Comment vous sentez-vous ?</p>
                      <div className="flex gap-2 flex-wrap">
                        {moods.map(m => (
                          <button
                            key={m}
                            onClick={() => setNewJournalMood(m)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                              newJournalMood === m
                                ? 'bg-amber-500/20 border-2 border-amber-500/40 scale-110'
                                : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Textarea */}
                    <textarea
                      value={newJournalText}
                      onChange={e => setNewJournalText(e.target.value)}
                      placeholder="Décrivez votre moment..."
                      rows={3}
                      className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 outline-none resize-none focus:border-amber-500/30"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (newJournalText.trim()) {
                            const newEntry = {
                              id: `j${journalEntries.length + 1}`,
                              day: 'Jour 2',
                              title: newJournalText.trim().substring(0, 30),
                              content: newJournalText.trim(),
                              mood: newJournalMood,
                            };
                            setJournalEntries(prev => [...prev, newEntry]);
                            setNewJournalText('');
                            setShowJournalForm(false);
                            speak('Entrée ajoutée au journal de voyage !');
                          }
                        }}
                        className="flex-1 py-2 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-sm font-medium hover:bg-amber-500/25 transition"
                      >
                        Publier
                      </button>
                      <button
                        onClick={() => { setShowJournalForm(false); setNewJournalText(''); }}
                        className="px-4 py-2 rounded-xl bg-white/[0.04] text-slate-500 text-sm hover:bg-white/[0.06] transition"
                      >
                        Annuler
                      </button>
                    </div>
                  </motion.div>
                )}
              </CardBody>
            </Card>

            {/* ─── 11. SMART REVIEW ─── */}
            <Card className="border-violet-500/10">
              <CardHeader>
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-white">Smart Review IA</span>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-violet-500/15 text-[10px] font-bold text-violet-400">IA</span>
              </CardHeader>
              <CardBody className="space-y-4">
                <p className="text-xs text-slate-500">
                  Sélectionnez les activités effectuées et laissez l&apos;IA générer votre avis.
                </p>

                {/* Activity checkboxes */}
                <div className="space-y-2">
                  {smartReviewActivities.map((act, i) => (
                    <div
                      key={act.label}
                      onClick={() => {
                        setSmartReviewActivities(prev => prev.map((a, idx) => idx === i ? { ...a, done: !a.done } : a));
                        speak(`${act.label} ${act.done ? 'retiré' : 'sélectionné'}`);
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition"
                    >
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                        act.done ? 'bg-violet-500 border-violet-500' : 'border-slate-600'
                      }`}>
                        {act.done && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${act.done ? 'text-slate-200' : 'text-slate-500'}`}>
                        {act.label} {act.done ? '✅' : '☐'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Generate button or result */}
                {!generatedReview ? (
                  <button
                    onClick={() => {
                      const doneActs = smartReviewActivities.filter(a => a.done).map(a => a.label);
                      const review = `Séjour magnifique à la Villa Azur à Nice ! ${doneActs.length > 0 ? `J'ai particulièrement apprécié ${doneActs.join(' et ')}.` : ''} L'accueil d'Isabelle était chaleureux et la villa est exactement conforme aux photos. Emplacement idéal pour découvrir la Côte d'Azur. Je recommande vivement ce logement pour un séjour relaxant et authentique !`;
                      setGeneratedReview(review);
                      setEditedReview(review);
                      speak(review);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500/15 to-purple-500/15 border border-violet-500/25 text-violet-400 text-sm font-medium flex items-center justify-center gap-2 hover:from-violet-500/25 hover:to-purple-500/25 transition"
                  >
                    <Sparkles className="w-4 h-4" /> Générer mon avis
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                      <textarea
                        value={editedReview}
                        onChange={e => setEditedReview(e.target.value)}
                        rows={5}
                        className="w-full bg-transparent text-sm text-slate-300 italic leading-relaxed outline-none resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { copyToClipboard(editedReview, 'review'); speak('Avis copié dans le presse-papiers.'); }}
                        className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-xs text-slate-400 flex items-center justify-center gap-1.5 hover:bg-white/[0.06] transition"
                      >
                        {copiedToken === 'review' ? <><Check className="w-3 h-3 text-emerald-400" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
                      </button>
                      <button
                        onClick={() => speak('Avis publié sur Google avec succès ! Merci Sophie.')}
                        className="flex-1 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-center justify-center gap-1.5 hover:bg-blue-500/20 transition"
                      >
                        <Star className="w-3 h-3" /> Publier sur Google
                      </button>
                    </div>
                  </motion.div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB: COMMUNIQUER
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'communiquer' && (
          <motion.div
            key="communiquer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* ─── 6. CONTACT HÔTE ─── */}
            <Card>
              <CardHeader>
                <MessageCircle className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-semibold text-white">Contacter {airbnbConfig.hostName}</span>
                <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> En ligne
                </span>
              </CardHeader>
              <CardBody className="space-y-3">
                {/* Chat messages */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {/* Message 1: Sophie */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">
                      S
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-300">{airbnbConfig.guest.name}</span>
                        <span className="text-[10px] text-slate-600">14h30</span>
                      </div>
                      <div className="p-3 rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06] max-w-[85%]">
                        <p className="text-sm text-slate-300">
                          Bonjour Isabelle ! Merci pour l&apos;accueil, tout est parfait. On a hâte de profiter de la villa ! 🏖️
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message 2: Isabelle */}
                  <div className="flex items-start gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0">
                      I
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-[10px] text-slate-600">14h35</span>
                        <span className="text-xs font-medium text-slate-300">{airbnbConfig.hostName}</span>
                      </div>
                      <div className="p-3 rounded-2xl rounded-tr-sm bg-amber-500/[0.08] border border-amber-500/10 max-w-[85%]">
                        <p className="text-sm text-slate-300">
                          Avec plaisir Sophie ! 😊 N&apos;hésitez pas si vous avez besoin de quoi que ce soit. Le restaurant La Petite Maison est génial, il est à 5 min !
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message 3: Sophie */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">
                      S
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-300">{airbnbConfig.guest.name}</span>
                        <span className="text-[10px] text-slate-600">14h42</span>
                      </div>
                      <div className="p-3 rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06] max-w-[85%]">
                        <p className="text-sm text-slate-300">
                          Super, on va essayer ce soir ! Merci pour la recommandation 🙌
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input area */}
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <input
                    disabled
                    placeholder="Écrire un message..."
                    className="flex-1 bg-transparent text-sm text-slate-500 placeholder-slate-600 outline-none px-2"
                  />
                  <button className="p-2 rounded-lg bg-white/[0.04] text-slate-500 hover:bg-white/[0.08] transition">
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* WhatsApp button */}
                <a
                  href={`https://wa.me/33612345678?text=Bonjour, je suis ${airbnbConfig.guest.name}, votre invitée à la Villa Azur.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => speak(`Contacter ${airbnbConfig.hostName} via WhatsApp.`)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition"
                >
                  <Phone className="w-4 h-4" /> Contacter {airbnbConfig.hostName}
                  <ChevronRight className="w-4 h-4" />
                </a>
              </CardBody>
            </Card>

            {/* ─── 8. TICKETS SUPPORT ─── */}
            <Card>
              <CardHeader>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Tickets Support</span>
                <span className="ml-auto text-[10px] text-amber-400 font-medium">
                  {airbnbExtended.supportTickets.filter(t => t.status === 'open').length} ouvert(s)
                </span>
              </CardHeader>

              {/* Existing tickets */}
              <div className="divide-y divide-white/[0.04]">
                {airbnbExtended.supportTickets.map(t => (
                  <div
                    key={t.id}
                    onClick={() => speak(`Ticket : ${t.subject}. ${t.description}. Statut : ${t.status === 'open' ? 'en cours' : 'résolu'}.`)}
                    className="p-4 hover:bg-white/[0.02] cursor-pointer transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-white">{t.subject}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            t.status === 'open'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {t.status === 'open' ? '🟡 Ouvert' : '✅ Résolu'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{t.description}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{t.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Create ticket section */}
              <CardBody>
                {!showTicketForm ? (
                  <button
                    onClick={() => { setShowTicketForm(true); speak('Formulaire de création de ticket. Choisissez un sujet et décrivez votre problème.'); }}
                    className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-400 hover:bg-white/[0.06] transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Créer un ticket
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Sujet</p>
                      <select
                        value={ticketSubject}
                        onChange={e => setTicketSubject(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-amber-500/30 appearance-none"
                      >
                        <option value="">Sélectionnez un sujet</option>
                        <option value="electrique">Problème électrique</option>
                        <option value="serviettes">Manque serviettes</option>
                        <option value="clim">Climatisation</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Description</p>
                      <textarea
                        value={ticketDesc}
                        onChange={e => setTicketDesc(e.target.value)}
                        placeholder="Décrivez votre problème..."
                        rows={3}
                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 outline-none resize-none focus:border-amber-500/30"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (ticketSubject && ticketDesc) {
                            speak('Ticket envoyé avec succès ! Notre équipe va vous répondre rapidement.');
                            setShowTicketForm(false);
                            setTicketSubject('');
                            setTicketDesc('');
                          } else {
                            speak('Veuillez remplir tous les champs du formulaire.');
                          }
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-sm font-medium hover:bg-amber-500/25 transition flex items-center justify-center gap-2"
                      >
                        <Send className="w-3 h-3" /> Envoyer
                      </button>
                      <button
                        onClick={() => { setShowTicketForm(false); setTicketSubject(''); setTicketDesc(''); }}
                        className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-slate-500 text-sm hover:bg-white/[0.06] transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </CardBody>
            </Card>

            {/* ─── 12. NOTIFICATIONS ─── */}
            <Card>
              <CardHeader>
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Notifications</span>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-400">
                  {airbnbExtended.stayNotifications.length} nouvelles
                </span>
              </CardHeader>

              {/* Filter tabs */}
              <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto">
                {[
                  { key: 'all' as const, label: 'Toutes' },
                  { key: 'messages' as const, label: 'Messages' },
                  { key: 'rappels' as const, label: 'Rappels' },
                  { key: 'promos' as const, label: 'Promos' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setNotifFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap ${
                      notifFilter === f.key
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.05]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Notification list */}
              <div className="divide-y divide-white/[0.04] max-h-72 overflow-y-auto">
                {airbnbExtended.stayNotifications
                  .filter(n => {
                    if (notifFilter === 'all') return true;
                    if (notifFilter === 'messages') return n.id === 'sn1';
                    if (notifFilter === 'rappels') return n.id === 'sn2';
                    if (notifFilter === 'promos') return n.id === 'sn3';
                    return true;
                  })
                  .map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => speak(`${n.title}. ${n.message}`)}
                      className="p-4 hover:bg-white/[0.02] cursor-pointer transition flex items-start gap-3"
                    >
                      <div className="relative flex-shrink-0">
                        <span className="text-xl">{n.icon}</span>
                        {i < 2 && (
                          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-[#020617]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-white">{n.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{n.time}</p>
                      </div>
                      <Eye className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />
                    </motion.div>
                  ))}
              </div>
            </Card>

            {/* ─── 9. FEEDBACK POST-SÉJOUR ─── */}
            <Card>
              <CardHeader>
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Votre Avis</span>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-400">
                  Important
                </span>
              </CardHeader>
              <CardBody className="space-y-5">
                {/* Global star rating */}
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-3">Note globale</p>
                  <div className="flex items-center justify-center gap-3">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        onClick={() => { setStarRating(s); speak(`${s} étoile${s > 1 ? 's' : ''} sur 5`); }}
                        className="transition-transform hover:scale-125 active:scale-95"
                      >
                        <Star className={`w-9 h-9 transition-colors ${s <= starRating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                      </button>
                    ))}
                  </div>
                  {starRating > 0 && (
                    <p className="text-xs text-amber-400/70 mt-2">
                      {starRating === 5 ? 'Parfait ! 🎉' : starRating === 4 ? 'Très bien ! 😊' : starRating === 3 ? 'Correct 👍' : 'Peut mieux faire'}
                    </p>
                  )}
                </div>

                {/* Dimension sliders */}
                <div className="space-y-4">
                  {Object.entries(sliderValues).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400 capitalize">{key}</span>
                        <span className="text-xs font-bold text-amber-400">{value}/5</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            onClick={() => {
                              setSliderValues(prev => ({ ...prev, [key]: s }));
                              speak(`${key} : ${s} sur 5`);
                            }}
                            className="flex-1 h-2.5 rounded-full transition-all"
                          >
                            <div className={`h-full rounded-full transition-all ${s <= value ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-white/[0.06]'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment textarea */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Commentaire</p>
                  <textarea
                    value={feedbackComment}
                    onChange={e => setFeedbackComment(e.target.value)}
                    placeholder="Partagez votre expérience..."
                    rows={3}
                    className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 outline-none resize-none focus:border-amber-500/30"
                  />
                </div>

                {/* Photo upload placeholder + Submit */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => speak('Ajout de photo. Fonctionnalité simulée dans cette démo.')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-500 hover:bg-white/[0.06] transition"
                  >
                    <ImageIcon className="w-4 h-4" /> Photo
                  </button>
                  <button
                    onClick={() => {
                      if (starRating > 0) {
                        speak(`Merci Sophie ! Votre avis de ${starRating} étoiles a été enregistré avec succès. Merci de votre retour !`);
                      } else {
                        speak('Veuillez sélectionner une note avant de soumettre votre avis.');
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/25 text-amber-400 text-sm font-medium hover:from-amber-500/25 hover:to-orange-500/25 transition flex items-center justify-center gap-2"
                  >
                    <ThumbsUp className="w-4 h-4" /> Soumettre mon avis
                  </button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB: MON SÉJOUR
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'monSejour' && (
          <motion.div
            key="monSejour"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* ─── 5. JETONS D'ACCÈS ─── */}
            <Card>
              <CardHeader>
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Jetons d&apos;Accès</span>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400">Sécurisé</span>
              </CardHeader>
              <div className="divide-y divide-white/[0.04]">
                {airbnbExtended.accessTokens.map((token, i) => (
                  <div
                    key={i}
                    onClick={() => speak(`${token.label} : ${token.value}`)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                        <span className="text-xl">{token.icon}</span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">{token.label}</p>
                        <p className="text-sm font-mono text-white font-medium">{token.value}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(token.value, token.label);
                        speak(`${token.label} copié : ${token.value}`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        copiedToken === token.label
                          ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400'
                          : 'bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:bg-white/[0.08]'
                      }`}
                    >
                      {copiedToken === token.label ? (
                        <><Check className="w-3 h-3" /> Copié !</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copier</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* ─── 13. PARAMÈTRES SÉJOUR ─── */}
            <Card>
              <CardHeader>
                <Settings className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-white">Paramètres Séjour</span>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Toggle: Mode nuit */}
                <div
                  onClick={() => {
                    setSettings(prev => ({ ...prev, nightMode: !prev.nightMode }));
                    speak(`Mode nuit ${!settings.nightMode ? 'activé' : 'désactivé'}.`);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Mode nuit</span>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-all relative ${settings.nightMode ? 'bg-amber-500' : 'bg-white/[0.1]'}`}>
                    <motion.div
                      animate={{ x: settings.nightMode ? 20 : 2 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                    />
                  </div>
                </div>

                {/* Toggle: Heures silencieuses */}
                <div
                  onClick={() => {
                    setSettings(prev => ({ ...prev, quietHours: !prev.quietHours }));
                    speak(`Heures silencieuses ${!settings.quietHours ? 'activées' : 'désactivées'}. De 22 heures à 8 heures.`);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-sm text-slate-300">Heures silencieuses</span>
                      <p className="text-[10px] text-slate-600">22h - 08h</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-all relative ${settings.quietHours ? 'bg-amber-500' : 'bg-white/[0.1]'}`}>
                    <motion.div
                      animate={{ x: settings.quietHours ? 20 : 2 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                    />
                  </div>
                </div>

                {/* Dropdown: Langue */}
                <div
                  onClick={() => speak(`Langue : ${settings.language}. Choix entre Français et English.`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Langue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{settings.language}</span>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                  </div>
                </div>

                {/* Dropdown: Unités */}
                <div
                  onClick={() => speak(`Unités : ${settings.units}. Choix entre Métrique et Impérial.`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Unités</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{settings.units}</span>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                  </div>
                </div>

                {/* Volume slider */}
                <div className="p-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">Volume</span>
                    </div>
                    <span className="text-sm font-bold text-amber-400">{settings.volume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.volume}
                    onChange={e => setSettings(prev => ({ ...prev, volume: parseInt(e.target.value) }))}
                    onClick={() => speak(`Volume réglé à ${settings.volume} pourcent.`)}
                    className="w-full h-2 rounded-full bg-white/[0.06] appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </CardBody>
            </Card>

            {/* ─── 14. FACTURATION SÉJOUR ─── */}
            <Card>
              <CardHeader>
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Facturation Séjour</span>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400">Payé</span>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Invoice items */}
                <div className="space-y-3">
                  {[
                    { label: 'Nuit(s)', value: airbnbExtended.billingStay.nights, icon: Moon },
                    { label: 'Ménage', value: airbnbExtended.billingStay.cleaning, icon: Sparkles },
                    { label: 'Extras', value: airbnbExtended.billingStay.extras, icon: Plus },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-400">{item.label}</span>
                      </div>
                      <span className="text-sm text-slate-300 font-medium">{item.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/[0.08] pt-3 flex items-center justify-between">
                    <span className="text-base font-semibold text-white">Total</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                      {airbnbExtended.billingStay.total}
                    </span>
                  </div>
                </div>

                {/* Payment method */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Mode de paiement</p>
                      <p className="text-sm text-slate-300">•••• •••• •••• 4242</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600">Visa</span>
                </div>

                {/* Download button */}
                <button
                  onClick={() => speak(`Facture téléchargée. Total : ${airbnbExtended.billingStay.total}. 1 nuit, ménage 25 euros.`)}
                  className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-400 hover:bg-white/[0.06] transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Télécharger la facture
                </button>
              </CardBody>
            </Card>

            {/* ─── VOICE ASSISTANT MAELLIS ─── */}
            <Card className="bg-gradient-to-br from-amber-500/[0.03] to-orange-500/[0.02] border-amber-500/10">
              <CardBody className="text-center py-8">
                <h3 className="text-xl font-serif font-semibold text-white mb-2">Assistant Maellis</h3>
                <p className="text-xs text-slate-500 mb-6">
                  {isSpeaking ? '🔴 Je parle...' : '🎤 Appuyez pour interagir'}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isSpeaking) {
                      stop();
                    } else {
                      speak(
                        `Bonjour ${airbnbConfig.guest.name} ! Je suis Maellis, votre assistant de séjour à la Villa Azur. Je peux vous aider avec la météo, les activités à proximité, les codes d'accès, ou contacter Isabelle. Comment puis-je vous aider ?`
                      );
                    }
                  }}
                  className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
                    isSpeaking
                      ? 'bg-red-500 animate-pulse scale-110 shadow-red-500/20'
                      : 'bg-gradient-to-br from-amber-500 to-orange-600 hover:shadow-amber-500/30'
                  }`}
                >
                  {isSpeaking ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
                </motion.button>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {['☀️ Météo', '📍 Activités', '🔑 Codes', '📞 Isabelle', '⭐ Avis'].map(cmd => (
                    <button
                      key={cmd}
                      onClick={() => speak(cmd.replace(/[^\w\sàâäéèêëïîôùûüç]/g, '').trim())}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] text-slate-400 cursor-pointer hover:bg-white/[0.08] transition"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </DemoLayout>
  );
}
