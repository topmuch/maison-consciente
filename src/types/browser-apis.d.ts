/* ═══════════════════════════════════════════════════════
   Type augmentations for browser APIs not in TS lib
   ═══════════════════════════════════════════════════════ */

// NDEFReader (Web NFC API)
interface NDEFReader extends EventTarget {
  onreading: ((this: NDEFReader, ev: NDEFReadingEvent) => void) | null;
  onerror: ((this: NDEFReader, ev: Event) => void) | null;
  scan(options?: { signal?: AbortSignal }): Promise<void>;
}

interface NDEFReadingEvent extends Event {
  readonly message: NDEFMessage;
  readonly serialNumber: string;
}

interface NDEFMessage {
  readonly records: NDEFRecord[];
}

interface NDEFRecord {
  readonly recordType: string;
  readonly mediaType: string;
  readonly id: string;
  readonly data: DataView;
  toText(): string | undefined;
}

/* ─── Web Speech API ─── */

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare let SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
  OneSignal?: OneSignal[] | OneSignal;
}

/* ─── OneSignal Web SDK ─── */

interface OneSignal {
  push(fn: () => void): void;
  init(options: {
    appId: string;
    notifyButton?: { enable: boolean };
    serviceWorkerParam?: { scope: string };
    serviceWorkerPath?: string;
    allowLocalhostAsSecureOrigin?: boolean;
  }): void;
  isPushNotificationsEnabled(): Promise<boolean>;
  getNotificationPermission(): Promise<NotificationPermission>;
  registerForPushNotifications(): Promise<void>;
  getUserId(): Promise<string | null>;
  setExternalId(id: string): Promise<void>;
  deleteExternalId(): Promise<void>;
  setSubscription(enabled: boolean): Promise<void>;
  on(event: string, listener: (...args: unknown[]) => void): void;
}
