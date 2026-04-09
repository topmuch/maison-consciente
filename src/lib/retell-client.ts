import { prisma } from "@/lib/db";

const RETELL_API_KEY = process.env.RETELL_API_KEY || "";
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID || "";

interface CallPayload {
  from_number: string;
  to_number: string;
  metadata?: Record<string, unknown>;
}

interface RetellCallResult {
  success: boolean;
  callId?: string;
  error?: string;
}

/**
 * Initiate an emergency voice call via Retell AI.
 * Uses the Retell AI v2 API to create a phone call with the configured agent.
 */
export async function initiateEmergencyCall(
  payload: CallPayload
): Promise<RetellCallResult> {
  if (!RETELL_API_KEY || !RETELL_AGENT_ID) {
    console.warn("[Retell] Not configured — skipping call");
    return { success: false, error: "Retell AI not configured" };
  }

  try {
    const response = await fetch("https://api.retellai.com/v2/create-phone-call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RETELL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: RETELL_AGENT_ID,
        from_number: payload.from_number,
        to_number: payload.to_number,
        metadata: payload.metadata,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Retell] API error:", data);
      return { success: false, error: data.detail || "Retell API error" };
    }

    return { success: true, callId: data.call_id };
  } catch (err) {
    console.error("[Retell] Call failed:", err);
    return { success: false, error: "Network error" };
  }
}

/**
 * Check if Retell AI is configured.
 */
export function isRetellConfigured(): boolean {
  return !!(RETELL_API_KEY && RETELL_AGENT_ID);
}

/**
 * Trigger emergency call for a household.
 * Looks up the household's emergency contacts and primary phone.
 */
export async function triggerHouseholdEmergency(
  householdId: string,
  reason: string
): Promise<RetellCallResult> {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: {
      contactPhone: true,
      emergencyContacts: {
        where: { type: "emergency" },
        take: 1,
      },
    },
  });

  if (!household?.contactPhone) {
    return { success: false, error: "No contact phone configured" };
  }

  const emergencyContact = household.emergencyContacts[0];
  if (!emergencyContact) {
    return { success: false, error: "No emergency contact configured" };
  }

  return initiateEmergencyCall({
    from_number: household.contactPhone,
    to_number: emergencyContact.phone,
    metadata: {
      householdId,
      reason,
      timestamp: new Date().toISOString(),
    },
  });
}
