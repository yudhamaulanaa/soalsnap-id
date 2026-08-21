import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gabungkan } from "@/lib/ekstraksi/gabung";
import { keDaftarQuestion } from "@/lib/ekstraksi/keSoal";
import { uraiEkstraksi, type HalamanEkstraksi } from "@/lib/ekstraksi/skema";
import { tokenWorkerSah, workerDikonfigurasi } from "@/lib/worker/sesi";
import { pesanValidasi, selesaiWorkerSchema } from "@/lib/validasi";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/worker/[id]/selesai — menutup job dengan menyatukan hasil tiap halaman.
 *
 * Penggabungan dikerjakan di sini, bukan di worker, karena inilah bagian yang
 * paling mudah salah dan paling perlu diuji: satu soal bisa terpotong ke
 * halaman berikutnya, dan keputusan menyatukannya harus konsisten.
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

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // Badan kosong diterima: provenance-nya opsional.
  }
  const meta = selesaiWorkerSchema.safeParse(body ?? {});
  if (!meta.success) {
    return NextResponse.json(
      { error: pesanValidasi(meta.error) },
      { status: 400 },
    );
  }

  const job = await prisma.parseJob.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      uploads: {
        orderBy: { urutan: "asc" },
        select: {
          namaAsli: true,
          halamanDokumen: { orderBy: { halaman: "asc" } },
        },
      },
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

  const halaman: HalamanEkstraksi[] = [];
  const ditolak: string[] = [];
  // Nomor halaman dihitung ulang dari 1 pada tiap berkas, sedangkan penggabung
  // memandang satu unggahan sebagai satu urutan halaman. Tanpa geseran ini,
  // halaman 1 berkas kedua akan disangka halaman 1 berkas pertama — dan soalnya
  // ikut tercampur.
  let geser = 0;
  for (const upload of job.uploads) {
    let terbesar = 0;
    for (const h of upload.halamanDokumen) {
      terbesar = Math.max(terbesar, h.halaman);
      if (!h.rawEkstraksi) continue;
      let mentah: unknown;
      try {
        mentah = JSON.parse(h.rawEkstraksi);
      } catch {
        ditolak.push(
          `${upload.namaAsli} halaman ${h.halaman}: tersimpan rusak`,
        );
        continue;
      }
      const urai = uraiEkstraksi(mentah);
      if (!urai.ok) {
        ditolak.push(`${upload.namaAsli} halaman ${h.halaman}: ${urai.alasan}`);
        continue;
      }
      const nomor = urai.halaman.halaman + geser;
      halaman.push({
        ...urai.halaman,
        halaman: nomor,
        soal: urai.halaman.soal.map((s) => ({ ...s, halaman: nomor })),
      });
    }
    geser += terbesar;
  }

  if (halaman.length === 0) {
    await prisma.parseJob.update({
      where: { id },
      data: {
        status: "gagal",
        kodeGalat: "HASIL_TIDAK_SESUAI_SKEMA",
        galat: ditolak[0] ?? "Tidak ada halaman yang berhasil diekstraksi",
        selesaiAt: new Date(),
      },
    });
    return NextResponse.json(
      { error: "Tidak ada halaman yang berhasil diekstraksi" },
      { status: 422 },
    );
  }

  const gabungan = gabungkan(halaman, { dokumenId: job.id });
  const soal = keDaftarQuestion(gabungan);
  const perluTinjau = soal.filter((s) => s.low).length;

  await prisma.parseJob.update({
    where: { id },
    data: {
      status: "selesai",
      progres: 100,
      tahap: "Soal siap ditinjau",
      galat:
        ditolak.length > 0
          ? `Sebagian halaman dilewati: ${ditolak.join("; ")}`
          : null,
      hasil: JSON.stringify({ questions: soal }),
      soalTerdeteksi: soal.length,
      perluTinjau,
      provider: meta.data.provider ?? null,
      model: meta.data.model ?? null,
      promptVersion: meta.data.promptVersion ?? null,
      schemaVersion: meta.data.schemaVersion ?? null,
      extractorVersion: meta.data.extractorVersion ?? null,
      selesaiAt: new Date(),
    },
  });

  return NextResponse.json({
    status: "selesai",
    soal: soal.length,
    perluTinjau,
  });
}
