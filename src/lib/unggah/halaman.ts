import { PDFDocument } from "pdf-lib";
import type { JenisBerkas } from "./berkas";

/**
 * Jumlah halaman sebenarnya dari satu berkas.
 *
 * Gambar dan teks selalu satu halaman. PDF harus benar-benar dibaca — klien
 * hanya menebak satu, dan tebakan itu tidak boleh menjadi dasar penegakan
 * batas halaman (FR-UP-5).
 */
export async function hitungHalaman(jenis: JenisBerkas, isi: Uint8Array): Promise<number> {
  if (jenis !== "pdf") return 1;
  try {
    // PDF berkata sandi tetap dihitung halamannya; kalau isinya tidak terbaca,
    // worker yang akan melaporkannya nanti.
    const dokumen = await PDFDocument.load(isi, { ignoreEncryption: true });
    return Math.max(1, dokumen.getPageCount());
  } catch (e) {
    console.error("[unggah] gagal membaca PDF:", e);
    return 1;
  }
}
