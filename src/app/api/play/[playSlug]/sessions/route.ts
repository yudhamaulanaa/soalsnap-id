import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sesiDari } from "@/lib/serialize";
import { pesanValidasi, sesiSchema } from "@/lib/validasi";

type Ctx = { params: Promise<{ playSlug: string }> };

const PAPAN_MAKS = 50;

async function papanSkor(activityId: string) {
  const rows = await prisma.playSession.findMany({
    where: { activityId },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take: PAPAN_MAKS,
  });
  return rows.map(sesiDari);
}

/** GET /api/play/[playSlug]/sessions — papan skor peserta. */
export async function GET(_request: Request, { params }: Ctx) {
  const { playSlug } = await params;
  const activity = await prisma.activity.findUnique({
    where: { playSlug },
    select: { id: true },
  });
  if (!activity) {
    return NextResponse.json({ error: "Latihan tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ sessions: await papanSkor(activity.id) });
}

/** POST /api/play/[playSlug]/sessions — menyimpan hasil satu peserta. */
export async function POST(request: Request, { params }: Ctx) {
  const { playSlug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }

  const hasil = sesiSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }
  const data = hasil.data;
  if (data.score > data.total) {
    return NextResponse.json({ error: "Skor melebihi jumlah soal" }, { status: 400 });
  }

  const activity = await prisma.activity.findUnique({
    where: { playSlug },
    select: { id: true },
  });
  if (!activity) {
    return NextResponse.json({ error: "Latihan tidak ditemukan" }, { status: 404 });
  }

  const [sesi] = await prisma.$transaction([
    prisma.playSession.create({
      data: {
        activityId: activity.id,
        playerName: data.playerName?.trim() || null,
        score: data.score,
        total: data.total,
        mode: data.mode,
      },
    }),
    // Penghitung "kali dimainkan" pada kartu dashboard & katalog (FR-DB-1).
    prisma.activity.update({
      where: { id: activity.id },
      data: { plays: { increment: 1 } },
    }),
  ]);

  return NextResponse.json(
    { session: sesiDari(sesi), sessions: await papanSkor(activity.id) },
    { status: 201 },
  );
}
