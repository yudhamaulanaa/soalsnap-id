import { urlGambar } from "@/lib/unggah/gambar";

/**
 * Gambar pendamping satu soal.
 *
 * Teks alternatifnya sengaja tidak dikosongkan begitu saja: soal bergambar
 * sering tidak bisa dijawab tanpa melihat gambarnya, jadi pembaca layar tetap
 * perlu diberi tahu bahwa ada gambar di sini.
 */
export function GambarSoal({
  kunci,
  alt,
  className = "",
}: {
  kunci: string;
  alt?: string;
  className?: string;
}) {
  return (
    /* next/image menyimpan hasil optimasinya sendiri, sehingga gambar yang sudah
       diturunkan admin masih bisa tersaji dari cache itu. Proxy kami harus tetap
       menjadi satu-satunya jalan menuju gambar. */
    // eslint-disable-next-line @next/next/no-img-element -- lihat catatan di atas
    <img
      src={urlGambar(kunci)}
      alt={alt?.trim() || "Gambar pendamping soal"}
      loading="lazy"
      className={`max-h-[320px] w-full rounded-xl border border-line object-contain ${className}`}
    />
  );
}
