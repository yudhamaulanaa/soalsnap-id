import { urlGambar } from "@/lib/unggah/gambar";
import { uraiEkstraksi } from "@/lib/ekstraksi/skema";
import { AMBANG_KONFIDENSI } from "@/lib/ekstraksi/tinjau";

/**
 * Audit satu halaman jalur VLM: render halaman di kiri, apa yang dibaca model
 * di kanan. Dua-duanya perlu berdampingan — menilai hasil ekstraksi tanpa
 * melihat halaman aslinya hanya memindahkan tebakan dari model ke admin
 * (PRD §3, blueprint §12).
 */
interface Props {
  jobId: string;
  halamanId: string;
  halaman: number;
  punyaRender: boolean;
  lebar: number | null;
  tinggi: number | null;
  rawEkstraksi: string | null;
}

function jsonRapi(mentah: string): string {
  try {
    return JSON.stringify(JSON.parse(mentah), null, 2);
  } catch {
    return mentah;
  }
}

export function HalamanEkstraksiPanel({
  jobId,
  halamanId,
  halaman,
  punyaRender,
  lebar,
  tinggi,
  rawEkstraksi,
}: Props) {
  if (!rawEkstraksi && !punyaRender) return null;

  let mentah: unknown = null;
  try {
    mentah = rawEkstraksi ? JSON.parse(rawEkstraksi) : null;
  } catch {
    mentah = null;
  }
  const hasil = mentah === null ? null : uraiEkstraksi(mentah);

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
      {punyaRender && (
        <a
          href={`/api/admin/unggahan/${jobId}/halaman/${halamanId}`}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-xl border border-line bg-app"
        >
          {/* Render halaman disajikan rute admin, bukan komponen gambar Next:
              sumbernya butuh sesi admin sehingga tidak bisa dioptimalkan. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/admin/unggahan/${jobId}/halaman/${halamanId}`}
            alt={`Render halaman ${halaman}`}
            className="block h-auto w-full"
          />
        </a>
      )}

      <div className="flex min-w-0 flex-col gap-3">
        {lebar !== null && tinggi !== null && (
          <p className="m-0 text-[12px] text-dim">
            Render {lebar}×{tinggi} px
          </p>
        )}

        {hasil?.ok === false && (
          <p className="m-0 rounded-lg bg-wrong-bg px-3 py-2 text-[13px] font-semibold text-wrong-fg">
            Hasil ekstraksi tidak sesuai skema — {hasil.alasan}
          </p>
        )}

        {hasil?.ok && hasil.halaman.peringatan.length > 0 && (
          <p className="m-0 rounded-lg bg-warn-bg px-3 py-2 text-[13px] text-warn-fg">
            Catatan model: {hasil.halaman.peringatan.join("; ")}
          </p>
        )}

        {hasil?.ok &&
          hasil.halaman.soal.map((s) => {
            const rendah = s.konfidensi < AMBANG_KONFIDENSI;
            return (
              <article
                key={s.tempId}
                className={`flex flex-col gap-1.5 rounded-xl border px-4 py-3 ${
                  rendah || s.perluTinjau
                    ? "border-risk-line bg-risk-bg"
                    : "border-line bg-app"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-[.06em]">
                  <span className="rounded-full bg-fill-2 px-2 py-0.5 text-ink-3">
                    {s.nomor === null ? "TANPA NOMOR" : `NO. ${s.nomor}`}
                  </span>
                  <span className="rounded-full bg-fill-2 px-2 py-0.5 text-ink-3">
                    {s.tipe.toUpperCase()}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      rendah
                        ? "bg-warn-bg text-warn-fg"
                        : "bg-teal-light text-teal-dark"
                    }`}
                  >
                    {Math.round(s.konfidensi * 100)}%
                  </span>
                  {s.lanjutanDariSebelumnya && (
                    <span className="rounded-full bg-app px-2 py-0.5 text-dim">
                      LANJUTAN
                    </span>
                  )}
                  {s.berlanjutKeBerikutnya && (
                    <span className="rounded-full bg-app px-2 py-0.5 text-dim">
                      BERSAMBUNG
                    </span>
                  )}
                </div>

                <p className="m-0 text-[13.5px] leading-relaxed text-ink">
                  {s.stem.teks?.trim() || "(tidak ada teks stem)"}
                </p>

                {s.opsi.length > 0 && (
                  <ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-[13px] text-ink-2">
                    {s.opsi.map((o) => (
                      <li key={o.kunci}>
                        <span className="font-semibold">{o.kunci}.</span>{" "}
                        {o.teks?.trim() || `(${o.jenisIsi})`}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Aset ditampilkan sebagai gambar: justru potongan inilah yang
                    perlu diaudit, karena itu yang sampai ke siswa. */}
                {s.aset.filter((a) => a.kunci).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {s.aset
                      .filter((a) => a.kunci)
                      .map((a) => (
                        <figure key={a.tempId} className="m-0 w-[128px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={urlGambar(a.kunci!)}
                            alt={a.altText ?? `Aset ${a.peran}`}
                            className="block h-auto w-full rounded-lg border border-line bg-surface"
                          />
                          <figcaption className="mt-1 text-[10.5px] font-semibold tracking-[.04em] text-dim">
                            {a.peran.toUpperCase()}
                          </figcaption>
                        </figure>
                      ))}
                  </div>
                )}

                {s.alasanTinjau.length > 0 && (
                  <p className="m-0 text-[12.5px] text-warn-fg">
                    Alasan tinjau: {s.alasanTinjau.join("; ")}
                  </p>
                )}
              </article>
            );
          })}

        {rawEkstraksi && (
          <details className="text-[13px]">
            <summary className="cursor-pointer font-semibold text-ink-2">
              JSON ekstraksi apa adanya
            </summary>
            <pre className="mt-2.5 max-h-[320px] overflow-auto whitespace-pre-wrap break-all rounded-xl bg-forest px-4 py-3 font-mono text-[11.5px] leading-[1.6] text-mint-soft">
              {jsonRapi(rawEkstraksi)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
