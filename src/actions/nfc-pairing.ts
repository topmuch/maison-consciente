'use server';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — NFC Pairing Server Actions
   
   Pair/unpair NFC tags with zones.
   
   Security (C-05 fix):
   - Auth guard via getAuthUser() on all functions
   - Zod validation for zoneId (UUID) and nfcUid
   - Zone ownership verified: zone must belong to
     the authenticated user's household before modifying
   ═══════════════════════════════════════════════════════ */

import { z } from 'zod';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/server-auth';

const pairNFCSchema = z.object({
  zoneId: z.string().uuid('ID de zone invalide (format UUID requis)'),
  nfcUid: z.string().min(1, 'UID NFC requis').max(50, 'UID NFC trop long (max 50)'),
});

const unpairNFCSchema = z.object({
  zoneId: z.string().uuid('ID de zone invalide (format UUID requis)'),
});

export interface PairNFCResult {
  success: boolean;
  error?: string;
  zoneName?: string;
  nfcUid?: string;
}

/**
 * Pair an NFC tag with a zone.
 * Updates Zone.nfcUid. Returns error if UID is already used by another zone.
 * Requires auth — zone must belong to authenticated user's household.
 */
export async function pairNFCZone(zoneId: string, nfcUid: string): Promise<PairNFCResult> {
  try {
    const auth = await getAuthUser();
    if (!auth?.householdId) return { success: false, error: 'Non authentifié' };

    const parsed = pairNFCSchema.safeParse({ zoneId, nfcUid });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? 'Données invalides' };
    }

    const { zoneId: validatedZoneId, nfcUid: validatedNfcUid } = parsed.data;

    // Verify zone exists and belongs to the authenticated user's household
    const zone = await db.zone.findFirst({
      where: { id: validatedZoneId, householdId: auth.householdId },
    });

    if (!zone) return { success: false, error: 'Zone non trouvée' };

    // Check if NFC UID is already paired to a DIFFERENT zone in the SAME household
    const existingNfc = await db.zone.findFirst({
      where: {
        nfcUid: validatedNfcUid,
        householdId: auth.householdId,
        id: { not: validatedZoneId },
      },
    });

    if (existingNfc) {
      return {
        success: false,
        error: `Ce tag NFC est déjà associé à la zone "${existingNfc.name}"`,
      };
    }

    // Update zone
    const updatedZone = await db.zone.update({
      where: { id: zone.id },
      data: { nfcUid: validatedNfcUid },
    });

    return {
      success: true,
      zoneName: updatedZone.name,
      nfcUid: validatedNfcUid,
    };
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      console.error('[NFC Pairing] Unauthorized access attempt');
      return { success: false, error: 'Non autorisé' };
    }
    console.error('[NFC Pairing] Error:', err);
    return { success: false, error: 'Erreur lors de l\'appairage NFC' };
  }
}

/**
 * Unpair an NFC tag from a zone.
 * Requires auth — zone must belong to authenticated user's household.
 */
export async function unpairNFCZone(zoneId: string): Promise<PairNFCResult> {
  try {
    const auth = await getAuthUser();
    if (!auth?.householdId) return { success: false, error: 'Non authentifié' };

    const parsed = unpairNFCSchema.safeParse({ zoneId });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? 'Données invalides' };
    }

    const { zoneId: validatedZoneId } = parsed.data;

    // Verify zone exists and belongs to the authenticated user's household
    const zone = await db.zone.findFirst({
      where: { id: validatedZoneId, householdId: auth.householdId },
    });

    if (!zone) return { success: false, error: 'Zone non trouvée' };

    await db.zone.update({
      where: { id: zone.id },
      data: { nfcUid: null },
    });

    return {
      success: true,
      zoneName: zone.name,
    };
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      console.error('[NFC Unpairing] Unauthorized access attempt');
      return { success: false, error: 'Non autorisé' };
    }
    console.error('[NFC Unpairing] Error:', err);
    return { success: false, error: 'Erreur lors du désappairage NFC' };
  }
}
