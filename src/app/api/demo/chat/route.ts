import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptSecret } from '@/lib/aes-crypto';

const MAELLIS_SYSTEM_PROMPT = `Tu es Maellis, l'assistant intelligent de Maison Consciente.
Tu es poli, chaleureux et professionnel.
Tu parles toujours en français.
Tu aides les utilisateurs avec leur maison intelligente, leurs recettes, leurs courses, la santé, et le bien-être familial.
Tu es concis mais chaleureux dans tes réponses.
Réponds en maximum 2 phrases.`;

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 });
    }

    // Fetch Gemini API key from database
    const config = await db.apiConfig.findUnique({
      where: { serviceKey: 'GEMINI' },
    });

    if (!config || !config.isActive) {
      return NextResponse.json({
        error: 'Service indisponible',
        response: 'Désolé, le service Maellis n\'est pas configuré. L\'administrateur doit ajouter la clé API Gemini dans le panneau admin.',
      }, { status: 503 });
    }

    const apiKey = decryptSecret(config.apiKey);
    if (!apiKey) {
      return NextResponse.json({
        error: 'Clé API invalide',
        response: 'Désolé, la clé API Gemini n\'est pas valide. Contactez l\'administrateur.',
      }, { status: 503 });
    }

    // Build conversation for Gemini REST API
    const contents = [];

    // Add history (last 6 messages for context)
    for (const msg of history.slice(-6)) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Call Gemini REST API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: MAELLIS_SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorMessage = response.status === 429
        ? 'Quota API dépassé. Vérifiez votre plan Gemini.'
        : `Erreur API Gemini (${response.status})`;

      console.error('[Demo Chat] Gemini error:', response.status, errorMessage);

      return NextResponse.json({
        error: errorMessage,
        response: `Désolé, problème technique (${errorMessage}). Vérifiez la clé API et le quota dans le panneau admin.`,
      }, { status: response.status === 429 ? 429 : 502 });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({
        error: 'Réponse vide',
        response: 'Désolé, je n\'ai pas pu générer de réponse. Réessayez.',
      }, { status: 502 });
    }

    return NextResponse.json({ success: true, response: text });
  } catch (error) {
    console.error('[Demo Chat] Error:', error);
    return NextResponse.json({
      error: 'Erreur interne',
      response: 'Désolé, une erreur technique est survenue. Réessayez.',
    }, { status: 500 });
  }
}
