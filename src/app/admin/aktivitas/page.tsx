import Link from "next/link";
import { pastikanAdmin } from "@/lib/admin/sesi";
import { cariAktivitas } from "@/lib/admin/data";
import { formatTanggal } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { templateOf } from "@/lib/serialize";
import { templateLabel } from "@/lib/templates";
import { adminQuerySchema } from "@/lib/validasi";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

/** Daftar seluruh aktivitas — publik maupun privat — untuk ditelusuri admin. */
export default async function AdminAktivitasPage({ searchParams }: { searchParams: Params }) {
  await pastikanAdmin();

  const sp = await searchParams;
  const terurai = adminQuerySchema.safeParse(sp);
  const filter = terurai.success ? terurai.data : { halaman: 1 };

  const { baris, total, totalHalaman } = await cariAktivitas({
    q: filter.q,
    visibility: filter.visibility,
    dilaporkan: filter.dilaporkan === "ya",
    halaman: filter.halaman,
  });

  const tautanHalaman = (n: number) => {
    const p = new URLSearchParams();
    if (filter.q) p.set("q", filter.q);
    if (filter.visibility) p.set("visibility", filter.visibility);
    if (filter.dilaporkan) p.set("dilaporkan", "ya");
    if (n > 1) p.set("halaman", String(n));
    const s = p.toString();
    return s ? `/admin/aktivitas?${s}` : "/admin/aktivitas";
  };

  return (
    <main className="mx-auto flex w-full max-w-[1160px] flex-col gap-5 px-6 pb-20 pt-9">
      <div>
        <h1 className="m-0 font-display text-[30px] font-extrabold">Aktivitas</h1>
        <p className="m-0 mt-1.5 text-[14.5px] text-ink-3">
          {total} aktivitas tercatat. Klik judulnya untuk membaca seluruh soal dan kunci
          jawabannya.
        </p>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-panel border border-line bg-surface p-5"
      >
        <label className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[.08em] text-dim">CARI JUDUL</span>
          <input
            name="q"
            defaultValue={filter.q ?? ""}
            placeholder="Kata pada judul soal…"
            className="w-full rounded-xl border-[1.5px] border-line px-4 py-2.5 text-[15px] outline-none focus:border-teal"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[.08em] text-dim">STATUS</span>
          <select
            name="visibility"
            defaultValue={filter.visibility ?? ""}
            className="rounded-xl border-[1.5px] border-line px-4 py-2.5 text-[15px] outline-none focus:border-teal"
          >
            <option value="">Semua</option>
            <option value="public">Publik</option>
            <option value="private">Privat</option>
          </select>
        </label>

        <label className="flex items-center gap-2 pb-2.5 text-[14px] font-semibold text-ink-2">
          <input
            type="checkbox"
            name="dilaporkan"
            value="ya"
            defaultChecked={filter.dilaporkan === "ya"}
            className="h-4 w-4 accent-teal"
          />
          Hanya yang dilaporkan
        </label>

        <button
          type="submit"
          className="rounded-full bg-teal px-6 py-2.5 font-display text-sm font-bold text-surface transition-colors hover:bg-teal-dark"
        >
          Terapkan
        </button>
      </form>

      {baris.length === 0 ? (
        <div className="rounded-panel border-2 border-dashed border-line-hover bg-white/60 px-6 py-16 text-center">
          <p className="m-0 font-display text-[19px] font-bold">Tidak ada yang cocok</p>
          <p className="m-0 mt-2 text-[14px] text-ink-3">Coba longgarkan filternya.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-panel border border-line bg-surface">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-line text-[11px] font-bold tracking-[.08em] text-dim">
                <th className="px-5 py-3">JUDUL</th>
                <th className="px-5 py-3">STATUS</th>
                <th className="px-5 py-3">KATEGORI</th>
                <th className="px-5 py-3 text-right">SOAL</th>
                <th className="px-5 py-3 text-right">MAIN</th>
                <th className="px-5 py-3 text-right">LAPORAN</th>
                <th className="px-5 py-3">DIBUAT</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((a) => (
                <tr key={a.id} className="border-b border-line-soft last:border-b-0">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/aktivitas/${a.id}`}
                      className="font-semibold text-ink no-underline hover:underline"
                    >
                      {a.title}
                    </Link>
                    <div className="mt-0.5 text-[12px] text-dim">
                      {templateLabel(templateOf(a.template))}
                      {a.creatorEmail ? ` · ${a.creatorEmail}` : ""}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge publik={a.visibility === "public"} diturunkan={Boolean(a.takedownAt)} />
                  </td>
                  <td className="px-5 py-3 text-[13px] text-ink-3">
                    {[a.kelas, a.mapel].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{a._count.questions}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{a.plays}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {a._count.reports > 0 ? (
                      <span className="rounded-full bg-warn-bg px-2.5 py-1 text-[12px] font-bold text-warn-fg">
                        {a._count.reports}
                      </span>
                    ) : (
                      <span className="text-dim">0</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-ink-3">
                    {formatTanggal(a.createdAt.getTime())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalHalaman > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {Array.from({ length: totalHalaman }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={tautanHalaman(n)}
              aria-current={n === filter.halaman ? "page" : undefined}
              className={`min-w-10 rounded-[10px] border px-3 py-2 text-center text-sm font-bold no-underline ${
                n === filter.halaman
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
