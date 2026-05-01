/**
 * ═══════════════════════════════════════════════════════════════
 * MAISON CONSCIENTE — Seed SuperAdmin
 *
 * Usage:  npx tsx prisma/seed-superadmin.ts
 *
 * Creates a superadmin user + default household if they don't exist.
 * ═══════════════════════════════════════════════════════════════
 */

import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@maison-consciente.com";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "MaisonAdmin2025!";
  const ADMIN_NAME = process.env.ADMIN_NAME || "SuperAdmin";

  console.log(`\n🔑 Creating SuperAdmin account...`);
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Name:  ${ADMIN_NAME}\n`);

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    console.log(`⚠️  User "${ADMIN_EMAIL}" already exists (role: ${existing.role})`);
    if (existing.role !== "superadmin") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "superadmin" },
      });
      console.log(`✅ Role upgraded to superadmin`);
    }
    return;
  }

  // Hash password with Argon2id
  const passwordHash = await argon2.hash(ADMIN_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Create default household
  const household = await prisma.household.create({
    data: {
      name: "Maison Consciente — Admin",
      type: "home",
      settings: JSON.stringify({ lang: "fr", accent: "gold", quietHours: [23, 7] }),
      subscriptionPlan: "prestige",
      subscriptionStatus: "active",
    },
  });

  // Create superadmin user
  const user = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash,
      role: "superadmin",
      householdId: household.id,
    },
  });

  console.log(`✅ SuperAdmin created successfully!`);
  console.log(`   ID:           ${user.id}`);
  console.log(`   Email:        ${user.email}`);
  console.log(`   Name:         ${user.name}`);
  console.log(`   Role:         ${user.role}`);
  console.log(`   Household ID: ${household.id}\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
