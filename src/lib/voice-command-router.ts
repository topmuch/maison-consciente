/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Voice Command Router
   Maps spoken French text to intents via regex.
   This is the brain of the Maellis voice assistant.
   ═══════════════════════════════════════════════════════ */

import { ASSISTANT_NAMES } from './config';

export type VoiceIntent =
  // Info & Divertissement
  | 'weather' | 'news' | 'sport' | 'horoscope' | 'joke' | 'quote' | 'fun_fact'
  // Cuisine
  | 'recipe_search' | 'recipe_random' | 'recipe_ingredients' | 'recipe_step_next' | 'recipe_step_prev'
  // Maison
  | 'timer' | 'alarm' | 'calculate' | 'whatsapp' | 'navigate'
  // Notifications
  | 'reminder_set' | 'reminder_list'
  // Préférences / Apprentissage
  | 'preference_like' | 'preference_dislike' | 'preference_zodiac' | 'preference_dietary'
  // Système
  | 'name_change' | 'name_ask' | 'quiet_mode' | 'volume_up' | 'volume_down' | 'help' | 'greeting'
  | 'thank_you' | 'goodbye' | 'unknown';

export interface VoiceCommand {
  intent: VoiceIntent;
  confidence: number; // 0-1
  entities: Record<string, string>; // extracted parameters
}

/** Pattern definition */
interface CommandPattern {
  intent: VoiceIntent;
  patterns: RegExp[];
  extractEntities?: (text: string) => Record<string, string>;
}

// ── Command Patterns ──

