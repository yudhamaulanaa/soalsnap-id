"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { TemplatePreview } from "@/components/TemplatePreview";
import { useStore } from "@/lib/store";
import { TEMPLATES, eligibility, recommendedTemplate } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";

/** Page 05 — Pilih Template. */
export default function TemplatePage() {
  const router = useRouter();
  const draft = useStore((s) => s.draft);
  const hydrated = useStore((s) => s.hydrated);
  const publikasikan = useStore((s) => s.publikasikan);

  const questions = draft?.questions ?? [];
  const kosong = hydrated && questions.length === 0;

  // Publikasi mengosongkan draft; jangan tarik pengguna kembali ke Unggah
  // saat itu terjadi.
  const menujuBagikan = useRef(false);

  useEffect(() => {
    if (kosong && !menujuBagikan.current) router.replace("/buat");
  }, [kosong, router]);

  if (!draft) return <AppHeader step={2} />;

  const disarankan = recommendedTemplate(questions);

  function pilih(id: TemplateId) {
    menujuBagikan.current = true;
    const activity = publikasikan(id);
    if (activity) {
      router.push(`/buat/bagikan?id=${activity.id}`);
    } else {
      menujuBagikan.current = false;
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

        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[18px]">
          {TEMPLATES.map((t) => {
            const syarat = eligibility(t.id, questions);
            return (
              <button
                key={t.id}
                type="button"
                disabled={!syarat.ok}
                onClick={() => pilih(t.id)}
                className={`flex flex-col overflow-hidden rounded-panel border border-line bg-surface p-0 text-left transition-all ${
                  syarat.ok
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
                    {syarat.ok ? t.desc : syarat.reason}
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
