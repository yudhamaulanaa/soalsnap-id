import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uraiEkstraksi } from "@/lib/ekstraksi/skema";
import { tokenWorkerSah, workerDikonfigurasi } from "@/lib/worker/sesi";
import { halamanWorkerSchema, pesanValidasi } from "@/lib/validasi";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/worker/[id]/halaman — checkpoint satu halaman (FR-019).
 *
 * Hasil tiap halaman disimpan begitu selesai, bukan ditahan sampai seluruh
 * dokumen rampung. Kalau worker mati di halaman kesepuluh, sembilan halaman
 * sebelumnya tidak perlu dibaca ulang — dan pemanggilan model itulah bagian
 * yang paling mahal.
 */
export async function POST(request: Request, { params }: Ctx) {
  if (!workerDikonfigurasi()) {
    return NextResponse.json(
      { error: "Worker belum dikonfigurasi" },
      { status: 503 },
    );
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
  const hasil = halamanWorkerSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json(
      { error: pesanValidasi(hasil.error) },
      { status: 400 },
    );
  }

  const job = await prisma.parseJob.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      uploads: { select: { id: true, key: true } },
    },
  });
  if (!job)
    return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
  if (job.status !== "diproses") {
    return NextResponse.json(
      { error: "Job tidak sedang diproses" },
      { status: 409 },
    );
  }

  // Keluaran model tidak pernah dipercaya begitu saja; yang tidak sesuai skema
  // ditolak dengan alasannya supaya worker bisa mencoba ulang (FR-010).
  const ekstraksi = uraiEkstraksi(hasil.data.ekstraksi);
  if (!ekstraksi.ok) {
    return NextResponse.json(
      { error: `Hasil ekstraksi ditolak — ${ekstraksi.alasan}` },
      { status: 422 },
    );
  }

  // Halamannya ditulis ke berkas yang benar, bukan sekadar berkas pertama:
  // nomor halaman dihitung ulang dari 1 pada tiap berkas, jadi menaruh semuanya
  // di berkas pertama akan membuat halaman berkas kedua menimpa yang pertama.
  const upload = job.uploads.find((u) => u.key === hasil.data.uploadKey);
  if (!upload) {
    return NextResponse.json(
      { error: `Berkas ${hasil.data.uploadKey} bukan bagian dari job ini` },
      { status: 400 },
    );
  }

  const isi = {
    status: "selesai",
    kunciRender: hasil.data.kunciRender ?? null,
    lebar: hasil.data.lebar ?? null,
    tinggi: hasil.data.tinggi ?? null,
    rawEkstraksi: JSON.stringify(hasil.data.ekstraksi),
    msProses: hasil.data.msProses ?? null,
  };

  await prisma.halamanDokumen.upsert({
    where: {
      uploadId_halaman: { uploadId: upload.id, halaman: hasil.data.halaman },
    },
    create: { uploadId: upload.id, halaman: hasil.data.halaman, ...isi },
    update: isi,
  });

  const selesai = await prisma.halamanDokumen.count({
    where: {
      uploadId: { in: job.uploads.map((u) => u.id) },
      status: "selesai",
    },
  });
  await prisma.parseJob.update({
    where: { id },
    data: { halamanSelesai: selesai, klaimAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    soal: ekstraksi.halaman.soal.length,
    halamanSelesai: selesai,
  });
}
