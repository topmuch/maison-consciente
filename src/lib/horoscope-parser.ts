/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Horoscope Parser (xml2js)
   Fetches daily horoscopes from RSS, with fallback to
   hand-crafted French texts per zodiac sign.
   ═══════════════════════════════════════════════════════ */

import xml2js from 'xml2js';
import { ZODIAC_SIGNS, type ZodiacSign } from './config';
import { RSS_SOURCES } from './constants';

// ─── xml2js parser instance ─────────────────────────────

const parser = new xml2js.Parser({
  explicitArray: false,
  normalizeTags: true,
});

// ─── Types ──────────────────────────────────────────────

export interface HoroscopeReading {
  sign: ZodiacSign;
  date: string;
  love: string;
  work: string;
  health: string;
  luckyNumber: number;
  mood: string;
  summary: string;
}

// Re-export ZodiacSign for convenience (consumers import it from here)
export type { ZodiacSign };

// ─── Constants ──────────────────────────────────────────

const HOROSCOPE_FEED_URL =
  RSS_SOURCES.find((s) => s.category === 'horoscope')?.url ??
  'https://www.mon-horoscope-du-jour.com/rss.php';

// ─── Daily cache per sign ───────────────────────────────

interface HoroscopeCacheEntry {
  date: string;       // YYYY-MM-DD
  reading: HoroscopeReading;
}

const horoscopeCache = new Map<ZodiacSign, HoroscopeCacheEntry>();

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── 12 hand-crafted fallback horoscope texts (French) ──

