"use client";

/* ═══════════════════════════════════════════════════════
   QuickActionsWidget — 2×3 action grid

   Extracted from the tablet display page.
   Shows quick action buttons (news, recipe, weather, etc.)
   ═══════════════════════════════════════════════════════ */

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Newspaper, ChefHat, CloudSun, Sparkles, Laugh, Lightbulb,
  Clock, Cloud, CloudRain, CloudSnow, CloudLightning, Sun, Bell, MapPin,
} from "lucide-react";
import { LOCAL_RECIPES, FUN_FACTS, JOKES } from "@/lib/constants";

interface QuickActionsWidgetProps {
  weather?: {
    temp: number;
    code: number;
    desc: string;
    emoji: string;
  } | null;
  news?: { title: string; source: string; link?: string }[];
}

const QUICK_ACTIONS = [
  { id: "news", icon: Newspaper, label: "Actualités", emoji: "📰", color: "text-cyan-400" },
  { id: "recipe", icon: ChefHat, label: "Recette du jour", emoji: "🍽️", color: "text-amber-400" },
  { id: "weather", icon: CloudSun, label: "Météo", emoji: "⛅", color: "text-sky-400" },
  { id: "horoscope", icon: Sparkles, label: "Horoscope", emoji: "♈", color: "text-violet-400" },
  { id: "joke", icon: Laugh, label: "Blague", emoji: "😂", color: "text-emerald-400" },
  { id: "fact", icon: Lightbulb, label: "Le saviez-vous", emoji: "💡", color: "text-yellow-400" },
] as const;

const ZODIAC_SIGNS = [
  "Bélier", "Taureau", "Gémeaux", "Cancer",
  "Lion", "Vierge", "Balance", "Scorpion",
  "Sagittaire", "Capricorne", "Verseau", "Poissons",
];

const HOROSCOPE_MESSAGES = [
  "Les étoiles vous sourient aujourd'hui. Une journée propice aux nouvelles rencontres.",
  "Vos projets avancent doucement mais sûrement. La patience est votre alliée.",
  "Une énergie créative vous envahit. C'est le moment idéal pour exprimer vos talents.",
  "La chance vous accompagne dans vos entreprises. Osez prendre des initiatives.",
  "Un moment de calme s'annonce. Prenez soin de vous et de vos proches.",
  "Les communications sont favorisées. C'est le bon jour pour clarifier les choses.",
  "Votre intuition est particulièrement aiguisée. Écoutez votre voix intérieure.",
];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export function QuickActionsWidget({ weather, news = [] }: QuickActionsWidgetProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  const handleQuickAction = useCallback(
    (actionId: string) => {
      switch (actionId) {
        case "news": {
          if (news.length === 0) {
            setModalContent(
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Newspaper className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">Aucune actualité disponible</p>
              </div>
            );
          } else {
            setModalContent(
              <div className="space-y-4">
                <h3 className="font-serif text-xl text-amber-200">Dernières actualités</h3>
                <div className="space-y-3">
                  {news.map((item, i) => (
                    <div key={i} className="glass rounded-xl p-4 border border-white/5">
                      <p className="text-sm text-slate-200 leading-relaxed">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-2">{item.source}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          setActiveModal("news");
          break;
        }
        case "recipe": {
          const recipe = LOCAL_RECIPES[Math.floor(Math.random() * LOCAL_RECIPES.length)];
          setModalContent(
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl text-amber-200">{recipe.title}</h3>
                <span className="text-xs px-2 py-1 rounded-full glass text-amber-400/80">
                  {recipe.difficulty}
                </span>
              </div>
              <p className="text-sm text-slate-300">{recipe.description}</p>
              <div className="flex gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {recipe.prepTimeMin + recipe.cookTimeMin} min
                </span>
                <span>👥 {recipe.servings} pers.</span>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2">
                  Ingrédients
                </h4>
                <ul className="space-y-1">
                  {recipe.ingredients.slice(0, 8).map((ing, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400/50 mt-1">•</span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
          setActiveModal("recipe");
          break;
        }
        case "weather": {
          setModalContent(
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-amber-200">Météo</h3>
              {weather ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <span className="text-6xl">{weather.emoji}</span>
                  <div className="text-center">
                    <p className="text-4xl font-serif text-amber-200">{weather.temp}°C</p>
                    <p className="text-sm text-slate-400 mt-1">{weather.desc}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-slate-400">
                  <CloudSun className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm">Données météo non disponibles</p>
                </div>
              )}
            </div>
          );
          setActiveModal("weather");
          break;
        }
        case "horoscope": {
          const sign = ZODIAC_SIGNS[Math.floor(Math.random() * ZODIAC_SIGNS.length)];
          const message = HOROSCOPE_MESSAGES[Math.floor(Math.random() * HOROSCOPE_MESSAGES.length)];
          setModalContent(
            <div className="space-y-4 text-center">
              <h3 className="font-serif text-xl text-amber-200">Horoscope</h3>
              <div className="text-5xl py-4">♈</div>
              <p className="text-lg font-serif text-amber-300">{sign}</p>
              <p className="text-sm text-slate-300 leading-relaxed mt-2">{message}</p>
            </div>
          );
          setActiveModal("horoscope");
          break;
        }
        case "joke": {
          const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
          setModalContent(
            <div className="space-y-4 text-center">
              <h3 className="font-serif text-xl text-amber-200">Blague du jour</h3>
              <div className="text-5xl py-4">😂</div>
              <p className="text-sm text-slate-200 leading-relaxed">{joke.setup} ... {joke.punchline}</p>
            </div>
          );
          setActiveModal("joke");
          break;
        }
        case "fact": {
          const fact = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
          setModalContent(
            <div className="space-y-4 text-center">
              <h3 className="font-serif text-xl text-amber-200">Le saviez-vous ?</h3>
              <div className="text-5xl py-4">💡</div>
              <p className="text-sm text-slate-200 leading-relaxed">{fact}</p>
            </div>
          );
          setActiveModal("fact");
          break;
        }
      }
    },
    [news, weather]
  );

  return (
    <>
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="glass rounded-2xl p-5"
      >
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-4">
          Accès rapide
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <motion.button
              key={action.id}
              variants={scaleIn}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
              onClick={() => handleQuickAction(action.id)}
              className="group flex flex-col items-center justify-center gap-3 p-4 md:p-5 rounded-xl glass hover:bg-white/[0.06] transition-all cursor-pointer min-h-[100px]"
            >
              <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-200">
                {action.emoji}
              </span>
              <span className="text-xs md:text-sm font-medium text-slate-300 group-hover:text-amber-200 transition-colors text-center">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Action Modal Sheet */}
      <Sheet open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
        <SheetContent className="bg-[#0a0f1e]/95 backdrop-blur-xl border-white/10 text-white overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="sr-only">Détail</SheetTitle>
          </SheetHeader>
          <div className="mt-6">{modalContent}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
