'use server';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Voice Action Handler
   
   Main voice action handler that processes intents and
   returns responses for TTS (Text-to-Speech).
   
   Each handler:
   1. Returns a VoiceActionResponse with a French TTS message
   2. Uses try/catch with fallback messages
   3. Returns actionType as a string identifier
   ═══════════════════════════════════════════════════════ */

import { prisma } from '@/lib/db';
import {
  parseVoiceCommand,
  stripWakeWord,
  containsWakeWord,
  getSupportedCommands,
} from '@/lib/voice-command-router';
import {
  searchLocalRecipes,
  getRandomRecipe,
  getRecipeStep,
  getIngredientsForTTS,
  smartRecipeSearch,
} from '@/lib/recipe-engine';
import {
  getPreferences,
  suggestLearning,
  recordQuery,
  addInterest,
} from '@/lib/memory-engine';
import {
  getHoroscope,
  getHoroscopeFallback,
  formatHoroscopeForTTS,
} from '@/lib/horoscope-parser';
import { fetchAllFeeds, formatArticlesForTTS } from '@/lib/rss-parser';
import {
  JOKES,
  QUOTES,
  FUN_FACTS,
  RSS_SOURCES,
  MORNING_GREETINGS,
  EVENING_GREETINGS,
} from '@/lib/constants';
import {
  DEFAULT_ASSISTANT_NAME,
  ASSISTANT_NAMES,
  isValidAssistantName,
} from '@/lib/config';
import {
  setActivityContext,
  getVoiceContext,
  hasActiveActivityContext,
  clearVoiceContext,
} from '@/lib/voice-context-manager';

/* ═══ TYPES ═══ */

export interface VoiceActionResponse {
  message: string;
  actionType: string;
  data?: unknown;
  needsConfirmation?: boolean;
}

/* ═══ HELPERS ═══ */

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'le ciel est dégagé';
  if ([1, 2, 3].includes(code)) return 'quelques nuages';
  if ([45, 48].includes(code)) return 'du brouillard';
  if ([51, 53, 55].includes(code)) return 'de la bruine';
  if ([61, 63, 65].includes(code)) return 'de la pluie';
  if ([71, 73, 75].includes(code)) return 'de la neige';
  if ([80, 81, 82].includes(code)) return 'des averses';
  if ([95, 96, 99].includes(code)) return 'un orage';
  return 'un temps variable';
}

/* ═══════════════════════════════════════════════════════
   MAIN ENTRY POINT
   ═══════════════════════════════════════════════════════ */

/**
 * Main voice action handler.
 * Takes householdId and spoken text, returns response for TTS.
 */
