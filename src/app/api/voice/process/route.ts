import { NextRequest, NextResponse } from 'next/server';
import { processVoiceCommand } from '@/actions/voice-actions';
import { getAuthUser } from '@/lib/server-auth';

/* ═══════════════════════════════════════════════════════
   VOICE PROCESS API (PROTECTED)

   POST /api/voice/process
   Body: { text: string }
   Headers: Cookie with mc-session

   Requires authentication via session cookie.
   householdId is extracted from the authenticated user.
   ═══════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    // ─── Session Validation (H2) ───
    let authData;
    try {
      authData = await getAuthUser();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Session expirée — veuillez vous reconnecter' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { text } = body as { text?: string };

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Texte vocal manquant' },
        { status: 400 },
      );
    }

    // Use authenticated householdId — ignore client-supplied value
    const householdId = authData.householdId;
    const result = await processVoiceCommand(householdId, text);

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[Voice API]', err);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
