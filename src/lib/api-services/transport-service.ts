/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Transport Service
   OpenSky Network: flights nearby, Navitia: transit departures
   ═══════════════════════════════════════════════════════ */

import { db } from '@/lib/db';
import { safeFetch, fetchWithCache, getDefinition } from '@/lib/external-apis';
import { decryptSecret } from '@/lib/aes-crypto';
import type { ApiKey } from '@/lib/external-apis';

/* ─── Types ─── */

export interface FlightState {
  icao24: string;
  callsign: string | null;
  originCountry: string;
  timePosition: number | null;
  lastContact: number;
  longitude: number | null;
  latitude: number | null;
  baroAltitude: number | null;
  onGround: boolean;
  velocity: number | null;
  heading: number | null;
  transponderCode: string | null;
}

export interface TransitDeparture {
  line: string;
  direction: string;
  scheduledDeparture: string;
  realtimeDeparture?: string;
  status: string;
}

interface OpenSkyResponse {
  time: number;
  states: Array<
    [
      string,    // icao24
      string,    // callsign
      string,    // originCountry
      number,    // timePosition
      number,    // lastContact
      number,    // longitude
      number,    // latitude
      number,    // baroAltitude
      boolean,   // onGround
      number,    // velocity
      number,    // heading
      string,    // transponderCode
    ]
  > | null;
}

/* ─── Helpers ─── */

async function getApiConfig(serviceKey: ApiKey): Promise<{ active: boolean; apiKey?: string }> {
  const config = await db.apiConfig.findUnique({ where: { serviceKey } });
  if (!config || !config.isActive) return { active: false };
  return { active: true, apiKey: config.apiKey ? decryptSecret(config.apiKey) : undefined };
}

/* ─── Fallback ─── */

interface FallbackResult {
  success: boolean;
  data: never[];
  fallback: boolean;
  message?: string;
}

/* ─── Functions ─── */

export async function getFlightsNearby(lat: number, lon: number, radius: number = 0.5): Promise<{
  success: boolean;
  data: FlightState[];
  fallback: boolean;
  message?: string;
}> {
  const serviceKey = 'OPENSKY' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active) {
    return {
      success: false,
      data: [],
      fallback: true,
      message: 'Infos vols/transport non disponibles',
    };
  }

  const def = getDefinition(serviceKey);
  if (!def) {
    return {
      success: false,
      data: [],
      fallback: true,
      message: 'Infos vols/transport non disponibles',
    };
  }

  try {
    const lamin = lat - radius;
    const lomin = lon - radius;
    const lomax = lon + radius;

    const result = await fetchWithCache<OpenSkyResponse>(
      def,
      `opensky:flights:${lat.toFixed(2)}:${lon.toFixed(2)}:${radius}`,
      async () => {
        const url = `${def.baseUrl}/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lat + radius}&lomax=${lomax}`;
        const res = await safeFetch(url, {}, def.timeoutMs);
        if (!res.ok) throw new Error(`OpenSky returned ${res.status}`);
        return res.json();
      }
    );

    if (result.fallback || !result.data?.states) {
      return {
        success: false,
        data: [],
        fallback: true,
        message: 'Infos vols/transport non disponibles',
      };
    }

    const flights: FlightState[] = result.data.states
      .filter((s) => s[5] !== null && s[6] !== null) // has lon/lat
      .map((s) => ({
        icao24: s[0],
        callsign: s[1]?.trim() || null,
        originCountry: s[2],
        timePosition: s[3] || null,
        lastContact: s[4],
        longitude: s[5],
        latitude: s[6],
        baroAltitude: s[7] || null,
        onGround: s[8],
        velocity: s[9] || null,
        heading: s[10] || null,
        transponderCode: s[11] || null,
      }));

    return { success: true, data: flights, fallback: false };
  } catch {
    return {
      success: false,
      data: [],
      fallback: true,
      message: 'Infos vols/transport non disponibles',
    };
  }
}

export async function getNextDepartures(_line: string): Promise<{
  success: boolean;
  data: TransitDeparture[];
  fallback: boolean;
  message?: string;
}> {
  // Navitia requires specific stop point IDs which are not available in this context
  // This function acts as a placeholder — the actual implementation would need
  // a configured stop_area:stop_point URI from Navitia coverage
  const serviceKey = 'NAVITIA' as ApiKey;
  const config = await getApiConfig(serviceKey);

  if (!config.active || !config.apiKey) {
    return {
      success: false,
      data: [],
      fallback: true,
      message: 'Infos transport non disponibles — configuration Navitia requise',
    };
  }

  return {
    success: false,
    data: [],
    fallback: true,
    message: 'Infos transport non disponibles — point d\'arrêt non configuré',
  };
}
