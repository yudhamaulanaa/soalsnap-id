/**
 * Tiket sesi admin: `<kedaluwarsa>.<tanda tangan HMAC>`.
 *
 * Rahasianya masuk sebagai parameter, bukan dibaca dari environment, supaya
 * berkas ini bebas efek samping dan bisa diuji langsung. Pembacaan environment
 * beserta cookie-nya ada di `sesi.ts`.
 */

const UMUR_MS = 8 * 60 * 60 * 1000;

/**
 * Perbandingan waktu-tetap. Perbandingan biasa berhenti di karakter pertama
 * yang berbeda, dan selisih waktunya bisa dipakai menebak isi rahasia.
 */
export function bandingTetap(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let beda = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) {
    beda |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  }
  return beda === 0;
}

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let biner = "";
  for (const b of bytes) biner += String.fromCharCode(b);
  return btoa(biner).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function tandaTangan(pesan: string, rahasia: string): Promise<string> {
  const kunci = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(rahasia),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", kunci, new TextEncoder().encode(pesan)));
}

export interface Tiket {
  nilai: string;
  kedaluwarsa: Date;
}

export async function buatTiket(rahasia: string, sekarang = Date.now()): Promise<Tiket> {
  const exp = sekarang + UMUR_MS;
  return { nilai: `${exp}.${await tandaTangan(String(exp), rahasia)}`, kedaluwarsa: new Date(exp) };
}

export async function tiketSah(
  tiket: string | undefined | null,
  rahasia: string,
  sekarang = Date.now(),
): Promise<boolean> {
  if (!tiket) return false;
  const pisah = tiket.indexOf(".");
  if (pisah < 1) return false;

  const exp = tiket.slice(0, pisah);
  const tandaDiterima = tiket.slice(pisah + 1);
  const batas = Number(exp);
  if (!Number.isSafeInteger(batas) || batas <= sekarang) return false;

  return bandingTetap(tandaDiterima, await tandaTangan(exp, rahasia));
}
