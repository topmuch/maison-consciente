'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, CheckSquare, ShoppingCart, Utensils, Wifi, Tv,
  Thermometer, Sun, Clock, ChevronRight, Heart,
  Phone, AlertCircle,
} from 'lucide-react';
import { DemoLayout } from './DemoLayout';
import { NewsWidget } from './NewsWidget';
import { HoroscopeWidget } from './HoroscopeWidget';
import { VoiceOrb } from './VoiceOrb';
import { Skeleton } from '@/components/ui/skeleton';
import { familleConfig, newsItems, currentDemoTime } from '@/lib/mock-data-real';

interface DemoParticulierProps {
  onBack: () => void;
}

export function DemoParticulier({ onBack }: DemoParticulierProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'news' | 'horoscope'>('home');
  const [reminders, setReminders] = useState(familleConfig.reminders);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r))
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Skeleton top bar */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32 rounded-lg bg-white/[0.04]" />
            <Skeleton className="h-6 w-40 rounded-full bg-white/[0.04]" />
          </div>
          {/* Skeleton hero */}
          <Skeleton className="h-32 w-full rounded-2xl bg-white/[0.04]" />
          {/* Skeleton tabs */}
          <div className="flex gap-2">
            {['Home', 'News', 'Horoscope'].map((t) => (
              <Skeleton key={t} className="h-8 w-20 rounded-lg bg-white/[0.04]" />
            ))}
          </div>
          {/* Skeleton cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-2xl bg-white/[0.04]" />
            <Skeleton className="h-64 rounded-2xl bg-white/[0.04]" />
          </div>
        </div>
      </div>
    );
  }

  const doneCount = reminders.filter((r) => r.done).length;
  const pendingReminders = reminders.filter((r) => !r.done);

  return (
    <DemoLayout
      title={`Bonjour Paul ! 👋`}
      subtitle={`${currentDemoTime.date} — Famille Martin`}
      onBack={onBack}
    >
      {/* Weather bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/[0.06] to-orange-500/[0.04] border border-amber-500/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">{familleConfig.weather.icon}</div>
            <div>
              <p className="text-2xl font-semibold text-white">{familleConfig.weather.temp}</p>
              <p className="text-xs text-slate-400">{familleConfig.weather.condition} &bull; {familleConfig.weather.city}</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500 space-y-0.5">
            <p className="flex items-center gap-1 justify-end"><Thermometer className="w-3 h-3" /> {familleConfig.weather.humidity}</p>
            <p className="flex items-center gap-1 justify-end"><Sun className="w-3 h-3" /> {currentDemoTime.sunrise}</p>
            <p className="flex items-center gap-1 justify-end"><Clock className="w-3 h-3" /> {currentDemoTime.sunset}</p>
          </div>
        </div>
      </motion.div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'home' as const, label: 'Accueil', icon: Home },
          { key: 'news' as const, label: 'Actualités', icon: Newspaper },
          { key: 'horoscope' as const, label: 'Horoscope', icon: Star },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.05]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* HOME TAB */}
      {activeTab === 'home' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Quick reminders */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="p-4 pb-3 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/10">
                      <Bell className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Rappels</h3>
                      <p className="text-[10px] text-slate-500">{doneCount}/{reminders.length} terminés</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-xs font-semibold text-slate-400">
                    {pendingReminders.length}
                  </div>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {reminders.map((reminder, i) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <button
                        onClick={() => toggleReminder(reminder.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          reminder.done
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-slate-600 hover:border-amber-500/50'
                        }`}
                      >
                        {reminder.done && <CheckSquare className="w-3 h-3 text-white" />}
                      </button>
                      <span className="text-lg">{reminder.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${reminder.done ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                          {reminder.label}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        reminder.done ? 'bg-slate-800 text-slate-600' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {reminder.time}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Shopping list */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="p-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                      <ShoppingCart className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Liste de courses</h3>
                      <p className="text-[10px] text-slate-500">{familleConfig.shoppingList.length} articles</p>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {familleConfig.shoppingList.map((item, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300 hover:bg-white/[0.06] transition-colors cursor-default"
                      >
                        {item}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Voice assistant */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 rounded-xl bg-violet-500/10">
                    <Phone className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Assistant Maellis</h3>
                    <p className="text-[10px] text-slate-500">Reconnaissance vocale intégrée</p>
                  </div>
                </div>
                <VoiceOrb onTranscript={(t) => console.log('Transcript:', t)} />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Recipes */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="p-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-orange-500/10">
                      <Utensils className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Recettes</h3>
                      <p className="text-[10px] text-slate-500">Suggestions du jour</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {familleConfig.recipes.map((recipe, i) => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-xl">
                        {recipe.image}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-200 font-medium">{recipe.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {recipe.time} &bull; {recipe.difficulty}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* FAQ Maison */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="p-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/10">
                      <AlertCircle className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">FAQ Maison</h3>
                      <p className="text-[10px] text-slate-500">Questions fréquentes</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {familleConfig.faq.map((faq, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-3"
                    >
                      <p className="text-xs font-medium text-slate-300 mb-1">{faq.question}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* NEWS TAB */}
      {activeTab === 'news' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <NewsWidget news={newsItems} />
        </motion.div>
      )}

      {/* HOROSCOPE TAB */}
      {activeTab === 'horoscope' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <HoroscopeWidget defaultSign="taureau" />
        </motion.div>
      )}
    </DemoLayout>
  );
}

// Re-export icons used in the component
function Home(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
}
function Newspaper(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>;
}
function Star(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
