import "server-only";
import { prisma } from "./db";
import { TEMPLATES } from "./templates";
import type { CatalogItem, TemplateId } from "./types";

export const PER_HALAMAN = 12;

export interface FilterKatalog {
  kelas?: string;
  mapel?: string;
  q?: string;
  halaman?: number;
}

export interface HasilKatalog {
  item: CatalogItem[];
  total: number;
  halaman: number;
  totalHalaman: number;
}

const IDS = new Set(TEMPLATES.map((t) => t.id as string));

/**
 * Katalog hanya memuat aktivitas publik dan tidak pernah menyertakan soal
 * maupun kunci jawaban — hanya ringkasan kartunya.
 */
export async function ambilKatalog(filter: FilterKatalog = {}): Promise<HasilKatalog> {
  const halaman = Math.max(1, filter.halaman ?? 1);
  const where = {
    visibility: "public",
    ...(filter.kelas ? { kelas: filter.kelas } : {}),
    ...(filter.mapel ? { mapel: filter.mapel } : {}),
    ...(filter.q ? { title: { contains: filter.q } } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      select: {
        id: true,
        playSlug: true,
        title: true,
        template: true,
        kelas: true,
        mapel: true,
        plays: true,
        createdAt: true,
        _count: { select: { questions: true } },
      },
    }),
  ]);

  return {
    item: rows.map((r) => ({
      id: r.id,
      playSlug: r.playSlug,
      title: r.title,
      template: (IDS.has(r.template) ? r.template : "kuis") as TemplateId,
      kelas: r.kelas,
      mapel: r.mapel,
      plays: r.plays,
      jumlahSoal: r._count.questions,
      createdAt: r.createdAt.getTime(),
    })),
    total,
    halaman,
    totalHalaman: Math.max(1, Math.ceil(total / PER_HALAMAN)),
  };
}

/** Kategori yang benar-benar terpakai, untuk menyusun filter. */
export async function kategoriTerpakai() {
  const rows = await prisma.activity.findMany({
    where: { visibility: "public" },
    select: { kelas: true, mapel: true },
  });
  return {
    kelas: [...new Set(rows.map((r) => r.kelas).filter((v): v is string => !!v))],
    mapel: [...new Set(rows.map((r) => r.mapel).filter((v): v is string => !!v))],
  };
}