export async function processVoiceCommand(
  householdId: string,
  text: string,
): Promise<VoiceActionResponse> {
  // Strip wake word if present
  let processedText = text;
  for (const name of ASSISTANT_NAMES) {
    if (containsWakeWord(text, name)) {
      processedText = stripWakeWord(text, name);
      break;
    }
  }

  const command = parseVoiceCommand(processedText);
  await recordQuery(householdId, `${command.intent} ${JSON.stringify(command.entities)}`);

  let prefs: Awaited<ReturnType<typeof getPreferences>>;
  try {
    prefs = await getPreferences(householdId);
  } catch {
    prefs = { zodiacSign: null, dietaryRestrictions: [], knownInterests: [], learningMode: true };
  }

  const hour = new Date().getHours();

  // Check for preference declarations first (like/dislike)
  if (command.intent === 'preference_like' || command.intent === 'preference_dislike') {
    try {
      await addInterest(householdId, processedText);
      return {
        message: command.intent === 'preference_like'
          ? 'Merci, je mémorise vos préférences !'
          : 'Compris, je note que ça ne vous plaît pas.',
        actionType: 'preference_updated',
      };
    } catch {
      // Fall through to unknown handler
    }
  }

  switch (command.intent) {
    case 'greeting':
      return handleGreeting(hour, prefs);
    case 'weather':
      return handleWeather(householdId);
    case 'news':
      return handleNews(householdId);
    case 'sport':
      return handleSport(householdId);
    case 'horoscope':
      return handleHoroscope(householdId, command.entities.sign || prefs.zodiacSign);
    case 'joke':
      return handleJoke();
    case 'quote':
      return handleQuote();
    case 'fun_fact':
      return handleFunFact();
    case 'recipe_search':
      return handleRecipeSearch(householdId, command.entities.query, prefs);
    case 'recipe_random':
      return handleRecipeRandom(householdId);
    case 'recipe_ingredients':
      return handleRecipeIngredients(householdId);
    case 'recipe_step_next':
      return handleRecipeStep(householdId, 'next');
    case 'recipe_step_prev':
      return handleRecipeStep(householdId, 'prev');
    case 'timer':
      return handleTimer(command.entities.seconds);
    case 'calculate':
      return handleCalculate(command.entities.expression);
    case 'whatsapp':
      return handleWhatsApp(householdId);
    case 'navigate':
      return handleNavigate(command.entities.destination);
    case 'reminder_set':
      return handleReminderSet(processedText, householdId);
    case 'reminder_list':
      return handleReminderList(householdId);
    case 'name_ask':
      return handleNameAsk(householdId);
    case 'name_change':
      return handleNameChange(processedText, householdId);
    case 'quiet_mode':
      return handleQuietMode(householdId);
    case 'volume_up':
      return handleVolumeChange(householdId, 'up');
    case 'volume_down':
      return handleVolumeChange(householdId, 'down');
    case 'help':
      return handleHelp();
    case 'list_activities':
      return handleListActivities(householdId);
    case 'ask_price_context':
      return handleAskPriceContext(householdId);
    case 'ask_hours_context':
      return handleAskHoursContext(householdId);
    case 'ask_directions_context':
      return handleAskDirectionsContext(householdId);
    case 'thank_you':
      return {
        message: randomPick([
          'Je vous en prie !',
          'Avec plaisir !',
          'De rien, c\'est mon rôle !',
          'Tout le plaisir est pour moi !',
        ]),
        actionType: 'acknowledgment',
      };
    case 'goodbye':
      return {
        message: hour >= 18
          ? randomPick([
              'Bonne nuit ! Faites de beaux rêves.',
              'À demain ! Reposez-vous bien.',
              'Dors bien ! On se retrouve demain.',
            ])
          : randomPick([
              'Au revoir ! À bientôt !',
              'Bonne journée !',
              'À la prochaine !',
            ]),
        actionType: 'acknowledgment',
      };
    default:
      return handleUnknownWithLearning(householdId, processedText);
  }
}

/* ═══════════════════════════════════════════════════════
   HANDLER IMPLEMENTATIONS — ALL 26 HANDLERS
   ═══════════════════════════════════════════════════════ */

/* ─── 1. Greeting ─── */
function handleGreeting(hour: number, prefs: { musicGenre?: string }): VoiceActionResponse {
  const musicNote = prefs.musicGenre
    ? ` Au fait, je me souviens que vous aimez ${prefs.musicGenre}.`
    : '';

  if (hour < 12) {
    const greetings = MORNING_GREETINGS.sunny;
    return {
      message: randomPick(greetings) + musicNote,
      actionType: 'greeting',
    };
  }

  if (hour < 18) {
    return {
      message: randomPick([
        'Bonjour ! Comment puis-je vous aider ?',
        'Salut ! Que puis-je faire pour vous cet après-midi ?',
        'Bonjour ! Je suis à votre écoute.',
      ]) + musicNote,
      actionType: 'greeting',
    };
  }

  const greetings = EVENING_GREETINGS.default;
  return {
    message: randomPick(greetings) + musicNote,
    actionType: 'greeting',
  };
}

/* ─── 2. Weather ─── */
async function handleWeather(householdId: string): Promise<VoiceActionResponse> {
  try {
    const hh = await prisma.household.findUnique({
      where: { id: householdId },
      select: { coordinates: true, voiceSettings: true },
    });
    const coords = hh?.coordinates as { lat: number; lon: number } | null;
    const lat = coords?.lat ?? 48.8566;
    const lon = coords?.lon ?? 2.3522;

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) {
      return { message: 'Je n\'arrive pas à récupérer la météo pour le moment.', actionType: 'weather_error' };
    }

    const data = await res.json();
    const cw = data.current_weather;
    const today = data.daily;
    const temp = Math.round(cw.temperature);
    const wind = Math.round(cw.windspeed);
    const desc = getWeatherDescription(cw.weathercode);
    const maxTemp = today?.temperature_2m_max?.[0];
    const minTemp = today?.temperature_2m_min?.[0];
    const rain = today?.precipitation_probability_max?.[0];

    return {
      message: `Actuellement ${desc} avec ${temp} degrés. Vent à ${wind} kilomètres heure. Aujourd'hui, entre ${minTemp} et ${maxTemp} degrés.${rain > 50 ? ` ${rain} pour cent de risque de pluie, prenez un parapluie !` : ''}`,
      actionType: 'weather',
      data: { temperature: temp, description: desc, wind, maxTemp, minTemp, rainProb: rain },
    };
  } catch {
    return { message: 'Météo indisponible. Réessayez dans un instant.', actionType: 'weather_error' };
  }
}

