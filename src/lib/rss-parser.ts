/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — RSS Parser (xml2js)
   Fetches and parses RSS/Atom feeds for news headlines.
   Supports RSS 2.0 and Atom formats with 30 min cache.
   ═══════════════════════════════════════════════════════ */

import xml2js from 'xml2js';
import { RSS_SOURCES, type RSSSource } from './constants';

// ─── xml2js parser instance ─────────────────────────────

const parser = new xml2js.Parser({
  explicitArray: false,
  normalizeTags: true,
});

// ─── Types ──────────────────────────────────────────────

export interface RssArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
}

// ─── In-memory cache (30 min TTL) ──────────────────────

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  timestamp: number;
  articles: RssArticle[];
}

const feedCache = new Map<string, CacheEntry>();

function getCached(key: string): RssArticle[] | null {
  const entry = feedCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    feedCache.delete(key);
    return null;
  }
  return entry.articles;
}

function setCache(key: string, articles: RssArticle[]): void {
  feedCache.set(key, { timestamp: Date.now(), articles });
}

/**
 * Clear all RSS cache entries.
 */
export function clearRSSCache(): void {
  feedCache.clear();
}

// ─── Helpers ───────────────────────────────────────────

/**
 * Strip all HTML tags from a string and collapse whitespace.
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
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

/**
 * Normalize items from xml2js result (explicitArray:false can
 * produce a single object OR an array depending on feed structure).
 */
function normalizeItems(raw: unknown): Record<string, unknown>[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean) as Record<string, unknown>[];
  if (typeof raw === 'object') return [raw as Record<string, unknown>];
  return [];
}

/**
 * Safely extract a string value from an xml2js-parsed node.
 */
function str(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null && '_' in val) {
    // xml2js sometimes puts text content in _
    return String((val as Record<string, unknown>)._ ?? '');
  }
  return String(val);
}

// ─── Core parse function ────────────────────────────────

/**
 * Parse a single RSS/Atom feed and return articles.
 * Supports:
 *   - RSS 2.0  →  parsed.rss.channel.item
 *   - Atom      →  parsed.feed.entry
 *
 * Results are cached for 30 minutes per feed URL.
 */
export async function parseRSSFeed(source: RSSSource): Promise<RssArticle[]> {
  const cached = getCached(source.url);
  if (cached) return cached;

  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'MaisonConsciente/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml',
      },
    });

    if (!res.ok) {
      const empty: RssArticle[] = [];
      setCache(source.url, empty);
      return empty;
    }

    const xml = await res.text();
    const parsed = await parser.parseStringPromise(xml);

    const articles = extractArticles(parsed, source);
    setCache(source.url, articles);
    return articles;
  } catch {
    // Network error, DNS failure, parse error – return empty
    const empty: RssArticle[] = [];
    setCache(source.url, empty);
    return empty;
  }
}

/**
 * Extract articles from either RSS 2.0 or Atom parsed result.
 */
function extractArticles(
  parsed: Record<string, unknown>,
  source: RSSSource,
): RssArticle[] {
  const articles: RssArticle[] = [];

  // ── RSS 2.0 format ──
  const rss = parsed.rss as Record<string, unknown> | undefined;
  if (rss) {
    const channel = rss.channel as Record<string, unknown> | undefined;
    if (channel) {
      const items = normalizeItems(channel.item);
      for (const item of items) {
        const title = stripHtml(str(item.title));
        const description = stripHtml(str(item.description ?? item.summary));
        const link = str(item.link);
        const pubDate =
          str(item.pubDate) ||
          str(item['dc:date']) ||
          new Date().toISOString();

        if (title) {
          articles.push({ title, description, link, pubDate, source: source.name, category: source.category });
        }
      }
    }
  }

  // ── Atom format ──
  const feed = parsed.feed as Record<string, unknown> | undefined;
  if (feed && !rss) {
    const entries = normalizeItems(feed.entry);
    for (const entry of entries) {
      const title = stripHtml(str(entry.title));
      const description = stripHtml(
        str(entry.summary ?? entry.content ?? entry.subtitle),
      );

      // Atom links can be an array of { href } objects or a simple string
      let link = '';
      const rawLink = entry.link;
      if (typeof rawLink === 'string') {
        link = rawLink;
      } else if (typeof rawLink === 'object' && rawLink !== null) {
        if ('href' in rawLink) {
          link = str((rawLink as Record<string, unknown>).href);
        } else if ('$' in rawLink) {
          const attr = (rawLink as Record<string, unknown>).$ as Record<string, unknown> | undefined;
          link = str(attr?.href);
        }
      }

      const pubDate =
        str(entry.published) ||
        str(entry.updated) ||
        new Date().toISOString();

      if (title) {
        articles.push({ title, description, link, pubDate, source: source.name, category: source.category });
      }
    }
  }

  return articles;
}

// ─── Public: fetch all feeds ────────────────────────────

/**
 * Fetch all active RSS feeds in parallel and return the latest articles.
 * Sorts by publication date descending, capped at 30 articles.
 */
export async function fetchAllFeeds(sources?: RSSSource[]): Promise<RssArticle[]> {
  const feedList = sources ?? RSS_SOURCES.filter((s) => s.active);

  const results = await Promise.allSettled(
    feedList.map((src) => parseRSSFeed(src)),
  );

  const articles: RssArticle[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  }

  return articles
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 30);
}

// ─── TTS formatting ─────────────────────────────────────

/**
 * Format articles into a TTS-friendly French string.
 */
export function formatArticlesForTTS(articles: RssArticle[], maxCount = 5): string {
  if (articles.length === 0) {
    return 'Aucune actualité disponible pour le moment.';
  }

  const top = articles.slice(0, maxCount);
  const headlines = top
    .map((a, i) => `${i + 1}. ${a.title}`)
    .join('. ');

  return `Voici les dernières actualités : ${headlines}.`;
}
