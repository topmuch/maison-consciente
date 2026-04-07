/* ═══════════════════════════════════════════════════════
   VOICE COMMAND ROUTER — Maison Consciente
   Regex-based French command parser (68 intents)
   Complementary to VoiceCommandEngine (voice-commands.ts)

   3-tier matching:
     1. Exact regex match → confidence 0.9
     2. Keyword fallback   → confidence 0.7
     3. Unknown            → confidence 0.3

   100% local — no external API calls.
   ═══════════════════════════════════════════════════════ */

export type VoiceIntent =
  // 🎵 Audio & Ambiance
  | 'play_music_default' | 'play_music_genre' | 'volume_control' | 'playback_control'
  | 'now_playing' | 'play_radio_stream' | 'mood_scene'
  // 📅 Planning & Rappels
  | 'add_reminder_time' | 'cancel_reminder' | 'list_reminders' | 'add_appointment'
  | 'add_recurring_birthday' | 'add_calendar_event' | 'query_agenda'
  // 🍳 Cuisine & Recettes
  | 'suggest_recipe' | 'add_grocery_item' | 'search_recipe_by_ingredient'
  | 'start_timer' | 'cooking_info' | 'unit_conversion'
  // 🌦️ Météo & Infos
  | 'ask_weather' | 'weather_advice' | 'query_traffic' | 'news_brief'
  | 'sports_score' | 'fun_fact'
  // 💬 Communication & Messages
  | 'send_message' | 'check_messages' | 'quick_household_note' | 'read_messages_aloud'
  // 🧘 Bien-être & Rituels
  | 'trigger_ritual' | 'log_mood' | 'suggest_wellness' | 'query_sleep_stats' | 'hydration_reminder'
  // 🛒 Courses & Shopping
  | 'reorder_favorites' | 'price_comparison' | 'list_active_groceries'
  // 🚗 Transport
  | 'query_eta' | 'traffic_alert' | 'transport_reminder' | 'public_transit_info' | 'parking_assist'
  // 🎁 Hospitality
  | 'repeat_wifi_credentials' | 'appliance_guide' | 'local_recommendation'
  | 'checkout_instructions' | 'contact_host' | 'quick_translation'
  // 🔐 Sécurité
  | 'emergency_contact' | 'safety_equipment_location' | 'activate_away_mode'
  // 🎮 Fun
  | 'entertainment_request' | 'daily_trivia' | 'interactive_game' | 'daily_inspiration'
  // 🔧 Système
  | 'toggle_tts' | 'adjust_speech_rate' | 'repeat_last_response' | 'help_command_list' | 'toggle_detail_level'
  // Contextual
  | 'cancel_last_action' | 'follow_up_question'
  // Legacy compatibility
  | 'mode_night' | 'mode_morning' | 'mode_day' | 'open_guide'
  // Forwarding
  | 'forward_to_engine'  // Forward to legacy VoiceCommandEngine
  // Fallback
  | 'unknown';

export interface VoiceCommand {
  intent: VoiceIntent;
  params: Record<string, string>;
  confidence: number; // 0.0 to 1.0
  // Backward compatibility
  payload: Record<string, string>;
  displayText: string;
  originalText: string;
}

interface IntentPattern {
  intent: VoiceIntent;
  patterns: RegExp[];
  extractParams?: (text: string) => Record<string, string>;
}

// ═══════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════

/** Normalize genre names (e.g., "lo-fi" → "lofi") */
function extractGenre(text: string): string {
  const raw = text.toLowerCase();
  const genreMap: Record<string, string> = {
    'jazz': 'jazz', 'pluie': 'rain', 'feu': 'fire',
    'lo-fi': 'lofi', 'lofi': 'lofi', 'lo fi': 'lofi',
    'classique': 'classical', 'rock': 'rock', 'pop': 'pop',
    'electro': 'electro', 'électro': 'electro',
    'hip-hop': 'hiphop', 'hip hop': 'hiphop', 'hiphop': 'hiphop',
    'ambiance': 'ambient', 'nature': 'nature', 'relaxation': 'relaxation',
    'reggaeton': 'reggaeton', 'salsa': 'salsa', 'bossa': 'bossanova',
    'bossa nova': 'bossanova',
    'r&b': 'rnb', 'soul': 'soul', 'funk': 'funk',
    'blues': 'blues', 'country': 'country', 'metal': 'metal',
    'techno': 'techno', 'house': 'house', 'dubstep': 'dubstep',
    'chill': 'chill', 'acoustique': 'acoustic', 'piano': 'piano',
    'classical': 'classical',
  };
  for (const [key, value] of Object.entries(genreMap)) {
    if (raw.includes(key)) return value;
  }
  // Extract generic word after "de/du/des"
  const match = raw.match(/(?:du|de la|des)\s+(\w+)/i);
  return match ? match[1].trim() : 'unknown';
}

/** Extract time expressions like "dans 5 minutes", "à 14h", "à 14h30" */
function extractTime(text: string): string {
  const lower = text.toLowerCase();

  // "à 14h" or "à 14h30" or "14 heures"
  const hourMatch = lower.match(/(?:à|a)\s+(\d{1,2})\s*h(?:\s*(\d{2}))?/i)
    || lower.match(/(\d{1,2})\s*heures?\s*(\d{2})?/i);
  if (hourMatch) {
    const h = hourMatch[1]?.padStart(2, '0');
    const m = hourMatch[2] || '00';
    return `${h}:${m}`;
  }

  // "dans X minutes/heures"
  const relativeMatch = lower.match(/dans\s+(\d+)\s*(minutes?|heures?|mins?|h)\b/i);
  if (relativeMatch) {
    return `+${relativeMatch[1]}${relativeMatch[2].startsWith('h') ? 'h' : 'm'}`;
  }

  // "midi", "minuit"
  if (lower.includes('midi')) return '12:00';
  if (lower.includes('minuit')) return '00:00';

  return '';
}

/** Extract date like "lundi", "demain", "le 15 mars" */
function extractDate(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes('aujourd\'hui')) return 'today';
  if (lower.includes('demain')) return 'tomorrow';
  if (lower.includes('après-demain')) return 'day_after_tomorrow';

  // Day of week
  const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  for (const day of days) {
    if (lower.includes(day)) return day;
  }

  // "le 15 mars", "le 3 avril 2025"
  const dateMatch = lower.match(/le\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i);
  if (dateMatch) return `${dateMatch[1]} ${dateMatch[2]}`;

  return '';
}

/** Extract duration like "5 minutes", "une heure", "30 secondes" */
function extractDuration(text: string): string {
  const lower = text.toLowerCase();

  // Match "X minutes/secondes/minutes"
  const numMatch = lower.match(/(\d+)\s*(secondes?|secs?|minutes?|mins?|heures?|h)\b/);
  if (numMatch) {
    const value = parseInt(numMatch[1], 10);
    const unit = numMatch[2];
    if (unit.startsWith('s')) return `${value}s`;
    if (unit.startsWith('m') && !unit.startsWith('mi')) return `${value}m`;
    if (unit.startsWith('mi')) return `${value}m`;
    if (unit.startsWith('h')) return `${value}h`;
  }

  // "une heure", "une minute", "une seconde"
  if (lower.includes('une heure') || lower.includes('un heure')) return '1h';
  if (lower.includes('une minute') || lower.includes('un minute')) return '1m';
  if (lower.includes('une seconde') || lower.includes('un seconde')) return '1s';
  if (lower.includes('demi-heure') || lower.includes('trente minutes')) return '30m';
  if (lower.includes('quart d\'heure') || lower.includes('quinze minutes')) return '15m';

  // "cinq minutes", "dix secondes", etc.
  const wordNumbers: Record<string, number> = {
    'zéro': 0, 'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4,
    'cinq': 5, 'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10,
    'onze': 11, 'douze': 12, 'treize': 13, 'quatorze': 14, 'quinze': 15,
    'vingt': 20, 'trente': 30, 'quarante': 40, 'cinquante': 50, 'soixante': 60,
  };
  for (const [word, num] of Object.entries(wordNumbers)) {
    if (num === 0) continue;
    if (lower.includes(`${word} minutes`) || lower.includes(`${word} minute`)) return `${num}m`;
    if (lower.includes(`${word} secondes`) || lower.includes(`${word} seconde`)) return `${num}s`;
    if (lower.includes(`${word} heures`) || lower.includes(`${word} heure`)) return `${num}h`;
  }

  return '';
}

