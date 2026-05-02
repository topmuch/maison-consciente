/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — One-Shot Vault Encryption Migration
   
   Encrypts all plaintext passwords in SecretVault and ApiConfig tables
   using AES-256-GCM. Records already in iv:authTag:ciphertext format
   are left untouched.
   
   Usage: npx tsx scripts/migrate-vault-encryption.ts
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

/** A value is already encrypted if it has exactly 2 colons (iv:authTag:cipherText). */
function isEncrypted(value: string): boolean {
  if (!value) return true; // empty — nothing to do
  const colonCount = (value.match(/:/g) || []).length;
  // Encrypted format: <24-hex-iv>:<32-hex-authTag>:<n-hex-cipherText>
  // That is exactly 2 colons. Plaintext passwords very rarely have 2+ colons,
  // but we can tighten by checking the hex-segment lengths.
  if (colonCount !== 2) return false;
  const parts = value.split(":");
  const [ivHex, authTagHex] = parts;
  // IV should be 24 hex chars (12 bytes), authTag 32 hex chars (16 bytes)
  return /^[0-9a-f]{24}$/.test(ivHex) && /^[0-9a-f]{32}$/.test(authTagHex);
}

// ── Main ──

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  Vault Encryption Migration — One-Shot Script        ║");
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
    vaultTotal: 0,
    vaultEncrypted: 0,
    vaultAlready: 0,
    vaultErrors: 0,
    apiTotal: 0,
    apiEncrypted: 0,
    apiAlready: 0,
    apiErrors: 0,
  };

  try {
    // ── 1. Migrate SecretVault passwords ──
    console.log("─ SecretVault ─────────────────────────────────────");
    const vaults = await prisma.secretVault.findMany();
    stats.vaultTotal = vaults.length;

    for (const vault of vaults) {
      try {
        if (isEncrypted(vault.password)) {
          stats.vaultAlready++;
          console.log(
            `  ⏭  Vault "${vault.title}" (id: ${vault.id.slice(0, 8)}…) — already encrypted`
          );
          continue;
        }

        const encrypted = encryptSecret(vault.password);
        await prisma.secretVault.update({
          where: { id: vault.id },
          data: { password: encrypted },
        });
        stats.vaultEncrypted++;
        console.log(
          `  🔒 Vault "${vault.title}" (id: ${vault.id.slice(0, 8)}…) — encrypted`
        );
      } catch (err) {
        stats.vaultErrors++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `  ❌ Vault "${vault.title}" (id: ${vault.id.slice(0, 8)}…) — error: ${msg}`
        );
      }
    }

    // ── 2. Migrate ApiConfig apiKeys ──
    console.log("\n─ ApiConfig ───────────────────────────────────────");
    const apiConfigs = await prisma.apiConfig.findMany();
    stats.apiTotal = apiConfigs.length;

    for (const config of apiConfigs) {
      try {
        if (isEncrypted(config.apiKey)) {
          stats.apiAlready++;
          console.log(
            `  ⏭  ApiConfig "${config.serviceKey}" — already encrypted`
          );
          continue;
        }

        const encrypted = encryptSecret(config.apiKey);
        await prisma.apiConfig.update({
          where: { id: config.id },
          data: { apiKey: encrypted },
        });
        stats.apiEncrypted++;
        console.log(
          `  🔒 ApiConfig "${config.serviceKey}" — encrypted`
        );
      } catch (err) {
        stats.apiErrors++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `  ❌ ApiConfig "${config.serviceKey}" — error: ${msg}`
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
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║  Migration Summary                                   ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  SecretVault   total: ${String(stats.vaultTotal).padEnd(4)} encrypted: ${String(stats.vaultEncrypted).padEnd(4)} skipped: ${String(stats.vaultAlready).padEnd(4)} errors: ${String(stats.vaultErrors).padEnd(3)} ║`);
  console.log(`║  ApiConfig     total: ${String(stats.apiTotal).padEnd(4)} encrypted: ${String(stats.apiEncrypted).padEnd(4)} skipped: ${String(stats.apiAlready).padEnd(4)} errors: ${String(stats.apiErrors).padEnd(3)} ║`);
  console.log("╠══════════════════════════════════════════════════════╣");

  const totalErrors = stats.vaultErrors + stats.apiErrors;
  if (totalErrors === 0) {
    console.log("║  ✅  All records processed successfully.              ║");
    console.log("╚══════════════════════════════════════════════════════╝");
    process.exit(0);
  } else {
    console.log(`║  ⚠️  ${totalErrors} error(s) occurred. Review logs above.      ║`);
    console.log("╚══════════════════════════════════════════════════════╝");
    process.exit(1);
  }
}

main();
