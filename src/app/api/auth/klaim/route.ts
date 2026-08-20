import { NextResponse } from "next/server";
import { penggunaSaatIni } from "@/lib/auth/sesi";
import { prisma } from "@/lib/db";
import { klaimSchema, pesanValidasi } from "@/lib/validasi";

/**
 * POST /api/auth/klaim — mengumpulkan aktivitas yang tautan suntingnya masih
 * tersimpan di peramban ini ke dalam akun.
 *
 * Memegang tautan sunting sudah berarti boleh menyunting dan menghapus, jadi
 * mengaitkannya ke akun tidak menambah wewenang apa pun. Yang dijaga hanya satu
 * hal: aktivitas yang sudah bertuan tidak ikut berpindah, supaya tautan yang
 * terlanjur dibagikan tidak bisa dipakai mengambil alih milik orang lain.
 */
export async function POST(request: Request) {
  const pengguna = await penggunaSaatIni();
  if (!pengguna) {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }

  const hasil = klaimSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }

  const { count } = await prisma.activity.updateMany({
    where: { editSlug: { in: hasil.data.editSlugs }, userId: null },
    data: { userId: pengguna.id },
  });

  return NextResponse.json({ ok: true, diklaim: count });
}
