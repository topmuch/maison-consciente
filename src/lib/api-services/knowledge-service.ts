/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Knowledge Service
   QuoteGarden API: random quotes, quotes by category
   ═══════════════════════════════════════════════════════ */

import { db } from '@/lib/db';
import { safeFetch, fetchWithCache, getDefinition } from '@/lib/external-apis';
import { decryptSecret } from '@/lib/aes-crypto';
import type { ApiKey } from '@/lib/external-apis';

/* ─── Types ─── */

export interface Quote {
  id: number;
  quoteText: string;
  quoteAuthor: string;
  quoteGenre?: string;
}

interface QuoteGardenData {
  _id: string;
  quoteText: string;
  quoteAuthor: string;
  quoteGenre: string;
}

interface QuoteGardenResponse {
  statusCode: number;
  message: string;
  data: QuoteGardenData[];
}

/* ─── Helper ─── */

async function getApiConfig(serviceKey: ApiKey): Promise<{ active: boolean; apiKey?: string }> {
  const config = await db.apiConfig.findUnique({ where: { serviceKey } });
  if (!config || !config.isActive) return { active: false };
  return { active: true, apiKey: config.apiKey ? decryptSecret(config.apiKey) : undefined };
}

/* ─── Fallback Data (50 French quotes) ─── */

