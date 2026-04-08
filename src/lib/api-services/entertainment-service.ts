/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Entertainment Service
   TMDb: movies, NASA: APOD, Official Joke API: jokes
   ═══════════════════════════════════════════════════════ */

import { db } from '@/lib/db';
import { safeFetch, fetchWithCache, getDefinition } from '@/lib/external-apis';
import { decryptSecret } from '@/lib/aes-crypto';
import type { ApiKey } from '@/lib/external-apis';

/* ─── Types ─── */

export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  genreIds: number[];
  adult: boolean;
  originalLanguage: string;
  originalTitle: string;
  popularity: number;
  backdropPath: string | null;
}

export interface NasaApod {
  title: string;
  url: string;
  explanation: string;
  date: string;
  mediaType: string;
  hdurl?: string;
  copyright?: string;
}

export interface Joke {
  id: number;
  type: string;
  setup: string;
  punchline: string;
}

interface TmdbMoviesResponse {
  results: Array<{
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    adult: boolean;
    original_language: string;
    original_title: string;
    popularity: number;
    backdrop_path: string | null;
  }>;
  total_results: number;
}

interface JokeApiResponse {
  id: number;
  type: string;
  setup: string;
  punchline: string;
}

/* ─── Helpers ─── */

async function getApiConfig(serviceKey: ApiKey): Promise<{ active: boolean; apiKey?: string }> {
  const config = await db.apiConfig.findUnique({ where: { serviceKey } });
  if (!config || !config.isActive) return { active: false };
  return { active: true, apiKey: config.apiKey ? decryptSecret(config.apiKey) : undefined };
}

/* ─── Fallback Data ─── */

const FALLBACK_MOVIES: Movie[] = [
  { id: 1, title: 'Dune : Partie Deux', overview: 'Paul Atréides s\'allie aux Fremen pour venger sa famille.', posterPath: null, releaseDate: '2024-02-27', voteAverage: 8.2, voteCount: 5200, genreIds: [28, 878], adult: false, originalLanguage: 'en', originalTitle: 'Dune: Part Two', popularity: 95.5, backdropPath: null },
  { id: 2, title: 'Oppenheimer', overview: 'L\'histoire du physicien J. Robert Oppenheimer et la création de la bombe atomique.', posterPath: null, releaseDate: '2023-07-19', voteAverage: 8.4, voteCount: 8100, genreIds: [18, 36], adult: false, originalLanguage: 'en', originalTitle: 'Oppenheimer', popularity: 88.2, backdropPath: null },
  { id: 3, title: 'Le Comte de Monte-Cristo', overview: 'Adaptation du roman d\'Alexandre Dumas, Edmond Dantès se venge de ses ennemis.', posterPath: null, releaseDate: '2024-06-28', voteAverage: 8.1, voteCount: 3400, genreIds: [28, 18], adult: false, originalLanguage: 'fr', originalTitle: 'Le Comte de Monte-Cristo', popularity: 82.1, backdropPath: null },
  { id: 4, title: 'Les Choses Humaines', overview: 'Un drame familial autour d\'un accusé de viol et de ses proches.', posterPath: null, releaseDate: '2024-11-06', voteAverage: 7.5, voteCount: 1800, genreIds: [18], adult: false, originalLanguage: 'fr', originalTitle: 'Les Choses Humaines', popularity: 72.3, backdropPath: null },
  { id: 5, title: 'Anatomie d\'une chute', overview: 'Un procès qui devient une autopsie d\'un couple. Palme d\'or Cannes 2023.', posterPath: null, releaseDate: '2023-08-23', voteAverage: 7.8, voteCount: 4200, genreIds: [18, 9648], adult: false, originalLanguage: 'fr', originalTitle: 'Anatomie d\'une chute', popularity: 85.6, backdropPath: null },
  { id: 6, title: 'The Batman', overview: 'Bruce Wayne enquête sur une série de meurtres liés à des énigmes.', posterPath: null, releaseDate: '2022-03-01', voteAverage: 7.7, voteCount: 9300, genreIds: [28, 80, 9648], adult: false, originalLanguage: 'en', originalTitle: 'The Batman', popularity: 78.9, backdropPath: null },
  { id: 7, title: 'Barbie', overview: 'Barbie et Ken découvrent le monde réel dans cette comédie fantaisiste.', posterPath: null, releaseDate: '2023-07-19', voteAverage: 7.0, voteCount: 7600, genreIds: [35, 14, 10751], adult: false, originalLanguage: 'en', originalTitle: 'Barbie', popularity: 91.4, backdropPath: null },
  { id: 8, title: 'Killers of the Flower Moon', overview: 'Les meurtres de la nation Osage dans l\'Oklahoma des années 1920.', posterPath: null, releaseDate: '2023-10-18', voteAverage: 7.9, voteCount: 5600, genreIds: [18, 36, 80], adult: false, originalLanguage: 'en', originalTitle: 'Killers of the Flower Moon', popularity: 76.2, backdropPath: null },
  { id: 9, title: 'Poor Things', overview: 'Bella Baxter est ramenée à la vie par un scientifique brillant et dérangeant.', posterPath: null, releaseDate: '2023-12-20', voteAverage: 7.9, voteCount: 3800, genreIds: [878, 35, 14], adult: false, originalLanguage: 'en', originalTitle: 'Poor Things', popularity: 74.8, backdropPath: null },
  { id: 10, title: 'Gladiator II', overview: 'Lucius, élevé loin de Rome, doit combattre en tant que gladiateur.', posterPath: null, releaseDate: '2024-11-22', voteAverage: 7.2, voteCount: 2100, genreIds: [28, 18, 12], adult: false, originalLanguage: 'en', originalTitle: 'Gladiator II', popularity: 80.3, backdropPath: null },
];

