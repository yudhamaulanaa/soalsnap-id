import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ambilObjek, hapusObjek, periksaObjek, r2Dikonfigurasi } from "@/lib/r2";
import { MAX_UKURAN_BYTE, periksaTotalHalaman, type JenisBerkas } from "@/lib/unggah/berkas";
import { hitungHalaman } from "@/lib/unggah/halaman";
import { MAX_FILE_MB } from "@/lib/types";

type Ctx = { params: Promise<{ token: string }> };

/**
 * POST /api/unggah/[token]/mulai — memastikan berkasnya benar sampai di R2,
 * lalu memasukkan job ke antrean.
 *
 * Semua yang menentukan diperiksa ulang di sini: keberadaan objek, ukuran
 * sebenarnya, dan jumlah halaman sesungguhnya. Laporan klien tidak dipercaya —
 * yang dipegangnya hanya izin unggah, bukan wewenang menyatakan isi.
 */
export async function POST(_request: Request, { params }: Ctx) {
  if (!r2Dikonfigurasi()) {
    return NextResponse.json({ error: "Penyimpanan berkas belum dikonfigurasi" }, { status: 503 });
  }
  const { token } = await params;

  const job = await prisma.parseJob.findUnique({
    where: { token },
    include: { uploads: { orderBy: { urutan: "asc" } } },
  });
  if (!job) {
    return NextResponse.json({ error: "Unggahan tidak ditemukan" }, { status: 404 });
  }
  if (job.status !== "menyusun") {
    return NextResponse.json(
      { error: "Unggahan ini sudah diproses", status: job.status },
      { status: 409 },
    );
  }

  const kunci = job.uploads.map((u) => u.key);
  const terperiksa: { id: string; ukuran: number; halaman: number }[] = [];

  for (const unggahan of job.uploads) {
    const objek = await periksaObjek(unggahan.key);
    if (!objek.ada) {
      return gagalkan(job.id, kunci, `${unggahan.namaAsli}: berkasnya belum sampai ke penyimpanan`);
    }
    if (objek.ukuran <= 0) {
      return gagalkan(job.id, kunci, `${unggahan.namaAsli}: berkasnya kosong`);
    }
    if (objek.ukuran > MAX_UKURAN_BYTE) {
      return gagalkan(job.id, kunci, `${unggahan.namaAsli} melebihi ${MAX_FILE_MB} MB`);
    }

    let halaman = 1;
    if (unggahan.kind === "pdf") {
      const isi = await ambilObjek(unggahan.key);
      if (!isi) {
        return gagalkan(job.id, kunci, `${unggahan.namaAsli}: berkasnya tidak terbaca`);
      }
      halaman = await hitungHalaman(unggahan.kind as JenisBerkas, isi);
    }
    terperiksa.push({ id: unggahan.id, ukuran: objek.ukuran, halaman });
  }

  const batas = periksaTotalHalaman(terperiksa.map((t) => t.halaman));
  if (!batas.ok) return gagalkan(job.id, kunci, batas.alasan);

  await prisma.$transaction([
    ...terperiksa.map((t) =>
      prisma.upload.update({
        where: { id: t.id },
        data: { ukuran: t.ukuran, halaman: t.halaman, tersimpan: true },
      }),
    ),
    prisma.parseJob.update({
      where: { id: job.id },
      data: { status: "antre", antreAt: new Date(), tahap: "Menunggu giliran" },
    }),
  ]);

  return NextResponse.json({
    status: "antre",
    totalHalaman: terperiksa.reduce((n, t) => n + t.halaman, 0),
  });
}

/** Job yang ditolak tidak menyisakan berkas menganggur di penyimpanan. */
async function gagalkan(jobId: string, kunci: string[], alasan: string) {
  await hapusObjek(kunci);
  await prisma.parseJob.update({
    where: { id: jobId },
    data: { status: "gagal", galat: alasan, selesaiAt: new Date() },
  });
  return NextResponse.json({ error: alasan }, { status: 400 });
}
