/**
 * Aturan gambar soal.
 *
 * Gambar soal disimpan di ruang nama sendiri (`soal/…`), terpisah dari dokumen
 * unggahan (`unggahan/…`). Pemisahan itu bukan kerapian belaka: rute penyaji
 * gambar hanya melayani prefiks `soal/`, sehingga kunci buatan penyerang tidak
 * bisa dipakai membaca dokumen milik orang lain.
 */
export const PREFIKS_GAMBAR = "soal/";

export const JENIS_GAMBAR = ["image/jpeg", "image/png", "image/webp"] as const;

/** Gambar satu soal jauh lebih kecil daripada dokumen sumber. */
export const MAX_GAMBAR_MB = 5;
export const MAX_GAMBAR_BYTE = MAX_GAMBAR_MB * 1024 * 1024;

/** Satu tingkat saja setelah `soal/`, dan tanpa karakter yang membentuk jalur. */
const POLA_KUNCI = /^soal\/[A-Za-z0-9._-]{1,120}$/;

export function kunciGambarSah(kunci: string): boolean {
  return POLA_KUNCI.test(kunci);
}

export function jenisGambarSah(contentType: string): boolean {
  const bersih = contentType.split(";")[0]!.trim().toLowerCase();
  return (JENIS_GAMBAR as readonly string[]).includes(bersih);
}

export function ekstensiGambar(contentType: string): string {
  const bersih = contentType.split(";")[0]!.trim().toLowerCase();
  if (bersih === "image/png") return "png";
  if (bersih === "image/webp") return "webp";
  return "jpg";
}

/**
 * Kunci tidak diturunkan dari id soal: soal ditulis ulang seluruhnya setiap kali
 * aktivitas disimpan, jadi idnya berganti dan kunci yang mengikutinya akan putus.
 */
export function kunciGambar(acak: string, contentType: string): string {
  const bersih = acak.replace(/[^A-Za-z0-9]/g, "").slice(0, 32) || "gambar";
  return `${PREFIKS_GAMBAR}${bersih}.${ekstensiGambar(contentType)}`;
}

export type PeriksaGambar = { ok: true } | { ok: false; alasan: string };

export function periksaGambar(contentType: string, ukuran: number): PeriksaGambar {
  if (!jenisGambarSah(contentType)) {
    return { ok: false, alasan: "Gambar harus JPG, PNG, atau WebP" };
  }
  if (!Number.isFinite(ukuran) || ukuran <= 0) {
    return { ok: false, alasan: "Gambarnya kosong" };
  }
  if (ukuran > MAX_GAMBAR_BYTE) {
    return { ok: false, alasan: `Gambar maksimal ${MAX_GAMBAR_MB} MB` };
  }
  return { ok: true };
}

/** Gambar selalu disajikan lewat rute proxy, tidak pernah dari URL bucket. */
export function urlGambar(kunci: string): string {
  return `/api/gambar/${kunci}`;
}
