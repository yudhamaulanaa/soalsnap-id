import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { TombolKeluarAkun } from "@/components/auth/TombolKeluarAkun";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { wajibMasuk } from "@/lib/auth/sesi";
import { prisma } from "@/lib/db";
import { formatTanggal } from "@/lib/format";
import { templateOf } from "@/lib/serialize";
import { templateLabel } from "@/lib/templates";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Soal Saya — SoalSnap",
  robots: { index: false, follow: false },
};

/**
 * Kumpulan soal milik satu akun.
 *
 * Berbeda dari "Aktivitas Saya" di Dashboard yang membaca localStorage, daftar
 * ini datang dari basis data — jadi tetap ada di perangkat lain dan tidak ikut
 * hilang saat penyimpanan peramban dibersihkan.
 */
export default async function SoalSayaPage() {
  const pengguna = await wajibMasuk();

  const aktivitas = await prisma.activity.findMany({
    where: { userId: pengguna.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      editSlug: true,
      playSlug: true,
      title: true,
      template: true,
      visibility: true,
      kelas: true,
      mapel: true,
      plays: true,
      createdAt: true,
      takedownAt: true,
      _count: { select: { questions: true, sessions: true } },
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-[1060px] flex-col gap-6 px-6 pb-20 pt-9">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[280px] flex-1">
            <h1 className="m-0 mb-1.5 font-display text-[30px] font-extrabold">Soal Saya</h1>
            <p className="m-0 text-[14.5px] text-ink-3 text-pretty">
              Masuk sebagai <strong className="text-ink-2">{pengguna.email}</strong> ·{" "}
              {aktivitas.length} aktivitas tersimpan di akun ini.
            </p>
          </div>
          <Link
            href="/buat"
            className="rounded-full bg-teal px-6 py-3 font-display text-[15px] font-bold text-surface no-underline hover:bg-teal-dark hover:text-surface hover:no-underline"
          >
            Buat soal baru
          </Link>
          <TombolKeluarAkun />
        </div>

        {aktivitas.length === 0 ? (
          <div className="rounded-panel border-2 border-dashed border-line-hover bg-white/60 px-6 py-16 text-center">
            <p className="m-0 font-display text-[19px] font-bold">Belum ada soal di akun ini</p>
            <p className="m-0 mx-auto mt-2 max-w-[420px] text-[14px] leading-[1.6] text-ink-3 text-pretty">
              Soal yang kamu buat setelah ini otomatis terkumpul di sini. Soal lama juga
              ikut, selama dibuat dengan alamat email yang sama atau tautan suntingnya
              masih tersimpan di peramban yang kamu pakai saat masuk.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-panel border border-line bg-surface">
            <table className="w-full border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b border-line text-[11px] font-bold tracking-[.08em] text-dim">
                  <th className="px-5 py-3">JUDUL</th>
                  <th className="px-5 py-3">STATUS</th>
                  <th className="px-5 py-3 text-right">SOAL</th>
                  <th className="px-5 py-3 text-right">MAIN</th>
                  <th className="px-5 py-3">DIBUAT</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {aktivitas.map((a) => (
                  <tr key={a.id} className="border-b border-line-soft last:border-b-0">
                    <td className="px-5 py-3">
                      <Link
                        href={`/edit/${a.editSlug}`}
                        className="font-semibold text-ink no-underline hover:underline"
                      >
                        {a.title}
                      </Link>
                      <div className="mt-0.5 text-[12px] text-dim">
                        {templateLabel(templateOf(a.template))}
                        {[a.kelas, a.mapel].filter(Boolean).length > 0 &&
                          ` · ${[a.kelas, a.mapel].filter(Boolean).join(" · ")}`}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge
                        publik={a.visibility === "public"}
                        diturunkan={Boolean(a.takedownAt)}
                      />
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{a._count.questions}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{a.plays}</td>
                    <td className="px-5 py-3 text-[13px] text-ink-3">
                      {formatTanggal(a.createdAt.getTime())}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/main/${a.playSlug}`}
                        className="rounded-full border-[1.5px] border-line px-4 py-2 text-[13px] font-semibold text-ink-2 no-underline hover:border-line-hover hover:text-ink-2 hover:no-underline"
                      >
                        Buka
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="m-0 text-[13px] leading-[1.6] text-dim text-pretty">
          Tautan sunting tetap berlaku seperti biasa. Akun hanya mengumpulkannya di satu
          tempat — kalau tautannya hilang, daftar ini yang menjadi jalan kembali.
        </p>
      </main>
    </div>
  );
}
