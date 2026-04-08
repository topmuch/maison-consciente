'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, CloudRain, Wind, Thermometer, Newspaper, Star, Bell,
  ShoppingCart, Utensils, HelpCircle, Mic, MicOff, Shield,
  Heart, MessageSquare, Lock, Eye, EyeOff, Music, Play,
  Pause, Volume2, VolumeX, Wifi, QrCode, CheckCircle2,
  Circle, Send, Filter, ChevronDown, ChevronRight, Plus,
  Monitor, BarChart3, Zap, Activity, Moon,
} from 'lucide-react';
import { DemoLayout } from './DemoLayout';
import { useMaellisVoice } from '@/hooks/useMaellisVoice';
import {
  familleConfig, newsItems, horoscopeData, currentDemoTime,
  familyWallMessages, healthData, wellnessData, recipesDetailed,
  notifications, analyticsData, billingData,
} from '@/lib/mock-data-real';

/* ═══════════════════════════════════════════
   DEMO PARTICULIER — 15 RUBRIQUES COMPLÈTES
   ═══════════════════════════════════════════ */
interface Props { onBack: () => void }

type Tab = 'accueil' | 'bienetre' | 'outils' | 'params';

export function DemoParticulier({ onBack }: Props) {
  const { speak, isSpeaking } = useMaellisVoice();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('accueil');
  const [horoscopeSign, setHoroscopeSign] = useState('taureau');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [vaultRevealed, setVaultRevealed] = useState<Record<string, boolean>>({});
  const [groceries, setGroceries] = useState<Record<string, boolean>>({});
  const [mood, setMood] = useState(wellnessData.mood);
  const [rituals, setRituals] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(wellnessData.rituals.map((r) => [r.id, r.completed]))
  );
  const [ambiancePlaying, setAmbiancePlaying] = useState<string | null>('a2');
  const [onboardChecks, setOnboardChecks] = useState([true, true, false, false]);
  const [notifFilter, setNotifFilter] = useState('all');
  const [billingModules, setBillingModules] = useState<Record<string, boolean>>(
    Object.fromEntries(billingData.modules.map((m) => [m.name, m.active]))
  );
  const [tabletWidgets, setTabletWidgets] = useState<Record<string, boolean>>({
    meteo: true, courses: true, messages: true, recettes: true,
  });
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [msgInput, setMsgInput] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportDesc, setSupportDesc] = useState('');
  const [supportSent, setSupportSent] = useState(false);
  const [currentStep, setCurrentStep] = useState(2);
  const [recipeOpen, setRecipeOpen] = useState<string | null>(null);
  const [stepsDone, setStepsDone] = useState<Record<string, boolean>>({});
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1200); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!ambiancePlaying) return;
    const t = setInterval(() => { setBreathPhase((p) => p === 'inhale' ? 'exhale' : 'inhale'); }, 3000);
    return () => clearInterval(t);
  }, [ambiancePlaying]);

  // Init groceries
  useEffect(() => {
    const g: Record<string, boolean> = {};
    familleConfig.shoppingList.forEach((i) => { g[i] = false; });
    setGroceries(g);
  }, []);

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleMic = () => {
    if (isSpeaking) return;
    const commands = [
      "Maellis, mets l'ambiance forêt tropicale",
      "Ajoute du lait aux courses",
      "Quelle est la météo ?",
    ];
    const responses = [
      "C'est fait ! Ambiance forêt tropicale activée. 🌴",
      "Lait demi-écrémé ajouté à votre liste de courses. 🛒",
      `Il fait ${familleConfig.weather.temp} et ${familleConfig.weather.condition.toLowerCase()} à ${familleConfig.weather.city}. ☀️`,
    ];
    const idx = Math.floor(Math.random() * commands.length);
    setVoiceTranscript(commands[idx]);
    speak(commands[idx]);
    setTimeout(() => { setVoiceTranscript(responses[idx]); }, 2500);
  };

  const filteredNotifs = notifications.filter((n) => {
    if (notifFilter === 'unread') return !n.read;
    if (notifFilter === 'health') return n.type === 'health';
    if (notifFilter === 'weather') return n.type === 'weather';
    return true;
  });

  const filteredFaq = familleConfig.faq.filter(
    (f) => faqSearch === '' || f.question.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const onboardProgress = onboardChecks.filter(Boolean).length;

  // ── LOADING ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div className="flex gap-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-9 w-24 rounded-xl bg-white/[0.04] animate-pulse" />)}</div>
          <div className="h-32 w-full rounded-2xl bg-white/[0.04] animate-pulse" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-52 rounded-2xl bg-white/[0.04] animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Sun }[] = [
    { key: 'accueil', label: 'Accueil', icon: Sun },
    { key: 'bienetre', label: 'Bien-Être', icon: Heart },
    { key: 'outils', label: 'Outils', icon: Utensils },
    { key: 'params', label: 'Paramètres', icon: Zap },
  ];

  // ── QR DATA (pre-computed) ──
  const qrCells = (() => {
    const s = 8; const seed = 'MartinFamily2024'; const out: boolean[] = [];
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const corner = (x < 2 && y < 2) || (x >= s - 2 && y < 2) || (x < 2 && y >= s - 2);
      const border = x === 0 || x === s - 1 || y === 0 || y === s - 1;
      const center = x === 4 && y === 4;
      const pr = (((seed.charCodeAt((y * s + x) % seed.length) || 7) * 31 + x * 17 + y * 13) % 5) > 2;
      out.push(corner || border || center || pr);
    }
    return out;
  })();

  return (
    <DemoLayout title={`Bonjour Paul ! 👋`} subtitle={`${currentDemoTime.date} — Famille Martin`} accentColor="blue" onBack={onBack}>
      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${tab === t.key ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:bg-white/[0.06]'}`}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ═════════════════ TAB: ACCUEIL ═══════════════ */}
        {tab === 'accueil' && (
          <motion.div key="accueil" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">

            {/* [1] Auth Profil + [2] QR Zone */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card title="👤 Profil connecté">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">P</div>
                  <div>
                    <p className="text-sm font-semibold text-white">Paul Martin</p>
                    <p className="text-xs text-slate-500">Enfant • Famille Martin</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Connecté</div>
                </div>
                <div className="space-y-2">
                  {familleConfig.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2.5 text-xs text-slate-400">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-[10px] font-bold`}>{m.avatar}</div>
                      <span>{m.name}</span>
                      <span className="ml-auto text-slate-600">{m.role}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="🏷️ Accès Famille">
                <div className="flex flex-col items-center text-center">
                  <div className="w-28 h-28 p-2 bg-white rounded-2xl mb-3"><svg viewBox="0 0 100 100" className="w-full h-full"><rect width="100%" height="100%" fill="white" rx="4" />{qrCells.map((c, i) => c ? <rect key={i} x={(i % 8) * 10 + 10} y={Math.floor(i / 8) * 10 + 10} width="8" height="8" fill="#1e293b" rx="1" /> : null)}</svg></div>
                  <p className="text-xs text-slate-400 mb-2">Réseau : MartinFamily</p>
                  <button onClick={() => speak("Code d'accès invité généré. Partagez ce QR code à vos proches.")} className="px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 hover:bg-indigo-500/30 transition">Générer accès invité</button>
                </div>
              </Card>
            </div>

            {/* Weather */}
            <div onClick={() => speak(`Il fait ${familleConfig.weather.temp} et ${familleConfig.weather.condition.toLowerCase()} à ${familleConfig.weather.city}. Humidité ${familleConfig.weather.humidity}.`)} className="cursor-pointer hover:scale-[1.005] transition-transform">
              <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{familleConfig.weather.icon}</span>
                  <div>
                    <p className="text-2xl font-bold text-white">{familleConfig.weather.temp}</p>
                    <p className="text-xs text-slate-400">{familleConfig.weather.condition} • {familleConfig.weather.city}</p>
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-500 space-y-0.5">
                  <p>💧 {familleConfig.weather.humidity}</p>
                  <p>🌅 {currentDemoTime.sunrise}</p>
                  <p>🌇 {currentDemoTime.sunset}</p>
                </div>
                <span className="text-[10px] text-blue-400">🔊</span>
              </div>
            </div>

            {/* [3] Mur Familial */}
            <Card title="💬 Mur Familial">
              <div className="space-y-3 mb-3">
                {familyWallMessages.map((m) => (
                  <div key={m.id} className={`p-3 rounded-xl border ${m.type === 'alert' ? 'bg-amber-500/5 border-amber-500/20' : m.type === 'reminder' ? 'bg-purple-500/5 border-purple-500/20' : 'bg-white/[0.02] border-white/[0.06]'}`} onClick={() => speak(`${m.author} dit : ${m.text}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{m.avatar}</span>
                      <span className="text-xs font-semibold text-white">{m.author}</span>
                      <span className="text-[10px] text-slate-600 ml-auto">{m.time}</span>
                    </div>
                    <p className="text-xs text-slate-300">{m.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={msgInput} onChange={(e) => setMsgInput(e.target.value)} placeholder="Écrire un message..." className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/30" />
                <button className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition"><Send size={14} /></button>
              </div>
            </Card>

            {/* [4] Recettes Avancées + [6] Coffre-Fort */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card title="🍳 Recettes du jour">
                <div className="space-y-2">
                  {recipesDetailed.map((r) => (
                    <div key={r.id} className="border border-white/[0.06] rounded-xl overflow-hidden">
                      <button onClick={() => { setRecipeOpen(recipeOpen === r.id ? null : r.id); speak(`${r.name}. Temps de préparation : ${r.time}. Pour ${r.servings} personnes. Ingrédients : ${r.ingredients.slice(0, 3).join(', ')}, et plus.`); }} className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] transition text-left">
                        <span className="text-xl">{r.image}</span>
                        <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-white">{r.name}</p><p className="text-[10px] text-slate-500">{r.time} • {r.difficulty} • {r.servings} pers.</p></div>
                        <ChevronDown size={14} className={`text-slate-500 transition ${recipeOpen === r.id ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {recipeOpen === r.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-3 pb-3 border-t border-white/[0.06] pt-2">
                              <p className="text-[10px] font-semibold text-indigo-400 mb-1">Ingrédients</p>
                              <p className="text-[10px] text-slate-400 mb-2">{r.ingredients.join(' • ')}</p>
                              <p className="text-[10px] font-semibold text-indigo-400 mb-1">Étapes</p>
                              {r.steps.map((s, i) => <p key={i} className="text-[10px] text-slate-400">{i + 1}. {s}</p>)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="🔒 Coffre-Fort Numérique">
                <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-amber-400" /><span className="text-xs text-amber-400 font-medium">Chiffrement AES-256</span></div>
                <div className="space-y-2">
                  {[
                    { id: 'docs', label: 'Documents importants', icon: '📄', value: 'Passeport, Carte d\'identité, Livret de famille' },
                    { id: 'insurance', label: 'Assurances habitation', icon: '🛡️', value: 'AXA N°4829-XXXX — Échéance 15/09/2025' },
                    { id: 'wifi-hidden', label: 'Codes WiFi cachés', icon: '📶', value: 'MartinFamily / Martin2024!' },
                  ].map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2"><span>{item.icon}</span><span className="text-xs font-medium text-white">{item.label}</span></div>
                        <button onClick={() => { setVaultRevealed((p) => ({ ...p, [item.id]: !p[item.id] })); speak(vaultRevealed[item.id] ? `${item.label} masqué.` : `${item.label} : ${item.value}`); }} className="text-slate-500 hover:text-amber-400 transition">{vaultRevealed[item.id] ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                      </div>
                      <AnimatePresence>{vaultRevealed[item.id] && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[10px] text-amber-400/80 overflow-hidden">{item.value}</motion.p>}</AnimatePresence>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* [5] Courses Intelligentes */}
            <Card title="🛒 Liste de courses intelligente">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500">{familleConfig.shoppingList.length} articles</span>
                <span className="text-xs font-semibold text-emerald-400">≈ 23,50€</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {familleConfig.shoppingList.map((item) => (
                  <button key={item} onClick={() => { setGroceries((g) => ({ ...g, [item]: !g[item] })); speak(groceries[item] ? `${item} retiré de la liste.` : `${item} ajouté à la liste.`); }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition ${groceries[item] ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 line-through' : 'bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.06]'}`}>
                    {item}
                  </button>
                ))}
              </div>
              <button onClick={() => speak('Livraison commandée ! Vous recevrez vos courses dans environ 45 minutes.')} className="w-full py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30 hover:bg-emerald-500/30 transition">🚚 Commander la livraison</button>
            </Card>

            {/* Horoscope + News (compact) */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card title="⭐ Horoscope">
                <div className="flex flex-wrap gap-1 mb-3">{Object.entries(horoscopeData).slice(0, 6).map(([k, h]) => (
                  <button key={k} onClick={() => setHoroscopeSign(k)} className={`px-2 py-1 rounded-lg text-[10px] ${horoscopeSign === k ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'}`}>
                    {h.icon} {h.signe}
                  </button>
                ))}</div>
                {(() => { const h = horoscopeData[horoscopeSign]; if (!h) return null; return (
                  <div onClick={() => speak(`Horoscope du ${h.signe}. ${h.humeur}. ${h.conseil}`)} className="cursor-pointer space-y-2">
                    <p className="text-xs text-slate-300 italic">&ldquo;{h.humeur}&rdquo;</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div><span className="text-pink-400">Amour:</span> <span className="text-slate-400">{h.amour.slice(0, 50)}…</span></div>
                      <div><span className="text-blue-400">Travail:</span> <span className="text-slate-400">{h.travail.slice(0, 50)}…</span></div>
                    </div>
                    <span className="text-[10px] text-indigo-400">🔊 Écouter l'horoscope complet</span>
                  </div>
                ); })()}
              </Card>

              <Card title="📰 Actualités">
                {newsItems.slice(0, 3).map((n) => (
                  <div key={n.id} onClick={() => speak(`${n.source}. ${n.title}`)} className="p-2.5 hover:bg-white/[0.02] rounded-lg cursor-pointer transition border-b border-white/[0.04] last:border-0">
                    <div className="text-[10px] font-bold text-blue-400 mb-0.5">{n.source}</div>
                    <p className="text-xs text-slate-300 leading-snug">{n.title}</p>
                  </div>
                ))}
              </Card>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ TAB: BIEN-ÊTRE ═══════════════ */}
        {tab === 'bienetre' && (
          <motion.div key="bienetre" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">

            {/* [7] Santé */}
            <Card title="❤️ Santé & Bien-Être">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {healthData.vitals.map((v) => (
                  <div key={v.label} onClick={() => speak(`${v.label} : ${v.value} ${v.unit}. ${v.status === 'normal' || v.status === 'good' ? 'Normal.' : 'Attention requise.'}`)} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center cursor-pointer hover:bg-white/[0.04] transition">
                    <span className="text-lg">{v.icon}</span>
                    <p className="text-lg font-bold text-white mt-1">{v.value}</p>
                    <p className="text-[10px] text-slate-500">{v.label} {v.unit}</p>
                    <span className={`text-[10px] font-medium ${v.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>{v.status === 'normal' || v.status === 'good' ? 'Normal' : 'Attention'}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
                <span>{healthData.airQuality.icon}</span>
                <span className="text-xs text-emerald-300">Qualité air : {healthData.airQuality.level} (AQI {healthData.airQuality.aqi})</span>
              </div>
              <p className="text-xs font-semibold text-white mb-2">💊 Médicaments</p>
              <div className="space-y-2 mb-3">
                {healthData.reminders.map((r) => (
                  <div key={r.id} className="flex items-center gap-2.5 text-xs">
                    <button onClick={() => speak(r.done ? `${r.name} marqué comme non pris.` : `${r.name} pris. ${r.dose}, ${r.frequency}.`)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition flex-shrink-0 ${r.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-indigo-500/50'}`}>{r.done && <CheckCircle2 className="w-3 h-3 text-white" />}</button>
                    <span className={`flex-1 ${r.done ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{r.name}</span>
                    <span className="text-slate-500">{r.dose}</span>
                    <span className="text-slate-600">{r.time}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => speak('Alerte médicale envoyée. Les contacts d\'urgence sont prévenus.')} className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 text-xs font-semibold border border-red-500/30 hover:from-red-500/30 hover:to-rose-500/30 transition flex items-center justify-center gap-2"><Shield size={14} /> SOS Urgence Médicale</button>
            </Card>

            {/* [8] Bien-Être */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Mood */}
              <Card title="😊 Humeur du jour">
                <div className="flex items-center justify-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} onClick={() => { setMood(v); speak(`Humeur enregistrée : ${v} sur 5.`); }} className={`text-2xl transition hover:scale-125 ${v <= mood ? 'grayscale-0' : 'grayscale opacity-30'}`}>
                      {v <= 2 ? '😢' : v <= 3 ? '😐' : v <= 4 ? '😊' : '🤩'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 text-center">Cliquez pour enregistrer</p>
              </Card>

              {/* Mood History */}
              <Card title="📊 Historique semaine">
                <div className="flex items-end justify-between gap-1 h-16">
                  {wellnessData.moodHistory.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t" style={{ height: `${d.value * 24}px`, background: `linear-gradient(to top, rgba(99,102,241,0.3), rgba(139,92,246,${d.value / 5}))` }} />
                      <span className="text-[9px] text-slate-500">{d.day}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Rituals */}
              <Card title="🧘 Rituels quotidiens">
                <div className="space-y-2">
                  {wellnessData.rituals.map((r) => (
                    <button key={r.id} onClick={() => { setRituals((p) => ({ ...p, [r.id]: !p[r.id] })); speak(p[r.id] ? `${r.name} annulé.` : `${r.name} terminé ! Bravo.`); }} className="flex items-center gap-2.5 w-full p-2.5 rounded-xl hover:bg-white/[0.02] transition text-left">
                      {rituals[r.id] ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />}
                      <span className="text-sm">{r.icon}</span>
                      <span className={`text-xs ${rituals[r.id] ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{r.name}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Breathing */}
              <Card title="🌬️ Respiration guidée">
                <p className="text-xs text-slate-400 mb-2">{wellnessData.breathingExercise.name} — {wellnessData.breathingExercise.duration}</p>
                <div className="flex justify-center mb-2">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-[3000ms] ${breathPhase === 'inhale' ? 'bg-indigo-500/20 border-2 border-indigo-500/40 text-indigo-300 scale-110' : 'bg-white/[0.03] border-2 border-white/[0.08] text-slate-500 scale-90'}`}>
                    {breathPhase === 'inhale' ? 'Inspirez' : 'Expirez'}
                  </div>
                </div>
                <button onClick={() => { setAmbiancePlaying(ambiancePlaying ? null : 'breath'); speak("Exercice de cohérence cardiaque lancé. Inspirez pendant 5 secondes, expirez pendant 5 secondes."); }} className={`w-full py-2 rounded-xl text-xs font-medium transition ${ambiancePlaying === 'breath' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}`}>
                  {ambiancePlaying === 'breath' ? '⏹ Arrêter' : '▶ Démarrer'}
                </button>
              </Card>
            </div>

            {/* [11] Audio & Ambiance */}
            <Card title="🎵 Audio & Ambiance">
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ambiancePlaying ? 'bg-indigo-500/30' : 'bg-white/[0.05]'} transition`}>{ambiancePlaying ? <Pause size={18} className="text-indigo-300" /> : <Play size={18} className="text-slate-400" />}</div>
                <div className="flex-1"><p className="text-xs font-semibold text-white">{wellnessData.ambiances.find((a) => a.id === ambiancePlaying)?.name || 'Aucune ambiance'}</p><div className="w-full h-1 bg-white/[0.06] rounded-full mt-1"><div className="h-full w-3/5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" /></div></div>
                <Volume2 size={14} className="text-slate-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {wellnessData.ambiances.map((a) => (
                  <button key={a.id} onClick={() => { setAmbiancePlaying(ambiancePlaying === a.id ? null : a.id); speak(ambiancePlaying === a.id ? `${a.name} arrêté.` : `${a.name} en cours de lecture.`); }}
                    className={`p-3 rounded-xl text-center transition ${ambiancePlaying === a.id ? 'bg-indigo-500/15 border border-indigo-500/30' : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05]'}`}>
                    <span className="text-xl block mb-1">{a.icon}</span>
                    <span className="text-[10px] text-slate-400">{a.name}</span>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ═══════════════ TAB: OUTILS ═══════════════ */}
        {tab === 'outils' && (
          <motion.div key="outils" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">

            {/* [9] Base de connaissances */}
            <Card title="❓ Base de connaissances">
              <div className="flex gap-2 mb-3">
                <input value={faqSearch} onChange={(e) => setFaqSearch(e.target.value)} placeholder="🔍 Rechercher..." className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/30" />
              </div>
              <div className="space-y-1.5">
                {filteredFaq.map((faq, i) => (
                  <div key={i} className="border border-white/[0.06] rounded-xl overflow-hidden">
                    <button onClick={() => { setSelectedFaq(selectedFaq === i ? null : i); speak(`${faq.question}. ${faq.answer}`); }} className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition text-left">
                      <span className="text-xs font-medium text-slate-200">{faq.question}</span>
                      <ChevronDown size={14} className={`text-slate-500 transition ${selectedFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>{selectedFaq === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 pb-3 border-t border-white/[0.04]"><p className="text-[10px] text-slate-400 pt-2">{faq.answer}</p></motion.div>}</AnimatePresence>
                  </div>
                ))}
              </div>
            </Card>

            {/* [10] Voix 28 Intents */}
            <Card title="🎤 Assistant Vocal Maellis">
              <div className="flex flex-col items-center text-center mb-4">
                <button onClick={handleMic} disabled={isSpeaking} className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all mb-3 ${isSpeaking ? 'bg-red-500 animate-pulse scale-110' : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-105'}`}>
                  {isSpeaking ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
                <p className="text-xs text-slate-500">{isSpeaking ? 'Je parle...' : 'Appuyez pour parler'}</p>
              </div>
              {voiceTranscript && (
                <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-start gap-2"><div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5"><MessageSquare size={10} className="text-blue-400" /></div><p className="text-xs text-slate-300">{voiceTranscript}</p></div>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Météo', 'Actualités', 'Horoscope', 'Recettes', 'Courses', 'Timer', 'Calcul', 'Rappels', 'Ambiance'].map((c) => (
                  <span key={c} className="px-2 py-1 rounded-lg text-[10px] bg-white/[0.03] border border-white/[0.06] text-slate-500">{c}</span>
                ))}
              </div>
            </Card>

            {/* [12] Notifications */}
            <Card title={`🔔 Notifications (${notifications.filter((n) => !n.read).length} non lues)`}>
              <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
                {[{ k: 'all', l: 'Toutes' }, { k: 'unread', l: 'Non lues' }, { k: 'health', l: 'Santé' }, { k: 'weather', l: 'Météo' }].map((f) => (
                  <button key={f.k} onClick={() => setNotifFilter(f.k)} className={`px-3 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition ${notifFilter === f.k ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06]'}`}>{f.l}</button>
                ))}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {filteredNotifs.map((n) => (
                  <div key={n.id} onClick={() => speak(`${n.title}. ${n.message}`)} className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-white/[0.02] transition cursor-pointer">
                    <span className="text-sm">{n.icon}</span>
                    <div className="flex-1 min-w-0"><p className="text-xs font-medium text-white">{n.title}</p><p className="text-[10px] text-slate-500">{n.message}</p></div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0"><span className="text-[9px] text-slate-600">{n.time}</span>{!n.read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}</div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ═══════════════ TAB: PARAMÈTRES ═══════════════ */}
        {tab === 'params' && (
          <motion.div key="params" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">

            {/* [13] Facturation */}
            <Card title="💳 Abonnement">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-3">
                <div><p className="text-sm font-bold text-white">{billingData.plan.name}</p><p className="text-xs text-indigo-300">{billingData.plan.price}</p></div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">{billingData.plan.status}</span>
              </div>
              <p className="text-xs font-semibold text-white mb-2">Modules complémentaires</p>
              <div className="space-y-2 mb-3">
                {billingData.modules.map((m) => (
                  <div key={m.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div><p className="text-xs text-slate-200">{m.name}</p><p className="text-[10px] text-amber-400">{m.price}</p></div>
                    <button onClick={() => { setBillingModules((p) => ({ ...p, [m.name]: !p[m.name] })); }} className={`w-10 h-5 rounded-full transition relative ${billingModules[m.name] ? 'bg-indigo-500' : 'bg-slate-700'}`}><div className={`absolute top-0.5 ${billingModules[m.name] ? 'left-5' : 'left-0.5'} w-4 h-4 rounded-full bg-white transition-all`} /></button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 p-2.5 rounded-xl bg-white/[0.02]">
                <span>Prochaine facture : {billingData.nextInvoice.date}</span>
                <span className="font-semibold text-white">{billingData.nextInvoice.amount}</span>
              </div>
              <button className="w-full mt-2 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 hover:bg-indigo-500/30 transition">Gérer mon abonnement</button>
            </Card>

            {/* [14] Tablette Mode */}
            <Card title="📱 Mode Tablette">
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Monitor className="w-5 h-5 text-emerald-400" /><span className="text-xs font-semibold text-emerald-300">Mode Tablette Activé</span>
                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs font-semibold text-white mb-2">Affichage</p>
              <div className="flex gap-2 mb-3">
                {[{ k: 'kiosk', l: 'Kiosk' }, { k: 'standard', l: 'Standard' }].map((o) => (
                  <button key={o.k} className={`flex-1 py-2 rounded-xl text-xs font-medium transition text-center ${o.k === 'standard' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06]'}`}>{o.l}</button>
                ))}
              </div>
              <p className="text-xs font-semibold text-white mb-2">Widgets visibles</p>
              <div className="space-y-2">
                {Object.entries(tabletWidgets).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 capitalize">{k}</span>
                    <button onClick={() => setTabletWidgets((p) => ({ ...p, [k]: !p[k] }))} className={`w-10 h-5 rounded-full transition relative ${v ? 'bg-indigo-500' : 'bg-slate-700'}`}><div className={`absolute top-0.5 ${v ? 'left-5' : 'left-0.5'} w-4 h-4 rounded-full bg-white transition-all`} /></button>
                  </div>
                ))}
              </div>
            </Card>

            {/* [15] Analytics */}
            <Card title="📊 Analytics Famille">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <p className="text-lg font-bold text-white">{analyticsData.screenTime.today}</p>
                  <p className="text-[10px] text-slate-500">Écran aujourd&apos;hui</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <p className="text-lg font-bold text-white">{analyticsData.screenTime.week}</p>
                  <p className="text-[10px] text-slate-500">Cette semaine</p>
                </div>
              </div>
              <p className="text-xs font-semibold text-white mb-2">Activités préférées</p>
              <div className="space-y-1.5 mb-4">
                {analyticsData.topActivities.map((a) => (
                  <div key={a.name} className="flex items-center gap-2">
                    <span className="text-sm">{a.icon}</span>
                    <span className="text-xs text-slate-300 flex-1">{a.name}</span>
                    <div className="w-20 h-2 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${(a.count / 24) * 100}%` }} /></div>
                    <span className="text-[10px] text-slate-500 w-5 text-right">{a.count}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-lg font-bold text-emerald-400">{analyticsData.energySaved}</p>
                  <p className="text-[10px] text-emerald-300/70">Économies d&apos;énergie</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                  <p className="text-lg font-bold text-indigo-400">{analyticsData.screenTime.trend}</p>
                  <p className="text-[10px] text-indigo-300/70">Tendance utilisation</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </DemoLayout>
  );
}

/* ── Reusable Card ── */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
