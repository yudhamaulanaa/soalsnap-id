import "server-only";
import { prisma } from "../db";

/** Sebanyak ini baris per halaman daftar admin. */
export const PER_HALAMAN = 20;

export interface FilterAktivitas {
  q?: string;
  visibility?: "private" | "public";
  /** Hanya aktivitas yang punya laporan yang belum ditutup. */
  dilaporkan?: boolean;
  halaman: number;
}

export async function ringkasanAdmin() {
  const [aktivitas, publik, diturunkan, laporanBaru, soal, sesi] = await Promise.all([
    prisma.activity.count(),
    prisma.activity.count({ where: { visibility: "public" } }),
    prisma.activity.count({ where: { takedownAt: { not: null } } }),
    prisma.report.count({ where: { status: "baru" } }),
    prisma.question.count(),
    prisma.playSession.count(),
  ]);
  return { aktivitas, publik, diturunkan, laporanBaru, soal, sesi };
}

export async function cariAktivitas(filter: FilterAktivitas) {
  const where = {
    ...(filter.visibility ? { visibility: filter.visibility } : {}),
    ...(filter.dilaporkan ? { reports: { some: { status: "baru" } } } : {}),
    ...(filter.q ? { title: { contains: filter.q } } : {}),
  };

  const [total, baris] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      select: {
        id: true,
        title: true,
        template: true,
        visibility: true,
        kelas: true,
        mapel: true,
        plays: true,
        createdAt: true,
        takedownAt: true,
        creatorEmail: true,
        _count: { select: { questions: true, reports: { where: { status: "baru" } } } },
      },
    }),
  ]);

  return { baris, total, totalHalaman: Math.max(1, Math.ceil(total / PER_HALAMAN)) };
}

/** Satu aktivitas lengkap dengan soal, rekap peserta, dan laporannya. */
export async function aktivitasLengkap(id: string) {
  return prisma.activity.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { urutan: "asc" } },
      reports: { orderBy: { createdAt: "desc" } },
      sessions: { orderBy: { createdAt: "desc" }, take: 50 },
      _count: { select: { sessions: true } },
    },
  });
}

export async function daftarLaporan(status: string | undefined, halaman: number) {
  const where = status ? { status } : {};
  const [total, baris] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      include: {
        activity: {
          select: { id: true, title: true, playSlug: true, visibility: true, takedownAt: true },
        },
      },
    }),
  ]);

  return { baris, total, totalHalaman: Math.max(1, Math.ceil(total / PER_HALAMAN)) };
}
