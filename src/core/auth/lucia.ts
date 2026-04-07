/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Lucia Auth v3 + Custom Adapter
   
   Configuration de l'authentification avec Lucia v3.
   
   ⚠️  Custom adapter obligatoire car @lucia-auth/adapter-prisma v4
       est incompatible avec Prisma v6 ($queryRawUnsafe supprimé).
   ═══════════════════════════════════════════════════════ */

import { Lucia, TimeSpan, type Adapter, type DatabaseSession, type DatabaseUser } from "lucia";
import { db } from "@/core/db";
import argon2 from "argon2";

/* ═══════════════════════════════════════════════════════
   CUSTOM PRISMA ADAPTER (compatible Prisma v6)
   
   Implémente l'interface Lucia Adapter en utilisant
   directement les méthodes Prisma au lieu de queryRaw.
   ═══════════════════════════════════════════════════════ */

class CustomPrismaAdapter implements Adapter {
  constructor(private prisma: typeof db) {}

  async getSessionAndUser(
    sessionId: string
  ): Promise<[DatabaseSession | null, DatabaseUser | null]> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.expiresAt < new Date()) return [null, null];

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user) return [null, null];

    return [
      {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        attributes: {},
      },
      {
        id: user.id,
        attributes: {
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          householdId: user.householdId,
        },
      },
    ];
  }

  async getUserSessions(userId: string): Promise<DatabaseSession[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
    });
    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      expiresAt: s.expiresAt,
      attributes: {},
    }));
  }

  async setSession(session: DatabaseSession): Promise<void> {
    await this.prisma.session.create({
      data: {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
      },
    });
  }

  async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt },
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async deleteExpiredSessions(): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}

/* ═══════════════════════════════════════════════════════
   LUCIA INSTANCE
   ═══════════════════════════════════════════════════════ */

export const auth = new Lucia(new CustomPrismaAdapter(db), {
  sessionExpiresIn: new TimeSpan(30, "d"),
  sessionCookie: {
    name: "mc-session",
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  getUserAttributes: (attributes) => ({
    email: attributes.email,
    name: attributes.name,
    role: attributes.role,
    avatar: attributes.avatar,
    householdId: attributes.householdId,
  }),
});

/* ═══════════════════════════════════════════════════════
   TYPES LUCIA
   ═══════════════════════════════════════════════════════ */

declare module "lucia" {
  interface Register {
    Lucia: typeof auth;
    DatabaseUserAttributes: {
      email: string;
      name: string;
      role: string;
      avatar: string | null;
      householdId: string | null;
    };
    UserId: string;
    SessionId: string;
  }
}

/* ═══════════════════════════════════════════════════════
   ARGON2 — Hashage des mots de passe
   
   Paramètres OWASP recommandés pour Argon2id :
   - memoryCost: 65536 (64 MiB)
   - timeCost: 3
   - parallelism: 4
   ═══════════════════════════════════════════════════════ */

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════
   SESSION HELPERS
   ═══════════════════════════════════════════════════════ */

import { cookies } from "next/headers";
import { cache } from "react";

export const SESSION_COOKIE_NAME = "mc-session";

/**
 * Récupère la session courante avec mise en cache React.
 * Renouvelle automatiquement la session si elle est "fresh".
 */
export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  if (!sessionId) return { session: null, user: null };

  const result = await auth.validateSession(sessionId);
  try {
    if (result.session && result.session.fresh) {
      const sessionCookie = auth.createSessionCookie(result.session.id);
      cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
  } catch {
    // Cookie setting may fail in edge cases
  }
  return result;
});
