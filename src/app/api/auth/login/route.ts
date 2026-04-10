/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Auth API Routes
   
   Routes d'authentification (Login, Register, Logout, Session)
   Utilise Lucia Auth v3 + Argon2id pour le hashage.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { auth, verifyPassword } from "@/core/auth/lucia";
import { loginSchema } from "@/core/validations/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { logActionSync } from "@/lib/audit";

/* ═══════════════════════════════════════════════════════
   POST /api/auth/login
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
        household: { select: { name: true } },
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

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        householdId: user.householdId,
      },
      householdName: user.household?.name || null,
    });

    // Définir le cookie de session
    const sessionCookie = auth.createSessionCookie(session.id);
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    // Audit log: successful login
    logActionSync({ userId: user.id, householdId: user.householdId ?? undefined, action: "login", details: `Login from ${ip}`, status: "success", request });

    return response;
  } catch (error) {
    console.error("[AUTH] Login error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
