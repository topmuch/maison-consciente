'use client';

/* ═══════════════════════════════════════════════════════
   useVoiceCommand — Enhanced Wake-Word Voice Hook

   State machine:
     idle → listening → waiting_command → processing
     processing → conversation_window → listening (cycle)

   Two-phase recognition:
   1. Continuous background listening for wake word
   2. Single-utterance capture for command (more reliable)

   After TTS response completes, enters conversation_window
   (10s default) to listen for follow-up questions. Context
   from the previous command is maintained for follow-up
   resolution ("Et après-demain ?" references previous query).

   Integrates TTS via useVoiceResponse for unified speak/mute.
   Dispatches server commands via executeVoiceCommand action.

   100% local STT + TTS — no external API calls.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useCallback } from 'react';
import { parseVoiceCommand, type VoiceCommand, type VoiceIntent } from '@/lib/voice-command-router';
import { executeVoiceCommand, type VoiceActionResult } from '@/actions/voice-actions';
import { useVoiceResponse } from '@/hooks/useVoiceResponse';
import { triggerHaptic } from '@/lib/haptic';

/* ── TTS Speak Wrapper with Callbacks ── */

interface SpeakCallbacks {
  onEnd?: () => void;
  onError?: () => void;
}

/**
 * Wraps useVoiceResponse.speak() (which takes only text) to support
 * onEnd / onError callbacks via the SpeechSynthesis API.
 */
function ttsSpeakWithCallbacks(
  text: string,
  callbacks: SpeakCallbacks,
  speakFn: (text: string) => void,
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    callbacks.onError?.();
    return;
  }

  // Cancel any pending speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';

  // Try to find a French voice
  const voices = window.speechSynthesis.getVoices();
  const frenchVoice = voices.find((v) => v.lang.startsWith('fr'));
  if (frenchVoice) utterance.voice = frenchVoice;

  utterance.onend = () => {
    callbacks.onEnd?.();
  };

  utterance.onerror = () => {
    callbacks.onError?.();
  };

  window.speechSynthesis.speak(utterance);

  // Also call the hook's speak fn for state tracking (isSpeaking etc.)
  speakFn(text);
}

/* ── Exported Types ── */

export type VoiceCommandState =
  | 'idle'
  | 'listening'
  | 'waiting_command'
  | 'processing'
  | 'conversation_window';

export interface VoiceCommandContext {
  lastIntent: VoiceIntent | null;
  lastParams: Record<string, string>;
  lastDisplayText: string;
}

interface UseVoiceCommandOptions {
  enabled?: boolean;
  displayToken?: string;
  householdId?: string;
  onCommandResult?: (result: VoiceActionResult) => void;
  /** Command capture window in ms after wake word (default 7000) */
  commandWindowMs?: number;
  /** Conversation follow-up window in ms after TTS response (default 10000) */
  conversationWindowMs?: number;
}

interface UseVoiceCommandReturn {
  state: VoiceCommandState;
  transcript: string;
  lastResponse: string;
  lastIntent: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  isSpeaking: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  error: string | null;
  fetchWeather: () => Promise<OpenMeteoWeather | null>;
}

/* ── SpeechRecognition Types (not in all TS libs) ── */

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  item(index: number): SpeechRecognitionResultLike;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternativeLike;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorLike extends Event {
  readonly error: string;
}

/* ── Weather Types ── */

interface OpenMeteoWeather {
  temperature_2m: number;
  weather_code: number;
  wind_speed_10m: number;
  relative_humidity_2m: number;
}

/* ── Constants ── */

const DEFAULT_WAKE_WORDS = ['maison', 'hey maison', 'ok maison'];
const DEFAULT_COMMAND_WINDOW_MS = 7000;
const DEFAULT_CONVERSATION_WINDOW_MS = 10000;

/* ── WMO Weather Code → French Description ── */

function weatherCodeToDesc(code: number): string {
  if (code <= 1) return 'ciel dégagé';
  if (code <= 3) return code === 2 ? 'quelques nuages' : 'ciel couvert';
  if (code <= 48) return 'du brouillard';
  if (code <= 57) return 'de la bruine';
  if (code <= 67) return code <= 61 ? 'une pluie légère' : 'de la pluie';
  if (code <= 77) return 'de la neige';
  if (code <= 82) return 'des averses';
  if (code >= 95) return 'un orage';
  return 'des conditions variables';
}

