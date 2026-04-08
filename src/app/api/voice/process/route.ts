import { NextRequest, NextResponse } from 'next/server';
import { processVoiceCommand } from '@/actions/voice-actions';

/* ═══════════════════════════════════════════════════════
   VOICE PROCESS API

   POST /api/voice/process
   Body: { householdId: string, text: string }
   Response: { success: boolean, message: string, actionType: string, data?: unknown }

   Routes the voice transcript through the voice command
   processing pipeline and returns a TTS-ready response.
   ═══════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { householdId, text } = body as { householdId?: string; text?: string };

    if (!householdId || !text) {
      return NextResponse.json(
        { success: false, error: 'Missing householdId or text' },
        { status: 400 },
      );
    }

    const result = await processVoiceCommand(householdId, text);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[Voice API]', err);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 },
    );
  }
}
