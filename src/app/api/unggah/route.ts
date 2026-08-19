import { NextResponse } from "next/server";
import { ambilJatah, sidikPemanggil } from "@/lib/admin/laju";
import { prisma } from "@/lib/db";
import { r2Dikonfigurasi, urlUnggah } from "@/lib/r2";
import { buatEditSlug } from "@/lib/slug";
import { kunciObjek, periksaDaftar } from "@/lib/unggah/berkas";
import { pesanValidasi, unggahSchema } from "@/lib/validasi";

/** Sepuluh unggahan tiap jam per pemanggil. */
const BATAS_UNGGAH = 10;
const JENDELA_MS = 60 * 60 * 1000;

/**
 * POST /api/unggah — membuka satu job dan menandatangani izin unggah.
 *
 * Berkasnya sendiri dikirim peramban langsung ke R2. Job baru masuk antrean
 * setelah klien memanggil /mulai dan server memastikan objeknya benar ada.
 */
export async function POST(request: Request) {
  if (!r2Dikonfigurasi()) {
    return NextResponse.json({ error: "Penyimpanan berkas belum dikonfigurasi" }, { status: 503 });
  }

  const jatah = ambilJatah(`unggah:${sidikPemanggil(request)}`, BATAS_UNGGAH, JENDELA_MS);
  if (!jatah.boleh) {
    return NextResponse.json(
      { error: "Terlalu banyak unggahan dari perangkat ini. Coba lagi nanti." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }

  const hasil = unggahSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }

  const periksa = periksaDaftar(hasil.data.berkas);
  if (!periksa.ok) {
    return NextResponse.json({ error: periksa.alasan }, { status: 400 });
  }

  const job = await prisma.parseJob.create({
    data: { token: buatEditSlug() },
    select: { id: true, token: true },
  });

  const baris = hasil.data.berkas.map((b, i) => ({
    jobId: job.id,
    key: kunciObjek(job.id, i, b.nama),
    namaAsli: b.nama,
    kind: periksa.jenis[i]!,
    contentType: b.contentType,
    urutan: i,
  }));
  await prisma.upload.createMany({ data: baris });

  const berkas = await Promise.all(
    baris.map(async (b) => ({
      key: b.key,
      nama: b.namaAsli,
      url: await urlUnggah(b.key, b.contentType),
    })),
  );

  return NextResponse.json({ token: job.token, berkas }, { status: 201 });
}
