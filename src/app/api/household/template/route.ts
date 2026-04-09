import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { getTemplate, TEMPLATES } from "@/lib/templates-config";

/* ═══════════════════════════════════════════════════════
   HOUSEHOLD TEMPLATE API

   GET  /api/household/template  — Get current template
   PUT  /api/household/template  — Update template slug

   Protected: requires valid session.
   ═══════════════════════════════════════════════════════ */

export async function GET() {
  try {
    const authData = await getAuthUser();

    const household = await prisma.household.findUnique({
      where: { id: authData.householdId },
      select: { templateSlug: true },
    });

    const slug = (household?.templateSlug as string) || "nexus-modern";
    const template = getTemplate(slug);

    return NextResponse.json({
      success: true,
      templateSlug: slug,
      template: {
        slug: template.slug,
        name: template.name,
        layoutMode: template.layoutMode,
      },
    });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[Template API] GET error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authData = await getAuthUser();
    const body = await req.json();
    const { templateSlug } = body as { templateSlug?: string };

    if (!templateSlug || !TEMPLATES[templateSlug]) {
      return NextResponse.json(
        { success: false, error: "Template invalide" },
        { status: 400 }
      );
    }

    await prisma.household.update({
      where: { id: authData.householdId },
      data: { templateSlug },
    });

    return NextResponse.json({ success: true, templateSlug });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[Template API] PUT error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
