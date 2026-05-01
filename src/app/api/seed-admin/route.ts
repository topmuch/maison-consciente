/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Seed SuperAdmin API
   
   Called by docker-entrypoint.sh at container startup.
   Protected by ADMIN_SEED_SECRET env var.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/core/auth/lucia";

const SEED_SECRET = process.env.ADMIN_SEED_SECRET || "maison-seed-2025";

export async function POST(request: NextRequest) {
  try {
    // Verify secret header
    const secret = request.headers.get("x-admin-seed-secret");
    if (secret !== SEED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const email = process.env.ADMIN_EMAIL || "admin@maison-consciente.com";
    const password = process.env.ADMIN_PASSWORD || "MaisonAdmin2025!";
    const name = process.env.ADMIN_NAME || "SuperAdmin";

    // Check if already exists
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.role !== "superadmin") {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: "superadmin" },
        });
        return NextResponse.json({ success: true, message: `Role upgraded to superadmin for ${email}` });
      }
      return NextResponse.json({ success: true, message: `SuperAdmin ${email} already exists` });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create household
    const household = await prisma.household.create({
      data: {
        name: "Maison Consciente — Admin",
        type: "home",
        settings: JSON.stringify({ lang: "fr", accent: "gold", quietHours: [23, 7] }),
        subscriptionPlan: "prestige",
        subscriptionStatus: "active",
      },
    });

    // Create superadmin
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "superadmin",
        householdId: household.id,
      },
    });

    console.log(`✅ SuperAdmin created: ${email}`);

    return NextResponse.json({
      success: true,
      message: `SuperAdmin ${email} created`,
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
