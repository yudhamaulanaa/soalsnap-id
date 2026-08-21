import Link from "next/link";
import { StatusJob } from "@/components/admin/StatusJob";
import { daftarJob } from "@/lib/admin/data";
import { pastikanAdmin } from "@/lib/admin/sesi";
import { formatWaktu } from "@/lib/format";
import { STATUS_JOB, labelStatusJob } from "@/lib/laporan";

export const dynamic = "force-dynamic";

type Params = Promise<{ status?: string; halaman?: string }>;

/** Antrean unggahan: apa yang sudah dibaca mesin OCR, dan apa yang gagal. */
export default async function AdminUnggahanPage({ searchParams }: { searchParams: Params }) {
  await pastikanAdmin();

  const sp = await searchParams;
  const status = STATUS_JOB.find((s) => s === sp.status);
  const halaman = Number(sp.halaman) > 0 ? Number(sp.halaman) : 1;
  const { baris, total, totalHalaman } = await daftarJob(status, halaman);

  const tautan = (s?: string, n = 1) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (n > 1) p.set("halaman", String(n));
    const q = p.toString();
    return q ? `/admin/unggahan?${q}` : "/admin/unggahan";
  };

  return (
    <main className="mx-auto flex w-full max-w-[1160px] flex-col gap-5 px-6 pb-20 pt-9">
      <div>
        <h1 className="m-0 font-display text-[26px] font-extrabold sm:text-[30px]">Unggahan</h1>
        <p className="m-0 mt-1.5 text-[14.5px] text-ink-3">
          {total} dokumen diunggah. Hasil bacanya disimpan apa adanya — belum disusun menjadi
          soal.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        <Tab href={tautan()} aktif={!status} label="Semua" />
        {STATUS_JOB.map((s) => (
          <Tab key={s} href={tautan(s)} aktif={status === s} label={labelStatusJob(s)} />
        ))}
      </nav>

      {baris.length === 0 ? (
        <div className="rounded-panel border-2 border-dashed border-line-hover bg-white/60 px-6 py-16 text-center">
          <p className="m-0 font-display text-[19px] font-bold">Belum ada unggahan di sini</p>
          <p className="m-0 mt-2 text-[14px] text-ink-3">Coba pilih status lain.</p>
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {baris.map((job) => {
            const halamanTerbaca = job.uploads.reduce((n, u) => n + u._count.halamanOcr, 0);
            const cuplikan = job.uploads.find((u) => u.halamanOcr[0]?.teks)?.halamanOcr[0]?.teks;
            return (
              <li
                key={job.id}
                className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    href={`/admin/unggahan/${job.id}`}
                    className="font-display text-[16px] font-bold text-ink no-underline hover:underline"
                  >
                    {job.uploads.map((u) => u.namaAsli).join(" · ") || "Tanpa berkas"}
                  </Link>
                  <StatusJob status={job.status} />
                  {job.status === "diproses" && (
                    <span className="text-[12.5px] font-semibold text-ai">{job.progres}%</span>
                  )}
                </div>

                {job.galat && (
                  <p className="m-0 rounded-xl bg-wrong-bg px-4 py-2.5 text-[13px] text-wrong-fg">
                    {job.galat}
                  </p>
                )}

                {/* Cuplikan hasil baca: tanpa ini daftar tidak memperlihatkan
                    bahwa ada isi yang bisa dibuka. */}
                {cuplikan && (
                  <p className="m-0 line-clamp-2 whitespace-pre-wrap rounded-xl bg-app px-4 py-2.5 font-mono text-[12.5px] leading-[1.6] text-ink-2">
                    {cuplikan.slice(0, 240)}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-dim">
                  <span>{job.uploads.length} berkas</span>
                  <span>{halamanTerbaca} halaman terbaca</span>
                  {job.tahap && <span>{job.tahap}</span>}
                  <span>Diunggah {formatWaktu(job.createdAt.getTime())}</span>
                  {job.workerId && <span>Worker {job.workerId}</span>}
                </div>

                <Link
                  href={`/admin/unggahan/${job.id}`}
                  className="self-start rounded-full border-[1.5px] border-line px-4 py-2 text-[13px] font-semibold text-ink-2 no-underline transition-colors hover:border-teal hover:text-teal hover:no-underline"
                >
                  {halamanTerbaca > 0 ? "Baca hasil OCR mentah →" : "Lihat rincian →"}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {totalHalaman > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {Array.from({ length: totalHalaman }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={tautan(status, n)}
              aria-current={n === halaman ? "page" : undefined}
              className={`min-w-10 rounded-[10px] border px-3 py-2 text-center text-sm font-bold no-underline ${
                n === halaman
                  ? "border-teal bg-teal text-surface hover:text-surface"
                  : "border-line bg-surface text-ink-2 hover:border-line-hover hover:text-ink-2"
              } hover:no-underline`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </main>
  );
}

function Tab({ href, aktif, label }: { href: string; aktif: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={aktif ? "page" : undefined}
      className={`rounded-full border px-4 py-2 text-[13.5px] font-semibold no-underline hover:no-underline ${
        aktif
          ? "border-teal bg-teal text-surface hover:text-surface"
          : "border-line bg-surface text-ink-2 hover:border-line-hover hover:text-ink-2"
      }`}
    >
      {label}
    </Link>
  );
}
