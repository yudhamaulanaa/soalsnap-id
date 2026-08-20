import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "../db";
import { bacaTiket, buatTiket, type Tiket } from "../tiket";

/**
 * Sesi pengguna.
 *
 * Akun bersifat tambahan: seluruh aplikasi tetap bisa dipakai tanpa masuk, dan
 * tautan sunting tetap menjadi izin menyunting satu aktivitas. Sesi hanya
 * menjawab "aktivitas ini milik siapa" supaya bisa dikumpulkan lintas perangkat.
 */
export const COOKIE_SESI = "soalsnap_sesi";

const UMUR_MS = 30 * 24 * 60 * 60 * 1000;

function rahasia(): string | null {
  return process.env.AUTH_SECRET?.trim() || null;
}

/** Tanpa AUTH_SECRET, fitur masuk tertutup — tidak ada kunci bawaan. */
export function authDikonfigurasi(): boolean {
  return rahasia() !== null;
}

export async function buatSesi(userId: string): Promise<Tiket | null> {
  const kunci = rahasia();
  return kunci ? buatTiket(userId, kunci, UMUR_MS) : null;
}

export interface PenggunaSesi {
  id: string;
  email: string;
  nama: string | null;
}

export async function penggunaSaatIni(): Promise<PenggunaSesi | null> {
  const kunci = rahasia();
  if (!kunci) return null;

  const jar = await cookies();
  const userId = await bacaTiket(jar.get(COOKIE_SESI)?.value, kunci);
  if (!userId) return null;

  // Akun yang sudah dihapus tidak boleh tetap dianggap masuk hanya karena
  // cookie-nya masih bertanda tangan sah.
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, nama: true },
  });
}

export async function wajibMasuk(): Promise<PenggunaSesi> {
  const pengguna = await penggunaSaatIni();
  if (!pengguna) redirect("/masuk");
  return pengguna;
}
