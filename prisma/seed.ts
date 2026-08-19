import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { contohBankSoal } from "../src/lib/ai/mockParser";
import { buatEditSlug } from "../src/lib/slug";
import type { Question, TemplateId } from "../src/lib/types";

/**
 * Delapan contoh publik — satu per template — supaya katalog dan tiap mode main
 * bisa dicoba tanpa harus membuat soal lebih dulu.
 */
const CONTOH: {
  title: string;
  template: TemplateId;
  plays: number;
  only?: Question["type"];
  playSlug: string;
}[] = [
  { title: "Kuis Fotosintesis", template: "kuis", plays: 128, playSlug: "X7K2E9" },
  { title: "Benar/Salah: Fakta IPA", template: "bs", plays: 64, only: "bs", playSlug: "B4S1QD" },
  { title: "Isian Singkat IPA", template: "isian", plays: 40, only: "isian", playSlug: "N3T5RA" },
  { title: "Menjodohkan Istilah IPA", template: "jodoh", plays: 86, playSlug: "J8P4MC" },
  { title: "Flashcard Istilah IPA", template: "flashcard", plays: 54, playSlug: "F2C7LK" },
  { title: "Susun Kata IPA", template: "susun", plays: 31, playSlug: "S9W3VN" },
  { title: "Kuis Cepat Fotosintesis", template: "cepat", plays: 92, playSlug: "Q5Z8HT" },
  { title: "Cari Kata: Istilah IPA", template: "cari", plays: 47, playSlug: "C6R2YB" },
];

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

  const bank = contohBankSoal();

  for (const c of CONTOH) {
    const sudahAda = await prisma.activity.findUnique({ where: { playSlug: c.playSlug } });
    if (sudahAda) {
      console.log(`lewati (sudah ada): ${c.title}`);
      continue;
    }

    const soal = c.only ? bank.filter((q) => q.type === c.only) : bank;
    await prisma.activity.create({
      data: {
        editSlug: buatEditSlug(),
        playSlug: c.playSlug,
        title: c.title,
        template: c.template,
        acak: false,
        timerOn: true,
        timerDetik: c.template === "cepat" ? 8 : 20,
        visibility: "public",
        kelas: "Kelas 7",
        mapel: "IPA",
        creatorName: "Tim SoalSnap",
        plays: c.plays,
        questions: {
          create: soal.map((q, i) => ({
            urutan: i,
            type: q.type,
            q: q.q,
            opts: q.opts ? JSON.stringify(q.opts) : null,
            correct: q.correct ?? null,
            kunci: q.key ?? null,
            conf: q.conf,
            low: q.low ?? false,
            note: q.note ?? null,
            clue: q.clue ?? null,
            page: q.page ?? null,
            sumber: q.sumber,
          })),
        },
      },
    });
    console.log(`dibuat: ${c.title} → /main/${c.playSlug}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
