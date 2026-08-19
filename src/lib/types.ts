/** Model data — mengikuti `frd.md` §8 (Aturan data). */

/** Tipe soal yang dikenali mesin AI (FR-AI-3). Tipe tak dikenal jatuh ke `isian`. */
export type QType = "pg" | "bs" | "isian";

/** Delapan template latihan (FR-TP-1). */
export type TemplateId =
  | "kuis"
  | "bs"
  | "isian"
  | "jodoh"
  | "flashcard"
  | "susun"
  | "cari"
  | "cepat";

/** Mode main yang benar-benar berbeda mekaniknya. */
export type PlayMode = "kuis" | "jodoh" | "flash" | "susun" | "cari";

export interface Question {
  id: string;
  type: QType;
  /** Teks pertanyaan. */
  q: string;
  /** Opsi jawaban — wajib ≥ 2 untuk `pg` (FR-AI-6). */
  opts?: string[];
  /** Kunci jawaban untuk `pg`/`bs` — indeks ke `opts`. */
  correct?: number;
  /** Kunci jawaban teks untuk `isian`. */
  key?: string;
  /** Skor keyakinan AI 0–100 (FR-AI-2). */
  conf: number;
  /** Ditandai bila `conf` < AMBANG_KEYAKINAN (FR-AI-5). */
  low?: boolean;
  /** Catatan penyebab tanda periksa (FR-AI-5). */
  note?: string;
  /** Label pendek untuk mode Menjodohkan & Susun Kata. */
  clue?: string;
  /** Halaman asal pada dokumen sumber (FR-AI-2). */
  page?: number;
  sumber: "upload" | "manual";
}

export interface UploadFileRef {
  id: string;
  name: string;
  size: string;
  kind: "image" | "pdf" | "docx" | "text";
  /**
   * Jumlah halaman yang dihitung terhadap batas unggahan (FR-UP-5).
   * Gambar & teks = 1; jumlah halaman PDF/DOCX baru diketahui pasti setelah
   * dokumen dibaca di sisi server, jadi di klien dihitung 1 sebagai perkiraan.
   */
  pages: number;
}

/** Ringkasan halaman sumber, tampil di panel kiri layar Review (FR-RV-8). */
export interface SourcePage {
  page: number;
  count: number;
}

export interface Activity {
  id: string;
  slug: string;
  title: string;
  template: TemplateId;
  acak: boolean;
  timerOn: boolean;
  timerDetik: number;
  status: "draft" | "published";
  /** Jumlah sesi main (FR-DB-1). */
  plays: number;
  questions: Question[];
  createdAt: number;
  /** Aktivitas yang baru dipublikasikan diberi tanda BARU (FR-DB-4). */
  fresh?: boolean;
  sourcePages?: SourcePage[];
}

/** Draft yang sedang dikerjakan di alur Unggah → Review → Template → Bagikan. */
export interface Draft {
  origin: "upload" | "manual";
  files: UploadFileRef[];
  questions: Question[];
  sourcePages?: SourcePage[];
  /** Soal yang sedang dalam mode edit di layar Review (FR-RV-3, FR-RV-7). */
  editingId?: string | null;
}

/** Batas unggahan (FR-UP-5). */
export const MAX_FILE_MB = 10;
export const MAX_PAGES_PER_UPLOAD = 20;

/** Soal di bawah ambang ini ditandai "perlu diperiksa" (FR-AI-5, PRD §7). */
export const AMBANG_KEYAKINAN = 80;

/** Kuis Cepat memakai maksimum 8 detik per soal (FR-PL-3). */
export const TIMER_KUIS_CEPAT = 8;
export const TIMER_MIN = 5;
export const TIMER_MAX = 60;
export const TIMER_DEFAULT = 20;
