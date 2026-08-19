import type { PlayMode, Question, TemplateId } from "./types";
import { buildPairs, buildWords } from "./derive";

export interface TemplateMeta {
  id: TemplateId;
  label: string;
  /** Satu baris penjelasan pada kartu template (FR-TP-2). */
  desc: string;
  /** Warna band kartu aktivitas di dashboard. */
  band: string;
  mode: PlayMode;
  /** Satuan isi untuk baris meta kartu dashboard. */
  unit: (n: number) => string;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "kuis",
    label: "Kuis",
    desc: "Pilihan ganda klasik, cocok untuk campuran soalmu",
    band: "var(--color-teal-light)",
    mode: "kuis",
    unit: (n) => `${n} soal`,
  },
  {
    id: "bs",
    label: "Benar / Salah",
    desc: "Tebak cepat dua pilihan",
    band: "var(--color-ai-light)",
    mode: "kuis",
    unit: (n) => `${n} soal`,
  },
  {
    id: "isian",
    label: "Isian",
    desc: "Lengkapi jawaban dengan mengetik",
    band: "var(--color-sand)",
    mode: "kuis",
    unit: (n) => `${n} soal`,
  },
  {
    id: "jodoh",
    label: "Menjodohkan",
    desc: "Pasangkan soal dengan jawabannya",
    band: "var(--color-ai-light)",
    mode: "jodoh",
    unit: (n) => `${n} pasangan`,
  },
  {
    id: "flashcard",
    label: "Flashcard",
    desc: "Kartu bolak-balik untuk menghafal",
    band: "var(--color-sand)",
    mode: "flash",
    unit: (n) => `${n} kartu`,
  },
  {
    id: "susun",
    label: "Susun Kata",
    desc: "Urutkan huruf atau kata acak",
    band: "var(--color-teal-light)",
    mode: "susun",
    unit: (n) => `${n} kata`,
  },
  {
    id: "cari",
    label: "Cari Kata",
    desc: "Temukan jawaban di kisi huruf",
    band: "var(--color-fill-2)",
    mode: "cari",
    unit: (n) => `${n} kata tersembunyi`,
  },
  {
    id: "cepat",
    label: "Kuis Cepat",
    desc: "Balapan menjawab sebelum waktu habis",
    band: "var(--color-ai-light)",
    mode: "kuis",
    unit: (n) => `${n} soal`,
  },
];

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

export function templateMeta(id: TemplateId): TemplateMeta {
  return BY_ID.get(id) ?? TEMPLATES[0];
}

export function templateLabel(id: TemplateId): string {
  return templateMeta(id).label;
}

export function playMode(id: TemplateId): PlayMode {
  return templateMeta(id).mode;
}

/** Berapa "isi" yang dimainkan template ini dari bank soal yang diberikan. */
export function templateCount(id: TemplateId, questions: Question[]): number {
  switch (id) {
    case "jodoh":
      return buildPairs(questions).length;
    case "susun":
    case "cari":
      return buildWords(questions).length;
    default:
      return questions.length;
  }
}

export interface Eligibility {
  ok: boolean;
  /** Alasan template tidak dapat dipilih (FR-TP-6). */
  reason?: string;
}

/**
 * Syarat data per template (FR-TP-6). Template yang tidak memenuhi syarat
 * menampilkan alasannya, bukan gagal senyap.
 */
export function eligibility(id: TemplateId, questions: Question[]): Eligibility {
  if (questions.length === 0) {
    return { ok: false, reason: "Belum ada soal di bank soal ini" };
  }
  if (id === "jodoh") {
    const n = buildPairs(questions).length;
    return n >= 3
      ? { ok: true }
      : { ok: false, reason: `Butuh ≥ 3 pasangan kunci unik — baru ada ${n}` };
  }
  if (id === "susun" || id === "cari") {
    const n = buildWords(questions).length;
    return n >= 1
      ? { ok: true }
      : { ok: false, reason: "Butuh kunci jawaban satu kata (4–10 huruf)" };
  }
  return { ok: true };
}

/**
 * Satu template ditandai "disarankan" berdasarkan komposisi tipe soal
 * (FR-TP-3).
 */
export function recommendedTemplate(questions: Question[]): TemplateId {
  if (questions.length === 0) return "kuis";
  const count = { pg: 0, bs: 0, isian: 0 };
  for (const q of questions) count[q.type] += 1;
  if (count.bs > count.pg && count.bs >= count.isian) return "bs";
  if (count.isian > count.pg && count.isian >= count.bs) return "isian";
  return "kuis";
}