/* ── Browser Detection ── */

function createRecognition(lang = 'fr-FR'): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = lang;
  return rec;
}

function checkSupport(): boolean {
  return createRecognition() !== null;
}

/* ── Voice Log Helper (best-effort) ── */

async function logVoiceCommand(
  displayToken: string | undefined,
  householdId: string | undefined,
  transcript: string,
  intent: string,
  response: string,
  success: boolean,
): Promise<void> {
  if (!displayToken && !householdId) return;
  try {
    await fetch('/api/voice/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayToken: displayToken ?? null,
        householdId: householdId ?? null,
        transcript,
        intent,
        response,
        success,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      /* Silent — logging is best-effort */
    });
  } catch {
    /* Silent */
  }
}

/* ═══════════════════════════════════════════════════════
   HOOK
   ═══════════════════════════════════════════════════════ */

export function useVoiceCommand(options: UseVoiceCommandOptions): UseVoiceCommandReturn {
  const {
    enabled = true,
    displayToken,
    householdId,
    onCommandResult,
    commandWindowMs = DEFAULT_COMMAND_WINDOW_MS,
    conversationWindowMs = DEFAULT_CONVERSATION_WINDOW_MS,
  } = options;

  /* ── State ── */
  const [state, setState] = useState<VoiceCommandState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(checkSupport);

  /* ── TTS Integration ── */
  const { speak: ttsSpeak, isSpeaking, isMuted, toggleMute } = useVoiceResponse();

  /* ── Refs (avoid stale closures) ── */
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const commandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextRef = useRef<VoiceCommandContext>({
    lastIntent: null,
    lastParams: {},
    lastDisplayText: '',
  });
  const onCommandResultRef = useRef(onCommandResult);
  const enabledRef = useRef(enabled);
  const displayTokenRef = useRef(displayToken);
  const householdIdRef = useRef(householdId);
  const stateRef = useRef<VoiceCommandState>('idle');
  const isMutedRef = useRef(isMuted);
  const mountedRef = useRef(true);
  // Refs to break circular deps
  const startListeningRef = useRef<() => void>(() => {});
  const processCommandRef = useRef<(cmd: VoiceCommand) => void>(() => {});

  /* ── Keep refs fresh ── */
  useEffect(() => { onCommandResultRef.current = onCommandResult; }, [onCommandResult]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { displayTokenRef.current = displayToken; }, [displayToken]);
  useEffect(() => { householdIdRef.current = householdId; }, [householdId]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  /* ── Clear all timers ── */
  const clearAllTimers = useCallback(() => {
    if (commandTimerRef.current) {
      clearTimeout(commandTimerRef.current);
      commandTimerRef.current = null;
    }
    if (conversationTimerRef.current) {
      clearTimeout(conversationTimerRef.current);
      conversationTimerRef.current = null;
    }
    if (restartDelayRef.current) {
      clearTimeout(restartDelayRef.current);
      restartDelayRef.current = null;
    }
  }, []);

  /* ── Destroy recognition instance ── */
  const destroyRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
  }, []);

  /* ── Full stop ── */
  const stopListening = useCallback(() => {
    clearAllTimers();
    destroyRecognition();
    if (mountedRef.current) {
      setState('idle');
    }
  }, [clearAllTimers, destroyRecognition]);

  /* ── Schedule restart of background listening ── */
  const scheduleRestart = useCallback((delayMs = 500) => {
    if (restartDelayRef.current) {
      clearTimeout(restartDelayRef.current);
    }
    restartDelayRef.current = setTimeout(() => {
      restartDelayRef.current = null;
      if (mountedRef.current && enabledRef.current && !isMutedRef.current) {
        startListeningRef.current();
      }
    }, delayMs);
  }, []);

  /* ── Enter conversation window after TTS ends ── */
  const enterConversationWindow = useCallback(() => {
    if (!mountedRef.current || !enabledRef.current) {
      if (mountedRef.current) setState('idle');
      return;
    }

    // Skip conversation window if muted
    if (isMutedRef.current) {
      setState('idle');
      scheduleRestart(500);
      return;
    }

    setState('conversation_window');

    // Start listening for follow-up (single utterance)
    const rec = createRecognition('fr-FR');
    if (!rec) {
      setState('idle');
      scheduleRestart(500);
      return;
    }

    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEventLike) => {
      const result = event.results[event.results.length - 1];
      if (!result || !result.isFinal) return;

      const text = result[0].transcript.trim();
      if (!text) return;

      setTranscript(text);

      // Parse the follow-up command
      const cmd = parseVoiceCommand(text);

      if (cmd.intent !== 'unknown') {
        // Follow-up with recognized intent
        triggerHaptic('success');
        destroyRecognition();
        clearAllTimers();
        // Use ref to avoid calling before declaration
        const frameId = requestAnimationFrame(() => {
          cancelAnimationFrame(frameId);
          processCommandRef.current(cmd);
        });
      } else if ((cmd.displayText ?? '').length > 0) {
        // Unknown text — try to resolve with previous context
        const ctx = contextRef.current;
        if (
          ctx.lastIntent &&
          ctx.lastIntent !== 'system_help' &&
          ctx.lastIntent !== 'system_stop' &&
          ctx.lastIntent !== 'unknown'
        ) {
          // Re-execute previous intent with follow-up context
          triggerHaptic('success');
          destroyRecognition();
          clearAllTimers();
          const frameId = requestAnimationFrame(() => {
            cancelAnimationFrame(frameId);
            processCommandRef.current({
              ...cmd,
              intent: ctx.lastIntent!,
              confidence: 0.5,
              entities: { ...ctx.lastParams, followUp: text },
              displayText: `${ctx.lastDisplayText} (${text})`,
            });
          });
        } else {
          // No context to resolve
          destroyRecognition();
          clearAllTimers();
          ttsSpeakWithCallbacks('Je n\'ai pas compris. Dites Maison puis votre commande.', {
            onEnd: () => {
              if (mountedRef.current) {
                setState('idle');
                scheduleRestart(500);
              }
            },
            onError: () => {
              if (mountedRef.current) {
                setState('idle');
                scheduleRestart(500);
              }
            },
          }, ttsSpeak);
        }
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorLike) => {
      const err = event.error;
      if (err !== 'aborted' && err !== 'no-speech') {
        // Silently handle
      }
    };

    rec.onend = () => {
      recognitionRef.current = null;
      // Timeout or no speech — back to idle → listening
      if (mountedRef.current && stateRef.current === 'conversation_window') {
        setState('idle');
        scheduleRestart(500);
      }
    };

    try {
      rec.start();
    } catch {
      setState('idle');
      scheduleRestart(500);
    }

    // Conversation window timeout
    conversationTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      // onend will transition to idle and restart
    }, conversationWindowMs);
  }, [conversationWindowMs, destroyRecognition, clearAllTimers, ttsSpeak, scheduleRestart]);

  /* ── Speak with conversation window callback ── */
  const speakWithCallback = useCallback(
    (text: string) => {
      if (!text.trim()) {
        // No TTS needed — skip to conversation window
        const delay = setTimeout(() => {
          enterConversationWindow();
        }, 300);
        restartDelayRef.current = delay;
        return;
      }

      ttsSpeakWithCallbacks(text, {
        onEnd: () => {
          if (!mountedRef.current) return;
          enterConversationWindow();
        },
        onError: () => {
          if (!mountedRef.current) return;
          enterConversationWindow();
        },
      }, ttsSpeak);
    },
    [ttsSpeak, enterConversationWindow],
  );

  /* ── Client-side weather fetch ── */
  const fetchWeather = useCallback(async (): Promise<OpenMeteoWeather | null> => {
    try {
      // Try to get coordinates from household settings
      const settingsRes = await fetch('/api/household/settings');
      if (!settingsRes.ok) return null;
      const settingsJson = await settingsRes.json();
      const coords = settingsJson.settings?.coordinates;
      if (!coords?.lat || !coords?.lon) return null;

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const data = await res.json() as { current?: OpenMeteoWeather };
      return data.current ?? null;
    } catch {
      return null;
    }
  }, []);

  /* ── Weather fetch handler (speaks result) ── */
  const handleWeatherFetch = useCallback(() => {
    const doFetch = async () => {
      const weather = await fetchWeather();
      if (!mountedRef.current) return;

      if (!weather) {
        speakWithCallback('Météo indisponible. Vérifiez la configuration de la localisation.');
        return;
      }

      const temp = Math.round(weather.temperature_2m);
      const desc = weatherCodeToDesc(weather.weather_code);
      const wind = Math.round(weather.wind_speed_10m);
      const humidity = weather.relative_humidity_2m;
      speakWithCallback(`Il fait actuellement ${temp} degrés avec ${desc}. Vent à ${wind} kilomètres heure. Humidité ${humidity} pourcent.`);
    };

    if (isMutedRef.current) {
      // Skip pre-fetch TTS when muted
      doFetch();
      return;
    }

    ttsSpeakWithCallbacks('Je regarde la météo...', {
      onEnd: () => { doFetch(); },
      onError: () => { doFetch(); },
    }, ttsSpeak);
  }, [fetchWeather, ttsSpeak, speakWithCallback]);

  /* ── Signal interception — intercept server signals before speaking ── */
  const handleCommandResult = useCallback(
    (result: VoiceActionResult) => {
      if (!result.success) {
        speakWithCallback(result.message);
        return;
      }

      const signal = result.message;
      const data: Record<string, any> = result.data ?? {};

      switch (signal) {
        case 'audio_play': {
          const action = String(data.action ?? 'play_default');
          const genre = String(data.genre ?? '');
          speakWithCallback(action === 'play_default' ? 'Je lance la musique.' : `Je lance ${genre || 'la musique'}.`);
          window.dispatchEvent(new CustomEvent('voice:audio', { detail: data }));
          break;
        }
        case 'volume_change': {
          const direction = String(data.direction ?? '');
          speakWithCallback(
            direction === 'up' ? 'Volume augmenté.' : direction === 'down' ? 'Volume baissé.' : 'Son coupé.',
          );
          window.dispatchEvent(new CustomEvent('voice:volume', { detail: data }));
          break;
        }
        case 'playback_change': {
          const playMessages: Record<string, string> = {
            pause: 'Musique en pause.',
            play: 'Reprise de la lecture.',
            next: 'Piste suivante.',
            previous: 'Piste précédente.',
            stop: 'Musique arrêtée.',
          };
          const actionKey = String(data.action ?? '');
          speakWithCallback(playMessages[actionKey] ?? 'C\'est fait.');
          window.dispatchEvent(new CustomEvent('voice:playback', { detail: data }));
          break;
        }
        case 'mood_scene': {
          const scene = String(data.scene ?? 'activée');
          speakWithCallback(`Ambiance ${scene} lancée.`);
          window.dispatchEvent(new CustomEvent('voice:mood', { detail: data }));
          break;
        }
        case 'now_playing_query':
          speakWithCallback('Aucune musique en cours de lecture.');
          break;
        case 'speech_rate_change':
          window.dispatchEvent(new CustomEvent('voice:rate', { detail: data }));
          speakWithCallback('Vitesse vocale ajustée.');
          break;
        case 'weather_fetch':
          handleWeatherFetch();
          return;
        default:
          speakWithCallback(result.message);
      }
    },
    [speakWithCallback, handleWeatherFetch],
  );

  /* ── Process a parsed command ── */
  const processCommand = useCallback(
    (cmd: VoiceCommand) => {
      if (!mountedRef.current) return;

      setState('processing');
      setLastIntent(cmd.intent);
      setError(null);

      // Update context for follow-up questions
      contextRef.current = {
        lastIntent: cmd.intent,
        lastParams: cmd.entities,
        lastDisplayText: cmd.displayText ?? '',
      };

      // Handle system_stop immediately — no TTS
      if (cmd.intent === 'system_stop') {
        setLastResponse('');
        clearAllTimers();
        destroyRecognition();
        setState('idle');
        onCommandResultRef.current?.({ success: true, message: '' });
        scheduleRestart(500);
        return;
      }

      const token = displayTokenRef.current;
      const hhId = householdIdRef.current;

      const execute = async () => {
        try {
          let result: VoiceActionResult;

          if (token) {
            // Tablet mode: execute via server action
            result = await executeVoiceCommand(token, cmd.intent, cmd.entities);
          } else {
            // Dashboard mode: just return parsed info for consumer
            result = {
              success: true,
              message: `Commande: ${cmd.displayText ?? ''} (intent: ${cmd.intent})`,
            };
          }

          if (!mountedRef.current) return;

          setLastResponse(result.message);

          // Log the voice command (best-effort)
          logVoiceCommand(token, hhId, cmd.originalText ?? '', cmd.intent, result.message, result.success);

          // Notify consumer
          onCommandResultRef.current?.(result);

          // Handle signal interception or speak response
          handleCommandResult(result);
        } catch (err) {
          if (!mountedRef.current) return;

          const errorMessage =
            err instanceof Error ? err.message : 'Erreur lors de l\'exécution';
          setLastResponse(errorMessage);
          setError(errorMessage);
          onCommandResultRef.current?.({ success: false, message: errorMessage });
          speakWithCallback('Je n\'ai pas pu exécuter cette commande. Veuillez réessayer.');
        }
      };

      execute();
    },
    [clearAllTimers, destroyRecognition, speakWithCallback, handleCommandResult, scheduleRestart],
  );

  /* ── Start command capture (non-continuous, single utterance) ── */
  const startCommandCapture = useCallback(() => {
    if (!isSupported || !mountedRef.current) return;

    destroyRecognition();

    const rec = createRecognition('fr-FR');
    if (!rec) {
      setState('idle');
      scheduleRestart(300);
      return;
    }

    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEventLike) => {
      const result = event.results[event.results.length - 1];
      if (!result || !result.isFinal) return;

      const text = result[0].transcript.trim();
      if (!text) return;

      setTranscript(text);

      // Strip wake word if present in the command utterance
      const cleanedText = text.replace(/^(hey|ok|dis\s+)?\s*maison[,\s]+/i, '').trim();

      if (!cleanedText) {
        // Just the wake word, no command — continue waiting
        return;
      }

      // Parse the command
      const cmd = parseVoiceCommand(cleanedText);

      if (cmd.intent !== 'unknown') {
        triggerHaptic('success');
        clearAllTimers();
        destroyRecognition();
        processCommand(cmd);
      } else {
        // Unknown command — speak error and restart
        triggerHaptic('error');
        clearAllTimers();
        destroyRecognition();
        ttsSpeakWithCallbacks('Je n\'ai pas compris. Dites Maison puis votre commande.', {
          onEnd: () => {
            if (mountedRef.current) {
              setState('idle');
              scheduleRestart(500);
            }
          },
          onError: () => {
            if (mountedRef.current) {
              setState('idle');
              scheduleRestart(500);
            }
          },
        }, ttsSpeak);
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorLike) => {
      const err = event.error;
      if (err === 'no-speech') {
        // Command timeout — handled by timer or onend
        return;
      }
      if (err === 'aborted') {
        return;
      }
      if (err === 'not-allowed') {
        if (mountedRef.current) {
          setError('Microphone non autorisé. Veuillez autoriser l\'accès au micro.');
          setState('idle');
        }
        return;
      }
      // Other errors — silent recover
    };

    rec.onend = () => {
      recognitionRef.current = null;
      // If still in waiting_command, restart background listening
      if (mountedRef.current && stateRef.current === 'waiting_command') {
        clearAllTimers();
        setState('idle');
        scheduleRestart(300);
      }
    };

    try {
      rec.start();
    } catch {
      setState('idle');
      scheduleRestart(300);
    }

    // Command capture timeout
    commandTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      // onend will handle transition back to idle → listening
    }, commandWindowMs);
  }, [isSupported, destroyRecognition, clearAllTimers, processCommand, ttsSpeak, commandWindowMs, scheduleRestart]);

  /* ── Start background listening (continuous, wake word detection) ── */
  const startListening = useCallback(() => {
    if (!isSupported || !enabledRef.current || !mountedRef.current) return;
    // Don't start if TTS is currently speaking
    if (isSpeaking) return;

    destroyRecognition();
    clearAllTimers();

    const rec = createRecognition('fr-FR');
    if (!rec) {
      setState('idle');
      return;
    }

    recognitionRef.current = rec;
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      if (mountedRef.current) {
        setState('listening');
        setError(null);
      }
    };

    rec.onresult = (event: SpeechRecognitionEventLike) => {
      const result = event.results[event.results.length - 1];
      if (!result || !result.isFinal) return;

      const text = result[0].transcript.trim();
      if (!text) return;

      const lowerText = text.toLowerCase();

      // Check for wake word
      const wakeWordDetected = DEFAULT_WAKE_WORDS.some((w) => lowerText.includes(w));

      if (wakeWordDetected) {
        triggerHaptic('medium');
        if (mountedRef.current) {
          setState('waiting_command');
          setTranscript(text);
        }

        // Stop continuous listening and switch to command capture
        clearAllTimers();
        try {
          rec.stop();
        } catch {
          /* ignore */
        }

        // Start command capture in next frame (after onend fires)
        const frameId = requestAnimationFrame(() => {
          cancelAnimationFrame(frameId);
          startCommandCapture();
        });
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorLike) => {
      const err = event.error;

      if (err === 'aborted' || err === 'no-speech') {
        // Normal — auto-restart via onend
        return;
      }

      if (err === 'not-allowed') {
        if (mountedRef.current) {
          setError('Microphone non autorisé. Veuillez autoriser l\'accès au micro.');
          setState('idle');
        }
        return;
      }

      // Other errors — auto-restart after delay
      if (mountedRef.current) {
        setError(null);
      }
    };

    rec.onend = () => {
      // Auto-restart if still enabled and in listening state
      if (mountedRef.current && enabledRef.current && stateRef.current === 'listening') {
        try {
          recognitionRef.current = null;
          const newRec = createRecognition('fr-FR');
          if (newRec) {
            recognitionRef.current = newRec;
            newRec.continuous = true;
            newRec.interimResults = false;
            newRec.maxAlternatives = 1;
            newRec.onstart = rec.onstart;
            newRec.onresult = rec.onresult;
            newRec.onerror = rec.onerror;
            newRec.onend = rec.onend;
            newRec.start();
          } else {
            setState('idle');
          }
        } catch {
          setState('idle');
        }
      } else if (mountedRef.current) {
        recognitionRef.current = null;
      }
    };

    try {
      rec.start();
    } catch {
      setState('idle');
    }
  }, [isSupported, isSpeaking, destroyRecognition, clearAllTimers, startCommandCapture]);

  /* ── Keep function refs fresh for circular dep resolution ── */
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);
  useEffect(() => {
    processCommandRef.current = processCommand;
  }, [processCommand]);

  /* ── Public speak (delegates to TTS) ── */
  const speak = useCallback(
    (text: string) => {
      ttsSpeak(text);
    },
    [ttsSpeak],
  );

  /* ── Lifecycle: start/stop based on enabled ── */
  useEffect(() => {
    mountedRef.current = true;

    if (enabled && isSupported) {
      // Defer start to next frame to avoid setState during render
      const frameId = requestAnimationFrame(() => {
        cancelAnimationFrame(frameId);
        if (enabledRef.current && isSupported) {
          startListening();
        }
      });
    } else {
      // Defer stop to avoid setState in effect body
      const frameId = requestAnimationFrame(() => {
        cancelAnimationFrame(frameId);
        stopListening();
      });
    }

    return () => {
      mountedRef.current = false;
      clearAllTimers();
      destroyRecognition();
    };
  }, [enabled, isSupported]);

  /* ── Lifecycle: restart when TTS ends and we're idle ── */
  useEffect(() => {
    if (!isSpeaking && state === 'idle' && enabled && isSupported) {
      const delay = setTimeout(() => {
        if (
          !isSpeaking &&
          enabledRef.current &&
          mountedRef.current &&
          stateRef.current === 'idle' &&
          !recognitionRef.current
        ) {
          startListening();
        }
      }, 300);
      return () => clearTimeout(delay);
    }
  }, [isSpeaking, state, enabled, isSupported, startListening]);

  return {
    state,
    transcript,
    lastResponse,
    lastIntent,
    isSupported,
    startListening,
    stopListening,
    speak,
    isSpeaking,
    isMuted,
    toggleMute,
    error,
    fetchWeather,
  };
}
