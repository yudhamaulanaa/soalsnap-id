import { susunPesanTautan, type HasilKirim, type Pengirim, type PesanEmail } from "./pesan";

/**
 * Penyedia surel Mailgun.
 *
 * Konfigurasinya masuk sebagai parameter, bukan dibaca dari environment, agar
 * berkas ini tidak menyimpan rahasia apa pun dan bagian penyusunan
 * permintaannya bisa diuji langsung. Pembacaan environment ada di
 * `src/lib/notify.ts`.
 */
export interface KonfigurasiMailgun {
  apiKey: string;
  /** Domain pengirim terverifikasi, mis. `mail.soalsnap.web.id`. */
  domain: string;
  /** Alamat From lengkap, mis. `SoalSnap <tautan@mail.soalsnap.web.id>`. */
  dari: string;
  /** Alamat balasan; kosong berarti balasan kembali ke alamat From. */
  balasKe?: string;
  /** Ganti ke `https://api.eu.mailgun.net` untuk akun region Eropa. */
  pangkal?: string;
}

export const PANGKAL_BAWAAN = "https://api.mailgun.net";

/** Batas tunggu penyedia; menyimpan aktivitas tidak boleh ikut menggantung. */
const BATAS_TUNGGU_MS = 10_000;

export function alamatKirim(domain: string, pangkal: string = PANGKAL_BAWAAN): string {
  return `${pangkal.replace(/\/+$/, "")}/v3/${encodeURIComponent(domain)}/messages`;
}

/**
 * Badan permintaan Mailgun. Form-urlencoded sudah cukup — multipart baru perlu
 * kalau suatu saat ada lampiran.
 */
export function susunFormMailgun(opsi: {
  dari: string;
  tujuan: string;
  balasKe?: string;
  surat: PesanEmail;
}): URLSearchParams {
  const form = new URLSearchParams({
    from: opsi.dari,
    to: opsi.tujuan,
    subject: opsi.surat.subjek,
    text: opsi.surat.teks,
    html: opsi.surat.html,
  });
  const balasKe = opsi.balasKe?.trim();
  if (balasKe) form.set("h:Reply-To", balasKe);
  return form;
}

/** Mailgun memakai Basic auth dengan nama pengguna tetap `api`. */
function otorisasi(apiKey: string): string {
  return `Basic ${btoa(`api:${apiKey}`)}`;
}

export function pengirimMailgun(konfig: KonfigurasiMailgun): Pengirim {
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
        const res = await fetch(alamatKirim(konfig.domain, konfig.pangkal), {
          method: "POST",
          headers: {
            Authorization: otorisasi(konfig.apiKey),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: susunFormMailgun({
            dari: konfig.dari,
            tujuan,
            balasKe: konfig.balasKe,
            surat,
          }).toString(),
          signal: AbortSignal.timeout(BATAS_TUNGGU_MS),
        });

        if (!res.ok) {
          // Pesan penyedia dicatat lengkap, tetapi tidak diteruskan mentah ke
          // pengguna — cukup beri tahu bahwa pengirimannya gagal.
          const rinci = await res.text().catch(() => "");
          console.error(`[notify] Mailgun menolak (${res.status}): ${rinci}`);
          return {
            terkirim: false,
            kode: "gagal",
            alasan: "penyedia email menolak permintaan",
          } satisfies HasilKirim;
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
