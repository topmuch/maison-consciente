// ═══════════════════════════════════════════════════════════════
// MAISON CONSCIENTE — Notification Configuration
// Complete type definitions, constants & message templates
// ═══════════════════════════════════════════════════════════════

/* ── Notification Type Union ── */
export type NotificationType =
  | 'morning'
  | 'meal'
  | 'evening'
  | 'night'
  | 'anniversary'
  | 'rainAlert'
  | 'extremeTemp'
  | 'severeAlert'
  | 'sunEvents'
  | 'reminder15min'
  | 'immediate'
  | 'travelPrep'
  | 'checkout'
  | 'holiday'
  | 'doorWindow'
  | 'autoArm'
  | 'deviceBattery'
  | 'leak'
  | 'stockLow'
  | 'deals'
  | 'autoReorder'
  | 'routineStart'
  | 'phaseChange'
  | 'sleepMode'
  | 'medication'
  | 'emergency'
  | 'airQuality'
  | 'welcome'
  | 'checkoutReminder'
  | 'localTip'
  | 'supportAlert'
  | 'updateDone'
  | 'lowBattery'
  | 'connectivity'
  | 'dailyTip'
  | 'quote'
  | 'wellnessChallenge';

/* ── Category ── */
export type NotificationCategory =
  | 'temporal'
  | 'weather'
  | 'calendar'
  | 'homeSecurity'
  | 'inventory'
  | 'ambiance'
  | 'health'
  | 'hospitality'
  | 'system'
  | 'engagement';

/* ── Priority ── */
export type NotificationPriority = 'emergency' | 'high' | 'normal' | 'low';

/* ── Nested preference toggles per category ── */
export interface TemporalPrefs {
  morning: boolean;
  meal: boolean;
  evening: boolean;
  night: boolean;
  anniversary: boolean;
}

export interface WeatherPrefs {
  rainAlert: boolean;
  extremeTemp: boolean;
  severeAlert: boolean;
  sunEvents: boolean;
}

export interface CalendarPrefs {
  reminder15min: boolean;
  immediate: boolean;
  travelPrep: boolean;
  checkout: boolean;
  holiday: boolean;
}

export interface HomeSecurityPrefs {
  doorWindow: boolean;
  autoArm: boolean;
  deviceBattery: boolean;
  leak: boolean;
}

export interface InventoryPrefs {
  stockLow: boolean;
  deals: boolean;
  autoReorder: boolean;
}

export interface AmbiancePrefs {
  routineStart: boolean;
  phaseChange: boolean;
  sleepMode: boolean;
}

export interface HealthPrefs {
  medication: boolean;
  emergency: boolean;
  airQuality: boolean;
}

export interface HospitalityPrefs {
  welcome: boolean;
  checkoutReminder: boolean;
  localTip: boolean;
  supportAlert: boolean;
}

export interface SystemPrefs {
  updateDone: boolean;
  lowBattery: boolean;
  connectivity: boolean;
}

export interface EngagementPrefs {
  dailyTip: boolean;
  quote: boolean;
  wellnessChallenge: boolean;
}

export interface QuietHoursConfig {
  start: number; // 0-23
  end: number;   // 0-23
  enabled: boolean;
}

/* ── Complete Notification Preferences ── */
export interface NotificationPrefs {
  temporal: TemporalPrefs;
  weather: WeatherPrefs;
  calendar: CalendarPrefs;
  homeSecurity: HomeSecurityPrefs;
  inventory: InventoryPrefs;
  ambiance: AmbiancePrefs;
  health: HealthPrefs;
  hospitality: HospitalityPrefs;
  system: SystemPrefs;
  engagement: EngagementPrefs;
  quietHours: QuietHoursConfig;
  maxPerHour: number;
  minIntervalMin: number;
  skipIfActiveMin: number;
}

/* ── Trigger payload for template variables ── */
export type TriggerPayload = Record<string, string | number | boolean | null>;

/* ── Queued notification in the notification log ── */
export interface QueuedNotification {
  id: string;
  type: NotificationType;
  message: string;
  priority: NotificationPriority;
  data: TriggerPayload;
  createdAt: string; // ISO
  consumed: boolean;
  consumedAt: string | null;
}

