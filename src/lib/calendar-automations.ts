/* ═══════════════════════════════════════════════════════
   MAELLIS — Calendrier Intelligent — Automation Engine

   Scans SyncedBooking records and triggers actions based
   on booking dates (arrival, departure, etc.).
   ═══════════════════════════════════════════════════════ */

import { db } from "@/core/db";
import { homeAssistantBridge } from "@/lib/home-assistant-bridge";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface AutomationAction {
  type:
    | "send_welcome_prep"
    | "trigger_welcome_scenario"
    | "trigger_checkout_script"
    | "prepare_late_checkout_offer"
    | "request_review";
  guestName: string;
  bookingId: string;
  householdId: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  stayDays?: number;
  triggeredAt: Date;
}

export interface AutomationResult {
  householdId: string;
  householdName: string;
  actions: AutomationAction[];
}

/* ═══════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════ */

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isTomorrow(d: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(d, tomorrow);
}

function isYesterday(d: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(d, yesterday);
}

function getHourInTimezone(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    // Fallback: UTC+1 (Europe/Paris)
    return (new Date().getUTCHours() + 1) % 24;
  }
}

function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/* ═══════════════════════════════════════════════════════
   CalendarAutomationEngine
   ═══════════════════════════════════════════════════════ */

export class CalendarAutomationEngine {
  /**
   * Check and trigger automations for a specific household.
   */
  async checkAndTriggerAutomations(
    householdId: string
  ): Promise<AutomationResult> {
    const result: AutomationResult = {
      householdId,
      householdName: "Inconnu",
      actions: [],
    };

    try {
      // Fetch household info
      const household = await db.household.findUnique({
        where: { id: householdId },
        select: {
          name: true,
          timezone: true,
        },
      });

      if (!household) {
        return result;
      }

      result.householdName = household.name;
      const timezone = household.timezone || "Europe/Paris";
      const currentHour = getHourInTimezone(timezone);
      const now = new Date();

      // Fetch all confirmed bookings with upcoming or current dates
      // Look at bookings from yesterday to tomorrow for automation coverage
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      dayAfterTomorrow.setHours(23, 59, 59, 999);

      const bookings = await db.syncedBooking.findMany({
        where: {
          householdId,
          status: "confirmed",
          checkInDate: { lte: dayAfterTomorrow },
          checkOutDate: { gte: yesterday },
        },
        orderBy: { checkInDate: "asc" },
      });

      for (const booking of bookings) {
        // ── 1. ARRIVAL TOMORROW (18:00) → Prepare welcome ──
        if (isTomorrow(booking.checkInDate) && currentHour >= 18) {
          result.actions.push({
            type: "send_welcome_prep",
            guestName: booking.guestName,
            bookingId: booking.id,
            householdId,
            checkInDate: booking.checkInDate,
            triggeredAt: now,
          });
        }

        // ── 2. ARRIVAL IMMINENT (today, 1h30 before check-in time) ──
        // Default check-in assumed at 16:00, trigger at 14:30
        if (isSameDay(booking.checkInDate, now) && currentHour >= 14) {
          result.actions.push({
            type: "trigger_welcome_scenario",
            guestName: booking.guestName,
            bookingId: booking.id,
            householdId,
            checkInDate: booking.checkInDate,
            triggeredAt: now,
          });
        }

        // ── 3. DEPARTURE IMMINENT (today, after 15:00) → Checkout script ──
        if (isSameDay(booking.checkOutDate, now) && currentHour >= 15) {
          result.actions.push({
            type: "trigger_checkout_script",
            guestName: booking.guestName,
            bookingId: booking.id,
            householdId,
            checkOutDate: booking.checkOutDate,
            triggeredAt: now,
          });
        }

        // ── 4. LATE CHECKOUT ELIGIBLE (checkout today at 09:00) ──
        if (isSameDay(booking.checkOutDate, now) && currentHour >= 9 && currentHour < 10) {
          // Check if no next booking arrives today
          const hasArrivalToday = bookings.some(
            (b) =>
              b.id !== booking.id &&
              isSameDay(b.checkInDate, now) &&
              b.status === "confirmed"
          );

          if (!hasArrivalToday) {
            result.actions.push({
              type: "prepare_late_checkout_offer",
              guestName: booking.guestName,
              bookingId: booking.id,
              householdId,
              checkOutDate: booking.checkOutDate,
              triggeredAt: now,
            });
          }
        }

        // ── 5. STAY COMPLETED (checkout was yesterday) ──
        if (isYesterday(booking.checkOutDate)) {
          const stayDays = calculateNights(
            booking.checkInDate,
            booking.checkOutDate
          );

          // Update booking status to completed
          try {
            await db.syncedBooking.update({
              where: { id: booking.id },
              data: { status: "completed" },
            });
          } catch {
            // Ignore update errors — might already be completed
          }

          result.actions.push({
            type: "request_review",
            guestName: booking.guestName,
            bookingId: booking.id,
            householdId,
            checkOutDate: booking.checkOutDate,
            stayDays,
            triggeredAt: now,
          });
        }
      }
    } catch (err) {
      console.error(
        `[Calendar Automation] Error for household ${householdId}:`,
        err
      );
    }

    return result;
  }

