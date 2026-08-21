"""Worker ekstraksi soal berbasis VLM.

Jalur utama sesuai blueprint: halaman dipahami sebagai dokumen visual oleh
model, lalu worker yang mengerjakan bagian mekanisnya — render, potong, unggah.
Model tidak pernah menggambar ulang apa pun; seluruh gambar soal adalah
potongan dari halaman aslinya (blueprint §2.1, FR-014).

Penggabungan fragmen antarhalaman sengaja tidak dikerjakan di sini melainkan di
aplikasi, karena bagian itu paling mudah salah dan paling perlu diuji.
"""

from __future__ import annotations

import io
import os
import sys
import time
from typing import Any

import requests

from galat import GalatBerkode, GalatPermanen, GalatSementara
from vlm import ekstrak_halaman, provenance

APP_URL = os.environ.get("APP_URL", "http://localhost:3000").rstrip("/")
WORKER_TOKEN = os.environ.get("WORKER_TOKEN", "")
WORKER_ID = os.environ.get("WORKER_ID", f"vlm-{os.getpid()}")
DPI = int(os.environ.get("QUESTION_RENDER_DPI", "180"))
KUALITAS = int(os.environ.get("QUESTION_PAGE_QUALITY", "90"))
KUALITAS_POTONG = int(os.environ.get("QUESTION_CROP_QUALITY", "92"))
PADDING = int(os.environ.get("QUESTION_CROP_PADDING_PX", "16"))
JEDA_KOSONG_DETIK = float(os.environ.get("JEDA_KOSONG_DETIK", "5"))
# Potongan yang lebih kecil dari ini hampir pasti salah deteksi, bukan gambar.
MIN_SISI_PX = int(os.environ.get("QUESTION_CROP_MIN_PX", "24"))

HEADERS = {"Authorization": f"Bearer {WORKER_TOKEN}"}


def _post(jalur: str, muatan: dict[str, Any], timeout: int = 60) -> dict[str, Any]:
    res = requests.post(f"{APP_URL}{jalur}", json=muatan, headers=HEADERS, timeout=timeout)
    res.raise_for_status()
    return res.json()


def halaman_gambar(isi: bytes, kind: str) -> list["Image.Image"]:  # noqa: F821
    """Berkas → daftar gambar halaman. PDF dirender, gambar dipakai apa adanya."""
    from PIL import Image, ImageOps

    if kind == "image":
        gambar = Image.open(io.BytesIO(isi))
        # Foto dari ponsel menyimpan orientasi di EXIF; tanpa ini halamannya
        # terbaca miring oleh model (FR-004).
        return [ImageOps.exif_transpose(gambar).convert("RGB")]

    if kind == "pdf":
        import pymupdf

        try:
            dokumen = pymupdf.open(stream=isi, filetype="pdf")
        except Exception as e:  # noqa: BLE001 - pymupdf melempar beragam tipe
            raise GalatPermanen(f"PDF tidak bisa dibuka: {e}", "BERKAS_RUSAK") from e
        # PDF berkata sandi tidak bisa dirender, dan menunggu sandi bukan
        # pekerjaan worker — kegagalannya dibuat eksplisit di halaman admin.
        if dokumen.needs_pass:
            dokumen.close()
            raise GalatPermanen("PDF ini dikunci kata sandi", "PDF_TERKUNCI")
        try:
            keluar = []
            for hal in dokumen:
                pix = hal.get_pixmap(dpi=DPI)
                keluar.append(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))
            return keluar
        finally:
            dokumen.close()

    raise GalatPermanen(f"jenis berkas {kind!r} belum didukung worker", "BERKAS_TIDAK_DIDUKUNG")


def ke_webp(gambar: "Image.Image", kualitas: int) -> bytes:  # noqa: F821
    penyangga = io.BytesIO()
    gambar.save(penyangga, format="WEBP", quality=kualitas)
    return penyangga.getvalue()


def kotak_piksel(bbox: dict[str, float], lebar: int, tinggi: int, padding: int) -> tuple[int, int, int, int] | None:
    """Bbox ternormalisasi → piksel, dengan padding yang tetap di dalam halaman."""
    try:
        x, y, w, h = float(bbox["x"]), float(bbox["y"]), float(bbox["width"]), float(bbox["height"])
    except (KeyError, TypeError, ValueError):
        return None
    if not (w > 0 and h > 0):
        return None

    kiri = max(0, round(x * lebar) - padding)
    atas = max(0, round(y * tinggi) - padding)
    kanan = min(lebar, round((x + w) * lebar) + padding)
    bawah = min(tinggi, round((y + h) * tinggi) + padding)
    if kanan - kiri < MIN_SISI_PX or bawah - atas < MIN_SISI_PX:
        return None
    return (kiri, atas, kanan, bawah)


