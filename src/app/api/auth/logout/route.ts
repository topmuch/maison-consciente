/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Logout API Route
   
   Invalide la session et supprime le cookie.
   ═══════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { auth } from "@/core/auth/lucia";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(auth.sessionCookieName)?.value ?? null;

    if (sessionId) {
      await auth.invalidateSession(sessionId);
    }

    // Créer un cookie vide pour le supprimer
    const sessionCookie = auth.createBlankSessionCookie();
    const response = NextResponse.json({ success: true });
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return response;
  } catch (error) {
    console.error("[AUTH] Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
