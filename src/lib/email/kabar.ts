import type { HasilKirim } from "./pesan";

/**
 * Menerjemahkan hasil penyimpanan kontak menjadi satu kalimat untuk pembuat
 * soal. Dipisah dari komponen supaya kalimatnya bisa diuji tanpa merender.
 */
export interface Kabar {
  teks: string;
  baik: boolean;
}

export function kabarKontak(opsi: {
  tersimpan: boolean;
  email: string;
  notifikasi?: HasilKirim;
}): Kabar {
  if (!opsi.tersimpan) return { teks: "Gagal menyimpan kontak. Coba lagi, ya.", baik: false };

  const email = opsi.email.trim();
  const kode = opsi.notifikasi?.kode;
  if (!email || kode === "tanpa-email") {
    return { teks: "Kontak tersimpan. Isi email kalau mau tautannya dikirim.", baik: true };
  }

  switch (kode) {
    case "terkirim":
      return { teks: `Tersimpan. Tautan sudah dikirim ke ${email}.`, baik: true };
    case "sudah-dikirim":
      return { teks: `Tersimpan. Tautan sudah pernah dikirim ke ${email}.`, baik: true };
    case "belum-dikonfigurasi":
      return {
        teks: "Tersimpan, tapi pengiriman email belum aktif di server ini — salin tautannya dulu, ya.",
        baik: false,
      };
    case "gagal":
      return {
        teks: "Tersimpan, tapi tautannya gagal dikirim — salin dulu tautannya, lalu coba lagi.",
        baik: false,
      };
    default:
      return { teks: "Kontak tersimpan.", baik: true };
  }
}