def minta_izin(job_id: str, permintaan: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not permintaan:
        return []
    return _post(f"/api/worker/{job_id}/berkas", {"berkas": permintaan})["berkas"]


def unggah(url: str, isi: bytes, content_type: str) -> None:
    try:
        res = requests.put(url, data=isi, headers={"Content-Type": content_type}, timeout=120)
        res.raise_for_status()
    except requests.RequestException as e:
        raise GalatSementara(f"gagal mengunggah ke penyimpanan: {e}", "UNGGAH_GAGAL") from e


def potong_dan_unggah(
    job_id: str,
    upload_key: str,
    nomor: int,
    gambar: "Image.Image",  # noqa: F821
    ekstraksi: dict[str, Any],
) -> int:
    """Memotong tiap soal dan asetnya, lalu menanam kunci objeknya ke hasil."""
    lebar, tinggi = gambar.size
    permintaan: list[dict[str, Any]] = []
    rencana: list[tuple[dict[str, Any], str, tuple[int, int, int, int]]] = []

    for soal in ekstraksi.get("questions", []):
        temp = soal.get("temp_id") or f"q{len(rencana)}"

        kotak = kotak_piksel(soal.get("question_bbox", {}), lebar, tinggi, PADDING)
        if kotak:
            rencana.append((soal, "full_crop_key", kotak))
            permintaan.append(
                {
                    "jenis": "potongan",
                    "uploadKey": upload_key,
                    "halaman": nomor,
                    "tempId": temp,
                    "contentType": "image/webp",
                }
            )

        # Aset soal maupun aset pilihan diperlakukan sama: keduanya potongan
        # dari halaman yang sama.
        aset_semua = list(soal.get("assets", []))
        for opsi in soal.get("options", []):
            aset_semua.extend(opsi.get("assets", []))
        for aset in aset_semua:
            kotak_aset = kotak_piksel(aset.get("bbox", {}), lebar, tinggi, 0)
            if not kotak_aset:
                continue
            rencana.append((aset, "storage_key", kotak_aset))
            permintaan.append(
                {
                    "jenis": "potongan",
                    "uploadKey": upload_key,
                    "halaman": nomor,
                    "tempId": f"{temp}-{aset.get('temp_id', 'a')}",
                    "contentType": "image/webp",
                }
            )

    izin = minta_izin(job_id, permintaan)
    terunggah = 0
    for (sasaran, medan, kotak), satu in zip(rencana, izin):
        unggah(satu["url"], ke_webp(gambar.crop(kotak), KUALITAS_POTONG), "image/webp")
        sasaran[medan] = satu["kunci"]
        terunggah += 1
    return terunggah


def kerjakan(job: dict[str, Any]) -> None:
    job_id = job["id"]
    berkas = job["berkas"]
    total = max(1, sum(b.get("halaman", 1) for b in berkas))
    print(f"[{job_id}] {len(berkas)} berkas, kira-kira {total} halaman")

    sudah = 0
    for b in berkas:
        unduh = requests.get(b["url"], timeout=180)
        unduh.raise_for_status()

        for nomor, gambar in enumerate(halaman_gambar(unduh.content, b["kind"]), start=1):
            mulai = time.monotonic()
            webp = ke_webp(gambar, KUALITAS)

            # Render halaman diunggah lebih dulu: itu bahan audit, dan tetap
            # berguna walau ekstraksinya kemudian gagal.
            izin = minta_izin(
                job_id,
                [
                    {
                        "jenis": "halaman",
                        "uploadKey": b["key"],
                        "halaman": nomor,
                        "contentType": "image/webp",
                    }
                ],
            )
            unggah(izin[0]["url"], webp, "image/webp")

            ekstraksi = ekstrak_halaman(webp, nomor, total)
            potongan = potong_dan_unggah(job_id, b["key"], nomor, gambar, ekstraksi)

            _post(
                f"/api/worker/{job_id}/halaman",
                {
                    "uploadKey": b["key"],
                    "halaman": nomor,
                    "kunciRender": izin[0]["kunci"],
                    "lebar": gambar.size[0],
                    "tinggi": gambar.size[1],
                    "ekstraksi": ekstraksi,
                    "msProses": int((time.monotonic() - mulai) * 1000),
                },
            )

            sudah += 1
            _post(
                f"/api/worker/{job_id}/progres",
                {"progres": min(99, int(sudah / total * 100)), "tahap": f"Membaca halaman {sudah} dari {total}"},
            )
            print(f"  hal {nomor}: {len(ekstraksi.get('questions', []))} soal, {potongan} potongan")

    hasil = _post(f"/api/worker/{job_id}/selesai", provenance(), timeout=120)
    print(f"[{job_id}] selesai — {hasil['soal']} soal, {hasil['perluTinjau']} perlu ditinjau")


def gagalkan(job_id: str, alasan: str, kode: str) -> None:
    try:
        _post(f"/api/worker/{job_id}/hasil", {"galat": alasan[:500], "kodeGalat": kode}, timeout=30)
    except requests.RequestException as e:
        print(f"  [peringatan] gagal melaporkan kegagalan: {e}", file=sys.stderr)


def main() -> int:
    if not WORKER_TOKEN:
        print("WORKER_TOKEN belum diisi.", file=sys.stderr)
        return 1
    print(f"Worker {WORKER_ID} memantau {APP_URL}")

    while True:
        try:
            job = _post("/api/worker/klaim", {"workerId": WORKER_ID}, timeout=30).get("job")
        except requests.RequestException as e:
            print(f"[peringatan] gagal meminta job: {e}", file=sys.stderr)
            time.sleep(JEDA_KOSONG_DETIK)
            continue

        if not job:
            time.sleep(JEDA_KOSONG_DETIK)
            continue

        try:
            kerjakan(job)
        except GalatBerkode as e:
            print(f"[{job['id']}] gagal ({e.kode}): {e}", file=sys.stderr)
            gagalkan(job["id"], str(e), e.kode)
        except Exception as e:  # noqa: BLE001 - satu job gagal tidak boleh mematikan worker
            print(f"[{job['id']}] gagal: {e}", file=sys.stderr)
            gagalkan(job["id"], str(e), "TIDAK_DIKETAHUI")


if __name__ == "__main__":
    raise SystemExit(main())
