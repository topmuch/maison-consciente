/* ═══════════════════════════════════════════════════════
   MAELLIS — Retell AI Hospitality Call Module

   Generates dynamic system prompts for Retell AI agents
   and initiates hospitality phone calls (arrival, daily, departure).
   ═══════════════════════════════════════════════════════ */

import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/aes-crypto";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export type CheckType = "arrival" | "daily" | "departure";

export interface StayInfo {
  checkInDate: string;
  checkOutDate?: string;
  stayDayNumber?: number;
  propertyName: string;
}

export interface HospitalityCallResult {
  success: boolean;
  callId?: string;
  dailyCheckId?: string;
  error?: string;
}

interface CheckInStateRecord {
  id: string;
  guestName: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  status: string;
  notes: string | null;
}

/* ═══════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════ */

const ASSISTANT_NAME = "Maellis";
const SILENCE_TIMEOUT_SEC = 15;
const RETRY_DELAY_HOURS = 1;

const CHECK_TYPE_QUESTIONS: Record<CheckType, string> = {
  arrival:
    "Comment s'est passé votre arrivée ? Avez-vous trouvé tout ce dont vous aviez besoin ?",
  daily:
    "Comment se passe votre séjour ? Y a-t-il quelque chose qui pourrait améliorer votre confort ?",
  departure:
    "Comment s'est passé votre séjour dans son ensemble ? Avez-vous des suggestions pour les prochains invités ?",
};

const NEGATIVE_KEYWORDS = [
  "problème",
  "pas bien",
  "pas bon",
  "déçu",
  "déçue",
  "mauvais",
  "mauvaise",
  "insatisfait",
  "insatisfait",
  "bruyant",
  "sale",
  "cassé",
  "fonctionne pas",
  "inconfortable",
  "mal",
  "n'aime pas",
  "n'aimons pas",
  "horrible",
  "terrible",
  "catastrophe",
  "insupportable",
  "froid",
  "chaud",
  "climatisation",
  "wi-fi",
  "wifi",
  "internet",
  "odeur",
  "bruit",
  "nuisible",
  "insecte",
];

/* ═══════════════════════════════════════════════════════
   System Prompt Builder
   ═══════════════════════════════════════════════════════ */

/**
 * Build a Retell AI-compatible system prompt for hospitality calls.
 * The prompt guides the AI through the full call flow:
 *   1. Permission request and introduction
 *   2. Silence handling (stop after 15s, schedule retry)
 *   3. Adaptive questions based on check type
 *   4. Dissatisfaction detection and webhook trigger
 *   5. Graceful ending
 */
