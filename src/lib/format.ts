import { templateCount, templateMeta } from "./templates";
import type { Activity } from "./types";

/** Baris meta pada kartu aktivitas dashboard (FR-DB-1). */
export function activityMeta(a: Activity): string {
  const isi = templateMeta(a.template).unit(templateCount(a.template, a.questions));
  if (a.template === "cepat") return `${isi} · timer ${a.timerDetik} detik`;
  if (a.fresh && a.sourcePages?.length) {
    return `${isi} · dari ${a.sourcePages.length} halaman foto`;
  }
  return `${isi} · ${a.plays} kali dimainkan`;
}

/** Tautan publik siswa (FR-SH-2). Tampil pendek, disalin sebagai URL penuh. */
export function tautanTampil(slug: string): string {
  return `soalsnap.id/m/${slug}`;
}

export function tautanPenuh(slug: string): string {
  if (typeof window !== "undefined") return `${window.location.origin}/main/${slug}`;
  return `https://soalsnap.id/m/${slug}`;
}

export function formatUkuran(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
