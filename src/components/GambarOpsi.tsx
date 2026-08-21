import { urlGambar } from "@/lib/unggah/gambar";

/**
 * Gambar satu pilihan jawaban.
 *
 * Dibuat terpisah dari `GambarSoal` karena ukurannya berbeda peran: gambar soal
 * berdiri sendiri dan boleh besar, sedangkan gambar pilihan berjajar empat dan
 * harus tetap terbandingkan satu sama lain — jadi tingginya dipatok sama.
 *
 * Teks alternatifnya tidak pernah dikosongkan. Pilihan yang hanya berupa gambar
 * mustahil dijawab lewat pembaca layar kalau gambarnya tidak diumumkan, jadi
 * label huruf pilihannya ikut disebut.
 */
export function GambarOpsi({
  kunci,
  alt,
  label,
  className = "",
}: {
  kunci: string;
  alt?: string;
  /** Huruf pilihan (A/B/C/D), dipakai saat gambarnya tanpa keterangan. */
  label?: string;
  className?: string;
}) {
  const keterangan =
    alt?.trim() ||
    (label ? `Gambar pilihan ${label}` : "Gambar pilihan jawaban");
  return (
    /* Sama seperti GambarSoal: proxy kami harus tetap menjadi satu-satunya jalan
       menuju gambar, sehingga gambar yang diturunkan admin benar-benar berhenti
       tersaji. next/image akan menyimpan hasil optimasinya sendiri. */
    // eslint-disable-next-line @next/next/no-img-element -- lihat catatan di atas
    <img
      src={urlGambar(kunci)}
      alt={keterangan}
      loading="lazy"
      className={`h-24 w-full rounded-lg bg-surface object-contain ${className}`}
    />
  );
}
