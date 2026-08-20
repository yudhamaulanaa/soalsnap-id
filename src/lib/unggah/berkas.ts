import { MAX_FILE_MB, MAX_PAGES_PER_UPLOAD, type UploadFileRef } from "../types";

/**
 * Aturan berkas unggahan (FR-UP-5).
 *
 * Berkas ini bebas I/O dan bebas environment supaya seluruh aturannya bisa
 * diuji langsung. Klien memakainya untuk memberi peringatan lebih awal, dan
 * server memakainya lagi sebagai penjaga sebenarnya — pemeriksaan di klien
 * hanya kenyamanan, bukan batas.
 */
export type JenisBerkas = UploadFileRef["kind"];

/** Tipe konten yang sah untuk tiap jenis. */
export const JENIS_DITERIMA: Record<JenisBerkas, readonly string[]> = {
  image: ["image/jpeg", "image/png", "image/webp"],
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  text: ["text/plain"],
};

/** Satu unggahan tidak boleh melebihi batas halaman, jadi berkas pun sebanyak itu. */
export const MAX_BERKAS = MAX_PAGES_PER_UPLOAD;

export const MAX_UKURAN_BYTE = MAX_FILE_MB * 1024 * 1024;

/** Ekstensi → tipe konten, untuk peramban yang menyerahkan berkas tanpa tipe. */
const TIPE_EKSTENSI: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

export function tipeBerkas(nama: string, tipe: string | undefined | null): string {
  const dari = tipe?.split(";")[0]?.trim().toLowerCase();
  if (dari) return dari;
  const ekstensi = nama.split(".").pop()?.toLowerCase() ?? "";
  return TIPE_EKSTENSI[ekstensi] ?? "application/octet-stream";
}

export function jenisDari(contentType: string): JenisBerkas | null {
  const bersih = contentType.split(";")[0]!.trim().toLowerCase();
  for (const [jenis, daftar] of Object.entries(JENIS_DITERIMA)) {
    if (daftar.includes(bersih)) return jenis as JenisBerkas;
  }
  return null;
}

/**
 * Nama berkas dari pengguna hanya dipakai sebagai label dan bagian kunci objek.
 * Komponen direktori dibuang supaya "../" tidak pernah ikut membentuk kunci.
 */
export function namaAman(nama: string): string {
  const dasar = nama.split(/[\\/]/).pop() ?? "";
  const bersih = dasar
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+/, "")
    .slice(0, 80);
  return bersih || "berkas";
}

/** Kunci objek R2. Job-nya menjadi awalan supaya berkas satu job mudah disapu. */
export function kunciObjek(jobId: string, urutan: number, nama: string): string {
  return `unggahan/${jobId}/${String(urutan).padStart(2, "0")}-${namaAman(nama)}`;
}

export interface BerkasMasuk {
  nama: string;
  contentType: string;
  ukuran: number;
}

export type HasilPeriksa = { ok: true; jenis: JenisBerkas } | { ok: false; alasan: string };

export function periksaBerkas(berkas: BerkasMasuk): HasilPeriksa {
  const jenis = jenisDari(berkas.contentType);
  if (!jenis) return { ok: false, alasan: `${berkas.nama}: jenis berkas tidak didukung` };
  if (!Number.isFinite(berkas.ukuran) || berkas.ukuran <= 0) {
    return { ok: false, alasan: `${berkas.nama}: berkas kosong` };
  }
  if (berkas.ukuran > MAX_UKURAN_BYTE) {
    return { ok: false, alasan: `${berkas.nama} melebihi ${MAX_FILE_MB} MB` };
  }
  return { ok: true, jenis };
}

export type HasilPeriksaDaftar =
  | { ok: true; jenis: JenisBerkas[] }
  | { ok: false; alasan: string };

export function periksaDaftar(daftar: BerkasMasuk[]): HasilPeriksaDaftar {
  if (daftar.length === 0) return { ok: false, alasan: "Tidak ada berkas yang dipilih" };
  if (daftar.length > MAX_BERKAS) {
    return { ok: false, alasan: `Satu unggahan maksimal ${MAX_BERKAS} berkas` };
  }

  const jenis: JenisBerkas[] = [];
  for (const berkas of daftar) {
    const hasil = periksaBerkas(berkas);
    if (!hasil.ok) return hasil;
    jenis.push(hasil.jenis);
  }
  return { ok: true, jenis };
}

/**
 * Batas halaman baru bisa ditegakkan setelah dokumen dibaca di server — gambar
 * dan teks selalu satu halaman, sedangkan PDF baru diketahui setelah dihitung.
 */
export function periksaTotalHalaman(halaman: number[]): HasilPeriksa | { ok: true } {
  const total = halaman.reduce((n, h) => n + h, 0);
  if (total > MAX_PAGES_PER_UPLOAD) {
    return {
      ok: false,
      alasan: `Satu unggahan maksimal ${MAX_PAGES_PER_UPLOAD} halaman; dokumenmu ${total} halaman.`,
    };
  }
  return { ok: true };
}
