/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Audio & Radio Service
   Radio Browser API: station search, top stations
   ═══════════════════════════════════════════════════════ */

import { db } from '@/lib/db';
import { safeFetch, fetchWithCache, getDefinition } from '@/lib/external-apis';
import { decryptSecret } from '@/lib/aes-crypto';
import type { ApiKey } from '@/lib/external-apis';

/* ─── Types ─── */

export interface RadioStation {
  name: string;
  url_resolved: string;
  country: string;
  tags?: string;
  codec?: string;
  bitrate?: number;
  favicon?: string;
  votes?: number;
}

interface RadioBrowserStation {
  name: string;
  url_resolved: string;
  country: string;
  tags: string;
  codec: string;
  bitrate: number;
  favicon: string;
  votes: number;
}

/* ─── Helper ─── */

async function getApiConfig(serviceKey: ApiKey): Promise<{ active: boolean; apiKey?: string }> {
  const config = await db.apiConfig.findUnique({ where: { serviceKey } });
  if (!config || !config.isActive) return { active: false };
  return { active: true, apiKey: config.apiKey ? decryptSecret(config.apiKey) : undefined };
}

/* ─── Fallback Data ─── */

const FALLBACK_STATIONS: RadioStation[] = [
  { name: 'France Inter', url_resolved: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3', country: 'France', tags: 'info,culture', codec: 'MP3', bitrate: 128 },
  { name: 'FIP Radio', url_resolved: 'https://icecast.radiofrance.fr/fip-midfi.mp3', country: 'France', tags: 'eclectique,musique', codec: 'MP3', bitrate: 128 },
  { name: 'RTL', url_resolved: 'https://stream.rtl.fr/rtl.mp3', country: 'France', tags: 'info,generaliste', codec: 'MP3', bitrate: 128 },
  { name: 'France Culture', url_resolved: 'https://icecast.radiofrance.fr/franceculture-midfi.mp3', country: 'France', tags: 'culture,debats', codec: 'MP3', bitrate: 128 },
  { name: 'France Musique', url_resolved: 'https://icecast.radiofrance.fr/francemusique-midfi.mp3', country: 'France', tags: 'classique,musique', codec: 'MP3', bitrate: 128 },
  { name: 'NRJ', url_resolved: 'https://scdn.nrjaudio.fm/fr/30001/mp3_128.mp3', country: 'France', tags: 'hits,pop', codec: 'MP3', bitrate: 128 },
  { name: 'RMC', url_resolved: 'https://rmc.bfmtv.com/rmc.mp3', country: 'France', tags: 'sport,debats', codec: 'MP3', bitrate: 128 },
  { name: 'Europe 1', url_resolved: 'https://stream.europe1.fr/europe1.mp3', country: 'France', tags: 'info,generaliste', codec: 'MP3', bitrate: 128 },
  { name: 'RFI Monde', url_resolved: 'https://live02.rfi.fr/rfimonde-96k.mp3', country: 'France', tags: 'international,info', codec: 'MP3', bitrate: 96 },
  { name: 'France Info', url_resolved: 'https://icecast.radiofrance.fr/franceinfo-midfi.mp3', country: 'France', tags: 'info,actualite', codec: 'MP3', bitrate: 128 },
  { name: 'France Bleu', url_resolved: 'https://icecast.radiofrance.fr/francebleu-midfi.mp3', country: 'France', tags: 'regional,info', codec: 'MP3', bitrate: 128 },
  { name: 'Skyrock', url_resolved: 'https://icecast.skyrock.com/skyrock.mp3', country: 'France', tags: 'rap,hip-hop', codec: 'MP3', bitrate: 128 },
];

/* ─── Functions ─── */

export async function searchRadioStations(query: string): Promise<{
  success: boolean;
  data: RadioStation[];
  fallback: boolean;
}> {
  const serviceKey = 'RADIO_BROWSER' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active) {
    const filtered = FALLBACK_STATIONS.filter(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.tags?.toLowerCase().includes(query.toLowerCase())
    );
    return { success: true, data: filtered.length > 0 ? filtered : FALLBACK_STATIONS, fallback: true };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return { success: true, data: FALLBACK_STATIONS, fallback: true };
  }

  try {
    const result = await fetchWithCache<RadioBrowserStation[]>(
      def,
      `radio:search:${query}`,
      async () => {
        const res = await safeFetch(
          `${def.baseUrl}/json/stations/bynameexact/${encodeURIComponent(query)}`,
          {},
          def.timeoutMs
        );
        if (!res.ok) throw new Error(`Radio Browser returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback) {
      return { success: true, data: FALLBACK_STATIONS, fallback: true };
    }

    const stations: RadioStation[] = (result.data || []).slice(0, 20).map((s) => ({
      name: s.name,
      url_resolved: s.url_resolved,
      country: s.country,
      tags: s.tags,
      codec: s.codec,
      bitrate: s.bitrate,
      favicon: s.favicon,
      votes: s.votes,
    }));

    return { success: true, data: stations, fallback: false };
  } catch {
    return { success: true, data: FALLBACK_STATIONS, fallback: true };
  }
}

export async function getTopStations(limit: number = 10): Promise<{
  success: boolean;
  data: RadioStation[];
  fallback: boolean;
}> {
  const serviceKey = 'RADIO_BROWSER' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active) {
    return { success: true, data: FALLBACK_STATIONS.slice(0, limit), fallback: true };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return { success: true, data: FALLBACK_STATIONS.slice(0, limit), fallback: true };
  }

  try {
    const result = await fetchWithCache<RadioBrowserStation[]>(
      def,
      `radio:top:${limit}`,
      async () => {
        const res = await safeFetch(
          `${def.baseUrl}/json/stations/topclick/${limit}`,
          {},
          def.timeoutMs
        );
        if (!res.ok) throw new Error(`Radio Browser returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback) {
      return { success: true, data: FALLBACK_STATIONS.slice(0, limit), fallback: true };
    }

    const stations: RadioStation[] = (result.data || []).slice(0, limit).map((s) => ({
      name: s.name,
      url_resolved: s.url_resolved,
      country: s.country,
      tags: s.tags,
      codec: s.codec,
      bitrate: s.bitrate,
      favicon: s.favicon,
      votes: s.votes,
    }));

    return { success: true, data: stations, fallback: false };
  } catch {
    return { success: true, data: FALLBACK_STATIONS.slice(0, limit), fallback: true };
  }
}
