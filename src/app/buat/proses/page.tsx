"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ScanPaper } from "@/components/ScanPaper";
import { STAGES } from "@/lib/ai/parser";
import { mockParser } from "@/lib/ai/mockParser";
import { useStore } from "@/lib/store";

/** Page 03 — Proses AI. */
export default function ProsesPage() {
  const router = useRouter();
  const draft = useStore((s) => s.draft);
  const simpanHasilAI = useStore((s) => s.simpanHasilAI);

  const [pct, setPct] = useState(0);
  const [gagal, setGagal] = useState<string | null>(null);

  const jumlahFile = draft?.files.length ?? 0;

  useEffect(() => {
    if (jumlahFile === 0) {
      router.replace("/buat");
      return;
    }

    // Pemrosesan dibatalkan saat layar ditinggalkan. Di React Strict Mode
    // jalannya yang pertama ikut dibatalkan, lalu efek dijalankan ulang.
    const controller = new AbortController();
    mockParser
      .parse(
        { files: useStore.getState().draft?.files ?? [] },
        { onProgress: setPct, signal: controller.signal },
      )
      .then(({ questions, sourcePages }) => {
        simpanHasilAI(questions, sourcePages);
        // Hasil AI tidak pernah dipublikasikan langsung — selalu ke Review
        // lebih dulu (FR-AI-8).
        router.replace("/buat/review");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // File dipertahankan agar bisa dicoba ulang (FR-AI-7).
        setGagal(err instanceof Error ? err.message : "Pemrosesan gagal.");
      });

    return () => controller.abort();
  }, [jumlahFile, router, simpanHasilAI]);

  const bulat = Math.min(100, Math.round(pct));

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader step={0} />

      <main className="mx-auto w-full max-w-[620px] px-6 pb-[72px] pt-14">
        <div className="flex flex-col items-center gap-2 rounded-hero border border-line bg-surface px-10 py-12 text-center">
          <ScanPaper />

          {gagal ? (
            <>
              <h1 className="mb-0 mt-6 font-display text-2xl font-bold">
                Pemrosesan gagal
              </h1>
              <p className="m-0 max-w-[380px] text-[15px] leading-relaxed text-ink-3">
                {gagal} Filemu masih tersimpan — coba proses ulang.
              </p>
              <button
                type="button"
                onClick={() => router.replace("/buat")}
                className="mt-4 rounded-full bg-teal px-7 py-3.5 font-display text-base font-bold text-surface transition-colors hover:bg-teal-dark"
              >
                Kembali ke unggah
              </button>
            </>
          ) : (
            <>
              <h1 className="mb-0 mt-6 font-display text-2xl font-bold">
                AI sedang membaca soalmu…
              </h1>
              <div
                className="font-display text-4xl font-extrabold text-teal"
                role="status"
                aria-live="polite"
              >
                {bulat}%
              </div>
              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-fill-3"
                role="progressbar"
                aria-valuenow={bulat}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Kemajuan pemrosesan AI"
              >
                <div
                  className="h-full rounded-full transition-[width] duration-200"
                  style={{
                    width: `${bulat}%`,
                    background: "linear-gradient(90deg,#0E8A7B,#6D5AE6)",
                  }}
                />
              </div>

              <ol className="m-0 mt-5 flex list-none flex-col items-start gap-2.5 p-0">
                {STAGES.map((s, i) => {
                  const next = STAGES[i + 1]?.at ?? 100;
                  const done = bulat >= next;
                  const active = !done && bulat >= s.at;
                  return (
                    <li key={s.label} className="flex items-center gap-2.5">
                      <span
                        className={`w-5 text-center font-extrabold ${
                          done ? "text-teal" : active ? "text-ai" : "text-fill-5"
                        }`}
                        aria-hidden="true"
                      >
                        {done ? "✓" : active ? "●" : "○"}
                      </span>
                      <span
                        className={`text-sm ${
                          done
                            ? "font-medium text-ink-2"
                            : active
                              ? "font-bold text-ink"
                              : "font-medium text-dim-2"
                        }`}
                      >
                        {s.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
