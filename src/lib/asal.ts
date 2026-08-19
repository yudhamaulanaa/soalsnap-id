/**
 * Asal aplikasi untuk menyusun tautan absolut di sisi server.
 *
 * `new URL(request.url).origin` mengikuti header Host, dan header itu bisa
 * dipalsukan oleh pengirim permintaan. Tautan yang masuk ke surel karenanya
 * mengutamakan APP_URL bila dikonfigurasi, dan hanya jatuh ke asal permintaan
 * pada pengembangan lokal.
 */
export function asalAplikasi(request: Request): string {
  const dikonfigurasi = process.env.APP_URL?.trim();
  if (dikonfigurasi) return dikonfigurasi.replace(/\/+$/, "");
  return new URL(request.url).origin;
}

export function tautanEditPenuh(asal: string, editSlug: string): string {
  return `${asal}/edit/${editSlug}`;
}

export function tautanMainPenuh(asal: string, playSlug: string): string {
  return `${asal}/main/${playSlug}`;
}
