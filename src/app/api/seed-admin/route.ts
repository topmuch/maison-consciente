/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Seed Admin + SuperAdmin API
   
   Called by docker-entrypoint.sh at container startup.
   Protected by ADMIN_SEED_SECRET env var.
   Creates TWO accounts:
     1. Admin client (owner) — for client management
     2. Superadmin — for platform administration
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/core/auth/lucia";

const SEED_SECRET = process.env.ADMIN_SEED_SECRET || "maison-seed-2025";

/* ─── Account definitions ─── */

interface SeedAccount {
  email: string;
  password: string;
  name: string;
  role: string;
  householdName: string;
  householdType: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
}

function getAccounts(): SeedAccount[] {
  return [
    {
      // Admin client — compte de démonstration client
      email: process.env.ADMIN_EMAIL || "admin@maison-consciente.com",
      password: process.env.ADMIN_PASSWORD || "MaisonAdmin2025!",
      name: process.env.ADMIN_NAME || "Admin Client",
      role: "owner",
      householdName: "Maison Consciente — Démonstration",
      householdType: "home",
      subscriptionPlan: "comfort",
      subscriptionStatus: "active",
    },
    {
      // Superadmin — compte d'administration plateforme
      email: process.env.SUPERADMIN_EMAIL || "superadmin@maellis.io",
      password: process.env.SUPERADMIN_PASSWORD || "Maellis@Super2025!",
      name: process.env.SUPERADMIN_NAME || "SuperAdmin",
      role: "superadmin",
      householdName: "Maellis — Platform Admin",
      householdType: "home",
      subscriptionPlan: "prestige",
      subscriptionStatus: "active",
    },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-admin-seed-secret");
    if (secret !== SEED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const accounts = getAccounts();
    const results: Array<{ email: string; role: string; userId: string; status: string }> = [];

    for (const account of accounts) {
      const passwordHash = await hashPassword(account.password);

      const user = await prisma.user.upsert({
        where: { email: account.email },
        create: {
          email: account.email,
          name: account.name,
          passwordHash,
          role: account.role,
          household: {
            create: {
              name: account.householdName,
              type: account.householdType,
              settings: JSON.stringify({ lang: "fr", accent: "gold", quietHours: [23, 7] }),
              subscriptionPlan: account.subscriptionPlan,
              subscriptionStatus: account.subscriptionStatus,
            },
          },
        },
        update: {
          name: account.name,
          passwordHash,
          role: account.role,
        },
      });

      console.log(`✅ ${account.role} ensured: ${account.email} (userId: ${user.id})`);
      results.push({
        email: account.email,
        role: account.role,
        userId: user.id,
        status: "created_or_updated",
      });
    }

    return NextResponse.json({
      success: true,
      message: `${results.length} accounts seeded`,
      accounts: results,
    });
  } catch (error) {
    console.error("❌ Seed failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
