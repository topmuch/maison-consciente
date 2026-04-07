'use server';

/* ═══════════════════════════════════════════════════════
   tablet-context.ts — Server Action
   
   Returns contextual data for the tablet display
   adapted to the current time-of-day phase.
   
   Uses realistic mock data structured for DB replacement.
   Fails silently with safe fallbacks.
   
   Security (C-06 fix):
   - Auth guard via getAuthUser() — returns mock data
     if no authenticated session is found
   ═══════════════════════════════════════════════════════ */

import type { TimePhase } from '@/hooks/useTimePhase';
import { getAuthUser } from '@/lib/server-auth';

/* ─── Types ─── */

interface TabletContext {
  phase: TimePhase;
  weather: {
    temperature: number;
    condition: string;
    high: number;
    low: number;
    icon: string;
  };
  message: string;
  action: {
    label: string;
    type: 'recipe' | 'grocery' | 'ambiance' | 'security' | 'schedule' | 'info';
    payload: string;
  };
  nextEvent: {
    title: string;
    time: string;
  } | null;
  householdStatus: {
    doors: 'locked' | 'unlocked';
    windows: 'closed' | 'open';
    alarm: 'armed' | 'disarmed';
  };
  extra: string[];
}

/* ─── Mock Data (structured for future DB replacement) ─── */

const MOCK_WEATHER = {
  morning: { temperature: 12, condition: 'Ciel dégagé', high: 16, low: 8, icon: 'sun' },
  day:     { temperature: 18, condition: 'Partiellement nuageux', high: 21, low: 13, icon: 'cloud-sun' },
  evening: { temperature: 15, condition: 'Nuageux', high: 19, low: 11, icon: 'cloud' },
  night:   { temperature: 9, condition: 'Ciel clair', high: 14, low: 7, icon: 'moon' },
} as const;

const MOCK_MESSAGES: Record<TimePhase, string[]> = {
  morning: [
    'Bonne journée ! Pensez à prendre un manteau, il fait frais ce matin.',
    'Le soleil est de retour aujourd\'hui. Profitez-en pour une balade !',
    'Pluie prévue cet après-midi, prenez votre parapluie.',
  ],
  day: [
    '3 courses en attente sur votre liste. Pensez au marché si vous passez près.',
    'Vous avez 2 messages non lus de la part de Marie.',
    'Température agréable dehors. Les fenêtres sont ouvertes automatiquement.',
  ],
  evening: [
    'Recette du soir suggérée : Risotto aux champignons (25 min).',
    'Soirée cinéma ? "Les Misérables" commence à 20h30 sur Canal+.',
    'Un invité a effectué un check-in. Consultez le guide local.',
  ],
  night: [
    'Toutes les portes sont verrouillées. Alarme armée. Bonne nuit.',
    'Météo demain : 14°C, ensoleillé. Réveil prévu à 7h30.',
    'Maison en mode veille. Capteurs de mouvement actifs.',
  ],
};

const MOCK_ACTIONS: Record<TimePhase, TabletContext['action']> = {
  morning: {
    label: 'Voir la météo détaillée',
    type: 'info',
    payload: 'weather',
  },
  day: {
    label: 'Voir les courses',
    type: 'grocery',
    payload: 'groceries',
  },
  evening: {
    label: 'Lancer l\'ambiance cinéma',
    type: 'ambiance',
    payload: 'cinema',
  },
  night: {
    label: 'Vérifier la sécurité',
    type: 'security',
    payload: 'security',
  },
};

const MOCK_EVENTS: Record<TimePhase, TabletContext['nextEvent'] | null> = {
  morning: { title: 'Réunion visio — Équipe', time: '10:00' },
  day:     { title: 'Rendez-vous dentiste', time: '14:30' },
  evening: { title: 'Dîner avec les Dupont', time: '20:00' },
  night:   null,
};

const MOCK_HOUSEHOLD_STATUS: TabletContext['householdStatus'] = {
  doors: 'locked',
  windows: 'closed',
  alarm: 'disarmed',
};

const MOCK_EXTRAS: Record<TimePhase, string[]> = {
  morning: [
    'Trafic A86 : fluide (12 min)',
    'Bus 42 : prochain à 7h42',
    'Qualité air : Bonne (AQI 32)',
  ],
  day: [
    'Humidité : 58%',
    'Messages urgents : 1',
    'Consommation élec : normal',
  ],
  evening: [
    'Invités enregistrés : 2',
    'Playlist "Soirée" prête',
    'Thermostat : 21°C (confort)',
  ],
  night: [
    'Porte d\'entrée : verrouillée',
    'Volets salon : fermés',
    'Capteur garage : OK',
  ],
};

/* ─── Fallback context (returned when no auth) ─── */

const FALLBACK_CONTEXT: TabletContext = {
  phase: 'day',
  weather: { temperature: 16, condition: 'N/A', high: 20, low: 12, icon: 'cloud' },
  message: 'Données momentanément indisponibles.',
  action: { label: 'Rafraîchir', type: 'info', payload: 'refresh' },
  nextEvent: null,
  householdStatus: { doors: 'locked', windows: 'closed', alarm: 'disarmed' },
  extra: [],
};

/* ─── Helper ─── */

function detectPhase(): TimePhase {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const t = hour * 100 + minute;

  if (t >= 600 && t < 930) return 'morning';
  if (t >= 930 && t < 1800) return 'day';
  if (t >= 1800 && t < 2230) return 'evening';
  return 'night';
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ─── Server Action ─── */

export async function getTabletContext(_householdId: string): Promise<TabletContext | null> {
  try {
    const auth = await getAuthUser();
    if (!auth?.householdId) return null;

    // If we reach here, user is authenticated.
    // householdId comes from auth token, ignoring the parameter.
    // (In future, replace mocks with DB queries using auth.householdId.)

    const phase = detectPhase();

    return {
      phase,
      weather: { ...MOCK_WEATHER[phase] },
      message: pickRandom(MOCK_MESSAGES[phase]),
      action: { ...MOCK_ACTIONS[phase] },
      nextEvent: MOCK_EVENTS[phase],
      householdStatus: { ...MOCK_HOUSEHOLD_STATUS },
      extra: [...MOCK_EXTRAS[phase]],
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      console.error('[getTabletContext] Unauthorized — returning fallback data');
      return FALLBACK_CONTEXT;
    }
    // Silent fallback — always returns valid data
    return FALLBACK_CONTEXT;
  }
}
