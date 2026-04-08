/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Onboarding Complete API Route
   
   Completes the 3-click onboarding wizard:
   - Updates household name
   - Creates WiFi KnowledgeBaseItem entries
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOptionalAuthUser } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const auth = await getOptionalAuthUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { householdId, householdName, wifiSsid, wifiPassword } = body as {
      householdId?: string;
      householdName?: string;
      wifiSsid?: string;
      wifiPassword?: string;
    };

    // Validate householdId matches the authenticated user
    if (!householdId || householdId !== auth.householdId) {
      return NextResponse.json(
        { success: false, error: 'Foyer invalide' },
        { status: 403 }
      );
    }

    // Update household name if provided
    if (householdName && householdName.trim()) {
      await prisma.household.update({
        where: { id: householdId },
        data: { name: householdName.trim() },
      });
    }

    // Create WiFi KnowledgeBaseItem entries if SSID is provided
    if (wifiSsid && wifiSsid.trim()) {
      const ssid = wifiSsid.trim();
      const password = wifiPassword || 'non configuré';

      const wifiFaqs = [
        {
          question: 'Quel est le code WiFi ?',
          answer: `Le réseau WiFi est '${ssid}', le mot de passe est '${password}'.`,
          category: 'WiFi',
          keywords: JSON.stringify(['wifi', 'wi-fi', 'wifi code', 'mot de passe wifi', 'internet', 'réseau', 'connexion']),
        },
        {
          question: 'Comment me connecter au WiFi ?',
          answer: `Allez dans les paramètres WiFi de votre appareil, sélectionnez '${ssid}' et entrez le mot de passe '${password}'.`,
          category: 'WiFi',
          keywords: JSON.stringify(['wifi', 'wi-fi', 'connecter', 'connexion', 'internet', 'réseau', 'paramètres']),
        },
      ];

      await prisma.knowledgeBaseItem.createMany({
        data: wifiFaqs.map((faq) => ({
          householdId,
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          keywords: faq.keywords,
          isActive: true,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ONBOARDING] Complete error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
