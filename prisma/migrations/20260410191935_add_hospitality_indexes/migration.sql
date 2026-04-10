-- AlterTable
ALTER TABLE "UserLog" ADD COLUMN "city" TEXT;
ALTER TABLE "UserLog" ADD COLUMN "country" TEXT DEFAULT 'unknown';
ALTER TABLE "UserLog" ADD COLUMN "status" TEXT DEFAULT 'success';
ALTER TABLE "UserLog" ADD COLUMN "userAgent" TEXT;

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DailyCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "checkInStateId" TEXT,
    "guestName" TEXT NOT NULL,
    "checkDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkType" TEXT NOT NULL DEFAULT 'daily',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "callId" TEXT,
    "durationSec" INTEGER,
    "transcription" TEXT,
    "answeredAt" DATETIME,
    "overallScore" INTEGER,
    "sentiment" TEXT DEFAULT 'neutral',
    "issues" TEXT NOT NULL DEFAULT '[]',
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "aiSummary" TEXT,
    "hostAlerted" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyCheck_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StayReviewReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "checkInStateId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "checkInAt" DATETIME NOT NULL,
    "checkOutAt" DATETIME,
    "cleanliness" INTEGER,
    "comfort" INTEGER,
    "equipment" INTEGER,
    "location" INTEGER,
    "hostContact" INTEGER,
    "valueForMoney" INTEGER,
    "overallScore" REAL,
    "sentiment" TEXT NOT NULL DEFAULT 'neutral',
    "sentimentScore" REAL,
    "verbatim" TEXT,
    "highlights" TEXT NOT NULL DEFAULT '[]',
    "painPoints" TEXT NOT NULL DEFAULT '[]',
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "aiSummary" TEXT,
    "recommendation" TEXT,
    "publicReview" TEXT,
    "dailyCheckCount" INTEGER NOT NULL DEFAULT 0,
    "totalAlerts" INTEGER NOT NULL DEFAULT 0,
    "resolvedAlerts" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StayReviewReport_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HostAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "dailyCheckId" TEXT,
    "checkInStateId" TEXT,
    "guestName" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "transcription" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notifiedVia" TEXT,
    "notifiedAt" DATETIME,
    "acknowledgedAt" DATETIME,
    "resolvedAt" DATETIME,
    "resolution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HostAlert_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "SystemConfig_category_idx" ON "SystemConfig"("category");

-- CreateIndex
CREATE INDEX "DailyCheck_householdId_checkDate_idx" ON "DailyCheck"("householdId", "checkDate" DESC);

-- CreateIndex
CREATE INDEX "DailyCheck_checkInStateId_idx" ON "DailyCheck"("checkInStateId");

-- CreateIndex
CREATE INDEX "DailyCheck_status_idx" ON "DailyCheck"("status");

-- CreateIndex
CREATE INDEX "DailyCheck_sentiment_idx" ON "DailyCheck"("sentiment");

-- CreateIndex
CREATE UNIQUE INDEX "StayReviewReport_checkInStateId_key" ON "StayReviewReport"("checkInStateId");

-- CreateIndex
CREATE INDEX "StayReviewReport_householdId_generatedAt_idx" ON "StayReviewReport"("householdId", "generatedAt" DESC);

-- CreateIndex
CREATE INDEX "StayReviewReport_checkInStateId_idx" ON "StayReviewReport"("checkInStateId");

-- CreateIndex
CREATE INDEX "StayReviewReport_sentiment_idx" ON "StayReviewReport"("sentiment");

-- CreateIndex
CREATE INDEX "HostAlert_householdId_createdAt_idx" ON "HostAlert"("householdId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "HostAlert_status_idx" ON "HostAlert"("status");

-- CreateIndex
CREATE INDEX "HostAlert_severity_idx" ON "HostAlert"("severity");

-- CreateIndex
CREATE INDEX "UserLog_userId_createdAt_idx" ON "UserLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserLog_status_idx" ON "UserLog"("status");
