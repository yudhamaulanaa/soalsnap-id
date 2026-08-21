import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ token: string }> };

/** GET /api/unggah/[token] — status job untuk layar Proses AI. */
export async function GET(_request: Request, { params }: Ctx) {
  const { token } = await params;

  const job = await prisma.parseJob.findUnique({
    where: { token },
    include: { uploads: { orderBy: { urutan: "asc" } } },
  });
  if (!job) {
    return NextResponse.json({ error: "Unggahan tidak ditemukan" }, { status: 404 });
  }

  // Hasilnya hanya disertakan saat job benar-benar selesai; selama proses
  // berjalan, isinya belum utuh dan tidak boleh dipakai.
  let hasil: unknown = null;
  if (job.status === "selesai" && job.hasil) {
    try {
      hasil = JSON.parse(job.hasil);
    } catch {
      hasil = null;
    }
  }

  return NextResponse.json({
    status: job.status,
    progres: job.progres,
    tahap: job.tahap,
    galat: job.galat,
    soalTerdeteksi: job.soalTerdeteksi,
    perluTinjau: job.perluTinjau,
    hasil,
    // Kunci objek tidak ikut: itu urusan server dan worker, bukan peramban.
    berkas: job.uploads.map((u) => ({
      nama: u.namaAsli,
      kind: u.kind,
      ukuran: u.ukuran,
      halaman: u.halaman,
      tersimpan: u.tersimpan,
    })),
  });
}