/* ─── 3. News ─── */
async function handleNews(householdId: string): Promise<VoiceActionResponse> {
  try {
    const articles = await fetchAllFeeds();
    if (articles.length === 0) {
      return { message: 'Aucune actualité disponible pour le moment.', actionType: 'news_empty' };
    }
    const tts = formatArticlesForTTS(articles, 5);
    return {
      message: tts,
      actionType: 'news',
      data: { count: articles.length, articles: articles.slice(0, 5).map(a => ({ title: a.title, source: a.source })) },
    };
  } catch {
    return { message: 'Impossible de récupérer les actualités. Réessayez plus tard.', actionType: 'news_error' };
  }
}

/* ─── 4. Sport ─── */
async function handleSport(householdId: string): Promise<VoiceActionResponse> {
  try {
    // Get sports news from RSS (filter for sport category if available)
    const articles = await fetchAllFeeds();
    const sportKeywords = ['football', 'match', 'but', 'victoire', 'championnat', 'ligue', 'tennis', 'rugby', 'basket', 'sport'];

    const sportArticles = articles.filter(a =>
      sportKeywords.some(kw => a.title.toLowerCase().includes(kw) || a.description.toLowerCase().includes(kw)),
    );

    if (sportArticles.length === 0) {
      return {
        message: 'Aucun résultat sportif trouvé pour le moment. Essayez de demander les actualités générales.',
        actionType: 'sport_empty',
      };
    }

    const tts = sportArticles.slice(0, 3).map((a, i) => `${i + 1}. ${a.title}`).join('. ');
    return {
      message: `Les dernières infos sport : ${tts}`,
      actionType: 'sport',
      data: { articles: sportArticles.slice(0, 3) },
    };
  } catch {
    return { message: 'Impossible de récupérer les résultats sportifs.', actionType: 'sport_error' };
  }
}

/* ─── 5. Horoscope ─── */
async function handleHoroscope(
  householdId: string,
  sign?: string | null,
): Promise<VoiceActionResponse> {
  try {
    // Try to get sign from preferences if not provided
    if (!sign) {
      const prefs = await getPreferences(householdId);
      sign = prefs.zodiacSign;
    }

    if (!sign) {
      const fallback = getHoroscopeFallback();
      return { message: fallback, actionType: 'horoscope_fallback' };
    }

    const reading = await getHoroscope(sign);
    const tts = formatHoroscopeForTTS(reading);

    return {
      message: tts,
      actionType: 'horoscope',
      data: { sign: reading.sign, luckyNumber: reading.luckyNumber, mood: reading.mood },
    };
  } catch {
    return { message: 'Erreur lors de la lecture des astres. Réessayez plus tard.', actionType: 'horoscope_error' };
  }
}

/* ─── 6. Joke ─── */
function handleJoke(): VoiceActionResponse {
  const joke = randomPick(JOKES);
  return {
    message: `${joke.setup} ... ${joke.punchline}`,
    actionType: 'joke',
    data: joke,
  };
}

/* ─── 7. Quote ─── */
function handleQuote(): VoiceActionResponse {
  const quote = randomPick(QUOTES);
  return {
    message: `${quote.text} — ${quote.author}`,
    actionType: 'quote',
    data: quote,
  };
}

/* ─── 8. Fun Fact ─── */
function handleFunFact(): VoiceActionResponse {
  const fact = randomPick(FUN_FACTS);
  return {
    message: `Le saviez-vous ? ${fact}`,
    actionType: 'fun_fact',
  };
}

