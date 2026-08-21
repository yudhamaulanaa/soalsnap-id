/**
 * Kotak batas ternormalisasi (blueprint §7).
 *
 * Koordinat disimpan 0..1 terhadap ukuran halaman, bukan piksel, supaya tidak
 * terikat resolusi render. Halaman yang sama bisa dirender ulang pada DPI
 * berbeda dan kotaknya tetap sahih.
 */
export interface Bbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Model kerap mengembalikan nilai yang meleset tipis dari 1.0 karena
 * pembulatan. FR-011 mengizinkan toleransi sebesar ini, dan hanya sebesar ini —
 * selebihnya berarti kotaknya memang salah, bukan sekadar bergeser.
 */
export const TOLERANSI = 0.01;

export function bboxSah(b: Bbox): boolean {
  const angka = [b.x, b.y, b.width, b.height];
  if (!angka.every((n) => Number.isFinite(n))) return false;
  if (b.x < 0 || b.y < 0) return false;
  if (b.width <= 0 || b.height <= 0) return false;
  return b.x + b.width <= 1 + TOLERANSI && b.y + b.height <= 1 + TOLERANSI;
}

/**
 * Merapikan pergeseran kecil ke dalam 0..1. Kotak yang tidak mungkin
 * dikembalikan sebagai null, bukan dipaksa masuk — memaksanya berarti memotong
 * bagian gambar yang salah tanpa ada yang tahu.
 */
export function rapikanBbox(b: Bbox): Bbox | null {
  if (!bboxSah(b)) return null;

  const x = Math.min(Math.max(b.x, 0), 1);
  const y = Math.min(Math.max(b.y, 0), 1);
  return {
    x,
    y,
    width: Math.min(b.width, 1 - x),
    height: Math.min(b.height, 1 - y),
  };
}

/** Kotak terkecil yang memuat seluruh kotak masukan — dipakai memotong satu soal utuh. */
export function gabungBbox(daftar: Bbox[]): Bbox | null {
  const sah = daftar.map(rapikanBbox).filter((b): b is Bbox => b !== null);
  if (sah.length === 0) return null;

  const x = Math.min(...sah.map((b) => b.x));
  const y = Math.min(...sah.map((b) => b.y));
  const kanan = Math.max(...sah.map((b) => b.x + b.width));
  const bawah = Math.max(...sah.map((b) => b.y + b.height));
  return { x, y, width: kanan - x, height: bawah - y };
}

export interface KotakPiksel {
  kiri: number;
  atas: number;
  kanan: number;
  bawah: number;
}

/**
 * Ternormalisasi → piksel, dengan padding yang tetap terkurung di dalam
 * halaman. Padding membuat potongan tidak terlihat terpotong mepet, tetapi
 * tidak boleh membuatnya keluar dari halaman.
 */
export function keKotakPiksel(
  b: Bbox,
  lebar: number,
  tinggi: number,
  padding = 0,
): KotakPiksel | null {
  const rapi = rapikanBbox(b);
  if (!rapi || lebar <= 0 || tinggi <= 0) return null;

  const kiri = Math.max(0, Math.round(rapi.x * lebar) - padding);
  const atas = Math.max(0, Math.round(rapi.y * tinggi) - padding);
  const kanan = Math.min(lebar, Math.round((rapi.x + rapi.width) * lebar) + padding);
  const bawah = Math.min(tinggi, Math.round((rapi.y + rapi.height) * tinggi) + padding);

  if (kanan <= kiri || bawah <= atas) return null;
  return { kiri, atas, kanan, bawah };
}