const COMMAND_PATTERNS: CommandPattern[] = [
  // ═══ MÉTÉO ═══
  {
    intent: 'weather',
    patterns: [
      /\b(météo|temps|température|il fait|prévisions|pluie|soleil|nuage|degrés)\b/i,
      /\b(quel temps|combien de degrés|temps qu'il fait)\b/i,
    ],
  },

  // ═══ ACTUALITÉS ═══
  {
    intent: 'news',
    patterns: [
      /\b(actualités|actualite|nouvelles|journal|info|titres|headlines)\b/i,
      /\b(quoi de neuf|dernières nouvelles|que se passe)\b/i,
    ],
  },

  // ═══ SPORT ═══
  {
    intent: 'sport',
    patterns: [
      /\b(sport|résultats|match|foot|football|tennis|rugby|basket)\b/i,
      /\b(score|classement|championnat|ligue)\b/i,
    ],
  },

  // ═══ HOROSCOPE ═══
  {
    intent: 'horoscope',
    patterns: [
      /\b(horoscope|astro|signe|étoile|sagittaire|capricorne|verseau|poissons|bélier|taureau|gémeaux|cancer|lion|vierge|balance|scorpion)\b/i,
    ],
    extractEntities: (text) => {
      const signs = ['bélier','taureau','gémeaux','cancer','lion','vierge','balance','scorpion','sagittaire','capricorne','verseau','poissons'];
      for (const s of signs) {
        if (text.toLowerCase().includes(s)) return { sign: s };
      }
      return {};
    },
  },

  // ═══ BLAGUES ═══
  {
    intent: 'joke',
    patterns: [
      /\b(blague|rire|drôle|humour|plaisanterie|raconte.moi une blague)\b/i,
    ],
  },

  // ═══ CITATIONS ═══
  {
    intent: 'quote',
    patterns: [
      /\b(citation|phrase|proverbe|sagesse|inspire|motiv)\b/i,
    ],
  },

  // ═══ FAITS ═══
  {
    intent: 'fun_fact',
    patterns: [
      /\b(savais.tu|fait amusant|anecdote|truc intéressant|apprends.moi)\b/i,
    ],
  },

  // ═══ RECETTES ═══
  {
    intent: 'recipe_search',
    patterns: [
      /\b(recette|cuisine|préparer|cuisiner|comment faire)\b.*\b(pizza|pâte|gâteau|soupe|salade|gratin|tarte|crêpe|quiche|ragoût|curry|risotto|poulet|bœuf|poisson|dessert|entrée|plat)\b/i,
    ],
    extractEntities: (text) => {
      const match = text.match(/(pizza|pâte|gâteau|soupe|salade|gratin|tarte|crêpe|quiche|ragoût|curry|risotto|poulet|bœuf|poisson|dessert|entrée|plat|chocolat|pomme|fromage)/i);
      return { query: match ? match[1] : text.replace(/.*(?:recette|cuisine|préparer|comment faire)\s*/i, '').trim() || '' };
    },
  },
  {
    intent: 'recipe_random',
    patterns: [
      /\b(recette aléatoire|recette du jour|quoi manger|suggest.*recette|propose.*recette|idée repas|quoi cuisiner)\b/i,
    ],
  },
  {
    intent: 'recipe_ingredients',
    patterns: [
      /\b(ingrédients|il me faut|que faut.il|liste des ingrédients)\b/i,
    ],
  },
  {
    intent: 'recipe_step_next',
    patterns: [
      /\b(étape suivante|prochaine étape|continue|ensuite|après)\b/i,
    ],
  },
  {
    intent: 'recipe_step_prev',
    patterns: [
      /\b(étape précédente|retour|recommence)\b/i,
    ],
  },

  // ═══ MAISON ═══
  {
    intent: 'timer',
    patterns: [
      /\b(minuteur|timer|chronomètre|compte.à.rebours)\b.*\b(\d+)\b/i,
    ],
    extractEntities: (text) => {
      const num = text.match(/(\d+)/);
      const unit = text.match(/(seconde|minute|heure)/i);
      return {
        seconds: num ? String(parseInt(num[1]) * (unit?.[1]?.startsWith('minute') ? 60 : unit?.[1]?.startsWith('heure') ? 3600 : 1)) : '60',
      };
    },
  },
  {
    intent: 'calculate',
    patterns: [
      /\b(calcule|combien font|combien fait|combien vaut|addition|soustraction|multiplication|division)\b.*\b(\d+[\s+\-*/]+\d+)\b/i,
    ],
    extractEntities: (text) => {
      const expr = text.match(/(\d+[\s+\-*/]+\d+)/);
      return { expression: expr ? expr[1].replace(/\s/g, '') : '' };
    },
  },
  {
    intent: 'whatsapp',
    patterns: [
      /\b(whatsapp|contacter|appeler|message|joindre|propriétaire|hôte|host)\b/i,
    ],
  },
  {
    intent: 'navigate',
    patterns: [
      /\b(navigation|itinéraire|direction|comment aller|chemin|route|maps|gps)\b/i,
    ],
    extractEntities: (text) => {
      const destination = text.replace(/.*(?:aller|direction|chemin|route|trouver|amener|emmener)\s*/i, '').replace(/\?.*$/, '').trim();
      return { destination };
    },
  },

  // ═══ RAPPELS ═══
  {
    intent: 'reminder_set',
    patterns: [
      /\b(rappelle.moi|rappel|n.oublie pas|souviens.toi|rappele.moi)\b/i,
    ],
  },
  {
    intent: 'reminder_list',
    patterns: [
      /\b(mes rappels|liste.*rappel|quel rappel)\b/i,
    ],
  },

  // ═══ PRÉFÉRENCES ═══
  {
    intent: 'preference_like',
    patterns: [
      /\b(j'aime|j'adore|je kiffe|j'apprécie|mon préféré)\b/i,
    ],
  },
  {
    intent: 'preference_dislike',
    patterns: [
      /\b(je n'aime pas|j'aime pas|je déteste|pas fan|bof)\b/i,
    ],
  },

  // ═══ SYSTÈME ═══
  {
    intent: 'name_change',
    patterns: [
      /\b(change.*nom|appelle.moi|tu t'appelles|ton nom)\b/i,
    ],
  },
  {
    intent: 'name_ask',
    patterns: [
      /\b(comment tu t'appelles|quel est ton nom|tu es qui|c'est quoi ton nom|qui es.tu)\b/i,
    ],
  },
  {
    intent: 'quiet_mode',
    patterns: [
      /\b(mode silencieux|tais.toi|silence|chut|plus rien)\b/i,
    ],
  },
  {
    intent: 'volume_up',
    patterns: [
      /\b(volume plus|plus fort|monte le son|augmente)\b/i,
    ],
  },
  {
    intent: 'volume_down',
    patterns: [
      /\b(volume moins|moins fort|baisse le son|diminue)\b/i,
    ],
  },
  {
    intent: 'help',
    patterns: [
      /\b(aide|que peux.tu|que sais.tu faire|fonctionnalités|capacités|commande)\b/i,
    ],
  },
  {
    intent: 'greeting',
    patterns: [
      /\b(bonjour|salut|coucou|hello|hey|bonsoir)\b/i,
    ],
  },
  {
    intent: 'thank_you',
    patterns: [
      /\b(merci|thanks|super|génial|parfait|excellent|bien joué)\b/i,
    ],
  },
  {
    intent: 'goodbye',
    patterns: [
      /\b(au revoir|bonne nuit|à plus|à bientôt|bye|ciao|dorénavant)\b/i,
    ],
  },
];

// ── Main Router Function ──

/**
 * Parse spoken text and return the detected intent with entities.
 * Returns { intent: 'unknown', confidence: 0, entities: {} } if no match.
 */
export function parseVoiceCommand(text: string): VoiceCommand {
  const trimmed = text.trim().toLowerCase();

  if (!trimmed || trimmed.length < 2) {
    return { intent: 'unknown', confidence: 0, entities: {} };
  }

  let bestMatch: VoiceCommand = { intent: 'unknown', confidence: 0, entities: {} };

  for (const cmd of COMMAND_PATTERNS) {
    for (const pattern of cmd.patterns) {
      if (pattern.test(text)) {
        const confidence = calculateConfidence(trimmed, cmd.intent);
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent: cmd.intent,
            confidence,
            entities: cmd.extractEntities ? cmd.extractEntities(text) : {},
          };
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Check if text contains the wake word.
 */
export function containsWakeWord(text: string, wakeWord: string = 'Maellis'): boolean {
  const lower = text.toLowerCase().trim();
  const ww = wakeWord.toLowerCase();

  // Exact match or "wake word + command"
  return lower === ww || lower.startsWith(ww + ' ') || lower.startsWith(ww + ',');
}

/**
 * Strip wake word from text to get the actual command.
 */
export function stripWakeWord(text: string, wakeWord: string = 'Maellis'): string {
  return text.replace(new RegExp(`^${wakeWord}[\\s,]+`, 'i'), '').trim();
}

/**
 * Get the list of all supported commands for the help response.
 */
export function getSupportedCommands(): { category: string; commands: string[] }[] {
  return [
    { category: '📝 Informations', commands: ['"Météo"', '"Actualités"', '"Sport"', '"Horoscope"', '"Blague"', '"Citation"', '"Savais-tu"'] },
    { category: '🍳 Cuisine', commands: ['"Recette [plat]"', '"Recette aléatoire"', '"Ingrédients"', '"Étape suivante"'] },
    { category: '🏠 Maison', commands: ['"Minuteur 5 minutes"', '"Calcule 15 + 27"', '"Contacter propriétaire"', '"Itinéraire [lieu]"'] },
    { category: '🧠 Apprentissage', commands: ['"J\'aime le jazz"', '"Je suis Scorpion"', '"Je suis végétarien"'] },
    { category: '⚙️ Système', commands: ['"Comment tu t\'appelles"', '"Mode silencieux"', '"Aide"'] },
  ];
}

function calculateConfidence(text: string, intent: VoiceIntent): number {
  // Simple heuristic: longer keyword matches = higher confidence
  const cmd = COMMAND_PATTERNS.find(c => c.intent === intent);
  if (!cmd) return 0.3;

  for (const p of cmd.patterns) {
    const match = text.match(p);
    if (match) {
      const matchLen = (match[0] || '').length;
      return Math.min(0.95, 0.4 + matchLen / text.length);
    }
  }
  return 0.3;
}
