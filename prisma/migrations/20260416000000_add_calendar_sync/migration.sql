-- CreateTable: CalendarSource
CREATE TABLE "CalendarSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "syncToken" TEXT,
    "syncSecret" TEXT,
    "lastSyncAt" DATETIME,
    "syncStatus" TEXT NOT NULL DEFAULT 'idle',
    "lastError" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "autoSync" BOOLEAN NOT NULL DEFAULT 1,
    "syncInterval" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalendarSource_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: SyncedBooking
CREATE TABLE "SyncedBooking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "calendarSourceId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "checkInDate" DATETIME NOT NULL,
    "checkOutDate" DATETIME NOT NULL,
    "numberOfGuests" INTEGER,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "notes" TEXT,
    "totalPrice" REAL,
    "currency" TEXT,
    "listingName" TEXT,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SyncedBooking_calendarSourceId_fkey" FOREIGN KEY ("calendarSourceId") REFERENCES "CalendarSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SyncedBooking_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CalendarSource_householdId_isActive_idx" ON "CalendarSource"("householdId", "isActive");

-- CreateIndex
CREATE INDEX "SyncedBooking_householdId_status_idx" ON "SyncedBooking"("householdId", "status");

-- CreateIndex
CREATE INDEX "SyncedBooking_householdId_checkInDate_idx" ON "SyncedBooking"("householdId", "checkInDate");

-- CreateIndex
CREATE INDEX "SyncedBooking_calendarSourceId_externalId_idx" ON "SyncedBooking"("calendarSourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedBooking_calendarSourceId_externalId_key" ON "SyncedBooking"("calendarSourceId", "externalId");
