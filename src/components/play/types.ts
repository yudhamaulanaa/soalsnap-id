import type { Activity, Question } from "@/lib/types";

/** Apa yang dilaporkan tiap mode main ke bilah atas & layar hasil. */
export interface PlayReport {
  /** Penghitung posisi, mis. "Soal 3 / 8" (FR-PL umum). */
  counter: string;
  /** Indikator skor, mis. "Skor: 2". */
  scoreChip: string;
  /** Angka besar di layar hasil, mis. "6/8". */
  finalLabel: string;
  /** 0–1, menentukan pesan capaian. */
  ratio: number;
  /** Nilai yang disimpan sebagai PlaySession. */
  score: number;
  total: number;
  done: boolean;
}

export type Reporter = (report: PlayReport) => void;

export interface ModeProps {
  questions: Question[];
  activity: Activity;
  report: Reporter;
}
