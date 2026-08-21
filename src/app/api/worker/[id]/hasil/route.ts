import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tokenWorkerSah, workerDikonfigurasi } from "@/lib/worker/sesi";
import { hasilWorkerSchema, pesanValidasi } from "@/lib/validasi";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/worker/[id]/hasil — menyimpan hasil OCR mentah, lalu menutup job.
 *
 * Statusnya menjadi "terbaca", bukan "selesai": dokumennya sudah dibaca, tetapi
 * belum disusun menjadi soal. Penyusunan itu langkah berikutnya, dan memberi
 * status "selesai" sekarang akan menyesatkan.
 */
export async function POST(request: Request, { params }: Ctx) {
  if (!workerDikonfigurasi()) {
    return NextResponse.json({ error: "Worker belum dikonfigurasi" }, { status: 503 });
  }
  if (!tokenWorkerSah(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }
  const hasil = hasilWorkerSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }

  const job = await prisma.parseJob.findUnique({
    where: { id },
    select: { id: true, status: true, uploads: { select: { id: true, key: true } } },
  });
  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
  if (job.status !== "diproses") {
    return NextResponse.json({ error: "Job tidak sedang diproses" }, { status: 409 });
  }

  if (hasil.data.galat) {
    await prisma.parseJob.update({
      where: { id },
      data: {
        status: "gagal",
        galat: hasil.data.galat,
        kodeGalat: hasil.data.kodeGalat ?? "TIDAK_DIKETAHUI",
        selesaiAt: new Date(),
      },
    });
    return NextResponse.json({ status: "gagal" });
  }

  const halaman = hasil.data.halaman ?? [];
  const idPerKunci = new Map(job.uploads.map((u) => [u.key, u.id]));
  const asing = halaman.find((h) => !idPerKunci.has(h.uploadKey));
  if (asing) {
    // Worker hanya boleh menulis hasil untuk berkas milik job yang diklaimnya.
    return NextResponse.json(
      { error: `Berkas ${asing.uploadKey} bukan bagian dari job ini` },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    // Ditulis ulang seluruhnya supaya percobaan kedua tidak menumpuk baris.
    prisma.halamanDokumen.deleteMany({ where: { uploadId: { in: job.uploads.map((u) => u.id) } } }),
    prisma.halamanDokumen.createMany({
      data: halaman.map((h) => ({
        uploadId: idPerKunci.get(h.uploadKey)!,
        halaman: h.halaman,
        teks: h.teks,
        baris: JSON.stringify(h.baris),
        konfidensiMin: h.konfidensiMin,
        konfidensiRata: h.konfidensiRata,
        msProses: h.msProses ?? null,
      })),
    }),
    prisma.parseJob.update({
      where: { id },
      data: {
        status: "terbaca",
        progres: 100,
        tahap: "Dokumen selesai dibaca",
        galat: null,
        selesaiAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({ status: "terbaca", halaman: halaman.length });
}