const FALLBACK_HOROSCOPES: Record<ZodiacSign, {
  love: string;
  work: string;
  health: string;
  summary: string;
  mood: string;
}> = {
  bélier: {
    love: 'Une belle énergie amoureuse vous entoure. Osez exprimer vos sentiments sans crainte, votre partenaire appréciera cette sincérité.',
    work: 'Votre dynamisme au travail est contagieux. Un projet que vous portez depuis longtemps pourrait enfin aboutir aujourd\'hui.',
    health: 'Canalisez votre énergie débordante par une activité physique intense. Le footing ou la boxe seraient parfaits.',
    summary: 'Les astres stimulent votre fougue naturelle. C\'est le moment idéal pour prendre des initiatives et concrétiser vos projets.',
    mood: 'dynamique',
  },
  taureau: {
    love: 'La douceur est au rendez-vous dans votre vie sentimentale. Un moment de tendresse inattendu vous attend.',
    work: 'Votre patience porte ses fruits. Un investissement professionnel montre enfin des signes concrets de réussite.',
    health: 'Prenez soin de votre corps avec une alimentation réconfortante mais équilibrée. Le vert de terre vous fera du bien.',
    summary: 'Venus veille sur vous, bélier de la terre. La stabilité et la persévérance sont vos meilleures alliées aujourd\'hui.',
    mood: 'serein',
  },
  gémeaux: {
    love: 'La communication est votre atout majeur en amour. Une discussion profonde pourrait rapprocher deux cœurs.',
    work: 'Votre curiosité intellectuelle est stimulée. C\'est le jour idéal pour apprendre une nouvelle compétence ou lancer un projet créatif.',
    health: 'Variez les plaisirs ! Alternez entre activité physique et relaxation mentale pour un équilibre optimal.',
    summary: 'Mercure amplifie votre esprit vif. Vos échanges seront riches et fructueux, que ce soit en amour ou au travail.',
    mood: 'créatif',
  },
  cancer: {
    love: 'Votre sensibilité est une force. Laissez-vous guider par votre intuition dans vos choix du cœur.',
    work: 'Votre esprit d\'équipe est apprécié de tous. Un collaborateur pourrait vous demander un conseil précieux.',
    health: 'Écoutez vos émotions sans les refouler. Un bain chaud et une tisane vous aideront à relâcher les tensions.',
    summary: 'La Lune influence votre monde intérieur. Prenez du temps pour vous et votre foyer, c\'est votre source d\'équilibre.',
    mood: 'introspectif',
  },
  lion: {
    love: 'Votre charisme rayonne et attire les regards. Un rendez-vous amoureux prometteur pourrait illuminer votre journée.',
    work: 'Votre leadership naturel est mis en avant. Prenez les devants et montrez l\'exemple, vos pairs vous suivront.',
    health: 'Votre vitalité est au maximum ! Profitez-en pour pratiquer un sport qui vous passionne vraiment.',
    summary: 'Le Soleil vous offre sa lumière. Osez briller et montrer au monde de quoi vous êtes capable.',
    mood: 'enthousiaste',
  },
  vierge: {
    love: 'Les petits gestes comptent énormément pour vous. Un détail attentionné fera fondre le cœur de votre partenaire.',
    work: 'Votre sens de l\'organisation est remarquable. Vous résoudrez un problème complexe avec une précision chirurgicale.',
    health: 'Adoptez une routine saine : marche en nature, repas équilibré, et surtout un coucher à l\'heure.',
    summary: 'Mercure vous confère une clarté d\'esprit exceptionnelle. Votre attention au détail fera toute la différence.',
    mood: 'calme',
  },
  balance: {
    love: 'L\'harmonie règne dans vos relations. Un compromis élégant résoudra un malentendu qui durait depuis trop longtemps.',
    work: 'Votre sens de la justice est un atout professionnel. Vous serez appelé à arbitrer une situation délicate.',
    health: 'Le yoga ou le Pilates seraient parfaits pour aligner votre corps et votre esprit. La symétrie vous fait du bien.',
    summary: 'Vénus favorise l\'équilibre en toutes choses. Cherchez la beauté et l\'harmonie, elles sont à portée de main.',
    mood: 'aventureux',
  },
  scorpion: {
    love: 'Une connexion profonde et intense se forge. Laissez la passion vous guider, mais gardez confiance.',
    work: 'Votre intuition est aiguisée comme jamais. Vous démasquerez une opportunité que personne n\'avait vue.',
    health: 'Un nettoyage intérieur vous serait bénéfique : eau citronnée le matin, alimentation légère, et respiration profonde.',
    summary: 'Pluton renforce votre pouvoir de transformation. Un changement radical mais positif s\'amorce dans votre vie.',
    mood: 'réfléchi',
  },
  sagittaire: {
    love: 'L\'aventure amoureuse vous tend les bras. Soyez ouvert aux rencontres inattendues et aux horizons nouveaux.',
    work: 'Votre optimisme est communicatif et motive votre équipe. Un projet ambitieux démarre sur de bonnes bases.',
    health: 'Le plein air est votre remède miracle. Une randonnée ou une sortie équestre rechargeront vos batteries.',
    summary: 'Jupiter élargit vos horizons. Osez rêver grand et franchissez les frontières qui vous limitent.',
    mood: 'optimiste',
  },
  capricorne: {
    love: 'La sincérité et la fidélité sont vos plus beaux atouts. Votre partenaire sait qu\'il peut compter sur vous.',
    work: 'Votre ambition est votre moteur. Chaque effort que vous fournissez vous rapproche un peu plus de votre objectif.',
    health: 'Ne négligez pas votre dos et vos articulations. Des étirements quotidiens et une bonne posture sont essentiels.',
    summary: 'Saturne récompense vos efforts constants. La persévérance est votre secret, et elle paie enfin.',
    mood: 'mystérieux',
  },
  verseau: {
    love: 'Votre originalité séduit. Une approche inhabituelle en amour pourrait créer une complicité unique.',
    work: 'Votre esprit innovant est recherché. Proposez cette idée qui vous trotte dans la tête, elle est géniale.',
    health: 'Changez vos habitudes ! Essayez un nouveau sport ou une pratique bien-être que vous n\'avez jamais testée.',
    summary: 'Uranus stimule votre créativité et votre indépendance. Soyez vous-même, c\'est votre plus grande force.',
    mood: 'joyeux',
  },
  poissons: {
    love: 'Votre empathie crée des liens profonds. Vous comprenez intuitivement les besoins de votre partenaire.',
    work: 'Votre imagination est un atout professionnel. Une solution créative résoudra un problème qui semblait insoluble.',
    health: 'L\'eau est votre élément. La natation ou la balnéothérapie vous apporteront un bien-être profond.',
    summary: 'Neptune renforce votre intuition et votre sensibilité. Faites confiance à vos rêves, ils contiennent des messages importants.',
    mood: 'déterminé',
  },
};

