"""Worker pembaca dokumen SoalSnap.

Mengambil job dari antrean, menjalankan OCR, lalu mengembalikan hasil mentahnya.
Worker sengaja tidak memegang kredensial basis data maupun kunci R2: satu token
adalah seluruh wewenangnya, dan berkas diunduh lewat tautan bertanda tangan
berumur pendek yang diberikan server.

Belum ada penyusunan soal di sini — itu langkah berikutnya. Yang dikirim balik
adalah teks apa adanya beserta konfidensi tiap barisnya.

Jalankan beberapa proses sekaligus untuk memproses paralel; klaim job di server
memakai bandingkan-lalu-tulis, jadi dua worker tidak akan mengerjakan job sama.
"""

from __future__ import annotations

import io
import os
import sys
import time
import tempfile
from typing import Any

import requests

APP_URL = os.environ.get("APP_URL", "http://localhost:3000").rstrip("/")
WORKER_TOKEN = os.environ.get("WORKER_TOKEN", "")
WORKER_ID = os.environ.get("WORKER_ID", f"worker-{os.getpid()}")
# Lembar soal hasil pindai umumnya terbaca baik pada 200 DPI; naikkan kalau
# tulisannya kecil, dengan konsekuensi OCR menjadi lebih lambat.
DPI = int(os.environ.get("OCR_DPI", "200"))
JEDA_KOSONG_DETIK = float(os.environ.get("JEDA_KOSONG_DETIK", "5"))

HEADERS = {"Authorization": f"Bearer {WORKER_TOKEN}"}


def buat_ocr():
    """Model dimuat sekali saja — memuat ulang tiap job jauh lebih lambat."""
    from paddleocr import PaddleOCR

    return PaddleOCR(
        lang="id",
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
    )


def halaman_dari_berkas(isi: bytes, kind: str) -> list[bytes]:
    """Mengubah satu berkas menjadi daftar gambar halaman (PNG)."""
    if kind == "image":
        return [isi]

    if kind == "pdf":
        import pymupdf

        dokumen = pymupdf.open(stream=isi, filetype="pdf")
        try:
            return [h.get_pixmap(dpi=DPI).tobytes("png") for h in dokumen]
        finally:
            dokumen.close()

    raise ValueError(f"jenis berkas {kind!r} belum didukung worker")


def baca_halaman(ocr, gambar: bytes) -> dict[str, Any]:
    """Menjalankan OCR pada satu gambar halaman."""
    mulai = time.monotonic()
    with tempfile.NamedTemporaryFile(suffix=".png", delete=True) as berkas:
        berkas.write(gambar)
        berkas.flush()
        hasil = ocr.predict(berkas.name)

    baris: list[dict[str, Any]] = []
    for res in hasil:
        teks_semua = res["rec_texts"]
        skor_semua = res["rec_scores"]
        kotak_semua = res["rec_boxes"]
        for i, teks in enumerate(teks_semua):
            kotak = kotak_semua[i]
            baris.append(
                {
                    "teks": teks,
                    "konfidensi": round(float(skor_semua[i]) * 100, 2),
                    "kotak": [float(n) for n in (kotak.tolist() if hasattr(kotak, "tolist") else kotak)],
                }
            )

    # Urutan deteksi tidak dijamin urut baca; diurutkan atas-ke-bawah lalu
    # kiri-ke-kanan supaya teksnya masuk akal dibaca manusia maupun model.
    baris.sort(key=lambda b: (round(b["kotak"][1] / 10), b["kotak"][0]))

    konfidensi = [b["konfidensi"] for b in baris] or [0.0]
    return {
        "teks": "\n".join(b["teks"] for b in baris),
        "baris": baris,
        "konfidensiMin": int(min(konfidensi)),
        "konfidensiRata": int(sum(konfidensi) / len(konfidensi)),
        "msProses": int((time.monotonic() - mulai) * 1000),
    }


def lapor_progres(job_id: str, progres: int, tahap: str) -> None:
    try:
        requests.post(
            f"{APP_URL}/api/worker/{job_id}/progres",
            json={"progres": progres, "tahap": tahap},
            headers=HEADERS,
            timeout=15,
        )
    except requests.RequestException as e:
        # Kabar progres tidak sepenting hasilnya; kegagalannya tidak menghentikan job.
        print(f"  [peringatan] gagal mengabari progres: {e}", file=sys.stderr)


def kerjakan(ocr, job: dict[str, Any]) -> None:
    job_id = job["id"]
    berkas = job["berkas"]
    total_halaman = max(1, sum(b.get("halaman", 1) for b in berkas))
    print(f"[{job_id}] {len(berkas)} berkas, kira-kira {total_halaman} halaman")

    hasil_halaman: list[dict[str, Any]] = []
    sudah = 0

    for b in berkas:
        unduh = requests.get(b["url"], timeout=120)
        unduh.raise_for_status()
        gambar_halaman = halaman_dari_berkas(unduh.content, b["kind"])

        for nomor, gambar in enumerate(gambar_halaman, start=1):
            data = baca_halaman(ocr, gambar)
            data["uploadKey"] = b["key"]
            data["halaman"] = nomor
            hasil_halaman.append(data)

            sudah += 1
            lapor_progres(
                job_id,
                min(99, int(sudah / total_halaman * 100)),
                f"Membaca halaman {sudah} dari {total_halaman}",
            )
            print(f"  {b['nama']} hal {nomor}: {len(data['baris'])} baris, "
                  f"konfidensi min {data['konfidensiMin']}%")

    balas = requests.post(
        f"{APP_URL}/api/worker/{job_id}/hasil",
        json={"halaman": hasil_halaman},
        headers=HEADERS,
        timeout=120,
    )
    balas.raise_for_status()
    print(f"[{job_id}] selesai — {len(hasil_halaman)} halaman terkirim")


def laporkan_gagal(job_id: str, alasan: str) -> None:
    try:
        requests.post(
            f"{APP_URL}/api/worker/{job_id}/hasil",
            json={"galat": alasan},
            headers=HEADERS,
            timeout=30,
        )
    except requests.RequestException as e:
        print(f"  [peringatan] gagal melaporkan kegagalan: {e}", file=sys.stderr)


def main() -> int:
    if not WORKER_TOKEN:
        print("WORKER_TOKEN belum diisi.", file=sys.stderr)
        return 1

    print(f"Worker {WORKER_ID} menyalakan model OCR…")
    ocr = buat_ocr()
    print(f"Siap. Memantau {APP_URL}")

    while True:
        try:
            balas = requests.post(
                f"{APP_URL}/api/worker/klaim",
                json={"workerId": WORKER_ID},
                headers=HEADERS,
                timeout=30,
            )
            balas.raise_for_status()
            job = balas.json().get("job")
        except requests.RequestException as e:
            print(f"[peringatan] gagal meminta job: {e}", file=sys.stderr)
            time.sleep(JEDA_KOSONG_DETIK)
            continue

        if not job:
            time.sleep(JEDA_KOSONG_DETIK)
            continue

        try:
            kerjakan(ocr, job)
        except Exception as e:  # noqa: BLE001 - job gagal tidak boleh mematikan worker
            print(f"[{job['id']}] gagal: {e}", file=sys.stderr)
            laporkan_gagal(job["id"], str(e)[:500])


if __name__ == "__main__":
    raise SystemExit(main())
