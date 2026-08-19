"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { TemplatePreview } from "@/components/TemplatePreview";
import { useStore } from "@/lib/store";
import { TEMPLATES, eligibility, recommendedTemplate } from "@/lib/templates";
import { TIMER_DEFAULT, TIMER_KUIS_CEPAT, type Activity, type TemplateId } from "@/lib/types";

/** Judul awal diusulkan dari isi soal (FR-SH-1). */
function judulUsulan(teks: string): string {
  const kata = teks
    .replace(/[…_]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4)
    .join(" ");
  return kata ? `Latihan: ${kata}` : "Latihan baru";
}

/** Page 05 — Pilih Template. Memilih template sekaligus menyimpan ke server. */
export default function TemplatePage() {
  const router = useRouter();
  const draft = useStore((s) => s.draft);
  const hydrated = useStore((s) => s.hydrated);
  const buangDraft = useStore((s) => s.buangDraft);
  const catatMilikku = useStore((s) => s.catatMilikku);

  const [menyimpan, setMenyimpan] = useState<TemplateId | null>(null);
  const [gagal, setGagal] = useState<string | null>(null);

  const questions = draft?.questions ?? [];
  const kosong = hydrated && questions.length === 0;

  // Penyimpanan mengosongkan draft; jangan tarik pengguna kembali ke Unggah.
  const menujuBagikan = useRef(false);

  useEffect(() => {
    if (kosong && !menujuBagikan.current) router.replace("/buat");
  }, [kosong, router]);

  if (!draft) return <AppHeader step={2} />;

  const disarankan = recommendedTemplate(questions);

  async function pilih(template: TemplateId) {
    if (menyimpan) return;
    setMenyimpan(template);
    setGagal(null);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: judulUsulan(questions[0]?.q ?? ""),
          template,
          acak: false,
          timerOn: true,
          timerDetik: template === "cepat" ? TIMER_KUIS_CEPAT : TIMER_DEFAULT,
          visibility: "private",
          kelas: null,
          mapel: null,
          questions: questions.map((q) => ({
            type: q.type,
            q: q.q,
            opts: q.opts,
            correct: q.correct,
            key: q.key,
            conf: q.conf,
            low: q.low,
            note: q.note,
            clue: q.clue,
            page: q.page,
            sumber: q.sumber,
          })),
        }),
      });
      const data: { activity?: Activity; error?: string } = await res.json();
      if (!res.ok || !data.activity?.editSlug) {
        throw new Error(data.error ?? "Gagal menyimpan aktivitas");
      }

      const a = data.activity;
      menujuBagikan.current = true;
      catatMilikku({
        editSlug: a.editSlug!,
        playSlug: a.playSlug,
        title: a.title,
        template: a.template,
        createdAt: a.createdAt,
      });
      buangDraft();
      router.push(`/buat/bagikan?edit=${a.editSlug}`);
    } catch (e) {
      setMenyimpan(null);
      setGagal(e instanceof Error ? e.message : "Gagal menyimpan aktivitas");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader step={2} />

      <main className="mx-auto flex w-full max-w-[1160px] flex-col gap-6 px-6 pb-20 pt-9">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[300px] flex-1">
            <h1 className="m-0 mb-1.5 font-display text-[30px] font-extrabold">
              Pilih template latihan
            </h1>
            <p className="m-0 text-[14.5px] text-ink-3 text-pretty">
              Set soal yang sama bisa dipindah ke template mana pun, kapan saja — tanpa
              mengetik ulang.
            </p>
          </div>
          <Link
            href="/buat/review"
            className="rounded-full border border-line px-[18px] py-[9px] text-[13.5px] font-semibold text-ink-3 no-underline transition-colors hover:border-line-hover hover:text-ink hover:no-underline"
          >
            Kembali ke review
          </Link>
        </div>

        {gagal && (
          <p role="alert" className="m-0 rounded-xl bg-wrong-bg px-4 py-3 text-sm font-semibold text-wrong-fg">
            {gagal}
          </p>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[18px]">
          {TEMPLATES.map((t) => {
            const syarat = eligibility(t.id, questions);
            const sedang = menyimpan === t.id;
            return (
              <button
                key={t.id}
                type="button"
                disabled={!syarat.ok || menyimpan !== null}
                onClick={() => pilih(t.id)}
                className={`flex flex-col overflow-hidden rounded-panel border border-line bg-surface p-0 text-left transition-all ${
                  syarat.ok && !menyimpan
                    ? "cursor-pointer hover:-translate-y-[3px] hover:border-teal hover:shadow-lift"
                    : "cursor-not-allowed opacity-55"
                }`}
              >
                <TemplatePreview id={t.id} />
                <div className="flex flex-col gap-1 p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[17px] font-bold">{t.label}</span>
                    {/* Satu template ditandai disarankan (FR-TP-3). */}
                    {syarat.ok && t.id === disarankan && (
                      <span className="rounded-full bg-teal px-[9px] py-0.5 text-[10.5px] font-bold text-surface">
                        DISARANKAN
                      </span>
                    )}
                  </div>
                  <p className="m-0 text-[13px] text-ink-3">
                    {sedang ? "Menyimpan…" : syarat.ok ? t.desc : syarat.reason}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
