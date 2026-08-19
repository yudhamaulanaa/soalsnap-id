"use client";

import { useEffect, useMemo, useState } from "react";
import { isianBenar, shuffle } from "@/lib/derive";
import { TIMER_KUIS_CEPAT, type Question } from "@/lib/types";
import type { ModeProps } from "./types";

type Hasil = "benar" | "salah" | "habis" | null;

const BADGE: Record<Question["type"], string> = {
  pg: "Pilihan Ganda",
  bs: "Benar / Salah",
  isian: "Isian",
};

/** Page 07 — Main Kuis (FR-PL-1, FR-PL-2, FR-PL-3). */
export function QuizPlay({ questions, activity, report }: ModeProps) {
  const daftar = useMemo(
    () => (activity.acak ? shuffle(questions) : questions),
    [questions, activity.acak],
  );

  const durasi =
    activity.template === "cepat"
      ? Math.min(TIMER_KUIS_CEPAT, activity.timerDetik)
      : activity.timerDetik;
  const timerAktif = activity.timerOn;

  const [idx, setIdx] = useState(0);
  const [skor, setSkor] = useState(0);
  const [dipilih, setDipilih] = useState<number | null>(null);
  const [hasil, setHasil] = useState<Hasil>(null);
  const [isian, setIsian] = useState("");
  const [sisa, setSisa] = useState(durasi);
  const [selesai, setSelesai] = useState(false);

  const soal = daftar[Math.min(idx, daftar.length - 1)];
  const total = daftar.length;
  const kunciTeks = soal?.type === "isian" ? (soal.key ?? "") : (soal?.opts?.[soal.correct ?? -1] ?? "");

  useEffect(() => {
    report({
      counter: `Soal ${Math.min(idx + 1, total)} / ${total}`,
      scoreChip: `Skor: ${skor}`,
      finalLabel: `${skor}/${total}`,
      ratio: total ? skor / total : 0,
      score: skor,
      total,
      done: selesai,
    });
  }, [idx, skor, total, selesai, report]);

  // Hitung mundur; berhenti saat jawaban terkunci (FR-PL-3, FR-PL-9).
  // Waktu habis dihitung salah dan menampilkan kunci.
  useEffect(() => {
    if (!timerAktif || hasil || selesai || sisa <= 0) return;
    const t = setTimeout(() => {
      if (sisa <= 1) {
        setSisa(0);
        setHasil("habis");
      } else {
        setSisa(sisa - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [timerAktif, hasil, selesai, sisa]);

  // Maju otomatis 1,4 detik setelah jawaban terungkap (FR-PL-1).
  useEffect(() => {
    if (!hasil) return;
    const t = setTimeout(() => {
      if (idx >= total - 1) {
        setSelesai(true);
        return;
      }
      setIdx((i) => i + 1);
      setDipilih(null);
      setHasil(null);
      setIsian("");
      setSisa(durasi);
    }, 1400);
    return () => clearTimeout(t);
  }, [hasil, idx, total, durasi]);

  function jawab(benar: boolean, picked: number | null) {
    if (hasil) return;
    setDipilih(picked);
    setHasil(benar ? "benar" : "salah");
    if (benar) setSkor((s) => s + 1);
  }

  if (!soal) return null;

  const terungkap = hasil !== null;
  const pesan =
    hasil === "benar"
      ? "Benar! +1 poin"
      : hasil === "salah"
        ? `Kurang tepat — kunci: ${kunciTeks}`
        : hasil === "habis"
          ? `Waktu habis — kunci: ${kunciTeks}`
          : "";

  return (
    <>
      {timerAktif && (
        <div
          className="h-2.5 overflow-hidden rounded-full bg-white/16"
          role="timer"
          aria-label={`Sisa waktu ${sisa} detik`}
        >
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-linear"
            style={{
              width: `${Math.max(0, (sisa / durasi) * 100)}%`,
              background: sisa <= 5 ? "var(--color-score)" : "var(--color-mint)",
            }}
          />
        </div>
      )}

      <div className="flex animate-popin flex-col gap-5 rounded-3xl bg-surface p-9">
        <span className="self-start rounded-full bg-ai-light px-3.5 py-[5px] text-xs font-bold text-ai-dark">
          {BADGE[soal.type]}
        </span>

        <h2 className="m-0 font-display text-[26px] font-bold leading-[1.35] text-pretty">
          {soal.q}
        </h2>

        {soal.type !== "isian" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(soal.opts ?? []).map((o, i) => {
              const kunci = i === soal.correct;
              let kelas =
                "border-2 border-line bg-surface text-ink hover:border-teal hover:-translate-y-0.5";
              if (terungkap) {
                kelas = kunci
                  ? "border-2 border-teal bg-teal-light font-bold text-teal-dark"
                  : i === dipilih
                    ? "border-2 border-wrong bg-wrong-bg text-wrong-fg"
                    : "border-2 border-line bg-surface text-ink opacity-45";
              }
              return (
                <button
                  key={i}
                  type="button"
                  disabled={terungkap}
                  onClick={() => jawab(kunci, i)}
                  className={`min-h-[44px] rounded-2xl px-5 py-[18px] text-left text-[17px] font-semibold transition-all disabled:cursor-default ${kelas}`}
                >
                  {terungkap && kunci ? "✓  " : ""}
                  {soal.type === "pg" ? `${"ABCD"[i] ?? ""}.  ` : ""}
                  {o}
                </button>
              );
            })}
          </div>
        )}

        {soal.type === "isian" && (
          <form
            className="flex flex-wrap gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!terungkap) jawab(isianBenar(isian, soal.key), null);
            }}
          >
            <input
              value={isian}
              onChange={(e) => setIsian(e.target.value)}
              disabled={terungkap}
              placeholder="Ketik jawabanmu di sini…"
              aria-label="Jawaban"
              className="min-w-[200px] flex-1 rounded-[14px] border-2 border-line px-[18px] py-[15px] text-[17px] font-semibold outline-none focus:border-teal"
            />
            <button
              type="submit"
              disabled={terungkap}
              className="rounded-[14px] bg-teal px-7 font-display text-base font-bold text-surface transition-colors hover:bg-teal-dark disabled:opacity-50"
            >
              Jawab
            </button>
          </form>
        )}

        {terungkap && (
          <p
            role="status"
            className={`m-0 animate-popin-fast self-center rounded-full px-[22px] py-2.5 text-[15px] font-bold ${
              hasil === "benar" ? "bg-teal-light text-teal-dark" : "bg-wrong-bg text-wrong-fg"
            }`}
          >
            {pesan}
          </p>
        )}
      </div>
    </>
  );
}
