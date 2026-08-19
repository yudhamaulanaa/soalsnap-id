-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "takedownAlasan" TEXT;
ALTER TABLE "Activity" ADD COLUMN "takedownAt" DATETIME;

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "alasan" TEXT NOT NULL,
    "catatan" TEXT,
    "pelapor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'baru',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selesaiAt" DATETIME,
    CONSTRAINT "Report_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_activityId_idx" ON "Report"("activityId");
