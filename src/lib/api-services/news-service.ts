/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — News & Info Service
   GNews API: headlines, Wikipedia API: article summaries
   ═══════════════════════════════════════════════════════ */

import { db } from '@/lib/db';
import { safeFetch, fetchWithCache, getDefinition } from '@/lib/external-apis';
import { decryptSecret } from '@/lib/aes-crypto';
import type { ApiKey } from '@/lib/external-apis';

/* ─── Types ─── */

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedAt: string;
  source: { name: string };
}

export interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: { source: string; width: number; height: number };
  pageId?: number;
  lang?: string;
}

interface GNewsResponse {
  totalArticles: number;
  articles: Array<{
    title: string;
    description: string;
    url: string;
    image: string | null;
    publishedAt: string;
    source: { name: string };
  }>;
}

interface WikiApiResponse {
  title: string;
  extract: string;
  thumbnail?: { source: string; width: number; height: number } | null;
  pageid?: number;
  lang?: string;
  type?: string;
}

/* ─── Helpers ─── */

async function getApiConfig(serviceKey: ApiKey): Promise<{ active: boolean; apiKey?: string }> {
  const config = await db.apiConfig.findUnique({ where: { serviceKey } });
  if (!config || !config.isActive) return { active: false };
  return { active: true, apiKey: config.apiKey ? decryptSecret(config.apiKey) : undefined };
}

/* ─── Fallback Data ─── */

const FALLBACK_NEWS: NewsArticle[] = [
  {
    title: 'Transition écologique : la France accélère ses objectifs pour 2030',
    description: 'Le gouvernement annonce de nouvelles mesures ambitieuses pour réduire les émissions de gaz à effet de serre.',
    url: 'https://www.example.com/news/1',
    publishedAt: new Date().toISOString(),
    source: { name: 'Actualités Maison Consciente' },
  },
  {
    title: 'Innovation en IA : les startups françaises à la pointe',
    description: 'La French Tech continue de rayonner avec des avancées majeures en intelligence artificielle appliquée à la santé.',
    url: 'https://www.example.com/news/2',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { name: 'Actualités Maison Consciente' },
  },
  {
    title: 'Plein air et bien-être : les bienfaits prouvés de la nature',
    description: 'Une étude récente confirme que passer 20 minutes par jour en nature réduit significativement le stress.',
    url: 'https://www.example.com/news/3',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { name: 'Actualités Maison Consciente' },
  },
  {
    title: 'Gastronomie française : un nouveau classement UNESCO',
    description: 'Le patrimoine culinaire français continue d\'inspirer le monde entier avec ses savoir-faire traditionnels.',
    url: 'https://www.example.com/news/4',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { name: 'Actualités Maison Consciente' },
  },
  {
    title: 'Mobilité douce : les villes françaises investissent dans le vélo',
    description: 'Le nombre de pistes cyclables double dans les grandes agglomérations, favorisant un mode de vie plus sain.',
    url: 'https://www.example.com/news/5',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    source: { name: 'Actualités Maison Consciente' },
  },
];

/* ─── Functions ─── */

export async function getHeadlines(category: string = 'general'): Promise<{
  success: boolean;
  data: NewsArticle[];
  fallback: boolean;
}> {
  const serviceKey = 'GNEWS' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active || !config.apiKey) {
    return { success: true, data: FALLBACK_NEWS, fallback: true };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return { success: true, data: FALLBACK_NEWS, fallback: true };
  }

  try {
    const result = await fetchWithCache<GNewsResponse>(
      def,
      `gnews:headlines:${category}`,
      async () => {
        const url = `${def.baseUrl}/v4/top-headlines?country=fr&category=${category}&lang=fr&apikey=${config.apiKey}`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`GNews returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !result.data?.articles) {
      return { success: true, data: FALLBACK_NEWS, fallback: true };
    }

    const articles: NewsArticle[] = result.data.articles.map((a) => ({
      title: a.title,
      description: a.description || '',
      url: a.url,
      image: a.image || undefined,
      publishedAt: a.publishedAt,
      source: { name: a.source?.name || 'Source inconnue' },
    }));

    return { success: true, data: articles, fallback: false };
  } catch {
    return { success: true, data: FALLBACK_NEWS, fallback: true };
  }
}

export async function searchWikipedia(title: string): Promise<{
  success: boolean;
  data: WikiSummary;
  fallback: boolean;
}> {
  const serviceKey = 'WIKIPEDIA' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active) {
    return {
      success: false,
      data: {
        title,
        extract: `Information non disponible hors connexion pour « ${title} »`,
      },
      fallback: true,
    };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return {
      success: false,
      data: {
        title,
        extract: `Information non disponible hors connexion pour « ${title} »`,
      },
      fallback: true,
    };
  }

  try {
    const result = await fetchWithCache<WikiApiResponse>(
      def,
      `wiki:${title}`,
      async () => {
        const url = `${def.baseUrl}/page/summary/${encodeURIComponent(title)}`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`Wikipedia returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !result.data) {
      return {
        success: false,
        data: {
          title,
          extract: `Information non disponible hors connexion pour « ${title} »`,
        },
        fallback: true,
      };
    }

    const wiki = result.data;
    const summary: WikiSummary = {
      title: wiki.title || title,
      extract: wiki.extract || `Aucun résumé disponible pour « ${title} »`,
      thumbnail: wiki.thumbnail ? { source: wiki.thumbnail.source, width: wiki.thumbnail.width, height: wiki.thumbnail.height } : undefined,
      pageId: wiki.pageid,
      lang: wiki.lang || 'fr',
    };

    // Wikipedia returns { type: 'disambiguation' } for ambiguous titles
    if (wiki.type === 'disambiguation') {
      summary.extract = `« ${title} » est un terme ambigu qui peut désigner plusieurs sujets. Essayez d'être plus précis.`;
    }

    return { success: true, data: summary, fallback: false };
  } catch {
    return {
      success: false,
      data: {
        title,
        extract: `Information non disponible hors connexion pour « ${title} »`,
      },
      fallback: true,
    };
  }
}
