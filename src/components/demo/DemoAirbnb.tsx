'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, QrCode, MapPin, Star, MessageCircle, Phone, ShieldAlert,
  Clock, CalendarCheck, CalendarX, Info, Key, ChevronRight,
  Sun, CloudRain, Wind, Mic, MicOff, Send, Copy, Check,
  Heart, AlertTriangle, FileText, Sparkles, Lock, Globe,
  Image, Bell, Settings, Moon, Volume2,
} from 'lucide-react';
import { DemoLayout } from './DemoLayout';
import { useMaellisVoice } from '@/hooks/useMaellisVoice';
import { airbnbConfig, currentDemoTime, airbnbExtended } from '@/lib/mock-data-real';

type AirbnbTab = 'welcome' | 'guide' | 'stay' | 'alerts' | 'settings';

function QRCodeDisplay({ size = 8 }: { size?: number }) {
  const seed = 'Maellis-Viral-Scan-Continue';
  const cells: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    cells[y] = [];
    for (let x = 0; x < size; x++) {
      const isCorner = (x < 2 && y < 2) || (x >= size - 2 && y < 2) || (x < 2 && y >= size - 2);
      const isBorder = x === 0 || x === size - 1 || y === 0 || y === size - 1;
      const isCenter = x === Math.floor(size / 2) && y === Math.floor(size / 2);
      const pseudoRandom = ((seed.charCodeAt(y * size + (x % seed.length)) || 7) * 31 + x * 17 + y * 13) % 5 > 2;
      cells[y][x] = isCorner || isBorder || isCenter || pseudoRandom;
    }
  }
  return (
    <svg viewBox={`0 0 ${size * 10 + 20} ${size * 10 + 20}`} className="w-full h-full">
      <rect width="100%" height="100%" fill="white" rx="6" />
      {cells.map((row, y) => row.map((cell, x) => cell ? <rect key={`${x}-${y}`} x={x * 10 + 10} y={y * 10 + 10} width="8" height="8" fill="#1e293b" rx="1" /> : null))}
    </svg>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden ${className}`}>{children}</div>;
}
function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-4 border-b border-white/[0.06] flex items-center gap-2">{children}</div>;
}
function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function DemoAirbnb({ onBack }: { onBack: () => void }) {
  const { speak, isSpeaking } = useMaellisVoice();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AirbnbTab>('welcome');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [checkInSteps, setCheckInSteps] = useState([true, true, false, false]);
  const [starRating, setStarRating] = useState(0);
  const [showSmartReview, setShowSmartReview] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1400); return () => clearTimeout(t); }, []);

  const copy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  }, []);

  const copyField = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex justify-between"><div className="h-8 w-48 rounded-xl bg-white/[0.03] animate-pulse" /><div className="h-6 w-36 rounded-full bg-white/[0.03] animate-pulse" /></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-28 rounded-2xl bg-white/[0.03] animate-pulse" />)}</div>
        <div className="flex gap-3">{[1,2,3,4,5].map(i=><div key={i} className="h-10 w-24 rounded-xl bg-white/[0.03] animate-pulse" />)}</div>
        <div className="grid md:grid-cols-2 gap-6">{[1,2].map(i=><div key={i} className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />)}</div>
      </div>
    </div>
  );

  const tabs: { key: AirbnbTab; label: string; emoji: string }[] = [
    { key: 'welcome', label: 'Bienvenue', emoji: '👋' },
    { key: 'guide', label: 'Guide', emoji: '🗺️' },
    { key: 'stay', label: 'Mon Séjour', emoji: '📋' },
    { key: 'alerts', label: 'Alertes', emoji: '🔔' },
    { key: 'settings', label: 'Réglages', emoji: '⚙️' },
  ];

  const completedSteps = checkInSteps.filter(Boolean).length;

  return (
    <DemoLayout title={`Villa Azur — ${airbnbConfig.location}`} subtitle={`Voyageur : ${airbnbConfig.guest.name} | ${currentDemoTime.date}`} accentColor="amber" onBack={onBack}>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${activeTab === t.key ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.05]'}`}>
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════ TAB: BIENVENUE ═══════ */}
        {activeTab === 'welcome' && (
          <motion.div key="welcome" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* 1. Onboarding + 2. Dashboard */}
            <Card onClick={() => speak(airbnbConfig.welcomeMessage)} className="cursor-pointer hover:border-amber-500/20 transition">
              <CardBody>
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-2xl">🏠</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-serif font-semibold text-white mb-1">Bienvenue {airbnbConfig.guest.name} !</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{airbnbConfig.welcomeMessage}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {['WiFi connecté', 'Règles lues', 'Clés récupérées'].map((item, i) => (
                    <div key={i} onClick={(e) => { e.stopPropagation(); speak(`${item} : ${i < 2 ? 'fait' : 'en cours'}`); }}
                      className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${i < 2 ? 'bg-emerald-500 border-emerald-500' : 'border-amber-500/40'}`}>
                        {i < 2 && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Dashboard Résumé */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Sun, label: 'Météo', value: airbnbConfig.weather.temp, sub: airbnbConfig.weather.condition, color: 'bg-amber-500/10 border-amber-500/20' },
                { icon: CalendarCheck, label: 'Check-in', value: airbnbExtended.staySummary.checkin.replace('Sam. 7 juin ', ''), sub: 'Arrivée', color: 'bg-emerald-500/10 border-emerald-500/20' },
                { icon: CalendarX, label: 'Check-out', value: airbnbExtended.staySummary.checkout.replace('Dim. 8 juin ', ''), sub: 'Départ', color: 'bg-rose-500/10 border-rose-500/20' },
                { icon: Star, label: 'Type', value: 'Villa', sub: `${airbnbExtended.staySummary.rating}★`, color: 'bg-violet-500/10 border-violet-500/20' },
              ].map((item, i) => (
                <Card key={i} onClick={() => speak(`${item.label} : ${item.value}. ${item.sub}`)} className="cursor-pointer hover:border-white/[0.15] transition">
                  <CardBody className="text-center py-4">
                    <item.icon className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">{item.value}</div>
                    <div className="text-xs text-slate-500 mt-1">{item.sub}</div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* 3. Check-in/out Automatisé */}
            <Card>
              <CardHeader><ShieldAlert className="w-4 h-4 text-amber-400" /><span className="text-sm font-semibold text-white">Check-in Progression</span></CardHeader>
              <CardBody>
                <div className="relative">
                  <div className="absolute top-3 left-5 right-5 h-0.5 bg-white/[0.06]" />
                  <div className="absolute top-3 left-5 h-0.5 bg-amber-500/50 transition-all" style={{ width: `${(completedSteps / 4) * 100}%` }} />
                  <div className="relative flex justify-between">
                    {['Arrivée', 'Clés', 'Installation', 'Valider'].map((step, i) => (
                      <div key={step} onClick={() => speak(`Étape ${i + 1} : ${step}. ${checkInSteps[i] ? 'Terminé.' : 'En cours.'}`)}
                        className="flex flex-col items-center gap-2 cursor-pointer">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${checkInSteps[i] ? 'bg-emerald-500 border-emerald-500 text-white' : i === completedSteps ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse' : 'bg-white/[0.03] border-white/[0.1] text-slate-500'}`}>
                          {checkInSteps[i] ? '✓' : i + 1}
                        </div>
                        <span className="text-[10px] text-slate-500">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 4. Jetons d'Accès */}
            <Card>
              <CardHeader><Lock className="w-4 h-4 text-blue-400" /><span className="text-sm font-semibold text-white">Codes d&apos;Accès</span></CardHeader>
              <div className="divide-y divide-white/[0.06]">
                {airbnbExtended.accessTokens.map((token, i) => (
                  <div key={i} className="p-4 flex items-center justify-between" onClick={() => speak(`${token.label} : ${token.value}`)}>
                    <div className="flex items-center gap-3 cursor-pointer flex-1">
                      <span className="text-lg">{token.icon}</span>
                      <div><p className="text-xs text-slate-500">{token.label}</p><p className="text-sm font-mono text-white">{token.value}</p></div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); copy(token.value, token.label); }}
                      className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-400 hover:bg-white/[0.08] transition flex items-center gap-1">
                      {copiedToken === token.label ? <><Check className="w-3 h-3 text-emerald-400" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* 5. Contact */}
            <Card>
              <CardHeader><MessageCircle className="w-4 h-4 text-teal-400" /><span className="text-sm font-semibold text-white">Contacter {airbnbConfig.hostName}</span></CardHeader>
              <CardBody className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">S</div>
                    <div><p className="text-xs text-slate-500">{airbnbConfig.guest.name} · Il y a 1h</p><p className="text-sm text-slate-300">Merci pour l&apos;accueil ! Tout est parfait.</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">I</div>
                    <div><p className="text-xs text-slate-500">{airbnbConfig.hostName} · Il y a 45 min</p><p className="text-sm text-slate-300">Avec plaisir ! N&apos;hésitez pas si vous avez besoin de quoi que ce soit 😊</p></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <input disabled placeholder="Écrire un message..." className="flex-1 bg-transparent text-sm text-slate-500 placeholder-slate-600 outline-none" />
                  <button className="p-2 rounded-lg bg-white/[0.04] text-slate-500"><Send className="w-4 h-4" /></button>
                </div>
                <a href={`https://wa.me/33612345678?text=Bonjour, je suis ${airbnbConfig.guest.name}, votre invitée.`} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition">
                  <MessageCircle className="w-4 h-4" /> WhatsApp <ChevronRight className="w-4 h-4" />
                </a>
              </CardBody>
            </Card>

            {/* 6. 📱 QR CODE VIRAL */}
            <Card className="relative overflow-visible">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none" />
              <CardBody className="relative text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-[10px] font-bold text-amber-400 uppercase tracking-wider">Viral</span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/25 text-[10px] font-bold text-blue-400 uppercase tracking-wider">Scan & Continue</span>
                </div>
                <h3 className="text-lg font-serif font-semibold text-white mb-2">Transférez sur votre mobile</h3>
                <p className="text-xs text-slate-500 mb-5">Scannez pour continuer l&apos;expérience sur votre téléphone</p>
                {/* Glow + QR */}
                <div className="relative inline-block">
                  <div className="absolute -inset-6 bg-amber-500/10 rounded-3xl blur-2xl" />
                  <div className="relative bg-white p-5 rounded-2xl shadow-2xl shadow-amber-500/10 inline-block">
                    <div className="w-44 h-44 sm:w-52 sm:h-52"><QRCodeDisplay size={10} /></div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 mt-4">QR Code Maellis — Villa Azur</p>
              </CardBody>
            </Card>

            {/* House Rules + Emergency */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><Info className="w-4 h-4 text-amber-400" /><span className="text-sm font-semibold text-white">Règles de la maison</span></CardHeader>
                <div className="divide-y divide-white/[0.04]">
                  {airbnbConfig.houseRules.map((rule, i) => (
                    <div key={i} onClick={() => speak(rule)} className="p-3 flex items-center gap-3 hover:bg-white/[0.02] cursor-pointer transition">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" /><span className="text-sm text-slate-300">{rule}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <CardHeader><ShieldAlert className="w-4 h-4 text-rose-400" /><span className="text-sm font-semibold text-white">Urgences</span></CardHeader>
                <div className="divide-y divide-white/[0.04]">
                  {airbnbConfig.emergencyContacts.map((c, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-white/[0.02] transition">
                      <div onClick={() => speak(`${c.label}, composez le ${c.number}`)} className="flex items-center gap-3 cursor-pointer flex-1">
                        <span className="text-lg">{c.icon}</span><div><p className="text-sm text-slate-200">{c.label}</p><p className="text-xs text-slate-500">{c.number}</p></div>
                      </div>
                      <a href={`tel:${c.number.replace(/\s/g, '')}`} className="p-2 rounded-lg bg-white/[0.04] hover:bg-rose-500/10 transition"><Phone className="w-4 h-4 text-slate-400" /></a>
                    </div>
                  ))}
                </div>
                <div className="p-3"><button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-red-500/20 border border-rose-500/30 text-rose-400 text-sm font-semibold flex items-center justify-center gap-2"><ShieldAlert className="w-4 h-4" /> SOS Urgence</button></div>
              </Card>
            </div>

            {/* WiFi credentials */}
            <Card>
              <div className="divide-y divide-white/[0.06]">
                <div className="p-4 flex items-center justify-between" onClick={() => speak(`WiFi : réseau ${airbnbConfig.wifi.network}, mot de passe ${airbnbConfig.wifi.password}`)}>
                  <div className="flex items-center gap-3 cursor-pointer"><Wifi className="w-4 h-4 text-cyan-400" /><div><p className="text-xs text-slate-500">Réseau</p><p className="text-sm font-mono text-white">{airbnbConfig.wifi.network}</p></div></div>
                  <button onClick={(e) => { e.stopPropagation(); copyField(airbnbConfig.wifi.network, 'net'); }} className="px-3 py-1 rounded-lg bg-white/[0.04] text-xs text-slate-400">{copiedField === 'net' ? '✅' : 'Copier'}</button>
                </div>
                <div className="p-4 flex items-center justify-between" onClick={() => speak(`Mot de passe WiFi : ${airbnbConfig.wifi.password}`)}>
                  <div className="flex items-center gap-3 cursor-pointer"><Key className="w-4 h-4 text-amber-400" /><div><p className="text-xs text-slate-500">Mot de passe</p><p className="text-sm font-mono text-white">{airbnbConfig.wifi.password}</p></div></div>
                  <button onClick={(e) => { e.stopPropagation(); copyField(airbnbConfig.wifi.password, 'pwd'); }} className="px-3 py-1 rounded-lg bg-white/[0.04] text-xs text-slate-400">{copiedField === 'pwd' ? '✅' : 'Copier'}</button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ═══════ TAB: GUIDE ═══════ */}
        {activeTab === 'guide' && (
          <motion.div key="guide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* 7. Guide Local / POI */}
            <Card>
              <CardHeader><MapPin className="w-4 h-4 text-blue-400" /><span className="text-sm font-semibold text-white">Guide Local</span></CardHeader>
              <div className="divide-y divide-white/[0.04]">
                {airbnbExtended.localPOIs.map((poi, i) => {
                  const catColors: Record<string, string> = { Plage: 'bg-cyan-500/10 text-cyan-400', Restaurant: 'bg-amber-500/10 text-amber-400', Pharmacie: 'bg-emerald-500/10 text-emerald-400', Musée: 'bg-violet-500/10 text-violet-400', Marché: 'bg-blue-500/10 text-blue-400' };
                  return (
                    <div key={i} onClick={() => speak(`${poi.name}, ${poi.category}, à ${poi.distance}. ${poi.description}. Note : ${poi.rating} sur 5.`)} className="p-4 hover:bg-white/[0.02] cursor-pointer transition group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1"><h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">{poi.name}</h4><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catColors[poi.category] || 'bg-slate-500/10 text-slate-400'}`}>{poi.category}</span></div>
                          <p className="text-xs text-slate-500 mb-1">{poi.description}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500"><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{poi.distance}</span><span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{poi.rating}</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 8. Activités */}
            <Card>
              <CardHeader><Sparkles className="w-4 h-4 text-amber-400" /><span className="text-sm font-semibold text-white">Activités Partenaires</span></CardHeader>
              <div className="divide-y divide-white/[0.04]">
                {airbnbConfig.activities.map((a, i) => (
                  <div key={a.id} onClick={() => speak(`${a.name}, ${a.description}. Durée : ${a.duration}. Distance : ${a.distance}.`)} className="p-4 hover:bg-white/[0.02] cursor-pointer transition group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1"><h4 className="text-sm font-semibold text-white">{a.name}</h4>{a.isPartner && <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/25 rounded-full text-[10px] font-bold text-amber-400">Partenaire</span>}</div>
                        <p className="text-xs text-slate-500 mb-1">{a.description}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500"><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.distance}</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.duration}</span></div>
                      </div>
                      {a.whatsappLink && (
                        <a href={a.whatsappLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> Réserver
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ═══════ TAB: MON SÉJOUR ═══════ */}
        {activeTab === 'stay' && (
          <motion.div key="stay" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* 9. Tickets Support */}
            <Card>
              <CardHeader><AlertTriangle className="w-4 h-4 text-amber-400" /><span className="text-sm font-semibold text-white">Support</span></CardHeader>
              <div className="divide-y divide-white/[0.04]">
                {airbnbExtended.supportTickets.map((t, i) => (
                  <div key={t.id} onClick={() => speak(`Ticket : ${t.subject}. ${t.description}. Statut : ${t.status === 'open' ? 'en cours' : 'résolu'}.`)} className="p-4 hover:bg-white/[0.02] cursor-pointer transition">
                    <div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center gap-2 mb-1"><h4 className="text-sm font-medium text-white">{t.subject}</h4><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${t.status === 'open' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{t.status === 'open' ? 'En cours' : 'Résolu'}</span></div><p className="text-xs text-slate-500">{t.description}</p><p className="text-[10px] text-slate-600 mt-1">{t.time}</p></div></div>
                  </div>
                ))}
              </div>
              <CardBody><button onClick={() => speak('Formulaire de création de ticket. Décrivez votre problème.')} className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-400 hover:bg-white/[0.06] transition">+ Créer un ticket</button></CardBody>
            </Card>

            {/* 10. Feedback */}
            <Card>
              <CardHeader><Star className="w-4 h-4 text-amber-400" /><span className="text-sm font-semibold text-white">Votre Avis</span></CardHeader>
              <CardBody className="space-y-4">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">Note globale</p>
                  <div className="flex items-center justify-center gap-2">{[1,2,3,4,5].map(s => <button key={s} onClick={() => { setStarRating(s); speak(`${s} étoile${s > 1 ? 's' : ''}`); }} className="transition hover:scale-125"><Star className={`w-7 h-7 ${s <= starRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} /></button>)}</div>
                </div>
                {['Propreté', 'Confort', 'Localisation'].map(dim => (
                  <div key={dim}><p className="text-xs text-slate-500 mb-1">{dim}</p><div className="flex gap-1">{[1,2,3,4,5].map(s => <button key={s} className="transition hover:scale-125"><Star className={`w-5 h-5 ${s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} /></button>)}</div></div>
                ))}
                <textarea disabled placeholder="Votre commentaire (simulation)..." rows={2} className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-sm text-slate-500 placeholder-slate-600 outline-none resize-none" />
                <div className="flex items-center gap-2">
                  <button disabled className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-500"><Image className="w-4 h-4" /> Photo</button>
                  <button onClick={() => speak('Merci pour votre avis !')} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/25 text-amber-400 text-sm font-medium">Envoyer mon avis</button>
                </div>
              </CardBody>
            </Card>

            {/* 11. Journal de Voyage */}
            <Card>
              <CardHeader><FileText className="w-4 h-4 text-blue-400" /><span className="text-sm font-semibold text-white">Journal de Voyage</span></CardHeader>
              <div className="divide-y divide-white/[0.04]">
                {airbnbExtended.travelJournal.map((j, i) => (
                  <div key={j.id} onClick={() => speak(`${j.day} : ${j.title}. ${j.content}`)} className="p-4 hover:bg-white/[0.02] cursor-pointer transition">
                    <div className="flex items-center gap-2 mb-2"><span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[10px] text-blue-400 font-medium">{j.day}</span><span className="text-lg">{j.mood}</span></div>
                    <h4 className="text-sm font-medium text-white mb-1">{j.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{j.content}</p>
                  </div>
                ))}
              </div>
              <CardBody><button className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-400">+ Ajouter une entrée</button></CardBody>
            </Card>

            {/* 12. Smart Review */}
            <Card>
              <CardHeader><Sparkles className="w-4 h-4 text-violet-400" /><span className="text-sm font-semibold text-white">Smart Review IA</span></CardHeader>
              <CardBody className="space-y-3">
                <p className="text-xs text-slate-500">Générez un avis assisté par IA basé sur votre séjour.</p>
                {!showSmartReview ? (
                  <button onClick={() => { setShowSmartReview(true); speak('Votre avis généré : Excellent séjour à la Villa Azur. Accueil chaleureux, appartement conforme aux photos. La Promenade des Anglais est à deux pas. Je recommande vivement !'); }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500/15 to-purple-500/15 border border-violet-500/25 text-violet-400 text-sm font-medium flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" /> Générer mon avis IA
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-sm text-slate-300 italic leading-relaxed">&ldquo;Excellent séjour à la Villa Azur. Accueil chaleureux d&apos;Isabelle, appartement conforme aux photos. La Promenade des Anglais est à deux pas et le restaurant La Petite Maison est une pépite. Je recommande vivement !&rdquo;</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { copy('Excellent séjour à la Villa Azur...', 'review'); }} className="flex-1 py-2 rounded-xl bg-white/[0.04] text-xs text-slate-400 flex items-center justify-center gap-1">{copiedToken === 'review' ? '✅' : <><Copy className="w-3 h-3" /> Copier</>}</button>
                      <button className="flex-1 py-2 rounded-xl bg-blue-500/10 text-xs text-blue-400 flex items-center justify-center gap-1"><Star className="w-3 h-3" /> Publier Google</button>
                    </div>
                  </motion.div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* ═══════ TAB: ALERTES ═══════ */}
        {activeTab === 'alerts' && (
          <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <Card>
              <CardHeader><Bell className="w-4 h-4 text-amber-400" /><span className="text-sm font-semibold text-white">Notifications</span></CardHeader>
              <div className="divide-y divide-white/[0.04]">
                {airbnbExtended.stayNotifications.map((n, i) => (
                  <div key={n.id} onClick={() => speak(`${n.title}. ${n.message}`)} className="p-4 hover:bg-white/[0.02] cursor-pointer transition flex items-start gap-3">
                    <div className="relative"><span className="text-xl">{n.icon}</span>{i < 2 && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />}</div>
                    <div className="flex-1"><h4 className="text-sm font-medium text-white">{n.title}</h4><p className="text-xs text-slate-500 mt-0.5">{n.message}</p><p className="text-[10px] text-slate-600 mt-1">{n.time}</p></div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ═══════ TAB: RÉGLAGES ═══════ */}
        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* 14. Paramètres */}
            <Card>
              <CardHeader><Settings className="w-4 h-4 text-slate-400" /><span className="text-sm font-semibold text-white">Paramètres Séjour</span></CardHeader>
              <CardBody className="space-y-4">
                {[
                  { icon: Globe, label: 'Langue', value: 'Français' },
                  { icon: Wind, label: 'Unités', value: 'Métrique' },
                  { icon: Moon, label: 'Mode Nuit', value: 'Désactivé' },
                  { icon: Volume2, label: 'Heures silencieuses', value: '22h - 08h' },
                ].map(s => (
                  <div key={s.label} onClick={() => speak(`${s.label} : ${s.value}`)} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition">
                    <div className="flex items-center gap-3"><s.icon className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-300">{s.label}</span></div>
                    <span className="text-sm text-slate-500">{s.value}</span>
                  </div>
                ))}
              </CardBody>
            </Card>

            {/* 15. Facturation */}
            <Card>
              <CardHeader><FileText className="w-4 h-4 text-amber-400" /><span className="text-sm font-semibold text-white">Récapitulatif Séjour</span></CardHeader>
              <CardBody className="space-y-3">
                <div className="space-y-2">
                  {[
                    { label: 'Nuits (1)', value: airbnbExtended.billingStay.nights },
                    { label: 'Ménage', value: airbnbExtended.billingStay.cleaning },
                    { label: 'Extras', value: airbnbExtended.billingStay.extras },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between"><span className="text-sm text-slate-400">{item.label}</span><span className="text-sm text-slate-300">{item.value}</span></div>
                  ))}
                  <div className="border-t border-white/[0.06] pt-2 flex items-center justify-between"><span className="text-base font-semibold text-white">Total</span><span className="text-lg font-bold text-amber-400">{airbnbExtended.billingStay.total}</span></div>
                </div>
                <button onClick={() => speak(`Total du séjour : ${airbnbExtended.billingStay.total}. ${airbnbExtended.billingStay.nights}, ménage ${airbnbExtended.billingStay.cleaning}.`)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/25 text-amber-400 text-sm font-medium">Payer maintenant</button>
              </CardBody>
            </Card>

            {/* Voice Assistant */}
            <Card className="bg-gradient-to-br from-amber-500/[0.03] to-orange-500/[0.02]">
              <CardBody className="text-center py-6">
                <h3 className="text-lg font-serif font-semibold text-white mb-2">Assistant Maellis</h3>
                <p className="text-xs text-slate-500 mb-5">{isSpeaking ? 'Je parle...' : 'Appuyez pour me parler'}</p>
                <button onClick={() => { if (!isSpeaking) speak(`Bonjour ${airbnbConfig.guest.name} ! Je suis Maellis, votre assistant de séjour à la Villa Azur. Comment puis-je vous aider ?`); }}
                  className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${isSpeaking ? 'bg-red-500 animate-pulse scale-110' : 'bg-gradient-to-br from-amber-500 to-orange-600 hover:scale-105'}`}>
                  {isSpeaking ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                </button>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </DemoLayout>
  );
}
