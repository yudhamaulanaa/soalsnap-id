import { rapikanBbox } from "./bbox";
import type { SoalEkstraksi } from "./skema";

/**
 * Aturan penandaan tinjau (FR-022, PRD §13).
 *
 * Keputusan akhir menggabungkan dua sumber: kepercayaan diri model, dan
 * pemeriksaan deterministik di sini. Yang kedua penting justru karena yang
 * pertama bisa keliru dengan meyakinkan.
 */
export const AMBANG_KONFIDENSI = 0.85;

export interface HasilTinjau {
  perluTinjau: boolean;
  alasan: string[];
}

export function periksaSoal(
  soal: SoalEkstraksi,
  ambang: number = AMBANG_KONFIDENSI,
): HasilTinjau {
  const alasan: string[] = [...soal.alasanTinjau];

  if (soal.perluTinjau && soal.alasanTinjau.length === 0) {
    alasan.push("Model menandai soal ini perlu diperiksa");
  }
  if (soal.konfidensi < ambang) {
    alasan.push(`Keyakinan model ${Math.round(soal.konfidensi * 100)}%, di bawah ambang`);
  }
  if (soal.tipe === "unknown") {
    alasan.push("Tipe soal tidak dikenali");
  }
  if (!rapikanBbox(soal.bbox)) {
    alasan.push("Posisi soal di halaman tidak masuk akal");
  }

  const berpilihan = soal.tipe === "single_choice" || soal.tipe === "multiple_choice" || soal.tipe === "true_false";
  if (berpilihan && soal.opsi.length < 2) {
    alasan.push("Pilihan jawaban kurang dari dua");
  }

  const kunci = soal.opsi.map((o) => o.kunci);
  if (new Set(kunci).size !== kunci.length) {
    alasan.push("Ada label pilihan yang kembar");
  }
  if (soal.opsi.some((o) => !o.kunci)) {
    alasan.push("Ada pilihan tanpa label");
  }

  // Pilihan bergambar yang potongannya tidak ada berarti soal tidak terjawab.
  const gambarHilang = soal.opsi.some(
    (o) => o.jenisIsi !== "text" && o.aset.every((a) => !a.kunci),
  );
  if (gambarHilang) {
    alasan.push("Ada pilihan bergambar yang gambarnya tidak terpotong");
  }

  const tanpaTeks = !soal.stem.teks?.trim();
  const tanpaAset = soal.aset.length === 0;
  if (tanpaTeks && tanpaAset) {
    alasan.push("Soal tidak punya teks maupun gambar");
  }

  const kunciJawabanAsing = soal.kunciJawaban?.some((k) => !kunci.includes(k)) ?? false;
  if (kunciJawabanAsing) {
    alasan.push("Kunci jawaban menunjuk pilihan yang tidak ada");
  }

  // Duplikat dibuang supaya daftarnya terbaca, urutannya dipertahankan.
  const unik = [...new Set(alasan)];
  return { perluTinjau: unik.length > 0, alasan: unik };
}
