-- OcrHalaman menjadi HalamanDokumen: barisnya kini menampung hasil ekstraksi
-- model, bukan hanya hasil OCR.
--
-- Baris lama dipindahkan, bukan dibuang. Prisma menyarankan DROP TABLE karena
-- namanya berganti, tetapi isinya adalah hasil baca dokumen yang tidak bisa
-- dibuat ulang tanpa memproses ulang seluruh unggahan — dan halaman audit
-- admin bergantung padanya. Kolom OCR juga berubah menjadi boleh kosong, yang
-- di SQLite hanya bisa lewat bangun-ulang tabel seperti ini.

-- CreateTable
CREATE TABLE "HalamanDokumen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT NOT NULL,
    "halaman" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'tertunda',
    "kunciRender" TEXT,
    "lebar" INTEGER,
    "tinggi" INTEGER,
    "rawEkstraksi" TEXT,
    "teks" TEXT,
    "baris" TEXT,
    "konfidensiMin" INTEGER,
    "konfidensiRata" INTEGER,
    "msProses" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HalamanDokumen_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Halaman lama semuanya berasal dari jalur OCR dan sudah rampung.
INSERT INTO "HalamanDokumen" ("id", "uploadId", "halaman", "status", "teks", "baris", "konfidensiMin", "konfidensiRata", "msProses", "createdAt")
SELECT "id", "uploadId", "halaman", 'selesai', "teks", "baris", "konfidensiMin", "konfidensiRata", "msProses", "createdAt" FROM "OcrHalaman";

-- DropIndex
DROP INDEX "OcrHalaman_uploadId_halaman_key";
DROP INDEX "OcrHalaman_uploadId_halaman_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OcrHalaman";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ParseJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'menyusun',
    "progres" INTEGER NOT NULL DEFAULT 0,
    "tahap" TEXT,
    "galat" TEXT,
    "hasil" TEXT,
    "kodeGalat" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "promptVersion" TEXT,
    "schemaVersion" TEXT,
    "extractorVersion" TEXT,
    "halamanTotal" INTEGER NOT NULL DEFAULT 0,
    "halamanSelesai" INTEGER NOT NULL DEFAULT 0,
    "soalTerdeteksi" INTEGER NOT NULL DEFAULT 0,
    "perluTinjau" INTEGER NOT NULL DEFAULT 0,
    "workerId" TEXT,
    "klaimAt" DATETIME,
    "percobaan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "antreAt" DATETIME,
    "selesaiAt" DATETIME
);
INSERT INTO "new_ParseJob" ("antreAt", "createdAt", "galat", "hasil", "id", "klaimAt", "percobaan", "progres", "selesaiAt", "status", "tahap", "token", "workerId") SELECT "antreAt", "createdAt", "galat", "hasil", "id", "klaimAt", "percobaan", "progres", "selesaiAt", "status", "tahap", "token", "workerId" FROM "ParseJob";
DROP TABLE "ParseJob";
ALTER TABLE "new_ParseJob" RENAME TO "ParseJob";
CREATE UNIQUE INDEX "ParseJob_token_key" ON "ParseJob"("token");
CREATE INDEX "ParseJob_status_antreAt_idx" ON "ParseJob"("status", "antreAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "HalamanDokumen_uploadId_halaman_idx" ON "HalamanDokumen"("uploadId", "halaman");

-- CreateIndex
CREATE UNIQUE INDEX "HalamanDokumen_uploadId_halaman_key" ON "HalamanDokumen"("uploadId", "halaman");
