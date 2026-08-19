import Link from "next/link";
import { ActivityCard } from "@/components/ActivityCard";
import { AppHeader } from "@/components/AppHeader";
import { KatalogFilter } from "@/components/KatalogFilter";
import { metaKatalog } from "@/lib/format";
import { ambilKatalog } from "@/lib/katalog";
import { kelasValid, mapelValid } from "@/lib/kategori";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kumpulan Soal — SoalSnap",
  description: "Latihan interaktif yang dibagikan publik, dapat difilter per kelas dan mata pelajaran.",
};

type Params = Promise<{ kelas?: string; mapel?: string; q?: string; halaman?: string }>;

/** Halaman katalog soal publik. */
export default async function KumpulanPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const kelas = kelasValid(sp.kelas) ? sp.kelas : undefined;
  const mapel = mapelValid(sp.mapel) ? sp.mapel : undefined;
  const q = sp.q?.trim() || undefined;
  const halaman = Number(sp.halaman) > 0 ? Number(sp.halaman) : 1;

  const { item, total, totalHalaman } = await ambilKatalog({ kelas, mapel, q, halaman });

  const tautanHalaman = (n: number) => {
    const p = new URLSearchParams();
    if (kelas) p.set("kelas", kelas);
    if (mapel) p.set("mapel", mapel);
    if (q) p.set("q", q);
    if (n > 1) p.set("halaman", String(n));
    const s = p.toString();
    return s ? `/kumpulan?${s}` : "/kumpulan";
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-[1160px] flex-col gap-6 px-6 pb-20 pt-9">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[300px] flex-1">
            <h1 className="m-0 mb-1.5 font-display text-[30px] font-extrabold">Kumpulan soal</h1>
            <p className="m-0 text-[14.5px] text-ink-3 text-pretty">
              Latihan yang dibagikan publik oleh sesama guru dan tutor. Bebas dimainkan
              siapa saja, tanpa akun.
            </p>
          </div>
          <Link
            href="/buat"
            className="rounded-full bg-teal px-6 py-3 font-display text-[15px] font-bold text-surface no-underline hover:bg-teal-dark hover:text-surface hover:no-underline"
          >
            Bagikan soalmu
          </Link>
        </div>

        <KatalogFilter kelas={kelas} mapel={mapel} q={q} />

        <p className="m-0 text-[13.5px] font-semibold text-ink-2">
          {total} soal ditemukan
          {kelas || mapel ? ` untuk ${[kelas, mapel].filter(Boolean).join(" · ")}` : ""}
        </p>

        {item.length === 0 ? (
          <div className="rounded-panel border-2 border-dashed border-line-hover bg-white/60 px-6 py-16 text-center">
            <p className="m-0 font-display text-[19px] font-bold">Belum ada soal di sini</p>
            <p className="m-0 mt-2 text-[14px] text-ink-3">
              Coba ubah filternya, atau jadilah yang pertama membagikan soal untuk kategori ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-[18px]">
            {item.map((it) => (
              <ActivityCard
                key={it.id}
                kartu={{
                  title: it.title,
                  template: it.template,
                  meta: metaKatalog(it),
                  playSlug: it.playSlug,
                  kategori: [it.kelas, it.mapel].filter(Boolean).join(" · ") || null,
                }}
              />
            ))}
          </div>
        )}

        {totalHalaman > 1 && (
          <nav className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {Array.from({ length: totalHalaman }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={tautanHalaman(n)}
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
    </div>
  );
}
