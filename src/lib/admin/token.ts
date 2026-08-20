import { bandingTetap, buatTiket as buatTiketUmum, bacaTiket, type Tiket } from "../tiket";

/**
 * Tiket sesi admin — tiket bertanda tangan biasa dengan muatan tetap.
 *
 * Primitifnya ada di `src/lib/tiket.ts` dan dipakai bersama sesi pengguna,
 * supaya hanya ada satu implementasi HMAC di seluruh aplikasi.
 */
const UMUR_MS = 8 * 60 * 60 * 1000;
const MUATAN = "admin";

export { bandingTetap };
export type { Tiket };

export function buatTiket(rahasia: string, sekarang = Date.now()): Promise<Tiket> {
  return buatTiketUmum(MUATAN, rahasia, UMUR_MS, sekarang);
}

export async function tiketSah(
  tiket: string | undefined | null,
  rahasia: string,
  sekarang = Date.now(),
): Promise<boolean> {
  return (await bacaTiket(tiket, rahasia, sekarang)) === MUATAN;
}
