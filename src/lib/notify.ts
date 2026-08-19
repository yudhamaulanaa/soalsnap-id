import "server-only";
import type { Creator } from "./types";

/**
 * Pengiriman tautan ke pembuat soal.
 *
 * Belum ada penyedia email yang dipasang, jadi implementasi bawaan hanya
 * mencatat ke log server: tautan tetap ditampilkan di layar dan kontaknya
 * tersimpan di basis data. Untuk mengaktifkan pengiriman sungguhan, ganti
 * `pengirim` dengan implementasi Resend/SMTP — sisa aplikasi tidak berubah.
 */
export interface KirimTautan {
  kepada: Creator;
  judul: string;
  tautanEdit: string;
  tautanMain: string;
}

export interface Pengirim {
  kirim(pesan: KirimTautan): Promise<{ terkirim: boolean; alasan?: string }>;
}

export const pengirimCatatan: Pengirim = {
  async kirim(pesan) {
    if (!pesan.kepada.email) {
      return { terkirim: false, alasan: "email tidak diisi" };
    }
    console.info(
      `[notify] tautan "${pesan.judul}" untuk ${pesan.kepada.email} — ` +
        `edit: ${pesan.tautanEdit} · main: ${pesan.tautanMain}`,
    );
    return { terkirim: false, alasan: "penyedia email belum dipasang" };
  },
};

export const pengirim: Pengirim = pengirimCatatan;
