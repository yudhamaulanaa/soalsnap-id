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

  return NextResponse.json({
    status: job.status,
    progres: job.progres,
    tahap: job.tahap,
    galat: job.galat,
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
