import { db } from '@/lib/db';

interface RssItem {
  title: string;
  source: string;
  link?: string;
  pubDate?: string;
  description?: string;
}

interface RssSource {
  id: string;
  name: string;
  url: string;
  category: string;
  refreshIntervalMin: number;
  active: boolean;
}

export async function parseRssFeed(url: string, sourceName?: string): Promise<RssItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal, next: { revalidate: 1800 } });
    clearTimeout(timeout);
    if (!response.ok) return [];
    
    const text = await response.text();
    const parseString = (await import('xml2js')).parseStringPromise;
    const result = await parseString(text, { explicitArray: false, mergeAttrs: true });
    
    const items: RssItem[] = [];
    const source = sourceName || sourceName;
    
    // RSS 2.0 format
    if (result.rss?.channel?.item) {
      const feedItems = Array.isArray(result.rss.channel.item) 
        ? result.rss.channel.item 
        : [result.rss.channel.item];
      for (const item of feedItems.slice(0, 15)) {
        items.push({
          title: item.title || '',
          source: result.rss.channel.title || source || 'Actualités',
          link: item.link || undefined,
          pubDate: item.pubDate || undefined,
          description: item.description || undefined,
        });
      }
    }
    // Atom format
    else if (result.feed?.entry) {
      const feedItems = Array.isArray(result.feed.entry) 
        ? result.feed.entry 
        : [result.feed.entry];
      for (const item of feedItems.slice(0, 15)) {
        items.push({
          title: item.title?._ || item.title || '',
          source: result.feed.title?._ || result.feed.title || source || 'Actualités',
          link: item.link?.href || item.link || undefined,
          pubDate: item.published || item.updated || undefined,
        });
      }
    }
    
    return items.filter(item => item.title && item.title.length > 10);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[rss-parser] Error parsing feed:', url, error);
    }
    return [];
  }
}

export async function fetchNewsFromSources(sources: RssSource[]): Promise<{ general: RssItem[]; sport: RssItem[]; culture: RssItem[] }> {
  const activeSources = sources.filter(s => s.active);
  const results = { general: [] as RssItem[], sport: [] as RssItem[], culture: [] as RssItem[] };
  
  const promises = activeSources.map(async (source) => {
    try {
      const items = await parseRssFeed(source.url, source.name);
      const categorized = items.map(item => ({ ...item, _category: source.category }));
      
      if (source.category === 'sport') results.sport.push(...categorized);
      else if (source.category === 'culture') results.culture.push(...categorized);
      else if (source.category !== 'horoscope') results.general.push(...categorized);
    } catch { /* silent */ }
  });
  
  await Promise.allSettled(promises);
  
  // Sort by date descending
  for (const key of Object.keys(results) as (keyof typeof results)[]) {
    results[key].sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });
  }
  
  return results;
}

export function extractHoroscopeText(sign: string, feedItems: RssItem[]): string | null {
  if (!feedItems.length) return null;
  
  const signLower = sign.toLowerCase();
  const keywords = [signLower, sign, sign.replace('é', 'e').replace('è', 'e')];
  
  for (const item of feedItems) {
    const textToSearch = `${item.title} ${item.description || ''}`.toLowerCase();
    for (const keyword of keywords) {
      if (textToSearch.includes(keyword.toLowerCase()) && item.description) {
        return item.description.replace(/<[^>]*>/g, '').trim();
      }
    }
  }
  
  return null;
}
