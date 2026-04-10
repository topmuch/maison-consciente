/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Register API Route
   
   Crée un nouveau foyer + utilisateur avec rôle "owner".
   Utilise Argon2id pour le hashage, Lucia pour la session.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { auth, hashPassword } from "@/core/auth/lucia";
import { registerSchema } from "@/core/validations/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { logActionSync } from "@/lib/audit";

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
    const parsed = registerSchema.safeParse(body);

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

    const { email, name, password, householdName } = parsed.data;

    // Vérifier si l'email existe déjà
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Un compte avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe avec Argon2id
    const passwordHash = await hashPassword(password);

    // Créer le foyer par défaut
    const household = await db.household.create({
      data: {
        name: householdName || `Maison de ${name}`,
        type: parsed.data.householdType,
        settings: JSON.stringify({
          lang: "fr",
          accent: "gold",
          quietHours: [23, 7],
        }),
      },
    });

    // Créer l'utilisateur avec rôle "owner"
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "owner",
        householdId: household.id,
      },
    });

    // Créer la session Lucia
    const session = await auth.createSession(user.id, {});

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          householdId: user.householdId,
        },
        householdName: household.name,
      },
      { status: 201 }
    );

    // Définir le cookie de session
    const sessionCookie = auth.createSessionCookie(session.id);
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    // Audit log: new user registration
    logActionSync({ userId: user.id, householdId: household.id, action: "register", details: `New user: ${name} (${email})`, status: "success", request });

    return response;
  } catch (error) {
    console.error("[AUTH] Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
