/**
 * Isi surel "Kirimkan tautannya ke saya" pada halaman Bagikan.
 *
 * Berkas ini sengaja bebas dari `server-only` dan dari I/O apa pun: isinya
 * murni penyusunan teks, sehingga bisa diuji langsung tanpa server berjalan.
 * Pengirimannya sendiri ada di `src/lib/notify.ts`.
 */

export interface IsiTautan {
  nama: string | null;
  judul: string;
  tautanEdit: string;
  tautanMain: string;
}

export interface PesanEmail {
  subjek: string;
  teks: string;
  html: string;
}

/** Sebab tautan tidak jadi dikirim, sebelum penyedia surel disentuh. */
export type AlasanTakKirim = "tanpa-email" | "sudah-dikirim";

/** Hasil akhir satu upaya pengiriman, dipakai UI untuk memilih kalimat. */
export type KodeKirim = AlasanTakKirim | "terkirim" | "belum-dikonfigurasi" | "gagal";

export interface KeputusanKirim {
  kirim: boolean;
  kode?: AlasanTakKirim;
  alasan?: string;
}

/** Hasil satu upaya pengiriman; ikut dikembalikan API ke pemilik soal. */
export interface HasilKirim {
  terkirim: boolean;
  kode: KodeKirim;
  alasan?: string;
}

/** Satu surat siap kirim. Penyedia tidak perlu tahu isinya tentang apa. */
export interface SuratKeluar {
  kepada: string;
  /** Nama penerima, bila diketahui; sebagian penyedia memakainya di header To. */
  nama?: string | null;
  pesan: PesanEmail;
}

/**
 * Kontrak penyedia surel. Ditaruh di sini, bukan di `notify.ts`, supaya modul
 * penyedia bisa memakainya tanpa saling mengimpor dengan pemilih penyedianya.
 */
export interface Pengirim {
  kirim(surat: SuratKeluar): Promise<HasilKirim>;
}

/**
 * Judul dan nama datang dari pengguna, jadi keduanya diloloskan dulu sebelum
 * masuk ke badan HTML surel.
 */
