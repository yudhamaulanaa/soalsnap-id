import { bandingTetap } from "../admin/token";

/**
 * Pembacaan header izin worker.
 *
 * Token yang benar masuk sebagai parameter, bukan dibaca dari environment,
 * supaya berkas ini bebas efek samping dan bisa diuji langsung — sama seperti
 * pemisahan pada sesi admin.
 */
export function tokenCocok(header: string | null | undefined, benar: string | null): boolean {
  if (!benar || !header) return false;

  const [skema, nilai] = header.split(" ");
  if (skema?.toLowerCase() !== "bearer" || !nilai) return false;
  return bandingTetap(nilai, benar);
}
