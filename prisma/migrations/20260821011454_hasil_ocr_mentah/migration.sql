-- CreateTable
CREATE TABLE "OcrHalaman" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT NOT NULL,
    "halaman" INTEGER NOT NULL,
    "teks" TEXT NOT NULL,
    "baris" TEXT NOT NULL,
    "konfidensiMin" INTEGER NOT NULL,
    "konfidensiRata" INTEGER NOT NULL,
    "msProses" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OcrHalaman_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OcrHalaman_uploadId_halaman_idx" ON "OcrHalaman"("uploadId", "halaman");

-- CreateIndex
CREATE UNIQUE INDEX "OcrHalaman_uploadId_halaman_key" ON "OcrHalaman"("uploadId", "halaman");
