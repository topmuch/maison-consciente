/* ═══════════════════════════════════════════════════════
   TTS API ROUTE — Proxy for Qwen TTS (server-side)

   POST /api/tts
   Body: { text: string, emotion?: string, speed?: number, context?: string }
   Response: { audio: string (base64), format: string, charCount: number }

   Falls back to error if DashScope API key is not configured.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateQwenVoice,
  getEmotionFromContext,
  getAudioMimeType,
  isQwenTTSAvailable,
} from '@/lib/qwen-tts';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!isQwenTTSAvailable()) {
      return NextResponse.json(
        {
          error: 'TTS non configuré',
          message: 'DASHSCOPE_API_KEY manquante. Configurez-la dans .env.local',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { text, emotion, speed, context } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Texte manquant' },
        { status: 400 }
      );
    }

    // Limit text length to prevent abuse
    const trimmedText = text.trim().slice(0, 2000);

    // Determine emotion: explicit > context-based > neutral
    const resolvedEmotion = emotion || getEmotionFromContext(context || 'neutral');

    const result = await generateQwenVoice(trimmedText, {
      emotion: resolvedEmotion,
      speed: speed || 1.0,
      format: 'mp3',
    });

    return NextResponse.json({
      audio: result.audioBase64,
      format: result.format,
      mimeType: getAudioMimeType(result.format),
      charCount: result.charCount,
      emotion: resolvedEmotion,
    });
  } catch (error) {
    console.error('[TTS API] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json(
      { error: 'Erreur TTS', message },
      { status: 500 }
    );
  }
}

/** GET /api/tts — Health check */
export async function GET() {
  return NextResponse.json({
    available: isQwenTTSAvailable(),
    provider: 'qwen3-tts-flash',
    message: isQwenTTSAvailable()
      ? 'Qwen TTS is ready'
      : 'DASHSCOPE_API_KEY not configured',
  });
}