const FALLBACK_QUOTES: Quote[] = [
  { id: 1, quoteText: 'La vie est un mystère qu\'il faut vivre, et non un problème à résoudre.', quoteAuthor: 'Gandhi', quoteGenre: 'Philosophie' },
  { id: 2, quoteText: 'Je pense, donc je suis.', quoteAuthor: 'René Descartes', quoteGenre: 'Philosophie' },
  { id: 3, quoteText: 'L\'homme est condamné à être libre.', quoteAuthor: 'Jean-Paul Sartre', quoteGenre: 'Philosophie' },
  { id: 4, quoteText: 'Le courage, c\'est de chercher la vérité et de la dire.', quoteAuthor: 'Jean Jaurès', quoteGenre: 'Courage' },
  { id: 5, quoteText: 'Le succès, c\'est d\'aller d\'échec en échec sans perdre son enthousiasme.', quoteAuthor: 'Winston Churchill', quoteGenre: 'Motivation' },
  { id: 6, quoteText: 'La liberté commence là où l\'ignorance finit.', quoteAuthor: 'Victor Hugo', quoteGenre: 'Liberté' },
  { id: 7, quoteText: 'Il faut imaginer Sisyphe heureux.', quoteAuthor: 'Albert Camus', quoteGenre: 'Philosophie' },
  { id: 8, quoteText: 'Un homme qui n\'a pas lu n\'est qu\'un homme qui ne sait pas lire.', quoteAuthor: 'Voltaire', quoteGenre: 'Savoir' },
  { id: 9, quoteText: 'Le bonheur est parfois caché dans l\'inconnu.', quoteAuthor: 'Victor Hugo', quoteGenre: 'Bonheur' },
  { id: 10, quoteText: 'Chaque homme doit inventer son propre chemin.', quoteAuthor: 'Antoine de Saint-Exupéry', quoteGenre: 'Aventure' },
  { id: 11, quoteText: 'Rien n\'est plus dangereux qu\'une idée quand on n\'en a qu\'une.', quoteAuthor: 'Émile-Auguste Chartier', quoteGenre: 'Sagesse' },
  { id: 12, quoteText: 'La simplicité est la sophistication suprême.', quoteAuthor: 'Léonard de Vinci', quoteGenre: 'Sagesse' },
  { id: 13, quoteText: 'Nous ne voyons pas les choses comme elles sont, mais comme nous sommes.', quoteAuthor: 'Anaïs Nin', quoteGenre: 'Perception' },
  { id: 14, quoteText: 'Le seul vrai voyage, ce ne serait pas d\'aller vers de nouveaux paysages, mais d\'avoir d\'autres yeux.', quoteAuthor: 'Marcel Proust', quoteGenre: 'Voyage' },
  { id: 15, quoteText: 'On ne naît pas femme, on le devient.', quoteAuthor: 'Simone de Beauvoir', quoteGenre: 'Philosophie' },
  { id: 16, quoteText: 'La vraie générosité envers l\'avenir consiste à tout donner au présent.', quoteAuthor: 'Albert Camus', quoteGenre: 'Générosité' },
  { id: 17, quoteText: 'La lecture est une amitié.', quoteAuthor: 'Marcel Proust', quoteGenre: 'Savoir' },
  { id: 18, quoteText: 'Ce qui ne te tue pas te rend plus fort.', quoteAuthor: 'Friedrich Nietzsche', quoteGenre: 'Courage' },
  { id: 19, quoteText: 'La connaissance s\'acquiert par l\'expérience, tout le reste n\'est que de l\'information.', quoteAuthor: 'Albert Einstein', quoteGenre: 'Savoir' },
  { id: 20, quoteText: 'L\'imagination est plus importante que le savoir.', quoteAuthor: 'Albert Einstein', quoteGenre: 'Créativité' },
  { id: 21, quoteText: 'La folie, c\'est de faire toujours la même chose et de s\'attendre à un résultat différent.', quoteAuthor: 'Attribué à Einstein', quoteGenre: 'Sagesse' },
  { id: 22, quoteText: 'Le meilleur moyen de prédire l\'avenir est de le créer.', quoteAuthor: 'Peter Drucker', quoteGenre: 'Motivation' },
  { id: 23, quoteText: 'Dans la vie, on ne fait bien que ce qu\'on aime.', quoteAuthor: 'Raymond Aron', quoteGenre: 'Passion' },
  { id: 24, quoteText: 'La passion est la mère du plaisir et le père de la douleur.', quoteAuthor: 'Blaise Pascal', quoteGenre: 'Passion' },
  { id: 25, quoteText: 'Le cœur a ses raisons que la raison ne connaît point.', quoteAuthor: 'Blaise Pascal', quoteGenre: 'Amour' },
  { id: 26, quoteText: 'Il y a deux erreurs fondamentales : la confusion entre le bien et le mal, et la négligence de la différence.', quoteAuthor: 'Gandhi', quoteGenre: 'Morale' },
  { id: 27, quoteText: 'Celui qui déplace une montagne commence par déplacer de petites pierres.', quoteAuthor: 'Confucius', quoteGenre: 'Persévérance' },
  { id: 28, quoteText: 'Le bon sens est la chose la mieux partagée au monde.', quoteAuthor: 'René Descartes', quoteGenre: 'Sagesse' },
  { id: 29, quoteText: 'Être ou ne pas être, telle est la question.', quoteAuthor: 'William Shakespeare', quoteGenre: 'Philosophie' },
  { id: 30, quoteText: 'La musique est la shorthand de l\'émotion.', quoteAuthor: 'Léon Tolstoï', quoteGenre: 'Musique' },
  { id: 31, quoteText: 'Les mots sont des fenêtres ou bien ce sont des murs.', quoteAuthor: 'Marshall Rosenberg', quoteGenre: 'Communication' },
  { id: 32, quoteText: 'Tout ce que je sais, c\'est que je ne sais rien.', quoteAuthor: 'Socrate', quoteGenre: 'Humilité' },
  { id: 33, quoteText: 'La beauté sauvera le monde.', quoteAuthor: 'Fiodor Dostoïevski', quoteGenre: 'Beauté' },
  { id: 34, quoteText: 'Le plus grand voyage commence par un premier pas.', quoteAuthor: 'Lao Tseu', quoteGenre: 'Aventure' },
  { id: 35, quoteText: 'Le bonheur n\'est pas une destination, mais un chemin.', quoteAuthor: 'Proverbe', quoteGenre: 'Bonheur' },
  { id: 36, quoteText: 'Un esprit sain dans un corps sain.', quoteAuthor: 'Juvénal', quoteGenre: 'Santé' },
  { id: 37, quoteText: 'Apprendre à vivre, c\'est apprendre à mourir.', quoteAuthor: 'Michel de Montaigne', quoteGenre: 'Philosophie' },
  { id: 38, quoteText: 'La chance sourit aux audacieux.', quoteAuthor: 'Proverbe latin', quoteGenre: 'Courage' },
  { id: 39, quoteText: 'Les grandes choses se font par une série de petites choses réunies.', quoteAuthor: 'Vincent Van Gogh', quoteGenre: 'Persévérance' },
  { id: 40, quoteText: 'L\'art de vivre, c\'est l\'art de se donner du temps.', quoteAuthor: 'Sénèque', quoteGenre: 'Sagesse' },
  { id: 41, quoteText: 'Ce qui est fait n\'est plus à faire.', quoteAuthor: 'Proverbe français', quoteGenre: 'Temps' },
  { id: 42, quoteText: 'Là où il y a une volonté, il y a un chemin.', quoteAuthor: 'Proverbe anglais', quoteGenre: 'Motivation' },
  { id: 43, quoteText: 'Le temps ne respecte pas ce qui se fait sans lui.', quoteAuthor: 'Proverbe français', quoteGenre: 'Temps' },
  { id: 44, quoteText: 'Chaque être humain est l\'auteur de sa propre santé ou de sa maladie.', quoteAuthor: 'Bouddha', quoteGenre: 'Santé' },
  { id: 45, quoteText: 'La gratitude est la mémoire du cœur.', quoteAuthor: 'Jean-Baptiste Massieu', quoteGenre: 'Gratitude' },
  { id: 46, quoteText: 'Il faut du temps pour devenir ce que l\'on est.', quoteAuthor: 'Julius Robert Oppenheimer', quoteGenre: 'Temps' },
  { id: 47, quoteText: 'Le respect de autrui, c\'est la paix.', quoteAuthor: 'Léopold Sédar Senghor', quoteGenre: 'Paix' },
  { id: 48, quoteText: 'La créativité, c\'est l\'intelligence qui s\'amuse.', quoteAuthor: 'Albert Einstein', quoteGenre: 'Créativité' },
  { id: 49, quoteText: 'Vivre, c\'est affronter le destin avec courage.', quoteAuthor: 'Proverbe japonais', quoteGenre: 'Courage' },
  { id: 50, quoteText: 'Le secret du changement, c\'est de concentrer toute ton énergie non pas à lutter contre le passé, mais à construire l\'avenir.', quoteAuthor: 'Socrate', quoteGenre: 'Motivation' },
];

