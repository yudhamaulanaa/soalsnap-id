import Link from "next/link";
import { notFound } from "next/navigation";
import { AksiLaporan } from "@/components/admin/AksiLaporan";
import { AksiModerasi } from "@/components/admin/AksiModerasi";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { GambarSoal } from "@/components/GambarSoal";
import { aktivitasLengkap } from "@/lib/admin/data";
import { pastikanAdmin } from "@/lib/admin/sesi";
import { formatWaktu } from "@/lib/format";
import { labelAlasan, labelStatus } from "@/lib/laporan";
import { soalDari, templateOf } from "@/lib/serialize";
import { templateLabel } from "@/lib/templates";
import type { Question } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Audit satu aktivitas: seluruh soal beserta kuncinya, laporan, dan aksi moderasi. */
export default async function AdminDetailPage({ params }: Ctx) {
  await pastikanAdmin();

  const { id } = await params;
  const a = await aktivitasLengkap(id);
  if (!a) notFound();

  const publik = a.visibility === "public";
  const diturunkan = Boolean(a.takedownAt);
  const laporanBaru = a.reports.filter((l) => l.status === "baru");

  return (
    <main className="mx-auto flex w-full max-w-[1160px] flex-col gap-6 px-6 pb-20 pt-9">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/aktivitas"
          className="text-[13px] font-semibold text-ink-3 no-underline hover:underline"
        >
          ← Semua aktivitas
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 font-display text-[28px] font-extrabold">{a.title}</h1>
          <StatusBadge publik={publik} diturunkan={diturunkan} />
        </div>
        <p className="m-0 text-[14px] text-ink-3">
          {templateLabel(templateOf(a.template))} · {a.questions.length} soal ·{" "}
          {[a.kelas, a.mapel].filter(Boolean).join(" · ") || "tanpa kategori"} · dibuat{" "}
          {formatWaktu(a.createdAt.getTime())}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <section className="flex flex-col gap-3">
          <h2 className="m-0 font-display text-[19px] font-bold">Isi soal</h2>
          {a.questions.length === 0 ? (
            <p className="m-0 text-[14.5px] text-ink-3">Aktivitas ini belum punya soal.</p>
          ) : (
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {a.questions.map((row, i) => (
                <KartuSoal key={row.id} nomor={i + 1} soal={soalDari(row)} />
              ))}
            </ol>
          )}
        </section>

        <aside className="flex flex-col gap-5">
          <Panel judul="Moderasi">
            {diturunkan && (
              <div className="mb-3 rounded-xl bg-wrong-bg px-4 py-3 text-[13px] text-wrong-fg">
                Diturunkan {formatWaktu(a.takedownAt!.getTime())}
                {a.takedownAlasan ? ` — ${a.takedownAlasan}` : ""}
              </div>
            )}
            <AksiModerasi
              id={a.id}
              publik={publik}
              diturunkan={diturunkan}
              setelahHapus="/admin/aktivitas"
            />
          </Panel>

          <Panel judul={`Laporan (${a.reports.length})`}>
            {a.reports.length === 0 ? (
              <p className="m-0 text-[13.5px] text-ink-3">Belum ada laporan atas aktivitas ini.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {a.reports.map((l) => (
                  <li key={l.id} className="flex flex-col gap-2 rounded-xl bg-app px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[14px] font-bold">
                        {labelAlasan(l.alasan)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          l.status === "baru"
                            ? "bg-warn-bg text-warn-fg"
                            : "bg-fill-2 text-ink-3"
                        }`}
                      >
                        {labelStatus(l.status)}
                      </span>
                    </div>
                    {l.catatan && (
                      <p className="m-0 text-[13px] text-ink-2 text-pretty">“{l.catatan}”</p>
                    )}
                    <span className="text-[12px] text-dim">
                      {formatWaktu(l.createdAt.getTime())}
                    </span>
                    {l.status === "baru" && <AksiLaporan id={l.id} />}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel judul="Pembuat">
            <dl className="m-0 flex flex-col gap-2 text-[13.5px]">
              <Baris label="Nama" nilai={a.creatorName} />
              <Baris label="Email" nilai={a.creatorEmail} />
              <Baris label="Telepon" nilai={a.creatorPhone} />
            </dl>
            <p className="m-0 mt-3 text-[12px] text-dim">
              Kontak ini hanya untuk menindaklanjuti penyalahgunaan. Tautan sunting pemilik
              sengaja tidak ditampilkan di sini.
            </p>
          </Panel>

          <Panel judul={`Peserta (${a._count.sessions})`}>
            <p className="m-0 mb-2 text-[13px] text-ink-3">
              Dimainkan {a.plays} kali.{" "}
              <Link
                href={`/main/${a.playSlug}?pratinjau=1`}
                className="font-semibold text-teal-dark no-underline hover:underline"
              >
                Buka seperti siswa
              </Link>
            </p>
            {a.sessions.length === 0 ? (
              <p className="m-0 text-[13.5px] text-ink-3">Belum ada yang mengerjakan.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[13px]">
                {a.sessions.slice(0, 10).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3">
                    <span className="truncate">{s.playerName || "Tanpa nama"}</span>
                    <span className="shrink-0 tabular-nums text-ink-3">
                      {s.score}/{s.total}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>

      {laporanBaru.length > 0 && (
        <p className="m-0 text-[13px] font-semibold text-warn-fg">
          {laporanBaru.length} laporan masih menunggu keputusan.
        </p>
      )}
    </main>
  );
}

function Panel({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="rounded-panel border border-line bg-surface p-5">
      <h2 className="m-0 mb-3 font-display text-[15px] font-bold">{judul}</h2>
      {children}
    </section>
  );
}

function Baris({ label, nilai }: { label: string; nilai: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-dim">{label}</dt>
      <dd className="m-0 truncate text-right font-semibold text-ink-2">{nilai || "—"}</dd>
    </div>
  );
}

const LABEL_TIPE: Record<Question["type"], string> = {
  pg: "Pilihan ganda",
  bs: "Benar / salah",
  isian: "Isian singkat",
};

function KartuSoal({ nomor, soal }: { nomor: number; soal: Question }) {
  return (
    <li className="rounded-panel border border-line bg-surface p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-[.06em]">
        <span className="rounded-full bg-fill-2 px-2.5 py-1 text-ink-3">SOAL {nomor}</span>
        <span className="rounded-full bg-ai-light px-2.5 py-1 text-ai">
          {LABEL_TIPE[soal.type].toUpperCase()}
        </span>
        {soal.low && (
          <span className="rounded-full bg-warn-bg px-2.5 py-1 text-warn-fg">
            KEYAKINAN {soal.conf}
          </span>
        )}
        {soal.page && <span className="rounded-full bg-app px-2.5 py-1 text-dim">HAL {soal.page}</span>}
      </div>

      <p className="m-0 font-display text-[16px] font-bold text-pretty">{soal.q}</p>

      {/* Gambar ikut ditinjau: soal bergambar bisa disalahgunakan justru lewat
          gambarnya, dan audit yang hanya membaca teks tidak akan melihatnya. */}
      {soal.gambar && <GambarSoal kunci={soal.gambar} alt={soal.gambarAlt} className="mt-3" />}

      {soal.opts && soal.opts.length > 0 && (
        <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
          {soal.opts.map((o, i) => (
            <li
              key={i}
              className={`rounded-[10px] px-3 py-2 text-[14px] ${
                i === soal.correct
                  ? "bg-teal-light font-semibold text-teal-dark"
                  : "bg-app text-ink-2"
              }`}
            >
              {String.fromCharCode(97 + i)}. {o}
              {i === soal.correct && " ✓"}
            </li>
          ))}
        </ul>
      )}

      {soal.type === "isian" && (
        <p className="m-0 mt-3 text-[14px]">
          <span className="text-dim">Kunci: </span>
          <span className="font-semibold text-teal-dark">{soal.key || "—"}</span>
        </p>
      )}

      {soal.note && <p className="m-0 mt-2 text-[13px] text-warn-fg">{soal.note}</p>}
    </li>
  );
}
