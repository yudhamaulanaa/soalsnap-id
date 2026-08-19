"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { SilangIcon } from "@/components/Icons";
import { playMode } from "@/lib/templates";
import type { Activity, PlaySession } from "@/lib/types";
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
  score: 0,
  total: 0,
  done: false,
};

interface Props {
  activity: Activity;
  /** Nama peserta; kosong berarti anonim. */
  playerName: string;
  pratinjau: boolean;
}

/**
 * Pages 07–09 — kerangka mode main siswa.
 * "Latar gelap memisahkan dunia guru dan dunia siswa" (design.md §4).
 */
export function PlayShell({ activity, playerName, pratinjau }: Props) {
  const router = useRouter();

  // Ganti ronde me-mount ulang mode main sehingga pengacakan diulang.
  const [ronde, setRonde] = useState(0);
  const [rep, setRep] = useState<PlayReport>(AWAL);
  const [papan, setPapan] = useState<PlaySession[] | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const dicatat = useRef(false);

  const mode = playMode(activity.template);

  const report = useCallback(
    (r: PlayReport) => {
      setRep(r);
      // Satu sesi dicatat sekali, saat mode main melaporkan selesai.
      if (r.done && !dicatat.current) {
        dicatat.current = true;
        // Pratinjau pemilik soal tidak ikut mengotori rekap peserta.
        if (pratinjau) return;
        setMenyimpan(true);
        fetch(`/api/play/${activity.playSlug}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerName: playerName || undefined,
            score: r.score,
            total: r.total,
            mode,
          }),
        })
          .then(async (res) => {
            const data = await res.json();
            if (res.ok) setPapan(data.sessions ?? []);
          })
          .catch(() => {
            /* Nilai gagal tersimpan tidak boleh menutup layar hasil. */
          })
          .finally(() => setMenyimpan(false));
      }
    },
    [activity.playSlug, mode, playerName, pratinjau],
  );

  const keluar = () =>
    router.push(pratinjau ? `/edit/${activity.editSlug ?? ""}` : `/kumpulan`);

  const mainLagi = () => {
    dicatat.current = false;
    setPapan(null);
    setRep(AWAL);
    setRonde((r) => r + 1);
  };

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
          {pratinjau && (
            <span className="rounded-full bg-white/12 px-3.5 py-[9px] text-[12px] font-bold text-mint-bright">
              PRATINJAU — hasil tidak disimpan
            </span>
          )}
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
            playerName={playerName}
            sessions={papan}
            menyimpan={menyimpan}
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
