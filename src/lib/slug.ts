/**
 * Tautan rahasia menggantikan akun pengguna: siapa pun yang memegang
 * `editSlug` boleh menyunting soal, siapa pun yang memegang `playSlug` boleh
 * mengerjakannya. Karena itu slug harus sulit ditebak, bukan sekadar pendek.
 */

// Tanpa huruf/angka yang mudah tertukar saat dibacakan (I, O, 0, 1).
const ABJAD = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function acak(panjang: number): string {
  const buf = new Uint32Array(panjang);
  crypto.getRandomValues(buf);
  let s = "";
  for (let i = 0; i < panjang; i++) s += ABJAD[buf[i] % ABJAD.length];
  return s;
}

/** Tautan peserta — cukup pendek untuk didikte di kelas (~30 bit). */
export function buatPlaySlug(): string {
  return acak(6);
}

/**
 * Tautan pemilik — satu-satunya kunci menuju hak sunting, jadi dibuat jauh
 * lebih panjang (~110 bit) agar tidak bisa ditebak dengan menyisir.
 */
export function buatEditSlug(): string {
  return acak(22);
}
