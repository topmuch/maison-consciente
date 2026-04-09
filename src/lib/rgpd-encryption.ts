/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — RGPD Encryption Utility

   Extends AES-256-GCM encryption to sensitive PII fields:
   - phone numbers (Household.contactPhone)
   - emergency contacts (EmergencyContact.phone)
   - medical notes (when added to schema)

   Uses the same VAULT_AES_KEY as SecretVault encryption.
   In dev mode, returns plaintext (graceful degradation).
   ═══════════════════════════════════════════════════════ */

import { encryptSecret, decryptSecret, isEncryptionEnabled } from "./aes-crypto";

/**
 * Encrypt a sensitive PII field (phone, medical notes, etc.)
 * Returns encrypted string in dev (if key missing) or cipher in prod.
 */
export function encryptPII(plaintext: string | null | undefined): string {
  if (!plaintext) return "";
  return encryptSecret(plaintext);
}

/**
 * Decrypt a sensitive PII field.
 * Handles both encrypted (iv:authTag:ciphertext) and plaintext (legacy).
 */
export function decryptPII(ciphertext: string | null | undefined): string {
  if (!ciphertext) return "";
  return decryptSecret(ciphertext);
}

/**
 * Encrypt an entire JSON object of PII fields.
 * Useful for batch encryption of contact records.
 */
export function encryptPIIRecord<T extends Record<string, unknown>>(
  record: T,
  sensitiveKeys: (keyof T)[]
): Record<string, string> {
  const result: Record<string, string> = { ...record } as unknown as Record<string, string>;
  for (const key of sensitiveKeys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      result[key as string] = encryptPII(value);
    }
  }
  return result;
}

/**
 * Decrypt specific keys in a record.
 * Gracefully handles plaintext values (legacy data).
 */
export function decryptPIIRecord(
  record: Record<string, string | null | undefined>,
  sensitiveKeys: string[]
): Record<string, string> {
  const result = { ...record };
  for (const key of sensitiveKeys) {
    if (result[key]) {
      result[key] = decryptPII(result[key]);
    }
  }
  return result;
}

/**
 * Check if RGPD encryption is active.
 */
export function isRGPDCompliant(): boolean {
  return isEncryptionEnabled();
}

/**
 * Sensitive field identifiers for encryption.
 * Use these to tag which fields need encryption/decryption.
 */
export const SENSITIVE_FIELDS = {
  Household: ["contactPhone"] as const,
  EmergencyContact: ["phone"] as const,
  User: [] as const, // User PII is protected by password hashing
} as const;
