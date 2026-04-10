/* ═══════════════════════════════════════════════════════
   MAELLIS — Hospitality Cron Scheduler

   Runs periodically to check for active stays that need:
   - Daily Concierge check at 22h00 (if module active)
   - Safe Departure check at 09h00 on checkout day (if module active)

   Designed to be called by Vercel Cron or any external scheduler
   via /api/cron/hospitality-check?secret=<CRON_SECRET>
   ═══════════════════════════════════════════════════════ */

import { db } from "@/lib/db";
import { initiateHospitalityCall } from "@/lib/retell-hospitality";
import type { CheckType } from "@/lib/retell-hospitality";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface ActiveStay {
  id: string;
  householdId: string;
  guestName: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  status: string;
}

interface HouseholdModules {
  householdId: string;
  modulesConfig: unknown;
  contactPhone: string | null;
}

interface CronResult {
  dailyChecksTriggered: number;
  departureChecksTriggered: number;
  skippedNoPhone: number;
  skippedNoModule: number;
  errors: string[];
}

/* ═══════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════ */

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

function hasModule(
  modulesConfig: unknown,
  moduleName: "safeDeparture" | "dailyConcierge"
): boolean {
  const config = safeJsonParse<Record<string, { active: boolean }>>(
    modulesConfig,
    {}
  );
  return config[moduleName]?.active === true;
}

function isCheckoutToday(checkOutAt: Date): boolean {
  const today = new Date();
  const checkout = new Date(checkOutAt);
  return (
    checkout.getFullYear() === today.getFullYear() &&
    checkout.getMonth() === today.getMonth() &&
    checkout.getDate() === today.getDate()
  );
}

function isAfter22hInTimezone(timezone: string): boolean {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const hourStr = formatter.format(now);
    const hour = parseInt(hourStr, 10);
    return hour >= 22;
  } catch {
    // Fallback to UTC+1 (Europe/Paris default)
    const hour = (now.getUTCHours() + 1) % 24;
    return hour >= 22;
  }
}

function isAfter9hInTimezone(timezone: string): boolean {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const hourStr = formatter.format(now);
    const hour = parseInt(hourStr, 10);
    return hour >= 9;
  } catch {
    const hour = (now.getUTCHours() + 1) % 24;
    return hour >= 9;
  }
}

/**
 * Check if a daily check was already done today for this stay.
 */
