/* ═══════════════════════════════════════════════════════
   MAELLIS — Calendrier Intelligent — Calendar Sync Service

   iCal parser + CalendarSyncService for syncing external
   calendars (Airbnb, Booking.com, Google) via iCal URLs.
   Pure TypeScript — no external iCal parsing library.
   ═══════════════════════════════════════════════════════ */

import { db } from "@/core/db";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface ParsedBooking {
  externalId: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number | null;
  source: string;
  status: string;
  notes: string | null;
  totalPrice: number | null;
  currency: string | null;
  listingName: string | null;
}

export interface SyncResult {
  sourceId: string;
  sourceName: string;
  fetched: number;
  created: number;
  updated: number;
  cancelled: number;
  errors: string[];
}

export interface AggregateSyncResult {
  totalSources: number;
  totalFetched: number;
  totalCreated: number;
  totalUpdated: number;
  totalCancelled: number;
  errors: string[];
}

/* ═══════════════════════════════════════════════════════
   iCal Parser
   ═══════════════════════════════════════════════════════ */

/**
 * Common IANA timezone identifiers mapped to their UTC offsets in minutes (standard time).
 * This is an approximation — for production, use Intl.DateTimeFormat or a library like luxon/date-fns-tz.
 */
const TIMEZONE_OFFSETS: Record<string, number> = {
  "America/New_York": -300,
  "America/Chicago": -360,
  "America/Denver": -420,
  "America/Los_Angeles": -480,
  "Europe/London": 0,
  "Europe/Paris": 60,
  "Europe/Berlin": 60,
  "Europe/Madrid": 60,
  "Europe/Rome": 60,
  "Europe/Amsterdam": 60,
  "Asia/Tokyo": 540,
  "Asia/Shanghai": 480,
  "Australia/Sydney": 660,
  "Pacific/Auckland": 780,
  "UTC": 0,
};

/**
 * Look up the standard-time UTC offset (in minutes) for a given IANA timezone ID.
 * Returns null if the timezone is not recognized.
 */
function getTimezoneOffsetMinutes(tzId: string): number | null {
  return TIMEZONE_OFFSETS[tzId] ?? null;
}

/**
 * Parse an iCal date string (YYYYMMDDTHHMMSS or YYYYMMDD)
 * with optional timezone suffix (Z or TZID reference).
 */
function parseICalDate(dateStr: string, timezoneId?: string): Date {
  try {
    // Clean up the date string
    let cleaned = dateStr.trim();

    // Handle TZID prefix like "TZID=Europe/Paris:20240315T140000"
    if (cleaned.includes(":")) {
      cleaned = cleaned.split(":").pop()?.trim() || cleaned;
    }

    // Remove trailing Z (UTC indicator)
    const isUTC = cleaned.endsWith("Z");
    if (isUTC) {
      cleaned = cleaned.slice(0, -1);
    }

    // Parse the basic format: YYYYMMDDTHHMMSS or YYYYMMDD
    const year = parseInt(cleaned.substring(0, 4), 10);
    const month = parseInt(cleaned.substring(4, 6), 10) - 1;
    const day = parseInt(cleaned.substring(6, 8), 10);

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (cleaned.length >= 13 && cleaned[8] === "T") {
      hours = parseInt(cleaned.substring(9, 11), 10);
      minutes = parseInt(cleaned.substring(11, 13), 10);
      if (cleaned.length >= 15) {
        seconds = parseInt(cleaned.substring(13, 15), 10);
      }
    }

    // Create date in UTC if Z suffix, otherwise as local
    if (isUTC) {
      return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    }

    // If a timezoneId is provided, apply the offset to create a correct UTC-based date
    if (timezoneId) {
      const offsetMinutes = getTimezoneOffsetMinutes(timezoneId);
      if (offsetMinutes !== null) {
        // Subtract the offset: the date/time is local to the timezone,
        // so we convert to UTC by subtracting the offset.
        const utcMs = Date.UTC(year, month, day, hours, minutes, seconds)
          - offsetMinutes * 60 * 1000;
        return new Date(utcMs);
      } else {
        console.warn(
          `[iCal Parser] Unknown timezone "${timezoneId}", falling back to server local time`
        );
      }
    }

    // Default: treat as local server time
    return new Date(year, month, day, hours, minutes, seconds);
  } catch {
    // Fallback: try native parsing
    return new Date(dateStr);
  }
}