/* ── Log entry stored in household settings ── */
export interface NotificationLogEntry {
  type: NotificationType;
  message: string;
  priority: NotificationPriority;
  createdAt: string; // ISO
  consumed: boolean;
  consumedAt: string | null;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

/** Maps each category to its notification types */
export const NOTIFICATION_CATEGORIES: Record<NotificationCategory, readonly NotificationType[]> = {
  temporal: ['morning', 'meal', 'evening', 'night', 'anniversary'],
  weather: ['rainAlert', 'extremeTemp', 'severeAlert', 'sunEvents'],
  calendar: ['reminder15min', 'immediate', 'travelPrep', 'checkout', 'holiday'],
  homeSecurity: ['doorWindow', 'autoArm', 'deviceBattery', 'leak'],
  inventory: ['stockLow', 'deals', 'autoReorder'],
  ambiance: ['routineStart', 'phaseChange', 'sleepMode'],
  health: ['medication', 'emergency', 'airQuality'],
  hospitality: ['welcome', 'checkoutReminder', 'localTip', 'supportAlert'],
  system: ['updateDone', 'lowBattery', 'connectivity'],
  engagement: ['dailyTip', 'quote', 'wellnessChallenge'],
};

/* ── Template definition ── */
interface NotificationTemplate {
  template: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  description: string;
}

/** Random tip pool for dailyTip */
const DAILY_TIPS: readonly string[] = [
  'Le saviez-vous ? Les abeilles dansent pour communiquer la localisation des fleurs à leurs congénères.',
  'Astuce du jour : ouvrir les fenêtres 10 minutes le matin renouvelle 90 % de l\'air intérieur.',
  'Le saviez-vous ? Un robinet qui goutte peut gaspiller jusqu\'à 15 litres d\'eau par jour.',
  'Conseil bien-être : marcher 30 minutes par jour réduit le stress et améliore le sommeil.',
  'Le saviez-vous ? Les plantes d\'intérieur peuvent réduire la fatigue de 25 % dans un bureau.',
  'Astuce éco : baisser le chauffage d\'un seul degré fait économiser 7 % sur la facture annuelle.',
];

/** Random quote pool for quote */
const FRENCH_QUOTES: readonly { text: string; author: string }[] = [
  { text: 'La vie est un mystère qu\'il faut vivre, et non un problème à résoudre.', author: 'Gandhi' },
  { text: 'Le bonheur est parfois caché dans une inconnue.', author: 'Baudelaire' },
  { text: 'Il faut oser pour pouvoir. Peut-être avez-vous raison, je n\'ai pas le choix.', author: 'Victor Hugo' },
  { text: 'La simplicité est la sophistication suprême.', author: 'Léonard de Vinci' },
  { text: 'Chaque matin nous naissons à nouveau. Ce que nous faisons aujourd\'hui est ce qui compte le plus.', author: 'Bouddha' },
];

/* ── Main template map ── */
export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  // ── Temporal ──
  morning: {
    template: 'Bonjour ! Il est {time}. {greeting}',
    priority: 'normal',
    category: 'temporal',
    description: 'Message de bienveillance le matin (7h-9h)',
  },
  meal: {
    template: 'C\'est l\'heure de {mealType} ! {mealSuggestion}',
    priority: 'normal',
    category: 'temporal',
    description: 'Rappel de repas (midi ou soir)',
  },
  evening: {
    template: 'Bonsoir ! Il est {time}. {date_summary}',
    priority: 'normal',
    category: 'temporal',
    description: 'Message de bonne soirée (18h-20h)',
  },
  night: {
    template: 'Bonne nuit ! Il est {time}. Pensez à verrouiller les portes et baisser le chauffage.',
    priority: 'low',
    category: 'temporal',
    description: 'Rappel nocturne (22h-23h)',
  },
  anniversary: {
    template: 'Joyeux anniversaire {name} !',
    priority: 'high',
    category: 'temporal',
    description: 'Souhait d\'anniversaire',
  },

