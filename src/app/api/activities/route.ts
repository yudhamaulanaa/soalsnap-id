import { NextResponse } from "next/server";
import { asalAplikasi, tautanEditPenuh, tautanMainPenuh } from "@/lib/asal";
import { penggunaSaatIni } from "@/lib/auth/sesi";
import { prisma } from "@/lib/db";
import { kirimTautanKePembuat } from "@/lib/email/kirim";
import { aktivitasDari, soalKeBaris } from "@/lib/serialize";
import { buatEditSlug, buatPlaySlug } from "@/lib/slug";
import { buatAktivitasSchema, pesanValidasi } from "@/lib/validasi";
import type { Question } from "@/lib/types";

/** POST /api/activities — menyimpan draft menjadi aktivitas dengan dua tautan. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }

  const hasil = buatAktivitasSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }
  const data = hasil.data;

  // Tamu tetap boleh membuat soal; akun hanya menandai pemiliknya bila ada.
  const pengguna = await penggunaSaatIni();

  const activity = await prisma.activity.create({
    data: {
      userId: pengguna?.id ?? null,
      editSlug: buatEditSlug(),
      playSlug: buatPlaySlug(),
      title: data.title?.trim() || "Latihan tanpa judul",
      template: data.template,
      acak: data.acak,
      timerOn: data.timerOn,
      timerDetik: data.timerDetik,
      visibility: data.visibility,
      kelas: data.kelas,
      mapel: data.mapel,
      creatorName: data.creator?.name?.trim() || pengguna?.nama || null,
      creatorEmail: data.creator?.email?.trim() || pengguna?.email || null,
      creatorPhone: data.creator?.phone?.trim() || null,
      questions: {
        create: data.questions.map((q, i) => soalKeBaris(q as Question, i)),
      },
    },
    include: { questions: { orderBy: { urutan: "asc" } } },
  });

  const asal = asalAplikasi(request);
  const tautanEdit = tautanEditPenuh(asal, activity.editSlug);
  const tautanMain = tautanMainPenuh(asal, activity.playSlug);

  // Kegagalan pengiriman tidak boleh menggagalkan penyimpanan.
  const notifikasi = activity.creatorEmail
    ? await kirimTautanKePembuat(activity, asal)
    : undefined;

  return NextResponse.json(
    {
      activity: aktivitasDari(activity, { sertakanEditSlug: true }),
      tautanEdit,
      tautanMain,
      notifikasi,
    },
    { status: 201 },
  );
}
