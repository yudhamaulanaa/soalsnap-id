import { NextResponse } from "next/server";
import { jobLengkap } from "@/lib/admin/data";
import { sesiAdminSah } from "@/lib/admin/sesi";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/unggahan/[id]/mentah — hasil OCR apa adanya.
 *
 * Disediakan supaya isinya bisa diambil utuh, bukan hanya dibaca di layar:
 * `?format=teks` mengembalikan teks polos siap disalin, selain itu JSON penuh
 * beserta kotak dan konfidensi tiap baris.
 */
export async function GET(request: Request, { params }: Ctx) {
  if (!(await sesiAdminSah())) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  const { id } = await params;

  const job = await jobLengkap(id);
  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });

  const berkas = job.uploads.map((u) => ({
    nama: u.namaAsli,
    kind: u.kind,
    key: u.key,
    halaman: u.halamanOcr.map((h) => ({
      halaman: h.halaman,
      teks: h.teks,
      konfidensiMin: h.konfidensiMin,
      konfidensiRata: h.konfidensiRata,
      msProses: h.msProses,
      // Disimpan sebagai teks JSON; dikembalikan sebagai objek supaya
      // pemanggilnya tidak perlu mengurai dua kali.
      baris: uraikanBaris(h.baris),
    })),
  }));

  if (new URL(request.url).searchParams.get("format") === "teks") {
    const teks = berkas
      .flatMap((b) => b.halaman.map((h) => `--- ${b.nama} · halaman ${h.halaman} ---\n${h.teks}`))
      .join("\n\n");
    return new NextResponse(teks, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json(
    { id: job.id, status: job.status, workerId: job.workerId, berkas },
    { headers: { "Cache-Control": "no-store" } },
  );
}

function uraikanBaris(mentah: string): unknown {
  try {
    return JSON.parse(mentah);
  } catch {
    // Baris rusak dikembalikan apa adanya, bukan disembunyikan.
    return { rusak: true, mentah };
  }
}
