import "server-only";
import { prisma } from "../db";
import { hapusObjek } from "../r2";
import { kunciGambarSah } from "./gambar";

/**
 * Membuang objek gambar yang tidak lagi dipakai soal mana pun.
 *
 * Dipanggil setelah barisnya hilang dari basis data, dan setiap kunci diperiksa
 * ulang: satu gambar bisa saja masih dipakai aktivitas lain, dan menghapusnya
 * akan merusak soal yang tidak bersalah.
 */
export async function sapuGambar(kunci: (string | null | undefined)[]): Promise<void> {
  const calon = [...new Set(kunci.filter((k): k is string => Boolean(k) && kunciGambarSah(k!)))];
  if (calon.length === 0) return;

  const masihDipakai = await prisma.question.findMany({
    where: { gambar: { in: calon } },
    select: { gambar: true },
  });
  const dipakai = new Set(masihDipakai.map((q) => q.gambar));

  await hapusObjek(calon.filter((k) => !dipakai.has(k)));
}