/* ─── 9. Recipe Search ─── */
async function handleRecipeSearch(
  householdId: string,
  query?: string,
  prefs?: { dietaryRestrictions?: string[] },
): Promise<VoiceActionResponse> {
  try {
    if (!query || query.trim().length < 2) {
      return {
        message: 'Quel plat souhaitez-vous ? Dites par exemple "recette poulet" ou "recette gâteau".',
        actionType: 'recipe_search_prompt',
      };
    }

    const recipes = await searchLocalRecipes(householdId, query);

    if (recipes.length === 0) {
      // Try smart search as fallback
      const smart = await smartRecipeSearch(householdId, query);
      if (smart) {
        return {
          message: `Voici une recette de ${smart.title}. ${smart.description}. Cette recette nécessite ${smart.ingredientCount} ingrédients et ${smart.stepCount} étapes. Dites "étape suivante" pour commencer la préparation.`,
          actionType: 'recipe_found',
          data: smart,
        };
      }
      return {
        message: `Je n'ai pas trouvé de recette pour "${query}". Essayez un autre plat ou demandez "recette aléatoire".`,
        actionType: 'recipe_not_found',
      };
    }

    const first = recipes[0];
    const detail = await smartRecipeSearch(householdId, query);

    return {
      message: detail
        ? `J'ai trouvé ${recipes.length} recette${recipes.length > 1 ? 's' : ''} pour "${query}". La première est ${detail.title}. ${detail.description}. Elle nécessite ${detail.ingredientCount} ingrédients et ${detail.stepCount} étapes. Dites "ingrédients" pour la liste, ou "étape suivante" pour commencer.`
        : `J'ai trouvé ${recipes.length} recette${recipes.length > 1 ? 's' : ''} pour "${query}" : ${recipes.map(r => r.title).join(', ')}.`,
      actionType: 'recipe_found',
      data: detail || recipes,
    };
  } catch {
    return { message: 'Erreur lors de la recherche de recettes. Réessayez.', actionType: 'recipe_error' };
  }
}

/* ─── 10. Recipe Random ─── */
async function handleRecipeRandom(householdId: string): Promise<VoiceActionResponse> {
  try {
    const recipe = await getRandomRecipe(householdId);

    if (!recipe) {
      // Fallback suggestions
      const suggestions = [
        'Pour ce soir, pourquoi pas une ratatouille provençale ?',
        'Essayez un crumble aux pommes pour le dessert !',
        'Que diriez-vous d\'un gratin dauphinois ?',
        'Un risotto aux champignons serait parfait.',
        'Pour un repas rapide, un bowl de quinoa aux légumes !',
      ];
      return { message: randomPick(suggestions), actionType: 'recipe_suggestion' };
    }

    return {
      message: `Je vous propose ${recipe.title}. ${recipe.description}. Elle nécessite ${recipe.ingredientCount} ingrédients et ${recipe.stepCount} étapes. Dites "ingrédients" pour la liste ou "étape suivante" pour commencer.`,
      actionType: 'recipe_found',
      data: recipe,
    };
  } catch {
    return { message: 'Impossible de trouver une recette. Réessayez.', actionType: 'recipe_error' };
  }
}

/* ─── 11. Recipe Ingredients ─── */
async function handleRecipeIngredients(householdId: string): Promise<VoiceActionResponse> {
  try {
    const tts = await getIngredientsForTTS(householdId);
    return { message: tts, actionType: 'recipe_ingredients' };
  } catch {
    return { message: 'Aucune recette en cours. Demandez d\'abord une recette pour commencer.', actionType: 'recipe_no_session' };
  }
}

/* ─── 12. Recipe Step (next/prev) ─── */
async function handleRecipeStep(
  householdId: string,
  direction: 'next' | 'prev',
): Promise<VoiceActionResponse> {
  try {
    const result = getRecipeStep(householdId, direction);

    if (!result) {
      return {
        message: 'Aucune recette en cours. Demandez d\'abord une recette pour commencer la navigation par étapes.',
        actionType: 'recipe_no_session',
      };
    }

    return {
      message: result.finished
        ? result.step
        : `Étape ${result.stepNumber} sur ${result.totalSteps} : ${result.step}`,
      actionType: result.finished ? 'recipe_finished' : 'recipe_step',
      data: result,
    };
  } catch {
    return { message: 'Erreur lors de la navigation dans la recette.', actionType: 'recipe_error' };
  }
}

/* ─── 13. Timer ─── */
function handleTimer(secondsStr?: string): VoiceActionResponse {
  const seconds = secondsStr ? parseInt(secondsStr, 10) : 60;

  if (isNaN(seconds) || seconds <= 0) {
    return {
      message: 'Combien de temps pour le minuteur ? Dites par exemple "minuteur 5 minutes".',
      actionType: 'timer_prompt',
    };
  }

  let readable: string;
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    readable = `${h} heure${h > 1 ? 's' : ''}${m > 0 ? ` et ${m} minute${m > 1 ? 's' : ''}` : ''}`;
  } else if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    readable = `${m} minute${m > 1 ? 's' : ''}${s > 0 ? ` et ${s} seconde${s > 1 ? 's' : ''}` : ''}`;
  } else {
    readable = `${seconds} seconde${seconds > 1 ? 's' : ''}`;
  }

  return {
    message: `Minuteur réglé sur ${readable}. Je vous préviendrai quand le temps sera écoulé !`,
    actionType: 'timer_set',
    data: { seconds },
    needsConfirmation: true,
  };
}

