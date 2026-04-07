import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/core/auth/lucia";
import { encryptSecret, decryptSecret, isEncryptionEnabled } from "@/lib/aes-crypto";
import { z } from "zod";

// ─── Zod Schemas ───

const vaultSecretSchema = z.object({
  title: z.string().trim().min(1).max(200),
  username: z.string().trim().max(200).optional(),
  password: z.string().min(1).max(10000),
  type: z.enum(['wifi', 'password', 'pin', 'note', 'other']).optional(),
  isPublic: z.boolean().optional(),
});

const updateSecretSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(200).optional(),
  username: z.string().trim().max(200).optional(),
  password: z.string().min(1).max(10000).optional(),
  type: z.enum(['wifi', 'password', 'pin', 'note', 'other']).optional(),
  isPublic: z.boolean().optional(),
});

/**
 * API Routes — Secret Vault (CRUD)
 * GET    /api/vault          — List all secrets for the household
 * POST   /api/vault          — Create a new secret
 * PUT    /api/vault          — Update a secret
 * DELETE /api/vault          — Delete a secret
 */

export const dynamic = "force-dynamic";

async function getHouseholdId(): Promise<string | null> {
  try {
    const { session, user } = await getSession();
    if (!session || !user?.householdId) return null;
    return user.householdId as string;
  } catch {
    return null;
  }
}

// GET — List all secrets
export async function GET() {
  try {
    const householdId = await getHouseholdId();
    if (!householdId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const secrets = await db.secretVault.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        username: true,
        password: true,
        type: true,
        isPublic: true,
        createdAt: true,
      },
    });

    const decryptedSecrets = secrets.map(s => ({
      ...s,
      password: decryptSecret(s.password),
    }));
    return NextResponse.json({ success: true, secrets: decryptedSecrets });
  } catch (error) {
    console.error("[Vault] GET error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// POST — Create a secret
export async function POST(request: NextRequest) {
  try {
    if (!isEncryptionEnabled()) {
      return NextResponse.json({ error: "Service de chiffrement indisponible" }, { status: 503 });
    }

    const householdId = await getHouseholdId();
    if (!householdId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const parsed = vaultSecretSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { title, username, password, type, isPublic } = parsed.data;

    const encryptedPassword = encryptSecret(password);

    const secret = await db.secretVault.create({
      data: {
        householdId,
        title,
        username: username?.trim() || null,
        password: encryptedPassword,
        type: type ?? 'other',
        isPublic: isPublic ?? false,
      },
    });

    return NextResponse.json({
      success: true,
      secret: {
        id: secret.id,
        title: secret.title,
        username: secret.username,
        type: secret.type,
        isPublic: secret.isPublic,
        createdAt: secret.createdAt,
      },
    });
  } catch (error) {
    console.error("[Vault] POST error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// PUT — Update a secret
export async function PUT(request: NextRequest) {
  try {
    if (!isEncryptionEnabled()) {
      return NextResponse.json({ error: "Service de chiffrement indisponible" }, { status: 503 });
    }

    const householdId = await getHouseholdId();
    if (!householdId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const parsed = updateSecretSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { id, title, username, password, type, isPublic } = parsed.data;

    const existing = await db.secretVault.findUnique({ where: { id } });
    if (!existing || existing.householdId !== householdId) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    const secret = await db.secretVault.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(username !== undefined && { username: username?.trim() || null }),
        ...(password !== undefined && { password: encryptSecret(password) }),
        ...(type !== undefined && { type }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json({
      success: true,
      secret: {
        id: secret.id,
        title: secret.title,
        username: secret.username,
        type: secret.type,
        isPublic: secret.isPublic,
        createdAt: secret.createdAt,
      },
    });
  } catch (error) {
    console.error("[Vault] PUT error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// DELETE — Delete a secret
export async function DELETE(request: NextRequest) {
  try {
    const householdId = await getHouseholdId();
    if (!householdId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const existing = await db.secretVault.findUnique({ where: { id } });
    if (!existing || existing.householdId !== householdId) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    await db.secretVault.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Vault] DELETE error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
