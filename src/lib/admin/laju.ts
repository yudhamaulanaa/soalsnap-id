/**
 * Pembatas laju sederhana di memori proses.
 *
 * Cukup untuk menahan tebakan sandi beruntun dan banjir laporan pada satu
 * instans. Kalau aplikasi dijalankan di banyak instans, hitungannya terpisah
 * per instans — untuk itu perlu penyimpanan bersama (mis. Redis).
 */
interface Jatah {
  sisa: number;
  reset: number;
}

const jejak = new Map<string, Jatah>();

/** Dibuang berkala supaya kunci lama tidak menumpuk di memori. */
function bersihkan(sekarang: number) {
  if (jejak.size < 500) return;
  for (const [kunci, jatah] of jejak) {
    if (jatah.reset <= sekarang) jejak.delete(kunci);
  }
}

export interface HasilLaju {
  boleh: boolean;
  /** Detik menuju pemulihan jatah; berguna untuk pesan ke pengguna. */
  tungguDetik: number;
}

export function ambilJatah(
  kunci: string,
  batas: number,
  jendelaMs: number,
  sekarang = Date.now(),
): HasilLaju {
  bersihkan(sekarang);
  const jatah = jejak.get(kunci);

  if (!jatah || jatah.reset <= sekarang) {
    jejak.set(kunci, { sisa: batas - 1, reset: sekarang + jendelaMs });
    return { boleh: true, tungguDetik: 0 };
  }
  if (jatah.sisa <= 0) {
    return { boleh: false, tungguDetik: Math.ceil((jatah.reset - sekarang) / 1000) };
  }
  jatah.sisa -= 1;
  return { boleh: true, tungguDetik: 0 };
}

/** Dipakai tes agar hitungan satu berkas tidak bocor ke berkas lain. */
export function lupakanSemuaJatah() {
  jejak.clear();
}

/** Pengenal kasar pemanggil; di belakang proxy dipakai alamat teratas. */
export function sidikPemanggil(request: Request): string {
  const teruskan = request.headers.get("x-forwarded-for");
  const ip = teruskan?.split(",")[0]?.trim();
  return ip || request.headers.get("x-real-ip") || "tanpa-ip";
}