/* ─── 14. Calculate ─── */
function handleCalculate(expression?: string): VoiceActionResponse {
  if (!expression) {
    return {
      message: 'Que souhaitez-vous calculer ? Dites par exemple "calcule 15 plus 27".',
      actionType: 'calculate_prompt',
    };
  }

  try {
    // Sanitize: only allow digits, +, -, *, /, spaces, parentheses, .
    const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '').trim();

    if (!sanitized) {
      return { message: 'Je n\'ai pas pu comprendre le calcul. Essayez avec des chiffres.', actionType: 'calculate_error' };
    }

    // Use Function constructor for safe math evaluation (no access to globals)
    const result = new Function(`"use strict"; return (${sanitized})`)() as number;

    if (typeof result !== 'number' || !isFinite(result)) {
      return { message: 'Le résultat n\'est pas un nombre valide. Vérifiez votre calcul.', actionType: 'calculate_error' };
    }

    // Format result
    const formatted = Number.isInteger(result) ? result : result.toFixed(2).replace(/\.?0+$/, '');
    return {
      message: `Le résultat de ${expression} est ${formatted}.`,
      actionType: 'calculate_result',
      data: { expression, result },
    };
  } catch {
    return { message: 'Je n\'arrive pas à calculer ça. Vérifiez l\'expression.', actionType: 'calculate_error' };
  }
}

/* ─── 15. WhatsApp ─── */
async function handleWhatsApp(householdId: string): Promise<VoiceActionResponse> {
  try {
    const hh = await prisma.household.findUnique({
      where: { id: householdId },
      select: { contactPhone: true, whatsappNumber: true, contactEmail: true, name: true },
    });

    const phone = hh?.whatsappNumber || hh?.contactPhone;
    const email = hh?.contactEmail;

    if (phone) {
      return {
        message: `Vous pouvez contacter le propriétaire au ${phone}. C'est un numéro ${hh?.whatsappNumber ? 'WhatsApp' : 'téléphone'}.`,
        actionType: 'whatsapp_contact',
        data: { phone, email },
      };
    }

    if (email) {
      return {
        message: `Le propriétaire peut être contacté par email à ${email}.`,
        actionType: 'whatsapp_contact',
        data: { email },
      };
    }

    return {
      message: 'Aucun numéro de contact n\'a été configuré. Le propriétaire peut l\'ajouter dans les paramètres.',
      actionType: 'whatsapp_no_contact',
    };
  } catch {
    return { message: 'Impossible de récupérer les coordonnées du propriétaire.', actionType: 'whatsapp_error' };
  }
}

/* ─── 16. Navigate ─── */
function handleNavigate(destination?: string): Promise<VoiceActionResponse> {
  if (!destination || destination.trim().length < 2) {
    return Promise.resolve({
      message: 'Où souhaitez-vous aller ? Dites par exemple "itinéraire gare du Nord".',
      actionType: 'navigate_prompt',
    });
  }

  return Promise.resolve({
    message: `Pour aller à ${destination}, je vous recommande d'ouvrir Google Maps ou Waze sur votre téléphone pour l'itinéraire en temps réel. En attendant, je peux vous donner la météo de destination si vous le souhaitez !`,
    actionType: 'navigate_direction',
    data: { destination },
  });
}

