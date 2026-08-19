import { templateCount, templateMeta } from "./templates";
import type { Activity, CatalogItem, TemplateId } from "./types";

interface MetaKartu {
  template: TemplateId;
  /** Jumlah isi yang dimainkan (soal/pasangan/kartu/kata). */
  jumlah: number;
  plays: number;
  timerDetik?: number;
}

/** Baris meta pada kartu aktivitas (FR-DB-1). */
export function metaKartu({ template, jumlah, plays, timerDetik }: MetaKartu): string {
  const isi = templateMeta(template).unit(jumlah);
  if (template === "cepat" && timerDetik) return `${isi} · timer ${timerDetik} detik`;
  return `${isi} · ${plays} kali dimainkan`;
}

export function metaAktivitas(a: Activity): string {
  return metaKartu({
    template: a.template,
    jumlah: templateCount(a.template, a.questions),
    plays: a.plays,
    timerDetik: a.timerDetik,
  });
}

export function metaKatalog(item: CatalogItem): string {
  return metaKartu({
    template: item.template,
    jumlah: item.jumlahSoal,
    plays: item.plays,
  });
}

/** Tautan peserta. Ditampilkan pendek, disalin sebagai URL penuh. */
export function tautanMainPendek(playSlug: string): string {
  return `soalsnap.id/m/${playSlug}`;
}

export function tautanMain(playSlug: string): string {
  if (typeof window !== "undefined") return `${window.location.origin}/main/${playSlug}`;
  return `https://soalsnap.id/main/${playSlug}`;
}

export function tautanEdit(editSlug: string): string {
  if (typeof window !== "undefined") return `${window.location.origin}/edit/${editSlug}`;
  return `https://soalsnap.id/edit/${editSlug}`;
}

export function formatUkuran(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Tanggal beserta jam, untuk jejak moderasi di halaman admin. */
export function formatWaktu(ms: number): string {
  return new Date(ms).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTanggal(ms: number): string {
  return new Date(ms).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
