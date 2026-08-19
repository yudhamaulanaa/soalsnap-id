"use client";

interface Props {
  finalLabel: string;
  ratio: number;
  flashcard: boolean;
  onReplay: () => void;
  onExit: () => void;
}

/** Page 09 — Hasil (FR-PL-8). Angka skor sebagai elemen terbesar. */
export function ResultScreen({ finalLabel, ratio, flashcard, onReplay, onExit }: Props) {
  const pesan = flashcard
    ? "Semua kartu selesai ditinjau. Ulangi kapan saja!"
    : ratio === 1
      ? "Sempurna! Semua jawaban benar."
      : ratio >= 0.7
        ? "Kerja bagus, sedikit lagi sempurna!"
        : "Terus berlatih, kamu pasti bisa!";

  return (
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
  );
}
