import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { bandingTetap, buatTiket, tiketSah, type Tiket } from "./token";

export const COOKIE_ADMIN = "soalsnap_admin";

function sandiAdmin(): string | null {
  const sandi = process.env.ADMIN_PASSWORD?.trim();
  return sandi ? sandi : null;
}

/** Tanpa ADMIN_PASSWORD, halaman admin mati total — tidak ada sandi bawaan. */
export function adminDikonfigurasi(): boolean {
  return sandiAdmin() !== null;
}

function rahasiaTandaTangan(): string | null {
  const sandi = sandiAdmin();
  if (!sandi) return null;
  // Tanpa ADMIN_SECRET terpisah, sandi itu sendiri menjadi kunci tanda tangan:
  // mengganti sandi otomatis membatalkan semua sesi yang masih berjalan.
  return process.env.ADMIN_SECRET?.trim() || sandi;
}

export function sandiCocok(masukan: string): boolean {
  const benar = sandiAdmin();
  if (!benar) return false;
  return bandingTetap(masukan, benar);
}

export async function buatTiketAdmin(): Promise<Tiket | null> {
  const rahasia = rahasiaTandaTangan();
  return rahasia ? buatTiket(rahasia) : null;
}

export async function sesiAdminSah(): Promise<boolean> {
  const rahasia = rahasiaTandaTangan();
  if (!rahasia) return false;
  const jar = await cookies();
  return tiketSah(jar.get(COOKIE_ADMIN)?.value, rahasia);
}

/**
 * Penjaga halaman admin. Dipanggil di setiap halaman, bukan hanya di layout,
 * supaya satu halaman yang lupa dibungkus tidak menjadi celah.
 */
export async function pastikanAdmin(): Promise<void> {
  if (!(await sesiAdminSah())) redirect("/admin/masuk");
}