export function buildSystemPrompt(
  checkType: CheckType,
  guestName: string,
  propertyName: string,
  stayInfo: StayInfo
): string {
  const stayDayText = stayInfo.stayDayNumber
    ? `L'invité est au jour ${stayInfo.stayDayNumber} de son séjour (arrivé le ${stayInfo.checkInDate}).`
    : `L'invité est arrivé le ${stayInfo.checkInDate}.`;

  const checkoutText = stayInfo.checkOutDate
    ? `Le départ est prévu le ${stayInfo.checkOutDate}.`
    : "";

  const checkTypeLabel: Record<CheckType, string> = {
    arrival: "appel de bienvenue post-arrivée",
    daily: "vérification quotidienne de satisfaction",
    departure: "bilan de fin de séjour",
  };

  return `Tu es ${ASSISTANT_NAME}, un concierge virtuel intelligent et bienveillant pour la propriété "${propertyName}".

## CONTEXTE
- Propriété : ${propertyName}
- Invité : ${guestName}
- ${stayDayText} ${checkoutText}
- Type de check : ${checkTypeLabel[checkType]}
- Langue : Français (toutes les réponses doivent être en français)

## DÉROULEMENT DE L'APPEL

### Étape 1 — Demande de permission
Commence par : "Puis-je avoir votre attention ? Je suis ${ASSISTANT_NAME}, le concierge de ${propertyName}."
Attends la réponse de l'invité. S'il accepte, passe à l'étape 2. S'il refuse ou raccroche, termine poliment.

### Étape 2 — Gestion du silence
Si l'invité ne répond pas pendant ${SILENCE_TIMEOUT_SEC} secondes après ta question principale, dis : "Je vois que vous êtes occupé(e). Je ne vous dérange pas davantage. Bonne journée !"
Termine alors l'appel. Le système programmera automatiquement une nouvelle tentative dans ${RETRY_DELAY_HOURS} heure(s).

### Étape 3 — Question adaptative
Pose la question suivante de manière naturelle et chaleureuse :
"${CHECK_TYPE_QUESTIONS[checkType]}"

Écoute attentivement la réponse. Pose des questions de suivi pertinentes pour approfondir :
- Si l'invité mentionne un problème, demande des détails avec bienveillance
- Si l'invité est satisfait, demande ce qui a particulièrement apprécié
- Garde la conversation naturelle, pas comme un interrogatoire

### Étape 4 — Détection d'insatisfaction
Sois attentif aux signes d'insatisfaction dans les réponses :
- Mots négatifs : ${NEGATIVE_KEYWORDS.join(", ")}
- Ton général de la réponse
- Hésitations ou réticences

Si tu détectes une insatisfaction ou une note en dessous de 4/5 :
- Exprime de l'empathie : "Je suis vraiment désolé(e) d'apprendre cela. C'est important pour nous et nous allons nous en occuper rapidement."
- Note le problème précisément
- Demande si l'invité souhaite être contacté par l'hôte pour résoudre le problème
- Le système déclenchera automatiquement une alerte à l'hôte

### Étape 5 — Fin gracieuse
Termine toujours par :
"Merci beaucoup ${guestName}, votre retour est très précieux. ${propertyName} tient à ce que votre expérience soit la meilleure possible. Nous vous souhaitons un excellent séjour. Au revoir !"

## RÈGLES IMPORTANTES
- Reste toujours poli, professionnel et chaleureux
- Ne jamais promettre quelque chose que tu ne peux pas faire
- Si l'invité pose une question hors de ton périmètre, redirige vers l'hôte
- Ne jamais mentionner que tu es une IA — tu es le concierge
- Limite la durée de l'appel à 2-3 minutes maximum
- Adapte ton ton : chaleureux mais pas trop familier
- Utilise le vouvoiement en toutes circonstances`;
}

/* ═══════════════════════════════════════════════════════
   Get Retell AI Config
   ═══════════════════════════════════════════════════════ */

async function getRetellConfig(): Promise<{
  apiKey: string | null;
  agentId: string | null;
}> {
  try {
    const config = await db.apiConfig.findUnique({
      where: { serviceKey: "RETELL_AI" },
    });

    if (!config || !config.isActive) {
      return { apiKey: null, agentId: null };
    }

    const apiKey = decryptSecret(config.apiKey);
    // Agent ID is stored in baseUrl field for Retell (non-standard but follows project convention)
    const agentId = config.baseUrl || process.env.RETELL_AGENT_ID || null;

    return { apiKey, agentId };
  } catch (error) {
    console.error("[Retell Hospitality] Error reading config:", error);
    return { apiKey: null, agentId: null };
  }
}

/* ═══════════════════════════════════════════════════════
   Compute Stay Day Number
   ═══════════════════════════════════════════════════════ */

