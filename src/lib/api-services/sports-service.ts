/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Sports Service
   TheSportsDB API: event search, team search
   ═══════════════════════════════════════════════════════ */

import { db } from '@/lib/db';
import { safeFetch, fetchWithCache, getDefinition } from '@/lib/external-apis';
import { decryptSecret } from '@/lib/aes-crypto';
import type { ApiKey } from '@/lib/external-apis';

/* ─── Types ─── */

export interface SportEvent {
  idEvent: string;
  strEvent: string;
  strLeague: string;
  strSeason: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  dateEvent: string;
  strTime: string;
  strThumb: string | null;
  strSport: string;
  strDescriptionEN: string | null;
}

export interface TeamInfo {
  idTeam: string;
  strTeam: string;
  strTeamBadge: string | null;
  strLeague: string;
  strStadium: string;
  strDescriptionFR: string | null;
  intFormedYear: string | null;
  strSport: string;
}

interface SportsDbEventResponse {
  event: SportEvent[] | null;
}

interface SportsDbTeamResponse {
  teams: TeamInfo[] | null;
}

/* ─── Helper ─── */

async function getApiConfig(serviceKey: ApiKey): Promise<{ active: boolean; apiKey?: string }> {
  const config = await db.apiConfig.findUnique({ where: { serviceKey } });
  if (!config || !config.isActive) return { active: false };
  return { active: true, apiKey: config.apiKey ? decryptSecret(config.apiKey) : undefined };
}

/* ─── Fallback ─── */

const FALLBACK_MESSAGE = 'Infos sport non disponibles en mode hors ligne';

/* ─── Functions ─── */

export async function searchEvents(query: string): Promise<{
  success: boolean;
  data: SportEvent[];
  fallback: boolean;
}> {
  const serviceKey = 'THESPORTSDB' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active || !config.apiKey) {
    return { success: false, data: [], fallback: true };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return { success: false, data: [], fallback: true };
  }

  try {
    const result = await fetchWithCache<SportsDbEventResponse>(
      def,
      `sports:events:${query}`,
      async () => {
        const url = `${def.baseUrl}/api/v1/json/${config.apiKey}/searchevents.php?e=${encodeURIComponent(query)}`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`TheSportsDB returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !result.data?.event) {
      return { success: false, data: [], fallback: true };
    }

    return { success: true, data: result.data.event, fallback: false };
  } catch {
    return { success: false, data: [], fallback: true };
  }
}

export async function getTeamScores(team: string): Promise<{
  success: boolean;
  data: TeamInfo[];
  fallback: boolean;
}> {
  const serviceKey = 'THESPORTSDB' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active || !config.apiKey) {
    return { success: false, data: [], fallback: true };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return { success: false, data: [], fallback: true };
  }

  try {
    const result = await fetchWithCache<SportsDbTeamResponse>(
      def,
      `sports:team:${team}`,
      async () => {
        const url = `${def.baseUrl}/api/v1/json/${config.apiKey}/searchteams.php?t=${encodeURIComponent(team)}`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`TheSportsDB returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !result.data?.teams) {
      return { success: false, data: [], fallback: true };
    }

    return { success: true, data: result.data.teams, fallback: false };
  } catch {
    return { success: false, data: [], fallback: true };
  }
}
