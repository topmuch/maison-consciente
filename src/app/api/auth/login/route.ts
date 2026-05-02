/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Auth API Routes
   
   Routes d'authentification (Login, Register, Logout, Session)
   Utilise Lucia Auth v3 + Argon2id pour le hashage.
   
   LOGIN retourne un redirect serveur (302) vers /dashboard
   pour garantir que le cookie de session est bien envoyé
   avec la requête suivante.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { auth, verifyPassword } from "@/core/auth/lucia";
import { loginSchema } from "@/core/validations/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { logActionSync } from "@/lib/audit";

/* ═══════════════════════════════════════════════════════
   POST /api/auth/login

   En cas de succès → 302 redirect vers /dashboard avec cookie.
   Le navigateur suit le redirect nativement, le cookie est
   déjà dans le jar quand la page dashboard se charge.
   ═══════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { limited, retryAfter } = rateLimit(ip, 5, 60000);
    if (limited) {
      return NextResponse.json(
        { success: false, error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation échouée",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Trouver l'utilisateur avec les infos du foyer
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        passwordHash: true,
        householdId: true,
        household: { select: { name: true, type: true } },
      },
    });

    if (!user) {
      logActionSync({ action: "login_failed", details: `Email not found: ${email}`, status: "failure", request });
      return NextResponse.json(
        { success: false, error: "Email ou mot de passe invalide" },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe avec Argon2
    const isValid = await verifyPassword(user.passwordHash, password);
    if (!isValid) {
      logActionSync({ userId: user.id, action: "login_failed", details: `Invalid password for ${email}`, status: "failure", request });
      return NextResponse.json(
        { success: false, error: "Email ou mot de passe invalide" },
        { status: 401 }
      );
    }

    // Créer la session Lucia
    const session = await auth.createSession(user.id, {});

    // Audit log: successful login
    logActionSync({ userId: user.id, householdId: user.householdId ?? undefined, action: "login", details: `Login from ${ip}`, status: "success", request });

    // ── Server-side redirect with cookie ──
    // Le cookie est posé sur la réponse 302, le navigateur le stocke
    // avant de suivre la redirection vers /dashboard.
    const dashboardUrl = new URL("/dashboard", request.url);
    const response = NextResponse.redirect(dashboardUrl, 302);

    const sessionCookie = auth.createSessionCookie(session.id);
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return response;
  } catch (error) {
    console.error("[AUTH] Login error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