export function escapeHtml(nilai: string): string {
  return nilai
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Perbandingan alamat untuk penjaga kirim-ulang; beda huruf besar bukan alamat baru. */
export function alamatSama(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Tautan hanya dikirim saat pembuatnya benar-benar meminta alamat baru.
 * Menyimpan kontak berulang kali dengan alamat yang sama tidak memicu surel
 * kedua; mengganti alamat (mis. salah ketik) memicu kirim ulang ke alamat baru.
 */
export function perluKirim(
  email: string | null | undefined,
  sudahDikirimKe: string | null | undefined,
): KeputusanKirim {
  const tujuan = email?.trim();
  if (!tujuan) return { kirim: false, kode: "tanpa-email", alasan: "email tidak diisi" };
  if (sudahDikirimKe && alamatSama(sudahDikirimKe, tujuan)) {
    return {
      kirim: false,
      kode: "sudah-dikirim",
      alasan: "tautan sudah pernah dikirim ke alamat ini",
    };
  }
  return { kirim: true };
}

const JUDUL_KOSONG = "Latihan tanpa judul";

export function susunPesanTautan(isi: IsiTautan): PesanEmail {
  const judul = isi.judul.trim() || JUDUL_KOSONG;
  const nama = isi.nama?.trim();
  const sapaan = nama ? `Halo ${nama},` : "Halo,";

  const teks = [
    sapaan,
    "",
    `Ini tautan untuk latihan "${judul}".`,
    "",
    "TAUTAN SISWA — bagikan ini",
    isi.tautanMain,
    "",
    "TAUTAN EDIT — simpan, jangan dibagikan",
    isi.tautanEdit,
    "",
    "Tanpa akun, tautan edit itulah satu-satunya kunci untuk mengubah soal ini",
    "nanti. Siapa pun yang memilikinya bisa menyunting dan menghapus latihanmu,",
    "jadi simpan baik-baik.",
    "",
    "— SoalSnap",
  ].join("\n");

  return { subjek: `Tautan latihan "${judul}" — SoalSnap`, teks, html: susunHtml(isi, judul, sapaan) };
}

/**
 * Gaya ditulis inline: klien surel membuang <style> dan kelas Tailwind.
 * Warnanya diambil dari token yang sama dengan aplikasi (globals.css).
 */
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Kartu pembungkus yang sama untuk seluruh surel SoalSnap. */
function bungkusHtml(isi: string): string {
  return `<div style="margin:0;padding:24px;background:#f2f4f1;font-family:${FONT};color:#182420">
  <div style="max-width:520px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e3e7e2;border-radius:20px">
${isi}
    <p style="margin:16px 0 0;font-size:13px;font-weight:700;color:#0e8a7b">— SoalSnap</p>
  </div>
</div>`;
}

function susunHtml(isi: IsiTautan, judul: string, sapaan: string): string {
  const j = escapeHtml(judul);
  const main = escapeHtml(isi.tautanMain);
  const edit = escapeHtml(isi.tautanEdit);

  const kotak = (
    label: string,
    warnaLabel: string,
    latar: string,
    warnaTeks: string,
    url: string,
  ) => `
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.08em;color:${warnaLabel}">
        ${label}
      </p>
      <p style="margin:0 0 20px;padding:13px 16px;background:${latar};border-radius:12px;font-size:15px;font-weight:600;word-break:break-all">
        <a href="${url}" style="color:${warnaTeks};text-decoration:none">${url}</a>
      </p>`;

  return bungkusHtml(`    <p style="margin:0 0 4px;font-size:15px;color:#41544e">${escapeHtml(sapaan)}</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;line-height:1.3">
      Ini tautan untuk latihan &ldquo;${j}&rdquo;
    </h1>
${kotak("TAUTAN SISWA — bagikan ini", "#8a968f", "#f2f4f1", "#0a6e62", main)}
${kotak("TAUTAN EDIT — simpan, jangan dibagikan", "#92610a", "#fdf0d5", "#92610a", edit)}
    <p style="margin:0;padding-top:20px;border-top:1px solid #eef1ee;font-size:13px;line-height:1.6;color:#5b6963">
      Tanpa akun, tautan edit itulah satu-satunya kunci untuk mengubah soal ini
      nanti. Siapa pun yang memilikinya bisa menyunting dan menghapus latihanmu,
      jadi simpan baik-baik.
    </p>`);
}

/** Surel tautan masuk. Tautannya sekali pakai dan berumur pendek. */
export function susunPesanMasuk(opsi: {
  nama: string | null;
  tautan: string;
  umurMenit: number;
}): PesanEmail {
  const nama = opsi.nama?.trim();
  const sapaan = nama ? `Halo ${nama},` : "Halo,";
  const t = escapeHtml(opsi.tautan);

  const teks = [
    sapaan,
    "",
    "Buka tautan ini untuk masuk ke SoalSnap:",
    opsi.tautan,
    "",
    `Tautannya berlaku ${opsi.umurMenit} menit dan hanya bisa dipakai sekali.`,
    "Kalau kamu tidak meminta tautan ini, abaikan saja surel ini — tidak ada",
    "yang berubah pada akunmu.",
    "",
    "— SoalSnap",
  ].join("\n");

  const html = bungkusHtml(`    <p style="margin:0 0 4px;font-size:15px;color:#41544e">${escapeHtml(sapaan)}</p>
    <h1 style="margin:0 0 18px;font-size:22px;font-weight:800;line-height:1.3">
      Masuk ke SoalSnap
    </h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#41544e">
      Klik tombol di bawah untuk masuk. Tautannya berlaku ${opsi.umurMenit} menit
      dan hanya bisa dipakai sekali.
    </p>
    <p style="margin:0 0 20px">
      <a href="${t}" style="display:inline-block;padding:14px 28px;background:#0e8a7b;border-radius:999px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">
        Masuk ke SoalSnap
      </a>
    </p>
    <p style="margin:0 0 20px;font-size:12.5px;line-height:1.6;color:#8a968f;word-break:break-all">
      Kalau tombolnya tidak bekerja, salin tautan ini:<br />${t}
    </p>
    <p style="margin:0;padding-top:20px;border-top:1px solid #eef1ee;font-size:13px;line-height:1.6;color:#5b6963">
      Kalau kamu tidak meminta tautan ini, abaikan saja surel ini — tidak ada yang
      berubah pada akunmu.
    </p>`);

  return { subjek: "Tautan masuk ke SoalSnap", teks, html };
}
