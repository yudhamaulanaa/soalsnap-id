import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tokenWorkerSah, workerDikonfigurasi } from "@/lib/worker/sesi";
import { pesanValidasi, progresWorkerSchema } from "@/lib/validasi";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/worker/[id]/progres — kabar kemajuan untuk layar Proses AI. */
export async function POST(request: Request, { params }: Ctx) {
  if (!workerDikonfigurasi()) {
    return NextResponse.json({ error: "Worker belum dikonfigurasi" }, { status: 503 });
  }
  if (!tokenWorkerSah(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }
  const hasil = progresWorkerSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }

  // Hanya job yang sedang diproses yang menerima kabar; job yang sudah selesai
  // atau sudah ditarik kembali ke antrean tidak boleh dimundurkan progresnya.
  const diperbarui = await prisma.parseJob.updateMany({
    where: { id, status: "diproses" },
    data: {
      progres: hasil.data.progres,
      tahap: hasil.data.tahap,
      // Selama worker mengabari, klaimnya diperbarui supaya tidak dianggap mandek.
      klaimAt: new Date(),
    },
  });
  if (diperbarui.count === 0) {
    return NextResponse.json({ error: "Job tidak sedang diproses" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
