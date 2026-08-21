"""Adapter provider VLM (blueprint §4, FR-006/007).

Sengaja berbicara dengan bentuk OpenAI-compatible: satu adapter menutupi OpenAI
maupun Ollama, karena keduanya menyediakan /v1/chat/completions. Model tidak
pernah di-hardcode — semuanya dari environment (blueprint §5).

Adapter tidak boleh menyentuh basis data atau R2. Ia hanya mengubah gambar
halaman menjadi struktur.
"""

from __future__ import annotations

import base64
import json
import os
import random
import time
from typing import Any

import requests

from galat import GalatBerkode, GalatPermanen, GalatSementara
from prompt import PAGE_SCHEMA, PROMPT_VERSION, SCHEMA_VERSION, SYSTEM_PROMPT, instruksi_halaman

PROVIDER = os.environ.get("QUESTION_LLM_PROVIDER", "openai-compatible")
BASE_URL = os.environ.get("QUESTION_LLM_BASE_URL", "http://localhost:11434/v1").rstrip("/")
API_KEY = os.environ.get("QUESTION_LLM_API_KEY", "")
MODEL = os.environ.get("QUESTION_LLM_MODEL", "")
TIMEOUT_MS = int(os.environ.get("QUESTION_LLM_TIMEOUT_MS", "120000"))
MAX_RETRIES = int(os.environ.get("QUESTION_LLM_MAX_RETRIES", "3"))
IMAGE_DETAIL = os.environ.get("QUESTION_LLM_IMAGE_DETAIL", "high")

EXTRACTOR_VERSION = "vlm-1"

# FR-020: yang sementara boleh diulang, yang permanen tidak. Membedakannya
# mencegah worker mengulang-ulang kunci API yang memang salah.
STATUS_BOLEH_ULANG = {408, 425, 429, 500, 502, 503, 504}


def _pesan(gambar: bytes, nomor: int, total: int, judul: str | None, perkiraan: int | None) -> list[dict[str, Any]]:
    b64 = base64.b64encode(gambar).decode("ascii")
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": instruksi_halaman(nomor, total, judul, perkiraan)},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/webp;base64,{b64}", "detail": IMAGE_DETAIL},
                },
            ],
        },
    ]


def _minta(badan: dict[str, Any]) -> dict[str, Any]:
    kepala = {"Content-Type": "application/json"}
    if API_KEY:
        kepala["Authorization"] = f"Bearer {API_KEY}"

    try:
        res = requests.post(
            f"{BASE_URL}/chat/completions",
            json=badan,
            headers=kepala,
            timeout=TIMEOUT_MS / 1000,
        )
    except requests.Timeout as e:
        raise GalatSementara(f"model tidak merespons dalam {TIMEOUT_MS} ms", "MODEL_TIDAK_MERESPONS") from e
    except requests.RequestException as e:
        raise GalatSementara(str(e), "MODEL_TIDAK_MERESPONS") from e

    if res.status_code in (401, 403):
        raise GalatPermanen("kunci API ditolak penyedia", "MODEL_DITOLAK")
    if res.status_code in STATUS_BOLEH_ULANG:
        raise GalatSementara(f"penyedia membalas {res.status_code}", "MODEL_TIDAK_MERESPONS")
    if not res.ok:
        raise GalatPermanen(f"penyedia membalas {res.status_code}: {res.text[:200]}", "MODEL_DITOLAK")
    return res.json()


def ekstrak_halaman(
    gambar: bytes,
    nomor: int,
    total: int,
    judul: str | None = None,
    perkiraan: int | None = None,
) -> dict[str, Any]:
    """Satu halaman → struktur PageExtraction. Melempar bila tetap gagal."""
    if not MODEL:
        raise GalatPermanen("QUESTION_LLM_MODEL belum diisi", "MODEL_BELUM_DIATUR")

    badan = {
        "model": MODEL,
        "messages": _pesan(gambar, nomor, total, judul, perkiraan),
        "temperature": 0,
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "page_extraction", "strict": True, "schema": PAGE_SCHEMA},
        },
    }

    galat_terakhir: Exception | None = None
    kode_terakhir = "TIDAK_DIKETAHUI"
    for percobaan in range(MAX_RETRIES):
        try:
            balas = _minta(badan)
            isi = balas["choices"][0]["message"]["content"]
            hasil = json.loads(isi)
            # Nomor halaman dari model kadang meleset; yang benar kita sendiri
            # yang tahu, jadi ditimpa di sini.
            hasil["page"] = nomor
            return hasil
        except GalatPermanen:
            raise
        except (GalatSementara, json.JSONDecodeError, KeyError, IndexError) as e:
            galat_terakhir = e
            kode_terakhir = (
                e.kode if isinstance(e, GalatBerkode) else "HASIL_TIDAK_SESUAI_SKEMA"
            )
            if percobaan == MAX_RETRIES - 1:
                break
            # Backoff eksponensial dengan jitter (FR-020): tanpa jitter,
            # beberapa worker yang gagal bersamaan akan mengulang bersamaan pula.
            jeda = (2 ** percobaan) + random.random()
            time.sleep(jeda)

    raise GalatSementara(f"gagal setelah {MAX_RETRIES} percobaan: {galat_terakhir}", kode_terakhir)


def provenance() -> dict[str, str]:
    return {
        "provider": PROVIDER,
        "model": MODEL,
        "promptVersion": PROMPT_VERSION,
        "schemaVersion": SCHEMA_VERSION,
        "extractorVersion": EXTRACTOR_VERSION,
    }
