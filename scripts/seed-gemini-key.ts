/**
 * Seed script: Insert Gemini API key into ApiConfig table.
 * Usage: bun run scripts/seed-gemini-key.ts
 */

import { PrismaClient } from "@prisma/client";
import { createCipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function encryptSecret(plaintext: string): string {
  const hex = process.env.VAULT_AES_KEY;
  if (!hex || hex.length !== 64) {
    // Dev fallback: store as plaintext
    console.log("⚠️  VAULT_AES_KEY not set, storing key as plaintext (dev mode)");
    return plaintext;
  }

  const key = Buffer.from(hex, "hex");
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

async function main() {
  const prisma = new PrismaClient();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in .env");
    process.exit(1);
  }

  const encryptedKey = encryptSecret(apiKey);

  // Upsert: create or update
  const config = await prisma.apiConfig.upsert({
    where: { serviceKey: "GEMINI" },
    update: {
      apiKey: encryptedKey,
      isActive: true,
      status: "ok",
      lastTested: new Date(),
    },
    create: {
      serviceKey: "GEMINI",
      apiKey: encryptedKey,
      isActive: true,
      status: "ok",
      lastTested: new Date(),
    },
  });

  console.log("✅ Gemini API key seeded into database:");
  console.log(`   ID: ${config.id}`);
  console.log(`   Service: ${config.serviceKey}`);
  console.log(`   Active: ${config.isActive}`);
  console.log(`   Status: ${config.status}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
