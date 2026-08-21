import { NextResponse } from "next/server";
import { asalAplikasi } from "@/lib/asal";
import { prisma } from "@/lib/db";
import { kirimTautanKePembuat } from "@/lib/email/kirim";
import { kunciGambarBaris } from "@/lib/unggah/pemakai";
import { sapuGambar } from "@/lib/unggah/sapu";
import { aktivitasDari, sesiDari, soalKeBaris } from "@/lib/serialize";
import { pesanValidasi, ubahAktivitasSchema } from "@/lib/validasi";
import type { Question } from "@/lib/types";

type Ctx = { params: Promise<{ editSlug: string }> };

/** GET /api/activities/[editSlug] — data lengkap + rekap peserta. */
export async function GET(_request: Request, { params }: Ctx) {
  const { editSlug } = await params;
  const activity = await prisma.activity.findUnique({
    where: { editSlug },
    include: { questions: { orderBy: { urutan: "asc" } } },
  });
  if (!activity) {
    return NextResponse.json(
      { error: "Aktivitas tidak ditemukan" },
      { status: 404 },
    );
  }

  const sessions = await prisma.playSession.findMany({
    where: { activityId: activity.id },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take: 200,
  });

  return NextResponse.json({
    activity: aktivitasDari(activity, { sertakanEditSlug: true }),
    sessions: sessions.map(sesiDari),
  });
}

/** PATCH /api/activities/[editSlug] — menyunting soal & pengaturan. */
export async function PATCH(request: Request, { params }: Ctx) {
  const { editSlug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }

  const hasil = ubahAktivitasSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json(
      { error: pesanValidasi(hasil.error) },
      { status: 400 },
    );
  }
  const data = hasil.data;

  const ada = await prisma.activity.findUnique({
    where: { editSlug },
    select: { id: true },
  });
  if (!ada) {
    return NextResponse.json(
      { error: "Aktivitas tidak ditemukan" },
      { status: 404 },
    );
  }

  // Soal ditulis ulang seluruhnya agar urutan dan penghapusan ikut tersimpan.
  const activity = await prisma.$transaction(async (tx) => {
    if (data.questions) {
      await tx.question.deleteMany({ where: { activityId: ada.id } });
      await tx.question.createMany({
        data: data.questions.map((q, i) => ({
          ...soalKeBaris(q as Question, i),
          activityId: ada.id,
        })),
      });
    }
    return tx.activity.update({
      where: { id: ada.id },
      data: {
        title: data.title?.trim(),
        template: data.template,
        acak: data.acak,
        timerOn: data.timerOn,
        timerDetik: data.timerDetik,
        visibility: data.visibility,
        kelas: data.kelas,
        mapel: data.mapel,
        creatorName: data.creator?.name?.trim() || undefined,
        creatorEmail: data.creator?.email?.trim() || undefined,
        creatorPhone: data.creator?.phone?.trim() || undefined,
      },
      include: { questions: { orderBy: { urutan: "asc" } } },
    });
  });

  // Tautan hanya dikirim pada penyimpanan yang memang membawa alamat email;
  // penyuntingan biasa tidak menyentuh penyedia surel.
  const notifikasi = data.creator?.email?.trim()
    ? await kirimTautanKePembuat(activity, asalAplikasi(request))
    : undefined;

  return NextResponse.json({
    activity: aktivitasDari(activity, { sertakanEditSlug: true }),
    notifikasi,
  });
}

/** DELETE /api/activities/[editSlug] — pemilik menghapus soalnya. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const { editSlug } = await params;
  const ada = await prisma.activity.findUnique({
    where: { editSlug },
    select: { id: true, questions: { select: { gambar: true, opts: true } } },
  });
  if (!ada) {
    return NextResponse.json(
      { error: "Aktivitas tidak ditemukan" },
      { status: 404 },
    );
  }

  await prisma.activity.delete({ where: { id: ada.id } });
  // Setelah barisnya hilang, gambarnya tidak boleh tertinggal di penyimpanan.
  await sapuGambar(ada.questions.flatMap(kunciGambarBaris));

  return NextResponse.json({ ok: true });
}