/* ─── Functions ─── */

export async function getRandomQuote(): Promise<{
  success: boolean;
  data: Quote;
  fallback: boolean;
}> {
  const serviceKey = 'QUOTEGARDEN' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active) {
    const quote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    return { success: true, data: quote, fallback: true };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    const quote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    return { success: true, data: quote, fallback: true };
  }

  try {
    const result = await fetchWithCache<QuoteGardenResponse>(
      def,
      'quotegarden:random',
      async () => {
        const url = `${def.baseUrl}/quotes/random`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`QuoteGarden returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !result.data?.data?.length) {
      const quote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
      return { success: true, data: quote, fallback: true };
    }

    const q = result.data.data[0];
    return {
      success: true,
      data: {
        id: parseInt(q._id, 10) || Math.floor(Math.random() * 100000),
        quoteText: q.quoteText,
        quoteAuthor: q.quoteAuthor,
        quoteGenre: q.quoteGenre,
      },
      fallback: false,
    };
  } catch {
    const quote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    return { success: true, data: quote, fallback: true };
  }
}

export async function getQuotesByCategory(category: string): Promise<{
  success: boolean;
  data: Quote[];
  fallback: boolean;
}> {
  const serviceKey = 'QUOTEGARDEN' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active) {
    const filtered = FALLBACK_QUOTES.filter(
      (q) =>
        q.quoteGenre?.toLowerCase().includes(category.toLowerCase()) ||
        q.quoteText.toLowerCase().includes(category.toLowerCase()) ||
        q.quoteAuthor.toLowerCase().includes(category.toLowerCase())
    );
    return { success: true, data: filtered.length > 0 ? filtered : FALLBACK_QUOTES.slice(0, 10), fallback: true };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    const filtered = FALLBACK_QUOTES.filter(
      (q) =>
        q.quoteGenre?.toLowerCase().includes(category.toLowerCase()) ||
        q.quoteText.toLowerCase().includes(category.toLowerCase()) ||
        q.quoteAuthor.toLowerCase().includes(category.toLowerCase())
    );
    return { success: true, data: filtered.length > 0 ? filtered : FALLBACK_QUOTES.slice(0, 10), fallback: true };
  }

  try {
    const result = await fetchWithCache<QuoteGardenResponse>(
      def,
      `quotegarden:category:${category}`,
      async () => {
        const url = `${def.baseUrl}/quotes?category=${encodeURIComponent(category)}`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`QuoteGarden returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !result.data?.data?.length) {
      const filtered = FALLBACK_QUOTES.filter(
        (q) =>
          q.quoteGenre?.toLowerCase().includes(category.toLowerCase()) ||
          q.quoteText.toLowerCase().includes(category.toLowerCase()) ||
          q.quoteAuthor.toLowerCase().includes(category.toLowerCase())
      );
      return { success: true, data: filtered.length > 0 ? filtered : FALLBACK_QUOTES.slice(0, 10), fallback: true };
    }

    const quotes: Quote[] = result.data.data.map((q) => ({
      id: parseInt(q._id, 10) || Math.floor(Math.random() * 100000),
      quoteText: q.quoteText,
      quoteAuthor: q.quoteAuthor,
      quoteGenre: q.quoteGenre,
    }));

    return { success: true, data: quotes, fallback: false };
  } catch {
    const filtered = FALLBACK_QUOTES.filter(
      (q) =>
        q.quoteGenre?.toLowerCase().includes(category.toLowerCase()) ||
        q.quoteText.toLowerCase().includes(category.toLowerCase()) ||
        q.quoteAuthor.toLowerCase().includes(category.toLowerCase())
    );
    return { success: true, data: filtered.length > 0 ? filtered : FALLBACK_QUOTES.slice(0, 10), fallback: true };
  }
}
