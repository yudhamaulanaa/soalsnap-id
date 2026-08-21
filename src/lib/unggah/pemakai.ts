import type { Prisma } from "@/generated/prisma/client";

/**
 * Menemukan soal yang memakai satu kunci gambar.
 *
 * Kunci gambar bisa berada di dua tempat: kolom `gambar` untuk gambar soal, dan
 * di dalam JSON `opts` bila pilihan jawabannya berupa gambar. Melupakan yang
 * kedua punya dua akibat yang sama-sama buruk — gambar pilihan pada aktivitas
 * yang sudah diturunkan tetap tersaji, dan penyapu menghapus gambar yang masih
 * dipakai soal hidup.
 *
 * `opts` disimpan sebagai teks JSON (SQLite tidak punya tipe JSON), jadi
 * pencocokannya lewat substring. Kuncinya dikelilingi tanda kutip supaya yang
 * cocok adalah nilai JSON utuh, bukan potongan nama yang kebetulan mirip.
 */
export function dipakaiOleh(kunci: string): Prisma.QuestionWhereInput {
  return { OR: [{ gambar: kunci }, { opts: { contains: `"${kunci}"` } }] };
}

export function dipakaiSalahSatu(
  kunci: readonly string[],
): Prisma.QuestionWhereInput {
  return {
    OR: kunci.flatMap((k) => dipakaiOleh(k).OR as Prisma.QuestionWhereInput[]),
  };
}

/**
 * Seluruh kunci gambar yang dipakai satu baris soal — gambar soalnya sendiri
 * maupun gambar pilihannya. Dipakai penyapu supaya gambar pilihan tidak
 * tertinggal di penyimpanan setelah aktivitasnya dihapus.
 */
export function kunciGambarBaris(baris: {
  gambar: string | null;
  opts: string | null;
}): string[] {
  const kunci: string[] = [];
  if (baris.gambar) kunci.push(baris.gambar);
  if (!baris.opts) return kunci;

  try {
    const terurai: unknown = JSON.parse(baris.opts);
    if (!Array.isArray(terurai)) return kunci;
    for (const o of terurai) {
      if (
        o &&
        typeof o === "object" &&
        typeof (o as { gambar?: unknown }).gambar === "string"
      ) {
        kunci.push((o as { gambar: string }).gambar);
      }
    }
  } catch {
    // Baris rusak: lebih baik gambarnya tertinggal daripada terhapus keliru.
  }
  return kunci;
}
