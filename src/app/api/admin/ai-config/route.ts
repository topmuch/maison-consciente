import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireRole } from "@/core/auth/guards";

/* ═══════════════════════════════════════════════════════
   Default AI configuration values
   ═══════════════════════════════════════════════════════ */
interface AIConfigEntry {
  key: string;
  value: string;
  label: string;
  description: string;
  type: "text" | "number" | "boolean" | "textarea";
}

const AI_CONFIG_DEFAULTS: AIConfigEntry[] = [
  {
    key: "ai_model",
    value: "gemini-2.0-flash",
    label: "Modèle IA",
    description: "Le modèle de langage utilisé pour l'assistant Maellis",
    type: "text",
  },
  {
    key: "ai_temperature",
    value: "0.7",
    label: "Température",
    description: "Niveau de créativité de l'IA (0.0 = déterministe, 1.0 = créatif)",
    type: "number",
  },
  {
    key: "ai_max_tokens",
    value: "4096",
    label: "Max Tokens",
    description: "Nombre maximum de tokens par réponse",
    type: "number",
  },
  {
    key: "ai_system_prompt",
    value: "Tu es Maellis, l'assistant de la Maison Consciente. Tu aides les résidents et voyageurs avec bienveillance, en français par défaut. Tu connais les préférences de chaque foyer et proposes des suggestions personnalisées.",
    label: "Prompt Système",
    description: "Instructions de base pour l'assistant IA",
    type: "textarea",
  },
  {
    key: "ai_voice_enabled",
    value: "true",
    label: "Voix IA",
    description: "Activer la voix synthétique pour l'assistant",
    type: "boolean",
  },
  {
    key: "ai_language",
    value: "fr-FR",
    label: "Langue",
    description: "Langue par défaut de l'assistant (code locale)",
    type: "text",
  },
];

// AI-related ApiConfig serviceKeys
const AI_SERVICE_KEYS = [
  "GOOGLE_AI",
  "OPENAI",
  "ANTHROPIC",
  "RETELL",
];

/* ═══════════════════════════════════════════════════════
   GET: Return current AI configuration
   ═══════════════════════════════════════════════════════ */
export async function GET() {
  try {
    await requireRole("superadmin");

    // Fetch all AI system config entries
    const systemConfigs = await db.systemConfig.findMany({
      where: { category: "ai" },
    });

    // Build a map of current values
    const configMap: Record<string, { value: string; id?: string }> = {};
    for (const cfg of systemConfigs) {
      configMap[cfg.key] = { value: cfg.value, id: cfg.id };
    }

    // Merge defaults with current values
    const config = AI_CONFIG_DEFAULTS.map((def) => {
      const current = configMap[def.key];
      return {
        key: def.key,
        value: current?.value ?? def.value,
        defaultValue: def.value,
        label: def.label,
        description: def.description,
        type: def.type,
        isCustomized: current?.value !== undefined && current?.value !== def.value,
        systemConfigId: current?.id ?? null,
      };
    });

    // Fetch AI-related ApiConfig entries
    const apiConfigs = await db.apiConfig.findMany({
      where: { serviceKey: { in: AI_SERVICE_KEYS } },
      select: {
        id: true,
        serviceKey: true,
        isActive: true,
        lastTested: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      config,
      apiConfigs: apiConfigs.map((a) => ({
        id: a.id,
        serviceKey: a.serviceKey,
        isActive: a.isActive,
        lastTested: a.lastTested?.toISOString() ?? null,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Admin AI config GET error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   PUT: Update an AI config value
   ═══════════════════════════════════════════════════════ */
export async function PUT(request: NextRequest) {
  try {
    const { session, householdId: adminHouseholdId } = await requireRole("superadmin");
    const body = await request.json();
    const { key, value } = body as { key?: string; value?: string };

    if (!key || value === undefined || value === null) {
      return NextResponse.json(
        { success: false, error: "key et value sont requis" },
        { status: 400 }
      );
    }

    // Validate key is a known AI config key
    const knownKey = AI_CONFIG_DEFAULTS.find((d) => d.key === key);
    if (!knownKey) {
      return NextResponse.json(
        { success: false, error: `Clé de configuration inconnue. Clés disponibles : ${AI_CONFIG_DEFAULTS.map((d) => d.key).join(", ")}` },
        { status: 400 }
      );
    }

    // Type validation
    if (knownKey.type === "number") {
      const num = Number(value);
      if (isNaN(num)) {
        return NextResponse.json(
          { success: false, error: `La valeur pour ${key} doit être un nombre` },
          { status: 400 }
        );
      }
    }

    if (knownKey.type === "boolean") {
      if (!["true", "false"].includes(value)) {
        return NextResponse.json(
          { success: false, error: `La valeur pour ${key} doit être "true" ou "false"` },
          { status: 400 }
        );
      }
    }

    // Upsert: create or update the SystemConfig entry
    const systemConfig = await db.systemConfig.upsert({
      where: { key },
      create: {
        category: "ai",
        key,
        value,
        isSecret: false,
        label: knownKey.label,
        description: knownKey.description,
      },
      update: {
        value,
        updatedAt: new Date(),
      },
    });

    // Audit log
    await db.userLog.create({
      data: {
        userId: session.userId,
        householdId: adminHouseholdId,
        action: "api_config_update",
        details: JSON.stringify({
          type: "ai_config_update",
          key,
          previousValue: knownKey.value,
          newValue: value,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        id: systemConfig.id,
        key: systemConfig.key,
        value: systemConfig.value,
        label: systemConfig.label,
        description: systemConfig.description,
        updatedAt: systemConfig.updatedAt.toISOString(),
      },
      message: `Configuration "${knownKey.label}" mise à jour avec succès`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Admin AI config PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