  // ── Weather ──
  rainAlert: {
    template: 'Attention, pluie prévue dans {minutes} minutes. Pensez à prendre un parapluie.',
    priority: 'high',
    category: 'weather',
    description: 'Alerte pluie imminente',
  },
  extremeTemp: {
    template: 'Alerte température : {temp}°C. {advice}',
    priority: 'high',
    category: 'weather',
    description: 'Alerte chaleur ou grand froid',
  },
  severeAlert: {
    template: 'Alerte météo sévère : {alertDescription}. Restez en sécurité.',
    priority: 'emergency',
    category: 'weather',
    description: 'Alerte météo grave (tempête, etc.)',
  },
  sunEvents: {
    template: '{event} : le soleil se {action} à {time}.',
    priority: 'low',
    category: 'weather',
    description: 'Lever/coucher du soleil',
  },

  // ── Calendar ──
  reminder15min: {
    template: 'Rappel dans 15 minutes : {eventTitle}.',
    priority: 'high',
    category: 'calendar',
    description: 'Rappel 15 min avant un événement',
  },
  immediate: {
    template: 'Maintenant : {eventTitle}.',
    priority: 'high',
    category: 'calendar',
    description: 'Rappel immédiat pour événement en cours',
  },
  travelPrep: {
    template: 'Préparez votre départ pour {destination} à {departureTime}.',
    priority: 'high',
    category: 'calendar',
    description: 'Préparation voyage imminente',
  },
  checkout: {
    template: 'Rappel : votre départ est prévu à {checkoutTime}.',
    priority: 'high',
    category: 'calendar',
    description: 'Rappel de check-out hôtelier',
  },
  holiday: {
    template: 'Aujourd\'hui est {holidayName}. {holidayWish}',
    priority: 'normal',
    category: 'calendar',
    description: 'Jour férié ou événement spécial',
  },

  // ── Home Security ──
  doorWindow: {
    template: 'Porte ouverte détectée : {location} à {time}.',
    priority: 'high',
    category: 'homeSecurity',
    description: 'Ouverture de porte/fenêtre détectée',
  },
  autoArm: {
    template: 'Mode sécurité activé automatiquement à {time}.',
    priority: 'normal',
    category: 'homeSecurity',
    description: 'Activation auto de la sécurité',
  },
  deviceBattery: {
    template: 'Batterie faible sur le capteur {deviceName} ({batteryLevel}%).',
    priority: 'normal',
    category: 'homeSecurity',
    description: 'Batterie faible d\'un capteur',
  },
  leak: {
    template: 'Fuite d\'eau détectée : {location}. Vérifiez immédiatement.',
    priority: 'emergency',
    category: 'homeSecurity',
    description: 'Détection de fuite d\'eau',
  },

  // ── Inventory ──
  stockLow: {
    template: 'Votre stock de {item} est bas. Pensez à racheter.',
    priority: 'normal',
    category: 'inventory',
    description: 'Stock bas sur un produit',
  },
  deals: {
    template: 'Bonne affaire détectée : {dealDescription}.',
    priority: 'low',
    category: 'inventory',
    description: 'Promotion sur un produit récurrent',
  },
  autoReorder: {
    template: 'Commande automatique passée pour {item}. Livraison prévue sous {deliveryDays} jours.',
    priority: 'normal',
    category: 'inventory',
    description: 'Réapprovisionnement automatique',
  },

  // ── Ambiance ──
  routineStart: {
    template: 'Routine {routineName} démarrée. Profitez de ce moment !',
    priority: 'low',
    category: 'ambiance',
    description: 'Début d\'une routine d\'ambiance',
  },
  phaseChange: {
    template: 'Changement de phase : {phaseName}. {phaseDescription}',
    priority: 'normal',
    category: 'ambiance',
    description: 'Transition automatique d\'ambiance',
  },
  sleepMode: {
    template: 'Mode sommeil activé. Bonne nuit !',
    priority: 'low',
    category: 'ambiance',
    description: 'Activation du mode nuit',
  },

