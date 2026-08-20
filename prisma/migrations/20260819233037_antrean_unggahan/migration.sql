-- CreateTable
CREATE TABLE "ParseJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'menyusun',
    "progres" INTEGER NOT NULL DEFAULT 0,
    "tahap" TEXT,
    "galat" TEXT,
    "hasil" TEXT,
    "workerId" TEXT,
    "klaimAt" DATETIME,
    "percobaan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "antreAt" DATETIME,
    "selesaiAt" DATETIME
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "namaAsli" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "ukuran" INTEGER NOT NULL DEFAULT 0,
    "halaman" INTEGER NOT NULL DEFAULT 1,
    "tersimpan" BOOLEAN NOT NULL DEFAULT false,
    "urutan" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Upload_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ParseJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ParseJob_token_key" ON "ParseJob"("token");

-- CreateIndex
CREATE INDEX "ParseJob_status_antreAt_idx" ON "ParseJob"("status", "antreAt");

-- CreateIndex
CREATE UNIQUE INDEX "Upload_key_key" ON "Upload"("key");

-- CreateIndex
CREATE INDEX "Upload_jobId_urutan_idx" ON "Upload"("jobId", "urutan");
