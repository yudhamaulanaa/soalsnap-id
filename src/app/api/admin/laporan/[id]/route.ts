import { NextResponse } from "next/server";
import { sesiAdminSah } from "@/lib/admin/sesi";
import { prisma } from "@/lib/db";
import { pesanValidasi, tinjauLaporanSchema } from "@/lib/validasi";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/laporan/[id] — menutup satu laporan. */
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

  const hasil = tinjauLaporanSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }

  const ada = await prisma.report.findUnique({ where: { id }, select: { id: true } });
  if (!ada) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  const report = await prisma.report.update({
    where: { id },
    data: { status: hasil.data.status, selesaiAt: new Date() },
    select: { id: true, status: true, selesaiAt: true },
  });
  return NextResponse.json({ report });
}
