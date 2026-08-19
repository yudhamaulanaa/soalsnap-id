import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aktivitasDari } from "@/lib/serialize";

type Ctx = { params: Promise<{ playSlug: string }> };

/**
 * GET /api/play/[playSlug] — data untuk mengerjakan soal.
 *
 * Penilaian dilakukan di peramban (seperti prototype), jadi kunci jawaban ikut
 * terkirim. Artinya nilai bisa dimanipulasi peserta yang paham peramban —
 * dapat diterima untuk latihan, tetapi tidak untuk ujian bernilai.
 */
export async function GET(_request: Request, { params }: Ctx) {
  const { playSlug } = await params;
  const activity = await prisma.activity.findUnique({
    where: { playSlug },
    include: { questions: { orderBy: { urutan: "asc" } } },
  });
  if (!activity) {
    return NextResponse.json({ error: "Latihan tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ activity: aktivitasDari(activity) });
}
