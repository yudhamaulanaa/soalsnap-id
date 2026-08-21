import type { Bbox } from "./bbox";
import { periksaSoal, AMBANG_KONFIDENSI } from "./tinjau";
import type { AsetEkstraksi, HalamanEkstraksi, OpsiEkstraksi, SoalEkstraksi, TipeSoalEkstraksi } from "./skema";

/**
 * Penggabungan fragmen soal antarhalaman (FR-012).
 *
 * Satu soal bisa mulai di halaman N dan pilihannya berada di N+1. Fragmen
 * disatukan berdasarkan bendera lanjutan dari model, nomor soal, dan kedekatan
 * halaman. Yang tidak bisa dipastikan tidak diputuskan diam-diam — soalnya
 * tetap digabung supaya isinya tidak hilang, tetapi ditandai perlu tinjau.
 */
export interface SoalGabungan {
  /** Identitas stabil untuk mencegah duplikat saat job diulang (FR-018). */
  externalRef: string;
  nomor: number | null;
  tipe: TipeSoalEkstraksi;
  stemTeks: string;
  opsi: OpsiEkstraksi[];
  aset: AsetEkstraksi[];
  kunciJawaban: string[] | null;
  konfidensi: number;
  perluTinjau: boolean;
  alasanTinjau: string[];
  halamanDari: number;
  halamanSampai: number;
  /** Satu kotak per halaman asal — dasar potongan soal utuh. */
  bboxPerHalaman: { halaman: number; bbox: Bbox }[];
  /** Kunci potongan soal utuh per halaman, diisi worker. */
  kunciPotongan: string[];
}

export interface OpsiGabung {
  dokumenId: string;
  ambang?: number;
}

/** Fragmen diurutkan menurut halaman lalu posisi vertikalnya di halaman. */
function urutkan(halaman: HalamanEkstraksi[]): SoalEkstraksi[] {
  return halaman
    .slice()
    .sort((a, b) => a.halaman - b.halaman)
    .flatMap((h) => h.soal.slice().sort((a, b) => a.bbox.y - b.bbox.y));
}

function mulaiBaru(f: SoalEkstraksi, dokumenId: string): SoalGabungan {
  return {
    externalRef: `${dokumenId}:p${f.halaman}:q${f.nomor ?? f.tempId}`,
    nomor: f.nomor,
    tipe: f.tipe,
    stemTeks: f.stem.teks?.trim() ?? "",
    opsi: [...f.opsi],
    aset: [...f.aset],
    kunciJawaban: f.kunciJawaban,
    konfidensi: f.konfidensi,
    perluTinjau: f.perluTinjau,
    alasanTinjau: [...f.alasanTinjau],
    halamanDari: f.halaman,
    halamanSampai: f.halaman,
    bboxPerHalaman: [{ halaman: f.halaman, bbox: f.bbox }],
    kunciPotongan: f.kunciPotongan ? [f.kunciPotongan] : [],
  };
}

/**
 * Fragmen dianggap lanjutan bila bendera modelnya bersesuaian, atau nomornya
 * sama persis, dan halamannya berdampingan. Nomor yang sama tetapi halamannya
 * berjauhan lebih mungkin dua soal berbeda daripada satu soal terpotong.
 */
function lanjutanDari(sebelum: SoalGabungan, f: SoalEkstraksi): boolean {
  const berdampingan = f.halaman === sebelum.halamanSampai + 1;
  if (!berdampingan) return false;

  const nomorSama = f.nomor !== null && f.nomor === sebelum.nomor;
  const benderaCocok = f.lanjutanDariSebelumnya;
  return nomorSama || benderaCocok;
}

function satukan(target: SoalGabungan, f: SoalEkstraksi, meragukan: boolean): void {
  const teks = f.stem.teks?.trim();
  if (teks) target.stemTeks = target.stemTeks ? `${target.stemTeks}\n${teks}` : teks;

  target.opsi.push(...f.opsi);
  target.aset.push(...f.aset);
  if (!target.kunciJawaban && f.kunciJawaban) target.kunciJawaban = f.kunciJawaban;
  if (target.nomor === null) target.nomor = f.nomor;

  // Keyakinan gabungan mengambil yang terendah: satu bagian yang meragukan
  // membuat seluruh soal meragukan.
  target.konfidensi = Math.min(target.konfidensi, f.konfidensi);
  target.halamanSampai = f.halaman;
  target.bboxPerHalaman.push({ halaman: f.halaman, bbox: f.bbox });
  if (f.kunciPotongan) target.kunciPotongan.push(f.kunciPotongan);
  target.alasanTinjau.push(...f.alasanTinjau);
  if (f.perluTinjau) target.perluTinjau = true;

  if (meragukan) {
    target.perluTinjau = true;
    target.alasanTinjau.push("Penggabungan antarhalaman tidak pasti");
  }
}

export function gabungkan(halaman: HalamanEkstraksi[], opsi: OpsiGabung): SoalGabungan[] {
  const fragmen = urutkan(halaman);
  const hasil: SoalGabungan[] = [];

  for (const f of fragmen) {
    const sebelum = hasil[hasil.length - 1];

    if (sebelum && lanjutanDari(sebelum, f)) {
      // Model menyatakan sambungan hanya dari satu sisi — mungkin benar,
      // mungkin tidak, jadi digabung tetapi ditandai.
      const sepihak = f.lanjutanDariSebelumnya !== true || sebelum.halamanSampai === f.halaman;
      satukan(sebelum, f, sepihak && f.nomor === null);
      continue;
    }

    if (f.lanjutanDariSebelumnya && !sebelum) {
      const baru = mulaiBaru(f, opsi.dokumenId);
      baru.perluTinjau = true;
      baru.alasanTinjau.push("Ditandai lanjutan, tetapi tidak ada soal sebelumnya");
      hasil.push(baru);
      continue;
    }

    hasil.push(mulaiBaru(f, opsi.dokumenId));
  }

  return hasil.map((s) => selesaikan(s, opsi.ambang ?? AMBANG_KONFIDENSI, hasil));
}

/** Pemeriksaan akhir setelah seluruh fragmen menyatu. */
function selesaikan(soal: SoalGabungan, ambang: number, semua: SoalGabungan[]): SoalGabungan {
  const periksa = periksaSoal(
    {
      tempId: soal.externalRef,
      nomor: soal.nomor,
      tipe: soal.tipe,
      bbox: soal.bboxPerHalaman[0]!.bbox,
      stem: { teks: soal.stemTeks, bbox: null },
      aset: soal.aset,
      opsi: soal.opsi,
      kunciJawaban: soal.kunciJawaban,
      lanjutanDariSebelumnya: false,
      berlanjutKeBerikutnya: false,
      kunciPotongan: soal.kunciPotongan[0] ?? null,
      konfidensi: soal.konfidensi,
      perluTinjau: soal.perluTinjau,
      alasanTinjau: soal.alasanTinjau,
      halaman: soal.halamanDari,
    },
    ambang,
  );

  const alasan = [...periksa.alasan];

  // Nomor kembar biasanya berarti pemisahan soal yang keliru, bukan dokumen
  // yang memang mengulang nomor.
  if (soal.nomor !== null && semua.filter((s) => s.nomor === soal.nomor).length > 1) {
    alasan.push(`Nomor ${soal.nomor} muncul lebih dari sekali`);
  }

  const unik = [...new Set(alasan)];
  return { ...soal, perluTinjau: unik.length > 0, alasanTinjau: unik };
}
