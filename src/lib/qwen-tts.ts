/* ═══════════════════════════════════════════════════════
   QWEN TTS — DashScope API (Qwen3-TTS-Flash)

   Production Text-to-Speech service via Alibaba Cloud DashScope.
   Cost: ~$0.014/1k chars · Latency: ~97ms · Multilingual + Emotion.

   Usage (server-side only — API key must NOT be exposed to client):
     import { generateQwenVoice, getEmotionInstruct } from '@/lib/qwen-tts';
     const audioBase64 = await generateQwenVoice('Bienvenue !', { emotion: 'warm' });

   Environment variable required:
     DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx
   ═══════════════════════════════════════════════════════ */

// ─── Types ───

export interface QwenTTSOptions {
  /** Emotional tone: 'warm', 'urgent', 'enthusiastic', 'professional', 'calm', 'neutral' */
  emotion?: string;
  /** Voice speed: 0.5–2.0 (default 1.0) */
  speed?: number;
  /** Custom instruction override (takes precedence over emotion) */
  instruct?: string;
  /** Output audio format (default 'mp3') */
  format?: 'mp3' | 'wav' | 'pcm' | 'opus';
  /** Sample rate (default 22050) */
  sampleRate?: number;
}

export interface QwenTTSResult {
  /** Base64-encoded audio data */
  audioBase64: string;
  /** Audio format used */
  format: string;
  /** Number of characters processed */
  charCount: number;
}

// ─── Emotion ↔ Instruction Mapping ───

const EMOTION_INSTRUCTS: Record<string, string> = {
  warm: 'Sois chaleureux, doux et accueillant. Parle avec bienveillance.',
  urgent: 'Parle avec un ton très urgent et alarmant. Sois rapide et direct.',
  enthusiastic: 'Sois persuasif et enthousiaste. Montre de l\'énergie positive.',
  professional: 'Sois professionnel, dynamique et serviable. Articule clairement.',
  calm: 'Sois calme, posé et apaisant. Parle doucement.',
  neutral: 'Parle normalement, de façon claire et naturelle.',
  sos: 'Parle avec un ton très urgent et alarmant. C\'est une situation d\'urgence !',
  welcome: 'Sois chaleureux et accueillant. Accueille la personne chaleureusement.',
  upsell: 'Sois persuasif et enthousiaste. Vends les avantages avec énergie.',
};

/** Maellis context → Qwen emotion mapping */
const CONTEXT_EMOTIONS: Record<string, string> = {
  sos: 'urgent',
  alert: 'urgent',
  security: 'urgent',
  alarm: 'urgent',
  welcome: 'warm',
  home: 'warm',
  greeting: 'warm',
  comfort: 'warm',
  family: 'warm',
  health: 'warm',
  upsell: 'enthusiastic',
  service: 'enthusiastic',
  suggestion: 'enthusiastic',
  recipe: 'enthusiastic',
  checkout: 'professional',
  checkin: 'professional',
  info: 'professional',
  weather: 'calm',
  night: 'calm',
  meditation: 'calm',
  music: 'calm',
  budget: 'professional',
};

/**
 * Get the emotion instruction for a given Maellis context.
 * Falls back to 'neutral' if unknown context.
 */
export function getEmotionInstruct(context: string): string {
  const emotion = CONTEXT_EMOTIONS[context.toLowerCase()] || 'neutral';
  return EMOTION_INSTRUCTS[emotion] || EMOTION_INSTRUCTS.neutral;
}

/**
 * Get the emotion keyword from a context string.
 */
export function getEmotionFromContext(context: string): string {
  return CONTEXT_EMOTIONS[context.toLowerCase()] || 'neutral';
}

// ─── API Configuration ───

const MODEL_ID = 'qwen3-tts-flash';
const DEFAULT_FORMAT = 'mp3';
const DEFAULT_SAMPLE_RATE = 22050;

// ─── Main Function ───

/**
 * Generate audio from text using Qwen3-TTS-Flash via DashScope API.
 *
 * @param text - The text to synthesize (max ~2000 chars recommended)
 * @param options - Optional TTS parameters (emotion, speed, format, etc.)
 * @returns Base64-encoded audio data
 * @throws Error if API key is missing or request fails
 */
export async function generateQwenVoice(
  text: string,
  options: QwenTTSOptions = {}
): Promise<QwenTTSResult> {
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    throw new Error(
      'DASHSCOPE_API_KEY is not configured. ' +
      'Set it in your .env.local file: DASHSCOPE_API_KEY=sk-xxxxxxxx'
    );
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text to synthesize cannot be empty');
  }

  // Build instruction from emotion or custom instruct
  const instruct = options.instruct
    || EMOTION_INSTRUCTS[options.emotion || 'neutral']
    || EMOTION_INSTRUCTS.neutral;

  // Build the synthesis text with instruction prefix
  const synthesisText = instruct + text;

  const format = options.format || DEFAULT_FORMAT;
  const sampleRate = options.sampleRate || DEFAULT_SAMPLE_RATE;
  const speed = options.speed || 1.0;

  // DashScope API call using OpenAI-compatible endpoint
  const response = await fetch(
    'https://dashscope.aliyuncs.com/compatible-mode/v1/audio/speech',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_ID,
        input: {
          text: synthesisText,
        },
        parameters: {
          format,
          sample_rate: sampleRate,
          speed,
          // Qwen TTS native emotion control via instruction is embedded in the text
          // The instruction prefix guides the model's vocal tone
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `DashScope TTS API error (${response.status}): ${errorText}`
    );
  }

  // Response is binary audio data
  const audioBuffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');

  return {
    audioBase64,
    format,
    charCount: text.length,
  };
}

/**
 * Check if Qwen TTS is available (API key configured).
 * Can be called client-safe from server actions.
 */
export function isQwenTTSAvailable(): boolean {
  return !!process.env.DASHSCOPE_API_KEY;
}

/**
 * Get audio MIME type for a given format.
 */
export function getAudioMimeType(format: string): string {
  switch (format) {
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'pcm': return 'audio/pcm';
    case 'opus': return 'audio/opus';
    default: return 'audio/mpeg';
  }
}
