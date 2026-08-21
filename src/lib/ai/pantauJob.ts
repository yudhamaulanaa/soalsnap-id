"use client";

import type { Question, SourcePage } from "../types";

/**
 * Memantau job pembacaan dokumen sampai selesai.
 *
 * Menggantikan progres simulasi dengan keadaan sebenarnya: yang ditampilkan
 * adalah halaman yang benar-benar sudah dibaca worker, bukan angka yang berjalan
 * sendiri.
 */
export interface KemajuanJob {
  progres: number;
  tahap: string | null;
}

export interface HasilJob {
  questions: Question[];
  sourcePages: SourcePage[];
}

interface StatusJob {
  status: string;
  progres: number;
  tahap: string | null;
  galat: string | null;
  hasil: { questions?: Question[] } | null;
  berkas: { halaman: number }[];
}

const JEDA_MS = 1500;

export class JobGagal extends Error {}

/** Halaman sumber diturunkan dari soal, sama seperti pada jalur simulasi. */
function halamanSumber(questions: Question[], jumlahHalaman: number): SourcePage[] {
  const hitung = new Map<number, number>();
  for (const q of questions) {
    const p = q.page ?? 1;
    hitung.set(p, (hitung.get(p) ?? 0) + 1);
  }
  const halaman = hitung.size > 0 ? [...hitung.keys()].sort((a, b) => a - b) : [1];
  const total = Math.max(jumlahHalaman, halaman.length);
  return Array.from({ length: total }, (_, i) => {
    const nomor = halaman[i] ?? i + 1;
    return { page: nomor, count: hitung.get(nomor) ?? 0 };
  });
}

export async function pantauJob(
  token: string,
  opsi: { onKemajuan?: (k: KemajuanJob) => void; signal?: AbortSignal } = {},
): Promise<HasilJob> {
  for (;;) {
    if (opsi.signal?.aborted) throw new DOMException("Dibatalkan", "AbortError");

    const res = await fetch(`/api/unggah/${token}`, { signal: opsi.signal });
    if (!res.ok) throw new JobGagal("Status pemrosesan tidak terbaca");
    const status = (await res.json()) as StatusJob;

    opsi.onKemajuan?.({ progres: status.progres, tahap: status.tahap });

    if (status.status === "gagal") {
      throw new JobGagal(status.galat ?? "Pemrosesan gagal.");
    }
    if (status.status === "selesai") {
      const questions = status.hasil?.questions ?? [];
      if (questions.length === 0) {
        throw new JobGagal("Tidak ada soal yang terbaca dari dokumen ini.");
      }
      const jumlahHalaman = status.berkas.reduce((n, b) => n + b.halaman, 0);
      return { questions, sourcePages: halamanSumber(questions, jumlahHalaman) };
    }
    // "terbaca" berarti OCR cadangan selesai tetapi soalnya belum disusun —
    // dari sudut pandang layar ini, itu bukan hasil yang bisa dipakai.
    if (status.status === "terbaca") {
      throw new JobGagal("Dokumen terbaca, tetapi soalnya belum bisa disusun.");
    }

    await new Promise((r) => setTimeout(r, JEDA_MS));
  }
}
