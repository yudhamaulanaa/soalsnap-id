"""Kegagalan berkode untuk kedua worker (PRD §15).

Pesannya boleh berubah kapan saja; kodenya yang menjadi pegangan program dan
statistik, sehingga catatan kegagalan tidak rusak hanya karena kalimatnya
diperbaiki. Daftar kode yang diterima aplikasi ada di `src/lib/validasi.ts`.
"""

from __future__ import annotations


class GalatBerkode(Exception):
    kode = "TIDAK_DIKETAHUI"

    def __init__(self, pesan: str, kode: str | None = None) -> None:
        super().__init__(pesan)
        if kode:
            self.kode = kode


class GalatPermanen(GalatBerkode):
    """Kegagalan yang tidak akan membaik dengan mengulang."""


class GalatSementara(GalatBerkode):
    """Kegagalan yang layak dicoba lagi."""
