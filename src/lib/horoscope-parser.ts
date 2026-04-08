// ═══════════════════════════════════════════════════════
// MAISON CONSCIENTE — Horoscope Parser
// ═══════════════════════════════════════════════════════

import { parseRssFeed, extractHoroscopeText } from './rss-parser';

export const ZODIAC_SIGNS = [
  'Bélier', 'Taureau', 'Gémeaux', 'Cancer',
  'Lion', 'Vierge', 'Balance', 'Scorpion',
  'Sagittaire', 'Capricorne', 'Verseau', 'Poissons',
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export const ZODIAC_EMOJIS: Record<ZodiacSign, string> = {
  'Bélier': '♈', 'Taureau': '♉', 'Gémeaux': '♊', 'Cancer': '♋',
  'Lion': '♌', 'Vierge': '♍', 'Balance': '♎', 'Scorpion': '♏',
  'Sagittaire': '♐', 'Capricorne': '♑', 'Verseau': '♒', 'Poissons': '♓',
};

export const ZODIAC_DATES: Record<ZodiacSign, string> = {
  'Bélier': '21 mars - 19 avril', 'Taureau': '20 avril - 20 mai',
  'Gémeaux': '21 mai - 20 juin', 'Cancer': '21 juin - 22 juillet',
  'Lion': '23 juillet - 22 août', 'Vierge': '23 août - 22 septembre',
  'Balance': '23 septembre - 22 octobre', 'Scorpion': '23 octobre - 21 novembre',
  'Sagittaire': '22 novembre - 21 décembre', 'Capricorne': '22 décembre - 19 janvier',
  'Verseau': '20 janvier - 18 février', 'Poissons': '19 février - 20 mars',
};

export function getZodiacFromDate(date: Date): ZodiacSign {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Bélier';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taureau';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gémeaux';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Lion';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Vierge';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Balance';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpion';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittaire';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorne';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Verseau';
  return 'Poissons';
}

export async function fetchHoroscope(sign: ZodiacSign, rssUrl?: string): Promise<string> {
  // If no URL provided, return a local fallback
  const localFallbacks: Record<ZodiacSign, string[]> = {
    'Bélier': ['Les étoiles vous sourient aujourd\'hui. Une journée propice aux nouvelles rencontres.', 'Votre énergie est au maximum. C\'est le moment idéal pour lancer un projet qui vous tient à cœur.'],
    'Taureau': ['La patience sera votre meilleure alliée aujourd\'hui. Un changement inattendu pourrait vous surprendre agréablement.', 'Vos efforts financiers portent enfin leurs fruits. Restez prudent dans vos dépenses.'],
    'Gémeaux': ['Votre curiosité naturelle vous pousse vers de nouvelles découvertes. N\'hésitez pas à élargir vos horizons.', 'La communication est favorisée. C\'est le bon jour pour clarifier une situation ambiguë.'],
    'Cancer': ['Votre sensibilité est décuplée. Prenez soin de vous et de vos proches aujourd\'hui.', 'Un événement familial vous réjouit. Profitez de ces moments de partage précieux.'],
    'Lion': ['Votre charisme naturel attire l\'attention. Osez prendre les devants dans les projets importants.', 'La créativité est à son comble. Exprimez-vous sans retenue, le monde vous écoute.'],
    'Vierge': ['Votre esprit analytique vous permet de résoudre un problème complexe avec élégance.', 'Organisation et rigueur sont vos atouts du jour. Un plan bien pensé mène au succès.'],
    'Balance': ['L\'harmonie règne dans vos relations. Profitez de cette énergie positive pour renforcer les liens.', 'Un choix esthétique ou créatif se présente. Faites confiance à votre instinct.'],
    'Scorpion': ['Votre intuition est particulièrement aiguisée. Écoutez cette voix intérieure qui ne se trompe jamais.', 'Une transformation intérieure s\'opère. Acceptez le changement avec sérénité.'],
    'Sagittaire': ['L\'aventure vous appelle ! Un voyage ou une nouvelle expérience pourrait changer votre perspective.', 'Votre optimisme est contagieux. Partagez cette énergie positive avec votre entourage.'],
    'Capricorne': ['La persévérance paie toujours. Vos efforts commencent à porter leurs fruits.', 'Un objectif professionnel se rapproche. Restez concentré et déterminé.'],
    'Verseau': ['Votre originalité fait votre force. N\'ayez pas peur de sortir des sentiers battus.', 'Une idée révolutionnaire germe dans votre esprit. Notez-la avant qu\'elle ne s\'envole.'],
    'Poissons': ['Votre imagination débordante est votre plus grand trésor. Laissez-la s\'exprimer librement.', 'La compassion et l\'empathie guident vos actions. Un geste généreux porte ses fruits.'],
  };
  
  if (!rssUrl) {
    const fallbacks = localFallbacks[sign];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
  
  try {
    const items = await parseRssFeed(rssUrl, 'Horoscope');
    const horoscopeText = extractHoroscopeText(sign, items);
    if (horoscopeText) return horoscopeText;
    
    // Fallback if parsing fails
    const fallbacks = localFallbacks[sign];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  } catch {
    const fallbacks = localFallbacks[sign];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}
