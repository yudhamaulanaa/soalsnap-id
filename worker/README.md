# Worker pembaca dokumen

Mengambil dokumen dari antrean, menjalankan OCR, lalu mengembalikan teks
mentahnya. **Belum ada penyusunan soal di sini** — itu langkah berikutnya.

Worker berjalan sebagai proses terpisah, boleh di mesin lain. Ia tidak diberi
kredensial basis data maupun kunci R2: satu `WORKER_TOKEN` adalah seluruh
wewenangnya, dan berkas diunduh lewat tautan bertanda tangan berumur pendek
yang diberikan server.

## Menjalankan

```bash
cd worker
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export APP_URL="https://soalsnap.web.id"
export WORKER_TOKEN="…"          # sama dengan WORKER_TOKEN di server
export WORKER_ID="ocr-1"         # bebas, muncul di halaman admin
python ocr_worker.py
```

Jalankan beberapa proses sekaligus untuk memproses paralel. Klaim job di server
memakai bandingkan-lalu-tulis, jadi dua worker tidak akan mengerjakan job yang
sama meski meminta bersamaan.

## Pengaturan

| Variabel | Bawaan | Kegunaan |
|---|---|---|
| `APP_URL` | `http://localhost:3000` | Alamat aplikasi |
| `WORKER_TOKEN` | — | Wajib; tanpa ini worker berhenti |
| `WORKER_ID` | `worker-<pid>` | Penanda di halaman admin |
| `OCR_DPI` | `200` | Resolusi rasterisasi PDF; naikkan kalau tulisannya kecil |
| `JEDA_KOSONG_DETIK` | `5` | Jeda saat antrean kosong |

Model dimuat sekali saat worker menyala, bukan tiap job — memuat ulang jauh
lebih lambat. Halaman pertama karenanya terasa menunggu sebentar saat pertama
kali dijalankan, karena bobot modelnya diunduh dulu.

## Yang belum ditangani

- **Berkas `.docx`** belum didukung; job yang memuatnya ditandai gagal dengan
  alasan yang terbaca di halaman admin, bukan dilewati diam-diam.
- **Analisis tata letak** (PP-StructureV3) belum dipakai, jadi gambar di dalam
  dokumen belum dipotong menjadi gambar soal.
- **Penyusunan soal** dari teks OCR belum ada.
