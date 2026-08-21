"use client";

import { useEffect, useMemo, useState } from "react";
import { buildCards, shuffle } from "@/lib/derive";
import type { ModeProps } from "./types";
import { GambarSoal } from "../GambarSoal";

/** Page 08 — Flashcard (FR-PL-5). */
export function FlashcardPlay({ questions, activity, report }: ModeProps) {
  const cards = useMemo(() => {
    const c = buildCards(questions);
    return activity.acak ? shuffle(c) : c;
  }, [questions, activity.acak]);

  const [idx, setIdx] = useState(0);
  const [belakang, setBelakang] = useState(false);
  const [dilihat, setDilihat] = useState<number[]>([0]);
  const [selesai, setSelesai] = useState(false);

  const total = cards.length;
  const kartu = cards[Math.min(idx, total - 1)];

  useEffect(() => {
    report({
      counter: `Kartu ${Math.min(idx + 1, total)} / ${total}`,
      scoreChip: `Dilihat: ${dilihat.length}/${total}`,
      finalLabel: `${total} kartu`,
      ratio: total ? dilihat.length / total : 0,
      score: dilihat.length,
      total,
      done: selesai,
    });
  }, [idx, dilihat.length, total, selesai, report]);

  if (!kartu) return null;

  function maju() {
    if (idx >= total - 1) {
      setSelesai(true);
      return;
    }
    const next = idx + 1;
    setIdx(next);
    setBelakang(false);
    setDilihat((d) => (d.includes(next) ? d : [...d, next]));
  }

  return (
    <div className="flex animate-popin flex-col gap-[18px]">
      <button
        type="button"
        onClick={() => setBelakang((b) => !b)}
        aria-label={belakang ? "Tampilkan pertanyaan" : "Tampilkan jawaban"}
        className={`flex min-h-[280px] w-full flex-col items-center justify-center gap-4 rounded-3xl px-9 py-10 text-center shadow-on-dark transition-colors duration-300 ${
          belakang ? "bg-teal text-surface" : "bg-surface text-ink"
        }`}
      >
        <span
          className={`rounded-full px-3.5 py-[5px] text-xs font-bold ${
            belakang ? "bg-white/20 text-surface" : "bg-ai-light text-ai-dark"
          }`}
        >
          {belakang ? "JAWABAN" : "PERTANYAAN"}
        </span>
        {!belakang && kartu.gambar && (
          <GambarSoal
            kunci={kartu.gambar}
            alt={kartu.gambarAlt}
            className="max-h-[200px]"
          />
        )}
        {/* Kunci yang berupa gambar ikut ke sisi belakang: tanpa ini kartunya
            memperlihatkan jawaban kosong. */}
        {belakang && kartu.backGambar && (
          <GambarSoal
            kunci={kartu.backGambar}
            alt={kartu.backGambarAlt ?? "Gambar jawaban"}
            className="max-h-[200px] bg-surface"
          />
        )}
        {(belakang ? kartu.back : kartu.front) && (
          <span className="font-display text-[26px] font-bold leading-[1.4] text-pretty">
            {belakang ? kartu.back : kartu.front}
          </span>
        )}
        <span className="text-[12.5px] font-semibold opacity-60">
          klik kartu untuk membalik
        </span>
      </button>

      <div className="flex justify-center gap-[7px]" aria-hidden="true">
        {cards.map((_, i) => (
          <span
            key={i}
            className="h-2 rounded-full transition-all duration-200"
            style={{
              width: i === idx ? 22 : 8,
              background:
                i === idx ? "var(--color-score)" : "rgba(255,255,255,.35)",
            }}
          />
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            setIdx((i) => Math.max(0, i - 1));
            setBelakang(false);
          }}
          disabled={idx === 0}
          className="rounded-full bg-white/12 px-[22px] py-[13px] text-sm font-semibold text-surface transition-colors hover:bg-white/22 disabled:opacity-40"
        >
          ← Sebelumnya
        </button>
        <button
          type="button"
          onClick={maju}
          className="rounded-full bg-score px-[26px] py-[13px] font-display text-[15px] font-bold text-ink transition-transform hover:-translate-y-0.5"
        >
          {idx >= total - 1 ? "Selesai" : "Berikutnya →"}
        </button>
      </div>
    </div>
  );
}
