import "server-only";
import { susunPesanTautan, type HasilKirim } from "./email/pesan";
import type { Creator } from "./types";

/**
 * Pengiriman tautan ke pembuat soal.
 *
 * Penyedia dipilih dari environment: bila RESEND_API_KEY dan EMAIL_FROM ada,
 * surel benar-benar dikirim lewat Resend; bila tidak, aplikasi tetap jalan dan
 * tautannya hanya dicatat ke log server. Penyedia lain (SMTP) cukup memenuhi
 * antarmuka `Pengirim` yang sama.
 */
export interface KirimTautan {
  kepada: Creator;
  judul: string;
  tautanEdit: string;
  tautanMain: string;
}

export type { HasilKirim };

export interface Pengirim {
  kirim(pesan: KirimTautan): Promise<HasilKirim>;
}

/** Batas tunggu penyedia; menyimpan aktivitas tidak boleh ikut menggantung. */
const BATAS_TUNGGU_MS = 10_000;

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

export function pengirimResend(apiKey: string, dari: string): Pengirim {
  return {
    async kirim(pesan) {
      const tujuan = pesan.kepada.email?.trim();
      if (!tujuan) return { terkirim: false, kode: "tanpa-email", alasan: "email tidak diisi" };

      const surat = susunPesanTautan({
        nama: pesan.kepada.name,
        judul: pesan.judul,
        tautanEdit: pesan.tautanEdit,
        tautanMain: pesan.tautanMain,
      });

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: dari,
            to: [tujuan],
            subject: surat.subjek,
            text: surat.teks,
            html: surat.html,
          }),
          signal: AbortSignal.timeout(BATAS_TUNGGU_MS),
        });

        if (!res.ok) {
          // Pesan penyedia dicatat lengkap, tetapi tidak diteruskan mentah ke
          // pengguna — cukup beri tahu bahwa pengirimannya gagal.
          const rinci = await res.text().catch(() => "");
          console.error(`[notify] Resend menolak (${res.status}): ${rinci}`);
          return { terkirim: false, kode: "gagal", alasan: "penyedia email menolak permintaan" };
        }
        return { terkirim: true, kode: "terkirim" };
      } catch (e) {
        console.error("[notify] pengiriman gagal:", e);
        const habisWaktu = e instanceof Error && e.name === "TimeoutError";
        return {
          terkirim: false,
          kode: "gagal",
          alasan: habisWaktu ? "penyedia email tidak merespons" : "pengiriman gagal",
        };
      }
    },
  };
}

/** Penyedia dibaca per pemanggilan agar perubahan env terasa tanpa build ulang. */
export function pengirimDariEnv(): Pengirim {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const dari = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !dari) return pengirimCatatan;
  return pengirimResend(apiKey, dari);
}

export const pengirim: Pengirim = {
  kirim: (pesan) => pengirimDariEnv().kirim(pesan),
};
