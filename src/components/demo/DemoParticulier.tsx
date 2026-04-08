'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, CloudRain, Wind, Thermometer, Newspaper, Star, Bell, ShoppingCart,
  Utensils, HelpCircle, Mic, MicOff, Heart, MessageSquare, Lock,
  ShieldAlert, QrCode, Wifi, Users, CheckCircle, Circle, ChevronDown,
  ChevronUp, Sparkles, Volume2, Settings, Monitor, BarChart3,
  Battery, Moon, Activity, AlertCircle, Music, Wind as WindIcon,
} from 'lucide-react';
import { DemoLayout } from './DemoLayout';
import { useMaellisVoice } from '@/hooks/useMaellisVoice';
import {
  familleConfig, newsItems, horoscopeData, horoscopeSigns, currentDemoTime,
  familyWallMessages, healthData, wellnessData, recipesDetailed,
  notifications, analyticsData, billingData,
} from '@/lib/mock-data-real';

type TabKey = 'home' | 'news' | 'cuisine' | 'wellness' | 'more';

function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}>{children}</div>;
}
function CardH({ children }: { children: React.ReactNode }) { return <div className="p-4 border-b border-white/[0.06] flex items-center gap-2">{children}</div>; }
function CardB({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <div className={`p-4 ${className}`}>{children}</div>; }

export function DemoParticulier({ onBack }: { onBack: () => void }) {
  const { speak, isSpeaking } = useMaellisVoice();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('home');
  const [selectedSign, setSelectedSign] = useState('taureau');
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [rituals, setRituals] = useState(wellnessData.rituals.map(r => ({ ...r })));
  const [ambiances, setAmbiances] = useState(wellnessData.ambiances.map(a => ({ ...a })));
  const [mood, setMood] = useState(wellnessData.mood);
  const [checklist, setChecklist] = useState([true, true, false]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1200); return () => clearTimeout(t); }, []);

  const copy = (text: string, id: string) => { navigator.clipboard.writeText(text).catch(() => {}); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };

  if (loading) return (
    <div className="min-h-screen bg-slate-950"><div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="h-8 w-40 rounded-xl bg-white/[0.03] animate-pulse" />
      <div className="flex gap-2">{[1,2,3,4,5].map(i=><div key={i} className="h-10 w-20 rounded-xl bg-white/[0.03] animate-pulse" />)}</div>
      <div className="grid md:grid-cols-2 gap-6">{[1,2].map(i=><div key={i} className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />)}</div>
    </div></div>
  );

  const tabs: { key: TabKey; label: string; emoji: string }[] = [
    { key: 'home', label: 'Accueil', emoji: '🏠' }, { key: 'news', label: 'News & Horoscope', emoji: '📰' },
    { key: 'cuisine', label: 'Cuisine', emoji: '🍳' }, { key: 'wellness', label: 'Bien-Être', emoji: '🧘' },
    { key: 'more', label: 'Plus', emoji: '⚙️' },
  ];

  return (
    <DemoLayout title={`Bonjour Paul ! 👋`} subtitle={`${currentDemoTime.date} — Famille Martin`} accentColor="blue" onBack={onBack}>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${tab === t.key ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.05]'}`}>
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════ ACCUEIL ═══════ */}
        {tab === 'home' && (
          <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Profile + Weather */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* 1. Profile */}
              <Card onClick={() => speak('Paul Martin, connecté depuis aujourd\'hui à 8h15. Membre de la famille Martin.')} className="hover:border-blue-500/20 transition">
                <CardB className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/20">P</div>
                  <div className="flex-1"><h3 className="text-base font-semibold text-white">Paul Martin</h3><p className="text-xs text-slate-500">Enfant · Famille Martin</p>
                    <div className="flex items-center gap-1.5 mt-1"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[10px] text-emerald-400 font-medium">Connecté</span></div>
                  </div>
                  <div className="text-right"><p className="text-[10px] text-slate-600">Dernière connexion</p><p className="text-xs text-slate-400">Aujourd&apos;hui 08h15</p></div>
                </CardB>
              </Card>

              {/* 2. Zones & QR */}
              <Card onClick={() => speak('Zone Salon. QR code d\'accès famille Martin. Générez un accès invité pour permettre à un proche d\'utiliser la tablette.')} className="hover:border-cyan-500/20 transition">
                <CardB className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center"><QrCode className="w-6 h-6 text-cyan-400" /></div>
                  <div className="flex-1"><h3 className="text-base font-semibold text-white">Accès Famille</h3><p className="text-xs text-slate-500">QR Code actif · 4 zones configurées</p></div>
                  <button onClick={(e) => { e.stopPropagation(); speak('Accès invité généré avec succès.'); }}
                    className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition">+ Invité</button>
                </CardB>
              </Card>
            </div>

            {/* Weather */}
            <Card onClick={() => speak(`Météo : ${familleConfig.weather.temp}, ${familleConfig.weather.condition} à ${familleConfig.weather.city}. Humidité ${familleConfig.weather.humidity}. Vent ${familleConfig.weather.wind}.`)} className="cursor-pointer hover:border-amber-500/20 transition">
              <CardB className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{familleConfig.weather.icon}</span>
                  <div><p className="text-3xl font-bold text-white">{familleConfig.weather.temp}</p><p className="text-xs text-slate-400">{familleConfig.weather.condition} · {familleConfig.weather.city}</p></div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 bg-white/[0.02] p-2 rounded-xl">
                  <span className="flex items-center gap-1"><CloudRain className="w-3 h-3" />{familleConfig.weather.humidity}</span>
                  <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{familleConfig.weather.wind}</span>
                </div>
              </CardB>
            </Card>

            {/* 3. Mur Familial */}
            <Card>
              <CardH><Users className="w-4 h-4 text-blue-400" /><span className="text-sm font-semibold text-white">Mur Familial</span><span className="ml-auto text-[10px] text-slate-500">{familyWallMessages.length} messages</span></CardH>
              <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
                {familyWallMessages.map((m, i) => (
                  <div key={m.id} onClick={() => speak(`${m.author} dit : ${m.text}`)} className="p-3 hover:bg-white/[0.02] cursor-pointer transition">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{m.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="text-xs font-medium text-slate-300">{m.author}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${m.type === 'alert' ? 'bg-amber-500/10 text-amber-400' : m.type === 'reminder' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>{m.type}</span>
                          <span className="text-[10px] text-slate-600 ml-auto">{m.time}</span></div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Rappels + Courses */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* 4. Rappels */}
              <Card>
                <CardH><Bell className="w-4 h-4 text-blue-400" /><span className="text-sm font-semibold text-white">Rappels</span></CardH>
                <div className="divide-y divide-white/[0.04]">
                  {familleConfig.reminders.map(r => (
                    <div key={r.id} className="p-3 flex items-center gap-3 hover:bg-white/[0.02] cursor-pointer" onClick={() => speak(`${r.label}. ${r.done ? 'Terminé.' : 'À faire.'}`)}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${r.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>{r.done && <CheckCircle className="w-3 h-3 text-white" />}</div>
                      <span className="text-lg">{r.icon}</span>
                      <div className="flex-1"><p className={`text-sm ${r.done ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{r.label}</p></div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{r.time}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 5. Courses */}
              <Card>
                <CardH><ShoppingCart className="w-4 h-4 text-emerald-400" /><span className="text-sm font-semibold text-white">Courses</span><span className="ml-auto text-[10px] text-slate-500">{familleConfig.shoppingList.length} articles · ~15€</span></CardH>
                <CardB>
                  <div className="flex flex-wrap gap-1.5 mb-3">{familleConfig.shoppingList.map((item, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-400">{item}</span>
                  ))}</div>
                  <button onClick={() => speak(`Liste de courses : ${familleConfig.shoppingList.join(', ')}. Estimation 15 euros.`)} className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition">🛒 Commander livraison</button>
                </CardB>
              </Card>
            </div>

            {/* 6. Coffre-Fort */}
            <Card onClick={() => speak('Coffre-fort numérique. Contient : Documents importants, Assurances maison, Codes WiFi cachés. Accès sécurisé par chiffrement AES 256.')} className="hover:border-violet-500/20 transition">
              <CardB className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center"><Lock className="w-5 h-5 text-violet-400" /></div>
                <div className="flex-1"><h3 className="text-sm font-semibold text-white">Coffre-Fort Numérique</h3><p className="text-xs text-slate-500">3 entrées sécurisées · AES-256</p></div>
                <div className="text-right space-y-1"><p className="text-[10px] text-slate-500">📄 Documents</p><p className="text-[10px] text-slate-500">🛡️ Assurances</p><p className="text-[10px] text-slate-500">📶 Codes WiFi</p></div>
              </CardB>
            </Card>

            {/* 7. Santé Quick */}
            <Card>
              <CardH><ShieldAlert className="w-4 h-4 text-rose-400" /><span className="text-sm font-semibold text-white">Santé</span><span className="ml-auto text-[10px] text-slate-500">Voir détails →</span></CardH>
              <CardB>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {healthData.vitals.slice(0, 3).map(v => (
                    <div key={v.label} onClick={() => speak(`${v.label} : ${v.value} ${v.unit}.`)} className="text-center p-2 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition">
                      <span className="text-xl">{v.icon}</span><p className="text-sm font-bold text-white mt-1">{v.value}</p><p className="text-[9px] text-slate-500">{v.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><span>{healthData.airQuality.icon}</span><span className="text-xs text-slate-400">AQI {healthData.airQuality.aqi} · {healthData.airQuality.level}</span></div>
                  <button onClick={() => speak('Alerte médicale activée. Composition du 15 en cours.')} className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[10px] font-medium">SOS</button>
                </div>
              </CardB>
            </Card>
          </motion.div>
        )}

        {/* ═══════ NEWS & HOROSCOPE ═══════ */}
        {tab === 'news' && (
          <motion.div key="news" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* 8. Actualités */}
            <Card>
              <CardH><Newspaper className="w-4 h-4 text-blue-400" /><span className="text-sm font-semibold text-white">Actualités</span></CardH>
              <div className="divide-y divide-white/[0.04] max-h-80 overflow-y-auto">
                {newsItems.map(n => (
                  <div key={n.id} onClick={() => speak(`${n.source}. ${n.title}`)} className="p-4 hover:bg-white/[0.02] cursor-pointer transition group">
                    <div className="flex items-start gap-3">
                      <span className={`min-w-[70px] text-center text-[10px] font-bold px-2 py-1 rounded ${n.source === 'France Info' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>{n.source}</span>
                      <div className="flex-1"><p className="text-sm text-slate-300 group-hover:text-white transition leading-snug">{n.title}</p>
                        <div className="flex items-center gap-2 mt-1"><span className="text-[10px] text-slate-600 bg-white/[0.03] px-1.5 py-0.5 rounded">{n.category}</span><span className="text-[10px] text-slate-600">{n.time}</span></div></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 9. Horoscope */}
            <Card>
              <CardH><Star className="w-4 h-4 text-violet-400" /><span className="text-sm font-semibold text-white">Horoscope</span></CardH>
              <CardB>
                <div className="flex flex-wrap gap-1.5 mb-4">{horoscopeSigns.map(key => {
                  const h = horoscopeData[key];
                  return h ? <button key={key} onClick={() => setSelectedSign(key)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedSign === key ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:border-violet-500/20'}`}>{h.icon} {h.signe}</button> : null;
                })}</div>
                {(() => { const h = horoscopeData[selectedSign]; if (!h) return null; return (
                  <div onClick={() => speak(`Horoscope ${h.signe}. Humeur : ${h.humeur}. Amour : ${h.amour}. Travail : ${h.travail}. Conseil : ${h.conseil}.`)} className="space-y-3 cursor-pointer">
                    <div className="text-center mb-2"><span className="text-3xl">{h.icon}</span><p className="text-lg font-serif text-white mt-1">{h.signe}</p><p className="text-[10px] text-slate-500">{h.periode}</p></div>
                    {[{ l: 'Humeur', t: h.humeur, c: 'text-violet-400', i: Heart }, { l: 'Amour', t: h.amour, c: 'text-pink-400', i: MessageSquare }, { l: 'Travail', t: h.travail, c: 'text-blue-400', i: Star }, { l: 'Argent', t: h.argent, c: 'text-emerald-400', i: Sparkles }, { l: 'Conseil', t: h.conseil, c: 'text-amber-400', i: HelpCircle }].map(s => (
                      <div key={s.l} className="p-3 rounded-xl bg-white/[0.02]"><div className="flex items-center gap-1.5 mb-1"><s.i className="w-3 h-3" /><span className="text-[10px] font-bold text-slate-500 uppercase">{s.l}</span></div><p className="text-xs text-slate-400 italic">{s.t}</p></div>
                    ))}
                    <div className="pt-2 border-t border-white/[0.04]"><p className="text-xs text-slate-500 leading-relaxed">{h.texte}</p></div>
                  </div>
                ); })()}
              </CardB>
            </Card>
          </motion.div>
        )}

        {/* ═══════ CUISINE ═══════ */}
        {tab === 'cuisine' && (
          <motion.div key="cuisine" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <p className="text-xs text-slate-500 mb-2">Cliquez sur une recette pour voir les détails et les étapes.</p>
            {recipesDetailed.map(r => (
              <Card key={r.id} className="hover:border-orange-500/20 transition">
                <div className="p-4 flex items-center gap-4" onClick={() => { setExpandedRecipe(expandedRecipe === r.id ? null : r.id); speak(`${r.name}. ${r.time}. ${r.difficulty}. Pour ${r.servings} personnes.`); }}>
                  <span className="text-3xl">{r.image}</span>
                  <div className="flex-1"><h3 className="text-sm font-semibold text-white">{r.name}</h3><p className="text-xs text-slate-500">{r.time} · {r.difficulty} · {r.servings} pers.</p></div>
                  {expandedRecipe === r.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
                {expandedRecipe === r.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-white/[0.06] p-4 space-y-4">
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ingrédients</p><div className="flex flex-wrap gap-1.5">{r.ingredients.map((ing, i) => <span key={i} onClick={() => speak(ing)} className="px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 cursor-pointer hover:bg-white/[0.05]">{ing}</span>)}</div></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Étapes</p><div className="space-y-2">{r.steps.map((step, i) => <div key={i} onClick={() => speak(`Étape ${i + 1} : ${step}`)} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition"><span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span><p className="text-xs text-slate-400">{step}</p></div>)}</div></div>
                    <button onClick={() => speak(`Mode pas à pas activé pour ${r.name}. Je vais lire chaque étape.`)} className="w-full py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium flex items-center justify-center gap-2"><Volume2 className="w-3 h-3" /> Pas à Pas vocal</button>
                  </motion.div>
                )}
              </Card>
            ))}
          </motion.div>
        )}

        {/* ═══════ BIEN-ÊTRE ═══════ */}
        {tab === 'wellness' && (
          <motion.div key="wellness" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* 11. Santé Dashboard */}
            <Card>
              <CardH><ShieldAlert className="w-4 h-4 text-rose-400" /><span className="text-sm font-semibold text-white">Santé</span></CardH>
              <CardB>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {healthData.vitals.map(v => (
                    <div key={v.label} onClick={() => speak(`${v.label} : ${v.value} ${v.unit}`)} className="text-center p-3 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition">
                      <span className="text-2xl">{v.icon}</span><p className="text-lg font-bold text-white mt-1">{v.value}</p><p className="text-[9px] text-slate-500">{v.label} {v.unit}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-semibold text-slate-400 mb-2">💊 Médicaments</p>
                <div className="space-y-2 mb-4">
                  {healthData.reminders.map(med => (
                    <div key={med.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                      <div className={`w-4 h-4 rounded border ${med.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`} />
                      <div className="flex-1"><p className={`text-xs ${med.done ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{med.name}</p><p className="text-[10px] text-slate-600">{med.dose} · {med.frequency}</p></div>
                      <span className="text-[10px] text-slate-500">{med.time}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center gap-2"><span>{healthData.airQuality.icon}</span><div><p className="text-xs text-slate-300">Qualité de l&apos;air</p><p className="text-[10px] text-slate-500">AQI {healthData.airQuality.aqi} · {healthData.airQuality.level}</p></div></div>
                  <button onClick={() => speak('Alerte urgences médicales activée. Appel du 15 en cours.')} className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500/20 to-red-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold">🚨 SOS Médical</button>
                </div>
              </CardB>
            </Card>

            {/* 12. Bien-Être */}
            <Card>
              <CardH><Heart className="w-4 h-4 text-pink-400" /><span className="text-sm font-semibold text-white">Bien-Être</span></CardH>
              <CardB className="space-y-4">
                {/* Mood */}
                <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Humeur du jour</p>
                  <div className="flex items-center gap-1">{[1,2,3,4,5].map(v => <button key={v} onClick={() => { setMood(v); speak(`Humeur réglée à ${v} sur 5.`); }} className="transition hover:scale-125"><Heart className={`w-7 h-7 ${v <= mood ? 'text-pink-400 fill-pink-400' : 'text-slate-700'}`} /></button>)}</div>
                  <div className="flex items-end gap-1 mt-2 h-8">{wellnessData.moodHistory.map(d => <div key={d.day} className="flex-1 flex flex-col items-center gap-1"><span className="text-[8px] text-slate-600">{d.day}</span><div className="w-full rounded bg-slate-800 relative" style={{ height: '24px' }}><div className="absolute bottom-0 w-full rounded bg-pink-500/40 transition-all" style={{ height: `${(d.value / 5) * 100}%` }} /></div></div>)}</div>
                </div>
                {/* Rituels */}
                <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Rituels quotidiens</p>
                  <div className="space-y-2">{rituals.map((r, i) => (
                    <div key={r.id} onClick={() => { const nr = [...rituals]; nr[i] = { ...r, completed: !r.completed }; setRituals(nr); speak(`${r.name} ${!r.completed ? 'terminé' : 'à faire'}.`); }} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${r.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>{r.completed && <CheckCircle className="w-3 h-3 text-white" />}</div>
                      <span className="text-lg">{r.icon}</span><span className={`text-sm ${r.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{r.name}</span>
                    </div>
                  ))}</div>
                </div>
                {/* Audio */}
                <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ambiance Sonore</p>
                  <div className="grid grid-cols-2 gap-2">{ambiances.map((a, i) => (
                    <div key={a.id} onClick={() => { const na = [...ambiances]; na.forEach((x, j) => na[j] = { ...x, playing: j === i }); setAmbiances(na); speak(a.playing ? `${a.name} arrêté.` : `${a.name} en lecture.`); }} className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition ${a.playing ? 'bg-violet-500/10 border border-violet-500/25' : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]'}`}>
                      <span className="text-lg">{a.icon}</span><span className="text-xs text-slate-300">{a.name}</span>{a.playing && <span className="ml-auto w-2 h-2 rounded-full bg-violet-400 animate-pulse" />}
                    </div>
                  ))}</div>
                </div>
                {/* Breathing */}
                <div className="text-center p-4 rounded-xl bg-violet-500/5 border border-violet-500/10" onClick={() => speak(`Exercice de respiration : ${wellnessData.breathingExercise.name}. Inspirez 5 secondes, expirez 5 secondes. Durée ${wellnessData.breathingExercise.duration}.`)}>
                  <p className="text-xs text-violet-400 font-medium mb-1">🫁 Cohérence Cardiaque</p>
                  <div className="w-16 h-16 mx-auto rounded-full border-2 border-violet-500/30 flex items-center justify-center animate-pulse" style={{ animationDuration: '4s' }}>
                    <Activity className="w-6 h-6 text-violet-400" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">{wellnessData.breathingExercise.duration} · Inspirez/Expirez {wellnessData.breathingExercise.inhale}s</p>
                </div>
              </CardB>
            </Card>
          </motion.div>
        )}

        {/* ═══════ PLUS ═══════ */}
        {tab === 'more' && (
          <motion.div key="more" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* 13. FAQ */}
            <Card>
              <CardH><HelpCircle className="w-4 h-4 text-cyan-400" /><span className="text-sm font-semibold text-white">Base de Connaissances</span></CardH>
              <div className="divide-y divide-white/[0.04]">
                {[...familleConfig.faq, { question: 'Où sont les poubelles ?', answer: 'Poubelles triées au fond du jardin. Ramassage le mardi et vendredi.' }, { question: 'Où garer la voiture ?', answer: 'Parking visiteurs à 50m. Code portail : 4827.' }].map((faq, i) => (
                  <div key={i} className="cursor-pointer">
                    <div onClick={() => { setExpandedFaq(expandedFaq === i ? null : i); speak(`${faq.question} ${faq.answer}`); }} className="p-3 flex items-center justify-between hover:bg-white/[0.02] transition">
                      <p className="text-sm text-slate-300 font-medium">{faq.question}</p>
                      {expandedFaq === i ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                    {expandedFaq === i && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-3 pb-3"><p className="text-xs text-slate-500 leading-relaxed">{faq.answer}</p></motion.div>}
                  </div>
                ))}
              </div>
            </Card>

            {/* 14. Voix Avancée */}
            <Card className="bg-gradient-to-br from-amber-500/[0.03] to-violet-500/[0.02]">
              <CardB className="text-center py-6">
                <h3 className="text-lg font-serif font-semibold text-white mb-1">Assistant Maellis</h3>
                <p className="text-xs text-slate-500 mb-1">28 intents vocaux · Reconnaissance avancée</p>
                <p className="text-xs text-slate-500 mb-5">{isSpeaking ? '🔴 Je parle...' : '🎤 Appuyez pour interagir'}</p>
                <button onClick={() => { if (!isSpeaking) speak('Bonjour Paul ! Je suis Maellis. Je peux consulter la météo, lire les actualités, chercher une recette, lancer un minuteur, ou ajouter un article aux courses. Essayez !'); }}
                  className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${isSpeaking ? 'bg-red-500 animate-pulse scale-110' : 'bg-gradient-to-br from-amber-500 to-violet-600 hover:scale-105'}`}>
                  {isSpeaking ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
                </button>
                <div className="flex flex-wrap justify-center gap-2 mt-5">
                  {['☀️ Météo', '📰 Actualités', '⭐ Horoscope', '⏱ Minuteur', '🛒 Courses', '📞 Appeler'].map(cmd => (
                    <span key={cmd} onClick={() => speak(cmd.replace(/[^\w\s]/g, '').trim())} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] text-slate-400 cursor-pointer hover:bg-white/[0.06] transition">{cmd}</span>
                  ))}
                </div>
              </CardB>
            </Card>

            {/* 15. Notifications */}
            <Card>
              <CardH><Bell className="w-4 h-4 text-amber-400" /><span className="text-sm font-semibold text-white">Notifications</span><span className="ml-auto text-[10px] text-amber-400">{notifications.filter(n => !n.read).length} nouvelles</span></CardH>
              <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} onClick={() => speak(`${n.title}. ${n.message}`)} className="p-3 hover:bg-white/[0.02] cursor-pointer transition flex items-start gap-3">
                    <div className="relative mt-0.5"><span className="text-lg">{n.icon}</span>{!n.read && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />}</div>
                    <div className="flex-1"><p className="text-xs font-medium text-slate-300">{n.title}</p><p className="text-[10px] text-slate-500 mt-0.5">{n.message}</p></div>
                    <span className="text-[9px] text-slate-600 whitespace-nowrap">{n.time}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 16. Facturation */}
            <Card>
              <CardH><Settings className="w-4 h-4 text-slate-400" /><span className="text-sm font-semibold text-white">Abonnement</span></CardH>
              <CardB className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div><p className="text-sm font-medium text-white">{billingData.plan.name}</p><p className="text-xs text-slate-500">{billingData.plan.price}</p></div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">{billingData.plan.status}</span>
                </div>
                <div className="space-y-2">{billingData.modules.map(m => (
                  <div key={m.name} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded border ${m.active ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`} /><span className="text-xs text-slate-300">{m.name}</span></div>
                    <span className="text-xs text-slate-500">{m.price}</span>
                  </div>
                ))}</div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div><p className="text-xs text-slate-500">Prochaine facture</p><p className="text-sm font-medium text-white">{billingData.nextInvoice.date} · {billingData.nextInvoice.amount}</p></div>
                  <button className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-xs text-slate-400">Gérer</button>
                </div>
              </CardB>
            </Card>

            {/* 17. Tablette Mode */}
            <Card>
              <CardH><Monitor className="w-4 h-4 text-blue-400" /><span className="text-sm font-semibold text-white">Mode Tablette</span></CardH>
              <CardB className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs text-slate-300">Mode Tablette Activé</span></div>
                  <button onClick={() => speak('Mode tablette activé. Affichage Kiosk standard avec widgets météo, rappels et cours.')}>⚙️</button>
                </div>
                <div className="flex gap-2">
                  {['Kiosk', 'Standard'].map((mode, i) => (
                    <button key={mode} onClick={() => speak(`Mode d'affichage : ${mode}.`)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${checklist[i] ? 'bg-blue-500/10 border border-blue-500/25 text-blue-400' : 'bg-white/[0.03] border border-white/[0.06] text-slate-500'}`}>{mode}</button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Météo', 'Présence', 'Courses', 'Messages', 'Recette', 'Coffre-fort'].map(w => (
                    <span key={w} className="px-2 py-1 rounded-lg bg-white/5 text-[10px] text-slate-500">{w}</span>
                  ))}
                </div>
              </CardB>
            </Card>

            {/* 18. Analytics */}
            <Card>
              <CardH><BarChart3 className="w-4 h-4 text-violet-400" /><span className="text-sm font-semibold text-white">Analytics Famille</span></CardH>
              <CardB>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl bg-white/[0.02]"><p className="text-lg font-bold text-white">{analyticsData.screenTime.today}</p><p className="text-[10px] text-slate-500">Aujourd&apos;hui</p></div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.02]"><p className="text-lg font-bold text-white">{analyticsData.screenTime.week}</p><p className="text-[10px] text-slate-500">Cette semaine</p></div>
                  <div className="text-center p-3 rounded-xl bg-emerald-500/5"><p className="text-lg font-bold text-emerald-400">{analyticsData.screenTime.trend}</p><p className="text-[10px] text-slate-500">Tendance</p></div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Activités préférées</p>
                <div className="space-y-2 mb-4">{analyticsData.topActivities.map(a => (
                  <div key={a.name} className="flex items-center gap-3"><span className="text-sm">{a.icon}</span><span className="text-xs text-slate-400 flex-1">{a.name}</span><div className="w-24 h-2 rounded-full bg-white/[0.06]"><div className="h-2 rounded-full bg-amber-500/40" style={{ width: `${(a.count / 24) * 100}%` }} /></div><span className="text-[10px] text-slate-600 w-6 text-right">{a.count}</span></div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-2"><Battery className="w-4 h-4 text-emerald-400" /><span className="text-xs text-slate-300">Économies d&apos;énergie</span></div>
                  <span className="text-sm font-bold text-emerald-400">{analyticsData.energySaved}</span>
                </div>
              </CardB>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </DemoLayout>
  );
}
