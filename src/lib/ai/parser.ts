import type { Question, SourcePage, UploadFileRef } from "../types";
import { AMBANG_KEYAKINAN } from "../types";

/**
 * Kontrak mesin pemrosesan dokumen (blueprint.md §7).
 *
 * Implementasi saat ini adalah simulasi (`mockParser`) — alur, progres, dan
 * bentuk keluarannya sudah persis seperti pipeline sungguhan, sehingga
 * mengganti ke model vision nanti cukup menukar implementasi di sini.
 */

/** Tahap yang ditampilkan di layar Proses AI (FR-AI-1). */
export const STAGES = [
  { label: "Membaca teks & gambar (OCR)", at: 0 },
  { label: "Mendeteksi nomor & tipe soal", at: 30 },
  { label: "Mencocokkan kunci jawaban", at: 58 },
  { label: "Menyusun draft latihan", at: 84 },
] as const;

export interface ParseRequest {
  files: UploadFileRef[];
}

export interface ParseResult {
  questions: Question[];
  sourcePages: SourcePage[];
}

export interface ParseOptions {
  /** Dipanggil tiap pembaruan progres, 0–100. */
  onProgress?: (pct: number) => void;
  /** Pengali kecepatan simulasi (properti prototype `kecepatanAI`). */
  speed?: number;
  signal?: AbortSignal;
}

export interface QuestionParser {
  parse(request: ParseRequest, options?: ParseOptions): Promise<ParseResult>;
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/**
 * Validasi keluaran (FR-AI-6): opsi ≥ 2 untuk `pg`, indeks kunci valid, teks
 * tidak kosong. Soal yang gagal validasi tetap ditampilkan dengan tanda —
 * tidak dibuang senyap.
 */
export function validateQuestions(questions: Question[]): Question[] {
  return questions.map((q) => {
    const problems: string[] = [];
    if (!q.q.trim()) problems.push("teks soal kosong");
    if (q.type === "pg" && (q.opts?.length ?? 0) < 2) problems.push("opsi kurang dari dua");
    if (q.type !== "isian") {
      const i = q.correct ?? -1;
      if (i < 0 || i >= (q.opts?.length ?? 0)) problems.push("kunci jawaban belum ditandai");
    } else if (!q.key?.trim()) {
      problems.push("kunci jawaban belum diisi");
    }

    const low = q.conf < AMBANG_KEYAKINAN || problems.length > 0;
    if (!low) return { ...q, low: false, note: undefined };

    return {
      ...q,
      low: true,
      note:
        problems.length > 0
          ? `Perlu dilengkapi: ${problems.join(", ")}.`
          : (q.note ??
            "Foto agak buram di nomor ini — pastikan kunci jawabannya sudah benar."),
    };
  });
}
