import { NextResponse } from "next/server";
import { sesiAdminSah } from "@/lib/admin/sesi";
import { prisma } from "@/lib/db";
import { moderasiSchema, pesanValidasi } from "@/lib/validasi";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/aktivitas/[id] — menurunkan dari katalog atau memulihkan. */
export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await sesiAdminSah())) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }

  const hasil = moderasiSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }

  const ada = await prisma.activity.findUnique({
    where: { id },
    select: { id: true, takedownAt: true },
  });
  if (!ada) {
    return NextResponse.json({ error: "Aktivitas tidak ditemukan" }, { status: 404 });
  }

  // Memulihkan hanya masuk akal untuk aktivitas yang memang pernah diturunkan;
  // tanpa penjaga ini satu klik bisa mempublikasikan soal yang tak pernah publik.
  if (hasil.data.aksi === "pulihkan" && !ada.takedownAt) {
    return NextResponse.json(
      { error: "Aktivitas ini tidak sedang diturunkan" },
      { status: 409 },
    );
  }

  const activity = await prisma.activity.update({
    where: { id },
    data:
      hasil.data.aksi === "turunkan"
        ? {
            visibility: "private",
            takedownAt: new Date(),
            takedownAlasan: hasil.data.alasan?.trim() || null,
          }
        : { visibility: "public", takedownAt: null, takedownAlasan: null },
    select: { id: true, visibility: true, takedownAt: true, takedownAlasan: true },
  });

  return NextResponse.json({ activity });
}

/** DELETE /api/admin/aktivitas/[id] — menghapus aktivitas beserta soal & rekapnya. */
export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await sesiAdminSah())) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  const { id } = await params;

  const ada = await prisma.activity.findUnique({ where: { id }, select: { id: true } });
  if (!ada) {
    return NextResponse.json({ error: "Aktivitas tidak ditemukan" }, { status: 404 });
  }
  await prisma.activity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
