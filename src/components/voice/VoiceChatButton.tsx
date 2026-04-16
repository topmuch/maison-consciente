"use client";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — VoiceChatButton

   Bouton microphone vocal pour les invités mobiles.
   Enregistre l'audio → envoie au serveur → lit la réponse.

   Props :
     sessionId   — ID de la session invité (GuestAccess.id)
     householdId — ID du foyer
     guestName   — Nom de l'invité
   ═══════════════════════════════════════════════════════ */

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Volume2, Loader2, AlertCircle } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";

/* ─── Types ─── */

interface VoiceChatButtonProps {
  sessionId: string;
  householdId: string;
  guestName: string;
}

type VoiceState = "idle" | "connecting" | "recording" | "processing" | "responding" | "error";

interface ConversationMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

/* ─── Constantes ─── */

const MAX_RECORDING_DURATION_MS = 30_000; // 30 secondes max
const MIN_RECORDING_DURATION_MS = 300; // 300ms min pour éviter les clics
const RECORDING_TIMEOUT_CHECK_INTERVAL = 500;

/* ─── Formats audio supportés ─── */

const AUDIO_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
  "",
]; // Le dernier "" = laisser le navigateur choisir

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const mime of AUDIO_MIME_TYPES) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) return mime || "";
    } catch {
      continue;
    }
  }
  return "";
}

/* ═══════════════════════════════════════════════════════
   Composant Waveform animé
   ═══════════════════════════════════════════════════════ */

