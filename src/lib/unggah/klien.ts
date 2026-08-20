"use client";

import { tipeBerkas } from "./berkas";
import { periksaGambar } from "./gambar";

/**
 * Alur unggah di sisi peramban: minta izin, kirim berkas langsung ke R2,
 * lalu minta server memasukkan job ke antrean.
 *
 * Berkasnya tidak melewati server aplikasi sama sekali — server hanya
 * menandatangani izin dan memeriksa hasilnya.
 */
export interface BerkasUnggah {
  /** Id yang sama dengan daftar di layar, supaya progresnya bisa dipetakan. */
  id: string;
  file: File;
}

export interface OpsiUnggah {
  onKemajuan?: (id: string, persen: number) => void;
  signal?: AbortSignal;
}

interface IzinUnggah {
  key: string;
  nama: string;
  url: string;
}

export async function unggahBerkas(
  daftar: BerkasUnggah[],
  opsi: OpsiUnggah = {},
): Promise<{ token: string }> {
  const res = await fetch("/api/unggah", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      berkas: daftar.map((b) => ({
        nama: b.file.name,
        contentType: tipeBerkas(b.file.name, b.file.type),
        ukuran: b.file.size,
      })),
    }),
    signal: opsi.signal,
  });
  const data: { token?: string; berkas?: IzinUnggah[]; error?: string } = await res
    .json()
    .catch(() => ({}));
  if (!res.ok || !data.token || !data.berkas) {
    throw new Error(data.error ?? "Gagal menyiapkan unggahan");
  }

  const izin = data.berkas;
  await Promise.all(daftar.map((b, i) => kirimSatu(b, izin[i]!.url, opsi)));

  const mulai = await fetch(`/api/unggah/${data.token}/mulai`, {
    method: "POST",
    signal: opsi.signal,
  });
  const hasil: { error?: string } = await mulai.json().catch(() => ({}));
  if (!mulai.ok) throw new Error(hasil.error ?? "Unggahan ditolak");

  return { token: data.token };
}

/**
 * XHR, bukan fetch: hanya XHR yang melaporkan kemajuan kiriman, dan mengunggah
 * foto lembar soal lewat jaringan seluler perlu terlihat berjalan.
 */
function kirimSatu(berkas: BerkasUnggah, url: string, opsi: OpsiUnggah): Promise<void> {
  return new Promise((selesai, gagal) => {
    const xhr = new XMLHttpRequest();
    const batalkan = () => xhr.abort();

    xhr.open("PUT", url);
    // Tipe harus sama persis dengan yang ditandatangani server.
    xhr.setRequestHeader("Content-Type", tipeBerkas(berkas.file.name, berkas.file.type));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        opsi.onKemajuan?.(berkas.id, Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      opsi.signal?.removeEventListener("abort", batalkan);
      if (xhr.status >= 200 && xhr.status < 300) {
        opsi.onKemajuan?.(berkas.id, 100);
        selesai();
      } else {
        gagal(new Error(`${berkas.file.name}: gagal diunggah`));
      }
    };
    xhr.onerror = () => {
      opsi.signal?.removeEventListener("abort", batalkan);
      gagal(new Error(`${berkas.file.name}: koneksi terputus`));
    };
    xhr.onabort = () => {
      opsi.signal?.removeEventListener("abort", batalkan);
      gagal(new DOMException("Unggahan dibatalkan", "AbortError"));
    };

    opsi.signal?.addEventListener("abort", batalkan);
    xhr.send(berkas.file);
  });
}

/**
 * Unggah satu gambar soal. Berbeda dari dokumen sumber, gambar soal tidak
 * bergabung dengan job pemrosesan — ia langsung menempel pada soalnya.
 */
export async function unggahGambar(file: File): Promise<{ kunci: string }> {
  const contentType = tipeBerkas(file.name, file.type);

  // Ditolak lebih awal supaya pengguna tidak menunggu perjalanan bolak-balik.
  const awal = periksaGambar(contentType, file.size);
  if (!awal.ok) throw new Error(awal.alasan);

  const res = await fetch("/api/gambar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType, ukuran: file.size }),
  });
  const data: { kunci?: string; url?: string; error?: string } = await res
    .json()
    .catch(() => ({}));
  if (!res.ok || !data.kunci || !data.url) {
    throw new Error(data.error ?? "Gagal menyiapkan unggahan gambar");
  }

  const put = await fetch(data.url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!put.ok) throw new Error("Gambar gagal diunggah");

  return { kunci: data.kunci };
}
