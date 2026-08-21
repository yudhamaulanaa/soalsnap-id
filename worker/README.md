# Worker pembaca dokumen

Mengambil dokumen dari antrean, mengubahnya menjadi soal terstruktur, lalu
mengembalikan hasilnya ke aplikasi.

Ada dua worker, dan keduanya memakai antrean serta endpoint klaim yang sama:

| Berkas | Peran | Keluaran |
|---|---|---|
| `vlm_worker.py` | **Jalur utama.** Halaman dipahami sebagai dokumen visual oleh model multimodal. | Soal terstruktur + potongan gambar di R2 |
| `ocr_worker.py` | **Cadangan.** PaddleOCR, untuk dokumen pindaian yang tidak terbaca model. | Teks mentah per halaman |

Jalankan salah satu, bukan keduanya untuk satu antrean yang sama — job yang sudah
diklaim satu worker tidak akan diambil worker lain.

Worker berjalan sebagai proses terpisah, boleh di mesin lain. Ia tidak diberi
kredensial basis data maupun kunci R2: satu `WORKER_TOKEN` adalah seluruh
wewenangnya. Berkas diunduh dan potongan gambar diunggah lewat tautan bertanda
tangan berumur pendek yang diberikan server, dan **kunci objeknya ditentukan
server**, bukan worker — kunci karangan worker tidak akan pernah dipakai.

## Menjalankan jalur utama (VLM)

```bash
cd worker
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export APP_URL="https://soalsnap.web.id"
export WORKER_TOKEN="…"                 # sama dengan WORKER_TOKEN di server
export WORKER_ID="vlm-1"                # bebas, muncul di halaman admin

export QUESTION_LLM_BASE_URL="http://localhost:11434/v1"
export QUESTION_LLM_MODEL="qwen2.5vl:7b"
python vlm_worker.py
```

Jalankan beberapa proses sekaligus untuk memproses paralel. Klaim job di server
memakai bandingkan-lalu-tulis, jadi dua worker tidak akan mengerjakan job yang
sama meski meminta bersamaan.

### Apa yang dikerjakannya per halaman

1. render halaman (PDF lewat PyMuPDF; gambar diluruskan menurut EXIF);
2. unggah render ke R2 sebagai bahan audit — dilakukan lebih dulu supaya tetap
   ada walau ekstraksinya kemudian gagal;
3. kirim render ke model bersama JSON Schema, minta struktur soalnya;
4. potong soal utuh dan tiap asetnya dari halaman **asli**, lalu unggah;
5. simpan hasil halaman itu ke server (checkpoint per halaman).

Penggabungan fragmen antarhalaman tidak dikerjakan di worker melainkan di
aplikasi, saat `selesai` dipanggil.

Model **tidak pernah** menggambar ulang gambar soal: seluruh gambar adalah
potongan dari halaman aslinya. Model juga tidak diminta menjawab soal, dan
kunci jawaban hanya diambil bila halamannya sendiri mencantumkannya.

## Menjalankan jalur cadangan (OCR)

```bash
pip install -r requirements-ocr.txt   # paddlepaddle + paddleocr, ratusan megabita
export WORKER_ID="ocr-1"
python ocr_worker.py
```

Bobot model PaddleOCR diunduh saat pertama kali dijalankan, jadi halaman pertama
terasa menunggu sebentar. Model dimuat sekali saat worker menyala, bukan tiap job.

## Pengaturan

### Umum

| Variabel | Bawaan | Kegunaan |
|---|---|---|
| `APP_URL` | `http://localhost:3000` | Alamat aplikasi |
| `WORKER_TOKEN` | — | Wajib; tanpa ini worker berhenti |
| `WORKER_ID` | `vlm-<pid>` / `worker-<pid>` | Penanda di halaman admin |
| `JEDA_KOSONG_DETIK` | `5` | Jeda saat antrean kosong |

### Penyedia model (`vlm_worker.py`)

Adapternya berbicara dalam bentuk OpenAI-compatible, jadi satu konfigurasi ini
menutupi OpenAI, Ollama, maupun endpoint lain yang menyediakan
`/v1/chat/completions` dengan masukan gambar dan keluaran JSON Schema.

| Variabel | Bawaan | Kegunaan |
|---|---|---|
| `QUESTION_LLM_PROVIDER` | `openai-compatible` | Dicatat sebagai provenance hasil |
| `QUESTION_LLM_BASE_URL` | `http://localhost:11434/v1` | Ollama lokal |
| `QUESTION_LLM_API_KEY` | kosong | Kosongkan untuk Ollama; isi untuk OpenAI |
| `QUESTION_LLM_MODEL` | — | Wajib; tidak ada model bawaan yang di-hardcode |
| `QUESTION_LLM_TIMEOUT_MS` | `120000` | Batas tunggu satu halaman |
| `QUESTION_LLM_MAX_RETRIES` | `3` | Percobaan ulang saat gagal sementara |
| `QUESTION_LLM_IMAGE_DETAIL` | `high` | Diteruskan ke penyedia yang mendukungnya |

Kegagalan dibedakan: `401/403` tidak diulang karena kuncinya memang salah,
sedangkan `429` dan `5xx` diulang dengan jeda menaik berjitter.

### Render dan potongan (`vlm_worker.py`)

| Variabel | Bawaan | Kegunaan |
|---|---|---|
| `QUESTION_RENDER_DPI` | `180` | Resolusi rasterisasi PDF |
| `QUESTION_PAGE_QUALITY` | `90` | Kualitas WebP render halaman |
| `QUESTION_CROP_QUALITY` | `92` | Kualitas WebP potongan soal |
| `QUESTION_CROP_PADDING_PX` | `16` | Sisa ruang di sekeliling potongan soal utuh |
| `QUESTION_CROP_MIN_PX` | `24` | Potongan lebih kecil dari ini dianggap salah deteksi |

### OCR (`ocr_worker.py`)

| Variabel | Bawaan | Kegunaan |
|---|---|---|
| `OCR_DPI` | `200` | Resolusi rasterisasi PDF; naikkan kalau tulisannya kecil |

## Yang belum ditangani

- **Berkas `.docx`** belum didukung; job yang memuatnya ditandai gagal dengan
  alasan yang terbaca di halaman admin, bukan dilewati diam-diam.
- **Metadata penggunaan token** dari penyedia belum dicatat.