  /**
   * Process all hospitality households and trigger automations.
   */
  async processAllHouseholds(): Promise<void> {
    console.log("[Calendar Automation] Starting process for all households...");

    try {
      // Find all hospitality households that have calendar sources
      const households = await db.household.findMany({
        where: {
          type: "hospitality",
          calendarSources: { some: { isActive: true } },
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (households.length === 0) {
        console.log("[Calendar Automation] No hospitality households with active calendars found");
        return;
      }

      console.log(
        `[Calendar Automation] Processing ${households.length} household(s)`
      );

      let totalActions = 0;

      for (const household of households) {
        const result = await this.checkAndTriggerAutomations(household.id);

        if (result.actions.length > 0) {
          totalActions += result.actions.length;

          for (const action of result.actions) {
            console.log(
              `[Calendar Automation] ${result.householdName}: ${action.type} for ${action.guestName} (booking: ${action.bookingId})`
            );

            // Execute the actual automation action
            switch (action.type) {
              case "trigger_welcome_scenario":
                try {
                  const haResult = await homeAssistantBridge.triggerWelcomeScenario(
                    action.householdId,
                    action.guestName
                  );
                  console.log(`[Calendar Automation] HA welcome scenario: ${haResult ? "SUCCESS" : "SKIPPED"}`);
                } catch (haErr) {
                  console.warn("[Calendar Automation] Home Assistant welcome failed:", haErr);
                }
                break;

              case "trigger_checkout_script":
                try {
                  const haResult = await homeAssistantBridge.triggerCheckoutScript(
                    action.householdId,
                    action.guestName
                  );
                  console.log(`[Calendar Automation] HA checkout script: ${haResult ? "SUCCESS" : "SKIPPED"}`);
                } catch (haErr) {
                  console.warn("[Calendar Automation] Home Assistant checkout failed:", haErr);
                }
                break;

              case "prepare_late_checkout_offer":
                try {
                  const haResult = await homeAssistantBridge.triggerLateCheckoutOffer(
                    action.householdId,
                    action.guestName
                  );
                  console.log(`[Calendar Automation] Late checkout offer: ${haResult ? "SUCCESS" : "SKIPPED"}`);
                } catch (haErr) {
                  console.warn("[Calendar Automation] Late checkout notification failed:", haErr);
                }
                break;

              case "send_welcome_prep":
                // Welcome prep: create or update CheckInState for the arriving guest
                try {
                  if (action.checkInDate) {
                    const existingCheckIn = await db.checkInState.findFirst({
                      where: {
                        householdId: action.householdId,
                        guestName: action.guestName,
                        status: "pending",
                      },
                    });
                    if (!existingCheckIn) {
                      await db.checkInState.create({
                        data: {
                          householdId: action.householdId,
                          guestName: action.guestName,
                          checkInAt: action.checkInDate,
                          status: "pending",
                          notes: `Réservation auto-détectée via calendrier — booking: ${action.bookingId}`,
                        },
                      });
                      console.log(`[Calendar Automation] CheckInState créé pour ${action.guestName}`);
                    }
                  }
                } catch (ciErr) {
                  console.warn("[Calendar Automation] CheckInState creation failed:", ciErr);
                }
                break;

              case "request_review":
                // After checkout: update CheckInState to checked-out
                try {
                  await db.checkInState.updateMany({
                    where: {
                      householdId: action.householdId,
                      guestName: action.guestName,
                      status: "checked-in",
                    },
                    data: {
                      checkOutAt: new Date(),
                      status: "checked-out",
                    },
                  });
                  console.log(`[Calendar Automation] CheckInState mis à jour (checked-out) pour ${action.guestName}`);
                } catch (ciErr) {
                  console.warn("[Calendar Automation] CheckInState update failed:", ciErr);
                }
                break;
            }

            // Log the automation trigger
            try {
              await db.userLog.create({
                data: {
                  householdId: household.id,
                  action: `calendar_automation:${action.type}`,
                  details: JSON.stringify({
                    guestName: action.guestName,
                    bookingId: action.bookingId,
                    type: action.type,
                  }),
                  status: "success",
                },
              });
            } catch {
              // Ignore log errors
            }
          }
        }
      }

      console.log(
        `[Calendar Automation] Complete — ${totalActions} action(s) triggered`
      );
    } catch (err) {
      console.error(
        "[Calendar Automation] Fatal error in processAllHouseholds:",
        err
      );
    }
  }
}

/** Singleton instance */
export const calendarAutomationEngine = new CalendarAutomationEngine();
