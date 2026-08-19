"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PanahKananIcon } from "@/components/Icons";
import { QuestionCard } from "@/components/QuestionCard";
import { SourcePagePanel } from "@/components/SourcePagePanel";
import { useStore } from "@/lib/store";

/** Page 04 — Review Draft. */
export default function ReviewPage() {
  const router = useRouter();
  const draft = useStore((s) => s.draft);
  const hydrated = useStore((s) => s.hydrated);
  const ubahSoal = useStore((s) => s.ubahSoal);
  const hapusSoal = useStore((s) => s.hapusSoal);
  const tambahSoal = useStore((s) => s.tambahSoal);
  const ubahModeEdit = useStore((s) => s.ubahModeEdit);

  const editingId = draft?.editingId ?? null;
  const manual = draft?.origin === "manual";
  const questions = draft?.questions ?? [];
  const kosong = hydrated && (!draft || questions.length === 0);

  useEffect(() => {
    if (kosong) router.replace("/buat");
  }, [kosong, router]);

  if (!draft) return <AppHeader step={1} />;

  const lowCount = questions.filter((q) => q.low).length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader step={1} />

      <main className="mx-auto flex w-full max-w-[1160px] flex-col gap-5 px-6 pb-20 pt-9">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[300px] flex-1">
            <h1 className="m-0 mb-1.5 font-display text-[30px] font-extrabold">
              {manual ? "Susun soal manual" : "Review hasil AI"}
            </h1>
            <p className="m-0 text-[14.5px] text-ink-3">
              {manual
                ? `${questions.length} soal · buat manual — klik opsi untuk mengubah kunci jawaban`
                : `${questions.length} soal terdeteksi dari ${draft.sourcePages?.length ?? 1} halaman · klik opsi untuk mengubah kunci jawaban`}
            </p>
          </div>

          {lowCount > 0 && (
            <span className="rounded-full bg-warn-bg px-4 py-2 text-[13px] font-bold text-warn-fg">
              {lowCount} soal perlu diperiksa
            </span>
          )}

          <Link
            href="/buat"
            className="rounded-full border border-line px-[18px] py-[9px] text-[13.5px] font-semibold text-ink-3 no-underline transition-colors hover:border-line-hover hover:text-ink hover:no-underline"
          >
            {manual ? "Unggah foto saja" : "Unggah ulang"}
          </Link>
        </div>

        <div
          className={
            manual
              ? "mx-auto grid w-full max-w-[760px] grid-cols-1 items-start gap-[26px]"
              : "grid grid-cols-1 items-start gap-[26px] lg:grid-cols-[230px_1fr]"
          }
        >
          {/* Panel sumber hanya tampil bila draft berasal dari unggahan (FR-RV-8). */}
          {!manual && <SourcePagePanel pages={draft.sourcePages ?? []} />}

          <div className="flex flex-col gap-3.5">
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                no={i + 1}
                editing={editingId === q.id}
                onToggleEdit={() => ubahModeEdit(editingId === q.id ? null : q.id)}
                onChange={(patch) => ubahSoal(q.id, patch)}
                onDelete={() => hapusSoal(q.id)}
              />
            ))}

            <div className="sticky bottom-4 mt-2 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-[18px] py-3.5 shadow-sticky">
              <button
                type="button"
                onClick={tambahSoal}
                className="rounded-full border-[1.5px] border-dashed border-line-hover px-5 py-[11px] text-sm font-semibold text-ink-2 transition-colors hover:border-teal hover:text-teal"
              >
                + Tambah soal manual
              </button>
              <span className="flex-1" />
              <button
                type="button"
                disabled={questions.length === 0}
                onClick={() => router.push("/buat/template")}
                className="flex items-center gap-2.5 rounded-full bg-teal px-[26px] py-[13px] font-display text-[15px] font-bold text-surface transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                Lanjut: Pilih Template ({questions.length} soal)
                <PanahKananIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
