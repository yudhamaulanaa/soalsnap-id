"use client";

import { useRef, useState } from "react";
import { GambarSoal } from "./GambarSoal";
import { SilangIcon } from "./Icons";
import { MAX_GAMBAR_MB } from "@/lib/unggah/gambar";
import { unggahGambar } from "@/lib/unggah/klien";

interface Props {
  gambar?: string;
  gambarAlt?: string;
  nomor: number;
  onChange: (patch: { gambar?: string; gambarAlt?: string }) => void;
}

/** Menambah, mengganti, atau melepas gambar satu soal di layar Review. */
export function EditorGambar({ gambar, gambarAlt, nomor, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [mengunggah, setMengunggah] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);

  async function pilih(file: File | undefined) {
    if (!file || mengunggah) return;
    setMengunggah(true);
    setGagal(null);
    try {
      const { kunci } = await unggahGambar(file);
      onChange({ gambar: kunci });
    } catch (e: unknown) {
      setGagal(e instanceof Error ? e.message : "Gambar gagal diunggah");
    } finally {
      setMengunggah(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => pilih(e.target.files?.[0])}
        className="hidden"
      />

      {gambar && (
        <div className="flex flex-col gap-2">
          <GambarSoal kunci={gambar} alt={gambarAlt} className="max-h-[220px]" />
          <input
            value={gambarAlt ?? ""}
            onChange={(e) => onChange({ gambarAlt: e.target.value })}
            placeholder="Keterangan gambar (dibaca pembaca layar)"
            aria-label={`Keterangan gambar soal nomor ${nomor}`}
            className="w-full rounded-[10px] border-[1.5px] border-line px-3 py-2 text-[13.5px] outline-none focus:border-teal"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={mengunggah}
          onClick={() => input.current?.click()}
          className="rounded-lg border border-line px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-2 transition-colors hover:border-teal hover:text-teal disabled:opacity-60"
        >
          {mengunggah ? "Mengunggah…" : gambar ? "Ganti gambar" : "Tambah gambar"}
        </button>

        {gambar && (
          <button
            type="button"
            disabled={mengunggah}
            onClick={() => onChange({ gambar: undefined, gambarAlt: undefined })}
            aria-label={`Lepas gambar soal nomor ${nomor}`}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-dim transition-colors hover:bg-wrong-bg hover:text-wrong-fg"
          >
            <SilangIcon size={13} />
            Lepas
          </button>
        )}

        {!gambar && !gagal && (
          <span className="text-[12px] text-dim">JPG, PNG, atau WebP · maks {MAX_GAMBAR_MB} MB</span>
        )}
        {gagal && <span className="text-[12px] font-semibold text-wrong-fg">{gagal}</span>}
      </div>
    </div>
  );
}
