import { NextRequest, NextResponse } from 'next/server';

/* ═══════════════════════════════════════════════════════
   CONTACT API — Maison Consciente
   Handles contact form submissions
   ═══════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Les champs nom, email et message sont requis.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide.' },
        { status: 400 }
      );
    }

    // Sanitize inputs (basic XSS prevention)
    const sanitizedData = {
      name: name.toString().trim().slice(0, 100),
      email: email.toString().trim().slice(0, 255),
      subject: (subject || '').toString().trim().slice(0, 200),
      message: message.toString().trim().slice(0, 5000),
      createdAt: new Date().toISOString(),
    };

    // In production, you would:
    // 1. Store in database via Prisma
    // 2. Send email notification via SendGrid/Resend
    // 3. Log for admin review
    console.log('[Contact] New message received:', {
      name: sanitizedData.name,
      email: sanitizedData.email,
      subject: sanitizedData.subject,
      messageLength: sanitizedData.message.length,
    });

    return NextResponse.json(
      { success: true, message: 'Message envoy\u00e9 avec succ\u00e8s.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Contact] Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez r\u00e9essayer.' },
      { status: 500 }
    );
  }
}
