-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "editSlug" TEXT NOT NULL,
    "playSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "acak" BOOLEAN NOT NULL DEFAULT false,
    "timerOn" BOOLEAN NOT NULL DEFAULT true,
    "timerDetik" INTEGER NOT NULL DEFAULT 20,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "kelas" TEXT,
    "mapel" TEXT,
    "creatorName" TEXT,
    "creatorEmail" TEXT,
    "creatorPhone" TEXT,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "q" TEXT NOT NULL,
    "opts" TEXT,
    "correct" INTEGER,
    "kunci" TEXT,
    "conf" INTEGER NOT NULL DEFAULT 100,
    "low" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "clue" TEXT,
    "page" INTEGER,
    "sumber" TEXT NOT NULL DEFAULT 'manual',
    CONSTRAINT "Question_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlaySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "playerName" TEXT,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'kuis',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlaySession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Activity_editSlug_key" ON "Activity"("editSlug");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_playSlug_key" ON "Activity"("playSlug");

-- CreateIndex
CREATE INDEX "Activity_visibility_kelas_mapel_idx" ON "Activity"("visibility", "kelas", "mapel");

-- CreateIndex
CREATE INDEX "Activity_visibility_createdAt_idx" ON "Activity"("visibility", "createdAt");

-- CreateIndex
CREATE INDEX "Question_activityId_urutan_idx" ON "Question"("activityId", "urutan");

-- CreateIndex
CREATE INDEX "PlaySession_activityId_score_idx" ON "PlaySession"("activityId", "score");

-- CreateIndex
CREATE INDEX "PlaySession_activityId_createdAt_idx" ON "PlaySession"("activityId", "createdAt");