async function hasCheckToday(
  checkInStateId: string,
  checkType: string
): Promise<boolean> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const count = await db.dailyCheck.count({
    where: {
      checkInStateId,
      checkType,
      checkDate: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  return count > 0;
}

/* ═══════════════════════════════════════════════════════
   Main Cron Function
   ═══════════════════════════════════════════════════════ */

/**
 * Main hospitality cron job runner.
 *
 * Flow:
 * 1. Find all active CheckInStates (status = "checked-in")
 * 2. Group by householdId
 * 3. Fetch household modulesConfig to determine which modules are active
 * 4. For each household with dailyConcierge active + after 22h → trigger daily check
 * 5. For each household with safeDeparture active + after 9h + checkout today → trigger departure check
 */
export async function runHospitalityCron(): Promise<CronResult> {
  const result: CronResult = {
    dailyChecksTriggered: 0,
    departureChecksTriggered: 0,
    skippedNoPhone: 0,
    skippedNoModule: 0,
    errors: [],
  };

  console.log("[Hospitality Cron] Starting check run...");

  try {
    // 1. Find all active stays
    const activeStays = await db.checkInState.findMany({
      where: {
        status: "checked-in",
      },
      select: {
        id: true,
        householdId: true,
        guestName: true,
        checkInAt: true,
        checkOutAt: true,
        status: true,
      },
    });

    if (activeStays.length === 0) {
      console.log("[Hospitality Cron] No active stays found");
      return result;
    }

    console.log(
      `[Hospitality Cron] Found ${activeStays.length} active stay(s)`
    );

    // 2. Group by householdId
    const staysByHousehold = new Map<string, ActiveStay[]>();
    for (const stay of activeStays) {
      const existing = staysByHousehold.get(stay.householdId) || [];
      existing.push(stay);
      staysByHousehold.set(stay.householdId, existing);
    }

    // 3. Process each household
    for (const [householdId, stays] of staysByHousehold.entries()) {
      // Fetch household config
      const household = await db.household.findUnique({
        where: { id: householdId },
        select: {
          modulesConfig: true,
          contactPhone: true,
          timezone: true,
          name: true,
          type: true,
        },
      });

      if (!household) {
        result.errors.push(`Household ${householdId} not found`);
        continue;
      }

      // Skip non-hospitality households
      if (household.type !== "hospitality") {
        continue;
      }

      // Skip if no phone configured
      if (!household.contactPhone) {
        result.skippedNoPhone++;
        continue;
      }

      const timezone = household.timezone || "Europe/Paris";
      const after22h = isAfter22hInTimezone(timezone);
      const after9h = isAfter9hInTimezone(timezone);
      const hasDailyConcierge = hasModule(household.modulesConfig, "dailyConcierge");
      const hasSafeDeparture = hasModule(household.modulesConfig, "safeDeparture");

      // 4. Daily Concierge — 22h check
      if (after22h && hasDailyConcierge) {
        for (const stay of stays) {
          // Skip if already checked today
          const alreadyDone = await hasCheckToday(stay.id, "daily");
          if (alreadyDone) continue;

          try {
            const callResult = await initiateHospitalityCall(
              householdId,
              stay,
              "daily" as CheckType
            );

            if (callResult.success) {
              result.dailyChecksTriggered++;
              console.log(
                `[Hospitality Cron] Daily check triggered for ${stay.guestName} at ${household.name}`
              );
            } else {
              result.errors.push(
                `Daily check failed for ${stay.guestName}: ${callResult.error}`
              );
            }
          } catch (err) {
            const msg = `Error triggering daily check for ${stay.guestName}: ${err instanceof Error ? err.message : String(err)}`;
            result.errors.push(msg);
            console.error(`[Hospitality Cron] ${msg}`);
          }
        }
      } else if (after22h && !hasDailyConcierge) {
        // Silently skip — module not active
      }

      // 5. Safe Departure — 09h check on checkout day
      if (after9h && hasSafeDeparture) {
        for (const stay of stays) {
          if (!stay.checkOutAt) continue;
          if (!isCheckoutToday(stay.checkOutAt)) continue;

          // Skip if already checked today
          const alreadyDone = await hasCheckToday(stay.id, "departure");
          if (alreadyDone) continue;

          try {
            const callResult = await initiateHospitalityCall(
              householdId,
              stay,
              "departure" as CheckType
            );

            if (callResult.success) {
              result.departureChecksTriggered++;
              console.log(
                `[Hospitality Cron] Departure check triggered for ${stay.guestName} at ${household.name}`
              );
            } else {
              result.errors.push(
                `Departure check failed for ${stay.guestName}: ${callResult.error}`
              );
            }
          } catch (err) {
            const msg = `Error triggering departure check for ${stay.guestName}: ${err instanceof Error ? err.message : String(err)}`;
            result.errors.push(msg);
            console.error(`[Hospitality Cron] ${msg}`);
          }
        }
      }
    }

    console.log(
      `[Hospitality Cron] Complete — Daily: ${result.dailyChecksTriggered}, Departure: ${result.departureChecksTriggered}, Errors: ${result.errors.length}`
    );

    return result;
  } catch (error) {
    const msg = `Fatal error in hospitality cron: ${error instanceof Error ? error.message : String(error)}`;
    result.errors.push(msg);
    console.error(`[Hospitality Cron] ${msg}`);
    return result;
  }
}

/**
 * Generate a StayReviewReport for all stays that ended today
 * and have completed daily checks but no report yet.
 */
export async function generateReportsForCompletedStays(): Promise<{
  generated: number;
  errors: string[];
}> {
  const result = { generated: 0, errors: [] as string[] };

  try {
    // Find CheckInStates that were checked-out today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const completedStays = await db.checkInState.findMany({
      where: {
        checkOutAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: "checked-out",
      },
      select: {
        id: true,
        guestName: true,
        householdId: true,
      },
    });

    for (const stay of completedStays) {
      // Check if report already exists
      const existingReport = await db.stayReviewReport.findUnique({
        where: { checkInStateId: stay.id },
      });

      if (existingReport) continue;

      // Check if there are completed daily checks
      const checkCount = await db.dailyCheck.count({
        where: {
          checkInStateId: stay.id,
          status: { in: ["completed", "no_answer"] },
        },
      });

      if (checkCount === 0) continue;

      // Generate report (dynamic import to avoid circular deps)
      const { generateStayReviewReport } = await import("@/lib/gemini-analysis");

      try {
        const report = await generateStayReviewReport(stay.id);
        if (report) {
          result.generated++;
        }
      } catch (err) {
        result.errors.push(
          `Report generation failed for stay ${stay.id}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  } catch (error) {
    result.errors.push(
      `Error in generateReportsForCompletedStays: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return result;
}
