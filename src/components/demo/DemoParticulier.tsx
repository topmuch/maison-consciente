'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, CloudRain, Wind, Thermometer, Newspaper, Star,
  Bell, ShoppingCart, Utensils, HelpCircle, Mic, MicOff,
  CheckCircle2, Circle, Heart, MessageSquare, Home as HomeIcon,
} from 'lucide-react';
import { DemoLayout } from './DemoLayout';
import { useMaellisVoice } from '@/hooks/useMaellisVoice';
import {
  familleConfig,
  newsItems,
  horoscopeData,
  currentDemoTime,
} from '@/lib/mock-data-real';
import type { Reminder } from '@/lib/mock-data-real';

interface DemoParticulierProps {
  onBack: () => void;
}

type TabKey = 'home' | 'news' | 'horoscope';

export function DemoParticulier({ onBack }: DemoParticulierProps) {
  const { speak, isSpeaking } = useMaellisVoice();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [reminders, setReminders] = useState<Reminder[]>([...familleConfig.reminders]);
  const [selectedSign, setSelectedSign] = useState('taureau');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // ── Voice Handlers ──
  const handleWeatherClick = () => {
    speak(
      `Il fait actuellement ${familleConfig.weather.temp} et le temps est ${familleConfig.weather.condition.toLowerCase()} à ${familleConfig.weather.city}. Humidité ${familleConfig.weather.humidity}. Levé du soleil à ${currentDemoTime.sunrise}.`
    );
  };

  const handleNewsClick = (title: string, source: string) => {
    speak(`${source}. ${title}`);
  };

  const handleHoroscopeClick = () => {
    const h = horoscopeData[selectedSign];
    if (h) {
      speak(
        `Horoscope du ${h.signe}. Humeur : ${h.humeur}. Amour : ${h.amour}. Travail : ${h.travail}. Conseil : ${h.conseil}.`
      );
    }
  };

  const handleRecipeClick = (name: string) => {
    speak(`Voici la recette du ${name}. Souhaitez-vous lancer le minuteur ?`);
  };

  const handleReminderToggle = (id: string, label: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r))
    );
    const reminder = reminders.find((r) => r.id === id);
    if (reminder && !reminder.done) {
      speak(`C'est noté, vous avez coché "${label}". Bravo !`);
    }
  };

  const handleFaqClick = (question: string, answer: string) => {
    speak(`${question} ${answer}`);
  };

  const handleShoppingClick = () => {
    const items = familleConfig.shoppingList.join(', ');
    speak(`Votre liste de courses : ${items}. Il y a ${familleConfig.shoppingList.length} articles.`);
  };

  const handleMicClick = () => {
    if (isSpeaking) return;
    speak('Bonjour Paul ! Je suis Maellis, votre assistant maison. Dites-moi ce dont vous avez besoin.');
  };

  // ── Loading Skeleton ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 rounded-xl bg-slate-200 animate-pulse" />
            <div className="h-6 w-40 rounded-full bg-slate-200 animate-pulse" />
          </div>
          <div className="h-36 w-full rounded-3xl bg-slate-200 animate-pulse" />
          <div className="flex gap-3">
            {['Home', 'News', 'Horoscope'].map((t) => (
              <div key={t} className="h-10 w-24 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const doneCount = reminders.filter((r) => r.done).length;

  // ── Tab configs ──
  const tabs: { key: TabKey; label: string; icon: typeof HomeIcon }[] = [
    { key: 'home', label: 'Accueil', icon: HomeIcon },
    { key: 'news', label: 'Actualités', icon: Newspaper },
    { key: 'horoscope', label: 'Horoscope', icon: Star },
  ];

  return (
    <DemoLayout
      title={`Bonjour Paul ! 👋`}
      subtitle={`${currentDemoTime.date} — Famille Martin`}
      accentColor="blue"
      onBack={onBack}
    >
      {/* ─── Weather Card ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleWeatherClick}
        className="cursor-pointer hover:scale-[1.01] transition-transform mb-6 sm:mb-8"
      >
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-4 -right-4 opacity-10">
            <Sun size={140} />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="text-5xl sm:text-6xl font-bold">{familleConfig.weather.temp}</div>
              <div className="text-blue-100 mt-2 text-base sm:text-lg font-medium">
                {familleConfig.weather.condition} &bull; {familleConfig.weather.city}
              </div>
            </div>
            <div className="text-right space-y-2 bg-white/10 p-3 rounded-xl backdrop-blur-sm hidden sm:block">
              <div className="flex items-center gap-2 text-sm">
                <CloudRain size={16} /> {familleConfig.weather.humidity} Humidité
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Wind size={16} /> {familleConfig.weather.wind} Vent
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Thermometer size={16} /> Ressenti {familleConfig.weather.temp}
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-200 flex items-center gap-2">
            🔊 Cliquez pour écouter la météo
          </div>
        </div>
      </motion.div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium whitespace-nowrap transition-all shadow-sm ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB: HOME ─── */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid lg:grid-cols-2 gap-6">
              {/* ── Reminders ── */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Bell className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800">Rappels</h3>
                        <p className="text-sm text-slate-500">{doneCount}/{reminders.length} terminés</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {reminders.length - doneCount}
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {reminders.map((reminder, i) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-slate-50 transition cursor-pointer"
                      onClick={() => handleReminderToggle(reminder.id, reminder.label)}
                    >
                      {reminder.done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                      )}
                      <span className="text-lg">{reminder.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${reminder.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {reminder.label}
                        </div>
                        <div className="text-sm text-slate-500">Quotidien</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        reminder.done
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {reminder.time}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── Recipes ── */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <Utensils className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800">🍳 Recettes</h3>
                      <p className="text-sm text-slate-500">Suggestions du jour</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {familleConfig.recipes.map((recipe, i) => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => handleRecipeClick(recipe.name)}
                      className="p-3 sm:p-4 hover:bg-blue-50 transition cursor-pointer flex justify-between items-center group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{recipe.image}</span>
                        <div>
                          <div className="font-medium text-slate-800 group-hover:text-blue-700 transition">
                            {recipe.name}
                          </div>
                          <div className="text-sm text-slate-500">{recipe.time} &bull; {recipe.difficulty}</div>
                        </div>
                      </div>
                      <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                        🔊 Écouter
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── Shopping List ── */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800">🛒 Liste de courses</h3>
                      <p className="text-sm text-slate-500">{familleConfig.shoppingList.length} articles</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    {familleConfig.shoppingList.map((item, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition cursor-pointer"
                      >
                        {item}
                      </motion.span>
                    ))}
                  </div>
                  <button
                    onClick={handleShoppingClick}
                    className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    🔊 Lire la liste
                  </button>
                </div>
              </div>

              {/* ── FAQ Maison ── */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-cyan-100 rounded-xl">
                      <HelpCircle className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800">❓ FAQ Maison</h3>
                      <p className="text-sm text-slate-500">Questions fréquentes</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {familleConfig.faq.map((faq, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => handleFaqClick(faq.question, faq.answer)}
                      className="p-3 sm:p-4 hover:bg-blue-50 transition cursor-pointer group"
                    >
                      <div className="font-medium text-slate-800 mb-1">{faq.question}</div>
                      <div className="text-sm text-slate-500 group-hover:text-slate-700 transition">{faq.answer}</div>
                      <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition mt-1 block">
                        🔊 Écouter la réponse
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Voice Assistant ── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 sm:p-8 text-center border-2 border-blue-100"
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Assistant Maellis</h3>
              <p className="text-slate-600 mb-6">
                {isSpeaking ? 'Je parle...' : 'Appuyez pour me parler'}
              </p>

              <button
                onClick={handleMicClick}
                disabled={isSpeaking}
                className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform ${
                  isSpeaking
                    ? 'bg-red-500 animate-pulse scale-110'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:scale-105'
                }`}
              >
                {isSpeaking ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              </button>

              <p className="text-sm text-slate-500 mt-4">
                {isSpeaking ? '🔊 Maellis est en train de parler...' : '🎤 Appuyez pour parler'}
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* ─── TAB: NEWS ─── */}
        {activeTab === 'news' && (
          <motion.div
            key="news"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  📰 Actualités du jour
                </h3>
                <p className="text-sm text-slate-500 mt-1">Cliquez sur un titre pour écouter</p>
              </div>

              <div className="divide-y divide-slate-100">
                {newsItems.map((news, i) => (
                  <motion.div
                    key={news.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => handleNewsClick(news.title, news.source)}
                    className="p-4 sm:p-5 hover:bg-blue-50 transition cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-[80px] sm:min-w-[90px] text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded text-center flex-shrink-0">
                        {news.source}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 group-hover:text-blue-700 transition leading-snug">
                          {news.title}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {news.category}
                          </span>
                          <span className="text-xs text-slate-400">{news.time}</span>
                          <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition">
                            🔊 Écouter
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── TAB: HOROSCOPE ─── */}
        {activeTab === 'horoscope' && (
          <motion.div
            key="horoscope"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl space-y-6"
          >
            {/* Sign selector */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(horoscopeData).map(([key, h]) => (
                <button
                  key={key}
                  onClick={() => setSelectedSign(key)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedSign === key
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-purple-300'
                  }`}
                >
                  <span className="mr-1">{h.icon}</span>
                  {h.signe}
                </button>
              ))}
            </div>

            {/* Horoscope detail */}
            {(() => {
              const h = horoscopeData[selectedSign];
              if (!h) return null;
              return (
                <motion.div
                  key={selectedSign}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleHoroscopeClick}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg border border-indigo-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all"
                >
                  <div className="p-4 sm:p-6 border-b border-indigo-100 bg-white/50">
                    <h3 className="text-xl sm:text-2xl font-bold text-indigo-900 flex items-center gap-2">
                      <span className="text-3xl">{h.icon}</span>
                      {h.signe}
                      <span className="text-sm font-normal text-indigo-500">{h.periode}</span>
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6 space-y-5">
                    <div>
                      <div className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Heart size={14} /> Humeur
                      </div>
                      <p className="text-slate-700 italic">&ldquo;{h.humeur}&rdquo;</p>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-pink-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <MessageSquare size={14} /> Amour
                      </div>
                      <p className="text-slate-700">{h.amour}</p>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Star size={14} /> Travail
                      </div>
                      <p className="text-slate-700">{h.travail}</p>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                        💰 Argent
                      </div>
                      <p className="text-slate-700">{h.argent}</p>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                        💡 Conseil
                      </div>
                      <p className="text-slate-700 font-medium">{h.conseil}</p>
                    </div>
                    <div className="pt-3 border-t border-indigo-100">
                      <p className="text-sm text-slate-600 leading-relaxed">{h.texte}</p>
                    </div>
                    <div className="mt-3 text-xs text-indigo-400 flex items-center gap-2">
                      🔊 Cliquez pour écouter votre horoscope complet
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </DemoLayout>
  );
}
