import "server-only";
import { pengirimMailgun } from "./email/mailgun";
import type { HasilKirim, KirimTautan, Pengirim } from "./email/pesan";

/**
 * Pengiriman tautan ke pembuat soal.
 *
 * Penyedia dipilih dari environment: bila MAILGUN_API_KEY, MAILGUN_DOMAIN, dan
 * EMAIL_FROM terisi, surel benar-benar dikirim lewat Mailgun; bila tidak,
 * aplikasi tetap jalan dan tautannya hanya dicatat ke log server. Penyedia lain
 * cukup memenuhi antarmuka `Pengirim` yang sama.
 */
export type { HasilKirim, KirimTautan, Pengirim };

export const pengirimCatatan: Pengirim = {
  async kirim(pesan) {
    if (!pesan.kepada.email) {
      return { terkirim: false, kode: "tanpa-email", alasan: "email tidak diisi" };
    }
    console.info(
      `[notify] tautan "${pesan.judul}" untuk ${pesan.kepada.email} — ` +
        `edit: ${pesan.tautanEdit} · main: ${pesan.tautanMain}`,
    );
    return { terkirim: false, kode: "belum-dikonfigurasi", alasan: "penyedia email belum dipasang" };
  },
};

/** Penyedia dibaca per pemanggilan agar perubahan env terasa tanpa build ulang. */
export function pengirimDariEnv(): Pengirim {
  const apiKey = process.env.MAILGUN_API_KEY?.trim();
  const domain = process.env.MAILGUN_DOMAIN?.trim();
  const dari = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !domain || !dari) return pengirimCatatan;

  return pengirimMailgun({
    apiKey,
    domain,
    dari,
    balasKe: process.env.EMAIL_REPLY_TO?.trim() || undefined,
    pangkal: process.env.MAILGUN_BASE_URL?.trim() || undefined,
  });
}

export const pengirim: Pengirim = {
  kirim: (pesan) => pengirimDariEnv().kirim(pesan),
};
