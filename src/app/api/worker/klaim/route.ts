import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { r2Dikonfigurasi, urlUnduh } from "@/lib/r2";
import { tokenWorkerSah, workerDikonfigurasi } from "@/lib/worker/sesi";
import { klaimWorkerSchema, pesanValidasi } from "@/lib/validasi";

/** Job yang diklaim lebih lama dari ini dianggap ditinggal worker yang mati. */
const BATAS_MANDEK_MS = 10 * 60 * 1000;
/** Setelah sekian kali dicoba dan selalu mandek, job menyerah. */
const MAX_PERCOBAAN = 3;
/** Umur URL unduh; OCR satu dokumen bisa berjalan beberapa menit. */
const UMUR_UNDUH_DETIK = 30 * 60;

/**
 * POST /api/worker/klaim — memberi satu job kepada worker yang meminta.
 *
 * Klaimnya memakai bandingkan-lalu-tulis: dua worker yang meminta bersamaan
 * hanya salah satunya yang berhasil menandai job, yang lain lanjut ke job
 * berikutnya. Ini yang membuat beberapa worker aman berjalan paralel.
 */
export async function POST(request: Request) {
  if (!workerDikonfigurasi()) {
    return NextResponse.json({ error: "Worker belum dikonfigurasi" }, { status: 503 });
  }
  if (!tokenWorkerSah(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  if (!r2Dikonfigurasi()) {
    return NextResponse.json({ error: "Penyimpanan berkas belum dikonfigurasi" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }
  const hasil = klaimWorkerSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }

  await pulihkanJobMandek();

  const job = await klaimSatuJob(hasil.data.workerId);
  if (!job) return NextResponse.json({ job: null });

  const berkas = await Promise.all(
    job.uploads.map(async (u) => ({
      key: u.key,
      nama: u.namaAsli,
      kind: u.kind,
      contentType: u.contentType,
      halaman: u.halaman,
      // Worker tidak memegang kunci R2; ia hanya diberi tautan berumur pendek.
      url: await urlUnduh(u.key, UMUR_UNDUH_DETIK),
    })),
  );

  return NextResponse.json({ job: { id: job.id, token: job.token, percobaan: job.percobaan, berkas } });
}

/**
 * Worker bisa mati di tengah jalan. Job yang klaimnya sudah basi dikembalikan
 * ke antrean, dan yang berulang kali gagal diselesaikan berhenti dicoba supaya
 * tidak berputar selamanya.
 */
async function pulihkanJobMandek() {
  const batas = new Date(Date.now() - BATAS_MANDEK_MS);
  await prisma.parseJob.updateMany({
    where: { status: "diproses", klaimAt: { lt: batas } },
    data: { status: "antre", workerId: null, klaimAt: null, percobaan: { increment: 1 } },
  });
  await prisma.parseJob.updateMany({
    where: { status: "antre", percobaan: { gte: MAX_PERCOBAAN } },
    data: {
      status: "gagal",
      galat: "Pemrosesan berhenti setelah beberapa kali percobaan",
      selesaiAt: new Date(),
    },
  });
}

async function klaimSatuJob(workerId: string) {
  // Beberapa putaran: kalau job yang dilirik keburu diambil worker lain,
  // coba job berikutnya alih-alih menyerah.
  for (let putaran = 0; putaran < 5; putaran++) {
    const calon = await prisma.parseJob.findFirst({
      where: { status: "antre" },
      orderBy: { antreAt: "asc" },
      select: { id: true },
    });
    if (!calon) return null;

    const diambil = await prisma.parseJob.updateMany({
      // Syarat status di sini yang menjadikannya atomik: hanya satu penulis
      // yang bisa mengubah baris berstatus "antre" menjadi "diproses".
      where: { id: calon.id, status: "antre" },
      data: { status: "diproses", workerId, klaimAt: new Date(), tahap: "Membaca dokumen" },
    });
    if (diambil.count === 1) {
      return prisma.parseJob.findUnique({
        where: { id: calon.id },
        include: { uploads: { orderBy: { urutan: "asc" } } },
      });
    }
  }
  return null;
}
