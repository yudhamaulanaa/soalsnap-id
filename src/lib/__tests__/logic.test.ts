import { describe, expect, it } from "vitest";
import { contohBankSoal } from "../ai/mockParser";
import { validateQuestions } from "../ai/parser";
import { answerOf, buildCards, buildPairs, buildWords, isianBenar } from "../derive";
import { eligibility, recommendedTemplate, templateCount } from "../templates";
import { generateGrid, lineBetween, matchWord } from "../wordsearch";
import type { Question } from "../types";

const bank = contohBankSoal();

/** RNG deterministik agar tes kisi tidak flaky. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("derive", () => {
  it("membaca kunci jawaban dari opsi maupun teks", () => {
    expect(answerOf(bank[0])).toBe("Daun");
    expect(answerOf(bank[7])).toBe("oksigen");
  });

  it("membuat pasangan unik dan melewati soal benar/salah", () => {
    const pairs = buildPairs(bank);
    expect(pairs.map((p) => p.right)).toEqual([
      "Daun",
      "Klorofil",
      "Karbon dioksida",
      "Glukosa",
      "Oksigen",
    ]);
  });

  it("hanya memilih kunci satu kata 4–10 huruf untuk susun & cari kata", () => {
    expect(buildWords(bank).map((w) => w.word)).toEqual([
      "DAUN",
      "KLOROFIL",
      "GLUKOSA",
      "OKSIGEN",
    ]);
  });

  it("membuat satu flashcard per soal", () => {
    const cards = buildCards(bank);
    expect(cards).toHaveLength(bank.length);
    expect(cards[7].front).not.toContain("____");
    expect(cards[7].back).toBe("oksigen");
  });

  it("membandingkan isian tanpa peka huruf besar-kecil dan spasi tepi", () => {
    expect(isianBenar("  Oksigen ", "oksigen")).toBe(true);
    expect(isianBenar("karbon", "oksigen")).toBe(false);
  });
});

describe("templates", () => {
  it("menghitung isi sesuai template", () => {
    expect(templateCount("kuis", bank)).toBe(8);
    expect(templateCount("jodoh", bank)).toBe(5);
    expect(templateCount("cari", bank)).toBe(4);
  });

  it("menolak menjodohkan bila pasangan unik kurang dari tiga", () => {
    const dua = bank.slice(0, 2);
    expect(eligibility("jodoh", dua).ok).toBe(false);
    expect(eligibility("jodoh", dua).reason).toContain("3 pasangan");
    expect(eligibility("jodoh", bank).ok).toBe(true);
  });

  it("menolak susun/cari kata bila tidak ada kunci satu kata", () => {
    const hanyaBS = bank.filter((q) => q.type === "bs");
    expect(eligibility("susun", hanyaBS).ok).toBe(false);
    expect(eligibility("cari", hanyaBS).ok).toBe(false);
  });

  it("menyarankan template dari komposisi tipe soal", () => {
    expect(recommendedTemplate(bank)).toBe("kuis");
    expect(recommendedTemplate(bank.filter((q) => q.type === "bs"))).toBe("bs");
    expect(recommendedTemplate(bank.filter((q) => q.type === "isian"))).toBe("isian");
  });
});

describe("validasi keluaran AI", () => {
  it("menandai soal berkeyakinan rendah beserta catatannya", () => {
    const rendah = bank.find((q) => q.conf < 80);
    expect(rendah?.low).toBe(true);
    expect(rendah?.note).toBeTruthy();
  });

  it("menandai soal cacat tanpa membuangnya", () => {
    const cacat: Question[] = [
      { id: "a", type: "pg", q: "Tanpa opsi", opts: [], conf: 99, sumber: "manual" },
      { id: "b", type: "isian", q: "Tanpa kunci", conf: 99, sumber: "manual" },
    ];
    const hasil = validateQuestions(cacat);
    expect(hasil).toHaveLength(2);
    expect(hasil[0].low).toBe(true);
    expect(hasil[0].note).toContain("opsi kurang dari dua");
    expect(hasil[1].note).toContain("kunci jawaban belum diisi");
  });
});

describe("cari kata", () => {
  const kata = ["DAUN", "KLOROFIL", "GLUKOSA", "OKSIGEN"];

  it("menempatkan semua kata pada kisi 10×10", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const grid = generateGrid(kata, 10, rng(seed));
      expect(grid.letters).toHaveLength(100);
      expect(grid.placed.map((p) => p.word).sort()).toEqual([...kata].sort());
      for (const p of grid.placed) {
        expect(p.cells.map((c) => grid.letters[c]).join("")).toBe(p.word);
      }
    }
  });

  it("mengisi sel sisa dengan huruf", () => {
    const grid = generateGrid(kata, 10, rng(7));
    expect(grid.letters.every((c) => /^[A-Z]$/.test(c))).toBe(true);
  });

  it("hanya menerima garis lurus", () => {
    expect(lineBetween(0, 3, 10)).toEqual([0, 1, 2, 3]);
    expect(lineBetween(0, 20, 10)).toEqual([0, 10, 20]);
    expect(lineBetween(0, 11, 10)).toBeNull();
  });

  it("mengenali kata yang dibaca maju maupun mundur", () => {
    const grid = generateGrid(kata, 10, rng(3));
    const target = grid.placed[0];
    expect(matchWord(grid, target.cells, [])?.word).toBe(target.word);
    expect(matchWord(grid, [...target.cells].reverse(), [])?.word).toBe(target.word);
    expect(matchWord(grid, target.cells, [target.word])).toBeUndefined();
  });
});
