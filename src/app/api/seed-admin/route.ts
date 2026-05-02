/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Seed SuperAdmin API
   
   Called by docker-entrypoint.sh at container startup.
   Protected by ADMIN_SEED_SECRET env var.
   Always updates password to match env vars.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/core/auth/lucia";

const SEED_SECRET = process.env.ADMIN_SEED_SECRET || "maison-seed-2025";

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-admin-seed-secret");
    if (secret !== SEED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const email = process.env.ADMIN_EMAIL || "admin@maison-consciente.com";
    const password = process.env.ADMIN_PASSWORD || "MaisonAdmin2025!";
    const name = process.env.ADMIN_NAME || "SuperAdmin";

    // Hash password with the SAME function used by register/login
    const passwordHash = await hashPassword(password);

    // Upsert: create or update user + password
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        passwordHash,
        role: "superadmin",
        household: {
          create: {
            name: "Maison Consciente — Admin",
            type: "home",
            settings: JSON.stringify({ lang: "fr", accent: "gold", quietHours: [23, 7] }),
            subscriptionPlan: "prestige",
            subscriptionStatus: "active",
          },
        },
      },
      update: {
        name,
        passwordHash,
        role: "superadmin",
      },
    });

    console.log(`✅ SuperAdmin ensured: ${email} (role: superadmin)`);

    return NextResponse.json({
      success: true,
      message: `SuperAdmin ${email} ready`,
      userId: user.id,
    });
  } catch (error) {
    console.error("❌ Seed failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
