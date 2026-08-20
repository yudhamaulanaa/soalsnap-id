import { NextResponse } from "next/server";
import { ambilJatah, sidikPemanggil } from "@/lib/admin/laju";
import { r2Dikonfigurasi, urlUnggah } from "@/lib/r2";
import { kunciGambar, periksaGambar } from "@/lib/unggah/gambar";
import { gambarSchema, pesanValidasi } from "@/lib/validasi";

/** Enam puluh gambar tiap jam per pemanggil. */
const BATAS_GAMBAR = 60;
const JENDELA_MS = 60 * 60 * 1000;

/**
 * POST /api/gambar — izin unggah satu gambar soal.
 *
 * Kuncinya ditentukan server, bukan klien: kalau klien boleh memilih kunci, ia
 * bisa menimpa gambar milik soal orang lain.
 */
export async function POST(request: Request) {
  if (!r2Dikonfigurasi()) {
    return NextResponse.json({ error: "Penyimpanan berkas belum dikonfigurasi" }, { status: 503 });
  }

  const jatah = ambilJatah(`gambar:${sidikPemanggil(request)}`, BATAS_GAMBAR, JENDELA_MS);
  if (!jatah.boleh) {
    return NextResponse.json(
      { error: "Terlalu banyak gambar diunggah dari perangkat ini. Coba lagi nanti." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }

  const hasil = gambarSchema.safeParse(body);
  if (!hasil.success) {
    return NextResponse.json({ error: pesanValidasi(hasil.error) }, { status: 400 });
  }

  const periksa = periksaGambar(hasil.data.contentType, hasil.data.ukuran);
  if (!periksa.ok) {
    return NextResponse.json({ error: periksa.alasan }, { status: 400 });
  }

  const kunci = kunciGambar(crypto.randomUUID().replace(/-/g, ""), hasil.data.contentType);
  return NextResponse.json(
    { kunci, url: await urlUnggah(kunci, hasil.data.contentType) },
    { status: 201 },
  );
}
