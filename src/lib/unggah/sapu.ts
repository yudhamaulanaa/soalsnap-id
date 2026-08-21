import "server-only";
import { prisma } from "../db";
import { hapusObjek } from "../r2";
import { kunciGambarSah } from "./gambar";
import { dipakaiSalahSatu } from "./pemakai";

/**
 * Membuang objek gambar yang tidak lagi dipakai soal mana pun.
 *
 * Dipanggil setelah barisnya hilang dari basis data, dan setiap kunci diperiksa
 * ulang: satu gambar bisa saja masih dipakai aktivitas lain, dan menghapusnya
 * akan merusak soal yang tidak bersalah. Pemakaian sebagai gambar pilihan ikut
 * dihitung (lihat `dipakaiOleh`).
 */
export async function sapuGambar(
  kunci: (string | null | undefined)[],
): Promise<void> {
  const calon = [
    ...new Set(
      kunci.filter((k): k is string => Boolean(k) && kunciGambarSah(k!)),
    ),
  ];
  if (calon.length === 0) return;

  // Satu kueri untuk menyaring calon, lalu tiap kunci diperiksa terhadap baris
  // yang tersisa — gambar pilihan tidak punya kolom sendiri untuk dicocokkan.
  const masihDipakai = await prisma.question.findMany({
    where: dipakaiSalahSatu(calon),
    select: { gambar: true, opts: true },
  });

  const yatim = calon.filter(
    (k) =>
      !masihDipakai.some(
        (q) => q.gambar === k || (q.opts ?? "").includes(`"${k}"`),
      ),
  );
  await hapusObjek(yatim);
}
