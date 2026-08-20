import type { Question } from "./types";

/**
 * "Satu bank soal, banyak wajah" (design.md §1).
 * Modul ini menafsirkan satu daftar `Question` menjadi bahan main untuk
 * tiap template — tanpa pernah mengubah bank soalnya.
 */

/** Jawaban benar sebagai teks, apa pun tipe soalnya. */
export function answerOf(q: Question): string {
  if (q.type === "isian") return q.key?.trim() ?? "";
  const opts = q.opts ?? [];
  return opts[q.correct ?? -1] ?? "";
}

/** Label pendek untuk sisi kiri Menjodohkan / petunjuk Susun Kata. */
export function clueOf(q: Question): string {
  if (q.clue) return q.clue;
  const t = q.q.replace(/_{2,}/g, "…").trim();
  return t.length > 48 ? `${t.slice(0, 48)}…` : t;
}

export function shuffle<T>(list: readonly T[], rng: () => number = Math.random): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface Pair {
  id: string;
  /** Istilah di kolom kiri. */
  left: string;
  /** Jawaban di kolom kanan. */
  right: string;
}

/**
 * Menjodohkan butuh pasangan soal–kunci yang unik (blueprint.md §6):
 * soal benar/salah dilewati, jawaban kembar dibuang, maksimal 6 pasangan
 * agar tetap muat satu layar.
 */
export function buildPairs(questions: readonly Question[], limit = 6): Pair[] {
  const seen = new Set<string>();
  const pairs: Pair[] = [];
  for (const q of questions) {
    if (q.type === "bs") continue;
    const right = answerOf(q);
    if (!right) continue;
    const norm = right.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    pairs.push({ id: q.id, left: clueOf(q), right });
    if (pairs.length >= limit) break;
  }
  return pairs;
}

export interface WordItem {
  word: string;
  clue: string;
}

/**
 * Susun Kata & Cari Kata butuh kunci satu kata 4–10 huruf
 * (blueprint.md §6, FR-TP-6).
 */
export function buildWords(questions: readonly Question[], limit = 4): WordItem[] {
  const seen = new Set<string>();
  const words: WordItem[] = [];
  for (const q of questions) {
    if (q.type === "bs") continue;
    const word = answerOf(q).toUpperCase();
    if (!/^[A-Z]{4,10}$/.test(word) || seen.has(word)) continue;
    seen.add(word);
    words.push({ word, clue: clueOf(q) });
    if (words.length >= limit) break;
  }
  return words;
}

export interface Card {
  front: string;
  back: string;
  /** Gambar soal ikut ke sisi depan kartu bila ada. */
  gambar?: string;
  gambarAlt?: string;
}

/** Flashcard: teks soal di depan, kunci di belakang (blueprint.md §6). */
export function buildCards(questions: readonly Question[]): Card[] {
  return questions.map((q) => ({
    front: q.q.replace(/_{2,}/g, "…"),
    back: answerOf(q) || "—",
    gambar: q.gambar,
    gambarAlt: q.gambarAlt,
  }));
}

/** Jawaban isian dibandingkan tanpa peka huruf besar-kecil & spasi tepi (FR-PL-2). */
export function isianBenar(input: string, key: string | undefined): boolean {
  return input.trim().toLowerCase() === (key ?? "").trim().toLowerCase();
}