// ─── Sign normalization ─────────────────────────────────

/**
 * Normalize a user-provided sign string to a valid ZodiacSign.
 */
function normalizeSign(input: string): ZodiacSign {
  const lower = input.toLowerCase().trim();

  // Direct match
  for (const sign of ZODIAC_SIGNS) {
    if (lower === sign) return sign;
  }

  // Partial match (input contains sign or sign contains input)
  for (const sign of ZODIAC_SIGNS) {
    if (lower.includes(sign) || sign.includes(lower)) return sign;
  }

  // English → French mapping
  const enMap: Record<string, ZodiacSign> = {
    aries: 'bélier',
    taurus: 'taureau',
    gemini: 'gémeaux',
    cancer: 'cancer',
    leo: 'lion',
    virgo: 'vierge',
    libra: 'balance',
    scorpio: 'scorpion',
    sagittarius: 'sagittaire',
    capricorn: 'capricorne',
    aquarius: 'verseau',
    pisces: 'poissons',
  };

  if (enMap[lower]) return enMap[lower];

  return ZODIAC_SIGNS[0]; // fallback to bélier
}

// ─── Helpers ───────────────────────────────────────────

/**
 * Deterministic hash for deterministic lucky number etc.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Strip HTML tags from a string.
 */
function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Try to extract a zodiac sign name from an item title.
 */
function extractSignFromTitle(title: string): ZodiacSign | null {
  const lower = title.toLowerCase();
  for (const sign of ZODIAC_SIGNS) {
    if (lower.includes(sign)) return sign;
  }
  return null;
}

// ─── RSS horoscope fetcher ──────────────────────────────

/**
 * Fetch the horoscope RSS feed and match entries to zodiac signs.
 * Returns a map of sign → description text.
 */
async function fetchHoroscopeRSS(): Promise<Map<ZodiacSign, string>> {
  const signTexts = new Map<ZodiacSign, string>();

  try {
    const res = await fetch(HOROSCOPE_FEED_URL, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'MaisonConsciente/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!res.ok) return signTexts;

    const xml = await res.text();
    const parsed = await parser.parseStringPromise(xml);

    // RSS 2.0: parsed.rss.channel.item
    const rss = parsed.rss as Record<string, unknown> | undefined;
    if (rss) {
      const channel = rss.channel as Record<string, unknown> | undefined;
      if (channel) {
        const items = normalizeItems(channel.item);
        for (const item of items) {
          const title = str(item.title);
          const desc = stripHtml(str(item.description ?? item.summary));
          const sign = extractSignFromTitle(title);
          if (sign && desc && !signTexts.has(sign)) {
            signTexts.set(sign, desc);
          }
        }
      }
    }

    // Atom: parsed.feed.entry
    const feed = parsed.feed as Record<string, unknown> | undefined;
    if (feed && !rss) {
      const entries = normalizeItems(feed.entry);
      for (const entry of entries) {
        const title = str(entry.title);
        const desc = stripHtml(str(entry.summary ?? entry.content));
        const sign = extractSignFromTitle(title);
        if (sign && desc && !signTexts.has(sign)) {
          signTexts.set(sign, desc);
        }
      }
    }
  } catch {
    // RSS fetch failed – we will fall back to local texts
  }

  return signTexts;
}

/**
 * Safely extract a string from xml2js node.
 */
function str(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null && '_' in val) {
    return String((val as Record<string, unknown>)._ ?? '');
  }
  return String(val);
}

