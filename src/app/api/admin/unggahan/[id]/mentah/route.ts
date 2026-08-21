import { NextResponse } from "next/server";
import { jobLengkap } from "@/lib/admin/data";
import { sesiAdminSah } from "@/lib/admin/sesi";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/unggahan/[id]/mentah — hasil baca apa adanya.
 *
 * Disediakan supaya isinya bisa diambil utuh, bukan hanya dibaca di layar:
 * `?format=teks` mengembalikan teks polos siap disalin, selain itu JSON penuh
 * berisi ekstraksi model per halaman dan — bila jalur OCR cadangan yang
 * dipakai — kotak serta konfidensi tiap barisnya.
 */
export async function GET(request: Request, { params }: Ctx) {
  if (!(await sesiAdminSah())) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }
  const { id } = await params;

  const job = await jobLengkap(id);
  if (!job)
    return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });

  const berkas = job.uploads.map((u) => ({
    nama: u.namaAsli,
    kind: u.kind,
    key: u.key,
    halaman: u.halamanDokumen.map((h) => ({
      halaman: h.halaman,
      status: h.status,
      kunciRender: h.kunciRender,
      lebar: h.lebar,
      tinggi: h.tinggi,
      ekstraksi: uraikanJson(h.rawEkstraksi),
      teks: h.teks,
      konfidensiMin: h.konfidensiMin,
      konfidensiRata: h.konfidensiRata,
      msProses: h.msProses,
      // Disimpan sebagai teks JSON; dikembalikan sebagai objek supaya
      // pemanggilnya tidak perlu mengurai dua kali.
      baris: h.baris === null ? null : uraikanJson(h.baris),
    })),
  }));

  if (new URL(request.url).searchParams.get("format") === "teks") {
    const teks = berkas
      .flatMap((b) =>
        b.halaman.map(
          (h) => `--- ${b.nama} · halaman ${h.halaman} ---\n${h.teks ?? ""}`,
        ),
      )
      .join("\n\n");
    return new NextResponse(teks, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(
    {
      id: job.id,
      status: job.status,
      workerId: job.workerId,
      // Provenance ikut (FR-028): hasil tanpa versi model dan prompt tidak bisa
      // dijelaskan lagi setelah keduanya berubah.
      provider: job.provider,
      model: job.model,
      promptVersion: job.promptVersion,
      schemaVersion: job.schemaVersion,
      extractorVersion: job.extractorVersion,
      soalTerdeteksi: job.soalTerdeteksi,
      perluTinjau: job.perluTinjau,
      berkas,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

function uraikanJson(mentah: string | null): unknown {
  if (mentah === null) return null;
  try {
    return JSON.parse(mentah);
  } catch {
    // Isi yang rusak dikembalikan apa adanya, bukan disembunyikan.
    return { rusak: true, mentah };
  }
}
