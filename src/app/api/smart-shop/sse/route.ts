import { getSession } from '@/core/auth/lucia';
import { sseManager } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { session, user } = await getSession();
    if (!session || !user?.householdId) {
      return new Response('Non authentifié', { status: 401 });
    }

    const connectionId = crypto.randomUUID();
    if (!sseManager) {
      return new Response('SSE non disponible', { status: 503 });
    }
    const stream = sseManager.createStream(connectionId, user.householdId as string);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return new Response('Erreur', { status: 500 });
  }
}
