import { NextResponse } from "next/server";
import { ambilJatah, sidikPemanggil } from "@/lib/admin/laju";
import { prisma } from "@/lib/db";
import { sidikPelapor } from "@/lib/sidik";
import { laporanSchema, pesanValidasi } from "@/lib/validasi";

type Ctx = { params: Promise<{ playSlug: string }> };

/** Lima laporan tiap jam per pemanggil. */
const BATAS_LAPOR = 5;
const JENDELA_MS = 60 * 60 * 1000;

/** POST /api/play/[playSlug]/laporan — siapa pun yang melihat soal bisa melapor. */
export async function POST(request: Request, { params }: Ctx) {
  const { playSlug } = await params;

  const jatah = ambilJatah(`lapor:${sidikPemanggil(request)}`, BATAS_LAPOR, JENDELA_MS);
  if (!jatah.boleh) {
    return NextResponse.json(
      { error: "Terlalu banyak laporan dari perangkat ini. Coba lagi nanti." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }

  const hasil = laporanSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }

  const activity = await prisma.activity.findUnique({
    where: { playSlug },
    select: { id: true },
  });
  if (!activity) {
    return NextResponse.json({ error: "Aktivitas tidak ditemukan" }, { status: 404 });
  }

  const pelapor = await sidikPelapor(request);

  // Laporan kedua atas aktivitas yang sama dari pelapor yang sama tidak
  // menambah antrean; pelapornya tetap diberi tahu bahwa laporannya tercatat.
  const sudahAda = await prisma.report.findFirst({
    where: { activityId: activity.id, pelapor, status: "baru" },
    select: { id: true },
  });
  if (!sudahAda) {
    await prisma.report.create({
      data: {
        activityId: activity.id,
        alasan: hasil.data.alasan,
        catatan: hasil.data.catatan?.trim() || null,
        pelapor,
      },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