function computeStayDayNumber(checkInAt: Date): number {
  const now = new Date();
  const checkIn = new Date(checkInAt);
  const diffMs = now.getTime() - checkIn.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

/* ═══════════════════════════════════════════════════════
   Initiate Hospitality Call
   ═══════════════════════════════════════════════════════ */

/**
 * Initiate a hospitality check call via Retell AI.
 *
 * 1. Reads RETELL_AI config from ApiConfig table
 * 2. Reads phone numbers from household + CheckInState
 * 3. Creates a Retell phone call with the dynamic system prompt
 * 4. Creates a DailyCheck record with status "calling"
 * 5. Returns the call ID and DailyCheck ID
 */
export async function initiateHospitalityCall(
  householdId: string,
  checkInState: CheckInStateRecord,
  checkType: CheckType
): Promise<HospitalityCallResult> {
  // 1. Get Retell AI configuration
  const { apiKey, agentId } = await getRetellConfig();
  if (!apiKey || !agentId) {
    return {
      success: false,
      error: "Retell AI non configuré. Veuillez ajouter la clé API et l'Agent ID dans les paramètres.",
    };
  }

  // 2. Get household phone numbers
  const household = await db.household.findUnique({
    where: { id: householdId },
    select: {
      name: true,
      contactPhone: true,
      whatsappNumber: true,
    },
  });

  if (!household) {
    return { success: false, error: "Foyer introuvable" };
  }

  if (!household.contactPhone) {
    return { success: false, error: "Aucun numéro de téléphone configuré pour ce foyer" };
  }

  // Determine the guest phone (from checkInState notes or household whatsapp number)
  const guestPhone = household.whatsappNumber || household.contactPhone;

  // 3. Build stay info and system prompt
  const stayInfo: StayInfo = {
    checkInDate: checkInState.checkInAt.toLocaleDateString("fr-FR"),
    checkOutDate: checkInState.checkOutAt
      ? checkInState.checkOutAt.toLocaleDateString("fr-FR")
      : undefined,
    stayDayNumber: computeStayDayNumber(checkInState.checkInAt),
    propertyName: household.name,
  };

  const systemPrompt = buildSystemPrompt(
    checkType,
    checkInState.guestName,
    household.name,
    stayInfo
  );

  // 4. Create the DailyCheck record first (to get the ID for metadata)
  const dailyCheck = await db.dailyCheck.create({
    data: {
      householdId,
      checkInStateId: checkInState.id,
      guestName: checkInState.guestName,
      checkType,
      status: "calling",
    },
  });

  // 5. Make the Retell API call
  try {
    const response = await fetch("https://api.retellai.com/v2/create-phone-call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
        from_number: household.contactPhone,
        to_number: guestPhone,
        metadata: {
          dailyCheckId: dailyCheck.id,
          checkInStateId: checkInState.id,
          householdId,
          checkType,
          guestName: checkInState.guestName,
          timestamp: new Date().toISOString(),
        },
        override_agent_prompt: systemPrompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Retell Hospitality] API error:", data);
      // Update DailyCheck to failed
      await db.dailyCheck.update({
        where: { id: dailyCheck.id },
        data: { status: "failed" },
      });

      return {
        success: false,
        dailyCheckId: dailyCheck.id,
        error: data.detail || `Erreur API Retell (HTTP ${response.status})`,
      };
    }

    // Update DailyCheck with call ID
    await db.dailyCheck.update({
      where: { id: dailyCheck.id },
      data: { callId: data.call_id },
    });

    console.log(
      `[Retell Hospitality] Call initiated: ${data.call_id} for ${checkInState.guestName} (${checkType})`
    );

    return {
      success: true,
      callId: data.call_id,
      dailyCheckId: dailyCheck.id,
    };
  } catch (error) {
    console.error("[Retell Hospitality] Network error:", error);

    // Update DailyCheck to failed
    await db.dailyCheck.update({
      where: { id: dailyCheck.id },
      data: { status: "failed" },
    });

    return {
      success: false,
      dailyCheckId: dailyCheck.id,
      error: "Erreur réseau lors de l'appel",
    };
  }
}

/* ═══════════════════════════════════════════════════════
   Initiate Call by DailyCheck ID (for manual trigger)
   ═══════════════════════════════════════════════════════ */

export async function initiateCallByDailyCheckId(
  dailyCheckId: string
): Promise<HospitalityCallResult> {
  const dailyCheck = await db.dailyCheck.findUnique({
    where: { id: dailyCheckId },
  });

  if (!dailyCheck) {
    return { success: false, error: "DailyCheck introuvable" };
  }

  if (dailyCheck.status !== "pending") {
    return { success: false, error: `Impossible de lancer un appel pour un check avec le statut "${dailyCheck.status}"` };
  }

  // Get the CheckInState
  let checkInState: CheckInStateRecord | null = null;

  if (dailyCheck.checkInStateId) {
    checkInState = await db.checkInState.findUnique({
      where: { id: dailyCheck.checkInStateId },
    });
  }

  if (!checkInState) {
    return { success: false, error: "Séjour (CheckInState) introuvable" };
  }

  return initiateHospitalityCall(
    dailyCheck.householdId,
    checkInState,
    dailyCheck.checkType as CheckType
  );
}
