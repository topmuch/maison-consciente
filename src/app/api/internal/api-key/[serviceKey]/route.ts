import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptSecret } from '@/lib/aes-crypto';

/* ═══════════════════════════════════════════════════════
   INTERNAL API — Get decrypted API key by serviceKey

   This endpoint is designed for internal mini-services
   (e.g., Gemini Voice proxy on port 3004) to retrieve
   decrypted API keys from the database.

   Security: Only accessible from localhost / internal network.
   No user session required — authenticated via internal network.
   ═══════════════════════════════════════════════════════ */

const ALLOWED_SERVICES = ['GEMINI', 'RETELL_AI', 'FOURSQUARE', 'DEEPL', 'STRIPE'] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceKey: string }> },
) {
  try {
    // ── Security: Only allow internal requests ──
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const host = request.headers.get('host') ?? '';

    // Allow requests from localhost or internal services
    const isLocalhost = forwarded === '127.0.0.1' || realIp === '127.0.0.1' || realIp === '::1';
    const isInternal = host.startsWith('localhost') || host.startsWith('127.0.0.1');

    // Also check for internal service header (set by Caddy/gateway)
    const internalHeader = request.headers.get('x-internal-service');

    if (!isLocalhost && !isInternal && internalHeader !== 'true') {
      return NextResponse.json(
        { error: 'Forbidden — internal endpoint only' },
        { status: 403 },
      );
    }

    // ── Resolve params (Next.js 16 async) ──
    const { serviceKey } = await params;
    const normalizedKey = serviceKey.toUpperCase();

    // ── Validate service key ──
    if (!ALLOWED_SERVICES.includes(normalizedKey as typeof ALLOWED_SERVICES[number])) {
      return NextResponse.json(
        { error: `Service "${serviceKey}" not allowed` },
        { status: 400 },
      );
    }

    // ── Fetch from database ──
    const config = await db.apiConfig.findUnique({
      where: { serviceKey: normalizedKey },
    });

    if (!config || !config.isActive) {
      return NextResponse.json(
        { error: `Service "${serviceKey}" not configured or inactive` },
        { status: 404 },
      );
    }

    // ── Decrypt the API key ──
    const decrypted = decryptSecret(config.apiKey);

    if (!decrypted || decrypted === config.apiKey) {
      return NextResponse.json(
        { error: 'Failed to decrypt API key' },
        { status: 500 },
      );
    }

    // ── Return the key ──
    return NextResponse.json({
      serviceKey: normalizedKey,
      apiKey: decrypted,
      isActive: config.isActive,
      baseUrl: config.baseUrl,
    });
  } catch (error) {
    console.error('[Internal API Key]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
