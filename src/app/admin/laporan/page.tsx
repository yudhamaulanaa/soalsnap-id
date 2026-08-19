import Link from "next/link";
import { AksiLaporan } from "@/components/admin/AksiLaporan";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { daftarLaporan } from "@/lib/admin/data";
import { pastikanAdmin } from "@/lib/admin/sesi";
import { formatWaktu } from "@/lib/format";
import { STATUS_LAPORAN, labelAlasan, labelStatus } from "@/lib/laporan";

export const dynamic = "force-dynamic";

type Params = Promise<{ status?: string; halaman?: string }>;

/** Antrean laporan konten dari peserta dan guru lain. */
export default async function AdminLaporanPage({ searchParams }: { searchParams: Params }) {
  await pastikanAdmin();

  const sp = await searchParams;
  const status = STATUS_LAPORAN.find((s) => s === sp.status);
  const halaman = Number(sp.halaman) > 0 ? Number(sp.halaman) : 1;

  const { baris, total, totalHalaman } = await daftarLaporan(status, halaman);

  const tautan = (s?: string, n = 1) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (n > 1) p.set("halaman", String(n));
    const q = p.toString();
    return q ? `/admin/laporan?${q}` : "/admin/laporan";
  };

  return (
    <main className="mx-auto flex w-full max-w-[1160px] flex-col gap-5 px-6 pb-20 pt-9">
      <div>
        <h1 className="m-0 font-display text-[30px] font-extrabold">Laporan</h1>
        <p className="m-0 mt-1.5 text-[14.5px] text-ink-3">
          {total} laporan{status ? ` berstatus ${labelStatus(status).toLowerCase()}` : ""}. Laporan
          dikirim lewat tombol “Laporkan” di halaman soal.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        <Tab href={tautan()} aktif={!status} label="Semua" />
        {STATUS_LAPORAN.map((s) => (
          <Tab key={s} href={tautan(s)} aktif={status === s} label={labelStatus(s)} />
        ))}
      </nav>

      {baris.length === 0 ? (
        <div className="rounded-panel border-2 border-dashed border-line-hover bg-white/60 px-6 py-16 text-center">
          <p className="m-0 font-display text-[19px] font-bold">Tidak ada laporan di sini</p>
          <p className="m-0 mt-2 text-[14px] text-ink-3">
            Antrean bersih — atau coba pilih status lain.
          </p>
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {baris.map((l) => (
            <li
              key={l.id}
              className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/admin/aktivitas/${l.activity.id}`}
                  className="font-display text-[16px] font-bold text-ink no-underline hover:underline"
                >
                  {l.activity.title}
                </Link>
                <StatusBadge
                  publik={l.activity.visibility === "public"}
                  diturunkan={Boolean(l.activity.takedownAt)}
                />
                <span
                  className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${
                    l.status === "baru" ? "bg-warn-bg text-warn-fg" : "bg-fill-2 text-ink-3"
                  }`}
                >
                  {labelStatus(l.status)}
                </span>
              </div>

              <div className="text-[14px]">
                <span className="font-semibold text-ink-2">{labelAlasan(l.alasan)}</span>
                {l.catatan && <span className="text-ink-3"> — “{l.catatan}”</span>}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[12.5px] text-dim">
                  Dilaporkan {formatWaktu(l.createdAt.getTime())}
                  {l.selesaiAt ? ` · ditutup ${formatWaktu(l.selesaiAt.getTime())}` : ""}
                </span>
                {l.status === "baru" && <AksiLaporan id={l.id} />}
              </div>
            </li>
          ))}
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
