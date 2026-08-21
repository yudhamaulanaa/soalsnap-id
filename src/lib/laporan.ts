/** Alasan baku laporan konten. Dipakai bersama oleh form pelapor dan admin. */
export const ALASAN_LAPORAN = [
  { id: "tidak-pantas", label: "Tidak pantas atau kasar" },
  { id: "menyesatkan", label: "Salah atau menyesatkan" },
  { id: "spam", label: "Spam atau iklan" },
  { id: "hak-cipta", label: "Melanggar hak cipta" },
  { id: "data-pribadi", label: "Memuat data pribadi" },
  { id: "lainnya", label: "Lainnya" },
] as const;

export type AlasanLaporan = (typeof ALASAN_LAPORAN)[number]["id"];

export const ALASAN_IDS = ALASAN_LAPORAN.map((a) => a.id) as [AlasanLaporan, ...AlasanLaporan[]];

export function labelAlasan(id: string): string {
  return ALASAN_LAPORAN.find((a) => a.id === id)?.label ?? id;
}

/** Antrean admin: laporan masuk sebagai "baru", lalu ditutup. */
export const STATUS_LAPORAN = ["baru", "ditangani", "diabaikan"] as const;

export type StatusLaporan = (typeof STATUS_LAPORAN)[number];

export function labelStatus(status: string): string {
  if (status === "baru") return "Baru";
  if (status === "ditangani") return "Ditangani";
  if (status === "diabaikan") return "Diabaikan";
  return status;
}

/** Status job pembacaan dokumen, dari dibuat sampai ditutup. */
export const STATUS_JOB = ["menyusun", "antre", "diproses", "terbaca", "gagal"] as const;

export function labelStatusJob(status: string): string {
  const label: Record<string, string> = {
    menyusun: "Menyusun",
    antre: "Antre",
    diproses: "Diproses",
    terbaca: "Terbaca",
    gagal: "Gagal",
  };
  return label[status] ?? status;
}