/* ─── 17. Reminder Set ─── */
async function handleReminderSet(
  text: string,
  householdId: string,
): Promise<VoiceActionResponse> {
  try {
    // Extract the reminder text (remove trigger words)
    const reminderText = text
      .replace(/(rappelle|rappele).*?moi\s*(?:de\s+)?/i, '')
      .replace(/(n.oublie pas|souviens.toi)\s+de\s+/i, '')
      .trim();

    if (!reminderText || reminderText.length < 3) {
      return {
        message: 'Que dois-je vous rappeler ? Dites par exemple "rappelle-moi d\'arroser les plantes".',
        actionType: 'reminder_prompt',
      };
    }

    // Parse time from text or default to 1 hour
    const now = new Date();
    const timeMatch = text.match(/(?:dans\s+)?(\d+)\s*(minutes?|heures?|h|min)/i);
    let triggerAt: Date;

    if (timeMatch) {
      const value = parseInt(timeMatch[1], 10);
      const unit = timeMatch[2].toLowerCase();
      const ms = unit.startsWith('h') || unit.startsWith('heure')
        ? value * 3600_000
        : value * 60_000;
      triggerAt = new Date(now.getTime() + ms);
    } else {
      triggerAt = new Date(now.getTime() + 3600_000); // default: 1 hour
    }

    await prisma.reminder.create({
      data: {
        householdId,
        text: reminderText,
        triggerAt,
        isRecurring: false,
      },
    });

    const timeStr = triggerAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return {
      message: `C'est noté ! Je vous rappellerai de ${reminderText} à ${timeStr}.`,
      actionType: 'reminder_set',
      data: { text: reminderText, triggerAt: triggerAt.toISOString() },
    };
  } catch {
    return { message: 'Impossible de créer le rappel. Réessayez.', actionType: 'reminder_error' };
  }
}

/* ─── 18. Reminder List ─── */
async function handleReminderList(householdId: string): Promise<VoiceActionResponse> {
  try {
    const now = new Date();
    const reminders = await prisma.reminder.findMany({
      where: {
        householdId,
        notified: false,
        triggerAt: { gte: now },
      },
      orderBy: { triggerAt: 'asc' },
      take: 10,
    });

    if (reminders.length === 0) {
      return {
        message: 'Vous n\'avez aucun rappel en attente.',
        actionType: 'reminder_list_empty',
        data: { reminders: [] },
      };
    }

    const list = reminders
      .map((r, i) => {
        const time = r.triggerAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        return `${i + 1}. ${r.text} à ${time}`;
      })
      .join('. ');

    return {
      message: `Voici vos rappels : ${list}.`,
      actionType: 'reminder_list',
      data: {
        count: reminders.length,
        reminders: reminders.map(r => ({
          id: r.id,
          text: r.text,
          triggerAt: r.triggerAt.toISOString(),
        })),
      },
    };
  } catch {
    return { message: 'Impossible de récupérer vos rappels.', actionType: 'reminder_error' };
  }
}

/* ─── 19. Name Ask ─── */
async function handleNameAsk(householdId: string): Promise<VoiceActionResponse> {
  try {
    const hh = await prisma.household.findUnique({
      where: { id: householdId },
      select: { name: true, settings: true },
    });

    let assistantName = DEFAULT_ASSISTANT_NAME;
    if (hh?.settings) {
      try {
        const settings = JSON.parse(hh.settings) as Record<string, unknown>;
        if (settings.assistantName && typeof settings.assistantName === 'string') {
          assistantName = settings.assistantName;
        }
      } catch { /* use default */ }
    }

    return {
      message: `Je m'appelle ${assistantName}. Je suis votre assistant intelligent pour la maison. Dites "aide" pour voir ce que je peux faire !`,
      actionType: 'name_ask',
      data: { name: assistantName },
    };
  } catch {
    return {
      message: `Je m'appelle ${DEFAULT_ASSISTANT_NAME}. Comment puis-je vous aider ?`,
      actionType: 'name_ask',
    };
  }
}

/* ─── 20. Name Change ─── */
async function handleNameChange(
  text: string,
  householdId: string,
): Promise<VoiceActionResponse> {
  try {
    // Try to extract the new name from text
    const namePatterns = [
      /(?:appelle.moi|je m'appelle|mon nom est)\s+(.+)/i,
      /(?:ton nom est|tu t'appelles)\s+(.+)/i,
      /(?:change.*nom.*?)(?:en|pour)\s+(.+)/i,
    ];

    let newName: string | null = null;
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match?.[1]?.trim()) {
        newName = match[1].trim();
        break;
      }
    }

    if (!newName || newName.length > 20) {
      return {
        message: 'Quel nom souhaitez-vous me donner ? Dites par exemple "appelle-moi Athena".',
        actionType: 'name_change_prompt',
      };
    }

    // Update household settings
    const hh = await prisma.household.findUnique({
      where: { id: householdId },
      select: { settings: true },
    });

    let settings: Record<string, unknown> = {};
    if (hh?.settings) {
      try { settings = JSON.parse(hh.settings); } catch { /* use empty */ }
    }

    settings.assistantName = newName;

    await prisma.household.update({
      where: { id: householdId },
      data: { settings: JSON.stringify(settings) },
    });

    return {
      message: `D'accord, à partir de maintenant je m'appelle ${newName} !`,
      actionType: 'name_changed',
      data: { newName },
    };
  } catch {
    return { message: 'Impossible de changer le nom. Réessayez.', actionType: 'name_change_error' };
  }
}

