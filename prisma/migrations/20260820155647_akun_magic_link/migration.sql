-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "nama" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terakhirMasukAt" DATETIME
);

-- CreateTable
CREATE TABLE "LoginToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "kedaluwarsaAt" DATETIME NOT NULL,
    "dipakaiAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
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
    "linkSentTo" TEXT,
    "linkSentAt" DATETIME,
    "takedownAt" DATETIME,
    "takedownAlasan" TEXT,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Activity" ("acak", "createdAt", "creatorEmail", "creatorName", "creatorPhone", "editSlug", "id", "kelas", "linkSentAt", "linkSentTo", "mapel", "playSlug", "plays", "takedownAlasan", "takedownAt", "template", "timerDetik", "timerOn", "title", "updatedAt", "visibility") SELECT "acak", "createdAt", "creatorEmail", "creatorName", "creatorPhone", "editSlug", "id", "kelas", "linkSentAt", "linkSentTo", "mapel", "playSlug", "plays", "takedownAlasan", "takedownAt", "template", "timerDetik", "timerOn", "title", "updatedAt", "visibility" FROM "Activity";
DROP TABLE "Activity";
ALTER TABLE "new_Activity" RENAME TO "Activity";
CREATE UNIQUE INDEX "Activity_editSlug_key" ON "Activity"("editSlug");
CREATE UNIQUE INDEX "Activity_playSlug_key" ON "Activity"("playSlug");
CREATE INDEX "Activity_visibility_kelas_mapel_idx" ON "Activity"("visibility", "kelas", "mapel");
CREATE INDEX "Activity_visibility_createdAt_idx" ON "Activity"("visibility", "createdAt");
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LoginToken_hash_key" ON "LoginToken"("hash");

-- CreateIndex
CREATE INDEX "LoginToken_userId_createdAt_idx" ON "LoginToken"("userId", "createdAt");
