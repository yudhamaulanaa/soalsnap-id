/**
 * Sidik pelapor: hash satu arah dari alamat dan peramban pemanggil.
 *
 * Dipakai hanya untuk mengenali laporan berulang atas aktivitas yang sama.
 * Nilainya tidak bisa dikembalikan menjadi alamat IP dan tidak pernah
 * ditampilkan di halaman admin.
 */
export async function sidikPelapor(request: Request): Promise<string> {
  const teruskan = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const bahan = [
    teruskan || request.headers.get("x-real-ip") || "tanpa-ip",
    request.headers.get("user-agent") ?? "tanpa-ua",
  ].join("|");

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bahan));
  return Array.from(new Uint8Array(digest).slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
