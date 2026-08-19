/** Kategori katalog soal publik. Nilai yang disimpan = label yang ditampilkan. */

export const KELAS = [
  "Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6",
  "Kelas 7", "Kelas 8", "Kelas 9",
  "Kelas 10", "Kelas 11", "Kelas 12",
  "Umum",
] as const;

export const MAPEL = [
  "Matematika",
  "IPA",
  "Fisika",
  "Kimia",
  "Biologi",
  "IPS",
  "Sejarah",
  "Geografi",
  "Ekonomi",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "PPKn",
  "Pendidikan Agama",
  "Informatika",
  "Seni Budaya",
  "PJOK",
  "Lainnya",
] as const;

export type Kelas = (typeof KELAS)[number];
export type Mapel = (typeof MAPEL)[number];

/** Jenjang untuk mengelompokkan filter kelas. */
export const JENJANG: { label: string; kelas: readonly string[] }[] = [
  { label: "SD", kelas: KELAS.slice(0, 6) },
  { label: "SMP", kelas: KELAS.slice(6, 9) },
  { label: "SMA/SMK", kelas: KELAS.slice(9, 12) },
  { label: "Umum", kelas: [KELAS[12]] },
];

export function kelasValid(v: unknown): v is Kelas {
  return typeof v === "string" && (KELAS as readonly string[]).includes(v);
}

export function mapelValid(v: unknown): v is Mapel {
  return typeof v === "string" && (MAPEL as readonly string[]).includes(v);
}
