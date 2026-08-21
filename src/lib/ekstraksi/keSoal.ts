import {
  AMBANG_KEYAKINAN,
  type Opsi,
  type QType,
  type Question,
} from "../types";
import type { SoalGabungan } from "./gabung";
import type { PeranAset, TipeSoalEkstraksi } from "./skema";

/**
 * Pemetaan hasil ekstraksi ke tipe `Question` milik aplikasi (FR-017).
 *
 * Model ekstraksi mengenal enam tipe soal, aplikasi ini hanya tiga. Yang tidak
 * punya padanan tidak dibuang — itu melanggar BRD §9.8 — melainkan dipetakan ke
 * yang terdekat lalu ditandai perlu tinjau beserta alasannya, sehingga gurunya
 * yang memutuskan.
 */
const PADANAN: Record<TipeSoalEkstraksi, { tipe: QType; catatan?: string }> = {
  single_choice: { tipe: "pg" },
  true_false: { tipe: "bs" },
  short_answer: { tipe: "isian" },
  multiple_choice: {
    tipe: "pg",
    catatan: "Sumbernya berjawaban ganda; aplikasi hanya menyimpan satu kunci",
  },
  essay: {
    tipe: "isian",
    catatan: "Soal uraian — kunci jawabannya perlu diisi sendiri",
  },
  unknown: {
    tipe: "isian",
    catatan: "Tipe soal tidak dikenali saat ekstraksi",
  },
};

/** Gambar yang paling mewakili soal, diurut menurut kegunaannya bagi siswa. */
const URUTAN_PERAN: PeranAset[] = [
  "question_image",
  "stimulus",
  "diagram",
  "table",
  "reference_image",
  "option_image",
];

function gambarUtama(soal: SoalGabungan): { kunci?: string; alt?: string } {
  for (const peran of URUTAN_PERAN) {
    const aset = soal.aset.find((a) => a.peran === peran && a.kunci);
    if (aset?.kunci)
      return { kunci: aset.kunci, alt: aset.altText ?? undefined };
  }
  // Potongan soal utuh sengaja tidak dipakai di sini. Isinya memuat stem dan
  // pilihan sekaligus, sehingga akan tampil dobel dengan teksnya, dan soal
  // teks biasa jadi membawa foto dirinya sendiri sampai ke latihan siswa.
  // Tempatnya di layar tinjau sebagai pembanding sumber (PRD §3), bukan di sini.
  return {};
}

/**
 * Pilihan jawaban; yang berupa gambar membawa kunci potongannya.
 *
 * Dokumen ujian kerap menaruh bangun datar atau diagram sebagai pilihan
 * A/B/C/D. Potongannya sudah diunggah worker, jadi yang perlu dilakukan di sini
 * hanya meneruskan kuncinya — bukan meratakannya menjadi teks.
 */
function daftarOpsi(soal: SoalGabungan): Opsi[] {
  return soal.opsi.map((o) => {
    const teks = o.teks?.trim() ?? "";
    const aset = o.aset.find((a) => a.kunci);
    if (!aset?.kunci) return teks;
    return {
      teks: teks || undefined,
      gambar: aset.kunci,
      gambarAlt: aset.altText ?? undefined,
    };
  });
}

/**
 * Kunci jawaban hanya diambil bila sumbernya menandainya (FR-023). Model tidak
 * pernah diminta menjawab, jadi tidak adanya kunci adalah keadaan normal —
 * bukan kegagalan.
 */
function indeksKunci(soal: SoalGabungan): number | undefined {
  const pertama = soal.kunciJawaban?.[0];
  if (!pertama) return undefined;
  const indeks = soal.opsi.findIndex((o) => o.kunci === pertama);
  return indeks >= 0 ? indeks : undefined;
}

export function keQuestion(soal: SoalGabungan): Question {
  const padanan = PADANAN[soal.tipe];
  const alasan = [...soal.alasanTinjau];
  if (padanan.catatan) alasan.push(padanan.catatan);

  // Pilihan bergambar yang potongannya tidak jadi terunggah akan tampil kosong,
  // dan soalnya jadi tidak bisa dijawab — itu yang perlu ditinjau, bukan
  // keberadaan gambarnya.
  const gambarHilang = soal.opsi.some(
    (o) => o.jenisIsi !== "text" && o.aset.every((a) => !a.kunci),
  );
  if (gambarHilang) {
    alasan.push("Ada pilihan bergambar yang gambarnya tidak terpotong");
  }

  const conf = Math.round(soal.konfidensi * 100);
  const gambar = gambarUtama(soal);
  const perluTinjau = alasan.length > 0 || conf < AMBANG_KEYAKINAN;
  const opts = padanan.tipe === "isian" ? undefined : daftarOpsi(soal);

  return {
    id: soal.externalRef,
    type: padanan.tipe,
    q: soal.stemTeks || "(teks soal tidak terbaca)",
    opts,
    correct: padanan.tipe === "isian" ? undefined : indeksKunci(soal),
    key:
      padanan.tipe === "isian"
        ? (soal.kunciJawaban?.[0] ?? undefined)
        : undefined,
    gambar: gambar.kunci,
    gambarAlt: gambar.alt,
    conf,
    low: perluTinjau,
    note:
      alasan.length > 0
        ? `Perlu dilengkapi: ${[...new Set(alasan)].join("; ")}.`
        : undefined,
    page: soal.halamanDari,
    sumber: "upload",
  };
}

export function keDaftarQuestion(soal: SoalGabungan[]): Question[] {
  return soal.map((s) => keQuestion(s));
}
