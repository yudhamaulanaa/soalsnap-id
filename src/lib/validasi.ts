import { z } from "zod";
import { KELAS, MAPEL } from "./kategori";
import { ALASAN_IDS } from "./laporan";
import { MAX_BERKAS, MAX_UKURAN_BYTE } from "./unggah/berkas";
import { MAX_GAMBAR_BYTE, kunciGambarSah } from "./unggah/gambar";
import { TEMPLATES } from "./templates";
import { TIMER_MAX, TIMER_MIN } from "./types";

/** Skema masukan API. Semua data dari luar melewati berkas ini. */

const templateIds = TEMPLATES.map((t) => t.id) as [string, ...string[]];

export const soalSchema = z.object({
  type: z.enum(["pg", "bs", "isian"]),
  q: z.string().trim().min(1, "Teks soal tidak boleh kosong").max(2000),
  opts: z.array(z.string().max(500)).max(8).optional(),
  correct: z.number().int().min(0).max(7).optional(),
  key: z.string().max(500).optional(),
  // Kunci datang dari klien, jadi ruang namanya diperiksa — bukan sekadar panjangnya.
  gambar: z
    .string()
    .max(200)
    .refine(kunciGambarSah, "Kunci gambar tidak sah")
    .optional(),
  gambarAlt: z.string().trim().max(300).optional(),
  conf: z.number().int().min(0).max(100).default(100),
  low: z.boolean().optional(),
  note: z.string().max(500).optional(),
  clue: z.string().max(300).optional(),
  page: z.number().int().min(1).max(100).optional(),
  sumber: z.enum(["upload", "manual"]).default("manual"),
});

export const pengaturanSchema = z.object({
  title: z.string().trim().min(1).max(200),
  template: z.enum(templateIds),
  acak: z.boolean(),
  timerOn: z.boolean(),
  timerDetik: z.number().int().min(TIMER_MIN).max(TIMER_MAX),
  visibility: z.enum(["private", "public"]),
  kelas: z.enum(KELAS).nullable(),
  mapel: z.enum(MAPEL).nullable(),
});

export const kontakSchema = z.object({
  name: z.string().trim().max(120).optional(),
  // Kosong diperlakukan sebagai tidak diisi — kontak memang opsional.
  email: z.union([z.email(), z.literal("")]).optional(),
  phone: z.string().trim().max(30).optional(),
});

export const buatAktivitasSchema = pengaturanSchema.partial({ title: true }).extend({
  questions: z.array(soalSchema).min(1, "Minimal satu soal").max(200),
  creator: kontakSchema.optional(),
});

export const ubahAktivitasSchema = pengaturanSchema
  .partial()
  .extend({
    questions: z.array(soalSchema).min(1).max(200).optional(),
    creator: kontakSchema.optional(),
  });

export const sesiSchema = z.object({
  playerName: z.string().trim().max(60).optional(),
  score: z.number().int().min(0).max(1000),
  total: z.number().int().min(1).max(1000),
  mode: z.enum(["kuis", "jodoh", "flash", "susun", "cari"]).default("kuis"),
});

export const katalogQuerySchema = z.object({
  kelas: z.enum(KELAS).optional(),
  mapel: z.enum(MAPEL).optional(),
  q: z.string().trim().max(100).optional(),
  halaman: z.coerce.number().int().min(1).max(200).default(1),
});

export const laporanSchema = z.object({
  alasan: z.enum(ALASAN_IDS),
  catatan: z.string().trim().max(500).optional(),
});

/** Permintaan izin unggah; isinya baru metadata, berkasnya menyusul ke R2. */
export const unggahSchema = z.object({
  berkas: z
    .array(
      z.object({
        nama: z.string().trim().min(1).max(200),
        contentType: z.string().trim().min(1).max(120),
        ukuran: z.number().int().min(1).max(MAX_UKURAN_BYTE),
      }),
    )
    .min(1)
    .max(MAX_BERKAS),
});

/** Permintaan izin unggah satu gambar soal. */
export const gambarSchema = z.object({
  contentType: z.string().trim().min(1).max(120),
  ukuran: z.number().int().min(1).max(MAX_GAMBAR_BYTE),
});

export const masukAdminSchema = z.object({
  sandi: z.string().min(1).max(200),
});

/** Aksi moderasi admin atas satu aktivitas. */
export const moderasiSchema = z.object({
  aksi: z.enum(["turunkan", "pulihkan"]),
  alasan: z.string().trim().max(200).optional(),
});

export const tinjauLaporanSchema = z.object({
  status: z.enum(["ditangani", "diabaikan"]),
});

/**
 * Kolom form yang dikosongkan terkirim sebagai string kosong, dan tanpa ini
 * satu pilihan "Semua" akan menggugurkan seluruh filter — termasuk kata kunci
 * yang baru saja diketik.
 */
const kosongBerarti = <T extends z.ZodType>(skema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), skema.optional());

export const adminQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  visibility: kosongBerarti(z.enum(["private", "public"])),
  dilaporkan: kosongBerarti(z.enum(["ya"])),
  halaman: z.preprocess(
    (v) => (v === "" || v === undefined ? 1 : v),
    z.coerce.number().int().min(1).max(500),
  ),
});

/** Pesan ringkas untuk ditampilkan ke pengguna. */
export function pesanValidasi(error: z.ZodError): string {
  const first = error.issues[0];
  return first ? `${first.path.join(".") || "data"}: ${first.message}` : "Data tidak valid";
}
