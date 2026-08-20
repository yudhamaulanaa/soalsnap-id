import { NextResponse } from "next/server";
import { ambilJatah, sidikPemanggil } from "@/lib/admin/laju";
import { asalAplikasi } from "@/lib/asal";
import { authDikonfigurasi } from "@/lib/auth/sesi";
import {
  UMUR_TOKEN_MENIT,
  UMUR_TOKEN_MS,
  buatTokenMasuk,
  hashTokenMasuk,
  normalkanEmail,
} from "@/lib/auth/magic";
import { prisma } from "@/lib/db";
import { susunPesanMasuk } from "@/lib/email/pesan";
import { pengirim } from "@/lib/notify";
import { mintaMasukSchema, pesanValidasi } from "@/lib/validasi";

const BATAS_PER_ALAMAT = 5;
const BATAS_PER_PEMANGGIL = 10;
const JENDELA_MS = 60 * 60 * 1000;

/** POST /api/auth/minta — mengirim tautan masuk ke sebuah alamat surel. */
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

  const hasil = mintaMasukSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }
  const email = normalkanEmail(hasil.data.email);

  // Dibatasi dua arah: per perangkat agar tidak dipakai membanjiri banyak
  // alamat, dan per alamat agar satu orang tidak dibanjiri surel.
  const perPemanggil = ambilJatah(
    `masuk-ip:${sidikPemanggil(request)}`,
    BATAS_PER_PEMANGGIL,
    JENDELA_MS,
  );
  const perAlamat = ambilJatah(`masuk-email:${email}`, BATAS_PER_ALAMAT, JENDELA_MS);
  if (!perPemanggil.boleh || !perAlamat.boleh) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan tautan masuk. Coba lagi nanti." },
      { status: 429 },
    );
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
    select: { id: true, nama: true },
  });

  const token = buatTokenMasuk();
  const hash = await hashTokenMasuk(token);

  await prisma.$transaction([
    // Tautan lama yang belum terpakai dilumpuhkan: satu permintaan baru berarti
    // hanya satu tautan yang boleh hidup.
    prisma.loginToken.updateMany({
      where: { userId: user.id, dipakaiAt: null },
      data: { dipakaiAt: new Date() },
    }),
    prisma.loginToken.create({
      data: { userId: user.id, hash, kedaluwarsaAt: new Date(Date.now() + UMUR_TOKEN_MS) },
    }),
  ]);

  const notifikasi = await pengirim
    .kirim({
      kepada: email,
      nama: user.nama,
      pesan: susunPesanMasuk({
        nama: user.nama,
        tautan: `${asalAplikasi(request)}/masuk/${token}`,
        umurMenit: UMUR_TOKEN_MENIT,
      }),
    })
    .catch((e: unknown) => {
      console.error("[auth] pengiriman tautan masuk gagal:", e);
      return { terkirim: false, kode: "gagal" as const, alasan: "pengiriman gagal" };
    });

  return NextResponse.json({ ok: true, notifikasi });
}