/**
 * Unfold long iCal lines (lines split with CRLF+SPACE or CRLF+TAB).
 */
function unfoldICal(text: string): string {
  return text.replace(/\r?\n[ \t]/g, "");
}

/**
 * Parse a single VEVENT block into a ParsedBooking.
 */
function parseVEvent(eventText: string, defaultSource: string): ParsedBooking | null {
  const lines = eventText.split(/\r?\n/);

  let summary = "";
  let description = "";
  let dtstartRaw = "";
  let dtendRaw = "";
  let dtstartTzId: string | undefined;
  let dtendTzId: string | undefined;
  let uid = "";
  let status = "";
  let location = "";
  let attendee = "";
  const attendees: string[] = [];

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).toUpperCase().split(";")[0].trim();
    const value = line.substring(colonIndex + 1).trim();

    switch (key) {
      case "SUMMARY":
        summary = value;
        break;
      case "DESCRIPTION":
        description = value;
        break;
      case "DTSTART":
      case "DTEND": {
        // Get the full property line (before the colon) to extract TZID
        const fullLine = line.substring(0, colonIndex);
        const tzidMatch = fullLine.match(/TZID=([^;:]+)/i);
        const tzId = tzidMatch ? tzidMatch[1] : undefined;

        if (key === "DTSTART") {
          dtstartRaw = value;
          dtstartTzId = tzId;
        } else {
          dtendRaw = value;
          dtendTzId = tzId;
        }
        break;
      }
      case "UID":
        uid = value;
        break;
      case "STATUS":
        status = value;
        break;
      case "LOCATION":
        location = value;
        break;
      case "ATTENDEE":
        attendees.push(value);
        break;
    }
  }

  // Validate required fields
  if (!dtstartRaw || !dtendRaw || !summary) {
    return null;
  }

  // Generate UID if not present
  const externalId = uid || `ical-${summary}-${dtstartRaw}`;

  // Parse dates
  const checkInDate = parseICalDate(dtstartRaw, dtstartTzId);
  const checkOutDate = parseICalDate(dtendRaw, dtendTzId);

  // Validate dates
  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    return null;
  }

  // Extract guest email from ATTENDEE fields
  const emailMatch = attendees
    .join(" ")
    .match(/mailto:([^\s;>]+)/i);
  const guestEmail = emailMatch ? emailMatch[1] : null;

  // Determine booking status from iCal STATUS
  let bookingStatus: string;
  switch (status.toUpperCase()) {
    case "CANCELLED":
    case "CANCELED":
      bookingStatus = "cancelled";
      break;
    case "TENTATIVE":
      bookingStatus = "pending";
      break;
    case "CONFIRMED":
    default:
      bookingStatus = "confirmed";
      break;
  }

  // Try to extract guest name from SUMMARY
  // Common patterns: "Réservation John Smith", "John Smith - 2 guests", "Booking: Jane Doe"
  let guestName = summary;
  const namePatterns = [
    /^(?:réservation|booking|reserved?)[:\s]+(.+)/i,
    /^(.+?)\s*[-–—]\s*\d+\s*(?:guest|voyageur|personne|nuite?e)/i,
    /^(.+?)\s*[-–—]\s*(?:check.?in|arrival)/i,
  ];
  for (const pattern of namePatterns) {
    const match = summary.match(pattern);
    if (match) {
      guestName = match[1].trim();
      break;
    }
  }

  // Try to extract number of guests from SUMMARY or DESCRIPTION
  let numberOfGuests: number | null = null;
  const guestCountText = `${summary} ${description}`;
  const guestCountMatch = guestCountText.match(
    /(\d+)\s*(?:guest|voyageur|personne|nuite?e|guests?|traveler)/i
  );
  if (guestCountMatch) {
    numberOfGuests = parseInt(guestCountMatch[1], 10);
  }

  // Try to extract price from DESCRIPTION
  let totalPrice: number | null = null;
  let currency: string | null = null;
  const priceMatch = description.match(
    /(?:prix|price|total|amount|coût)[:\s]*([0-9.,]+)\s*(€|EUR|USD|GBP|CHF)/i
  );
  if (priceMatch) {
    totalPrice = parseFloat(priceMatch[1].replace(",", "."));
    currency = priceMatch[2].toUpperCase();
  }

  return {
    externalId,
    guestName,
    guestEmail,
    guestPhone: null,
    checkInDate,
    checkOutDate,
    numberOfGuests,
    source: defaultSource,
    status: bookingStatus,
    notes: description || null,
    totalPrice,
    currency,
    listingName: location || null,
  };
}

