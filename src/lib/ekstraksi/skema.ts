import { z } from "zod";
import { TOLERANSI, type Bbox } from "./bbox";

/**
 * Kontrak keluaran model untuk satu halaman (FR-009).
 *
 * Bentuk kabelnya snake_case seperti contoh PRD §5 — itu yang diberikan kepada
 * model sebagai JSON Schema — lalu diubah menjadi objek domain camelCase di
 * sini. Pemisahan itu disengaja (FR-007): kalau suatu saat provider mengubah
 * bentuk balasannya, yang berubah hanya lapisan ini.
 */
export const SCHEMA_VERSION = "v1";

/** Peran visual yang dikenali; menentukan bagaimana potongannya dipakai. */
export const PERAN_ASET = [
  "question_image",
  "stimulus",
  "diagram",
  "table",
  "option_image",
  "reference_image",
] as const;
export type PeranAset = (typeof PERAN_ASET)[number];

export const TIPE_SOAL = [
  "single_choice",
  "multiple_choice",
  "true_false",
  "short_answer",
  "essay",
  "unknown",
] as const;
export type TipeSoalEkstraksi = (typeof TIPE_SOAL)[number];

const bboxWire = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

/** Batasnya longgar di sini; kesahihan sebenarnya diperiksa `rapikanBbox`. */
const bboxSchema = bboxWire.refine(
  (b) =>
    [b.x, b.y, b.width, b.height].every(Number.isFinite) &&
    b.x >= -TOLERANSI &&
    b.y >= -TOLERANSI &&
    b.width > 0 &&
    b.height > 0,
  "bbox di luar rentang ternormalisasi",
);

const asetSchema = z.object({
  temp_id: z.string().min(1).max(80),
  role: z.enum(PERAN_ASET),
  bbox: bboxSchema,
  alt_text: z.string().max(300).nullish(),
  /// Diisi worker setelah potongannya diunggah; model tidak pernah mengisinya.
  storage_key: z.string().max(300).nullish(),
});

const opsiSchema = z.object({
  key: z.string().trim().min(1).max(8),
  text: z.string().max(2000).nullish(),
  content_type: z.enum(["text", "image", "text_image"]),
  bbox: bboxSchema.nullish(),
  assets: z.array(asetSchema).max(8).default([]),
});

const soalSchema = z.object({
  temp_id: z.string().min(1).max(80),
  number: z.number().int().min(1).max(1000).nullish(),
  question_type: z.enum(TIPE_SOAL),
  question_bbox: bboxSchema,
  stem: z.object({
    text: z.string().max(4000).nullish(),
    bbox: bboxSchema.nullish(),
  }),
  assets: z.array(asetSchema).max(12).default([]),
  options: z.array(opsiSchema).max(10).default([]),
  // Hanya diisi bila sumbernya menandai kunci secara eksplisit (FR-023).
  correct_answer: z.array(z.string().max(8)).max(10).nullish(),
  continues_from_previous: z.boolean().default(false),
  continues_to_next: z.boolean().default(false),
  /// Kunci objek potongan satu soal utuh pada halaman ini, diisi worker.
  full_crop_key: z.string().max(300).nullish(),
  confidence: z.number().min(0).max(1),
  needs_review: z.boolean().default(false),
  review_reasons: z.array(z.string().max(200)).max(20).default([]),
});

export const pageExtractionSchema = z.object({
  page: z.number().int().min(1).max(500),
  questions: z.array(soalSchema).max(60).default([]),
  warnings: z.array(z.string().max(300)).max(30).default([]),
});

export type PageExtractionWire = z.infer<typeof pageExtractionSchema>;

// — Objek domain —

export interface AsetEkstraksi {
  tempId: string;
  peran: PeranAset;
  bbox: Bbox;
  altText: string | null;
  /** Kunci objek di R2; kosong berarti potongannya belum diunggah. */
  kunci: string | null;
}

export interface OpsiEkstraksi {
  kunci: string;
  teks: string | null;
  jenisIsi: "text" | "image" | "text_image";
  bbox: Bbox | null;
  aset: AsetEkstraksi[];
}

export interface SoalEkstraksi {
  tempId: string;
  nomor: number | null;
  tipe: TipeSoalEkstraksi;
  bbox: Bbox;
  stem: { teks: string | null; bbox: Bbox | null };
  aset: AsetEkstraksi[];
  opsi: OpsiEkstraksi[];
  kunciJawaban: string[] | null;
  lanjutanDariSebelumnya: boolean;
  berlanjutKeBerikutnya: boolean;
  /** Kunci potongan satu soal utuh pada halaman ini. */
  kunciPotongan: string | null;
  konfidensi: number;
  perluTinjau: boolean;
  alasanTinjau: string[];
  /** Halaman asal, diisi saat penguraian agar provenance tidak hilang. */
  halaman: number;
}

export interface HalamanEkstraksi {
  halaman: number;
  soal: SoalEkstraksi[];
  peringatan: string[];
}

function keAset(a: z.infer<typeof asetSchema>): AsetEkstraksi {
  return {
    tempId: a.temp_id,
    peran: a.role,
    bbox: a.bbox,
    altText: a.alt_text ?? null,
    kunci: a.storage_key ?? null,
  };
}

/** Kabel → domain. Nomor halaman ditanam ke tiap soal supaya asalnya ikut terbawa. */
export function keDomain(wire: PageExtractionWire): HalamanEkstraksi {
  return {
    halaman: wire.page,
    peringatan: wire.warnings,
    soal: wire.questions.map((q) => ({
      tempId: q.temp_id,
      nomor: q.number ?? null,
      tipe: q.question_type,
      bbox: q.question_bbox,
      stem: { teks: q.stem.text ?? null, bbox: q.stem.bbox ?? null },
      aset: q.assets.map(keAset),
      opsi: q.options.map((o) => ({
        kunci: o.key.trim().toUpperCase(),
        teks: o.text ?? null,
        jenisIsi: o.content_type,
        bbox: o.bbox ?? null,
        aset: o.assets.map(keAset),
      })),
      kunciJawaban: q.correct_answer?.map((k) => k.trim().toUpperCase()) ?? null,
      lanjutanDariSebelumnya: q.continues_from_previous,
      berlanjutKeBerikutnya: q.continues_to_next,
      kunciPotongan: q.full_crop_key ?? null,
      konfidensi: q.confidence,
      perluTinjau: q.needs_review,
      alasanTinjau: q.review_reasons,
      halaman: wire.page,
    })),
  };
}

export type HasilUrai =
  | { ok: true; halaman: HalamanEkstraksi }
  | { ok: false; alasan: string };

/**
 * Keluaran model tidak pernah dipercaya begitu saja (FR-010): yang tidak sesuai
 * skema ditolak dengan alasannya, bukan dipaksa masuk.
 */
export function uraiEkstraksi(mentah: unknown): HasilUrai {
  const hasil = pageExtractionSchema.safeParse(mentah);
  if (!hasil.success) {
    const pertama = hasil.error.issues[0];
    return {
      ok: false,
      alasan: pertama ? `${pertama.path.join(".") || "hasil"}: ${pertama.message}` : "Tidak sesuai skema",
    };
  }
  return { ok: true, halaman: keDomain(hasil.data) };
}
