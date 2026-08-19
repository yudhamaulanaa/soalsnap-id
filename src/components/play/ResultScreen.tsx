"use client";

import type { PlaySession } from "@/lib/types";

interface Props {
  finalLabel: string;
  ratio: number;
  flashcard: boolean;
  playerName: string;
  /** Papan skor dari server; null selagi belum tersimpan. */
  sessions: PlaySession[] | null;
  menyimpan: boolean;
  onReplay: () => void;
  onExit: () => void;
}

/** Page 09 — Hasil (FR-PL-8). Angka skor sebagai elemen terbesar. */
export function ResultScreen({
  finalLabel,
  ratio,
  flashcard,
  playerName,
  sessions,
  menyimpan,
  onReplay,
  onExit,
}: Props) {
  const pesan = flashcard
    ? "Semua kartu selesai ditinjau. Ulangi kapan saja!"
    : ratio === 1
      ? "Sempurna! Semua jawaban benar."
      : ratio >= 0.7
        ? "Kerja bagus, sedikit lagi sempurna!"
        : "Terus berlatih, kamu pasti bisa!";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex animate-popin-slow flex-col items-center gap-2.5 rounded-[28px] bg-surface px-10 py-13 text-center">
        <div className="font-display text-[34px] font-extrabold">Selesai!</div>
        <div className="font-display text-[52px] font-black text-teal">{finalLabel}</div>
        <p className="m-0 text-base text-ink-3">{pesan}</p>
        <div className="mt-[18px] flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onReplay}
            className="rounded-full bg-teal px-7 py-3.5 font-display text-[15px] font-bold text-surface transition-colors hover:bg-teal-dark"
          >
            Main Lagi
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-full border-[1.5px] border-line px-6 py-3.5 text-sm font-semibold text-ink-2 transition-colors hover:border-line-hover"
          >
            Kembali
          </button>
        </div>
      </div>

      {(menyimpan || sessions) && (
        <div className="animate-popin rounded-3xl bg-white/10 p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="m-0 font-display text-[17px] font-bold text-surface">Papan skor</h2>
            <span className="text-[12px] font-semibold text-mint-dim">
              {menyimpan ? "menyimpan…" : `${sessions?.length ?? 0} peserta`}
            </span>
          </div>

          {sessions && sessions.length > 0 && (
            <ol className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
              {sessions.slice(0, 10).map((s, i) => {
                const saya = (s.playerName ?? "") === playerName;
                return (
                  <li
                    key={s.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] ${
                      saya ? "bg-score/25 text-surface" : "text-surface/85"
                    }`}
                  >
                    <span className="w-5 shrink-0 text-right font-display font-bold text-mint-dim">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {s.playerName || "Anonim"}
                    </span>
                    <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 font-display text-[13px] font-bold">
                      {s.score}/{s.total}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