  // ── Health ──
  medication: {
    template: 'Rappel médicament : {medicationName} à prendre maintenant.',
    priority: 'high',
    category: 'health',
    description: 'Rappel de prise de médicament',
  },
  emergency: {
    template: 'Alerte urgence : {emergencyDescription}. Contactez les secours si nécessaire.',
    priority: 'emergency',
    category: 'health',
    description: 'Alerte médicale ou urgence',
  },
  airQuality: {
    template: 'Qualité de l\'air : {aqiLevel}. {airAdvice}',
    priority: 'normal',
    category: 'health',
    description: 'Information qualité de l\'air',
  },

  // ── Hospitality ──
  welcome: {
    template: 'Bienvenue {guestName} ! Nous sommes ravis de vous accueillir.',
    priority: 'normal',
    category: 'hospitality',
    description: 'Message de bienvenue invité',
  },
  checkoutReminder: {
    template: 'Rappel : votre départ est prévu à {checkoutTime}.',
    priority: 'high',
    category: 'hospitality',
    description: 'Rappel de check-out',
  },
  localTip: {
    template: 'Conseil local : {tipText}',
    priority: 'low',
    category: 'hospitality',
    description: 'Conseil découverte locale',
  },
  supportAlert: {
    template: 'Nouveau message de support : {supportSummary}.',
    priority: 'high',
    category: 'hospitality',
    description: 'Nouveau ticket support reçu',
  },

  // ── System ──
  updateDone: {
    template: 'Mise à jour système terminée. Version {version}.',
    priority: 'low',
    category: 'system',
    description: 'Fin de mise à jour système',
  },
  lowBattery: {
    template: 'Batterie tablette faible : {batteryLevel}%. Branchez le chargeur.',
    priority: 'high',
    category: 'system',
    description: 'Batterie faible de la tablette',
  },
  connectivity: {
    template: 'Connexion {status} : {detail}.',
    priority: 'high',
    category: 'system',
    description: 'Changement de statut réseau',
  },

  // ── Engagement ──
  dailyTip: {
    template: '__DAILY_TIP__',
    priority: 'low',
    category: 'engagement',
    description: 'Astuce ou fait amusant quotidien',
  },
  quote: {
    template: '__QUOTE__',
    priority: 'low',
    category: 'engagement',
    description: 'Citation inspirante quotidienne',
  },
  wellnessChallenge: {
    template: 'Défi bien-être du jour : {challengeDescription}',
    priority: 'low',
    category: 'engagement',
    description: 'Défi santé/bien-être quotidien',
  },
};

/* ── Tip & Quote accessors ── */
export function getRandomDailyTip(): string {
  return DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)];
}

export function getRandomQuote(): { text: string; author: string } {
  return FRENCH_QUOTES[Math.floor(Math.random() * FRENCH_QUOTES.length)];
}

/* ═══════════════════════════════════════════════════════════════
   DEFAULT PREFERENCES
   ═══════════════════════════════════════════════════════════════ */

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  temporal: {
    morning: true,
    meal: true,
    evening: true,
    night: true,
    anniversary: true,
  },
  weather: {
    rainAlert: true,
    extremeTemp: true,
    severeAlert: false,
    sunEvents: false,
  },
  calendar: {
    reminder15min: true,
    immediate: true,
    travelPrep: true,
    checkout: true,
    holiday: true,
  },
  homeSecurity: {
    doorWindow: false,
    autoArm: false,
    deviceBattery: false,
    leak: false,
  },
  inventory: {
    stockLow: false,
    deals: false,
    autoReorder: false,
  },
  ambiance: {
    routineStart: true,
    phaseChange: true,
    sleepMode: true,
  },
  health: {
    medication: false,
    emergency: true,
    airQuality: false,
  },
  hospitality: {
    welcome: true,
    checkoutReminder: true,
    localTip: true,
    supportAlert: true,
  },
  system: {
    updateDone: true,
    lowBattery: true,
    connectivity: true,
  },
  engagement: {
    dailyTip: false,
    quote: false,
    wellnessChallenge: false,
  },
  quietHours: {
    start: 22,
    end: 7,
    enabled: true,
  },
  maxPerHour: 3,
  minIntervalMin: 15,
  skipIfActiveMin: 2,
};
