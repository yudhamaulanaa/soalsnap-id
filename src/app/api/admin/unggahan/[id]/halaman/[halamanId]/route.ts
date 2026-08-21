import { NextResponse } from "next/server";
import { pastikanAdmin } from "@/lib/admin/sesi";
import { prisma } from "@/lib/db";
import { ambilObjekPenuh, r2Dikonfigurasi } from "@/lib/r2";

type Ctx = { params: Promise<{ id: string; halamanId: string }> };

/**
 * GET /api/admin/unggahan/[id]/halaman/[halamanId] — render halaman untuk audit.
 *
 * Render halaman sengaja tidak dilayani rute gambar umum: itu foto dokumen
 * orang, bukan gambar soal. Kuncinya pun tidak diambil dari URL melainkan
 * dicari di basis data, sehingga kunci tebakan tidak bisa dipakai membaca objek
 * lain di bucket yang sama.
 *
 * Barisnya ditunjuk lewat id, bukan nomor halaman: satu unggahan boleh memuat
 * beberapa berkas yang sama-sama punya halaman 1.
 */
export async function GET(_request: Request, { params }: Ctx) {
  await pastikanAdmin();

  if (!r2Dikonfigurasi()) {
    return NextResponse.json({ error: "Penyimpanan berkas belum dikonfigurasi" }, { status: 503 });
  }

  const { id, halamanId } = await params;

  // Syarat jobId di sini yang membuat id halaman milik job lain tidak terlayani.
  const baris = await prisma.halamanDokumen.findFirst({
    where: { id: halamanId, upload: { jobId: id } },
    select: { kunciRender: true },
  });
  if (!baris?.kunciRender) {
    return NextResponse.json({ error: "Render halaman tidak ada" }, { status: 404 });
  }

  const objek = await ambilObjekPenuh(baris.kunciRender);
  if (!objek) {
    return NextResponse.json({ error: "Render halaman tidak ada" }, { status: 404 });
  }

  return new NextResponse(objek.isi as unknown as BodyInit, {
    headers: {
      "Content-Type": objek.contentType,
      "Content-Length": String(objek.isi.byteLength),
      // Bahan audit tidak boleh mengendap di cache bersama.
      "Cache-Control": "private, no-store",
    },
  });
}
