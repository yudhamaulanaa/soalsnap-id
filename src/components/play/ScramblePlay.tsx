"use client";

import { useEffect, useMemo, useState } from "react";
import { buildWords, shuffle } from "@/lib/derive";
import type { ModeProps } from "./types";

/** Page 08 — Susun Kata (FR-PL-6). */
export function ScramblePlay({ questions, report }: ModeProps) {
  const words = useMemo(
    () =>
      buildWords(questions).map((w) => ({
        ...w,
        tiles: shuffle(w.word.split("")),
      })),
    [questions],
  );

  const [idx, setIdx] = useState(0);
  const [tersusun, setTersusun] = useState<number[]>([]);
  const [benar, setBenar] = useState(false);
  const [salah, setSalah] = useState(false);
  const [terpecahkan, setTerpecahkan] = useState(0);
  const [selesai, setSelesai] = useState(false);

  const total = words.length;
  const kata = words[Math.min(idx, total - 1)];

  useEffect(() => {
    report({
      counter: `Kata ${Math.min(idx + 1, total)} / ${total}`,
      scoreChip: `Skor: ${terpecahkan}`,
      finalLabel: `${terpecahkan}/${total}`,
      ratio: total ? terpecahkan / total : 0,
      done: selesai,
    });
  }, [idx, terpecahkan, total, selesai, report]);

  // Susunan benar → maju ke kata berikutnya.
  useEffect(() => {
    if (!benar) return;
    const t = setTimeout(() => {
      if (idx >= total - 1) {
        setSelesai(true);
        return;
      }
      setIdx((i) => i + 1);
      setTersusun([]);
      setBenar(false);
    }, 900);
    return () => clearTimeout(t);
  }, [benar, idx, total]);

  // Susunan salah → slot dikosongkan.
  useEffect(() => {
    if (!salah) return;
    const t = setTimeout(() => {
      setTersusun([]);
      setSalah(false);
    }, 650);
    return () => clearTimeout(t);
  }, [salah]);

  if (!kata) return null;

  function pilihUbin(i: number) {
    if (!kata || benar || salah || tersusun.includes(i)) return;
    const baru = [...tersusun, i];
    setTersusun(baru);
    if (baru.length < kata.word.length) return;

    if (baru.map((x) => kata.tiles[x]).join("") === kata.word) {
      setBenar(true);
      setTerpecahkan((n) => n + 1);
    } else {
      setSalah(true);
    }
  }

  const slotKelas = benar
    ? "border-2 border-teal bg-teal-light text-teal-dark"
    : salah
      ? "border-2 border-wrong bg-wrong-bg text-wrong-fg"
      : "border-2 border-dashed border-fill-5 bg-app text-ink";

  return (
    <div className="flex animate-popin flex-col items-center gap-5 rounded-3xl bg-surface px-8 py-9">
      <span className="rounded-full bg-ai-light px-3.5 py-[5px] text-xs font-bold text-ai-dark">
        PETUNJUK
      </span>
      <h2 className="m-0 text-center font-display text-[22px] font-bold leading-[1.4] text-pretty">
        {kata.clue}
      </h2>

      <div className="flex flex-wrap justify-center gap-2" aria-live="polite">
        {kata.word.split("").map((_, i) => (
          <span
            key={i}
            className={`grid h-13 w-[46px] place-items-center rounded-xl font-display text-[22px] font-extrabold ${slotKelas}`}
          >
            {tersusun[i] != null ? kata.tiles[tersusun[i]] : ""}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {kata.tiles.map((ch, i) => {
          const terpakai = tersusun.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => pilihUbin(i)}
              disabled={terpakai}
              aria-label={`Huruf ${ch}`}
              className={`h-13 w-[46px] rounded-xl border border-line font-display text-xl font-extrabold transition-all ${
                terpakai
                  ? "bg-fill-3 text-transparent"
                  : "bg-surface text-ink shadow-[0_4px_10px_rgba(24,36,32,.14)]"
              }`}
            >
              {ch}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          onClick={() => !benar && setTersusun((t) => t.slice(0, -1))}
          className="rounded-full border-[1.5px] border-line px-5 py-2.5 text-[13.5px] font-semibold text-ink-2 transition-colors hover:border-line-hover"
        >
          Hapus huruf
        </button>
        <button
          type="button"
          onClick={() => !benar && setTersusun([])}
          className="rounded-full border-[1.5px] border-line px-5 py-2.5 text-[13.5px] font-semibold text-ink-2 transition-colors hover:border-line-hover"
        >
          Ulangi
        </button>
      </div>

      {benar && (
        <p
          role="status"
          className="m-0 animate-popin-fast rounded-full bg-teal-light px-[22px] py-2.5 text-[15px] font-bold text-teal-dark"
        >
          Benar!
        </p>
      )}
    </div>
  );
}
