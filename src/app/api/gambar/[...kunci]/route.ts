import { NextResponse } from "next/server";
import { sesiAdminSah } from "@/lib/admin/sesi";
import { prisma } from "@/lib/db";
import { ambilObjekPenuh, r2Dikonfigurasi } from "@/lib/r2";
import { kunciGambarSah } from "@/lib/unggah/gambar";

type Ctx = { params: Promise<{ kunci: string[] }> };

/**
 * Gambar disajikan lewat rute ini, bukan dari bucket publik, supaya menurunkan
 * konten benar-benar menghentikan penyajiannya. Umur cache sengaja pendek:
 * itulah jeda maksimum antara admin menurunkan aktivitas dan gambarnya
 * berhenti tampil di peramban yang sudah memuatnya.
 */
const UMUR_CACHE_DETIK = 60;

/** GET /api/gambar/[...kunci] — menyajikan satu gambar soal dari R2. */
export async function GET(_request: Request, { params }: Ctx) {
  if (!r2Dikonfigurasi()) {
    return NextResponse.json({ error: "Penyimpanan berkas belum dikonfigurasi" }, { status: 503 });
  }

  const kunci = (await params).kunci.join("/");
  // Hanya ruang nama gambar soal yang dilayani; dokumen unggahan tidak pernah
  // bisa dibaca lewat rute ini walau kuncinya ditebak dengan benar.
  if (!kunciGambarSah(kunci)) {
    return NextResponse.json({ error: "Gambar tidak ditemukan" }, { status: 404 });
  }

  const pemakai = await prisma.question.findMany({
    where: { gambar: kunci },
    select: { activity: { select: { takedownAt: true } } },
  });

  // Gambar yang belum terpakai soal mana pun adalah draft yang sedang disusun.
  // Yang sudah terpakai berhenti disajikan begitu seluruh pemakainya diturunkan.
  const semuaDiturunkan =
    pemakai.length > 0 && pemakai.every((q) => q.activity.takedownAt !== null);
  if (semuaDiturunkan && !(await sesiAdminSah())) {
    return NextResponse.json({ error: "Gambar tidak tersedia" }, { status: 404 });
  }

  const objek = await ambilObjekPenuh(kunci);
  if (!objek) {
    return NextResponse.json({ error: "Gambar tidak ditemukan" }, { status: 404 });
  }

  return new NextResponse(objek.isi as unknown as BodyInit, {
    headers: {
      "Content-Type": objek.contentType,
      "Content-Length": String(objek.isi.byteLength),
      // Konten yang diturunkan tidak boleh mengendap di cache bersama.
      "Cache-Control": semuaDiturunkan
        ? "no-store"
        : `public, max-age=${UMUR_CACHE_DETIK}`,
    },
  });
}