/**
 * Normalize xml2js items to a consistent array.
 */
function normalizeItems(raw: unknown): Record<string, unknown>[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean) as Record<string, unknown>[];
  if (typeof raw === 'object') return [raw as Record<string, unknown>];
  return [];
}

// ─── Public API ─────────────────────────────────────────

/**
 * Get the daily horoscope for a given zodiac sign.
 * Tries RSS feed first, then falls back to hand-crafted texts.
 * Results are cached per sign for the whole day.
 */
export async function getHoroscope(sign: string): Promise<HoroscopeReading> {
  const normalizedSign = normalizeSign(sign);
  const today = getToday();

  // Check daily cache
  const cached = horoscopeCache.get(normalizedSign);
  if (cached && cached.date === today) {
    return cached.reading;
  }

  // Try RSS feed
  const rssTexts = await fetchHoroscopeRSS();
  const rssText = rssTexts.get(normalizedSign);

  const seed = hashString(`${today}:${normalizedSign}`);
  const fallback = FALLBACK_HOROSCOPES[normalizedSign];

  const reading: HoroscopeReading = {
    sign: normalizedSign,
    date: today,
    love: rssText
      ? extractCategory(rssText, normalizedSign, 'amour') ?? fallback.love
      : fallback.love,
    work: rssText
      ? extractCategory(rssText, normalizedSign, 'travail') ?? fallback.work
      : fallback.work,
    health: rssText
      ? extractCategory(rssText, normalizedSign, 'santé') ?? fallback.health
      : fallback.health,
    luckyNumber: (seed % 49) + 1,
    mood: fallback.mood,
    summary: rssText && rssText.length > 20 ? rssText.slice(0, 200) : fallback.summary,
  };

  // Cache for today
  horoscopeCache.set(normalizedSign, { date: today, reading });

  return reading;
}

/**
 * Try to extract a specific category (amour, travail, santé)
 * from an RSS horoscope text. Returns null if not found.
 */
function extractCategory(
  text: string,
  _sign: ZodiacSign,
  keyword: string,
): string | null {
  const lower = text.toLowerCase();

  // Look for keyword followed by text
  const patterns = [
    new RegExp(`${keyword}\\s*[:\\s–—-]\\s*([^.]*(?:\\.|$))`, 'i'),
    new RegExp(`en ${keyword}\\s*[:\\s–—-]\\s*([^.]*(?:\\.|$))`, 'i'),
    new RegExp(`(?:côté|niveau) ${keyword}\\s*[:\\s–—-]\\s*([^.]*(?:\\.|$))`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Get a fallback horoscope when the sign is unknown or unavailable.
 * Uses the hand-crafted French texts with deterministic daily selection.
 * If `sign` is provided, returns that sign's horoscope as a TTS string.
 */
export function getHoroscopeFallback(sign?: string): string {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );

  let targetSign: ZodiacSign;
  if (sign) {
    targetSign = normalizeSign(sign);
  } else {
    targetSign = ZODIAC_SIGNS[dayOfYear % ZODIAC_SIGNS.length];
  }

  const fallback = FALLBACK_HOROSCOPES[targetSign];
  return `Aujourd'hui, les astres sont favorables au signe ${targetSign}. ${fallback.summary}`;
}

/**
 * Format a HoroscopeReading for TTS output.
 */
export function formatHoroscopeForTTS(reading: HoroscopeReading): string {
  return (
    `Horoscope du ${reading.sign} : ${reading.summary} ` +
    `En amour : ${reading.love} ` +
    `Au travail : ${reading.work} ` +
    `Santé : ${reading.health} ` +
    `Votre nombre chanceux est le ${reading.luckyNumber}. ` +
    `Votre énergie du jour est ${reading.mood}.`
  );
}
