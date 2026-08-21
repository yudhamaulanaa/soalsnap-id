import { PREFIKS_GAMBAR, kunciGambarSah } from "../unggah/gambar";

/**
 * Kunci objek deterministik untuk hasil worker (FR-015, blueprint §11).
 *
 * Deterministik supaya job yang diulang menimpa objek yang sama alih-alih
 * menumpuk salinan baru. Sumber keunikannya adalah job, berkas ke berapa dalam
 * job itu, halaman, dan tempId dari model — keempatnya tetap sama pada
 * pengulangan.
 *
 * Urutan berkas ikut karena satu unggahan boleh memuat beberapa berkas, dan
 * nomor halaman dihitung ulang dari 1 pada tiap berkas. Tanpa urutan itu,
 * halaman 1 berkas kedua akan menimpa halaman 1 berkas pertama.
 */
function aman(nilai: string, maks = 40): string {
  return nilai.replace(/[^A-Za-z0-9]/g, "").slice(0, maks) || "x";
}

/**
 * Potongan soal masuk ruang nama `soal/` karena hanya itu yang dilayani rute
 * penyaji gambar; render halaman tidak, karena itu bahan audit dan tidak pernah
 * ditampilkan ke siswa.
 */
export function kunciPotonganSoal(
  jobId: string,
  urutan: number,
  halaman: number,
  tempId: string,
): string {
  const kunci = `${PREFIKS_GAMBAR}${aman(jobId, 24)}-${urutan}-${halaman}-${aman(tempId, 24)}.webp`;
  // Dijaga di sini juga, bukan hanya diandaikan: rute penyaji akan menolak
  // kunci di luar polanya, dan kegagalan itu lebih mahal ditemukan belakangan.
  return kunciGambarSah(kunci)
    ? kunci
    : `${PREFIKS_GAMBAR}${aman(jobId, 24)}-${urutan}-${halaman}.webp`;
}

export function kunciRenderHalaman(
  jobId: string,
  urutan: number,
  halaman: number,
): string {
  const nomor = String(halaman).padStart(4, "0");
  return `ingest/${aman(jobId, 32)}/pages/berkas-${urutan}-page-${nomor}.webp`;
}
