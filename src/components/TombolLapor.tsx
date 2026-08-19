"use client";

import { useState } from "react";
import { BenderaIcon } from "./Icons";
import { ALASAN_LAPORAN, type AlasanLaporan } from "@/lib/laporan";

/**
 * Pelaporan konten oleh siapa pun yang memegang tautan soal.
 *
 * Tidak butuh akun — laporannya masuk ke antrean tinjauan admin, dan pelapor
 * hanya diberi tahu bahwa laporannya tercatat.
 */
export function TombolLapor({ playSlug }: { playSlug: string }) {
  const [buka, setBuka] = useState(false);
  const [alasan, setAlasan] = useState<AlasanLaporan>(ALASAN_LAPORAN[0].id);
  const [catatan, setCatatan] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);

  if (selesai) {
    return (
      <p className="m-0 max-w-[520px] text-center text-[13px] font-semibold text-mint">
        Terima kasih. Laporanmu sudah masuk antrean tinjauan.
      </p>
    );
  }

  if (!buka) {
    return (
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-mint-dim transition-colors hover:text-mint-bright"
      >
        <BenderaIcon size={14} />
        Laporkan soal ini
      </button>
    );
  }

  return (
    <form
      className="flex w-full max-w-[520px] flex-col gap-3 rounded-[20px] bg-surface px-6 py-5 text-left"
      onSubmit={async (e) => {
        e.preventDefault();
        if (mengirim) return;
        setMengirim(true);
        setGagal(null);
        try {
          const res = await fetch(`/api/play/${playSlug}/laporan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alasan, catatan: catatan.trim() || undefined }),
          });
          const data: { error?: string } = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? "Gagal mengirim laporan");
          setSelesai(true);
        } catch (e: unknown) {
          setGagal(e instanceof Error ? e.message : "Gagal mengirim laporan");
          setMengirim(false);
        }
      }}
    >
      <div>
        <div className="font-display text-[16px] font-bold">Laporkan soal ini</div>
        <div className="text-[13px] text-ink-3">
          Laporanmu ditinjau admin. Tidak perlu akun, dan namamu tidak ikut terkirim.
        </div>
      </div>

      <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
        <legend className="mb-1 text-[11px] font-bold tracking-[.08em] text-dim">ALASAN</legend>
        {ALASAN_LAPORAN.map((a) => (
          <label key={a.id} className="flex items-center gap-2.5 text-[14px] text-ink-2">
            <input
              type="radio"
              name="alasan"
              value={a.id}
              checked={alasan === a.id}
              onChange={() => setAlasan(a.id)}
              className="h-4 w-4 accent-teal"
            />
            {a.label}
          </label>
        ))}
      </fieldset>

      <textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Keterangan tambahan (opsional)"
        aria-label="Keterangan tambahan"
        className="w-full resize-y rounded-xl border-[1.5px] border-line px-4 py-2.5 text-[14px] outline-none focus:border-teal"
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="submit"
          disabled={mengirim}
          className="rounded-full bg-teal px-5 py-2.5 font-display text-sm font-bold text-surface transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:bg-dim"
        >
          {mengirim ? "Mengirim…" : "Kirim laporan"}
        </button>
        <button
          type="button"
          onClick={() => setBuka(false)}
          className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink-3"
        >
          Batal
        </button>
        {gagal && <span className="text-[13px] font-semibold text-wrong-fg">{gagal}</span>}
      </div>
    </form>
  );
}
