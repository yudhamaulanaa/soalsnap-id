"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { SilangIcon } from "@/components/Icons";
import { useStore } from "@/lib/store";
import { playMode } from "@/lib/templates";
import type { Activity } from "@/lib/types";
import { ResultScreen } from "./ResultScreen";
import type { PlayReport } from "./types";

/*
 * Mode main memakai pengacakan (urutan soal, ubin huruf, kisi cari kata), jadi
 * hasilnya tidak boleh dirender di server: dimuat hanya di klien, sekaligus
 * memecah bundel per mode.
 */
const memuat = () => <div className="min-h-[280px] rounded-3xl bg-surface" />;

const QuizPlay = dynamic(() => import("./QuizPlay").then((m) => m.QuizPlay), {
  ssr: false,
  loading: memuat,
});
const MatchPlay = dynamic(() => import("./MatchPlay").then((m) => m.MatchPlay), {
  ssr: false,
  loading: memuat,
});
const FlashcardPlay = dynamic(() => import("./FlashcardPlay").then((m) => m.FlashcardPlay), {
  ssr: false,
  loading: memuat,
});
const ScramblePlay = dynamic(() => import("./ScramblePlay").then((m) => m.ScramblePlay), {
  ssr: false,
  loading: memuat,
});
const WordSearchPlay = dynamic(() => import("./WordSearchPlay").then((m) => m.WordSearchPlay), {
  ssr: false,
  loading: memuat,
});

const AWAL: PlayReport = {
  counter: "",
  scoreChip: "Skor: 0",
  finalLabel: "0",
  ratio: 0,
  done: false,
};

/**
 * Pages 07–09 — kerangka mode main siswa.
 * "Latar gelap memisahkan dunia guru dan dunia siswa" (design.md §4).
 */
export function PlayShell({ activity, pratinjau }: { activity: Activity; pratinjau: boolean }) {
  const router = useRouter();
  const catatSesiMain = useStore((s) => s.catatSesiMain);

  // Ganti ronde me-mount ulang mode main sehingga pengacakan diulang.
  const [ronde, setRonde] = useState(0);
  const [rep, setRep] = useState<PlayReport>(AWAL);
  const dicatat = useRef(false);

  const report = useCallback(
    (r: PlayReport) => {
      setRep(r);
      // Satu sesi main dicatat sekali, saat mode main melaporkan selesai.
      if (r.done && !dicatat.current) {
        dicatat.current = true;
        catatSesiMain(activity.id);
      }
    },
    [activity.id, catatSesiMain],
  );

  const keluar = () =>
    router.push(pratinjau ? `/buat/bagikan?id=${activity.id}` : "/");

  const mainLagi = () => {
    dicatat.current = false;
    setRep(AWAL);
    setRonde((r) => r + 1);
  };

  const mode = playMode(activity.template);
  const props = { questions: activity.questions, activity, report };

  return (
    <div
      data-surface="dark"
      className="min-h-screen px-6 pb-16 pt-7"
      style={{
        background:
          "radial-gradient(800px 500px at 85% -10%, rgba(109,90,230,.4), transparent 60%), var(--color-forest)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[780px] flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={keluar}
            className="flex items-center gap-[7px] rounded-full bg-white/12 px-4 py-[9px] text-[13px] font-semibold text-surface transition-colors hover:bg-white/22"
          >
            <SilangIcon size={13} />
            Keluar
          </button>
          <span className="flex-1" />
          <span className="rounded-full bg-white/12 px-[18px] py-[9px] font-display text-sm font-bold text-surface">
            {rep.counter}
          </span>
          <span className="rounded-full bg-score px-[18px] py-[9px] font-display text-sm font-bold text-ink">
            {rep.scoreChip}
          </span>
        </div>

        {rep.done ? (
          <ResultScreen
            finalLabel={rep.finalLabel}
            ratio={rep.ratio}
            flashcard={mode === "flash"}
            onReplay={mainLagi}
            onExit={keluar}
          />
        ) : mode === "jodoh" ? (
          <MatchPlay key={ronde} {...props} />
        ) : mode === "flash" ? (
          <FlashcardPlay key={ronde} {...props} />
        ) : mode === "susun" ? (
          <ScramblePlay key={ronde} {...props} />
        ) : mode === "cari" ? (
          <WordSearchPlay key={ronde} {...props} />
        ) : (
          <QuizPlay key={ronde} {...props} />
        )}
      </div>
    </div>
  );
}