function Waveform({ active, variant }: { active: boolean; variant: "recording" | "responding" }) {
  const barCount = 5;
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div className="flex items-center justify-center gap-1.5 h-10">
      {bars.map((i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-200 ${
            variant === "recording"
              ? "bg-rose-400"
              : "bg-emerald-400"
          }`}
          style={{
            width: "4px",
            height: active ? undefined : "6px",
            animation: active
              ? `waveform-pulse ${0.6 + i * 0.15}s ease-in-out ${i * 0.1}s infinite alternate`
              : "none",
            minHeight: "6px",
            maxHeight: active ? `${20 + (i % 3) * 8}px` : "6px",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VoiceChatButton — Composant principal
   ═══════════════════════════════════════════════════════ */

export function VoiceChatButton({ sessionId, householdId, guestName }: VoiceChatButtonProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const isPressedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  /* ─── Cleanup au démontage ─── */
  useEffect(() => {
    return () => {
      stopRecordingInternal();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  /* ─── Arrêter l'enregistrement (nettoyage interne) ─── */
  const stopRecordingInternal = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Déjà arrêté
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  /* ─── Arrêter la lecture audio ─── */
  const stopPlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current = null;
    }
  }, []);

  /* ─── Envoyer l'audio au serveur ─── */
  const sendAudioToServer = useCallback(
    async (blob: Blob) => {
      setState("processing");
      setErrorMessage(null);

      try {
        const formData = new FormData();
        const fileExtension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
        const fileName = `voice-${Date.now()}.${fileExtension}`;
        formData.append("audio", blob, fileName);
        formData.append("sessionId", sessionId);
        formData.append("householdId", householdId);

        const response = await fetch("/api/guest/voice-stream", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Erreur serveur");
        }

        const responseText = data.text || "";

        // Ajouter le message utilisateur
        const userMessage: ConversationMessage = {
          role: "user",
          text: "(message vocal)",
          timestamp: Date.now(),
        };

        // Ajouter la réponse
        const assistantMessage: ConversationMessage = {
          role: "assistant",
          text: responseText,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev.slice(-8), userMessage, assistantMessage]);

        // Jouer l'audio si disponible
        if (data.audioBase64) {
          setState("responding");
          const mimeType = data.audioMimeType || "audio/wav";
          const audioDataUrl = `data:${mimeType};base64,${data.audioBase64}`;

          const audio = new Audio(audioDataUrl);
          audioElementRef.current = audio;

          audio.onended = () => {
            audioElementRef.current = null;
            setState("idle");
          };

          audio.onerror = () => {
            console.error("[VoiceChatButton] Erreur de lecture audio");
            audioElementRef.current = null;
            setState("idle");
          };

          try {
            await audio.play();
          } catch (playError) {
            // Fallback Web Speech API si la lecture échoue
            console.warn("[VoiceChatButton] Lecture audio échouée, fallback TTS navigateur");
            audioElementRef.current = null;
            if ("speechSynthesis" in window) {
              const utterance = new SpeechSynthesisUtterance(responseText);
              utterance.lang = "fr-FR";
              utterance.rate = 0.9;
              utterance.onend = () => setState("idle");
              utterance.onerror = () => setState("idle");
              window.speechSynthesis.speak(utterance);
            } else {
              setState("idle");
            }
          }
        } else {
          // Pas d'audio — utiliser Web Speech API
          if ("speechSynthesis" in window) {
            setState("responding");
            const utterance = new SpeechSynthesisUtterance(responseText);
            utterance.lang = "fr-FR";
            utterance.rate = 0.9;
            utterance.onend = () => setState("idle");
            utterance.onerror = () => setState("idle");
            window.speechSynthesis.speak(utterance);
          } else {
            setState("idle");
          }
        }
      } catch (error) {
        console.error("[VoiceChatButton] Erreur d'envoi:", error);
        const message =
          error instanceof Error ? error.message : "Erreur de connexion au serveur";
        setErrorMessage(message);
        setState("error");
        triggerHaptic("error");
      }
    },
    [sessionId, householdId]
  );

  /* ─── Démarrer l'enregistrement ─── */
  const startRecording = useCallback(async () => {
    if (state !== "idle") return;

    // Arrêter la lecture en cours
    stopPlayback();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setErrorMessage(null);
    setState("connecting");
    setMicPermissionDenied(false);

    try {
      // Demander la permission microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Vérifier qu'on a bien des pistes audio
      if (!stream.getAudioTracks().length) {
        throw new Error("Aucune piste audio disponible");
      }

      const mimeType = getSupportedMimeType();
      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) recorderOptions.mimeType = mimeType;

      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const duration = Date.now() - recordingStartRef.current;

        // Si l'enregistrement est trop court, l'ignorer
        if (duration < MIN_RECORDING_DURATION_MS) {
          console.log("[VoiceChatButton] Enregistrement trop court, ignoré");
          setState("idle");
          return;
        }

        // Créer le blob audio
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        console.log("[VoiceChatButton] Audio capturé:", blob.size, "bytes", duration, "ms");

        // Envoyer au serveur
        sendAudioToServer(blob);
      };

      recorder.onerror = (event) => {
        console.error("[VoiceChatButton] MediaRecorder erreur:", event);
        setState("error");
        setErrorMessage("Erreur lors de l'enregistrement");
      };

      // Démarrer l'enregistrement
      recorder.start(250); // Collecter les chunks toutes les 250ms
      recordingStartRef.current = Date.now();
      setState("recording");
      triggerHaptic("light");

      // Timeout auto après 30 secondes
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - recordingStartRef.current;
        if (elapsed >= MAX_RECORDING_DURATION_MS) {
          console.log("[VoiceChatButton] Timeout d'enregistrement atteint");
          stopRecordingInternal();
        }
      }, RECORDING_TIMEOUT_CHECK_INTERVAL);
    } catch (error) {
      console.error("[VoiceChatButton] Erreur d'accès au micro:", error);

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setMicPermissionDenied(true);
          setErrorMessage(
            "Accès au microphone refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur."
          );
        } else if (error.name === "NotFoundError") {
          setErrorMessage("Aucun microphone détecté sur cet appareil.");
        } else {
          setErrorMessage("Impossible d'accéder au microphone.");
        }
      } else {
        setErrorMessage("Erreur lors de l'accès au microphone.");
      }

      setState("error");
      triggerHaptic("error");
    }
  }, [state, stopPlayback, stopRecordingInternal, sendAudioToServer]);

  /* ─── Arrêter l'enregistrement (bouton relâché) ─── */
  const stopRecording = useCallback(() => {
    if (state === "recording") {
      stopRecordingInternal();
      triggerHaptic("medium");
    }
  }, [state, stopRecordingInternal]);

  /* ─── Réinitialiser l'état d'erreur ─── */
  const resetError = useCallback(() => {
    setErrorMessage(null);
    setState("idle");
    setMicPermissionDenied(false);
  }, []);

  /* ─── Classes CSS conditionnelles ─── */

  const isRecording = state === "recording";
  const isProcessing = state === "processing" || state === "connecting";
  const isResponding = state === "responding";
  const isActive = isRecording || isProcessing || isResponding;

  const buttonBgClass = isRecording
    ? "bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30"
    : isProcessing || isResponding
    ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30"
    : state === "error"
    ? "bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-500/20"
    : "bg-gradient-to-br from-blue-500 to-purple-600 shadow-blue-500/30";

  const buttonScaleClass = isRecording ? "scale-110" : isActive ? "scale-105" : "";

  const statusText = (() => {
    switch (state) {
      case "idle":
        return "Appuyez pour parler";
      case "connecting":
        return "Connexion au micro...";
      case "recording":
        return "Écoute en cours...";
      case "processing":
        return "Maellis réfléchit...";
      case "responding":
        return "Maellis répond...";
      case "error":
        return "Une erreur est survenue";
      default:
        return "";
    }
  })();

  /* ─── Rendu ─── */

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* Zone de conversation */}
      {messages.length > 0 && (
        <div className="w-full max-h-48 overflow-y-auto space-y-2 px-4 scrollbar-thin">
          {messages.map((msg, i) => (
            <div
              key={msg.timestamp}
              className={`text-sm px-4 py-2.5 rounded-2xl max-w-[85%] ${
                msg.role === "user"
                  ? "bg-blue-500/15 text-blue-200 ml-auto rounded-br-md"
                  : "bg-white/[0.06] text-slate-200 mr-auto rounded-bl-md border border-white/[0.06]"
              }`}
            >
              {msg.role === "user" ? (
                <div className="flex items-center gap-2">
                  <Mic className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="italic text-xs text-blue-300">Message vocal</span>
                </div>
              ) : (
                <p className="leading-relaxed">{msg.text}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Waveform animé */}
      {(isRecording || isResponding) && (
        <Waveform active={isRecording || isResponding} variant={isRecording ? "recording" : "responding"} />
      )}

      {/* Bouton micro principal */}
      <div className="relative">
        {/* Anneau de pulsation pendant l'enregistrement */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" style={{ margin: "-8px" }} />
        )}

        <button
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-200 select-none touch-manipulation
            ${buttonBgClass} ${buttonScaleClass}
            shadow-xl hover:shadow-2xl
            active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
            min-w-[80px] min-h-[80px]
          `}
          onPointerDown={(e) => {
            e.preventDefault();
            isPressedRef.current = true;
            if (state === "error") {
              resetError();
            } else {
              startRecording();
            }
          }}
          onPointerUp={() => {
            isPressedRef.current = false;
            stopRecording();
          }}
          onPointerLeave={() => {
            if (isPressedRef.current) {
              isPressedRef.current = false;
              stopRecording();
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          disabled={isProcessing || isResponding}
          aria-label={
            isRecording ? "Relâcher pour envoyer" : state === "error" ? "Réessayer" : "Appuyer pour parler"
          }
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : isResponding ? (
            <Volume2 className="w-8 h-8 text-white animate-pulse" />
          ) : state === "error" ? (
            <AlertCircle className="w-8 h-8 text-white" />
          ) : micPermissionDenied ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </button>
      </div>

      {/* Texte de statut */}
      <p
        className={`text-sm font-medium transition-colors duration-300 min-h-[20px] ${
          isRecording
            ? "text-rose-300"
            : isProcessing || isResponding
            ? "text-amber-300"
            : state === "error"
            ? "text-red-400"
            : "text-slate-400"
        }`}
      >
        {statusText}
      </p>

      {/* Message d'erreur */}
      {errorMessage && (
        <div className="w-full max-w-sm px-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-sm text-red-300 leading-relaxed">{errorMessage}</p>
            <button
              onClick={resetError}
              className="mt-3 text-xs text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors min-h-[44px]"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Timer d'enregistrement */}
      {isRecording && <RecordingTimer startTime={recordingStartRef.current} maxDuration={MAX_RECORDING_DURATION_MS} />}

      {/* Instructions */}
      {state === "idle" && messages.length === 0 && (
        <p className="text-xs text-slate-500 text-center px-8 leading-relaxed">
          Maintenez le bouton enfoncé pour parler.
          Relâchez pour envoyer votre message.
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Composant Timer d'enregistrement
   ═══════════════════════════════════════════════════════ */

function RecordingTimer({ startTime, maxDuration }: { startTime: number; maxDuration: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime]);

  const seconds = Math.floor(elapsed / 1000);
  const remaining = Math.max(0, Math.ceil((maxDuration - elapsed) / 1000));
  const progress = Math.min(1, elapsed / maxDuration);

  const isWarning = remaining <= 5;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className={`text-xs font-mono tabular-nums ${isWarning ? "text-rose-400 animate-pulse" : "text-slate-400"}`}>
        {seconds}s
      </span>
      {/* Barre de progression */}
      <div className="w-24 h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ${
            isWarning ? "bg-rose-500" : "bg-blue-400"
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
