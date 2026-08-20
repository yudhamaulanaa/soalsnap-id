/**
 * Tiket bertanda tangan: `<muatan>.<kedaluwarsa>.<tanda tangan HMAC>`.
 *
 * Dipakai bersama oleh sesi admin dan sesi pengguna. Rahasianya masuk sebagai
 * parameter, bukan dibaca dari environment, supaya berkas ini bebas efek
 * samping dan bisa diuji langsung.
 */

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

function keBase64url(bytes: Uint8Array): string {
  let biner = "";
  for (const b of bytes) biner += String.fromCharCode(b);
  return btoa(biner).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function dariBase64url(teks: string): string | null {
  try {
    const padded = teks.replace(/-/g, "+").replace(/_/g, "/");
    return new TextDecoder().decode(
      Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)),
    );
  } catch {
    return null;
  }
}

async function tandaTangan(pesan: string, rahasia: string): Promise<string> {
  const kunci = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(rahasia),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const tanda = await crypto.subtle.sign("HMAC", kunci, new TextEncoder().encode(pesan));
  return keBase64url(new Uint8Array(tanda));
}

export interface Tiket {
  nilai: string;
  kedaluwarsa: Date;
}

export async function buatTiket(
  muatan: string,
  rahasia: string,
  umurMs: number,
  sekarang = Date.now(),
): Promise<Tiket> {
  const exp = sekarang + umurMs;
  const isi = `${keBase64url(new TextEncoder().encode(muatan))}.${exp}`;
  return { nilai: `${isi}.${await tandaTangan(isi, rahasia)}`, kedaluwarsa: new Date(exp) };
}

/** Mengembalikan muatannya bila tiketnya sah, atau null bila tidak. */
export async function bacaTiket(
  tiket: string | null | undefined,
  rahasia: string,
  sekarang = Date.now(),
): Promise<string | null> {
  if (!tiket) return null;

  const bagian = tiket.split(".");
  if (bagian.length !== 3) return null;
  const [muatanB64, exp, tandaDiterima] = bagian as [string, string, string];
  if (!muatanB64 || !exp || !tandaDiterima) return null;

  const batas = Number(exp);
  if (!Number.isSafeInteger(batas) || batas <= sekarang) return null;

  const sah = bandingTetap(tandaDiterima, await tandaTangan(`${muatanB64}.${exp}`, rahasia));
  if (!sah) return null;

  return dariBase64url(muatanB64);
}
