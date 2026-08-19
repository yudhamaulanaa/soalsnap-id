"use client";

import { useEffect, useMemo, useState } from "react";
import { buildWords } from "@/lib/derive";
import { generateGrid, lineBetween, matchWord } from "@/lib/wordsearch";
import type { ModeProps } from "./types";

/** Page 08 — Cari Kata (FR-PL-7). */
export function WordSearchPlay({ questions, report }: ModeProps) {
  const grid = useMemo(
    () => generateGrid(buildWords(questions).map((w) => w.word)),
    [questions],
  );

  const [awal, setAwal] = useState<number | null>(null);
  const [ditemukan, setDitemukan] = useState<string[]>([]);
  const [selDitemukan, setSelDitemukan] = useState<number[]>([]);
  const [selSalah, setSelSalah] = useState<number[]>([]);
  const [selesai, setSelesai] = useState(false);

  const total = grid.placed.length;

  useEffect(() => {
    report({
      counter: `Ditemukan ${ditemukan.length} / ${total}`,
      scoreChip: `Skor: ${ditemukan.length}`,
      finalLabel: `${ditemukan.length}/${total}`,
      ratio: total ? ditemukan.length / total : 0,
      done: selesai,
    });
  }, [ditemukan.length, total, selesai, report]);

  useEffect(() => {
    if (total > 0 && ditemukan.length === total && !selesai) {
      const t = setTimeout(() => setSelesai(true), 800);
      return () => clearTimeout(t);
    }
  }, [ditemukan.length, total, selesai]);

  useEffect(() => {
    if (selSalah.length === 0) return;
    const t = setTimeout(() => setSelSalah([]), 450);
    return () => clearTimeout(t);
  }, [selSalah]);

  function pilihSel(i: number) {
    if (selSalah.length > 0 || selDitemukan.includes(i)) return;
    if (awal === null) {
      setAwal(i);
      return;
    }
    if (awal === i) {
      setAwal(null);
      return;
    }

    const cells = lineBetween(awal, i, grid.size);
    // Hanya garis lurus yang diterima; selain itu dianggap pilihan awal baru.
    if (!cells) {
      setAwal(i);
      return;
    }

    const hit = matchWord(grid, cells, ditemukan);
    setAwal(null);
    if (hit) {
      setDitemukan((d) => [...d, hit.word]);
      setSelDitemukan((c) => [...c, ...cells]);
    } else {
      setSelSalah(cells);
    }
  }

  return (
    <div className="flex animate-popin flex-col items-center gap-[18px] rounded-3xl bg-surface p-8">
      <p className="m-0 text-center text-sm font-semibold text-ink-3">
        Klik huruf pertama, lalu huruf terakhir kata yang kamu temukan.
      </p>

      <div
        className="grid w-full max-w-[440px] gap-1"
        style={{ gridTemplateColumns: `repeat(${grid.size}, minmax(0, 1fr))` }}
      >
        {grid.letters.map((ch, i) => {
          const found = selDitemukan.includes(i);
          const sel = awal === i;
          const bad = selSalah.includes(i);
          const bg = bad
            ? "bg-wrong text-surface"
            : sel
              ? "bg-ai text-surface"
              : found
                ? "bg-teal text-surface"
                : "bg-app text-ink";
          return (
            <button
              key={i}
              type="button"
              onClick={() => pilihSel(i)}
              aria-label={`Huruf ${ch}`}
              className={`aspect-square rounded-lg p-0 font-display text-[15px] font-bold transition-all ${bg}`}
            >
              {ch}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {grid.placed.map((p) => {
          const f = ditemukan.includes(p.word);
          return (
            <span
              key={p.word}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold ${
                f ? "bg-teal-light text-teal-dark line-through" : "bg-app text-ink-2"
              }`}
            >
              {p.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
