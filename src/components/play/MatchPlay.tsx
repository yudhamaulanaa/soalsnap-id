"use client";

import { useEffect, useMemo, useState } from "react";
import { buildPairs, shuffle } from "@/lib/derive";
import type { ModeProps } from "./types";

/** Page 08 — Menjodohkan (FR-PL-4). */
export function MatchPlay({ questions, report }: ModeProps) {
  const pairs = useMemo(() => buildPairs(questions), [questions]);
  const kanan = useMemo(() => shuffle(pairs), [pairs]);

  const [dipilih, setDipilih] = useState<string | null>(null);
  const [cocok, setCocok] = useState<string[]>([]);
  const [pernahSalah, setPernahSalah] = useState<string[]>([]);
  const [salah, setSalah] = useState<string | null>(null);
  const [skor, setSkor] = useState(0);
  const [selesai, setSelesai] = useState(false);

  const total = pairs.length;

  useEffect(() => {
    report({
      counter: `Pasangan ${cocok.length} / ${total}`,
      scoreChip: `Skor: ${skor}`,
      finalLabel: `${skor}/${total}`,
      ratio: total ? skor / total : 0,
      done: selesai,
    });
  }, [cocok.length, skor, total, selesai, report]);

  // Selesai saat semua pasangan terkunci.
  useEffect(() => {
    if (total > 0 && cocok.length === total && !selesai) {
      const t = setTimeout(() => setSelesai(true), 700);
      return () => clearTimeout(t);
    }
  }, [cocok.length, total, selesai]);

  // Kedipan merah pada pasangan yang salah.
  useEffect(() => {
    if (!salah) return;
    const t = setTimeout(() => setSalah(null), 500);
    return () => clearTimeout(t);
  }, [salah]);

  function pilihKiri(id: string) {
    if (cocok.includes(id)) return;
    setDipilih((cur) => (cur === id ? null : id));
  }

  function pilihKanan(id: string) {
    if (!dipilih || cocok.includes(id) || salah) return;
    if (dipilih === id) {
      // Skor hanya untuk pasangan yang benar pada percobaan pertama.
      const pertama = !pernahSalah.includes(id);
      setCocok((c) => [...c, id]);
      setDipilih(null);
      if (pertama) setSkor((s) => s + 1);
    } else {
      setSalah(id);
      setPernahSalah((t) => (t.includes(dipilih) ? t : [...t, dipilih]));
    }
  }

  return (
    <div className="flex animate-popin flex-col gap-[18px] rounded-3xl bg-surface p-8">
      <p className="m-0 text-center text-sm font-semibold text-ink-3">
        Klik istilah di kiri, lalu klik jawabannya di kanan.
      </p>

      <div className="grid gap-[22px] sm:grid-cols-2">
        <div className="flex flex-col gap-2.5">
          {pairs.map((p) => {
            const terkunci = cocok.includes(p.id);
            const aktif = dipilih === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pilihKiri(p.id)}
                disabled={terkunci}
                aria-pressed={aktif}
                className={`min-h-[44px] rounded-xl border-2 px-4 py-[13px] text-left text-[14.5px] font-semibold transition-all ${
                  terkunci
                    ? "border-mint-edge bg-teal-light text-teal-dark opacity-60"
                    : aktif
                      ? "border-ai bg-ai-light text-ai-dark"
                      : "border-line bg-surface text-ink"
                }`}
              >
                {terkunci ? "✓  " : ""}
                {p.left}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5">
          {kanan.map((p) => {
            const terkunci = cocok.includes(p.id);
            const merah = salah === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pilihKanan(p.id)}
                disabled={terkunci}
                className={`min-h-[44px] rounded-xl border-2 px-4 py-[13px] text-left text-[14.5px] font-bold transition-all ${
                  terkunci
                    ? "border-mint-edge bg-teal-light text-teal-dark opacity-60"
                    : merah
                      ? "border-wrong bg-wrong-bg text-wrong-fg"
                      : "border-line bg-surface text-ink"
                }`}
              >
                {p.right}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
