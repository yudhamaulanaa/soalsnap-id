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

/**
 * Satu pilihan jawaban.
 *
 * Bentuk `string` berarti pilihan teks biasa — itu bentuk yang dipakai hampir
 * semua soal, dan mempertahankannya membuat soal lama serta baris yang sudah
 * tersimpan tetap terbaca tanpa migrasi.
 *
 * Bentuk objek dipakai saat pilihannya berupa gambar: dokumen ujian kerap
 * menaruh bangun datar atau diagram sebagai pilihan A/B/C/D, dan memaksanya
 * menjadi teks berarti soalnya tidak bisa dijawab.
 */
export type Opsi = string | OpsiObjek;

export interface OpsiObjek {
  teks?: string;
  /** Kunci objek gambar pilihan di R2. */
  gambar?: string;
  /** Teks alternatif gambar pilihan, untuk pembaca layar. */
  gambarAlt?: string;
}

/** Teks satu pilihan; kosong berarti pilihannya murni gambar. */
export function teksOpsi(o: Opsi): string {
  return (typeof o === "string" ? o : (o.teks ?? "")).trim();
}

export function gambarOpsi(o: Opsi): string | undefined {
  return typeof o === "string" ? undefined : o.gambar;
}

export function altOpsi(o: Opsi): string | undefined {
  return typeof o === "string" ? undefined : o.gambarAlt;
}

/** Mengubah pilihan menjadi teks saja — dipakai saat gurunya menyunting. */
export function opsiTeks(o: Opsi, teks: string): Opsi {
  if (typeof o === "string") return teks;
  const { gambar, gambarAlt } = o;
  return gambar ? { teks, gambar, gambarAlt } : teks;
}

/**
 * Soal yang salah satu pilihannya berupa gambar. Mode yang seluruhnya berbasis
 * teks — Menjodohkan, Susun Kata, Cari Kata — melewatinya.
 */
export function punyaOpsiGambar(q: Question): boolean {
  return (q.opts ?? []).some((o) => gambarOpsi(o) !== undefined);
}

export interface Question {
  id: string;
  type: QType;
  /** Teks pertanyaan. */
  q: string;
  /** Opsi jawaban — wajib ≥ 2 untuk `pg` (FR-AI-6). */
  opts?: Opsi[];
  /** Kunci jawaban untuk `pg`/`bs` — indeks ke `opts`. */
  correct?: number;
  /** Kunci jawaban teks untuk `isian`. */
  key?: string;
  /** Kunci objek gambar soal di R2; kosong berarti soal murni teks. */
  gambar?: string;
  /** Teks alternatif gambar, untuk pembaca layar. */
  gambarAlt?: string;
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

/** "private" hanya lewat tautan; "public" ikut tampil di katalog. */
export type Visibility = "private" | "public";

export interface Activity {
  id: string;
  /**
   * Tautan rahasia pemilik. Hanya ikut dikirim pada respons yang memang
   * diminta lewat tautan itu — tidak pernah pada katalog atau halaman main.
   */
  editSlug?: string;
  /** Tautan yang dibagikan ke peserta. */
  playSlug: string;
  title: string;
  template: TemplateId;
  acak: boolean;
  timerOn: boolean;
  timerDetik: number;
  visibility: Visibility;
  kelas: string | null;
  mapel: string | null;
  /** Jumlah sesi main (FR-DB-1). */
  plays: number;
  questions: Question[];
  createdAt: number;
  creator?: Creator;
}

/** Kontak pembuat — dipakai untuk mengirimkan kembali tautannya. */
export interface Creator {
  name: string | null;
  email: string | null;
  phone: string | null;
}

/** Satu kali pengerjaan oleh peserta. */
export interface PlaySession {
  id: string;
  playerName: string | null;
  score: number;
  total: number;
  mode: string;
  createdAt: number;
}

/** Ringkasan katalog — tanpa soal & tanpa kunci jawaban. */
export interface CatalogItem {
  id: string;
  playSlug: string;
  title: string;
  template: TemplateId;
  kelas: string | null;
  mapel: string | null;
  plays: number;
  jumlahSoal: number;
  createdAt: number;
}

/** Draft yang sedang dikerjakan di alur Unggah → Review → Template → Bagikan. */
export interface Draft {
  origin: "upload" | "manual";
  files: UploadFileRef[];
  questions: Question[];
  sourcePages?: SourcePage[];
  /**
   * Token job pemrosesan setelah berkasnya terunggah. Tanpa akun, token inilah
   * izin memantau antrean dan mengambil hasilnya.
   */
  token?: string;
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
