/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — OneSignal Push Service

   Server-side utility to send push notifications via
   the OneSignal REST API v2.
   
   Usage:
     await sendPushToHousehold(householdId, 'Bonjour !', 'Votre résumé matinal');
     await sendPushToUser(userId, 'Alerte', 'Porte ouverte');
   ═══════════════════════════════════════════════════════ */

import { prisma } from "@/lib/db";

const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "";
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || "";

interface PushOptions {
  url?: string;
  data?: Record<string, unknown>;
  priority?: number; // 10 = high
}

/**
 * Send a push notification to a specific household.
 * Looks up the household's OneSignal player ID from notificationPrefs.
 */
export async function sendPushToHousehold(
  householdId: string,
  title: string,
  body: string,
  options?: PushOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: { notificationPrefs: true },
    });

    const prefs = household?.notificationPrefs as Record<string, unknown> | null || {};
    const playerId = prefs.onesignalPlayerId as string | null;

    if (!playerId) {
      return { success: false, error: "No push subscription found for household" };
    }

    return await sendPushNotification(playerId, title, body, options);
  } catch (err) {
    console.error("[PushService] sendPushToHousehold error:", err);
    return { success: false, error: "Database error" };
  }
}

/**
 * Send a push notification to a specific user.
 * Looks up the user's household to find the push subscription.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  options?: PushOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      return { success: false, error: "User has no household" };
    }

    return await sendPushToHousehold(user.householdId, title, body, options);
  } catch (err) {
    console.error("[PushService] sendPushToUser error:", err);
    return { success: false, error: "Database error" };
  }
}

/**
 * Core function to send via OneSignal REST API.
 */
async function sendPushNotification(
  playerId: string,
  title: string,
  body: string,
  options?: PushOptions
): Promise<{ success: boolean; error?: string }> {
  if (!ONESIGNAL_REST_API_KEY || !ONESIGNAL_APP_ID) {
    console.warn("[PushService] OneSignal not configured — skipping push");
    return { success: false, error: "OneSignal not configured" };
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [playerId],
        headings: { en: title, fr: title },
        contents: { en: body, fr: body },
        url: options?.url || undefined,
        data: options?.data || undefined,
        priority: options?.priority || 5,
        chrome_web_icon: "/icon-192.png",
        chrome_web_badge: "/icon-192.png",
        ios_badgeType: "Increase",
        ios_badgeCount: 1,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[PushService] OneSignal error:", result);
      return { success: false, error: result.errors?.[0] || "OneSignal API error" };
    }

    console.log("[PushService] Notification sent:", result.id);
    return { success: true };
  } catch (err) {
    console.error("[PushService] sendPushNotification error:", err);
    return { success: false, error: "Network error" };
  }
}

/**
 * Check if OneSignal push is properly configured.
 */
export function isPushConfigured(): boolean {
  return !!(ONESIGNAL_REST_API_KEY && ONESIGNAL_APP_ID);
}
