"use client";

import { KELAS, MAPEL } from "@/lib/kategori";
import type { Visibility } from "@/lib/types";
import { Switch } from "./Switch";

interface Props {
  visibility: Visibility;
  kelas: string | null;
  mapel: string | null;
  onChange: (patch: {
    visibility?: Visibility;
    kelas?: string | null;
    mapel?: string | null;
  }) => void;
}

/**
 * Privat atau publik, beserta kategori katalognya. Soal publik hanya muncul di
 * katalog bila kelas & mata pelajarannya sudah dipilih — supaya filter berguna.
 */
export function KategoriPicker({ visibility, kelas, mapel, onChange }: Props) {
  const publik = visibility === "public";
  const belumLengkap = publik && (!kelas || !mapel);

  const select =
    "w-full rounded-xl border-[1.5px] border-line bg-surface px-4 py-2.5 text-[15px] outline-none focus:border-teal";

  return (
    <div className="flex flex-col gap-3.5 border-t border-line-soft pt-5">
      <div className="flex items-center gap-3.5">
        <Switch
          on={publik}
          onToggle={() => onChange({ visibility: publik ? "private" : "public" })}
          label="Tampilkan di kumpulan soal publik"
        />
        <div>
          <div className="text-[14.5px] font-semibold">Tampilkan di kumpulan soal</div>
          <div className="text-[12.5px] text-dim">
            {publik
              ? "Siapa pun bisa menemukan soal ini di halaman Kumpulan Soal."
              : "Privat — hanya bisa dibuka lewat tautan yang kamu bagikan."}
          </div>
        </div>
      </div>

      {publik && (
        <div className="grid animate-popin-fast gap-2.5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[.08em] text-dim">KELAS</span>
            <select
              value={kelas ?? ""}
              onChange={(e) => onChange({ kelas: e.target.value || null })}
              className={select}
            >
              <option value="">Pilih kelas…</option>
              {KELAS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[.08em] text-dim">
              MATA PELAJARAN
            </span>
            <select
              value={mapel ?? ""}
              onChange={(e) => onChange({ mapel: e.target.value || null })}
              className={select}
            >
              <option value="">Pilih mata pelajaran…</option>
              {MAPEL.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {belumLengkap && (
        <p className="m-0 rounded-xl bg-warn-bg px-4 py-2.5 text-[13px] font-semibold text-warn-fg">
          Pilih kelas dan mata pelajaran agar soal ini mudah ditemukan lewat filter.
        </p>
      )}
    </div>
  );
}
