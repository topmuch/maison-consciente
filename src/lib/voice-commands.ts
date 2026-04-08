/* ═══════════════════════════════════════════════════════
   VOICE COMMANDS — Local STT + Command Router

   Wrapper around Web Speech API (SpeechRecognition) with:
   - State management: idle → listening → processing → error
   - End-of-sentence detection (onspeechend, 5s timeout)
   - Command router with regex-based matching
   - Fallback to text input for unrecognized commands
   - Graceful browser support detection

   100% LOCAL — no external API calls.

   Usage:
     import { createVoiceCommandEngine } from '@/lib/voice-commands';
     const engine = createVoiceCommandEngine({ onCommand: (cmd) => handleAction(cmd) });
     engine.startListening();
   ═══════════════════════════════════════════════════════ */

/* ─── Types ─── */

// SpeechRecognition API type definitions (not yet in all TypeScript libs)
type ISpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

export type VoiceEngineState = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceCommandResult {
  matched: boolean;
  action: string;
  payload: string;
  rawTranscript: string;
}

export interface VoiceCommandHandler {
  (result: VoiceCommandResult): void;
}

export interface VoiceErrorHandler {
  (error: string): void;
}

export interface VoiceTranscriptHandler {
  (transcript: string, isFinal: boolean): void;
}

export interface VoiceStateChangeHandler {
  (state: VoiceEngineState): void;
}

interface VoiceCommandEngineConfig {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  silenceTimeoutMs?: number;
  onCommand?: VoiceCommandHandler;
  onError?: VoiceErrorHandler;
  onTranscript?: VoiceTranscriptHandler;
  onStateChange?: VoiceStateChangeHandler;
}

/* ─── Command Definitions ─── */

interface CommandPattern {
  pattern: RegExp;
  action: string;
  extractPayload: (match: RegExpMatchArray, fullText: string) => string;
}

