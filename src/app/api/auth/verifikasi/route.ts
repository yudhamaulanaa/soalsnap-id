import { NextResponse } from "next/server";
import { bentukTokenSah, hashTokenMasuk } from "@/lib/auth/magic";
import { COOKIE_SESI, authDikonfigurasi, buatSesi } from "@/lib/auth/sesi";
import { prisma } from "@/lib/db";
import { pesanValidasi, verifikasiMasukSchema } from "@/lib/validasi";

/**
 * POST /api/auth/verifikasi — menukar tautan masuk dengan sesi.
 *
 * Sengaja POST, bukan GET: pemindai tautan pada surel korporat kerap memuat
 * tautan lebih dulu, dan itu akan memakai habis token sekali-pakai sebelum
 * pemiliknya sempat mengklik.
 */
export async function POST(request: Request) {
  if (!authDikonfigurasi()) {
    return NextResponse.json({ error: "Fitur masuk belum dikonfigurasi" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }

  const hasil = verifikasiMasukSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }
  if (!bentukTokenSah(hasil.data.token)) {
    return NextResponse.json({ error: "Tautan masuk tidak berlaku" }, { status: 400 });
  }

  const hash = await hashTokenMasuk(hasil.data.token);
  const catatan = await prisma.loginToken.findUnique({
    where: { hash },
    select: { id: true, userId: true, dipakaiAt: true, kedaluwarsaAt: true },
  });

  // Satu pesan untuk semua kegagalan: tidak ada gunanya memberi tahu apakah
  // tautannya salah, sudah terpakai, atau kedaluwarsa.
  const kadaluwarsa =
    !catatan || catatan.dipakaiAt !== null || catatan.kedaluwarsaAt.getTime() <= Date.now();
  if (kadaluwarsa) {
    return NextResponse.json(
      { error: "Tautan masuk sudah tidak berlaku. Minta tautan baru, ya." },
      { status: 400 },
    );
  }

  const sekarang = new Date();
  const pengguna = await prisma.user.update({
    where: { id: catatan.userId },
    data: { terakhirMasukAt: sekarang },
    select: { id: true, email: true, nama: true },
  });
  await prisma.loginToken.update({ where: { id: catatan.id }, data: { dipakaiAt: sekarang } });

  // Aktivitas yang dulu dibuat dengan alamat ini ikut terkumpul — itulah yang
  // membuat akun berguna bagi soal yang terlanjur dibuat tanpa masuk.
  const { count } = await prisma.activity.updateMany({
    where: { creatorEmail: pengguna.email, userId: null },
    data: { userId: pengguna.id },
  });

  const tiket = await buatSesi(pengguna.id);
  if (!tiket) {
    return NextResponse.json({ error: "Fitur masuk belum dikonfigurasi" }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true, pengguna, diklaim: count });
  res.cookies.set({
    name: COOKIE_SESI,
    value: tiket.nilai,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: tiket.kedaluwarsa,
  });
  return res;
}