/* ─── 21. Quiet Mode ─── */
async function handleQuietMode(householdId: string): Promise<VoiceActionResponse> {
  try {
    await prisma.household.update({
      where: { id: householdId },
      data: { isQuietMode: true },
    });

    return {
      message: 'Mode silencieux activé. Je ne vous dérangerai plus sauf en cas d\'urgence.',
      actionType: 'quiet_mode_on',
      data: { quietMode: true },
    };
  } catch {
    return { message: 'Impossible d\'activer le mode silencieux.', actionType: 'quiet_mode_error' };
  }
}

/* ─── 22. Volume Change ─── */
async function handleVolumeChange(
  householdId: string,
  direction: 'up' | 'down',
): Promise<VoiceActionResponse> {
  try {
    const hh = await prisma.household.findUnique({
      where: { id: householdId },
      select: { voiceSettings: true },
    });

    let voiceSettings: Record<string, unknown> = {};
    if (hh?.voiceSettings && typeof hh.voiceSettings === 'object') {
      voiceSettings = hh.voiceSettings as Record<string, unknown>;
    }

    const currentVolume = (voiceSettings.volume as number) ?? 0.8;
    const step = 0.1;
    const newVolume = direction === 'up'
      ? Math.min(1, currentVolume + step)
      : Math.max(0, currentVolume - step);

    voiceSettings.volume = Math.round(newVolume * 10) / 10;

    await prisma.household.update({
      where: { id: householdId },
      data: { voiceSettings },
    });

    const percent = Math.round(newVolume * 100);
    return {
      message: direction === 'up'
        ? `Volume augmenté à ${percent} pour cent.`
        : `Volume baissé à ${percent} pour cent.`,
      actionType: 'volume_changed',
      data: { volume: newVolume },
    };
  } catch {
    return { message: 'Impossible de changer le volume.', actionType: 'volume_error' };
  }
}

/* ─── 23. Help ─── */
function handleHelp(): VoiceActionResponse {
  const commands = getSupportedCommands();
  const list = commands
    .map(cat => `${cat.category} : ${cat.commands.join(', ')}`)
    .join('\n');

  const message = `Voici ce que je peux faire :\n${list}\nDites simplement le nom d'une commande pour commencer !`;

  return {
    message,
    actionType: 'help',
    data: commands,
  };
}

/* ─── 25. List Activities ─── */
async function handleListActivities(householdId: string): Promise<VoiceActionResponse> {
  try {
    const activities = await prisma.activity.findMany({
      where: { householdId },
      orderBy: { isPartner: 'desc' },
      take: 10,
    });

    if (activities.length === 0) {
      return {
        message: 'Aucune activité n\'a été configurée pour le moment. Demandez au propriétaire d\'ajouter des recommandations !',
        actionType: 'activities_empty',
      };
    }

    // Set context to first activity for follow-up questions
    const first = activities[0];
    setActivityContext(householdId, {
      id: first.id,
      title: first.title,
      category: first.category,
      priceHint: first.priceHint,
      hoursHint: first.hoursHint,
      distance: first.distance,
      address: first.address,
      whatsappNumber: first.whatsappNumber,
      link: first.link,
      description: first.description,
      isPartner: first.isPartner,
    });

    const categories = [...new Set(activities.map(a => a.category))];
    const partnerCount = activities.filter(a => a.isPartner).length;

    const list = activities.slice(0, 5).map((a, i) => {
      let entry = `${i + 1}. ${a.title}`;
      if (a.distance) entry += ` — ${a.distance}`;
      return entry;
    }).join('. ');

    let message = `Voici ${activities.length} activité${activities.length > 1 ? 's' : ''} recommandée${activities.length > 1 ? 's' : ''}`;
    if (categories.length > 0) message += ` dans les catégories ${categories.join(', ')}`;
    if (partnerCount > 0) message += ` dont ${partnerCount} partenaire${partnerCount > 1 ? 's' : ''}`;
    message += ` : ${list}.`;
    if (activities.length > 5) message += ` Et ${activities.length - 5} autres. Demandez "c'est cher ?" ou "horaires" pour en savoir plus sur la première activité.`;

    return {
      message,
      actionType: 'activities_list',
      data: { activities: activities.map(a => ({ id: a.id, title: a.title, category: a.category, distance: a.distance, isPartner: a.isPartner })) },
    };
  } catch {
    return { message: 'Impossible de récupérer les activités. Réessayez.', actionType: 'activities_error' };
  }
}

