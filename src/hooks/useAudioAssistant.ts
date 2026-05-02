'use client';

/* ═══════════════════════════════════════════════════════
   useAudioAssistant — Reliable Audio Pipeline Hook

   Pipeline: Microphone → WAV → POST /api/demo/voice → ASR+LLM+TTS → Play audio

   Unlike the Gemini Live WebSocket approach, this uses a simple
   HTTP request/response pattern that's much more reliable.

   Usage:
     const audio = useAudioAssistant({ onResponse });
     <button onClick={audio.toggleRecording}>Talk</button>
   ═══════════════════════════════════════════════════════ */

import { useState, useRef, useCallback } from 'react';

export type AudioState = 'idle' | 'recording' | 'processing' | 'speaking' | 'error';

interface UseAudioAssistantOptions {
  systemPrompt?: string;
  voice?: string;
  onResponse?: (text: string) => void;
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

interface UseAudioAssistantReturn {
  state: AudioState;
  transcript: string;
  response: string;
  error: string | null;
  toggleRecording: () => Promise<void>;
  stopSpeaking: () => void;
  reset: () => void;
}

/* ─── WAV Encoding (PCM 16-bit, 16kHz, Mono) ─── */

function encodeWav(samples: Float32Array, sampleRate = 16000): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);            // fmt chunk size
  view.setUint16(20, 1, true);             // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM data
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/* ─── Audio Resampling (48kHz → 16kHz) ─── */

function downsampleBuffer(buffer: AudioBuffer, targetSampleRate = 16000): Float32Array {
  if (buffer.sampleRate === targetSampleRate) {
    return buffer.getChannelData(0);
  }
  const ratio = buffer.sampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = Math.round(i * ratio);
    result[i] = channelData[Math.min(srcIndex, channelData.length - 1)];
  }

  return result;
}

/* ─── Base64 encoder ─── */

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/* ─── Main Hook ─── */

export function useAudioAssistant({
  onResponse,
  onTranscript,
  onError,
}: UseAudioAssistantOptions = {}): UseAudioAssistantReturn {
  const [state, setState] = useState<AudioState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const historyRef = useRef<Array<{ role: string; content: string }>>([]);
  const isRecordingRef = useRef(false);

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setState(prev => (prev === 'speaking' ? 'idle' : prev));
  }, []);

  const playResponseAudio = useCallback(async (audioBase64: string) => {
    try {
      // Strip data URL prefix if present
      const base64Data = audioBase64.includes(',')
        ? audioBase64.split(',')[1]
        : audioBase64;

      const audioBlob = new Blob(
        [Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))],
        { type: 'audio/wav' }
      );
      const url = URL.createObjectURL(audioBlob);

      const audio = new Audio(url);
      currentAudioRef.current = audio;

      setState('speaking');

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          resolve();
        };
        audio.onerror = reject;
        audio.play().catch(reject);
      });

      setState('idle');
    } catch (err) {
      console.error('[useAudioAssistant] Audio playback error:', err);
      setState('idle');
    }
  }, []);

  const toggleRecording = useCallback(async () => {
    // Stop if currently recording
    if (isRecordingRef.current && mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      return;
    }

    // Stop if speaking
    if (state === 'speaking') {
      stopSpeaking();
      return;
    }

    // Reset previous state
    setTranscript('');
    setResponse('');
    setError(null);

    try {
      // Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Create AudioContext for resampling
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      const resampledChunks: Float32Array[] = [];

      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const resampled = downsampleBuffer(e.inputBuffer, 16000);
        resampledChunks.push(resampled);
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      audioChunksRef.current = [];
      isRecordingRef.current = true;
      setState('recording');

      // Wait for user to stop (mouseup/touchend triggers this function again)
      // The toggleRecording will be called again → mediaRecorderRef.current.stop()

      // Store cleanup function
      const stopRecording = async () => {
        if (!isRecordingRef.current) return;
        isRecordingRef.current = false;

        source.disconnect();
        processor.disconnect();
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        if (audioContextRef.current?.state !== 'closed') {
          audioContextRef.current?.close();
        }

        // Combine resampled chunks and encode to WAV
        const totalLength = resampledChunks.reduce((acc, c) => acc + c.length, 0);
        if (totalLength === 0) {
          setState('idle');
          setError('Audio trop court. Maintenez le bouton plus longtemps.');
          onError?.('Audio trop court');
          return;
        }

        const combined = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of resampledChunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }

        const wavBlob = encodeWav(combined, 16000);
        const base64 = await blobToBase64(wavBlob);
        const pureBase64 = base64.split(',')[1];

        // Send to API
        setState('processing');

        try {
          const res = await fetch('/api/demo/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: pureBase64,
              history: historyRef.current,
            }),
          });

          const data = await res.json();

          if (!data.success && data.error) {
            throw new Error(data.error);
          }

          if (data.transcript) {
            setTranscript(data.transcript);
            onTranscript?.(data.transcript);
          }

          if (data.message && !data.text) {
            // Empty transcription
            setResponse(data.message);
            onResponse?.(data.message);
            setState('idle');
            return;
          }

          if (data.text) {
            setResponse(data.text);
            onResponse?.(data.text);

            // Save to history
            historyRef.current.push(
              { role: 'user', content: data.transcript },
              { role: 'assistant', content: data.text },
            );
            if (historyRef.current.length > 12) {
              historyRef.current = historyRef.current.slice(-8);
            }

            // Play audio response
            if (data.audio) {
              await playResponseAudio(data.audio);
            } else {
              setState('idle');
            }
          } else {
            setState('idle');
          }
        } catch (apiErr) {
          console.error('[useAudioAssistant] API error:', apiErr);
          const msg = apiErr instanceof Error ? apiErr.message : 'Erreur API';
          setError(msg);
          onError?.(msg);
          setState('error');
        }
      };

      // Store the stop function so it can be called on next toggle
      mediaRecorderRef.current = {
        state: 'recording',
        stop: stopRecording,
      } as unknown as MediaRecorder;

    } catch (err) {
      console.error('[useAudioAssistant] Mic error:', err);
      const msg = err instanceof Error
        ? (err.name === 'NotAllowedError'
          ? 'Microphone non autorisé. Autorisez l\'accès au microphone.'
          : err.message)
        : 'Erreur microphone';
      setError(msg);
      onError?.(msg);
      setState('error');
    }
  }, [state, stopSpeaking, playResponseAudio, onResponse, onTranscript, onError]);

  const reset = useCallback(() => {
    stopSpeaking();
    setTranscript('');
    setResponse('');
    setError(null);
    setState('idle');
    historyRef.current = [];
  }, [stopSpeaking]);

  return {
    state,
    transcript,
    response,
    error,
    toggleRecording,
    stopSpeaking,
    reset,
  };
}
