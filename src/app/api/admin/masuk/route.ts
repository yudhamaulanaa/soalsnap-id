import { NextResponse } from "next/server";
import { ambilJatah, sidikPemanggil } from "@/lib/admin/laju";
import { COOKIE_ADMIN, adminDikonfigurasi, buatTiketAdmin, sandiCocok } from "@/lib/admin/sesi";
import { masukAdminSchema, pesanValidasi } from "@/lib/validasi";

/** Delapan percobaan tiap sepuluh menit per pemanggil. */
const BATAS_COBA = 8;
const JENDELA_MS = 10 * 60 * 1000;

/** POST /api/admin/masuk — menukar sandi dengan cookie sesi admin. */
export async function POST(request: Request) {
  if (!adminDikonfigurasi()) {
    return NextResponse.json({ error: "Halaman admin belum dikonfigurasi" }, { status: 503 });
  }

  const jatah = ambilJatah(`masuk:${sidikPemanggil(request)}`, BATAS_COBA, JENDELA_MS);
  if (!jatah.boleh) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan. Coba lagi ${jatah.tungguDetik} detik lagi.` },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }

  const hasil = masukAdminSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }
  if (!sandiCocok(hasil.data.sandi)) {
    return NextResponse.json({ error: "Sandi salah" }, { status: 401 });
  }

  const tiket = await buatTiketAdmin();
  if (!tiket) {
    return NextResponse.json({ error: "Halaman admin belum dikonfigurasi" }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE_ADMIN,
    value: tiket.nilai,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: tiket.kedaluwarsa,
  });
  return res;
}
