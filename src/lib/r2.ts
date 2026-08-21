import "server-only";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Penyimpanan berkas di Cloudflare R2 (S3-compatible).
 *
 * Berkas diunggah peramban langsung ke R2 lewat URL bertanda tangan, jadi
 * dokumen tidak pernah melewati server aplikasi. Yang dilakukan server hanya
 * menandatangani izin unggah lalu memastikan objeknya benar-benar ada.
 */
const UMUR_TAUTAN_DETIK = 10 * 60;

interface Konfigurasi {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function konfigurasi(): Konfigurasi | null {
  const bucket = process.env.R2_BUCKET?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const akun = process.env.R2_ACCOUNT_ID?.trim();

  // R2_ENDPOINT boleh diisi untuk jurisdiksi khusus atau server tiruan saat uji.
  const endpoint =
    process.env.R2_ENDPOINT?.trim() ||
    (akun ? `https://${akun}.r2.cloudflarestorage.com` : "");

  if (!bucket || !accessKeyId || !secretAccessKey || !endpoint) return null;
  return { endpoint, bucket, accessKeyId, secretAccessKey };
}

export function r2Dikonfigurasi(): boolean {
  return konfigurasi() !== null;
}

let tersimpan: { tanda: string; klien: S3Client; bucket: string } | null = null;

function klienR2(): { klien: S3Client; bucket: string } {
  const konfig = konfigurasi();
  if (!konfig) throw new Error("Penyimpanan R2 belum dikonfigurasi");

  const tanda = `${konfig.endpoint}|${konfig.bucket}|${konfig.accessKeyId}`;
  if (tersimpan?.tanda !== tanda) {
    tersimpan = {
      tanda,
      bucket: konfig.bucket,
      klien: new S3Client({
        region: "auto",
        endpoint: konfig.endpoint,
        // R2 memakai gaya path, bukan subdomain per bucket.
        forcePathStyle: true,
        credentials: {
          accessKeyId: konfig.accessKeyId,
          secretAccessKey: konfig.secretAccessKey,
        },
      }),
    };
  }
  return { klien: tersimpan.klien, bucket: tersimpan.bucket };
}

/** URL PUT bertanda tangan; peramban mengunggah langsung ke sana. */
export async function urlUnggah(key: string, contentType: string): Promise<string> {
  const { klien, bucket } = klienR2();
  return getSignedUrl(
    klien,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: UMUR_TAUTAN_DETIK },
  );
}

/** URL GET bertanda tangan; dipakai worker mengunduh berkas tanpa kunci R2. */
export async function urlUnduh(key: string, umurDetik = UMUR_TAUTAN_DETIK): Promise<string> {
  const { klien, bucket } = klienR2();
  return getSignedUrl(klien, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: umurDetik,
  });
}

export type Objek = { ada: false } | { ada: true; ukuran: number; contentType: string };

/**
 * Ukuran dan tipe dibaca ulang dari R2, tidak dipercayakan pada laporan klien:
 * yang menandatangani izin unggah tidak ikut melihat isi yang benar-benar dikirim.
 */
export async function periksaObjek(key: string): Promise<Objek> {
  const { klien, bucket } = klienR2();
  try {
    const hasil = await klien.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return {
      ada: true,
      ukuran: hasil.ContentLength ?? 0,
      contentType: hasil.ContentType ?? "application/octet-stream",
    };
  } catch {
    return { ada: false };
  }
}

export interface ObjekPenuh {
  isi: Uint8Array;
  contentType: string;
}

/** Isi beserta tipenya — dipakai rute penyaji gambar soal. */
export async function ambilObjekPenuh(key: string): Promise<ObjekPenuh | null> {
  const { klien, bucket } = klienR2();
  try {
    const hasil = await klien.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const isi = await hasil.Body?.transformToByteArray();
    if (!isi) return null;
    return { isi, contentType: hasil.ContentType ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function ambilObjek(key: string): Promise<Uint8Array | null> {
  const { klien, bucket } = klienR2();
  try {
    const hasil = await klien.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return (await hasil.Body?.transformToByteArray()) ?? null;
  } catch {
    return null;
  }
}

/** Dipakai membersihkan berkas job yang ditolak atau tidak jadi dipakai. */
export async function hapusObjek(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const { klien, bucket } = klienR2();
  await klien
    .send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    )
    .catch((e: unknown) => console.error("[r2] gagal menghapus objek:", e));
}
