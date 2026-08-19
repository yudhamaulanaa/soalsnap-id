import { contohBankSoal } from "./ai/mockParser";
import type { Activity, Question, TemplateId } from "./types";
import { TIMER_KUIS_CEPAT, TIMER_DEFAULT } from "./types";

/**
 * Delapan aktivitas contoh — satu per template — supaya setiap mode main bisa
 * dicoba langsung dari Dashboard tanpa melewati alur unggah.
 */
interface SeedSpec {
  slug: string;
  title: string;
  template: TemplateId;
  plays: number;
  /** Hanya soal bertipe ini yang masuk ke aktivitas. */
  only?: Question["type"];
}

const SPECS: SeedSpec[] = [
  { slug: "X7K2E9", title: "Kuis Fotosintesis", template: "kuis", plays: 128 },
  { slug: "B4S1QD", title: "Benar/Salah: Fakta IPA", template: "bs", plays: 64, only: "bs" },
  { slug: "N3T5RA", title: "Isian Singkat IPA", template: "isian", plays: 40, only: "isian" },
  { slug: "J8P4MC", title: "Menjodohkan Istilah IPA", template: "jodoh", plays: 86 },
  { slug: "F2C7LK", title: "Flashcard Istilah IPA", template: "flashcard", plays: 54 },
  { slug: "S9W3VN", title: "Susun Kata IPA", template: "susun", plays: 31 },
  { slug: "Q5Z8HT", title: "Kuis Cepat Fotosintesis", template: "cepat", plays: 92 },
  { slug: "C6R2YB", title: "Cari Kata: Istilah IPA", template: "cari", plays: 47 },
];

export function seedActivities(): Activity[] {
  const bank = contohBankSoal();
  return SPECS.map((spec, i) => {
    const questions = (spec.only ? bank.filter((q) => q.type === spec.only) : bank).map((q) => ({
      ...q,
      id: `${spec.slug}-${q.id}`,
    }));
    return {
      id: `seed-${spec.slug}`,
      slug: spec.slug,
      title: spec.title,
      template: spec.template,
      acak: false,
      timerOn: true,
      timerDetik: spec.template === "cepat" ? TIMER_KUIS_CEPAT : TIMER_DEFAULT,
      status: "published",
      plays: spec.plays,
      questions,
      // Urutan menurun agar aktivitas seed tampil sesuai urutan desain.
      createdAt: SPECS.length - i,
      sourcePages: [
        { page: 1, count: questions.filter((q) => (q.page ?? 1) === 1).length },
        { page: 2, count: questions.filter((q) => q.page === 2).length },
      ].filter((p) => p.count > 0),
    } satisfies Activity;
  });
}