const FALLBACK_JOKES: Joke[] = [
  { id: 1, type: 'general', setup: 'Pourquoi les plongeurs plongent-ils toujours en arrière ?', punchline: 'Parce que sinon ils tomberaient dans le bateau !' },
  { id: 2, type: 'general', setup: 'Que fait un oiseau sur un fil électrique ?', punchline: 'Il fait court-circuit.' },
  { id: 3, type: 'general', setup: 'Quelle est la différence entre un avocat et une pizza ?', punchline: 'Une pizza peut nourrir une famille de quatre personnes.' },
  { id: 4, type: 'general', setup: 'Pourquoi les étoiles ne se parlent pas ?', punchline: 'Parce qu\'elles sont très éloignées les unes des autres !' },
  { id: 5, type: 'general', setup: 'Qu\'est-ce qu\'un crocodile qui surveille la cour de récréation ?', punchline: 'Un surveillant de marigot !' },
  { id: 6, type: 'general', setup: 'Pourquoi le chat est-il allé à l\'ordinateur ?', punchline: 'Pour surveiller la souris !' },
  { id: 7, type: 'general', setup: 'Que dit un escargot quand il traverse un route ?', punchline: 'Vite, je suis pressé !' },
  { id: 8, type: 'general', setup: 'Comment appelle-t-on un chien magique ?', punchline: 'Un labracadabrador !' },
  { id: 9, type: 'general', setup: 'Qu\'est-ce qu\'un canif ?', punchline: 'Un petit fien !' },
  { id: 10, type: 'general', setup: 'Pourquoi les maths sont tristes ?', punchline: 'Parce qu\'elles ont plein de problèmes.' },
  { id: 11, type: 'general', setup: 'Quelle est la ville la plus fatiguée de France ?', punchline: 'Narbonne, parce qu\'elle dort tout le temps.' },
  { id: 12, type: 'general', setup: 'Pourquoi le livre de mathématiques est-il triste ?', punchline: 'Parce qu\'il a trop de problèmes.' },
  { id: 13, type: 'general', setup: 'Que fait une fraise sur un cheval ?', punchline: 'Tagada tagada !' },
  { id: 14, type: 'general', setup: 'Pourquoi le scientifique n\'a pas de copine ?', punchline: 'Parce qu\'il préfère les atomes.' },
  { id: 15, type: 'general', setup: 'Que dit un citron quand il fait du vélo ?', punchline: 'Jus de pédale !' },
  { id: 16, type: 'general', setup: 'Qu\'est-ce qu\'un moustique sur un écran d\'ordinateur ?', punchline: 'Un bug.' },
  { id: 17, type: 'general', setup: 'Pourquoi les bananes ne peuvent-elles pas nager ?', punchline: 'Parce qu\'elles n\'ont pas de maillot de bain !' },
  { id: 18, type: 'general', setup: 'Quel est le comble pour un électricien ?', punchline: 'De ne pas être au courant.' },
  { id: 19, type: 'general', setup: 'Pourquoi le plongeur ne prend-il jamais de douche ?', punchline: 'Parce qu\'il est déjà mouillé.' },
  { id: 20, type: 'general', setup: 'Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ?', punchline: 'Un chat peint de Noël !' },
];

/* ─── Functions ─── */

