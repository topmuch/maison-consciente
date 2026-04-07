/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Scan API Route
   
   Point d'entrée principal pour les QR codes.
   - Enregistre l'interaction
   - Génère la suggestion contextuelle (Moteur de Conscience)
   - Récupère la météo en temps réel (Open-Meteo)
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db, parseJson } from "@/core/db";
import { getOptionalAuthUser } from "@/lib/server-auth";
import { generateContextSuggestion, fetchWeather } from "@/core/conscious-engine";
import { generateSuggestion } from "@/core/conscious-engine";
import { scanSchema } from "@/core/validations/schemas";
import type { InteractionContext } from "@/core/types";

function getWeekday(date: Date): string {
  return ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"][date.getDay()];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = scanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { slug } = parsed.data;

    // Trouver la zone par son QR code slug
    const zone = await db.zone.findUnique({
      where: { qrCode: slug },
      include: {
        _count: {
          select: { interactions: true },
        },
        household: {
          select: { id: true, name: true },
        },
      },
    });

    if (!zone) {
      return NextResponse.json(
        { success: false, error: "QR code non reconnu" },
        { status: 404 }
      );
    }

    // Auth optionnelle — scan anonyme possible
    let userId = "";
    try {
      const authUser = await getOptionalAuthUser();
      if (authUser) userId = authUser.user.id;
    } catch {
      // No session — anonymous scan
    }

    const now = new Date();
    const context: InteractionContext = {
      hour: now.getHours(),
      weekday: getWeekday(now),
    };

    // Générer la suggestion contextuelle + météo en parallèle
    const [contextSuggestion, fullSuggestion, weather] = await Promise.all([
      generateContextSuggestion(zone.name, zone.householdId),
      generateSuggestion(zone.id, context).catch(() => ({ greeting: "Bienvenue" })),
      fetchWeather().catch(() => ({
        temperature: 20,
        condition: "N/A",
        icon: "🌡️",
        humidity: 50,
        windSpeed: 10,
      })),
    ]);

    // Enregistrer l'interaction
    const interaction = await db.interaction.create({
      data: {
        zoneId: zone.id,
        userId: userId || "anonymous",
        context: JSON.stringify(context),
        response: JSON.stringify(fullSuggestion),
      },
    });

    return NextResponse.json({
      success: true,
      interaction: {
        id: interaction.id,
        createdAt: interaction.createdAt,
      },
      zone: {
        id: zone.id,
        name: zone.name,
        icon: zone.icon,
        color: zone.color,
        householdName: zone.household.name,
        interactionCount: zone._count.interactions,
      },
      // Suggestion contextuelle simplifiée (compatible spec utilisateur)
      suggestion: contextSuggestion,
      // Suggestion complète avec greeting + recipe + soundscape
      fullSuggestion,
      // Météo temps réel
      weather,
      // Contexte de l'interaction
      context,
    });
  } catch (error) {
    console.error("[SCAN] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
