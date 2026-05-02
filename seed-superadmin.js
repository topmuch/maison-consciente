/**
 * MAISON CONSCIENTE — Seed SuperAdmin (Plain JS for Docker)
 * 
 * Runs at container startup. Only creates the user if it doesn't exist.
 * Credentials are set via ADMIN_EMAIL and ADMIN_PASSWORD env vars.
 */
const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@maison-consciente.com";
  const password = process.env.ADMIN_PASSWORD || "MaisonAdmin2025!";
  const name = process.env.ADMIN_NAME || "SuperAdmin";

  console.log(`🔑 Checking SuperAdmin account (${email})...`);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`⚠️  User "${email}" already exists (role: ${existing.role})`);
    if (existing.role !== "superadmin") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "superadmin" },
      });
      console.log("✅ Role upgraded to superadmin");
    }
    return;
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const household = await prisma.household.create({
    data: {
      name: "Maison Consciente — Admin",
      type: "home",
      settings: JSON.stringify({ lang: "fr", accent: "gold", quietHours: [23, 7] }),
      subscriptionPlan: "prestige",
      subscriptionStatus: "active",
    },
  });

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "superadmin",
      householdId: household.id,
    },
  });

  console.log(`✅ SuperAdmin "${email}" created (role: superadmin)`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e.message || e);
    process.exit(0); // Don't block container startup
  })
  .finally(() => prisma.$disconnect());
