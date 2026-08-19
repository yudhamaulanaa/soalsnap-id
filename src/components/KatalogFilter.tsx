"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { JENJANG, MAPEL } from "@/lib/kategori";

interface Props {
  kelas?: string;
  mapel?: string;
  q?: string;
}

/** Filter katalog: pencarian judul, kelas (dikelompokkan per jenjang), dan mapel. */
export function KatalogFilter({ kelas, mapel, q }: Props) {
  const router = useRouter();
  const [cari, setCari] = useState(q ?? "");

  function terapkan(patch: { kelas?: string; mapel?: string; q?: string }) {
    const p = new URLSearchParams();
    const next = { kelas, mapel, q: cari, ...patch };
    if (next.kelas) p.set("kelas", next.kelas);
    if (next.mapel) p.set("mapel", next.mapel);
    if (next.q) p.set("q", next.q);
    const s = p.toString();
    router.push(s ? `/kumpulan?${s}` : "/kumpulan");
  }

  const chip = (aktif: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
      aktif
        ? "border-teal bg-teal text-surface"
        : "border-line bg-surface text-ink-2 hover:border-line-hover"
    }`;

  return (
    <div className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          terapkan({ q: cari });
        }}
        className="flex flex-wrap gap-2.5"
      >
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari judul soal…"
          aria-label="Cari judul soal"
          className="min-w-[220px] flex-1 rounded-xl border-[1.5px] border-line px-4 py-2.5 text-[15px] outline-none focus:border-teal"
        />
        <button
          type="submit"
          className="rounded-xl bg-teal px-6 py-2.5 font-display text-[15px] font-bold text-surface transition-colors hover:bg-teal-dark"
        >
          Cari
        </button>
      </form>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold tracking-[.08em] text-dim">KELAS</span>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => terapkan({ kelas: undefined })} className={chip(!kelas)}>
            Semua
          </button>
          {JENJANG.map((j) => (
            <span key={j.label} className="flex flex-wrap items-center gap-2">
              <span className="ml-1 text-[11px] font-bold text-dim">{j.label}</span>
              {j.kelas.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => terapkan({ kelas: kelas === k ? undefined : k })}
                  className={chip(kelas === k)}
                >
                  {k.replace("Kelas ", "")}
                </button>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold tracking-[.08em] text-dim">MATA PELAJARAN</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => terapkan({ mapel: undefined })} className={chip(!mapel)}>
            Semua
          </button>
          {MAPEL.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => terapkan({ mapel: mapel === m ? undefined : m })}
              className={chip(mapel === m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
