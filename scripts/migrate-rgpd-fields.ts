/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — One-Shot RGPD PII Encryption Migration
   
   Encrypts RGPD-sensitive fields across the database:
     - Household.contactPhone
     - EmergencyContact.phone
   
   Uses the same AES-256-GCM scheme as SecretVault.
   Already-encrypted values (iv:authTag:ciphertext) are skipped.
   
   Usage: npx tsx scripts/migrate-rgpd-fields.ts
   ═══════════════════════════════════════════════════════ */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createCipheriv, randomBytes } from "crypto";

// ── Inline AES-256-GCM (standalone — no Next.js module resolution) ──

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer | null {
  const hex = process.env.VAULT_AES_KEY;
  if (!hex || hex.length !== 64) return null;
  return Buffer.from(hex, "hex");
}

function encryptSecret(plaintext: string): string {
  const key = getKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("VAULT_AES_KEY is required in production");
    }
    return plaintext;
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/** Encrypt a PII field — handles null/undefined/empty. */
function encryptPII(plaintext: string | null | undefined): string {
  if (!plaintext) return "";
  return encryptSecret(plaintext);
}

/** Check if a value is already in encrypted iv:authTag:ciphertext format. */
function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return true; // empty/null — nothing to encrypt
  const colonCount = (value.match(/:/g) || []).length;
  if (colonCount !== 2) return false;
  const parts = value.split(":");
  const [ivHex, authTagHex] = parts;
  return /^[0-9a-f]{24}$/.test(ivHex) && /^[0-9a-f]{32}$/.test(authTagHex);
}

// ── Main ──

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  RGPD PII Encryption Migration — One-Shot Script     ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // Validate encryption key
  const key = getKey();
  if (!key) {
    console.error("❌  VAULT_AES_KEY is missing or invalid (must be 64 hex chars).");
    console.error("   Set it in your .env file and re-run this script.");
    process.exit(1);
  }
  console.log(`✅  VAULT_AES_KEY loaded (${key.length * 8}-bit key)\n`);

  const prisma = new PrismaClient();

  const stats = {
    householdTotal: 0,
    householdEncrypted: 0,
    householdAlready: 0,
    householdNull: 0,
    householdErrors: 0,
    emergencyTotal: 0,
    emergencyEncrypted: 0,
    emergencyAlready: 0,
    emergencyNull: 0,
    emergencyErrors: 0,
  };

  try {
    // ── 1. Migrate Household.contactPhone ──
    console.log("─ Household.contactPhone ─────────────────────────");
    const households = await prisma.household.findMany({
      select: { id: true, name: true, contactPhone: true },
    });
    stats.householdTotal = households.length;

    for (const hh of households) {
      try {
        if (!hh.contactPhone) {
          stats.householdNull++;
          console.log(
            `  ⏭  Household "${hh.name}" (id: ${hh.id.slice(0, 8)}…) — contactPhone is null`
          );
          continue;
        }

        if (isEncrypted(hh.contactPhone)) {
          stats.householdAlready++;
          console.log(
            `  ⏭  Household "${hh.name}" (id: ${hh.id.slice(0, 8)}…) — already encrypted`
          );
          continue;
        }

        const encrypted = encryptPII(hh.contactPhone);
        await prisma.household.update({
          where: { id: hh.id },
          data: { contactPhone: encrypted },
        });
        stats.householdEncrypted++;
        console.log(
          `  🔒 Household "${hh.name}" (id: ${hh.id.slice(0, 8)}…) — contactPhone encrypted`
        );
      } catch (err) {
        stats.householdErrors++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `  ❌ Household "${hh.name}" (id: ${hh.id.slice(0, 8)}…) — error: ${msg}`
        );
      }
    }

    // ── 2. Migrate EmergencyContact.phone ──
    console.log("\n─ EmergencyContact.phone ──────────────────────────");
    const contacts = await prisma.emergencyContact.findMany();
    stats.emergencyTotal = contacts.length;

    for (const ec of contacts) {
      try {
        if (!ec.phone) {
          stats.emergencyNull++;
          console.log(
            `  ⏭  EmergencyContact "${ec.name}" (id: ${ec.id.slice(0, 8)}…) — phone is null`
          );
          continue;
        }

        if (isEncrypted(ec.phone)) {
          stats.emergencyAlready++;
          console.log(
            `  ⏭  EmergencyContact "${ec.name}" (id: ${ec.id.slice(0, 8)}…) — already encrypted`
          );
          continue;
        }

        const encrypted = encryptPII(ec.phone);
        await prisma.emergencyContact.update({
          where: { id: ec.id },
          data: { phone: encrypted },
        });
        stats.emergencyEncrypted++;
        console.log(
          `  🔒 EmergencyContact "${ec.name}" (id: ${ec.id.slice(0, 8)}…) — phone encrypted`
        );
      } catch (err) {
        stats.emergencyErrors++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `  ❌ EmergencyContact "${ec.name}" (id: ${ec.id.slice(0, 8)}…) — error: ${msg}`
        );
      }
    }
  } catch (err) {
    console.error("\n💥 Fatal error during migration:", err);
    await prisma.$disconnect();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  // ── Summary ──
  const hhProcessed = stats.householdEncrypted + stats.householdAlready;
  const ecProcessed = stats.emergencyEncrypted + stats.emergencyAlready;

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║  RGPD Migration Summary                              ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Household.contactPhone                             ║`);
  console.log(`║    total: ${String(stats.householdTotal).padEnd(4)}  encrypted: ${String(stats.householdEncrypted).padEnd(4)}  skipped: ${String(stats.householdAlready + stats.householdNull).padEnd(4)}  errors: ${String(stats.householdErrors).padEnd(3)} ║`);
  console.log(`║  EmergencyContact.phone                             ║`);
  console.log(`║    total: ${String(stats.emergencyTotal).padEnd(4)}  encrypted: ${String(stats.emergencyEncrypted).padEnd(4)}  skipped: ${String(stats.emergencyAlready + stats.emergencyNull).padEnd(4)}  errors: ${String(stats.emergencyErrors).padEnd(3)} ║`);
  console.log("╠══════════════════════════════════════════════════════╣");

  const totalErrors = stats.householdErrors + stats.emergencyErrors;
  const totalNewlyEncrypted = stats.householdEncrypted + stats.emergencyEncrypted;

  if (totalErrors === 0) {
    console.log(`║  ✅  ${totalNewlyEncrypted} PII field(s) newly encrypted.             ║`);
    console.log(`║  ✅  ${hhProcessed + ecProcessed} record(s) already compliant.            ║`);
    console.log("╚══════════════════════════════════════════════════════╝");
    process.exit(0);
  } else {
    console.log(`║  ⚠️  ${totalNewlyEncrypted} encrypted, ${totalErrors} error(s). Review above. ║`);
    console.log("╚══════════════════════════════════════════════════════╝");
    process.exit(1);
  }
}

main();
