/**
 * Token tautan masuk.
 *
 * Yang disimpan di basis data adalah hash-nya, bukan tokennya: basis data yang
 * bocor tidak boleh berubah menjadi izin masuk ke akun siapa pun. Berkas ini
 * bebas I/O supaya bentuk dan hash-nya bisa diuji langsung.
 */
export const UMUR_TOKEN_MENIT = 15;
export const UMUR_TOKEN_MS = UMUR_TOKEN_MENIT * 60 * 1000;

/** 32 byte acak — cukup lebar untuk membuat tebakan tidak masuk akal. */
export function buatTokenMasuk(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let biner = "";
  for (const b of bytes) biner += String.fromCharCode(b);
  return btoa(biner).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Bentuknya diperiksa sebelum menyentuh basis data. */
export function bentukTokenSah(token: string): boolean {
  return /^[A-Za-z0-9_-]{32,64}$/.test(token);
}

export async function hashTokenMasuk(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Alamat dinormalkan supaya "Rina@Sekolah.id" dan "rina@sekolah.id" satu akun. */
export function normalkanEmail(email: string): string {
  return email.trim().toLowerCase();
}
