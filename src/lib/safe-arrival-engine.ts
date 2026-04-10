import { prisma } from "@/lib/db";
import { sendPushToHousehold } from "@/lib/push-service";
import { sendChildLateAlert } from "@/lib/email-service";

/**
 * Check all pending safe arrival records and mark late ones.
 * Call this from a cron job or scheduled interval.
 *
 * Logic:
 * - Pending arrivals past their expected time are checked
 * - If late < 30 min → status: "late"
 * - If late >= 30 min → status: "emergency"
 * - Push notification sent to household for each late arrival
 */
export async function checkSafeArrivals(): Promise<{ checked: number; late: number }> {
  const now = new Date();

  // Find all pending arrivals past their expected time
  const pendingArrivals = await prisma.safeArrival.findMany({
    where: {
      status: "pending",
      expectedBefore: { lt: now },
    },
    include: { household: true },
  });

  let lateCount = 0;

  for (const arrival of pendingArrivals) {
    const lateMinutes = Math.floor(
      (now.getTime() - arrival.expectedBefore.getTime()) / 60000
    );

    await prisma.safeArrival.update({
      where: { id: arrival.id },
      data: {
        isLate: true,
        lateMinutes,
        status: lateMinutes > 30 ? "emergency" : "late",
      },
    });

    // Send push notification
    const severity = lateMinutes > 30 ? "URGENCE" : "ATTENTION";
    const message =
      lateMinutes > 30
        ? `${arrival.memberName} n'est pas rentré(e) depuis ${lateMinutes} minutes. Appel d'urgence recommandé.`
        : `${arrival.memberName} est en retard de ${lateMinutes} minutes.`;

    await sendPushToHousehold(
      arrival.householdId,
      `🏠 ${severity} — Safe Arrival`,
      message
    ).catch(() => {
      // Push failures are non-blocking
    });

    // Send email alert to household owner
    if (arrival.household?.contactEmail) {
      const expectedTime = arrival.expectedBefore.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      await sendChildLateAlert(arrival.household.contactEmail, {
        childName: arrival.memberName,
        expectedTime,
        lateMinutes,
      }).catch(() => {
        // Email failures are non-blocking
      });
    }

    lateCount++;
  }

  return { checked: pendingArrivals.length, late: lateCount };
}
