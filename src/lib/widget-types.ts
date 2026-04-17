/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Widget Types Definition

   Defines all widget types, configuration interfaces,
   and default widget setup for the dynamic tablet dashboard.
   ═══════════════════════════════════════════════════════ */

export type WidgetType =
  | 'clock'           // Header clock/greeting/date
  | 'weather'         // Weather display
  | 'calendar'        // Next upcoming bookings
  | 'family-status'   // Family member statuses (home/away/offline)
  | 'safe-arrival'    // Safe arrival alerts
  | 'news'            // News ticker
  | 'quick-actions'   // 2x3 action grid (actualités, recette, etc.)
  | 'voice'           // HybridVoiceControl
  | 'messages'        // Family messages wall
  | 'emergency'       // SOS emergency button
  | 'contextual'      // ContextualWidget (phase-aware info)

export interface WidgetConfig {
  id: string
  type: WidgetType
  enabled: boolean
  order: number
  title: string       // Display name
  size: 'sm' | 'md' | 'lg' | 'full'
  config: Record<string, unknown>  // Widget-specific settings
}

export interface WidgetMeta {
  type: WidgetType
  label: string
  description: string
  icon: string       // Emoji for dashboard config page
  defaultSize: 'sm' | 'md' | 'lg' | 'full'
  removable: boolean // Cannot be removed if false
}

export const WIDGET_META: Record<WidgetType, WidgetMeta> = {
  clock: {
    type: 'clock',
    label: 'Horloge & Accueil',
    description: 'Heure, date, message d\'accueil et nom du foyer',
    icon: '🕐',
    defaultSize: 'full',
    removable: false,
  },
  weather: {
    type: 'weather',
    label: 'Météo',
    description: 'Température et conditions météorologiques actuelles',
    icon: '⛅',
    defaultSize: 'sm',
    removable: true,
  },
  calendar: {
    type: 'calendar',
    label: 'Prochains Événements',
    description: 'Prochains rendez-vous et réservations synchronisées',
    icon: '📅',
    defaultSize: 'md',
    removable: true,
  },
  'family-status': {
    type: 'family-status',
    label: 'Statut Famille',
    description: 'Statut des membres de la famille (maison/absent/hors ligne)',
    icon: '👨‍👩‍👧‍👦',
    defaultSize: 'md',
    removable: true,
  },
  'safe-arrival': {
    type: 'safe-arrival',
    label: 'Safe Arrival',
    description: 'Suivi des retours à la maison avec alertes',
    icon: '🛡️',
    defaultSize: 'sm',
    removable: true,
  },
  news: {
    type: 'news',
    label: 'Actualités',
    description: 'Titres de l\'actualité avec défilement automatique',
    icon: '📰',
    defaultSize: 'md',
    removable: true,
  },
  'quick-actions': {
    type: 'quick-actions',
    label: 'Accès Rapide',
    description: 'Grille d\'actions rapides (recette, horoscope, blague...)',
    icon: '⚡',
    defaultSize: 'lg',
    removable: true,
  },
  voice: {
    type: 'voice',
    label: 'Commande Vocale',
    description: 'Assistant vocal Maellis pour contrôler la maison',
    icon: '🎤',
    defaultSize: 'lg',
    removable: true,
  },
  messages: {
    type: 'messages',
    label: 'Messages Famille',
    description: 'Derniers messages et notes partagées par la famille',
    icon: '💬',
    defaultSize: 'md',
    removable: true,
  },
  emergency: {
    type: 'emergency',
    label: 'Urgence',
    description: 'Bouton SOS avec alerte WhatsApp et secours',
    icon: '🚨',
    defaultSize: 'sm',
    removable: true,
  },
  contextual: {
    type: 'contextual',
    label: 'Infos Contextuelles',
    description: 'Informations intelligentes adaptées au moment de la journée',
    icon: '✨',
    defaultSize: 'md',
    removable: true,
  },
}

/** Default widgets with predefined order */
export const DEFAULT_WIDGETS: Omit<WidgetConfig, 'id'>[] = [
  { type: 'clock', enabled: true, order: 0, title: 'Horloge & Accueil', size: 'full', config: {} },
  { type: 'weather', enabled: true, order: 1, title: 'Météo', size: 'sm', config: {} },
  { type: 'calendar', enabled: true, order: 2, title: 'Prochains Événements', size: 'md', config: {} },
  { type: 'family-status', enabled: true, order: 3, title: 'Statut Famille', size: 'md', config: {} },
  { type: 'safe-arrival', enabled: true, order: 4, title: 'Safe Arrival', size: 'sm', config: {} },
  { type: 'news', enabled: true, order: 5, title: 'Actualités', size: 'md', config: {} },
  { type: 'quick-actions', enabled: true, order: 6, title: 'Accès Rapide', size: 'lg', config: {} },
  { type: 'voice', enabled: true, order: 7, title: 'Commande Vocale', size: 'lg', config: {} },
  { type: 'contextual', enabled: true, order: 8, title: 'Infos Contextuelles', size: 'md', config: {} },
  { type: 'messages', enabled: true, order: 9, title: 'Messages Famille', size: 'md', config: {} },
  { type: 'emergency', enabled: true, order: 10, title: 'Urgence', size: 'sm', config: {} },
]

/** Create a full WidgetConfig with generated ID from defaults */
export function createDefaultWidgets(): WidgetConfig[] {
  return DEFAULT_WIDGETS.map((w) => ({
    ...w,
    id: `widget-${w.type}-${crypto.randomUUID().slice(0, 8)}`,
  }))
}

/** Get only enabled widgets sorted by order */
export function getEnabledWidgets(widgets: WidgetConfig[]): WidgetConfig[] {
  return widgets
    .filter((w) => w.enabled)
    .sort((a, b) => a.order - b.order)
}
