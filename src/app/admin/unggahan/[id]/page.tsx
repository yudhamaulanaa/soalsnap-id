import Link from "next/link";
import { notFound } from "next/navigation";
import { HalamanEkstraksiPanel } from "@/components/admin/HalamanEkstraksiPanel";
import { StatusJob } from "@/components/admin/StatusJob";
import { TombolSalinTeks } from "@/components/admin/TombolSalinTeks";
import { jobLengkap } from "@/lib/admin/data";
import { pastikanAdmin } from "@/lib/admin/sesi";
import { formatUkuran, formatWaktu } from "@/lib/format";
import { AMBANG_KEYAKINAN } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

interface BarisOcr {
  teks: string;
  konfidensi: number;
  kotak: number[];
}

/** Baris disimpan sebagai teks JSON; berkas rusak tidak boleh menjatuhkan halaman. */
function barisDari(mentah: string): BarisOcr[] {
  try {
    const terurai: unknown = JSON.parse(mentah);
    return Array.isArray(terurai) ? (terurai as BarisOcr[]) : [];
  } catch {
    return [];
  }
}

/** Audit hasil baca mesin OCR, apa adanya sebelum ditafsirkan menjadi soal. */
export default async function AdminUnggahanDetailPage({ params }: Ctx) {
  await pastikanAdmin();

  const { id } = await params;
  const job = await jobLengkap(id);
  if (!job) notFound();

  const totalHalaman = job.uploads.reduce(
    (n, u) => n + u.halamanDokumen.length,
    0,
  );
  // Blok salin-teks hanya berguna untuk jalur OCR cadangan; jalur VLM tidak
  // menyimpan teks polos per halaman.
  const adaTeksOcr = job.uploads.some((u) =>
    u.halamanDokumen.some((h) => h.teks !== null),
  );
  const seluruhTeks = job.uploads
    .flatMap((u) =>
      u.halamanDokumen.map(
        (h) => `--- ${u.namaAsli} · halaman ${h.halaman} ---\n${h.teks ?? ""}`,
      ),
    )
    .join("\n\n");

  return (
    <main className="mx-auto flex w-full max-w-[1160px] flex-col gap-6 px-6 pb-20 pt-9">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/unggahan"
          className="text-[13px] font-semibold text-ink-3 no-underline hover:underline"
        >
          ← Semua unggahan
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 font-display text-[24px] font-extrabold sm:text-[28px]">
            Hasil baca dokumen
          </h1>
          <StatusJob status={job.status} />
        </div>
        <p className="m-0 text-[14px] text-ink-3">
          {job.uploads.length} berkas · {totalHalaman} halaman terbaca ·
          diunggah {formatWaktu(job.createdAt.getTime())}
          {job.workerId ? ` · dibaca ${job.workerId}` : ""}
        </p>
        {job.model && (
          <p className="m-0 text-[12.5px] text-dim">
            {job.provider} · {job.model} · prompt {job.promptVersion} · skema{" "}
            {job.schemaVersion} · pengekstrak {job.extractorVersion}
            {job.soalTerdeteksi !== null
              ? ` · ${job.soalTerdeteksi} soal, ${job.perluTinjau} perlu ditinjau`
              : ""}
          </p>
        )}
      </div>

      {totalHalaman > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-panel border border-line bg-surface px-5 py-4">
          <span className="text-[13.5px] font-semibold text-ink-2">
            Ambil hasil mentahnya:
          </span>
          {adaTeksOcr && (
            <TombolSalinTeks teks={seluruhTeks} label="Salin seluruh teks" />
          )}
          {adaTeksOcr && (
            <a
              href={`/api/admin/unggahan/${job.id}/mentah?format=teks`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-semibold text-ink-2 no-underline transition-colors hover:border-teal hover:text-teal hover:no-underline"
            >
              Buka sebagai teks
            </a>
          )}
          <a
            href={`/api/admin/unggahan/${job.id}/mentah`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-semibold text-ink-2 no-underline transition-colors hover:border-teal hover:text-teal hover:no-underline"
          >
            Buka sebagai JSON
          </a>
        </div>
      )}

      {job.galat && (
        <p className="m-0 rounded-panel bg-wrong-bg px-5 py-4 text-[14px] font-semibold text-wrong-fg">
          {job.galat}{" "}
          {job.kodeGalat && (
            <span className="ml-2 font-mono text-[12px] font-normal opacity-70">
              ({job.kodeGalat})
            </span>
          )}
        </p>
      )}

      {totalHalaman === 0 && !job.galat && (
        <div className="rounded-panel border-2 border-dashed border-line-hover bg-white/60 px-6 py-14 text-center">
          <p className="m-0 font-display text-[18px] font-bold">
            Belum ada hasil baca
          </p>
          <p className="m-0 mt-2 text-[14px] text-ink-3">
            {job.status === "antre"
              ? "Job ini menunggu giliran worker."
              : job.status === "diproses"
                ? `Sedang dibaca — ${job.progres}%.`
                : "Berkasnya belum selesai diunggah."}
          </p>
        </div>
      )}

      {job.uploads.map((u) => (
        <section key={u.id} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="m-0 font-display text-[18px] font-bold">
              {u.namaAsli}
            </h2>
            <span className="text-[12.5px] text-dim">
              {u.kind} · {formatUkuran(u.ukuran)} · {u.halaman} halaman
            </span>
          </div>

          {u.halamanDokumen.length === 0 ? (
            <p className="m-0 text-[13.5px] text-ink-3">
              Berkas ini belum dibaca.
            </p>
          ) : (
            u.halamanDokumen.map((h) => {
              const baris = barisDari(h.baris ?? "");
              const perluPeriksa =
                h.konfidensiMin !== null && h.konfidensiMin < AMBANG_KEYAKINAN;
              return (
                <article
                  key={h.id}
                  className={`flex flex-col gap-3 rounded-panel border bg-surface p-5 ${
                    perluPeriksa ? "border-risk-line bg-risk-bg" : "border-line"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-[.06em]">
                    <span className="rounded-full bg-fill-2 px-2.5 py-1 text-ink-3">
                      HALAMAN {h.halaman}
                    </span>
                    {h.konfidensiMin !== null && (
                      <span
                        className={`rounded-full px-2.5 py-1 ${
                          perluPeriksa
                            ? "bg-warn-bg text-warn-fg"
                            : "bg-teal-light text-teal-dark"
                        }`}
                      >
                        KONFIDENSI {h.konfidensiMin}–{h.konfidensiRata}%
                      </span>
                    )}
                    {h.teks !== null && (
                      <span className="rounded-full bg-app px-2.5 py-1 text-dim">
                        {baris.length} BARIS
                      </span>
                    )}
                    {h.msProses !== null && (
                      <span className="rounded-full bg-app px-2.5 py-1 text-dim">
                        {(h.msProses / 1000).toFixed(1)} DETIK
                      </span>
                    )}
                    <span className="flex-1" />
                    {h.teks !== null && (
                      <TombolSalinTeks
                        teks={h.teks}
                        label="Salin halaman ini"
                      />
                    )}
                  </div>

                  <HalamanEkstraksiPanel
                    jobId={job.id}
                    halamanId={h.id}
                    halaman={h.halaman}
                    punyaRender={h.kunciRender !== null}
                    lebar={h.lebar}
                    tinggi={h.tinggi}
                    rawEkstraksi={h.rawEkstraksi}
                  />

                  {/* Teks OCR hanya muncul bila jalur cadangan yang dipakai. */}
                  {h.teks !== null && (
                    <pre className="m-0 max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-app px-4 py-3 font-mono text-[13px] leading-[1.65] text-ink-2">
                      {h.teks || "(tidak ada teks terbaca)"}
                    </pre>
                  )}

                  {baris.length > 0 && (
                    <details className="text-[13px]">
                      <summary className="cursor-pointer font-semibold text-ink-2">
                        Rincian per baris beserta konfidensinya
                      </summary>
                      <div className="mt-2.5 overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="border-b border-line text-[11px] font-bold tracking-[.06em] text-dim">
                              <th className="px-3 py-2">TEKS</th>
                              <th className="px-3 py-2 text-right">
                                KONFIDENSI
                              </th>
                              <th className="px-3 py-2 text-right">POSISI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {baris.map((b, i) => (
                              <tr
                                key={i}
                                className="border-b border-line-soft last:border-b-0"
                              >
                                <td className="px-3 py-1.5 font-mono text-[12.5px]">
                                  {b.teks}
                                </td>
                                <td
                                  className={`px-3 py-1.5 text-right tabular-nums ${
                                    b.konfidensi < AMBANG_KEYAKINAN
                                      ? "font-bold text-warn-fg"
                                      : "text-ink-3"
                                  }`}
                                >
                                  {b.konfidensi.toFixed(1)}%
                                </td>
                                <td className="px-3 py-1.5 text-right font-mono text-[11.5px] text-dim">
                                  {b.kotak.map((n) => Math.round(n)).join(", ")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}

                  {h.baris !== null && (
                    <details className="text-[13px]">
                      <summary className="cursor-pointer font-semibold text-ink-2">
                        JSON baris OCR apa adanya
                      </summary>
                      <pre className="mt-2.5 max-h-[320px] overflow-auto whitespace-pre-wrap break-all rounded-xl bg-forest px-4 py-3 font-mono text-[11.5px] leading-[1.6] text-mint-soft">
                        {h.baris}
                      </pre>
                    </details>
                  )}
                </article>
              );
            })
          )}
        </section>
      ))}
    </main>
  );
}
