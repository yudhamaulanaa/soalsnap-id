import "server-only";
import { prisma } from "../db";
import { tautanEditPenuh, tautanMainPenuh } from "../asal";
import { pengirim, type HasilKirim } from "../notify";
import { perluKirim } from "./pesan";

/** Kolom yang dibutuhkan untuk memutuskan dan mencatat pengiriman. */
export interface BarisPengiriman {
  id: string;
  title: string;
  editSlug: string;
  playSlug: string;
  creatorName: string | null;
  creatorEmail: string | null;
  creatorPhone: string | null;
  linkSentTo: string | null;
}

/**
 * Mengirimkan kedua tautan ke pembuat soal, sekali per alamat.
 *
 * Dipanggil dari rute yang memang membawa kontak baru — bukan dari setiap
 * penyimpanan — supaya penyuntingan biasa tidak menyentuh penyedia surel.
 */
export async function kirimTautanKePembuat(
  activity: BarisPengiriman,
  asal: string,
): Promise<HasilKirim> {
  const keputusan = perluKirim(activity.creatorEmail, activity.linkSentTo);
  if (!keputusan.kirim) {
    return { terkirim: false, kode: keputusan.kode!, alasan: keputusan.alasan };
  }

  const tujuan = activity.creatorEmail!.trim();
  const hasil = await pengirim
    .kirim({
      kepada: {
        name: activity.creatorName,
        email: tujuan,
        phone: activity.creatorPhone,
      },
      judul: activity.title,
      tautanEdit: tautanEditPenuh(asal, activity.editSlug),
      tautanMain: tautanMainPenuh(asal, activity.playSlug),
    })
    .catch((e: unknown) => {
      console.error("[notify] pengiriman gagal:", e);
      return { terkirim: false, kode: "gagal", alasan: "pengiriman gagal" } satisfies HasilKirim;
    });

  // Dicatat hanya bila benar-benar terkirim, supaya percobaan yang gagal masih
  // bisa diulang dengan menyimpan kontak sekali lagi.
  if (hasil.terkirim) {
    await prisma.activity
      .update({ where: { id: activity.id }, data: { linkSentTo: tujuan, linkSentAt: new Date() } })
      .catch((e: unknown) => console.error("[notify] gagal mencatat pengiriman:", e));
  }
  return hasil;
}
