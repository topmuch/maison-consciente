import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const MAELLIS_SYSTEM_PROMPT = `Tu es Maellis, l'assistant intelligent de Maison Consciente.
Tu es poli, chaleureux et professionnel.
Tu parles toujours en français.
Tu aides les utilisateurs avec leur maison intelligente, leurs recettes, leurs courses, la santé, et le bien-être familial.
Tu es concis mais chaleureux dans tes réponses.
Réponds en maximum 2 phrases courtes.`;

/* ─── ASR: Audio → Text ─── */
async function transcribeAudio(base64Audio: string): Promise<string> {
  const zai = await ZAI.create();
  const response = await zai.audio.asr.create({ file_base64: base64Audio });
  return response.text;
}

/* ─── LLM: Text → Response ─── */
async function generateResponse(userText: string, history: Array<{ role: string; content: string }>): Promise<string> {
  const zai = await ZAI.create();

  const messages: Array<{ role: string; content: string }> = [
    { role: 'assistant', content: MAELLIS_SYSTEM_PROMPT },
    ...history.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userText },
  ];

  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  });

  const text = completion.choices?.[0]?.message?.content;
  if (!text || text.trim().length === 0) {
    throw new Error('Réponse vide du modèle');
  }
  return text.trim();
}

/* ─── TTS: Text → Audio ─── */
async function synthesizeSpeech(text: string, voice = 'jam'): Promise<Buffer> {
  const zai = await ZAI.create();

  const chunks = splitTextIntoChunks(text, 900);

  if (chunks.length === 1) {
    const response = await zai.audio.tts.create({
      input: chunks[0],
      voice,
      speed: 1.0,
      response_format: 'wav',
      stream: false,
    });
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(new Uint8Array(arrayBuffer));
  }

  const audioBuffers: Buffer[] = [];
  for (const chunk of chunks) {
    const response = await zai.audio.tts.create({
      input: chunk,
      voice,
      speed: 1.0,
      response_format: 'wav',
      stream: false,
    });
    const arrayBuffer = await response.arrayBuffer();
    audioBuffers.push(Buffer.from(new Uint8Array(arrayBuffer)));
  }

  // Concatenate WAV: use first header, merge PCM data
  const header = Buffer.from(audioBuffers[0].slice(0, 44));
  const pcmData = Buffer.concat([
    audioBuffers[0].slice(44),
    ...audioBuffers.slice(1).map(b => b.slice(44)),
  ]);

  const totalDataSize = pcmData.length;
  header.writeUInt32LE(totalDataSize + 36, 4);
  header.writeUInt32LE(totalDataSize, 40);

  return Buffer.concat([header, pcmData]);
}

function splitTextIntoChunks(text: string, maxLength = 900): string[] {
  if (text.length <= maxLength) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length <= maxLength) {
      current += s;
    } else {
      if (current) chunks.push(current.trim());
      current = s;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

/* ═══════════════════════════════════════════════════════
   POST /api/demo/voice
   
   Body: { audio: string (base64), history?: Array<{role, content}> }
   Returns: { success: true, transcript: string, text: string, audio: string (base64) }
   ═══════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const { audio, history = [] } = await request.json();

    if (!audio || typeof audio !== 'string') {
      return NextResponse.json(
        { error: 'Audio requis (base64)' },
        { status: 400 }
      );
    }

    // Step 1: ASR
    console.log('[Demo Voice] Step 1: Transcribing audio...');
    const userText = await transcribeAudio(audio);
    console.log('[Demo Voice] Transcribed:', userText);

    if (!userText || userText.trim().length === 0) {
      return NextResponse.json({
        success: true,
        transcript: '',
        text: '',
        audio: null,
        message: "Je n'ai pas entendu. Réessayez.",
      });
    }

    // Step 2: LLM
    console.log('[Demo Voice] Step 2: Generating response...');
    const responseText = await generateResponse(userText, history);
    console.log('[Demo Voice] Response:', responseText);

    // Step 3: TTS
    console.log('[Demo Voice] Step 3: Synthesizing speech...');
    const audioBuffer = await synthesizeSpeech(responseText, 'jam');
    const audioBase64 = audioBuffer.toString('base64');

    console.log('[Demo Voice] Complete. Audio size:', audioBuffer.length, 'bytes');

    return NextResponse.json({
      success: true,
      transcript: userText,
      text: responseText,
      audio: audioBase64,
    });
  } catch (error) {
    console.error('[Demo Voice] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur interne';

    return NextResponse.json({
      success: false,
      error: message,
      text: "Désolé, une erreur est survenue. Réessayez.",
    }, { status: 500 });
  }
}
