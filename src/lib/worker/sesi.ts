import "server-only";
import { tokenCocok } from "./token";

/**
 * Izin worker pemroses dokumen.
 *
 * Worker berjalan di mesin lain — biasanya yang punya GPU — dan sengaja tidak
 * diberi kredensial basis data maupun kunci R2. Satu token ini seluruh
 * wewenangnya: mengambil job dari antrean dan melaporkan hasilnya. Berkasnya
 * diunduh lewat URL bertanda tangan yang berumur pendek.
 */
function tokenWorker(): string | null {
  const token = process.env.WORKER_TOKEN?.trim();
  return token ? token : null;
}

export function workerDikonfigurasi(): boolean {
  return tokenWorker() !== null;
}

/** Menerima header `Authorization: Bearer <token>`. */
export function tokenWorkerSah(header: string | null): boolean {
  return tokenCocok(header, tokenWorker());
}