/** Extract a quoted string or the rest of the sentence after certain trigger words */
function extractQuotedOrRest(text: string, after?: string): string {
  // Try quoted string first
  const quoted = text.match(/["«]([^"»]+)["»]/);
  if (quoted) return quoted[1].trim();

  // Try after a specific word
  if (after) {
    const idx = text.toLowerCase().indexOf(after.toLowerCase());
    if (idx !== -1) {
      return text.slice(idx + after.length).replace(/^(?:pour|de|que\s?ce\s?qu[e'])\s*/i, '').trim();
    }
  }

  // Try capturing everything after common trigger words
  const restMatch = text.match(/(?:que|pour|de|texte|message)\s+(?:.+?\s+)?(?:["«]?)?(.+?)(?:["»]?)$/i);
  return restMatch ? restMatch[1].trim() : text.trim();
}

// ═══════════════════════════════════════════════════════
// INTENT DEFINITIONS — ORGANIZED BY CATEGORY
// ═══════════════════════════════════════════════════════

// ─── 🎵 Audio & Ambiance ───

const audioPatterns: IntentPattern[] = [
  {
    intent: 'play_music_default',
    patterns: [
      /mets?\s+(?:de\s+)?la\s+musique/i,
      /lance\s+(?:la\s+)?musique/i,
      /joue(?:r)?\s+(?:de\s+)?la\s+musique/i,
    ],
  },
  {
    intent: 'play_music_genre',
    patterns: [
      /mets?\s+(?:du|de la|des)\s+(jazz|pluie|feu|lofi|lo-?fi|classique|rock|pop|electro|hip-?hop|ambiance|nature|relaxation|reggaeton|salsa|bossa|rnb|soul|funk|blues|techno|house|chill|piano)/i,
      /joue(?:r)?\s+(?:du|de la|des)\s+(jazz|pluie|feu|lofi|lo-?fi|classique|rock|pop|electro|hip-?hop|ambiance|nature|relaxation|reggaeton|salsa|bossa|rnb|soul|funk|blues|techno|house|chill|piano)/i,
      /lance\s+(?:du|de la|des)\s+(jazz|pluie|feu|lofi|lo-?fi|classique|rock|pop|electro|hip-?hop|ambiance|nature|relaxation|reggaeton|salsa|bossa|rnb|soul|funk|blues|techno|house|chill|piano)/i,
    ],
    extractParams: (text) => ({ genre: extractGenre(text) }),
  },
  {
    intent: 'volume_control',
    patterns: [
      /(?:plus\s+fort|augmente)/i,
      /(?:monte)\s+(?:le\s+)?(?:le\s+)?(?:son|volume)/i,
      /(?:moins\s+fort|baisse)\s+(?:le\s+)?(?:le\s+)?(?:son|volume)/i,
      /(?:mute|coup(?:e|é))\s+(?:le\s+)?(?:le\s+)?son/i,
      /(?:son)\s+(?:plus|moins)\s+(?:fort|bas)/i,
    ],
    extractParams: (text) => {
      if (/moins|baisse|mute|coupe|bas/i.test(text)) return { direction: 'down' };
      if (/plus|augmente|monte/i.test(text)) return { direction: 'up' };
      return { direction: 'toggle' };
    },
  },
  {
    intent: 'playback_control',
    patterns: [
      /(?:pause|suspend(?:e|é))/i,
      /(?:reprend(?:s|re)|play|lecture)/i,
      /(?:suivante|suivant|piste\s+suivante)/i,
      /(?:précédent|précédente|avant)/i,
      /(?:stop|arrêt(?:e|é)?|stoppe)/i,
    ],
    extractParams: (text) => {
      if (/pause|suspend/i.test(text)) return { action: 'pause' };
      if (/reprend|play|lecture/i.test(text)) return { action: 'play' };
      if (/suiv/i.test(text)) return { action: 'next' };
      if (/préc/i.test(text)) return { action: 'previous' };
      return { action: 'stop' };
    },
  },
  {
    intent: 'now_playing',
    patterns: [
      /quelle?\s+musique\s+(?:est|est-ce\s+qu(?:on|e))\s+(?:en\s+cours|joue|passe)/i,
      /(?:titre|chanson|musique)\s+(?:en\s+cours|actuel(?:le)?|en\s+lecture)/i,
      /qu'est[- ]ce\s+qu(?:on|e)\s+(?:écoute|joue)/i,
    ],
  },
  {
    intent: 'play_radio_stream',
    patterns: [
      /(?:lance|met(?:s?)?)\s+(?:une\s+)?radio\s+(.+)/i,
      /(?:écoute|joue(?:r)?)\s+(?:la\s+)?radio\s+(.+)/i,
      /(?:radio)\s+(france\s+(?:inter|info|culture|musique)|rtl|europe\s+1|rfi|fip|nova)\b/i,
    ],
    extractParams: (text) => {
      const match = text.match(/radio\s+(.+)/i);
      return { station: match ? match[1].trim() : 'unknown' };
    },
  },
  {
    intent: 'mood_scene',
    patterns: [
      /(?:lance|crée|active|met(?:s?)?)\s+(?:une\s+)?ambiance\s+(f[eê]te|d[eé]tente|concentration|méditation|romantique|travail|sport|jeux|ap[eé]ro|lecture|dîner|soirée)/i,
      /(?:mets?)\s+(?:le\s+)?scene\s+(?:sur\s+)?(\w+)/i,
    ],
    extractParams: (text) => {
      const match = text.match(/ambiance\s+(\S+)/i);
      return { scene: match ? match[1].trim().toLowerCase() : 'unknown' };
    },
  },
];

// ─── 📅 Planning & Rappels ───

const planningPatterns: IntentPattern[] = [
  {
    intent: 'add_reminder_time',
    patterns: [
      /(?:rappelle|rappele)\s+(?:moi\s+)?(?:de\s+)?(.+?)(?:\s+(?:à|a|dans)\s+.+)?$/i,
      /(?:mets?\s+un|ajoute\s+un)\s+(?:rappel|timer|alarme)\s+(?:pour\s+)?(.+)/i,
      /(?:n'oublie\s+pas|souviens[- ]toi)\s+de\s+(.+)/i,
      /(?:rappel)\s+(?:à|a|dans)\s+(.+?)\s+(?:de\s+)?(.+)/i,
    ],
    extractParams: (text) => {
      const time = extractTime(text);
      const date = extractDate(text);
      // Extract the task: remove time expressions
      const task = text
        .replace(/(?:rappelle|rappele|mets?\s+un|ajoute\s+un|rappel|timer|alarme|n'oublie\s+pas|souviens[- ]toi)\s+(?:moi\s+)?(?:de\s+|pour\s+)?/i, '')
        .replace(/(?:à|a|dans)\s+\d+\s*(?:h|heures?|minutes?|mins?|secondes?|secs?)\b/gi, '')
        .replace(/(?:demain|aujourd'hui|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/gi, '')
        .trim();
      return { task: task || text, time, date };
    },
  },
  {
    intent: 'cancel_reminder',
    patterns: [
      /(?:annule|supprime|efface|retire)\s+(?:le\s+)?(?:rappel|timer|alarme|reminder)\s*(?:.+)/i,
      /(?:oublie)\s+(?:le\s+)?(?:rappel|timer|alarme)\s*(?:.+)/i,
    ],
    extractParams: (text) => {
      const match = text.match(/(?:rappel|timer|alarme)\s+(.+)/i);
      return { target: match ? match[1].trim() : 'last' };
    },
  },
  {
    intent: 'list_reminders',
    patterns: [
      /(?:liste|montre|affiche|quels?)\s+(?:mes\s+)?(?:rappels?|reminders?|alarms?|timers?)/i,
      /(?:qu'est[- ]ce\s+que\s+j(?:e\s+)?(?:dois|doit)\s+(?:rappeler|faire|faire)?)/i,
      /(?:mes)\s+(?:rappels?|tâches?|todos?|à[- ]faire)/i,
    ],
  },
  {
    intent: 'add_appointment',
    patterns: [
      /(?:ajoute|planifie|crée|prend(?:s)?\s+(?:un|une)?\s+)?(?:rendez[- ]vous|rdv)\s+(?:avec\s+)?(.+)/i,
      /(?:j(?:e\s+)?(?:ai|ai|aurai|vais\s+avoir))\s+(?:un|une)\s+(?:rendez[- ]vous|rdv|réunion)\s+(?:avec\s+)?(.+)/i,
    ],
    extractParams: (text) => {
      const withMatch = text.match(/(?:avec)\s+(.+)/i);
      const time = extractTime(text);
      const date = extractDate(text);
      return { with: withMatch ? withMatch[1].trim() : '', time, date };
    },
  },
  {
    intent: 'add_recurring_birthday',
    patterns: [
      /(?:ajoute|enregistre|note)\s+(?:l(?:e\s+)?(?:anniversaire|birthday|date)\s+(?:de|d'))\s+(.+)/i,
      /(?:c'est\s+l'?anniversaire|anniversaire\s+(?:de|d'))\s+(.+)/i,
    ],
    extractParams: (text) => {
      const match = text.match(/(?:anniversaire|birthday|date)\s+(?:de|d')\s*(.+)/i);
      return { person: match ? match[1].trim() : '' };
    },
  },
  {
    intent: 'add_calendar_event',
    patterns: [
      /(?:ajoute|crée|planifie|inscris)\s+(?:un\s+)?(?:événement|event|évt)\s+(.+)/i,
      /(?:marque|note)\s+(?:sur\s+le\s+)?(?:calendrier|agenda)\s+(.+)/i,
    ],
    extractParams: (text) => {
      const time = extractTime(text);
      const date = extractDate(text);
      const eventText = text
        .replace(/(?:ajoute|crée|planifie|inscris|marque|note)\s+(?:un\s+)?(?:événement|event|évt)\s+(?:sur\s+le\s+)?(?:calendrier|agenda)\s*/i, '')
        .trim();
      return { event: eventText, time, date };
    },
  },
  {
    intent: 'query_agenda',
    patterns: [
      /(?:quel(le)?\s+)?(?:est\s+)?(?:mon\s+)?(?:agenda|programme|planning|emploi\s+du\s+temps)\s*(?:d'aujourd'hui|de\s+demain|de\s+cette\s+semaine)?/i,
      /(?:qu'est[- ]ce\s+qu(?:e|')\s+j(?:e\s+)?(?:ai|ai|fais|vais\s+faire))/i,
      /(?:mes?\s+)?(?:prochains?\s+)?(?:événements?|rendez[- ]vous|rdv)/i,
    ],
    extractParams: (text) => {
      if (/aujourd'hui/i.test(text)) return { period: 'today' };
      if (/demain/i.test(text)) return { period: 'tomorrow' };
      if (/semaine/i.test(text)) return { period: 'week' };
      return { period: 'today' };
    },
  },
];

// ─── 🍳 Cuisine & Recettes ───

const cuisinePatterns: IntentPattern[] = [
  {
    intent: 'suggest_recipe',
    patterns: [
      /(?:propose|donne|suggère|trouve|qu'est[- ]ce\s+qu(?:e|')\s+(?:on\s+)?(?:peut\s+)?manger)\s*(?:ce\s+soir|pour\s+(?:le\s+)?(?:dîner|déjeuner|petit[- ]déjeuner|midi|ce\s+soir))?/i,
      /(?:une\s+)?(?:recette|idée)\s+(?:pour\s+(?:le\s+)?(?:dîner|déjeuner|petit[- ]déjeuner|midi|ce\s+soir))?(?:.+)/i,
      /(?:on\s+)?(?:mange\s+)?(?:quoi|qu'est[- ]ce\s+qu(?:on|e)\s+mange)/i,
    ],
    extractParams: (text) => {
      if (/dîner|soir/i.test(text)) return { meal: 'dinner' };
      if (/déjeuner|midi/i.test(text)) return { meal: 'lunch' };
      if (/petit[- ]déjeuner|matin/i.test(text)) return { meal: 'breakfast' };
      return { meal: 'any' };
    },
  },
  {
    intent: 'add_grocery_item',
    patterns: [
      /(?:ajoute|mets|note)\s+(.+?)\s+(?:dans\s+les|sur\s+la)\s+(?:liste\s+(?:des\s+)?)?(?:courses?|liste)/i,
      /(?:il\s+(?:me\s+)?(?:faut|manque))\s+(.+?)(?:\.|$)/i,
      /(?:rappel(?:e|é))[- ](?:moi\s+)?(?:d(?:e|')\s+)?acheter\s+(.+)/i,
    ],
    extractParams: (text) => {
      const match = text.match(/(?:ajoute|mets|note|faut|manque|acheter)\s+(?:moi\s+)?(?:de\s+|d(?:e|')?\s+)?(?:les?\s+)?(.+?)(?:\s+(?:dans|sur)\s+.+)?$/i);
      return { item: match ? match[1].trim() : text.trim() };
    },
  },
  {
    intent: 'search_recipe_by_ingredient',
    patterns: [
      /(?:recette|qu(?:e|')\s+faire)\s+(?:avec|avec\s+du|contenant)\s+(.+)/i,
      /(?:j(?:e\s+)?(?:ai|ai|vais)\s+(?:du|des|de la|un|une))\s+(.+)/i,
      /(?:cherche|trouve)\s+(?:une\s+)?recette\s+(?:avec)\s+(.+)/i,
    ],
    extractParams: (text) => {
      const match = text.match(/(?:avec|contenant)\s+(.+)/i);
      return { ingredient: match ? match[1].trim() : '' };
    },
  },
  {
    intent: 'start_timer',
    patterns: [
      /(?:démarre|mets?|lance)\s+(?:un\s+)?(?:minuterie|timer|compt(?:e|à)\s+(?:rebours|a\s+rebours))\s+(?:de\s+)?(.+)/i,
      /(?:minuterie|timer|compteur)\s+(?:de\s+)?(.+)/i,
      /(?:combien\s+de\s+temps|chrono|chronomètre)\s*(?:.+)/i,
    ],
    extractParams: (text) => {
      const duration = extractDuration(text);
      return { duration };
    },
  },
  {
    intent: 'cooking_info',
    patterns: [
      /(?:combien\s+de\s+temps|quelle?\s+durée)\s+(?:pour\s+(?:cuire|préparer|mijoter|bouillir|griller|rôtir))\s*(?:le\s+|la\s+|les?\s+|l')?(.+)/i,
      /(?:comment\s+(?:cuire|préparer|faire\s+cuire))\s+(?:le\s+|la\s+|les?\s+|l')?(.+)/i,
      /(?:température\s+(?:de\s+)?cuisson)\s*(?:pour\s+(?:le\s+|la\s+|les?\s+|l')?)?(.+)/i,
    ],
    extractParams: (text) => {
      const foodMatch = text.match(/(?:cuire|préparer|mijoter|bouillir|griller|rôtir|cuisson)\s+(?:le\s+|la\s+|les?\s+|l')?(.+)/i);
      return { food: foodMatch ? foodMatch[1].trim() : '' };
    },
  },
  {
    intent: 'unit_conversion',
    patterns: [
      /(?:convert(?:ir|is))?\s*(\d+)\s*(?:tasses?|cups?|cuillères?|cuillères?\s+à\s+(?:soupe|café)|c\.?à\s+s\.?|c\.?à\s+c\.?)\s*(?:en)\s*(?: grammes?|g|kg|ml|litres?|onces?|oz)\b/i,
      /(?:combien\s+de\s+)(?:grammes?|g|ml|litres?)\s+(?:dans\s+)?(?:une?\s+)?(?:tasse|cup|cuillère)/i,
      /(?:combien\s+font)\s+(\d+)\s*(?:cuillères?|tasses?|cups?|onces?|oz)\s+en\s+(?:grammes?|ml|litres?)/i,
    ],
    extractParams: (text) => {
      const amountMatch = text.match(/(\d+)/);
      return {
        amount: amountMatch ? amountMatch[1] : '1',
        original: text.trim(),
      };
    },
  },
];

// ─── 🌦️ Météo & Infos ───

const meteoPatterns: IntentPattern[] = [
  {
    intent: 'ask_weather',
    patterns: [
      /(?:quelle?\s+est\s+)?(?:la\s+)?météo\b/i,
      /(?:temps|température)\s+(?:qu'il\s+)?fait\b/i,
      /(?:il\s+fait)\s+(?:quel\s+temps|beau|froid|chaud|moche)/i,
      /(?:prévisions|météo)\s+(?:pour\s+)?(?:aujourd'hui|demain|ce\s+soir|cette\s+semaine)/i,
    ],
    extractParams: (text) => {
      if (/demain/i.test(text)) return { period: 'tomorrow' };
      if (/soir/i.test(text)) return { period: 'evening' };
      if (/semaine/i.test(text)) return { period: 'week' };
      return { period: 'now' };
    },
  },
  {
    intent: 'weather_advice',
    patterns: [
      /(?:faut[- ]il|est[- ]ce\s+que\s+j(?:e\s+)?(?:dois|devrais))\s+(?:prendre\s+(?:un|une)\s+)?(?:parapluie|imperméable|manteau|pull|veste|écharpe)/i,
      /(?:quel(?:le)?\s+vêtement?s?|comment\s+s'habiller)\s*(?:pour\s+(?:aujourd'hui|demain|ce\s+soir))?/i,
      /(?:vais[- ]je\s+(?:avoir\s+)?froid|chaud|pleuvoir)/i,
    ],
    extractParams: (text) => {
      if (/demain/i.test(text)) return { period: 'tomorrow' };
      return { period: 'today' };
    },
  },
  {
    intent: 'query_traffic',
    patterns: [
      /(?:quelle?\s+est\s+)?(?:l(?:e|a)\s+)?(?:circulation|trafic|bouchons?|état\s+(?:des\s+)?(?:routes?|autoroutes?))/i,
      /(?:y\s+a[- ]t[- ]il)\s+(?:des\s+)?(?:bouchons?|ralentissements?|embouteillages?)/i,
      /(?:combien\s+de\s+temps)\s+(?:pour\s+(?:aller\s+à|aller)\s+(.+)/i,
    ],
    extractParams: (text) => {
      const destMatch = text.match(/(?:aller\s+(?:à|a))\s+(.+)/i);
      return { destination: destMatch ? destMatch[1].trim() : '' };
    },
  },
  {
    intent: 'news_brief',
    patterns: [
      /(?:quelle?s?\s+)?(?:les?\s+)?(?:actualité|nouveautés?|nouvelles?|infos?|journal)\s*(?:d'aujourd'hui|de\s+demain|du\s+jour)?/i,
      /(?:qu(?:e|')\s+(?:se\s+)?passe[- ]t[- ]il|s'est[- ]il\s+passé)/i,
      /(?:résum(?:é|e)\s+)?(?:d(?:e|')?\s+)?(?:l(?:e|a)\s+)?(?:actualité|jour|quotidien)/i,
    ],
  },
  {
    intent: 'sports_score',
    patterns: [
      /(?:score|résultat)\s+(?:du\s+)?(?:match|jeu|matchs?)\s+(?:de\s+)?(.+)/i,
      /(?:quel(?:le)?\s+est\s+le\s+)?(?:score|résultat)\s*(?:du\s+jour)?/i,
      /(?:a[- ]gagné|a\s+perdu)\s+(?:le\s+)?(?:match|matchs?)/i,
    ],
    extractParams: (text) => {
      const sportMatch = text.match(/(?:de\s+)?(foot(?:ball)?|rugby|tennis|basket|basketball|handball|volley|formule\s*1|f1|cyclisme|golf|natation|athlétisme)/i);
      return { sport: sportMatch ? sportMatch[1].trim().toLowerCase() : 'general' };
    },
  },
  {
    intent: 'fun_fact',
    patterns: [
      /(?:raconte[- ]moi|dis[- ]moi|quelqu(?:e|')?\s+(?:chose|truc))\s+(?:un|une)?\s+(?:fait|anecdote|curiosité|info)\s+(?:intéressant|drôle|inédit|marrant|insolite)?/i,
      /(?:savais[- ]tu|est[- ]ce\s+que\s+(?:tu|vous)\s+(?:savais|savez))\s+(?:que|qu(?:e|'))?/i,
      /(?:le\s+)?(?:saviez[- ]vous|savoir)\s+(?:du\s+jour|inédit)/i,
    ],
  },
];

// ─── 💬 Communication & Messages ───

const communicationPatterns: IntentPattern[] = [
  {
    intent: 'send_message',
    patterns: [
      /(?:envoie|envoye|envoyer)\s+(?:un\s+)?(?:message|sms|texto)\s+(?:à|a)\s+(.+)/i,
      /(?:dis[- ](?:lui|leur|moi)|écris\s+(?:à|a))\s+(?:que|qu(?:e|'))\s+(.+)/i,
      /(?:message|sms|texto)\s+(?:à|a)\s+(.+)/i,
    ],
    extractParams: (text) => {
      const toMatch = text.match(/(?:à|a)\s+(.+?)(?:\s+(?:que|qu(?:e|')?|\s+dis|\s+écris)\s+.+)?$/i);
      const bodyMatch = text.match(/(?:que|qu(?:e|')?)\s+(.+)/i);
      return {
        to: toMatch ? toMatch[1].trim() : '',
        body: bodyMatch ? bodyMatch[1].trim() : '',
      };
    },
  },
  {
    intent: 'check_messages',
    patterns: [
      /(?:j(?:e\s+)?(?:ai|ai|vais)\s+(?:des|un|de\s+nouveaux))\s+(?:messages?|sms|textos?)/i,
      /(?:combien\s+de\s+)?(?:messages?|sms|textos?|notifications?)\s+(?:non\s+lus?|en\s+attente|manquants?|nouveaux?)/i,
      /(?:voir|affiche|montre|liste)\s+(?:mes\s+)?(?:messages?|sms|textos?|notifications?)/i,
    ],
  },
  {
    intent: 'quick_household_note',
    patterns: [
      /(?:laisse[- ]un|écris[- ]un)\s+(?:mot|note|message)\s+(?:pour\s+(?:tout\s+le\s+monde|la\s+maison|la\s+famille|les\s+autres))/i,
      /(?:petit\s+mot|note\s+rapide|avis)\s+(?:à|a|pour)\s+(?:la\s+)?(?:maison|famille|tout\s+le\s+monde)/i,
      /(?:note\s+pour\s+)(?:tout\s+le\s+monde|la\s+maison)\s*[:.]\s*(.+)/i,
    ],
    extractParams: (text) => {
      const match = text.match(/(?:maison|famille|tout\s+le\s+monde)\s*[:.]\s*(.+)/i);
      return { note: match ? match[1].trim() : '' };
    },
  },
  {
    intent: 'read_messages_aloud',
    patterns: [
      /(?:lis|lire|lit)\s+(?:moi\s+)?(?:mes\s+)?(?:derniers?\s+)?(?:messages?|sms|textos?)/i,
      /(?:récite|relis)\s+(?:les\s+)?(?:messages?|sms|notes?)/i,
      /(?:qu(?:e|')\s+(?:ont[- ]ils?|a[- ]t[- ]on)\s+(?:dit|écrit|laissé))/i,
    ],
  },
];

// ─── 🧘 Bien-être & Rituels ───

const wellnessPatterns: IntentPattern[] = [
  {
    intent: 'trigger_ritual',
    patterns: [
      /(?:lance|mets?|active|démarre)\s+(?:le\s+)?(?:rituel|routine|moment)\s+(?:du\s+)?(?:matin|soir|coucher|r[eé]veil|méditation|respiration|yoga|étirement|stretching)/i,
      /(?:c(?:e|')\s+(?:est|est)\s+l(?:e|a)\s+)?(?:moment\s+de|routine|rituel)\s+(.+)/i,
    ],
    extractParams: (text) => {
      if (/matin|r[eé]veil/i.test(text)) return { ritual: 'morning' };
      if (/soir|coucher/i.test(text)) return { ritual: 'evening' };
      if (/méditation|respiration/i.test(text)) return { ritual: 'meditation' };
      if (/yoga|étirement|stretching/i.test(text)) return { ritual: 'yoga' };
      const match = text.match(/(?:rituel|routine|moment)\s+(?:du\s+)?(\S+)/i);
      return { ritual: match ? match[1].trim() : 'unknown' };
    },
  },
  {
    intent: 'log_mood',
    patterns: [
      /(?:je\s+(?:s(?:e\s+)?sens|me\s+sens|suis|vais)\s+(?:très?\s+)?)?(?:content|heureux|joyeux|bien|fatigué|stressé|anxieux|triste|calme|agité|excité|énervé|frustré|motivé|déçu)/i,
      /(?:mon?\s+)?(?:humeur|mood)\s+(?:est|serait)\s+(?:très?\s+)?(\S+)/i,
      /(?:aujourd'hui\s+j(?:e\s+)?(?:s(?:e\s+)?sens|suis))\s+(?:très?\s+)?(\S+)/i,
    ],
    extractParams: (text) => {
      const moods = ['content', 'heureux', 'joyeux', 'bien', 'fatigué', 'stressé', 'anxieux', 'triste', 'calme', 'agité', 'excité', 'énervé', 'frustré', 'motivé', 'déçu'];
      const lower = text.toLowerCase();
      for (const mood of moods) {
        if (lower.includes(mood)) return { mood };
      }
      const match = text.match(/(?:humeur|mood)\s+(?:est|serait)\s+(?:très?\s+)?(\S+)/i);
      return { mood: match ? match[1].trim() : 'unknown' };
    },
  },
  {
    intent: 'suggest_wellness',
    patterns: [
      /(?:propose|suggère|donne)\s+(?:moi\s+)?(?:un(?:e)?\s+)?(?:activit(?:é|e)|exercice|conseil|astuce|idée)\s+(?:bien[- ]?être|sant(?:é|e)|relaxation|détente|méditation|yoga)/i,
      /(?:j(?:e\s+)?(?:ai|ai)\s+besoin\s+de\s+)?(?:relaxer|m(?:e\s+)?(?:détendre|calmer|reposer))/i,
      /(?:quoi\s+faire\s+pour)\s+(?:se\s+)?(?:détendre|relaxer|calmer|reposer)/i,
    ],
  },
  {
    intent: 'query_sleep_stats',
    patterns: [
      /(?:quelle?\s+est\s+)?(?:mon?\s+)?(?:qualit(?:é|e)\s+(?:de\s+)?)?sommeil\b/i,
      /(?:combien\s+(?:d(?:e|')?\s+)?heures?\s+(?:ai[- ]je|j(?:e\s+)?(?:ai|ai)\s+(?:dormi|slept)))/i,
      /(?:statistiques?\s+(?:de\s+)?)?(?:sommeil|sleep|coucher|r[eé]veil)/i,
    ],
  },
  {
    intent: 'hydration_reminder',
    patterns: [
      /(?:rappelle[- ]moi|n'oublie\s+pas)\s+de\s+boire/i,
      /(?:j(?:e\s+)?(?:ai|ai)\s+(?:besoin|oublié|oubli(?:é|e)))\s+de\s+boire/i,
      /(?:hydrat(?:e|ion)|boire|verre\s+d'eau)/i,
    ],
    extractParams: (text) => {
      const match = text.match(/(\d+)\s*(?:verres?|litres?|glasses?)/i);
      return { glasses: match ? match[1] : '1' };
    },
  },
];

// ─── 🛒 Courses & Shopping ───

const shoppingPatterns: IntentPattern[] = [
  {
    intent: 'reorder_favorites',
    patterns: [
      /(?:réapprovisionne|commande|recommande)\s+(?:mes?\s+)?(?:favoris?|habituels?|habitudes?|frequents?|d'habitude)/i,
      /(?:commande\s+à\s+nouveau|recommande)\s+(?:les?\s+)?(?:mêmes?\s+)?(?:courses?|articles?|produits?)/i,
      /(?:comme\s+(?:d'|de)\s+habitude|comme\s+la\s+dernière\s+fois)\s+(?:les?\s+)?(?:courses?|commande)/i,
    ],
  },
  {
    intent: 'price_comparison',
    patterns: [
      /(?:compare|comparer)\s+(?:les?\s+)?(?:prix|tarifs?|coûts?)\s+(?:de|pour|du?\s+)?(.+)/i,
      /(?:où\s+(?:trouver|acheter))\s+(?:le\s+moins\s+cher|au\s+meilleur\s+prix|en\s+promo|en\s+promotion)\s+(.+)/i,
      /(?:quel(?:le)?\s+est\s+le\s+)?(?:meilleur|moins\s+cher|moins\s+coûteux)\s+prix\s+(?:pour|de|du)\s+(.+)/i,
    ],
    extractParams: (text) => {
      const match = text.match(/(?:prix|tarifs?|coûts?|cher|acheter|trouver)\s+(?:pour|de|du?\s+)?(.+)/i);
      return { item: match ? match[1].trim() : '' };
    },
  },
  {
    intent: 'list_active_groceries',
    patterns: [
      /(?:montre|affiche|liste|qu(?:e|')\s+(?:est[- ]ce\s+qu(?:e|')?\s+(?:il\s+)?y\s+a|rest[- ]?t[- ]il))\s+(?:sur\s+)?(?:la\s+)?(?:liste\s+(?:des\s+)?)?(?:courses?|achats?)/i,
      /(?:quel(?:le)?s?\s+)?(?:courses?|achats?|articles?|produits?)\s+(?:rest[- ]?t[- ]il|restent?|en\s+cours|en\s+attente|à\s+acheter)/i,
      /(?:ma\s+)?(?:liste\s+(?:des\s+)?)?(?:courses?|achats?)/i,
    ],
  },
];

// ─── 🚗 Transport ───

const transportPatterns: IntentPattern[] = [
  {
    intent: 'query_eta',
    patterns: [
      /(?:combien\s+de\s+temps)\s+(?:pour\s+(?:aller\s+(?:à|a)))\s+(.+)/i,
      /(?:quel(?:le)?\s+est\s+l(?:e|a)\s+)?(?:durée|temps)\s+(?:de\s+)?(?:trajet|parcours|route|chemin)\s+(?:jusqu(?:e|')?\s+(?:à|a)\s+)?(.+)/i,
      /(?:à\s+quelle\s+heure)\s+(?:serai[- ]je|arriverai[- ]je|arrive)\s+(?:à|a)\s+(.+)/i,
    ],
    extractParams: (text) => {
      const destMatch = text.match(/(?:à|a|pour)\s+(?:le\s+)?(?:la\s+)?(?:l(?:e|a)\s+)?(.+?)(?:\s*$|\?)/i);
      return { destination: destMatch ? destMatch[1].trim() : '' };
    },
  },
  {
    intent: 'traffic_alert',
    patterns: [
      /(?:alert(?:e|es?))\s+(?:circulation|trafic|bouchons?|travaux)/i,
      /(?:y\s+a[- ]t[- ]il)\s+(?:des\s+)?(?:problèmes?|travaux?|incidents?|bouchons?|perturbations?)\s+(?:sur\s+(?:le\s+)?.+)?/i,
      /(?:état)\s+(?:des\s+)?(?:routes?|autoroutes?|transports?|circulation)/i,
    ],
  },
  {
    intent: 'transport_reminder',
    patterns: [
      /(?:rappelle[- ]moi)\s+(?:de\s+)?(?:quitter|partir|prendre|monter)\s+(?:dans|à|vers)\s+(?:\d+\s*(?:minutes?|heures?))/i,
      /(?:je\s+dois\s+partir|il\s+faut\s+partir)\s+(?:à|a|vers)\s+(?:\d+h)/i,
      /(?:alerte|rappel)\s+(?:départ|sortie|train|bus|métro|avion)\s*(?:\d+h|\d+\s*(?:minutes?|heures?))/i,
    ],
    extractParams: (text) => {
      const time = extractTime(text);
      return { time };
    },
  },
  {
    intent: 'public_transit_info',
    patterns: [
      /(?:prochain\s+)?(?:train|bus|métro|tram|r[eé]r|ter)\s+(?:pour|vers|à\s+direction\s+de)\s+(.+)/i,
      /(?:quand)\s+(?:passe|arrive)\s+(?:le\s+)?(?:prochain\s+)?(?:train|bus|métro|tram|r[eé]r)\b/i,
      /(?:horaires?\s+(?:de\s+)?)?(?:train|bus|métro|tram|r[eé]r|transports?\s+(?:en\s+)?commun)/i,
    ],
    extractParams: (text) => {
      const dirMatch = text.match(/(?:pour|vers|direction\s+(?:de)\s+)(.+)/i);
      return { direction: dirMatch ? dirMatch[1].trim() : '', transport: 'public' };
    },
  },
  {
    intent: 'parking_assist',
    patterns: [
      /(?:où\s+(?:trouver|est|se\s+trouve|garer))\s+(?:un\s+)?(?:parking|place\s+de\s+parking|stationnement|garage)/i,
      /(?:parking|stationnement)\s+(?:le\s+plus\s+)?(?:proche|près|disponible|libre|ouvert)/i,
      /(?:place\s+de\s+)?(?:parking|stationnement)\s+(?:disponible|libre|ouverte)/i,
    ],
  },
];

// ─── 🎁 Hospitality ───

const hospitalityPatterns: IntentPattern[] = [
  {
    intent: 'repeat_wifi_credentials',
    patterns: [
      /(?:quel(?:le)?\s+est\s+(?:le\s+)?)?mot\s+de\s+passe\s+(?:wi[- ]?fi|wifi|wlan)\b/i,
      /(?:comment\s+(?:se\s+)?connect(?:e|er)\s+(?:au|en)\s+)?(?:wi[- ]?fi|wifi)\b/i,
      /(?:identifiants?\s+(?:wi[- ]?fi|wifi|réseau))\b/i,
      /(?:réseau|connection)\s+(?:wi[- ]?fi|wifi|internet)/i,
    ],
  },
  {
    intent: 'appliance_guide',
    patterns: [
      /(?:comment\s+(?:m(?:e\s+)?(?:utiliser|allumer|éteindre|démarrer|mettre\s+en\s+marche|arrêter))\s+(?:le\s+|la\s+|les?\s+|l'))?(.+?)(?:\?|$)/i,
      /(?:où\s+est\s+(?:le\s+)?(?:manuel|guide|notice)\s+(?:de\s+)?)?(.+?)(?:\?|$)/i,
    ],
    extractParams: (text) => {
      const appliance = text
        .replace(/(?:comment|où)\s+(?:s(?:e\s+)?|(?:est\s+le)\s+)?(?:m(?:e\s+)?(?:utiliser|allumer|éteindre|démarrer|arrêter|mettre))\s+(?:le\s+|la\s+|les?\s+|l')?/i, '')
        .replace(/(?:où\s+est\s+(?:le\s+)?(?:manuel|guide|notice)\s+(?:de\s+)?(?:le\s+|la\s+|les?\s+|l')?)/i, '')
        .replace(/(?:manuel|guide|notice)/i, '')
        .trim();
      return { appliance: appliance || 'unknown' };
    },
  },
  {
    intent: 'local_recommendation',
    patterns: [
      /(?:où\s+(?:trouver|manger|boire|aller|dormir|sortir|visiter|aller\s+se\s+promener))\s+(?:autour\s+d(?:e|')?ici|dans\s+(?:le\s+)?(?:coin|quartier|voisinage|environs))/i,
      /(?:recommand(?:e|ation))\s+(?:restaurant|bar|café|musée|parc|magasin|boutique|pharmacie|boulangerie|boucherie|supermarché|épicerie)/i,
      /(?:que\s+(?:faire|voir|visiter)\s+(?:ici|autour|dans\s+(?:le\s+)?(?:coin|quartier)))/i,
      /(?:bon\s+(?:restaurant|endroit|plan|coin|adresse))\s+(?:dans\s+(?:le\s+)?(?:coin|quartier|voisinage|environs))?/i,
    ],
    extractParams: (text) => {
      if (/restaurant|resto|manger|dîner|déjeuner/i.test(text)) return { category: 'restaurant' };
      if (/bar|boire|verre|café|apéro/i.test(text)) return { category: 'bar' };
      if (/musée|visiter|culturel/i.test(text)) return { category: 'culture' };
      if (/parc|promenade|nature|sortir/i.test(text)) return { category: 'park' };
      if (/pharmacie|pharmacie\b/i.test(text)) return { category: 'pharmacy' };
      if (/boulangerie|pain/i.test(text)) return { category: 'bakery' };
      if (/supermarché|épicerie|courses/i.test(text)) return { category: 'grocery' };
      return { category: 'general' };
    },
  },
  {
    intent: 'checkout_instructions',
    patterns: [
      /(?:comment\s+)?(?:partir|quitter|check[- ]out|checkout|rendre\s+(?:les\s+)?clés?)/i,
      /(?:procédure|instructions?|consignes?)\s+(?:de\s+)?(?:départ|checkout|check[- ]out)/i,
      /(?:que\s+faire\s+avant\s+de\s+)?(?:partir|quitter)/i,
    ],
  },
  {
    intent: 'contact_host',
    patterns: [
      /(?:contact(?:e|er|ez?))\s+(?:l(?:e|a)\s+)?(?:propriétaire|hôte|host|proprietaire|maître\s+(?:de\s+)?maison)/i,
      /(?:comment\s+(?:joindre|contacter|appeler|appeller)\s+(?:le\s+|la\s+)?(?:propriétaire|hôte|host))/i,
      /(?:où\s+(?:trouver|est))\s+(?:le\s+)?(?:numéro|téléphone|contact)\s+(?:du\s+|de\s+la\s+)?(?:propriétaire|hôte|host)/i,
    ],
  },
  {
    intent: 'quick_translation',
    patterns: [
      /(?:comment\s+(?:on\s+)?dit|traduis?|traduction|comment\s+dire)\s+(?:en\s+(?:anglais|espagnol|allemand|italien|portugais|néerlandais|chinois|japonais|arabe|russe))?\s*[:.]?\s*(.+)/i,
      /(?:tradui(?:re|s))\s+(?:en\s+(?:anglais|espagnol|allemand|italien|portugais|néerlandais|chinois|japonais|arabe|russe))?\s+(.+)/i,
      /(?:comment\s+dit[- ]on)\s+(?:en\s+(\w+))?\s+(.+)/i,
    ],
    extractParams: (text) => {
      const langMap: Record<string, string> = {
        'anglais': 'en', 'english': 'en', 'espagnol': 'es', 'allemand': 'de',
        'italien': 'it', 'portugais': 'pt', 'néerlandais': 'nl',
        'chinois': 'zh', 'japonais': 'ja', 'arabe': 'ar', 'russe': 'ru',
      };
      const lower = text.toLowerCase();
      let targetLang = 'en'; // default
      for (const [key, code] of Object.entries(langMap)) {
        if (lower.includes(key)) { targetLang = code; break; }
      }
      const phrase = text
        .replace(/(?:comment\s+(?:on\s+)?dit|traduis?|traduction|comment\s+dire|traduire|traduis)\s+(?:en\s+\w+\s*)?[:.]?\s*/i, '')
        .replace(/(?:comment\s+dit[- ]on)\s+(?:en\s+\w+\s+)/i, '')
        .trim();
      return { phrase, targetLang };
    },
  },
];

// ─── 🔐 Sécurité ───

const securityPatterns: IntentPattern[] = [
  {
    intent: 'emergency_contact',
    patterns: [
      /(?:urgence|urgence)\s*(?:numéro|appel|contact|services?)/i,
      /(?:numéro\s+d(?:e|')?\s+)?(?:urgence|pompiers|police|samu|ambulance|secours)/i,
      /(?:appelle|compose(?:r)?)\s+(?:les?\s+)?(?:urgences?|pompiers|police|samu|ambulance|secours|15|17|18|112|911)/i,
    ],
    extractParams: (text) => {
      if (/pompiers|18/i.test(text)) return { service: 'firefighters', number: '18' };
      if (/police|17/i.test(text)) return { service: 'police', number: '17' };
      if (/samu|ambulance|15|medical/i.test(text)) return { service: 'medical', number: '15' };
      if (/112|europe/i.test(text)) return { service: 'european', number: '112' };
      if (/911|usa|americ/i.test(text)) return { service: 'usa', number: '911' };
      return { service: 'emergency', number: '15' };
    },
  },
  {
    intent: 'safety_equipment_location',
    patterns: [
      /(?:où\s+(?:est|sont|trouver|se\s+trouve))\s+(?:le\s+|la\s+|les?\s+)?(?:extincteur|trousse|kit|détecteur|alarme|sortie|issue)\s+(?:de\s+)?(?:secours|sécurité|incendie|premiers?\s+soins|urgence)/i,
      /(?:localis(?:e|ation))\s+(?:du?\s+)?(?:extincteur|trousse|kit|détecteur|alarme|sortie|issue)/i,
      /(?:où\s+(?:sont|trouver))\s+(?:les?\s+)?(?:sorties?\s+(?:de\s+)?)?(?:secours|urgence|évacuation)/i,
    ],
    extractParams: (text) => {
      if (/extincteur|incendie/i.test(text)) return { equipment: 'extinguisher' };
      if (/trousse|premiers?\s+soins|kit/i.test(text)) return { equipment: 'first_aid' };
      if (/détecteur|fumée|incendie/i.test(text)) return { equipment: 'smoke_detector' };
      if (/sortie|issue|évacuation/i.test(text)) return { equipment: 'emergency_exit' };
      return { equipment: 'unknown' };
    },
  },
  {
    intent: 'activate_away_mode',
    patterns: [
      /(?:active|active|mets?|démarre)\s+(?:le\s+)?(?:mode\s+)?(?:absence|vacances|sécurit(?:é|e)|surveillance|away)/i,
      /(?:je\s+)?(?:pars?|part(?:s)?|quitte)\s+(?:en\s+)?(?:vacances|voyage|week[- ]end)/i,
      /(?:sécuris(?:e|er))\s+(?:la\s+)?(?:maison|appartement|propriété)/i,
    ],
  },
];

// ─── 🎮 Fun ───

const funPatterns: IntentPattern[] = [
  {
    intent: 'entertainment_request',
    patterns: [
      /(?:mets?\s+(?:un\s+)?(?:film|série|vidéo|spectacle)|lance\s+(?:un\s+)?(?:film|série))\b/i,
      /(?:je\s+)?(?:veux?\s+(?:regarder|voir|écouter))\s+(?:un\s+)?(?:film|série|vidéo|émission|spectacle|concert|émission)\s*(?:.+)/i,
      /(?:qu(?:e|')\s+(?:puis[- ]je|peut[- ]on)\s+)?(?:regarder|écouter)\s+(?:maintenant|ce\s+soir)/i,
    ],
    extractParams: (text) => {
      if (/film/i.test(text)) return { type: 'movie' };
      if (/série/i.test(text)) return { type: 'series' };
      if (/musique|concert|écouter/i.test(text)) return { type: 'music' };
      return { type: 'any' };
    },
  },
  {
    intent: 'daily_trivia',
    patterns: [
      /(?:pose[- ]moi|donne[- ]moi|une?\s+)?(?:question|quiz|questionnaire|culture\s+génér(?:ale|ale)|trivia)/i,
      /(?:quiz|jeu\s+(?:de\s+)?questions?|devinette|énigme)\b/i,
      /(?:teste\s+(?:mes?\s+)?(?:connaissances?|cultures?))/i,
    ],
  },
  {
    intent: 'interactive_game',
    patterns: [
      /(?:jou(?:e|ons|er))\s+(?:à|a)\s+(?:un\s+)?(?:jeu|jeux)\s*(?:.+)/i,
      /(?:lance|démarre|ouvre)\s+(?:un\s+)?(?:jeu)\s*(?:.+)/i,
      /(?:on\s+)?(?:jou(?:e|ons|er))\s+(?:à\s+(?:un\s+)?)?(?:quelque\s+chose|un\s+jeu)/i,
    ],
    extractParams: (text) => {
      if (/devinette|énigme|blague/i.test(text)) return { game: 'riddle' };
      if (/quiz|culture|question/i.test(text)) return { game: 'quiz' };
      if (/mot|motus|pendu/i.test(text)) return { game: 'word' };
      return { game: 'unknown' };
    },
  },
  {
    intent: 'daily_inspiration',
    patterns: [
      /(?:citation|phrase|pens(?:e|ée)|proverbe|dicton)\s+(?:du\s+)?(?:jour|matin|soir)/i,
      /(?:inspir(?:e|ation)|motiv(?:e|ation))\s+(?:du\s+)?jour/i,
      /(?:dis[- ]moi\s+(?:une?\s+)?)?(?:citation|phrase|mot)\s+(?:inspir(?:e|ant)|motiv(?:e|ant)|positive|gentille|belle)/i,
    ],
  },
];

// ─── 🔧 Système ───

const systemPatterns: IntentPattern[] = [
  {
    intent: 'toggle_tts',
    patterns: [
      /(?:active|désactive|coup(?:e|é))\s+(?:la\s+)?(?:voix|synthèse|vocale|tts|lecture\s+vocale|parole)/i,
      /(?:parle(?:r)?|ne\s+parle\s+plus|arrête\s+de\s+parler|tais[- ]toi)\b/i,
      /(?:voix)\s+(?:activ(?:é|e)e?|désactiv(?:é|e)e?|on|off)/i,
    ],
    extractParams: (text) => {
      if (/désactive|coupe|désactiv|off|ne\s+parle|arrête|tais/i.test(text)) return { enabled: 'false' };
      return { enabled: 'true' };
    },
  },
  {
    intent: 'adjust_speech_rate',
    patterns: [
      /(?:parle\s+(?:plus|moins)\s+(?:vite|lentement)|ralentis?\s+(?:la\s+)?(?:voix|parole|synthèse)|accél(?:ère|er(?:e|é))\s+(?:la\s+)?(?:voix|parole|synthèse))/i,
      /(?:vitesse)\s+(?:de\s+)?(?:la\s+)?(?:parole|voix|synthèse|lecture)\s*(?:plus|moins)?\s*(?:vite|lent(?:e)?)/i,
      /(?:débit)\s+(?:plus|moins)\s+(?:rapide|lent|vite)/i,
    ],
    extractParams: (text) => {
      if (/lent|ralent|moins/i.test(text)) return { rate: 'slower' };
      if (/vite|rapide|accél/i.test(text)) return { rate: 'faster' };
      return { rate: 'normal' };
    },
  },
  {
    intent: 'repeat_last_response',
    patterns: [
      /(?:rép(?:è|e)te|redis|dis[- ]moi\s+encore|pourrais[- ]tu\s+rép(?:è|e)ter|peux[- ]tu\s+rép(?:è|e)ter)\s*(?:ce\s+que\s+(?:tu\s+)?(?:viens\s+de\s+dire|as\s+dit))?/i,
      /(?:j(?:e\s+)?(?:n(?:e|')\s+(?:ai\s+pas|ai\s+pas)\s+(?:bien|entendu|compris)))/i,
      /(?:tu\s+peux\s+rép(?:è|e)ter|pardon|heinn?|excuse[- ]moi)/i,
    ],
  },
  {
    intent: 'help_command_list',
    patterns: [
      /(?:aide|help|que\s+(?:peux[- ]?tu|sais[- ]?tu)\s+faire|commandes?|qu(?:e|')\s+(?:peut[- ]tu|peux[- ]tu)\s+faire)/i,
      /(?:qu(?:e|')\s+est[- ]ce\s+que\s+(?:tu|vous)\s+(?:peux|peut|sais|sait)\s+faire)/i,
      /(?:montre|affiche|liste)\s+(?:les?\s+)?(?:commandes?|instructions?|possibilit(?:é|e)s?)/i,
    ],
  },
  {
    intent: 'toggle_detail_level',
    patterns: [
      /(?:plus\s+de\s+détails?|développe|explique\s+en\s+détail|plus\s+d'explications?)/i,
      /(?:moins\s+de\s+détails?|résum(?:e|er)|version\s+courte|raccourci|synthèse)/i,
      /(?:niveau\s+de\s+détail)\s*(?:plus|moins)?/i,
    ],
    extractParams: (text) => {
      if (/moins|résum|courte|raccourci|synthèse/i.test(text)) return { level: 'brief' };
      return { level: 'detailed' };
    },
  },
];

// ─── Contextual ───

const contextualPatterns: IntentPattern[] = [
  {
    intent: 'cancel_last_action',
    patterns: [
      /(?:annule|annuler|oublie|oublie)\s+(?:ça|cela|ceci|la\s+dernière\s+action|tout)/i,
      /(?:retour|revenir|undo|ctrl\s+z|faire\s+en\s+arrière)/i,
      /(?:non\s+(?:attends?|finalement)|je\s+change|pas\s+ça|oublie\s+(?:tout|ça))/i,
    ],
  },
  {
    intent: 'follow_up_question',
    patterns: [
      /(?:et\s+(?:pour|avec|si)\s+.+|et\s+(?:le\s+|la\s+)?(?:.+)\s*[?]$)/i,
      /(?:plus\s+d(?:e|')?\s+(?:infos?|informations?|détails?|précisions?)\s+(?:sur|à\s+propos\s+(?:de)\s+)?(.+))/i,
      /(?:pourquoi|comment|quand|où|qui|quel(?:le)?s?)\s+(.+?)[?]$/i,
    ],
    extractParams: (text) => ({ question: text.trim() }),
  },
];

// ─── Legacy Compatibility ───

const legacyPatterns: IntentPattern[] = [
  {
    intent: 'mode_night',
    patterns: [
      /\b(passe|active|mets)\s+en\s+(mode\s+)?(nuit|soir|nocturne|sommeil)\b/i,
      /\b(mode)\s+(nuit|soir|nocturne|sommeil)\b/i,
    ],
    extractParams: () => ({ mode: 'night' }),
  },
  {
    intent: 'mode_morning',
    patterns: [
      /\b(passe|active|mets)\s+en\s+(mode\s+)?(matin|réveil)\b/i,
      /\b(mode)\s+(matin|réveil)\b/i,
    ],
    extractParams: () => ({ mode: 'morning' }),
  },
  {
    intent: 'mode_day',
    patterns: [
      /\b(passe|active|mets)\s+en\s+(mode\s+)?(jour|journée)\b/i,
      /\b(mode)\s+(jour|journée)\b/i,
    ],
    extractParams: () => ({ mode: 'day' }),
  },
  {
    intent: 'open_guide',
    patterns: [
      /\b(ouvre|affiche|montre)\s+(le\s+)?guide\b/i,
      /\b(quartier|environs|guide\s+(?:du\s+)?(?:quartier|voisinage))\b/i,
    ],
  },
];

// ═══════════════════════════════════════════════════════
// ALL INTENT PATTERNS FLATTENED
// ═══════════════════════════════════════════════════════

const ALL_INTENT_PATTERNS: IntentPattern[] = [
  ...audioPatterns,
  ...planningPatterns,
  ...cuisinePatterns,
  ...meteoPatterns,
  ...communicationPatterns,
  ...wellnessPatterns,
  ...shoppingPatterns,
  ...transportPatterns,
  ...hospitalityPatterns,
  ...securityPatterns,
  ...funPatterns,
  ...systemPatterns,
  ...contextualPatterns,
  ...legacyPatterns,
];

// ═══════════════════════════════════════════════════════
// KEYWORD FALLBACK (Tier 2 — confidence 0.7)
// ═══════════════════════════════════════════════════════

const FALLBACK_KEYWORDS: Array<{ keywords: string[]; intent: VoiceIntent }> = [
  // Audio
  { keywords: ['musique', 'joue', 'son', 'volume', 'radio', 'ambiance'], intent: 'play_music_default' },
  { keywords: ['pause', 'suivant', 'précédent', 'stop', 'lecture'], intent: 'playback_control' },
  // Planning
  { keywords: ['rappelle', 'rappel', 'souviens', 'n\'oublie'], intent: 'add_reminder_time' },
  { keywords: ['agenda', 'planning', 'programme', 'calendrier'], intent: 'query_agenda' },
  { keywords: ['anniversaire', 'birthday'], intent: 'add_recurring_birthday' },
  // Cuisine
  { keywords: ['recette', 'manger', 'cuisine', 'cuisiner'], intent: 'suggest_recipe' },
  { keywords: ['courses', 'liste', 'acheter', 'magasin'], intent: 'add_grocery_item' },
  { keywords: ['minuterie', 'timer', 'compteur', 'chrono'], intent: 'start_timer' },
  // Météo
  { keywords: ['météo', 'temps', 'pluie', 'soleil', 'neige', 'orage'], intent: 'ask_weather' },
  { keywords: ['parapluie', 'vêtement', 'manteau', 'habiller'], intent: 'weather_advice' },
  { keywords: ['trafic', 'circulation', 'bouchon', 'autoroute'], intent: 'query_traffic' },
  { keywords: ['actualité', 'nouvelles', 'infos', 'journal'], intent: 'news_brief' },
  // Communication
  { keywords: ['message', 'sms', 'texto', 'écrire', 'envoyer'], intent: 'send_message' },
  // Bien-être
  { keywords: ['rituel', 'routine', 'méditation', 'yoga', 'respiration'], intent: 'trigger_ritual' },
  { keywords: ['stressé', 'fatigué', 'content', 'heureux', 'triste', 'calme'], intent: 'log_mood' },
  { keywords: ['sommeil', 'dormir', 'coucher', 'réveil'], intent: 'query_sleep_stats' },
  { keywords: ['boire', 'eau', 'hydrat', 'verre'], intent: 'hydration_reminder' },
  // Shopping
  { keywords: ['favoris', 'habituels', 'réapprovisionner'], intent: 'reorder_favorites' },
  { keywords: ['prix', 'comparer', 'moins cher', 'promotion', 'promo'], intent: 'price_comparison' },
  // Transport
  { keywords: ['train', 'bus', 'métro', 'tram', 'rer', 'horaires'], intent: 'public_transit_info' },
  { keywords: ['parking', 'stationnement', 'garer'], intent: 'parking_assist' },
  // Hospitality
  { keywords: ['wifi', 'wi-fi', 'internet', 'réseau'], intent: 'repeat_wifi_credentials' },
  { keywords: ['restaurant', 'bar', 'café', 'musée', 'parc', 'pharmacie'], intent: 'local_recommendation' },
  { keywords: ['départ', 'quitter', 'checkout', 'clés', 'rendre'], intent: 'checkout_instructions' },
  { keywords: ['propriétaire', 'hôte', 'host', 'contact'], intent: 'contact_host' },
  { keywords: ['traduction', 'traduire', 'anglais', 'espagnol'], intent: 'quick_translation' },
  // Sécurité
  { keywords: ['urgence', 'pompiers', 'police', 'samu', 'ambulance', 'secours'], intent: 'emergency_contact' },
  { keywords: ['extincteur', 'trousse', 'sortie', 'évacuation', 'sécurité'], intent: 'safety_equipment_location' },
  // Fun
  { keywords: ['film', 'série', 'vidéo', 'regarder', 'spectacle'], intent: 'entertainment_request' },
  { keywords: ['quiz', 'jeu', 'devinette', 'énigme', 'culture'], intent: 'daily_trivia' },
  { keywords: ['citation', 'phrase', 'proverbe', 'inspiration', 'motivation'], intent: 'daily_inspiration' },
  // Système
  { keywords: ['voix', 'synthèse', 'parle', 'silence', 'chut'], intent: 'toggle_tts' },
  { keywords: ['aide', 'help', 'commandes', 'instructions'], intent: 'help_command_list' },
  // Legacy
  { keywords: ['nuit', 'dors', 'dormir', 'sommeil'], intent: 'mode_night' },
  { keywords: ['matin', 'réveil', 'réveille'], intent: 'mode_morning' },
  { keywords: ['jour', 'journée'], intent: 'mode_day' },
  { keywords: ['guide', 'quartier', 'environs'], intent: 'open_guide' },
];

// ═══════════════════════════════════════════════════════
// WAKE WORD STRIPPING
// ═══════════════════════════════════════════════════════

const WAKE_WORD_REGEX = /^(hey|ok|dis\s+)?\s*maison[,\s]+/i;

// ═══════════════════════════════════════════════════════
// MAIN PARSER
// ═══════════════════════════════════════════════════════

/** Parse a spoken French text into a structured VoiceCommand. */
export function parseVoiceCommand(text: string): VoiceCommand {
  const clean = text.toLowerCase().trim();

  // Strip wake word prefix ("maison", "hey maison", "ok maison")
  const displayText = clean.replace(WAKE_WORD_REGEX, '').trim();
  const finalText = displayText || clean;

  // ─── Tier 1: Exact regex match (confidence 0.9) ───
  for (const patternGroup of ALL_INTENT_PATTERNS) {
    for (const pattern of patternGroup.patterns) {
      if (pattern.test(finalText)) {
        const params = patternGroup.extractParams
          ? patternGroup.extractParams(finalText)
          : {};
        return {
          intent: patternGroup.intent,
          params,
          confidence: 0.9,
          // Backward compatibility
          payload: params,
          displayText: finalText,
          originalText: text,
        };
      }
    }
  }

  // ─── Tier 2: Keyword fallback (confidence 0.7) ───
  for (const { keywords, intent } of FALLBACK_KEYWORDS) {
    if (keywords.some((kw) => finalText.includes(kw))) {
      return {
        intent,
        params: {},
        confidence: 0.7,
        payload: {},
        displayText: finalText,
        originalText: text,
      };
    }
  }

  // ─── Tier 2b: Keyword-based fallback — lower confidence ───
  const keywordFallbacks: Array<{ keywords: string[]; intent: VoiceIntent }> = [
    { keywords: ['musique', 'chanson', 'playlist', 'écouter'], intent: 'play_music_default' },
    { keywords: ['radio'], intent: 'play_radio_stream' },
    { keywords: ['rappel', 'rappelle'], intent: 'add_reminder_time' },
    { keywords: ['course', 'liste', 'acheter', 'ajout'], intent: 'add_grocery_item' },
    { keywords: ['météo', 'temps', 'pluie', 'soleil'], intent: 'ask_weather' },
    { keywords: ['recette', 'cuisine', 'manger', 'dîner', 'déjeuner'], intent: 'suggest_recipe' },
    { keywords: ['message', 'envoyer', 'écrire'], intent: 'send_message' },
    { keywords: ['heure', 'quel temps'], intent: 'query_agenda' },
    { keywords: ['aide', 'que peux', 'commande'], intent: 'help_command_list' },
    { keywords: ['minuteur', 'timer', 'chronomètre'], intent: 'start_timer' },
    { keywords: ['silence', 'mute', 'tais'], intent: 'toggle_tts' },
    { keywords: ['urgent', 'secours', 'urgence', 'appel'], intent: 'emergency_contact' },
    { keywords: ['wifi', 'connexion', 'internet'], intent: 'repeat_wifi_credentials' },
    { keywords: ['tradui', 'anglais', 'espagnol'], intent: 'quick_translation' },
    { keywords: ['ambiance', 'détente', 'fête', 'travail'], intent: 'mood_scene' },
    { keywords: ['blague', 'raconte', 'rire', 'humour'], intent: 'entertainment_request' },
    { keywords: ['citation', 'inspiration', 'motiv'], intent: 'daily_inspiration' },
    { keywords: ['sommeil', 'nuit', 'dormir'], intent: 'trigger_ritual' },
    { keywords: ['transport', 'bus', 'métro', 'train'], intent: 'public_transit_info' },
    { keywords: ['trafic', 'bouchon', 'embouteillage'], intent: 'traffic_alert' },
  ];

  for (const fb of keywordFallbacks) {
    const lowerText = text.toLowerCase();
    if (fb.keywords.some(kw => lowerText.includes(kw))) {
      return { intent: fb.intent, params: {}, confidence: 0.7, payload: {}, displayText: text, originalText: text };
    }
  }

  // ─── Tier 3: Unknown (confidence 0.3) ───
  return {
    intent: 'unknown',
    params: { raw: finalText },
    confidence: 0.3,
    payload: { raw: finalText },
    displayText: finalText,
    originalText: text,
  };
}

// ═══════════════════════════════════════════════════════
// INTENT REGISTRY (for reflection / help display)
// ═══════════════════════════════════════════════════════

export const INTENT_CATEGORIES: Record<string, { label: string; intents: VoiceIntent[] }> = {
  audio:          { label: '🎵 Audio & Ambiance',     intents: ['play_music_default', 'play_music_genre', 'volume_control', 'playback_control', 'now_playing', 'play_radio_stream', 'mood_scene'] },
  planning:       { label: '📅 Planning & Rappels',    intents: ['add_reminder_time', 'cancel_reminder', 'list_reminders', 'add_appointment', 'add_recurring_birthday', 'add_calendar_event', 'query_agenda'] },
  cuisine:        { label: '🍳 Cuisine & Recettes',    intents: ['suggest_recipe', 'add_grocery_item', 'search_recipe_by_ingredient', 'start_timer', 'cooking_info', 'unit_conversion'] },
  meteo:          { label: '🌦️ Météo & Infos',        intents: ['ask_weather', 'weather_advice', 'query_traffic', 'news_brief', 'sports_score', 'fun_fact'] },
  communication:  { label: '💬 Communication',        intents: ['send_message', 'check_messages', 'quick_household_note', 'read_messages_aloud'] },
  wellness:       { label: '🧘 Bien-être & Rituels',   intents: ['trigger_ritual', 'log_mood', 'suggest_wellness', 'query_sleep_stats', 'hydration_reminder'] },
  shopping:       { label: '🛒 Courses & Shopping',     intents: ['reorder_favorites', 'price_comparison', 'list_active_groceries'] },
  transport:      { label: '🚗 Transport',             intents: ['query_eta', 'traffic_alert', 'transport_reminder', 'public_transit_info', 'parking_assist'] },
  hospitality:    { label: '🎁 Hospitality',           intents: ['repeat_wifi_credentials', 'appliance_guide', 'local_recommendation', 'checkout_instructions', 'contact_host', 'quick_translation'] },
  security:       { label: '🔐 Sécurité',              intents: ['emergency_contact', 'safety_equipment_location', 'activate_away_mode'] },
  fun:            { label: '🎮 Fun',                   intents: ['entertainment_request', 'daily_trivia', 'interactive_game', 'daily_inspiration'] },
  system:         { label: '🔧 Système',               intents: ['toggle_tts', 'adjust_speech_rate', 'repeat_last_response', 'help_command_list', 'toggle_detail_level'] },
  contextual:     { label: '📌 Contextuel',            intents: ['cancel_last_action', 'follow_up_question'] },
  legacy:         { label: '🔄 Modes',                 intents: ['mode_night', 'mode_morning', 'mode_day', 'open_guide'] },
};

/** Get total number of registered intents (excluding 'unknown') */
export function getIntentCount(): number {
  return Object.values(INTENT_CATEGORIES).reduce((sum, cat) => sum + cat.intents.length, 0);
}

// ═══════════════════════════════════════════════════════
// HELP TEXT — Sample Commands by Category
// ═══════════════════════════════════════════════════════

export const VOICE_COMMANDS_HELP: string[] = [
  // Audio
  '"Maison, mets de la musique" — Musique aléatoire',
  '"Maison, joue du jazz" — Musique par genre',
  '"Maison, plus fort" — Volume',
  '"Maison, lance une ambiance fête" — Scène ambiance',
  // Planning
  '"Maison, rappelle-moi d\'arroser les plantes à 18h" — Rappel',
  '"Maison, ajoute un rendez-vous avec le docteur demain" — RDV',
  '"Maison, mon agenda" — Planning du jour',
  '"Maison, ajoute l\'anniversaire de Marie" — Anniversaire',
  // Cuisine
  '"Maison, on mange quoi ce soir" — Recette suggestion',
  '"Maison, ajoute du lait dans les courses" — Ajout course',
  '"Maison, recette avec des tomates" — Recherche ingrédient',
  '"Maison, minuteur 10 minutes" — Minuteur cuisine',
  // Météo & Infos
  '"Maison, quelle est la météo" — Conditions météo',
  '"Maison, dois-je prendre un parapluie" — Conseil vêtements',
  '"Maison, l\'actualité du jour" — Journal',
  // Communication
  '"Maison, envoie un message à maman que j\'arrive" — Message',
  '"Maison, lis mes messages" — Messages à voix haute',
  // Bien-être
  '"Maison, lance le rituel du soir" — Rituel bien-être',
  '"Maison, je me sens stressé" — Journal d\'humeur',
  '"Maison, rappelle-moi de boire" — Hydratation',
  // Transport
  '"Maison, combien de temps pour aller au bureau" — Trajet',
  '"Maison, prochain train pour Paris" — Transports',
  // Hospitality
  '"Maison, mot de passe wifi" — Identifiants réseau',
  '"Maison, bon restaurant dans le quartier" — Recommandation',
  '"Maison, comment dire bonjour en anglais" — Traduction',
  // Sécurité
  '"Maison, urgence pompiers" — Appel d\'urgence',
  '"Maison, où est l\'extincteur" — Équipement sécurité',
  // Système
  '"Maison, aide" — Liste des commandes',
  '"Maison, stop" — Arrêter la voix',
  '"Maison, répète" — Répéter dernière réponse',
];
