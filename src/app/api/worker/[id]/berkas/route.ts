import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { kunciPotonganSoal, kunciRenderHalaman } from "@/lib/ekstraksi/kunci";
import { r2Dikonfigurasi, urlUnggah } from "@/lib/r2";
import { jenisGambarSah } from "@/lib/unggah/gambar";
import { tokenWorkerSah, workerDikonfigurasi } from "@/lib/worker/sesi";
import { berkasWorkerSchema, pesanValidasi } from "@/lib/validasi";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/worker/[id]/berkas — izin unggah render halaman dan potongan soal.
 *
 * Kunci objeknya ditentukan server, bukan worker. Selain menjaga worker tetap
 * tanpa kunci R2, ini juga yang membuat pengulangan job menimpa objek yang sama
 * alih-alih menumpuk salinan baru.
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
  if (!r2Dikonfigurasi()) {
    return NextResponse.json(
      { error: "Penyimpanan berkas belum dikonfigurasi" },
      { status: 503 },
    );
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }
  const hasil = berkasWorkerSchema.safeParse(body);
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
      uploads: { select: { key: true, urutan: true } },
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

  // Worker hanya boleh menulis untuk berkas milik job yang diklaimnya.
  const urutanPerKunci = new Map(job.uploads.map((u) => [u.key, u.urutan]));
  const bukanMiliknya = hasil.data.berkas.find(
    (b) => !urutanPerKunci.has(b.uploadKey),
  );
  if (bukanMiliknya) {
    return NextResponse.json(
      { error: `Berkas ${bukanMiliknya.uploadKey} bukan bagian dari job ini` },
      { status: 400 },
    );
  }

  const asing = hasil.data.berkas.find((b) => !jenisGambarSah(b.contentType));
  if (asing) {
    return NextResponse.json(
      { error: `Jenis ${asing.contentType} tidak diterima untuk asset` },
      { status: 400 },
    );
  }

  const berkas = await Promise.all(
    hasil.data.berkas.map(async (b) => {
      const urutan = urutanPerKunci.get(b.uploadKey)!;
      const kunci =
        b.jenis === "halaman"
          ? kunciRenderHalaman(job.id, urutan, b.halaman)
          : kunciPotonganSoal(
              job.id,
              urutan,
              b.halaman,
              b.tempId ?? String(b.halaman),
            );
      return {
        jenis: b.jenis,
        halaman: b.halaman,
        tempId: b.tempId,
        kunci,
        url: await urlUnggah(kunci, b.contentType),
      };
    }),
  );

  return NextResponse.json({ berkas });
}
