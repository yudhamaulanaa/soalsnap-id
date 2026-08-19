import Link from "next/link";
import { BenderaIcon } from "@/components/Icons";
import { pastikanAdmin } from "@/lib/admin/sesi";
import { daftarLaporan, ringkasanAdmin } from "@/lib/admin/data";
import { formatWaktu } from "@/lib/format";
import { labelAlasan } from "@/lib/laporan";

export const dynamic = "force-dynamic";

/** Ringkasan moderasi: angka besar, lalu antrean laporan yang menunggu. */
export default async function AdminPage() {
  await pastikanAdmin();

  const [angka, laporan] = await Promise.all([ringkasanAdmin(), daftarLaporan("baru", 1)]);

  return (
    <main className="mx-auto flex w-full max-w-[1160px] flex-col gap-7 px-6 pb-20 pt-9">
      <div>
        <h1 className="m-0 font-display text-[30px] font-extrabold">Ringkasan</h1>
        <p className="m-0 mt-1.5 text-[14.5px] text-ink-3">
          Semua aktivitas terlihat di sini, termasuk yang privat — halaman ini memang untuk
          audit isi soal.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
        <Angka label="Aktivitas" nilai={angka.aktivitas} />
        <Angka label="Publik di katalog" nilai={angka.publik} />
        <Angka label="Pernah diturunkan" nilai={angka.diturunkan} />
        <Angka label="Laporan menunggu" nilai={angka.laporanBaru} sorot={angka.laporanBaru > 0} />
        <Angka label="Total soal" nilai={angka.soal} />
        <Angka label="Sesi peserta" nilai={angka.sesi} />
      </div>

      <section className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 flex items-center gap-2.5 font-display text-[19px] font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-warn-bg text-warn-fg">
              <BenderaIcon size={17} />
            </span>
            Laporan menunggu tinjauan
          </h2>
          <Link
            href="/admin/laporan"
            className="text-[13.5px] font-semibold text-teal-dark no-underline hover:underline"
          >
            Lihat semua laporan
          </Link>
        </div>

        {laporan.baris.length === 0 ? (
          <p className="m-0 text-[14.5px] text-ink-3">
            Tidak ada laporan yang menunggu. Antrean bersih.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {laporan.baris.slice(0, 6).map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-app px-4 py-3"
              >
                <div className="min-w-[220px] flex-1">
                  <Link
                    href={`/admin/aktivitas/${l.activity.id}`}
                    className="font-display text-[15px] font-bold text-ink no-underline hover:underline"
                  >
                    {l.activity.title}
                  </Link>
                  <div className="mt-0.5 text-[12.5px] text-ink-3">
                    {labelAlasan(l.alasan)} · {formatWaktu(l.createdAt.getTime())}
                  </div>
                </div>
                <Link
                  href={`/admin/aktivitas/${l.activity.id}`}
                  className="rounded-full border-[1.5px] border-line bg-surface px-4 py-2 text-[13px] font-semibold text-ink-2 no-underline hover:border-line-hover hover:text-ink-2 hover:no-underline"
                >
                  Tinjau
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Angka({ label, nilai, sorot }: { label: string; nilai: number; sorot?: boolean }) {
  return (
    <div
      className={`rounded-panel border bg-surface px-5 py-4 ${
        sorot ? "border-risk-line bg-risk-bg" : "border-line"
      }`}
    >
      <div className={`font-display text-[27px] font-extrabold ${sorot ? "text-warn-fg" : ""}`}>
        {nilai}
      </div>
      <div className="mt-0.5 text-[12.5px] font-semibold text-ink-3">{label}</div>
    </div>
  );
}