const BUILT_IN_COMMANDS: CommandPattern[] = [
  // Grocery commands
  {
    pattern: /(?:ajoute|ajouter)\s+(?:au?\s+)?(?:la\s+)?(?:liste\s+(?:des\s+)?)?(?:courses?\s+)?(.+)/i,
    action: 'grocery:add',
    extractPayload: (match) => match[1]?.trim() || '',
  },
  {
    pattern: /(?:retire|supprime|enlève)\s+(?:de\s+)?(?:la\s+)?(?:liste\s+)?(.+)/i,
    action: 'grocery:remove',
    extractPayload: (match) => match[1]?.trim() || '',
  },

  // Weather
  {
    pattern: /(?:météo|température|temps\s+(?:qu'il\s+)?fait|il\s+fait)/i,
    action: 'weather:show',
    extractPayload: () => '',
  },

  // Time-based modes
  {
    pattern: /mode\s+(nuit|soir|sommeil)/i,
    action: 'mode:night',
    extractPayload: () => '',
  },
  {
    pattern: /mode\s+(matin|jour|réveil)/i,
    action: 'mode:morning',
    extractPayload: () => '',
  },
  {
    pattern: /mode\s+(invité|visiteur)/i,
    action: 'mode:guest',
    extractPayload: () => '',
  },
  {
    pattern: /mode\s+(famille|normal)/i,
    action: 'mode:family',
    extractPayload: () => '',
  },

  // Stop commands
  {
    pattern: /(?:stop|tais[- ]?toi|silence|chut|tais toi)/i,
    action: 'system:stop',
    extractPayload: () => '',
  },
  {
    pattern: /(?:arrête|pause)/i,
    action: 'system:stop',
    extractPayload: () => '',
  },

  // Refresh
  {
    pattern: /(?:rafraîchir|actualiser|recharger|mets?\s+à\s+jour)/i,
    action: 'system:refresh',
    extractPayload: () => '',
  },

  // Message commands
  {
    pattern: /(?:message|dis\s+que|écris)\s+(.+)/i,
    action: 'message:add',
    extractPayload: (match) => match[1]?.trim() || '',
  },

  // Help
  {
    pattern: /(?:aide|help|que\s+(?:peux[- ]?tu|sais[- ]?tu)\s+faire|commandes?)/i,
    action: 'system:help',
    extractPayload: () => '',
  },
];

export function checkSTTSupport(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return 'SpeechRecognition' in w || 'webkitSpeechRecognition' in w;
}

/** Create a SpeechRecognition instance with vendor prefix */
function createRecognition(): ISpeechRecognition | null {
  if (typeof window === 'undefined') return null;

  const win = window as unknown as {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  };

  const SR = win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SR) return null;

  return new SR();
}

/* ═══════════════════════════════════════════════════════
   VoiceCommandEngine Class
   ═══════════════════════════════════════════════════════ */

export class VoiceCommandEngine {
  private recognition: ISpeechRecognition | null = null;
  private state: VoiceEngineState = 'idle';
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private isDestroyed = false;

  private config: Required<Pick<VoiceCommandEngineConfig, 'lang' | 'continuous' | 'interimResults' | 'maxAlternatives' | 'silenceTimeoutMs'>> & VoiceCommandEngineConfig;
  private commands: CommandPattern[];

  constructor(config: VoiceCommandEngineConfig = {}) {
    this.config = {
      lang: config.lang || 'fr-FR',
      continuous: config.continuous ?? false,
      interimResults: config.interimResults ?? false,
      maxAlternatives: config.maxAlternatives ?? 1,
      silenceTimeoutMs: config.silenceTimeoutMs || 5000,
      onCommand: config.onCommand,
      onError: config.onError,
      onTranscript: config.onTranscript,
      onStateChange: config.onStateChange,
    };
    this.commands = [...BUILT_IN_COMMANDS];
  }

  /* ─── Getters ─── */

  get currentState(): VoiceEngineState {
    return this.state;
  }

  get isListening(): boolean {
    return this.state === 'listening';
  }

  get isSupported(): boolean {
    return checkSTTSupport();
  }

  /* ─── State Management ─── */

  private setState(newState: VoiceEngineState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.config.onStateChange?.(newState);
  }

  /* ─── Command Routing ─── */

  /** Add a custom command pattern */
  addCommand(pattern: RegExp, action: string, extractPayload?: (match: RegExpMatchArray, fullText: string) => string): void {
    this.commands.push({
      pattern,
      action,
      extractPayload: extractPayload || (() => ''),
    });
  }

  /** Remove commands by action name */
  removeCommandsByAction(action: string): void {
    this.commands = this.commands.filter(c => c.action !== action);
  }

  /** Reset to built-in commands only */
  resetCommands(): void {
    this.commands = [...BUILT_IN_COMMANDS];
  }

  /** Route a transcript through the command patterns */
  routeCommand(transcript: string): VoiceCommandResult {
    const trimmed = transcript.trim().toLowerCase();

    for (const cmd of this.commands) {
      const match = trimmed.match(cmd.pattern);
      if (match) {
        return {
          matched: true,
          action: cmd.action,
          payload: cmd.extractPayload(match, transcript),
          rawTranscript: transcript,
        };
      }
    }

    return {
      matched: false,
      action: 'unrecognized',
      payload: trimmed,
      rawTranscript: transcript,
    };
  }

  /* ─── Silence Timer ─── */

  private resetSilenceTimer(): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      if (this.state === 'listening') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Voice Commands] Silence timeout — stopping');
        }
        this.stopListening();
      }
    }, this.config.silenceTimeoutMs);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /* ─── Listening ─── */

  /** Start listening for voice commands */
  startListening(): boolean {
    if (this.isDestroyed) return false;

    if (!this.isSupported) {
      const msg = 'Reconnaissance vocale non disponible sur ce navigateur';
      this.config.onError?.(msg);
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Voice Commands]', msg);
      }
      return false;
    }

    // If already listening, restart
    if (this.isListening && this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }

    const recognition = createRecognition();
    if (!recognition) {
      this.config.onError?.('Impossible de créer le moteur de reconnaissance');
      return false;
    }

    this.recognition = recognition;
    recognition.lang = this.config.lang!;
    recognition.continuous = this.config.continuous!;
    recognition.interimResults = this.config.interimResults!;
    recognition.maxAlternatives = this.config.maxAlternatives!;

    recognition.onstart = () => {
      this.setState('listening');
      this.resetSilenceTimer();
    };

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      // Reset silence timer on any result
      this.resetSilenceTimer();

      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;

      // Notify transcript handler
      this.config.onTranscript?.(transcript, isFinal);

      if (isFinal) {
        this.setState('processing');

        // Route the command
        const cmdResult = this.routeCommand(transcript);
        this.config.onCommand?.(cmdResult);

        // Auto-stop after processing (single-shot mode)
        if (!this.config.continuous) {
          this.clearSilenceTimer();
        }
      }
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        // These are normal — user cancelled or no speech detected
        this.setState('idle');
        this.clearSilenceTimer();
        return;
      }

      if (event.error === 'not-allowed') {
        this.config.onError?.('Microphone non autorisé. Vérifiez les permissions.');
        this.setState('error');
      } else if (event.error === 'network') {
        this.config.onError?.('Erreur réseau. La reconnaissance vocale nécessite une connexion.');
        this.setState('error');
      } else if (event.error === 'service-not-allowed') {
        this.config.onError?.('Service de reconnaissance vocale non disponible.');
        this.setState('error');
      } else {
        this.config.onError?.(`Erreur de reconnaissance: ${event.error}`);
        this.setState('error');
      }

      this.clearSilenceTimer();
    };

    recognition.onend = () => {
      // If we're still in listening state and continuous, restart
      if (this.config.continuous && this.state === 'listening' && !this.isDestroyed) {
        try {
          recognition.start();
        } catch {
          this.setState('idle');
        }
      } else {
        this.setState('idle');
        this.clearSilenceTimer();
      }
    };

    try {
      recognition.start();
      return true;
    } catch (err) {
      this.config.onError?.('Impossible de démarrer la reconnaissance vocale');
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Voice Commands] Start failed:', err);
      }
      this.setState('idle');
      return false;
    }
  }

  /** Stop listening */
  stopListening(): void {
    this.clearSilenceTimer();
    if (this.recognition) {
      try {
        this.recognition.abort(); // Use abort for immediate stop
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    this.setState('idle');
  }

  /** Toggle listening state */
  toggleListening(): boolean {
    if (this.isListening) {
      this.stopListening();
      return false;
    } else {
      return this.startListening();
    }
  }

  /* ─── Lifecycle ─── */

  /** Clean up. Call on unmount. */
  destroy(): void {
    this.isDestroyed = true;
    this.stopListening();
    this.config.onCommand = undefined;
    this.config.onError = undefined;
    this.config.onTranscript = undefined;
    this.config.onStateChange = undefined;
  }
}

/* ─── Help Text ─── */

export const VOICE_COMMANDS_HELP: string[] = [
  '"Ajoute [article]" — Ajouter aux courses',
  '"Météo" — Afficher la météo',
  '"Mode nuit" / "Mode matin" — Changer de mode',
  '"Mode invité" / "Mode famille" — Basculer la confidentialité',
  '"Message [texte]" — Envoyer un message',
  '"Rafraîchir" — Actualiser les données',
  '"Stop" / "Silence" — Arrêter la synthèse vocale',
  '"Aide" — Liste des commandes disponibles',
];