export async function getNowPlayingMovies(): Promise<{
  success: boolean;
  data: Movie[];
  fallback: boolean;
}> {
  const serviceKey = 'TMDB' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active || !config.apiKey) {
    return { success: true, data: FALLBACK_MOVIES, fallback: true };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return { success: true, data: FALLBACK_MOVIES, fallback: true };
  }

  try {
    const result = await fetchWithCache<TmdbMoviesResponse>(
      def,
      'tmdb:now_playing',
      async () => {
        const url = `${def.baseUrl}/movie/now_playing?language=fr-FR&api_key=${config.apiKey}`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`TMDb returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !result.data?.results) {
      return { success: true, data: FALLBACK_MOVIES, fallback: true };
    }

    const movies: Movie[] = result.data.results.map((m) => ({
      id: m.id,
      title: m.title,
      overview: m.overview,
      posterPath: m.poster_path,
      releaseDate: m.release_date,
      voteAverage: m.vote_average,
      voteCount: m.vote_count,
      genreIds: m.genre_ids,
      adult: m.adult,
      originalLanguage: m.original_language,
      originalTitle: m.original_title,
      popularity: m.popularity,
      backdropPath: m.backdrop_path,
    }));

    return { success: true, data: movies, fallback: false };
  } catch {
    return { success: true, data: FALLBACK_MOVIES, fallback: true };
  }
}

export async function searchMovies(query: string): Promise<{
  success: boolean;
  data: Movie[];
  fallback: boolean;
}> {
  const serviceKey = 'TMDB' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active || !config.apiKey) {
    const filtered = FALLBACK_MOVIES.filter(
      (m) =>
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.overview.toLowerCase().includes(query.toLowerCase())
    );
    return { success: true, data: filtered.length > 0 ? filtered : FALLBACK_MOVIES, fallback: true };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return { success: true, data: FALLBACK_MOVIES, fallback: true };
  }

  try {
    const result = await fetchWithCache<TmdbMoviesResponse>(
      def,
      `tmdb:search:${query}`,
      async () => {
        const url = `${def.baseUrl}/search/movie?query=${encodeURIComponent(query)}&language=fr-FR&api_key=${config.apiKey}`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`TMDb returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !result.data?.results) {
      return { success: true, data: FALLBACK_MOVIES, fallback: true };
    }

    const movies: Movie[] = result.data.results.map((m) => ({
      id: m.id,
      title: m.title,
      overview: m.overview,
      posterPath: m.poster_path,
      releaseDate: m.release_date,
      voteAverage: m.vote_average,
      voteCount: m.vote_count,
      genreIds: m.genre_ids,
      adult: m.adult,
      originalLanguage: m.original_language,
      originalTitle: m.original_title,
      popularity: m.popularity,
      backdropPath: m.backdrop_path,
    }));

    return { success: true, data: movies, fallback: false };
  } catch {
    return { success: true, data: FALLBACK_MOVIES, fallback: true };
  }
}

export async function getNasaApod(): Promise<{
  success: boolean;
  data: NasaApod;
  fallback: boolean;
}> {
  const serviceKey = 'NASA' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active || !config.apiKey) {
    return {
      success: false,
      data: {
        title: 'Image spatiale locale',
        url: '/images/space-placeholder.jpg',
        explanation: 'Connexion NASA indisponible',
        date: new Date().toISOString().split('T')[0],
        mediaType: 'image',
      },
      fallback: true,
    };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return {
      success: false,
      data: {
        title: 'Image spatiale locale',
        url: '/images/space-placeholder.jpg',
        explanation: 'Connexion NASA indisponible',
        date: new Date().toISOString().split('T')[0],
        mediaType: 'image',
      },
      fallback: true,
    };
  }

  try {
    const result = await fetchWithCache<NasaApod>(
      def,
      `nasa:apod:${new Date().toISOString().split('T')[0]}`,
      async () => {
        const url = `${def.baseUrl}/planetary/apod?api_key=${config.apiKey}`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`NASA returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !result.data) {
      return {
        success: false,
        data: {
          title: 'Image spatiale locale',
          url: '/images/space-placeholder.jpg',
          explanation: 'Connexion NASA indisponible',
          date: new Date().toISOString().split('T')[0],
          mediaType: 'image',
        },
        fallback: true,
      };
    }

    return { success: true, data: result.data, fallback: false };
  } catch {
    return {
      success: false,
      data: {
        title: 'Image spatiale locale',
        url: '/images/space-placeholder.jpg',
        explanation: 'Connexion NASA indisponible',
        date: new Date().toISOString().split('T')[0],
        mediaType: 'image',
      },
      fallback: true,
    };
  }
}

export async function getRandomJoke(): Promise<{
  success: boolean;
  data: Joke;
  fallback: boolean;
}> {
  const serviceKey = 'OFFICIAL_JOKE' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active) {
    const joke = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
    return { success: true, data: joke, fallback: true };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    const joke = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
    return { success: true, data: joke, fallback: true };
  }

  try {
    const result = await fetchWithCache<JokeApiResponse>(
      def,
      'joke:random',
      async () => {
        const url = `${def.baseUrl}/random_joke`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`Joke API returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !result.data) {
      const joke = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
      return { success: true, data: joke, fallback: true };
    }

    const j = result.data;
    return {
      success: true,
      data: { id: j.id, type: j.type, setup: j.setup, punchline: j.punchline },
      fallback: false,
    };
  } catch {
    const joke = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
    return { success: true, data: joke, fallback: true };
  }
}
