/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — AES-256-GCM Encryption
   Server-side only. Used for SecretVault password encryption.
   Key derived from VAULT_AES_KEY env var (32 bytes hex).
   ═══════════════════════════════════════════════════════ */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer | null {
  const hex = process.env.VAULT_AES_KEY;
  if (!hex) return null;
  if (hex.length !== 64) {
    // Invalid key length
    return null;
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns format: iv:authTag:cipherText (all hex)
 * Returns plaintext unchanged if key is missing (dev fallback).
 */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  if (!key) {
    // Dev fallback: return plaintext as-is with a prefix
    if (process.env.NODE_ENV === "production") {
      throw new Error("VAULT_AES_KEY is required in production");
    }
    return plaintext;
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a ciphertext string using AES-256-GCM.
 * Expects format: iv:authTag:cipherText (all hex)
 * Returns input unchanged if key is missing (dev fallback).
 */
export function decryptSecret(cipherText: string): string {
  const key = getKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("VAULT_AES_KEY is required in production");
    }
    return cipherText;
  }

  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    // Not encrypted (legacy plaintext) — return as-is
    return cipherText;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Decryption failed — data may be corrupted or key changed');
    }
    return cipherText;
  }
}

/**
 * Check if AES encryption is properly configured.
 */
export function isEncryptionEnabled(): boolean {
  return !!getKey();
}
