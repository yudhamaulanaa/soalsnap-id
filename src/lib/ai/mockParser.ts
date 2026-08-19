import type { Question } from "../types";
import {
  ParseError,
  type ParseOptions,
  type ParseRequest,
  type ParseResult,
  type QuestionParser,
  validateQuestions,
} from "./parser";

/**
 * Hasil "OCR" simulasi — bank soal IPA yang sama dengan prototype desain.
 * Nomor 5 sengaja berkeyakinan rendah agar tanda "perlu diperiksa" terlihat.
 */
function bacaanContoh(): Question[] {
  return [
    {
      id: "q1",
      type: "pg",
      q: "Proses fotosintesis pada tumbuhan terutama berlangsung di bagian …",
      opts: ["Akar", "Daun", "Batang", "Bunga"],
      correct: 1,
      conf: 98,
      clue: "Tempat utama fotosintesis",
      page: 1,
      sumber: "upload",
    },
    {
      id: "q2",
      type: "pg",
      q: "Zat hijau daun yang berperan menangkap energi cahaya matahari disebut …",
      opts: ["Klorofil", "Karoten", "Xantofil", "Antosianin"],
      correct: 0,
      conf: 97,
      clue: "Zat hijau penangkap cahaya",
      page: 1,
      sumber: "upload",
    },
    {
      id: "q3",
      type: "pg",
      q: "Gas yang diperlukan tumbuhan dalam proses fotosintesis adalah …",
      opts: ["Oksigen", "Karbon dioksida", "Nitrogen", "Hidrogen"],
      correct: 1,
      conf: 96,
      clue: "Gas yang diperlukan fotosintesis",
      page: 1,
      sumber: "upload",
    },
    {
      id: "q4",
      type: "pg",
      q: "Hasil fotosintesis yang menjadi sumber energi utama bagi tumbuhan adalah …",
      opts: ["Glukosa", "Protein", "Lemak", "Vitamin"],
      correct: 0,
      conf: 95,
      clue: "Hasil fotosintesis sumber energi",
      page: 1,
      sumber: "upload",
    },
    {
      id: "q5",
      type: "pg",
      q: "Percobaan Ingenhousz membuktikan bahwa fotosintesis menghasilkan …",
      opts: ["Karbon dioksida", "Uap air", "Oksigen", "Amilum"],
      correct: 2,
      conf: 74,
      clue: "Hasil percobaan Ingenhousz",
      page: 1,
      sumber: "upload",
    },
    {
      id: "q6",
      type: "bs",
      q: "Fotosintesis hanya dapat terjadi pada siang hari.",
      opts: ["Benar", "Salah"],
      correct: 1,
      conf: 91,
      page: 2,
      sumber: "upload",
    },
    {
      id: "q7",
      type: "bs",
      q: "Stomata merupakan tempat pertukaran gas pada daun.",
      opts: ["Benar", "Salah"],
      correct: 0,
      conf: 93,
      clue: "Tempat pertukaran gas di daun",
      page: 2,
      sumber: "upload",
    },
    {
      id: "q8",
      type: "isian",
      q: "Selain glukosa, fotosintesis juga menghasilkan gas ____ yang dilepaskan ke udara.",
      key: "oksigen",
      conf: 88,
      clue: "Gas yang dilepaskan ke udara",
      page: 2,
      sumber: "upload",
    },
  ];
}

/** Bank soal contoh yang sudah tervalidasi — dipakai juga oleh data seed. */
export function contohBankSoal(): Question[] {
  return validateQuestions(bacaanContoh());
}

/**
 * Parser simulasi: memajukan progres bertahap lalu mengembalikan draft.
 * Tidak ada satu pun hasil yang dipublikasikan tanpa melewati layar Review
 * (FR-AI-8) — itu urusan pemanggilnya, di `/buat/proses`.
 */
export const mockParser: QuestionParser = {
  parse(request: ParseRequest, options: ParseOptions = {}): Promise<ParseResult> {
    const { onProgress, signal } = options;
    const speed = options.speed ?? 1;

    if (request.files.length === 0) {
      return Promise.reject(new ParseError("Tidak ada file atau teks untuk diproses."));
    }

    if (signal?.aborted) {
      return Promise.reject(new DOMException("Pemrosesan dibatalkan", "AbortError"));
    }

    return new Promise<ParseResult>((resolve, reject) => {
      let pct = 0;

      const stop = () => {
        clearInterval(timer);
        signal?.removeEventListener("abort", onAbort);
      };
      const onAbort = () => {
        stop();
        reject(new DOMException("Pemrosesan dibatalkan", "AbortError"));
      };
      signal?.addEventListener("abort", onAbort);

      const timer = setInterval(() => {
        pct = Math.min(100, pct + (1.5 + Math.random() * 3.5) * speed);
        onProgress?.(pct);
        if (pct < 100) return;

        stop();
        const questions = contohBankSoal();
        // Jeda pendek agar tahap terakhir sempat terbaca sebelum pindah layar.
        setTimeout(() => {
          resolve({
            questions,
            sourcePages: ringkasHalaman(questions),
          });
        }, 500);
      }, 90);
    });
  },
};

function ringkasHalaman(questions: Question[]) {
  const byPage = new Map<number, number>();
  for (const q of questions) {
    const page = q.page ?? 1;
    byPage.set(page, (byPage.get(page) ?? 0) + 1);
  }
  return [...byPage.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([page, count]) => ({ page, count }));
}