/**
 * Parse an entire iCal text content and return an array of ParsedBooking.
 */
export function parseICalContent(
  icalText: string,
  defaultSource: string = "ical"
): ParsedBooking[] {
  const bookings: ParsedBooking[] = [];

  try {
    const unfolded = unfoldICal(icalText);

    // Split into VEVENT blocks
    const eventBlocks: string[] = [];
    const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/gi;
    let match: RegExpExecArray | null;

    while ((match = eventRegex.exec(unfolded)) !== null) {
      eventBlocks.push(match[1]);
    }

    for (const block of eventBlocks) {
      const booking = parseVEvent(block, defaultSource);
      if (booking) {
        bookings.push(booking);
      }
    }
  } catch (err) {
    console.error("[iCal Parser] Error parsing iCal content:", err);
  }

  return bookings;
}

/* ═══════════════════════════════════════════════════════
   CalendarSyncService
   ═══════════════════════════════════════════════════════ */

export class CalendarSyncService {
  /**
   * Fetch an iCal URL and parse its content into bookings.
   */
  async fetchAndParseICal(
    url: string,
    sourceType: string = "ical"
  ): Promise<ParsedBooking[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Maellis-CalendarSync/1.0",
          Accept: "text/calendar, application/ics, text/plain",
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(
          `Erreur HTTP ${response.status}: ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type") || "";
      if (
        !contentType.includes("calendar") &&
        !contentType.includes("ics") &&
        !contentType.includes("text/plain")
      ) {
        console.warn(
          `[iCal] Content-Type inattendu: ${contentType}, tentative de parsage...`
        );
      }

      const text = await response.text();

      if (!text || text.length < 10) {
        throw new Error("Contenu iCal vide ou invalide");
      }

      return parseICalContent(text, sourceType);
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("Délai d'attente dépassé (30s) lors du téléchargement");
      }
      throw err;
    }
  }

  /**
   * Compare existing bookings with incoming parsed bookings
   * and determine what to create, update, and cancel.
   */
  diffBookings(
    existing: Array<{
      externalId: string;
      guestName: string;
      checkInDate: Date;
      checkOutDate: Date;
      status: string;
      notes: string | null;
      numberOfGuests: number | null;
    }>,
    incoming: ParsedBooking[]
  ): {
    toCreate: ParsedBooking[];
    toUpdate: ParsedBooking[];
    toCancel: Array<{ externalId: string }>;
  } {
    const existingMap = new Map(
      existing.map((b) => [b.externalId, b])
    );
    const incomingIds = new Set(incoming.map((b) => b.externalId));

    const toCreate: ParsedBooking[] = [];
    const toUpdate: ParsedBooking[] = [];
    const toCancel: Array<{ externalId: string }> = [];

    // Find new and updated bookings
    for (const incomingBooking of incoming) {
      const existingBooking = existingMap.get(incomingBooking.externalId);

      if (!existingBooking) {
        toCreate.push(incomingBooking);
      } else {
        // Check if any field changed
        const hasChanges =
          incomingBooking.guestName !== existingBooking.guestName ||
          incomingBooking.checkInDate.getTime() !==
            existingBooking.checkInDate.getTime() ||
          incomingBooking.checkOutDate.getTime() !==
            existingBooking.checkOutDate.getTime() ||
          incomingBooking.status !== existingBooking.status ||
          incomingBooking.notes !== existingBooking.notes ||
          (incomingBooking.numberOfGuests ?? 0) !==
            (existingBooking.numberOfGuests ?? 0);

        if (hasChanges) {
          toUpdate.push(incomingBooking);
        }
      }
    }

    // Find bookings that exist locally but not in the remote feed
    // Only cancel if they were "confirmed" or "pending"
    for (const existingBooking of existing) {
      if (!incomingIds.has(existingBooking.externalId)) {
        if (
          existingBooking.status === "confirmed" ||
          existingBooking.status === "pending"
        ) {
          toCancel.push({ externalId: existingBooking.externalId });
        }
      }
    }

    return { toCreate, toUpdate, toCancel };
  }

  /**
   * Sync a single calendar source.
   */
  async syncSource(sourceId: string): Promise<SyncResult> {
    const result: SyncResult = {
      sourceId,
      sourceName: "Inconnu",
      fetched: 0,
      created: 0,
      updated: 0,
      cancelled: 0,
      errors: [],
    };

    try {
      // 1. Load CalendarSource from DB
      const source = await db.calendarSource.findUnique({
        where: { id: sourceId },
      });

      if (!source) {
        result.errors.push(`Source ${sourceId} introuvable`);
        return result;
      }

      result.sourceName = source.name;

      if (!source.isActive) {
        result.errors.push(`Source désactivée: ${source.name}`);
        return result;
      }

      if (!source.url) {
        result.errors.push(`URL iCal manquante pour ${source.name}`);
        return result;
      }

      // 2. Update status to syncing
      await db.calendarSource.update({
        where: { id: sourceId },
        data: { syncStatus: "syncing" },
      });

      // 3. Fetch and parse iCal
      let bookings: ParsedBooking[];
      try {
        bookings = await this.fetchAndParseICal(source.url, source.type);
      } catch (fetchErr) {
        const errMsg =
          fetchErr instanceof Error
            ? fetchErr.message
            : "Erreur lors du téléchargement";
        result.errors.push(errMsg);

        await db.calendarSource.update({
          where: { id: sourceId },
          data: {
            syncStatus: "error",
            lastError: errMsg,
            lastSyncAt: new Date(),
          },
        });

        return result;
      }

      result.fetched = bookings.length;

      // 4. Load existing synced bookings for this source
      const existingBookings = await db.syncedBooking.findMany({
        where: { calendarSourceId: sourceId },
      });

      // 5. Diff
      const { toCreate, toUpdate, toCancel } = this.diffBookings(
        existingBookings.map((b) => ({
          externalId: b.externalId,
          guestName: b.guestName,
          checkInDate: b.checkInDate,
          checkOutDate: b.checkOutDate,
          status: b.status,
          notes: b.notes,
          numberOfGuests: b.numberOfGuests,
        })),
        bookings
      );

      // 6. Apply changes
      // Create new bookings
      for (const booking of toCreate) {
        try {
          await db.syncedBooking.create({
            data: {
              householdId: source.householdId,
              calendarSourceId: sourceId,
              externalId: booking.externalId,
              guestName: booking.guestName,
              guestEmail: booking.guestEmail,
              guestPhone: booking.guestPhone,
              checkInDate: booking.checkInDate,
              checkOutDate: booking.checkOutDate,
              numberOfGuests: booking.numberOfGuests,
              source: booking.source,
              status: booking.status,
              notes: booking.notes,
              totalPrice: booking.totalPrice,
              currency: booking.currency,
              listingName: booking.listingName,
            },
          });
          result.created++;
        } catch (err) {
          const msg = `Erreur création: ${booking.externalId} — ${err instanceof Error ? err.message : String(err)}`;
          result.errors.push(msg);
        }
      }

      // Update existing bookings
      for (const booking of toUpdate) {
        try {
          await db.syncedBooking.updateMany({
            where: {
              calendarSourceId: sourceId,
              externalId: booking.externalId,
            },
            data: {
              guestName: booking.guestName,
              guestEmail: booking.guestEmail,
              guestPhone: booking.guestPhone,
              checkInDate: booking.checkInDate,
              checkOutDate: booking.checkOutDate,
              numberOfGuests: booking.numberOfGuests,
              status: booking.status,
              notes: booking.notes,
              totalPrice: booking.totalPrice,
              currency: booking.currency,
              listingName: booking.listingName,
              lastSyncedAt: new Date(),
            },
          });
          result.updated++;
        } catch (err) {
          const msg = `Erreur mise à jour: ${booking.externalId} — ${err instanceof Error ? err.message : String(err)}`;
          result.errors.push(msg);
        }
      }

      // Cancel removed bookings
      for (const booking of toCancel) {
        try {
          await db.syncedBooking.updateMany({
            where: {
              calendarSourceId: sourceId,
              externalId: booking.externalId,
            },
            data: {
              status: "cancelled",
              lastSyncedAt: new Date(),
            },
          });
          result.cancelled++;
        } catch (err) {
          const msg = `Erreur annulation: ${booking.externalId} — ${err instanceof Error ? err.message : String(err)}`;
          result.errors.push(msg);
        }
      }

      // 7. Update source status
      await db.calendarSource.update({
        where: { id: sourceId },
        data: {
          syncStatus: "idle",
          lastSyncAt: new Date(),
          lastError: result.errors.length > 0 ? result.errors.join("; ") : null,
        },
      });

      console.log(
        `[Calendar Sync] Source "${source.name}": ${result.fetched} fetched, ${result.created} created, ${result.updated} updated, ${result.cancelled} cancelled`
      );
    } catch (err) {
      const msg = `Erreur critique sync source ${sourceId}: ${err instanceof Error ? err.message : String(err)}`;
      result.errors.push(msg);
      console.error(`[Calendar Sync] ${msg}`);

      // Update source status to error
      try {
        await db.calendarSource.update({
          where: { id: sourceId },
          data: {
            syncStatus: "error",
            lastError: msg,
            lastSyncAt: new Date(),
          },
        });
      } catch {
        // Ignore DB update errors
      }
    }

    return result;
  }

  /**
   * Sync all active calendar sources across all households.
   */
  async syncAllActiveSources(): Promise<AggregateSyncResult> {
    const aggregate: AggregateSyncResult = {
      totalSources: 0,
      totalFetched: 0,
      totalCreated: 0,
      totalUpdated: 0,
      totalCancelled: 0,
      errors: [],
    };

    console.log("[Calendar Sync] Starting sync of all active sources...");

    try {
      const activeSources = await db.calendarSource.findMany({
        where: {
          isActive: true,
          autoSync: true,
          url: { not: null },
        },
        select: {
          id: true,
        },
      });

      aggregate.totalSources = activeSources.length;

      if (activeSources.length === 0) {
        console.log("[Calendar Sync] No active sources found");
        return aggregate;
      }

      console.log(
        `[Calendar Sync] Found ${activeSources.length} active source(s)`
      );

      // Sync sources sequentially to avoid overwhelming external APIs
      for (const source of activeSources) {
        const result = await this.syncSource(source.id);
        aggregate.totalFetched += result.fetched;
        aggregate.totalCreated += result.created;
        aggregate.totalUpdated += result.updated;
        aggregate.totalCancelled += result.cancelled;
        aggregate.errors.push(...result.errors);
      }

      console.log(
        `[Calendar Sync] Complete — Sources: ${aggregate.totalSources}, Fetched: ${aggregate.totalFetched}, Created: ${aggregate.totalCreated}, Updated: ${aggregate.totalUpdated}, Cancelled: ${aggregate.totalCancelled}, Errors: ${aggregate.errors.length}`
      );
    } catch (err) {
      const msg = `Erreur critique sync global: ${err instanceof Error ? err.message : String(err)}`;
      aggregate.errors.push(msg);
      console.error(`[Calendar Sync] ${msg}`);
    }

    return aggregate;
  }
}

/** Singleton instance */
export const calendarSyncService = new CalendarSyncService();