/* ─── 26. Ask Price (contextual) ─── */
async function handleAskPriceContext(householdId: string): Promise<VoiceActionResponse> {
  const context = getVoiceContext(householdId);

  if (!context || !context.lastActivityId) {
    return {
      message: 'Je ne suis pas sûr de quelle activité vous parlez. Dites "activités" pour voir la liste d\'abord.',
      actionType: 'activities_no_context',
    };
  }

  if (context.lastActivityPrice) {
    const priceMsg = context.lastActivityPrice.toLowerCase().includes('gratuit')
      ? `${context.lastActivityTitle} est gratuit !`
      : `Le tarif pour ${context.lastActivityTitle} est ${context.lastActivityPrice}.`;
    return {
      message: priceMsg + (context.lastActivityIsPartner ? ' C\'est un partenaire recommandé.' : ''),
      actionType: 'activity_price',
      data: { title: context.lastActivityTitle, price: context.lastActivityPrice },
    };
  }

  if (context.lastActivityWhatsapp) {
    return {
      message: `Je ne connais pas le prix exact pour ${context.lastActivityTitle}. Je peux vous mettre en contact par WhatsApp pour demander.`,
      actionType: 'activity_price_unknown',
      data: { title: context.lastActivityTitle, whatsapp: context.lastActivityWhatsapp },
    };
  }

  return {
    message: `Je n'ai pas d'information de prix pour ${context.lastActivityTitle}. Vous pouvez vérifier sur leur site ou demander au propriétaire.`,
    actionType: 'activity_price_unknown',
  };
}

/* ─── 27. Ask Hours (contextual) ─── */
async function handleAskHoursContext(householdId: string): Promise<VoiceActionResponse> {
  const context = getVoiceContext(householdId);

  if (!context || !context.lastActivityId) {
    return {
      message: 'De quelle activité souhaitez-vous connaître les horaires ? Dites "activités" pour voir la liste.',
      actionType: 'activities_no_context',
    };
  }

  if (context.lastActivityHours) {
    return {
      message: `${context.lastActivityTitle} est ouvert ${context.lastActivityHours}.`,
      actionType: 'activity_hours',
      data: { title: context.lastActivityTitle, hours: context.lastActivityHours },
    };
  }

  return {
    message: `Je n'ai pas les horaires de ${context.lastActivityTitle}. Vérifiez sur leur site ou contactez-les directement.`,
    actionType: 'activity_hours_unknown',
  };
}

/* ─── 28. Ask Directions (contextual) ─── */
async function handleAskDirectionsContext(householdId: string): Promise<VoiceActionResponse> {
  const context = getVoiceContext(householdId);

  if (!context || !context.lastActivityId) {
    return {
      message: 'Où souhaitez-vous aller ? Dites "activités" pour voir les recommandations.',
      actionType: 'activities_no_context',
    };
  }

  let message = `Pour aller à ${context.lastActivityTitle}`;
  if (context.lastActivityDistance) {
    message += ` — c'est ${context.lastActivityDistance}`;
  }
  message += '. Je vous recommande d\'ouvrir Google Maps pour l\'itinéraire en temps réel.';

  return {
    message,
    actionType: 'open_maps',
    data: {
      title: context.lastActivityTitle,
      address: context.lastActivityAddress || context.lastActivityLink || '',
    },
  };
}

/* ─── 24. Unknown with Learning Suggestion ─── */
async function handleUnknownWithLearning(
  householdId: string,
  text: string,
): Promise<VoiceActionResponse> {
  try {
    const result = await suggestLearning(householdId, text);
    if (result.suggestion) {
      return {
        message: `Je ne comprends pas encore "${text}". ${result.suggestion}`,
        actionType: 'learning_suggestion',
      };
    }
  } catch { /* fall through */ }

  return {
    message: randomPick([
      'Je n\'ai pas compris. Dites "aide" pour voir ce que je sais faire !',
      'Hmm, je ne suis pas sûr de comprendre. Essayez de reformuler ?',
      'Pardon ? Je peux vous aider avec la météo, les recettes, les actualités et plus encore !',
      'Je n\'ai pas encore appris cette commande. Dites "aide" pour voir mes capacités.',
    ]),
    actionType: 'unknown',
  };
}
