"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { PanahKananIcon } from "@/components/Icons";
import { QuestionCard } from "@/components/QuestionCard";
import { RekapPeserta } from "@/components/RekapPeserta";
import { tautanEdit, tautanMain } from "@/lib/format";
import { soalKosong, useStore } from "@/lib/store";
import { templateLabel } from "@/lib/templates";
import { useActivity } from "@/lib/useActivity";
import type { Question } from "@/lib/types";

/** Halaman pemilik soal: sunting soal, lihat rekap, kelola tautan. */
export default function EditPage() {
  const { editSlug } = useParams<{ editSlug: string }>();
  const { activity, sessions, status, pesan, simpan } = useActivity(editSlug);
  const lupakanMilikku = useStore((s) => s.lupakanMilikku);

  const router = useRouter();
  const [salinan, setSalinan] = useState<{ id: string; soal: Question[] } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kotor, setKotor] = useState(false);

  // Salin soal dari server sekali per aktivitas; sesudahnya editor yang
  // memegang kendali. Diturunkan saat render, bukan lewat efek.
  if (activity && salinan?.id !== activity.id) {
    setSalinan({ id: activity.id, soal: activity.questions });
  }
  const soal = salinan?.soal ?? null;
  const setSoal = (f: (list: Question[]) => Question[]) =>
    setSalinan((s) => (s ? { ...s, soal: f(s.soal) } : s));

  if (status === "hilang") {
    return <Pesan judul="Aktivitas tidak ditemukan" isi="Tautan sunting ini sudah tidak berlaku." />;
  }
  if (!activity || soal === null) {
    return <Pesan judul="Memuat…" />;
  }

  const ubah = (id: string, patch: Partial<Question>) => {
    setSoal((list) => list.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    setKotor(true);
  };

  const hapus = (id: string) => {
    setSoal((list) => list.filter((q) => q.id !== id));
    if (editingId === id) setEditingId(null);
    setKotor(true);
  };

  const tambah = () => {
    const q = soalKosong("manual");
    setSoal((list) => [...list, q]);
    setEditingId(q.id);
    setKotor(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-[1160px] flex-col gap-5 px-6 pb-20 pt-9">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 sm:min-w-[300px] flex-1">
            <h1 className="m-0 mb-1.5 font-display text-[30px] font-extrabold">{activity.title}</h1>
            <p className="m-0 text-[14.5px] text-ink-3">
              {templateLabel(activity.template)} · {soal.length} soal ·{" "}
              {activity.visibility === "public" ? "publik di kumpulan soal" : "privat"} ·{" "}
              {activity.plays} kali dimainkan
            </p>
          </div>
          <Link
            href={`/buat/bagikan?edit=${editSlug}`}
            className="rounded-full border border-line px-[18px] py-[9px] text-[13.5px] font-semibold text-ink-3 no-underline transition-colors hover:border-line-hover hover:text-ink hover:no-underline"
          >
            Pengaturan &amp; bagikan
          </Link>
          <Link
            href={`/main/${activity.playSlug}?pratinjau=1`}
            className="rounded-full bg-teal px-5 py-[9px] font-display text-[13.5px] font-bold text-surface no-underline hover:bg-teal-dark hover:text-surface hover:no-underline"
          >
            Coba mainkan
          </Link>
        </div>

        <div className="grid grid-cols-1 items-start gap-[26px] lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-3.5">
            {soal.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                no={i + 1}
                editing={editingId === q.id}
                onToggleEdit={() => setEditingId(editingId === q.id ? null : q.id)}
                onChange={(patch) => ubah(q.id, patch)}
                onDelete={() => hapus(q.id)}
              />
            ))}

            <div className="sticky bottom-4 mt-2 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-[18px] py-3.5 shadow-sticky">
              <button
                type="button"
                onClick={tambah}
                className="rounded-full border-[1.5px] border-dashed border-line-hover px-5 py-[11px] text-sm font-semibold text-ink-2 transition-colors hover:border-teal hover:text-teal"
              >
                + Tambah soal manual
              </button>
              <span className="flex-1" />
              <span className="text-xs font-semibold text-dim" role="status">
                {status === "menyimpan"
                  ? "Menyimpan…"
                  : status === "gagal"
                    ? (pesan ?? "Gagal menyimpan")
                    : kotor
                      ? "Ada perubahan belum tersimpan"
                      : "Tersimpan"}
              </span>
              <button
                type="button"
                disabled={!kotor || soal.length === 0}
                onClick={async () => {
                  await simpan({ questions: soal });
                  setKotor(false);
                }}
                className="flex items-center gap-2.5 rounded-full bg-teal px-[26px] py-[13px] font-display text-[15px] font-bold text-surface transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                Simpan perubahan
                <PanahKananIcon size={16} />
              </button>
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5 rounded-panel border border-line bg-surface p-5">
              <span className="text-[11px] font-bold tracking-[.08em] text-dim">
                TAUTAN SISWA
              </span>
              <div className="truncate rounded-xl bg-app px-3.5 py-2.5 text-[13px] font-semibold text-teal-dark">
                {tautanMain(activity.playSlug)}
              </div>
              <CopyLinkButton url={tautanMain(activity.playSlug)} label="Salin tautan siswa" />
              <span className="mt-2 text-[11px] font-bold tracking-[.08em] text-warn-fg">
                TAUTAN EDIT — jangan dibagikan
              </span>
              <CopyLinkButton url={tautanEdit(editSlug)} label="Salin tautan edit" />
            </div>

            <RekapPeserta sessions={sessions} />

            <button
              type="button"
              onClick={async () => {
                if (!confirm("Hapus aktivitas ini beserta seluruh hasil pesertanya?")) return;
                const res = await fetch(`/api/activities/${editSlug}`, { method: "DELETE" });
                if (res.ok) {
                  lupakanMilikku(editSlug);
                  router.push("/dashboard");
                }
              }}
              className="rounded-full border-[1.5px] border-line px-5 py-2.5 text-[13px] font-semibold text-ink-3 transition-colors hover:border-wrong hover:text-wrong"
            >
              Hapus aktivitas
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Pesan({ judul, isi }: { judul: string; isi?: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-[620px] flex-col items-center gap-3 px-6 pt-20 text-center">
        <h1 className="m-0 font-display text-2xl font-bold">{judul}</h1>
        {isi && <p className="m-0 text-[15px] text-ink-3">{isi}</p>}
      </main>
    </div>
  );
}
