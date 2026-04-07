/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Vault Decrypt Endpoint
   GET /api/vault/decrypt?id=xxx
   Returns decrypted password for a specific secret.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/core/auth/lucia";
import { decryptSecret } from "@/lib/aes-crypto";

export async function GET(request: NextRequest) {
  try {
    const { session, user } = await getSession();
    if (!session || !user?.householdId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const secret = await db.secretVault.findUnique({
      where: { id },
      select: { id: true, password: true, householdId: true },
    });

    if (!secret || secret.householdId !== user.householdId) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    // Log vault access
    await db.userLog.create({
      data: {
        userId: user.id,
        householdId: user.householdId,
        action: "vault_access",
        details: `Accessed secret: ${id}`,
      },
    });

    return NextResponse.json({
      success: true,
      password: decryptSecret(secret.password),
    });
  } catch (error) {
    console.error('[Vault Decrypt] Error:', error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
